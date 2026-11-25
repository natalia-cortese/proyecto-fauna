# FAUNA en Construct 3

Cómo está armado el juego y qué tocar para cambiarlo.

## Recorrido del juego

1. **`Home`** (*First layout*): historia de cómo Mafalda y Dieguito salen al juego, sobre el mismo fondo del mapa (`spriteInicioFondo` + `sprite_img_historia` + música `sprite_music_historia`). **CONTINUAR** pasa a `Inicio`; **CRÉDITOS** abre los créditos.
2. **`Inicio`**: pantalla de título **FAUNA** con el mapa de Argentina. Hay que escribir el **nombre** (`textNombre` → variable `JUGADOR`); sin nombre no se puede jugar. Solo la **Puna** está habilitada. El mapa solo elige la región (`REGION`); el juego arranca al tocar **JUGAR**.
3. **Álbum de fauna:** el botón pokédex (arriba a la derecha en Inicio y en el HUD del Laberinto) abre el álbum. Las cartas rescatadas se guardan en `localStorage` por jugador (`fauna_album_<nombre>`). Tocar una carta del álbum la reabre con su sonido; la flecha atrás, Esc o tocar fuera cierran. El parlante (junto al pokédex) apaga/enciende todo el audio y guarda la preferencia.
4. **`LaberintoPuna`** (y a futuro `LaberintoChaco`, …): un layout por región (`scripts/regiones.js`). Suena `SonidoMapa_<region>_loop` desde `sounds/<region>/` (−12 dB, `"musica"`; se reinicia limpia al empezar cada laberinto; pausa con ficha/álbum). Cartel **NIVEL N — REGIÓN** al entrar. Las jaulas priorizan animales que **aún no están en el álbum**.
5. Al abrir una jaula se ve la animación de huida y después la **ficha** (SFX en `sounds/<region>/sprite_sfx_<animal>`), hasta Espacio o Enter.
6. Al liberar a todos hay que **entrar a la cueva**: álbum completo de la región → `EndGame`; si no, otro laberinto de la misma región con el siguiente nivel. Desde `EndGame` → `Creditos` → **INICIO**.
7. Al perder las 3 vidas aparece **DESAFÍO PERDIDO**. **Espacio/Enter o «VOLVER A INTENTARLO»** reintentan; **Esc o «INICIO»** vuelven al mapa.

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
| `scripts/construirLaberinto.js` | `construirLaberinto(runtime, mapa)`: pinta los muros, crea los objetos de cada letra y aplica los sprites de `regiones.js` (personajes, fondo, rocas, cactus, cazadores) |
| `scripts/personajes.js` | movimiento, cambio de personaje con Espacio, el que sigue con *Pathfinding*, espejado según hacia dónde caminan, vidas (un cactus o un cazador resta una y los dos vuelven al portal, parpadeando 1,5 s sin poder perder otra), corazones del HUD y la pantalla de GAME OVER (`reintentar` y `volverAlInicio`). En `Layout 1`, que no tiene los sprites de GAME OVER, perder todas las vidas reinicia el layout |
| `scripts/gameOver.js` | arma la pantalla de DESAFÍO PERDIDO: muestra/oculta fondo, cartel, animación y botones; los botones laten y se pueden tocar |
| `scripts/cazadores.js` | cada cazador va y viene por un tramo corto de su pasillo; cada 3–6 s se esconde entre los setos y aparece en otro punto. Si el personaje manejado se le acerca a menos de 44 px mientras se ve, pierde una vida. Escondido no hace daño |
| `scripts/honda.js` | la honda de Dieguito: la piedrita vuela hasta 420 px, pasa por encima de las rocas, se frena en muros y cactus y derriba al cazador que toque si se lo ve (no sirve contra uno escondido). Al derribar pone `GOLPE_CAZADOR` (suena `golpe_cazador` y baja la música un instante); el cazador cae y no vuelve en ese laberinto |
| `scripts/sonido.js` | mute global (`Audio.isSilent`) con el botón parlante; preferencia en `localStorage` (`fauna_sonido`) |
| `scripts/cartelJaula.js` | el globo `spriteCartelJaula` (capa `Niebla`): sobre la jaula más cercana cuando el personaje manejado está a menos de 40 px y no puede abrirla, y sobre la llave que toca Dieguito manejado. Cada texto es una animación del globo: `solo_mafalda`, `necesita_llave` y `solo_mafalda_llave` |
| `scripts/saltoRoca.js` | salto en arco de 0,4 s por encima de una roca |
| `scripts/niebla.js` | el `Tilemap` **Niebla** (casillas de 32 px) tapa el mapa y se despeja para siempre alrededor de los personajes. `RADIO` cambia cuánto se ve |
| `scripts/fichas.js` | sorteo de animales (`animales` de `regiones.js`), ficha y `alCompletarLaberinto` (ver [Sumar un animal](#sumar-un-animal)) |
| `scripts/regiones.js` | cada región: layout, sonidos, animales y sprites (ver [Sumar una región](#sumar-una-región)) |
| `scripts/importsForEvents.js` | nombre especial de Construct: lo que importa se puede usar en los bloques de script de las hojas de eventos |
| hoja `Inicio` | variables `REGION`, `JUGADOR`; llama a `inicio.js`; Enter/Espacio/Esc cierran álbum; solo JUGAR arranca; al empezar corta la música |
| hoja `Event sheet 1` | variables `LLAVES`, `VIDAS`, `FICHA`, `ALBUM`, `GAMEOVER`, `GOLPE_CAZADOR`, `SONIDO`, `SONIDO_CARPETA`, `HUIDA`, `PERSONAJE`; compartida por todos los laberintos |
| hoja `LaberintoPuna` | incluye `Event sheet 1`; `SEMILLA` / `NIVEL`; arma la Puna, cartel de nivel; al liberar habilita la cueva → `alCompletarLaberinto` |
| `scripts/nivel.js` | cartel **NIVEL N — REGIÓN** al empezar cada laberinto |
| hoja `Home events` / `EndGame events` | música de historia/títulos y botones Touch hacia `Inicio` |
| layout `LaberintoPuna` | 1792 × 1216. Capas: `BG`, `Layer 1` (`Tilemap` **Solid**, personajes y moldes), `Niebla`, `HUD` |
| layouts `Home` / `EndGame` / `Creditos` | 1024 × 1024; objetos en carpeta `cinematica` (historia, títulos y créditos) |

Los objetos van en carpetas del panel *Project*: `inicio`, `cinematica` (historia y títulos: `sprite_img_historia`, `sprite_btn_inicio`, `sprite_img_endgame`, `sprite_btn_endgame`), `personajes`, `muros_y_tiles`, `animales_libres`, `cazadores`, `jaulas_y_metas` e `interfaz` (HUD, GAME OVER y álbum). En disco: `objectTypes/<carpeta>/`.

## Cambiar el laberinto

El script de *On start of layout* de la hoja `LaberintoPuna`:

```js
runtime.globalVars.REGION = runtime.globalVars.REGION || "puna";
const JAULAS = 3;
if (!runtime.globalVars.SEMILLA)
	runtime.globalVars.SEMILLA = Math.floor(Math.random() * 1e9) + 1;
const mapa = generarMapa({ jaulas: JAULAS, semilla: runtime.globalVars.SEMILLA });
construirLaberinto(runtime, mapa);
elegirAnimales("puna", runtime.globalVars.SEMILLA, JAULAS);
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
| `K` | cactus | `spritePeligro` | 80 × 130 |
| `O` | roca | `spriteObstaculo` | 40 × 34 |
| `V` | cueva | `spriteCueva` | 200 × 150 |
| `G` | portal de inicio | `spritePortal` | 176 × 190 |
| `J` | jaula | `spriteJaula` | 96 × 92 |
| `L` | llave | `Sprite2` | 70 × 76 |
| `H` | cazador (`CazadorPuna` o `CazadorPuna2` al azar) | `spriteCazador` | 48 × 72 |
| `E` `N` | Mafalda y Dieguito (se mueven, no se crean) | `spriteMafalda`, `spriteDieguito` | los del layout |

Los tamaños están en `OBJETOS`, al principio de `construirLaberinto.js`: un objeto creado por script usa el tamaño de su imagen, y las imágenes tienen tamaños muy distintos.

Los muros usan `tileset_muros_noa_64.png` (tiles de 64 × 64). **Número de tile = máscara + estilo × 16 + variante × 96**:

- **Máscara (0–15):** suma de los vecinos que también son muro: norte = 1, este = 2, sur = 4, oeste = 8. Así cada pieza conecta con sus vecinas.
- **Estilo (0–5):** el orden de las letras de muro de la tabla (`#` = 0 … `R` = 5).
- **Variante (0–2):** se elige al azar para que los setos no se vean todos iguales.

En `guia_indices.png` está el número de cada tile.

## Sumar un animal

Cada ficha es una animación de `spriteFichaAnimal` llamada **`region_animal`**, en minúscula y sin tildes (`puna_vicuna`, `puna_zorro_andino`, `chaco_quirquincho_bola`). Las fichas miden 1024 × 1536. La Puna tiene 8: vicuña, zorro andino, cóndor, flamenco, gato andino, guanaco, puma y taruca.

1. Traé la carta desde `assets/pendientes/cartas/<region>/` (o una nueva), copiala a `images/` como `spritefichaanimal-region_animal-000.png` e importala en Construct en una animación nueva de `spriteFichaAnimal` (por ejemplo `puna_suri`). Las PNGs del juego quedan planas en `images/` (requisito de Construct).
2. Sumá `"suri"` a `animales` de su región en `scripts/regiones.js`.
3. **Sonido:** mové o creá `sounds/<region>/sprite_sfx_suri.webm` (WebM Opus) y registralo en *Sounds › subcarpeta de la región*. Si el archivo se llama distinto del animal, agregalo a `SONIDOS` en `fichas.js` (como `quirquincho_bola: "quirquincho"`).

Cuando se abre la ficha, `fichas.js` pone `SONIDO` = `sprite_sfx_<animal>` y `SONIDO_CARPETA` = la región; el evento de la huida reproduce con *Audio › Play (by name)* esa carpeta, en loop, etiqueta `"animal"`, y pausa la música (`"musica"`). Al cerrar la ficha corta el animal y reanuda la música. *Timescale audio* está apagado.

Cada laberinto **prioriza animales de su región que aún no están en el álbum** (uno distinto por jaula). Solo si ya están todos o la región es más chica que las jaulas, se repiten. Nunca aparece un animal de otra región.

## Sonidos por región

| Carpeta | Contenido |
|---|---|
| `sounds/comun/` | `GameOver`, `golpe_cazador` |
| `sounds/puna/` | `SonidoMapa_puna_loop`, `sprite_sfx_*` de la Puna |
| `sounds/chaco/` | `sprite_sfx_*` del Chaco (+ loop de mapa cuando exista) |

`music/` sigue con la historia y los títulos (`sprite_music_historia`, `sprite_music_endGame`).

Para no perder referencias al mover archivos: `npm test` (`tests/sonidos.test.mjs` y `tests/sprites.test.mjs`). En cada PR lo corre GitHub Actions.

## Sumar una región

Cada región tiene una clave en minúscula y sin tildes (`puna`, `chaco`). Esa clave se usa en la variable `REGION`, en `scripts/regiones.js`, en las animaciones de las fichas (`puna_vicuna`) y en la carpeta de sonidos. El archivo `regiones.js` es el lugar donde se describe la región: layout, audio, animales y **qué sprites usa**. Los pasos de abajo usan el Chaco como ejemplo (ya tiene entrada y carteles de nivel).

### 1. Datos en `scripts/regiones.js`

```js
chaco: {
	layout: "LaberintoChaco",
	sonidos: "chaco",
	mapaLoop: "SonidoMapa_chaco_loop",
	titulo: "CHACO",
	animales: ["quirquincho_bola", "tapir"],
	sprites: {
		personajes: { spriteMafalda: "AnimationPuna", spriteDieguito: "AnimationPuna" },
		huida: "Huida",
		fondo: "TiledBackgroundPuna",
		obstaculos: ["Default"],
		enemigos: ["CazadorPuna", "CazadorPuna2"],
		danio: ["Default"]
	}
}
```

| Campo | Qué es |
|---|---|
| `layout` | layout al que van **JUGAR** y la cueva al pasar de laberinto |
| `sonidos` | subcarpeta de *Sounds* de los SFX de los animales |
| `mapaLoop` | archivo del loop de mapa |
| `titulo` | texto del cartel **NIVEL N — REGIÓN** |
| `animales` | lista de las jaulas y del álbum de esa región (sin el prefijo `chaco_`) |
| `sprites.personajes` | animación de `spriteMafalda` y `spriteDieguito` |
| `sprites.huida` | animación de `spriteHuida` al abrir una jaula (variable `HUIDA`) |
| `sprites.fondo` | objeto de la capa `BG` que se muestra; los fondos de las otras regiones se ocultan |
| `sprites.obstaculos` | animaciones de `spriteObstaculo` (se saltan); se elige una al azar por roca |
| `sprites.enemigos` | animaciones de `spriteCazador`; se elige una al azar por cazador |
| `sprites.danio` | animaciones de `spritePeligro` (quitan una vida); se elige una al azar por cactus |

Los **objetos de Construct son los mismos** en todas las regiones (`spriteObstaculo`, `spriteCazador`, `spritePeligro`, …). Lo que cambia es el nombre de la **animación**. Para un dibujo nuevo:

1. Importá la imagen en Construct como animación del objeto que ya existe (por ejemplo `RocaChaco` en `spriteObstaculo`, `CazadorChaco1` en `spriteCazador`, `Cardon` en `spritePeligro`).
2. Poné ese nombre en `sprites` de la región. Tiene que coincidir exactamente; si no existe, el sprite se queda con la animación anterior.
3. Un fondo nuevo es un **objeto** de la capa `BG` (no una animación). Creá p. ej. `FondoChaco`, ponelo en el layout del laberinto y usá `fondo: "FondoChaco"`.

Con eso alcanza para personalizar el aspecto. El resto de esta sección es para que la región se pueda **elegir y jugar**.

### 2. Animales y álbum

1. La lista `animales` de arriba alimenta las jaulas. Conviene que tenga **al menos tantos nombres como jaulas** (3); si no, se repiten en el mismo laberinto.
2. Por cada animal, seguí [Sumar un animal](#sumar-un-animal): ficha `chaco_<animal>` en `spriteFichaAnimal` y su sonido.
3. **Álbum:** `images/spritealbumslot-chaco_<animal>-000.png`, animación `chaco_<animal>` en `spriteAlbumSlot` y el id en `ORDEN_ALBUM` (`scripts/album.js`), reemplazando un `null`. El álbum tiene 12 ranuras dibujadas; si no alcanzan, hay que cambiar el dibujo y `SLOTS_REL`.

### 3. Sonidos

1. Creá `sounds/chaco/` con `sprite_sfx_<animal>.webm` (WebM Opus) y `SonidoMapa_chaco_loop.webm`.
2. Importalos en Construct en *Sounds › chaco* (el nombre de la subcarpeta = `sonidos` en `regiones.js`).

Los pendientes `sprite_sfx_NOA_<animal>` hay que renombrarlos a `sprite_sfx_<animal>` o agregarlos a `SONIDOS` en `fichas.js`.

### 4. Cartel de nivel

Ocho animaciones de `spriteCartelNivel`: `chaco_1` … `chaco_8` (`images/spritecartelnivel-chaco_N-000.png`). Si faltan, se muestra `puna_1`.

### 5. Layout y hoja del laberinto

1. Duplicá en Construct el layout `LaberintoPuna` y la hoja `LaberintoPuna`, y renombralos `LaberintoChaco` (el mismo `layout` de `regiones.js`). Al guardar se registran en `project.c3proj`.
2. En el layout `LaberintoChaco`, elegí la hoja `LaberintoChaco` como *Event sheet*. Conservá las capas y objetos de `LaberintoPuna` (`Tilemap` **Solid**, **Niebla**, HUD, ficha, álbum, GAME OVER, `spriteCartelNivel` y el fondo de `sprites.fondo`).
3. En *On start of layout* de la hoja nueva:
   - *Audio › Play (by name)*: carpeta `chaco`, archivo `"SonidoMapa_chaco_loop"`.
   - En el script: `runtime.globalVars.REGION = "chaco";` y `elegirAnimales("chaco", runtime.globalVars.SEMILLA, JAULAS);`.
   - Opcional: muros propios en `generarMapa`, por ejemplo `estilos: "YYF#"` (ver [Cambiar el laberinto](#cambiar-el-laberinto)).

### 6. Zona en Inicio

Cada zona habilitada es un recorte del fondo (`spriteZonaPuna`) encima de su lugar en el mapa; las zonas con candado son parte de `spriteInicioFondo`.

1. Recortá la zona (sin candado) en un sprite `spriteZonaChaco` (carpeta `inicio`) y ponelo en el layout `Inicio`.
2. Sumalo a `ZONAS` en `scripts/inicio.js`: `{ spriteZonaPuna: "puna", spriteZonaChaco: "chaco" }`.

### 7. Probar

Escribí un nombre, tocá la zona y **JUGAR**. Tiene que abrir `LaberintoChaco`, sonar su loop, mostrar **NIVEL 1 — CHACO**, usar los sprites de esa región y llenar las jaulas solo con sus animales. Con el álbum de la región completo, la cueva lleva a `EndGame`.
