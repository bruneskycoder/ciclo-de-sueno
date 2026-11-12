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
    SIESTA_CORTA_MINUTOS,
} from '../calc.js';
import {
    clearOpenSleep,
    finishOpenSleep,
    getCycleLength,
    getLatency,
    getOpenSleep,
    getSkippedNights,
    getSleepLogs,
    getTheme,
    hasSeenAlarmGuide,
    markAlarmGuideSeen,
    saveRecalledClockNight,
    saveTheme,
    skipNight,
    startOpenSleep,
    updateSleepLog,
} from '../storage.js';
import {
    QUALITY_LEVELS,
    REASONS,
    askShapeWithStale,
    isStaleOpenSleep,
    nightToAskAbout,
    shouldAskAboutNight,
} from '../sleep-session.js';
import { alarmShortcutUrl, isIOS } from '../alarma.js';
import { aroundPlanned, clockOptions, usualClock, wakeOptionsFor } from '../horas-sugeridas.js';
import { showToast } from './toast.js';
import { renderEscena } from './escena.js';
import { openSheet } from './sheets.js';

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
// `pregunta` es el estado de la tarjeta mientras se responde; `forzada` es la
// noche que se pidió desde un hueco del cuaderno.
let pregunta = null;
let preguntaForzada = null;
let registroReciente = null;
let horaDeAlarma = null;

export function initHome() {
    document.getElementById('btn-principal').addEventListener('click', alTocarPrincipal);
    document.getElementById('form-despertar').addEventListener('submit', alPedirHora);
    document.getElementById('btn-tema').addEventListener('click', alternarTema);

    document.getElementById('resultado-filas').addEventListener('click', (evento) => {
        const alarma = evento.target.closest('[data-alarma]');
        if (alarma) {
            ponerAlarma(alarma.dataset.alarma);
            return;
        }
        const fila = evento.target.closest('.fila');
        if (fila && fila.dataset.hora) elegirHora(fila.dataset.hora);
    });

    conectarHojaAlarma();
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
        ciclos: r.cycles,
        detalle: r.cycles === 1 ? '1 ciclo' : `${r.cycles} ciclos`,
        recomendada: r.isOptimal,
        seleccionable: esAhora,
        alarma: esAhora,
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
                alarma: true,
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

    // Una hora de despertar se puede poner de alarma con un toque. Las
    // horas de acostarse (cuando se pide levantarse a una hora fija) no:
    // no hay alarma que poner para irse a dormir.
    if (opcion.alarma) {
        const alarma = document.createElement('button');
        alarma.type = 'button';
        alarma.className = 'btn-alarma';
        alarma.dataset.alarma = opcion.hora;
        alarma.textContent = 'Poner alarma';
        alarma.setAttribute('aria-label', `Poner alarma a las ${opcion.hora}`);
        li.appendChild(alarma);
    }
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

// --- ALARMA ---
//
// Un toque abre el atajo del iPhone con la fecha y hora completas (ver
// alarma.js). La primera vez se muestra antes la hoja que explica cómo
// armar el atajo. Si no es un iPhone, la acción copia la hora.

function ponerAlarma(hora) {
    if (!hasSeenAlarmGuide()) {
        abrirGuiaAlarma(hora);
        return;
    }
    lanzarAlarma(hora);
}

function lanzarAlarma(hora) {
    if (isIOS(navigator)) {
        const url = alarmShortcutUrl(hora);
        if (url) window.location.href = url;
        return;
    }
    copiarHora(hora);
}

async function copiarHora(hora) {
    try {
        await navigator.clipboard.writeText(hora);
        showToast(`Copiada: ${hora}.`);
    } catch {
        showToast('No pude copiar la hora.');
    }
}

/** Abre la hoja con los pasos del atajo. Sin hora, es solo para leer. */
export function abrirGuiaAlarma(hora = null) {
    horaDeAlarma = hora;
    const texto = document.getElementById('alarma-hora');
    texto.hidden = !hora;
    texto.textContent = hora ? `Alarma para las ${hora}.` : '';
    document.getElementById('alarma-poner').hidden = !hora;
    document.getElementById('alarma-copiar').hidden = !hora;
    openSheet('hoja-alarma');
}

function conectarHojaAlarma() {
    document.getElementById('alarma-poner').addEventListener('click', () => {
        markAlarmGuideSeen();
        document.getElementById('hoja-alarma').close();
        if (horaDeAlarma) lanzarAlarma(horaDeAlarma);
    });
    document.getElementById('alarma-copiar').addEventListener('click', () => {
        if (horaDeAlarma) copiarHora(horaDeAlarma);
    });
}

// --- ACCIÓN ---

// Una noche abierta hace más de 16 horas ya no es "la noche en curso":
// es un olvido. Si el botón la siguiera tratando como abierta, diría "Ya me
// levanté" y cerrarla daría un registro imposible, y no habría forma de
// marcar "Me voy a dormir". Eso fue lo que pasó del 25-oct al 4-nov en los
// datos reales: ocho noches anotadas de memoria, sin horario.
function nocheEnCursoVigente() {
    const abierta = getOpenSleep();
    return abierta && !isStaleOpenSleep(abierta) ? abierta : null;
}

function renderAccion() {
    const btn = document.getElementById('btn-principal');
    const detalle = document.getElementById('accion-detalle');
    const abierta = nocheEnCursoVigente();

    if (abierta) {
        btn.textContent = 'Ya me levanté';
        detalle.textContent = abierta.intendedWaketime
            ? `Te acostaste a las ${abierta.bedtimeActual} y calculabas despertarte ${abierta.intendedWaketime}.`
            : `Te acostaste a las ${abierta.bedtimeActual}.`;
        return;
    }

    btn.textContent = horaElegida ? `Me voy a dormir hasta las ${horaElegida}` : 'Me voy a dormir';
    if (getOpenSleep()) {
        detalle.textContent = 'La noche que quedó abierta se descarta si tocás este botón.';
    } else {
        detalle.textContent = horaElegida
            ? ''
            : 'Tocá una hora de arriba si querés dejarla anotada.';
    }
}

function alTocarPrincipal() {
    if (nocheEnCursoVigente()) {
        const resultado = finishOpenSleep();
        if (!resultado.ok) {
            showToast('No pude cerrar esa noche.');
            return;
        }
        const { durationMinutes, cyclesCompleted } = resultado.record;
        showToast(`Dormiste ${formatDuration(durationMinutes)}. ${cyclesCompleted} ciclos.`);
        registroReciente = resultado.record;
        preguntaForzada = null;
        pregunta = null;
        renderHome();
        mostrarDespues();
        return;
    }

    // Si había una noche olvidada, esto la pisa: queda como hueco que se
    // puede cargar desde el cuaderno.
    pregunta = null;
    startOpenSleep(new Date(), { intendedWaketime: horaElegida });
    horaElegida = null;
    showToast('Anotado. Que descanses.');
    renderHome();
}

// --- LA TARJETA DE ANOCHE ---

function conectarTarjetaAnoche() {
    document.getElementById('anoche-horas').addEventListener('click', (evento) => {
        const btn = evento.target.closest('button');
        if (!btn) return;
        if (btn.dataset.otra) {
            const panel = document.getElementById('anoche-otra');
            panel.hidden = !panel.hidden;
            if (!panel.hidden) document.getElementById('anoche-otra-input').focus();
            return;
        }
        if (btn.dataset.hora) alElegirHora(btn.dataset.hora);
    });
    document.getElementById('anoche-otra-ok').addEventListener('click', () => {
        const hora = document.getElementById('anoche-otra-input').value;
        if (!hora) {
            showToast('Falta la hora.');
            return;
        }
        alElegirHora(hora);
    });
    document.getElementById('anoche-saltear').addEventListener('click', saltearNoche);
    document.getElementById('anoche-calidad').addEventListener('click', (evento) => {
        const btn = evento.target.closest('[data-valor]');
        if (btn) marcarCalidad(Number(btn.dataset.valor));
    });
    document.getElementById('anoche-motivos').addEventListener('click', (evento) => {
        const btn = evento.target.closest('[data-motivo]');
        if (btn) marcarMotivo(btn.dataset.motivo);
    });
    document.getElementById('anoche-listo').addEventListener('click', cerrarTarjeta);
}

// Desde un hueco del cuaderno: abre la misma pregunta de memoria, pero por
// esa noche. No insiste ni avisa; está ahí si querés cargarla.
export function preguntarPorNoche(noche) {
    preguntaForzada = noche;
    registroReciente = null;
    pregunta = null;
    renderAnoche();
    const tarjeta = document.getElementById('tarjeta-anoche');
    tarjeta.scrollIntoView({ block: 'center' });
}

function etiquetaDeNoche(clave) {
    if (clave === nightToAskAbout()) return 'anoche';
    return `la noche del ${fechaCorta(clave)}`;
}

function fechaCorta(clave) {
    return new Date(`${clave}T00:00:00`).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
    });
}

function renderAnoche() {
    const tarjeta = document.getElementById('tarjeta-anoche');

    // Mientras se muestra "¿Cómo te levantaste?", cada toque guarda en
    // seguida y avisa un cambio de datos. Sin esta guarda, el aviso
    // repintaba la tarjeta y la hacía desaparecer a mitad de respuesta.
    if (registroReciente) return;

    const abierta = getOpenSleep();
    if (!preguntaForzada) {
        const hayQuePreguntar = shouldAskAboutNight({
            records: getSleepLogs(),
            openSleep: abierta,
            skipped: getSkippedNights(),
        });
        if (!hayQuePreguntar) {
            tarjeta.hidden = true;
            pregunta = null;
            return;
        }
    }

    const forma = askShapeWithStale({ openSleep: abierta, night: preguntaForzada });

    // Si ya se está respondiendo esta misma pregunta, no se reinicia: volver
    // a la app a mitad de la respuesta no tiene que devolverte al primer paso.
    if (!pregunta || pregunta.night !== forma.night || pregunta.mode !== forma.mode) {
        pregunta =
            forma.mode === 'recall'
                ? { night: forma.night, mode: 'recall', step: 'bed', bedtime: null, open: null }
                : {
                      night: forma.night,
                      mode: forma.mode,
                      step: 'wake',
                      bedtime: forma.open.bedtimeActual,
                      open: forma.open,
                  };
    }

    tarjeta.hidden = false;
    document.getElementById('anoche-despues').hidden = true;
    document.getElementById('anoche-saltear').hidden = false;
    pintarPregunta();
}

function pintarPregunta() {
    const { night, mode, step, bedtime, open } = pregunta;
    const planeada = open ? open.intendedWaketime : null;

    const titulo = document.getElementById('anoche-titulo');
    const detalle = document.getElementById('anoche-detalle');
    if (mode === 'stale') {
        titulo.textContent = `Quedó abierta la noche del ${fechaCorta(night)}, desde las ${bedtime}.`;
        detalle.textContent = planeada ? `Calculabas despertarte ${planeada}.` : '';
    } else {
        titulo.textContent = `¿Cómo dormiste ${etiquetaDeNoche(night)}?`;
        if (mode === 'confirm') {
            detalle.textContent = planeada
                ? `Te acostaste a las ${bedtime} y calculabas despertarte ${planeada}.`
                : `Te acostaste a las ${bedtime}.`;
        } else {
            detalle.textContent = 'No quedó anotada, así que va de memoria.';
        }
    }

    document.getElementById('anoche-pregunta').hidden = false;
    document.getElementById('anoche-otra').hidden = true;
    document.getElementById('anoche-pregunta-texto').textContent =
        step === 'bed' ? '¿A qué hora te acostaste?' : '¿A qué hora te levantaste?';

    // Las horas ofrecidas: alrededor de la planeada si la hay (una antes,
    // la planeada y una después: elegir 07:20 entre 06:50, 07:20 y 07:50
    // es una respuesta, tocar "Fue así" era un reflejo) y si no, alrededor
    // de tus horarios de siempre.
    const registros = getSleepLogs();
    let horas;
    if (step === 'bed') horas = clockOptions(usualClock(registros, 'bedtimeActual'));
    else horas = planeada ? aroundPlanned(planeada) : wakeOptionsFor(registros);

    const contenedor = document.getElementById('anoche-horas');
    contenedor.innerHTML = '';
    horas.forEach((hora) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-chip';
        btn.dataset.hora = hora;
        btn.textContent = hora;
        contenedor.appendChild(btn);
    });
    const otra = document.createElement('button');
    otra.type = 'button';
    otra.className = 'btn-chip btn-chip-otra';
    otra.dataset.otra = 'si';
    otra.textContent = 'Otra hora';
    contenedor.appendChild(otra);
}

function alElegirHora(hora) {
    if (!pregunta) return;

    if (pregunta.step === 'bed') {
        pregunta.bedtime = hora;
        pregunta.step = 'wake';
        pintarPregunta();
        return;
    }

    const resultado = pregunta.open
        ? finishOpenSleep({ waketimeActual: hora })
        : saveRecalledClockNight({
              night: pregunta.night,
              bedtimeActual: pregunta.bedtime,
              waketimeActual: hora,
          });

    if (!resultado.ok) {
        showToast(
            resultado.error === 'too-long'
                ? 'Una noche no puede durar más de 16 horas.'
                : 'No pude anotar esa noche.',
        );
        // De memoria se vuelve al primer paso: lo más probable es que la
        // hora de acostarse esté mal. Con una noche abierta, la hora de
        // acostarse es real y solo se vuelve a elegir la de levantarse.
        if (!pregunta.open) {
            pregunta.step = 'bed';
            pintarPregunta();
        }
        return;
    }
    trasAnotar(resultado.record);
}

function saltearNoche() {
    if (pregunta) {
        skipNight(pregunta.night);
        // Una noche abierta que se saltea se descarta: si quedara viva, el
        // botón principal seguiría tratándola como la noche en curso.
        const abierta = getOpenSleep();
        if (abierta && abierta.date === pregunta.night) clearOpenSleep();
    }
    preguntaForzada = null;
    pregunta = null;
    renderHome();
    document.getElementById('tarjeta-anoche').hidden = true;
}

function trasAnotar(registro) {
    registroReciente = registro;
    preguntaForzada = null;
    pregunta = null;
    showToast(`Anotada: ${formatDuration(registro.durationMinutes)}.`);
    renderResultado();
    renderAccion();
    mostrarDespues();
}

// --- DESPUÉS DE ANOTAR: ¿CÓMO TE LEVANTASTE? ---
//
// Vuelve la calificación, en tres niveles y de un toque. La v2 la había
// reemplazado por una frase libre, pero los datos mostraron que la frase
// cargaba justamente eso, y que se dejó de escribir a las dos semanas.
// Cada toque se guarda en el momento: no hay un "Guardar" que olvidar.

function mostrarDespues() {
    const tarjeta = document.getElementById('tarjeta-anoche');
    tarjeta.hidden = false;
    document.getElementById('anoche-titulo').textContent = 'Quedó anotada';
    document.getElementById('anoche-detalle').textContent = registroReciente
        ? `${formatDuration(registroReciente.durationMinutes)}, ${registroReciente.cyclesCompleted} ciclos.`
        : '';
    document.getElementById('anoche-pregunta').hidden = true;
    document.getElementById('anoche-saltear').hidden = true;
    document.getElementById('anoche-despues').hidden = false;
    document.getElementById('anoche-nota-input').value = '';
    pintarDespues();
}

function pintarDespues() {
    const calidad = document.getElementById('anoche-calidad');
    calidad.innerHTML = '';
    QUALITY_LEVELS.forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-chip';
        btn.dataset.valor = String(value);
        btn.textContent = label;
        btn.setAttribute('aria-pressed', String(registroReciente.quality === value));
        calidad.appendChild(btn);
    });

    const motivos = document.getElementById('anoche-motivos');
    motivos.innerHTML = '';
    REASONS.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-chip';
        btn.dataset.motivo = id;
        btn.textContent = label;
        btn.setAttribute('aria-pressed', String((registroReciente.reasons || []).includes(id)));
        motivos.appendChild(btn);
    });
}

function marcarCalidad(valor) {
    if (!registroReciente) return;
    // Tocar el que ya estaba marcado lo desmarca: la pregunta es opcional.
    const nueva = registroReciente.quality === valor ? null : valor;
    registroReciente = updateSleepLog(registroReciente.id, { quality: nueva }) || registroReciente;
    pintarDespues();
}

function marcarMotivo(id) {
    if (!registroReciente) return;
    const actuales = registroReciente.reasons || [];
    const nuevos = actuales.includes(id) ? actuales.filter((m) => m !== id) : [...actuales, id];
    registroReciente = updateSleepLog(registroReciente.id, { reasons: nuevos }) || registroReciente;
    pintarDespues();
}

function cerrarTarjeta() {
    const nota = document.getElementById('anoche-nota-input').value.trim();
    if (nota && registroReciente) updateSleepLog(registroReciente.id, { notes: nota });

    registroReciente = null;
    document.getElementById('tarjeta-anoche').hidden = true;
    renderHome();
    if (nota) showToast('Guardada.');
}
