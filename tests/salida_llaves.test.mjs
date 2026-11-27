import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { posicionSalida, iniciarSalidaCueva, actualizarSalidaCueva, saliendoPorCueva, reiniciarSalidaCueva } from "../scripts/salidaCueva.js";
import { RAIZ, cargarObjetos } from "./lib/c3.mjs";

const chico = { x0: 100, y0: 300 };

test("al empezar la salida el chico sigue donde estaba y visible", () => {
	const p = posicionSalida(chico, 0, 500, 200);
	assert.deepEqual([p.x, p.y, p.escala, p.opacidad], [100, 300, 1, 1]);
});

test("al terminar la salida el chico quedó en la boca de la cueva, chico e invisible", () => {
	const p = posicionSalida(chico, 5, 500, 200);
	assert.equal(p.x, 500);
	assert.ok(p.y < 200);
	assert.ok(p.escala < 0.5);
	assert.equal(p.opacidad, 0);
});

function instancia(x, y)
{
	return {
		x, y, width: 96, height: 96, opacity: 1, isVisible: true,
		behaviors: {}, moveToTop() {}
	};
}

test("la salida congela a los chicos y recién al final pasa de pantalla", () => {
	reiniciarSalidaCueva();
	const mafalda = instancia(100, 300);
	const dieguito = instancia(60, 300);
	const runtime = {
		dt: 0.1,
		objects: {
			spriteMafalda: { getFirstInstance: () => mafalda },
			spriteDieguito: { getFirstInstance: () => dieguito }
		}
	};
	let pasadas = 0;
	iniciarSalidaCueva(runtime, { x: 400, y: 300, width: 200, height: 150 }, "spriteMafalda", () => pasadas++);
	assert.ok(saliendoPorCueva());
	actualizarSalidaCueva(runtime);
	assert.equal(pasadas, 0);
	for (let i = 0; i < 40; i++) actualizarSalidaCueva(runtime);
	assert.equal(pasadas, 1);
	assert.equal(mafalda.opacity, 0);
	assert.equal(dieguito.opacity, 0);
	reiniciarSalidaCueva();
	assert.ok(!saliendoPorCueva());
});

test("el contador de llaves tiene un cuadro por cantidad y está en el HUD de cada laberinto", () => {
	const obj = cargarObjetos().get("spriteContadorLlaves");
	assert.ok(obj?.animaciones.includes("llaves"));
	for (const nombre of ["LaberintoPuna", "LaberintoPatagonia", "LaberintoPatagoniaOceano"])
	{
		const layout = JSON.parse(readFileSync(join(RAIZ, "layouts", `${nombre}.json`), "utf8"));
		const hud = layout.layers.find(l => l.name === "HUD");
		assert.ok(hud.instances.some(i => i.type === "spriteContadorLlaves"), `${nombre} sin contador`);
	}
	const def = JSON.parse(readFileSync(join(RAIZ, "objectTypes", "interfaz", "spriteContadorLlaves.json"), "utf8"));
	assert.equal(def.animations.items[0].frames.length, 10);
});
