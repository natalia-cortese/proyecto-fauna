// Prueba un laberinto como el de LaberintoPuna (3 jaulas) sin abrir Construct:
// el generador es JS puro. No cubre el runtime (colisiones, Solid, audio).

import { test } from "node:test";
import assert from "node:assert/strict";
import { generarMapa } from "../scripts/generadorLaberinto.js";

const MUROS = new Set("#FSYPR");
const PISO = new Set(".GENLJVHO"); // cactus K tapa el pasillo; la roca se puede saltar

function filasDe(mapa)
{
	const filas = mapa.split("|");
	assert.ok(filas.length > 0 && filas.every(f => f.length === filas[0].length));
	return filas;
}

function contar(filas, letra)
{
	return filas.join("").split(letra).length - 1;
}

function buscar(filas, letra)
{
	const pts = [];
	for (let y = 0; y < filas.length; y++)
		for (let x = 0; x < filas[y].length; x++)
			if (filas[y][x] === letra) pts.push([x, y]);
	return pts;
}

function alcanzables(filas, origen)
{
	const visto = new Set([origen.join(",")]);
	const cola = [origen];
	while (cola.length)
	{
		const [x, y] = cola.pop();
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
		{
			const nx = x + dx, ny = y + dy;
			if (ny < 0 || nx < 0 || ny >= filas.length || nx >= filas[0].length) continue;
			const k = `${nx},${ny}`;
			if (visto.has(k) || !PISO.has(filas[ny][nx])) continue;
			visto.add(k);
			cola.push([nx, ny]);
		}
	}
	return visto;
}

function nivelPuna(semilla = 127492926)
{
	return generarMapa({ jaulas: 3, semilla });
}

test("la misma semilla da el mismo laberinto", () => {
	assert.equal(nivelPuna(42), nivelPuna(42));
	assert.notEqual(nivelPuna(42), nivelPuna(43));
});

test("un nivel de la Puna (28×19, 3 jaulas) tiene cueva, portal, llaves y personajes", () => {
	const filas = filasDe(nivelPuna());
	assert.equal(filas.length, 19);
	assert.equal(filas[0].length, 28);
	assert.equal(contar(filas, "J"), 3);
	assert.equal(contar(filas, "L"), 3);
	assert.equal(contar(filas, "V"), 1);
	assert.equal(contar(filas, "G"), 1);
	assert.equal(contar(filas, "E"), 1);
	assert.equal(contar(filas, "N"), 1);
	assert.equal(contar(filas, "H"), 4);
});

test("el borde es muro y no hay letras raras", () => {
	const filas = filasDe(nivelPuna(7));
	const alto = filas.length, ancho = filas[0].length;
	for (let x = 0; x < ancho; x++)
	{
		assert.ok(MUROS.has(filas[0][x]), `borde norte ${x}`);
		assert.ok(MUROS.has(filas[alto - 1][x]), `borde sur ${x}`);
	}
	for (let y = 0; y < alto; y++)
	{
		assert.ok(MUROS.has(filas[y][0]), `borde oeste ${y}`);
		assert.ok(MUROS.has(filas[y][ancho - 1]), `borde este ${y}`);
	}
	const validas = new Set([...MUROS, ...PISO, "K"]);
	for (const c of filas.join(""))
		assert.ok(validas.has(c), `letra inesperada ${c}`);
});

test("desde el portal se llega a la cueva y a cada jaula", () => {
	const filas = filasDe(nivelPuna(99));
	const [inicio] = buscar(filas, "G");
	const zona = alcanzables(filas, inicio);
	const [cueva] = buscar(filas, "V");
	assert.ok(zona.has(cueva.join(",")), "la cueva tiene que estar conectada al portal");
	for (const jaula of buscar(filas, "J"))
		assert.ok(zona.has(jaula.join(",")), `jaula ${jaula} inalcanzable`);
	for (const llave of buscar(filas, "L"))
		assert.ok(zona.has(llave.join(",")), `llave ${llave} inalcanzable`);
});

test("jaulas fuera de 1–5 no se pueden pedir", () => {
	assert.throws(() => generarMapa({ jaulas: 0, semilla: 1 }), RangeError);
	assert.throws(() => generarMapa({ jaulas: 6, semilla: 1 }), RangeError);
	const filas = filasDe(generarMapa({ jaulas: 5, semilla: 1 }));
	assert.equal(contar(filas, "J"), 5);
	assert.equal(contar(filas, "L"), 5);
});
