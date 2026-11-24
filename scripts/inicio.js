// Pantalla de inicio (layout Inicio): mapa de Argentina para elegir zona.
// Hay que escribir el nombre (textNombre) para guardar el progreso del álbum.
// El mapa solo selecciona la región; el juego empieza al tocar JUGAR.
// Las zonas con candado son parte del fondo.

import {
	setJugador, cargarUltimoJugador, abrirAlbum, cerrarAlbum, albumAbierto,
	tocarBotonAlbum, configurarAlbum, fichaAlbumAbierta
} from "./album.js";
import { abrirFichaId, cerrarFicha } from "./fichas.js";
import { iniciarSonido, alternarSonido, tocarBotonSonido } from "./sonido.js";
import { reiniciarNivel } from "./nivel.js";

const ZONAS = { spriteZonaPuna: "puna" };
const LAYOUT_JUEGO = "Laberinto";
const DURACION_SALIDA = 0.3;

let tiempo = 0;
let salida = -1;
let base = new Map();
let quitarEscucha = null;
let avisoNombre = 0;
let regionElegida = "puna";

export function iniciarInicio(runtime)
{
	tiempo = 0;
	salida = -1;
	avisoNombre = 0;
	base = new Map();
	runtime.timeScale = 1;
	if (runtime.globalVars.ALBUM !== undefined) runtime.globalVars.ALBUM = 0;

	regionElegida = runtime.globalVars.REGION || "puna";
	runtime.globalVars.REGION = regionElegida;

	configurarAlbum(
		(rt, id) => abrirFichaId(rt, id),
		(rt) => cerrarFicha(rt)
	);

	for (const nombre of ["spriteMafalda", "spriteDieguito"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			for (const b of ["8Direction", "Pathfinding", "ScrollTo"])
				if (inst.behaviors[b]) inst.behaviors[b].isEnabled = false;

	for (const nombre of [...Object.keys(ZONAS), "spriteBotonJugar", "spriteMafalda", "spriteDieguito", "spriteBotonAlbum"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			base.set(inst, { y: inst.y, w: Math.abs(inst.width), h: Math.abs(inst.height) });

	const campo = runtime.objects.textNombre?.getFirstInstance();
	const ultimo = cargarUltimoJugador();
	if (campo)
	{
		if (ultimo && !campo.text) campo.text = ultimo;
		campo.placeholder = "Escribí tu nombre";
		try
		{
			campo.style.fontFamily = "Arial Rounded MT Bold, Arial, sans-serif";
			campo.style.fontSize = "18px";
			campo.style.color = "#2a1a0a";
			campo.style.backgroundColor = "#f5e6c8";
			campo.style.border = "2px solid #c9a45c";
			campo.style.borderRadius = "8px";
			campo.style.padding = "4px 10px";
			campo.style.textAlign = "center";
		}
		catch {}
	}
	if (ultimo) setJugador(ultimo);

	iniciarSonido(runtime);
	cerrarAlbum(runtime, true);

	quitarEscucha?.();
	const alTocar = e => tocar(runtime, e);
	runtime.addEventListener("pointerdown", alTocar);
	quitarEscucha = () => { runtime.removeEventListener("pointerdown", alTocar); quitarEscucha = null; };
}

export function actualizarInicio(runtime)
{
	tiempo += runtime.dt;
	if (albumAbierto()) return;

	const latido = 1 + 0.03 * Math.sin(tiempo * 4);
	const aviso = avisoNombre > 0;
	if (aviso) avisoNombre -= runtime.dt;

	for (const [inst, b] of base)
	{
		const nombre = inst.objectType.name;
		if (nombre === "spriteMafalda" || nombre === "spriteDieguito")
		{
			const fase = nombre === "spriteMafalda" ? 0 : 1.6;
			inst.y = b.y - Math.abs(Math.sin(tiempo * 3 + fase)) * 6;
			continue;
		}
		if (nombre === "spriteBotonAlbum")
		{
			const escala = 1 + 0.05 * Math.sin(tiempo * 3.5);
			inst.width = b.w * escala;
			inst.height = b.h * escala;
			continue;
		}
		if (Object.prototype.hasOwnProperty.call(ZONAS, nombre))
		{
			const elegida = ZONAS[nombre] === regionElegida;
			const escala = elegida ? 1 + 0.06 * Math.sin(tiempo * 4) : latido * 0.96;
			inst.width = b.w * escala;
			inst.height = b.h * escala;
			inst.opacity = elegida ? 1 : 0.72;
			continue;
		}
		let escala = nombre === "spriteBotonJugar" ? 1 + 0.04 * Math.sin(tiempo * 4 + 1.5) : latido;
		if (salida >= 0) escala = 1 + 0.12 * Math.sin(Math.min(salida / DURACION_SALIDA, 1) * Math.PI);
		inst.width = b.w * escala;
		inst.height = b.h * escala;
	}

	const campo = runtime.objects.textNombre?.getFirstInstance();
	const etiqueta = runtime.objects.spriteEtiquetaNombre?.getFirstInstance();
	if (aviso && campo)
	{
		const temblor = Math.sin(tiempo * 40) * 4;
		campo.x = 372 + temblor;
		if (etiqueta) etiqueta.x = 512 + temblor;
	}
	else if (campo)
	{
		campo.x = 372;
		if (etiqueta) etiqueta.x = 512;
	}

	if (salida >= 0)
	{
		salida += runtime.dt;
		if (salida >= DURACION_SALIDA) runtime.goToLayout(LAYOUT_JUEGO);
	}
}

export function jugar(runtime, region = regionElegida || runtime.globalVars.REGION)
{
	if (salida >= 0 || albumAbierto()) return;
	if (!tomarNombre(runtime))
	{
		avisoNombre = 1.2;
		return;
	}
	runtime.globalVars.REGION = region || regionElegida || "puna";
	runtime.globalVars.SEMILLA = 0;
	reiniciarNivel();
	if (runtime.globalVars.NIVEL !== undefined) runtime.globalVars.NIVEL = 1;
	quitarEscucha?.();
	salida = 0;
}

function elegirRegion(runtime, region)
{
	regionElegida = region;
	runtime.globalVars.REGION = region;
}

function tomarNombre(runtime)
{
	const campo = runtime.objects.textNombre?.getFirstInstance();
	const nombre = setJugador(campo?.text || "");
	if (runtime.globalVars.JUGADOR !== undefined) runtime.globalVars.JUGADOR = nombre;
	return !!nombre;
}

function tocar(runtime, e)
{
	if (runtime.layout.name !== "Inicio") return quitarEscucha?.();
	const capa = runtime.layout.getLayer("Inicio");
	const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);

	if (albumAbierto()) return;

	if (tocarBotonSonido(runtime, x, y))
		return void alternarSonido(runtime);

	if (tocarBotonAlbum(runtime, x, y))
	{
		if (!tomarNombre(runtime))
		{
			avisoNombre = 1.2;
			return;
		}
		abrirAlbum(runtime);
		return;
	}

	for (const [nombre, region] of Object.entries(ZONAS))
		if (runtime.objects[nombre]?.getAllInstances().some(i => i.containsPoint(x, y)))
			return elegirRegion(runtime, region);

	if (runtime.objects.spriteBotonJugar?.getAllInstances().some(i => i.containsPoint(x, y)))
		jugar(runtime);
}

export function cerrarAlbumOFicha(runtime)
{
	if (fichaAlbumAbierta()) return cerrarAlbum(runtime);
	if (albumAbierto()) return cerrarAlbum(runtime);
	return false;
}
