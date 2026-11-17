# Armar el laberinto rápido en Construct 3

Todos los muros van en **un solo objeto Tilemap** con `tileset_muros_noa.png` (tiles de 32×32).

**Número de tile = máscara + estilo × 16 + variante × 96**

| Estilo | nº | letra en el mapa |
|---|---|---|
| seto verde | 0 | `#` |
| seto florido | 1 | `F` |
| seto seco puna | 2 | `S` |
| seto yunga | 3 | `Y` |
| piedra gris | 4 | `P` |
| piedra rojiza | 5 | `R` |

- **Máscara (0–15):** suma de los vecinos que también son muro: norte=1, este=2, sur=4, oeste=8.
- **Variante (0–2):** filas 0–5 = variante 1, filas 6–11 = `_v2`, filas 12–17 = `_v3`.

En `guia_indices.png` está el número de cada tile.

---

## Preparación (una sola vez)

1. **Propiedades del proyecto:** *Sampling* → **Nearest** y *Pixel rounding* → **On**, así el pixel art no se ve borroso.
2. **Insertá un objeto Tilemap:**
   - En el editor de imagen, cargá `tileset_muros_noa.png`.
   - En las propiedades: *Tile width* = 32, *Tile height* = 32.
3. **Ponelo en una capa encima del fondo** (`fondo_topdown_1920x1080.png` en un Sprite o un Tiled Background).
4. **Colisiones:** agregale el behavior **Solid**. Así la exploradora (con *8 Direction*) no atraviesa los muros.

---

## Opción A: pintar con pincel automático (mapas hechos a mano)

1. En la **Tilemap Bar**, abrí el menú de la herramienta *Auto-tiling* y elegí **Edit brushes**.
2. Creá un brush de **16 tiles** por estilo.
3. Asigná a cada casilla de la plantilla la pieza que corresponde, mirando hacia qué lados conecta. Las columnas 0–15 de cada fila siguen el orden de la máscara.
4. Pintá el laberinto: las esquinas, las T y las puntas se acomodan solas.

Te conviene si vas a dibujar pocos niveles. Limitación: el brush automático no rellena rectángulos, hay que arrastrar el pincel.

---

## Opción B: el laberinto sale de un texto (recomendada para escala grande)

Escribís el nivel como texto y los eventos lo arman al iniciar el layout.

### 1. Variable global de texto `MAPA`

Cada fila es una línea. Un punto (`.`) es camino y cualquier letra de la tabla es muro:

```
###############
#.....#.......#
#.###.#.FFFFF.#
#.#.....F...F.#
#.#.#####.P.F.#
#...#.....P...#
###.#.PPPPPPP.#
#.....#.......#
###############
```

Para varios niveles podés guardar un texto por nivel en un Array o en un archivo `.txt` que cargás con AJAX.

### 2. Eventos (hoja del layout)

**Evento 1: System › On start of layout**

- **Sub-evento:** System › For `"y"` from `0` to `tokencount(MAPA, newline) - 1`
  - **Sub-evento:** System › For `"x"` from `0` to `len(tokenat(MAPA, loopindex("y"), newline)) - 1`
    - **Condición:** System › Compare two values
      `find("#FSYPR", mid(tokenat(MAPA, loopindex("y"), newline), loopindex("x"), 1))` **≥** `0`
    - **Acción:** Tilemap › Set tile
      X = `loopindex("x")`
      Y = `loopindex("y")`
      Tile = `find("#FSYPR", mid(tokenat(MAPA, loopindex("y"), newline), loopindex("x"), 1)) * 16`

  *(Esta primera pasada marca dónde hay muro y de qué estilo.)*

- **Sub-evento** (al mismo nivel que el primer For): System › For `"y"` from `0` to `tokencount(MAPA, newline) - 1`
  - **Sub-evento:** System › For `"x"` from `0` to `len(tokenat(MAPA, loopindex("y"), newline)) - 1`
    - **Condición:** System › Compare two values `Tilemap.TileAt(loopindex("x"), loopindex("y"))` **≥** `0`
    - **Acción:** Tilemap › Set tile en (`loopindex("x")`, `loopindex("y")`) con:

```
(Tilemap.TileAt(loopindex("x"), loopindex("y")-1) >= 0) * 1
+ (Tilemap.TileAt(loopindex("x")+1, loopindex("y")) >= 0) * 2
+ (Tilemap.TileAt(loopindex("x"), loopindex("y")+1) >= 0) * 4
+ (Tilemap.TileAt(loopindex("x")-1, loopindex("y")) >= 0) * 8
+ floor((Tilemap.TileAt(loopindex("x"), loopindex("y")) % 96) / 16) * 16
+ floor(random(3)) * 96
```

  *(La segunda pasada mira los 4 vecinos y elige la pieza exacta. También mezcla al azar las 3 variantes.)*

> En Construct, una comparación como `(a >= 0)` devuelve 1 o 0, por eso la suma da directo la máscara.
> Fuera del mapa, `TileAt` devuelve -1, así que los bordes también salen bien.

### 3. Objetos del nivel (animales, jaulas, cazadores, trampas)

Podés usar el mismo `MAPA` con otras letras, por ejemplo:

| Letra | Objeto |
|---|---|
| `E` | exploradora |
| `J` | jaula |
| `C` | cazador |
| `T` | cepo |
| `M` | meta |

En la primera pasada, sumá un sub-evento por letra con la acción System › **Create object** en `loopindex("x")*32 + 16`, `loopindex("y")*32 + 16`.

---

## Tu nivel como texto (`MAPA_tu_nivel.txt`)

Es tu layout actual pasado a texto: 22 columnas × 17 filas de 32 px. La imagen `ejemplo_tu_nivel.png` muestra cómo queda.

Letras de decoración y objetos:

| Letra | Qué crea | Sprite |
|---|---|---|
| `K` | cactus | `cactus_saguaro` |
| `V` | cueva | `cueva_roca` |
| `O` | roca | `roca_1` |
| `G` | portal COMIENZO | `portal_comienzo` |
| `E` | exploradora (inicio) | `quieta_abajo` |

Estas letras no son muros. Se crean con **System › Create object** dentro de la primera pasada, un sub-evento por letra.

- **Condición:** `mid(tokenat(MAPA, loopindex("y"), newline), loopindex("x"), 1)` = `"K"`
- **Acción:** Create object `Cactus` en X = `loopindex("x")*32 + 16`, Y = `loopindex("y")*32 + 32`

Poné el *origin* de esos sprites **abajo al centro**, así quedan apoyados en la casilla.
Para que el cactus, la cueva y las rocas bloqueen el paso, agregales **Solid**.

**Para editar el nivel, cambiá letras en el texto:** un tramo de seto es una fila de `#`, un recinto en U son 3 filas, y el camino es `.`.
