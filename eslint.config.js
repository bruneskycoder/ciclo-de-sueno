import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-unused-vars': 'warn',
        },
    },
    {
        // Corre en su propio scope global (ServiceWorkerGlobalScope), no
        // en el de una página normal — self/caches/clients no existen en
        // globals.browser.
        files: ['public/service-worker.js'],
        languageOptions: {
            globals: {
                ...globals.serviceworker,
            },
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
];
