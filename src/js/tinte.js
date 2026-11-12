// tinte.js — el color del cielo según la altura del sol (paso 14d, vía del
// "tinte" del plan).
//
// La pintura es de noche. Para el atardecer, el día y el amanecer no se
// pinta otra: se cambia el cielo (lo que queda por encima del monte) por un
// degradé y se levanta un poco la luz del conjunto. Bruno lo aprobó el
// 2026-11-12; la prueba de lectura con alguien que no la vio sigue sin
// hacerse. Si un momento no se lee, se saca de MOMENTOS_PINTADOS en
// escena-pintada.js y en ese momento vuelve la escena 2D.
//
// Todo es interpolación entre cuatro claves, por altura del sol: continuo,
// sin saltos.

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// [altura del sol, opacidad del cielo nuevo, color de arriba, color del horizonte, levante de luz]
const CLAVES = [
    [-8, 0, '#1d2b5a', '#c96a4a', 0],
    [-3, 0.85, '#1f2d63', '#c96a4a', 0.04],
    [2, 1, '#35539a', '#f0a066', 0.1],
    [10, 1, '#4a84d1', '#a9d3f0', 0.2],
].map(([alt, a, arriba, horizonte, lift]) => ({
    alt,
    a,
    arriba: hex(arriba),
    horizonte: hex(horizonte),
    lift,
}));

const mezclar = (x, y, k) => x + (y - x) * k;

export function tinteDelCielo(alturaSol) {
    const primera = CLAVES[0];
    const ultima = CLAVES[CLAVES.length - 1];
    if (alturaSol <= primera.alt) return { opacidad: 0, arriba: primera.arriba, horizonte: primera.horizonte, lift: 0 };
    if (alturaSol >= ultima.alt)
        return { opacidad: ultima.a, arriba: ultima.arriba, horizonte: ultima.horizonte, lift: ultima.lift };
    for (let i = 1; i < CLAVES.length; i++) {
        const a = CLAVES[i - 1];
        const b = CLAVES[i];
        if (alturaSol <= b.alt) {
            const k = (alturaSol - a.alt) / (b.alt - a.alt);
            return {
                opacidad: mezclar(a.a, b.a, k),
                arriba: a.arriba.map((v, j) => Math.round(mezclar(v, b.arriba[j], k))),
                horizonte: a.horizonte.map((v, j) => Math.round(mezclar(v, b.horizonte[j], k))),
                lift: mezclar(a.lift, b.lift, k),
            };
        }
    }
    return { opacidad: ultima.a, arriba: ultima.arriba, horizonte: ultima.horizonte, lift: ultima.lift };
}
