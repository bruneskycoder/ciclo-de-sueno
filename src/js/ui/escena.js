// escena.js — la ilustración de la cabecera: un gaucho sentado junto al
// fogón, con el monte chaqueño de fondo, de día o de noche según la hora,
// y de vez en cuando una tormenta lejana con refusilos y viento.
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
        monteLejos: '#0c1116',
        monte: '#070b0e',
        suelo: '#12100c',
        pasto: '#1a1710',
        luzSuelo: ['#54340f', '#3d2711', '#2b1a0c', '#1d1208', '#160e06'],
        // Tormenta: el frente de nubes come el cielo desde un costado, y
        // el refusilo lo alumbra por dentro.
        nube: '#1c2430',
        nubeAlta: '#151c26',
        refusilo: '#b9c6d8',
        polvo: '#2a2419',
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
        // Pampa y monte al sol, con polvo: ocres y verdes secos. Un
        // celeste saturado se pelearía con el resto de la app, que es
        // toda noche.
        cieloAlto: '#8a9aa0',
        cieloBajo: '#cbb488',
        estrella: null,
        astro: '#f6e7bd',
        astroHalo: '#d8c493',
        monteLejos: '#5a6149',
        monte: '#3f4034',
        suelo: '#6d5f45',
        pasto: '#7d6f50',
        luzSuelo: ['#9c8459', '#8c7752', '#816d4a', '#776544', '#705f41'],
        nube: '#6f7278',
        nubeAlta: '#585c63',
        refusilo: '#f2ead6',
        polvo: '#8d7f63',
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

// --- EL MONTE CHAQUEÑO ---
//
// No es la pampa abierta: es monte seco y cerrado. Cinco siluetas que se
// repiten con distinto alto y separación alcanzan para que se lea como
// monte y no como tres arbolitos sueltos.

const COPA_CHICA = [
    '..ttttt..',
    '.ttttttt.',
    'ttttttttt',
    'ttttttttt',
    '.ttttttt.',
    '...ttt...',
    '...ttt...',
    '...ttt...',
];

const COPA_GRANDE = [
    '...ttttttt...',
    '.ttttttttttt.',
    'ttttttttttttt',
    'ttttttttttttt',
    'ttttttttttttt',
    '.ttttttttttt.',
    '...ttttttt...',
    '.....ttt.....',
    '.....ttt.....',
    '.....ttt.....',
    '.....ttt.....',
];

// Quebracho: alto, flaco y con la copa arriba de todo. Es el que le da
// la altura irregular al monte.
const QUEBRACHO = [
    '..ttt..',
    '.ttttt.',
    'ttttttt',
    'ttttttt',
    '.ttttt.',
    '..ttt..',
    '..ttt..',
    '..ttt..',
    '..ttt..',
    '..ttt..',
    '..ttt..',
    '..ttt..',
];

// Palo borracho: el tronco panzón. Inconfundible en silueta.
const PALO_BORRACHO = [
    '...ttttt...',
    '.ttttttttt.',
    'ttttttttttt',
    '.ttttttttt.',
    '...ttttt...',
    '....ttt....',
    '...ttttt...',
    '..ttttttt..',
    '..ttttttt..',
    '...ttttt...',
    '....ttt....',
];

const CARDON = ['.t.', 'ttt', 'ttt', 'ttt', 'ttt', 'ttt', 'ttt', 'ttt'];

// Posiciones fijas, no al azar: un monte que cambia cada vez que se abre
// la app se siente roto, no vivo. La franja del medio (x 40 a 84) queda
// más baja a propósito, porque ahí adelante se sienta el gaucho y contra
// un monte alto su silueta desaparecería.
const MONTE = [
    { sprite: QUEBRACHO, x: 2, base: 0 },
    { sprite: COPA_GRANDE, x: 9, base: 1 },
    { sprite: PALO_BORRACHO, x: 21, base: 0 },
    { sprite: COPA_CHICA, x: 31, base: 2 },
    { sprite: CARDON, x: 38, base: 0 },
    // Entre x=40 y x=84 el monte se abre: es el claro donde están el
    // gaucho y el fuego. Con árboles ahí atrás la silueta del gaucho se
    // perdía contra las copas, y además un fuego no se prende en el medio
    // del monte cerrado.
    { sprite: COPA_CHICA, x: 84, base: 6 },
    { sprite: CARDON, x: 82, base: 1 },
    { sprite: COPA_GRANDE, x: 86, base: 1 },
    { sprite: QUEBRACHO, x: 98, base: 0 },
    { sprite: COPA_CHICA, x: 104, base: 2 },
    { sprite: PALO_BORRACHO, x: 110, base: 0 },
];

// --- EL GAUCHO Y EL FUEGO ---

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
// cambia es la llama. Las lenguas se separan arriba a propósito: una
// llama compacta a este tamaño se lee como un montículo, no como fuego.
const FUEGO = [
    [
        '................',
        '.......w........',
        '......w.w.......',
        '......wgw.......',
        '.....wgggw......',
        '.....fgggf......',
        '....ffgggff.....',
        '....fffgfff.....',
        '...ffffgffff....',
        '...fffffffff....',
        '..fffffffffff...',
        '..fffffffffff...',
        '.lllllllllllll..',
        '.lleeeeeeeelll..',
        '..lllllllllll...',
        '................',
    ],
    [
        '................',
        '.....w..w.......',
        '.....w..w.......',
        '.....wggw.......',
        '....wggggw......',
        '....fggggf......',
        '....ffgggf......',
        '...fffgffff.....',
        '...ffffffff.....',
        '..fffffffffff...',
        '..fffffffffff...',
        '..fffffffffff...',
        '.lllllllllllll..',
        '.lleeeeeeeelll..',
        '..lllllllllll...',
        '................',
    ],
    [
        '................',
        '................',
        '.......w........',
        '......ww........',
        '.....wggw.......',
        '.....wgggw......',
        '....fgggggf.....',
        '....fffggff.....',
        '...ffffgfff.....',
        '...fffffffff....',
        '..fffffffffff...',
        '..fffffffffff...',
        '.lllllllllllll..',
        '.lleeeeeeeelll..',
        '..lllllllllll...',
        '................',
    ],
];

// Con viento la llama se acuesta. Es la forma más directa de que el
// viento se vea y no solo se suponga: el fuego es lo único de la escena
// que el ojo ya está mirando.
const FUEGO_VIENTO = [
    [
        '................',
        '................',
        '..........w.....',
        '.........wgw....',
        '........wggw....',
        '.......wgggw....',
        '......fggff.....',
        '.....ffggf......',
        '....fffgff......',
        '...fffffff......',
        '..fffffffffff...',
        '..fffffffffff...',
        '.lllllllllllll..',
        '.lleeeeeeeelll..',
        '..lllllllllll...',
        '................',
    ],
    [
        '................',
        '................',
        '............w...',
        '..........wgww..',
        '.........wggw...',
        '........wggw....',
        '......ffggf.....',
        '.....fffgf......',
        '....ffffff......',
        '...fffffff......',
        '..fffffffffff...',
        '..fffffffffff...',
        '.lllllllllllll..',
        '.lleeeeeeeelll..',
        '..lllllllllll...',
        '................',
    ],
    [
        '................',
        '................',
        '.........w......',
        '........wgw.....',
        '.......wggw.....',
        '......wgggw.....',
        '.....ffgggf.....',
        '.....fffgff.....',
        '....ffffff......',
        '...fffffff......',
        '..fffffffffff...',
        '..fffffffffff...',
        '.lllllllllllll..',
        '.lleeeeeeeelll..',
        '..lllllllllll...',
        '................',
    ],
];

// Estrellas fijas, por el mismo motivo que el monte.
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

// --- CLIMA ---
//
// La tormenta se sortea UNA vez, al cargar la página, y no en cada
// repintado. La escena se redibuja cada minuto y cada vez que se cambia
// el tema: sorteando ahí, el clima parpadearía entre tormenta y sereno
// mientras uno mira la pantalla.
const PROBABILIDAD_TORMENTA = 0.25;

let clima = null;

function decidirClima() {
    if (clima) return clima;
    // Gancho para el script de capturas, que necesita una escena
    // reproducible: sin esto no hay forma de fotografiar la tormenta.
    const forzado = typeof window !== 'undefined' && window.__climaEscena;
    clima = forzado || (Math.random() < PROBABILIDAD_TORMENTA ? 'tormenta' : 'sereno');
    return clima;
}

function esDeDia(fecha) {
    const h = fecha.getHours();
    return h >= 7 && h < 19;
}

// --- DIBUJO ---

function bloque(ctx, x, y, ancho, alto, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * ESCALA, y * ESCALA, ancho * ESCALA, alto * ESCALA);
}

function dibujarSprite(ctx, sprite, offsetX, offsetY, paleta) {
    sprite.forEach((fila, y) => {
        for (let x = 0; x < fila.length; x++) {
            const color = paleta[fila[x]];
            if (!color) continue;
            bloque(ctx, offsetX + x, offsetY + y, 1, 1, color);
        }
    });
}

function mezclar(colorA, colorB, t) {
    const a = colorA.match(/\w\w/g).map((h) => parseInt(h, 16));
    const b = colorB.match(/\w\w/g).map((h) => parseInt(h, 16));
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// El frente de nubes. Entra desde la derecha y ocupa el cielo hasta más o
// menos la mitad: una tormenta que tapa todo el cielo dejaría la escena
// sin luna y sin estrellas, y con eso se pierde la mitad del encanto.
// El frente de nubes, de a dos píxeles de ancho y con el borde tramado.
// Con bloques anchos y cortes en seco se leía como una escalera. Entra
// desde la derecha y ocupa medio cielo: una tormenta que lo tapara todo
// dejaría la escena sin luna y sin estrellas, y ahí se pierde la mitad
// del encanto.
const NUBE_X = 56;
const NUBE_PERFIL = [
    16, 15, 15, 14, 13, 13, 12, 12, 11, 12, 10, 10, 9, 10, 8, 9, 8, 7, 8, 6, 7, 6, 6, 7, 5, 6, 5, 5,
    6, 5, 4, 5,
];

// Recorre el frente una sola vez y deja que quien llame decida qué pinta
// en cada columna. Así la nube y el refusilo que la alumbra por dentro
// comparten exactamente la misma silueta, sin repetir los números.
function recorrerNubes(fn) {
    NUBE_PERFIL.forEach((techo, i) => {
        const x = NUBE_X + i * 2;
        if (x < ANCHO) fn(x, techo, i);
    });
}

function dibujarNubes(ctx, paleta) {
    recorrerNubes((x, techo, i) => {
        bloque(ctx, x, techo + 1, 2, 26 - techo, paleta.nube);
        // Borde de arriba tramado, para que la nube se deshilache contra
        // el cielo en vez de cortarse con un filo.
        if ((i + techo) % 2 === 0) bloque(ctx, x, techo, 2, 1, paleta.nube);
        // Una capa más oscura arriba le da volumen al frente en vez de
        // dejarlo como una mancha plana.
        bloque(ctx, x, techo + 1, 2, 2 + (i % 3), paleta.nubeAlta);
    });
}

// El fondo no cambia entre cuadros, así que se dibuja una sola vez en un
// canvas aparte y después se copia. Redibujar el cielo entero seis veces
// por segundo para animar una llama sería tirar trabajo a la basura.
function dibujarFondo(paleta, deDia, tormenta) {
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
        // Con tormenta las nubes se comen las estrellas de ese lado.
        ESTRELLAS.filter(([x]) => !tormenta || x < 56).forEach(([x, y]) =>
            bloque(ctx, x, y, 1, 1, paleta.estrella),
        );
    }

    // La luna o el sol. Círculo lleno y un resplandor disperso alrededor:
    // el anillo de otro color que había antes se leía como un contorno
    // dibujado a mano, no como luz.
    const astroX = deDia ? 92 : 24;
    const astroY = deDia ? 9 : 8;
    const radio = deDia ? 5 : 4;
    // De día con tormenta el sol queda tapado por el frente.
    const astroTapado = tormenta && deDia;
    if (!astroTapado) {
        for (let y = -radio - 2; y <= radio + 2; y++) {
            for (let x = -radio - 2; x <= radio + 2; x++) {
                const d = Math.sqrt(x * x + y * y);
                if (d <= radio) {
                    bloque(ctx, astroX + x, astroY + y, 1, 1, paleta.astro);
                } else if (d <= radio + 2 && (x + y) % 2 === 0) {
                    bloque(ctx, astroX + x, astroY + y, 1, 1, paleta.astroHalo);
                }
            }
        }
    }

    if (tormenta) dibujarNubes(ctx, paleta);

    // El monte, en dos planos: una franja lejana apenas más clara detrás,
    // y las siluetas adelante. Sin los dos planos el monte se lee como
    // una pared negra.
    bloque(ctx, 0, HORIZONTE - 6, ANCHO, 6, paleta.monteLejos);
    MONTE.forEach(({ sprite, x, base }) => {
        dibujarSprite(ctx, sprite, x, HORIZONTE - sprite.length - base, { t: paleta.monte });
    });

    bloque(ctx, 0, HORIZONTE, ANCHO, ALTO - HORIZONTE, paleta.suelo);
    bloque(ctx, 0, HORIZONTE, ANCHO, 1, paleta.pasto);

    // El suelo alumbrado alrededor del fuego. El borde va tramado —un
    // píxel sí, uno no— en vez de cortado en seco: es como el pixel art
    // difumina, y sin eso las bandas se leen como un tablón apoyado.
    paleta.luzSuelo.forEach((color, y) => {
        const medio = 20 - y * 3;
        const solido = medio - 4;
        for (let x = -medio; x <= medio; x++) {
            if (Math.abs(x) > solido && (x + y) % 2 !== 0) continue;
            bloque(ctx, 72 + x, HORIZONTE + 1 + y, 1, 1, color);
        }
    });

    return fondo;
}

// Los pastos se dibujan por cuadro y no en el fondo, porque con viento se
// acuestan: son, junto con la llama, lo que hace que el viento se vea.
function dibujarPastos(ctx, paleta, inclinacion) {
    PASTOS.forEach((x) => {
        bloque(ctx, x, HORIZONTE + 2, 1, 2, paleta.pasto);
        bloque(ctx, x + 1 + inclinacion, HORIZONTE + 3, 1, 1, paleta.pasto);
        if (inclinacion) bloque(ctx, x + 2 + inclinacion, HORIZONTE + 3, 1, 1, paleta.pasto);
    });
}

let animacion = null;
let fondoCache = null;
let claveCache = null;

export function renderEscena() {
    const canvas = document.getElementById('escena');
    if (!canvas) return;

    const brasa = document.documentElement.dataset.tema === 'brasa';
    const deDia = !brasa && esDeDia(new Date());
    const tormenta = decidirClima() === 'tormenta';
    const paleta = PALETAS[deDia ? 'dia' : 'noche'];

    canvas.width = ANCHO * ESCALA;
    canvas.height = ALTO * ESCALA;
    canvas.setAttribute(
        'aria-label',
        `Un gaucho sentado junto a un fogón en el monte chaqueño, ${
            deDia ? 'de día' : 'de noche'
        }${tormenta ? ', con una tormenta a lo lejos' : ''}`,
    );

    const clave = `${deDia}-${brasa}-${tormenta}`;
    if (clave !== claveCache) {
        fondoCache = dibujarFondo(paleta, deDia, tormenta);
        claveCache = clave;
    }

    const ctx = canvas.getContext('2d');
    // Quieto cuando el sistema pide menos movimiento, y quieto en modo
    // brasa: a oscuras lo único que mira el ojo es lo que se mueve.
    const quieto = brasa || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cuadrosFuego = tormenta && !quieto ? FUEGO_VIENTO : FUEGO;

    cancelAnimationFrame(animacion);
    let cuadro = 0;
    let ultimo = 0;
    // Refusilos: cuánto falta para el próximo, y cuántos cuadros dura el
    // que está en curso. Vienen de a uno o de a dos, como los de verdad.
    let proximoRefusilo = 8;
    let refusilo = 0;
    // Polvo que cruza con el viento.
    const polvo = [10, 44, 78, 100].map((x, i) => ({ x, y: HORIZONTE - 2 - i }));

    const pintar = (ahora = 0) => {
        if (ahora - ultimo > 170) {
            ultimo = ahora;
            ctx.drawImage(fondoCache, 0, 0);

            if (tormenta && !quieto) {
                if (refusilo > 0) {
                    refusilo--;
                    // Un refusilo es la nube alumbrada por dentro, no un
                    // rayo dibujado: de lejos eso es lo que se ve. La luz
                    // sigue la silueta del frente — como un rectángulo
                    // sobre el cielo se leía como un panel encendido.
                    ctx.globalAlpha = refusilo === 1 ? 0.24 : 0.45;
                    recorrerNubes((x, techo) => {
                        bloque(ctx, x, techo, 2, 27 - techo, paleta.refusilo);
                    });
                    // Y un resplandor parejo y tenue sobre todo el cielo:
                    // un refusilo de verdad alumbra la noche entera un
                    // instante, no solo la nube.
                    ctx.globalAlpha = 0.07;
                    bloque(ctx, 0, 0, ANCHO, HORIZONTE, paleta.refusilo);
                    ctx.globalAlpha = 1;
                } else if (--proximoRefusilo <= 0) {
                    refusilo = Math.random() < 0.45 ? 3 : 2;
                    proximoRefusilo = 14 + Math.floor(Math.random() * 26);
                }

                polvo.forEach((p) => {
                    bloque(ctx, p.x, p.y, 2, 1, paleta.polvo);
                    p.x = (p.x + 3) % ANCHO;
                });
            }

            dibujarPastos(ctx, paleta, tormenta && !quieto ? 1 : 0);
            dibujarSprite(ctx, GAUCHO, 42, HORIZONTE - 17, paleta);
            dibujarSprite(ctx, cuadrosFuego[cuadro], 64, HORIZONTE - 15, paleta);
            cuadro = (cuadro + 1) % cuadrosFuego.length;
        }
        // Con la pestaña oculta el navegador ya frena los cuadros, pero
        // además se corta acá para no dejar trabajo agendado al volver.
        if (!quieto && !document.hidden) animacion = requestAnimationFrame(pintar);
    };

    if (quieto) {
        ctx.drawImage(fondoCache, 0, 0);
        dibujarPastos(ctx, paleta, 0);
        dibujarSprite(ctx, GAUCHO, 42, HORIZONTE - 17, paleta);
        dibujarSprite(ctx, cuadrosFuego[0], 64, HORIZONTE - 15, paleta);
    } else {
        pintar();
    }
}
