import { describe, it, expect } from 'vitest';
import { calcularCiclos, clampLatency, formatTime } from './calc.js';

// Fecha de referencia fija para que los tests no dependan del día en que
// se corren. calcularCiclos solo usa su año/mes/día — la hora la pisa
// timeStr.
const REF = new Date(2024, 0, 15);

describe('calcularCiclos — modo despertar', () => {
    it('calcula las 6 horas de acostarse hacia atrás desde la hora de despertar', () => {
        const { ok, results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 20, referenceDate: REF });
        expect(ok).toBe(true);
        expect(results).toHaveLength(6);
        expect(results.map((r) => r.cycles)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('4 ciclos (óptimo) con latencia 20 da 00:40 y queda marcado como óptimo', () => {
        const { results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 20, referenceDate: REF });
        const r4 = results.find((r) => r.cycles === 4);
        expect(r4.resultTimeStr).toBe('00:40');
        expect(r4.totalMinutes).toBe(380); // 4*90 + 20
        expect(r4.isOptimal).toBe(true);
        expect(r4.dayOffset).toBe(0);
    });

    it('1 ciclo (fuera del rango óptimo) no se marca como óptimo', () => {
        const { results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 20, referenceDate: REF });
        const r1 = results.find((r) => r.cycles === 1);
        expect(r1.isOptimal).toBe(false);
    });

    it('cruce de medianoche hacia el día anterior (6 ciclos, latencia 20 → 21:40 de ayer)', () => {
        const { results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 20, referenceDate: REF });
        const r6 = results.find((r) => r.cycles === 6);
        expect(r6.resultTimeStr).toBe('21:40');
        expect(r6.dayOffset).toBe(-1);
    });
});

describe('calcularCiclos — modo dormir', () => {
    it('calcula las horas de despertar hacia adelante desde la hora de acostarse', () => {
        const { results } = calcularCiclos({ mode: 'sleep', timeStr: '23:00', latencyMinutes: 20, referenceDate: REF });
        const r4 = results.find((r) => r.cycles === 4);
        expect(r4.resultTimeStr).toBe('05:20');
    });

    it('cruce de medianoche hacia el día siguiente', () => {
        const { results } = calcularCiclos({ mode: 'sleep', timeStr: '23:00', latencyMinutes: 20, referenceDate: REF });
        const r4 = results.find((r) => r.cycles === 4);
        expect(r4.dayOffset).toBe(1);
    });

    it('bedtimeTimeStr siempre es la hora de acostarse ingresada', () => {
        const { results } = calcularCiclos({ mode: 'sleep', timeStr: '23:00', latencyMinutes: 20, referenceDate: REF });
        results.forEach((r) => expect(r.bedtimeTimeStr).toBe('23:00'));
    });
});

describe('calcularCiclos — latencia', () => {
    it('latencia 0 no suma minutos extra', () => {
        const { results, latency } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 0, referenceDate: REF });
        expect(latency).toBe(0);
        const r1 = results.find((r) => r.cycles === 1);
        expect(r1.totalMinutes).toBe(90);
        expect(r1.resultTimeStr).toBe('05:30');
    });

    it('latencia grande (dentro del máximo permitido) se suma correctamente', () => {
        const { results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 120, referenceDate: REF });
        const r1 = results.find((r) => r.cycles === 1);
        expect(r1.totalMinutes).toBe(210); // 90 + 120
        expect(r1.resultTimeStr).toBe('03:30');
    });

    it('una latencia negativa se acota a 0 antes de calcular', () => {
        const { latency, results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: -15, referenceDate: REF });
        expect(latency).toBe(0);
        expect(results.find((r) => r.cycles === 1).totalMinutes).toBe(90);
    });
});

describe('calcularCiclos — entrada inválida', () => {
    it('devuelve ok:false si falta la hora', () => {
        const result = calcularCiclos({ mode: 'wake', timeStr: '', latencyMinutes: 20, referenceDate: REF });
        expect(result.ok).toBe(false);
        expect(result.error).toBe('missing-time');
    });
});

describe('clampLatency', () => {
    it('convierte valores vacíos o no numéricos a 0', () => {
        expect(clampLatency('')).toBe(0);
        expect(clampLatency('abc')).toBe(0);
    });
    it('bloquea negativos', () => {
        expect(clampLatency('-15')).toBe(0);
        expect(clampLatency(-1)).toBe(0);
    });
    it('tope en 120 por defecto', () => {
        expect(clampLatency('500')).toBe(120);
    });
    it('deja pasar valores válidos sin cambios', () => {
        expect(clampLatency('45')).toBe(45);
    });
});

describe('formatTime', () => {
    it('rellena con cero a la izquierda', () => {
        const d = new Date(2024, 0, 1, 5, 3);
        expect(formatTime(d)).toBe('05:03');
    });
});
