// Regiones jugables: layout del laberinto, sonidos, animales y sprites de cada región.
//
// Los objetos de Construct son los mismos en todas las regiones (spriteMafalda, spriteObstaculo, spriteCazador…);
// cada región elige qué animación muestra cada uno. Para cambiar un sprite en una región nueva, agregá la
// animación al objeto en Construct y poné su nombre acá. Las listas sortean una animación por objeto creado.
//
//   personajes  animación de spriteMafalda y spriteDieguito
//   tamanoPersonajes  [ancho, alto] opcional de cada personaje (si no, queda el tamaño del layout)
//   huida       animación de spriteHuida (el animal que escapa de la jaula); las fichas son region_animal
//   fondo       objeto del fondo (capa BG) que se muestra; los fondos de las otras regiones se ocultan
//   obstaculos  animaciones de spriteObstaculo (se saltan)
//   enemigos    animaciones de spriteCazador
//   danio       animaciones de spritePeligro (quitan una vida al tocarlos)
//   jaula       animación opcional de spriteJaula (si no, "Animation 1")
//
// Patagonia: el mapa elige una sola zona. El nivel 1 es el océano; el 2 (y siguientes) es tierra.

const SPRITES_PUNA = {
	personajes: { spriteMafalda: "AnimationPuna", spriteDieguito: "AnimationPuna" },
	huida: "Huida",
	fondo: "TiledBackgroundPuna",
	obstaculos: ["Default"],
	enemigos: ["CazadorPuna", "CazadorPuna2"],
	danio: ["Default"]
};

const SPRITES_OCEANO = {
	personajes: { spriteMafalda: "AnimationOceano", spriteDieguito: "AnimationOceano" },
	huida: "Huida_oceano",
	fondo: "TiledBackgroundPatagoniaOceano",
	obstaculos: ["Olita"],
	enemigos: ["CazadorOceano", "CazadorOceano2"],
	danio: ["Iceberg"],
	jaula: "Oceano"
};

const SPRITES_PATAGONIA = {
	personajes: { spriteMafalda: "AnimationPatagonia", spriteDieguito: "AnimationPatagonia" },
	tamanoPersonajes: { spriteMafalda: [53, 100], spriteDieguito: [72, 100] },
	huida: "Huida",
	fondo: "TiledBackgroundPatagonia",
	obstaculos: ["Default"],
	enemigos: ["CazadorPuna", "CazadorPuna2"],
	danio: ["Default"]
};

const ETAPA_OCEANO = {
	layout: "LaberintoPatagoniaOceano",
	sonidos: "patagonia_oceano",
	mapaLoop: "sprite_music_patagonia_oceano_loop",
	fichaPrefijo: "patagonia_oceano",
	animales: ["ballena", "orca", "pinguino"],
	sprites: SPRITES_OCEANO
};

const ETAPA_PATAGONIA = {
	layout: "LaberintoPatagonia",
	sonidos: "patagonia",
	mapaLoop: "sprite_music_patagonia_loop",
	fichaPrefijo: "patagonia",
	animales: ["huemul", "pudu", "huillin", "carpintero", "chinchillon", "cauquen", "maca", "cisne"],
	sprites: SPRITES_PATAGONIA
};

export const REGIONES = {
	puna: {
		layout: "LaberintoPuna",
		sonidos: "puna",
		mapaLoop: "SonidoMapa_puna_loop",
		titulo: "PUNA",
		animales: ["vicuna", "zorro_andino", "condor", "flamenco", "gato_andino", "guanaco", "puma", "taruca"],
		sprites: SPRITES_PUNA
	},
	chaco: {
		layout: "LaberintoChaco",
		sonidos: "chaco",
		mapaLoop: "SonidoMapa_chaco_loop",
		titulo: "CHACO",
		animales: ["quirquincho_bola"],
		sprites: SPRITES_PUNA
	},
	patagonia: {
		layout: "LaberintoPatagoniaOceano",
		sonidos: "patagonia_oceano",
		mapaLoop: "sprite_music_patagonia_oceano_loop",
		titulo: "PATAGONIA",
		fichaPrefijo: "patagonia_oceano",
		animales: ETAPA_OCEANO.animales,
		sprites: SPRITES_OCEANO,
		etapas: [ETAPA_OCEANO, ETAPA_PATAGONIA]
	},
	patagonia_oceano: {
		layout: "LaberintoPatagoniaOceano",
		sonidos: "patagonia_oceano",
		mapaLoop: "sprite_music_patagonia_oceano_loop",
		titulo: "PATAGONIA",
		fichaPrefijo: "patagonia_oceano",
		animales: ETAPA_OCEANO.animales,
		sprites: SPRITES_OCEANO,
		aliasDe: "patagonia"
	}
};

// Ids de ficha (prefijo_animal) de todos los animales de la región, en todas sus etapas.
export function idsDeRegion(region)
{
	const clave = claveRegion(region);
	const info = infoRegion(clave);
	const etapas = info.etapas?.length ? info.etapas : [{ fichaPrefijo: clave, animales: info.animales }];
	return etapas.flatMap(e => (e.animales ?? []).map(a => `${e.fichaPrefijo || clave}_${a}`));
}

// Carpeta de sounds/ de un prefijo de ficha (patagonia_oceano, patagonia, puna…).
export function carpetaSonidosDe(prefijo)
{
	for (const info of Object.values(REGIONES))
		for (const etapa of info.etapas ?? [])
			if (etapa.fichaPrefijo === prefijo) return etapa.sonidos;
	return infoRegion(prefijo).sonidos;
}

export function claveRegion(region)
{
	const clave = String(region || "puna").toLowerCase();
	return REGIONES[clave]?.aliasDe || (REGIONES[clave] ? clave : "puna");
}

export function infoRegion(region)
{
	return REGIONES[claveRegion(region)] || REGIONES.puna;
}

export function etapaDe(region, nivel = 1)
{
	const clave = claveRegion(region);
	const info = infoRegion(clave);
	const etapas = info.etapas;
	if (!etapas?.length)
		return { clave, fichaPrefijo: clave, ...info };
	const i = Math.min(etapas.length - 1, Math.max(0, (Number(nivel) || 1) - 1));
	return { clave, titulo: info.titulo, ...etapas[i] };
}

export function layoutDeRegion(region, nivel = 1)
{
	return etapaDe(region, nivel).layout;
}

export function spritesDeRegion(region, nivel = 1)
{
	return etapaDe(region, nivel).sprites;
}
