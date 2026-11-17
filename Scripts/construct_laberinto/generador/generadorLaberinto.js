// Genera el texto MAPA (filas separadas por "|") con las mismas letras que usa GUIA_CONSTRUCT3.md:
//   muros:   # F S Y P R      camino: .
//   objetos: V cueva, J jaula, L llave, K cactus, O roca, G portal, E nena, N nene

const LIBRE = ".";

export function generarMapa(opciones = {})
{
	const {
		ancho = 22,
		alto = 17,
		anchoPasillo = 2,
		jaulas = 3,
		rocas = 4,
		cactus = 3,
		entradasSala = 3,
		bucles = 0.06,
		estilos = "##FS",
		estiloBorde = "#",
		semilla = Math.floor(Math.random() * 0xFFFFFFFF)
	} = opciones;

	// Los personajes miden ~55×73 px: con pasillos de 1 casilla (64 px) no pasan.
	if (anchoPasillo < 2) throw new RangeError("anchoPasillo tiene que ser 2 o más");

	const rnd = mulberry32(semilla);
	const paso = anchoPasillo + 1;
	const columnas = Math.floor((ancho - 1) / paso);
	const filas = Math.floor((alto - 1) / paso);

	// La sala del medio tiene que medir al menos 8×5 casillas para que entren la cueva y las jaulas.
	const salaAncho = Math.ceil(9 / paso);
	const salaAlto = Math.ceil(6 / paso);
	if (columnas < salaAncho + 2 || filas < salaAlto + 2)
		throw new RangeError(`El mapa ${ancho}x${alto} es chico para pasillos de ${anchoPasillo}`);

	const salaI0 = Math.floor((columnas - salaAncho) / 2);
	const salaJ0 = Math.ceil((filas - salaAlto) / 2);
	const enSala = (i, j) => i >= salaI0 && i < salaI0 + salaAncho && j >= salaJ0 && j < salaJ0 + salaAlto;

	const sala = {
		x0: 1 + salaI0 * paso,
		y0: 1 + salaJ0 * paso,
		x1: (salaI0 + salaAncho) * paso - 1,
		y1: (salaJ0 + salaAlto) * paso - 1
	};
	// La cueva (200×150) ocupa ~3×2 casillas arriba al centro; las jaulas (96×92) van a los costados y abajo.
	const cueva = { x: Math.floor((sala.x0 + sala.x1) / 2), y: sala.y0 + 2 };
	const lugaresJaula = [
		[sala.x0, sala.y0 + 1], [sala.x1 - 1, sala.y0 + 1],
		[sala.x0, sala.y1], [cueva.x, sala.y1], [sala.x1 - 1, sala.y1]
	];
	if (jaulas < 1 || jaulas > lugaresJaula.length)
		throw new RangeError(`jaulas tiene que estar entre 1 y ${lugaresJaula.length}`);

	// ---- Grafo de celdas: árbol aleatorio (backtracker) + algunos bucles ----
	const SALA = "sala";
	const clave = (i, j) => `${i},${j}`;
	const vecinosDe = new Map();
	const unir = (a, b) => {
		if (!vecinosDe.has(a)) vecinosDe.set(a, new Set());
		if (!vecinosDe.has(b)) vecinosDe.set(b, new Set());
		vecinosDe.get(a).add(b);
		vecinosDe.get(b).add(a);
	};
	const adyacentes = (i, j) => [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]
		.filter(([a, b]) => a >= 0 && b >= 0 && a < columnas && b < filas);

	const inicio = [0, filas - 1];
	const visitadas = new Set([clave(...inicio)]);
	const pila = [inicio];
	vecinosDe.set(clave(...inicio), new Set());
	while (pila.length)
	{
		const [i, j] = pila[pila.length - 1];
		const opciones = adyacentes(i, j).filter(([a, b]) => !enSala(a, b) && !visitadas.has(clave(a, b)));
		if (!opciones.length) { pila.pop(); continue; }
		const [a, b] = elegir(rnd, opciones);
		unir(clave(i, j), clave(a, b));
		visitadas.add(clave(a, b));
		pila.push([a, b]);
	}

	for (let j = 0; j < filas; j++)
		for (let i = 0; i < columnas; i++)
			for (const [a, b] of [[i + 1, j], [i, j + 1]])
				if (a < columnas && b < filas && !enSala(i, j) && !enSala(a, b) && rnd() < bucles)
					unir(clave(i, j), clave(a, b));

	// Entradas a la sala, cada una en un lado distinto mientras se pueda.
	const bordeSala = { izquierda: [], derecha: [], arriba: [], abajo: [] };
	for (let k = 0; k < salaAlto; k++)
	{
		bordeSala.izquierda.push([salaI0 - 1, salaJ0 + k]);
		bordeSala.derecha.push([salaI0 + salaAncho, salaJ0 + k]);
	}
	for (let k = 0; k < salaAncho; k++)
	{
		bordeSala.arriba.push([salaI0 + k, salaJ0 - 1]);
		bordeSala.abajo.push([salaI0 + k, salaJ0 + salaAlto]);
	}
	const lados = mezclar(rnd, Object.values(bordeSala));
	const puertas = [];
	for (let k = 0; k < Math.max(1, entradasSala); k++)
	{
		const celda = elegir(rnd, lados[k % lados.length]);
		puertas.push(celda);
		unir(clave(...celda), SALA);
	}

	// ---- Distancias para esconder las llaves ----
	const distancias = desde => {
		const d = new Map([[desde, 0]]);
		const cola = [desde];
		while (cola.length)
		{
			const actual = cola.shift();
			for (const v of vecinosDe.get(actual) ?? [])
				if (!d.has(v)) { d.set(v, d.get(actual) + 1); cola.push(v); }
		}
		return d;
	};
	const dInicio = distancias(clave(...inicio));
	const dSala = distancias(SALA);

	const celdasNormales = [];
	for (let j = 0; j < filas; j++)
		for (let i = 0; i < columnas; i++)
			if (!enSala(i, j) && !(i === inicio[0] && j === inicio[1])) celdasNormales.push([i, j]);
	const esCallejon = ([i, j]) => vecinosDe.get(clave(i, j)).size === 1;

	// Prioridad: callejones sin salida lejos del inicio y de la sala, separados entre sí.
	// Las celdas cerca del inicio o de la sala solo se usan si no alcanzan las lejanas.
	const lejana = c => dInicio.get(clave(...c)) >= 3 && dSala.get(clave(...c)) >= 2;
	const candidatas = celdasNormales
		.map(c => ({ c, p: (esCallejon(c) ? 100 : 0) + Math.min(dInicio.get(clave(...c)), dSala.get(clave(...c))) + rnd() * 0.5 }))
		.sort((a, b) => b.p - a.p)
		.map(x => x.c);

	const buscarLlaves = (lista, separacionMinima) => {
		for (let separacion = 6; separacion >= separacionMinima; separacion--)
		{
			const elegidas = [];
			for (const c of lista)
			{
				if (elegidas.length === jaulas) break;
				const dc = distancias(clave(...c));
				if (elegidas.every(o => dc.get(clave(...o)) >= separacion)) elegidas.push(c);
			}
			if (elegidas.length === jaulas) return elegidas;
		}
		return null;
	};
	const celdasLlave = buscarLlaves(candidatas.filter(lejana), 1) ?? buscarLlaves(candidatas, 0);

	const usadas = new Set(celdasLlave.map(c => clave(...c)));
	const celdasCactus = mezclar(rnd, celdasNormales.filter(c => esCallejon(c) && !usadas.has(clave(...c))))
		.slice(0, cactus);
	celdasCactus.forEach(c => usadas.add(clave(...c)));
	const celdasRoca = mezclar(rnd, celdasNormales.filter(c => !usadas.has(clave(...c)) && !puertas.some(p => p[0] === c[0] && p[1] === c[1])))
		.slice(0, rocas);

	// ---- Pasar a casillas ----
	const mapa = Array.from({ length: alto }, () => Array(ancho).fill(null));
	const origen = (i, j) => [1 + i * paso, 1 + j * paso];
	const abrir = (x, y) => { mapa[y][x] = LIBRE; };

	for (let j = 0; j < filas; j++)
		for (let i = 0; i < columnas; i++)
		{
			const [x, y] = origen(i, j);
			for (let dy = 0; dy < anchoPasillo; dy++)
				for (let dx = 0; dx < anchoPasillo; dx++) abrir(x + dx, y + dy);
			for (const v of vecinosDe.get(clave(i, j)) ?? [])
			{
				if (v === SALA) continue;
				const [a, b] = v.split(",").map(Number);
				for (let k = 0; k < anchoPasillo; k++)
				{
					if (a === i + 1) abrir(x + anchoPasillo, y + k);
					if (b === j + 1) abrir(x + k, y + anchoPasillo);
				}
			}
		}

	for (let y = sala.y0; y <= sala.y1; y++)
		for (let x = sala.x0; x <= sala.x1; x++) abrir(x, y);
	for (const [i, j] of puertas)
	{
		const [x, y] = origen(i, j);
		for (let k = 0; k < anchoPasillo; k++)
		{
			if (i < salaI0) abrir(x + anchoPasillo, y + k);
			else if (i >= salaI0 + salaAncho) abrir(x - 1, y + k);
			else if (j < salaJ0) abrir(x + k, y + anchoPasillo);
			else abrir(x + k, y - 1);
		}
	}

	// Estilo de muro por zonas de 2×2 celdas, para que cada seto tenga un solo estilo casi siempre.
	const estiloZona = new Map();
	const estiloDe = (x, y) => {
		const borde = x === 0 || y === 0 || x >= columnas * paso || y >= filas * paso;
		if (borde) return estiloBorde;
		const zona = `${Math.floor((x - 1) / (paso * 2))},${Math.floor((y - 1) / (paso * 2))}`;
		if (!estiloZona.has(zona)) estiloZona.set(zona, elegir(rnd, [...estilos]));
		return estiloZona.get(zona);
	};
	for (let y = 0; y < alto; y++)
		for (let x = 0; x < ancho; x++)
			if (mapa[y][x] === null) mapa[y][x] = estiloDe(x, y);

	// ---- Objetos ----
	const poner = (x, y, letra) => { mapa[y][x] = letra; };
	const casillaAbajo = ([i, j]) => {
		const [x, y] = origen(i, j);
		return [x + Math.floor(rnd() * anchoPasillo), y + anchoPasillo - 1];
	};
	const casillaCualquiera = ([i, j]) => {
		const [x, y] = origen(i, j);
		return [x + Math.floor(rnd() * anchoPasillo), y + Math.floor(rnd() * anchoPasillo)];
	};

	poner(cueva.x, cueva.y, "V");
	for (const [x, y] of mezclar(rnd, lugaresJaula).slice(0, jaulas)) poner(x, y, "J");
	for (const c of celdasLlave) poner(...casillaCualquiera(c), "L");
	// Cactus y rocas van en la fila de abajo de su celda: así queda lugar arriba para pasar.
	for (const c of celdasCactus) poner(...casillaAbajo(c), "K");
	for (const c of celdasRoca) poner(...casillaAbajo(c), "O");

	const [xi, yi] = origen(...inicio);
	poner(xi, yi + anchoPasillo - 1, "G");
	poner(xi, yi, "E");
	poner(xi + 1, yi, "N");

	return mapa.map(fila => fila.join("")).join("|");
}

function mulberry32(semilla)
{
	let a = semilla >>> 0;
	return () => {
		a = (a + 0x6D2B79F5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function elegir(rnd, lista)
{
	return lista[Math.floor(rnd() * lista.length)];
}

function mezclar(rnd, lista)
{
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i--)
	{
		const k = Math.floor(rnd() * (i + 1));
		[copia[i], copia[k]] = [copia[k], copia[i]];
	}
	return copia;
}
