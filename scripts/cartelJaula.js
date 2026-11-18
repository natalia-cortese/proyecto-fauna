// Globo de diálogo cuando el personaje manejado no puede hacer algo:
// sobre la jaula más cercana, con Dieguito "Solo Mafalda puede abrirnos" y con Mafalda sin llaves "Necesitás una de las llaves para abrirnos";
// sobre la llave que toca Dieguito, "Solo Mafalda puede recolectar las llaves".

const CERCA = 40;

export function actualizarCartelJaula(runtime, actual, esMafalda)
{
	const cartel = runtime.objects.spriteCartelJaula?.getFirstInstance();
	if (!cartel) return;

	let sobre = null;
	let mensaje = null;
	const llave = actual && !esMafalda && runtime.objects.Sprite2?.getAllInstances().find(l => actual.testOverlap(l));
	const jaula = actual && !llave && jaulaCercana(runtime, actual);
	if (llave) { sobre = llave; mensaje = "solo_mafalda_llave"; }
	else if (jaula && !esMafalda) { sobre = jaula; mensaje = "solo_mafalda"; }
	else if (jaula && runtime.globalVars.LLAVES < 1) { sobre = jaula; mensaje = "necesita_llave"; }
	cartel.isVisible = !!mensaje;
	if (!mensaje) return;

	if (cartel.animationName !== mensaje) cartel.setAnimation(mensaje);
	cartel.width = cartel.imageWidth;
	cartel.height = cartel.imageHeight;
	const caja = sobre.getBoundingBox();
	const vista = cartel.layer.getViewport();
	const margen = cartel.width / 2 + 4;
	cartel.x = Math.min(Math.max(sobre.x, vista.left + margen), vista.right - margen);
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
