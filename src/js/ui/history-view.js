// history-view.js — Cuaderno de Ruta: logueo real de sueño (Fase 5) +
// lista de los últimos 7 días. Ya no muestra sugerencias calculadas (ver
// storage.js para la explicación del cambio de esquema).
import { calcularDuracionReal } from '../calc.js';
import { getSleepLogs, saveSleepLog, deleteSleepLog, getCycleLength } from '../storage.js';
import { showToast } from './toast.js';

function todayStr(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function initHistoryView() {
    const dateInput = document.getElementById('log-date-input');
    dateInput.max = todayStr();
    dateInput.value = todayStr();

    document.getElementById('sleep-log-form').addEventListener('submit', (event) => {
        event.preventDefault();
        submitSleepLog();
    });

    // Delegación: un solo listener para todos los botones "X" de borrar,
    // en vez de un onclick="" inline por tarjeta generada.
    document.getElementById('history-container').addEventListener('click', (event) => {
        const btn = event.target.closest('.delete-btn');
        if (!btn) return;
        deleteSleepLog(btn.dataset.id);
    });
}

function submitSleepLog() {
    const date = document.getElementById('log-date-input').value;
    const bedtimeActual = document.getElementById('log-bedtime-input').value;
    const waketimeActual = document.getElementById('log-waketime-input').value;
    const qualityRaw = document.getElementById('log-quality-input').value;
    const notes = document.getElementById('log-notes-input').value.trim();

    if (!date) {
        showToast('¡Decime qué noche marcás, que si no ando a ciegas!');
        return;
    }

    const result = calcularDuracionReal({ bedtimeActual, waketimeActual, cycleMinutes: getCycleLength() });
    if (!result.ok) {
        showToast('¡Faltan las horas de acostarse y despertar!');
        return;
    }

    saveSleepLog({
        date,
        bedtimeActual,
        waketimeActual,
        durationMinutes: result.durationMinutes,
        cyclesCompleted: result.cyclesCompleted,
        quality: qualityRaw === '' ? null : Number(qualityRaw),
        notes,
    });

    document.getElementById('sleep-log-form').reset();
    document.getElementById('log-date-input').value = todayStr();
    document.getElementById('log-bedtime-input').value = '';
    document.getElementById('log-waketime-input').value = '';

    renderHistory();
}

export function renderHistory() {
    const logs = getSleepLogs();
    const container = document.getElementById('history-container');
    container.innerHTML = '';

    const hace7Dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recientes = logs
        .filter((r) => new Date(`${r.date}T00:00:00`).getTime() >= hace7Dias)
        .sort((a, b) => (a.date < b.date ? 1 : -1));

    if (recientes.length === 0) {
        container.innerHTML = '<div class="empty-state">Todavía no marcaste nada esta semana. ¡Arrimate al fogón!</div>';
        return;
    }

    recientes.forEach((record) => {
        const fecha = new Date(`${record.date}T00:00:00`).toLocaleDateString('es-ES', {
            weekday: 'short', day: 'numeric', month: 'short',
        });
        const h = Math.floor(record.durationMinutes / 60);
        const m = record.durationMinutes % 60;
        const quality = record.quality
            ? `<div class="history-quality" aria-label="Calidad ${record.quality} de 5">${'★'.repeat(record.quality)}${'☆'.repeat(5 - record.quality)}</div>`
            : '';
        const notes = record.notes ? `<div class="history-notes">"${escapeHtml(record.notes)}"</div>` : '';

        container.innerHTML += `
            <div class="history-card">
                <div>
                    <div class="history-date">${fecha}</div>
                    <div class="history-detail">Se acostó ${record.bedtimeActual} · Se levantó ${record.waketimeActual}</div>
                    ${notes}
                </div>
                <div class="history-side">
                    <div class="history-duration">${h}h ${m}m</div>
                    ${quality}
                    <button type="button" class="delete-btn" data-id="${record.id}" aria-label="Borrar registro del ${fecha}">X</button>
                </div>
            </div>
        `;
    });
}
