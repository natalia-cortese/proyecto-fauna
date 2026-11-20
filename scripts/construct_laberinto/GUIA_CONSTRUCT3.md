# FAUNA en Construct 3

Cómo está armado el juego y qué tocar para cambiarlo.

## Recorrido del juego

1. **`Inicio`** (*First layout*): pantalla de título **FAUNA** con el mapa de Argentina. Hay que escribir el **nombre** (`textNombre` → variable `JUGADOR`); sin nombre no se puede jugar. Solo la **Puna** está habilitada. El mapa solo elige la región (`REGION`); el juego arranca al tocar **JUGAR**.
2. **Álbum de fauna:** el botón pokédex (arriba a la derecha en Inicio y en el HUD del Laberinto) abre el álbum. Las cartas rescatadas se guardan en `localStorage` por jugador (`fauna_album_<nombre>`). Tocar una carta del álbum la reabre con su sonido; Esc cierra.
3. **`Laberinto`**: suena de fondo, en loop, `SonidoMapa_NOA_loop` (carpeta `sounds`, a -12 dB, etiqueta `"musica"`; no se corta al perder vidas ni al pasar de laberinto, y queda en pausa mientras se muestra una ficha o el álbum). Cada partida arma un laberinto nuevo (28 × 19 casillas de 64 px) con niebla, llaves, jaulas, cactus, rocas y cazadores. Las jaulas guardan animales sorteados de la región elegida.
4. Al abrir una jaula se ve la animación de huida y después la **ficha del animal** (se suma al álbum del jugador), con su sonido en loop, hasta Espacio o Enter.
5. Al abrir todas las jaulas y cerrar la última ficha, sale un laberinto nuevo.
6. Al perder las 3 vidas aparece **DESAFÍO PERDIDO**. **Espacio/Enter o «VOLVER A INTENTARLO»** reintentan; **Esc o «INICIO»** vuelven al mapa.

Para probar en el editor, abrí el layout que quieras ver y apretá *Preview* (F5): arranca en el layout abierto. El juego exportado arranca siempre en `Inicio`.

`Layout 1` es el nivel hecho a mano del principio. No se juega, pero **no hay que borrarlo**: tiene las instancias que Construct usa como molde para crear por script la cueva, el portal, las jaulas, las llaves, las rocas y los cactus. Las llaves, las jaulas, el cambio de personaje y las vidas también funcionan ahí.

## Controles

- **Flechas:** mover al personaje elegido.
- **Espacio:** cambiar entre **Mafalda** y **Dieguito** (la flecha amarilla marca cuál se maneja y la cámara lo sigue; el otro lo sigue solo).
- **X:** mientras se maneja a Dieguito, tira una piedrita con la honda hacia donde camina (una cada medio segundo). Arriba a la derecha aparece el cartel «X: tirar con la honda».
- **Espacio o Enter:** cerrar la ficha de un animal, o volver a intentar desde la pantalla de GAME OVER.
- **Esc:** cierra el álbum (o la ficha abierta desde el álbum); en GAME OVER, vuelve al mapa.
- **Pokédex:** abre el álbum de cartas del jugador.
- **Solo Mafalda junta las llaves y abre las jaulas**, y solo mientras se la maneja (siguiendo a Dieguito no hace nada). Al acercarse a una jaula sin poder abrirla, la jaula muestra un globo: «Solo Mafalda puede abrirnos» si se maneja a Dieguito, o «Necesitás una de las llaves para abrirnos» si Mafalda no tiene llaves. Si Dieguito toca una llave, arriba de la llave aparece «Solo Mafalda puede recolectar las llaves». **Solo Dieguito tira con la honda.** Así hay que ir cambiando de personaje.
- Caminar contra una roca la salta si del otro lado hay lugar.

## Qué hay en el proyecto

| Dónde | Qué hace |
|---|---|
| `scripts/inicio.js` | pantalla de inicio: nombre obligatorio, zona y botón laten, pokédex abre el álbum, pasa al laberinto. Zonas en `ZONAS` |
| `scripts/album.js` | álbum de fauna: progreso por jugador en `localStorage`, abrir/cerrar, ranuras y releer fichas |
| `scripts/generadorLaberinto.js` | `generarMapa(opciones)`: arma el laberinto como texto (ver [El mapa como texto](#el-mapa-como-texto)) |
| `scripts/construirLaberinto.js` | `construirLaberinto(runtime, mapa)`: pinta los muros en el `Tilemap`, crea los objetos de cada letra con su tamaño, pone a Mafalda y a Dieguito delante del portal y regenera el mapa del *Pathfinding* |
| `scripts/personajes.js` | movimiento, cambio de personaje con Espacio, el que sigue con *Pathfinding*, espejado según hacia dónde caminan, vidas (un cactus o un cazador resta una y los dos vuelven al portal, parpadeando 1,5 s sin poder perder otra), corazones del HUD y la pantalla de GAME OVER (`reintentar` y `volverAlInicio`). En `Layout 1`, que no tiene los sprites de GAME OVER, perder todas las vidas reinicia el layout |
| `scripts/gameOver.js` | arma la pantalla de DESAFÍO PERDIDO: muestra/oculta fondo, cartel, animación y botones; los botones laten y se pueden tocar |
| `scripts/cazadores.js` | cada cazador va y viene por un tramo corto de su pasillo; cada 3–6 s se esconde entre los setos y aparece en otro punto. Si el personaje manejado se le acerca a menos de 44 px mientras se ve, pierde una vida. Escondido no hace daño |
| `scripts/honda.js` | la honda de Dieguito: la piedrita vuela hasta 420 px, pasa por encima de las rocas, se frena en muros y cactus y derriba al cazador que toque si se lo ve (no sirve contra uno escondido). Al derribar suena `golpe_cazador`; el cazador cae y no vuelve en ese laberinto |
| `scripts/cartelJaula.js` | el globo `spriteCartelJaula` (capa `Niebla`): sobre la jaula más cercana cuando el personaje manejado está a menos de 40 px y no puede abrirla, y sobre la llave que toca Dieguito manejado. Cada texto es una animación del globo: `solo_mafalda`, `necesita_llave` y `solo_mafalda_llave` |
| `scripts/saltoRoca.js` | salto en arco de 0,4 s por encima de una roca |
| `scripts/niebla.js` | el `Tilemap` **Niebla** (casillas de 32 px) tapa el mapa y se despeja para siempre alrededor de los personajes. `RADIO` cambia cuánto se ve |
| `scripts/fichas.js` | sorteo de animales por laberinto y ficha del animal rescatado (ver [Sumar un animal](#sumar-un-animal)) |
| `scripts/importsForEvents.js` | nombre especial de Construct: lo que importa se puede usar en los bloques de script de las hojas de eventos |
| hoja `Inicio` | variables `REGION`, `JUGADOR`; llama a `inicio.js`; Enter/Espacio/Esc cierran álbum; solo JUGAR arranca; al empezar corta la música |
| hoja `Event sheet 1` | variables `LLAVES`, `VIDAS`, `FICHA`, `ALBUM`, `GAMEOVER`, `SONIDO`, `PERSONAJE`; llama a `personajes.js` y `fichas.js`; Esc/Enter también manejan álbum y GAME OVER |
| hoja `Laberinto` | incluye `Event sheet 1`; variable `SEMILLA`; arma el laberinto al empezar y pasa a uno nuevo al abrir todas las jaulas |
| layout `Laberinto` | 1792 × 1216. Capas: `BG` (fondo), `Layer 1` (`Tilemap` con **Solid**, personajes y moldes fuera de pantalla de `spriteHuida`, `spriteCazador` y `spritePiedrita`), `Niebla` (niebla y flecha) y `HUD` (paralaje 0: corazones, ficha y pantalla de GAME OVER) |

Los objetos están ordenados en carpetas del panel *Project*: `inicio` (fondo, zona, botón jugar, nombre y etiqueta), `personajes`, `muros_y_tiles`, `animales_libres`, `cazadores`, `jaulas_y_metas` e `interfaz` (HUD, GAME OVER y álbum: `spriteBotonAlbum`, `spriteAlbumFondo`, `spriteAlbum`, `spriteAlbumSlot`). En disco, cada objeto está en `objectTypes/<carpeta>/`.

## Cambiar el laberinto

El script de *On start of layout* de la hoja `Laberinto`:

```js
const JAULAS = 3;
if (!runtime.globalVars.SEMILLA)
	runtime.globalVars.SEMILLA = Math.floor(Math.random() * 1e9) + 1;
const mapa = generarMapa({ jaulas: JAULAS, semilla: runtime.globalVars.SEMILLA });
construirLaberinto(runtime, mapa);
elegirAnimales(runtime.globalVars.REGION, runtime.globalVars.SEMILLA, JAULAS);
```

Para cambiar la cantidad de jaulas, cambiá `JAULAS`. Las demás opciones se suman al objeto que recibe `generarMapa`, por ejemplo `generarMapa({ jaulas: JAULAS, cactus: 5, semilla: ... })`. Todas son opcionales:

| Opción | Por defecto | Qué hace |
|---|---|---|
| `jaulas` | 3 | jaulas y llaves (de 1 a 5) |
| `rocas` | 6 | rocas sueltas |
| `cactus` | 4 | cactus, si hay callejones libres (solo van en callejones porque tapan todo el pasillo) |
| `cazadores` | 4 | cazadores en pasillos, a 4 casillas o más del inicio y separados entre sí |
| `entradasSala` | 3 | entradas a la sala del medio |
| `bucles` | 0.06 | probabilidad de abrir un muro extra; más alto = más caminos alternativos |
| `estilos` | `"##FS"` | letras de muro para el interior (repetir una letra la hace más común) |
| `estiloBorde` | `"#"` | letra del borde del mapa |
| `ancho`, `alto` | 28, 19 | tamaño en casillas; conviene 1 + múltiplo de 3. Si lo cambiás, cambiá también el tamaño del `Tilemap`, de la niebla, del fondo y del layout (casillas × 64 px) |
| `semilla` | al azar | el mismo número da siempre el mismo laberinto |

Para jugar siempre **un laberinto fijo**, poné un número en la variable `SEMILLA` (por ejemplo `127492926`) en vez de `0`.

Qué genera siempre: pasillos de 2 casillas de ancho (en 1 casilla los personajes no pasan), una sala en el medio con la cueva y las jaulas, tantas llaves como jaulas escondidas en callejones lejos del inicio, cactus que nunca tapan un camino y el portal con los personajes en la esquina de abajo a la izquierda.

![Ejemplo generado](generador/ejemplo_generado.png)

Para ver laberintos sin abrir Construct:

```
node scripts/construct_laberinto/generador/vista_previa.mjs [semilla] [jaulas]
```

## El mapa como texto

`generarMapa` devuelve el laberinto como un texto con las filas separadas por `|`. Un punto (`.`) es camino y cada letra es un muro o un objeto:

| Letra | Qué es | Objeto | Tamaño |
|---|---|---|---|
| `#` `F` `S` `Y` `P` `R` | muro: seto verde, florido, seco puna, yunga, piedra gris, piedra rojiza | tile del `Tilemap` | 64 × 64 |
| `K` | cactus | `spriteSaguaro` | 80 × 130 |
| `O` | roca | `spriteRock` | 40 × 34 |
| `V` | cueva | `spriteCueva` | 200 × 150 |
| `G` | portal de inicio | `spritePortal` | 176 × 190 |
| `J` | jaula | `spriteJaula` | 96 × 92 |
| `L` | llave | `Sprite2` | 70 × 76 |
| `H` | cazador (`Cazador1` o `Cazador2` al azar) | `spriteCazador` | 48 × 72 |
| `E` `N` | Mafalda y Dieguito (se mueven, no se crean) | `spriteMafalda`, `spriteDieguito` | los del layout |

Los tamaños están en `OBJETOS`, al principio de `construirLaberinto.js`: un objeto creado por script usa el tamaño de su imagen, y las imágenes tienen tamaños muy distintos.

Los muros usan `tileset_muros_noa_64.png` (tiles de 64 × 64). **Número de tile = máscara + estilo × 16 + variante × 96**:

- **Máscara (0–15):** suma de los vecinos que también son muro: norte = 1, este = 2, sur = 4, oeste = 8. Así cada pieza conecta con sus vecinas.
- **Estilo (0–5):** el orden de las letras de muro de la tabla (`#` = 0 … `R` = 5).
- **Variante (0–2):** se elige al azar para que los setos no se vean todos iguales.

En `guia_indices.png` está el número de cada tile.

## Sumar un animal

Cada ficha es una animación de `spriteFichaAnimal` llamada **`region_animal`**, en minúscula y sin tildes (`puna_vicuna`, `puna_zorro_andino`, `chaco_quirquincho_bola`). Las fichas miden 1024 × 1536. La Puna tiene 8: vicuña, zorro andino, cóndor, flamenco, gato andino, guanaco, puma y taruca.

1. Traé la carta desde `assets/pendientes/cartas/` (o una nueva), copiala a `images/` como `spritefichaanimal-region_animal-000.png` e importala en Construct en una animación nueva de `spriteFichaAnimal` (por ejemplo `puna_suri`).
2. Sumá `"suri"` a la lista de su región en `ANIMALES`, al principio de `scripts/fichas.js`.
3. **Sonido:** si ya está en `assets/pendientes/sonidos/`, movelo a `sounds/`; si no, poné `sprite_sfx_NOA_suri.webm` (WebM Opus) en `sounds/` y sumalo a *Sounds* del proyecto. Si el archivo se llama distinto del animal, agregalo a `SONIDOS` en `fichas.js` (como `quirquincho_bola: "quirquincho"`).

Cuando se abre la ficha, `fichas.js` guarda el nombre del sonido en la variable global `SONIDO` y el evento de la huida en `Event sheet 1` lo reproduce con *Audio › Play (by name)*, carpeta `sounds`, en loop, con la etiqueta `"animal"`, y pone en pausa la música (`"musica"`). Otro evento, cuando `FICHA` vuelve a 0, corta el sonido del animal y reanuda la música. El objeto `Audio` tiene *Timescale audio* apagado, así que el sonido sigue aunque el juego esté en pausa.

Cada laberinto **sortea qué animales de su región están en sus jaulas**: uno distinto por jaula. Si la región tiene más animales que jaulas, algunos no aparecen en ese laberinto. Una región necesita al menos tantos animales como jaulas: si tiene menos, se repiten (y la consola lo avisa). Nunca aparece un animal de otra región.

## Habilitar otra zona

En la pantalla de inicio, cada zona habilitada es un sprite recortado del fondo (`spriteZonaPuna`) puesto justo encima de su lugar en el mapa; las zonas con candado son parte del dibujo de `spriteInicioFondo`.

1. Recortá la zona del fondo (sin candado) en un sprite nuevo, por ejemplo `spriteZonaChaco`, y ponelo en el layout `Inicio` encima de su lugar.
2. Sumalo a `ZONAS` en `scripts/inicio.js`: `spriteZonaChaco: "chaco"`.
3. Sumá los animales de esa región a `ANIMALES` en `scripts/fichas.js`.
