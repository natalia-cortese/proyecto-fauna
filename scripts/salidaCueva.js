// Al llegar a la cueva con todos los animales liberados: los dos chicos caminan hasta la boca,
// se achican y se desvanecen como si entraran; recién entonces se pasa a la pantalla siguiente.

const CAMINAR = 0.9;
const ENTRAR = 0.6;
const ESPERA = 0.35;
const ATRASO_SEGUNDO = 0.2;
// La boca de spriteCueva queda un poco a la derecha del centro y en el tercio de abajo.
const BOCA_X = 0.03;
const BOCA_Y = 0.17;
const ESCALA_FINAL = 0.35;
const OCULTAR = ["spriteMarcador", "spriteCartelJaula", "spriteAyudaHonda", "spritePiedrita"];

let salida = null;

export function saliendoPorCueva()
{
	return salida !== null;
}

export function reiniciarSalidaCueva()
{
	salida = null;
}

// primero: el personaje manejado, que entra adelante.
export function iniciarSalidaCueva(runtime, cueva, primero, alTerminar)
{
	if (salida || !cueva) return;
	const nombres = [primero, primero === "spriteMafalda" ? "spriteDieguito" : "spriteMafalda"];
	const chicos = nombres
		.map(n => runtime.objects[n]?.getFirstInstance())
		.filter(Boolean)
		.map((inst, i) => ({ inst, x0: inst.x, y0: inst.y, ancho: Math.abs(inst.width), alto: inst.height, atraso: i * ATRASO_SEGUNDO }));
	for (const { inst } of chicos)
	{
		const b = inst.behaviors;
		b["8Direction"]?.stop();
		if (b["8Direction"]) b["8Direction"].isEnabled = false;
		b.Pathfinding?.stop();
		if (b.Pathfinding) b.Pathfinding.isEnabled = false;
		if (b.ScrollTo) b.ScrollTo.isEnabled = false;
		inst.opacity = 1;
		inst.moveToTop();
	}
	for (const nombre of OCULTAR)
		for (const inst of runtime.objects[nombre]?.getAllInstances() ?? [])
			inst.isVisible = false;
	salida = {
		tiempo: 0,
		bocaX: cueva.x + cueva.width * BOCA_X,
		bocaY: cueva.y + cueva.height * BOCA_Y,
		chicos,
		alTerminar
	};
}

export function actualizarSalidaCueva(runtime)
{
	if (!salida) return;
	salida.tiempo += runtime.dt;
	for (const c of salida.chicos) moverChico(c, salida.tiempo - c.atraso, salida.bocaX, salida.bocaY);

	const fin = CAMINAR + ENTRAR + ESPERA + ATRASO_SEGUNDO * (salida.chicos.length - 1);
	if (salida.tiempo < fin) return;
	const alTerminar = salida.alTerminar;
	salida.alTerminar = null;
	alTerminar?.();
}

export function posicionSalida(c, t, bocaX, bocaY)
{
	const caminar = suavizar(limitar(t / CAMINAR));
	const entrar = limitar((t - CAMINAR) / ENTRAR);
	const escala = 1 - (1 - ESCALA_FINAL) * entrar;
	return {
		x: c.x0 + (bocaX - c.x0) * caminar,
		// Al entrar sube un poco: se mete hacia el fondo de la cueva.
		y: c.y0 + (bocaY - c.y0) * caminar - 14 * entrar,
		escala,
		opacidad: 1 - entrar
	};
}

function moverChico(c, t, bocaX, bocaY)
{
	if (t < 0) return;
	const p = posicionSalida(c, t, bocaX, bocaY);
	const { inst } = c;
	if (Math.abs(p.x - inst.x) > 0.5) inst.width = (p.x > inst.x ? 1 : -1) * c.ancho * p.escala;
	else inst.width = Math.sign(inst.width || 1) * c.ancho * p.escala;
	inst.height = c.alto * p.escala;
	inst.x = p.x;
	inst.y = p.y;
	inst.opacity = p.opacidad;
}

const limitar = v => Math.max(0, Math.min(1, v));
const suavizar = v => v * v * (3 - 2 * v);
