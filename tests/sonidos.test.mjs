// Comprueba que cada sonido del juego tenga archivo en disco, entrada en
// project.c3proj y una referencia usable (hoja de eventos o regiones.js).
// Construct exporta en modo Folders: Play (by name) usa "carpeta/archivo".

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { REGIONES } from "../scripts/regiones.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROYECTO = JSON.parse(readFileSync(join(RAIZ, "project.c3proj"), "utf8"));

function listarArchivos(dir, ext = ".webm")
{
	const out = [];
	if (!existsSync(dir)) return out;
	for (const nombre of readdirSync(dir))
	{
		const ruta = join(dir, nombre);
		if (statSync(ruta).isDirectory()) out.push(...listarArchivos(ruta, ext));
		else if (nombre.endsWith(ext)) out.push(relative(RAIZ, ruta).replaceAll("\\", "/"));
	}
	return out.sort();
}

function recogerC3(nodo, prefijo)
{
	const rutas = [];
	for (const item of nodo.items ?? [])
		if (item.name) rutas.push(`${prefijo}${item.name}`);
	for (const sub of nodo.subfolders ?? [])
		rutas.push(...recogerC3(sub, `${prefijo}${sub.name}/`));
	return rutas;
}

function recogerJson(dir)
{
	const out = [];
	if (!existsSync(dir)) return out;
	for (const nombre of readdirSync(dir))
	{
		const ruta = join(dir, nombre);
		if (statSync(ruta).isDirectory()) out.push(...recogerJson(ruta));
		else if (nombre.endsWith(".json")) out.push(ruta);
	}
	return out;
}

function walk(nodo, fn)
{
	if (Array.isArray(nodo)) return nodo.forEach(hijo => walk(hijo, fn));
	if (!nodo || typeof nodo !== "object") return;
	fn(nodo);
	for (const valor of Object.values(nodo)) walk(valor, fn);
}

function literalAudio(expresion)
{
	const m = String(expresion ?? "").match(/^"([^"]+)"$/);
	return m ? m[1] : null;
}

function aliasSonidosFichas()
{
	const src = readFileSync(join(RAIZ, "scripts/fichas.js"), "utf8");
	const bloque = src.match(/const SONIDOS = \{([^}]*)\}/);
	assert.ok(bloque, "fichas.js tiene que definir const SONIDOS");
	const alias = {};
	for (const [, clave, valor] of bloque[1].matchAll(/(\w+)\s*:\s*"([^"]+)"/g))
		alias[clave] = valor;
	return alias;
}

function sfxAnimal(region, animal, alias)
{
	return `sprite_sfx_${alias[animal] ?? animal}`;
}

const enDisco = {
	sounds: listarArchivos(join(RAIZ, "sounds")),
	music: listarArchivos(join(RAIZ, "music"))
};
const enProyecto = {
	sounds: recogerC3(PROYECTO.rootFileFolders.sound, "sounds/").sort(),
	music: recogerC3(PROYECTO.rootFileFolders.music, "music/").sort()
};

const plays = [];
for (const archivo of recogerJson(join(RAIZ, "eventSheets")))
{
	const hoja = JSON.parse(readFileSync(archivo, "utf8"));
	walk(hoja, nodo => {
		if (nodo.id === "play-by-name")
			plays.push({
				hoja: relative(RAIZ, archivo),
				folder: nodo.parameters?.folder,
				nombre: nodo.parameters?.["audio-file-name"],
				tag: nodo.parameters?.["tag-optional"]
			});
		if (nodo.id === "play" && nodo.parameters?.["audio-file"]?.path)
			plays.push({
				hoja: relative(RAIZ, archivo),
				folder: "music",
				nombre: `"${nodo.parameters["audio-file"].path}"`,
				tag: nodo.parameters?.["tag-optional"]
			});
	});
}

test("el export de Construct usa carpetas (Play by name necesita carpeta/archivo)", () => {
	assert.equal(PROYECTO.properties.exportFileStructure, "folders");
});

test("cada .webm de sounds/ y music/ está registrado en project.c3proj", () => {
	assert.deepEqual(enDisco.sounds, enProyecto.sounds);
	assert.deepEqual(enDisco.music, enProyecto.music);
});

test("Play (by name) apunta a Sounds y usa carpeta/archivo", () => {
	const porNombre = plays.filter(p => p.folder !== "music");
	assert.ok(porNombre.length > 0, "tiene que haber al menos un Play (by name)");
	for (const play of porNombre)
	{
		assert.equal(play.folder, "sounds", `${play.hoja}: folder tiene que ser sounds, no ${play.folder}`);
		const literal = literalAudio(play.nombre);
		if (literal)
			assert.ok(literal.includes("/"), `${play.hoja}: "${literal}" tiene que ser carpeta/archivo`);
		else
		{
			assert.ok(play.nombre.includes("SONIDO_CARPETA"), `${play.hoja}: expresión sin SONIDO_CARPETA`);
			assert.ok(play.nombre.includes("SONIDO"), `${play.hoja}: expresión sin SONIDO`);
			assert.ok(play.nombre.includes('"/"') || play.nombre.includes("'/'"), `${play.hoja}: la expresión tiene que unir con /`);
		}
	}
});

test("los Play literales existen en disco", () => {
	for (const play of plays)
	{
		const literal = literalAudio(play.nombre);
		if (!literal) continue;
		const raiz = play.folder === "music" ? "music" : "sounds";
		const ruta = `${raiz}/${literal}.webm`;
		assert.ok(enDisco[play.folder === "music" ? "music" : "sounds"].includes(ruta), `falta ${ruta} (desde ${play.hoja})`);
		assert.ok(enProyecto[play.folder === "music" ? "music" : "sounds"].includes(ruta), `${ruta} no está en project.c3proj`);
	}
});

test("cada animal de regiones.js tiene sprite_sfx en su carpeta", () => {
	const alias = aliasSonidosFichas();
	const faltan = [];
	for (const [region, info] of Object.entries(REGIONES))
	{
		assert.ok(info.sonidos, `${region}: falta sonidos`);
		for (const animal of info.animales ?? [])
		{
			const archivo = `sounds/${info.sonidos}/${sfxAnimal(region, animal, alias)}.webm`;
			if (!enDisco.sounds.includes(archivo)) faltan.push(archivo);
		}
	}
	assert.deepEqual(faltan, []);
});

test("el loop de mapa de cada región jugable existe", () => {
	const faltan = [];
	for (const [region, info] of Object.entries(REGIONES))
	{
		if (!existsSync(join(RAIZ, "layouts", `${info.layout}.json`))) continue;
		assert.ok(info.mapaLoop, `${region}: falta mapaLoop`);
		const archivo = `sounds/${info.sonidos}/${info.mapaLoop}.webm`;
		if (!enDisco.sounds.includes(archivo)) faltan.push(archivo);
	}
	assert.deepEqual(faltan, []);
});

test("LaberintoPuna reproduce el loop de regiones.puna", () => {
	const esperado = `${REGIONES.puna.sonidos}/${REGIONES.puna.mapaLoop}`;
	const play = plays.find(p => p.hoja.includes("LaberintoPuna") && String(p.tag ?? "").includes("musica"));
	assert.ok(play, "LaberintoPuna tiene que reproducir el loop con tag musica");
	assert.equal(literalAudio(play.nombre), esperado);
});

test("LaberintoChaco reproduce el loop de regiones.chaco", () => {
	const esperado = `${REGIONES.chaco.sonidos}/${REGIONES.chaco.mapaLoop}`;
	const play = plays.find(p => p.hoja.includes("LaberintoChaco") && String(p.tag ?? "").includes("musica"));
	assert.ok(play, "LaberintoChaco tiene que reproducir el loop con tag musica");
	assert.equal(literalAudio(play.nombre), esperado);
});

test("el golpe al cazador y el game over están cableados a comun/", () => {
	const golpe = plays.find(p => String(p.nombre).includes("golpe_cazador"));
	const gameover = plays.find(p => String(p.nombre).includes("GameOver"));
	assert.ok(golpe, "falta Play de golpe_cazador");
	assert.ok(gameover, "falta Play de GameOver");
	assert.equal(literalAudio(golpe.nombre), "comun/golpe_cazador");
	assert.equal(literalAudio(gameover.nombre), "comun/GameOver");
});

test("la historia y los títulos están en music/", () => {
	const historia = plays.find(p => String(p.nombre).includes("sprite_music_historia"));
	const endgame = plays.find(p => String(p.nombre).includes("sprite_music_endGame"));
	assert.ok(historia, "falta Play de sprite_music_historia");
	assert.ok(endgame, "falta Play de sprite_music_endGame");
	assert.equal(literalAudio(historia.nombre), "sprite_music_historia");
	assert.equal(literalAudio(endgame.nombre), "sprite_music_endGame");
});
