// prototipo.js — prototipo de la escena HD-2D (paso 12 del plan v3).
//
// Todavía NO está integrado a la app: vive en escena-prototipo.html y sirve
// para decidir, con capturas, si la escena se lee antes de construir lo
// demás (cielo real, leños por ciclo, fondo de pantalla completa).
//
// Las tres ideas que sostienen el aspecto pixel art:
//
// 1. Se dibuja a baja resolución (un píxel de escena = PIX píxeles de
//    pantalla) y el navegador agranda el canvas sin suavizar.
// 2. La cámara es ortográfica, quieta, y los personajes son carteles que
//    miran siempre de frente a ella. Cada cartel se coloca en un píxel
//    entero de la pantalla: así un píxel del sprite cae en un píxel de la
//    escena, sin temblor y sin mezclarse con el vecino.
// 3. La luz del fuego se reparte en escalones (material "toon"), no en
//    degradé: un degradé liso al lado de píxeles duros delata que son dos
//    técnicas pegadas. Lo mismo que se hizo con el cielo en bandas.

import * as THREE from 'three';
import { GAUCHO, COPA_CHICA, COPA_GRANDE, QUEBRACHO, PALO_BORRACHO, CARDON, PALETAS } from '../ui/escena.js';
import {
    CABALLO,
    VACA,
    FLAMA,
    PASTO,
    PALETA_CABALLO,
    PALETA_VACA,
    PALETA_FLAMA,
    PALETA_PASTO,
    PALETA_MONTE,
} from './sprites-nuevos.js';

const PIX = 2;
const THETA = THREE.MathUtils.degToRad(30);
// Con 30 grados, un paso de 2 unidades hacia el fondo baja exactamente un
// píxel en pantalla. Es lo que deja alinear la textura del suelo a la
// grilla; con otro ángulo el suelo temblaría.
const SIN = Math.sin(THETA);
const COS = Math.cos(THETA);

// Todo lo que cambia entre noche, atardecer y día. Los colores de los
// sprites son los de "pleno sol", y `tinte` es lo que la luz ambiente les
// deja; el fuego suma encima con `fuego`.
const PRESETS = {
    noche: {
        cieloAlto: '#05080f',
        cieloBajo: '#1b2a3d',
        monteLejos: '#0b1116',
        niebla: '#141d29',
        ambiente: '#4a5c80',
        ambienteInt: 1.5,
        astroLuz: '#7f98c8',
        astroInt: 0.9,
        astroDir: [-0.6, 0.7, 0.4],
        tinte: '#4d5a7c',
        fuego: 1,
        llamaAlta: true,
        estrellas: true,
        astro: 'luna',
        sombra: '#05070d',
    },
    atardecer: {
        cieloAlto: '#34406b',
        cieloBajo: '#e8935a',
        monteLejos: '#3b2f45',
        niebla: '#b8705a',
        ambiente: '#8d6c7c',
        ambienteInt: 1.9,
        astroLuz: '#ff9a50',
        astroInt: 2.2,
        astroDir: [-1, 0.32, -0.35],
        tinte: '#c98f86',
        fuego: 0.6,
        llamaAlta: true,
        estrellas: false,
        astro: 'sol-bajo',
        sombra: '#2a1a30',
    },
    dia: {
        cieloAlto: '#7a9db3',
        cieloBajo: '#dcc795',
        monteLejos: '#5a6149',
        niebla: '#c4b48f',
        ambiente: '#fff3dc',
        ambienteInt: 2.6,
        astroLuz: '#fff1cf',
        astroInt: 2.4,
        astroDir: [0.4, 1, 0.5],
        tinte: '#f3eadb',
        fuego: 0.15,
        llamaAlta: false,
        estrellas: false,
        astro: 'sol',
        sombra: '#3a3022',
    },
};

// --- Utilidades ---

// Números "al azar" que siempre dan lo mismo: un monte que cambia cada
// vez que se abre la app se siente roto, no vivo (mismo criterio que en
// escena.js).
function semilla(n) {
    let s = n >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function texturaDeSprite(filas, paleta) {
    const ancho = Math.max(...filas.map((f) => f.length));
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = filas.length;
    const ctx = lienzo.getContext('2d');
    filas.forEach((fila, y) => {
        for (let x = 0; x < fila.length; x++) {
            const color = paleta[fila[x]];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    });
    const tex = new THREE.CanvasTexture(lienzo);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, ancho, alto: filas.length };
}

// El gradiente de la luz en escalones: cuatro niveles y listo.
function escalones(niveles) {
    const datos = new Uint8Array(niveles.map((n) => Math.round(n * 255)));
    const tex = new THREE.DataTexture(datos, niveles.length, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
}

// --- La escena ---

export function crearEscena(canvas) {
    const estado = { preset: 'noche', ciclos: 5 };
    let mundo = null;

    function construir() {
        if (mundo) mundo.dispose();
        mundo = construirMundo(canvas, estado);
    }

    construir();

    let pendiente = 0;
    const alCambiarTamano = () => {
        clearTimeout(pendiente);
        pendiente = setTimeout(construir, 150);
    };
    window.addEventListener('resize', alCambiarTamano);

    return {
        setPreset(nombre) {
            estado.preset = nombre;
            construir();
        },
        setCiclos(n) {
            estado.ciclos = n;
            construir();
        },
        // Para las pruebas: deja un solo cuadro dibujado y quieto.
        congelar(t = 1.2) {
            mundo.congelar(t);
        },
    };
}

function construirMundo(canvas, estado) {
    const preset = PRESETS[estado.preset];

    // Tamaño par, así los bordes de píxel caen en números enteros.
    const W = Math.floor(window.innerWidth / PIX / 2) * 2;
    const H = Math.floor(window.innerHeight / PIX / 2) * 2;
    canvas.style.width = `${W * PIX}px`;
    canvas.style.height = `${H * PIX}px`;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    // --- Cámara: ortográfica, a 30 grados, con el fuego a 70% de la altura.
    const camara = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 1, 2000);
    const U = new THREE.Vector3(0, COS, -SIN); // "arriba" de la pantalla
    const D = new THREE.Vector3(0, -SIN, -COS); // hacia donde mira
    const DESPLAZO = Math.round(0.2 * H);
    const objetivo = U.clone().multiplyScalar(DESPLAZO);
    camara.position.copy(objetivo).addScaledVector(D, -800);
    camara.lookAt(objetivo);
    camara.updateMatrixWorld();

    // Coloca un cartel de frente a la cámara con su pie en un píxel entero.
    const rel = new THREE.Vector3();
    function colocar(malla, ancho, alto, wx, wy, wz) {
        rel.set(wx, wy, wz).sub(objetivo);
        const sx = rel.x;
        const sy = rel.dot(U);
        const dd = rel.dot(D);
        const izq = Math.round(sx - ancho / 2);
        const pie = Math.round(sy);
        malla.position
            .copy(objetivo)
            .addScaledVector(new THREE.Vector3(1, 0, 0), izq + ancho / 2)
            .addScaledVector(U, pie + alto / 2)
            .addScaledVector(D, dd);
        malla.quaternion.copy(camara.quaternion);
    }

    // El horizonte queda al 34% de la altura, de arriba.
    const ZFONDO = -Math.round((0.36 * H) / SIN / 2) * 2;
    const yHorizonte = Math.round(0.7 * H - -ZFONDO * SIN);

    // --- Cielo: un canvas del tamaño de la pantalla, en bandas.
    scene.background = cielo(W, H, yHorizonte, preset);

    scene.fog = new THREE.Fog(preset.niebla, 780, 1150);

    // --- Luces
    const luzAmbiente = new THREE.AmbientLight(preset.ambiente, preset.ambienteInt);
    scene.add(luzAmbiente);
    const astro = new THREE.DirectionalLight(preset.astroLuz, preset.astroInt);
    astro.position.set(...preset.astroDir).multiplyScalar(300);
    scene.add(astro);
    const luzFuego = new THREE.PointLight('#ff9a3c', 1, 0, 1.2);
    luzFuego.position.set(10, 10, 6);
    scene.add(luzFuego);
    const INT_FUEGO = 150 * preset.fuego;

    const degrade = escalones([0.18, 0.42, 0.68, 1]);
    const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: degrade });

    // --- Suelo, alineado a la grilla (ver ZFONDO y SIN arriba).
    const anchoSuelo = Math.ceil((W + 64) / 64) * 64;
    const largoSuelo = Math.ceil((-ZFONDO + 0.7 * H) / 128) * 128;
    const suelo = new THREE.Mesh(
        new THREE.PlaneGeometry(anchoSuelo, largoSuelo),
        new THREE.MeshToonMaterial({ map: texturaSuelo(preset, anchoSuelo, largoSuelo), gradientMap: degrade }),
    );
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.set(0, 0, ZFONDO + largoSuelo / 2);
    scene.add(suelo);

    // Ceniza: la tierra pisada y quemada debajo del fuego.
    const FX = 10;
    const ceniza = new THREE.Mesh(new THREE.CircleGeometry(12, 16), new THREE.MeshBasicMaterial({ color: '#15100b' }));
    ceniza.rotation.x = -Math.PI / 2;
    ceniza.position.set(FX, 0.05, 0);
    ceniza.scale.set(1, 1, 1);
    scene.add(ceniza);

    // --- Piedras en círculo
    const rnd = semilla(7);
    const mPiedra = toon('#8d9298');
    for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 + rnd() * 0.8, 0), mPiedra);
        p.scale.y = 0.65;
        p.position.set(FX + Math.cos(a) * 13, 1.2, Math.sin(a) * 13);
        p.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        scene.add(p);
    }

    // --- Leños: uno por ciclo, apoyados en pirámide
    // Los leños brillan un poco por sí solos: un leño pegado al fuego está
// alumbrado por el fuego, y sin esto quedaban negros contra la llama.
const mLeno = new THREE.MeshToonMaterial({ color: '#9a6a40', emissive: '#4a200a', gradientMap: degrade });
    const n = Math.max(3, estado.ciclos);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.4;
        const base = new THREE.Vector3(FX + Math.cos(a) * 8.5, 1.8, Math.sin(a) * 8.5);
        const punta = new THREE.Vector3(FX + Math.cos(a) * 1.2, 15, Math.sin(a) * 1.2);
        const dir = punta.clone().sub(base);
        const largo = dir.length();
        const leno = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2, largo, 7), mLeno);
        leno.position.copy(base).add(punta).multiplyScalar(0.5);
        leno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        scene.add(leno);
    }

    // --- Carteles
    const carteles = []; // { malla, ancho, alto, x, y, z, luz }
    function cartel(filas, paleta, x, y, z, { luz = true, sombra = false } = {}) {
        const { tex, ancho, alto } = texturaDeSprite(filas, paleta);
        const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 });
        const malla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), mat);
        colocar(malla, ancho, alto, x, y, z);
        scene.add(malla);
        const c = { malla, ancho, alto, x, y, z, luz, mat, tex };
        carteles.push(c);
        if (sombra) sombraDe(c);
        return c;
    }

    // Sombra en el suelo: el sprite "acostado" hacia el lado opuesto al
    // fuego. No es una sombra física (un cartel plano no proyecta nada),
    // es la silueta tendida, que es lo que el ojo espera ver.
    function sombraDe(c) {
        // Con el fuego fuerte la sombra se aleja de él; con sol, se aleja
        // del sol (el fuego de día es una brasa y no proyecta nada).
        const conSol = preset.fuego < 0.7;
        const dx = conSol ? -preset.astroDir[0] : c.x - FX;
        const dz = conSol ? -preset.astroDir[2] : c.z;
        const len = Math.hypot(dx, dz) || 1;
        const dir = new THREE.Vector3(dx / len, 0, dz / len);
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);
        const geo = new THREE.PlaneGeometry(c.ancho, c.alto, 1, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const xl = pos.getX(i);
            const yl = pos.getY(i) + c.alto / 2; // 0 en el pie
            const p = new THREE.Vector3(c.x, 0.08, c.z).addScaledVector(perp, xl).addScaledVector(dir, yl * (conSol ? 0.7 : 0.55));
            pos.setXYZ(i, p.x, p.y, p.z);
        }
        geo.computeVertexNormals();
        const mat = new THREE.MeshBasicMaterial({
            map: c.tex,
            color: preset.sombra,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            alphaTest: 0.5,
        });
        const m = new THREE.Mesh(geo, mat);
        m.renderOrder = 1;
        scene.add(m);
    }

    // Monte en tres capas, entre el fondo del suelo y el cielo.
    const monte = [COPA_CHICA, COPA_GRANDE, QUEBRACHO, PALO_BORRACHO, CARDON];
    const rm = semilla(21);
    for (let capa = 0; capa < 3; capa++) {
        // Las tres capas arrancan pegadas al fondo del suelo: las copas
        // tienen que asomar sobre el horizonte, no flotar delante de él.
        const z = ZFONDO + 2 + capa * 8;
        for (let x = -W / 2 - 8; x < W / 2; x += 18 + rm() * 22) {
            const sprite = monte[Math.floor(rm() * monte.length)];
            const c = cartel(sprite, PALETA_MONTE, x, 0, z - rm() * 3, { luz: false });
            c.mat.fog = false;
            c.capa = capa;
        }
    }

    // Alambrado: una diagonal que se pierde en el fondo.
    const mPoste = toon('#6e5238');
    const mAlambre = new THREE.MeshBasicMaterial({ color: '#2a2a2c' });
    const A = new THREE.Vector3(96, 0, -50);
    const B = new THREE.Vector3(22, 0, ZFONDO + 40);
    const postes = [];
    const PASOS = 9;
    for (let i = 0; i <= PASOS; i++) {
        const p = A.clone().lerp(B, i / PASOS);
        const poste = new THREE.Mesh(new THREE.BoxGeometry(2.4, 20, 2.4), mPoste);
        poste.position.set(p.x, 10, p.z);
        scene.add(poste);
        postes.push(p);
    }
    for (let i = 0; i < PASOS; i++) {
        for (const altura of [8, 15]) {
            const p0 = postes[i];
            const p1 = postes[i + 1];
            const largo = Math.hypot(p1.x - p0.x, p1.z - p0.z);
            const hilo = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, largo), mAlambre);
            hilo.position.set((p0.x + p1.x) / 2, altura, (p0.z + p1.z) / 2);
            hilo.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z);
            scene.add(hilo);
        }
    }

    // Caballo atado a un poste.
    const posteCaballo = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 3), mPoste);
    posteCaballo.position.set(46, 8, -34);
    scene.add(posteCaballo);
    cartel(CABALLO, PALETA_CABALLO, 66, 0, -32, { sombra: true });
    // La soga: del poste al hocico.
    const soga = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 14), new THREE.MeshBasicMaterial({ color: '#c8b48a' }));
    soga.position.set(52, 11, -33);
    soga.rotation.y = Math.PI / 2;
    scene.add(soga);

    // Vacas echadas, en el borde de la luz.
    cartel(VACA, PALETA_VACA, -62, 0, -80);
    cartel(VACA, PALETA_VACA, -18, 0, -122);
    cartel(VACA, PALETA_VACA, 44, 0, -150);

    // Gaucho.
    cartel(GAUCHO, PALETAS.dia, -24, 0, 4, { sombra: true });

    // Pasto: dos cuadros, la punta se corre un píxel.
    const rp = semilla(5);
    const pastos = [];
    const matPasto = PASTO.map((fr) => {
        const { tex } = texturaDeSprite(fr, PALETA_PASTO);
        return new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 });
    });
    for (let i = 0; i < 36; i++) {
        const x = (rp() - 0.5) * W;
        const z = -170 + rp() * 250;
        if (Math.hypot(x - FX, z) < 20) continue;
        const malla = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), matPasto[0]);
        colocar(malla, 4, 4, x, 0, z);
        scene.add(malla);
        pastos.push({ malla, fase: i % 2 });
    }

    // --- Fuego: llama, resplandor, brasas y humo.
    const llamas = FLAMA.map((fr) => {
        const filas = preset.llamaAlta ? fr : fr.slice(7);
        const { tex, ancho, alto } = texturaDeSprite(filas, PALETA_FLAMA);
        return { mat: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, fog: false }), ancho, alto };
    });
    const llama = new THREE.Mesh(new THREE.PlaneGeometry(llamas[0].ancho, llamas[0].alto), llamas[0].mat);
    scene.add(llama);

    const resplandor = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 90),
        new THREE.MeshBasicMaterial({
            map: texturaResplandor(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            opacity: 0.8 * Math.min(1, preset.fuego),
            fog: false,
        }),
    );
    resplandor.renderOrder = 5;
    colocar(resplandor, 90, 90, FX, 12 - 45, 0);
    scene.add(resplandor);

    // Brasas: puntos de un píxel que suben y se apagan.
    const NB = 18;
    const posBrasas = new Float32Array(NB * 3);
    const vidas = new Float32Array(NB);
    const rb = semilla(99);
    for (let i = 0; i < NB; i++) vidas[i] = rb() * 2.5;
    const geoBrasas = new THREE.BufferGeometry();
    geoBrasas.setAttribute('position', new THREE.BufferAttribute(posBrasas, 3));
    const brasas = new THREE.Points(
        geoBrasas,
        new THREE.PointsMaterial({
            color: '#ffb050',
            size: 1,
            sizeAttenuation: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
        }),
    );
    brasas.frustumCulled = false;
    if (preset.fuego > 0.3) scene.add(brasas);

    // Humo: cuatro bocanadas que suben y se desvanecen.
    const { tex: texHumo } = texturaDeSprite(
        ['..hh..', '.hhhh.', 'hhhhhh', 'hhhhhh', '.hhhh.', '..hh..'],
        { h: '#9aa4b0' },
    );
    const humos = [];
    for (let i = 0; i < 4; i++) {
        const mat = new THREE.MeshBasicMaterial({ map: texHumo, transparent: true, opacity: 0, depthWrite: false, fog: false });
        const malla = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), mat);
        scene.add(malla);
        humos.push({ malla, mat, edad: i * 0.9 });
    }

    // --- Animación
    const tinte = new THREE.Color(preset.tinte);
    const colFuego = new THREE.Color('#ff9a50');
    const tmp = new THREE.Color();
    let nivelFuego = 1;
    let proxCambio = 0;
    let cuadro = 0;
    let ultimoCuadro = 0;
    let raf = 0;
    let ultimo = 0;
    const rf = semilla(3);

    function pintar(t) {
        if (t >= proxCambio) {
            nivelFuego = [0.82, 0.92, 1, 1.1, 1.22][Math.floor(rf() * 5)];
            proxCambio = t + 0.09 + rf() * 0.09;
        }
        luzFuego.intensity = INT_FUEGO * nivelFuego;

        if (t - ultimoCuadro > 0.17) {
            ultimoCuadro = t;
            cuadro = (cuadro + 1) % 2;
            pastos.forEach((p) => (p.malla.material = matPasto[(cuadro + p.fase) % 2]));
        }
        const fl = llamas[cuadro];
        llama.material = fl.mat;
        llama.geometry.dispose();
        llama.geometry = new THREE.PlaneGeometry(fl.ancho, fl.alto);
        colocar(llama, fl.ancho, fl.alto, FX, 3, 0);
        // La llama de día es una ascuas pequeñas, y la luz pega poco.
        resplandor.material.opacity = 0.8 * Math.min(1, preset.fuego) * (0.85 + 0.15 * nivelFuego);

        // Los carteles reciben el ambiente y, en escalones, el fuego.
        for (const c of carteles) {
            if (!c.luz) {
                // Cuanto más lejos la capa, más se parece al color del cielo.
                c.mat.color.copy(tinte).multiplyScalar(0.55 + 0.2 * (c.capa ?? 0));
                continue;
            }
            const d = Math.hypot(c.x + c.ancho / 2 - FX, c.z);
            const f = Math.max(0, 1 - d / 120);
            const paso = Math.ceil(f * f * 4 * nivelFuego) / 4;
            tmp.copy(colFuego).multiplyScalar(paso * 0.9 * Math.min(1.3, preset.fuego));
            c.mat.color.copy(tinte).add(tmp);
        }
        for (const p of pastos) p.malla.material.color.copy(tinte).multiplyScalar(1.1);

        // Brasas
        const pos = geoBrasas.attributes.position;
        for (let i = 0; i < NB; i++) {
            const v = (vidas[i] + t * 0.45) % 2.6;
            const sube = v / 2.6;
            const sx = FX + Math.sin(i * 12.9 + t * 1.3) * (2 + sube * 6);
            const sy = 8 + sube * 46;
            const wz = Math.cos(i * 7.7) * 3;
            pos.setXYZ(i, sx, sy * COS, wz - sy * SIN);
        }
        pos.needsUpdate = true;
        brasas.material.opacity = 0.9;

        // Humo
        for (const h of humos) {
            const e = ((h.edad + t * 0.55) % 3.6) / 3.6;
            colocar(h.malla, 6, 6, FX + 4 + e * 12 + Math.sin(t + h.edad) * 2, 20 + e * 40, 0);
            h.mat.opacity = Math.sin(e * Math.PI) * 0.28 * (preset.fuego > 0.3 ? 1 : 0.4);
        }

        renderer.render(scene, camara);
    }

    // 30 cuadros por segundo como techo (batería a la noche).
    function bucle(ahora) {
        raf = requestAnimationFrame(bucle);
        if (ahora - ultimo < 1000 / 30) return;
        ultimo = ahora;
        pintar(ahora / 1000);
    }
    raf = requestAnimationFrame(bucle);

    return {
        dispose() {
            cancelAnimationFrame(raf);
            renderer.dispose();
            scene.traverse((o) => {
                o.geometry?.dispose?.();
            });
        },
        congelar(t) {
            cancelAnimationFrame(raf);
            pintar(t);
        },
    };
}

// --- Texturas hechas a mano ---

function cielo(W, H, yHorizonte, preset) {
    const lienzo = document.createElement('canvas');
    lienzo.width = W;
    lienzo.height = H;
    const ctx = lienzo.getContext('2d');
    const alto = new THREE.Color(preset.cieloAlto);
    const bajo = new THREE.Color(preset.cieloBajo);
    const bandas = 8;
    const c = new THREE.Color();
    for (let i = 0; i < bandas; i++) {
        c.copy(alto).lerp(bajo, i / (bandas - 1));
        ctx.fillStyle = `#${c.getHexString(THREE.SRGBColorSpace)}`;
        const y0 = Math.round((i * yHorizonte) / bandas);
        ctx.fillRect(0, y0, W, Math.ceil(yHorizonte / bandas) + 1);
    }
    ctx.fillStyle = `#${bajo.getHexString(THREE.SRGBColorSpace)}`;
    ctx.fillRect(0, yHorizonte, W, H - yHorizonte);

    const r = semilla(11);
    if (preset.estrellas) {
        for (let i = 0; i < 46; i++) {
            const x = Math.floor(r() * W);
            const y = Math.floor(r() * (yHorizonte - 16));
            ctx.fillStyle = r() > 0.8 ? '#f0e6cc' : '#8f9ab0';
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // El astro y su resplandor disperso.
    const disco = (cx, cy, rad, color, halo) => {
        for (let y = -rad - 3; y <= rad + 3; y++) {
            for (let x = -rad - 3; x <= rad + 3; x++) {
                const d = Math.hypot(x, y);
                if (d <= rad) {
                    ctx.fillStyle = color;
                    ctx.fillRect(cx + x, cy + y, 1, 1);
                } else if (d <= rad + 3 && (x + y) % 2 === 0) {
                    ctx.fillStyle = halo;
                    ctx.fillRect(cx + x, cy + y, 1, 1);
                }
            }
        }
    };
    if (preset.astro === 'luna') {
        const cx = Math.round(W * 0.27);
        const cy = Math.round(yHorizonte * 0.42);
        disco(cx, cy, 6, '#e8dcc4', '#2a3442');
        // Cuarto creciente: se tapa con un disco del color del cielo.
        ctx.fillStyle = `#${alto.clone().lerp(bajo, 0.3).getHexString(THREE.SRGBColorSpace)}`;
        for (let y = -7; y <= 7; y++)
            for (let x = -7; x <= 7; x++) if (Math.hypot(x - 4, y - 1) <= 6.2 && Math.hypot(x, y) <= 6) ctx.fillRect(cx + x, cy + y, 1, 1);
    } else if (preset.astro === 'sol') {
        disco(Math.round(W * 0.7), Math.round(yHorizonte * 0.38), 7, '#fff4c8', '#e8d49a');
    } else if (preset.astro === 'sol-bajo') {
        disco(Math.round(W * 0.28), yHorizonte - 12, 8, '#ffd9a0', '#f5a860');
    }

    // Línea de monte lejano, la silueta continua detrás de las copas.
    ctx.fillStyle = preset.monteLejos;
    for (let x = 0; x < W; x++) {
        const h = 5 + Math.round(5 * Math.sin(x * 0.21) + 3 * Math.sin(x * 0.67 + 1) + r() * 2);
        ctx.fillRect(x, yHorizonte - h, 1, h + 1);
    }

    const tex = new THREE.CanvasTexture(lienzo);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// Suelo: tierra seca moteada. 64 de ancho por 64 de alto de textura, que
// el plano estira a 1 unidad de ancho y 2 de fondo por píxel (ver SIN).
function texturaSuelo(preset, anchoSuelo, largoSuelo) {
    const lienzo = document.createElement('canvas');
    lienzo.width = 64;
    lienzo.height = 64;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#6d5f45';
    ctx.fillRect(0, 0, 64, 64);
    const r = semilla(13);
    const colores = ['#7a6b4e', '#5d5039', '#84744f', '#665840'];
    for (let i = 0; i < 260; i++) {
        ctx.fillStyle = colores[Math.floor(r() * colores.length)];
        ctx.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 1 + Math.floor(r() * 2), 1);
    }
    const tex = new THREE.CanvasTexture(lienzo);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(anchoSuelo / 64, largoSuelo / 128);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    void preset;
    return tex;
}

// Resplandor en bandas: seis anillos concéntricos, no un degradé liso.
function texturaResplandor() {
    const N = 64;
    const lienzo = document.createElement('canvas');
    lienzo.width = N;
    lienzo.height = N;
    const ctx = lienzo.getContext('2d');
    const img = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const d = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5) / (N / 2);
            const banda = Math.max(0, Math.ceil((1 - d) * 6) / 6);
            const i = (y * N + x) * 4;
            img.data[i] = 255;
            img.data[i + 1] = 150;
            img.data[i + 2] = 60;
            img.data[i + 3] = Math.round(banda * banda * 70);
        }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(lienzo);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
