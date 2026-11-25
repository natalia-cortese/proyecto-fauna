import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ZONAS, ZONAS_BLOQUEADAS, zonaBajoPunto } from "../scripts/inicio.js";
import { GRILLA_MAPA, CELDA_MAPA, regionEnMapa } from "../scripts/mapaRegiones.js";
import { layoutDeRegion } from "../scripts/regiones.js";
import { RAIZ, walk } from "./lib/c3.mjs";

const TODAS = { ...ZONAS, ...ZONAS_BLOQUEADAS };

function instanciasInicio()
{
	const layout = JSON.parse(readFileSync(join(RAIZ, "layouts", "Inicio.json"), "utf8"));
	const out = [];
	walk(layout, nodo => {
		if (!nodo.type || !nodo.world) return;
		out.push({ tipo: nodo.type, ...nodo.world });
	});
	return out;
}

function centroDeRegion(region)
{
	let sx = 0, sy = 0, n = 0;
	GRILLA_MAPA.forEach((fila, cy) => [...fila].forEach((_, cx) => {
		const x = cx * CELDA_MAPA + CELDA_MAPA / 2, y = cy * CELDA_MAPA + CELDA_MAPA / 2;
		if (regionEnMapa(x, y) === region) { sx += x; sy += y; n++; }
	}));
	return n ? [sx / n, sy / n] : null;
}

test("cada región del mapa tiene su sprite en Inicio con animaciones activa y desactivada", () => {
	const inst = instanciasInicio();
	for (const tipo of Object.keys(TODAS))
	{
		assert.ok(inst.some(i => i.tipo === tipo), `falta ${tipo} en layouts/Inicio.json`);
		const obj = JSON.parse(readFileSync(join(RAIZ, "objectTypes", "inicio", `${tipo}.json`), "utf8"));
		const anims = obj.animations.items.map(a => a.name);
		for (const anim of ["activa", "desactivada"])
		{
			assert.ok(anims.includes(anim), `${tipo} sin animación ${anim}`);
			assert.ok(existsSync(join(RAIZ, "images", `${tipo.toLowerCase()}-${anim}-000.png`)), `falta imagen ${tipo} ${anim}`);
		}
	}
	assert.ok(!inst.some(i => i.tipo === "spriteZonaPatagoniaOceano"));
});

test("la grilla cubre el mapa y tiene todas las regiones", () => {
	assert.equal(GRILLA_MAPA.length * CELDA_MAPA, 1024);
	assert.ok(GRILLA_MAPA.every(f => f.length * CELDA_MAPA === 1024));
	for (const region of Object.values(TODAS))
		assert.ok(centroDeRegion(region), `la región ${region} no aparece en la grilla`);
});

test("el mouse sobre Puna o Patagonia elige esa región; las bloqueadas no se eligen", () => {
	for (const region of Object.values(ZONAS))
	{
		const [x, y] = centroDeRegion(region);
		assert.equal(zonaBajoPunto(x, y), region);
	}
	for (const region of Object.values(ZONAS_BLOQUEADAS))
	{
		const [x, y] = centroDeRegion(region);
		assert.equal(zonaBajoPunto(x, y), null);
	}
	assert.equal(zonaBajoPunto(60, 60), null);
});

test("cada sprite de región está sobre su silueta en la grilla", () => {
	const inst = instanciasInicio();
	for (const [tipo, region] of Object.entries(TODAS))
	{
		const i = inst.find(n => n.tipo === tipo);
		const [cx, cy] = centroDeRegion(region);
		assert.ok(Math.abs(cx - i.x) < i.width / 2 && Math.abs(cy - i.y) < i.height / 2, `${tipo} no coincide con su silueta`);
	}
});

test("JUGAR, el nombre y los personajes no tapan regiones jugables", () => {
	const inst = instanciasInicio();
	for (const tipo of ["spriteBotonJugar", "spriteEtiquetaNombre", "spriteMafalda", "spriteDieguito"])
	{
		const i = inst.find(n => n.tipo === tipo);
		for (const [dx, dy] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0, 0]])
			assert.equal(zonaBajoPunto(i.x + dx * i.width, i.y + dy * i.height), null, `${tipo} tapa una región`);
	}
	const campo = inst.find(n => n.tipo === "textNombre");
	for (const [x, y] of [[campo.x, campo.y], [campo.x + campo.width, campo.y + campo.height]])
		assert.equal(regionEnMapa(x, y), "", "textNombre tapa una región");
});

test("JUGAR abre el layout de la zona, no siempre Puna", () => {
	assert.equal(layoutDeRegion("puna"), "LaberintoPuna");
	assert.equal(layoutDeRegion("patagonia", 1), "LaberintoPatagoniaOceano");
	assert.equal(layoutDeRegion("patagonia", 2), "LaberintoPatagonia");
	assert.notEqual(layoutDeRegion("patagonia", 1), layoutDeRegion("puna"));
});
