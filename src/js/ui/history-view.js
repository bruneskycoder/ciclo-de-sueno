import { getDB } from '../storage.js';

export function renderHistory() {
    const db = getDB(); const container = document.getElementById('history-container'); container.innerHTML = '';
    const hace7Dias = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const recientes = db.filter(r => r.timestamp >= hace7Dias).sort((a, b) => b.timestamp - a.timestamp);

    if (recientes.length === 0) {
        container.innerHTML = '<div class="empty-state">Todavía no marcaste nada esta semana. ¡Arrimate al fogón!</div>';
        return;
    }

    recientes.forEach(record => {
        container.innerHTML += `
            <div class="history-card">
                <div>
                    <div style="font-size:22px; font-weight:bold;">${record.dateStr}</div>
                    <div style="font-size:16px;">Apagaste llama: ${record.bedtime}</div>
                </div>
                <div style="display:flex; align-items:center;">
                    <div style="font-size:26px; font-weight:bold; color:var(--success); margin-right:10px;">
                        ${Math.floor(record.minutes / 60)}h ${record.minutes % 60}m
                    </div>
                    <button class="delete-btn" onclick="deleteRecord('${record.id}')">X</button>
                </div>
            </div>
        `;
    });
}
