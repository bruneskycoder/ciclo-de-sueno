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

// Compara el día calendario de targetDate contra el de baseDate.
// Devuelve -1 (día anterior), 0 (mismo día) o 1 (día siguiente).
function dayOffsetFrom(baseDate, targetDate) {
    const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    return Math.round((target - base) / 86400000);
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
 * @param {number} [params.cycleMinutes=90] - Duración de un ciclo.
 * @param {number} [params.minCycles=1]
 * @param {number} [params.maxCycles=6]
 * @param {number} [params.optimalMinCycles=4] - A partir de cuántos ciclos
 *   se marca el resultado como "óptimo".
 * @param {number} [params.optimalMaxCycles=6]
 * @param {Date} [params.referenceDate=new Date()] - Fecha base (para poder
 *   fijarla en los tests). Solo se usa su día/mes/año; la hora se pisa con
 *   timeStr.
 * @returns {{ok: true, latency: number, results: Array} | {ok: false, error: string}}
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
    const baseDate = new Date(referenceDate);
    baseDate.setHours(hours, minutes, 0, 0);

    const results = [];
    for (let cycles = minCycles; cycles <= maxCycles; cycles++) {
        const sleepMinutes = cycles * cycleMinutes;
        const totalMinutes = sleepMinutes + latency;
        const targetDate = new Date(baseDate);
        let bedtimeDate;

        if (mode === 'wake') {
            targetDate.setMinutes(targetDate.getMinutes() - totalMinutes);
            bedtimeDate = targetDate;
        } else {
            bedtimeDate = baseDate;
            targetDate.setMinutes(targetDate.getMinutes() + totalMinutes);
        }

        results.push({
            cycles,
            totalMinutes,
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
            resultTimeStr: formatTime(targetDate),
            dayOffset: dayOffsetFrom(baseDate, targetDate),
            bedtimeTimeStr: formatTime(bedtimeDate),
            isOptimal: cycles >= optimalMinCycles && cycles <= optimalMaxCycles,
        });
    }

    return { ok: true, latency, results };
}
