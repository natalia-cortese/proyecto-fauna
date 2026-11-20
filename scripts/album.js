// Álbum de fauna: colección de cartas por jugador (localStorage).
// Botón pokédex en Inicio y Laberinto; al rescatar se guarda region_animal.

const PREFIJO = "fauna_album_";
const ULTIMO = "fauna_ultimo_jugador";

// Orden fijo de las 12 ranuras del álbum (las últimas quedan libres para el futuro).
export const ORDEN_ALBUM = [
	"puna_vicuna", "puna_zorro_andino", "puna_condor",
	"puna_flamenco", "puna_gato_andino", "puna_guanaco",
	"puna_puma", "puna_taruca", "chaco_quirquincho_bola",
	null, null, null
];

// Centros de cada "?" del sprite del álbum (fracción del ancho/alto respecto al centro).
const SLOTS_REL = [
	[-0.3822, -0.0701], [-0.2505, -0.0701], [-0.1188, -0.0701],
	[-0.3822, 0.2440], [-0.2505, 0.2440], [-0.1188, 0.2440],
	[0.1188, -0.0701], [0.2505, -0.0701], [0.3822, -0.0701],
	[0.1188, 0.2440], [0.2505, 0.2440], [0.3822, 0.2440]
];
const SLOT_ANCHO = 0.117;
const SLOT_ALTO = 0.284;

let jugador = "";
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
	if (!jugador) return new Set();
	try
	{
		const raw = localStorage.getItem(claveJugador(jugador));
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
	pintarSlots(runtime);

	quitarEscucha?.();
	const alTocar = e => tocarAlbum(runtime, e);
	runtime.addEventListener("pointerdown", alTocar);
	quitarEscucha = () => { runtime.removeEventListener("pointerdown", alTocar); quitarEscucha = null; };
	return true;
}

export function cerrarAlbum(runtime, forzar = false)
{
	if (!abierto && !forzar) return false;
	if (fichaDesdeAlbum)
	{
		alCerrarFichaAlbum?.(runtime);
		fichaDesdeAlbum = false;
		ocultarPiezasAlbum(runtime, false);
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

function ocultarPiezasAlbum(runtime, ocultar)
{
	for (const nombre of ["spriteAlbumFondo", "spriteAlbum"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = !ocultar;
	if (ocultar)
		for (const slot of runtime.objects.spriteAlbumSlot?.getAllInstances() ?? [])
			slot.isVisible = false;
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
	if (!album || slots.length < 12) return;

	const col = coleccionActual();
	const sw = album.width * SLOT_ANCHO;
	const sh = album.height * SLOT_ALTO;

	for (let i = 0; i < 12; i++)
	{
		const slot = slots[i];
		const id = ORDEN_ALBUM[i];
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

	const slots = [...(runtime.objects.spriteAlbumSlot?.getAllInstances() ?? [])]
		.sort((a, b) => a.uid - b.uid);
	const col = coleccionActual();
	for (let i = 0; i < Math.min(12, slots.length); i++)
	{
		const id = ORDEN_ALBUM[i];
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
