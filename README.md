# proyecto-fauna

Juego educativo en Construct 3 para conocer la fauna argentina, región a región: sus vulnerabilidades y las especies en peligro.

## Cómo está armado

Proyecto de carpeta de Construct 3 (`project.c3proj`). Abrilo con el editor (*Open local project*).

| Carpeta | Contenido |
|---|---|
| `layouts/` | `Home` (historia), `Inicio`, `Laberinto`, `EndGame` (títulos), `Creditos`; `Layout 1` es molde a mano: no borrar |
| `eventSheets/` | hojas de eventos |
| `objectTypes/` | objetos por carpeta (`personajes`, `interfaz`, `inicio`, `cinematica`, …) |
| `scripts/` | lógica del juego; la guía está en `scripts/construct_laberinto/GUIA_CONSTRUCT3.md` |
| `images/` | sprites que usa Construct |
| `sounds/` | efectos (WebM Opus) |
| `music/` | música de historia y títulos |
| `assets/pendientes/` | cartas, sonidos y fuentes todavía no cableados |

## Controles (resumen)

- **Home**: historia; **CONTINUAR** → mapa · **CRÉDITOS** → créditos
- En **Inicio**: escribir el **nombre** (guarda el álbum), elegir zona en el mapa y tocar **JUGAR**
- **Flechas** mover · **Espacio** cambiar Mafalda/Dieguito · **X** honda (Dieguito)
- **Pokédex**: álbum de cartas; flecha atrás / Esc / tocar fuera para cerrar
- **Parlante**: apaga/enciende el sonido del juego
- Solo **Mafalda** junta llaves y abre jaulas
- Al completar todos los animales de la región: **EndGame** → **Creditos** → **INICIO**
- Al perder las 3 vidas: **DESAFÍO PERDIDO**

Detalle completo: `scripts/construct_laberinto/GUIA_CONSTRUCT3.md`.
