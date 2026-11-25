import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REGIONES_JUGABLES, idsDeRegion, regionCompleta, destinoAlCompletar } from "../scripts/regiones.js";
import { ZONAS, ZONAS_BLOQUEADAS, regionInicial, iconoDeRegion } from "../scripts/inicio.js";
import { regionEnMapa } from "../scripts/mapaRegiones.js";
import { RAIZ, cargarObjetos } from "./lib/c3.mjs";

const con = (...regiones) => new Set(regiones.flatMap(idsDeRegion));

test("las regiones jugables son las zonas habilitadas del mapa", () => {
	assert.deepEqual([...REGIONES_JUGABLES].sort(), Object.values(ZONAS).sort());
});

test("terminar un laberinto con animales pendientes sigue en la misma región", () => {
	assert.equal(destinoAlCompletar("puna", 2, con()), "LaberintoPuna");
	assert.equal(destinoAlCompletar("patagonia", 3, con("puna")), "LaberintoPatagonia");
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
