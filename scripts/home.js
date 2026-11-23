// Pantallas Home (historia), EndGame (títulos) y Creditos.
// Botones con latido y agrande al pasar el mouse/pointer.

const PANTALLAS = new Set(["Home", "EndGame", "Creditos"]);

let tiempo = 0;
let base = new Map();
let hoverUid = null;
let quitarPointer = null;
let quitarMove = null;

export function iniciarHome(runtime)
{
	arrancar(runtime, [
		["sprite_btn_inicio", "Inicio"],
		["spriteBtnHomeCreditos", "Creditos"]
	]);
}

export function iniciarEndGame(runtime)
{
	arrancar(runtime, [["sprite_btn_endgame", "Creditos"]]);
}

export function iniciarCreditos(runtime)
{
	arrancar(runtime, [["spriteBtnCreditos", "Home"]]);
}

export function actualizarCinematica(runtime)
{
	if (!PANTALLAS.has(runtime.layout.name)) return;
	tiempo += runtime.dt;
	for (const [inst, b] of base)
	{
		if (!inst || !inst.isVisible) continue;
		const bajo = hoverUid === inst.uid ? 0.07 : 0;
		const escala = 1 + 0.05 * Math.sin(tiempo * 4.2) + bajo;
		inst.width = b.w * escala;
		inst.height = b.h * escala;
		inst.opacity = hoverUid === inst.uid ? 1 : 0.96;
	}
}

function arrancar(runtime, rutas)
{
	runtime.timeScale = 1;
	tiempo = 0;
	base = new Map();
	hoverUid = null;
	for (const [nombre] of rutas)
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			base.set(inst, { w: Math.abs(inst.width), h: Math.abs(inst.height), nombre });

	quitarPointer?.();
	quitarMove?.();

	const capaDe = () => runtime.layout.getLayer(0) || runtime.layout.getLayer("Layer 0");

	const alMover = e => {
		if (!PANTALLAS.has(runtime.layout.name))
			return quitarMove?.();
		const capa = capaDe();
		if (!capa) return;
		const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);
		hoverUid = null;
		for (const [inst] of base)
			if (inst.isVisible && inst.containsPoint(x, y))
			{
				hoverUid = inst.uid;
				break;
			}
	};

	const alTocar = e => {
		if (!PANTALLAS.has(runtime.layout.name))
			return quitarPointer?.();
		const capa = capaDe();
		if (!capa) return;
		const [x, y] = capa.cssPxToLayer(e.clientX, e.clientY);
		for (const [objeto, layout] of rutas)
		{
			const btn = runtime.objects[objeto]?.getFirstInstance();
			if (btn?.isVisible && btn.containsPoint(x, y))
			{
				// feedback de click: achicar un instante
				const b = base.get(btn);
				if (b)
				{
					btn.width = b.w * 0.92;
					btn.height = b.h * 0.92;
				}
				quitarPointer?.();
				quitarMove?.();
				runtime.goToLayout(layout);
				return;
			}
		}
	};

	runtime.addEventListener("pointermove", alMover);
	runtime.addEventListener("pointerdown", alTocar);
	quitarMove = () => { runtime.removeEventListener("pointermove", alMover); quitarMove = null; };
	quitarPointer = () => { runtime.removeEventListener("pointerdown", alTocar); quitarPointer = null; };
}
