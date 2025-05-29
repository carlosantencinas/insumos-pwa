self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("insumos-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./insumos.csv",
        "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
