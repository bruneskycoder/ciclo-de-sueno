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
import { renderEscena } from './escena.js';

// La lista es UNA escalera ordenada por cuánto se duerme, de menos a
// más: la siesta corta primero, después uno, dos, tres… ciclos. En la
// primera versión los ciclos iban arriba y las dos siestas pegadas
// abajo, como un apéndice — y saltaba de un ciclo a tres, dejando un
// hueco visible. La siesta no es otra sección: son los escalones más
// cortos de la misma escalera.
const CICLOS_MIN = 1;
const CICLOS_MAX = 6;

// Con hora de despertar fija la cosa cambia: "1 ciclo" ahí significa
// acostarte 05:10 para levantarte a las 07:00. No es una opción, es una
// fila absurda, y con el orden ascendente queda arriba de todo empujando
// las útiles al fondo. Pidiendo una hora puntual uno está planificando
// una noche, no eligiendo cuánto dormir.
const CICLOS_MIN_HORA_FIJA = 3;

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
    // La escena cambia con el tema: en modo brasa se queda quieta y usa
    // la paleta nocturna aunque sea de día.
    renderEscena();
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
        minCycles: esAhora ? CICLOS_MIN : CICLOS_MIN_HORA_FIJA,
        maxCycles: CICLOS_MAX,
        referenceDate: ahora,
    });
    if (!resultado.ok) return;

    titulo.textContent = esAhora
        ? 'Si te dormís ahora, poné el despertador a las:'
        : `Para levantarte a las ${hora}, acostate a las:`;

    const opciones = resultado.results.map((r) => ({
        hora: r.resultTimeStr,
        dormido: r.cycles * resultado.cycleLength,
        detalle: r.cycles === 1 ? '1 ciclo' : `${r.cycles} ciclos`,
        recomendada: r.isOptimal,
        seleccionable: esAhora,
    }));

    // La siesta corta no es una fracción de ciclo: es cortar antes de
    // entrar en sueño profundo, que tiene su propia lógica. Pero ocupa su
    // lugar en la misma escalera, como el escalón más corto. Solo aparece
    // cuando se calcula desde ahora: si estás pidiendo a qué hora
    // acostarte para levantarte a una hora fija, una siesta no aplica.
    if (esAhora) {
        const siesta = calcularSiesta({ timeStr: formatTime(ahora), latencyMinutes, cycleMinutes });
        if (siesta.ok) {
            opciones.push({
                hora: siesta.corta.resultTimeStr,
                dormido: SIESTA_CORTA_MINUTOS,
                detalle: 'siesta corta',
                recomendada: false,
                seleccionable: false,
            });
        }
    }

    // Ordenada por lo que se duerme, no por la hora del reloj: en modo
    // "quiero levantarme a las X" más ciclos significa acostarse más
    // temprano, así que ordenar por hora daría la escalera al revés.
    opciones.sort((a, b) => a.dormido - b.dormido);

    lista.innerHTML = '';
    const fragmento = document.createDocumentFragment();
    opciones.forEach((o) => fragmento.appendChild(filaResultado(o, ahora)));
    lista.appendChild(fragmento);

    pie.textContent = esAhora
        ? 'Entre la siesta corta y un ciclo entero no conviene: te agarra en lo más hondo del sueño y te levantás peor que antes.'
        : `Ya está contado que tardás ${latencyMinutes} minutos en dormirte.`;
}

function filaResultado(opcion, ahora) {
    // Cada fila va envuelta en un <li>. Un <ul> con <button> como hijos
    // directos es HTML inválido, y los lectores de pantalla dejan de
    // anunciar la cantidad de elementos de la lista.
    const li = document.createElement('li');
    const fila = document.createElement(opcion.seleccionable ? 'button' : 'div');
    fila.className = 'fila' + (opcion.recomendada ? ' recomendada' : '');
    if (opcion.seleccionable) {
        fila.type = 'button';
        fila.dataset.hora = opcion.hora;
        if (opcion.hora === horaElegida) fila.classList.add('elegida');
    }

    const faltan = minutesUntilClock(opcion.hora, ahora);
    fila.innerHTML = `
        <span class="hora">${opcion.hora}</span>
        <span class="falta">en ${formatDuration(faltan)}</span>
        <span class="ciclos">${opcion.detalle}</span>
    `;
    fila.setAttribute(
        'aria-label',
        `${opcion.hora}, en ${formatDuration(faltan)}, ${opcion.detalle}${opcion.recomendada ? ', recomendado' : ''}`,
    );

    li.appendChild(fila);
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
