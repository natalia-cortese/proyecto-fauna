// La honda de Dieguito: mientras se lo maneja, X tira una piedrita hacia donde camina.
// La piedrita vuela por encima de las rocas, se frena en muros y cactus, y derriba al cazador que toque.

import { golpearCazador } from "./cazadores.js";
import { avisarGolpeCazador } from "./sonido.js";
import { direccionApretada } from "./controlesTactiles.js";

const VELOCIDAD = 520;
const ALCANCE = 420;
const ESPERA = 0.5;
const SALIDA = 28;

const FLECHAS = [
	["ArrowRight", 1, 0],
	["ArrowLeft", -1, 0],
	["ArrowDown", 0, 1],
	["ArrowUp", 0, -1]
];

let mirada = [1, 0];
let listoEn = 0;
const vuelo = new WeakMap();
let restaurarGolpeEn = 0;

export function reiniciarHonda(runtime)
{
	mirada = [1, 0];
	listoEn = 0;
	restaurarGolpeEn = 0;
	if (runtime.globalVars.GOLPE_CAZADOR !== undefined) runtime.globalVars.GOLPE_CAZADOR = 0;
	for (const p of runtime.objects.spritePiedrita?.getAllInstances() ?? [])
		p.destroy();
}

export function dispararHonda(runtime, tirador)
{
	const tipo = runtime.objects.spritePiedrita;
	if (!tipo || !tirador || runtime.gameTime < listoEn) return false;
	listoEn = runtime.gameTime + ESPERA;

	const [dx, dy] = mirada;
	const p = tipo.createInstance(tirador.layer.name, tirador.x + dx * SALIDA, tirador.y - 8 + dy * SALIDA);
	vuelo.set(p, { dx, dy, recorrido: 0 });
	return true;
}

// Actualiza hacia dónde mira Dieguito (si se lo maneja) y mueve las piedritas en vuelo.
export function actualizarHonda(runtime, tirador, manejado)
{
	if (restaurarGolpeEn && runtime.gameTime >= restaurarGolpeEn)
	{
		restaurarGolpeEn = 0;
		if (runtime.globalVars.GOLPE_CAZADOR !== undefined) runtime.globalVars.GOLPE_CAZADOR = 0;
	}

	if (tirador && manejado)
	{
		const apretada = FLECHAS.find(([tecla]) => direccionApretada(runtime, tecla));
		if (apretada) mirada = [apretada[1], apretada[2]];
	}
	if (tirador && !manejado) mirada = [Math.sign(tirador.width) || 1, 0];

	const cazadores = runtime.objects.spriteCazador?.getAllInstances() ?? [];
	for (const p of runtime.objects.spritePiedrita?.getAllInstances() ?? [])
	{
		const v = vuelo.get(p);
		if (!v) continue;
		const paso = VELOCIDAD * runtime.dt;
		p.x += v.dx * paso;
		p.y += v.dy * paso;
		p.angleDegrees += 720 * runtime.dt;
		v.recorrido += paso;

		const cazador = cazadores.find(c => p.testOverlap(c));
		if (cazador && golpearCazador(cazador))
		{
			avisarGolpeCazador(runtime);
			restaurarGolpeEn = runtime.gameTime + 0.4;
			p.destroy();
			continue;
		}
		const solido = p.testOverlapSolid();
		if (v.recorrido >= ALCANCE || (solido && solido.objectType.name !== "spriteObstaculo"))
			p.destroy();
	}
}
