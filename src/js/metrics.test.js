import { describe, it, expect } from 'vitest';
import { summarize, weeklySummary, monthlySummary, recordsInWindow } from './metrics.js';

const REF = new Date(2024, 0, 15); // lunes 15 de enero de 2024

function record({ date, bedtimeActual, waketimeActual, durationMinutes, quality = null }) {
    return { id: date, date, bedtimeActual, waketimeActual, durationMinutes, cyclesCompleted: 0, quality, notes: '' };
}

describe('summarize — casos borde', () => {
    it('sin datos: todo en null/0, no explota', () => {
        const r = summarize([]);
        expect(r).toEqual({
            count: 0,
            avgDurationMinutes: null,
            avgQuality: null,
            bedtimeConsistencyMinutes: null,
            waketimeConsistencyMinutes: null,
        });
    });

    it('un solo dato: el promedio es ese dato, la consistencia es null (no hay variación que medir)', () => {
        const r = summarize([record({ date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480, quality: 4 })]);
        expect(r.count).toBe(1);
        expect(r.avgDurationMinutes).toBe(480);
        expect(r.avgQuality).toBe(4);
        expect(r.bedtimeConsistencyMinutes).toBeNull();
        expect(r.waketimeConsistencyMinutes).toBeNull();
    });

    it('calidad sin cargar en ningún registro: avgQuality es null, no 0', () => {
        const r = summarize([
            record({ date: '2024-01-13', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }),
            record({ date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }),
        ]);
        expect(r.avgQuality).toBeNull();
    });

    it('promedia calidad solo sobre los registros que sí la tienen cargada', () => {
        const r = summarize([
            record({ date: '2024-01-13', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480, quality: 2 }),
            record({ date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }), // sin calificar
            record({ date: '2024-01-15', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480, quality: 4 }),
        ]);
        expect(r.avgQuality).toBe(3); // (2+4)/2, el sin calificar no cuenta
    });
});

describe('summarize — promedio de duración', () => {
    it('promedia horas dormidas entre varios registros', () => {
        const r = summarize([
            record({ date: '2024-01-13', bedtimeActual: '23:00', waketimeActual: '06:00', durationMinutes: 420 }),
            record({ date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '08:00', durationMinutes: 540 }),
        ]);
        expect(r.avgDurationMinutes).toBe(480);
    });
});

describe('summarize — consistencia de horario', () => {
    it('horarios idénticos dan consistencia 0', () => {
        const r = summarize([
            record({ date: '2024-01-13', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }),
            record({ date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }),
        ]);
        expect(r.bedtimeConsistencyMinutes).toBe(0);
        expect(r.waketimeConsistencyMinutes).toBe(0);
    });

    it('el cruce de medianoche no infla artificialmente la inconsistencia (23:50 vs 00:10 son 20 min, no ~1430)', () => {
        const r = summarize([
            record({ date: '2024-01-13', bedtimeActual: '23:50', waketimeActual: '07:00', durationMinutes: 430 }),
            record({ date: '2024-01-14', bedtimeActual: '00:10', waketimeActual: '07:00', durationMinutes: 410 }),
        ]);
        // Con 2 puntos, stddev poblacional = mitad de la diferencia absoluta.
        expect(r.bedtimeConsistencyMinutes).toBeCloseTo(10, 5); // |20|/2
    });

    it('horarios más dispersos dan un desvío mayor que horarios apretados', () => {
        const consistente = summarize([
            record({ date: '2024-01-11', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }),
            record({ date: '2024-01-12', bedtimeActual: '23:05', waketimeActual: '07:00', durationMinutes: 475 }),
            record({ date: '2024-01-13', bedtimeActual: '22:55', waketimeActual: '07:00', durationMinutes: 485 }),
        ]);
        const disperso = summarize([
            record({ date: '2024-01-11', bedtimeActual: '21:00', waketimeActual: '07:00', durationMinutes: 600 }),
            record({ date: '2024-01-12', bedtimeActual: '23:30', waketimeActual: '07:00', durationMinutes: 450 }),
            record({ date: '2024-01-13', bedtimeActual: '01:30', waketimeActual: '07:00', durationMinutes: 330 }),
        ]);
        expect(disperso.bedtimeConsistencyMinutes).toBeGreaterThan(consistente.bedtimeConsistencyMinutes);
    });
});

describe('recordsInWindow — ventana de días con huecos', () => {
    const records = [
        record({ date: '2023-12-01', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }), // muy viejo
        record({ date: '2024-01-01', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }), // dentro del mes, fuera de la semana
        record({ date: '2024-01-14', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }), // ayer
        record({ date: '2024-01-15', bedtimeActual: '23:00', waketimeActual: '07:00', durationMinutes: 480 }), // hoy (referenceDate)
    ];

    it('la ventana semanal excluye registros de hace más de 7 días (respeta huecos)', () => {
        const r = recordsInWindow(records, 7, REF);
        expect(r.map((x) => x.date)).toEqual(['2024-01-14', '2024-01-15']);
    });

    it('la ventana mensual incluye más historial pero sigue excluyendo lo muy viejo', () => {
        const r = recordsInWindow(records, 30, REF);
        expect(r.map((x) => x.date)).toEqual(['2024-01-01', '2024-01-14', '2024-01-15']);
    });

    it('weeklySummary/monthlySummary devuelven distintos "count" para el mismo dataset', () => {
        expect(weeklySummary(records, REF).count).toBe(2);
        expect(monthlySummary(records, REF).count).toBe(3);
    });

    it('el propio referenceDate cuenta como incluido (inclusive en ambas puntas)', () => {
        const r = recordsInWindow(records, 1, REF);
        expect(r.map((x) => x.date)).toEqual(['2024-01-15']);
    });
});
