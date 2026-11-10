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
import { calcularDuracionReal, clampCycleLength, formatTime } from './calc.js';

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
export function openSleepFrom(now = new Date(), { intendedWaketime = null } = {}) {
    return {
        date: nightDateFor(now),
        bedtimeActual: formatTime(now),
        startedAt: now.toISOString(),
        // Si al calcular elegiste una de las filas ("despertarme 07:40"),
        // queda guardada la intención. Sirve para que al día siguiente la
        // app pueda preguntar "¿fue así?" en vez de pedirte el dato de
        // cero: confirmar cuesta un toque, recordar cuesta pensar.
        intendedWaketime,
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

// Ningún descanso real dura más de 16 horas. Es el mismo número que
// STALE_HOURS pero en minutos y con otro papel: STALE_HOURS decide cuándo
// una noche abierta se considera olvidada; este es el techo de lo que se
// acepta como registro, al cerrar, al guardar y al importar. Existe
// porque los datos reales trajeron dos registros imposibles (23h 30m y una
// "siesta" de 22 minutos que en realidad había quedado abierta dos días):
// se cerraron restando horas de reloj, que no saben que pasaron días.
export const MAX_SLEEP_MINUTES = STALE_HOURS * 60;

export function isPlausibleDuration(minutes) {
    return typeof minutes === 'number' && minutes >= 0 && minutes <= MAX_SLEEP_MINUTES;
}

// De dónde salió un registro. Con horario en las noches de memoria,
// `hasClockTimes` ya no alcanza para saber cuáles lo fueron.
export const SOURCES = ['live', 'confirmed', 'recalled'];

// Cómo te levantaste, en tres niveles. Se guarda en `quality` (1, 3 o 5)
// para reusar el campo, su validación y el promedio de metrics.js, y queda
// en la misma escala de cinco puntos que usa el diario de sueño estándar
// (Consensus Sleep Diary, Carney y otros, 2012).
export const QUALITY_LEVELS = [
    { value: 1, label: 'Mal' },
    { value: 3, label: 'Normal' },
    { value: 5, label: 'Bien' },
];

// Motivos de un toque. Los tres primeros son conceptos que pregunta el
// diario de sueño estándar; el cuarto salió de lo que las notas reales
// decían. Es una lista fija a propósito: sin texto libre se pueden contar.
export const REASONS = [
    { id: 'costo-dormirme', label: 'Me costó dormirme' },
    { id: 'desperte-noche', label: 'Me desperté a la noche' },
    { id: 'desperte-antes', label: 'Me desperté antes' },
    { id: 'dolor', label: 'Me dolía algo' },
];

export function isReasonId(value) {
    return REASONS.some((r) => r.id === value);
}

/**
 * Cierra una noche abierta y devuelve el registro listo para guardar.
 *
 * Hay dos formas de cerrar, y la diferencia es la causa de fondo de los
 * dos registros imposibles:
 *
 * - EN VIVO (se pasa `closedAt`): la duración sale de restar las marcas
 *   de tiempo reales, `startedAt` y `closedAt`. Sabe que pasaron días.
 * - CON UNA HORA ELEGIDA (se pasa `waketimeActual`, sin `closedAt`): la
 *   persona dice a qué hora se levantó y la cuenta es de reloj, que
 *   asume que fue la primera vez que el reloj marcó esa hora después de
 *   acostarse. Por eso el techo de 16 horas importa acá: si la noche
 *   quedó abierta días, cualquier hora elegida da un absurdo y se rechaza.
 *
 * @param {Object} params
 * @param {Object} params.open - La noche abierta (esquema de openSleepFrom).
 * @param {string} [params.waketimeActual] - Hora real de despertar, "HH:MM".
 * @param {Date} [params.closedAt] - El instante del cierre, para cerrar en vivo.
 * @param {number} [params.cycleMinutes=90] - Duración de ciclo del usuario.
 * @param {'live'|'confirmed'|'recalled'} [params.source]
 * @returns {{ok: true, record: Object} | {ok: false, error: string}}
 */
export function closeSleepSession({
    open,
    waketimeActual,
    closedAt = null,
    cycleMinutes = 90,
    source = null,
}) {
    if (!isValidOpenSleep(open)) {
        return { ok: false, error: 'no-open-sleep' };
    }

    let duracion;
    let despertar = waketimeActual;

    if (closedAt) {
        const minutos = Math.round((closedAt.getTime() - Date.parse(open.startedAt)) / 60000);
        if (minutos < 1) return { ok: false, error: 'too-short' };
        despertar = formatTime(closedAt);
        const cycleLength = clampCycleLength(cycleMinutes);
        duracion = {
            ok: true,
            durationMinutes: minutos,
            cyclesCompleted: Math.round(minutos / cycleLength),
        };
    } else {
        duracion = calcularDuracionReal({
            bedtimeActual: open.bedtimeActual,
            waketimeActual,
            cycleMinutes,
        });
    }
    if (!duracion.ok) return duracion;
    if (!isPlausibleDuration(duracion.durationMinutes)) {
        return { ok: false, error: 'too-long' };
    }

    return {
        ok: true,
        record: {
            date: open.date,
            bedtimeActual: open.bedtimeActual,
            waketimeActual: despertar,
            durationMinutes: duracion.durationMinutes,
            cyclesCompleted: duracion.cyclesCompleted,
            kind: classifyKind(duracion.durationMinutes),
            source: source || (closedAt ? 'live' : 'confirmed'),
        },
    };
}

// --- PREGUNTAR POR ANOCHE (v2) ---
//
// Por qué existe esto. El diseño anterior daba por hecho que uno cierra
// la noche a la mañana siguiente, apenas se levanta. En la práctica eso
// no pasa: la app se abre de noche, para consultar a qué hora conviene
// despertarse, y a la mañana nadie la abre por iniciativa propia.
//
// Así que la captura se mueve al único momento en que la app se abre de
// verdad. Al entrar, si quedó una noche sin anotar, aparece una tarjeta
// que pregunta por ella. Se aprovecha una visita que ya iba a ocurrir en
// vez de pedir una nueva.

/**
 * Qué noche corresponde preguntar en este momento: la última que ya
 * terminó. No es la de `nightDateFor(now)` — esa es la que está por
 * empezar, incluso a las 00:30, cuando uno ya se está por acostar.
 *
 * La resta de un día sobre nightDateFor funciona igual a cualquier hora:
 * a las 23:00 del 17, a las 00:30 del 18 y a las 14:00 del 17, las tres
 * veces la última noche terminada es la del 16.
 */
export function nightToAskAbout(now = new Date()) {
    const [y, m, d] = nightDateFor(now).split('-').map(Number);
    const anoche = new Date(y, m - 1, d);
    anoche.setDate(anoche.getDate() - 1);
    return formatDateKey(anoche);
}

// Un registro sin horas de reloj es uno respondido de memoria ("dormí
// como siete horas"): sabemos cuánto, no cuándo. Se guarda así, con las
// horas en null, en vez de inventar un horario plausible — inventarlo
// contaminaría con ficción cualquier métrica de regularidad de horarios.
export function hasClockTimes(record) {
    return Boolean(record && record.bedtimeActual && record.waketimeActual);
}

/**
 * ¿Hay que preguntar por anoche?
 *
 * Tres condiciones. Que no esté ya anotada; que no se haya salteado
 * antes (preguntar dos veces por la misma noche es hinchar); y que la
 * app tenga algún rastro previo de uso.
 *
 * Lo último importa para el desconocido que abre el link por primera
 * vez: sin historial, sin noche abierta y sin nada salteado, no hay
 * ninguna "anoche" sobre la que preguntar, y recibir un formulario de
 * entrada sería la peor primera impresión posible.
 */
export function shouldAskAboutNight({
    records = [],
    openSleep = null,
    skipped = [],
    now = new Date(),
}) {
    // Una noche que quedó abierta días se pregunta aunque no sea "anoche":
    // dejarla sin resolver era lo que trababa el botón principal.
    if (isStaleOpenSleep(openSleep, now) && !skipped.includes(openSleep.date)) return true;

    const noche = nightToAskAbout(now);

    if (skipped.includes(noche)) return false;
    if (records.some((r) => r.date === noche && recordKind(r) === 'noche')) return false;

    const hayRastroDeUso = records.length > 0 || openSleep !== null || skipped.length > 0;
    return hayRastroDeUso;
}

/**
 * Con qué forma se pregunta.
 *
 * - `confirm`: la noche de anoche quedó abierta. La app ya sabe a qué hora
 *   te acostaste; falta la hora de levantarte, y si elegiste una fila del
 *   cálculo, además a qué hora pensabas hacerlo.
 * - `recall`: no hay nada. Se pregunta a qué hora te acostaste y a qué
 *   hora te levantaste, de memoria.
 *
 * `night` fuerza la noche por la que se pregunta: es lo que usa tocar un
 * hueco del cuaderno.
 *
 * @returns {{mode: 'confirm', night: string, open: Object} | {mode: 'recall', night: string}}
 */
export function askShapeFor({ openSleep = null, now = new Date(), night: forzada = null }) {
    const night = forzada || nightToAskAbout(now);

    if (isValidOpenSleep(openSleep) && openSleep.date === night) {
        return { mode: 'confirm', night, open: openSleep };
    }
    return { mode: 'recall', night };
}

/**
 * Igual que askShapeFor, pero antes mira si quedó una noche olvidada
 * (abierta hace más de 16 horas). Va aparte para que askShapeFor siga
 * respondiendo solo por la noche que se pide: una noche abierta de otra
 * fecha ahí significa "no sirve para confirmar", y esa regla ya tiene
 * tests.
 *
 * `stale`: se sabe a qué hora te acostaste, no cuándo te levantaste, y no
 * se puede deducir. Se pregunta la hora, y el resultado se valida contra
 * el techo de 16 horas.
 *
 * @returns {{mode: 'stale', night: string, open: Object} | ReturnType<typeof askShapeFor>}
 */
export function askShapeWithStale({ openSleep = null, now = new Date(), night = null }) {
    if (!night && isStaleOpenSleep(openSleep, now)) {
        return { mode: 'stale', night: openSleep.date, open: openSleep };
    }
    return askShapeFor({ openSleep, now, night });
}

/**
 * Registro armado a partir de horas recordadas, sin horario. Es el
 * resultado de responder "dormí como siete horas".
 *
 * @param {Object} params
 * @param {string} params.night - Fecha de la noche, "YYYY-MM-DD".
 * @param {number} params.hours - Horas dormidas, tal como las recuerda.
 * @param {number} [params.cycleMinutes=90]
 */
export function recalledRecord({ night, hours, cycleMinutes = 90 }) {
    const durationMinutes = Math.round(hours * 60);
    return {
        date: night,
        bedtimeActual: null,
        waketimeActual: null,
        durationMinutes,
        cyclesCompleted: Math.round(durationMinutes / cycleMinutes),
        kind: classifyKind(durationMinutes),
    };
}

/**
 * Registro armado a partir de las dos horas dichas de memoria. Es lo que
 * reemplaza a "dormí como siete horas": la memoria ahora trae horario, así
 * que la noche puede aportar a la regularidad. Se marca `recalled` para
 * que la app siga sabiendo que no se midió en el momento.
 *
 * Todo lo que mide la app es tiempo en cama (de acostarse a levantarse).
 * Por eso se pregunta "a qué hora te acostaste" y no "a qué hora te
 * dormiste": las dos fuentes miden lo mismo.
 *
 * @returns {{ok: true, record: Object} | {ok: false, error: string}}
 */
export function recalledNightRecord({ night, bedtimeActual, waketimeActual, cycleMinutes = 90 }) {
    const duracion = calcularDuracionReal({ bedtimeActual, waketimeActual, cycleMinutes });
    if (!duracion.ok) return duracion;
    if (!isPlausibleDuration(duracion.durationMinutes)) {
        return { ok: false, error: 'too-long' };
    }
    return {
        ok: true,
        record: {
            date: night,
            bedtimeActual,
            waketimeActual,
            durationMinutes: duracion.durationMinutes,
            cyclesCompleted: duracion.cyclesCompleted,
            kind: classifyKind(duracion.durationMinutes),
            source: 'recalled',
        },
    };
}

/**
 * Las noches de los últimos `days` días que quedaron sin anotar. El
 * cuaderno las muestra como filas propias para poder cargarlas después:
 * los huecos reales de esta app son los viernes y sábados, y la tarjeta de
 * anoche solo pregunta por la última noche.
 *
 * Una noche cuenta como hueco si es posterior a la primera que se anotó
 * (o abrió) alguna vez: antes de eso la app no se usaba, y llenar el
 * cuaderno de "Sin anotar" por días anteriores a instalarla sería un
 * reproche por algo que no pasó. Las siestas no tapan una noche.
 *
 * @returns {string[]} Fechas "YYYY-MM-DD", de la más reciente a la más vieja.
 */
export function gapNights({ records = [], openSleep = null, now = new Date(), days = 7 }) {
    const fechas = records.map((r) => r.date);
    if (isValidOpenSleep(openSleep)) fechas.push(openSleep.date);
    if (fechas.length === 0) return [];
    const primera = [...fechas].sort()[0];

    const anotadas = new Set(records.filter((r) => recordKind(r) === 'noche').map((r) => r.date));
    const [y, m, d] = nightToAskAbout(now).split('-').map(Number);
    const huecos = [];
    for (let i = 0; i < days; i++) {
        const dia = new Date(y, m - 1, d - i);
        const clave = formatDateKey(dia);
        if (clave < primera) break;
        if (isValidOpenSleep(openSleep) && openSleep.date === clave) continue;
        if (!anotadas.has(clave)) huecos.push(clave);
    }
    return huecos;
}
