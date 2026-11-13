// ajustes.js — la capa de configuración y de datos.
//
// Todo lo que acá se toca es una preferencia que no cambia de un día para
// el otro: cuánto tardás en dormirte y cuánto dura tu ciclo. En la v1
// estaban como campos del formulario principal, preguntándose en cada
// visita. Peor: la latencia ni siquiera se guardaba, así que quien tarda
// 35 minutos la retipeaba todas las veces.
import {
    borrarDatosV1,
    clearAllData,
    clearUbicacion,
    contarRegistrosV1,
    exportData,
    getCycleLength,
    getLastExportAt,
    getLatency,
    getSleepLogs,
    getTheme,
    getUbicacion,
    importData,
    markExported,
    saveCycleLength,
    saveLatency,
    saveTheme,
    saveUbicacion,
    currentTimeZone,
} from '../storage.js';
import { ubicacionVigente } from '../ubicacion.js';
import { chooseModal, confirmModal } from './modal.js';
import { showToast } from './toast.js';
import { renderEscena } from './escena.js';
import { backupReminder } from '../respaldo.js';

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
        renderEscena();
    });

    document.getElementById('btn-ubicacion').addEventListener('click', usarMiUbicacion);
    document.getElementById('btn-ubicacion-zona').addEventListener('click', () => {
        clearUbicacion();
        renderCielo();
        showToast('Guardado.');
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
    document.getElementById('btn-borrar-viejos').addEventListener('click', borrarViejos);
}

// Qué cielo se está usando: lo dice en una línea y muestra el botón que
// corresponde (pedir la ubicación, o volver a la ciudad de la zona).
function renderCielo() {
    const u = ubicacionVigente(getUbicacion(), currentTimeZone());
    const estado = document.getElementById('cielo-estado');
    if (u.origen === 'gps') estado.textContent = 'Ahora se usa tu ubicación, redondeada a unos 10 km.';
    else if (u.origen === 'zona') estado.textContent = `Ahora se usa ${u.nombre}, la ciudad de tu zona horaria.`;
    else estado.textContent = `No reconozco tu zona horaria: se usa ${u.nombre}.`;
    document.getElementById('btn-ubicacion-zona').hidden = u.origen !== 'gps';
}

function usarMiUbicacion() {
    if (!('geolocation' in navigator)) {
        showToast('Este navegador no da la ubicación.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            saveUbicacion(pos.coords.latitude, pos.coords.longitude);
            renderCielo();
            showToast('Guardado.');
        },
        (err) =>
            showToast(
                err.code === err.PERMISSION_DENIED
                    ? 'No diste permiso para la ubicación.'
                    : 'No pude obtener la ubicación.',
            ),
        { timeout: 10000, maximumAge: 3600000 },
    );
}

export function renderAjustes() {
    renderCielo();
    document.getElementById('ajuste-latencia').value = getLatency();
    document.getElementById('ajuste-ciclo').value = getCycleLength();
    document.getElementById('ajuste-brasa').checked = getTheme() === 'brasa';

    // Una línea, sin insistir: solo en Ajustes y solo si hace falta.
    const aviso = backupReminder({
        lastExportAt: getLastExportAt(),
        recordCount: getSleepLogs().length,
    });
    const lineaAviso = document.getElementById('aviso-respaldo');
    lineaAviso.hidden = !aviso;
    lineaAviso.textContent = aviso || '';

    // La opción de borrar los datos viejos solo se muestra si hay algo
    // que borrar. Ofrecerla siempre sería contarle a todo el mundo un
    // problema que la mayoría no tiene.
    const viejos = contarRegistrosV1();
    document.getElementById('datos-viejos').hidden = viejos === 0;
    if (viejos > 0) {
        document.getElementById('datos-viejos-texto').textContent =
            `Quedaron ${viejos} ${viejos === 1 ? 'registro' : 'registros'} de una versión anterior de la app, que guardaba la hora calculada y no la que dormiste. No se usan para nada y ocupan lugar en este navegador.`;
    }
}

async function borrarViejos() {
    const confirmado = await confirmModal({
        message: 'Se borran los registros de la versión anterior. Los de ahora no se tocan.',
        confirmLabel: 'Borrar',
    });
    if (!confirmado) return;

    borrarDatosV1();
    renderAjustes();
    showToast('Listo, se liberó ese espacio.');
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
    markExported();
    renderAjustes();

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
            : resultado.error === 'too-long'
              ? 'Hay una noche de más de 16 horas en ese archivo. No se tocó nada.'
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
