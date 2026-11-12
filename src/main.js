// main.js — punto de entrada. Monta la pantalla, registra las tres capas
// y deja todo suscrito a los cambios de datos.
//
// storage.js ya no llama a ninguna vista: solo avisa que algo cambió.
// Quién se entera y qué repinta se decide acá, de una sola vez.
import './css/tokens.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';

import { onChange } from './js/storage.js';
import { initHome, renderHome } from './js/ui/home.js';
import { initCuaderno, renderCuaderno } from './js/ui/cuaderno.js';
import { initAjustes, renderAjustes } from './js/ui/ajustes.js';
import { openSheet, registerSheet } from './js/ui/sheets.js';
import { renderEscena } from './js/ui/escena.js';
import { registerServiceWorker } from './sw-register.js';

function init() {
    initHome();
    initCuaderno();
    initAjustes();

    // Cada capa se repinta al abrirse, no en cada cambio: si está cerrada,
    // repintarla es trabajo que nadie ve.
    registerSheet('hoja-cuaderno', renderCuaderno);
    registerSheet('hoja-ajustes', renderAjustes);
    registerSheet('hoja-info');
    registerSheet('hoja-alarma');

    document
        .getElementById('abrir-cuaderno')
        .addEventListener('click', () => openSheet('hoja-cuaderno'));
    document.getElementById('abrir-info').addEventListener('click', () => openSheet('hoja-info'));
    document
        .getElementById('btn-ajustes')
        .addEventListener('click', () => openSheet('hoja-ajustes'));

    onChange(() => {
        renderHome();
        if (document.getElementById('hoja-cuaderno').open) renderCuaderno();
    });

    renderHome();
    renderEscena();
    performance.mark('lista-dibujada');
    cargarEscenaPintada();
}

// La pintura de fondo llega después de que la lista ya se dibujó y el
// navegador tiene un respiro. Mientras tanto, y si no llega, está a la
// vista la escena 2D.
//
// La clase con-pintura se pone ya, antes de que llegue la imagen: arma la
// pantalla con el hueco donde va a estar el fuego, y así la lista no salta
// cuando la pintura aparece. Si no llega, se saca y la pantalla vuelve a
// la de siempre, con la escena 2D arriba.
function cargarEscenaPintada() {
    const raiz = document.documentElement;
    // Con el ahorro de datos prendido no se baja una imagen de decoración.
    if (navigator.connection?.saveData) return;
    raiz.classList.add('con-pintura');
    const arrancar = () =>
        import('./js/ui/escena-pintada.js')
            .then((m) => m.montarEscenaPintada())
            .catch(() => false)
            .then((ok) => {
                if (!ok) raiz.classList.remove('con-pintura');
            });
    if ('requestIdleCallback' in window) requestIdleCallback(arrancar, { timeout: 2000 });
    else setTimeout(arrancar, 300);
}

document.addEventListener('DOMContentLoaded', init);
registerServiceWorker();
