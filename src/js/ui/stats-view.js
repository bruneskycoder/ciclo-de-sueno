// stats-view.js — Recuento: métricas de calidad de sueño real, semana y
// mes (Fase 5), más el gráfico de barras de los últimos 30 días. Las
// cuentas en sí viven en metrics.js (puro, testeado); acá solo se pintan.
import { getSleepLogs, limpiarBaseDeDatos } from '../storage.js';
import { weeklySummary, monthlySummary, recordsInWindow } from '../metrics.js';

export function initStatsView() {
    document.getElementById('btn-clear-data').addEventListener('click', () => {
        limpiarBaseDeDatos();
    });
}

function formatHoras(minutes) {
    if (minutes === null) return '—';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
}

function formatCalidad(avgQuality) {
    return avgQuality === null ? '—' : `${avgQuality.toFixed(1)}/5`;
}

function formatConsistencia(stdDevMinutes) {
    return stdDevMinutes === null ? '—' : `± ${Math.round(stdDevMinutes)} min`;
}

function pintarPanel(prefix, summary) {
    document.getElementById(`${prefix}-avg-duration`).textContent = formatHoras(summary.avgDurationMinutes);
    document.getElementById(`${prefix}-count`).textContent = String(summary.count);
    document.getElementById(`${prefix}-avg-quality`).textContent = formatCalidad(summary.avgQuality);
    document.getElementById(`${prefix}-bedtime-consistency`).textContent = formatConsistencia(summary.bedtimeConsistencyMinutes);
    document.getElementById(`${prefix}-waketime-consistency`).textContent = formatConsistencia(summary.waketimeConsistencyMinutes);
}

export function renderStatsPanels() {
    const logs = getSleepLogs();
    pintarPanel('week', weeklySummary(logs));
    pintarPanel('month', monthlySummary(logs));
}

export function renderChart() {
    const logs = getSleepLogs();
    const container = document.getElementById('chart-container');
    container.innerHTML = '';

    const recientes = recordsInWindow(logs, 30, new Date());
    if (recientes.length === 0) {
        container.innerHTML = '<div class="empty-state">Sin marcas suficientes todavía.</div>';
        return;
    }

    // Si hay más de un registro en la misma fecha (caso raro, ej. corrigió
    // un dato cargando otro sin borrar el anterior), se suman — mismo
    // criterio que el gráfico de la Fase 0-4.
    const porFecha = {};
    recientes.forEach((r) => { porFecha[r.date] = (porFecha[r.date] || 0) + r.durationMinutes; });

    const MAX_MINUTES = 720; // 12 horas máx
    Object.keys(porFecha).sort().forEach((date) => {
        const mins = porFecha[date];
        let heightPercent = (mins / MAX_MINUTES) * 100; if (heightPercent > 100) heightPercent = 100;
        let colorClass = 'bad'; if (mins >= 360 && mins < 450) colorClass = 'ok'; if (mins >= 450) colorClass = 'good';
        const hrs = Math.floor(mins / 60); const rem = mins % 60;
        const dia = new Date(`${date}T00:00:00`);
        const label = dia.toLocaleDateString('es-ES', { weekday: 'short' });
        const full = dia.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

        container.innerHTML += `
            <div class="bar-group" role="img" aria-label="${full}: ${hrs}h ${rem}m dormidas">
                <div class="bar ${colorClass}" style="height: ${heightPercent}%;"></div>
                <div class="bar-label" aria-hidden="true">${label}</div>
            </div>
        `;
    });
    setTimeout(() => { container.scrollLeft = container.scrollWidth; }, 100);
}
