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
}

document.addEventListener('DOMContentLoaded', init);
registerServiceWorker();
