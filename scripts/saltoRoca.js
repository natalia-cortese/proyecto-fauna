// La nena salta una roca cuando camina contra ella, si del otro lado hay lugar libre.
// Se llama en cada tick desde Event sheet 1.

const DURACION = 0.4;
const ALTURA = 28;
const MARGEN = 4;

const FLECHAS = [
	["ArrowRight", 1, 0],
	["ArrowLeft", -1, 0],
	["ArrowDown", 0, 1],
	["ArrowUp", 0, -1]
];

export function saltarRoca(runtime)
{
	const nena = runtime.objects.spriteNena.getFirstInstance();
	if (!nena || nena.instVars.jumping || !runtime.keyboard) return;

	const apretadas = FLECHAS.filter(([tecla]) => runtime.keyboard.isKeyDown(tecla));
	if (apretadas.length !== 1) return;
	const [, dx, dy] = apretadas[0];

	const roca = rocaDelante(runtime, nena, dx, dy);
	if (!roca) return;

	const destino = aterrizaje(nena, roca, dx, dy);
	if (!destino) return;

	saltar(runtime, nena, destino);
}

function rocaDelante(runtime, nena, dx, dy)
{
	nena.x += dx * MARGEN;
	nena.y += dy * MARGEN;
	const roca = runtime.objects.spriteRock.getAllInstances().find(r => nena.testOverlap(r));
	nena.x -= dx * MARGEN;
	nena.y -= dy * MARGEN;
	return roca;
}

function aterrizaje(nena, roca, dx, dy)
{
	const r = roca.getBoundingBox();
	const n = nena.getBoundingBox();
	const x = dx > 0 ? r.right + (nena.x - n.left) + MARGEN
		: dx < 0 ? r.left - (n.right - nena.x) - MARGEN
		: nena.x;
	const y = dy > 0 ? r.bottom + (nena.y - n.top) + MARGEN
		: dy < 0 ? r.top - (n.bottom - nena.y) - MARGEN
		: nena.y;

	const [x0, y0] = [nena.x, nena.y];
	nena.x = x;
	nena.y = y;
	const libre = !nena.testOverlapSolid();
	nena.x = x0;
	nena.y = y0;
	return libre ? { x, y } : null;
}

function saltar(runtime, nena, destino)
{
	const movimiento = nena.behaviors["8Direction"];
	const inicio = { x: nena.x, y: nena.y, ancho: nena.width, alto: nena.height };
	let t = 0;

	nena.instVars.jumping = 1;
	movimiento.stop();
	movimiento.isEnabled = false;

	const alTick = () => {
		if (!runtime.objects.spriteNena.getAllInstances().includes(nena))
		{
			runtime.removeEventListener("tick", alTick);
			return;
		}
		t = Math.min(1, t + runtime.dt / DURACION);
		const arco = Math.sin(Math.PI * t);
		nena.x = inicio.x + (destino.x - inicio.x) * t;
		nena.y = inicio.y + (destino.y - inicio.y) * t - arco * ALTURA;
		// Ancho negativo es espejado; se respeta si cambia de lado en el aire.
		nena.width = Math.sign(nena.width) * Math.abs(inicio.ancho) * (1 + 0.15 * arco);
		nena.height = inicio.alto * (1 + 0.15 * arco);
		if (t < 1) return;

		runtime.removeEventListener("tick", alTick);
		nena.width = Math.sign(nena.width) * Math.abs(inicio.ancho);
		nena.height = inicio.alto;
		movimiento.isEnabled = true;
		nena.instVars.jumping = 0;
	};
	runtime.addEventListener("tick", alTick);
}
