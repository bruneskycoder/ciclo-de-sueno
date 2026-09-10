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
import { clampCycleLength } from './calc.js';

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
export function saveSleepLog({ date, bedtimeActual, waketimeActual, durationMinutes, cyclesCompleted, quality, notes }) {
    const logs = getSleepLogs();
    logs.push({
        id: Date.now().toString(),
        date, bedtimeActual, waketimeActual, durationMinutes, cyclesCompleted,
        quality: quality ?? null,
        notes: notes || '',
    });
    saveSleepLogs(logs);
    showToast('¡Quedó marcado en el cuaderno!');
}

export function deleteSleepLog(id) {
    const logs = getSleepLogs().filter((record) => record.id !== id);
    saveSleepLogs(logs); renderHistory(); renderChart(); renderStatsPanels();
    showToast('Borrado del cuaderno.');
}

export async function limpiarBaseDeDatos() {
    const confirmado = await confirmModal({
        message: '¿Borrar el rastro? Esta acción es irreversible.',
        confirmLabel: 'Borrar',
        cancelLabel: 'Cancelar',
    });
    if (confirmado) {
        localStorage.removeItem(SLEEP_LOG_KEY); renderHistory(); renderChart(); renderStatsPanels();
        showToast("Rastro borrado.");
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
            r && typeof r === 'object' &&
            DATE_RE.test(r.date) &&
            TIME_RE.test(r.bedtimeActual) &&
            TIME_RE.test(r.waketimeActual) &&
            typeof r.durationMinutes === 'number' && r.durationMinutes >= 0
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
        quality: typeof r.quality === 'number' ? r.quality : null,
        notes: typeof r.notes === 'string' ? r.notes : '',
    };
}

export function normalizeImportedRecords(records) {
    return records.map(normalizeImportedRecord);
}

/**
 * Fusiona registros importados con los que ya existen, sin duplicar. Un
 * registro entrante se considera "ya existente" si coincide su id O su
 * fecha con alguno actual: dos dispositivos logueando la misma noche van
 * a generar ids distintos, pero siguen siendo la misma noche, y una
 * fecha no se duerme dos veces. "Fusionar" nunca pisa un registro
 * existente — solo agrega lo que genuinamente falta.
 */
export function mergeSleepLogs(current, incomingRaw) {
    const incoming = normalizeImportedRecords(incomingRaw);
    const existingIds = new Set(current.map((r) => r.id));
    const existingDates = new Set(current.map((r) => r.date));
    const nuevos = incoming.filter((r) => !existingIds.has(r.id) && !existingDates.has(r.date));
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
    } else {
        saveSleepLogs(mergeSleepLogs(getSleepLogs(), data.records));
    }

    renderHistory(); renderChart(); renderStatsPanels();
    showToast(mode === 'replace' ? 'Datos reemplazados.' : 'Datos fusionados.');
    return { ok: true };
}
