// metrics.js — agregaciones PURAS sobre logs de sueño reales (Fase 5).
// Sin DOM: recibe el array de registros (esquema `sleepLogReal`, ver
// storage.js) + una fecha de referencia, devuelve números. Esto es lo que
// permite testear con Vitest (ver metrics.test.js) sin levantar un
// navegador — mismo criterio que calc.js.

function average(numbers) {
    if (numbers.length === 0) return null;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

// Desvío estándar poblacional. Con menos de 2 puntos no tiene ningún
// significado (no hay variación que medir), así que devuelve null en vez
// de 0 — 0 diría falsamente "perfecta consistencia".
function stdDev(numbers) {
    if (numbers.length < 2) return null;
    const avg = average(numbers);
    const variance = average(numbers.map((n) => (n - avg) ** 2));
    return Math.sqrt(variance);
}

// Minutos desde medianoche, corridos para que la madrugada (00:00–11:59)
// quede numéricamente contigua con la noche anterior en vez de saltar a
// cero. Sin esto, acostarse a las 23:50 una noche y a las 00:10 la
// siguiente mediría ~1430 minutos de diferencia en vez de los 20 reales,
// e inflaría artificialmente la "inconsistencia" de alguien que en
// realidad se acuesta siempre a la misma hora. Sumar una constante fija a
// todos los valores no cambia el desvío estándar, así que aplicar el
// mismo corrimiento a la hora de despertar no distorsiona nada — ahí
// normalmente no hace falta, pero tampoco rompe el cálculo.
function normalizeClockMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const mins = h * 60 + m;
    return mins < 12 * 60 ? mins + 24 * 60 : mins;
}

// Registros cuya fecha (YYYY-MM-DD) cae en los últimos `days` días
// contando desde referenceDate, inclusive en ambas puntas. No asume
// fechas contiguas — un registro faltante en el medio del período
// simplemente no aporta datos, no rompe el filtro.
export function recordsInWindow(records, days, referenceDate = new Date()) {
    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);
    const limite = new Date(ref);
    limite.setDate(limite.getDate() - (days - 1));

    return records.filter((r) => {
        const [y, mo, d] = r.date.split('-').map(Number);
        const recordDate = new Date(y, mo - 1, d);
        return recordDate >= limite && recordDate <= ref;
    });
}

/**
 * Resume un conjunto de registros de sueño real en cantidad, promedio de
 * horas dormidas, promedio de calidad (si hay calificaciones cargadas) y
 * consistencia de horario (desvío estándar de la hora de acostarse y de
 * la de despertar) — esto último es más útil que solo "horas totales"
 * para ver patrones reales (alguien puede dormir 7h en promedio pero con
 * horarios erráticos, o dormir 7h siempre a la misma hora).
 *
 * @param {Array<{durationMinutes:number, quality:?number, bedtimeActual:string, waketimeActual:string}>} records
 * @returns {{count:number, avgDurationMinutes:?number, avgQuality:?number, bedtimeConsistencyMinutes:?number, waketimeConsistencyMinutes:?number}}
 */
export function summarize(records) {
    if (records.length === 0) {
        return {
            count: 0,
            avgDurationMinutes: null,
            avgQuality: null,
            bedtimeConsistencyMinutes: null,
            waketimeConsistencyMinutes: null,
        };
    }

    const qualities = records.map((r) => r.quality).filter((q) => q !== null && q !== undefined);

    return {
        count: records.length,
        avgDurationMinutes: average(records.map((r) => r.durationMinutes)),
        avgQuality: average(qualities),
        bedtimeConsistencyMinutes: stdDev(records.map((r) => normalizeClockMinutes(r.bedtimeActual))),
        waketimeConsistencyMinutes: stdDev(records.map((r) => normalizeClockMinutes(r.waketimeActual))),
    };
}

export function weeklySummary(records, referenceDate = new Date()) {
    return summarize(recordsInWindow(records, 7, referenceDate));
}

export function monthlySummary(records, referenceDate = new Date()) {
    return summarize(recordsInWindow(records, 30, referenceDate));
}
