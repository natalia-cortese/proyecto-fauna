# proyecto-fauna

Juego educativo en Construct 3 para conocer la fauna argentina, región a región: sus vulnerabilidades y las especies en peligro.

## Jugar

**[Probá el juego en itch.io →](https://faunathegame.itch.io/fauna)**

Se juega en el navegador, sin instalar nada (computadora con teclado). Regiones disponibles: **Puna** y **Patagonia** (océano y tierra).

## Cómo está armado

Proyecto de carpeta de Construct 3 (`project.c3proj`). Abrilo con el editor (*Open local project*).

| Carpeta | Contenido |
|---|---|
| `layouts/` | `Home`, `Inicio`, un laberinto por región o etapa (`LaberintoPuna`, `LaberintoPatagoniaOceano`, `LaberintoPatagonia`), `EndGame`, `Creditos`; `Layout 1` es molde: no borrar |
| `eventSheets/` | hojas de eventos (`LaberintoPuna`, `Event sheet 1` compartida, …) |
| `objectTypes/` | objetos por carpeta (`personajes`, `interfaz`, `inicio`, `cinematica`, …) |
| `scripts/` | lógica; regiones en `scripts/regiones.js`; guía en `scripts/construct_laberinto/GUIA_CONSTRUCT3.md` |
| `images/` | sprites (planos; prefijo `region_animal` en fichas/slots) |
| `sounds/` | efectos por región: `comun/`, `puna/`, `patagonia/`, `patagonia_oceano/`, `pampeana/` (WebM Opus) |
| `music/` | música de historia y títulos |
| `assets/pendientes/` | cartas y sonidos pendientes, por región |

## Controles (resumen)

- **Home**: historia; **CONTINUAR** → mapa · **CRÉDITOS** → créditos
- En **Inicio**: escribir el **nombre** (guarda el álbum), elegir zona en el mapa y tocar **JUGAR**
- **Flechas** mover · **Espacio** cambiar Mafalda/Dieguito · **X** honda (Dieguito)
- **Pokédex**: álbum de cartas; flechas debajo del álbum (o ← →) para cambiar de región; flecha atrás / Esc / tocar fuera para cerrar
- **Parlante**: apaga/enciende el sonido del juego
- Solo **Mafalda** junta llaves y abre jaulas; arriba se ve cuántas llaves hay
- Tras liberar a los animales, **entrar a la cueva** para el siguiente laberinto (cartel **NIVEL N — REGIÓN**)
- Al completar una región se vuelve al mapa (con un check verde en la región); con todas las regiones completas: **EndGame** → **Creditos** → **INICIO**
- Al perder las 3 vidas: **DESAFÍO PERDIDO**

Detalle completo: `scripts/construct_laberinto/GUIA_CONSTRUCT3.md` (incluye cómo sumar una región y sus sprites).

## Tests

`npm test` comprueba que sonidos y sprites no pierdan archivo ni referencia en Construct. En GitHub corre en cada PR (`.github/workflows/test.yml`).
