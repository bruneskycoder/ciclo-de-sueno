// escena-pintada.js — la pintura de fondo, animada por código.
//
// Se carga después de que la lista de horas ya se dibujó (ver main.js): la
// pintura es lo más pesado de la pantalla y nadie abre la app para mirarla
// antes que la hora. Mientras carga, y si no llega a cargar, la escena 2D
// de escena.js sigue a la vista; esta solo la reemplaza cuando ya tiene el
// primer cuadro listo.
//
// Las cuentas (viento, llama, titileo) están en escena-pintura.js y se
// prueban sin navegador; acá queda lo que necesita un canvas.
import contorno from '../../assets/escena/contorno-cielo.json';
import {
    W,
    H,
    FUEGO,
    VIENTO,
    CAJA,
    CUADROS_LLAMA,
    rnd,
    viento,
    corrimientoViento,
    titileo,
    cuadroDeLlama,
    armarCuadroLlama,
    separarLlama,
    SUELO,
    altoDelLienzo,
    luzDeBorde,
    tirasDeVidrio,
} from '../escena-pintura.js';
import { consumoDeLaNoche, fuerzaDelFuego } from '../fuego.js';
import { usualClock } from '../horas-sugeridas.js';
import { ocultarEscena2D } from './escena.js';
import {
    currentTimeZone,
    getOpenSleep,
    getSleepLogs,
    getUbicacion,
    onChange,
} from '../storage.js';
import { ubicacionVigente } from '../ubicacion.js';
import { luna as calcularLuna, momentoDelDia } from '../cielo.js';
import { LUNA, estrellasVisibles, mascaraLuna, visibilidadEstrellas } from '../estrellas.js';
import { tinteDelCielo } from '../tinte.js';

// Momentos del día en que se muestra la pintura. De noche es la pintura
// tal cual; al atardecer, de día y al amanecer, con el tinte de tinte.js
// (Bruno lo aprobó el 2026-11-12, paso 14d). Si algún momento se saca de
// acá, en ese momento vuelve la escena 2D y la imagen ni se baja. Con
// ?cielo=2026-12-21T19:30-03:00 en la dirección se ve el cielo de esa
// fecha, a cualquier hora.
export const MOMENTOS_PINTADOS = new Set(['noche', 'atardecer', 'dia', 'amanecer']);

// Opacidad de las tarjetas sobre la pintura, de noche cerrada y de día
// pleno. Medidas (2026-11-12) para que el texto tenue pase AA (4,5:1) en
// el borde de las letras, con el fuego detrás, que es el peor caso: con
// 0,6 de noche daba 2,5:1.
const VELO_NOCHE = 0.78;
const VELO_DIA = 0.85;

function fechaDePrueba() {
    const v = new URLSearchParams(location.search).get('cielo');
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
}

// Para las capturas del paso 15: ?noche=0.6 hace de cuenta que pasó el 60%
// de la noche planeada. Sin eso, sale de la noche en curso.
function numeroDePrueba(nombre, min, max) {
    const v = new URLSearchParams(location.search).get(nombre);
    if (v === null || v === '' || Number.isNaN(Number(v))) return null;
    return Math.min(max, Math.max(min, Number(v)));
}

const DESCRIPCION =
    'Un gaucho sentado junto a un fogón, de noche. Atrás, su caballo atado a un palenque y tres vacas echadas del otro lado del alambrado.';

// Tope de 30 cuadros por segundo: la pintura no gana nada con más y el
// teléfono gasta menos batería.
const INTERVALO = 1000 / 30;

// En el iPhone el alto de la ventana cambia cuando se esconden las barras
// al scrollear. El canvas toma el mayor alto visto para ese ancho: si
// achicara cada vez, se borraría y redibujaría a mitad del scroll.
let anchoVisto = 0;
let altoVisto = 0;
function altoDeLaPantalla() {
    const ancho = window.innerWidth;
    const alto = Math.max(window.innerHeight, document.documentElement.clientHeight);
    if (ancho !== anchoVisto) {
        anchoVisto = ancho;
        altoVisto = 0;
    }
    altoVisto = Math.max(altoVisto, alto);
    return altoDelLienzo(ancho, altoVisto);
}

// Lo que recibe la luz del fuego en el borde (paso 16).
const TARJETAS = '.tarjeta-anoche, .resultado, .accion, .enlaces';

// El canto de vidrio de la lista (paso 16b): ancho en puntos de pantalla,
// el mismo --canto de components.css, y cuánto corre la imagen pegado al
// borde, en proporción a ese ancho.
const CANTO = 8;
// 0,8 desde que Bruno lo vio en el iPhone (2026-11-12): con 0,45 no se
// notaba a tamaño de teléfono.
const CORRIMIENTO = 0.8;

function cargar(url) {
    return new Promise((ok, mal) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = mal;
        img.src = url;
    });
}

// Devuelve true si la pintura quedó a la vista y false si no pudo (sin
// red, ahorro de datos, un teléfono sin canvas): en ese caso no se toca
// nada y sigue la escena 2D.
export async function montarEscenaPintada() {
    // Con el ahorro de datos prendido no se baja una imagen de decoración.
    if (navigator.connection?.saveData) return false;

    // Si ahora no es un momento que la pintura sabe mostrar, ni se baja.
    const prueba = fechaDePrueba();
    const sitio = ubicacionVigente(getUbicacion(), currentTimeZone());
    const cuando = () => prueba ?? new Date();
    if (!prueba && !MOMENTOS_PINTADOS.has(momentoDelDia(cuando(), sitio.lat, sitio.lon).momento)) {
        return false;
    }

    const vista = document.createElement('canvas');
    vista.width = W;
    vista.height = altoDeLaPantalla();
    vista.className = 'escena-fondo';
    vista.setAttribute('role', 'img');
    vista.setAttribute('aria-label', DESCRIPCION);
    const ctx = vista.getContext('2d');
    if (!ctx) return false;
    ctx.imageSmoothingEnabled = false;

    let img;
    try {
        // Import diferido: el nombre con hash de la imagen sale del build y
        // no se pide hasta saber que hace falta.
        const { default: imagenUrl } = await import('../../assets/escena/noche-cielo-liso.webp');
        img = await cargar(imagenUrl);
    } catch {
        return false;
    }

    // La pintura limpia vive en un canvas aparte: solo se reescriben las
    // zonas que se mueven. La luz, las brasas, el humo y las estrellas se
    // dibujan encima en cada cuadro y no ensucian la base.
    const base = document.createElement('canvas');
    base.width = W;
    base.height = H;
    const baseCtx = base.getContext('2d');
    if (!baseCtx) return false;
    baseCtx.drawImage(img, 0, 0);

    let original;
    try {
        original = baseCtx.getImageData(0, 0, W, H);
    } catch {
        return false;
    }
    const src = new Uint32Array(original.data.buffer);
    const salida = new ImageData(new Uint8ClampedArray(original.data), W, H);
    const dst = new Uint32Array(salida.data.buffer);

    // La llama se arma en cuatro cuadros por cada tamaño. El tamaño baja
    // de a escalones de 5%: cada escalón son cuatro cuadros nuevos (unos
    // 8.500 píxeles cada uno), y en una noche se pasa por unos catorce.
    const capas = separarLlama(src);
    let llama = [];
    let llamaSola = [];
    let escalaLlama = -1;
    function prepararLlama(escala) {
        const e = Math.round(escala * 20) / 20;
        if (e === escalaLlama) return;
        escalaLlama = e;
        const cuadros = CUADROS_LLAMA.map((params) => armarCuadroLlama(src, params, capas, e));
        llama = cuadros.map(({ datos, w, h }) => new ImageData(datos, w, h));
        // La misma llama sin fondo, en un canvas, para pintarla encima de
        // la sombra (ver apagarLuzPintada).
        llamaSola = cuadros.map(({ datos, w, h, llama: es }) => {
            const solo = new Uint8ClampedArray(datos);
            for (let i = 0; i < es.length; i++) if (!es[i]) solo[i * 4 + 3] = 0;
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            c.getContext('2d').putImageData(new ImageData(solo, w, h), 0, 0);
            return c;
        });
        cuadroLlama = -1;
    }
    const ultimoViento = VIENTO.map(() => new Int8Array(H));

    function aplicarViento(t) {
        VIENTO.forEach((z, i) => {
            const memo = ultimoViento[i];
            let cambio = false;
            for (let y = z.punta; y <= z.base; y++) {
                const dx = corrimientoViento(z, y, t);
                if (dx === memo[y]) continue;
                memo[y] = dx;
                cambio = true;
                for (let x = z.x0; x < z.x1; x++) {
                    const xs = Math.min(z.x1 - 1, Math.max(z.x0, x - dx));
                    dst[y * W + x] = src[y * W + xs];
                }
            }
            if (cambio) {
                baseCtx.putImageData(
                    salida,
                    0,
                    0,
                    z.x0,
                    z.punta,
                    z.x1 - z.x0,
                    z.base - z.punta + 1,
                );
            }
        });
    }

    // Seis anillos de resplandor alrededor del fogón: elipses chatas (la
    // luz cae sobre el suelo) que se suman a lo pintado.
    function dibujarLuz(t) {
        const n = titileo(t);
        const f = fuego.fuerza;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 6; k++) {
            const rx = Math.round(((60 + k * 28) * (0.6 + 0.4 * f) * (1 + 0.04 * n)) / 2) * 2;
            ctx.fillStyle = `rgba(255,140,40,${0.03 * f * (1 + 0.25 * n)})`;
            ctx.beginPath();
            ctx.ellipse(FUEGO.x, 592, rx, rx * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Cada brasa es función pura del tiempo: no guarda estado, y por eso el
    // mismo instante da siempre el mismo cuadro.
    // Con el fuego bajo saltan menos chispas y llegan menos alto.
    function dibujarBrasas(t) {
        const cuantas = Math.round(16 * (0.25 + 0.75 * fuego.fuerza));
        for (let i = 0; i < cuantas; i++) {
            const periodo = 2.2 + rnd(i + 1) * 2.4;
            const u = (t / periodo + rnd(i + 50)) % 1;
            const alto = (70 + rnd(i + 9) * 85) * (0.4 + 0.6 * fuego.fuerza);
            const x =
                FUEGO.x +
                (rnd(i + 20) - 0.5) * 22 +
                Math.sin(t * 1.7 + i) * 6 * u +
                viento(t, 0.4) * 12 * u;
            const y = FUEGO.yBase - 12 - u * alto;
            ctx.globalAlpha = Math.min(1, (1 - u) * 1.6);
            ctx.fillStyle = u < 0.45 ? '#ffb640' : u < 0.75 ? '#e0701c' : '#8a2f1f';
            const lado = rnd(i + 70) > 0.8 ? 2 : 1;
            ctx.fillRect(Math.round(x), Math.round(y), lado, lado);
        }
        ctx.globalAlpha = 1;
    }

    function dibujarHumo(t) {
        for (let i = 0; i < 5; i++) {
            const periodo = 5 + rnd(i + 90) * 2.5;
            const u = (t / periodo + i / 5) % 1;
            const cx =
                FUEGO.x + 4 + u * 34 + Math.sin(t * 0.8 + i * 2) * 5 + viento(t, 0.4) * 10 * u;
            const cy = FUEGO.yBase - (FUEGO.yBase - FUEGO.yPunta) * fuego.fuerza - 4 - u * 120;
            const r = 4 + u * 15;
            ctx.globalAlpha = 0.2 * Math.min(1, u * 5) * (1 - u);
            ctx.fillStyle = '#7d93b0';
            // Disco con trama de tablero: parece humo y no una mancha lisa,
            // y queda en la grilla de píxeles de la pintura.
            for (let dy = -r; dy <= r; dy += 2) {
                for (let dx = -r; dx <= r; dx += 2) {
                    if (dx * dx + dy * dy > r * r) continue;
                    if (((dx + dy) / 2) & 1) continue;
                    ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 2, 2);
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    // ---------------- el fuego de esta noche (paso 15) ----------------
    // La fuerza del fuego sale de la noche en curso y de la hora del día.
    // Se recalcula con el cielo y al cambiar los datos. La pila de leños
    // que contaba los ciclos (15b) se sacó el 2026-11-12: la cantidad ya
    // está en la lista.
    let fuego = { fuerza: 1 };

    function refrescarFuego(momento) {
        const ahora = cuando();
        const abierta = getOpenSleep();
        const despertar = abierta?.intendedWaketime ?? usualClock(getSleepLogs(), 'waketimeActual');
        const consumo = numeroDePrueba('noche', 0, 1) ?? consumoDeLaNoche(abierta, despertar, ahora);
        fuego = { fuerza: fuerzaDelFuego({ consumo, momento }) };
        prepararLlama(fuego.fuerza);
    }

    // Lo pintado trae la luz de un fuego grande. Cuando el fuego baja, esa
    // luz se apaga con anillos que oscurecen y enfrían (multiplicar por un
    // azul de noche), más fuerte cerca del fogón, de a escalones como el
    // resplandor.
    function apagarLuzPintada() {
        const falta = 1 - fuego.fuerza;
        if (falta <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgb(70,82,128)';
        ctx.globalAlpha = 0.22 * falta;
        for (let k = 0; k < 6; k++) {
            const rx = 220 - k * 32;
            ctx.beginPath();
            ctx.ellipse(FUEGO.x, 585, rx, rx * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        ctx.drawImage(llamaSola[cuadroLlama], CAJA.x0, CAJA.y0);
    }

    // ---------------- el cielo de esta noche -----------------------
    // Se recalcula al arrancar y cada 30 segundos: el cielo gira 15° por
    // hora, así que más seguido no se nota.
    const capaCielo = document.createElement('canvas');
    capaCielo.width = W;
    capaCielo.height = H;
    const capaCtx = capaCielo.getContext('2d');
    const lunaImg = document.createElement('canvas');
    const LADO_LUNA = 2 * LUNA.radio + 1;
    lunaImg.width = lunaImg.height = LADO_LUNA;
    const lunaCtx = lunaImg.getContext('2d');
    let cielo = { estrellas: [], visibilidad: 0, lunaVisible: false, lunaAlpha: 0, lift: 0 };
    let proximoCielo = 0;

    function refrescarCielo() {
        const ahora = cuando();
        const { altura, luz, momento } = momentoDelDia(ahora, sitio.lat, sitio.lon);
        refrescarFuego(momento);
        const visibilidad = visibilidadEstrellas(altura);
        const l = calcularLuna(ahora, sitio.lat, sitio.lon);

        // Cielo nuevo (atardecer, día, amanecer): un degradé por encima del
        // contorno del monte.
        const tinte = tinteDelCielo(altura);
        // Cuánto tapan las tarjetas (ver --velo en components.css): más de
        // día, cuando el cielo detrás es claro.
        document.documentElement.style.setProperty(
            '--velo',
            String(VELO_NOCHE + (VELO_DIA - VELO_NOCHE) * luz),
        );
        // Y cuánto oscurece la sombra detrás del título (components.css).
        document.documentElement.style.setProperty('--luz-sol', luz.toFixed(2));
        capaCtx.clearRect(0, 0, W, H);
        if (tinte.opacidad > 0) {
            const g = capaCtx.createLinearGradient(0, 0, 0, 268);
            g.addColorStop(0, `rgb(${tinte.arriba.join(',')})`);
            g.addColorStop(1, `rgb(${tinte.horizonte.join(',')})`);
            capaCtx.globalAlpha = tinte.opacidad;
            capaCtx.fillStyle = g;
            capaCtx.beginPath();
            capaCtx.moveTo(0, 0);
            capaCtx.lineTo(W, 0);
            for (let x = W - 1; x >= 0; x--) capaCtx.lineTo(x + 1, contorno[x]);
            capaCtx.closePath();
            capaCtx.fill();
            capaCtx.globalAlpha = 1;
        }

        if (l.visible) {
            const m = mascaraLuna(LUNA.radio, l.fraccion, l.inclinacion);
            const datos = lunaCtx.createImageData(LADO_LUNA, LADO_LUNA);
            for (let i = 0; i < m.length; i++) {
                if (!m[i]) continue;
                const o = i * 4;
                // Parte iluminada en crema; la oscura, apenas un azul de
                // cielo (luz cenicienta) para que el disco no desaparezca.
                const clara = m[i] === 2;
                datos.data[o] = clara ? 232 : 40;
                datos.data[o + 1] = clara ? 220 : 52;
                datos.data[o + 2] = clara ? 196 : 82;
                datos.data[o + 3] = clara ? 255 : 90;
            }
            lunaCtx.putImageData(datos, 0, 0);
        }

        cielo = {
            estrellas: estrellasVisibles(ahora, sitio.lat, sitio.lon, contorno, {
                luna: l.visible,
            }),
            visibilidad,
            lunaVisible: l.visible,
            lunaAlpha: 1 - 0.6 * luz,
            lift: tinte.lift,
        };
    }

    // Las estrellas titilan cada una a su ritmo (sale de su número HIP).
    // Las brillantes llevan cuatro puntas; las débiles, un punto.
    function dibujarEstrellas(t) {
        if (cielo.visibilidad <= 0) return;
        ctx.fillStyle = '#e8dcc4';
        for (const e of cielo.estrellas) {
            const v = Math.sin(t * (0.9 + ((e.hip * 37) % 17) / 8) + ((e.hip * 2.399) % 6.2832));
            const peso = e.mag < 1.6 ? 1 : e.mag < 2.6 ? 0.8 : 0.6;
            ctx.globalAlpha = cielo.visibilidad * peso * (v > -0.5 ? 1 : 0.5);
            ctx.fillRect(e.x, e.y, e.mag < 1.2 ? 2 : 1, e.mag < 1.2 ? 2 : 1);
            if (e.mag < 2.6 && v > 0.4) {
                ctx.fillRect(e.x - 2, e.y, 5, 1);
                ctx.fillRect(e.x, e.y - 2, 1, 5);
            }
        }
        ctx.globalAlpha = 1;
    }

    function dibujarLuna() {
        if (!cielo.lunaVisible) return;
        ctx.globalAlpha = cielo.lunaAlpha;
        ctx.drawImage(lunaImg, LUNA.x - LUNA.radio, LUNA.y - LUNA.radio);
        ctx.globalAlpha = 1;
    }

    // ---------------- el vidrio de la lista (paso 16b) -----------------
    // Bajo el canto de la lista, la escena se dibuja corrida unos píxeles
    // hacia afuera (tirasDeVidrio). Se copia lo que ya está dibujado en este
    // cuadro y se pega encima, recortado a la forma redonda de la tarjeta.
    // Sin él, en modo brasa y con menos transparencia pedida: ahí la lista
    // es un velo liso (components.css).
    // Para comparar capturas: ?canto=0 dibuja la lista sin doblar nada,
    // ?canto=0.45 dobla como el primer intento y ?canto=1, al máximo.
    const corrimiento = numeroDePrueba('canto', 0, 1) ?? CORRIMIENTO;
    const copia = document.createElement('canvas');
    const copiaCtx = copia.getContext('2d');
    const sinTransparencia = window.matchMedia(
        '(prefers-reduced-transparency: reduce), (prefers-contrast: more)',
    );
    function vidrioEnLaLista() {
        if (document.documentElement.dataset.tema === 'brasa' || sinTransparencia.matches) return;
        const lista = document.querySelector('.resultado');
        if (!lista || !copiaCtx) return;
        const r = vista.getBoundingClientRect();
        const escala = r.width / W;
        const b = lista.getBoundingClientRect();
        const caja = {
            x0: Math.round((b.left - r.left) / escala),
            y0: Math.round((b.top - r.top) / escala),
            x1: Math.round((b.right - r.left) / escala),
            y1: Math.round((b.bottom - r.top) / escala),
        };
        if (caja.y1 <= 0 || caja.y0 >= vista.height || caja.x1 <= caja.x0) return;
        const banda = Math.round(CANTO / escala);
        const tiras = tirasDeVidrio(caja, banda, Math.round(banda * corrimiento), {
            ancho: W,
            alto: vista.height,
        });
        if (copia.width !== W || copia.height !== vista.height) {
            copia.width = W;
            copia.height = vista.height;
        }
        copiaCtx.clearRect(0, 0, W, vista.height);
        copiaCtx.drawImage(vista, 0, 0);
        ctx.save();
        ctx.beginPath();
        const radio = Math.round(10 / escala);
        if (ctx.roundRect) {
            ctx.roundRect(caja.x0, caja.y0, caja.x1 - caja.x0, caja.y1 - caja.y0, radio);
        } else {
            ctx.rect(caja.x0, caja.y0, caja.x1 - caja.x0, caja.y1 - caja.y0);
        }
        ctx.clip();
        for (const t of tiras) {
            ctx.drawImage(copia, t.sx, t.sy, t.sw, t.sh, t.dx, t.dy, t.sw, t.sh);
        }
        ctx.restore();
    }

    let cuadroLlama = -1;
    function dibujar(t) {
        const k = cuadroDeLlama(t);
        if (k !== cuadroLlama) {
            cuadroLlama = k;
            baseCtx.putImageData(llama[k], CAJA.x0, CAJA.y0);
        }
        aplicarViento(t);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(base, 0, 0);
        if (vista.height > H) {
            ctx.fillStyle = SUELO;
            ctx.fillRect(0, H, W, vista.height - H);
        }
        ctx.drawImage(capaCielo, 0, 0);
        if (cielo.lift > 0) {
            // Levanta la luz del conjunto (atardecer y día).
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(150,170,200,${cielo.lift})`;
            ctx.fillRect(0, 0, W, vista.height);
            ctx.globalCompositeOperation = 'source-over';
        }
        apagarLuzPintada();
        dibujarLuz(t);
        dibujarHumo(t);
        dibujarBrasas(t);
        dibujarEstrellas(t);
        dibujarLuna();
        vidrioEnLaLista();
        alumbrarTarjetas(t);
    }

    // ---------------- la luz en los bordes de las tarjetas -------------
    // El borde de cada tarjeta que mira al fuego se enciende con el mismo
    // titileo que el resplandor, y más cuanto más cerca está. El valor va
    // en --luz-arriba y --luz-abajo y el color lo pone components.css. En
    // modo brasa no hay resplandor y los bordes quedan apagados.
    const luzPuesta = new WeakMap();
    function alumbrarTarjetas(t) {
        const brasa = document.documentElement.dataset.tema === 'brasa';
        const r = vista.getBoundingClientRect();
        const escala = r.width / W;
        const fy = r.top + (FUEGO.yBase - 20) * escala;
        const alcance = 240 * escala;
        const n = titileo(t);
        for (const el of document.querySelectorAll(TARJETAS)) {
            const b = el.getBoundingClientRect();
            const arriba = brasa ? 0 : luzDeBorde(b.top - fy, alcance, fuego.fuerza, n);
            const abajo = brasa ? 0 : luzDeBorde(b.bottom - fy, alcance, fuego.fuerza, n);
            const antes = luzPuesta.get(el);
            if (antes && antes[0] === arriba && antes[1] === abajo) continue;
            luzPuesta.set(el, [arriba, abajo]);
            el.style.setProperty('--luz-arriba', String(arriba));
            el.style.setProperty('--luz-abajo', String(abajo));
        }
    }

    refrescarCielo();

    // Primer cuadro, y recién ahí se muestra y se saca la escena 2D: así
    // no hay un instante con las dos ni con ninguna.
    dibujar(0);
    document.body.prepend(vista);
    document.documentElement.classList.add('escena-pintada');
    ocultarEscena2D();
    performance.mark('escena-pintada-lista');

    // Movimiento: corre solo cuando hay algo que mostrar. Quieta con
    // "reducir movimiento" y en modo brasa (a oscuras, lo único que mira el
    // ojo es lo que se mueve); sin cuadros con la pestaña oculta.
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pedido = 0;
    let scrollHasta = 0;

    function detener() {
        cancelAnimationFrame(pedido);
        pedido = 0;
    }

    function actualizar() {
        detener();
        const quieta = document.documentElement.dataset.tema === 'brasa' || reducido.matches;
        refrescarCielo();
        if (quieta) {
            dibujar(0);
            return;
        }
        if (document.hidden) return;
        const inicio = performance.now();
        let ultimo = -Infinity;
        const paso = (ahora) => {
            pedido = requestAnimationFrame(paso);
            // Mientras se scrollea, cada cuadro: el canto de vidrio se
            // dibuja donde está la lista, y a 30 cuadros quedaría atrás.
            const scrolleando = ahora < scrollHasta;
            if (!scrolleando && ahora - ultimo < INTERVALO - 2) return;
            ultimo = ahora;
            if (!prueba && ahora > proximoCielo) {
                proximoCielo = ahora + 30000;
                refrescarCielo();
            }
            dibujar((ahora - inicio) / 1000);
        };
        pedido = requestAnimationFrame(paso);
    }

    // Con la escena quieta (movimiento reducido o modo brasa) no hay
    // cuadros, pero al scrollear las tarjetas se acercan o se alejan del
    // fuego y el canto de vidrio sigue a la lista: se redibuja una vez.
    let pedidoScroll = 0;
    window.addEventListener(
        'scroll',
        () => {
            scrollHasta = performance.now() + 200;
            if (pedido || pedidoScroll) return;
            pedidoScroll = requestAnimationFrame(() => {
                pedidoScroll = 0;
                dibujar(0);
            });
        },
        { passive: true },
    );

    // Si la pantalla cambia de tamaño (girar el teléfono), el canvas toma
    // el alto nuevo. Cambiarle el alto lo borra y le resetea el suavizado.
    window.addEventListener('resize', () => {
        const alto = altoDeLaPantalla();
        if (alto === vista.height) return;
        vista.height = alto;
        ctx.imageSmoothingEnabled = false;
        actualizar();
    });

    document.addEventListener('visibilitychange', actualizar);
    reducido.addEventListener('change', actualizar);
    sinTransparencia.addEventListener('change', actualizar);
    new MutationObserver(actualizar).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-tema'],
    });
    // Empezar o terminar la noche cambia el fuego.
    onChange(actualizar);
    actualizar();
    return true;
}
