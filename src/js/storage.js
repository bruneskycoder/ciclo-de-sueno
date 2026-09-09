// storage.js — sistema de almacenamiento (localStorage) + estadística semanal.
// Agrupamiento idéntico al bloque "SISTEMA DE ALMACENAMIENTO" del index.html
// original. La Fase 5 introduce un esquema de datos nuevo con migración;
// no lo adelantes acá.
import { showToast } from './ui/toast.js';
import { renderHistory } from './ui/history-view.js';
import { renderChart } from './ui/stats-view.js';

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

export function limpiarBaseDeDatos() {
    if (confirm("¿Borrar el rastro? Esta acción es irreversible.")) {
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
