// Controles en pantalla para jugar desde el celular: cruz de flechas abajo a la izquierda y,
// abajo a la derecha, cambiar de personaje (como Espacio) y la honda (como X, solo con Dieguito).
// Son instancias de spriteControlTactil en la capa HUD; la animación dice qué botón es.
// Solo aparecen en pantallas táctiles (o después del primer toque) y admiten varios dedos a la vez.

const DIRECCIONES = {
	arriba: { tecla: "ArrowUp", control: "up" },
	abajo: { tecla: "ArrowDown", control: "down" },
	izquierda: { tecla: "ArrowLeft", control: "left" },
	derecha: { tecla: "ArrowRight", control: "right" }
};
const OPACIDAD = 0.7;

let tactil = detectarTactil();
// pointerId → dirección que está apretando ese dedo.
const dedos = new Map();
let quitarEscucha = null;

function detectarTactil()
{
	try
	{
		return typeof matchMedia === "function"
			&& matchMedia("(any-pointer: coarse)").matches
			&& !matchMedia("(pointer: fine)").matches;
	}
	catch { return false; }
}

export function esTactil()
{
	return tactil;
}

// acciones: { cambiar(), honda(), tocar() }. tocar se llama con cualquier toque fuera de los botones
// y devuelve true si lo usó (por ejemplo para cerrar la ficha).
export function iniciarControlesTactiles(runtime, acciones)
{
	quitarEscucha?.();
	dedos.clear();

	const enLaberinto = () => String(runtime.layout.name || "").startsWith("Laberinto");
	const alBajar = e => {
		if (!enLaberinto()) return quitarEscucha?.();
		if (e.pointerType === "touch") tactil = true;
		if (acciones.tocar?.()) return;
		const boton = botonEn(runtime, e);
		if (!boton) return;
		const nombre = boton.animationName;
		if (DIRECCIONES[nombre]) dedos.set(e.pointerId, nombre);
		else if (nombre === "cambiar") acciones.cambiar?.();
		else if (nombre === "honda") acciones.honda?.();
	};
	const alMover = e => {
		if (!dedos.has(e.pointerId)) return;
		const nombre = botonEn(runtime, e)?.animationName;
		if (DIRECCIONES[nombre]) dedos.set(e.pointerId, nombre);
	};
	const alSoltar = e => dedos.delete(e.pointerId);

	runtime.addEventListener("pointerdown", alBajar);
	runtime.addEventListener("pointermove", alMover);
	runtime.addEventListener("pointerup", alSoltar);
	runtime.addEventListener("pointercancel", alSoltar);
	quitarEscucha = () => {
		runtime.removeEventListener("pointerdown", alBajar);
		runtime.removeEventListener("pointermove", alMover);
		runtime.removeEventListener("pointerup", alSoltar);
		runtime.removeEventListener("pointercancel", alSoltar);
		dedos.clear();
		quitarEscucha = null;
	};
}

function botonEn(runtime, e)
{
	const capa = runtime.layout.getLayer("HUD");
	if (!capa) return null;
	const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);
	return (runtime.objects.spriteControlTactil?.getAllInstances() ?? [])
		.find(b => b.isVisible && b.containsPoint(x, y)) ?? null;
}

// Una flecha del teclado o su botón en pantalla.
export function direccionApretada(runtime, tecla)
{
	if (runtime.keyboard?.isKeyDown(tecla)) return true;
	for (const nombre of dedos.values())
		if (DIRECCIONES[nombre].tecla === tecla) return true;
	return false;
}

// Cada tick: muestra u oculta los botones y mueve al personaje manejado con las flechas apretadas.
export function actualizarControlesTactiles(runtime, manejado, { visibles, honda })
{
	const mostrar = tactil && visibles;
	if (!mostrar) dedos.clear();
	const apretados = new Set(dedos.values());
	for (const boton of runtime.objects.spriteControlTactil?.getAllInstances() ?? [])
	{
		const nombre = boton.animationName;
		boton.isVisible = mostrar && (nombre !== "honda" || honda);
		boton.opacity = apretados.has(nombre) ? 1 : OPACIDAD;
	}
	const dir = manejado?.behaviors["8Direction"];
	if (!dir?.isEnabled) return;
	for (const nombre of apretados)
		dir.simulateControl(DIRECCIONES[nombre].control);
}
