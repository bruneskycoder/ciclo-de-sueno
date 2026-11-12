import { describe, it, expect } from 'vitest';
import { tinteDelCielo } from './tinte.js';

describe('tinteDelCielo', () => {
    it('de noche cerrada no toca la pintura', () => {
        for (const alt of [-8, -12, -30, -90]) {
            const t = tinteDelCielo(alt);
            expect(t.opacidad).toBe(0);
            expect(t.lift).toBe(0);
        }
    });
    it('de día pleno el cielo es azul y claro, y se queda así', () => {
        const a = tinteDelCielo(10);
        const b = tinteDelCielo(60);
        expect(a).toEqual(b);
        expect(a.opacidad).toBe(1);
        expect(a.arriba[2]).toBeGreaterThan(a.arriba[0]);
    });
    it('al atardecer el horizonte es más cálido que arriba (más rojo que azul)', () => {
        const t = tinteDelCielo(1);
        expect(t.horizonte[0]).toBeGreaterThan(t.horizonte[2]);
        expect(t.horizonte[0]).toBeGreaterThan(t.arriba[0]);
    });
    it('es continuo: ningún canal salta más de 6 unidades por décima de grado', () => {
        let previo = tinteDelCielo(-10);
        for (let alt = -9.9; alt <= 12; alt += 0.1) {
            const t = tinteDelCielo(alt);
            expect(Math.abs(t.opacidad - previo.opacidad)).toBeLessThan(0.05);
            for (let j = 0; j < 3; j++) {
                expect(Math.abs(t.arriba[j] - previo.arriba[j])).toBeLessThanOrEqual(6);
                expect(Math.abs(t.horizonte[j] - previo.horizonte[j])).toBeLessThanOrEqual(6);
            }
            expect(Math.abs(t.lift - previo.lift)).toBeLessThan(0.02);
            previo = t;
        }
    });
    it('los colores quedan entre 0 y 255 y la opacidad entre 0 y 1', () => {
        for (let alt = -20; alt <= 70; alt += 0.5) {
            const t = tinteDelCielo(alt);
            expect(t.opacidad).toBeGreaterThanOrEqual(0);
            expect(t.opacidad).toBeLessThanOrEqual(1);
            for (const v of [...t.arriba, ...t.horizonte]) {
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(255);
            }
        }
    });
});
