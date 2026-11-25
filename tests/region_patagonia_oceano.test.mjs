import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generarMapa } from "../scripts/generadorLaberinto.js";
import { REGIONES, claveRegion, layoutDeRegion } from "../scripts/regiones.js";
import { assertMapaJugable } from "./lib/mapa.mjs";
import {
	infoRegionOFalla, cargarLayout, cargarHoja, scriptInicioLayout,
	playMusicaHoja, jaulasDelScript, fondosDelLayout, animacionesDe, objetoExiste
} from "./lib/regionNivel.mjs";

const CLAVE = "patagonia_oceano";
const ANCHO = 28;
const ALTO = 19;

describe("region_patagonia_oceano", () => {
	const info = infoRegionOFalla(REGIONES, CLAVE);
	const layout = cargarLayout(info.layout);
	const hoja = cargarHoja(info.layout);
	const script = scriptInicioLayout(hoja);
	const jaulas = jaulasDelScript(script);

	test("es el nivel 1 de Patagonia, no una zona aparte del mapa", () => {
		assert.equal(claveRegion(CLAVE), "patagonia");
		assert.equal(layoutDeRegion("patagonia", 1), info.layout);
		assert.equal(info.layout, "LaberintoPatagoniaOceano");
	});

	test("el catálogo apunta a un layout y una hoja reales", () => {
		assert.equal(layout.name, info.layout);
		assert.equal(layout.eventSheet, info.layout);
		assert.equal(hoja.name, info.layout);
		assert.ok((info.animales ?? []).length >= 1, `${CLAVE}: falta al menos un animal`);
		assert.ok(info.sonidos && info.mapaLoop && info.sprites?.fondo);
	});

	test("On start of layout fija la región Patagonia, genera el mapa y sortea animales", () => {
		assert.match(script, /REGION\s*=\s*"patagonia"/);
		assert.match(script, /generarMapa\(\s*\{\s*jaulas:\s*JAULAS/);
		assert.match(script, /construirLaberinto\(\s*runtime,\s*mapa\s*\)/);
		assert.match(script, /elegirAnimales\(\s*"patagonia"/);
		assert.equal(jaulas, 3);
	});

	test("el fondo del layout y el loop de audio son los del océano", () => {
		assert.ok(fondosDelLayout(layout).includes(info.sprites.fondo));
		assert.ok(objetoExiste(info.sprites.fondo));
		const play = playMusicaHoja(hoja);
		assert.ok(play);
		assert.equal(play.nombre, `${info.sonidos}/${info.mapaLoop}`);
	});

	test("los sprites de la región existen", () => {
		const s = info.sprites;
		for (const [objeto, anim] of Object.entries(s.personajes ?? {}))
			assert.ok(animacionesDe(objeto).includes(anim), `${objeto} no tiene ${anim}`);
		assert.ok(animacionesDe("spriteHuida").includes(s.huida));
		for (const anim of s.obstaculos ?? [])
			assert.ok(animacionesDe("spriteObstaculo").includes(anim), `spriteObstaculo no tiene ${anim}`);
		for (const anim of s.enemigos ?? [])
			assert.ok(animacionesDe("spriteCazador").includes(anim), `spriteCazador no tiene ${anim}`);
		for (const anim of s.danio ?? [])
			assert.ok(animacionesDe("spritePeligro").includes(anim), `spritePeligro no tiene ${anim}`);
		const prefijo = info.fichaPrefijo || CLAVE;
		for (const animal of info.animales ?? [])
		{
			const id = `${prefijo}_${animal}`;
			assert.ok(animacionesDe("spriteFichaAnimal").includes(id), `falta ficha ${id}`);
			assert.ok(animacionesDe("spriteAlbumSlot").includes(id), `falta slot ${id}`);
		}
	});

	test("el laberinto de esta región es jugable", () => {
		assertMapaJugable(generarMapa({ jaulas, semilla: 127492926 }), { jaulas, ancho: ANCHO, alto: ALTO });
	});
});
