# proyecto-fauna

Juego educativo en Construct 3 para conocer la fauna argentina, región a región: sus vulnerabilidades y las especies en peligro.

## Cómo está armado

Proyecto de carpeta de Construct 3 (`project.c3proj`). Abrilo con el editor (*Open local project*).

| Carpeta | Contenido |
|---|---|
| `layouts/` | `Inicio`, `Laberinto` (y `Layout 1`, molde a mano: no borrar) |
| `eventSheets/` | hojas de eventos |
| `objectTypes/` | objetos por carpeta (`personajes`, `interfaz`, `inicio`, …) |
| `scripts/` | lógica del juego; la guía está en `scripts/construct_laberinto/GUIA_CONSTRUCT3.md` |
| `images/` | sprites que usa Construct |
| `sounds/` | audio en uso (WebM Opus) |
| `assets/pendientes/` | cartas, sonidos y fuentes todavía no cableados |

## Controles (resumen)

- **Flechas** mover · **Espacio** cambiar Mafalda/Dieguito · **X** honda (Dieguito)
- Solo **Mafalda** junta llaves y abre jaulas
- Al perder las 3 vidas: pantalla **DESAFÍO PERDIDO**

Detalle completo: `scripts/construct_laberinto/GUIA_CONSTRUCT3.md`.
