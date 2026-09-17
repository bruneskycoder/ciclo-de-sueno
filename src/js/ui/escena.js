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
        // Tormenta: el frente de nubes come el cielo desde un costado, y
        // el refusilo lo alumbra por dentro.
        nube: '#1c2430',
        nubeAlta: '#151c26',
        refusilo: '#b9c6d8',
        polvo: '#2a2419',
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
        m: '#5c3d1c',
        n: '#b9a074',
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
        nube: '#6f7278',
        nubeAlta: '#585c63',
        refusilo: '#f2ead6',
        polvo: '#8d7f63',
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
        m: '#7d5225',
        n: '#d8c9a8',
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

// El recado, tirado en el pasto. Es el detalle que dice que el que está
// ahí sentado venía a caballo y paró a hacer noche.
const RECADO = ['..mmmm..', '.mmmmmm.', 'mmmmmmmm', '.BmmmmB.', '..BBBB..'];

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

// Con viento la llama se acuesta. Es la forma más directa de que el
// viento se vea y no solo se suponga: el fuego es lo único de la escena
// que el ojo ya está mirando. La pirámide de leños no se mueve.
const FUEGO_VIENTO = [
    [
        '......................',
        '......................',
        '..........w...........',
        '.........wgw..........',
        '........wggw..........',
        '.......wgggw..........',
        '......fgggf...........',
        '.....ffggff...........',
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
        '...........w..........',
        '..........wgw.........',
        '.........wggw.........',
        '........wgggw.........',
        '.......fggf...........',
        '......ffgff...........',
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
        '........wgw...........',
        '.......wggw...........',
        '......wgggw...........',
        '.....ffgggf...........',
        '.....fffgff...........',
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
const NUBE_X = 74;
const NUBE_PERFIL = [
    22, 21, 21, 20, 19, 19, 18, 17, 18, 16, 16, 15, 14, 15, 13, 13, 12, 13, 11, 11, 10, 11, 9, 9, 8,
    9, 8, 7, 8, 6, 7, 6, 6, 7, 5, 6, 5, 5, 6, 5, 4, 5, 4, 4,
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
        bloque(ctx, x, techo + 1, 2, 36 - techo, paleta.nube);
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
        ESTRELLAS.filter(([x]) => !tormenta || x < NUBE_X - 2).forEach(([x, y]) =>
            bloque(ctx, x, y, 1, 1, paleta.estrella),
        );
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
    // Una franja lejana apenas más clara detrás del monte: sin los dos
    // planos el monte se lee como una pared negra. Y en el claro, esa
    // franja es justo el fondo contra el que se recorta el gaucho.
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

    // El recado tirado en el pasto: el detalle que cuenta que el que está
    // ahí sentado venía a caballo y paró a hacer noche.
    dibujarSprite(ctx, RECADO, 46, HORIZONTE + 2, paleta);

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

// Los pastos se dibujan por cuadro y no en el fondo, porque con viento se
// acuestan: son, junto con la llama, lo que hace que el viento se vea.
function dibujarPastos(ctx, paleta, inclinacion) {
    PASTOS.forEach((x, i) => {
        const alto = 3 + (i % 2);
        bloque(ctx, x, HORIZONTE + 2, 1, alto, paleta.pasto);
        bloque(ctx, x + 1 + inclinacion, HORIZONTE + 2, 1, alto - 1, paleta.pasto);
        bloque(ctx, x + 2 + inclinacion * 2, HORIZONTE + 3, 1, alto - 2, paleta.pasto);
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
    const polvo = [10, 50, 96, 130].map((x, i) => ({ x, y: HORIZONTE - 2 - i * 2 }));

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
                        bloque(ctx, x, techo, 2, 37 - techo, paleta.refusilo);
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
            dibujarSprite(ctx, GAUCHO, 58, HORIZONTE - 27, paleta);
            dibujarSprite(ctx, cuadrosFuego[cuadro], 86, HORIZONTE - 19, paleta);
            cuadro = (cuadro + 1) % cuadrosFuego.length;
        }
        // Con la pestaña oculta el navegador ya frena los cuadros, pero
        // además se corta acá para no dejar trabajo agendado al volver.
        if (!quieto && !document.hidden) animacion = requestAnimationFrame(pintar);
    };

    if (quieto) {
        ctx.drawImage(fondoCache, 0, 0);
        dibujarPastos(ctx, paleta, 0);
        dibujarSprite(ctx, GAUCHO, 58, HORIZONTE - 27, paleta);
        dibujarSprite(ctx, cuadrosFuego[0], 86, HORIZONTE - 19, paleta);
    } else {
        pintar();
    }
}
