// cielo.js — el sol y la luna de esta noche, sobre suncalc 2.1.1.
//
// No se escribe astronomía propia: suncalc da la posición del sol y la
// luna y la fase. Acá solo se traduce eso a lo que la escena necesita.
// Funciones puras: reciben fecha y lugar, devuelven datos.
import { getPosition, getMoonPosition, getMoonIllumination } from 'suncalc';

// Alturas del sol (grados, ya corregidas por refracción) que separan los
// cuatro momentos. Son una elección de diseño, no un estándar: 6° sobre el
// horizonte todavía es luz de atardecer, y por debajo de -8° el cielo ya
// aguanta estrellas. Se ven a ojo en las capturas del paso 14d.
export const ALTURA_DIA = 6;
export const ALTURA_NOCHE = -8;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function alturaDelSol(fecha, lat, lon) {
    return getPosition(fecha, lat, lon).altitude;
}

// momento: 'dia' | 'atardecer' | 'noche' | 'amanecer'.
// luz: 0 (noche cerrada) a 1 (día pleno), continua, para mezclar colores y
// apagar estrellas sin saltos. El sol sube o baja según la altura diez
// minutos después.
export function momentoDelDia(fecha, lat, lon) {
    const altura = alturaDelSol(fecha, lat, lon);
    const luz = clamp((altura - ALTURA_NOCHE) / (ALTURA_DIA - ALTURA_NOCHE), 0, 1);
    if (altura >= ALTURA_DIA) return { momento: 'dia', altura, luz };
    if (altura <= ALTURA_NOCHE) return { momento: 'noche', altura, luz };
    const despues = alturaDelSol(new Date(fecha.getTime() + 10 * 60000), lat, lon);
    return { momento: despues > altura ? 'amanecer' : 'atardecer', altura, luz };
}

// La luna: fracción iluminada, si está creciente, altura y el ángulo con
// que hay que girar el dibujo para que la parte iluminada mire hacia donde
// mira de verdad. suncalc da el ángulo del borde claro respecto del norte
// celeste; restándole el ángulo paraláctico queda respecto de la vertical
// de quien mira.
export function luna(fecha, lat, lon) {
    const ilu = getMoonIllumination(fecha);
    const pos = getMoonPosition(fecha, lat, lon);
    return {
        fraccion: ilu.fraction,
        fase: ilu.phase,
        creciente: ilu.waxing,
        altura: pos.altitude,
        visible: pos.altitude > 0,
        inclinacion: ilu.angle - pos.parallacticAngle,
    };
}
