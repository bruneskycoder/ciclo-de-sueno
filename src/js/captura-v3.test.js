// captura-v3.test.js — lo que cambió en la captura de la v3. Casos
// sintéticos que reproducen los dos registros imposibles de los datos
// reales (el backup real no entra al repo: es público y tiene notas
// personales). Archivo aparte para no tocar los tests de la v2.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    MAX_SLEEP_MINUTES,
    askShapeWithStale,
    closeSleepSession,
    gapNights,
    isPlausibleDuration,
    isStaleOpenSleep,
    openSleepFrom,
    recalledNightRecord,
    shouldAskAboutNight,
} from './sleep-session.js';
import {
    aroundPlanned,
    clockOptions,
    roundClock,
    usualClock,
    wakeOptionsFor,
} from './horas-sugeridas.js';
import { importData, normalizeImportedRecords, validateImportPayload } from './storage.js';

// --- Paso 1 y 2: la noche olvidada y la duración por marcas de tiempo ---

describe('las dos noches imposibles de los datos reales', () => {
    // 23:20 del 23-oct, cerrada el 5-nov a las 22:50: figuraba de 23h 30m.
    const olvidada1 = openSleepFrom(new Date(2026, 9, 23, 23, 20));
    const cierre1 = new Date(2026, 10, 5, 22, 50);
    // 23:10 del 22-sep, cerrada el 24-sep a las 23:32: figuraba como siesta de 22m.
    const olvidada2 = openSleepFrom(new Date(2026, 8, 22, 23, 10));
    const cierre2 = new Date(2026, 8, 24, 23, 32);

    it('las dos están olvidadas: llevan más de 16 horas abiertas', () => {
        expect(isStaleOpenSleep(olvidada1, cierre1)).toBe(true);
        expect(isStaleOpenSleep(olvidada2, cierre2)).toBe(true);
    });

    it('cerrarlas en vivo no genera un registro: se rechaza el cierre', () => {
        expect(closeSleepSession({ open: olvidada1, closedAt: cierre1 })).toEqual({
            ok: false,
            error: 'too-long',
        });
        expect(closeSleepSession({ open: olvidada2, closedAt: cierre2 })).toEqual({
            ok: false,
            error: 'too-long',
        });
    });

    it('elegir una hora que da 23h 30m tampoco las convierte en registro', () => {
        const res = closeSleepSession({ open: olvidada1, waketimeActual: '22:50' });
        expect(res).toEqual({ ok: false, error: 'too-long' });
    });

    it('una noche normal cerrada en vivo sale de las marcas de tiempo', () => {
        const abierta = openSleepFrom(new Date(2026, 10, 3, 23, 30));
        const res = closeSleepSession({ open: abierta, closedAt: new Date(2026, 10, 4, 7, 10) });
        expect(res.ok).toBe(true);
        expect(res.record).toMatchObject({
            date: '2026-11-03',
            bedtimeActual: '23:30',
            waketimeActual: '07:10',
            durationMinutes: 460,
            kind: 'noche',
            source: 'live',
        });
    });

    it('cerrar en vivo dos veces seguidas no da 24 horas: da error', () => {
        // Con horas de reloj, "mismo minuto" se leía como 24h completas.
        const abierta = openSleepFrom(new Date(2026, 10, 3, 23, 30, 5));
        const res = closeSleepSession({
            open: abierta,
            closedAt: new Date(2026, 10, 3, 23, 30, 20),
        });
        expect(res).toEqual({ ok: false, error: 'too-short' });
    });

    it('una hora elegida marca el registro como confirmado', () => {
        const abierta = openSleepFrom(new Date(2026, 10, 3, 23, 30));
        const res = closeSleepSession({ open: abierta, waketimeActual: '07:20' });
        expect(res.record.source).toBe('confirmed');
        expect(res.record.durationMinutes).toBe(470);
    });
});

describe('el techo de 16 horas', () => {
    it('acepta hasta 16 horas justas y rechaza un minuto más', () => {
        expect(MAX_SLEEP_MINUTES).toBe(960);
        expect(isPlausibleDuration(960)).toBe(true);
        expect(isPlausibleDuration(961)).toBe(false);
        expect(isPlausibleDuration(-1)).toBe(false);
        expect(isPlausibleDuration('480')).toBe(false);
    });

    it('un backup con un registro de 1410 minutos se rechaza entero', () => {
        const bueno = {
            id: 'a',
            date: '2026-11-01',
            bedtimeActual: '23:00',
            waketimeActual: '07:00',
            durationMinutes: 480,
        };
        const imposible = {
            ...bueno,
            id: 'b',
            date: '2026-10-23',
            bedtimeActual: '23:20',
            waketimeActual: '22:50',
            durationMinutes: 1410,
        };
        expect(validateImportPayload({ records: [bueno] })).toBe(true);
        expect(validateImportPayload({ records: [bueno, imposible] })).toBe(false);
    });
});

describe('importData con un archivo imposible', () => {
    let guardado;
    beforeEach(() => {
        guardado = {};
        vi.stubGlobal('localStorage', {
            getItem: (k) => (k in guardado ? guardado[k] : null),
            setItem: (k, v) => {
                guardado[k] = String(v);
            },
            removeItem: (k) => {
                delete guardado[k];
            },
        });
    });

    it('dice que hay una noche de más de 16 horas y no toca nada', () => {
        const data = {
            records: [
                {
                    id: 'b',
                    date: '2026-10-23',
                    bedtimeActual: '23:20',
                    waketimeActual: '22:50',
                    durationMinutes: 1410,
                },
            ],
        };
        expect(importData(data, { mode: 'replace' })).toEqual({ ok: false, error: 'too-long' });
        expect(guardado.sleepLogReal).toBeUndefined();
    });

    it('un archivo roto por otra causa sigue siendo invalid-shape', () => {
        expect(importData({ records: [{ date: 'mal' }] }, { mode: 'merge' })).toEqual({
            ok: false,
            error: 'invalid-shape',
        });
    });
});

describe('la noche olvidada en la tarjeta', () => {
    const olvidada = openSleepFrom(new Date(2026, 9, 23, 23, 20));
    const ahora = new Date(2026, 10, 5, 22, 50);

    it('se pregunta por ella aunque no sea anoche', () => {
        expect(shouldAskAboutNight({ openSleep: olvidada, now: ahora })).toBe(true);
        expect(askShapeWithStale({ openSleep: olvidada, now: ahora })).toMatchObject({
            mode: 'stale',
            night: '2026-10-23',
        });
    });

    it('si ya la salteaste, no insiste con esa (ni con anoche, si también la salteaste)', () => {
        const saltadas = ['2026-10-23', '2026-11-04'];
        expect(shouldAskAboutNight({ openSleep: olvidada, skipped: saltadas, now: ahora })).toBe(
            false,
        );
    });

    it('una noche abierta de anoche, vista al mediodía, sigue siendo confirm', () => {
        // Abierta a las 23:30 y vista a las 13:00: 13h 30m, todavía no pasa
        // el techo. A las 15:30 pasa a olvidada: el límite de 16 horas cae
        // en la tarde del día siguiente, así que "olvidada" es también el
        // camino normal de quien abre la app recién de noche.
        const reciente = openSleepFrom(new Date(2026, 10, 4, 23, 30));
        const ya = new Date(2026, 10, 5, 13, 0);
        expect(askShapeWithStale({ openSleep: reciente, now: ya })).toMatchObject({
            mode: 'confirm',
            night: '2026-11-04',
        });
    });

    it('con una noche forzada (un hueco del cuaderno) pregunta por esa', () => {
        expect(askShapeWithStale({ openSleep: null, now: ahora, night: '2026-11-01' })).toEqual({
            mode: 'recall',
            night: '2026-11-01',
        });
    });
});

// --- Paso 3: campos nuevos, con backups de la v2 ---

describe('campos nuevos y backups de la v2', () => {
    const v2 = {
        id: 'x1',
        date: '2026-09-20',
        bedtimeActual: '23:30',
        waketimeActual: '07:00',
        durationMinutes: 450,
        cyclesCompleted: 5,
        kind: 'noche',
        quality: null,
        notes: '',
    };

    it('un registro de la v2 se importa igual, con los campos nuevos vacíos', () => {
        expect(validateImportPayload({ version: 1, records: [v2] })).toBe(true);
        expect(normalizeImportedRecords([v2])[0]).toMatchObject({
            reasons: [],
            source: null,
            tz: null,
        });
    });

    it('conserva los campos nuevos y descarta lo que no está en la lista', () => {
        const [r] = normalizeImportedRecords([
            {
                ...v2,
                quality: 3,
                reasons: ['dolor', 'inventado', 7],
                source: 'live',
                tz: 'America/Argentina/Cordoba',
            },
        ]);
        expect(r).toMatchObject({
            quality: 3,
            reasons: ['dolor'],
            source: 'live',
            tz: 'America/Argentina/Cordoba',
        });
    });

    it('descarta una calidad fuera de 1 a 5 o que no es entera', () => {
        expect(normalizeImportedRecords([{ ...v2, quality: 9 }])[0].quality).toBeNull();
        expect(normalizeImportedRecords([{ ...v2, quality: 2.5 }])[0].quality).toBeNull();
        expect(normalizeImportedRecords([{ ...v2, quality: '4' }])[0].quality).toBeNull();
        // La v2 guardaba la escala completa: 4 sigue valiendo.
        expect(normalizeImportedRecords([{ ...v2, quality: 4 }])[0].quality).toBe(4);
    });

    it('un export con los campos nuevos vuelve a importarse sin pérdida', () => {
        const nuevo = {
            ...v2,
            quality: 5,
            reasons: ['costo-dormirme'],
            source: 'confirmed',
            tz: 'Pacific/Auckland',
        };
        expect(normalizeImportedRecords([nuevo])[0]).toMatchObject({
            quality: 5,
            reasons: ['costo-dormirme'],
            source: 'confirmed',
            tz: 'Pacific/Auckland',
        });
    });
});

// --- Paso 4: memoria con horario ---

describe('recalledNightRecord', () => {
    it('arma la noche con las dos horas y la marca como de memoria', () => {
        const res = recalledNightRecord({
            night: '2026-11-03',
            bedtimeActual: '23:30',
            waketimeActual: '07:00',
        });
        expect(res.ok).toBe(true);
        expect(res.record).toMatchObject({
            date: '2026-11-03',
            bedtimeActual: '23:30',
            waketimeActual: '07:00',
            durationMinutes: 450,
            kind: 'noche',
            source: 'recalled',
        });
    });

    it('cubre el caso del 27-sep: acostarse a las 3 de la mañana', () => {
        const res = recalledNightRecord({
            night: '2026-09-27',
            bedtimeActual: '03:00',
            waketimeActual: '10:30',
        });
        expect(res.record.durationMinutes).toBe(450);
    });

    it('rechaza lo que pasa de 16 horas', () => {
        // 08:00 a 07:00 son 23h: cualquier hora de reloj da menos de 24h,
        // pero esta pasa el techo.
        const res = recalledNightRecord({
            night: '2026-11-03',
            bedtimeActual: '08:00',
            waketimeActual: '07:00',
        });
        expect(res).toEqual({ ok: false, error: 'too-long' });
    });

    it('falla si falta una hora', () => {
        expect(
            recalledNightRecord({ night: '2026-11-03', bedtimeActual: '23:00', waketimeActual: '' })
                .ok,
        ).toBe(false);
    });
});

describe('horas sugeridas', () => {
    const noche = (date, bedtimeActual, waketimeActual) => ({
        date,
        bedtimeActual,
        waketimeActual,
        durationMinutes: 480,
        kind: 'noche',
    });

    it('sin datos usa 23:00 y 07:00', () => {
        expect(usualClock([], 'bedtimeActual')).toBe('23:00');
        expect(usualClock([], 'waketimeActual')).toBe('07:00');
    });

    it('las noches de memoria sin horario no cuentan', () => {
        const sinHorario = {
            date: '2026-11-01',
            bedtimeActual: null,
            waketimeActual: null,
            durationMinutes: 420,
        };
        expect(usualClock([sinHorario], 'bedtimeActual')).toBe('23:00');
    });

    it('la mediana de lo anotado, redondeada a media hora', () => {
        const registros = [
            noche('2026-11-01', '23:20', '06:50'),
            noche('2026-11-02', '23:40', '07:20'),
            noche('2026-11-03', '23:30', '07:00'),
        ];
        expect(usualClock(registros, 'bedtimeActual')).toBe('23:30');
        expect(usualClock(registros, 'waketimeActual')).toBe('07:00');
    });

    it('cruza la medianoche sin romperse: 23:50, 00:10 y 00:30 dan 00:00', () => {
        const registros = [
            noche('2026-11-01', '23:50', '07:00'),
            noche('2026-11-02', '00:10', '07:00'),
            noche('2026-11-03', '00:30', '07:00'),
        ];
        expect(usualClock(registros, 'bedtimeActual')).toBe('00:00');
    });

    it('ignora las siestas', () => {
        const siesta = { ...noche('2026-11-01', '15:00', '15:30'), kind: 'siesta' };
        expect(usualClock([siesta], 'bedtimeActual')).toBe('23:00');
    });

    it('ofrece cinco horas de media en media hora, cruzando la medianoche', () => {
        expect(clockOptions('23:00')).toEqual(['22:00', '22:30', '23:00', '23:30', '00:00']);
        expect(clockOptions('00:00')).toEqual(['23:00', '23:30', '00:00', '00:30', '01:00']);
    });

    it('la confirmación ofrece una antes, la planeada y una después, sin redondear', () => {
        expect(aroundPlanned('07:20')).toEqual(['06:50', '07:20', '07:50']);
        expect(aroundPlanned('00:10')).toEqual(['23:40', '00:10', '00:40']);
    });

    it('wakeOptionsFor centra en la hora de levantarse de siempre', () => {
        expect(wakeOptionsFor([])).toEqual(['06:00', '06:30', '07:00', '07:30', '08:00']);
    });

    it('roundClock redondea al paso más cercano', () => {
        expect(roundClock('23:10')).toBe('23:00');
        expect(roundClock('23:20')).toBe('23:30');
        expect(roundClock('23:50')).toBe('00:00');
    });
});

// --- Paso 7: huecos ---

describe('gapNights', () => {
    // Martes 10-nov a las 14:00: la última noche terminada es la del
    // lunes 9 (se levantó esta mañana); la del martes 10 todavía no empezó.
    // Los 7 días son del 3 al 9.
    const ahora = new Date(2026, 10, 10, 14, 0);
    const noche = (date) => ({ date, kind: 'noche', durationMinutes: 450 });

    it('lista las noches de los últimos 7 días que no tienen registro', () => {
        const registros = [noche('2026-11-08'), noche('2026-11-05'), noche('2026-11-02')];
        expect(gapNights({ records: registros, now: ahora })).toEqual([
            '2026-11-09',
            '2026-11-07',
            '2026-11-06',
            '2026-11-04',
            '2026-11-03',
        ]);
    });

    it('una siesta no tapa el hueco de esa noche', () => {
        const siesta = { date: '2026-11-07', kind: 'siesta', durationMinutes: 25 };
        const registros = [noche('2026-11-08'), noche('2026-11-06'), siesta];
        expect(gapNights({ records: registros, now: ahora })).toContain('2026-11-07');
    });

    it('no cuenta las noches anteriores al primer uso de la app', () => {
        // Un registro de la noche del 8 y nada más: no hay "Sin anotar"
        // antes de esa fecha, solo la noche del 9, que sí pasó sin anotar.
        expect(gapNights({ records: [noche('2026-11-08')], now: ahora })).toEqual(['2026-11-09']);
    });

    it('sin ningún rastro de uso no hay huecos', () => {
        expect(gapNights({ records: [], now: ahora })).toEqual([]);
    });

    it('la noche que está abierta no es un hueco', () => {
        const abierta = openSleepFrom(new Date(2026, 10, 7, 23, 30));
        const registros = [noche('2026-11-08'), noche('2026-11-05')];
        expect(gapNights({ records: registros, openSleep: abierta, now: ahora })).toEqual([
            '2026-11-09',
            '2026-11-06',
        ]);
    });

    it('mira solo los últimos 7 días', () => {
        const registros = [noche('2026-11-08'), noche('2026-10-01')];
        // Solo la noche del 9 y las 5 que quedan entre el 3 y el 7 sin registro.
        expect(gapNights({ records: registros, now: ahora })).toHaveLength(6);
    });
});
