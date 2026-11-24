// Cartel "NIVEL N — REGIÓN" al empezar cada laberinto.

const DURACION_MS = 2600;

let nivel = 1;
let cartelHasta = 0;
let baseW = 0;
let baseH = 0;
let frenado = false;

export function reiniciarNivel()
{
	nivel = 1;
	cartelHasta = 0;
	frenado = false;
}

export function getNivel()
{
	return nivel;
}

export function avanzarNivel()
{
	nivel += 1;
	return nivel;
}

export function cartelNivelActivo()
{
	return cartelHasta > 0 && performance.now() < cartelHasta;
}

function setMovimiento(runtime, habilitado)
{
	const activo = runtime.globalVars.PERSONAJE === "Dieguito" ? "spriteDieguito" : "spriteMafalda";
	for (const nombre of ["spriteMafalda", "spriteDieguito"])
	{
		const inst = runtime.objects[nombre]?.getFirstInstance();
		if (!inst) continue;
		const b = inst.behaviors;
		const manejado = habilitado && nombre === activo;
		b["8Direction"]?.stop();
		if (b["8Direction"])
		{
			b["8Direction"].isEnabled = manejado;
			b["8Direction"].isDefaultControls = manejado;
		}
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = habilitado && !manejado;
		if (b.ScrollTo) b.ScrollTo.isEnabled = manejado;
	}
	frenado = !habilitado;
}

export function mostrarCartelNivel(runtime)
{
	const reg = String(runtime.globalVars.REGION || "puna").toLowerCase();
	const anim = `${reg}_${Math.min(8, Math.max(1, nivel))}`;
	const cartel = runtime.objects.spriteCartelNivel?.getFirstInstance();
	if (!cartel) return;

	try { cartel.setAnimation(anim); }
	catch { try { cartel.setAnimation("puna_1"); } catch { return; } }

	cartel.isVisible = true;
	cartel.opacity = 1;
	// HUD (parallax 0): centro del viewport 1024×1024
	cartel.x = 512;
	cartel.y = 430;
	cartel.width = 720;
	cartel.height = 720 * (cartel.imageHeight / Math.max(1, cartel.imageWidth));
	baseW = Math.abs(cartel.width);
	baseH = Math.abs(cartel.height);
	cartel.moveToTop();

	if (runtime.globalVars.NIVEL !== undefined) runtime.globalVars.NIVEL = nivel;
	cartelHasta = performance.now() + DURACION_MS;
	setMovimiento(runtime, false);
}

export function actualizarCartelNivel(runtime)
{
	if (!cartelHasta) return;
	const cartel = runtime.objects.spriteCartelNivel?.getFirstInstance();
	const ahora = performance.now();

	if (ahora >= cartelHasta)
	{
		cartelHasta = 0;
		if (cartel) cartel.isVisible = false;
		if (frenado) setMovimiento(runtime, true);
		return;
	}

	setMovimiento(runtime, false);

	if (!cartel?.isVisible) return;
	const t = 1 - (cartelHasta - ahora) / DURACION_MS;
	let escala = 1;
	let op = 1;
	if (t < 0.18) escala = 0.85 + 0.15 * (t / 0.18);
	else if (t > 0.75) op = 1 - (t - 0.75) / 0.25;
	cartel.width = baseW * escala;
	cartel.height = baseH * escala;
	cartel.opacity = Math.max(0, op);
}
