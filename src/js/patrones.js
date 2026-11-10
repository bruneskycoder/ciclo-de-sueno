// patrones.js — lo que los datos dicen de tus noches, y sobre cuántas
// noches se apoya. Lógica PURA, sin DOM, mismo criterio que metrics.js.
//
// Tres reglas que explican todo lo de acá:
//
// 1. CADA PATRÓN LLEVA SU MUESTRA. Un número sin la cantidad de noches
//    detrás parece más firme de lo que es. Por debajo de PISO_NOCHES el
//    patrón dice cuántas faltan en vez de mostrar un número. El piso es
//    para no mostrar ruido; no es un umbral estadístico.
// 2. NUNCA HABLA DE CAUSAS. Compara grupos de noches ("las noches en que"),
//    no explica nada: con un diario de pocas decenas de noches, correlación
//    es todo lo que hay. Y tampoco hay rachas: los huecos de esta app son
//    los viernes y sábados, y una racha que se corta castiga justo eso.
// 3. UNA ZONA HORARIA A LA VEZ. Los patrones solo comparan noches de la
//    misma zona: la regularidad de alguien que acaba de cruzar 16 horas
//    mediría el vuelo, no la costumbre.
import { recordsInWindow } from './metrics.js';
import { hasClockTimes, onlyNights } from './sleep-session.js';

export const PISO_NOCHES = 5;

const VENTANA_REGULARIDAD = 30;
const VENTANA_JET_LAG = 90;
const VENTANA_MOTIVOS = 30;

// Misma convención que metrics.js: la madrugada (antes de las 12:00) se
// cuenta como continuación de la noche anterior, para que 23:50 y 00:10
// estén a 20 minutos y no a casi un día.
function minutosNormalizados(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const min = h * 60 + m;
    return min < 12 * 60 ? min + 1440 : min;
}

/**
 * Punto medio de la noche, en minutos (normalizados). Es la medida que
 * usa la literatura de cronotipo: el punto medio no depende de cuánto se
 * durmió, sino de CUÁNDO.
 */
export function sleepMidpoint(registro) {
    return minutosNormalizados(registro.bedtimeActual) + registro.durationMinutes / 2;
}

function promedio(numeros) {
    return numeros.reduce((suma, n) => suma + n, 0) / numeros.length;
}

function desvio(numeros) {
    const media = promedio(numeros);
    return Math.sqrt(promedio(numeros.map((n) => (n - media) ** 2)));
}

/**
 * Recorta los registros a la zona horaria vigente: desde el más nuevo
 * hacia atrás, hasta que aparece una noche anotada en otra zona.
 *
 * Los registros viejos no tienen `tz` (se agregó en la v3): se tratan
 * como de la misma zona que los que siguen, en vez de cortar la ventana
 * por falta de dato. Es una apuesta razonable: hasta la v3 nadie había
 * viajado con la app.
 *
 * @returns {{records: Array, changed: boolean}} `changed` es true si la
 *   ventana se cortó por un cambio de zona.
 */
export function sameZoneRun(records) {
    const ordenados = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
    const actual = ordenados.find((r) => r.tz)?.tz;
    if (!actual) return { records: ordenados, changed: false };

    const corrida = [];
    for (const r of ordenados) {
        if (r.tz && r.tz !== actual) return { records: corrida, changed: true };
        corrida.push(r);
    }
    return { records: corrida, changed: false };
}

function faltan(cantidad) {
    return Math.max(0, PISO_NOCHES - cantidad);
}

/**
 * Cuánto se corre el punto medio de tu noche el viernes y el sábado
 * respecto del resto. Es el jet lag social (Wittmann, Roenneberg y otros,
 * 2006): la diferencia del punto medio del sueño entre días libres y días
 * de trabajo. Se calcula solo con noches con horario, y con los datos de
 * hoy no se puede: los fines de semana casi no tienen.
 *
 * La "noche del viernes" es la que arranca el viernes, y el sábado se
 * levanta tarde sin pedir permiso: por eso se comparan las noches de
 * viernes y sábado contra las demás.
 */
export function socialJetLag(noches) {
    const conHorario = noches.filter(hasClockTimes);
    const libres = [];
    const resto = [];
    for (const r of conHorario) {
        const dia = new Date(`${r.date}T00:00:00`).getDay();
        (dia === 5 || dia === 6 ? libres : resto).push(sleepMidpoint(r));
    }

    const base = {
        nights: conHorario.length,
        weekendNights: libres.length,
        otherNights: resto.length,
    };
    if (libres.length < PISO_NOCHES || resto.length < PISO_NOCHES) {
        return {
            ...base,
            enough: false,
            missingWeekend: faltan(libres.length),
            missingOther: faltan(resto.length),
        };
    }
    return { ...base, enough: true, minutes: Math.round(promedio(libres) - promedio(resto)) };
}

/**
 * Cuánto varía el punto medio de tu noche (desvío estándar, en minutos).
 * Reemplaza a la regularidad de la hora de acostarse sola, que es lo que
 * medía la app hasta la v2.
 */
export function regularity(noches) {
    const puntos = noches.filter(hasClockTimes).map(sleepMidpoint);
    if (puntos.length < PISO_NOCHES) {
        return { nights: puntos.length, enough: false, missing: faltan(puntos.length) };
    }
    return { nights: puntos.length, enough: true, sdMinutes: Math.round(desvio(puntos)) };
}

/**
 * Hora de acostarse contra cómo te levantaste: de las noches en que te
 * acostaste antes de las 00:00, en cuántas te levantaste bien; y lo mismo
 * para después. Solo cuenta las noches con horario y con la pregunta
 * "¿Cómo te levantaste?" contestada.
 *
 * Describe dos grupos; no dice que acostarse antes haga levantarse mejor.
 * Se acuesta antes la gente que ya venía con ganas de dormir.
 */
export function bedtimeVsWakeFeeling(noches) {
    const antes = { total: 0, bien: 0 };
    const despues = { total: 0, bien: 0 };
    for (const r of noches) {
        if (!hasClockTimes(r) || typeof r.quality !== 'number') continue;
        const grupo = minutosNormalizados(r.bedtimeActual) < 1440 ? antes : despues;
        grupo.total++;
        if (r.quality === 5) grupo.bien++;
    }

    const base = { before: antes, after: despues, nights: antes.total + despues.total };
    if (antes.total < PISO_NOCHES || despues.total < PISO_NOCHES) {
        return {
            ...base,
            enough: false,
            missingBefore: faltan(antes.total),
            missingAfter: faltan(despues.total),
        };
    }
    return { ...base, enough: true };
}

/**
 * Los motivos que más se marcaron, sobre las noches que tienen alguna
 * respuesta a "¿Cómo te levantaste?".
 */
export function frequentReasons(noches) {
    const respondidas = noches.filter(
        (r) => typeof r.quality === 'number' || (Array.isArray(r.reasons) && r.reasons.length > 0),
    );
    if (respondidas.length < PISO_NOCHES) {
        return { nights: respondidas.length, enough: false, missing: faltan(respondidas.length) };
    }

    const cuenta = new Map();
    for (const r of respondidas) {
        for (const id of r.reasons || []) cuenta.set(id, (cuenta.get(id) || 0) + 1);
    }
    const items = [...cuenta.entries()]
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count);
    return { nights: respondidas.length, enough: true, items };
}

/**
 * Todos los patrones, sobre las noches de la zona horaria vigente.
 *
 * @returns {{zone: {changed: boolean, nights: number}, jetLag: Object,
 *   regularity: Object, bedtimeVsWake: Object, reasons: Object}}
 */
export function analyzePatterns(records, now = new Date()) {
    const corrida = sameZoneRun(onlyNights(records));
    const noches = corrida.records;

    return {
        zone: { changed: corrida.changed, nights: noches.length },
        jetLag: socialJetLag(recordsInWindow(noches, VENTANA_JET_LAG, now)),
        regularity: regularity(recordsInWindow(noches, VENTANA_REGULARIDAD, now)),
        bedtimeVsWake: bedtimeVsWakeFeeling(recordsInWindow(noches, VENTANA_JET_LAG, now)),
        reasons: frequentReasons(recordsInWindow(noches, VENTANA_MOTIVOS, now)),
    };
}
