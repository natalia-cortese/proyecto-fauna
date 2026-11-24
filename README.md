# proyecto-fauna

Juego educativo en Construct 3 para conocer la fauna argentina, región a región: sus vulnerabilidades y las especies en peligro.

## Cómo está armado

Proyecto de carpeta de Construct 3 (`project.c3proj`). Abrilo con el editor (*Open local project*).

| Carpeta | Contenido |
|---|---|
| `layouts/` | `Home`, `Inicio`, `LaberintoPuna` (un layout por región), `EndGame`, `Creditos`; `Layout 1` es molde: no borrar |
| `eventSheets/` | hojas de eventos (`LaberintoPuna`, `Event sheet 1` compartida, …) |
| `objectTypes/` | objetos por carpeta (`personajes`, `interfaz`, `inicio`, `cinematica`, …) |
| `scripts/` | lógica; regiones en `scripts/regiones.js`; guía en `scripts/construct_laberinto/GUIA_CONSTRUCT3.md` |
| `images/` | sprites (planos; prefijo `region_animal` en fichas/slots) |
| `sounds/` | efectos por región: `comun/`, `puna/`, `chaco/` (WebM Opus) |
| `music/` | música de historia y títulos |
| `assets/pendientes/` | cartas y sonidos pendientes, por región |

## Controles (resumen)

- **Home**: historia; **CONTINUAR** → mapa · **CRÉDITOS** → créditos
- En **Inicio**: escribir el **nombre** (guarda el álbum), elegir zona en el mapa y tocar **JUGAR**
- **Flechas** mover · **Espacio** cambiar Mafalda/Dieguito · **X** honda (Dieguito)
- **Pokédex**: álbum de cartas; flecha atrás / Esc / tocar fuera para cerrar
- **Parlante**: apaga/enciende el sonido del juego
- Solo **Mafalda** junta llaves y abre jaulas
- Tras liberar a los animales, **entrar a la cueva** para el siguiente laberinto (cartel **NIVEL N — REGIÓN**); con el álbum completo: **EndGame** → **Creditos** → **INICIO**
- Al perder las 3 vidas: **DESAFÍO PERDIDO**

Detalle completo: `scripts/construct_laberinto/GUIA_CONSTRUCT3.md` (incluye cómo sumar una región y sus sprites).
