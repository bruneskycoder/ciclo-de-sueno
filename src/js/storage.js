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
