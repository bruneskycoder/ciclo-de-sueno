// home.js — la pantalla principal: el resultado, el botón de acción y la
// tarjeta que pregunta por anoche.
//
// Dos decisiones que explican casi todo lo de acá:
//
// 1. El cálculo es ambiente, no una acción. Al abrir, la app ya muestra a
//    qué hora conviene despertarse si uno se duerme ahora. Es una función
//    pura del reloj: no necesita ningún dato guardado ni ninguna decisión
//    del usuario, así que no hay razón para hacérselo pedir.
//
// 2. El botón principal tiene estado. Si no estás durmiendo dice "Me voy
//    a dormir"; si sí, dice "Ya me levanté". Nunca hay dos acciones
//    compitiendo por el mismo lugar.
import {
    calcularCiclos,
    calcularSiesta,
    formatDuration,
    formatTime,
    minutesUntilClock,
    addMinutesToClock,
    SIESTA_CORTA_MINUTOS,
} from '../calc.js';
import {
    finishOpenSleep,
    getCycleLength,
    getLatency,
    getOpenSleep,
    getSkippedNights,
    getSleepLogs,
    getTheme,
    saveRecalledNight,
    saveTheme,
    skipNight,
    startOpenSleep,
    updateSleepLog,
} from '../storage.js';
import { askShapeFor, shouldAskAboutNight } from '../sleep-session.js';
import { showToast } from './toast.js';

// Menos de tres ciclos no es una noche, es una siesta larga — y para eso
// están las dos filas de siesta. Arrancar en 3 saca ruido de la lista sin
// esconder ninguna opción real.
const CICLOS_MIN = 3;
const CICLOS_MAX = 6;

// Hora elegida de la lista, si se eligió alguna. Queda como intención de
// la noche: al día siguiente la app puede preguntar "¿fue así?" en vez de
// pedir el dato de cero.
let horaElegida = null;

// La noche por la que se está preguntando ahora, y el registro recién
// creado al responder — para poder agregarle la frase después.
let nocheEnCurso = null;
let registroReciente = null;

export function initHome() {
    document.getElementById('btn-principal').addEventListener('click', alTocarPrincipal);
    document.getElementById('form-despertar').addEventListener('submit', alPedirHora);
    document.getElementById('btn-tema').addEventListener('click', alternarTema);

    document.getElementById('resultado-filas').addEventListener('click', (evento) => {
        const fila = evento.target.closest('.fila');
        if (fila && fila.dataset.hora) elegirHora(fila.dataset.hora);
    });

    conectarTarjetaAnoche();
    aplicarTema(getTheme());

    // El "en 5h 10m" envejece solo. Se refresca cada minuto y al volver a
    // la app, que es el caso real: uno la deja abierta y vuelve más tarde.
    setInterval(() => {
        if (!document.hidden) renderResultado();
    }, 60000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) renderHome();
    });
}

export function renderHome() {
    renderResultado();
    renderAccion();
    renderAnoche();
}

// --- TEMA ---

function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    const btn = document.getElementById('btn-tema');
    btn.setAttribute('aria-pressed', String(tema === 'brasa'));
    btn.title = tema === 'brasa' ? 'Volver al brillo normal' : 'Bajar el brillo';
}

function alternarTema() {
    aplicarTema(saveTheme(getTheme() === 'brasa' ? 'fogon' : 'brasa'));
}

// --- RESULTADO ---

function renderResultado({ modo = 'ahora', hora = null } = {}) {
    const ahora = new Date();
    const cycleMinutes = getCycleLength();
    const latencyMinutes = getLatency();
    const titulo = document.getElementById('resultado-titulo');
    const lista = document.getElementById('resultado-filas');
    const pie = document.getElementById('resultado-pie');

    const esAhora = modo === 'ahora';
    const resultado = calcularCiclos({
        mode: esAhora ? 'sleep' : 'wake',
        timeStr: esAhora ? formatTime(ahora) : hora,
        latencyMinutes,
        cycleMinutes,
        minCycles: CICLOS_MIN,
        maxCycles: CICLOS_MAX,
        referenceDate: ahora,
    });
    if (!resultado.ok) return;

    titulo.textContent = esAhora
        ? 'Si te dormís ahora, poné el despertador a las:'
        : `Para levantarte a las ${hora}, acostate a las:`;

    lista.innerHTML = '';
    resultado.results.forEach((r) => {
        lista.appendChild(filaResultado(r, ahora, esAhora));
    });

    if (esAhora) {
        const siesta = calcularSiesta({ timeStr: formatTime(ahora), latencyMinutes, cycleMinutes });
        if (siesta.ok) {
            lista.appendChild(
                filaSiesta(
                    'Siesta corta',
                    `${SIESTA_CORTA_MINUTOS} min`,
                    siesta.corta.resultTimeStr,
                ),
            );
            lista.appendChild(
                filaSiesta('Siesta larga', 'un ciclo', siesta.completa.resultTimeStr),
            );
        }
        pie.textContent =
            'En el medio de esas dos no conviene: te agarra en lo más hondo del sueño y te levantás peor que antes.';
    } else {
        pie.textContent = `Ya está contado que tardás ${latencyMinutes} minutos en dormirte.`;
    }
}

function filaResultado(r, ahora, seleccionable) {
    const fila = document.createElement(seleccionable ? 'button' : 'li');
    fila.className = 'fila' + (r.isOptimal ? ' recomendada' : '');
    if (seleccionable) {
        fila.type = 'button';
        fila.dataset.hora = r.resultTimeStr;
        if (r.resultTimeStr === horaElegida) fila.classList.add('elegida');
    }

    const faltan = minutesUntilClock(r.resultTimeStr, ahora);
    fila.innerHTML = `
        <span class="hora">${r.resultTimeStr}</span>
        <span class="falta">en ${formatDuration(faltan)}</span>
        <span class="ciclos">${r.cycles} ciclos</span>
    `;

    // Un <li> no es interactivo, así que la lista entera necesita decirle
    // al lector de pantalla qué significa cada fila.
    fila.setAttribute(
        'aria-label',
        `${r.resultTimeStr}, en ${formatDuration(faltan)}, ${r.cycles} ciclos${r.isOptimal ? ', recomendado' : ''}`,
    );
    return fila;
}

function filaSiesta(etiqueta, detalle, hora) {
    const li = document.createElement('li');
    li.className = 'fila-siesta';
    li.innerHTML = `
        <span class="etiqueta">${etiqueta}</span>
        <span class="etiqueta">${detalle}</span>
        <span class="hora">${hora}</span>
    `;
    return li;
}

function elegirHora(hora) {
    horaElegida = horaElegida === hora ? null : hora;
    renderResultado();
    renderAccion();
}

function alPedirHora(evento) {
    evento.preventDefault();
    const hora = document.getElementById('hora-despertar').value;
    if (!hora) {
        showToast('Falta la hora.');
        return;
    }
    // Pedir una hora es consultar, no anotar: la elección de la noche se
    // limpia para no arrastrar una intención que ya no corresponde.
    horaElegida = null;
    renderResultado({ modo: 'hora', hora });
    renderAccion();
}

// --- ACCIÓN ---

function renderAccion() {
    const btn = document.getElementById('btn-principal');
    const detalle = document.getElementById('accion-detalle');
    const abierta = getOpenSleep();

    if (abierta) {
        btn.textContent = 'Ya me levanté';
        detalle.textContent = abierta.intendedWaketime
            ? `Te acostaste a las ${abierta.bedtimeActual} y calculabas despertarte ${abierta.intendedWaketime}.`
            : `Te acostaste a las ${abierta.bedtimeActual}.`;
        return;
    }

    btn.textContent = horaElegida ? `Me voy a dormir hasta las ${horaElegida}` : 'Me voy a dormir';
    detalle.textContent = horaElegida ? '' : 'Tocá una hora de arriba si querés dejarla anotada.';
}

function alTocarPrincipal() {
    if (getOpenSleep()) {
        const resultado = finishOpenSleep();
        if (!resultado.ok) {
            showToast('No pude cerrar esa noche.');
            return;
        }
        const { durationMinutes, cyclesCompleted } = resultado.record;
        showToast(`Dormiste ${formatDuration(durationMinutes)}. ${cyclesCompleted} ciclos.`);
        registroReciente = resultado.record;
        nocheEnCurso = resultado.record.date;
        renderHome();
        mostrarPedidoDeNota();
        return;
    }

    startOpenSleep(new Date(), { intendedWaketime: horaElegida });
    horaElegida = null;
    showToast('Anotado. Que descanses.');
    renderHome();
}

// --- LA TARJETA DE ANOCHE ---

function conectarTarjetaAnoche() {
    document.getElementById('anoche-si').addEventListener('click', confirmarAnoche);
    document.getElementById('anoche-distinto').addEventListener('click', () => {
        document.getElementById('anoche-confirmar').hidden = true;
        document.getElementById('anoche-horas').hidden = false;
    });
    document.getElementById('anoche-saltear').addEventListener('click', () => {
        if (nocheEnCurso) skipNight(nocheEnCurso);
        renderHome();
    });
    document.getElementById('anoche-guardar-nota').addEventListener('click', guardarNota);
    document.getElementById('anoche-horas').addEventListener('click', (evento) => {
        const btn = evento.target.closest('[data-horas]');
        if (btn) responderHoras(Number(btn.dataset.horas));
    });
}

function renderAnoche() {
    const tarjeta = document.getElementById('tarjeta-anoche');
    const hayQuePreguntar = shouldAskAboutNight({
        records: getSleepLogs(),
        openSleep: getOpenSleep(),
        skipped: getSkippedNights(),
    });

    if (!hayQuePreguntar) {
        tarjeta.hidden = true;
        return;
    }

    const forma = askShapeFor({ openSleep: getOpenSleep() });
    nocheEnCurso = forma.night;
    tarjeta.hidden = false;
    document.getElementById('anoche-nota').hidden = true;
    document.getElementById('anoche-titulo').textContent = '¿Cómo dormiste anoche?';

    // Solo se puede confirmar si además de la hora de acostarse quedó
    // guardada la que se pensaba despertar. Si no, no hay nada que
    // confirmar y se pregunta directamente cuántas horas durmió.
    const puedeConfirmar = forma.mode === 'confirm' && forma.open.intendedWaketime;

    document.getElementById('anoche-detalle').textContent = puedeConfirmar
        ? `Te acostaste a las ${forma.open.bedtimeActual} y calculabas despertarte ${forma.open.intendedWaketime}.`
        : forma.mode === 'confirm'
          ? `Te acostaste a las ${forma.open.bedtimeActual}, pero no sé hasta cuándo.`
          : 'No quedó anotada, así que va de memoria.';

    document.getElementById('anoche-confirmar').hidden = !puedeConfirmar;
    const contenedorHoras = document.getElementById('anoche-horas');
    contenedorHoras.hidden = puedeConfirmar;
    pintarOpcionesDeHoras(contenedorHoras);
}

// Horas enteras, y nada más. La primera versión ofrecía múltiplos del
// ciclo configurado ("6h", "7h 30m", "9h"), que es más exacto y peor: a
// la noche siguiente nadie recuerda haber dormido siete horas y media.
// Se recuerda "como siete horas". La app deduce los ciclos sola.
const HORAS_POSIBLES = [5, 6, 7, 8, 9];

function pintarOpcionesDeHoras(contenedor) {
    contenedor.innerHTML = '';
    HORAS_POSIBLES.forEach((horas) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-chip';
        btn.dataset.horas = String(horas);
        btn.textContent = `${horas}h`;
        contenedor.appendChild(btn);
    });
}

function confirmarAnoche() {
    const abierta = getOpenSleep();
    if (!abierta || !abierta.intendedWaketime) return;

    const resultado = finishOpenSleep({ waketimeActual: abierta.intendedWaketime });
    if (!resultado.ok) {
        showToast('No pude anotar esa noche.');
        return;
    }
    trasAnotar(resultado.record);
}

function responderHoras(horas) {
    const abierta = getOpenSleep();

    // Si se conoce la hora de acostarse, la de despertar se deduce: son
    // dos datos reales y una suma, no un horario inventado. Así la noche
    // conserva horario y puede aportar a la regularidad.
    if (abierta && abierta.date === nocheEnCurso) {
        const waketimeActual = addMinutesToClock(abierta.bedtimeActual, horas * 60);
        const resultado = finishOpenSleep({ waketimeActual });
        if (resultado.ok) {
            trasAnotar(resultado.record);
            return;
        }
    }

    trasAnotar(saveRecalledNight({ hours: horas, night: nocheEnCurso }));
}

function trasAnotar(registro) {
    registroReciente = registro;
    showToast(`Anotada: ${formatDuration(registro.durationMinutes)}.`);
    renderResultado();
    renderAccion();
    mostrarPedidoDeNota();
}

// La única cosa que escribe una persona. Las horas las pone la app; esto
// es lo que convierte al cuaderno en algo para leer y no en una planilla.
function mostrarPedidoDeNota() {
    const tarjeta = document.getElementById('tarjeta-anoche');
    tarjeta.hidden = false;
    document.getElementById('anoche-titulo').textContent = 'Quedó anotada';
    document.getElementById('anoche-detalle').textContent = registroReciente
        ? `${formatDuration(registroReciente.durationMinutes)}, ${registroReciente.cyclesCompleted} ciclos.`
        : '';
    document.getElementById('anoche-confirmar').hidden = true;
    document.getElementById('anoche-horas').hidden = true;
    document.getElementById('anoche-nota').hidden = false;
    document.getElementById('anoche-nota-input').value = '';
}

function guardarNota() {
    const input = document.getElementById('anoche-nota-input');
    const nota = input.value.trim();
    if (nota && registroReciente) updateSleepLog(registroReciente.id, { notes: nota });

    registroReciente = null;
    document.getElementById('tarjeta-anoche').hidden = true;
    if (nota) showToast('Guardada.');
}
