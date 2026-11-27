// Regiones jugables: layout del laberinto, sonidos, animales y sprites de cada región.
//
// Los objetos de Construct son los mismos en todas las regiones (spriteMafalda, spriteObstaculo, spriteCazador…);
// cada región elige qué animación muestra cada uno. Para cambiar un sprite en una región nueva, agregá la
// animación al objeto en Construct y poné su nombre acá. Las listas sortean una animación por objeto creado.
//
//   personajes  animación de spriteMafalda y spriteDieguito
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

const numeradas = (prefijo, cantidad) =>
	Array.from({ length: cantidad }, (_, i) => prefijo + String(i + 1).padStart(2, "0"));

const SPRITES_PATAGONIA = {
	personajes: { spriteMafalda: "AnimationPatagonia", spriteDieguito: "AnimationPatagonia" },
	huida: "Huida",
	fondo: "TiledBackgroundPatagonia",
	obstaculos: ["Default"],
	enemigos: ["CazadorPuna", "CazadorPuna2"],
	danio: ["Default"],
	// En vez de los setos del Tilemap (que sigue como muro sólido, invisible) cada casilla de muro
	// lleva una roca y algunas una planta encima.
	// rocasAltas: las que cubren bien la casilla en los muros verticales.
	muros: {
		objeto: "spriteMuroPatagonia",
		rocas: numeradas("Roca", 16),
		rocasAltas: ["Roca01", "Roca02", "Roca03", "Roca05", "Roca07", "Roca14"],
		plantas: numeradas("Planta", 19)
	}
};

const ETAPA_OCEANO = {
	layout: "LaberintoPatagoniaOceano",
	sonidos: "patagonia_oceano",
	mapaLoop: "sprite_music_patagonia_oceano_loop",
	fichaPrefijo: "patagonia_oceano",
	animales: ["ballena", "orca", "pinguino", "elefante_marino", "estrella"],
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
	pampeana: {
		layout: "LaberintoPampeana",
		sonidos: "pampeana",
		mapaLoop: "SonidoMapa_pampeana_loop",
		titulo: "PAMPEANA",
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

// Regiones que se pueden elegir en el mapa de Inicio; las demás aparecen con candado.
export const REGIONES_JUGABLES = ["puna", "patagonia"];

// Una región está completa cuando el álbum tiene todos sus animales (de todas sus etapas).
export function regionCompleta(region, coleccion)
{
	const ids = idsDeRegion(region);
	return ids.length > 0 && ids.every(id => coleccion.has(id));
}

function etapaCompleta(region, numero, coleccion)
{
	const e = etapaDe(region, numero);
	return (e.animales ?? []).every(a => coleccion.has(`${e.fichaPrefijo || e.clave}_${a}`));
}

// Etapa (desde 1) por la que se entra a la región: la primera que tiene animales sin rescatar.
export function primeraEtapaPendiente(region, coleccion)
{
	const total = infoRegion(region).etapas?.length || 1;
	for (let n = 1; n <= total; n++)
		if (!etapaCompleta(region, n, coleccion)) return n;
	return 1;
}

// Etapa del laberinto siguiente, o null si la región quedó completa. nivel es el nivel siguiente (ya avanzado).
// La primera vuelta recorre las etapas en orden (océano → tierra); después rota entre las que tienen animales sin rescatar.
export function siguienteEtapa(region, nivel, etapaActual, coleccion)
{
	const total = infoRegion(region).etapas?.length || 1;
	if (nivel <= total) return nivel;
	if (regionCompleta(region, coleccion)) return null;
	for (let k = 1; k <= total; k++)
	{
		const n = (etapaActual - 1 + k) % total + 1;
		if (!etapaCompleta(region, n, coleccion)) return n;
	}
	return null;
}

// Adónde ir al salir por la cueva: otra etapa de la región → final si están todas completas → mapa.
export function destinoAlCompletar(region, nivel, coleccion, etapaActual = nivel - 1)
{
	const etapa = siguienteEtapa(region, nivel, etapaActual, coleccion);
	if (etapa) return layoutDeRegion(region, etapa);
	if (REGIONES_JUGABLES.every(r => regionCompleta(r, coleccion)))
		return "EndGame";
	return "Inicio";
}

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
