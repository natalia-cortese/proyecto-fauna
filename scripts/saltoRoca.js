// Un personaje salta una roca cuando camina contra ella, si del otro lado hay lugar libre.
// Lo llama actualizarPersonajes() en cada tick, para el personaje que se está manejando.

const DURACION = 0.4;
const ALTURA = 28;
const MARGEN = 4;

const saltando = new Map();

export function estaSaltando(inst)
{
	return saltando.has(inst);
}

export function cancelarSalto(inst)
{
	saltando.get(inst)?.();
}

export function saltarRoca(runtime, inst, dx, dy)
{
	if (saltando.has(inst)) return false;

	const roca = tocando(runtime.objects.spriteRock, inst, dx, dy);
	if (!roca) return false;

	const destino = aterrizaje(inst, roca, dx, dy);
	if (!destino) return false;

	saltar(runtime, inst, destino);
	return true;
}

export function tocando(tipo, inst, dx, dy)
{
	inst.x += dx * MARGEN;
	inst.y += dy * MARGEN;
	const otro = tipo.getAllInstances().find(o => inst.testOverlap(o));
	inst.x -= dx * MARGEN;
	inst.y -= dy * MARGEN;
	return otro;
}

function aterrizaje(inst, roca, dx, dy)
{
	const r = roca.getBoundingBox();
	const n = inst.getBoundingBox();
	const x = dx > 0 ? r.right + (inst.x - n.left) + MARGEN
		: dx < 0 ? r.left - (n.right - inst.x) - MARGEN
		: inst.x;
	const y = dy > 0 ? r.bottom + (inst.y - n.top) + MARGEN
		: dy < 0 ? r.top - (n.bottom - inst.y) - MARGEN
		: inst.y;

	const [x0, y0] = [inst.x, inst.y];
	inst.x = x;
	inst.y = y;
	const libre = !inst.testOverlapSolid();
	inst.x = x0;
	inst.y = y0;
	return libre ? { x, y } : null;
}

function saltar(runtime, inst, destino)
{
	const movimiento = inst.behaviors["8Direction"];
	const inicio = { x: inst.x, y: inst.y, ancho: Math.abs(inst.width), alto: inst.height };
	let t = 0;

	movimiento.stop();
	movimiento.isEnabled = false;

	const terminar = () => {
		runtime.removeEventListener("tick", alTick);
		saltando.delete(inst);
		inst.width = Math.sign(inst.width) * inicio.ancho;
		inst.height = inicio.alto;
		movimiento.isEnabled = true;
	};

	const alTick = () => {
		if (!runtime.objects[inst.objectType.name].getAllInstances().includes(inst))
		{
			runtime.removeEventListener("tick", alTick);
			saltando.delete(inst);
			return;
		}
		t = Math.min(1, t + runtime.dt / DURACION);
		const arco = Math.sin(Math.PI * t);
		inst.x = inicio.x + (destino.x - inicio.x) * t;
		inst.y = inicio.y + (destino.y - inicio.y) * t - arco * ALTURA;
		// Ancho negativo es espejado; se respeta si cambia de lado en el aire.
		inst.width = Math.sign(inst.width) * inicio.ancho * (1 + 0.15 * arco);
		inst.height = inicio.alto * (1 + 0.15 * arco);
		if (t >= 1) terminar();
	};

	saltando.set(inst, terminar);
	runtime.addEventListener("tick", alTick);
}
