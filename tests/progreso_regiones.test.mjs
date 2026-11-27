import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	REGIONES_JUGABLES, idsDeRegion, regionCompleta, destinoAlCompletar, siguienteEtapa, primeraEtapaPendiente
} from "../scripts/regiones.js";
import { ZONAS, ZONAS_BLOQUEADAS, regionInicial, iconoDeRegion } from "../scripts/inicio.js";
import { regionEnMapa } from "../scripts/mapaRegiones.js";
import { RAIZ, cargarObjetos } from "./lib/c3.mjs";

const con = (...regiones) => new Set(regiones.flatMap(idsDeRegion));

test("las regiones jugables son las zonas habilitadas del mapa", () => {
	assert.deepEqual([...REGIONES_JUGABLES].sort(), Object.values(ZONAS).sort());
});

test("terminar un laberinto con animales pendientes sigue en la misma región", () => {
	assert.equal(destinoAlCompletar("puna", 2, con()), "LaberintoPuna");
	assert.equal(destinoAlCompletar("puna", 5, con()), "LaberintoPuna");
});

const oceano = id => id.startsWith("patagonia_oceano_");
const soloDe = filtro => new Set(idsDeRegion("patagonia").filter(filtro));

test("después de la primera vuelta Patagonia alterna entre las etapas con animales pendientes", () => {
	assert.equal(destinoAlCompletar("patagonia", 3, con(), 2), "LaberintoPatagoniaOceano");
	assert.equal(destinoAlCompletar("patagonia", 4, con(), 1), "LaberintoPatagonia");
});

test("si una etapa ya está completa, Patagonia vuelve a la que le faltan animales", () => {
	// Tierra completa y faltan animales del océano: no se queda en tierra para siempre.
	const tierraCompleta = soloDe(id => !oceano(id));
	assert.equal(destinoAlCompletar("patagonia", 3, tierraCompleta, 2), "LaberintoPatagoniaOceano");
	assert.equal(siguienteEtapa("patagonia", 4, 1, tierraCompleta), 1);
	const oceanoCompleto = soloDe(oceano);
	assert.equal(destinoAlCompletar("patagonia", 3, oceanoCompleto, 2), "LaberintoPatagonia");
});

test("desde el mapa se entra por la primera etapa con animales pendientes", () => {
	assert.equal(primeraEtapaPendiente("patagonia", con()), 1);
	assert.equal(primeraEtapaPendiente("patagonia", soloDe(oceano)), 2);
	assert.equal(primeraEtapaPendiente("patagonia", con("patagonia")), 1);
	assert.equal(primeraEtapaPendiente("puna", con()), 1);
});

test("Patagonia pasa del océano a tierra aunque ya estén los animales", () => {
	assert.equal(destinoAlCompletar("patagonia", 2, con("patagonia")), "LaberintoPatagonia");
});

test("una región completa vuelve al mapa si falta otra", () => {
	assert.equal(destinoAlCompletar("puna", 2, con("puna")), "Inicio");
	assert.equal(destinoAlCompletar("patagonia", 3, con("patagonia")), "Inicio");
});

test("con todas las regiones jugables completas va a la pantalla final", () => {
	assert.equal(destinoAlCompletar("puna", 2, con("puna", "patagonia")), "EndGame");
	assert.equal(destinoAlCompletar("patagonia", 3, con("puna", "patagonia")), "EndGame");
});

test("Patagonia solo está completa con los animales del océano y de tierra", () => {
	const soloOceano = new Set(idsDeRegion("patagonia").filter(id => id.startsWith("patagonia_oceano_")));
	assert.ok(!regionCompleta("patagonia", soloOceano));
	assert.ok(regionCompleta("patagonia", con("patagonia")));
});

test("el mapa muestra check en las completas y candado en las no habilitadas", () => {
	assert.equal(iconoDeRegion("puna", con("puna")), "check");
	assert.equal(iconoDeRegion("patagonia", con("puna")), "");
	for (const region of Object.values(ZONAS_BLOQUEADAS))
		assert.equal(iconoDeRegion(region, con()), "candado");
});

test("al volver al mapa queda elegida una región que falta completar", () => {
	assert.equal(regionInicial("puna", con("puna")), "patagonia");
	assert.equal(regionInicial("patagonia", con()), "patagonia");
	assert.equal(regionInicial("", con()), "");
});

test("hay un spriteIconoRegion sobre cada región del mapa", () => {
	const iconos = cargarObjetos().get("spriteIconoRegion");
	assert.ok(iconos?.animaciones.includes("check") && iconos.animaciones.includes("candado"));
	const layout = JSON.parse(readFileSync(join(RAIZ, "layouts", "Inicio.json"), "utf8"));
	const regiones = layout.layers[0].instances
		.filter(i => i.type === "spriteIconoRegion")
		.map(i => regionEnMapa(i.world.x, i.world.y))
		.sort();
	assert.deepEqual(regiones, [...Object.values(ZONAS), ...Object.values(ZONAS_BLOQUEADAS)].sort());
});
