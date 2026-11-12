import { describe, it, expect } from 'vitest';
import { getTimes } from 'suncalc';
import { alturaDelSol, momentoDelDia, luna } from './cielo.js';

// Referencia: Observatorio Naval de EE.UU., API aa.usno.navy.mil/api/rstt/oneday,
// consultada el 2026-11-12. Horas locales, redondeadas al minuto.
const RESISTENCIA = { lat: -27.46, lon: -58.98, utc: -180 };
const AUCKLAND = { lat: -36.85, lon: 174.76, utc: 720 };

function horaLocal(d, utc) {
    const m = (((d.getUTCHours() * 60 + d.getUTCMinutes() + utc) % 1440) + 1440) % 1440;
    return m;
}
const aMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

const CASOS = [
    { fecha: '2026-12-21T15:00:00Z', lugar: RESISTENCIA, sale: '05:58', pone: '19:51', mediodiaUTC: '2026-12-21T15:00:00Z', ilu: 0.91 },
    { fecha: '2026-06-21T15:00:00Z', lugar: RESISTENCIA, sale: '07:46', pone: '18:10', mediodiaUTC: '2026-06-21T15:00:00Z', ilu: 0.47 },
    { fecha: '2026-03-20T15:00:00Z', lugar: RESISTENCIA, sale: '06:59', pone: '19:07', mediodiaUTC: '2026-03-20T15:00:00Z', ilu: 0.03 },
    { fecha: '2026-06-21T00:00:00Z', lugar: AUCKLAND, sale: '07:34', pone: '17:12', mediodiaUTC: '2026-06-21T00:00:00Z', ilu: 0.41 },
];

describe('sol: amanecer y atardecer contra el Observatorio Naval de EE.UU.', () => {
    it.each(CASOS)('$fecha en $lugar.lat', ({ fecha, lugar, sale, pone }) => {
        const t = getTimes(new Date(fecha), lugar.lat, lugar.lon, 0, lugar.utc);
        expect(Math.abs(horaLocal(t.sunrise, lugar.utc) - aMin(sale))).toBeLessThanOrEqual(2);
        expect(Math.abs(horaLocal(t.sunset, lugar.utc) - aMin(pone))).toBeLessThanOrEqual(2);
    });
});

describe('luna: fracción iluminada contra el Observatorio Naval de EE.UU.', () => {
    it.each(CASOS)('$fecha en $lugar.lat', ({ mediodiaUTC, lugar, ilu }) => {
        const l = luna(new Date(mediodiaUTC), lugar.lat, lugar.lon);
        expect(Math.abs(l.fraccion - ilu)).toBeLessThan(0.02);
    });
});

describe('luna: sobre el horizonte', () => {
    // 21-dic-2026, Resistencia (USNO): sale 17:32, culmina 22:49, se pone 03:10.
    it('está arriba a las 22:49 y abajo a las 08:00', () => {
        expect(luna(new Date('2026-12-22T01:49:00Z'), -27.46, -58.98).visible).toBe(true);
        expect(luna(new Date('2026-12-21T11:00:00Z'), -27.46, -58.98).visible).toBe(false);
    });
    it('creciente antes de la llena y menguante después', () => {
        expect(luna(new Date('2026-12-21T15:00:00Z'), -27.46, -58.98).creciente).toBe(true);
        expect(luna(new Date('2026-12-30T15:00:00Z'), -27.46, -58.98).creciente).toBe(false);
    });
});

describe('momentoDelDia', () => {
    const { lat, lon } = RESISTENCIA;
    it('mediodía es día', () => {
        const m = momentoDelDia(new Date('2026-12-21T15:30:00Z'), lat, lon);
        expect(m.momento).toBe('dia');
        expect(m.luz).toBe(1);
    });
    it('medianoche es noche, con luz 0', () => {
        const m = momentoDelDia(new Date('2026-12-21T03:00:00Z'), lat, lon);
        expect(m.momento).toBe('noche');
        expect(m.luz).toBe(0);
    });
    it('a la puesta del sol es atardecer, y a la salida, amanecer', () => {
        expect(momentoDelDia(new Date('2026-12-21T22:51:00Z'), lat, lon).momento).toBe('atardecer');
        expect(momentoDelDia(new Date('2026-12-21T08:58:00Z'), lat, lon).momento).toBe('amanecer');
    });
    it('en invierno oscurece antes: a las 19:00 de junio ya es noche, en diciembre no', () => {
        expect(momentoDelDia(new Date('2026-06-21T22:30:00Z'), lat, lon).momento).toBe('noche');
        expect(momentoDelDia(new Date('2026-12-21T22:00:00Z'), lat, lon).momento).not.toBe('noche');
    });
    it('la luz crece de forma continua de noche a día', () => {
        let previa = -1;
        for (let m = 5 * 60; m <= 8 * 60; m += 5) {
            const f = new Date(Date.UTC(2026, 11, 21, 0, 0) + (m + 180) * 60000);
            const { luz } = momentoDelDia(f, lat, lon);
            expect(luz).toBeGreaterThanOrEqual(previa);
            previa = luz;
        }
    });
});

describe('alturaDelSol', () => {
    it('al sol de mediodía de diciembre en Resistencia le faltan unos 4° para el cenit', () => {
        // Latitud 27,5°S, declinación -23,4°: altura máxima 90 - 4,1 = 85,9°.
        expect(alturaDelSol(new Date('2026-12-21T15:54:00Z'), -27.46, -58.98)).toBeGreaterThan(85);
    });
});
