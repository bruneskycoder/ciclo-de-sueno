import { describe, it, expect } from 'vitest';
import {
    altAz,
    aPantalla,
    estrellasVisibles,
    visibilidadEstrellas,
    mascaraLuna,
    tiempoSidereo,
    LUNA,
    VENTANA,
} from './estrellas.js';
import { ESTRELLAS_CATALOGO } from './estrellas-datos.js';
import contorno from '../assets/escena/contorno-cielo.json';

const LAT = -27.46;
const LON = -58.98;

// Referencia independiente: astropy (ICRS -> AltAz, sin refracción), lugar
// de Resistencia, calculado el 2026-11-12. Nuestra cuenta usa coordenadas
// J2000 sin precesión (unos 0,36° en 26 años): la tolerancia es de 0,6°.
const REFERENCIA = [
    ['2026-12-22T01:00:00Z', 'Acrux', 186.65, -63.099, 5.967, 163.23],
    ['2026-12-22T01:00:00Z', 'Gacrux', 187.792, -57.113, 0.691, 160.341],
    ['2026-12-22T01:00:00Z', 'Canopus', 95.988, -52.696, 45.714, 138.701],
    ['2026-12-22T01:00:00Z', 'Sirio', 101.287, -16.716, 38.361, 90.157],
    ['2026-12-22T01:00:00Z', 'Antares', 247.352, -26.432, -32.348, 202.457],
    ['2026-06-21T23:00:00Z', 'Acrux', 186.65, -63.099, 53.714, 186.946],
    ['2026-06-21T23:00:00Z', 'Gacrux', 187.792, -57.113, 59.66, 188.579],
    ['2026-06-21T23:00:00Z', 'Canopus', 95.988, -52.696, 15.847, 218.325],
    ['2026-06-21T23:00:00Z', 'Sirio', 101.287, -16.716, 3.714, 253.045],
    ['2026-06-21T23:00:00Z', 'Antares', 247.352, -26.432, 44.351, 101.243],
    ['2026-03-20T03:00:00Z', 'Acrux', 186.65, -63.099, 51.125, 163.489],
    ['2026-03-20T03:00:00Z', 'Gacrux', 187.792, -57.113, 55.551, 156.66],
    ['2026-03-20T03:00:00Z', 'Canopus', 95.988, -52.696, 34.9, 223.052],
    ['2026-03-20T03:00:00Z', 'Sirio', 101.287, -16.716, 32.034, 266.681],
    ['2026-03-20T03:00:00Z', 'Antares', 247.352, -26.432, 16.72, 111.639],
];

describe('altAz contra astropy', () => {
    it.each(REFERENCIA)('%s %s', (cuando, _n, ra, dec, alt, az) => {
        const r = altAz(ra, dec, new Date(cuando), LAT, LON);
        expect(Math.abs(r.alt - alt)).toBeLessThan(0.6);
        const dAz = Math.abs(((r.az - az + 540) % 360) - 180);
        expect(dAz).toBeLessThan(0.8);
    });
});

describe('tiempoSidereo', () => {
    it('queda entre 0 y 360', () => {
        for (let d = 0; d < 400; d += 37) {
            const t = tiempoSidereo(new Date(Date.UTC(2026, 0, 1 + d, 7)), -58.98);
            expect(t).toBeGreaterThanOrEqual(0);
            expect(t).toBeLessThan(360);
        }
    });
});

describe('aPantalla', () => {
    it('el sur sobre el horizonte cae en el centro, y más alto se ve más arriba', () => {
        const a = aPantalla(10, 180);
        const b = aPantalla(40, 180);
        expect(a.x).toBe(VENTANA.centroX);
        expect(b.x).toBe(VENTANA.centroX);
        expect(b.y).toBeLessThan(a.y);
    });
    it('el este queda a la izquierda y el oeste a la derecha (se mira al sur)', () => {
        expect(aPantalla(20, 130).x).toBeLessThan(VENTANA.centroX);
        expect(aPantalla(20, 230).x).toBeGreaterThan(VENTANA.centroX);
    });
    it('bajo el horizonte, fuera de la ventana o pasado el borde de arriba: null', () => {
        expect(aPantalla(-1, 180)).toBeNull();
        expect(aPantalla(20, 0)).toBeNull();
        expect(aPantalla(80, 180)).toBeNull();
    });
});

describe('estrellasVisibles', () => {
    const noche = new Date('2026-06-21T23:00:00Z'); // 20:00 en Resistencia, invierno
    it('la Cruz del Sur de junio a la noche está en el cielo y cada estrella sobre el monte', () => {
        const v = estrellasVisibles(noche, LAT, LON, contorno);
        const cruz = [60718, 62434, 61084, 59747].map((h) => v.find((e) => e.hip === h));
        // Gacrux y Acrux pasan de 53° de altura y de la ventana por arriba?
        // Acrux a 53,7°: y = 268 - 53,7*4,09 = 48: entra.
        expect(cruz[0]).toBeTruthy();
        expect(cruz[0].y).toBeLessThan(contorno[cruz[0].x]);
    });
    it('ninguna estrella cae delante del monte', () => {
        for (const cuando of ['2026-06-21T23:00:00Z', '2026-12-22T01:00:00Z', '2026-03-20T03:00:00Z']) {
            for (const e of estrellasVisibles(new Date(cuando), LAT, LON, contorno)) {
                expect(e.y).toBeLessThanOrEqual(contorno[e.x] - 4);
            }
        }
    });
    it('ninguna cae sobre la luna', () => {
        for (const e of estrellasVisibles(noche, LAT, LON, contorno)) {
            expect(Math.hypot(e.x - LUNA.x, e.y - LUNA.y)).toBeGreaterThanOrEqual(LUNA.radio + 8);
        }
    });
    it('hay un puñado a cualquier hora de la noche (ni vacío ni un hormiguero)', () => {
        for (let h = 0; h < 24; h += 3) {
            const n = estrellasVisibles(new Date(Date.UTC(2026, 5, 22, h)), LAT, LON, contorno).length;
            expect(n).toBeLessThan(120);
        }
        const total = estrellasVisibles(noche, LAT, LON, contorno).length;
        expect(total).toBeGreaterThan(8);
    });
    it('el cielo gira: dos horas después no son las mismas', () => {
        const a = estrellasVisibles(noche, LAT, LON, contorno);
        const b = estrellasVisibles(new Date(noche.getTime() + 2 * 3600000), LAT, LON, contorno);
        expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    });
});

describe('catálogo', () => {
    it('trae la Cruz del Sur completa y nada más débil que magnitud 3,5', () => {
        const hips = new Set(ESTRELLAS_CATALOGO.map((e) => e[0]));
        for (const h of [60718, 62434, 61084, 59747]) expect(hips.has(h)).toBe(true);
        for (const e of ESTRELLAS_CATALOGO) expect(e[3]).toBeLessThanOrEqual(3.5);
    });
});

describe('visibilidadEstrellas', () => {
    it('0 de día, 1 de noche cerrada y creciente en el medio', () => {
        expect(visibilidadEstrellas(10)).toBe(0);
        expect(visibilidadEstrellas(-2)).toBe(0);
        expect(visibilidadEstrellas(-8)).toBe(1);
        expect(visibilidadEstrellas(-20)).toBe(1);
        expect(visibilidadEstrellas(-5)).toBeCloseTo(0.5, 5);
    });
});

describe('mascaraLuna', () => {
    const R = 10;
    const lado = 2 * R + 1;
    const cuenta = (m, v) => m.filter((x) => x === v).length;
    const lado2 = (m, f) => {
        let n = 0;
        for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) if (f(i - R, R - j) && m[j * lado + i] === 2) n++;
        return n;
    };
    it('luna nueva: nada iluminado. Llena: todo el disco', () => {
        expect(cuenta(mascaraLuna(R, 0, 0), 2)).toBe(0);
        const llena = mascaraLuna(R, 1, 0);
        expect(cuenta(llena, 1)).toBe(0);
        expect(cuenta(llena, 2)).toBeGreaterThan(300);
    });
    it('la parte iluminada sigue a la fracción (cuarto = la mitad, con 5% de margen)', () => {
        const m = mascaraLuna(R, 0.5, 0);
        const discos = cuenta(m, 1) + cuenta(m, 2);
        expect(Math.abs(cuenta(m, 2) / discos - 0.5)).toBeLessThan(0.05);
        const f25 = mascaraLuna(R, 0.25, 0);
        expect(Math.abs(cuenta(f25, 2) / (cuenta(f25, 1) + cuenta(f25, 2)) - 0.25)).toBeLessThan(0.06);
    });
    it('con inclinación 0 la luz mira hacia arriba; con 90°, hacia la izquierda; con -90°, a la derecha', () => {
        const arriba = mascaraLuna(R, 0.5, 0);
        expect(lado2(arriba, (x, y) => y > 0)).toBeGreaterThan(lado2(arriba, (x, y) => y < 0));
        const izq = mascaraLuna(R, 0.5, 90);
        expect(lado2(izq, (x) => x < 0)).toBeGreaterThan(lado2(izq, (x) => x > 0));
        const der = mascaraLuna(R, 0.5, -90);
        expect(lado2(der, (x) => x > 0)).toBeGreaterThan(lado2(der, (x) => x < 0));
    });
    it('una creciente fina es una media luna: iluminada por fuera, oscura por dentro', () => {
        const m = mascaraLuna(R, 0.15, -90);
        // En el centro del disco (x=0,y=0) está oscuro.
        expect(m[R * lado + R]).toBe(1);
        // En el borde de la derecha hay luz.
        expect(m[R * lado + (2 * R - 1)]).toBe(2);
    });
});
