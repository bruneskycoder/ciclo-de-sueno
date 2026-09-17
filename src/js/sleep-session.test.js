// sleep-session.test.js — cubre la máquina de estados de la noche (v2):
// a qué noche pertenece un instante, cómo se clasifica lo dormido, qué
// pasa con una noche que quedó abierta, y el cierre.
import { describe, it, expect } from 'vitest';
import {
    SIESTA_MAX_MINUTES,
    STALE_HOURS,
    classifyKind,
    closeSleepSession,
    formatDateKey,
    isStaleOpenSleep,
    isValidOpenSleep,
    nightDateFor,
    onlyNights,
    openSleepFrom,
    recordKind,
    nightToAskAbout,
    hasClockTimes,
    shouldAskAboutNight,
    askShapeFor,
    recalledRecord,
} from './sleep-session.js';

function openSleep(overrides = {}) {
    return {
        date: '2024-01-15',
        bedtimeActual: '23:30',
        startedAt: new Date(2024, 0, 15, 23, 30).toISOString(),
        ...overrides,
    };
}

describe('classifyKind', () => {
    it('trata como siesta lo que dura menos de tres horas', () => {
        expect(classifyKind(20)).toBe('siesta');
        expect(classifyKind(90)).toBe('siesta');
        expect(classifyKind(SIESTA_MAX_MINUTES - 1)).toBe('siesta');
    });

    it('trata como noche tres horas o más', () => {
        expect(classifyKind(SIESTA_MAX_MINUTES)).toBe('noche');
        expect(classifyKind(480)).toBe('noche');
    });
});

describe('recordKind', () => {
    it('lee como noche un registro viejo sin el campo kind', () => {
        expect(recordKind({ date: '2024-01-15', durationMinutes: 60 })).toBe('noche');
    });

    it('respeta el campo cuando está', () => {
        expect(recordKind({ kind: 'siesta' })).toBe('siesta');
        expect(recordKind({ kind: 'noche' })).toBe('noche');
    });

    it('no se rompe con basura', () => {
        expect(recordKind(null)).toBe('noche');
        expect(recordKind({ kind: 'cualquiera' })).toBe('noche');
    });
});

describe('onlyNights', () => {
    it('saca las siestas y deja las noches, incluidas las viejas sin kind', () => {
        const registros = [{ id: 'a', kind: 'noche' }, { id: 'b', kind: 'siesta' }, { id: 'c' }];
        expect(onlyNights(registros).map((r) => r.id)).toEqual(['a', 'c']);
    });
});

describe('formatDateKey', () => {
    it('formatea con ceros a la izquierda', () => {
        expect(formatDateKey(new Date(2024, 0, 5))).toBe('2024-01-05');
        expect(formatDateKey(new Date(2024, 10, 30))).toBe('2024-11-30');
    });
});

describe('nightDateFor', () => {
    it('de noche, la noche es la del mismo día', () => {
        expect(nightDateFor(new Date(2024, 0, 15, 23, 30))).toBe('2024-01-15');
        expect(nightDateFor(new Date(2024, 0, 15, 12, 0))).toBe('2024-01-15');
    });

    it('en la madrugada, la noche sigue siendo la del día anterior', () => {
        expect(nightDateFor(new Date(2024, 0, 16, 0, 30))).toBe('2024-01-15');
        expect(nightDateFor(new Date(2024, 0, 16, 11, 59))).toBe('2024-01-15');
    });

    it('cruza bien el fin de mes y el fin de año', () => {
        expect(nightDateFor(new Date(2024, 1, 1, 2, 0))).toBe('2024-01-31');
        expect(nightDateFor(new Date(2024, 0, 1, 2, 0))).toBe('2023-12-31');
    });
});

describe('openSleepFrom', () => {
    it('arma la noche abierta a partir del reloj, sin pedir datos', () => {
        const abierta = openSleepFrom(new Date(2024, 0, 15, 23, 5));
        expect(abierta.date).toBe('2024-01-15');
        expect(abierta.bedtimeActual).toBe('23:05');
        expect(Date.parse(abierta.startedAt)).not.toBeNaN();
    });

    it('acostarse pasada la medianoche sigue siendo la noche anterior', () => {
        expect(openSleepFrom(new Date(2024, 0, 16, 1, 10)).date).toBe('2024-01-15');
    });
});

describe('isValidOpenSleep', () => {
    it('acepta una noche abierta bien formada', () => {
        expect(isValidOpenSleep(openSleep())).toBe(true);
    });

    it('rechaza lo que no lo es', () => {
        expect(isValidOpenSleep(null)).toBe(false);
        expect(isValidOpenSleep({})).toBe(false);
        expect(isValidOpenSleep(openSleep({ date: '15/01/2024' }))).toBe(false);
        expect(isValidOpenSleep(openSleep({ bedtimeActual: 'tarde' }))).toBe(false);
        expect(isValidOpenSleep(openSleep({ startedAt: 'no-es-fecha' }))).toBe(false);
        expect(isValidOpenSleep(openSleep({ startedAt: 12345 }))).toBe(false);
    });
});

describe('isStaleOpenSleep', () => {
    const inicio = new Date(2024, 0, 15, 23, 0);
    const abierta = openSleep({ startedAt: inicio.toISOString() });

    it('una noche normal no está olvidada', () => {
        expect(isStaleOpenSleep(abierta, new Date(2024, 0, 16, 7, 0))).toBe(false);
    });

    it('justo en el límite todavía no cuenta como olvidada', () => {
        const limite = new Date(inicio.getTime() + STALE_HOURS * 60 * 60 * 1000);
        expect(isStaleOpenSleep(abierta, limite)).toBe(false);
    });

    it('pasado el límite sí', () => {
        expect(isStaleOpenSleep(abierta, new Date(2024, 0, 16, 18, 0))).toBe(true);
    });

    it('una noche abierta inválida nunca está olvidada, está rota', () => {
        expect(isStaleOpenSleep(null, new Date(2024, 0, 20))).toBe(false);
    });
});

describe('closeSleepSession', () => {
    it('cierra una noche normal y la clasifica como noche', () => {
        const res = closeSleepSession({
            open: openSleep({ bedtimeActual: '23:30' }),
            waketimeActual: '07:00',
            cycleMinutes: 90,
        });
        expect(res.ok).toBe(true);
        expect(res.record).toMatchObject({
            date: '2024-01-15',
            bedtimeActual: '23:30',
            waketimeActual: '07:00',
            durationMinutes: 450,
            kind: 'noche',
        });
    });

    it('una siesta corta queda clasificada como siesta', () => {
        const res = closeSleepSession({
            open: openSleep({ date: '2024-01-15', bedtimeActual: '14:00' }),
            waketimeActual: '14:25',
        });
        expect(res.ok).toBe(true);
        expect(res.record.durationMinutes).toBe(25);
        expect(res.record.kind).toBe('siesta');
    });

    it('la fecha que queda es la de la noche, no la del despertar', () => {
        const res = closeSleepSession({
            open: openSleep({ date: '2024-01-15', bedtimeActual: '01:00' }),
            waketimeActual: '09:00',
        });
        expect(res.record.date).toBe('2024-01-15');
    });

    it('falla si no hay una noche abierta válida', () => {
        expect(closeSleepSession({ open: null, waketimeActual: '07:00' })).toEqual({
            ok: false,
            error: 'no-open-sleep',
        });
    });

    it('falla si la hora de despertar no sirve', () => {
        const res = closeSleepSession({ open: openSleep(), waketimeActual: '' });
        expect(res.ok).toBe(false);
        expect(res.error).toBe('missing-waketime');
    });
});

// --- v2: preguntar por anoche ---

describe('nightToAskAbout', () => {
    it('a cualquier hora del día apunta a la última noche ya terminada', () => {
        // Las tres son "el mismo momento de la vida": la noche del 16 ya
        // pasó, la del 17 está por empezar o empezando.
        expect(nightToAskAbout(new Date(2026, 8, 17, 14, 0))).toBe('2026-09-16');
        expect(nightToAskAbout(new Date(2026, 8, 17, 23, 0))).toBe('2026-09-16');
        expect(nightToAskAbout(new Date(2026, 8, 18, 0, 30))).toBe('2026-09-16');
    });

    it('nunca pregunta por la noche que estás por empezar', () => {
        const ahora = new Date(2026, 8, 18, 0, 30);
        expect(nightToAskAbout(ahora)).not.toBe(nightDateFor(ahora));
    });

    it('cruza bien el fin de mes', () => {
        expect(nightToAskAbout(new Date(2026, 9, 1, 23, 0))).toBe('2026-09-30');
        expect(nightToAskAbout(new Date(2026, 9, 1, 2, 0))).toBe('2026-09-29');
    });
});

describe('hasClockTimes', () => {
    it('distingue una noche con horario de una respondida de memoria', () => {
        expect(hasClockTimes({ bedtimeActual: '23:00', waketimeActual: '07:00' })).toBe(true);
        expect(hasClockTimes({ bedtimeActual: null, waketimeActual: null })).toBe(false);
        expect(hasClockTimes(null)).toBe(false);
    });
});

describe('shouldAskAboutNight', () => {
    const now = new Date(2026, 8, 17, 23, 0); // pregunta por 2026-09-16
    const noche = '2026-09-16';

    it('a un desconocido en su primera visita no le pregunta nada', () => {
        expect(shouldAskAboutNight({ records: [], openSleep: null, skipped: [], now })).toBe(false);
    });

    it('pregunta si ya hay historial', () => {
        const records = [{ date: '2026-09-10', kind: 'noche' }];
        expect(shouldAskAboutNight({ records, now })).toBe(true);
    });

    it('pregunta si quedó una noche abierta, aunque no haya historial', () => {
        const openSleep = openSleepFrom(new Date(2026, 8, 16, 23, 30));
        expect(shouldAskAboutNight({ records: [], openSleep, now })).toBe(true);
    });

    it('no pregunta por una noche que ya está anotada', () => {
        const records = [{ date: noche, kind: 'noche' }];
        expect(shouldAskAboutNight({ records, now })).toBe(false);
    });

    it('una siesta de esa fecha no cuenta como la noche anotada', () => {
        const records = [{ date: noche, kind: 'siesta' }];
        expect(shouldAskAboutNight({ records, now })).toBe(true);
    });

    it('no vuelve a preguntar por una noche que ya salteaste', () => {
        const records = [{ date: '2026-09-10', kind: 'noche' }];
        expect(shouldAskAboutNight({ records, skipped: [noche], now })).toBe(false);
    });
});

describe('askShapeFor', () => {
    const now = new Date(2026, 8, 17, 23, 0); // pregunta por 2026-09-16

    it('si anoche marcaste, alcanza con confirmar', () => {
        const openSleep = openSleepFrom(new Date(2026, 8, 16, 23, 30), {
            intendedWaketime: '07:00',
        });
        const forma = askShapeFor({ openSleep, now });
        expect(forma.mode).toBe('confirm');
        expect(forma.night).toBe('2026-09-16');
        expect(forma.open.intendedWaketime).toBe('07:00');
    });

    it('si no marcaste nada, pregunta cuántas horas dormiste', () => {
        expect(askShapeFor({ openSleep: null, now }).mode).toBe('recall');
    });

    it('una noche abierta de OTRA fecha no sirve para confirmar', () => {
        const openSleep = openSleepFrom(new Date(2026, 8, 12, 23, 30));
        expect(askShapeFor({ openSleep, now }).mode).toBe('recall');
    });
});

describe('recalledRecord', () => {
    it('arma el registro sin horario, que es la verdad de lo que se sabe', () => {
        const r = recalledRecord({ night: '2026-09-16', hours: 7, cycleMinutes: 90 });
        expect(r).toEqual({
            date: '2026-09-16',
            bedtimeActual: null,
            waketimeActual: null,
            durationMinutes: 420,
            cyclesCompleted: 5,
            kind: 'noche',
        });
    });

    it('acepta medias horas', () => {
        expect(recalledRecord({ night: '2026-09-16', hours: 6.5 }).durationMinutes).toBe(390);
    });

    it('una respuesta muy corta queda clasificada como siesta', () => {
        expect(recalledRecord({ night: '2026-09-16', hours: 2 }).kind).toBe('siesta');
    });
});
