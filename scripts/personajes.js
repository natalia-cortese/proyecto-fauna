// Maneja a Mafalda y a Dieguito: con Espacio se elige a cuál se maneja con las flechas,
// el otro lo sigue con Pathfinding. También el salto de rocas, los cactus, las vidas y la honda de Dieguito.

import { saltarRoca, estaSaltando, cancelarSalto, tocando } from "./saltoRoca.js";
import { revelarNiebla } from "./niebla.js";
import { actualizarCazadores } from "./cazadores.js";
import { reiniciarFichas, fichaAbierta, cerrarFicha } from "./fichas.js";
import { reiniciarHonda, dispararHonda, actualizarHonda } from "./honda.js";
import { actualizarCartelJaula } from "./cartelJaula.js";

export const VIDAS_MAXIMAS = 3;
const SEGUIR_DESDE = 90;
const FRENAR_EN = 70;
const INVULNERABLE = 1.5;

const FLECHAS = [
	["ArrowRight", 1, 0],
	["ArrowLeft", -1, 0],
	["ArrowDown", 0, 1],
	["ArrowUp", 0, -1]
];

let activo = "spriteMafalda";
let inicio = null;
let invulnerableHasta = 0;
let proximaBusqueda = 0;
const xAnterior = new WeakMap();

const personaje = (runtime, nombre) => runtime.objects[nombre]?.getFirstInstance();
const otroNombre = nombre => nombre === "spriteMafalda" ? "spriteDieguito" : "spriteMafalda";

export function iniciarPersonajes(runtime)
{
	activo = "spriteMafalda";
	inicio = null;
	invulnerableHasta = 0;
	proximaBusqueda = 0;
	runtime.globalVars.VIDAS = VIDAS_MAXIMAS;
	runtime.globalVars.LLAVES = 0;
	reiniciarFichas(runtime);
	reiniciarHonda(runtime);
	aplicarControl(runtime);
}

export function cambiarPersonaje(runtime)
{
	if (cerrarFicha(runtime)) return;
	const actual = personaje(runtime, activo);
	const otro = personaje(runtime, otroNombre(activo));
	if (!actual || !otro || estaSaltando(actual)) return;
	activo = otroNombre(activo);
	aplicarControl(runtime);
}

export function disparar(runtime)
{
	const dieguito = personaje(runtime, "spriteDieguito");
	if (fichaAbierta() || activo !== "spriteDieguito" || !dieguito || estaSaltando(dieguito)) return;
	dispararHonda(runtime, dieguito);
}

function aplicarControl(runtime)
{
	runtime.globalVars.PERSONAJE = activo === "spriteMafalda" ? "Mafalda" : "Dieguito";
	for (const nombre of ["spriteMafalda", "spriteDieguito"])
	{
		const inst = personaje(runtime, nombre);
		if (!inst) continue;
		const manejado = nombre === activo;
		const b = inst.behaviors;
		b["8Direction"].stop();
		b["8Direction"].isEnabled = manejado;
		b["8Direction"].isDefaultControls = manejado;
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = !manejado;
		if (b.ScrollTo) b.ScrollTo.isEnabled = manejado;
	}
}

export function actualizarPersonajes(runtime)
{
	const actual = personaje(runtime, activo);
	const otro = personaje(runtime, otroNombre(activo));
	if (!actual || fichaAbierta()) return;

	if (!inicio)
		inicio = { mafalda: posicion(personaje(runtime, "spriteMafalda")), dieguito: posicion(personaje(runtime, "spriteDieguito")) };

	if (!estaSaltando(actual) && runtime.keyboard)
	{
		const apretadas = FLECHAS.filter(([tecla]) => runtime.keyboard.isKeyDown(tecla));
		for (const [, dx, dy] of apretadas)
		{
			if (runtime.objects.spriteSaguaro && tocando(runtime.objects.spriteSaguaro, actual, dx, dy))
			{
				perderVida(runtime);
				break;
			}
			if (apretadas.length === 1 && saltarRoca(runtime, actual, dx, dy)) break;
		}
	}

	if (actualizarCazadores(runtime, actual)) perderVida(runtime);
	actualizarHonda(runtime, personaje(runtime, "spriteDieguito"), activo === "spriteDieguito");

	if (otro) seguir(runtime, otro, actual);

	const parpadeo = runtime.gameTime < invulnerableHasta && Math.floor(runtime.gameTime * 10) % 2 === 0;
	for (const inst of [actual, otro])
	{
		if (!inst) continue;
		mirarSegunMovimiento(inst);
		inst.opacity = parpadeo ? 0.35 : 1;
	}

	actualizarMarcador(runtime, actual);
	actualizarCartelJaula(runtime, actual, activo === "spriteMafalda");
	actualizarCorazones(runtime);
	for (const ayuda of runtime.objects.spriteAyudaHonda?.getAllInstances() ?? [])
		ayuda.isVisible = activo === "spriteDieguito";
	revelarNiebla(runtime, [actual, otro].filter(Boolean));
}

function seguir(runtime, inst, destino)
{
	const pf = inst.behaviors.Pathfinding;
	if (!pf || estaSaltando(inst)) return;
	const distancia = Math.hypot(destino.x - inst.x, destino.y - inst.y);
	if (distancia <= FRENAR_EN)
	{
		if (pf.isMoving) pf.stop();
		return;
	}
	if (distancia > SEGUIR_DESDE && !pf.isCalculatingPath && runtime.gameTime >= proximaBusqueda)
	{
		proximaBusqueda = runtime.gameTime + 0.5;
		pf.findPath(destino.x, destino.y).then(encontrado => {
			if (encontrado && pf.isEnabled) pf.startMoving();
		});
	}
}

function mirarSegunMovimiento(inst)
{
	const antes = xAnterior.get(inst) ?? inst.x;
	const dx = inst.x - antes;
	xAnterior.set(inst, inst.x);
	// Los dibujos miran a la derecha; ancho negativo es espejado.
	if (dx > 0.5) inst.width = Math.abs(inst.width);
	else if (dx < -0.5) inst.width = -Math.abs(inst.width);
}

function perderVida(runtime)
{
	if (runtime.gameTime < invulnerableHasta) return;
	runtime.globalVars.VIDAS -= 1;

	if (runtime.globalVars.VIDAS <= 0 || !inicio)
	{
		runtime.goToLayout(runtime.layout.name);
		return;
	}

	invulnerableHasta = runtime.gameTime + INVULNERABLE;
	for (const [nombre, pos] of [["spriteMafalda", inicio.mafalda], ["spriteDieguito", inicio.dieguito]])
	{
		const inst = personaje(runtime, nombre);
		if (!inst || !pos) continue;
		cancelarSalto(inst);
		inst.x = pos[0];
		inst.y = pos[1];
		xAnterior.set(inst, inst.x);
	}
	aplicarControl(runtime);
}

function posicion(inst)
{
	return inst ? [inst.x, inst.y] : null;
}

function actualizarMarcador(runtime, actual)
{
	const marcador = runtime.objects.spriteMarcador?.getFirstInstance();
	if (!marcador) return;
	marcador.x = actual.x;
	marcador.y = actual.getBoundingBox().top - 18 + Math.sin(runtime.gameTime * 6) * 4;
}

function actualizarCorazones(runtime)
{
	const corazones = runtime.objects.spriteCorazon?.getAllInstances() ?? [];
	corazones
		.sort((a, b) => a.x - b.x)
		.forEach((c, i) => { c.animationFrame = i < runtime.globalVars.VIDAS ? 0 : 1; });
}
