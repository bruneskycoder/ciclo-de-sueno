// backup-view.js — exportar/importar el historial real como backup manual
// (Fase 6). No hay backend: este archivo JSON es la única forma de mover
// datos entre dispositivos, o de no perder todo si se borra el
// localStorage por accidente (o se cambia de navegador/celular).
import { exportData, importData } from '../storage.js';
import { chooseModal } from './modal.js';
import { showToast } from './toast.js';

export function initBackupView() {
    document.getElementById('btn-export-data').addEventListener('click', runExport);

    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-data').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        event.target.value = ''; // permite volver a elegir el mismo archivo dos veces seguidas
        if (file) runImport(file);
    });
}

function runExport() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const hoy = new Date().toISOString().slice(0, 10);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ciclo-de-sueno-backup-${hoy}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(`Exportadas ${data.records.length} noches.`);
}

async function runImport(file) {
    let parsed;
    try {
        parsed = JSON.parse(await file.text());
    } catch {
        showToast('Ese archivo no es un JSON válido.');
        return;
    }

    const mode = await chooseModal({
        message: '¿Fusionar con lo que ya tenés cargado, o reemplazar todo el historial por el del archivo?',
        choices: [
            { value: '', label: 'Cancelar' },
            { value: 'merge', label: 'Fusionar', variant: 'primary' },
            { value: 'replace', label: 'Reemplazar todo', variant: 'danger' },
        ],
    });
    if (!mode) return;

    const result = importData(parsed, { mode });
    if (!result.ok) {
        showToast('Ese archivo no tiene la forma esperada — no se importó nada.');
    }
}
