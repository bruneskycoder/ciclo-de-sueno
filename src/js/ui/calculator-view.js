// calculator-view.js — wiring de la vista "Fogón": formulario, tabs y
// tabla de resultados. La lógica de cálculo vive aparte, en calc.js (pura,
// sin DOM) — acá solo se lee el formulario, se le pasan los datos, y se
// pinta lo que devuelve.
import { calcularCiclos } from '../calc.js';
import { getCycleLength, saveCycleLength } from '../storage.js';
import { showToast } from './toast.js';
// Hasta la Fase 4 acá había un botón "Marcar" por fila que guardaba el
// cálculo sugerido como si fuera una noche dormida. La Fase 5 separa eso
// del logueo real (ver Cuaderno de Ruta / history-view.js): esta vista
// vuelve a ser lo que su nombre dice, una calculadora, sin guardar nada.

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

    // Duración de ciclo (Fase 3): se precarga con lo que el usuario haya
    // configurado antes (o 90 por defecto) y se re-guarda cada vez que la
    // cambia, para no tener que reconfigurarla en cada visita.
    const cycleLengthInput = document.getElementById('cycle-length-input');
    cycleLengthInput.value = getCycleLength();
    cycleLengthInput.addEventListener('change', () => {
        cycleLengthInput.value = saveCycleLength(cycleLengthInput.value);
    });

    document.getElementById('calc-form').addEventListener('submit', (event) => {
        event.preventDefault();
        runCalculation();
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
    const cycleMinutes = document.getElementById('cycle-length-input').value;

    const result = calcularCiclos({ mode: currentMode, timeStr, latencyMinutes, cycleMinutes });
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
        `;
        tbody.appendChild(row);
    });
}
