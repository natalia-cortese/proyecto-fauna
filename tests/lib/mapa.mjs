import assert from "node:assert/strict";

export const MUROS = new Set("#FSYPR");
export const PISO = new Set(".GENLJVHO"); // cactus K tapa el pasillo; la roca se puede saltar

export function filasDe(mapa)
{
	const filas = mapa.split("|");
	assert.ok(filas.length > 0 && filas.every(f => f.length === filas[0].length));
	return filas;
}

export function contar(filas, letra)
{
	return filas.join("").split(letra).length - 1;
}

export function buscar(filas, letra)
{
	const pts = [];
	for (let y = 0; y < filas.length; y++)
		for (let x = 0; x < filas[y].length; x++)
			if (filas[y][x] === letra) pts.push([x, y]);
	return pts;
}

export function alcanzables(filas, origen)
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

export function assertMapaJugable(mapa, { jaulas, ancho, alto })
{
	const filas = filasDe(mapa);
	assert.equal(filas.length, alto);
	assert.equal(filas[0].length, ancho);
	assert.equal(contar(filas, "J"), jaulas);
	assert.equal(contar(filas, "L"), jaulas);
	assert.equal(contar(filas, "V"), 1);
	assert.equal(contar(filas, "G"), 1);
	assert.equal(contar(filas, "E"), 1);
	assert.equal(contar(filas, "N"), 1);
	assert.equal(contar(filas, "H"), 4);

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

	const [inicio] = buscar(filas, "G");
	const zona = alcanzables(filas, inicio);
	const [cueva] = buscar(filas, "V");
	assert.ok(zona.has(cueva.join(",")), "la cueva tiene que estar conectada al portal");
	for (const jaula of buscar(filas, "J"))
		assert.ok(zona.has(jaula.join(",")), `jaula ${jaula} inalcanzable`);
	for (const llave of buscar(filas, "L"))
		assert.ok(zona.has(llave.join(",")), `llave ${llave} inalcanzable`);
}
