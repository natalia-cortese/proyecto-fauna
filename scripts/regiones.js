// Regiones jugables: layout del laberinto, carpeta de sonidos y nombre para carteles.

export const REGIONES = {
	puna: {
		layout: "LaberintoPuna",
		sonidos: "puna",
		mapaLoop: "SonidoMapa_puna_loop",
		titulo: "PUNA"
	},
	chaco: {
		layout: "LaberintoChaco",
		sonidos: "chaco",
		mapaLoop: "SonidoMapa_chaco_loop",
		titulo: "CHACO"
	}
};

export function infoRegion(region)
{
	const clave = String(region || "puna").toLowerCase();
	return REGIONES[clave] || REGIONES.puna;
}

export function layoutDeRegion(region)
{
	return infoRegion(region).layout;
}
