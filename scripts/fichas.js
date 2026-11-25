// Ficha del animal rescatado: aparece en grande cuando termina la animación de huida de una jaula.
// El juego queda en pausa hasta que se aprieta Espacio o Enter.
//
// Cada ficha es una animación de spriteFichaAnimal llamada region_animal, en minúscula y sin tildes
// (por ejemplo puna_vicuna). Para sumar un animal: agregá la animación en Construct y su nombre en
// animales de su región (scripts/regiones.js). Cada laberinto sortea, según su semilla, qué animales de su región están en sus jaulas.
//
// Al abrirse la ficha suena el SFX en sounds/<región>/sprite_sfx_<animal> (variable SONIDO + SONIDO_CARPETA).
// SONIDOS sirve para un animal cuyo archivo se llama distinto (quirquincho_bola → quirquincho).
// SIN_SONIDO lista las fichas que todavía no tienen archivo: se abren en silencio.

import { agregarAnimal, coleccionActual } from "./album.js";
import { etapaDe, claveRegion, REGIONES, carpetaSonidosDe, destinoAlCompletar } from "./regiones.js";
import { avanzarNivel, getNivel } from "./nivel.js";

export const ANIMALES = Object.fromEntries(
	Object.entries(REGIONES).map(([clave, info]) => [clave, info.animales ?? []])
);

const SONIDOS = {
	quirquincho_bola: "quirquincho"
};

export const SIN_SONIDO = new Set([
	"patagonia_oceano_pinguino",
	"patagonia_huemul", "patagonia_pudu", "patagonia_huillin", "patagonia_carpintero",
	"patagonia_chinchillon", "patagonia_cauquen", "patagonia_maca", "patagonia_cisne"
]);

let region = "puna";
let orden = [...ANIMALES.puna];
let rescatados = 0;
let abierta = false;
// Tras abrir todas las jaulas hay que entrar a la cueva para pasar de laberinto.
let listoParaCueva = false;
let saliendo = false;

export function reiniciarFichas(runtime)
{
	rescatados = 0;
	abierta = false;
	listoParaCueva = false;
	saliendo = false;
	runtime.globalVars.FICHA = 0;
	runtime.timeScale = 1;
	mostrarHud(runtime, false);
	for (const huida of runtime.objects.spriteHuida?.getAllInstances() ?? [])
		huida.destroy();
}

export function elegirAnimales(nuevaRegion, semilla, jaulas)
{
	const etapa = etapaDe(nuevaRegion, getNivel());
	region = etapa.fichaPrefijo || etapa.clave || nuevaRegion;
	const todosBase = etapa.animales ?? ANIMALES[region] ?? [];
	if (!todosBase.length)
	{
		orden = [];
		return;
	}
	const rnd = aleatorio(semilla);
	const todos = [...todosBase];
	const ya = coleccionActual();
	// Primero los que faltan en el álbum; si no alcanzan, completar sin repetir en este laberinto.
	const faltan = mezclar(todos.filter(a => !ya.has(`${region}_${a}`)), rnd);
	const conocidos = mezclar(todos.filter(a => ya.has(`${region}_${a}`)), rnd);
	orden = faltan.slice(0, jaulas);
	for (const a of conocidos)
	{
		if (orden.length >= jaulas) break;
		if (!orden.includes(a)) orden.push(a);
	}
	while (orden.length < jaulas)
		orden.push(...mezclar([...todos], rnd));
	orden.length = jaulas;
}

export function fichaAbierta()
{
	return abierta;
}

export function mostrarFicha(runtime)
{
	const animal = orden[rescatados % orden.length];
	const id = `${region}_${animal}`;
	rescatados++;
	agregarAnimal(region, animal);
	abrirFichaId(runtime, id);
}

// Abre una ficha por id (puna_vicuna). Sirve al rescatar y al releer desde el álbum.
export function abrirFichaId(runtime, id)
{
	const ficha = runtime.objects.spriteFichaAnimal?.getFirstInstance();
	if (!ficha || !id) return;
	ficha.setAnimation(id);
	const sonido = sonidoDeFicha(id);
	runtime.globalVars.SONIDO = sonido.archivo;
	if (runtime.globalVars.SONIDO_CARPETA !== undefined)
		runtime.globalVars.SONIDO_CARPETA = sonido.carpeta;
	abierta = true;
	runtime.globalVars.FICHA = 1;
	if (runtime.globalVars.ALBUM !== 1) runtime.timeScale = 0;
	mostrarHud(runtime, true);
}

// El prefijo puede tener guion bajo (patagonia_oceano_ballena), así que se busca el prefijo conocido más largo.
export function sonidoDeFicha(id)
{
	const prefijos = [...new Set(Object.entries(REGIONES).flatMap(([clave, info]) =>
		[clave, info.fichaPrefijo, ...(info.etapas ?? []).map(e => e.fichaPrefijo)]).filter(Boolean))]
		.sort((a, b) => b.length - a.length);
	const prefijo = prefijos.find(p => id.startsWith(`${p}_`)) ?? region;
	const animal = id.startsWith(`${prefijo}_`) ? id.slice(prefijo.length + 1) : id;
	return {
		carpeta: carpetaSonidosDe(prefijo),
		archivo: SIN_SONIDO.has(id) ? "" : `sprite_sfx_${SONIDOS[animal] ?? animal}`
	};
}

export function cerrarFicha(runtime)
{
	if (!abierta) return false;
	abierta = false;
	runtime.globalVars.FICHA = 0;
	if (runtime.globalVars.ALBUM !== 1) runtime.timeScale = 1;
	mostrarHud(runtime, false);
	return true;
}

function mostrarHud(runtime, visible)
{
	for (const nombre of ["spriteVelo", "spriteFichaAnimal", "spriteSeguir"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = visible;
}

function aleatorio(semilla)
{
	let a = (semilla ^ 0x9E3779B9) >>> 0;
	return () => {
		a = (a + 0x6D2B79F5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), a | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function mezclar(lista, rnd)
{
	for (let i = lista.length - 1; i > 0; i--)
	{
		const k = Math.floor(rnd() * (i + 1));
		[lista[i], lista[k]] = [lista[k], lista[i]];
	}
	return lista;
}

// Cuando ya no quedan jaulas ni huidas y la ficha está cerrada: habilita la cueva como salida.
export function marcarListoParaCueva(runtime)
{
	if (listoParaCueva || saliendo || rescatados < 1) return;
	listoParaCueva = true;
	runtime.timeScale = 1;
}

export function laberintoListoParaCueva()
{
	return listoParaCueva;
}

// Cada tick: si el laberinto está completo y un personaje toca la cueva → siguiente pantalla.
export function actualizarSalidaLaberinto(runtime)
{
	if (!listoParaCueva || saliendo || abierta || runtime.globalVars.FICHA === 1) return;
	if (runtime.globalVars.GAMEOVER === 1 || runtime.globalVars.ALBUM === 1) return;

	const cueva = runtime.objects.spriteCueva?.getFirstInstance();
	if (!cueva) return;

	for (const nombre of ["spriteMafalda", "spriteDieguito"])
	{
		const quien = runtime.objects[nombre]?.getFirstInstance();
		if (quien && tocandoCueva(quien, cueva))
		{
			alCompletarLaberinto(runtime);
			return;
		}
	}
}

// Al entrar a la cueva: siguiente etapa, otro laberinto si faltan animales de la región,
// el mapa si la región quedó completa, o los títulos si están todas las regiones jugables completas.
export function alCompletarLaberinto(runtime)
{
	if (saliendo) return;
	saliendo = true;
	listoParaCueva = false;
	runtime.timeScale = 1;
	runtime.globalVars.SEMILLA = 0;

	const reg = claveRegion(runtime.globalVars.REGION || region);
	avanzarNivel();
	runtime.goToLayout(destinoAlCompletar(reg, getNivel(), coleccionActual()));
}

function tocandoCueva(quien, cueva)
{
	if (quien.testOverlap(cueva)) return true;
	const a = quien.getBoundingBox();
	const b = cueva.getBoundingBox();
	const m = 6;
	return a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m;
}
