// sprites-nuevos.js — los sprites que la escena 3D suma a los de
// escena.js: caballo, vaca, llama grande y pasto.
//
// Mismo formato que los de escena.js: cada carácter es un píxel y cada
// letra un color. Acá los colores son el material "a pleno sol": la luz de
// la escena (fuego, luna o sol) los oscurece o los tiñe, así que no hay
// una paleta de noche aparte como en el dibujo 2D.

// Caballo de costado, mirando a la izquierda, con la cabeza alta. Las
// filas no hace falta que midan lo mismo: quien las dibuja rellena con
// vacío hasta el ancho de la más larga.
export const CABALLO = [
    '.......mm',
    '......mbbm',
    '.....bbbbbm',
    '....bbebbbbm',
    '...bbbbbbbbbm',
    '...bbbbbbbbbbm',
    '..nnbbbbbbbbbbmm',
    '..nnbbbbbbbbbbbmbbbbbbbbbbbbbbb',
    '...nbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '.....bbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '......bbbbbbbbbbbbbbbbbbbbbbbbbbbbm',
    '......bbbbbbbbbbbbbbbbbbbbbbbbbbbbm',
    '......bbbbbbbbbbbbbbbbbbbbbbbbbbbbm',
    '......BbbbbbbbbbbbbbbbbbbbbbbbbbbBm',
    '.......BBbbbbbbbbbbbbbbbbbbbbbbBB.m',
    '.......bbb.bb..............bbb.bb.m',
    '.......bb..bb..............bb..bb.m',
    '.......bb..bb..............bb..bb',
    '.......bb..bb..............bb..bb',
    '.......BB..BB..............BB..BB',
    '.......oo..oo..............oo..oo',
];

// Vaca echada, mirando a la izquierda. De día o de noche tiene que
// leerse como vaca y no como una piedra: pelaje claro con manchas, la
// cabeza con cuernos y orejas, el hocico oscuro. Con el pelaje oscuro de
// la primera versión, la noche la apagaba hasta volverla una mancha.
export const VACA = [
    '..h.h',
    '..hWh...............',
    '.kWWWk.........WWWWWWW',
    'nnWeWWWWWWWWWWWWWWkkWWWWWW',
    'nnWWWWWWWWWWWWWWWWkkkkWWWWWW',
    '.nnWWWWWWWWWWWWWWWWWkkWWWkkWWW',
    '..WWWWWWkkWWWWWWWWWWWWWWkkkkWWm',
    '...WWWWkkkkWWWWWWWWWWWWWWkkkkWm',
    '...WWWWWkkWWWWWWWWWWWWWWWWWWWWm',
    '....WWWWWWWWWWWWWWWWWWWWWWWWW',
    '....KKWWWWWWWWWWWWWWWWWWWWKK',
    '...KKKKKKKWWWWWWWWWWWKKKKKK',
];

// La llama, de dos cuadros. Mide 14 de ancho, tres veces más que la del
// dibujo 2D: con el fogón en 3D alrededor, una llama de 8 píxeles de alto
// se perdía.
export const FLAMA = [
    [
        '.......w',
        '.......ww',
        '......wgw',
        '......wggw',
        '.....wgggw',
        '.....wggggw',
        '....fggggggw',
        '....fgggwgggf',
        '...ffggwwwggf',
        '...ffgwwwwgff',
        '..fffgwwwwgfff',
        '..ffggwwwwggff',
        '..ffgggwwgggff',
        '...fffgggggff',
        '...eefffffffe',
        '....eeffffee',
    ],
    [
        '......w',
        '.....ww',
        '.....wgw',
        '....wggw',
        '....wgggw',
        '...wggggw',
        '...fggggggw',
        '..fgggwgggf',
        '..ffggwwwggf',
        '..ffgwwwwgff',
        '..fffgwwwwgfff',
        '..ffggwwwwggff',
        '..ffgggwwgggff',
        '...fffgggggff',
        '...eefffffffe',
        '....eeffffee',
    ],
];

// Mechón de pasto seco, en dos cuadros: la punta se corre un píxel. Es el
// único movimiento del suelo.
export const PASTO = [
    ['..g.', '.g.g', 'g.gg', 'gggg'],
    ['.g..', 'g.g.', 'gg.g', 'gggg'],
];

// Una paleta por sprite: las letras se repiten entre ellos (la "e" es el
// ojo del caballo y la brasa de la llama) y no vale la pena inventar
// letras distintas para no pisarse.
export const PALETA_CABALLO = {
    b: '#8a5a38',
    B: '#6a4129',
    m: '#2b1a10',
    n: '#a8795a',
    e: '#15100c',
    o: '#1d130d',
};
export const PALETA_VACA = {
    k: '#6b4a32',
    K: '#9a9384',
    W: '#e2dccb',
    h: '#efe6c8',
    n: '#8a6652',
    e: '#15100c',
    m: '#2b1a10',
};
export const PALETA_FLAMA = { w: '#fff0c0', g: '#ffb640', f: '#e0701c', e: '#8d3a10' };
export const PALETA_PASTO = { g: '#8d7b4a' };

// Colores del monte a pleno sol; t es la copa y T la sombra de la copa.
export const PALETA_MONTE = { t: '#5c6a46', T: '#3a4530' };
