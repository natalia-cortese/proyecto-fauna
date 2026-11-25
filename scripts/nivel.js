// Cartel "NIVEL N — REGIÓN" al empezar cada laberinto.

import { claveRegion } from "./regiones.js";

const DURACION = 2.6;

let nivel = 1;
let cartelHasta = 0;
let baseW = 0;
let baseH = 0;
let frenado = false;

export function reiniciarNivel()
{
	nivel = 1;
	cartelHasta = 0;
	frenado = false;
}

export function getNivel()
{
	return nivel;
}

export function avanzarNivel()
{
	nivel += 1;
	return nivel;
}

export function cartelNivelActivo()
{
	return cartelHasta > 0;
}

function setMovimiento(runtime, habilitado)
{
	const activo = runtime.globalVars.PERSONAJE === "Dieguito" ? "spriteDieguito" : "spriteMafalda";
	for (const nombre of ["spriteMafalda", "spriteDieguito"])
	{
		const inst = runtime.objects[nombre]?.getFirstInstance();
		if (!inst) continue;
		const b = inst.behaviors;
		const manejado = habilitado && nombre === activo;
		b["8Direction"]?.stop();
		if (b["8Direction"])
		{
			b["8Direction"].isEnabled = manejado;
			b["8Direction"].isDefaultControls = manejado;
		}
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = habilitado && !manejado;
		if (b.ScrollTo) b.ScrollTo.isEnabled = manejado;
	}
	frenado = !habilitado;
}

function ponerAnimacionCartel(cartel, nombres)
{
	for (const nombre of nombres)
	{
		if (!nombre) continue;
		try
		{
			cartel.setAnimation(nombre);
			return nombre;
		}
		catch {}
	}
	return "";
}

export function mostrarCartelNivel(runtime)
{
	const reg = claveRegion(runtime.globalVars.REGION || "puna");
	const n = Math.min(8, Math.max(1, nivel));
	const cartel = runtime.objects.spriteCartelNivel?.getFirstInstance();
	if (!cartel) return;

	const anim = ponerAnimacionCartel(cartel, [`${reg}_${n}`, `patagonia_${n}`]);
	if (!anim)
	{
		cartel.isVisible = false;
		cartelHasta = 0;
		return;
	}

	cartel.isVisible = true;
	cartel.opacity = 1;
	cartel.x = 512;
	cartel.y = 430;
	cartel.width = 720;
	cartel.height = 720 * (cartel.imageHeight / Math.max(1, cartel.imageWidth));
	baseW = Math.abs(cartel.width);
	baseH = Math.abs(cartel.height);
	cartel.moveToTop();

	if (runtime.globalVars.NIVEL !== undefined) runtime.globalVars.NIVEL = nivel;
	cartelHasta = runtime.gameTime + DURACION;
	setMovimiento(runtime, false);
}

export function actualizarCartelNivel(runtime)
{
	if (!cartelHasta) return;
	const cartel = runtime.objects.spriteCartelNivel?.getFirstInstance();

	if (runtime.gameTime >= cartelHasta)
	{
		cartelHasta = 0;
		if (cartel) cartel.isVisible = false;
		if (frenado) setMovimiento(runtime, true);
		return;
	}

	if (!cartel?.isVisible) return;
	const t = 1 - (cartelHasta - runtime.gameTime) / DURACION;
	let escala = 1;
	let op = 1;
	if (t < 0.18) escala = 0.85 + 0.15 * (t / 0.18);
	else if (t > 0.75) op = 1 - (t - 0.75) / 0.25;
	cartel.width = baseW * escala;
	cartel.height = baseH * escala;
	cartel.opacity = Math.max(0, op);
}
