// Muestra en la terminal un laberinto generado, fila por fila.
// Uso: node vista_previa.mjs [semilla] [jaulas]
import { generarMapa } from "../../generadorLaberinto.js";

const semilla = Number(process.argv[2] ?? Math.floor(Math.random() * 0xFFFFFFFF));
const jaulas = Number(process.argv[3] ?? 3);
const mapa = generarMapa({ semilla, jaulas });

console.log(`semilla ${semilla}, ${jaulas} jaulas\n`);
console.log(mapa.split("|").join("\n"));
console.log(`\nValor para MAPA:\n${mapa}`);
