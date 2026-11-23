// Ficha del animal rescatado: aparece en grande cuando termina la animación de huida de una jaula.
// El juego queda en pausa hasta que se aprieta Espacio o Enter.
//
// Cada ficha es una animación de spriteFichaAnimal llamada region_animal, en minúscula y sin tildes
// (por ejemplo puna_vicuna). Para sumar un animal: agregá la animación en Construct y su nombre acá,
// en la lista de su región. Cada laberinto sortea, según su semilla, qué animales de su región están en sus jaulas.
//
// Al abrirse la ficha suena el sonido del animal: el archivo sprite_sfx_NOA_<animal> de la carpeta sounds
// (la hoja de eventos lo reproduce con la variable SONIDO). SONIDOS sirve para un animal cuyo archivo se llama distinto.

import { agregarAnimal, tieneTodos } from "./album.js";

export const ANIMALES = {
	puna: ["vicuna", "zorro_andino", "condor", "flamenco", "gato_andino", "guanaco", "puma", "taruca"],
	chaco: ["quirquincho_bola"]
};

const SONIDOS = {
	quirquincho_bola: "quirquincho"
};

let region = "puna";
let orden = [...ANIMALES.puna];
let rescatados = 0;
let abierta = false;

export function reiniciarFichas(runtime)
{
	rescatados = 0;
	abierta = false;
	runtime.globalVars.FICHA = 0;
	runtime.timeScale = 1;
	mostrarHud(runtime, false);
	for (const huida of runtime.objects.spriteHuida?.getAllInstances() ?? [])
		huida.destroy();
}

export function elegirAnimales(nuevaRegion, semilla, jaulas)
{
	if (!ANIMALES[nuevaRegion]?.length) throw new RangeError(`No hay animales para la región "${nuevaRegion}"`);
	if (ANIMALES[nuevaRegion].length < jaulas)
		console.warn(`La región "${nuevaRegion}" tiene ${ANIMALES[nuevaRegion].length} animales para ${jaulas} jaulas: se van a repetir.`);
	region = nuevaRegion;
	const rnd = aleatorio(semilla);
	orden = [];
	while (orden.length < jaulas)
		orden.push(...mezclar([...ANIMALES[region]], rnd));
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
	const animalKey = id.includes("_") ? id.slice(id.indexOf("_") + 1) : id;
	ficha.setAnimation(id);
	runtime.globalVars.SONIDO = `sprite_sfx_NOA_${SONIDOS[animalKey] ?? animalKey}`;
	abierta = true;
	runtime.globalVars.FICHA = 1;
	if (runtime.globalVars.ALBUM !== 1) runtime.timeScale = 0;
	mostrarHud(runtime, true);
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

// Al abrir todas las jaulas: si el álbum ya tiene todos los animales de la región → títulos;
// si no, otro laberinto.
export function alCompletarLaberinto(runtime)
{
	runtime.globalVars.SEMILLA = 0;
	const reg = runtime.globalVars.REGION || region;
	const ids = (ANIMALES[reg] ?? []).map(a => `${reg}_${a}`);
	if (tieneTodos(ids))
		runtime.goToLayout("EndGame");
	else
		runtime.goToLayout("Laberinto");
}
