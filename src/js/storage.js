// storage.js — sistema de almacenamiento (localStorage) + estadística semanal.
// Agrupamiento idéntico al bloque "SISTEMA DE ALMACENAMIENTO" del index.html
// original. La Fase 5 introduce un esquema de datos nuevo con migración;
// no lo adelantes acá.
import { showToast } from './ui/toast.js';
import { renderHistory } from './ui/history-view.js';
import { renderChart } from './ui/stats-view.js';
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

export function getDB() {
    const data = localStorage.getItem('sleepLoreDB');
    return data ? JSON.parse(data) : [];
}

export function saveDB(data) {
    localStorage.setItem('sleepLoreDB', JSON.stringify(data));
}

export function saveRecord(minutes, bedtime) {
    const db = getDB(); const now = new Date();
    db.push({
        id: Date.now().toString(), timestamp: now.getTime(),
        dateStr: now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
        bedtime: bedtime, minutes: minutes
    });
    saveDB(db); showToast("¡Quedó marcado en el cuaderno!");
}

export function deleteRecord(id) {
    let db = getDB(); db = db.filter(record => record.id !== id);
    saveDB(db); renderHistory(); renderChart(); updateWeeklyStats();
    showToast("Borrado del cuaderno.");
}

export async function limpiarBaseDeDatos() {
    const confirmado = await confirmModal({
        message: '¿Borrar el rastro? Esta acción es irreversible.',
        confirmLabel: 'Borrar',
        cancelLabel: 'Cancelar',
    });
    if (confirmado) {
        localStorage.removeItem('sleepLoreDB'); renderHistory(); renderChart(); updateWeeklyStats();
        showToast("Rastro borrado.");
    }
}

export function updateWeeklyStats() {
    const db = getDB(); const hace7Dias = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const recientes = db.filter(r => r.timestamp >= hace7Dias);
    let totalMins = 0; recientes.forEach(r => totalMins += r.minutes);
    document.getElementById('weekly-hours').innerText = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
}
