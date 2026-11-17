// Ficha del animal rescatado: aparece en grande cuando termina la animación de huida de una jaula.
// El juego queda en pausa hasta que se aprieta Espacio o Enter.
//
// Cada ficha es una animación de spriteFichaAnimal llamada region_animal, en minúscula y sin tildes
// (por ejemplo puna_vicuna). Para sumar un animal: agregá la animación en Construct y su nombre acá,
// en la lista de su región. Cada laberinto sortea, según su semilla, qué animales de su región están en sus jaulas.

export const ANIMALES = {
	puna: ["vicuna", "zorro_andino"],
	chaco: ["quirquincho_bola"]
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
	// La huida que está en el layout es solo el modelo para crear las demás: si terminara su animación abriría una ficha.
	for (const huida of runtime.objects.spriteHuida?.getAllInstances() ?? [])
		huida.destroy();
}

// Sortea un animal por jaula: sin repetir mientras alcancen; si la región tiene menos animales que jaulas, se repiten.
export function elegirAnimales(nuevaRegion, semilla, jaulas)
{
	if (!ANIMALES[nuevaRegion]?.length) throw new RangeError(`No hay animales para la región "${nuevaRegion}"`);
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
	const ficha = runtime.objects.spriteFichaAnimal?.getFirstInstance();
	if (!ficha) return;
	ficha.setAnimation(`${region}_${orden[rescatados % orden.length]}`);
	rescatados++;
	abierta = true;
	runtime.globalVars.FICHA = 1;
	runtime.timeScale = 0;
	mostrarHud(runtime, true);
}

export function cerrarFicha(runtime)
{
	if (!abierta) return false;
	abierta = false;
	runtime.globalVars.FICHA = 0;
	runtime.timeScale = 1;
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
	// Distinto del generador del laberinto, para que el sorteo no copie sus decisiones.
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
