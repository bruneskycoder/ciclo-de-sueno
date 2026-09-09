// main.js — punto de entrada. Monta la app: importa CSS y arranca cada
// módulo de UI. Ya no expone nada en window ni depende de onclick="" en el
// HTML — toda la interacción se cablea acá con addEventListener (Fase 2).
import './css/tokens.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';

import { formatTime } from './js/calc.js';
import { initNav } from './js/ui/nav.js';
import { initCalculatorView } from './js/ui/calculator-view.js';
import { initHistoryView } from './js/ui/history-view.js';
import { initStatsView } from './js/ui/stats-view.js';
import { updateWeeklyStats } from './js/storage.js';

function init() {
    initNav();
    initCalculatorView();
    initHistoryView();
    initStatsView();

    document.getElementById('time-input').value = formatTime(new Date());
    updateWeeklyStats();
}

document.addEventListener('DOMContentLoaded', init);
