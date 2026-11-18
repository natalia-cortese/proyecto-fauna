// Globo de diálogo sobre la jaula más cercana cuando el personaje manejado se acerca y no puede abrirla:
// con Dieguito, "Solo Mafalda puede abrirnos"; con Mafalda sin llaves, "Necesitás una de las llaves para abrirnos".

const CERCA = 40;

export function actualizarCartelJaula(runtime, actual, esMafalda)
{
	const cartel = runtime.objects.spriteCartelJaula?.getFirstInstance();
	if (!cartel) return;

	const jaula = actual && jaulaCercana(runtime, actual);
	const mensaje = !jaula ? null : !esMafalda ? "solo_mafalda" : runtime.globalVars.LLAVES < 1 ? "necesita_llave" : null;
	cartel.isVisible = !!mensaje;
	if (!mensaje) return;

	if (cartel.animationName !== mensaje) cartel.setAnimation(mensaje);
	cartel.width = cartel.imageWidth;
	cartel.height = cartel.imageHeight;
	const caja = jaula.getBoundingBox();
	cartel.x = jaula.x;
	cartel.y = caja.top - cartel.height / 2 - 4;
}

function jaulaCercana(runtime, actual)
{
	let mejor = null;
	let distancia = Infinity;
	for (const jaula of runtime.objects.spriteJaula?.getAllInstances() ?? [])
	{
		const c = jaula.getBoundingBox();
		if (actual.x < c.left - CERCA || actual.x > c.right + CERCA || actual.y < c.top - CERCA || actual.y > c.bottom + CERCA) continue;
		const d = Math.hypot(actual.x - jaula.x, actual.y - jaula.y);
		if (d < distancia) { mejor = jaula; distancia = d; }
	}
	return mejor;
}
