// escena.js — la ilustración de la cabecera: un gaucho sentado junto al
// fogón, en pixel art animado, de día o de noche según la hora.
//
// Por qué así y no una imagen. Los sprites están escritos como texto acá
// abajo: cada carácter es un píxel y cada letra un color. Eso los hace
// leerse y editarse en el código —se ve el dibujo mirando el archivo—,
// pesan unos cientos de bytes en vez de un PNG, y no hay un pedido de red
// más. Para animar una llama alcanza con cambiar de cuadro.
//
// Se dibuja en un <canvas> con rectángulos de lado fijo, así que no hay
// interpolación de ninguna clase: un píxel del sprite es un cuadrado
// exacto en pantalla, que es justo lo que el pixel art necesita.

const ANCHO = 120;
const ALTO = 52;
const ESCALA = 4;

// El suelo, y de ahí para arriba se apoya todo lo demás.
const HORIZONTE = 38;

// --- PALETAS ---
//
// De noche el gaucho es casi una silueta con el fuego recortándole el
// borde; de día se le ven los colores. El modo brasa usa la paleta
// nocturna bajada: si alguien puso "bajá el brillo", una escena diurna
// luminosa sería exactamente lo contrario de lo que pidió.
const PALETAS = {
    noche: {
        cieloAlto: '#080d12',
        cieloBajo: '#16202b',
        estrella: '#cfc3a8',
        astro: '#e8dcc4',
        astroHalo: '#2a3442',
        lomas: '#0a1014',
        suelo: '#12100c',
        pasto: '#1a1710',
        luzSuelo: ['#54340f', '#3d2711', '#2b1a0c', '#1d1208', '#160e06'],
        arbol: '#070b0e',
        h: '#140f0a',
        c: '#6b4a2b',
        p: '#1c1410',
        q: '#100b08',
        r: '#c9782f',
        b: '#0e0a07',
        l: '#3a2a1e',
        e: '#8d3a10',
        f: '#c06a2a',
        g: '#dd9f45',
        w: '#f4cf94',
    },
    dia: {
        // Pampa al sol, con polvo: ocres y pastos secos. Un celeste
        // saturado se pelearía con el resto de la app, que es toda noche.
        cieloAlto: '#8a9aa0',
        cieloBajo: '#cbb488',
        estrella: null,
        astro: '#f6e7bd',
        astroHalo: '#d8c493',
        lomas: '#8d7f63',
        suelo: '#6d5f45',
        pasto: '#7d6f50',
        luzSuelo: ['#9c8459', '#8c7752', '#816d4a', '#776544', '#705f41'],
        arbol: '#3f4034',
        h: '#5a4630',
        c: '#b08963',
        p: '#a4552f',
        q: '#7d3f22',
        r: '#e0a15c',
        b: '#4a3726',
        l: '#5b4430',
        e: '#a85a1e',
        f: '#d98b33',
        g: '#eeb257',
        w: '#fbe4a8',
    },
};

// --- SPRITES ---
//
// Un gaucho sentado de costado, envuelto en el poncho, mirando al fuego.
// A esta escala una silueta se lee mejor que una figura detallada: la
// columna de 'r' es la luz del fuego pegándole en el borde, y es lo que
// hace que se entienda dónde está sentado.
const GAUCHO = [
    '....................',
    '.....hh....hh.......',
    '......hhhhhh........',
    '...hhhhhhhhhhhh.....',
    '..hhhhhhhhhhhhhhr...',
    '....................',
    '.......cccc.........',
    '.......ccccr........',
    '......ppppprr.......',
    '......pppppp........',
    '.....ppppppp........',
    '.....pppppppp.......',
    '....ppppppppp.......',
    '....pppppppppp......',
    '...pppppppppppr.....',
    '...ppppppppppprbbb..',
    '..qqqqqqqqqqqqq.bb..',
    '..qqqqqqqqqqqqq.bbb.',
];

// Tres cuadros de la misma fogata. La leña no se mueve; lo único que
// cambia es la llama, que es lo que el ojo mira.
const FUEGO = [
    [
        '..............',
        '..............',
        '......w.......',
        '.....wgw......',
        '....wgggw.....',
        '....fgggf.....',
        '...ffgggff....',
        '...fffgfff....',
        '..ffffffff....',
        '..ffffffff....',
        '.llllllllll...',
        '.lleeeeell....',
        '..llllllll....',
        '..............',
    ],
    [
        '..............',
        '.....w........',
        '....wgw.......',
        '....wggw......',
        '...wgggw......',
        '...fgggf......',
        '..ffgggff.....',
        '..fffgfff.....',
        '..ffffffff....',
        '..ffffffff....',
        '.llllllllll...',
        '.lleeeeell....',
        '..llllllll....',
        '..............',
    ],
    [
        '..............',
        '..............',
        '..............',
        '......ww......',
        '.....wggw.....',
        '....fgggw.....',
        '....fggggf....',
        '...ffffgff....',
        '..ffffffff....',
        '..ffffffff....',
        '.llllllllll...',
        '.lleeeeell....',
        '..llllllll....',
        '..............',
    ],
];

// El ombú: el árbol de la pampa, y el único que da sombra en el medio del
// campo. Silueta nomás, que a esta escala es lo que se lee.
const OMBU = [
    '....ttttt.....',
    '..ttttttttt...',
    '.ttttttttttt..',
    'ttttttttttttt.',
    'ttttttttttttt.',
    '.ttttttttttt..',
    '..ttttttttt...',
    '....ttttt.....',
    '.....ttt......',
    '.....ttt......',
    '.....ttt......',
    '....tttt......',
    '...ttttt......',
];

// Estrellas fijas, no al azar: una escena que cambia de cielo cada vez
// que se abre la app se siente rota, no viva.
const ESTRELLAS = [
    [12, 6],
    [28, 4],
    [41, 10],
    [55, 5],
    [67, 9],
    [79, 3],
    [92, 8],
    [104, 5],
    [113, 12],
    [20, 14],
    [86, 15],
    [99, 18],
];

const PASTOS = [8, 30, 36, 96, 104, 112];

function esDeDia(fecha) {
    const h = fecha.getHours();
    return h >= 7 && h < 19;
}

function dibujarSprite(ctx, sprite, offsetX, offsetY, paleta) {
    sprite.forEach((fila, y) => {
        for (let x = 0; x < fila.length; x++) {
            const color = paleta[fila[x]];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect((offsetX + x) * ESCALA, (offsetY + y) * ESCALA, ESCALA, ESCALA);
        }
    });
}

function bloque(ctx, x, y, ancho, alto, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * ESCALA, y * ESCALA, ancho * ESCALA, alto * ESCALA);
}

// El fondo no cambia entre cuadros, así que se dibuja una sola vez en un
// canvas aparte y después se copia. Redibujar el cielo entero seis veces
// por segundo para animar una llama sería tirar trabajo a la basura.
function dibujarFondo(paleta, deDia) {
    const fondo = document.createElement('canvas');
    fondo.width = ANCHO * ESCALA;
    fondo.height = ALTO * ESCALA;
    const ctx = fondo.getContext('2d');

    // Cielo en bandas, no en degradé: un degradé suave al lado de píxeles
    // duros delata que son dos técnicas distintas pegadas.
    const bandas = 7;
    for (let i = 0; i < bandas; i++) {
        const t = i / (bandas - 1);
        bloque(
            ctx,
            0,
            Math.round((i * HORIZONTE) / bandas),
            ANCHO,
            Math.ceil(HORIZONTE / bandas) + 1,
            mezclar(paleta.cieloAlto, paleta.cieloBajo, t),
        );
    }

    if (paleta.estrella) {
        ESTRELLAS.forEach(([x, y]) => bloque(ctx, x, y, 1, 1, paleta.estrella));
    }

    // La luna o el sol, según la hora.
    const astroX = deDia ? 92 : 24;
    const astroY = deDia ? 9 : 8;
    const radio = deDia ? 5 : 4;
    for (let y = -radio; y <= radio; y++) {
        for (let x = -radio; x <= radio; x++) {
            const d = Math.sqrt(x * x + y * y);
            if (d > radio) continue;
            bloque(
                ctx,
                astroX + x,
                astroY + y,
                1,
                1,
                d > radio - 1 ? paleta.astroHalo : paleta.astro,
            );
        }
    }

    // Lomas, suelo y una franja de pasto donde se apoya todo.
    bloque(ctx, 0, HORIZONTE - 4, ANCHO, 4, paleta.lomas);
    bloque(ctx, 0, HORIZONTE, ANCHO, ALTO - HORIZONTE, paleta.suelo);
    bloque(ctx, 0, HORIZONTE, ANCHO, 1, paleta.pasto);

    dibujarSprite(ctx, OMBU, 6, HORIZONTE - 13, { t: paleta.arbol });

    // El suelo alumbrado alrededor del fuego. Esto vende que hay una
    // fogata más que la forma de la llama, y ata al gaucho con el fuego
    // en vez de dejarlos como dos figuras sueltas sobre el pasto.
    // El suelo alumbrado. El borde va tramado —un píxel sí, uno no— en
    // vez de cortado en seco: es como el pixel art difumina, y sin eso
    // las bandas se leen como un tablón apoyado sobre el pasto.
    paleta.luzSuelo.forEach((color, y) => {
        const medio = 20 - y * 3;
        const solido = medio - 4;
        for (let x = -medio; x <= medio; x++) {
            const dentro = Math.abs(x) <= solido;
            if (!dentro && (x + y) % 2 !== 0) continue;
            bloque(ctx, 72 + x, HORIZONTE + 1 + y, 1, 1, color);
        }
    });

    PASTOS.forEach((x) => {
        bloque(ctx, x, HORIZONTE + 2, 1, 2, paleta.pasto);
        bloque(ctx, x + 1, HORIZONTE + 3, 1, 1, paleta.pasto);
    });

    return fondo;
}

function mezclar(colorA, colorB, t) {
    const a = colorA.match(/\w\w/g).map((h) => parseInt(h, 16));
    const b = colorB.match(/\w\w/g).map((h) => parseInt(h, 16));
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

let animacion = null;
let fondoCache = null;
let claveCache = null;

export function renderEscena() {
    const canvas = document.getElementById('escena');
    if (!canvas) return;

    const brasa = document.documentElement.dataset.tema === 'brasa';
    const deDia = !brasa && esDeDia(new Date());
    const paleta = PALETAS[deDia ? 'dia' : 'noche'];

    canvas.width = ANCHO * ESCALA;
    canvas.height = ALTO * ESCALA;
    canvas.setAttribute(
        'aria-label',
        deDia
            ? 'Un gaucho sentado junto a un fogón, de día en el campo'
            : 'Un gaucho sentado junto a un fogón, de noche en el campo',
    );

    const clave = `${deDia}-${brasa}`;
    if (clave !== claveCache) {
        fondoCache = dibujarFondo(paleta, deDia);
        claveCache = clave;
    }

    const ctx = canvas.getContext('2d');
    // Quieto cuando el sistema pide menos movimiento, y quieto en modo
    // brasa: a oscuras lo único que mira el ojo es lo que se mueve.
    const quieto = brasa || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    cancelAnimationFrame(animacion);
    let cuadro = 0;
    let ultimo = 0;

    const pintar = (ahora = 0) => {
        if (ahora - ultimo > 170) {
            ultimo = ahora;
            ctx.drawImage(fondoCache, 0, 0);
            dibujarSprite(ctx, GAUCHO, 42, HORIZONTE - 17, paleta);
            dibujarSprite(ctx, FUEGO[cuadro], 64, HORIZONTE - 15, paleta);
            cuadro = (cuadro + 1) % FUEGO.length;
        }
        // Con la pestaña oculta el navegador ya frena los cuadros, pero
        // además se corta acá para no dejar trabajo agendado al volver.
        if (!quieto && !document.hidden) animacion = requestAnimationFrame(pintar);
    };

    if (quieto) {
        ctx.drawImage(fondoCache, 0, 0);
        dibujarSprite(ctx, GAUCHO, 42, HORIZONTE - 17, paleta);
        dibujarSprite(ctx, FUEGO[0], 64, HORIZONTE - 15, paleta);
    } else {
        pintar();
    }
}
