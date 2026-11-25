// Maneja a Mafalda y a Dieguito: con Espacio se elige a cuál se maneja con las flechas,
// el otro lo sigue con Pathfinding. También el salto de rocas, los cactus, las vidas, la honda de Dieguito
// y la pantalla de DESAFÍO PERDIDO al quedarse sin vidas (scripts/gameOver.js).

import { saltarRoca, estaSaltando, cancelarSalto, tocando } from "./saltoRoca.js";
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

let activo = "spriteMafalda";
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
	inicio = null;
	invulnerableHasta = 0;
	proximaBusqueda = 0;
	gameOver = false;
	runtime.globalVars.GAMEOVER = 0;
	if (runtime.globalVars.ALBUM !== undefined) runtime.globalVars.ALBUM = 0;
	runtime.globalVars.VIDAS = VIDAS_MAXIMAS;
	runtime.globalVars.LLAVES = 0;
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
	aplicarControl(runtime);
	escucharAlbumHud(runtime);
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
	if (cartelNivelActivo()) return;
	if (fichaAlbumAbierta()) { cerrarAlbum(runtime); return; }
	if (albumAbierto()) return;
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
	if (gameOver || cartelNivelActivo() || albumAbierto() || fichaAbierta() || activo !== "spriteDieguito" || !dieguito || estaSaltando(dieguito)) return;
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
		b["8Direction"].stop();
		b["8Direction"].isEnabled = manejado;
		b["8Direction"].isDefaultControls = manejado;
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = !manejado;
		if (b.ScrollTo) b.ScrollTo.isEnabled = manejado;
	}
}

let quitarAlbumHud = null;

function escucharAlbumHud(runtime)
{
	quitarAlbumHud?.();
	const alTocar = e => {
		if (!String(runtime.layout.name || "").startsWith("Laberinto")) return quitarAlbumHud?.();
		if (gameOver || fichaAbierta()) return;
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
	if (gameOver)
	{
		actualizarGameOver(runtime);
		return;
	}
	if (albumAbierto()) return;
	if (cartelNivelActivo()) return;
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
	actualizarSalidaLaberinto(runtime);
}


function seguir(runtime, inst, destino)
{
    const esOceano =
        runtime.globalVars.REGION === "patagonia_oceano";

    const FRENAR_EN = esOceano ? 150 : 70;
    const SEGUIR_DESDE = esOceano ? 190 : 90;

    const pf = inst.behaviors.Pathfinding;

    if (!pf || estaSaltando(inst)) return;

    const distancia = Math.hypot(
        destino.x - inst.x,
        destino.y - inst.y
    );

    if (distancia <= FRENAR_EN)
    {
        if (pf.isMoving) pf.stop();
        return;
    }

    if (
        distancia > SEGUIR_DESDE &&
        !pf.isCalculatingPath &&
        runtime.gameTime >= proximaBusqueda
    )
    {
        proximaBusqueda = runtime.gameTime + 0.5;

        pf.findPath(destino.x, destino.y).then(encontrado => {
            if (encontrado && pf.isEnabled)
                pf.startMoving();
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
