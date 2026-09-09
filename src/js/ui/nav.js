// nav.js — navegación entre las 3 vistas. Los ítems son <button> reales
// (antes eran <div onclick>, inalcanzables con teclado y mudos para
// lectores de pantalla). Al cambiar de vista, además, se mueve el foco al
// título de la vista nueva — sin esto, un lector de pantalla no se entera
// de que "la página" cambió, porque técnicamente nunca navegamos a ningún
// lado.
import { renderHistory } from './history-view.js';
import { renderChart } from './stats-view.js';
import { updateWeeklyStats } from '../storage.js';

const VIEW_IDS = ['calc', 'history', 'stats'];

export function initNav() {
    VIEW_IDS.forEach((id) => {
        document.getElementById(`nav-${id}`).addEventListener('click', () => switchView(id));
    });
}

export function switchView(viewId) {
    VIEW_IDS.forEach((id) => {
        const isActive = id === viewId;
        document.getElementById(`view-${id}`).classList.toggle('active', isActive);
        const navBtn = document.getElementById(`nav-${id}`);
        navBtn.classList.toggle('active', isActive);
        if (isActive) {
            navBtn.setAttribute('aria-current', 'page');
        } else {
            navBtn.removeAttribute('aria-current');
        }
    });

    if (viewId === 'history') renderHistory();
    if (viewId === 'stats') { renderChart(); updateWeeklyStats(); }

    const heading = document.querySelector(`#view-${viewId} h1`);
    if (heading) heading.focus();
}
