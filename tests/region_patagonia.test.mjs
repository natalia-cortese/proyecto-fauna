import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generarMapa } from "../scripts/generadorLaberinto.js";
import { REGIONES, layoutDeRegion } from "../scripts/regiones.js";
import { assertMapaJugable } from "./lib/mapa.mjs";
import {
	infoRegionOFalla, cargarLayout, cargarHoja, scriptInicioLayout,
	playMusicaHoja, jaulasDelScript, fondosDelLayout, animacionesDe, objetoExiste
} from "./lib/regionNivel.mjs";

const CLAVE = "patagonia";
const ANCHO = 28;
const ALTO = 19;

describe("region_patagonia", () => {
	const info = infoRegionOFalla(REGIONES, CLAVE);
	const layoutNivel1 = cargarLayout(info.layout);
	const hojaNivel1 = cargarHoja(info.layout);
	const script = scriptInicioLayout(hojaNivel1);
	const jaulas = jaulasDelScript(script);

	test("el nivel 1 es el océano y el 2 es tierra", () => {
		assert.equal(layoutDeRegion(CLAVE, 1), "LaberintoPatagoniaOceano");
		assert.equal(layoutDeRegion(CLAVE, 2), "LaberintoPatagonia");
		assert.equal(info.etapas[0].layout, "LaberintoPatagoniaOceano");
		assert.equal(info.etapas[1].layout, "LaberintoPatagonia");
		assert.equal(info.titulo, "PATAGONIA");
	});

	test("el catálogo apunta a un layout y una hoja reales", () => {
		assert.equal(info.layout, "LaberintoPatagoniaOceano");
		assert.equal(layoutNivel1.name, info.layout);
		assert.equal(layoutNivel1.eventSheet, info.layout);
		assert.equal(hojaNivel1.name, info.layout);
		assert.ok(info.sonidos && info.mapaLoop && info.sprites?.fondo);
	});

	test("On start of layout fija la región Patagonia y genera el mapa", () => {
		assert.match(script, /REGION\s*=\s*"patagonia"/);
		assert.match(script, /generarMapa\(\s*\{\s*jaulas:\s*JAULAS/);
		assert.match(script, /construirLaberinto\(\s*runtime,\s*mapa\s*\)/);
		assert.match(script, /elegirAnimales\(\s*"patagonia"/);
		assert.equal(jaulas, 3);
	});

	test("el fondo y el loop del nivel 1 son los del océano", () => {
		assert.ok(fondosDelLayout(layoutNivel1).includes(info.sprites.fondo));
		assert.ok(objetoExiste(info.sprites.fondo));
		const play = playMusicaHoja(hojaNivel1);
		assert.ok(play);
		assert.equal(play.nombre, `${info.sonidos}/${info.mapaLoop}`);
	});

	test("los personajes del nivel 1 usan AnimationOceano", () => {
		assert.ok(animacionesDe("spriteMafalda").includes("AnimationOceano"));
		assert.ok(animacionesDe("spriteDieguito").includes("AnimationOceano"));
	});

	test("el laberinto de esta región es jugable", () => {
		assertMapaJugable(generarMapa({ jaulas, semilla: 127492926 }), { jaulas, ancho: ANCHO, alto: ALTO });
	});
});
