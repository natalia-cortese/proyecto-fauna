import { generarMapa } from "./generadorLaberinto.js";
import { construirLaberinto } from "./construirLaberinto.js";
import { iniciarPersonajes, actualizarPersonajes, cambiarPersonaje, disparar, reintentar, volverAlInicio, manejarEscape, manejarEnter } from "./personajes.js";
import { mostrarFicha, cerrarFicha, elegirAnimales, alCompletarLaberinto } from "./fichas.js";
import { iniciarInicio, actualizarInicio, jugar, cerrarAlbumOFicha } from "./inicio.js";
import { iniciarHome, iniciarEndGame, iniciarCreditos, actualizarCinematica } from "./home.js";
import { layoutDeRegion, infoRegion } from "./regiones.js";
