# Armar el laberinto rápido en Construct 3

Todos los muros van en **un solo objeto Tilemap** con `tileset_muros_noa_64.png` (tiles de **64×64**).

> El layout del proyecto está pensado a 64 px por casilla: el fondo (`TiledBackground`) mide ~1408×1088 = 22×17 casillas y los personajes miden ~62×74.
> `tileset_muros_noa.png` (32×32) es el original; `tileset_muros_noa_64.png` es el mismo dibujo ampliado ×2 sin suavizado. Los números de tile son los mismos en los dos.

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

> En el proyecto ya está hecha: el objeto `Tilemap` existe y el layout `Laberinto` lo usa (ver opción C). Estos pasos sirven para armar otro layout igual.

1. **Propiedades del proyecto:** *Sampling* → **Nearest** y *Pixel rounding* → **On** (ya están así en `fauna`).
2. **Insertá un objeto Tilemap** (nombre: `Tilemap`) en `Layer 1`:
   - En el editor de imagen, cargá `tileset_muros_noa_64.png`.
   - En las propiedades del objeto: *Tile width* = 64, *Tile height* = 64.
   - Instancia en X = 0, Y = 0, tamaño **1408 × 1088** (22 × 17 casillas).
3. **Fondo:** el `TiledBackground` de la capa `BG` ponelo en X = 0, Y = 0, tamaño 1408 × 1088.
4. **Colisiones:** agregale al Tilemap el behavior **Solid**. Así `spriteNena` (con *8 Direction*) no atraviesa los muros, y el *Pathfinding* de `spriteNene` los esquiva.
5. **Usá un layout aparte** (solo si usás la opción B): poné el Tilemap, el fondo, `spriteNena` y `spriteNene` en un layout nuevo, sin muros ni decorados puestos a mano, porque el mapa los crea. **No borres todas las instancias de `Layout 1`:** Construct solo puede crear por evento un objeto que tenga al menos una instancia en algún layout, y toma de ahí sus propiedades. `spriteNena` y `spriteNene` sí van en el layout nuevo: el mapa solo los mueve.

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

El valor inicial de una variable es de **una sola línea**, así que las filas se separan con `|`. Un punto (`.`) es camino y cualquier letra de la tabla es muro. Ejemplo chico:

```
###############|#.....#.......#|#.###.#.FFFFF.#|#.#.....F...F.#|###############
```

Para editarlo cómodo, escribilo fila por fila (como en `MAPA_tu_nivel.txt`) y después uní las filas con `|`.
Para varios niveles podés guardar un texto por nivel en un Array o en un archivo `.txt` que cargás con AJAX.

### 2. Eventos (en `Event sheet 1`)

**Evento 1: System › On start of layout**

Dentro del evento agregá dos **variables locales** de texto: `fila` y `c`.

- **Sub-evento (primera pasada):** System › For `"y"` from `0` to `tokencount(MAPA, "|") - 1`
  - **Acción:** System › Set `fila` to `tokenat(MAPA, loopindex("y"), "|")`
  - **Sub-evento:** System › For `"x"` from `0` to `len(fila) - 1`
    - **Acción:** System › Set `c` to `mid(fila, loopindex("x"), 1)`
    - **Sub-evento (muros):** System › Compare two values `find("#FSYPR", c)` **≥** `0`
      - **Acción:** Tilemap › Set tile
        X = `loopindex("x")`, Y = `loopindex("y")`, Tile = `find("#FSYPR", c) * 16`
    - **Sub-eventos de objetos:** uno por letra, ver la sección 3.

  *(Esta primera pasada marca dónde hay muro y de qué estilo, y crea los objetos.)*

- **Sub-evento (segunda pasada, al mismo nivel que el primer For):** System › For `"y"` from `0` to `tokencount(MAPA, "|") - 1`
  - **Sub-evento:** System › For `"x"` from `0` to `len(tokenat(MAPA, loopindex("y"), "|")) - 1`
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

- **Últimas acciones del evento 1:**
  - `spriteNene` › Pathfinding › **Regenerate obstacle map**. El Pathfinding calcula los obstáculos al arrancar, antes de que existan los muros; sin esto `spriteNene` no los ve.
  - `spriteNena` › **Move to top** y `spriteNene` › **Move to top**. Los objetos creados por evento quedan arriba de todo; sin esto el portal tapa a los personajes.

> En Construct, una comparación como `(a >= 0)` devuelve 1 o 0, por eso la suma da directo la máscara.
> Fuera del mapa, `TileAt` devuelve -1, así que los bordes también salen bien.

### 3. Objetos del nivel

Estas letras no son muros. Dentro de la primera pasada va un sub-evento por letra:

- **Condición:** System › Compare two values `c` = `"K"` (la letra que corresponda)
- **Acciones:**
  1. System › **Create object** `spriteSaguaro` en la capa `"Layer 1"`, X = `loopindex("x")*64 + 32`, Y = `loopindex("y")*64 + 32`
  2. `spriteSaguaro` › **Set size** (ver tabla)
  3. `spriteSaguaro` › **Set Y** to `Self.Y + 32 - Self.Height / 2`

Los sprites del proyecto tienen el *origin* en el **centro**. El paso 3 baja cada objeto para que quede apoyado en el borde de abajo de su casilla. El paso 2 hace falta porque un objeto creado por evento usa el tamaño de su imagen, y las imágenes tienen tamaños muy distintos (los personajes miden más de 1000 px).

| Letra | Qué es | Objeto | Acción | Tamaño |
|---|---|---|---|---|
| `K` | cactus | `spriteSaguaro` | Create object | 80 × 130 |
| `V` | cueva | `spriteCueva` | Create object | 200 × 150 |
| `O` | roca | `spriteRock` | Create object | 40 × 34 |
| `G` | portal COMIENZO | `spritePortal` | Create object | 176 × 190 |
| `J` | jaula | `spriteJaula` | Create object | 96 × 92 |
| `L` | llave | `Sprite2` | Create object | 70 × 76 |
| `E` | exploradora (inicio) | `spriteNena` | **Set position** (no crear) | el del layout |
| `N` | compañero | `spriteNene` | **Set position** (no crear) | el del layout |

Para `E` y `N` usá **Set position** con X = `loopindex("x")*64 + 32` e Y = `loopindex("y")*64 + 32`. Ya existe una sola instancia de cada uno en el layout y los eventos de movimiento la usan.

`spriteSaguaro` y `spriteRock` ya tienen **Solid**, así que bloquean el paso (tocar un cactus reinicia el layout). La cueva no bloquea.
Si un personaje se traba en los pasillos de 1 casilla, achicale el *collision polygon*.

---

## Opción C: un laberinto nuevo en cada partida (generador)

**Ya está conectado en el proyecto.** Abrí el layout **`Laberinto`** y apretá *Preview* (F5): cada partida arma un laberinto distinto. `Laberinto` es también el *First layout* del proyecto, así que el juego exportado arranca ahí. `Layout 1` (tu nivel hecho a mano) quedó igual.

Qué genera (22 × 17 casillas, como el layout):

- Pasillos de **2 casillas** de ancho (los personajes miden ~55×73 px, en 1 casilla no pasan).
- Una **sala en el medio** con la cueva y las jaulas, con 3 entradas desde el laberinto.
- **Tantas llaves como jaulas**, escondidas en callejones sin salida, lejos del inicio y de la sala, y separadas entre sí.
- Cactus en otros callejones (nunca tapan un camino) y rocas en la fila de abajo de cada pasillo (dejan lugar para pasar).
- Portal, nena y nene en la esquina de abajo a la izquierda.

![Ejemplo generado](generador/ejemplo_generado.png)

### Qué hay en el proyecto

| Dónde | Qué hace |
|---|---|
| `scripts/generadorLaberinto.js` | `generarMapa(opciones)`: devuelve el texto `MAPA` (filas separadas por `\|`) |
| `scripts/construirLaberinto.js` | `construirLaberinto(runtime, mapa)`: pinta los muros en el `Tilemap` con la máscara de vecinos, crea los objetos de cada letra con su tamaño, mueve a la nena y al nene, los pone delante del portal y regenera el mapa del *Pathfinding* |
| `scripts/importsForEvents.js` | nombre especial de Construct: lo que importa se puede usar en los bloques de script de las hojas de eventos |
| objeto `Tilemap` | `tileset_muros_noa_64.png`, tiles de 64, con **Solid** |
| layout `Laberinto` | fondo, `Tilemap` vacío de 22 × 17, `spriteNena` y `spriteNene` |
| hoja `Laberinto` | incluye `Event sheet 1` (movimiento, cactus, llaves, jaulas) y agrega lo de abajo |
| `spriteNena` | behavior **Scroll To**: la cámara la sigue (el mapa es más grande que la pantalla de 1024 × 1024) |

Eventos de la hoja `Laberinto`:

1. Variable global `SEMILLA` (número, `0`): qué laberinto se está jugando. Las variables globales no se borran con *Restart layout*, así que **chocar un cactus repite el mismo laberinto**.
2. *On start of layout* › script:

   ```js
   if (!runtime.globalVars.SEMILLA)
   	runtime.globalVars.SEMILLA = Math.floor(Math.random() * 1e9) + 1;
   const mapa = generarMapa({ jaulas: 3, semilla: runtime.globalVars.SEMILLA });
   construirLaberinto(runtime, mapa);
   ```

3. *Compare two values* `spriteJaula.Count` = `0` + *Trigger once* › Set `SEMILLA` to `0` › *Restart layout*: **al abrir todas las jaulas sale un laberinto nuevo.**

En `Event sheet 1`, `llave` pasó a ser un **contador**: cada llave suma 1 (*Add to*) y cada jaula pide `llave` ≥ 1 y resta 1 (*Subtract from*). Así cada llave abre una sola jaula y hay que juntarlas todas. En `Layout 1` funciona igual que antes.

### Cambiar el laberinto

Editá el objeto que recibe `generarMapa` en el script de la hoja `Laberinto`, por ejemplo `generarMapa({ jaulas: 5, cactus: 5, semilla: ... })`. Opciones (todas opcionales):

| Opción | Por defecto | Qué hace |
|---|---|---|
| `jaulas` | 3 | jaulas y llaves (de 1 a 5) |
| `rocas` | 4 | rocas sueltas |
| `cactus` | 3 | cactus, si hay callejones libres |
| `entradasSala` | 3 | entradas a la sala del medio |
| `bucles` | 0.06 | probabilidad de abrir un muro extra; más alto = más caminos alternativos |
| `estilos` | `"##FS"` | letras de muro para el interior (repetir una letra la hace más común) |
| `estiloBorde` | `"#"` | letra del borde del mapa |
| `ancho`, `alto` | 22, 17 | tamaño en casillas; si lo cambiás, cambiá también el tamaño del `Tilemap`, del fondo y del layout |
| `semilla` | al azar | el mismo número da siempre el mismo laberinto |

Para jugar siempre **un laberinto fijo**, poné el número en la variable `SEMILLA` (por ejemplo `127492926`) en vez de `0`.

### Ver laberintos sin abrir Construct

```
node scripts/construct_laberinto/generador/vista_previa.mjs [semilla] [jaulas]
```

Muestra el laberinto fila por fila y el texto `MAPA`, por si querés guardar un nivel que te gustó.

---

## Tu nivel como texto (`MAPA_tu_nivel.txt`)

Es `Layout 1` pasado a texto: 22 columnas × 17 filas de 64 px (1408 × 1088). La imagen `ejemplo_tu_nivel.png` muestra cómo queda, con el fondo y los sprites reales del proyecto.

Qué es cada parte:

- Setos verdes (`#`): el borde de arriba, los setos verticales, los bloques chicos y los tres recintos en U con un cactus adentro (`#K#` arriba de `###`).
- Setos floridos (`F`): el seto de arriba al centro y los verticales claros de la izquierda abajo y de la derecha.
- Seto seco (`S`): el bloque amarillo del centro abajo y la hilera del borde de abajo. En el layout la hilera de abajo son postes separados; acá es continua para que los personajes no se escapen por los huecos.

Valor para pegar en la variable `MAPA`:

```
.######........#######|#.....#........#.....F|#....O...FFFF.......LF|#..#.............#K#.F|#..#.......J...#.###.F|#..#..#K.......#.....F|#.....#..V.....#.....F|#..#..#..........#...F|...#..#........#...#.F|F......##.#..K.#...#..|F..#K#.........#...#..|F..###....O.....#K#..#|F......SS...##..###..#|...................L.#|.EN..................#|.G...................#|....SSSSSSSSSSSSSSSSS.
```

**Para editar el nivel, cambiá letras en el texto:** un tramo de seto es una fila de `#`, un recinto en U son 3 filas, y el camino es `.`. Si cambiás el archivo, volvé a unir las filas con `|`.
