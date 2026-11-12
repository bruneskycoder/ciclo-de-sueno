import { describe, it, expect } from 'vitest';
import {
    RESISTENCIA,
    ubicacionDeZona,
    redondearUbicacion,
    leerUbicacionGuardada,
    ubicacionVigente,
} from './ubicacion.js';

describe('ubicacionDeZona', () => {
    it.each([
        'America/Argentina/Cordoba',
        'America/Argentina/Buenos_Aires',
        'America/Argentina/Salta',
        'America/Cordoba',
        'America/Buenos_Aires',
        'America/Mendoza',
        'America/Jujuy',
    ])('%s es Resistencia', (zona) => {
        const u = ubicacionDeZona(zona);
        expect(u.nombre).toBe('Resistencia');
        expect(u.lat).toBe(RESISTENCIA.lat);
        expect(u.lon).toBe(RESISTENCIA.lon);
        expect(u.origen).toBe('zona');
    });

    it('Pacific/Auckland es Auckland, en el hemisferio sur y al este', () => {
        const u = ubicacionDeZona('Pacific/Auckland');
        expect(u.nombre).toBe('Auckland');
        expect(u.lat).toBeCloseTo(-36.85, 1);
        expect(u.lon).toBeCloseTo(174.76, 1);
        expect(u.origen).toBe('zona');
    });

    it('una zona desconocida cae en Resistencia y lo dice', () => {
        const u = ubicacionDeZona('Marte/Olympus_Mons');
        expect(u.nombre).toBe('Resistencia');
        expect(u.origen).toBe('predeterminada');
    });

    it('sin zona (null, vacío, otro tipo) también', () => {
        for (const z of [null, undefined, '', 42]) {
            expect(ubicacionDeZona(z).origen).toBe('predeterminada');
        }
    });

    it('no confunde un nombre parecido con una zona argentina', () => {
        expect(ubicacionDeZona('America/Argentina').origen).toBe('predeterminada');
        expect(ubicacionDeZona('Europe/America/Cordoba').origen).toBe('predeterminada');
    });

    it('no usa propiedades heredadas del objeto como si fueran zonas', () => {
        expect(ubicacionDeZona('constructor').origen).toBe('predeterminada');
        expect(ubicacionDeZona('__proto__').origen).toBe('predeterminada');
    });
});

describe('redondearUbicacion', () => {
    it('deja un decimal', () => {
        expect(redondearUbicacion(-27.46061, -58.98391)).toEqual({ lat: -27.5, lon: -59 });
    });
});

describe('leerUbicacionGuardada', () => {
    it('lee una ubicación válida', () => {
        expect(leerUbicacionGuardada('{"lat":-27.5,"lon":-59}')).toEqual({ lat: -27.5, lon: -59 });
    });
    it.each([
        null,
        '',
        'no es json',
        '{"lat":"a","lon":1}',
        '{"lat":91,"lon":0}',
        '{"lat":0,"lon":181}',
        '{"lat":null,"lon":0}',
        '[]',
    ])('%s se descarta', (texto) => {
        expect(leerUbicacionGuardada(texto)).toBeNull();
    });
});

describe('ubicacionVigente', () => {
    it('la elegida a mano manda sobre la zona', () => {
        const u = ubicacionVigente({ lat: 10, lon: 20 }, 'Pacific/Auckland');
        expect(u).toMatchObject({ lat: 10, lon: 20, origen: 'gps' });
    });
    it('sin nada guardado, manda la zona', () => {
        expect(ubicacionVigente(null, 'Pacific/Auckland').nombre).toBe('Auckland');
    });
});
