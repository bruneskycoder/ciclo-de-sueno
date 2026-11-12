import { describe, it, expect } from 'vitest';
import {
    FUERZA_MINIMA,
    FUERZA_DE_DIA,
    LENOS_MAX,
    proximaHora,
    consumoDeLaNoche,
    fuerzaDelFuego,
    lenosAlLado,
} from './fuego.js';

const noche = (inicio, extra = {}) => ({
    date: '2026-11-12',
    bedtimeActual: '00:00',
    startedAt: new Date(inicio).toISOString(),
    ...extra,
});

describe('proximaHora', () => {
    it('una noche que cruza la medianoche termina al día siguiente', () => {
        const fin = proximaHora(new Date(2026, 10, 12, 23, 40), '07:10');
        expect(fin).toEqual(new Date(2026, 10, 13, 7, 10));
    });
    it('una siesta termina el mismo día', () => {
        const fin = proximaHora(new Date(2026, 10, 12, 14, 0), '15:30');
        expect(fin).toEqual(new Date(2026, 10, 12, 15, 30));
    });
    it('si la hora es la misma que la de inicio, es dentro de 24 horas', () => {
        const fin = proximaHora(new Date(2026, 10, 12, 7, 0), '07:00');
        expect(fin).toEqual(new Date(2026, 10, 13, 7, 0));
    });
});

describe('consumoDeLaNoche', () => {
    const abierta = noche(new Date(2026, 10, 12, 23, 0));
    it('sin noche en curso es null', () => {
        expect(consumoDeLaNoche(null, '07:00', new Date())).toBeNull();
    });
    it('0 al acostarse, 0,5 a la mitad y 1 a la hora de despertar', () => {
        expect(consumoDeLaNoche(abierta, '07:00', new Date(2026, 10, 12, 23, 0))).toBe(0);
        expect(consumoDeLaNoche(abierta, '07:00', new Date(2026, 10, 13, 3, 0))).toBe(0.5);
        expect(consumoDeLaNoche(abierta, '07:00', new Date(2026, 10, 13, 7, 0))).toBe(1);
    });
    it('queda en 1 si te pasaste de la hora', () => {
        expect(consumoDeLaNoche(abierta, '07:00', new Date(2026, 10, 13, 9, 30))).toBe(1);
    });
    it('una noche olvidada (más de 16 horas) no cuenta', () => {
        expect(consumoDeLaNoche(abierta, '07:00', new Date(2026, 10, 13, 15, 30))).toBeNull();
    });
});

describe('fuerzaDelFuego', () => {
    it('sin noche y de noche, el fuego entero', () => {
        expect(fuerzaDelFuego()).toBe(1);
    });
    it('baja en línea recta con el consumo y nunca se apaga', () => {
        expect(fuerzaDelFuego({ consumo: 0 })).toBe(1);
        expect(fuerzaDelFuego({ consumo: 0.5 })).toBeCloseTo((1 + FUERZA_MINIMA) / 2);
        expect(fuerzaDelFuego({ consumo: 1 })).toBeCloseTo(FUERZA_MINIMA);
    });
    it('de día, chico', () => {
        expect(fuerzaDelFuego({ momento: 'dia' })).toBe(FUERZA_DE_DIA);
    });
    it('una siesta de día: gana el más chico', () => {
        expect(fuerzaDelFuego({ momento: 'dia', consumo: 0.1 })).toBe(FUERZA_DE_DIA);
        expect(fuerzaDelFuego({ momento: 'dia', consumo: 1 })).toBeCloseTo(FUERZA_MINIMA);
    });
});

describe('lenosAlLado', () => {
    it('sin noche, los ciclos de la hora elegida', () => {
        expect(lenosAlLado({ ciclosElegidos: 5 })).toBe(5);
        expect(lenosAlLado()).toBe(0);
    });
    it('con noche, los ciclos que faltan, redondeando para arriba', () => {
        expect(lenosAlLado({ consumo: 0, ciclosPlaneados: 5 })).toBe(5);
        expect(lenosAlLado({ consumo: 0.5, ciclosPlaneados: 5 })).toBe(3);
        expect(lenosAlLado({ consumo: 0.8, ciclosPlaneados: 5 })).toBe(1);
        expect(lenosAlLado({ consumo: 1, ciclosPlaneados: 5 })).toBe(0);
    });
    it('con noche, la hora elegida no cuenta', () => {
        expect(lenosAlLado({ consumo: 0.5, ciclosPlaneados: 4, ciclosElegidos: 6 })).toBe(2);
    });
    it('nunca más de los que entran en la pila', () => {
        expect(lenosAlLado({ ciclosElegidos: 9 })).toBe(LENOS_MAX);
        expect(lenosAlLado({ ciclosElegidos: -2 })).toBe(0);
    });
});
