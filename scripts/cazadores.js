// Cazadores: van y vienen por un tramo corto de su pasillo y cada tanto se esconden entre los setos
// para aparecer en otro punto del tramo. Si el personaje manejado se les acerca mientras se ven, atrapan.
// Una piedrita de la honda de Dieguito los derriba.

const CASILLA = 64;
const TRAMO = 2;
const VELOCIDAD = 55;
const ATRAPA_A = 44;
const FUNDIDO = 0.4;
const DERRIBO = 0.6;
const LIBRE = new Set([".", "L", "H", "J", "V", "G", "E", "N"]);

const datos = new WeakMap();

export function prepararCazador(inst, filas, tx, ty)
{
	const libre = (x, y) => LIBRE.has(filas[y]?.[x]);
	const alcance = (dx, dy) => {
		let n = 0;
		while (n < TRAMO && libre(tx + dx * (n + 1), ty + dy * (n + 1))) n++;
		return n;
	};
	const horizontal = [alcance(-1, 0), alcance(1, 0)];
	const vertical = [alcance(0, -1), alcance(0, 1)];
	const [ax, ay, [atras, adelante]] = horizontal[0] + horizontal[1] >= vertical[0] + vertical[1]
		? [1, 0, horizontal] : [0, 1, vertical];

	datos.set(inst, {
		x0: inst.x, y0: inst.y, ax, ay,
		min: -atras * CASILLA, max: adelante * CASILLA,
		pos: 0, dir: Math.random() < 0.5 ? -1 : 1,
		ancho: Math.abs(inst.width) || 48,
		fase: "visible", tiempo: 2 + Math.random() * 3
	});
}

export function actualizarCazadores(runtime, personaje)
{
	const tipo = runtime.objects.spriteCazador;
	if (!tipo) return false;
	let atrapo = false;

	for (const inst of tipo.getAllInstances())
	{
		const d = datos.get(inst);
		if (!d) continue;
		d.tiempo -= runtime.dt;

		if (d.fase === "visible")
		{
			d.pos += d.dir * VELOCIDAD * runtime.dt;
			if (d.pos <= d.min || d.pos >= d.max)
			{
				d.pos = Math.max(d.min, Math.min(d.max, d.pos));
				d.dir = -d.dir;
			}
			if (d.ax && d.dir)
				inst.width = d.dir > 0 ? d.ancho : -d.ancho;
			if (d.tiempo <= 0) cambiar(d, "escondiendo", FUNDIDO);
		}
		else if (d.fase === "escondiendo")
		{
			inst.opacity = Math.max(0, d.tiempo / FUNDIDO);
			if (d.tiempo <= 0) cambiar(d, "escondido", 1.5 + Math.random() * 1.5);
		}
		else if (d.fase === "escondido")
		{
			inst.opacity = 0;
			if (d.tiempo <= 0)
			{
				d.pos = d.min + Math.random() * (d.max - d.min);
				cambiar(d, "apareciendo", FUNDIDO);
			}
		}
		else if (d.fase === "derribado")
		{
			inst.opacity = Math.max(0, d.tiempo / DERRIBO);
			inst.angleDegrees = (1 - d.tiempo / DERRIBO) * 90 * Math.sign(inst.width);
			if (d.tiempo <= 0) inst.destroy();
			continue;
		}
		else if (d.fase === "apareciendo")
		{
			inst.opacity = Math.min(1, 1 - d.tiempo / FUNDIDO);
			if (d.tiempo <= 0)
			{
				inst.opacity = 1;
				cambiar(d, "visible", 3 + Math.random() * 3);
			}
		}

		inst.x = d.x0 + d.ax * d.pos;
		inst.y = d.y0 + d.ay * d.pos;

		const peligroso = d.fase === "visible" || (d.fase === "apareciendo" && inst.opacity > 0.6);
		if (peligroso && personaje && Math.hypot(personaje.x - inst.x, personaje.y - inst.y) < ATRAPA_A)
			atrapo = true;
	}
	return atrapo;
}

// Una piedrita de la honda solo derriba al cazador si se lo ve; derribado cae y no vuelve en este laberinto.
export function golpearCazador(inst)
{
	const d = datos.get(inst);
	if (!d || d.fase === "escondido" || d.fase === "derribado" || inst.opacity < 0.3) return false;
	cambiar(d, "derribado", DERRIBO);
	return true;
}

function cambiar(d, fase, tiempo)
{
	d.fase = fase;
	d.tiempo = tiempo;
}
