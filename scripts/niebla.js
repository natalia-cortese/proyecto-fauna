// Niebla que tapa el laberinto y se despeja para siempre alrededor de los personajes.
// Usa el Tilemap "Niebla" (casillas de 32 px): tile 0 = oscuro, 1 = medio, 2 = suave, -1 = despejado.

const RADIO = 190;
const BORDE = 48;

const niveles = new WeakMap();

function desactivarColisionNiebla(niebla)
{
	if (!niebla) return;
	if ("collisionEnabled" in niebla) niebla.collisionEnabled = false;
	if (niebla.behaviors?.Solid) niebla.behaviors.Solid.isEnabled = false;
}

export function reiniciarNiebla(runtime)
{
	const niebla = runtime.objects.Niebla?.getFirstInstance();
	if (!niebla) return;
	desactivarColisionNiebla(niebla);
	const { mapWidth: ancho, mapHeight: alto } = niebla;
	if (!ancho || !alto) return;
	niveles.set(niebla, new Uint8Array(ancho * alto).fill(3));
	for (let y = 0; y < alto; y++)
		for (let x = 0; x < ancho; x++)
			niebla.setTileAt(x, y, 1);
}

export function revelarNiebla(runtime, personajes)
{
	const niebla = runtime.objects.Niebla?.getFirstInstance();
	if (!niebla) return;
	desactivarColisionNiebla(niebla);

	const tw = niebla.tileWidth || 32;
	const th = niebla.tileHeight || 32;
	const ancho = niebla.mapWidth || Math.max(1, Math.floor(niebla.width / tw));
	const alto = niebla.mapHeight || Math.max(1, Math.floor(niebla.height / th));
	let nivel = niveles.get(niebla);
	if (!nivel)
	{
		nivel = new Uint8Array(ancho * alto).fill(3);
		niveles.set(niebla, nivel);
	}

	const alcance = RADIO + 2 * BORDE;
	for (const p of personajes)
	{
		const px = p.x - niebla.x;
		const py = p.y - niebla.y;
		const x0 = Math.max(0, Math.floor((px - alcance) / tw));
		const x1 = Math.min(ancho - 1, Math.floor((px + alcance) / tw));
		const y0 = Math.max(0, Math.floor((py - alcance) / th));
		const y1 = Math.min(alto - 1, Math.floor((py + alcance) / th));
		for (let y = y0; y <= y1; y++)
			for (let x = x0; x <= x1; x++)
			{
				const d = Math.hypot((x + 0.5) * tw - px, (y + 0.5) * th - py);
				const nuevo = d < RADIO ? 0 : d < RADIO + BORDE ? 1 : d < alcance ? 2 : 3;
				const k = y * ancho + x;
				if (nuevo >= nivel[k]) continue;
				nivel[k] = nuevo;
				niebla.setTileAt(x, y, nuevo === 0 ? -1 : 3 - nuevo);
			}
	}
}
