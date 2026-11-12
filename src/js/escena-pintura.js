// escena-pintura.js — las cuentas de la escena pintada, sin tocar el DOM.
//
// Todo está en píxeles de la pintura (572 × 1024), no de la pantalla. Las
// medidas salen de mirar `noche-cielo-liso` (el prototipo
// `escena-pintada.html` las probó sobre la pintura con cielo). Acá viven
// separadas del dibujo para poder probarlas: cada función depende solo de
// sus argumentos y del tiempo, así que el mismo tiempo da el mismo cuadro.

export const W = 572;
export const H = 1024;

export const FUEGO = { x: 292, yBase: 606, yPunta: 518 };

// Zonas que se mueven con el viento. `punta` es lo más alto de la copa o
// del pasto y `base` donde se agarra al suelo: el desplazamiento vale cero
// en la base y crece hacia la punta, para que troncos y suelo no resbalen.
export const VIENTO = [
    { x0: 0, x1: 180, punta: 192, base: 330, amp: 4, fase: 0.0 },
    { x0: 148, x1: 200, punta: 232, base: 320, amp: 3, fase: 1.3 },
    { x0: 200, x1: 292, punta: 244, base: 320, amp: 3, fase: 2.1 },
    { x0: 345, x1: 402, punta: 262, base: 300, amp: 2, fase: 0.7 },
    { x0: 500, x1: 572, punta: 700, base: 790, amp: 2, fase: 0.4 },
    { x0: 428, x1: 462, punta: 702, base: 738, amp: 1.5, fase: 1.8 },
    { x0: 55, x1: 180, punta: 705, base: 765, amp: 1, fase: 2.6 },
    { x0: 205, x1: 270, punta: 765, base: 805, amp: 1, fase: 0.9 },
    { x0: 470, x1: 572, punta: 600, base: 645, amp: 1, fase: 1.1 },
];

// Caja donde se deforma la llama pintada. Se corta en x=322 porque ahí
// está el palenque, que no tiene que moverse.
export const CAJA = { x0: 246, x1: 322, y0: 500, y1: 612 };

// Estrellas provisorias: las posiciones de las que tenía la pintura con
// cielo. El paso 14c las reemplaza por las del catálogo, proyectadas según
// la hora y recortadas por el contorno del monte. Ritmo y fase de cada una
// salen de su número, así ninguna titila al mismo tiempo que otra.
export const ESTRELLAS = [
    [328, 56], [353, 82], [301, 81], [526, 40], [144, 16], [557, 9],
    [475, 58], [178, 107], [466, 103], [421, 127], [21, 135],
    [218, 135], [478, 147], [244, 11], [417, 28], [176, 45],
].map(([x, y], i) => ({
    x,
    y,
    w: 0.9 + ((i * 37) % 17) / 8,
    fase: (i * 2.399) % (Math.PI * 2),
}));

// Pseudoaleatorio fijo: mismas brasas en cada recarga, así una captura se
// puede comparar con otra.
export function rnd(s) {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

export const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

// Ráfaga lenta más un vaivén, entre -1 y 1.
export function viento(t, fase) {
    const rafaga = 0.5 + 0.5 * Math.sin(t * 0.45 + fase);
    const vaiven = Math.sin(t * 1.5 + fase + 0.8 * Math.sin(t * 0.37));
    return (0.35 + 0.65 * rafaga) * vaiven;
}

// Cuántos píxeles se corre la fila `y` de una zona. Siempre un entero: con
// fracciones de píxel todo tiembla y parece un error de la imagen (se probó
// a ojo en el prototipo). Vale 0 en la base y crece hacia la punta.
export function corrimientoViento(zona, y, t) {
    const alto = Math.pow((zona.base - y) / (zona.base - zona.punta), 1.5);
    return Math.round(zona.amp * alto * viento(t, zona.fase));
}

// Titileo del fuego: sube y baja de a saltos, no suave. Devuelve uno de
// siete niveles entre -1 y 1 (redondea a tercios).
export function titileo(t) {
    const n =
        Math.sin(t * 11) * 0.5 + Math.sin(t * 17.3 + 1) * 0.3 + Math.sin(t * 5.1 + 2) * 0.2;
    return Math.round(n * 3) / 3;
}

// Cuatro cuadros de llama que salen de deformar la pintada: inclinar la
// punta, ondularla, estirarla. Una llama dibujada aparte desentonaría.
export const CUADROS_LLAMA = [
    { s: 1.0, inclina: -2, fase: 0.7 },
    { s: 0.94, inclina: 1, fase: 2.3 },
    { s: 1.05, inclina: 2, fase: 3.9 },
    { s: 0.98, inclina: -1, fase: 5.4 },
];
// Orden fijo pero que no se nota como vuelta.
export const SECUENCIA_LLAMA = [0, 1, 2, 3, 1, 3, 0, 2, 3, 1, 0, 2];

// Qué cuadro de la secuencia toca en el segundo `t` (8 por segundo). El
// primer cuadro de requestAnimationFrame puede traer una marca apenas
// anterior al momento en que se tomó el inicio, y el tiempo da negativo:
// se trata como 0.
export function cuadroDeLlama(t) {
    return SECUENCIA_LLAMA[Math.floor(Math.max(0, t) * 8) % SECUENCIA_LLAMA.length];
}

// Arma un cuadro de llama sobre `src` (la pintura como Uint32Array de
// W × H píxeles RGBA). Devuelve los bytes de una imagen del tamaño de CAJA.
export function armarCuadroLlama(src, { s, inclina, fase }) {
    const w = CAJA.x1 - CAJA.x0;
    const h = CAJA.y1 - CAJA.y0;
    const datos = new Uint8ClampedArray(w * h * 4);
    const px = new Uint32Array(datos.buffer);
    for (let y = CAJA.y0; y < CAJA.y1; y++) {
        // 0 en la base de la llama (los leños no se mueven), 1 en la punta.
        const alto = limitar((590 - y) / 72, 0, 1);
        const arriba = limitar((y - CAJA.y0) / 20, 0, 1);
        const sEf = 1 + (s - 1) * arriba;
        const ySrc = Math.round(y < 590 ? 590 - (590 - y) * sEf : y);
        const corrim = Math.round(
            2.6 * Math.pow(alto, 1.1) * Math.sin(fase + y * 0.13) + inclina * alto * alto,
        );
        for (let x = CAJA.x0; x < CAJA.x1; x++) {
            // El corrimiento se apaga hacia los bordes de la caja para que
            // no quede un escalón contra lo de afuera.
            const peso = limitar(Math.min(x - CAJA.x0, CAJA.x1 - x) / 10, 0, 1);
            const xSrc = limitar(x - Math.round(corrim * peso), CAJA.x0, CAJA.x1 - 1);
            px[(y - CAJA.y0) * w + (x - CAJA.x0)] = src[ySrc * W + xSrc];
        }
    }
    return { datos, w, h };
}
