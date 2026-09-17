// storage.js — sistema de almacenamiento (localStorage).
//
// Fase 5 — cambio de esquema: hasta la Fase 4, "Marcar" en el Fogón
// guardaba el CÁLCULO SUGERIDO (a qué hora convendría acostarse/
// despertar), no lo que realmente pasó. Eso alcanzaba como recordatorio,
// pero no sirve para medir calidad de sueño real. A partir de acá el
// único flujo de guardado es el logueo real (fecha + hora real de
// acostarse/despertar + calidad/nota opcional), bajo la clave nueva
// `sleepLogReal` — ver esquema en saveSleepLog más abajo.
//
// Qué pasa con los datos viejos (clave `sleepLoreDB`, esquema
// {id, timestamp, dateStr, bedtime, minutes}): NO se leen, NO se
// escriben y NO se borran desde acá. Quedan intactos en el localStorage
// de quien ya los tenía, simplemente huérfanos — es la forma más simple
// de cumplir "no los rompas ni los corrompas silenciosamente" sin migrar
// datos que significan otra cosa (una sugerencia calculada no es lo
// mismo que sueño real: convertirlos mezclaría ficción con dato real en
// las métricas nuevas). "Borrar el Rastro" solo borra `sleepLogReal`.
import { showToast } from './ui/toast.js';
import { renderHistory } from './ui/history-view.js';
import { renderChart, renderStatsPanels } from './ui/stats-view.js';
import { confirmModal } from './ui/modal.js';
import { clampCycleLength, clampLatency, formatTime } from './calc.js';
import { closeSleepSession, isValidOpenSleep, openSleepFrom, recordKind } from './sleep-session.js';

const CYCLE_LENGTH_KEY = 'cycleLengthPref';

// Preferencia de duración de ciclo (Fase 3): se guarda aparte de sleepLoreDB
// porque es una configuración, no un registro de sueño. clampCycleLength
// cubre tanto "nunca se configuró" (localStorage vacío) como un valor
// corrupto o viejo fuera de rango — en ambos casos cae a 90.
export function getCycleLength() {
    return clampCycleLength(localStorage.getItem(CYCLE_LENGTH_KEY));
}

export function saveCycleLength(minutes) {
    const clamped = clampCycleLength(minutes);
    localStorage.setItem(CYCLE_LENGTH_KEY, String(clamped));
    return clamped;
}

// Latencia (minutos hasta dormirse). En la v1 estaba como campo del
// formulario principal y NO se persistía: volvía a 20 en cada visita, así
// que quien tardaba 35 minutos lo retipeaba siempre. Es configuración, no
// una pregunta diaria, así que se guarda y se saca de la pantalla.
const LATENCY_KEY = 'latencyPref';
export const DEFAULT_LATENCY = 20;

export function getLatency() {
    return clampLatency(localStorage.getItem(LATENCY_KEY), { fallback: DEFAULT_LATENCY });
}

export function saveLatency(minutes) {
    const clamped = clampLatency(minutes, { fallback: DEFAULT_LATENCY });
    localStorage.setItem(LATENCY_KEY, String(clamped));
    return clamped;
}

// Tema. 'brasa' baja la luminancia y frena las animaciones, para usar la
// app a oscuras sin comerse la pantalla en la cara. Es un interruptor
// manual y no automático por horario: adivinar por hora del día acierta
// poco y sorprende al usuario cuando la app cambia sola.
const THEME_KEY = 'themePref';
const TEMAS = ['fogon', 'brasa'];

export function getTheme() {
    const guardado = localStorage.getItem(THEME_KEY);
    return TEMAS.includes(guardado) ? guardado : 'fogon';
}

export function saveTheme(theme) {
    const valido = TEMAS.includes(theme) ? theme : 'fogon';
    localStorage.setItem(THEME_KEY, valido);
    return valido;
}

const SLEEP_LOG_KEY = 'sleepLogReal';

export function getSleepLogs() {
    const data = localStorage.getItem(SLEEP_LOG_KEY);
    return data ? JSON.parse(data) : [];
}

function saveSleepLogs(data) {
    localStorage.setItem(SLEEP_LOG_KEY, JSON.stringify(data));
}

/**
 * Guarda una noche de sueño REAL (no una sugerencia calculada). Espera
 * los campos ya validados/derivados por quien llama (ver history-view.js,
 * que usa calcularDuracionReal de calc.js antes de invocar esto) — acá
 * solo se persiste, no se recalcula nada.
 *
 * Esquema: {id, date: "YYYY-MM-DD", bedtimeActual: "HH:MM",
 * waketimeActual: "HH:MM", durationMinutes, cyclesCompleted,
 * quality: 1-5|null, notes: string}
 */
export function saveSleepLog({
    date,
    bedtimeActual,
    waketimeActual,
    durationMinutes,
    cyclesCompleted,
    kind,
    quality,
    notes,
}) {
    const logs = getSleepLogs();
    const registro = {
        id: Date.now().toString(),
        date,
        bedtimeActual,
        waketimeActual,
        durationMinutes,
        cyclesCompleted,
        kind: recordKind({ kind }),
        quality: quality ?? null,
        notes: notes || '',
    };
    logs.push(registro);
    saveSleepLogs(logs);
    // Devuelve el registro (con su id) para que quien llama pueda ofrecer
    // calificarlo después. El aviso en pantalla lo da la vista: persistir
    // y comunicar son dos responsabilidades distintas.
    return registro;
}

/**
 * Modifica campos de un registro ya guardado. Lo usa el cierre de una
 * noche para agregar la calificación o una nota DESPUÉS, sobre la tarjeta
 * ya creada — así cerrar la noche no obliga a completar nada.
 */
export function updateSleepLog(id, patch) {
    const logs = getSleepLogs();
    const registro = logs.find((r) => r.id === id);
    if (!registro) return null;

    Object.assign(registro, patch);
    saveSleepLogs(logs);
    return registro;
}

// --- LA NOCHE EN CURSO (v2) ---
//
// Vive en su propia clave, fuera del historial: ver la explicación larga
// en sleep-session.js. Acá solo se lee y se escribe en localStorage; toda
// la lógica (a qué noche pertenece, cómo se clasifica, cuándo se
// considera olvidada) es pura y está allá.
const OPEN_SLEEP_KEY = 'openSleep';

export function getOpenSleep() {
    const raw = localStorage.getItem(OPEN_SLEEP_KEY);
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        // Una noche abierta corrupta se descarta en vez de arrastrarse:
        // un estado roto acá bloquearía el botón principal de la app.
        return isValidOpenSleep(data) ? data : null;
    } catch {
        return null;
    }
}

export function startOpenSleep(now = new Date()) {
    const abierta = openSleepFrom(now);
    localStorage.setItem(OPEN_SLEEP_KEY, JSON.stringify(abierta));
    return abierta;
}

export function clearOpenSleep() {
    localStorage.removeItem(OPEN_SLEEP_KEY);
}

/**
 * Cierra la noche en curso y la guarda en el historial.
 *
 * @param {Object} [params]
 * @param {string} [params.waketimeActual] - Hora de despertar. Por
 *   defecto, la del reloj: el caso normal es tocar "Ya me levanté" recién
 *   levantado. Se pasa explícita cuando se completa a mano una noche que
 *   quedó olvidada.
 * @returns {{ok: true, record: Object} | {ok: false, error: string}}
 */
export function finishOpenSleep({ waketimeActual, now = new Date() } = {}) {
    const resultado = closeSleepSession({
        open: getOpenSleep(),
        waketimeActual: waketimeActual || formatTime(now),
        cycleMinutes: getCycleLength(),
    });
    if (!resultado.ok) return resultado;

    const registro = saveSleepLog(resultado.record);
    clearOpenSleep();
    return { ok: true, record: registro };
}

export function deleteSleepLog(id) {
    const logs = getSleepLogs().filter((record) => record.id !== id);
    saveSleepLogs(logs);
    renderHistory();
    renderChart();
    renderStatsPanels();
    showToast('Borrado del cuaderno.');
}

export async function limpiarBaseDeDatos() {
    const confirmado = await confirmModal({
        message: '¿Borrar el rastro? Esta acción es irreversible.',
        confirmLabel: 'Borrar',
        cancelLabel: 'Cancelar',
    });
    if (confirmado) {
        localStorage.removeItem(SLEEP_LOG_KEY);
        // Si queda una noche abierta, borrar el historial y dejarla viva
        // sería incoherente: "borrar todo" tiene que borrar todo.
        clearOpenSleep();
        renderHistory();
        renderChart();
        renderStatsPanels();
        showToast('Rastro borrado.');
    }
}

// --- FASE 6: EXPORT/IMPORT (backup manual — no hay backend) ---
//
// Las funciones de acá abajo que no tocan localStorage ni DOM
// (validateImportPayload, normalizeImportedRecords, mergeSleepLogs) están
// separadas a propósito: son las que tienen lógica interesante para
// testear (ver storage.test.js), y probarlas no debería requerir simular
// un navegador entero.

const EXPORT_VERSION = 1;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;

/**
 * Arma el objeto a exportar: todo el historial real + la preferencia de
 * duración de ciclo (para que un restore total no deje al usuario
 * teniendo que reconfigurarla). Deliberadamente NO incluye los datos
 * viejos de sleepLoreDB (ver la nota de la Fase 5 más arriba) — son
 * sugerencias calculadas, no sueño real, y exportarlas mezclaría los dos
 * conceptos en el archivo de backup.
 */
export function exportData() {
    return {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        cycleLength: getCycleLength(),
        latency: getLatency(),
        records: getSleepLogs(),
    };
}

/**
 * Valida la FORMA de un objeto recién parseado de un archivo de
 * importación, sin confiar en que venga de esta misma app — puede ser un
 * backup viejo, un archivo tocado a mano, o cualquier JSON random que
 * alguien subió por error. Se rechaza el archivo COMPLETO si un solo
 * registro no cierra: mejor no importar nada a que se cuele un dato roto
 * que después rompa metrics.js en silencio.
 */
export function validateImportPayload(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.records)) {
        return false;
    }
    return data.records.every(
        (r) =>
            r &&
            typeof r === 'object' &&
            DATE_RE.test(r.date) &&
            TIME_RE.test(r.bedtimeActual) &&
            TIME_RE.test(r.waketimeActual) &&
            typeof r.durationMinutes === 'number' &&
            r.durationMinutes >= 0,
    );
}

// Sanea un registro entrante contra el esquema real: nunca confía en que
// los campos opcionales vengan bien tipados (un archivo editado a mano
// podría traer quality: "4" en vez de 4, por ejemplo), y genera un id si
// falta en vez de rechazar el registro entero por eso.
function normalizeImportedRecord(r, index) {
    return {
        id: typeof r.id === 'string' && r.id ? r.id : `import-${Date.now()}-${index}`,
        date: r.date,
        bedtimeActual: r.bedtimeActual,
        waketimeActual: r.waketimeActual,
        durationMinutes: r.durationMinutes,
        cyclesCompleted: typeof r.cyclesCompleted === 'number' ? r.cyclesCompleted : 0,
        kind: recordKind(r),
        quality: typeof r.quality === 'number' ? r.quality : null,
        notes: typeof r.notes === 'string' ? r.notes : '',
    };
}

export function normalizeImportedRecords(records) {
    return records.map(normalizeImportedRecord);
}

// Huella de un descanso, para reconocer el mismo dos veces. Dos
// dispositivos que anotan la misma noche generan ids distintos, así que
// el id solo no alcanza; pero la fecha sola tampoco, porque desde la v2
// un mismo día puede tener legítimamente una siesta Y una noche. La
// combinación fecha + tipo + hora de acostarse identifica un descanso sin
// confundir dos distintos del mismo día.
function sleepFingerprint(record) {
    return `${record.date}|${recordKind(record)}|${record.bedtimeActual}`;
}

/**
 * Fusiona registros importados con los que ya existen, sin duplicar. Un
 * registro entrante se considera "ya existente" si coincide su id o su
 * huella (ver sleepFingerprint) con alguno actual. "Fusionar" nunca pisa
 * un registro existente — solo agrega lo que genuinamente falta.
 */
export function mergeSleepLogs(current, incomingRaw) {
    const incoming = normalizeImportedRecords(incomingRaw);
    const existingIds = new Set(current.map((r) => r.id));
    const existingFingerprints = new Set(current.map(sleepFingerprint));
    const nuevos = incoming.filter(
        (r) => !existingIds.has(r.id) && !existingFingerprints.has(sleepFingerprint(r)),
    );
    return [...current, ...nuevos];
}

/**
 * mode 'replace': tira todo el historial actual y lo reemplaza por el
 * del archivo (además restaura cycleLength, si vino). mode 'merge': solo
 * agrega lo que falta (ver mergeSleepLogs) y NO toca la preferencia de
 * ciclo actual — fusionar datos no debería cambiar configuración sin que
 * el usuario lo pida explícitamente.
 */
export function importData(data, { mode }) {
    if (!validateImportPayload(data)) {
        return { ok: false, error: 'invalid-shape' };
    }

    if (mode === 'replace') {
        saveSleepLogs(normalizeImportedRecords(data.records));
        if (typeof data.cycleLength === 'number') saveCycleLength(data.cycleLength);
        // Los backups anteriores a la v2 no traen latencia: se ignora el
        // campo ausente en vez de pisar la preferencia actual con un default.
        if (typeof data.latency === 'number') saveLatency(data.latency);
    } else {
        saveSleepLogs(mergeSleepLogs(getSleepLogs(), data.records));
    }

    renderHistory();
    renderChart();
    renderStatsPanels();
    showToast(mode === 'replace' ? 'Datos reemplazados.' : 'Datos fusionados.');
    return { ok: true };
}
