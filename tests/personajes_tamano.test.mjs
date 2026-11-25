import { test } from "node:test";
import assert from "node:assert/strict";
import { tamanoPersonaje, ALTO_PERSONAJE, ANCHO_MAX_PERSONAJE } from "../scripts/construirLaberinto.js";
import { REGIONES } from "../scripts/regiones.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, cargarObjetos } from "./lib/c3.mjs";

const OBJETOS = cargarObjetos();

function framesDe(nombre)
{
	const obj = JSON.parse(readFileSync(join(RAIZ, OBJETOS.get(nombre).archivo), "utf8"));
	return obj.animations.items.map(a => ({ animacion: a.name, ...a.frames[0] }));
}

test("Mafalda y Dieguito tienen la misma altura en todas las regiones y niveles", () => {
	const usadas = new Set();
	for (const info of Object.values(REGIONES))
		for (const etapa of [info, ...(info.etapas ?? [])])
			for (const [obj, anim] of Object.entries(etapa.sprites?.personajes ?? {}))
				usadas.add(`${obj}/${anim}`);

	for (const nombre of ["spriteMafalda", "spriteDieguito"])
		for (const f of framesDe(nombre))
		{
			if (!usadas.has(`${nombre}/${f.animacion}`)) continue;
			const [ancho, alto] = tamanoPersonaje(f.width, f.height);
			assert.ok(ancho <= ANCHO_MAX_PERSONAJE, `${nombre} ${f.animacion} muy ancho`);
			if (ancho < ANCHO_MAX_PERSONAJE)
				assert.equal(alto, ALTO_PERSONAJE, `${nombre} ${f.animacion}`);
			assert.ok(Math.abs(ancho / alto - f.width / f.height) < 0.02, `${nombre} ${f.animacion} deformado`);
		}
});

test("todas las animaciones de los personajes usan la misma caja de colisión", () => {
	const cajas = new Set();
	for (const nombre of ["spriteMafalda", "spriteDieguito"])
		for (const f of framesDe(nombre))
		{
			assert.ok(f.useCollisionPoly, `${nombre} ${f.animacion} sin polígono`);
			cajas.add(JSON.stringify(f.collisionPoly.points));
		}
	assert.equal(cajas.size, 1);
});
