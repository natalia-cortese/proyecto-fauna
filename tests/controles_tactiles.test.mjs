import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { iniciarControlesTactiles, actualizarControlesTactiles, direccionApretada } from "../scripts/controlesTactiles.js";
import { RAIZ, cargarObjetos } from "./lib/c3.mjs";

const POS = { arriba: [165, 745], abajo: [165, 965], izquierda: [55, 855], derecha: [275, 855], cambiar: [955, 850], honda: [830, 950] };

function crearRuntime()
{
	const escuchas = {};
	const botones = Object.entries(POS).map(([nombre, [x, y]]) => ({
		animationName: nombre, isVisible: false, opacity: 1,
		containsPoint: (px, py) => Math.abs(px - x) < 44 && Math.abs(py - y) < 44
	}));
	const simulados = [];
	const manejado = { behaviors: { "8Direction": { isEnabled: true, simulateControl: c => simulados.push(c) } } };
	const runtime = {
		layout: { name: "LaberintoPuna", getLayer: () => ({ cssPxToLayer: (x, y) => [x, y] }) },
		objects: { spriteControlTactil: { getAllInstances: () => botones } },
		addEventListener: (tipo, f) => { escuchas[tipo] = f; },
		removeEventListener: tipo => { delete escuchas[tipo]; },
		tocar: (tipo, nombre, id = 1) => escuchas[tipo]?.({ pointerType: "touch", pointerId: id, clientX: POS[nombre]?.[0] ?? 512, clientY: POS[nombre]?.[1] ?? 400 })
	};
	return { runtime, botones, simulados, manejado };
}

test("los botones aparecen al primer toque y la honda solo con Dieguito", () => {
	const { runtime, botones, manejado } = crearRuntime();
	iniciarControlesTactiles(runtime, {});
	runtime.tocar("pointerdown", "nada");
	actualizarControlesTactiles(runtime, manejado, { visibles: true, honda: false });
	assert.ok(botones.filter(b => b.animationName !== "honda").every(b => b.isVisible));
	assert.ok(!botones.find(b => b.animationName === "honda").isVisible);
	actualizarControlesTactiles(runtime, manejado, { visibles: false, honda: true });
	assert.ok(botones.every(b => !b.isVisible));
});

test("mantener una flecha mueve al personaje manejado hasta soltarla", () => {
	const { runtime, simulados, manejado } = crearRuntime();
	iniciarControlesTactiles(runtime, {});
	actualizarControlesTactiles(runtime, manejado, { visibles: true, honda: true });
	runtime.tocar("pointerdown", "izquierda", 7);
	assert.ok(direccionApretada(runtime, "ArrowLeft"));
	actualizarControlesTactiles(runtime, manejado, { visibles: true, honda: true });
	assert.deepEqual(simulados, ["left"]);
	runtime.tocar("pointermove", "arriba", 7);
	assert.ok(direccionApretada(runtime, "ArrowUp") && !direccionApretada(runtime, "ArrowLeft"));
	runtime.tocar("pointerup", "arriba", 7);
	assert.ok(!direccionApretada(runtime, "ArrowUp"));
});

test("cambiar y honda llaman a sus acciones; con la ficha abierta un toque la cierra", () => {
	const { runtime, manejado } = crearRuntime();
	const llamadas = [];
	let ficha = false;
	iniciarControlesTactiles(runtime, {
		cambiar: () => llamadas.push("cambiar"),
		honda: () => llamadas.push("honda"),
		tocar: () => ficha && !(ficha = false) && llamadas.push("cerrar ficha")
	});
	actualizarControlesTactiles(runtime, manejado, { visibles: true, honda: true });
	runtime.tocar("pointerdown", "cambiar");
	runtime.tocar("pointerdown", "honda");
	ficha = true;
	runtime.tocar("pointerdown", "cambiar");
	assert.deepEqual(llamadas, ["cambiar", "honda", "cerrar ficha"]);
});

test("cada laberinto tiene los 6 controles táctiles en el HUD", () => {
	const anims = cargarObjetos().get("spriteControlTactil")?.animaciones ?? [];
	assert.deepEqual([...anims].sort(), Object.keys(POS).sort());
	for (const nombre of ["LaberintoPuna", "LaberintoPuna2", "LaberintoPatagonia", "LaberintoPatagoniaOceano"])
	{
		const layout = JSON.parse(readFileSync(join(RAIZ, "layouts", `${nombre}.json`), "utf8"));
		const hud = layout.layers.find(l => l.name === "HUD");
		const controles = hud.instances.filter(i => i.type === "spriteControlTactil").map(i => i.properties["initial-animation"]);
		assert.deepEqual(controles.sort(), Object.keys(POS).sort(), nombre);
	}
});
