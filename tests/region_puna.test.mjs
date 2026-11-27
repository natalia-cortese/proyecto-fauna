// test_region_puna: el nivel de una región, no solo el generador.
// Cubre catálogo (regiones.js), layout, hoja de eventos y el mapa con esas jaulas.
// Para otra región: copiá este archivo a tests/region_pampeana.test.mjs y cambiá CLAVE.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generarMapa } from "../scripts/generadorLaberinto.js";
import { REGIONES } from "../scripts/regiones.js";
import { assertMapaJugable } from "./lib/mapa.mjs";
import {
	infoRegionOFalla, cargarLayout, cargarHoja, scriptInicioLayout,
	playMusicaHoja, jaulasDelScript, fondosDelLayout, animacionesDe, objetoExiste
} from "./lib/regionNivel.mjs";

const CLAVE = "puna";
const ANCHO = 28;
const ALTO = 19;

describe("region_puna", () => {
	const info = infoRegionOFalla(REGIONES, CLAVE);
	const layout = cargarLayout(info.layout);
	const hoja = cargarHoja(info.layout);
	const script = scriptInicioLayout(hoja);
	const jaulas = jaulasDelScript(script);

	test("el catálogo apunta a un layout y una hoja reales", () => {
		assert.equal(info.layout, "LaberintoPuna");
		assert.equal(layout.name, info.layout);
		assert.equal(layout.eventSheet, info.layout);
		assert.equal(hoja.name, info.layout);
		assert.ok((info.animales ?? []).length >= jaulas, `${CLAVE} necesita al menos ${jaulas} animales`);
		assert.ok(info.sonidos, `${CLAVE}: falta sonidos`);
		assert.ok(info.mapaLoop, `${CLAVE}: falta mapaLoop`);
		assert.ok(info.sprites?.fondo, `${CLAVE}: falta sprites.fondo`);
	});

	test("On start of layout fija la región, genera el mapa y sortea animales", () => {
		assert.match(script, new RegExp(`REGION\\s*=\\s*"${CLAVE}"`));
		assert.match(script, /generarMapa\(\s*\{\s*jaulas:\s*JAULAS/);
		assert.match(script, /construirLaberinto\(\s*runtime,\s*mapa\s*\)/);
		assert.match(script, new RegExp(`elegirAnimales\\(\\s*"${CLAVE}"`));
		assert.match(script, /mostrarCartelNivel\(\s*runtime\s*\)/);
		assert.equal(jaulas, 3);
	});

	test("el fondo del layout y el loop de audio son los de la región", () => {
		assert.ok(fondosDelLayout(layout).includes(info.sprites.fondo), `el layout tiene que incluir ${info.sprites.fondo}`);
		assert.ok(objetoExiste(info.sprites.fondo), `falta el objeto ${info.sprites.fondo}`);
		const play = playMusicaHoja(hoja);
		assert.ok(play, `${info.layout} tiene que reproducir el loop con tag musica`);
		assert.equal(play.folder, "sounds");
		assert.equal(play.nombre, `${info.sonidos}/${info.mapaLoop}`);
	});

	test("los sprites y carteles de nivel de la región existen", () => {
		const s = info.sprites;
		for (const [objeto, anim] of Object.entries(s.personajes ?? {}))
			assert.ok(animacionesDe(objeto).includes(anim), `${objeto} no tiene ${anim}`);
		assert.ok(animacionesDe("spriteHuida").includes(s.huida), `spriteHuida no tiene ${s.huida}`);
		for (const anim of s.enemigos ?? [])
			assert.ok(animacionesDe("spriteCazador").includes(anim), `spriteCazador no tiene ${anim}`);
		for (const animal of info.animales ?? [])
		{
			const id = `${CLAVE}_${animal}`;
			assert.ok(animacionesDe("spriteFichaAnimal").includes(id), `falta ficha ${id}`);
			assert.ok(animacionesDe("spriteAlbumSlot").includes(id), `falta slot ${id}`);
		}
		for (let n = 1; n <= 8; n++)
			assert.ok(animacionesDe("spriteCartelNivel").includes(`${CLAVE}_${n}`), `falta cartel ${CLAVE}_${n}`);
	});

	test("el laberinto de esta región es jugable (portal → jaulas, llaves y cueva)", () => {
		const mapa = generarMapa({ jaulas, semilla: 127492926 });
		assertMapaJugable(mapa, { jaulas, ancho: ANCHO, alto: ALTO });
		assert.equal(generarMapa({ jaulas, semilla: 42 }), generarMapa({ jaulas, semilla: 42 }));
	});
});
