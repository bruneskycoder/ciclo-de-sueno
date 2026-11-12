// fuego.js — cuánto fuego queda, sin tocar el DOM.
//
// Paso 15 del plan v3: la escena cuenta la noche. Con una noche en curso,
// el fuego baja en proporción a lo que llevás en la cama respecto de lo
// planeado. Funciones puras: reciben la noche y la hora, devuelven números.
import { isStaleOpenSleep } from './sleep-session.js';

// La fuerza del fuego va de 1 (recién prendido) a FUERZA_MINIMA (brasas al
// final de la noche). No llega a 0: un fogón apagado del todo es una
// escena sin foco, y a la hora de levantarse todavía queda brasa.
export const FUERZA_MINIMA = 0.3;

// De día el fogón queda chico (paso 15c): nadie atiza a pleno sol.
export const FUERZA_DE_DIA = 0.45;

const aMinutos = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

/**
 * La primera vez que el reloj marca `hhmm` después de `desde`. Una noche
 * que empieza a las 23:40 con despertar 07:10 termina al día siguiente;
 * una siesta que empieza 14:00 con despertar 15:30, el mismo día.
 */
export function proximaHora(desde, hhmm) {
    const d = new Date(desde);
    const objetivo = aMinutos(hhmm);
    const actual = d.getHours() * 60 + d.getMinutes();
    let faltan = objetivo - actual;
    if (faltan <= 0) faltan += 1440;
    return new Date(d.getTime() - d.getSeconds() * 1000 - d.getMilliseconds() + faltan * 60000);
}

/**
 * Qué parte de la noche planeada ya pasó: 0 al acostarse, 1 a la hora de
 * despertar (y queda en 1 si te pasaste). null si no hay noche en curso o
 * si es una noche olvidada (más de 16 horas abierta).
 *
 * @param {Object|null} abierta - la noche en curso (getOpenSleep)
 * @param {string} despertar - "HH:MM" planeado
 * @param {Date} ahora
 */
export function consumoDeLaNoche(abierta, despertar, ahora) {
    if (!abierta || !despertar || isStaleOpenSleep(abierta, ahora)) return null;
    const inicio = Date.parse(abierta.startedAt);
    const fin = proximaHora(new Date(inicio), despertar).getTime();
    const p = (ahora.getTime() - inicio) / (fin - inicio);
    return Math.min(1, Math.max(0, p));
}

/**
 * La fuerza del fuego, de FUERZA_MINIMA a 1. De día es chico; con una
 * noche en curso, baja en línea recta con el consumo. Si las dos cosas
 * pasan (una siesta a la tarde), gana la más chica.
 */
export function fuerzaDelFuego({ consumo = null, momento = 'noche' } = {}) {
    let f = 1;
    if (momento === 'dia') f = FUERZA_DE_DIA;
    if (consumo !== null) f = Math.min(f, 1 - (1 - FUERZA_MINIMA) * consumo);
    return f;
}
