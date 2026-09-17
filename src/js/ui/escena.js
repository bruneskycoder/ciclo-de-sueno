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

// Resolución de la escena. Se subió de 120x52 a 160x72 por un motivo
// concreto: a la resolución anterior el gaucho ocupaba 20x18 píxeles y
// ahí no entra un brazo, ni una bota, ni un mate. El dibujo no quedaba
// pobre por falta de ganas sino por falta de lugar. Con un tercio más de
// píxeles por lado hay espacio para que las cosas se entiendan.
const ANCHO = 160;
const ALTO = 72;
const ESCALA = 3;

// El suelo, y de ahí para arriba se apoya todo lo demás.
const HORIZONTE = 52;

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
        monteClaro: '#111a1e',
        suelo: '#12100c',
        sueloTextura: '#191509',
        pasto: '#1a1710',
        humo: '#2b3038',
        luzSuelo: ['#54340f', '#3d2711', '#2b1a0c', '#1d1208', '#160e06'],
        h: '#1a130c',
        H: '#0d0906',
        c: '#7d5733',
        C: '#40301f',
        p: '#241a13',
        P: '#4a2a1c',
        q: '#120c08',
        r: '#c9782f',
        R: '#f0b063',
        b: '#0e0a07',
        B: '#2a1c11',
        T: '#0b1114',
        l: '#6b4a2e',
        L: '#94693b',
        s: '#4a4b4e',
        S: '#232427',
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
        monteClaro: '#556047',
        suelo: '#6d5f45',
        sueloTextura: '#7a6b4e',
        pasto: '#7d6f50',
        humo: '#9aa0a4',
        luzSuelo: ['#9c8459', '#8c7752', '#816d4a', '#776544', '#705f41'],
        h: '#6b543a',
        H: '#473725',
        c: '#c39b72',
        C: '#6b4f33',
        p: '#a4552f',
        P: '#d8813f',
        q: '#7d3f22',
        r: '#e0a15c',
        R: '#f7d6a0',
        b: '#4a3726',
        B: '#6b503a',
        T: '#33342a',
        l: '#8a6a44',
        L: '#ab8759',
        s: '#a8a49a',
        S: '#77746d',
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
    '....ttttt....',
    '..tttttttttt.',
    '.TTtttttttttt',
    'TTTttttttttTT',
    'TTtttttttttTT',
    '.TtttttttttT.',
    '..TTtttttTT..',
    '....TtttT....',
    '.....ttT.....',
    '.....TtT.....',
    '.....TtT.....',
    '.....TTT.....',
];

const COPA_GRANDE = [
    '......ttttttt......',
    '...ttttttttttttt...',
    '..tttttttttttttttt.',
    '.TTttttttttttttttTT',
    'TTTtttttttttttttTTT',
    'TTttttttttttttttTTT',
    'TTtttttttttttttttTT',
    '.TTttttttttttttTTT.',
    '..TTttttttttttTT...',
    '....TTttttttTT.....',
    '......TtttTT.......',
    '.......ttT.........',
    '.......TtT.........',
    '......TttT.........',
    '......TtTT.........',
    '.....TTtTT.........',
    '.....TTTTT.........',
];

// Quebracho: alto, flaco, con la copa arriba de todo y el tronco torcido.
// Es el que le da al monte la altura irregular.
const QUEBRACHO = [
    '...ttttt...',
    '.ttttttttt.',
    'TTtttttttTT',
    'TTttttttttT',
    '.Tttttttt T',
    '..TTtttTT..',
    '....ttT....',
    '....ttT....',
    '....TtT....',
    '...TttT....',
    '...TtT.....',
    '...TtT.....',
    '..TttT.....',
    '..TtT......',
    '..TtT......',
    '..TtT......',
    '.TTtT......',
    '.TTtTT.....',
    '.TTTTT.....',
];

// Palo borracho: el tronco panzón. En silueta es inconfundible, y con
// espacio se le pueden ver las espinas del tronco.
const PALO_BORRACHO = [
    '.....ttttt.....',
    '..tttttttttttt.',
    '.TTttttttttttTT',
    'TTTttttttttttTT',
    '.TTtttttttttTT.',
    '...TTtttttTT...',
    '.....TtttT.....',
    '......TtT......',
    '.....TtttT.....',
    '....TttttTT....',
    '...TtttttTTT...',
    '...TtttttTTT...',
    '...TtttttTTT...',
    '....TtttTTT....',
    '....TtttTT.....',
    '.....TttT......',
    '.....TttT......',
    '....TTttTT.....',
];

// Cardón: el cactus columnar, con sus dos brazos. Sin los brazos se
// confundía con un poste.
const CARDON = [
    '...t...',
    '..ttt..',
    '..tTt..',
    't.ttt.t',
    'tt tTttt',
    'ttTttTtt',
    '.tTttTt.',
    '..ttTt..',
    '..tTt..',
    '..ttt..',
    '..tTt..',
    '..ttt..',
    '..tTt..',
    '..TTT..',
];

// Posiciones fijas, no al azar: un monte que cambia cada vez que se abre
// la app se siente roto, no vivo. La franja del medio (x 40 a 84) queda
// más baja a propósito, porque ahí adelante se sienta el gaucho y contra
// un monte alto su silueta desaparecería.
const MONTE = [
    { sprite: QUEBRACHO, x: 1, base: 0 },
    { sprite: COPA_GRANDE, x: 9, base: 1 },
    { sprite: CARDON, x: 25, base: 0 },
    { sprite: PALO_BORRACHO, x: 30, base: 0 },
    { sprite: COPA_CHICA, x: 42, base: 3 },
    { sprite: COPA_CHICA, x: 108, base: 3 },
    { sprite: CARDON, x: 118, base: 1 },
    { sprite: COPA_GRANDE, x: 122, base: 0 },
    { sprite: QUEBRACHO, x: 138, base: 0 },
    { sprite: COPA_CHICA, x: 146, base: 2 },
];

// --- EL GAUCHO Y EL FUEGO ---

// La luz del fuego le pega en tres lugares y nada más: el borde de la
// cara, el hombro y la rodilla. Corrida de la cabeza al piso, como
// estaba, formaba una línea naranja continua que se leía como un bastón
// apoyado contra el cuerpo. La luz marca salientes, no dibuja contornos.
const GAUCHO = [
    '..............................',
    '.........hhhhhhhh.............',
    '........hhhhhhhhhh............',
    '........hhhhhhhhhh............',
    '.....HHHHHHHHHHHHHHHH.........',
    '....HHHHHHHHHHHHHHHHHH........',
    '.........cccccc...............',
    '.........ccccccr..............',
    '..........CCCCcr..............',
    '..........CCCC................',
    '........ppppppppr.............',
    '.......pppppppppr.............',
    '......ppppppppppp.............',
    '......PPPPPPPPPPPP............',
    '.....ppppppppppppp............',
    '.....ppppppppppppppp..........',
    '....pppppppppppppppppppr......',
    '....PPPPPPPPPPPPPPPPPPPr......',
    '...ppppppppppppppppppppr......',
    '...pppppppppppppppppppp.......',
    '..ppppppppppppppppppp.........',
    '..pppppppppppppppppp..........',
    '..qqqqqqqqqqqqqqqqqq..........',
    '..qqqqqqqqqqqqqqqqqq..........',
    '...qqqqqqqqqqqqqqqqq..........',
    '....qqqqqqqqqqqqqbbb..........',
    '.....qqqqqqqqqqqbbbbb.........',
    '......qqqqqqqqqqBBBBB.........',
];

// Los tres cuadros del fogón. Entre cuadros cambia solo la llama: los
// leños y las piedras están quietos.
//
// Un fogón se arma en pirámide, con los leños apoyados unos contra otros
// y la llama saliendo por arriba, rodeado de un círculo de piedras. Tres
// intentos anteriores fallaron y vale saber por qué: una pila horizontal
// de leños se lee como una parrilla; unos leños finos entrando de costado
// se leen como dos alitas; y una pirámide angosta con los leños del mismo
// tono que el suelo no se lee como nada, porque los leños desaparecen.
// Acá van anchos, en tono iluminado —un leño pegado al fuego está
// alumbrado por el fuego— y con las piedras en un gris frío que no se
// confunde con leña.
const FUEGO = [
    [
        '......................',
        '.........w............',
        '........wgw...........',
        '.......wgggw..........',
        '......wggggw..........',
        '......fgggf...........',
        '.....ffgggff..........',
        '.....fffgfff..........',
        '.....lllfffflll.......',
        '....lllLffffLlll......',
        '....llLLffffLLll......',
        '...lllLLffffLLlll.....',
        '...llLLLeeeeLLLll.....',
        '..lllLLLeeeeLLLlll....',
        '..llLLLLeeeeLLLLll....',
        '.lllLLLLeeeeLLLLlll...',
        '.llLLLL.eeee.LLLLll...',
        'ssss.ssss.ssss.ssss...',
        'sSSs.sSSs.sSSs.sSSs...',
        '.SS...SS...SS...SS....',
    ],
    [
        '......................',
        '.......w....w.........',
        '.......wggww..........',
        '......wgggw...........',
        '.....wggggw...........',
        '.....fggggf...........',
        '.....ffgggf...........',
        '....fffgffff..........',
        '.....lllfffflll.......',
        '....lllLffffLlll......',
        '....llLLffffLLll......',
        '...lllLLffffLLlll.....',
        '...llLLLeeeeLLLll.....',
        '..lllLLLeeeeLLLlll....',
        '..llLLLLeeeeLLLLll....',
        '.lllLLLLeeeeLLLLlll...',
        '.llLLLL.eeee.LLLLll...',
        'ssss.ssss.ssss.ssss...',
        'sSSs.sSSs.sSSs.sSSs...',
        '.SS...SS...SS...SS....',
    ],
    [
        '......................',
        '......................',
        '.........w............',
        '........ww............',
        '.......wggw...........',
        '......wggggw..........',
        '......fgggggf.........',
        '.....ffggggff.........',
        '.....lllfffflll.......',
        '....lllLffffLlll......',
        '....llLLffffLLll......',
        '...lllLLffffLLlll.....',
        '...llLLLeeeeLLLll.....',
        '..lllLLLeeeeLLLlll....',
        '..llLLLLeeeeLLLLll....',
        '.lllLLLLeeeeLLLLlll...',
        '.llLLLL.eeee.LLLLll...',
        'ssss.ssss.ssss.ssss...',
        'sSSs.sSSs.sSSs.sSSs...',
        '.SS...SS...SS...SS....',
    ],
];

// Estrellas fijas, por el mismo motivo que el monte.
const ESTRELLAS = [
    [14, 8],
    [30, 5],
    [46, 13],
    [62, 6],
    [74, 11],
    [88, 4],
    [102, 10],
    [118, 6],
    [134, 15],
    [22, 18],
    [96, 19],
    [126, 23],
    [54, 21],
    [110, 17],
    [8, 12],
    [142, 9],
];

const PASTOS = [6, 18, 34, 44, 124, 136, 148, 156];

// Manchones sueltos en el suelo, para que no sea una franja lisa.
const TIERRA = [
    [12, 3],
    [26, 5],
    [38, 2],
    [50, 7],
    [64, 4],
    [78, 8],
    [92, 6],
    [106, 3],
    [120, 6],
    [132, 2],
    [144, 5],
    [154, 8],
    [20, 9],
    [70, 11],
    [116, 10],
    [40, 13],
    [100, 14],
];

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

    // La luna o el sol. Círculo lleno y un resplandor disperso alrededor:
    // el anillo de otro color que había antes se leía como un contorno
    // dibujado a mano, no como luz.
    // El sol se corre del borde derecho: ahí arriba están los botones de
    // brillo y ajustes, que se apoyan sobre la escena, y el sol quedaba
    // tapado por ellos.
    const astroX = deDia ? 100 : 30;
    const astroY = deDia ? 12 : 11;
    const radio = deDia ? 7 : 6;
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

    // El monte, en dos planos: una franja lejana apenas más clara detrás
    // y las siluetas adelante. Sin los dos planos se lee como una pared
    // negra. En el claro, esa franja es justo el fondo contra el que se
    // recorta el gaucho.
    bloque(ctx, 0, HORIZONTE - 9, ANCHO, 9, paleta.monteLejos);
    // Matorral bajo en el claro, para que no quede un vacío liso. Las
    // alturas y los huecos van irregulares y fijos: parejos se leían
    // como un paredón de guiones detrás del gaucho.
    const MATORRAL = [
        [48, 4],
        [52, 2],
        [55, 5],
        [60, 3],
        [66, 2],
        [70, 4],
        [76, 3],
        [82, 5],
        [88, 2],
        [93, 4],
        [99, 3],
        [104, 5],
        [109, 2],
    ];
    MATORRAL.forEach(([x, alto]) => {
        bloque(ctx, x, HORIZONTE - alto, 3, alto, paleta.monteClaro);
        bloque(ctx, x + 1, HORIZONTE - alto - 1, 1, 1, paleta.monteClaro);
    });
    MONTE.forEach(({ sprite, x, base }) => {
        dibujarSprite(ctx, sprite, x, HORIZONTE - sprite.length - base, { t: paleta.monte });
    });

    bloque(ctx, 0, HORIZONTE, ANCHO, ALTO - HORIZONTE, paleta.suelo);
    bloque(ctx, 0, HORIZONTE, ANCHO, 1, paleta.pasto);
    TIERRA.forEach(([x, y]) => bloque(ctx, x, HORIZONTE + y, 2, 1, paleta.sueloTextura));

    // El suelo alumbrado alrededor del fuego. El borde va tramado —un
    // píxel sí, uno no— en vez de cortado en seco: es como el pixel art
    // difumina, y sin eso las bandas se leen como un tablón apoyado.
    paleta.luzSuelo.forEach((color, y) => {
        const medio = 28 - y * 4;
        const solido = medio - 5;
        for (let x = -medio; x <= medio; x++) {
            if (Math.abs(x) > solido && (x + y) % 2 !== 0) continue;
            bloque(ctx, 97 + x, HORIZONTE + 1 + y, 1, 1, color);
        }
    });

    return fondo;
}

// Los pastos, al frente de todo.
function dibujarPastos(ctx, paleta) {
    PASTOS.forEach((x, i) => {
        const alto = 3 + (i % 2);
        bloque(ctx, x, HORIZONTE + 2, 1, alto, paleta.pasto);
        bloque(ctx, x + 1, HORIZONTE + 2, 1, alto - 1, paleta.pasto);
        bloque(ctx, x + 2, HORIZONTE + 3, 1, alto - 2, paleta.pasto);
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
    const paleta = PALETAS[deDia ? 'dia' : 'noche'];

    canvas.width = ANCHO * ESCALA;
    canvas.height = ALTO * ESCALA;
    canvas.setAttribute(
        'aria-label',
        `Un gaucho sentado junto a un fogón en el monte chaqueño, ${deDia ? 'de día' : 'de noche'}`,
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

    const pintarCuadro = (cuadro) => {
        ctx.drawImage(fondoCache, 0, 0);
        dibujarPastos(ctx, paleta);
        dibujarSprite(ctx, GAUCHO, 58, HORIZONTE - 27, paleta);
        dibujarSprite(ctx, FUEGO[cuadro], 86, HORIZONTE - 19, paleta);
    };

    cancelAnimationFrame(animacion);

    if (quieto) {
        pintarCuadro(0);
        return;
    }

    let cuadro = 0;
    let ultimo = 0;
    const animar = (ahora = 0) => {
        if (ahora - ultimo > 170) {
            ultimo = ahora;
            pintarCuadro(cuadro);
            cuadro = (cuadro + 1) % FUEGO.length;
        }
        // Con la pestaña oculta el navegador ya frena los cuadros, pero
        // además se corta acá para no dejar trabajo agendado al volver.
        if (!document.hidden) animacion = requestAnimationFrame(animar);
    };
    animar();
}
