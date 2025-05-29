const CACHE_NAME = 'pwa-insumos-cache-v1';
const urlsToCache = [
  '.',
  'index.html',
  'app.js',
  'xlsx.full.min.js',
  'chart.min.js',
  'manifest.json'
  // añadir iconos si se usan
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(resp => resp || fetch(e.request))
  );
});
