import { getDB } from '../storage.js';

export function renderChart() {
    const db = getDB(); const container = document.getElementById('chart-container'); container.innerHTML = '';
    const hace30Dias = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
    const recientes = db.filter(r => r.timestamp >= hace30Dias);

    if (recientes.length === 0) { container.innerHTML = '<div class="empty-state">Sin marcas suficientes todavía.</div>'; return; }

    const grouped = {};
    recientes.forEach(r => { if (!grouped[r.dateStr]) grouped[r.dateStr] = 0; grouped[r.dateStr] += r.minutes; });

    const MAX_MINUTES = 720; // 12 horas máx
    Object.keys(grouped).forEach(date => {
        const mins = grouped[date]; let heightPercent = (mins / MAX_MINUTES) * 100; if (heightPercent > 100) heightPercent = 100;
        let colorClass = 'bad'; if (mins >= 360 && mins < 450) colorClass = 'ok'; if (mins >= 450) colorClass = 'good';

        container.innerHTML += `
            <div class="bar-group">
                <div class="bar ${colorClass}" style="height: ${heightPercent}%;"></div>
                <div class="bar-label">${date.split(',')[0]}</div>
            </div>
        `;
    });
    setTimeout(() => { container.scrollLeft = container.scrollWidth; }, 100);
}
