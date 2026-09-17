// sleep-session.js — lógica PURA del estado de una noche (v2). Sin DOM y
// sin localStorage: recibe datos, devuelve datos. Mismo criterio que
// calc.js y metrics.js, para poder testearla con Vitest sin levantar un
// navegador.
//
// Por qué existe este módulo. Hasta la v1 anotar una noche era un
// formulario de cinco campos que había que completar a la mañana
// siguiente, recordando a qué hora te habías acostado. En la v2 son dos
// toques: "Me voy a dormir" abre la noche guardando la hora del reloj, y
// "Ya me levanté" la cierra. Eso convierte al registro en un subproducto
// de usar la app, en vez de una tarea aparte.
//
// La noche en curso vive en una clave de localStorage propia
// (`openSleep`, ver storage.js) y NO dentro del historial. Es a
// propósito: un registro a medio completar dentro del array principal
// rompería de una sola vez la validación de importación, las
// agregaciones de metrics.js y los tests que ya existen. Separada, el
// historial sigue conteniendo únicamente noches cerradas y completas.
import { calcularDuracionReal, formatTime } from './calc.js';

// Una siesta larga completa un ciclo (~90 min); tres horas deja lugar de
// sobra para eso sin llegar a confundirse con una noche corta. Se
// clasifica por DURACIÓN y no por horario porque la duración es un dato
// real y el horario sería una adivinanza: hay gente que trabaja de noche
// y duerme de día, y no hay razón para tratar su descanso como siesta.
export const SIESTA_MAX_MINUTES = 3 * 60;

export function classifyKind(durationMinutes) {
    return durationMinutes < SIESTA_MAX_MINUTES ? 'siesta' : 'noche';
}

// Los registros guardados antes de la v2 no tienen el campo `kind`. Se
// leen como 'noche' en vez de recalcularlos por duración: los datos
// viejos se generaron cuando la app solo anotaba noches, así que esa es
// su intención original, y reinterpretarlos convertiría en siesta alguna
// noche corta que el usuario sí anotó como noche.
export function recordKind(record) {
    return record && record.kind === 'siesta' ? 'siesta' : 'noche';
}

// Las siestas no entran en el promedio de noches: mezclarlas hundiría la
// media y haría creer que se duerme menos de lo que se duerme. Se filtra
// ACÁ y no dentro de metrics.js para no tocar un módulo que ya está
// testeado y que no tiene por qué saber que existen las siestas.
export function onlyNights(records) {
    return records.filter((r) => recordKind(r) === 'noche');
}

export function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// A qué noche pertenece un instante. Acostarse a las 00:30 del día 18 es
// "la noche del 17", no la del 18 — si no, una misma noche quedaría
// partida en dos fechas según el lado de la medianoche en que uno se
// acuesta. El corte a las 12:00 es el mismo que usa normalizeClockMinutes
// en metrics.js, para que las dos partes de la app entiendan "noche" de
// la misma manera.
//
// Caso borde conocido: una siesta a las 09:00 queda asignada al día
// anterior. Es raro y no afecta ningún promedio (las siestas se filtran
// de las métricas de noches), así que no justifica una regla aparte.
export function nightDateFor(moment) {
    const d = new Date(moment);
    if (d.getHours() < 12) d.setDate(d.getDate() - 1);
    return formatDateKey(d);
}

/**
 * Abre una noche a partir del reloj. No recibe ningún dato del usuario
 * porque justamente ese es el punto: dos toques, cero escritura.
 *
 * @param {Date} [now=new Date()]
 * @returns {{date: string, bedtimeActual: string, startedAt: string}}
 */
export function openSleepFrom(now = new Date()) {
    return {
        date: nightDateFor(now),
        bedtimeActual: formatTime(now),
        startedAt: now.toISOString(),
    };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;

// No se confía en lo que venga de localStorage: puede estar corrupto,
// editado a mano, o escrito por una versión anterior de la app. Ante la
// duda se descarta la noche abierta (ver getOpenSleep en storage.js), que
// es preferible a arrastrar un estado roto que después rompe el cierre.
export function isValidOpenSleep(data) {
    return Boolean(
        data &&
        typeof data === 'object' &&
        DATE_RE.test(data.date) &&
        TIME_RE.test(data.bedtimeActual) &&
        typeof data.startedAt === 'string' &&
        !Number.isNaN(Date.parse(data.startedAt)),
    );
}

// Una noche que lleva demasiadas horas abierta casi seguro es un olvido:
// tocaste "Me voy a dormir" y nunca cerraste. En vez de inventar una hora
// de despertar o descartar el dato, la app la marca como olvidada y te
// deja completar la hora a mano (ver el cuaderno). 16 horas deja pasar
// cualquier noche real, incluida una larguísima, sin dar falsos avisos.
export const STALE_HOURS = 16;

export function isStaleOpenSleep(open, now = new Date(), maxHours = STALE_HOURS) {
    if (!isValidOpenSleep(open)) return false;
    const elapsedMs = now.getTime() - Date.parse(open.startedAt);
    return elapsedMs > maxHours * 60 * 60 * 1000;
}

/**
 * Cierra una noche abierta y devuelve el registro listo para guardar.
 * Reutiliza calcularDuracionReal (calc.js) en vez de recalcular la
 * duración acá: es la misma cuenta que ya hacía el formulario de la v1,
 * ya está testeada, y ya resuelve el cruce de medianoche.
 *
 * @param {Object} params
 * @param {Object} params.open - La noche abierta (esquema de openSleepFrom).
 * @param {string} params.waketimeActual - Hora real de despertar, "HH:MM".
 * @param {number} [params.cycleMinutes=90] - Duración de ciclo del usuario.
 * @returns {{ok: true, record: Object} | {ok: false, error: string}}
 */
export function closeSleepSession({ open, waketimeActual, cycleMinutes = 90 }) {
    if (!isValidOpenSleep(open)) {
        return { ok: false, error: 'no-open-sleep' };
    }

    const duracion = calcularDuracionReal({
        bedtimeActual: open.bedtimeActual,
        waketimeActual,
        cycleMinutes,
    });
    if (!duracion.ok) return duracion;

    return {
        ok: true,
        record: {
            date: open.date,
            bedtimeActual: open.bedtimeActual,
            waketimeActual,
            durationMinutes: duracion.durationMinutes,
            cyclesCompleted: duracion.cyclesCompleted,
            kind: classifyKind(duracion.durationMinutes),
        },
    };
}
