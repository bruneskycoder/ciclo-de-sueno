// siesta-view.js — wiring de la vista "A la Sombra del Ombú" (Fase 4).
// Igual que calculator-view.js: acá solo se lee el formulario y se pinta
// lo que devuelve calcularSiesta() (calc.js, pura, sin DOM).
import { calcularSiesta, SIESTA_CORTA_MINUTOS, formatTime } from '../calc.js';
import { getCycleLength } from '../storage.js';
import { showToast } from './toast.js';

export function initSiestaView() {
    const timeInput = document.getElementById('siesta-time-input');
    if (!timeInput.value) timeInput.value = formatTime(new Date());

    document.getElementById('siesta-form').addEventListener('submit', (event) => {
        event.preventDefault();
        runSiestaCalculation();
    });
}

function dayNote(dayOffset) {
    return dayOffset === 1 ? ' (mañana)' : dayOffset === -1 ? ' (ayer)' : '';
}

function runSiestaCalculation() {
    const timeStr = document.getElementById('siesta-time-input').value;
    const latencyMinutes = document.getElementById('siesta-latency-input').value;
    // La siesta completa usa el mismo tranco de sueño configurado en la
    // calculadora nocturna (Fase 3) — es la misma persona, el mismo ciclo.
    const cycleMinutes = getCycleLength();

    const result = calcularSiesta({ timeStr, latencyMinutes, cycleMinutes });
    if (!result.ok) {
        showToast('¡Decime a qué hora, que si no ando a ciegas!');
        return;
    }

    renderSiestaResults(result);
}

function renderSiestaResults({ corta, completa, cycleLength }) {
    document.getElementById('siesta-corta-time').textContent = corta.resultTimeStr + dayNote(corta.dayOffset);
    document.getElementById('siesta-corta-detail').textContent =
        `${SIESTA_CORTA_MINUTOS} min: salís liviano, antes de hundirte en sueño profundo.`;

    document.getElementById('siesta-completa-time').textContent = completa.resultTimeStr + dayNote(completa.dayOffset);
    document.getElementById('siesta-completa-detail').textContent =
        `${cycleLength} min (tu tranco): un ciclo entero, más descanso pero lleva más tiempo.`;

    document.getElementById('siesta-results').style.display = 'block';
}
