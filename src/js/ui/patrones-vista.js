// patrones-vista.js — pinta "Lo que dicen tus noches" en el cuaderno. Los
// números salen de patrones.js; acá solo se convierten en frases.
//
// Tres reglas de redacción que vienen del plan:
// - Cada patrón dice sobre cuántas noches se apoya.
// - Por debajo del piso dice "Todavía no alcanza" y cuántas faltan.
// - Nunca habla de causas: "las noches en que", no "porque". Y nada de rachas.
import { analyzePatterns } from '../patrones.js';
import { REASONS } from '../sleep-session.js';
import { formatDuration } from '../calc.js';
import { getSleepLogs } from '../storage.js';

function noches(n) {
    return n === 1 ? '1 noche' : `${n} noches`;
}

function todaviaNoAlcanza(detalle) {
    return `Todavía no alcanza: ${detalle}.`;
}

// "faltan 4 noches de fin de semana y 2 de entre semana": el verbo va una
// sola vez, al principio.
function faltan(...partes) {
    const con = partes.filter(([n]) => n > 0);
    const [[n0, que0], ...resto] = con;
    const primera = `${n0 === 1 ? 'falta' : 'faltan'} ${noches(n0)} ${que0}`;
    return [primera, ...resto.map(([n, que]) => `${n} ${que}`)].join(' y ');
}

function minutosLegibles(n) {
    return n < 60 ? `${n} minutos` : formatDuration(n);
}

export function frasesDeJetLag(p) {
    if (!p.enough) {
        return {
            texto: todaviaNoAlcanza(
                faltan([p.missingWeekend, 'de fin de semana'], [p.missingOther, 'de entre semana']),
            ),
        };
    }
    const abs = Math.abs(p.minutes);
    const texto =
        abs < 10
            ? 'El viernes y el sábado tu noche casi no se corre respecto del resto.'
            : `El viernes y el sábado el punto medio de tu noche cae ${minutosLegibles(abs)} ${p.minutes > 0 ? 'más tarde' : 'más temprano'} que el resto de la semana.`;
    return {
        texto,
        muestra: `Sobre ${noches(p.nights)} con horario, ${p.weekendNights} de viernes y sábado.`,
    };
}

export function frasesDeRegularidad(p) {
    if (!p.enough) {
        return { texto: todaviaNoAlcanza(faltan([p.missing, 'con horario'])) };
    }
    const cuanto = minutosLegibles(p.sdMinutes);
    return {
        texto: `El punto medio de tu noche se mueve unos ${cuanto} de una noche a otra.`,
        muestra: `Sobre ${noches(p.nights)} con horario, del último mes.`,
    };
}

export function frasesDeAcostarse(p) {
    if (!p.enough) {
        return {
            texto: todaviaNoAlcanza(
                faltan(
                    [p.missingBefore, 'acostándote antes de las 00:00'],
                    [p.missingAfter, 'acostándote después'],
                ),
            ),
        };
    }
    const { before, after } = p;
    return {
        texto: `Las noches en que te acostaste antes de las 00:00 te levantaste bien ${before.bien} de ${before.total} veces; después, ${after.bien} de ${after.total}.`,
        muestra: `Sobre ${noches(p.nights)} con la pregunta contestada.`,
    };
}

export function frasesDeMotivos(p) {
    if (!p.enough) {
        return { texto: todaviaNoAlcanza(faltan([p.missing, 'con la pregunta contestada'])) };
    }
    if (p.items.length === 0) {
        return {
            texto: 'En el último mes no marcaste ningún motivo.',
            muestra: `Sobre ${noches(p.nights)} con la pregunta contestada.`,
        };
    }
    const etiquetas = new Map(REASONS.map((r) => [r.id, r.label]));
    const lista = p.items
        .map(({ id, count }) => `${etiquetas.get(id) || id} (${count})`)
        .join(', ');
    return {
        texto: `En el último mes marcaste: ${lista}.`,
        muestra: `Sobre ${noches(p.nights)} con la pregunta contestada.`,
    };
}

function item(titulo, { texto, muestra }) {
    const li = document.createElement('li');
    li.className = 'patron';
    const t = document.createElement('div');
    t.className = 'patron-titulo';
    t.textContent = titulo;
    const p = document.createElement('p');
    p.className = 'patron-texto';
    p.textContent = texto;
    li.append(t, p);
    if (muestra) {
        const m = document.createElement('p');
        m.className = 'patron-muestra';
        m.textContent = muestra;
        li.appendChild(m);
    }
    return li;
}

export function renderPatrones() {
    const resultado = analyzePatterns(getSleepLogs());
    const lista = document.getElementById('patrones-lista');
    const zona = document.getElementById('patrones-zona');

    zona.hidden = !resultado.zone.changed;
    zona.textContent = resultado.zone.changed
        ? `Desde que cambiaste de zona horaria van ${noches(resultado.zone.nights)}.`
        : '';

    lista.innerHTML = '';
    lista.append(
        item('Fin de semana contra el resto', frasesDeJetLag(resultado.jetLag)),
        item('Regularidad', frasesDeRegularidad(resultado.regularity)),
        item('Hora de acostarse y cómo te levantaste', frasesDeAcostarse(resultado.bedtimeVsWake)),
        item('Lo que más marcaste', frasesDeMotivos(resultado.reasons)),
    );
}
