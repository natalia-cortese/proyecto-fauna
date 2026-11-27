# Pendientes

Material que todavía no está cableado en el juego, **ordenado por región**.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `cartas/puna/` | fichas de la Puna aún no en el juego (o borradores) |
| `cartas/pampeana/` | fichas de la Pampeana pendientes |
| `cartas/otras/` | otras regiones / sin región definida |
| `sonidos/puna/` | SFX de la Puna pendientes |
| `sonidos/pampeana/` | SFX de la Pampeana pendientes |
| `sonidos/otras/` | SFX de otras regiones |
| `fuentes/` | originales (p. ej. MP3); el juego usa WebM Opus en `sounds/` |

## Convención al cablear

**Imágenes del juego** (Construct exige `images/` plano):

- Ficha: `images/spritefichaanimal-<region>_<animal>-000.png` + animación `<region>_<animal>` en `spriteFichaAnimal`
- Slot de álbum: `images/spritealbumslot-<region>_<animal>-000.png`

**Sonidos del juego** (subcarpetas en Sounds):

- `sounds/<region>/sprite_sfx_<animal>.webm`
- Mapa: `sounds/<region>/SonidoMapa_<region>_loop.webm`
- Comunes: `sounds/comun/` (`GameOver`, `golpe_cazador`, …)

Sumá el animal a `animales` de su región en `scripts/regiones.js`. Si es región nueva, seguí «Sumar un animal» / «Sumar una región» en `scripts/construct_laberinto/GUIA_CONSTRUCT3.md`.
