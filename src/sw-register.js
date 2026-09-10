// sw-register.js — registra el service worker (Fase 7). Se dispara en
// 'load' para no competir con la carga inicial de la página, y no rompe
// nada si el navegador no soporta service workers (por ejemplo, algunas
// versiones viejas de navegadores de escritorio).
export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(`${import.meta.env.BASE_URL}service-worker.js`)
            .catch((err) => console.error('No se pudo registrar el service worker:', err));
    });
}
