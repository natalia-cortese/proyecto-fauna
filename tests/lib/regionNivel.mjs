import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, walk, cargarObjetos } from "./c3.mjs";

const OBJETOS = cargarObjetos();

export function infoRegionOFalla(regiones, clave)
{
	const info = regiones[clave];
	if (!info) throw new Error(`falta REGIONES.${clave} en scripts/regiones.js`);
	return info;
}

export function cargarLayout(nombre)
{
	const ruta = join(RAIZ, "layouts", `${nombre}.json`);
	if (!existsSync(ruta)) throw new Error(`falta layouts/${nombre}.json`);
	return JSON.parse(readFileSync(ruta, "utf8"));
}

export function cargarHoja(nombre)
{
	const ruta = join(RAIZ, "eventSheets", `${nombre}.json`);
	if (!existsSync(ruta)) throw new Error(`falta eventSheets/${nombre}.json`);
	return JSON.parse(readFileSync(ruta, "utf8"));
}

export function scriptInicioLayout(hoja)
{
	let script = "";
	walk(hoja, nodo => {
		if (nodo.eventType !== "block") return;
		const esInicio = (nodo.conditions ?? []).some(c => c.id === "on-start-of-layout");
		if (!esInicio) return;
		for (const accion of nodo.actions ?? [])
		{
			if (accion.type === "script" && Array.isArray(accion.script))
				script += accion.script.join("\n") + "\n";
		}
	});
	return script;
}

export function playMusicaHoja(hoja)
{
	const plays = [];
	walk(hoja, nodo => {
		if (nodo.id !== "play-by-name") return;
		const p = nodo.parameters ?? {};
		if (!String(p["tag-optional"] ?? "").includes("musica")) return;
		plays.push({
			folder: p.folder,
			nombre: String(p["audio-file-name"] ?? "").replace(/^"|"$/g, "")
		});
	});
	return plays[0] ?? null;
}

export function jaulasDelScript(script)
{
	const m = script.match(/const\s+JAULAS\s*=\s*(\d+)/);
	if (!m) throw new Error("el On start of layout tiene que definir const JAULAS = N");
	return Number(m[1]);
}

export function fondosDelLayout(layout)
{
	const tipos = [];
	walk(layout, nodo => {
		if (nodo.type && typeof nodo.type === "string") tipos.push(nodo.type);
	});
	return tipos;
}

export function animacionesDe(objeto)
{
	return OBJETOS.get(objeto)?.animaciones ?? [];
}

export function objetoExiste(nombre)
{
	return OBJETOS.has(nombre);
}
