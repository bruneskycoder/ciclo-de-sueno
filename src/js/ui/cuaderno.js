// cuaderno.js — la capa que muestra las noches anotadas.
//
// No es una planilla. De todo lo que la v1 pedía por formulario, lo único
// que una persona escribía a mano era una frase sobre la noche ("dormí
// tarde y encima tomé vino"); las horas las calcula la app sola. Así que
// acá la frase se lee como una cita y los números quedan de apoyo.
//
// Arregla además un defecto de la v1: la lista mostraba solo los últimos
// 7 días, así que una noche de hace diez días contaba en los promedios
// pero no se podía ver ni borrar desde ninguna parte.
import { deleteSleepLog, getOpenSleep, getSleepLogs, clearOpenSleep } from '../storage.js';
import { onlyNights, recordKind, hasClockTimes } from '../sleep-session.js';
import { recordsInWindow, weeklySummary } from '../metrics.js';
import { formatDuration } from '../calc.js';
import { confirmModal } from './modal.js';
import { showToast } from './toast.js';

const MAX_MINUTOS_GRAFICO = 720; // 12 horas: el techo de la barra más alta
const NOCHE_CORTA = 360; // menos de 6 horas se pinta apagada

export function initCuaderno() {
    document.getElementById('cuaderno-noches').addEventListener('click', async (evento) => {
        const borrar = evento.target.closest('[data-borrar]');
        if (borrar) {
            const confirmado = await confirmModal({
                message: '¿Borrar esta noche del cuaderno?',
                confirmLabel: 'Borrar',
            });
            if (confirmado) {
                deleteSleepLog(borrar.dataset.borrar);
                showToast('Borrada.');
            }
            return;
        }

        if (evento.target.closest('[data-cancelar-abierta]')) {
            clearOpenSleep();
            showToast('Cancelada.');
        }
    });
}

export function renderCuaderno() {
    renderResumen();
    renderNoches();
    renderGrafico();
}

function renderResumen() {
    const noches = onlyNights(getSleepLogs());
    const semana = weeklySummary(noches);
    const contenedor = document.getElementById('cuaderno-resumen');

    // Etiquetas cortas a propósito: con tres columnas en una pantalla
    // de 390px, "por noche, últimos 7 días" se parte en tres renglones y
    // el resumen deja de leerse de un vistazo.
    const datos = [
        [
            semana.avgDurationMinutes === null
                ? '—'
                : formatDuration(Math.round(semana.avgDurationMinutes)),
            'promedio, 7 días',
        ],
        [String(noches.length), noches.length === 1 ? 'noche' : 'noches'],
    ];

    // La calificación de 1 a 5 ya no se pide: la reemplazó la frase. Pero
    // si quedaron registros viejos que la tienen, el promedio se sigue
    // mostrando en vez de tirar un dato que el usuario cargó.
    if (semana.avgQuality !== null) {
        datos.push([`${semana.avgQuality.toFixed(1)}/5`, 'según vos']);
    }

    contenedor.innerHTML = '';
    datos.forEach(([valor, etiqueta]) => {
        const dato = document.createElement('div');
        dato.className = 'resumen-dato';
        const v = document.createElement('span');
        v.className = 'valor';
        v.textContent = valor;
        const e = document.createElement('span');
        e.className = 'etiqueta';
        e.textContent = etiqueta;
        dato.append(v, e);
        contenedor.appendChild(dato);
    });
}

function renderNoches() {
    const lista = document.getElementById('cuaderno-noches');
    lista.innerHTML = '';

    const abierta = getOpenSleep();
    if (abierta) lista.appendChild(tarjetaAbierta(abierta));

    const registros = [...getSleepLogs()].sort((a, b) => (a.date < b.date ? 1 : -1));

    if (registros.length === 0) {
        if (!abierta) {
            const vacio = document.createElement('li');
            vacio.className = 'vacio';
            vacio.textContent =
                'Acá se van a ir juntando las noches. Todavía no hay ninguna: la próxima vez que abras la app, te va a preguntar por la anterior.';
            lista.appendChild(vacio);
        }
        return;
    }

    registros.forEach((registro) => lista.appendChild(tarjetaNoche(registro)));
}

function tarjetaAbierta(abierta) {
    const li = document.createElement('li');
    li.className = 'noche';

    const izquierda = document.createElement('div');
    const fecha = document.createElement('div');
    fecha.className = 'fecha';
    fecha.textContent = 'en curso';
    const horario = document.createElement('div');
    horario.className = 'horario';
    horario.textContent = `Te acostaste a las ${abierta.bedtimeActual}`;
    izquierda.append(fecha, horario);

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'btn-saltear';
    cancelar.dataset.cancelarAbierta = 'si';
    cancelar.textContent = 'Cancelar esta noche';
    acciones.appendChild(cancelar);

    li.append(izquierda, document.createElement('div'), acciones);
    return li;
}

function tarjetaNoche(registro) {
    const li = document.createElement('li');
    li.className = 'noche';

    const izquierda = document.createElement('div');
    const fecha = document.createElement('div');
    fecha.className = 'fecha';
    fecha.textContent =
        formatearFecha(registro.date) + (recordKind(registro) === 'siesta' ? ' · siesta' : '');

    const horario = document.createElement('div');
    horario.className = hasClockTimes(registro) ? 'horario' : 'sin-horario';
    horario.textContent = hasClockTimes(registro)
        ? `${registro.bedtimeActual} a ${registro.waketimeActual}`
        : 'Anotada de memoria, sin horario';
    izquierda.append(fecha, horario);

    const duracion = document.createElement('div');
    duracion.className = 'duracion';
    duracion.textContent = formatDuration(registro.durationMinutes);

    li.append(izquierda, duracion);

    // textContent y no innerHTML: es texto escrito por una persona y
    // nunca se interpreta como HTML.
    if (registro.notes) {
        const frase = document.createElement('div');
        frase.className = 'frase';
        frase.textContent = registro.notes;
        li.appendChild(frase);
    }

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'btn-saltear';
    borrar.dataset.borrar = registro.id;
    borrar.textContent = 'Borrar';
    borrar.setAttribute('aria-label', `Borrar la noche del ${formatearFecha(registro.date)}`);
    acciones.appendChild(borrar);
    li.appendChild(acciones);

    return li;
}

function formatearFecha(fechaStr) {
    return new Date(`${fechaStr}T00:00:00`).toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function renderGrafico() {
    const contenedor = document.getElementById('chart-container');
    contenedor.innerHTML = '';

    const recientes = recordsInWindow(onlyNights(getSleepLogs()), 30, new Date());
    if (recientes.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'vacio';
        vacio.textContent = 'Todavía no hay noches suficientes para un gráfico.';
        contenedor.appendChild(vacio);
        return;
    }

    const porFecha = {};
    recientes.forEach((r) => {
        porFecha[r.date] = (porFecha[r.date] || 0) + r.durationMinutes;
    });

    // Se arma en un fragmento y se inserta una sola vez. En la v1 esto era
    // `contenedor.innerHTML +=` dentro del bucle, que reconstruía el
    // contenedor entero en cada vuelta.
    const fragmento = document.createDocumentFragment();
    Object.keys(porFecha)
        .sort()
        .forEach((fecha) => {
            const minutos = porFecha[fecha];
            const dia = new Date(`${fecha}T00:00:00`);

            const grupo = document.createElement('div');
            grupo.className = 'bar-group';
            grupo.setAttribute('role', 'img');
            grupo.setAttribute(
                'aria-label',
                `${dia.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}: ${formatDuration(minutos)}`,
            );

            const barra = document.createElement('div');
            barra.className = 'bar' + (minutos < NOCHE_CORTA ? ' corta' : '');
            barra.style.height = `${Math.min(100, (minutos / MAX_MINUTOS_GRAFICO) * 100)}%`;

            const etiqueta = document.createElement('div');
            etiqueta.className = 'bar-label';
            etiqueta.setAttribute('aria-hidden', 'true');
            etiqueta.textContent = dia
                .toLocaleDateString('es-AR', { weekday: 'short' })
                .slice(0, 3);

            grupo.append(barra, etiqueta);
            fragmento.appendChild(grupo);
        });

    contenedor.appendChild(fragmento);
    contenedor.scrollLeft = contenedor.scrollWidth;
}
