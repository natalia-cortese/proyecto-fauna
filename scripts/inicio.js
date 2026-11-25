// Pantalla de inicio (layout Inicio): mapa de Argentina para elegir zona.
// Hay que escribir el nombre (textNombre) para guardar el progreso del álbum.
// El mapa solo selecciona la región; el juego empieza al tocar JUGAR.
//
// Cada región es un sprite encima del fondo, en su lugar exacto, con animaciones
// "desactivada" y "activa". Al pasar el mouse por una región jugable se activa y
// queda elegida para JUGAR. La detección usa la silueta de mapaRegiones.js.
//
// spriteIconoRegion (una instancia sobre cada región) muestra "check" si el jugador ya completó
// la región y "candado" si la región todavía no se puede jugar.

import {
	setJugador, cargarUltimoJugador, abrirAlbum, cerrarAlbum, albumAbierto,
	tocarBotonAlbum, configurarAlbum, fichaAlbumAbierta, coleccionDe
} from "./album.js";
import { abrirFichaId, cerrarFicha } from "./fichas.js";
import { iniciarSonido, alternarSonido, tocarBotonSonido } from "./sonido.js";
import { layoutDeRegion, REGIONES_JUGABLES, regionCompleta } from "./regiones.js";
import { reiniciarNivel } from "./nivel.js";
import { regionEnMapa } from "./mapaRegiones.js";

export const ZONAS = {
	spriteZonaPuna: "puna",
	spriteZonaPatagonia: "patagonia"
};
export const ZONAS_BLOQUEADAS = {
	spriteZonaNoreste: "noreste",
	spriteZonaCuyo: "cuyo",
	spriteZonaPampeana: "pampeana"
};
const REGIONES_HABILITADAS = new Set(REGIONES_JUGABLES);
const ESCALA_HOVER = 1.05;
const CADA_ICONOS = 0.5;
const DURACION_SALIDA = 0.3;
const NOMBRE_X = 680;
const ETIQUETA_X = 820;

let tiempo = 0;
let salida = -1;
let base = new Map();
let quitarEscucha = null;
let avisoNombre = 0;
let regionElegida = "";
let regionSobre = null;
let layoutPendiente = "";
let proximosIconos = 0;

export function iniciarInicio(runtime)
{
	tiempo = 0;
	salida = -1;
	avisoNombre = 0;
	regionSobre = null;
	base = new Map();
	runtime.timeScale = 1;
	if (runtime.globalVars.ALBUM !== undefined) runtime.globalVars.ALBUM = 0;

	const previa = String(runtime.globalVars.REGION || "").toLowerCase();
	regionElegida = regionInicial(previa, coleccionDe(cargarUltimoJugador()));
	layoutPendiente = "";
	proximosIconos = 0;
	if (regionElegida) fijarRegion(runtime, regionElegida);

	configurarAlbum(
		(rt, id) => abrirFichaId(rt, id),
		(rt) => cerrarFicha(rt)
	);

	for (const nombre of ["spriteMafalda", "spriteDieguito"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			for (const b of ["8Direction", "Pathfinding", "ScrollTo"])
				if (inst.behaviors[b]) inst.behaviors[b].isEnabled = false;

	for (const nombre of Object.keys(ZONAS_BLOQUEADAS))
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
		{
			inst.isVisible = true;
			inst.setAnimation("desactivada");
		}

	for (const nombre of [...Object.keys(ZONAS), "spriteBotonJugar", "spriteMafalda", "spriteDieguito", "spriteBotonAlbum"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
		{
			base.set(inst, { y: inst.y, w: Math.abs(inst.width), h: Math.abs(inst.height), sc: 1 });
			if (Object.prototype.hasOwnProperty.call(ZONAS, nombre))
			{
				inst.isVisible = true;
				inst.setAnimation("desactivada");
			}
		}

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
	const alMover = e => mover(runtime, e);
	runtime.addEventListener("pointerdown", alTocar);
	runtime.addEventListener("pointermove", alMover);
	quitarEscucha = () => {
		runtime.removeEventListener("pointerdown", alTocar);
		runtime.removeEventListener("pointermove", alMover);
		setCursor(runtime, "");
		quitarEscucha = null;
	};
}

// Al volver de una región completa queda elegida la próxima que falta (si queda alguna).
export function regionInicial(previa, coleccion)
{
	if (!REGIONES_HABILITADAS.has(previa)) return "";
	if (!regionCompleta(previa, coleccion)) return previa;
	return REGIONES_JUGABLES.find(r => !regionCompleta(r, coleccion)) || previa;
}

export function iconoDeRegion(region, coleccion)
{
	if (!region) return "";
	if (!REGIONES_HABILITADAS.has(region)) return "candado";
	return regionCompleta(region, coleccion) ? "check" : "";
}

function actualizarIconos(runtime)
{
	const campo = runtime.objects.textNombre?.getFirstInstance();
	const coleccion = coleccionDe(campo?.text || cargarUltimoJugador());
	for (const inst of runtime.objects.spriteIconoRegion?.getAllInstances() ?? [])
	{
		const icono = iconoDeRegion(regionEnMapa(inst.x, inst.y), coleccion);
		inst.isVisible = !!icono;
		if (icono && inst.animationName !== icono) inst.setAnimation(icono);
	}
}

export function actualizarInicio(runtime)
{
	tiempo += runtime.dt;
	proximosIconos -= runtime.dt;
	if (proximosIconos <= 0)
	{
		proximosIconos = CADA_ICONOS;
		actualizarIconos(runtime);
	}
	if (albumAbierto()) return;
	if (salida < 0) actualizarZonaConMouse(runtime);

	const latido = 1 + 0.03 * Math.sin(tiempo * 4);
	const aviso = avisoNombre > 0;
	if (aviso) avisoNombre -= runtime.dt;
	const t = Math.min(1, runtime.dt * 14);

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
			animarZona(runtime, inst, b, t);
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
		campo.x = NOMBRE_X + temblor;
		if (etiqueta) etiqueta.x = ETIQUETA_X + temblor;
	}
	else if (campo)
	{
		campo.x = NOMBRE_X;
		if (etiqueta) etiqueta.x = ETIQUETA_X;
	}

	if (salida >= 0)
	{
		salida += runtime.dt;
		if (salida >= DURACION_SALIDA)
		{
			const destino = layoutPendiente || (regionElegida && layoutDeRegion(regionElegida));
			if (destino) runtime.goToLayout(destino);
		}
	}
}

function animarZona(runtime, inst, b, t)
{
	const region = ZONAS[inst.objectType.name];
	const hover = regionSobre === region;
	const activa = hover || region === regionElegida;
	const destSc = hover ? ESCALA_HOVER : activa ? 1 + 0.015 * Math.sin(tiempo * 4) : 1;
	b.sc += (destSc - b.sc) * t;
	inst.isVisible = true;
	inst.width = b.w * b.sc;
	inst.height = b.h * b.sc;
	const anim = activa ? "activa" : "desactivada";
	if (inst.animationName !== anim)
	{
		inst.setAnimation(anim);
		if (activa) subirSobreZonas(runtime, inst);
	}
}

// Queda arriba de las otras regiones (al agrandarse) pero debajo del resto de la interfaz.
function subirSobreZonas(runtime, inst)
{
	let tope = null;
	for (const nombre of [...Object.keys(ZONAS), ...Object.keys(ZONAS_BLOQUEADAS)])
		for (const otra of runtime.objects[nombre]?.getAllInstances() ?? [])
			if (otra !== inst && (!tope || otra.zIndex > tope.zIndex)) tope = otra;
	try { if (tope && tope.zIndex > inst.zIndex) inst.moveAdjacentToInstance(tope, true); } catch {}
}

export function jugar(runtime, region)
{
	if (salida >= 0 || albumAbierto()) return;
	if (!tomarNombre(runtime))
	{
		avisoNombre = 1.2;
		return;
	}
	const clave = region || regionSobre || regionElegida;
	if (!REGIONES_HABILITADAS.has(String(clave || "").toLowerCase()))
	{
		avisoNombre = 1.2;
		return;
	}
	fijarRegion(runtime, clave);
	layoutPendiente = layoutDeRegion(clave, 1);
	if (runtime.globalVars.SEMILLA !== undefined) runtime.globalVars.SEMILLA = 0;
	reiniciarNivel();
	if (runtime.globalVars.NIVEL !== undefined) runtime.globalVars.NIVEL = 1;
	try { runtime.objects.textNombre?.getFirstInstance()?.blur?.(); } catch {}
	quitarEscucha?.();
	salida = 0;
}

function normalizarRegion(region)
{
	const clave = String(region || "").toLowerCase();
	return REGIONES_HABILITADAS.has(clave) ? clave : "";
}

function fijarRegion(runtime, region)
{
	regionElegida = normalizarRegion(region);
	try { runtime.globalVars.REGION = regionElegida; } catch {}
}

function elegirRegion(runtime, region)
{
	fijarRegion(runtime, region);
}

function tomarNombre(runtime)
{
	const campo = runtime.objects.textNombre?.getFirstInstance();
	const nombre = setJugador(campo?.text || "");
	if (runtime.globalVars.JUGADOR !== undefined) runtime.globalVars.JUGADOR = nombre;
	return !!nombre;
}

function coordsCapa(runtime, e)
{
	const capa = runtime.layout.getLayer("Inicio");
	return capa.cssPxToLayer(e.clientX, e.clientY);
}

export function zonaBajoPunto(x, y)
{
	const region = regionEnMapa(x, y);
	return REGIONES_HABILITADAS.has(region) ? region : null;
}

function cursorEnMapa(x, y)
{
	if (regionSobre) return "pointer";
	return regionEnMapa(x, y) ? "not-allowed" : "";
}

function mouseCapaXY(runtime, capa)
{
	const m = runtime.mouse;
	if (!m || !capa) return null;
	if (typeof m.getMouseX === "function" && typeof m.getMouseY === "function")
		return [m.getMouseX(capa), m.getMouseY(capa)];
	if (typeof m.getMousePosition === "function")
	{
		const p = m.getMousePosition(capa);
		if (Array.isArray(p)) return p;
		if (p && p.x != null) return [p.x, p.y];
	}
	return null;
}

function actualizarZonaConMouse(runtime)
{
	const capa = runtime.layout.getLayer("Inicio");
	if (!capa) return;
	try
	{
		const pos = mouseCapaXY(runtime, capa);
		if (!pos) return;
		const [x, y] = pos;
		if (x == null || y == null) return;
		regionSobre = zonaBajoPunto(x, y);
		if (regionSobre) elegirRegion(runtime, regionSobre);
		setCursor(runtime, cursorEnMapa(x, y));
	}
	catch {}
}

function setCursor(runtime, tipo)
{
	try
	{
		const el = runtime.canvas ?? runtime.getElement?.();
		if (el) el.style.cursor = tipo || "";
	}
	catch {}
}

function mover(runtime, e)
{
	if (runtime.layout.name !== "Inicio" || albumAbierto() || salida >= 0)
	{
		regionSobre = null;
		setCursor(runtime, "");
		return;
	}
	const [x, y] = coordsCapa(runtime, e);
	regionSobre = zonaBajoPunto(x, y);
	if (regionSobre) elegirRegion(runtime, regionSobre);
	setCursor(runtime, cursorEnMapa(x, y));
}

function tocar(runtime, e)
{
	if (runtime.layout.name !== "Inicio") return quitarEscucha?.();
	const [x, y] = coordsCapa(runtime, e);

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

	const zona = zonaBajoPunto(x, y);
	if (zona) return elegirRegion(runtime, zona);

	if (runtime.objects.spriteBotonJugar?.getAllInstances().some(i => i.containsPoint(x, y)))
		jugar(runtime);
}

export function cerrarAlbumOFicha(runtime)
{
	if (fichaAlbumAbierta()) return cerrarAlbum(runtime);
	if (albumAbierto()) return cerrarAlbum(runtime);
	return false;
}
