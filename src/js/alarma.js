// alarma.js — arma el link que abre el atajo del iPhone para poner la
// alarma. Lógica PURA, sin DOM.
//
// Por qué un atajo y no una alarma directa. iOS no deja que una web
// programe una alarma: lo único que acepta es abrir la app Atajos con un
// esquema `shortcuts://`, y que el atajo (armado una vez a mano) cree la
// alarma. Está documentado por Apple.
//
// Lo que NO está verificado en un teléfono: que la acción "Crear alarma"
// reciba bien la hora. Los foros reportan el error "no se pudo convertir de
// Texto a Fecha" cuando se le pasa un texto suelto como "07:20". Por eso
// la app manda fecha y hora COMPLETAS en ISO 8601, que Atajos sí
// reconoce, y el atajo pasa por la acción "Fecha" antes de crear la
// alarma. Si igual falla, el plan B es copiar la hora.
export const SHORTCUT_NAME = 'Alarma Fogón';

const TIME_RE = /^\d{1,2}:\d{2}$/;

/**
 * La próxima vez que el reloj marque `timeStr`. Si ya pasó (o es este mismo
 * minuto), es mañana: pedir 07:20 a las 23:00 es una alarma para la mañana
 * siguiente, no una en el pasado.
 *
 * @returns {Date|null} null si la hora no sirve.
 */
export function nextOccurrence(timeStr, now = new Date()) {
    if (!timeStr || !TIME_RE.test(timeStr)) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const fecha = new Date(now);
    fecha.setHours(h, m, 0, 0);
    if (fecha.getTime() <= now.getTime()) fecha.setDate(fecha.getDate() + 1);
    return fecha;
}

/** ISO 8601 con el corrimiento local: 2026-11-09T07:20:00-03:00. */
export function toIsoWithOffset(fecha) {
    const pad = (n) => String(n).padStart(2, '0');
    const corrimiento = -fecha.getTimezoneOffset();
    const signo = corrimiento >= 0 ? '+' : '-';
    const abs = Math.abs(corrimiento);
    return (
        `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` +
        `T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:00` +
        `${signo}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
    );
}

/**
 * El link que abre el atajo con la fecha y hora de la alarma.
 *
 * @returns {string|null} null si la hora no sirve.
 */
export function alarmShortcutUrl(timeStr, now = new Date()) {
    const fecha = nextOccurrence(timeStr, now);
    if (!fecha) return null;
    return (
        `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}` +
        `&input=text&text=${encodeURIComponent(toIsoWithOffset(fecha))}`
    );
}

/**
 * ¿Es un iPhone o iPad? Solo ahí tiene sentido abrir el atajo; en
 * cualquier otro lado la acción copia la hora. El iPad moderno se presenta
 * como una Mac, y lo único que lo delata es la pantalla táctil.
 */
export function isIOS({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
    return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}
