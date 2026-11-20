// Pantalla de GAME OVER del laberinto: fondo, "DESAFÍO PERDIDO", Mafalda y Dieguito animados
// y los botones "VOLVER A INTENTARLO" / "INICIO". Los botones laten y se pueden tocar.

const PIEZAS = [
	"spriteGameOverFondo",
	"spriteDesafioPerdido",
	"spriteSinVidas",
	"spriteBotonReintentar",
	"spriteBotonInicio"
];

let visible = false;
let tiempo = 0;
let base = new Map();
let quitarEscucha = null;
let alReintentar = null;
let alInicio = null;

export function ocultarGameOver(runtime)
{
	visible = false;
	tiempo = 0;
	quitarEscucha?.();
	base = new Map();
	for (const nombre of PIEZAS)
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
		{
			inst.isVisible = false;
			if (nombre === "spriteSinVidas") inst.animationSpeed = 0;
		}
	alReintentar = null;
	alInicio = null;
}

export function mostrarGameOver(runtime, reintentar, volverAlInicio)
{
	alReintentar = reintentar;
	alInicio = volverAlInicio;
	visible = true;
	tiempo = 0;
	base = new Map();

	for (const nombre of PIEZAS)
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
		{
			inst.isVisible = true;
			base.set(inst, { w: Math.abs(inst.width), h: Math.abs(inst.height) });
			if (nombre === "spriteSinVidas")
			{
				inst.animationFrame = 0;
				inst.animationSpeed = 10;
			}
		}

	quitarEscucha?.();
	const alTocar = e => tocar(runtime, e);
	runtime.addEventListener("pointerdown", alTocar);
	quitarEscucha = () => { runtime.removeEventListener("pointerdown", alTocar); quitarEscucha = null; };
}

export function actualizarGameOver(runtime)
{
	if (!visible) return;
	tiempo += runtime.dt;
	for (const [inst, b] of base)
	{
		const nombre = inst.objectType.name;
		if (nombre !== "spriteBotonReintentar" && nombre !== "spriteBotonInicio") continue;
		const fase = nombre === "spriteBotonReintentar" ? 0 : 1.3;
		const escala = 1 + 0.04 * Math.sin(tiempo * 4 + fase);
		inst.width = b.w * escala;
		inst.height = b.h * escala;
	}
}

function tocar(runtime, e)
{
	if (!visible || runtime.globalVars.GAMEOVER !== 1) return quitarEscucha?.();
	const capa = runtime.layout.getLayer("HUD");
	if (!capa) return;
	const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);

	if (runtime.objects.spriteBotonReintentar?.getAllInstances().some(i => i.isVisible && i.containsPoint(x, y)))
		return alReintentar?.(runtime);
	if (runtime.objects.spriteBotonInicio?.getAllInstances().some(i => i.isVisible && i.containsPoint(x, y)))
		return alInicio?.(runtime);
}
