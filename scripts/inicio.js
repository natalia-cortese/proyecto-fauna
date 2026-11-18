// Pantalla de inicio (layout Inicio): mapa de Argentina para elegir zona.
// Cada zona habilitada es un sprite recortado del fondo; tocarla, tocar JUGAR o apretar Enter/Espacio
// guarda la región en la variable global REGION y pasa al laberinto. Las zonas con candado son parte del fondo.

const ZONAS = { spriteZonaPuna: "puna" };
const LAYOUT_JUEGO = "Laberinto";
const DURACION_SALIDA = 0.3;

let tiempo = 0;
let salida = -1;
let base = new Map();
let quitarEscucha = null;

export function iniciarInicio(runtime)
{
	tiempo = 0;
	salida = -1;
	base = new Map();
	runtime.timeScale = 1;

	for (const nombre of ["spriteMafalda", "spriteDieguito"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			for (const b of ["8Direction", "Pathfinding", "ScrollTo"])
				if (inst.behaviors[b]) inst.behaviors[b].isEnabled = false;

	for (const nombre of [...Object.keys(ZONAS), "spriteBotonJugar", "spriteMafalda", "spriteDieguito"])
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			base.set(inst, { y: inst.y, w: inst.width, h: inst.height });

	quitarEscucha?.();
	const alTocar = e => tocar(runtime, e);
	runtime.addEventListener("pointerdown", alTocar);
	quitarEscucha = () => { runtime.removeEventListener("pointerdown", alTocar); quitarEscucha = null; };
}

export function actualizarInicio(runtime)
{
	tiempo += runtime.dt;
	const latido = 1 + 0.03 * Math.sin(tiempo * 4);

	for (const [inst, b] of base)
	{
		const nombre = inst.objectType.name;
		if (nombre === "spriteMafalda" || nombre === "spriteDieguito")
		{
			const fase = nombre === "spriteMafalda" ? 0 : 1.6;
			inst.y = b.y - Math.abs(Math.sin(tiempo * 3 + fase)) * 6;
			continue;
		}
		let escala = nombre === "spriteBotonJugar" ? 1 + 0.04 * Math.sin(tiempo * 4 + 1.5) : latido;
		if (salida >= 0) escala = 1 + 0.12 * Math.sin(Math.min(salida / DURACION_SALIDA, 1) * Math.PI);
		inst.width = b.w * escala;
		inst.height = b.h * escala;
	}

	if (salida >= 0)
	{
		salida += runtime.dt;
		if (salida >= DURACION_SALIDA) runtime.goToLayout(LAYOUT_JUEGO);
	}
}

export function jugar(runtime, region = runtime.globalVars.REGION)
{
	if (salida >= 0) return;
	runtime.globalVars.REGION = region;
	runtime.globalVars.SEMILLA = 0;
	quitarEscucha?.();
	salida = 0;
}

function tocar(runtime, e)
{
	if (runtime.layout.name !== "Inicio") return quitarEscucha?.();
	const capa = runtime.layout.getLayer("Inicio");
	const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);

	for (const [nombre, region] of Object.entries(ZONAS))
		if (runtime.objects[nombre]?.getAllInstances().some(i => i.containsPoint(x, y)))
			return jugar(runtime, region);

	if (runtime.objects.spriteBotonJugar?.getAllInstances().some(i => i.containsPoint(x, y)))
		jugar(runtime);
}
