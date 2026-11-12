import { describe, it, expect } from 'vitest';
import {
    W,
    H,
    CAJA,
    VIENTO,
    ESTRELLAS,
    CUADROS_LLAMA,
    SECUENCIA_LLAMA,
    rnd,
    viento,
    corrimientoViento,
    titileo,
    cuadroDeLlama,
    armarCuadroLlama,
} from './escena-pintura.js';

// Una "pintura" sintética: cada píxel guarda su propia posición, así se
// puede saber de dónde salió lo que aparece en la llama.
function pinturaDePrueba() {
    const src = new Uint32Array(W * H);
    for (let i = 0; i < src.length; i++) src[i] = i + 1;
    return src;
}

describe('rnd', () => {
    it('es fijo: la misma semilla da el mismo número', () => {
        expect(rnd(7)).toBe(rnd(7));
    });
    it('queda entre 0 y 1', () => {
        for (let i = 0; i < 200; i++) {
            const v = rnd(i);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });
});

describe('viento', () => {
    it('es función pura del tiempo', () => {
        expect(viento(12.3, 0.7)).toBe(viento(12.3, 0.7));
    });
    it('nunca pasa de 1 en valor absoluto', () => {
        for (let t = 0; t < 120; t += 0.1) {
            expect(Math.abs(viento(t, 1.3))).toBeLessThanOrEqual(1);
        }
    });
});

describe('corrimientoViento', () => {
    it('siempre es un número entero de píxeles', () => {
        for (const z of VIENTO) {
            for (let t = 0; t < 30; t += 0.7) {
                for (let y = z.punta; y <= z.base; y += 5) {
                    expect(Number.isInteger(corrimientoViento(z, y, t))).toBe(true);
                }
            }
        }
    });
    it('vale cero en la base: troncos y suelo no resbalan', () => {
        for (const z of VIENTO) {
            for (let t = 0; t < 30; t += 0.7) {
                expect(corrimientoViento(z, z.base, t) + 0).toBe(0);
            }
        }
    });
    it('no pasa nunca de la amplitud de la zona', () => {
        for (const z of VIENTO) {
            for (let t = 0; t < 60; t += 0.37) {
                for (let y = z.punta; y <= z.base; y += 7) {
                    expect(Math.abs(corrimientoViento(z, y, t))).toBeLessThanOrEqual(
                        Math.ceil(z.amp),
                    );
                }
            }
        }
    });
    it('las zonas quedan dentro de la pintura', () => {
        for (const z of VIENTO) {
            expect(z.x0).toBeGreaterThanOrEqual(0);
            expect(z.x1).toBeLessThanOrEqual(W);
            expect(z.punta).toBeGreaterThanOrEqual(0);
            expect(z.base).toBeLessThan(H);
            expect(z.punta).toBeLessThan(z.base);
        }
    });
});

describe('titileo', () => {
    it('queda entre -1 y 1 y en tercios', () => {
        for (let t = 0; t < 60; t += 0.013) {
            const n = titileo(t);
            expect(Math.abs(n)).toBeLessThanOrEqual(1);
            expect(Math.abs(n * 3 - Math.round(n * 3))).toBeLessThan(1e-9);
        }
    });
});

describe('llama', () => {
    it('la secuencia solo nombra cuadros que existen', () => {
        for (const k of SECUENCIA_LLAMA) {
            expect(k).toBeGreaterThanOrEqual(0);
            expect(k).toBeLessThan(CUADROS_LLAMA.length);
        }
    });
    it('cambia de cuadro 8 veces por segundo y da la vuelta', () => {
        expect(cuadroDeLlama(0)).toBe(SECUENCIA_LLAMA[0]);
        expect(cuadroDeLlama(0.125)).toBe(SECUENCIA_LLAMA[1]);
        expect(cuadroDeLlama(SECUENCIA_LLAMA.length / 8)).toBe(SECUENCIA_LLAMA[0]);
    });
    it('con tiempo negativo toma el primer cuadro, no uno que no existe', () => {
        // Pasó en el navegador: el primer cuadro de animación llegó con una
        // marca anterior al inicio y el índice quedó en -1.
        expect(cuadroDeLlama(-0.016)).toBe(SECUENCIA_LLAMA[0]);
        expect(cuadroDeLlama(-5)).toBe(SECUENCIA_LLAMA[0]);
    });
    it('cada cuadro tiene el tamaño de la caja', () => {
        const src = pinturaDePrueba();
        const { datos, w, h } = armarCuadroLlama(src, CUADROS_LLAMA[0]);
        expect(w).toBe(CAJA.x1 - CAJA.x0);
        expect(h).toBe(CAJA.y1 - CAJA.y0);
        expect(datos.length).toBe(w * h * 4);
    });
    it('solo reusa píxeles de la propia caja (no trae nada de afuera)', () => {
        const src = pinturaDePrueba();
        for (const params of CUADROS_LLAMA) {
            const { datos, w, h } = armarCuadroLlama(src, params);
            const px = new Uint32Array(datos.buffer);
            for (let i = 0; i < w * h; i++) {
                const origen = px[i] - 1;
                const x = origen % W;
                const y = Math.floor(origen / W);
                expect(x).toBeGreaterThanOrEqual(CAJA.x0);
                expect(x).toBeLessThan(CAJA.x1);
                expect(y).toBeGreaterThanOrEqual(0);
                expect(y).toBeLessThan(CAJA.y1);
            }
        }
    });
    it('la parte de abajo (los leños) no se mueve', () => {
        const src = pinturaDePrueba();
        const { datos, w } = armarCuadroLlama(src, CUADROS_LLAMA[2]);
        const px = new Uint32Array(datos.buffer);
        // De la fila 590 para abajo no hay corrimiento ni estirado.
        for (let y = 592; y < CAJA.y1; y += 4) {
            for (let x = CAJA.x0; x < CAJA.x1; x += 5) {
                expect(px[(y - CAJA.y0) * w + (x - CAJA.x0)]).toBe(src[y * W + x]);
            }
        }
    });
    it('es determinista', () => {
        const src = pinturaDePrueba();
        const a = armarCuadroLlama(src, CUADROS_LLAMA[1]);
        const b = armarCuadroLlama(src, CUADROS_LLAMA[1]);
        expect(Array.from(a.datos.slice(0, 400))).toEqual(Array.from(b.datos.slice(0, 400)));
    });
});

describe('estrellas provisorias', () => {
    it('están dentro de la pintura y por encima del monte', () => {
        for (const e of ESTRELLAS) {
            expect(e.x).toBeGreaterThanOrEqual(2);
            expect(e.x).toBeLessThan(W - 2);
            expect(e.y).toBeGreaterThanOrEqual(2);
            expect(e.y).toBeLessThan(150);
        }
    });
    it('no hay dos con el mismo ritmo y fase', () => {
        const claves = new Set(ESTRELLAS.map((e) => `${e.w.toFixed(3)}-${e.fase.toFixed(3)}`));
        expect(claves.size).toBe(ESTRELLAS.length);
    });
});
