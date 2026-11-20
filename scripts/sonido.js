// Mute global del juego (Audio.isSilent) y feedback visual del botón parlante.
// Preferencia en localStorage; el golpe al cazador usa GOLPE_CAZADOR (hoja de eventos).

const CLAVE = "fauna_sonido";

export function sonidoEncendido()
{
	try { return localStorage.getItem(CLAVE) !== "0"; }
	catch { return true; }
}

export function iniciarSonido(runtime)
{
	aplicarSilencio(runtime, !sonidoEncendido());
	pintarBotonSonido(runtime);
}

export function alternarSonido(runtime)
{
	const encender = !sonidoEncendido();
	try { localStorage.setItem(CLAVE, encender ? "1" : "0"); } catch {}
	aplicarSilencio(runtime, !encender);
	pintarBotonSonido(runtime);
	return encender;
}

export function tocarBotonSonido(runtime, x, y)
{
	const botones = runtime.objects.spriteBotonSonido?.getAllInstances() ?? [];
	return botones.some(b => b.isVisible && b.containsPoint(x, y));
}

export function pintarBotonSonido(runtime)
{
	const anim = sonidoEncendido() ? "on" : "off";
	for (const inst of runtime.objects.spriteBotonSonido?.getAllInstances() ?? [])
	{
		if (inst.animationName !== anim) inst.setAnimation(anim);
		inst.isVisible = true;
	}
}

function aplicarSilencio(runtime, silenciar)
{
	const audio = runtime.objects.Audio;
	if (audio) audio.isSilent = !!silenciar;
}

export function avisarGolpeCazador(runtime)
{
	if (runtime.globalVars.GOLPE_CAZADOR !== undefined)
		runtime.globalVars.GOLPE_CAZADOR = 1;
}
