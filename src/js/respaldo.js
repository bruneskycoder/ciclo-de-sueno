// respaldo.js — cuándo avisar que hace falta bajar un respaldo. Lógica
// PURA, sin DOM.
//
// El export es el único respaldo de los datos: no hay cuenta ni servidor.
// La app instalada en la pantalla de inicio no sufre el borrado de Safari a
// los siete días, pero cambiar de teléfono se lleva todo. Un aviso de una
// línea en Ajustes alcanza; no se insiste ni se muestra en la pantalla
// principal.
const MES_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @param {Object} params
 * @param {string|null} params.lastExportAt - ISO del último export, o null.
 * @param {number} params.recordCount - Cuántas noches hay anotadas.
 * @returns {string|null} La línea a mostrar, o null si no hace falta.
 */
export function backupReminder({ lastExportAt, recordCount, now = new Date() }) {
    if (recordCount === 0) return null;

    const ultimo = lastExportAt ? Date.parse(lastExportAt) : NaN;
    if (Number.isNaN(ultimo)) return 'Todavía no bajaste ningún respaldo.';

    const pasado = now.getTime() - ultimo;
    if (pasado <= MES_MS) return null;

    const dias = Math.floor(pasado / (24 * 60 * 60 * 1000));
    return `Hace ${dias} días que no bajás un respaldo.`;
}
