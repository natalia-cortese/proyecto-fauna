import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ZONAS, HIT_ZONA, CARTA_ZONA, puntoEnHitbox } from "../scripts/inicio.js";
import { RAIZ, walk } from "./lib/c3.mjs";

function instanciasInicio()
{
	const layout = JSON.parse(readFileSync(join(RAIZ, "layouts", "Inicio.json"), "utf8"));
	const out = [];
	walk(layout, nodo => {
		if (!nodo.type || !nodo.world) return;
		if (!Object.prototype.hasOwnProperty.call(ZONAS, nodo.type)) return;
		out.push({ tipo: nodo.type, region: ZONAS[nodo.type], x: nodo.world.x, y: nodo.world.y });
	});
	return out;
}

test("cada región habilitada tiene una carta en Inicio", () => {
	const inst = instanciasInicio();
	for (const tipo of Object.keys(ZONAS))
		assert.ok(inst.some(i => i.tipo === tipo), `falta ${tipo} en layouts/Inicio.json`);
});

test("los hitboxes de zona no se solapan", () => {
	const inst = instanciasInicio();
	assert.ok(inst.length >= 2, "tiene que haber al menos dos zonas para chequear solape");
	for (let i = 0; i < inst.length; i++)
		for (let j = i + 1; j < inst.length; j++)
		{
			const a = inst[i], b = inst[j];
			const solapaX = Math.abs(a.x - b.x) < HIT_ZONA.w;
			const solapaY = Math.abs(a.y - b.y) < HIT_ZONA.h;
			assert.ok(!(solapaX && solapaY), `${a.region} y ${b.region} se pisan (hitbox ${HIT_ZONA.w}×${HIT_ZONA.h})`);
		}
});

test("el hitbox es más chico que la carta para poder agrandar al hover", () => {
	assert.ok(HIT_ZONA.w < CARTA_ZONA.w && HIT_ZONA.h < CARTA_ZONA.h);
	assert.ok(puntoEnHitbox(0, 0, 0, 0));
	assert.ok(!puntoEnHitbox(HIT_ZONA.w, 0, 0, 0));
});
