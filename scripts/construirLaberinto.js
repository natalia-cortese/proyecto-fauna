// Arma en el layout el texto MAPA de generarMapa(): pinta los muros en el Tilemap
// y crea o mueve los objetos de cada letra (ver scripts/construct_laberinto/GUIA_CONSTRUCT3.md).

import { prepararCazador } from "./cazadores.js";
import { reiniciarNiebla, revelarNiebla } from "./niebla.js";
import { REGIONES, spritesDeRegion } from "./regiones.js";
import { getNivel } from "./nivel.js";

const CASILLA = 64;
const ESTILOS = "#FSYPR";

// Tamaño en el layout de cada objeto creado; las imágenes tienen tamaños muy distintos.
const OBJETOS = {
	K: { nombre: "spritePeligro", ancho: 80, alto: 130 },
	V: { nombre: "spriteCueva", ancho: 200, alto: 150 },
	O: { nombre: "spriteObstaculo", ancho: 40, alto: 34 },
	G: { nombre: "spritePortal", ancho: 176, alto: 190 },
	J: { nombre: "spriteJaula", ancho: 96, alto: 92 },
	L: { nombre: "Sprite2", ancho: 70, alto: 76 },
	H: { nombre: "spriteCazador", ancho: 48, alto: 72 }
};

function definicionObjeto(letra, sprites)
{
	const base = OBJETOS[letra];
	if (!base) return;
	if (letra === "H" && sprites?.enemigos?.some(a => String(a).includes("Oceano")))
		return { ...base, ancho: 100, alto: 118 };
	if (letra === "K" && sprites?.danio?.includes("Iceberg"))
		return { ...base, ancho: 92, alto: 108 };
	if (letra === "J" && sprites?.jaula === "Oceano")
		return { ...base, ancho: 100, alto: 100 };
	if (letra === "O" && sprites?.obstaculos?.includes("Olita"))
		return { ...base, ancho: 56, alto: 48 };
	return base;
}

const OBJETOS_MUROS = Object.values(REGIONES)
	.flatMap(r => [r, ...(r.etapas ?? [])])
	.map(e => e.sprites?.muros?.objeto)
	.filter(Boolean);
const NOMBRES_MAPA = [...new Set([...Object.values(OBJETOS).map(o => o.nombre), "spriteCartelSalida", ...OBJETOS_MUROS])];

// Las rocas se pasan un poco de la casilla para que el muro se vea continuo.
const ANCHO_ROCA = 84;
const ALTO_ROCA = 82;
const LADO_PLANTA = 36;
const PROB_PLANTA = 0.3;
const tamanosFijos = new Map();

export function construirLaberinto(runtime, mapa, capa = "Layer 1")
{
	// Si el layout no se limpia del todo al reiniciar, los sólidos viejos tapan la cueva.
	limpiarObjetosMapa(runtime);
	reiniciarNiebla(runtime);

	const sprites = spritesDeRegion(runtime.globalVars.REGION, getNivel());
	aplicarSpritesRegion(runtime, sprites);

	const filas = mapa.split("|");
	const estilo = (x, y) => ESTILOS.indexOf(filas[y]?.[x] ?? ".");
	const esMuro = (x, y) => estilo(x, y) >= 0;

	const tilemap = runtime.objects.Tilemap.getFirstInstance();
	for (let y = 0; y < filas.length; y++)
		for (let x = 0; x < filas[y].length; x++)
		{
			if (!esMuro(x, y))
			{
				tilemap.setTileAt(x, y, -1);
				continue;
			}
			const mascara = esMuro(x, y - 1) * 1 + esMuro(x + 1, y) * 2 + esMuro(x, y + 1) * 4 + esMuro(x - 1, y) * 8;
			const variante = Math.floor(Math.random() * 3);
			tilemap.setTileAt(x, y, mascara + estilo(x, y) * 16 + variante * 96);
		}
	tilemap.isVisible = !sprites.muros;
	if (sprites.muros) decorarMuros(runtime, sprites.muros, filas, esMuro, capa);

	const mafalda = runtime.objects.spriteMafalda.getFirstInstance();
	const dieguito = runtime.objects.spriteDieguito.getFirstInstance();
	for (let y = 0; y < filas.length; y++)
		for (let x = 0; x < filas[y].length; x++)
		{
			const letra = filas[y][x];
			const cx = x * CASILLA + CASILLA / 2;
			const cy = y * CASILLA + CASILLA / 2;
			const objeto = definicionObjeto(letra, sprites);
			if (objeto)
			{
				const inst = runtime.objects[objeto.nombre].createInstance(capa, cx, cy);
				if (letra === "O") ponerAnimacion(inst, alAzar(sprites.obstaculos));
				else if (letra === "K") ponerAnimacion(inst, alAzar(sprites.danio));
				else if (letra === "J") ponerAnimacion(inst, sprites.jaula || "Animation 1");
				else if (letra === "H")
					ponerAnimacion(inst, alAzar(sprites.enemigos) || "CazadorPuna");
				else if (letra === "V") ponerCartelSalida(runtime, inst, capa);
				fijarTamano(inst, objeto.ancho, objeto.alto);
				// El origin está en el centro: se baja para que quede apoyado en el borde de abajo de la casilla.
				inst.y = (y + 1) * CASILLA - objeto.alto / 2;
				if (letra === "H") prepararCazador(inst, filas, x, y);
			}
			else if (letra === "E" && mafalda) { mafalda.x = cx; mafalda.y = cy; }
			else if (letra === "N" && dieguito) { dieguito.x = cx; dieguito.y = cy; }
		}

	// Los objetos creados quedan arriba de todo; sin esto el portal tapa a los personajes.
	mafalda?.moveToTop();
	dieguito?.moveToTop();
	sacarDeSolidos(mafalda);
	sacarDeSolidos(dieguito);
	revelarNiebla(runtime, [mafalda, dieguito].filter(Boolean));
	mafalda?.behaviors.Pathfinding?.map.regenerateMap();
	dieguito?.behaviors.Pathfinding?.map.regenerateMap();
}

// Van en la capa BG (encima del fondo) para quedar debajo de todo lo de Layer 1.
// Se crean fila por fila: la roca de abajo tapa el pie de la de arriba.
function decorarMuros(runtime, muros, filas, esMuro, capa)
{
	const tipo = runtime.objects[muros.objeto];
	if (!tipo) return;
	const capaMuros = runtime.layout.getLayer("BG") ? "BG" : capa;
	for (let y = 0; y < filas.length; y++)
		for (let x = 0; x < filas[y].length; x++)
		{
			if (!esMuro(x, y)) continue;
			const cx = x * CASILLA + CASILLA / 2;
			const abajo = (y + 1) * CASILLA;
			const roca = tipo.createInstance(capaMuros, cx, abajo);
			ponerAnimacion(roca, alAzar(muros.rocas));
			escalarDentroDe(roca, ANCHO_ROCA, ALTO_ROCA);
			roca.y = abajo + 8 - roca.height / 2;
			if (Math.random() < 0.5) roca.width = -roca.width;

			if (Math.random() >= PROB_PLANTA) continue;
			const planta = tipo.createInstance(capaMuros, cx + (Math.random() - 0.5) * 36, abajo);
			ponerAnimacion(planta, alAzar(muros.plantas));
			escalarDentroDe(planta, LADO_PLANTA, LADO_PLANTA);
			planta.y = abajo + 4 - planta.height / 2;
		}
}

function escalarDentroDe(inst, ancho, alto)
{
	const k = Math.min(ancho / (inst.imageWidth || ancho), alto / (inst.imageHeight || alto));
	inst.width = Math.round(inst.imageWidth * k);
	inst.height = Math.round(inst.imageHeight * k);
}

function limpiarObjetosMapa(runtime)
{
	tamanosFijos.clear();
	for (const nombre of NOMBRES_MAPA)
		for (const inst of [...(runtime.objects[nombre]?.getAllInstances() ?? [])])
			inst.destroy();
}

function aplicarSpritesRegion(runtime, sprites)
{
	for (const nombre of ["spriteMafalda", "spriteDieguito"])
	{
		const inst = runtime.objects[nombre]?.getFirstInstance();
		ponerAnimacion(inst, sprites.personajes?.[nombre]);
		if (!inst) continue;
		const [ancho, alto] = tamanoPersonaje(inst.imageWidth, inst.imageHeight);
		inst.width = Math.sign(inst.width || 1) * ancho;
		inst.height = alto;
	}
	animarSinCambiarTamano(runtime.objects.spriteHuida?.getFirstInstance(), sprites.huida);
	if (runtime.globalVars.HUIDA !== undefined)
		runtime.globalVars.HUIDA = sprites.huida || "Huida";

	const fondos = [...new Set(Object.values(REGIONES).map(r => r.sprites?.fondo).filter(Boolean))];
	for (const nombre of fondos)
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = nombre === sprites.fondo;
}

function ponerAnimacion(inst, nombre)
{
	if (!inst || !nombre) return;
	try { inst.setAnimation(nombre); } catch {}
}

// Mafalda y Dieguito miden lo mismo en todas las regiones y niveles: misma altura, sin deformar el dibujo.
// El ancho tiene tope para dibujos apaisados (Dieguito en bote).
export const ALTO_PERSONAJE = 96;
export const ANCHO_MAX_PERSONAJE = 110;

export function tamanoPersonaje(imagenAncho, imagenAlto)
{
	const proporcion = (imagenAncho || 1) / (imagenAlto || 1);
	const ancho = Math.min(ALTO_PERSONAJE * proporcion, ANCHO_MAX_PERSONAJE);
	return [Math.round(ancho), Math.round(ancho / proporcion)];
}

function animarSinCambiarTamano(inst, nombre)
{
	if (!inst || !nombre) return;
	const w = inst.width;
	const h = inst.height;
	ponerAnimacion(inst, nombre);
	inst.width = w;
	inst.height = h;
}

function fijarTamano(inst, ancho, alto)
{
	if (!inst) return;
	const signo = inst.width < 0 ? -1 : 1;
	inst.width = signo * Math.abs(ancho);
	inst.height = alto;
	tamanosFijos.set(inst, { ancho: Math.abs(ancho), alto });
}

export function mantenerTamanosLaberinto()
{
	for (const [inst, t] of [...tamanosFijos])
	{
		try
		{
			const signo = inst.width < 0 ? -1 : 1;
			if (Math.abs(inst.width) !== t.ancho) inst.width = signo * t.ancho;
			if (inst.height !== t.alto) inst.height = t.alto;
		}
		catch { tamanosFijos.delete(inst); }
	}
}

function sacarDeSolidos(inst)
{
	if (!inst?.testOverlapSolid?.()) return;
	const x0 = inst.x;
	const y0 = inst.y;
	for (const [dx, dy] of [[0, -16], [0, 16], [-16, 0], [16, 0], [0, -32], [0, 32], [-32, 0], [32, 0]])
	{
		inst.x = x0 + dx;
		inst.y = y0 + dy;
		if (!inst.testOverlapSolid()) return;
	}
	inst.x = x0;
	inst.y = y0;
}

function ponerCartelSalida(runtime, cueva, capa)
{
	const tipo = runtime.objects.spriteCartelSalida;
	if (!tipo || !cueva) return;
	const cartel = tipo.createInstance(capa, cueva.x, cueva.y);
	cartel.width = 72;
	cartel.height = 40;
	cartel.y = cueva.y - cueva.height / 2 - cartel.height / 2 + 8;
	cartel.moveToTop();
}

function alAzar(lista)
{
	if (!lista?.length) return;
	return lista[Math.floor(Math.random() * lista.length)];
}
