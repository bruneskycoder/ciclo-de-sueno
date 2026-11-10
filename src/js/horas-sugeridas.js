// horas-sugeridas.js — de qué horas se arma cada pregunta. Lógica PURA,
// sin DOM.
//
// Por qué existe. Anotar de memoria pasó de "¿cuántas horas dormiste?" a
// "¿a qué hora te acostaste?" y "¿a qué hora te levantaste?". Para que
// siga costando un toque cada una, las respuestas se ofrecen ya armadas,
// centradas en TUS horarios de siempre: elegir 23:30 entre 23:00, 23:30 y
// 00:00 es una respuesta; escribir una hora, no.
import { addMinutesToClock } from './calc.js';
import { hasClockTimes, recordKind } from './sleep-session.js';

export const PASO_MINUTOS = 30;
export const HORA_ACOSTARSE_POR_DEFECTO = '23:00';
export const HORA_LEVANTARSE_POR_DEFECTO = '07:00';

// Se mira lo último que se anotó, no todo el historial: los horarios de
// hace medio año no son los de ahora.
const NOCHES_PARA_LA_MEDIANA = 30;

function aMinutos(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function aHora(minutos) {
    const total = ((Math.round(minutos) % 1440) + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Redondea una hora de reloj al paso más cercano ("23:10" → "23:00"). */
export function roundClock(hhmm, step = PASO_MINUTOS) {
    return aHora(Math.round(aMinutos(hhmm) / step) * step);
}

function mediana(numeros) {
    const orden = [...numeros].sort((a, b) => a - b);
    const mitad = Math.floor(orden.length / 2);
    return orden.length % 2 === 1 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2;
}

/**
 * La hora de siempre: la mediana de lo anotado, redondeada a media hora.
 *
 * La hora de acostarse se corre 24 horas cuando cae de madrugada (antes de
 * las 12:00), igual que en metrics.js: sin esto, 23:50 y 00:10 darían una
 * mediana absurda cerca del mediodía en vez de 00:00. La de levantarse no
 * necesita corrimiento: cae de mañana.
 *
 * @param {Array} records
 * @param {'bedtimeActual'|'waketimeActual'} campo
 * @returns {string} "HH:MM"; la hora por defecto si no hay datos.
 */
export function usualClock(records, campo) {
    const porDefecto =
        campo === 'bedtimeActual' ? HORA_ACOSTARSE_POR_DEFECTO : HORA_LEVANTARSE_POR_DEFECTO;

    const horas = records
        .filter((r) => hasClockTimes(r) && recordKind(r) === 'noche')
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, NOCHES_PARA_LA_MEDIANA)
        .map((r) => aMinutos(r[campo]))
        .map((min) => (campo === 'bedtimeActual' && min < 12 * 60 ? min + 1440 : min));

    if (horas.length === 0) return porDefecto;
    return roundClock(aHora(mediana(horas)));
}

/**
 * Horas de media en media hora alrededor de un centro. Con el default son
 * cinco: dos antes, el centro y dos después.
 */
export function clockOptions(centro, { before = 2, after = 2, step = PASO_MINUTOS } = {}) {
    const base = roundClock(centro, step);
    const opciones = [];
    for (let i = -before; i <= after; i++) {
        opciones.push(addMinutesToClock(base, i * step));
    }
    return opciones;
}

/**
 * Las tres horas de la confirmación: una antes de la planeada, la
 * planeada y una después. Antes eran dos botones, "Fue así" y "Fue
 * distinto", y el primero ganaba siempre: 12 de las 13 noches confirmadas
 * eran exactamente el plan. Elegir 07:20 entre 06:50, 07:20 y 07:50 es una
 * respuesta; tocar "Fue así" es un reflejo. Cuesta lo mismo.
 *
 * No se redondea: la hora planeada viene de la lista de ciclos y casi
 * nunca cae en media hora.
 */
export function aroundPlanned(planeada, step = PASO_MINUTOS) {
    return [addMinutesToClock(planeada, -step), planeada, addMinutesToClock(planeada, step)];
}

/**
 * Horas para elegir cuando se sabe a qué hora te acostaste pero no a qué
 * hora te levantaste y no hay nada planeado (noche abierta sin hora
 * elegida, o noche olvidada): alrededor de tu hora de siempre.
 */
export function wakeOptionsFor(records) {
    return clockOptions(usualClock(records, 'waketimeActual'));
}
