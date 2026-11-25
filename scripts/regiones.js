// Regiones jugables: layout del laberinto, sonidos, animales y sprites de cada región.
//
// Los objetos de Construct son los mismos en todas las regiones (spriteMafalda, spriteRock, spriteCazador…);
// cada región elige qué animación muestra cada uno. Para cambiar un sprite en una región nueva, agregá la
// animación al objeto en Construct y poné su nombre acá. Las listas sortean una animación por objeto creado.
//
//   personajes  animación de spriteMafalda y spriteDieguito
//   huida       animación de spriteHuida (el animal que escapa de la jaula); las fichas son region_animal
//   fondo       objeto del fondo (capa BG) que se muestra; los fondos de las otras regiones se ocultan
//   obstaculos  animaciones de spriteRock (se saltan)
//   enemigos    animaciones de spriteCazador
//   danio       animaciones de spriteSaguaro (quitan una vida al tocarlos)

export const REGIONES = {
	puna: {
		layout: "LaberintoPuna",
		sonidos: "puna",
		mapaLoop: "SonidoMapa_puna_loop",
		titulo: "PUNA",
		animales: ["vicuna", "zorro_andino", "condor", "flamenco", "gato_andino", "guanaco", "puma", "taruca"],
		sprites: {
			personajes: { spriteMafalda: "AnimationPuna", spriteDieguito: "AnimationPuna" },
			huida: "Huida",
			fondo: "TiledBackgroundPuna",
			obstaculos: ["Default"],
			enemigos: ["CazadorPuna", "CazadorPuna2"],
			danio: ["Default"]
		}
	},
	chaco: {
		layout: "LaberintoChaco",
		sonidos: "chaco",
		mapaLoop: "SonidoMapa_chaco_loop",
		titulo: "CHACO",
		animales: ["quirquincho_bola"],
		sprites: {
			personajes: { spriteMafalda: "AnimationPuna", spriteDieguito: "AnimationPuna" },
			huida: "Huida",
			fondo: "TiledBackgroundPuna",
			obstaculos: ["Default"],
			enemigos: ["CazadorPuna", "CazadorPuna2"],
			danio: ["Default"]
		}
	},
	patagonia_oceano: {
		layout: "LaberintoPatagoniaOceano",
		sonidos: "patagonia_oceano",
		mapaLoop: "sprite_music_patagonia_oceano_loop",
		titulo: "PATAGONIA",
		animales: ["ballena", "orca", "estrella"],
		sprites: {
			personajes: { spriteMafalda: "AnimationOceano", spriteDieguito: "AnimationOceano" },
			huida: "Huida_oceano",
			fondo: "TiledBackgroundPatagoniaOceano",
			obstaculos: ["Olita"],
			enemigos: ["CazadorOceano", "CazadorOceano2"],
			danio: ["Iceberg"]
		}
	},
	patagonia: {
		layout: "LaberintoPatagonia",
		sonidos: "patagonia",
		mapaLoop: "sprite_music_patagonia_loop",
		titulo: "PATAGONIA",
		animales: ["huemul", "pudu", "huillin", "carpintero", "cisne", "maca", "cauquen", "chinchillon", "ballena", "orca", "pinguino", "estrella"],
		sprites: {
			personajes: { spriteMafalda: "AnimationPatagonia", spriteDieguito: "AnimationPatagonia" },
			huida: "HuidaPatagonia",
			fondo: "TiledBackgroundPatagonia",
			obstaculos: ["Olas"],
			enemigos: ["CazadorPatagonia1", "CazadorPatagonia2"],
			danio: ["Iceberg"]
		}
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

export function spritesDeRegion(region)
{
	return infoRegion(region).sprites;
}
