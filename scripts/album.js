// Álbum de fauna: colección de cartas por jugador (localStorage).
// Botón pokédex en Inicio y Laberinto; al rescatar se guarda region_animal.
// Flecha spriteBotonCerrarAlbum para salir (también Esc o tocar fuera).
// Cada región ocupa las dos hojas del álbum (12 ranuras); abre en la región elegida.
// Se cambia de región con spriteFlechaAlbum (debajo del álbum, con spriteTituloAlbum en el medio) o con ← →.

import { idsDeRegion, claveRegion } from "./regiones.js";

const PREFIJO = "fauna_album_";
const ULTIMO = "fauna_ultimo_jugador";
const RANURAS = 12;

export const PAGINAS_ALBUM = ["puna", "patagonia", "chaco"].map(region => ({
	region,
	ids: [...idsDeRegion(region), ...Array(RANURAS).fill(null)].slice(0, RANURAS)
}));

// Centros de cada "?" del sprite del álbum (fracción del ancho/alto respecto al centro).
const SLOTS_REL = [
	[-0.3822, -0.0701], [-0.2505, -0.0701], [-0.1188, -0.0701],
	[-0.3822, 0.2440], [-0.2505, 0.2440], [-0.1188, 0.2440],
	[0.1188, -0.0701], [0.2505, -0.0701], [0.3822, -0.0701],
	[0.1188, 0.2440], [0.2505, 0.2440], [0.3822, 0.2440]
];
const SLOT_ANCHO = 0.117;
const SLOT_ALTO = 0.284;
const LADO_FLECHA = 56;
const SEPARACION_FLECHAS = 190;
const DEBAJO_DEL_ALBUM = 44;

let jugador = "";
let pagina = 0;
let abierto = false;
let fichaDesdeAlbum = false;
let quitarEscucha = null;
let alVerFicha = null;
let alCerrarFichaAlbum = null;

export function normalizarNombre(texto)
{
	return String(texto ?? "").trim().replace(/\s+/g, " ");
}

export function claveJugador(nombre)
{
	return PREFIJO + normalizarNombre(nombre).toLowerCase();
}

export function setJugador(nombre)
{
	jugador = normalizarNombre(nombre);
	if (jugador)
		try { localStorage.setItem(ULTIMO, jugador); } catch {}
	return jugador;
}

export function getJugador()
{
	return jugador;
}

export function cargarUltimoJugador()
{
	try { return normalizarNombre(localStorage.getItem(ULTIMO) || ""); }
	catch { return ""; }
}

export function coleccionActual()
{
	return coleccionDe(jugador);
}

export function coleccionDe(nombre)
{
	if (!normalizarNombre(nombre)) return new Set();
	try
	{
		const raw = localStorage.getItem(claveJugador(nombre));
		return new Set(raw ? JSON.parse(raw) : []);
	}
	catch { return new Set(); }
}

function guardarColeccion(set)
{
	if (!jugador) return;
	try { localStorage.setItem(claveJugador(jugador), JSON.stringify([...set])); }
	catch {}
}

export function agregarAnimal(region, animal)
{
	if (!jugador || !region || !animal) return false;
	const id = `${region}_${animal}`;
	const set = coleccionActual();
	if (set.has(id)) return false;
	set.add(id);
	guardarColeccion(set);
	if (abierto && runtimeActual) pintarSlots(runtimeActual);
	return true;
}

let runtimeActual = null;

export function albumAbierto()
{
	return abierto;
}

export function fichaAlbumAbierta()
{
	return fichaDesdeAlbum;
}

export function configurarAlbum(verFicha, cerrarFicha)
{
	alVerFicha = verFicha;
	alCerrarFichaAlbum = cerrarFicha;
}

export function abrirAlbum(runtime)
{
	if (abierto) return true;
	if (!jugador)
	{
		const campo = runtime.objects.textNombre?.getFirstInstance();
		if (campo) setJugador(campo.text);
	}
	if (!jugador) return false;

	runtimeActual = runtime;
	abierto = true;
	fichaDesdeAlbum = false;
	pagina = Math.max(0, PAGINAS_ALBUM.findIndex(p => p.region === claveRegion(runtime.globalVars.REGION)));
	if (runtime.globalVars.ALBUM !== undefined) runtime.globalVars.ALBUM = 1;

	const fondo = runtime.objects.spriteAlbumFondo?.getFirstInstance();
	const album = runtime.objects.spriteAlbum?.getFirstInstance();
	// En Laberinto el HUD usa coords de viewport (~1024); en Inicio el layout es 1024×1024.
	const enHud = runtime.layout.name !== "Inicio";
	const lw = enHud ? 1024 : runtime.layout.width;
	const lh = enHud ? 1024 : runtime.layout.height;
	const cx = lw / 2;
	const cy = lh / 2;
	if (fondo)
	{
		fondo.isVisible = true;
		fondo.width = lw;
		fondo.height = lh;
		fondo.x = cx;
		fondo.y = cy;
	}
	if (album)
	{
		album.isVisible = true;
		const aw = Math.min(album.imageWidth * 0.93, lw * 0.9);
		album.width = aw;
		album.height = aw * (album.imageHeight / album.imageWidth);
		album.x = cx;
		album.y = cy * 0.94;
	}

	ocultarBotonAlbum(runtime, true);
	ocultarNombre(runtime, true);
	colocarCerrar(runtime, true);
	colocarNavegacion(runtime, true);
	pintarSlots(runtime);

	quitarEscucha?.();
	const alTocar = e => tocarAlbum(runtime, e);
	const alTeclear = e => teclaAlbum(runtime, e);
	runtime.addEventListener("pointerdown", alTocar);
	runtime.addEventListener("keydown", alTeclear);
	quitarEscucha = () => {
		runtime.removeEventListener("pointerdown", alTocar);
		runtime.removeEventListener("keydown", alTeclear);
		quitarEscucha = null;
	};
	return true;
}

function teclaAlbum(runtime, e)
{
	if (!abierto || fichaDesdeAlbum) return;
	const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
	if (paso) cambiarPagina(runtime, paso);
}

function cambiarPagina(runtime, paso)
{
	pagina = (pagina + paso + PAGINAS_ALBUM.length) % PAGINAS_ALBUM.length;
	colocarNavegacion(runtime, true);
	pintarSlots(runtime);
}

export function cerrarAlbum(runtime, forzar = false)
{
	if (!abierto && !forzar) return false;
	if (fichaDesdeAlbum)
	{
		alCerrarFichaAlbum?.(runtime);
		fichaDesdeAlbum = false;
		ocultarPiezasAlbum(runtime, false);
		colocarCerrar(runtime, true);
		colocarNavegacion(runtime, true);
		pintarSlots(runtime);
		return true;
	}
	abierto = false;
	if (runtime.globalVars.ALBUM !== undefined) runtime.globalVars.ALBUM = 0;
	quitarEscucha?.();

	for (const nombre of ["spriteAlbumFondo", "spriteAlbum"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = false;
	for (const slot of runtime.objects.spriteAlbumSlot?.getAllInstances() ?? [])
		slot.isVisible = false;
	colocarCerrar(runtime, false);
	colocarNavegacion(runtime, false);

	ocultarBotonAlbum(runtime, false);
	ocultarNombre(runtime, false);
	if (runtime.globalVars.FICHA !== 1) runtime.timeScale = 1;
	return true;
}

function ocultarBotonAlbum(runtime, ocultar)
{
	for (const inst of runtime.objects.spriteBotonAlbum?.getAllInstances() ?? [])
		inst.isVisible = !ocultar;
}

function colocarCerrar(runtime, mostrar)
{
	const btn = runtime.objects.spriteBotonCerrarAlbum?.getFirstInstance();
	const album = runtime.objects.spriteAlbum?.getFirstInstance();
	if (!btn) return;
	if (!mostrar || !album)
	{
		btn.isVisible = false;
		return;
	}
	btn.isVisible = true;
	btn.width = 64;
	btn.height = 64;
	btn.x = album.x - album.width * 0.5 + 36;
	btn.y = album.y - album.height * 0.5 + 36;
}

function colocarNavegacion(runtime, mostrar)
{
	const album = runtime.objects.spriteAlbum?.getFirstInstance();
	const flechas = runtime.objects.spriteFlechaAlbum?.getAllInstances() ?? [];
	const titulo = runtime.objects.spriteTituloAlbum?.getFirstInstance();
	const ver = mostrar && !!album;
	const y = ver ? album.y + album.height / 2 + DEBAJO_DEL_ALBUM : 0;
	for (const f of flechas)
	{
		f.isVisible = ver;
		if (!ver) continue;
		const lado = f.animationName === "derecha" ? 1 : -1;
		f.x = album.x + lado * SEPARACION_FLECHAS;
		f.y = y;
		f.width = LADO_FLECHA;
		f.height = LADO_FLECHA;
	}
	if (!titulo) return;
	titulo.isVisible = ver;
	if (!ver) return;
	const region = PAGINAS_ALBUM[pagina].region;
	if (titulo.animationName !== region)
		try { titulo.setAnimation(region); } catch {}
	const escala = 270 / titulo.imageWidth;
	titulo.width = titulo.imageWidth * escala;
	titulo.height = titulo.imageHeight * escala;
	titulo.x = album.x;
	titulo.y = y;
}

function ocultarPiezasAlbum(runtime, ocultar)
{
	for (const nombre of ["spriteAlbumFondo", "spriteAlbum"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = !ocultar;
	if (ocultar)
	{
		for (const slot of runtime.objects.spriteAlbumSlot?.getAllInstances() ?? [])
			slot.isVisible = false;
		colocarCerrar(runtime, false);
		colocarNavegacion(runtime, false);
	}
}

function ocultarNombre(runtime, ocultar)
{
	if (runtime.layout.name !== "Inicio") return;
	for (const inst of runtime.objects.spriteEtiquetaNombre?.getAllInstances() ?? [])
		inst.isVisible = !ocultar;
	const campo = runtime.objects.textNombre?.getFirstInstance();
	if (campo)
	{
		campo.isVisible = !ocultar;
		campo.isEnabled = !ocultar;
	}
}

function pintarSlots(runtime)
{
	const album = runtime.objects.spriteAlbum?.getFirstInstance();
	const slots = [...(runtime.objects.spriteAlbumSlot?.getAllInstances() ?? [])]
		.sort((a, b) => a.uid - b.uid);
	if (!album || slots.length < RANURAS) return;

	const col = coleccionActual();
	const sw = album.width * SLOT_ANCHO;
	const sh = album.height * SLOT_ALTO;

	for (let i = 0; i < RANURAS; i++)
	{
		const slot = slots[i];
		const id = PAGINAS_ALBUM[pagina].ids[i];
		const [rx, ry] = SLOTS_REL[i];
		slot.x = album.x + rx * album.width;
		slot.y = album.y + ry * album.height;
		slot.width = sw;
		slot.height = sh;

		if (id && col.has(id))
		{
			if (slot.animationName !== id) slot.setAnimation(id);
			slot.isVisible = true;
		}
		else
		{
			if (slot.animationName !== "vacio") slot.setAnimation("vacio");
			slot.isVisible = false;
		}
	}
}

function tocarAlbum(runtime, e)
{
	if (!abierto) return quitarEscucha?.();
	if (fichaDesdeAlbum) return;

	const capa = runtime.layout.getLayer(runtime.layout.name === "Inicio" ? "Inicio" : "HUD");
	if (!capa) return;
	const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);

	const cerrar = runtime.objects.spriteBotonCerrarAlbum?.getFirstInstance();
	if (cerrar?.isVisible && cerrar.containsPoint(x, y))
		return void cerrarAlbum(runtime);

	const flecha = (runtime.objects.spriteFlechaAlbum?.getAllInstances() ?? [])
		.find(f => f.isVisible && f.containsPoint(x, y));
	if (flecha) return void cambiarPagina(runtime, flecha.animationName === "derecha" ? 1 : -1);
	const titulo = runtime.objects.spriteTituloAlbum?.getFirstInstance();
	if (titulo?.isVisible && titulo.containsPoint(x, y)) return;

	const slots = [...(runtime.objects.spriteAlbumSlot?.getAllInstances() ?? [])]
		.sort((a, b) => a.uid - b.uid);
	const col = coleccionActual();
	for (let i = 0; i < Math.min(RANURAS, slots.length); i++)
	{
		const id = PAGINAS_ALBUM[pagina].ids[i];
		if (!id || !col.has(id)) continue;
		if (slots[i].isVisible && slots[i].containsPoint(x, y))
		{
			fichaDesdeAlbum = true;
			ocultarPiezasAlbum(runtime, true);
			alVerFicha?.(runtime, id);
			return;
		}
	}

	const album = runtime.objects.spriteAlbum?.getFirstInstance();
	if (album && album.containsPoint(x, y)) return;
	cerrarAlbum(runtime);
}

export function tocarBotonAlbum(runtime, x, y)
{
	const botones = runtime.objects.spriteBotonAlbum?.getAllInstances() ?? [];
	return botones.some(b => b.isVisible && b.containsPoint(x, y));
}
