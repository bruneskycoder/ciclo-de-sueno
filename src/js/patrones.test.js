// patrones.test.js — los patrones del cuaderno: por debajo y por encima
// del piso de 5 noches, el jet lag contra un ejemplo calculado a mano, y
// el corte por cambio de zona horaria.
import { describe, it, expect } from 'vitest';
import {
    PISO_NOCHES,
    analyzePatterns,
    bedtimeVsWakeFeeling,
    frequentReasons,
    regularity,
    sameZoneRun,
    sleepMidpoint,
    socialJetLag,
} from './patrones.js';

function noche(date, bedtimeActual, durationMinutes, extra = {}) {
    return {
        date,
        bedtimeActual,
        waketimeActual: '07:00',
        durationMinutes,
        kind: 'noche',
        ...extra,
    };
}

describe('punto medio de la noche', () => {
    it('23:00 y 8 horas dan las 03:00 (1620 min corridos)', () => {
        expect(sleepMidpoint(noche('2026-11-01', '23:00', 480))).toBe(1620);
    });
    it('00:30 y 8 horas dan las 04:30 del día siguiente (1710 min corridos)', () => {
        expect(sleepMidpoint(noche('2026-11-06', '00:30', 480))).toBe(1710);
    });
});

describe('jet lag social', () => {
    // Cuenta a mano. Noches de domingo a jueves (1 al 5 de noviembre de
    // 2026), tres a las 23:00 y dos a las 23:30, todas de 8 horas:
    //   puntos medios 1620, 1620, 1620, 1650, 1650 → promedio 1632.
    // Noches de viernes y sábado (6, 7, 13, 14 y 20), todas a las 00:30 de
    // 8 horas: punto medio 1710 → promedio 1710.
    // Diferencia: 1710 − 1632 = 78 minutos.
    const resto = [
        noche('2026-11-01', '23:00', 480),
        noche('2026-11-02', '23:00', 480),
        noche('2026-11-03', '23:00', 480),
        noche('2026-11-04', '23:30', 480),
        noche('2026-11-05', '23:30', 480),
    ];
    const libres = ['2026-11-06', '2026-11-07', '2026-11-13', '2026-11-14', '2026-11-20'].map((d) =>
        noche(d, '00:30', 480),
    );

    it('los días elegidos caen donde se dice', () => {
        // Si una fecha del ejemplo cayera en otro día de la semana, la
        // cuenta de arriba no valdría.
        libres.forEach((r) => expect([5, 6]).toContain(new Date(`${r.date}T00:00:00`).getDay()));
        resto.forEach((r) => expect([5, 6]).not.toContain(new Date(`${r.date}T00:00:00`).getDay()));
    });

    it('da 78 minutos, igual que la cuenta a mano', () => {
        const res = socialJetLag([...resto, ...libres]);
        expect(res.enough).toBe(true);
        expect(res.minutes).toBe(78);
        expect(res.weekendNights).toBe(5);
        expect(res.otherNights).toBe(5);
    });

    it('con 4 noches de fin de semana todavía no alcanza, y dice cuántas faltan', () => {
        const res = socialJetLag([...resto, ...libres.slice(0, 4)]);
        expect(res.enough).toBe(false);
        expect(res.missingWeekend).toBe(1);
        expect(res.missingOther).toBe(0);
    });

    it('las noches de memoria sin horario no entran', () => {
        const sinHorario = libres.map((r) => ({ ...r, bedtimeActual: null, waketimeActual: null }));
        const res = socialJetLag([...resto, ...sinHorario]);
        expect(res.enough).toBe(false);
        expect(res.missingWeekend).toBe(5);
    });

    it('un jet lag negativo es posible: dormir más temprano el fin de semana', () => {
        const temprano = libres.map((r) => ({ ...r, bedtimeActual: '22:00' }));
        expect(socialJetLag([...resto, ...temprano]).minutes).toBeLessThan(0);
    });
});

describe('regularidad', () => {
    it('por debajo del piso no muestra número', () => {
        const noches = Array.from({ length: PISO_NOCHES - 1 }, (_, i) =>
            noche(`2026-11-0${i + 1}`, '23:00', 480),
        );
        expect(regularity(noches)).toEqual({ nights: 4, enough: false, missing: 1 });
    });

    it('con el mismo horario todas las noches el desvío es 0', () => {
        const noches = Array.from({ length: 5 }, (_, i) =>
            noche(`2026-11-0${i + 1}`, '23:00', 480),
        );
        expect(regularity(noches)).toEqual({ nights: 5, enough: true, sdMinutes: 0 });
    });

    it('mide el punto medio, no la hora de acostarse sola', () => {
        // Se acuesta siempre a las 23:00, pero duerme 6 u 8 horas
        // alternadas: la hora de acostarse es perfecta y el punto medio se
        // corre una hora entera entre una noche y otra.
        const noches = [
            noche('2026-11-01', '23:00', 480),
            noche('2026-11-02', '23:00', 360),
            noche('2026-11-03', '23:00', 480),
            noche('2026-11-04', '23:00', 360),
            noche('2026-11-05', '23:00', 480),
        ];
        // Puntos medios 1620, 1560, 1620, 1560, 1620 → media 1596, desvío 29,4
        expect(regularity(noches).sdMinutes).toBe(29);
    });

    it('cruza la medianoche sin inflar el desvío', () => {
        const noches = ['23:50', '00:10', '23:55', '00:05', '00:00'].map((h, i) =>
            noche(`2026-11-0${i + 1}`, h, 480),
        );
        expect(regularity(noches).sdMinutes).toBeLessThan(10);
    });
});

describe('hora de acostarse contra cómo te levantaste', () => {
    const conCalidad = (date, bedtimeActual, quality) =>
        noche(date, bedtimeActual, 450, { quality });

    it('cuenta cuántas veces te levantaste bien en cada grupo', () => {
        const antes = [5, 5, 5, 3, 1, 5].map((q, i) => conCalidad(`2026-11-0${i + 1}`, '23:15', q));
        const despues = [1, 3, 3, 5, 1].map((q, i) => conCalidad(`2026-11-1${i}`, '00:40', q));
        const res = bedtimeVsWakeFeeling([...antes, ...despues]);
        expect(res.enough).toBe(true);
        expect(res.before).toEqual({ total: 6, bien: 4 });
        expect(res.after).toEqual({ total: 5, bien: 1 });
    });

    it('si un grupo no llega al piso, dice cuántas faltan', () => {
        const antes = [5, 5, 5, 3, 1].map((q, i) => conCalidad(`2026-11-0${i + 1}`, '23:15', q));
        const despues = [1, 3].map((q, i) => conCalidad(`2026-11-1${i}`, '00:40', q));
        const res = bedtimeVsWakeFeeling([...antes, ...despues]);
        expect(res.enough).toBe(false);
        expect(res.missingBefore).toBe(0);
        expect(res.missingAfter).toBe(3);
    });

    it('las noches sin la pregunta contestada no cuentan', () => {
        const sinContestar = Array.from({ length: 10 }, (_, i) =>
            noche(`2026-11-0${i}`, '23:00', 450),
        );
        expect(bedtimeVsWakeFeeling(sinContestar).nights).toBe(0);
    });
});

describe('motivos más frecuentes', () => {
    it('por debajo del piso no cuenta', () => {
        const res = frequentReasons([
            noche('2026-11-01', '23:00', 450, { quality: 3, reasons: ['dolor'] }),
        ]);
        expect(res).toEqual({ nights: 1, enough: false, missing: 4 });
    });

    it('ordena de más a menos frecuente y dice sobre cuántas noches', () => {
        const base = (i, reasons) => noche(`2026-11-0${i}`, '23:00', 450, { quality: 3, reasons });
        const res = frequentReasons([
            base(1, ['costo-dormirme', 'dolor']),
            base(2, ['costo-dormirme']),
            base(3, ['costo-dormirme', 'desperte-antes']),
            base(4, []),
            base(5, ['desperte-antes']),
        ]);
        expect(res.enough).toBe(true);
        expect(res.nights).toBe(5);
        expect(res.items).toEqual([
            { id: 'costo-dormirme', count: 3 },
            { id: 'desperte-antes', count: 2 },
            { id: 'dolor', count: 1 },
        ]);
    });
});

describe('cambio de zona horaria', () => {
    const enZona = (date, tz) => noche(date, '23:00', 480, { tz });

    it('corta la ventana en la primera noche de otra zona', () => {
        const registros = [
            enZona('2026-11-01', 'America/Argentina/Cordoba'),
            enZona('2026-11-02', 'America/Argentina/Cordoba'),
            enZona('2026-11-10', 'Pacific/Auckland'),
            enZona('2026-11-11', 'Pacific/Auckland'),
        ];
        const res = sameZoneRun(registros);
        expect(res.changed).toBe(true);
        expect(res.records.map((r) => r.date)).toEqual(['2026-11-11', '2026-11-10']);
    });

    it('si nunca cambió, no corta nada', () => {
        const registros = [enZona('2026-11-01', 'A/B'), enZona('2026-11-02', 'A/B')];
        expect(sameZoneRun(registros)).toMatchObject({ changed: false });
        expect(sameZoneRun(registros).records).toHaveLength(2);
    });

    it('los registros viejos, sin zona, se tratan como de la misma zona', () => {
        const registros = [noche('2026-10-01', '23:00', 480), enZona('2026-11-02', 'A/B')];
        expect(sameZoneRun(registros)).toMatchObject({ changed: false });
        expect(sameZoneRun(registros).records).toHaveLength(2);
    });

    it('analyzePatterns solo compara las noches de la zona vigente', () => {
        const casa = Array.from({ length: 6 }, (_, i) =>
            enZona(`2026-11-0${i + 1}`, 'America/Argentina/Cordoba'),
        );
        const viaje = [
            enZona('2026-11-09', 'Pacific/Auckland'),
            enZona('2026-11-10', 'Pacific/Auckland'),
        ];
        const res = analyzePatterns([...casa, ...viaje], new Date(2026, 10, 11));
        expect(res.zone).toEqual({ changed: true, nights: 2 });
        expect(res.regularity.enough).toBe(false);
        expect(res.regularity.nights).toBe(2);
    });
});

describe('analyzePatterns', () => {
    it('sin datos todo dice que todavía no alcanza, y nada revienta', () => {
        const res = analyzePatterns([], new Date(2026, 10, 11));
        expect(res.jetLag.enough).toBe(false);
        expect(res.regularity.enough).toBe(false);
        expect(res.bedtimeVsWake.enough).toBe(false);
        expect(res.reasons.enough).toBe(false);
    });

    it('las siestas no entran en ningún patrón', () => {
        const siestas = Array.from({ length: 8 }, (_, i) => ({
            ...noche(`2026-11-0${i + 1}`, '15:00', 25),
            kind: 'siesta',
        }));
        expect(analyzePatterns(siestas, new Date(2026, 10, 11)).regularity.nights).toBe(0);
    });
});
