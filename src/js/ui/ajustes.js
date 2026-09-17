// ajustes.js — la capa de configuración y de datos.
//
// Todo lo que acá se toca es una preferencia que no cambia de un día para
// el otro: cuánto tardás en dormirte y cuánto dura tu ciclo. En la v1
// estaban como campos del formulario principal, preguntándose en cada
// visita. Peor: la latencia ni siquiera se guardaba, así que quien tarda
// 35 minutos la retipeaba todas las veces.
import {
    clearAllData,
    exportData,
    getCycleLength,
    getLatency,
    getTheme,
    importData,
    saveCycleLength,
    saveLatency,
    saveTheme,
} from '../storage.js';
import { chooseModal, confirmModal } from './modal.js';
import { showToast } from './toast.js';

export function initAjustes() {
    const latencia = document.getElementById('ajuste-latencia');
    latencia.addEventListener('change', () => {
        latencia.value = saveLatency(latencia.value);
        showToast('Guardado.');
    });

    const ciclo = document.getElementById('ajuste-ciclo');
    ciclo.addEventListener('change', () => {
        ciclo.value = saveCycleLength(ciclo.value);
        showToast('Guardado.');
    });

    document.getElementById('ajuste-brasa').addEventListener('change', (evento) => {
        const tema = saveTheme(evento.target.checked ? 'brasa' : 'fogon');
        document.documentElement.dataset.tema = tema;
        const btn = document.getElementById('btn-tema');
        btn.setAttribute('aria-pressed', String(tema === 'brasa'));
    });

    document.getElementById('btn-exportar').addEventListener('click', exportar);

    const archivo = document.getElementById('import-file-input');
    document.getElementById('btn-importar').addEventListener('click', () => archivo.click());
    archivo.addEventListener('change', (evento) => {
        const file = evento.target.files[0];
        // Se limpia para poder elegir dos veces seguidas el mismo archivo.
        evento.target.value = '';
        if (file) importar(file);
    });

    document.getElementById('btn-borrar-todo').addEventListener('click', borrarTodo);
}

export function renderAjustes() {
    document.getElementById('ajuste-latencia').value = getLatency();
    document.getElementById('ajuste-ciclo').value = getCycleLength();
    document.getElementById('ajuste-brasa').checked = getTheme() === 'brasa';
}

function exportar() {
    const datos = exportData();
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const hoy = new Date().toISOString().slice(0, 10);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ciclo-de-sueno-backup-${hoy}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(`Bajaron ${datos.records.length} noches.`);
}

async function importar(file) {
    let contenido;
    try {
        contenido = JSON.parse(await file.text());
    } catch {
        showToast('Ese archivo no es un JSON válido.');
        return;
    }

    const modo = await chooseModal({
        message: '¿Sumar estas noches a las que ya tenés, o reemplazar todo por las del archivo?',
        choices: [
            { value: '', label: 'Cancelar' },
            { value: 'merge', label: 'Sumar', variant: 'primary' },
            { value: 'replace', label: 'Reemplazar todo', variant: 'danger' },
        ],
    });
    if (!modo) return;

    const resultado = importData(contenido, { mode: modo });
    showToast(
        resultado.ok
            ? modo === 'replace'
                ? 'Listo, se reemplazó todo.'
                : 'Listo, se sumaron las que faltaban.'
            : 'Ese archivo no tiene la forma esperada. No se tocó nada.',
    );
}

async function borrarTodo() {
    const confirmado = await confirmModal({
        message: 'Se borran todas las noches anotadas y no hay forma de recuperarlas. ¿Seguro?',
        confirmLabel: 'Borrar todo',
    });
    if (!confirmado) return;

    clearAllData();
    showToast('Listo, no quedó nada.');
}
