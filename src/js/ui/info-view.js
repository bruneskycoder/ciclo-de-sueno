// info-view.js — wiring de "Por Qué Dormimos en Tranco" (Fase 8): la
// página informativa sobre la base científica de los ciclos de sueño.
// No tiene lógica propia (no hay cálculo ni estado que testear acá, es
// contenido estático) — solo cablea la entrada (#info-link, dentro del
// markup de view-calc) y la salida (#info-back, dentro de view-info) con
// switchView(), igual que backup-view.js cablea botones que viven
// físicamente en el markup de view-stats.
import { switchView } from './nav.js';

export function initInfoView() {
    document.getElementById('info-link').addEventListener('click', () => switchView('info'));
    document.getElementById('info-back').addEventListener('click', () => switchView('calc'));
}
