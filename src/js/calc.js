// calc.js — lógica PURA de cálculo de ciclos de sueño. Sin DOM: recibe
// datos, devuelve datos. Esto es lo que permite testear con Vitest (ver
// calc.test.js) sin levantar un navegador.

export function formatTime(date) {
    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

// Latencia: minutos hasta quedarse dormido. Se acota a [0, 120] acá adentro
// (no solo vía el atributo min/max del <input>, que un valor tipeado a mano
// puede saltarse).
export function clampLatency(value, { min = 0, max = 120 } = {}) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return 0;
    return Math.min(max, Math.max(min, n));
}

// Duración del ciclo de sueño en minutos. 90 es un promedio poblacional
// (Fase 3 del plan), pero varía por persona — el rango 70–120 cubre la
// variación típica reportada en la bibliografía de sueño. Igual que con
// clampLatency, no confío solo en el min/max del <input>: si llega un
// valor fuera de rango o no numérico (localStorage corrupto, input vacío),
// caigo al default de 90 en vez de romper el cálculo.
export function clampCycleLength(value, { min = 70, max = 120, fallback = 90 } = {}) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

// Compara el día calendario de targetDate contra el de baseDate.
// Devuelve -1 (día anterior), 0 (mismo día) o 1 (día siguiente).
function dayOffsetFrom(baseDate, targetDate) {
    const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    return Math.round((target - base) / 86400000);
}

// Dado un instante base y una cantidad de minutos de sueño, calcula el
// punto de tiempo resultante: en modo 'wake' timeStr es la hora de
// despertar y se va hacia atrás (el resultado es la hora de acostarse);
// en modo 'sleep' timeStr es la hora de acostarse y se va hacia adelante
// (el resultado es la hora de despertar). Extraído de calcularCiclos para
// que calcularSiesta pueda reusar exactamente la misma aritmética de
// horario/cruce de medianoche sin duplicarla.
function computeTimePoint({ mode, baseDate, totalMinutes }) {
    const targetDate = new Date(baseDate);
    let bedtimeDate;

    if (mode === 'wake') {
        targetDate.setMinutes(targetDate.getMinutes() - totalMinutes);
        bedtimeDate = targetDate;
    } else {
        bedtimeDate = baseDate;
        targetDate.setMinutes(targetDate.getMinutes() + totalMinutes);
    }

    return {
        totalMinutes,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        resultTimeStr: formatTime(targetDate),
        dayOffset: dayOffsetFrom(baseDate, targetDate),
        bedtimeTimeStr: formatTime(bedtimeDate),
    };
}

/**
 * Calcula, para una hora de referencia (despertar o acostarse), las horas
 * de acostarse/despertar que caen en un número entero de ciclos de sueño.
 *
 * @param {Object} params
 * @param {'wake'|'sleep'} params.mode - 'wake': timeStr es la hora de
 *   despertar deseada (se calcula hacia atrás). 'sleep': timeStr es la hora
 *   de acostarse (se calcula hacia adelante).
 * @param {string} params.timeStr - Hora en formato "HH:MM".
 * @param {number} params.latencyMinutes - Minutos hasta dormirse. Se acota
 *   internamente con clampLatency.
 * @param {number} [params.cycleMinutes=90] - Duración de un ciclo, en
 *   minutos. Se acota internamente con clampCycleLength (70–120).
 * @param {number} [params.minCycles=1]
 * @param {number} [params.maxCycles=6]
 * @param {number} [params.optimalMinCycles=4] - A partir de cuántos ciclos
 *   se marca el resultado como "óptimo".
 * @param {number} [params.optimalMaxCycles=6]
 * @param {Date} [params.referenceDate=new Date()] - Fecha base (para poder
 *   fijarla en los tests). Solo se usa su día/mes/año; la hora se pisa con
 *   timeStr.
 * @returns {{ok: true, latency: number, cycleLength: number, results: Array} | {ok: false, error: string}}
 */
export function calcularCiclos({
    mode,
    timeStr,
    latencyMinutes,
    cycleMinutes = 90,
    minCycles = 1,
    maxCycles = 6,
    optimalMinCycles = 4,
    optimalMaxCycles = 6,
    referenceDate = new Date(),
}) {
    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return { ok: false, error: 'missing-time' };
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const latency = clampLatency(latencyMinutes);
    const cycleLength = clampCycleLength(cycleMinutes);
    const baseDate = new Date(referenceDate);
    baseDate.setHours(hours, minutes, 0, 0);

    const results = [];
    for (let cycles = minCycles; cycles <= maxCycles; cycles++) {
        const totalMinutes = cycles * cycleLength + latency;
        results.push({
            cycles,
            isOptimal: cycles >= optimalMinCycles && cycles <= optimalMaxCycles,
            ...computeTimePoint({ mode, baseDate, totalMinutes }),
        });
    }

    return { ok: true, latency, cycleLength, results };
}

// Duración de una siesta corta ("power nap"): lo bastante breve para no
// entrar en sueño profundo, así se evita la inercia del sueño (el
// atontamiento de despertarse a mitad de una fase profunda). Fuente:
// Sleep Foundation y Mayo Clinic coinciden en un rango de 10–30 min, con
// 15–20 min como punto ideal — ver README para las citas completas.
export const SIESTA_CORTA_MINUTOS = 20;

/**
 * Calcula las dos recomendaciones estándar de siesta a partir de una hora
 * de acostarse: una siesta CORTA (SIESTA_CORTA_MINUTOS, evita sueño
 * profundo) y una siesta COMPLETA (un ciclo entero de cycleMinutes, se
 * despierta en una fase más liviana). Deliberadamente NO es "menos ciclos
 * que calcularCiclos": la siesta corta no es una fracción de ciclo, es una
 * recomendación con lógica propia (cortar antes de la fase profunda). Por
 * eso es una función separada — aunque comparte toda la aritmética de
 * horario con calcularCiclos vía computeTimePoint.
 *
 * @param {Object} params
 * @param {string} params.timeStr - Hora en la que se acuesta a sestear, "HH:MM".
 * @param {number} params.latencyMinutes - Minutos hasta dormirse.
 * @param {number} [params.cycleMinutes=90] - Duración de ciclo del usuario
 *   (la misma preferencia de Fase 3), usada para la siesta completa.
 * @param {Date} [params.referenceDate=new Date()]
 * @returns {{ok: true, latency: number, cycleLength: number, corta: Object, completa: Object} | {ok: false, error: string}}
 */
/**
 * A diferencia de calcularCiclos/calcularSiesta (que proyectan una hora
 * FUTURA a partir de una sola hora conocida), esto es para el logueo real
 * (Fase 5): ya se conocen las dos horas reales (acostarse y despertar) y
 * lo que hace falta es derivar cuánto se durmió. Asume cruce de
 * medianoche si la hora de despertar cae antes o igual que la de
 * acostarse (caso normal de una noche de sueño) — si son iguales, se
 * interpreta como 24h completas en vez de 0, que sería un dato inútil.
 *
 * @param {Object} params
 * @param {string} params.bedtimeActual - Hora real de acostarse, "HH:MM".
 * @param {string} params.waketimeActual - Hora real de despertar, "HH:MM".
 * @param {number} [params.cycleMinutes=90] - Duración de ciclo del usuario
 *   (Fase 3), para estimar cuántos ciclos completó. Se acota con
 *   clampCycleLength igual que en el resto de la app.
 * @returns {{ok: true, durationMinutes: number, cyclesCompleted: number, cycleLength: number} | {ok: false, error: string}}
 */
export function calcularDuracionReal({ bedtimeActual, waketimeActual, cycleMinutes = 90 }) {
    if (!bedtimeActual || !/^\d{1,2}:\d{2}$/.test(bedtimeActual)) {
        return { ok: false, error: 'missing-bedtime' };
    }
    if (!waketimeActual || !/^\d{1,2}:\d{2}$/.test(waketimeActual)) {
        return { ok: false, error: 'missing-waketime' };
    }

    const [bh, bm] = bedtimeActual.split(':').map(Number);
    const [wh, wm] = waketimeActual.split(':').map(Number);
    const bedtimeMinutes = bh * 60 + bm;
    let wakeMinutes = wh * 60 + wm;
    if (wakeMinutes <= bedtimeMinutes) wakeMinutes += 24 * 60;

    const durationMinutes = wakeMinutes - bedtimeMinutes;
    const cycleLength = clampCycleLength(cycleMinutes);
    const cyclesCompleted = Math.round(durationMinutes / cycleLength);

    return { ok: true, durationMinutes, cyclesCompleted, cycleLength };
}

export function calcularSiesta({ timeStr, latencyMinutes, cycleMinutes = 90, referenceDate = new Date() }) {
    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return { ok: false, error: 'missing-time' };
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const latency = clampLatency(latencyMinutes);
    const cycleLength = clampCycleLength(cycleMinutes);
    const baseDate = new Date(referenceDate);
    baseDate.setHours(hours, minutes, 0, 0);

    const corta = {
        tipo: 'corta',
        ...computeTimePoint({ mode: 'sleep', baseDate, totalMinutes: SIESTA_CORTA_MINUTOS + latency }),
    };
    const completa = {
        tipo: 'completa',
        ...computeTimePoint({ mode: 'sleep', baseDate, totalMinutes: cycleLength + latency }),
    };

    return { ok: true, latency, cycleLength, corta, completa };
}
