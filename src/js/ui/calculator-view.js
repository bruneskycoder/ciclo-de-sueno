// calculator-view.js — wiring de la vista "Fogón": formulario, tabs y
// tabla de resultados. La lógica de cálculo vive aparte, en calc.js (pura,
// sin DOM) — acá solo se lee el formulario, se le pasan los datos, y se
// pinta lo que devuelve.
import { calcularCiclos } from '../calc.js';
import { saveRecord } from '../storage.js';
import { showToast } from './toast.js';
// saveRecord ya dispara su propio toast de confirmación (ver storage.js) —
// esta vista no necesita mostrar el suyo.

let currentMode = 'wake';

const LABELS = {
    wake: 'Quiero levantarme con el sol a las:',
    sleep: 'Me voy a las pilchas a las:',
};

export function initCalculatorView() {
    const wakeTab = document.getElementById('wake-tab');
    const sleepTab = document.getElementById('sleep-tab');
    wakeTab.addEventListener('click', () => setMode('wake'));
    sleepTab.addEventListener('click', () => setMode('sleep'));

    document.getElementById('calc-form').addEventListener('submit', (event) => {
        event.preventDefault();
        runCalculation();
    });

    // Delegación: un solo listener para todos los botones "Marcar" de la
    // tabla, en vez de uno por fila (y sin onclick="" inline en el HTML
    // generado).
    document.getElementById('results-body').addEventListener('click', (event) => {
        const btn = event.target.closest('.save-btn');
        if (!btn) return;
        const minutes = Number(btn.dataset.minutes);
        const bedtime = btn.dataset.bedtime;
        saveRecord(minutes, bedtime);
    });
}

export function setMode(mode) {
    currentMode = mode;
    const wakeTab = document.getElementById('wake-tab');
    const sleepTab = document.getElementById('sleep-tab');
    const timeLabel = document.getElementById('time-label');

    const isWake = mode === 'wake';
    wakeTab.classList.toggle('active', isWake);
    wakeTab.setAttribute('aria-pressed', String(isWake));
    sleepTab.classList.toggle('active', !isWake);
    sleepTab.setAttribute('aria-pressed', String(!isWake));
    timeLabel.textContent = LABELS[mode];

    document.getElementById('results-table').style.display = 'none';
}

function runCalculation() {
    const timeStr = document.getElementById('time-input').value;
    const latencyMinutes = document.getElementById('latency-input').value;

    const result = calcularCiclos({ mode: currentMode, timeStr, latencyMinutes });
    if (!result.ok) {
        showToast('¡Decime a qué hora, que si no ando a ciegas!');
        return;
    }

    renderResults(result.results);
}

function renderResults(results) {
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = '';
    document.getElementById('results-table').style.display = 'block';

    results.forEach((r) => {
        const row = document.createElement('tr');
        if (r.isOptimal) row.classList.add('optimal');

        const dayNote = r.dayOffset === 1 ? ' (mañana)' : r.dayOffset === -1 ? ' (ayer)' : '';

        row.innerHTML = `
            <td>${r.cycles}</td>
            <td>${r.hours}h ${r.minutes}m</td>
            <td style="font-weight:700; color:var(--hide);">${r.resultTimeStr}${dayNote}</td>
            <td><button type="button" class="save-btn" data-minutes="${r.totalMinutes}" data-bedtime="${r.bedtimeTimeStr}">Marcar</button></td>
        `;
        tbody.appendChild(row);
    });
}
