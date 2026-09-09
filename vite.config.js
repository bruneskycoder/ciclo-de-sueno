import { defineConfig } from 'vite';

// Sitio de proyecto en GitHub Pages (https://bruneskycoder.github.io/ciclo-de-sueno/),
// no un sitio de usuario (bruneskycoder.github.io) — por eso el base path.
// Si en algún momento se sirve desde un dominio propio, cambiar a '/'.
export default defineConfig({
    base: '/ciclo-de-sueno/',
    test: {
        passWithNoTests: true,
    },
});
