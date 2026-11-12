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
import imagenUrl from '../../assets/escena/noche-cielo-liso.webp';
import {
    W,
    H,
    FUEGO,
    VIENTO,
    CAJA,
    ESTRELLAS,
    CUADROS_LLAMA,
    rnd,
    viento,
    corrimientoViento,
    titileo,
    cuadroDeLlama,
    armarCuadroLlama,
} from '../escena-pintura.js';
import { ocultarEscena2D } from './escena.js';

const DESCRIPCION =
    'Un gaucho sentado junto a un fogón, de noche. Atrás, su caballo atado a un palenque y tres vacas echadas del otro lado del alambrado.';

// Tope de 30 cuadros por segundo: la pintura no gana nada con más y el
// teléfono gasta menos batería.
const INTERVALO = 1000 / 30;

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

    const vista = document.createElement('canvas');
    vista.width = W;
    vista.height = H;
    vista.className = 'escena-fondo';
    vista.setAttribute('role', 'img');
    vista.setAttribute('aria-label', DESCRIPCION);
    const ctx = vista.getContext('2d');
    if (!ctx) return false;
    ctx.imageSmoothingEnabled = false;

    let img;
    try {
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

    const llama = CUADROS_LLAMA.map((params) => {
        const { datos, w, h } = armarCuadroLlama(src, params);
        return new ImageData(datos, w, h);
    });
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
                baseCtx.putImageData(salida, 0, 0, z.x0, z.punta, z.x1 - z.x0, z.base - z.punta + 1);
            }
        });
    }

    // Seis anillos de resplandor alrededor del fogón: elipses chatas (la
    // luz cae sobre el suelo) que se suman a lo pintado.
    function dibujarLuz(t) {
        const n = titileo(t);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 6; k++) {
            const rx = Math.round(((60 + k * 28) * (1 + 0.04 * n)) / 2) * 2;
            ctx.fillStyle = `rgba(255,140,40,${0.03 * (1 + 0.25 * n)})`;
            ctx.beginPath();
            ctx.ellipse(FUEGO.x, 592, rx, rx * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Cada brasa es función pura del tiempo: no guarda estado, y por eso el
    // mismo instante da siempre el mismo cuadro.
    function dibujarBrasas(t) {
        for (let i = 0; i < 16; i++) {
            const periodo = 2.2 + rnd(i + 1) * 2.4;
            const u = (t / periodo + rnd(i + 50)) % 1;
            const alto = 70 + rnd(i + 9) * 85;
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
            const cy = FUEGO.yPunta - 4 - u * 120;
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

    // Provisorias (ver ESTRELLAS en escena-pintura.js): un punto fijo y, a
    // ratos, el brillo de cuatro puntas.
    function dibujarEstrellas(t) {
        for (const e of ESTRELLAS) {
            ctx.fillStyle = 'rgba(232,220,196,0.55)';
            ctx.fillRect(e.x, e.y, 1, 1);
            if (Math.sin(t * e.w + e.fase) > 0.4) {
                ctx.fillStyle = 'rgba(232,220,196,0.9)';
                ctx.fillRect(e.x - 2, e.y, 5, 1);
                ctx.fillRect(e.x, e.y - 2, 1, 5);
            }
        }
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
        dibujarLuz(t);
        dibujarHumo(t);
        dibujarBrasas(t);
        dibujarEstrellas(t);
    }

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

    function detener() {
        cancelAnimationFrame(pedido);
        pedido = 0;
    }

    function actualizar() {
        detener();
        const quieta = document.documentElement.dataset.tema === 'brasa' || reducido.matches;
        if (quieta) {
            dibujar(0);
            return;
        }
        if (document.hidden) return;
        const inicio = performance.now();
        let ultimo = -Infinity;
        const paso = (ahora) => {
            pedido = requestAnimationFrame(paso);
            if (ahora - ultimo < INTERVALO - 2) return;
            ultimo = ahora;
            dibujar((ahora - inicio) / 1000);
        };
        pedido = requestAnimationFrame(paso);
    }

    document.addEventListener('visibilitychange', actualizar);
    reducido.addEventListener('change', actualizar);
    new MutationObserver(actualizar).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-tema'],
    });
    actualizar();
    return true;
}
