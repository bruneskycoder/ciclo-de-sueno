// alarma.test.js — el link armado hacia el atajo del iPhone. Lo que se
// verifica acá es el link; que el atajo cree la alarma se prueba en el
// teléfono (ver el plan, paso 8).
import { describe, it, expect } from 'vitest';
import {
    SHORTCUT_NAME,
    alarmShortcutUrl,
    isIOS,
    nextOccurrence,
    toIsoWithOffset,
} from './alarma.js';

// Las fechas se arman con el huso de quien corre el test; el corrimiento
// esperado se calcula igual en vez de fijar -03:00, que solo valdría en
// Argentina.
function corrimiento(fecha) {
    const min = -fecha.getTimezoneOffset();
    const signo = min >= 0 ? '+' : '-';
    const abs = Math.abs(min);
    return `${signo}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

function textoDelLink(url) {
    return decodeURIComponent(new URL(url).searchParams.get('text'));
}

describe('nextOccurrence', () => {
    it('07:20 pedido a las 06:00 es hoy', () => {
        const ahora = new Date(2026, 10, 9, 6, 0);
        expect(nextOccurrence('07:20', ahora)).toEqual(new Date(2026, 10, 9, 7, 20));
    });

    it('07:20 pedido a las 23:00 es mañana: cruza la medianoche', () => {
        const ahora = new Date(2026, 10, 9, 23, 0);
        expect(nextOccurrence('07:20', ahora)).toEqual(new Date(2026, 10, 10, 7, 20));
    });

    it('la hora de este mismo minuto es mañana, no una alarma en el pasado', () => {
        const ahora = new Date(2026, 10, 9, 23, 0, 30);
        expect(nextOccurrence('23:00', ahora)).toEqual(new Date(2026, 10, 10, 23, 0));
    });

    it('cruza el fin de mes', () => {
        const ahora = new Date(2026, 10, 30, 23, 0);
        expect(nextOccurrence('06:00', ahora)).toEqual(new Date(2026, 11, 1, 6, 0));
    });

    it('una hora que no sirve da null', () => {
        expect(nextOccurrence('', new Date())).toBeNull();
        expect(nextOccurrence('mañana', new Date())).toBeNull();
    });
});

describe('alarmShortcutUrl', () => {
    it('arma el link con el nombre del atajo y el texto en ISO 8601', () => {
        const ahora = new Date(2026, 10, 9, 6, 0);
        const url = alarmShortcutUrl('07:20', ahora);
        expect(
            url.startsWith('shortcuts://run-shortcut?name=Alarma%20Fog%C3%B3n&input=text&text='),
        ).toBe(true);
        expect(textoDelLink(url)).toBe(
            `2026-11-09T07:20:00${corrimiento(new Date(2026, 10, 9, 7, 20))}`,
        );
    });

    it('07:20 pedido a las 23:00 apunta al día siguiente', () => {
        const url = alarmShortcutUrl('07:20', new Date(2026, 10, 9, 23, 0));
        expect(textoDelLink(url)).toBe(
            `2026-11-10T07:20:00${corrimiento(new Date(2026, 10, 10, 7, 20))}`,
        );
    });

    it('el nombre del atajo viaja bien codificado', () => {
        expect(new URL(alarmShortcutUrl('07:20', new Date())).searchParams.get('name')).toBe(
            SHORTCUT_NAME,
        );
    });

    it('el + del corrimiento no se pierde en el link', () => {
        // Un "+" sin codificar se lee como espacio en una query y rompe la fecha.
        expect(alarmShortcutUrl('07:20', new Date(2026, 10, 9, 6, 0))).not.toMatch(/text=[^&]*\+/);
    });

    it('una hora que no sirve da null', () => {
        expect(alarmShortcutUrl('', new Date())).toBeNull();
    });
});

describe('toIsoWithOffset', () => {
    it('termina siempre en un corrimiento de la forma ±HH:MM', () => {
        expect(toIsoWithOffset(new Date(2026, 10, 9, 7, 20))).toMatch(
            /^2026-11-09T07:20:00[+-]\d{2}:\d{2}$/,
        );
    });
});

describe('isIOS', () => {
    it('reconoce un iPhone', () => {
        expect(isIOS({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe(
            true,
        );
    });
    it('reconoce un iPad que se presenta como Mac, por la pantalla táctil', () => {
        expect(
            isIOS({
                userAgent: 'Mozilla/5.0 (Macintosh)',
                platform: 'MacIntel',
                maxTouchPoints: 5,
            }),
        ).toBe(true);
    });
    it('una Mac de verdad no es un iPhone', () => {
        expect(
            isIOS({
                userAgent: 'Mozilla/5.0 (Macintosh)',
                platform: 'MacIntel',
                maxTouchPoints: 0,
            }),
        ).toBe(false);
    });
    it('Android y escritorio tampoco', () => {
        expect(
            isIOS({ userAgent: 'Mozilla/5.0 (Linux; Android 14)', platform: 'Linux armv8l' }),
        ).toBe(false);
        expect(isIOS({})).toBe(false);
    });
});
