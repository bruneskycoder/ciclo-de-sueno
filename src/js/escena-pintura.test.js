import { describe, it, expect } from 'vitest';
import {
    W,
    H,
    CAJA,
    VIENTO,
    CUADROS_LLAMA,
    SECUENCIA_LLAMA,
    rnd,
    viento,
    corrimientoViento,
    titileo,
    cuadroDeLlama,
    armarCuadroLlama,
    FUEGO,
    BASE_LLAMA,
    esFuego,
    separarLlama,
    enrojecer,
    SPRITE_LENO,
    altoDelLienzo,
    luzDeBorde,
    PALETA_LENA,
    PILA_LENA,
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

describe('la llama que se consume (paso 15a)', () => {
    // Pintura sintética: fondo azul de noche y, dentro de la caja, una
    // llama naranja del ancho de la caja menos 20 píxeles por lado.
    const AZUL = (0xff << 24) | (0x40 << 16) | (0x30 << 8) | 0x25;
    const NARANJA = (0xff << 24) | (0x20 << 16) | (0x90 << 8) | 0xf0;
    function conLlama() {
        const src = new Uint32Array(W * H).fill(AZUL >>> 0);
        for (let y = 520; y < BASE_LLAMA; y++) {
            for (let x = CAJA.x0 + 20; x < CAJA.x1 - 20; x++) src[y * W + x] = NARANJA >>> 0;
        }
        return src;
    }
    const quieto = { s: 1, inclina: 0, fase: 0 };

    it('esFuego distingue la llama del suelo pintado', () => {
        const rgb = (r, g, b) => ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0;
        expect(esFuego(rgb(0xff, 0xf0, 0x94))).toBe(true); // centro blanco
        expect(esFuego(rgb(0xe1, 0x7a, 0x39))).toBe(true); // naranja
        expect(esFuego(rgb(0x5b, 0x3b, 0x2f))).toBe(false); // suelo
        expect(esFuego(rgb(0xae, 0x57, 0x25), FUEGO.x, 588)).toBe(false); // suelo iluminado
    });

    it('el fondo no tiene fuego: lo que tapaba la llama se rellena', () => {
        const { mascara, fondo } = separarLlama(conLlama());
        expect(mascara[540 * W + FUEGO.x]).toBe(1);
        expect(esFuego(fondo[540 * W + FUEGO.x])).toBe(false);
    });

    it('con escala 1 la llama ocupa lo mismo que la pintada', () => {
        const src = conLlama();
        const { llama, w } = armarCuadroLlama(src, quieto, separarLlama(src), 1);
        const filasConLlama = new Set();
        llama.forEach((v, i) => v && filasConLlama.add(Math.floor(i / w)));
        // 519 y no 520: la máscara lleva un píxel de margen.
        expect(Math.min(...filasConLlama) + CAJA.y0).toBe(519);
    });

    it('con escala 0,3 la punta baja y arriba queda fondo', () => {
        const src = conLlama();
        const capas = separarLlama(src);
        const { datos, llama, w } = armarCuadroLlama(src, quieto, capas, 0.3);
        const px = new Uint32Array(datos.buffer);
        const filas = [];
        llama.forEach((v, i) => v && filas.push(Math.floor(i / w) + CAJA.y0));
        const punta = Math.min(...filas);
        // 70 filas de llama al 30% son unas 21.
        expect(BASE_LLAMA - punta).toBeLessThanOrEqual(23);
        expect(BASE_LLAMA - punta).toBeGreaterThanOrEqual(19);
        expect(px[(530 - CAJA.y0) * w + (FUEGO.x - CAJA.x0)]).toBe(capas.fondo[530 * W + FUEGO.x]);
    });

    it('enrojecer no toca el píxel con escala 1 y baja el verde y el azul después', () => {
        const v = 0xff2090f0;
        expect(enrojecer(v, 1)).toBe(v);
        const r = enrojecer(v, 0.3);
        expect(r & 255).toBe(0xf0);
        expect((r >> 8) & 255).toBeLessThan(0x90);
        expect((r >> 16) & 255).toBeLessThan(0x20);
    });
});

describe('la leña (paso 15b)', () => {
    it('el sprite es parejo y usa solo colores de la paleta', () => {
        for (const fila of SPRITE_LENO) {
            expect(fila.length).toBe(SPRITE_LENO[0].length);
            for (const c of fila) expect(c === '.' || c in PALETA_LENA).toBe(true);
        }
    });
    it('hay lugar para seis leños y ninguno pisa a otro en la misma fila', () => {
        expect(PILA_LENA.length).toBe(6);
        const ancho = SPRITE_LENO[0].length;
        for (const [x1, y1] of PILA_LENA) {
            for (const [x2, y2] of PILA_LENA) {
                if (y1 === y2 && x1 !== x2)
                    expect(Math.abs(x1 - x2)).toBeGreaterThanOrEqual(ancho - 1);
            }
        }
    });
});

describe('la pintura en la pantalla (paso 16)', () => {
    it('en una pantalla de 9:16 o más ancha, el canvas es la pintura', () => {
        expect(altoDelLienzo(572, 1024)).toBe(H);
        expect(altoDelLienzo(1280, 800)).toBe(H);
    });
    it('en un iPhone 13 el canvas crece con suelo hasta llenar el alto', () => {
        // 390 × 844: la pintura a lo ancho mide 698 puntos; faltan 146.
        const alto = altoDelLienzo(390, 844);
        expect(alto).toBe(Math.ceil((W * 844) / 390));
        expect((alto * 390) / W).toBeGreaterThanOrEqual(844);
    });
    it('sin medidas válidas, se queda con la pintura', () => {
        expect(altoDelLienzo(0, 844)).toBe(H);
        expect(altoDelLienzo(390, NaN)).toBe(H);
    });
});

describe('la luz del fuego en los bordes', () => {
    it('pegado al fuego alumbra más que lejos, y fuera del alcance nada', () => {
        expect(luzDeBorde(0, 200, 1, 0)).toBeGreaterThan(luzDeBorde(150, 200, 1, 0));
        expect(luzDeBorde(200, 200, 1, 0)).toBe(0);
        expect(luzDeBorde(-500, 200, 1, 0)).toBe(0);
    });
    it('da lo mismo arriba que abajo del fuego', () => {
        expect(luzDeBorde(-60, 200, 1, 0.3)).toBe(luzDeBorde(60, 200, 1, 0.3));
    });
    it('con el fuego bajo alumbra menos, y apagado nada', () => {
        expect(luzDeBorde(50, 200, 0.4, 0)).toBeLessThan(luzDeBorde(50, 200, 1, 0));
        expect(luzDeBorde(50, 200, 0, 1)).toBe(0);
    });
    it('late con el titileo y va de a escalones de 0,05, entre 0 y 1', () => {
        expect(luzDeBorde(0, 200, 1, 1)).toBeGreaterThan(luzDeBorde(0, 200, 1, -1));
        for (const n of [-1, -1 / 3, 0, 1 / 3, 1]) {
            for (const d of [0, 37, 120, 199]) {
                const v = luzDeBorde(d, 200, 0.83, n);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(1);
                expect(Math.round(v * 20)).toBeCloseTo(v * 20, 9);
            }
        }
    });
    it('sin alcance no alumbra', () => {
        expect(luzDeBorde(0, 0, 1, 0)).toBe(0);
    });
});
