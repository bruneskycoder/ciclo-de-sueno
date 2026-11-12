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

// Color del suelo de la fila 860 para abajo: es uno solo, sin variación
// (medido sobre noche-cielo-liso). Con él se extiende la pintura en una
// pantalla más alta que 9:16, sin que se vea el empalme.
export const SUELO = 'rgb(30,20,23)';

// Alto del canvas para una pantalla de ancho × alto: la pintura entra a lo
// ancho y, si sobra pantalla abajo, el canvas crece con suelo. En una
// pantalla más ancha que 9:16 manda el alto y el canvas queda como la
// pintura.
export function altoDelLienzo(ancho, alto) {
    if (!(ancho > 0) || !(alto > 0)) return H;
    return Math.max(H, Math.ceil((W * alto) / ancho));
}

// Cuánto alumbra el fuego el borde de una tarjeta, de 0 a 1: más cerca,
// más luz; con el fuego bajo, menos. `n` es el titileo del mismo instante
// (el mismo que mueve el resplandor), así el borde late con la llama. Va
// de a escalones de 0,05: cada cambio repinta la tarjeta, y de a poco no
// se nota la diferencia.
export function luzDeBorde(distancia, alcance, fuerza, n) {
    if (!(alcance > 0)) return 0;
    const cerca = Math.max(0, 1 - Math.abs(distancia) / alcance);
    const v = fuerza * (0.8 + 0.2 * n) * cerca;
    return Math.max(0, Math.min(1, Math.round(v * 20) / 20));
}

// ---------------- vidrio en el borde de la lista (paso 16b) ----------
// El canto de la tarjeta dobla lo que hay detrás, como un vidrio viejo de
// ventana: pegado al borde se ve lo que está unos píxeles más afuera, y el
// corrimiento se apaga hacia adentro. Siempre en píxeles enteros de la
// pintura, como el viento: medio píxel se vería borroso o temblaría.
export function desplazamientoBorde(d, ancho, maximo) {
    if (!(ancho > 0) || d < 0 || d >= ancho) return 0;
    const u = 1 - d / ancho;
    return Math.round(maximo * u * u);
}

// Las copias que arman el canto de una tarjeta: rectángulos de la pintura
// (origen) que se pegan corridos en el borde (destino), listos para
// drawImage. `caja` va en píxeles de la pintura, con x1 e y1 afuera. Las
// filas o columnas seguidas con el mismo corrimiento van en una sola copia.
// Lo que caería afuera del lienzo se recorta al borde.
export function tirasDeVidrio(caja, ancho, maximo, lienzo) {
    const { x0, y0, x1, y1 } = caja;
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return [];
    const banda = Math.min(ancho, Math.floor(w / 2), Math.floor(h / 2));
    const tiras = [];
    const limitar = (v, max) => Math.max(0, Math.min(max, v));
    // Agrupa d = 0..banda-1 en tramos con el mismo corrimiento.
    const tramos = [];
    for (let d = 0; d < banda; d++) {
        const off = desplazamientoBorde(d, banda, maximo);
        if (off === 0) break;
        const ult = tramos[tramos.length - 1];
        if (ult && ult.off === off) ult.n++;
        else tramos.push({ d, n: 1, off });
    }
    for (const { d, n, off } of tramos) {
        // Arriba: lo de más arriba baja al borde.
        const ya = y0 + d;
        tiras.push({ sx: x0, sy: limitar(ya - off, lienzo.alto - n), sw: w, sh: n, dx: x0, dy: ya });
        // Abajo: lo de más abajo sube.
        const yb = y1 - d - n;
        tiras.push({ sx: x0, sy: limitar(yb + off, lienzo.alto - n), sw: w, sh: n, dx: x0, dy: yb });
        // Izquierda y derecha.
        const xi = x0 + d;
        tiras.push({ sx: limitar(xi - off, lienzo.ancho - n), sy: y0, sw: n, sh: h, dx: xi, dy: y0 });
        const xd = x1 - d - n;
        tiras.push({ sx: limitar(xd + off, lienzo.ancho - n), sy: y0, sw: n, sh: h, dx: xd, dy: y0 });
    }
    return tiras;
}

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
    const n = Math.sin(t * 11) * 0.5 + Math.sin(t * 17.3 + 1) * 0.3 + Math.sin(t * 5.1 + 2) * 0.2;
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

// Base de la llama: de acá para abajo están los leños, que no se mueven.
export const BASE_LLAMA = 590;

// ¿Este píxel de (x, y) es fuego? Tres casos, con umbrales medidos sobre
// la pintura fila por fila en la caja de la llama:
// - el centro blanco amarillento (rojo y verde muy altos);
// - naranja claro, o el contorno naranja oscuro de las lenguas (rojo
//   alto, casi nada de azul);
// - las lenguas finas de arriba, que la pintura hace semitransparentes:
//   solo entre y 512 y 566 y lejos de los bordes de la caja, donde el
//   fondo es suelo azulado (#5b3b2f) y no pasto iluminado.
// El suelo iluminado de abajo (#8f5230, #ae5725) queda afuera.
export function esFuego(v, x = FUEGO.x, y = 540) {
    const r = v & 255;
    const g = (v >> 8) & 255;
    const b = (v >> 16) & 255;
    if (r > 0xe0 && g > 0xa0) return true;
    if ((r > 0xc8 && g > 0x55 && r - b > 0x70) || (r > 0x70 && b < 0x18)) return true;
    return y >= 512 && y < 566 && x >= 256 && x < 318 && r > 0x88 && r - b > 0x40;
}

/**
 * Separa la llama del fondo para poder achicarla (paso 15a). Devuelve:
 * - `mascara`: 1 donde la pintura es fuego, dentro de la caja (también el
 *   que se ve entre los leños);
 * - `fondo`: la pintura con la llama borrada. Lo que tapaba la llama se
 *   rellena fila por fila, mezclando el primer píxel que no es fuego a
 *   cada lado. El fondo detrás del fuego son bandas de suelo
 *   horizontales, así que el relleno por fila no deja costura.
 */
export function separarLlama(src) {
    const mascara = new Uint8Array(W * H);
    const fondo = new Uint32Array(src);
    for (let y = CAJA.y0; y < CAJA.y1; y++) {
        for (let x = CAJA.x0; x < CAJA.x1; x++) {
            if (esFuego(src[y * W + x], x, y)) mascara[y * W + x] = 1;
        }
    }
    // Un píxel de margen: el borde de la llama viene mezclado con el fondo
    // y, si se deja, queda dibujando el contorno de la llama grande.
    const crudo = mascara.slice();
    for (let y = CAJA.y0; y < CAJA.y1; y++) {
        for (let x = CAJA.x0; x < CAJA.x1; x++) {
            const i = y * W + x;
            if (crudo[i]) continue;
            if (
                (x > CAJA.x0 && crudo[i - 1]) ||
                (x < CAJA.x1 - 1 && crudo[i + 1]) ||
                (y > CAJA.y0 && crudo[i - W]) ||
                (y < CAJA.y1 - 1 && crudo[i + W])
            ) {
                mascara[i] = 1;
            }
        }
    }
    for (let y = CAJA.y0; y < CAJA.y1; y++) {
        let x = CAJA.x0;
        while (x < CAJA.x1) {
            if (!mascara[y * W + x]) {
                x++;
                continue;
            }
            const desde = x;
            while (x < CAJA.x1 && mascara[y * W + x]) x++;
            // El tramo de fuego va de `desde` a x-1. Sus vecinos limpios:
            const a = src[y * W + Math.max(CAJA.x0 - 1, desde - 1)];
            const b = src[y * W + Math.min(CAJA.x1, x)];
            const largo = x - desde + 1;
            for (let i = desde; i < x; i++) {
                const t = (i - desde + 1) / largo;
                fondo[y * W + i] = mezclar(a, b, t);
            }
        }
    }
    return { mascara, fondo };
}

function mezclar(a, b, t) {
    let v = 0;
    for (let k = 0; k < 32; k += 8) {
        const ca = (a >>> k) & 255;
        const cb = (b >>> k) & 255;
        v |= Math.round(ca + (cb - ca) * t) << k;
    }
    return v >>> 0;
}

// Arma un cuadro de llama sobre `src` (la pintura como Uint32Array de
// W × H píxeles RGBA). Devuelve los bytes de una imagen del tamaño de CAJA.
//
// Con `capas` (lo que devuelve separarLlama) y `escala` menor que 1, la
// llama se achica hacia su base y se angosta hacia el centro, y lo que
// deja libre muestra el fondo sin fuego. Sin `capas`, el cuadro sale como
// en el paso 13: la caja entera se deforma.
export function armarCuadroLlama(src, { s, inclina, fase }, capas = null, escala = 1) {
    const w = CAJA.x1 - CAJA.x0;
    const h = CAJA.y1 - CAJA.y0;
    const datos = new Uint8ClampedArray(w * h * 4);
    const px = new Uint32Array(datos.buffer);
    // 1 en los píxeles que son llama en este cuadro: la escena los vuelve
    // a dibujar encima de la sombra que apaga la luz pintada, porque el
    // fuego es la fuente de luz y no se oscurece.
    const llama = new Uint8Array(w * h);
    // Al achicarse, la llama también se angosta, pero menos que lo que
    // baja: un fuego chico sigue siendo ancho de base.
    const ancho = 0.55 + 0.45 * escala;
    for (let y = CAJA.y0; y < CAJA.y1; y++) {
        // 0 en la base de la llama (los leños no se mueven), 1 en la punta.
        const alto = limitar((BASE_LLAMA - y) / 72, 0, 1);
        const arriba = limitar((y - CAJA.y0) / 20, 0, 1);
        const sEf = (1 + (s - 1) * arriba) / escala;
        const ySrc = Math.round(y < BASE_LLAMA ? BASE_LLAMA - (BASE_LLAMA - y) * sEf : y);
        const corrim = Math.round(
            (2.6 * Math.pow(alto, 1.1) * Math.sin(fase + y * 0.13) + inclina * alto * alto) *
                Math.sqrt(escala),
        );
        for (let x = CAJA.x0; x < CAJA.x1; x++) {
            // El corrimiento se apaga hacia los bordes de la caja para que
            // no quede un escalón contra lo de afuera.
            const peso = limitar(Math.min(x - CAJA.x0, CAJA.x1 - x) / 10, 0, 1);
            const i = (y - CAJA.y0) * w + (x - CAJA.x0);
            if (!capas) {
                const xSrc = limitar(x - Math.round(corrim * peso), CAJA.x0, CAJA.x1 - 1);
                px[i] = src[ySrc * W + xSrc];
                continue;
            }
            // Entre los leños el fuego también se angosta, pero no baja ni
            // se mueve: si no, queda un escalón a la altura de la base.
            const xSrc =
                Math.round(FUEGO.x + (x - FUEGO.x) / ancho) -
                (y < BASE_LLAMA ? Math.round(corrim * peso) : 0);
            const dentro = ySrc >= CAJA.y0 && xSrc >= CAJA.x0 && xSrc < CAJA.x1;
            // Abajo de la base, la llama solo entra donde ya había fuego:
            // nunca tapa un leño ni una piedra.
            const libre = y < BASE_LLAMA || capas.mascara[y * W + x];
            if (dentro && libre && capas.mascara[ySrc * W + xSrc]) {
                px[i] = enrojecer(src[ySrc * W + xSrc], escala);
                llama[i] = 1;
            } else if (y >= BASE_LLAMA && !capas.mascara[y * W + x]) {
                // Leños y piedras: quietos.
                px[i] = src[y * W + x];
            } else {
                px[i] = capas.fondo[y * W + x];
            }
        }
    }
    return { datos, w, h, llama };
}

// Un fuego que se apaga pierde el amarillo: baja el verde y el azul y
// queda naranja y rojo, como brasa. Con escala 1, el píxel no cambia.
export function enrojecer(v, escala) {
    if (escala >= 1) return v;
    const r = v & 255;
    const g = Math.round(((v >> 8) & 255) * (0.55 + 0.45 * escala));
    const b = Math.round(((v >> 16) & 255) * (0.35 + 0.65 * escala));
    return ((v & 0xff000000) | (b << 16) | (g << 8) | r) >>> 0;
}

// ---------------- la leña al lado del fogón (paso 15b) ----------------
//
// Leños vistos de punta, apilados en pirámide a la derecha del círculo de
// piedras, sobre suelo libre (entre la pava y las patas del caballo). Se
// eligió de punta porque un leño de costado al lado de otro se lee como
// uno solo más largo; los cortes se cuentan. La cámara mira desde arriba,
// así que de cada leño se ve el corte y, detrás, la corteza de arriba.
// Del tamaño de los leños del fogón (unos 9 píxeles de grueso). Colores:
// corteza como la de los leños pintados; el corte, más claro que el suelo
// iluminado para que se despegue de él.
export const LENA = { x: 410, y: 656 };

// k contorno, c corte, a anillo, m centro, b corteza, l corteza del lado
// del fuego.
export const PALETA_LENA = {
    k: '#22140c',
    c: '#c99a62',
    a: '#9a6a40',
    m: '#7a4a2a',
    b: '#4e2e1c',
    l: '#8a4a26',
};

export const SPRITE_LENO = [
    '...kkkkk...',
    '..klbbbbk..',
    '.kllbbbbbk.',
    'kllbbbbbbbk',
    'kllbbbbbbbk',
    'klkkkkkkkbk',
    'kkccccccckk',
    'kccaaaaacck',
    'kcaacccaack',
    'kcacmmmcack',
    'kcaacccaack',
    'kccaaaaacck',
    'kkccccccckk',
    '.kkkkkkkkk.',
];

// Dónde va cada leño, en orden: primero la fila de abajo (tres), después
// dos encima, y uno arriba. Esquina superior izquierda, relativa a LENA
// (que es el pie de la pila). Los vecinos comparten la columna del
// contorno, y cada corte de arriba apoya sobre los dos de abajo.
export const PILA_LENA = [
    [0, -14],
    [10, -14],
    [20, -14],
    [5, -22],
    [15, -22],
    [10, -30],
];
