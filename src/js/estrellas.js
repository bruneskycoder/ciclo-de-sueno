// estrellas.js — dónde cae cada estrella sobre la pintura, y cómo se ve la
// luna. Todo función pura: fecha y lugar entran, píxeles salen.
//
// La pintura mira hacia el sur. No es una carta celeste exacta sino una
// ventana: el centro es el sur (azimut 180°), el horizonte está a la altura
// del monte, y cada grado vale PX_POR_GRADO píxeles. Hacia los costados los
// azimuts se juntan con el coseno de la altura, como pasa en un cielo real
// mirado de cerca del cenit. Lo que cae fuera de la ventana, o detrás del
// monte, no se dibuja.
import { ESTRELLAS_CATALOGO } from './estrellas-datos.js';

export const RAD = Math.PI / 180;

export const VENTANA = {
    centroX: 286, // mitad de la pintura
    horizonteY: 268, // donde el monte tapa el cielo (ver contorno-cielo.json)
    pxPorGrado: 4.09, // 572 px = 140° de ancho
    azimutCentro: 180, // el sur
};

// Posición de la luna en la pintura: donde estaba la pintada (centro y
// radio medidos sobre noche.png).
export const LUNA = { x: 91, y: 79, radio: 22 };

// Tiempo sidéreo local, en grados (fórmula del Almanaque Astronómico, error
// de décimas de segundo de arco en décadas alrededor del 2000).
export function tiempoSidereo(fecha, lonGrados) {
    const dias = fecha.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const gmst = 280.46061837 + 360.98564736629 * dias;
    return (((gmst + lonGrados) % 360) + 360) % 360;
}

// Altura y azimut (grados; el azimut cuenta desde el norte hacia el este)
// de un punto de ascensión recta `ra` y declinación `dec`.
export function altAz(ra, dec, fecha, lat, lon) {
    const H = (tiempoSidereo(fecha, lon) - ra) * RAD;
    const phi = lat * RAD;
    const d = dec * RAD;
    const sinAlt = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    // Azimut desde el sur hacia el oeste, y +180 para llevarlo al norte.
    const aSur = Math.atan2(
        Math.sin(H),
        Math.cos(H) * Math.sin(phi) - Math.tan(d) * Math.cos(phi),
    );
    const az = (((aSur / RAD + 180) % 360) + 360) % 360;
    return { alt: alt / RAD, az };
}

// Pasa altura y azimut a píxeles de la pintura. null si queda fuera.
export function aPantalla(alt, az, ancho = 572) {
    if (alt <= 0) return null;
    let dif = az - VENTANA.azimutCentro;
    dif = ((((dif + 180) % 360) + 360) % 360) - 180;
    const x = Math.round(VENTANA.centroX + dif * Math.cos(alt * RAD) * VENTANA.pxPorGrado);
    const y = Math.round(VENTANA.horizonteY - alt * VENTANA.pxPorGrado);
    if (x < 2 || x >= ancho - 2 || y < 2) return null;
    return { x, y };
}

// Las estrellas que se ven: sobre el horizonte, dentro de la ventana y con
// el cielo libre (por encima del contorno del monte, con un margen). Las
// que caen sobre la luna se saltean. `contorno[x]` es la fila donde
// termina el cielo en la columna x.
export function estrellasVisibles(fecha, lat, lon, contorno, { luna = true } = {}) {
    const salida = [];
    for (const [hip, ra, dec, mag] of ESTRELLAS_CATALOGO) {
        const { alt, az } = altAz(ra, dec, fecha, lat, lon);
        const p = aPantalla(alt, az, contorno.length);
        if (!p) continue;
        if (p.y > contorno[p.x] - 4) continue;
        if (luna && Math.hypot(p.x - LUNA.x, p.y - LUNA.y) < LUNA.radio + 8) continue;
        salida.push({ hip, mag, x: p.x, y: p.y });
    }
    return salida;
}

// Cuánto se ven las estrellas según la altura del sol: nada con el sol
// por encima de -2°, todas por debajo de -8°.
export function visibilidadEstrellas(alturaSol) {
    return Math.min(1, Math.max(0, (-2 - alturaSol) / 6));
}

// Máscara de la luna: un cuadrado de (2r+1) × (2r+1) con 0 afuera del
// disco, 1 en la parte oscura y 2 en la iluminada. `inclinacion` es el
// ángulo, en grados y en sentido antihorario desde "arriba", hacia donde
// mira el borde iluminado (en cielo.js: angle - parallacticAngle).
export function mascaraLuna(radio, fraccion, inclinacion) {
    const lado = 2 * radio + 1;
    const m = new Uint8Array(lado * lado);
    const th = inclinacion * RAD;
    const lx = -Math.sin(th);
    const ly = Math.cos(th);
    const c = 1 - 2 * fraccion;
    const r2 = radio * radio + radio; // el mismo radio para el disco y el terminador
    for (let j = 0; j < lado; j++) {
        for (let i = 0; i < lado; i++) {
            const x = i - radio;
            const y = radio - j; // hacia arriba es positivo
            if (x * x + y * y > r2) continue;
            const a = x * lx + y * ly;
            const b = -x * ly + y * lx;
            const ancho = Math.sqrt(Math.max(0, r2 - b * b));
            m[j * lado + i] = a > c * ancho ? 2 : 1;
        }
    }
    return m;
}
