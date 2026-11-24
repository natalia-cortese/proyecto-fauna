// Arma en el layout el texto MAPA de generarMapa(): pinta los muros en el Tilemap
// y crea o mueve los objetos de cada letra (ver scripts/construct_laberinto/GUIA_CONSTRUCT3.md).

import { prepararCazador } from "./cazadores.js";
import { reiniciarNiebla } from "./niebla.js";
import { REGIONES, spritesDeRegion } from "./regiones.js";

const CASILLA = 64;
const ESTILOS = "#FSYPR";

// Tamaño en el layout de cada objeto creado; las imágenes tienen tamaños muy distintos.
const OBJETOS = {
	K: { nombre: "spriteSaguaro", ancho: 80, alto: 130 },
	V: { nombre: "spriteCueva", ancho: 200, alto: 150 },
	O: { nombre: "spriteRock", ancho: 40, alto: 34 },
	G: { nombre: "spritePortal", ancho: 176, alto: 190 },
	J: { nombre: "spriteJaula", ancho: 96, alto: 92 },
	L: { nombre: "Sprite2", ancho: 70, alto: 76 },
	H: { nombre: "spriteCazador", ancho: 48, alto: 72 }
};

const NOMBRES_MAPA = [...new Set(Object.values(OBJETOS).map(o => o.nombre))];

export function construirLaberinto(runtime, mapa, capa = "Layer 1")
{
	// Si el layout no se limpia del todo al reiniciar, los sólidos viejos tapan la cueva.
	limpiarObjetosMapa(runtime);
	reiniciarNiebla(runtime);

	const sprites = spritesDeRegion(runtime.globalVars.REGION);
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

	const mafalda = runtime.objects.spriteMafalda.getFirstInstance();
	const dieguito = runtime.objects.spriteDieguito.getFirstInstance();
	for (let y = 0; y < filas.length; y++)
		for (let x = 0; x < filas[y].length; x++)
		{
			const letra = filas[y][x];
			const cx = x * CASILLA + CASILLA / 2;
			const cy = y * CASILLA + CASILLA / 2;
			const objeto = OBJETOS[letra];
			if (objeto)
			{
				const inst = runtime.objects[objeto.nombre].createInstance(capa, cx, cy);
				inst.width = objeto.ancho;
				inst.height = objeto.alto;
				// El origin está en el centro: se baja para que quede apoyado en el borde de abajo de la casilla.
				inst.y = (y + 1) * CASILLA - objeto.alto / 2;
				if (letra === "O") ponerAnimacion(inst, alAzar(sprites.obstaculos));
				else if (letra === "K") ponerAnimacion(inst, alAzar(sprites.danio));
				else if (letra === "H")
				{
					ponerAnimacion(inst, alAzar(sprites.enemigos) || "Cazador1");
					prepararCazador(inst, filas, x, y);
				}
			}
			else if (letra === "E" && mafalda) { mafalda.x = cx; mafalda.y = cy; }
			else if (letra === "N" && dieguito) { dieguito.x = cx; dieguito.y = cy; }
		}

	// Los objetos creados quedan arriba de todo; sin esto el portal tapa a los personajes.
	mafalda?.moveToTop();
	dieguito?.moveToTop();

	// El Pathfinding calcula los obstáculos al arrancar, antes de que existan los muros.
	mafalda?.behaviors.Pathfinding?.map.regenerateMap();
	dieguito?.behaviors.Pathfinding?.map.regenerateMap();
}

function limpiarObjetosMapa(runtime)
{
	for (const nombre of NOMBRES_MAPA)
		for (const inst of [...(runtime.objects[nombre]?.getAllInstances() ?? [])])
			inst.destroy();
}

function aplicarSpritesRegion(runtime, sprites)
{
	ponerAnimacion(runtime.objects.spriteMafalda?.getFirstInstance(), sprites.personajes?.spriteMafalda);
	ponerAnimacion(runtime.objects.spriteDieguito?.getFirstInstance(), sprites.personajes?.spriteDieguito);
	ponerAnimacion(runtime.objects.spriteHuida?.getFirstInstance(), sprites.huida);
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

function alAzar(lista)
{
	if (!lista?.length) return;
	return lista[Math.floor(Math.random() * lista.length)];
}
