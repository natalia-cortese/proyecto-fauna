// Maneja a Mafalda y a Dieguito: con Espacio se elige a cuál se maneja con las flechas,
// el otro lo sigue con Pathfinding. También el salto de rocas, los cactus, las vidas, la honda de Dieguito
// y la pantalla de DESAFÍO PERDIDO al quedarse sin vidas (scripts/gameOver.js).

import { saltarRoca, estaSaltando, cancelarSalto, tocando } from "./saltoRoca.js";
import { mantenerTamanosLaberinto } from "./construirLaberinto.js";
import { revelarNiebla } from "./niebla.js";
import { actualizarCazadores } from "./cazadores.js";
import { reiniciarFichas, fichaAbierta, cerrarFicha, abrirFichaId, actualizarSalidaLaberinto } from "./fichas.js";
import { reiniciarHonda, dispararHonda, actualizarHonda } from "./honda.js";
import { actualizarCartelJaula } from "./cartelJaula.js";
import { mostrarGameOver, ocultarGameOver, actualizarGameOver } from "./gameOver.js";
import {
	abrirAlbum, cerrarAlbum, albumAbierto, fichaAlbumAbierta, tocarBotonAlbum,
	configurarAlbum, getJugador, setJugador
} from "./album.js";
import { iniciarSonido, alternarSonido, tocarBotonSonido } from "./sonido.js";
import { cartelNivelActivo, actualizarCartelNivel } from "./nivel.js";
import { saliendoPorCueva, actualizarSalidaCueva, reiniciarSalidaCueva } from "./salidaCueva.js";

export const VIDAS_MAXIMAS = 3;
//const SEGUIR_DESDE = 90;
//const FRENAR_EN = 70;
const INVULNERABLE = 1.5;

const FLECHAS = [
	["ArrowRight", 1, 0],
	["ArrowLeft", -1, 0],
	["ArrowDown", 0, 1],
	["ArrowUp", 0, -1]
];

const FRENAR_EN = 56;
const PASO_RASTRO = 8;
const MAX_RASTRO = 600;
const VELOCIDAD_SEGUIR = 210;

let activo = "spriteMafalda";
let rastro = [];
let inicio = null;
let invulnerableHasta = 0;
let proximaBusqueda = 0;
let gameOver = false;
const xAnterior = new WeakMap();

const personaje = (runtime, nombre) => runtime.objects[nombre]?.getFirstInstance();
const otroNombre = nombre => nombre === "spriteMafalda" ? "spriteDieguito" : "spriteMafalda";

export function iniciarPersonajes(runtime)
{
	activo = "spriteMafalda";
	rastro = [];
	inicio = null;
	invulnerableHasta = 0;
	proximaBusqueda = 0;
	gameOver = false;
	runtime.globalVars.GAMEOVER = 0;
	if (runtime.globalVars.ALBUM !== undefined) runtime.globalVars.ALBUM = 0;
	runtime.globalVars.VIDAS = VIDAS_MAXIMAS;
	runtime.globalVars.LLAVES = 0;
	reiniciarSalidaCueva();
	if (runtime.globalVars.JUGADOR) setJugador(runtime.globalVars.JUGADOR);
	configurarAlbum(
		(rt, id) => abrirFichaId(rt, id),
		(rt) => cerrarFicha(rt)
	);
	reiniciarFichas(runtime);
	reiniciarHonda(runtime);
	ocultarGameOver(runtime);
	cerrarAlbum(runtime, true);
	iniciarSonido(runtime);
	runtime.timeScale = 1;
	for (const nombre of ["spriteMafalda_Patagonia_Oceano", "spriteDieguito_Patagonia_Oceano"])
		for (const inst of [...(runtime.objects[nombre]?.getAllInstances() ?? [])])
			inst.destroy();
	aplicarControl(runtime);
	escucharAlbumHud(runtime);
	try
	{
		runtime.objects.textNombre?.getFirstInstance()?.blur?.();
		(typeof document !== "undefined" ? document.activeElement : null)?.blur?.();
		(runtime.canvas ?? runtime.getElement?.())?.focus?.();
	}
	catch {}
}

// Con la pantalla de GAME OVER: Espacio o Enter vuelven a jugar el mismo laberinto y Esc vuelve al mapa de Inicio.
export function reintentar(runtime)
{
	if (!gameOver) return false;
	gameOver = false;
	runtime.globalVars.GAMEOVER = 0;
	ocultarGameOver(runtime);
	runtime.goToLayout(runtime.layout.name);
	return true;
}

export function volverAlInicio(runtime)
{
	if (!gameOver) return false;
	gameOver = false;
	runtime.globalVars.GAMEOVER = 0;
	ocultarGameOver(runtime);
	runtime.goToLayout("Inicio");
	return true;
}

export function cambiarPersonaje(runtime)
{
	if (reintentar(runtime)) return;
	if (fichaAlbumAbierta()) { cerrarAlbum(runtime); return; }
	if (albumAbierto() || saliendoPorCueva()) return;
	if (cerrarFicha(runtime)) return;
	const actual = personaje(runtime, activo);
	const otro = personaje(runtime, otroNombre(activo));
	if (!actual || !otro || estaSaltando(actual)) return;
	activo = otroNombre(activo);
	rastro = [];
	aplicarControl(runtime);
	actualizarMarcador(runtime, otro);
}

export function disparar(runtime)
{
	const dieguito = personaje(runtime, "spriteDieguito");
	if (gameOver || saliendoPorCueva() || cartelNivelActivo() || albumAbierto() || fichaAbierta() || activo !== "spriteDieguito" || !dieguito || estaSaltando(dieguito)) return;
	dispararHonda(runtime, dieguito);
}

export function manejarEscape(runtime)
{
	if (fichaAlbumAbierta() || albumAbierto()) return cerrarAlbum(runtime);
	return volverAlInicio(runtime);
}

export function manejarEnter(runtime)
{
	if (reintentar(runtime)) return;
	if (fichaAlbumAbierta()) { cerrarAlbum(runtime); return; }
	cerrarFicha(runtime);
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
		const dir = b["8Direction"];
		if (dir)
		{
			dir.stop();
			dir.isEnabled = manejado;
			dir.isDefaultControls = manejado;
		}
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = false;
		if (b.ScrollTo) b.ScrollTo.isEnabled = manejado;
	}
}

let quitarAlbumHud = null;

function escucharAlbumHud(runtime)
{
	quitarAlbumHud?.();
	const alTocar = e => {
		if (!String(runtime.layout.name || "").startsWith("Laberinto")) return quitarAlbumHud?.();
		if (gameOver || fichaAbierta() || saliendoPorCueva()) return;
		const capa = runtime.layout.getLayer("HUD");
		if (!capa) return;
		const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);
		if (tocarBotonSonido(runtime, x, y))
			return void alternarSonido(runtime);
		if (albumAbierto()) return;
		if (tocarBotonAlbum(runtime, x, y) && getJugador())
		{
			abrirAlbum(runtime);
			runtime.timeScale = 0;
		}
	};
	runtime.addEventListener("pointerdown", alTocar);
	quitarAlbumHud = () => { runtime.removeEventListener("pointerdown", alTocar); quitarAlbumHud = null; };
}

export function actualizarPersonajes(runtime)
{
	actualizarCartelNivel(runtime);
	mantenerTamanosLaberinto();
	const actual = personaje(runtime, activo);
	const otro = personaje(runtime, otroNombre(activo));
	revelarNiebla(runtime, [actual, otro].filter(Boolean));
	actualizarLlaves(runtime);
	if (gameOver)
	{
		actualizarGameOver(runtime);
		return;
	}
	if (saliendoPorCueva())
	{
		actualizarCazadores(runtime, null);
		actualizarSalidaCueva(runtime);
		return;
	}
	if (otro) seguir(runtime, otro, actual);
	if (actual) actualizarMarcador(runtime, actual);
	if (actualizarCazadores(runtime, actual)) perderVida(runtime);
	if (albumAbierto()) return;
	if (cartelNivelActivo()) return;
	if (!actual || fichaAbierta()) return;

	if (!inicio)
		inicio = { mafalda: posicion(personaje(runtime, "spriteMafalda")), dieguito: posicion(personaje(runtime, "spriteDieguito")) };

	if (!estaSaltando(actual) && runtime.keyboard)
	{
		const apretadas = FLECHAS.filter(([tecla]) => runtime.keyboard.isKeyDown(tecla));
		for (const [, dx, dy] of apretadas)
		{
			if (runtime.objects.spritePeligro && tocando(runtime.objects.spritePeligro, actual, dx, dy))
			{
				perderVida(runtime);
				break;
			}
			if (apretadas.length === 1 && saltarRoca(runtime, actual, dx, dy)) break;
		}
	}

	actualizarHonda(runtime, personaje(runtime, "spriteDieguito"), activo === "spriteDieguito");

	const parpadeo = runtime.gameTime < invulnerableHasta && Math.floor(runtime.gameTime * 10) % 2 === 0;
	for (const inst of [actual, otro])
	{
		if (!inst) continue;
		mirarSegunMovimiento(inst);
		inst.opacity = parpadeo ? 0.35 : 1;
	}

	actualizarCartelJaula(runtime, actual, activo === "spriteMafalda");
	actualizarCorazones(runtime);
	for (const ayuda of runtime.objects.spriteAyudaHonda?.getAllInstances() ?? [])
		ayuda.isVisible = activo === "spriteDieguito";
	actualizarSalidaLaberinto(runtime);
}


// El que no se maneja camina por las pisadas del manejado, así nunca atraviesa muros.
function dejarPisada(destino)
{
	const ultima = rastro[rastro.length - 1];
	if (ultima && Math.hypot(destino.x - ultima[0], destino.y - ultima[1]) < PASO_RASTRO) return;
	rastro.push([destino.x, destino.y]);
	if (rastro.length > MAX_RASTRO) rastro.shift();
}

function seguir(runtime, inst, destino)
{
	if (!inst || !destino || estaSaltando(inst)) return;
	dejarPisada(destino);
	if (Math.hypot(destino.x - inst.x, destino.y - inst.y) <= FRENAR_EN) return;

	let avance = VELOCIDAD_SEGUIR * runtime.dt;
	while (avance > 0 && rastro.length)
	{
		const [px, py] = rastro[0];
		const d = Math.hypot(px - inst.x, py - inst.y);
		if (d <= avance)
		{
			inst.x = px;
			inst.y = py;
			avance -= d;
			rastro.shift();
		}
		else
		{
			inst.x += (px - inst.x) / d * avance;
			inst.y += (py - inst.y) / d * avance;
			avance = 0;
		}
		if (Math.hypot(destino.x - inst.x, destino.y - inst.y) <= FRENAR_EN) break;
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

	if (runtime.globalVars.VIDAS <= 0 && runtime.objects.spriteGameOverFondo?.getFirstInstance())
	{
		terminarPartida(runtime);
		return;
	}
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
	rastro = [];
	aplicarControl(runtime);
}

function terminarPartida(runtime)
{
	gameOver = true;
	runtime.globalVars.GAMEOVER = 1;
	// timeScale queda en 1 para que se anime spriteSinVidas; el flag gameOver frena el resto.
	actualizarCorazones(runtime);
	for (const nombre of ["spriteMafalda", "spriteDieguito"])
	{
		const inst = personaje(runtime, nombre);
		if (!inst) continue;
		const b = inst.behaviors;
		b["8Direction"]?.stop();
		if (b["8Direction"]) b["8Direction"].isEnabled = false;
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = false;
		if (b.ScrollTo) b.ScrollTo.isEnabled = false;
	}
	for (const nombre of ["spriteAyudaHonda", "spriteCartelJaula", "spriteMarcador", "spriteBotonAlbum"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = false;
	if (albumAbierto()) cerrarAlbum(runtime, true);
	mostrarGameOver(runtime, reintentar, volverAlInicio);
}

function posicion(inst)
{
	return inst ? [inst.x, inst.y] : null;
}

function actualizarMarcador(runtime, actual)
{
	const marcador = runtime.objects.spriteMarcador?.getFirstInstance();
	if (!marcador || !actual) return;
	marcador.isVisible = true;
	marcador.x = actual.x;
	marcador.y = actual.getBoundingBox().top - 18 + Math.sin(runtime.gameTime * 6) * 4;
	marcador.moveToTop();
}

function actualizarLlaves(runtime)
{
	const contador = runtime.objects.spriteContadorLlaves?.getFirstInstance();
	if (!contador) return;
	const llaves = Math.max(0, Math.min(9, runtime.globalVars.LLAVES | 0));
	if (contador.animationFrame !== llaves) contador.animationFrame = llaves;
}

function actualizarCorazones(runtime)
{
	const corazones = runtime.objects.spriteCorazon?.getAllInstances() ?? [];
	corazones
		.sort((a, b) => a.x - b.x)
		.forEach((c, i) => { c.animationFrame = i < runtime.globalVars.VIDAS ? 0 : 1; });
}
