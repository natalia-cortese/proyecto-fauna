// Arma en el layout el texto MAPA de generarMapa(): pinta los muros en el Tilemap
// y crea o mueve los objetos de cada letra (ver scripts/construct_laberinto/GUIA_CONSTRUCT3.md).

import { prepararCazador } from "./cazadores.js";

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

export function construirLaberinto(runtime, mapa, capa = "Layer 1")
{
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

	const nena = runtime.objects.spriteNena.getFirstInstance();
	const nene = runtime.objects.spriteNene.getFirstInstance();
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
				if (letra === "H")
				{
					inst.setAnimation(Math.random() < 0.5 ? "Cazador1" : "Cazador2");
					prepararCazador(inst, filas, x, y);
				}
			}
			else if (letra === "E" && nena) { nena.x = cx; nena.y = cy; }
			else if (letra === "N" && nene) { nene.x = cx; nene.y = cy; }
		}

	// Los objetos creados quedan arriba de todo; sin esto el portal tapa a los personajes.
	nena?.moveToTop();
	nene?.moveToTop();

	// El Pathfinding calcula los obstáculos al arrancar, antes de que existan los muros.
	nena?.behaviors.Pathfinding?.map.regenerateMap();
	nene?.behaviors.Pathfinding?.map.regenerateMap();
}
