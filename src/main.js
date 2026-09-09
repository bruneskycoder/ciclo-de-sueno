// main.js — punto de entrada. Monta la app e importa CSS + módulos.
// Expone en window las funciones que el HTML todavía invoca vía atributos
// onclick="" (marcado sin tocar en esta fase). La Fase 2 elimina esos
// atributos y los reemplaza por addEventListener.
import './css/tokens.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';

import { formatTime, calcularCiclos } from './js/calc.js';
import { setMode } from './js/ui/calculator-view.js';
import { renderHistory } from './js/ui/history-view.js';
import { renderChart } from './js/ui/stats-view.js';
import { saveRecord, deleteRecord, limpiarBaseDeDatos, updateWeeklyStats } from './js/storage.js';

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`).classList.add('active');

    if (viewId === 'history') renderHistory();
    if (viewId === 'stats') { renderChart(); updateWeeklyStats(); }
}

window.switchView = switchView;
window.setMode = setMode;
window.calcularCiclos = calcularCiclos;
window.saveRecord = saveRecord;
window.deleteRecord = deleteRecord;
window.limpiarBaseDeDatos = limpiarBaseDeDatos;

window.onload = () => {
    const now = new Date();
    document.getElementById('time-input').value = formatTime(now);
    updateWeeklyStats();
};
