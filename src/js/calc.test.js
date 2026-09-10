import { describe, it, expect } from 'vitest';
import {
    calcularCiclos,
    calcularSiesta,
    calcularDuracionReal,
    clampLatency,
    clampCycleLength,
    formatTime,
    SIESTA_CORTA_MINUTOS,
} from './calc.js';

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

describe('calcularCiclos — duración de ciclo configurable (Fase 3)', () => {
    it('usa 90 min por defecto si no se pasa cycleMinutes', () => {
        const { cycleLength, results } = calcularCiclos({ mode: 'wake', timeStr: '07:00', latencyMinutes: 0, referenceDate: REF });
        expect(cycleLength).toBe(90);
        expect(results.find((r) => r.cycles === 1).totalMinutes).toBe(90);
    });

    it('recalcula todo con una duración de ciclo distinta (ej. 100 min)', () => {
        const { cycleLength, results } = calcularCiclos({
            mode: 'wake', timeStr: '07:00', latencyMinutes: 0, cycleMinutes: 100, referenceDate: REF,
        });
        expect(cycleLength).toBe(100);
        const r4 = results.find((r) => r.cycles === 4);
        expect(r4.totalMinutes).toBe(400); // 4*100
        expect(r4.resultTimeStr).toBe('00:20');
    });

    it('una duración de ciclo fuera de rango se acota antes de calcular', () => {
        const { cycleLength } = calcularCiclos({
            mode: 'wake', timeStr: '07:00', latencyMinutes: 0, cycleMinutes: 300, referenceDate: REF,
        });
        expect(cycleLength).toBe(120);
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

describe('calcularSiesta — modo siesta (Fase 4)', () => {
    it('la siesta corta usa SIESTA_CORTA_MINUTOS, no la duración de ciclo', () => {
        const { corta } = calcularSiesta({ timeStr: '14:00', latencyMinutes: 0, cycleMinutes: 90, referenceDate: REF });
        expect(corta.totalMinutes).toBe(SIESTA_CORTA_MINUTOS);
        expect(corta.resultTimeStr).toBe('14:20');
        expect(corta.tipo).toBe('corta');
    });

    it('la siesta completa usa la duración de ciclo del usuario', () => {
        const { completa } = calcularSiesta({ timeStr: '14:00', latencyMinutes: 0, cycleMinutes: 90, referenceDate: REF });
        expect(completa.totalMinutes).toBe(90);
        expect(completa.resultTimeStr).toBe('15:30');
        expect(completa.tipo).toBe('completa');
    });

    it('respeta una duración de ciclo distinta a 90 en la siesta completa', () => {
        const { completa } = calcularSiesta({ timeStr: '14:00', latencyMinutes: 0, cycleMinutes: 100, referenceDate: REF });
        expect(completa.totalMinutes).toBe(100);
        expect(completa.resultTimeStr).toBe('15:40');
    });

    it('suma la latencia a ambas recomendaciones', () => {
        const { corta, completa } = calcularSiesta({ timeStr: '14:00', latencyMinutes: 10, cycleMinutes: 90, referenceDate: REF });
        expect(corta.totalMinutes).toBe(30);
        expect(completa.totalMinutes).toBe(100);
    });

    it('bedtimeTimeStr de ambas es la hora de acostarse ingresada', () => {
        const { corta, completa } = calcularSiesta({ timeStr: '14:00', latencyMinutes: 10, referenceDate: REF });
        expect(corta.bedtimeTimeStr).toBe('14:00');
        expect(completa.bedtimeTimeStr).toBe('14:00');
    });

    it('devuelve ok:false si falta la hora', () => {
        const result = calcularSiesta({ timeStr: '', latencyMinutes: 0, referenceDate: REF });
        expect(result.ok).toBe(false);
        expect(result.error).toBe('missing-time');
    });
});

describe('clampCycleLength', () => {
    it('deja pasar valores dentro del rango 70–120', () => {
        expect(clampCycleLength('90')).toBe(90);
        expect(clampCycleLength(70)).toBe(70);
        expect(clampCycleLength(120)).toBe(120);
    });
    it('acota valores por debajo del mínimo', () => {
        expect(clampCycleLength('50')).toBe(70);
        expect(clampCycleLength(0)).toBe(70);
    });
    it('acota valores por encima del máximo', () => {
        expect(clampCycleLength('500')).toBe(120);
    });
    it('cae al default de 90 si el valor es vacío o no numérico', () => {
        expect(clampCycleLength('')).toBe(90);
        expect(clampCycleLength('abc')).toBe(90);
        expect(clampCycleLength(undefined)).toBe(90);
    });
});

describe('calcularDuracionReal — logueo real de sueño (Fase 5)', () => {
    it('calcula duración normal cruzando medianoche', () => {
        const { ok, durationMinutes, cyclesCompleted } = calcularDuracionReal({
            bedtimeActual: '23:30', waketimeActual: '07:00', cycleMinutes: 90,
        });
        expect(ok).toBe(true);
        expect(durationMinutes).toBe(450); // 23:30 -> 07:00 = 7h30 = 450min
        expect(cyclesCompleted).toBe(5); // 450/90 = 5.0
    });

    it('no cruza medianoche si la hora de despertar es mayor (ej. siesta larga anotada a mano)', () => {
        const { durationMinutes } = calcularDuracionReal({ bedtimeActual: '14:00', waketimeActual: '16:00' });
        expect(durationMinutes).toBe(120);
    });

    it('hora de despertar igual a la de acostarse se interpreta como 24h', () => {
        const { durationMinutes } = calcularDuracionReal({ bedtimeActual: '08:00', waketimeActual: '08:00' });
        expect(durationMinutes).toBe(24 * 60);
    });

    it('redondea ciclos completados al entero más cercano', () => {
        const { cyclesCompleted } = calcularDuracionReal({
            bedtimeActual: '23:00', waketimeActual: '06:50', cycleMinutes: 90, // 470 min / 90 = 5.22
        });
        expect(cyclesCompleted).toBe(5);
    });

    it('respeta una duración de ciclo distinta a 90', () => {
        const { cyclesCompleted, cycleLength } = calcularDuracionReal({
            bedtimeActual: '23:00', waketimeActual: '07:00', cycleMinutes: 100, // 480 min / 100 = 4.8
        });
        expect(cycleLength).toBe(100);
        expect(cyclesCompleted).toBe(5);
    });

    it('devuelve ok:false si falta la hora de acostarse', () => {
        const result = calcularDuracionReal({ bedtimeActual: '', waketimeActual: '07:00' });
        expect(result.ok).toBe(false);
        expect(result.error).toBe('missing-bedtime');
    });

    it('devuelve ok:false si falta la hora de despertar', () => {
        const result = calcularDuracionReal({ bedtimeActual: '23:00', waketimeActual: '' });
        expect(result.ok).toBe(false);
        expect(result.error).toBe('missing-waketime');
    });
});

describe('formatTime', () => {
    it('rellena con cero a la izquierda', () => {
        const d = new Date(2024, 0, 1, 5, 3);
        expect(formatTime(d)).toBe('05:03');
    });
});
