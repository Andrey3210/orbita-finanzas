const version = 'foxio-3';
const root = new URL(self.registration.scope);
const cachePrefix = 'foxio-app:' + root.pathname + ':';
const cacheName = cachePrefix + version;
const offlinePage = new URL('./?v=' + version, root);
const shell = [
  offlinePage.href,
  ...['style.css', 'layout.css', 'app.js', 'pwa.js', 'model.js', 'icons.js', 'navigation.js',
    'zorro-inicio.webp', 'zorro-cuentas.webp', 'zorro-explorar.webp', 'zorro-pronostico.webp', 'zorro-actividad.webp'
  ].map(file => './assets/' + file + '?v=' + version),
  './manifest.webmanifest',
  './assets/foxio-180.png', './assets/foxio-192.png', './assets/foxio-512.png', './assets/foxio-maskable.png',
];
const shellUrls = new Set(shell.map(path => new URL(path, root).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...shellUrls].map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(name => name.startsWith(cachePrefix) && name !== cacheName);
    await Promise.all(old.map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(root.href)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: 'no-cache' });
      } catch {
        return await (await caches.open(cacheName)).match(offlinePage.href) || Response.error();
      }
    })());
  } else if (shellUrls.has(request.url)) {
    event.respondWith((async () => {
      return await (await caches.open(cacheName)).match(request) || fetch(request);
    })());
  }
});
