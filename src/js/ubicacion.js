// ubicacion.js — dónde está el cielo que se dibuja.
//
// Sin pedir ningún permiso: la zona horaria del teléfono ya dice en qué
// parte del mundo estás, con la precisión que alcanza para una escena. Para
// cualquier zona argentina el cielo es el de Resistencia; para el resto,
// una ciudad de referencia de la zona. Quien quiera exactitud puede tocar
// "Usar mi ubicación" en Ajustes (ver ajustes.js). Todo esto es aritmética
// sobre datos: no toca el DOM ni el almacenamiento.

export const RESISTENCIA = { nombre: 'Resistencia', lat: -27.4606, lon: -58.9839 };

// Cualquier zona argentina, incluidos los alias viejos que todavía
// devuelven algunos navegadores (America/Buenos_Aires, America/Cordoba...).
const ZONA_ARGENTINA =
    /^America\/(Argentina\/.+|Buenos_Aires|Cordoba|Catamarca|Jujuy|Mendoza|Rosario)$/;

// Ciudad de referencia por zona. No pretende cubrir el mundo: una zona que
// no está acá cae en Resistencia y se avisa (origen: 'predeterminada').
const CIUDADES = {
    'America/Montevideo': { nombre: 'Montevideo', lat: -34.9, lon: -56.19 },
    'America/Santiago': { nombre: 'Santiago', lat: -33.45, lon: -70.67 },
    'America/Asuncion': { nombre: 'Asunción', lat: -25.26, lon: -57.58 },
    'America/La_Paz': { nombre: 'La Paz', lat: -16.5, lon: -68.15 },
    'America/Lima': { nombre: 'Lima', lat: -12.05, lon: -77.04 },
    'America/Bogota': { nombre: 'Bogotá', lat: 4.71, lon: -74.07 },
    'America/Caracas': { nombre: 'Caracas', lat: 10.48, lon: -66.9 },
    'America/Sao_Paulo': { nombre: 'San Pablo', lat: -23.55, lon: -46.63 },
    'America/Mexico_City': { nombre: 'Ciudad de México', lat: 19.43, lon: -99.13 },
    'America/Panama': { nombre: 'Panamá', lat: 8.98, lon: -79.52 },
    'America/Havana': { nombre: 'La Habana', lat: 23.11, lon: -82.37 },
    'America/New_York': { nombre: 'Nueva York', lat: 40.71, lon: -74.01 },
    'America/Chicago': { nombre: 'Chicago', lat: 41.88, lon: -87.63 },
    'America/Denver': { nombre: 'Denver', lat: 39.74, lon: -104.99 },
    'America/Los_Angeles': { nombre: 'Los Ángeles', lat: 34.05, lon: -118.24 },
    'America/Toronto': { nombre: 'Toronto', lat: 43.65, lon: -79.38 },
    'Europe/Madrid': { nombre: 'Madrid', lat: 40.42, lon: -3.7 },
    'Europe/London': { nombre: 'Londres', lat: 51.51, lon: -0.13 },
    'Europe/Paris': { nombre: 'París', lat: 48.86, lon: 2.35 },
    'Europe/Berlin': { nombre: 'Berlín', lat: 52.52, lon: 13.4 },
    'Europe/Rome': { nombre: 'Roma', lat: 41.9, lon: 12.5 },
    'Europe/Lisbon': { nombre: 'Lisboa', lat: 38.72, lon: -9.14 },
    'Europe/Moscow': { nombre: 'Moscú', lat: 55.76, lon: 37.62 },
    'Africa/Johannesburg': { nombre: 'Johannesburgo', lat: -26.2, lon: 28.05 },
    'Africa/Cairo': { nombre: 'El Cairo', lat: 30.04, lon: 31.24 },
    'Asia/Dubai': { nombre: 'Dubái', lat: 25.2, lon: 55.27 },
    'Asia/Kolkata': { nombre: 'Nueva Delhi', lat: 28.61, lon: 77.21 },
    'Asia/Singapore': { nombre: 'Singapur', lat: 1.35, lon: 103.82 },
    'Asia/Shanghai': { nombre: 'Shanghái', lat: 31.23, lon: 121.47 },
    'Asia/Seoul': { nombre: 'Seúl', lat: 37.57, lon: 126.98 },
    'Asia/Tokyo': { nombre: 'Tokio', lat: 35.68, lon: 139.69 },
    'Australia/Perth': { nombre: 'Perth', lat: -31.95, lon: 115.86 },
    'Australia/Sydney': { nombre: 'Sídney', lat: -33.87, lon: 151.21 },
    'Australia/Melbourne': { nombre: 'Melbourne', lat: -37.81, lon: 144.96 },
    'Pacific/Auckland': { nombre: 'Auckland', lat: -36.85, lon: 174.76 },
};

// origen: 'zona' (la zona está en la tabla o es argentina),
// 'predeterminada' (zona desconocida: Resistencia), 'gps' (la persona
// tocó "Usar mi ubicación").
export function ubicacionDeZona(zona) {
    if (typeof zona === 'string') {
        if (ZONA_ARGENTINA.test(zona)) return { ...RESISTENCIA, origen: 'zona' };
        if (Object.hasOwn(CIUDADES, zona)) return { ...CIUDADES[zona], origen: 'zona' };
    }
    return { ...RESISTENCIA, origen: 'predeterminada' };
}

// Para el cielo alcanza con unos 10 km (0,1 grado), y guardar menos
// precisión es guardar menos de un dato personal.
export function redondearUbicacion(lat, lon) {
    return { lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 };
}

// Lee lo guardado (texto JSON) y devuelve { lat, lon } o null si no sirve.
export function leerUbicacionGuardada(texto) {
    if (!texto) return null;
    try {
        const v = JSON.parse(texto);
        if (
            typeof v?.lat === 'number' &&
            typeof v?.lon === 'number' &&
            Number.isFinite(v.lat) &&
            Number.isFinite(v.lon) &&
            Math.abs(v.lat) <= 90 &&
            Math.abs(v.lon) <= 180
        ) {
            return { lat: v.lat, lon: v.lon };
        }
    } catch {
        // texto corrupto: se trata como "no hay nada guardado"
    }
    return null;
}

// La que manda: la ubicación elegida a mano, si hay; si no, la de la zona.
export function ubicacionVigente(guardada, zona) {
    if (guardada) return { nombre: 'tu ubicación', ...guardada, origen: 'gps' };
    return ubicacionDeZona(zona);
}
