// Comprueba que cada sprite/animación tenga su PNG, que regiones.js no nombre
// animaciones inexistentes y que los layouts no apunten a objetos borrados.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { REGIONES } from "../scripts/regiones.js";
import { ORDEN_ALBUM } from "../scripts/album.js";
import {
	RAIZ, PROYECTO, listarArchivos, recogerNombres, recogerJson, walk,
	cargarObjetos, imagenDe
} from "./lib/c3.mjs";

const OBJETOS = cargarObjetos();
const PNG = new Set(listarArchivos(join(RAIZ, "images"), nombre => nombre.endsWith(".png")));
const PNG_SUELTOS_OK = new Set();
const CON_IMAGEN = new Set(["Sprite", "TiledBg", "Tilemap", "NinePatch"]);

function esperado()
{
	const rutas = new Set();
	for (const [nombre, obj] of OBJETOS)
	{
		if (!CON_IMAGEN.has(obj.plugin)) continue;
		if (obj.plugin === "Sprite")
			for (const f of obj.frames)
				rutas.add(imagenDe(nombre, obj.plugin, f.animacion, f.indice));
		else
			rutas.add(imagenDe(nombre, obj.plugin));
	}
	return rutas;
}

test("cada objeto de project.c3proj tiene su JSON y el nombre coincide", () => {
	const enProyecto = recogerNombres(PROYECTO.objectTypes);
	const faltan = enProyecto.filter(n => !OBJETOS.has(n));
	const deMas = [...OBJETOS.keys()].filter(n => !enProyecto.includes(n));
	assert.deepEqual(faltan, [], "objetos en c3proj sin archivo");
	assert.deepEqual(deMas, [], "JSON de objetos no listados en c3proj");
	for (const [nombre, obj] of OBJETOS)
		assert.ok(obj.archivo.endsWith(`/${nombre}.json`), `${nombre} está en ${obj.archivo}`);
});

test("cada frame de sprite/tilemap tiene su PNG y no hay PNG huérfanos", () => {
	const deben = esperado();
	const faltan = [...deben].filter(r => !PNG.has(r)).sort();
	const huerfanos = [...PNG].filter(r => !deben.has(r) && !PNG_SUELTOS_OK.has(r)).sort();
	assert.deepEqual(faltan, []);
	assert.deepEqual(huerfanos, []);
});

test("los layouts y las hojas solo usan objectTypes que existen", () => {
	const tipos = new Set(OBJETOS.keys());
	const mal = [];
	for (const archivo of recogerJson(join(RAIZ, "layouts")))
	{
		const layout = JSON.parse(readFileSync(archivo, "utf8"));
		const rel = relative(RAIZ, archivo);
		walk(layout, nodo => {
			if (nodo.type && typeof nodo.type === "string" && nodo.type !== "text" && !tipos.has(nodo.type))
				mal.push(`${rel}: instancia ${nodo.type}`);
		});
	}
	for (const archivo of recogerJson(join(RAIZ, "eventSheets")))
	{
		const hoja = JSON.parse(readFileSync(archivo, "utf8"));
		const rel = relative(RAIZ, archivo);
		walk(hoja, nodo => {
			if (nodo.objectClass && !["System", "Functions"].includes(nodo.objectClass) && !tipos.has(nodo.objectClass))
				mal.push(`${rel}: ${nodo.objectClass}`);
			const spawn = nodo.parameters?.object;
			if (typeof spawn === "string" && !tipos.has(spawn))
				mal.push(`${rel}: ${spawn}`);
		});
	}
	assert.deepEqual(mal, []);
});

test("sprites de regiones.js existen como objeto o animación", () => {
	const mal = [];
	for (const [region, info] of Object.entries(REGIONES))
	{
		const s = info.sprites ?? {};
		for (const [objeto, anim] of Object.entries(s.personajes ?? {}))
			if (!OBJETOS.get(objeto)?.animaciones.includes(anim))
				mal.push(`${region}: ${objeto} no tiene animación ${anim}`);
		if (s.huida && !OBJETOS.get("spriteHuida")?.animaciones.includes(s.huida))
			mal.push(`${region}: spriteHuida no tiene ${s.huida}`);
		if (s.fondo && !OBJETOS.has(s.fondo))
			mal.push(`${region}: falta objeto de fondo ${s.fondo}`);
		for (const anim of s.obstaculos ?? [])
			if (!OBJETOS.get("spriteRock")?.animaciones.includes(anim))
				mal.push(`${region}: spriteRock no tiene ${anim}`);
		for (const anim of s.enemigos ?? [])
			if (!OBJETOS.get("spriteCazador")?.animaciones.includes(anim))
				mal.push(`${region}: spriteCazador no tiene ${anim}`);
		for (const anim of s.danio ?? [])
			if (!OBJETOS.get("spriteSaguaro")?.animaciones.includes(anim))
				mal.push(`${region}: spriteSaguaro no tiene ${anim}`);
		for (const animal of info.animales ?? [])
		{
			const id = `${region}_${animal}`;
			if (!OBJETOS.get("spriteFichaAnimal")?.animaciones.includes(id))
				mal.push(`${region}: falta ficha ${id}`);
			if (!OBJETOS.get("spriteAlbumSlot")?.animaciones.includes(id))
				mal.push(`${region}: falta slot de álbum ${id}`);
		}
	}
	assert.deepEqual(mal, []);
});

test("ORDEN_ALBUM usa animaciones reales de spriteAlbumSlot", () => {
	const slots = OBJETOS.get("spriteAlbumSlot")?.animaciones ?? [];
	assert.ok(slots.includes("vacio"), "spriteAlbumSlot necesita animación vacio");
	assert.deepEqual(ORDEN_ALBUM.filter(id => id && !slots.includes(id)), []);
});

test("los layouts del proyecto existen en layouts/", () => {
	for (const nombre of recogerNombres(PROYECTO.layouts))
		assert.ok(existsSync(join(RAIZ, "layouts", `${nombre}.json`)), `falta layouts/${nombre}.json`);
});
