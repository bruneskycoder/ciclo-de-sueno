// contraste.cjs — mide el contraste del texto sobre los píxeles reales de la
// pintura, en el borde de las letras (paso 16).
//
// Cómo: para cada posición de scroll, de a 40 puntos, saca dos capturas.
// En la segunda el texto es transparente pero el halo queda. Los píxeles
// que cambian entre una y otra son las letras; el fondo es lo que hay a 1 o
// 2 píxeles de una letra en la segunda captura, con el halo incluido. Por
// elemento da el percentil 2 de la razón WCAG contra el color del texto, y
// se queda con la peor posición de scroll.
//
// La escena se mide quieta (movimiento reducido): el titileo sube o baja la
// luz del fuego hasta un 25% y eso queda afuera.
//
// Uso, con `npm run dev` andando:
//   node scripts/contraste.cjs [noche,atardecer,dia,brasa] [375x667,390x844,430x932]
// Necesita Playwright con Chromium, que no está en las dependencias.
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const BASE = process.env.BASE ?? 'http://localhost:5173/ciclo-de-sueno/';
const SEL = {
    título: '.cabecera h1',
    bajada: '.bajada',
    'título lista': '.resultado-titulo',
    hora: '.fila .hora',
    falta: '.fila .falta',
    ciclos: '.fila .ciclos',
    'poner alarma': '.btn-alarma',
    'pie lista': '.resultado-pie',
    'detalle acción': '.accion-detalle',
    'label despertar': '.form-despertar > label',
    enlaces: '.enlace span:first-child',
    iconos: '.btn-icono span[aria-hidden]',
};
const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
    const [x, y] = a > b ? [a, b] : [b, a];
    return (x + 0.05) / (y + 0.05);
};

async function medir(page) {
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const peor = {};
    for (let y = 0; y <= max + 39; y += 40) {
        const sy = Math.min(y, max);
        await page.evaluate((s) => window.scrollTo(0, s), sy);
        await page.waitForTimeout(80);
        const info = await page.evaluate((SEL) => {
            const out = {};
            for (const [k, sel] of Object.entries(SEL)) {
                out[k] = [];
                for (const el of document.querySelectorAll(sel)) {
                    const cs = getComputedStyle(el);
                    if (cs.visibility === 'hidden') continue;
                    const m = cs.color.match(/[\d.]+/g).map(Number);
                    const r = document.createRange();
                    r.selectNodeContents(el);
                    for (const b of r.getClientRects()) {
                        if (b.width < 2 || b.bottom < 0 || b.top > innerHeight) continue;
                        out[k].push({
                            x0: Math.max(0, Math.floor(b.left)),
                            y0: Math.max(0, Math.floor(b.top)),
                            x1: Math.min(innerWidth, Math.ceil(b.right)),
                            y1: Math.min(innerHeight, Math.ceil(b.bottom)),
                            color: m.slice(0, 3),
                        });
                    }
                }
            }
            return out;
        }, SEL);
        const A = PNG.sync.read(await page.screenshot());
        await page
            .addStyleTag({
                content:
                    '*{color:transparent!important;-webkit-text-fill-color:transparent!important}',
            })
            .then((h) => h.evaluate((e) => (e.id = 'transp')));
        await page.waitForTimeout(30);
        const B = PNG.sync.read(await page.screenshot());
        await page.evaluate(() => document.getElementById('transp').remove());
        const W = A.width;
        const px = (img, x, y) => {
            const o = (y * W + x) * 4;
            return [img.data[o], img.data[o + 1], img.data[o + 2]];
        };
        for (const [k, rects] of Object.entries(info)) {
            const rs = [];
            for (const R of rects) {
                const TL = L(...R.color);
                const w = R.x1 - R.x0,
                    h = R.y1 - R.y0;
                if (w <= 0 || h <= 0) continue;
                const glifo = new Uint8Array(w * h);
                for (let y = 0; y < h; y++)
                    for (let x = 0; x < w; x++) {
                        const a = px(A, R.x0 + x, R.y0 + y),
                            b = px(B, R.x0 + x, R.y0 + y);
                        if (
                            Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) >
                            60
                        )
                            glifo[y * w + x] = 1;
                    }
                for (let y = 0; y < h; y++)
                    for (let x = 0; x < w; x++) {
                        if (glifo[y * w + x]) continue;
                        let cerca = false;
                        for (let dy = -2; dy <= 2 && !cerca; dy++)
                            for (let dx = -2; dx <= 2; dx++) {
                                const xx = x + dx,
                                    yy = y + dy;
                                if (xx >= 0 && yy >= 0 && xx < w && yy < h && glifo[yy * w + xx]) {
                                    cerca = true;
                                    break;
                                }
                            }
                        if (!cerca) continue;
                        const b = px(B, R.x0 + x, R.y0 + y);
                        rs.push(ratio(TL, L(...b)));
                    }
            }
            if (rs.length < 20) continue;
            rs.sort((a, b) => a - b);
            const p2 = rs[Math.floor(rs.length * 0.02)];
            if (!peor[k] || p2 < peor[k].v) peor[k] = { v: p2, scroll: sy };
        }
    }
    return peor;
}

(async () => {
    const casos = (process.argv[2] || 'noche,atardecer,dia,brasa').split(',');
    const tamanos = (process.argv[3] || '375x667,390x844,430x932')
        .split(',')
        .map((s) => s.split('x').map(Number));
    const CIELO = {
        noche: '2026-11-12T23:30-03:00',
        atardecer: '2026-11-12T19:40-03:00',
        dia: '2026-11-12T14:00-03:00',
        brasa: '2026-11-12T23:30-03:00',
    };
    const b = await chromium.launch();
    const tabla = {};
    for (const [vw, vh] of tamanos)
        for (const caso of casos) {
            const ctx = await b.newContext({
                viewport: { width: vw, height: vh },
                deviceScaleFactor: 1,
                reducedMotion: 'reduce',
                timezoneId: 'America/Argentina/Buenos_Aires',
            });
            if (caso === 'brasa')
                await ctx.addInitScript(() => localStorage.setItem('themePref', 'brasa'));
            const page = await ctx.newPage();
            await page.goto(BASE + '?cielo=' + encodeURIComponent(CIELO[caso]));
            await page.waitForFunction(
                () => document.documentElement.classList.contains('escena-pintada'),
                null,
                { timeout: 15000 },
            );
            await page.waitForTimeout(400);
            const r = await medir(page);
            for (const [k, v] of Object.entries(r)) {
                tabla[k] ??= {};
                tabla[k][`${vw} ${caso}`] = v;
            }
            await ctx.close();
        }
    await b.close();
    const cols = [...new Set(Object.values(tabla).flatMap((o) => Object.keys(o)))];
    console.log(['elemento', ...cols, 'peor'].join(' | '));
    for (const [k, o] of Object.entries(tabla)) {
        const vals = cols.map((c) => (o[c] ? o[c].v : null));
        const min = Math.min(...vals.filter((v) => v !== null));
        const minc = cols[vals.indexOf(min)];
        console.log(
            [
                k,
                ...vals.map((v) => (v === null ? '-' : v.toFixed(1))),
                `${min.toFixed(2)} (${minc}, scroll ${o[minc].scroll})`,
            ].join(' | '),
        );
    }
})();
