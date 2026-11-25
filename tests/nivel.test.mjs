// Prueba el generador de laberintos (JS puro) sin abrir Construct.
// El cableado por región (layout, hoja, sprites) está en tests/region_*.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { generarMapa } from "../scripts/generadorLaberinto.js";
import { filasDe, contar } from "./lib/mapa.mjs";

test("la misma semilla da el mismo laberinto", () => {
	assert.equal(generarMapa({ jaulas: 3, semilla: 42 }), generarMapa({ jaulas: 3, semilla: 42 }));
	assert.notEqual(generarMapa({ jaulas: 3, semilla: 42 }), generarMapa({ jaulas: 3, semilla: 43 }));
});

test("jaulas fuera de 1–5 no se pueden pedir", () => {
	assert.throws(() => generarMapa({ jaulas: 0, semilla: 1 }), RangeError);
	assert.throws(() => generarMapa({ jaulas: 6, semilla: 1 }), RangeError);
	const filas = filasDe(generarMapa({ jaulas: 5, semilla: 1 }));
	assert.equal(contar(filas, "J"), 5);
	assert.equal(contar(filas, "L"), 5);
});
