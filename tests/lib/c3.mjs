import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const PROYECTO = JSON.parse(readFileSync(join(RAIZ, "project.c3proj"), "utf8"));

export function listarArchivos(dir, filtro)
{
	const out = [];
	if (!existsSync(dir)) return out;
	for (const nombre of readdirSync(dir))
	{
		const ruta = join(dir, nombre);
		if (statSync(ruta).isDirectory()) out.push(...listarArchivos(ruta, filtro));
		else if (!filtro || filtro(nombre, relative(RAIZ, ruta)))
			out.push(relative(RAIZ, ruta).replaceAll("\\", "/"));
	}
	return out.sort();
}

export function recogerNombres(nodo)
{
	const nombres = [...(nodo.items ?? [])];
	for (const sub of nodo.subfolders ?? [])
		nombres.push(...recogerNombres(sub));
	return nombres;
}

export function recogerJson(dir)
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

export function walk(nodo, fn)
{
	if (Array.isArray(nodo)) return nodo.forEach(hijo => walk(hijo, fn));
	if (!nodo || typeof nodo !== "object") return;
	fn(nodo);
	for (const valor of Object.values(nodo)) walk(valor, fn);
}

export function cargarObjetos()
{
	const porNombre = new Map();
	for (const archivo of recogerJson(join(RAIZ, "objectTypes")))
	{
		if (archivo.includes("tilemapBrushes")) continue;
		const datos = JSON.parse(readFileSync(archivo, "utf8"));
		const animaciones = (datos.animations?.items ?? []).map(a => a.name);
		const frames = [];
		for (const a of datos.animations?.items ?? [])
			for (let i = 0; i < (a.frames?.length ?? 0); i++)
				frames.push({ animacion: a.name, indice: i });
		porNombre.set(datos.name, {
			archivo: relative(RAIZ, archivo).replaceAll("\\", "/"),
			plugin: datos["plugin-id"],
			animaciones,
			frames
		});
	}
	return porNombre;
}

export function imagenDe(objeto, plugin, animacion, indice)
{
	const base = objeto.toLowerCase();
	if (plugin === "Sprite")
		return `images/${base}-${animacion.toLowerCase()}-${String(indice).padStart(3, "0")}.png`;
	return `images/${base}.png`;
}
