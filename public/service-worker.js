// service-worker.js — cache-first para assets estáticos (Fase 7). Toda la
// app es estática (sin backend, sin API que consultar), así que "cachear
// todo y servir desde cache" es una estrategia razonable. La única
// salvedad es el HTML de navegación, que va network-first (ver abajo) —
// si no, después de un deploy nuevo la app podría quedar sirviendo para
// siempre un index.html viejo que apunta a bundles JS/CSS que ya no
// existen en el servidor.
//
// CACHE_VERSION: subirla a mano cuando convenga forzar una limpieza
// completa del cache (no hace falta en cada commit — los archivos con
// hash de contenido de Vite ya cambian de nombre solos cuando cambia su
// contenido, así que conviven viejos y nuevos sin pisarse).
const CACHE_VERSION = 'v1';
const CACHE_NAME = `ciclo-de-sueno-${CACHE_VERSION}`;

// Rutas sin hash de contenido, conocidas de antemano: se precachean en
// el install. Los bundles JS/CSS (que sí tienen hash y cambian de nombre
// en cada build) no están acá a propósito — se cachean solos la primera
// vez que se piden, vía el fetch handler de más abajo.
const PRECACHE_URLS = [
    '/ciclo-de-sueno/',
    '/ciclo-de-sueno/manifest.json',
    '/ciclo-de-sueno/favicon.svg',
    '/ciclo-de-sueno/icons/icon-192.png',
    '/ciclo-de-sueno/icons/icon-512.png',
    '/ciclo-de-sueno/icons/icon-maskable-512.png',
    '/ciclo-de-sueno/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name.startsWith('ciclo-de-sueno-') && name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                )
            )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

    // Navegación (abrir/recargar la app): network-first. Con red, siempre
    // se sirve el HTML más nuevo (el que apunta a los bundles vigentes);
    // sin red, se cae al último HTML que sí se pudo cachear.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match('/ciclo-de-sueno/'))
        );
        return;
    }

    // Todo lo demás (JS, CSS, íconos, manifest): cache-first. Los bundles
    // con hash de Vite son inmutables por nombre — si cambia el
    // contenido, cambia el nombre del archivo — así que servirlos desde
    // cache sin revalidar contra la red es seguro y más rápido.
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});
