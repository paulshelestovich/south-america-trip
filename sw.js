const CACHE = 'sa-trip-v3';
const CORE = ['/', '/index.html'];
const DOCS = [
  '/south-america-trip/docs/Cusco%20Airbnb%20.pdf',
  '/south-america-trip/docs/Lima%20Airbnb%20Receipt.pdf',
  '/south-america-trip/docs/Pudahuel%20Airbnb%20.pdf',
  '/south-america-trip/docs/San%20Crist%C3%B3bal%20Airbnb%20.pdf',
  '/south-america-trip/docs/Santa%20Cruz%20Airbnb.pdf',
  '/south-america-trip/docs/Santiago%20Airbnb%201.pdf',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      // Core assets must succeed
      await c.addAll(CORE);
      // PDFs cached individually — a single failure won't break install
      await Promise.allSettled(
        DOCS.map(url => fetch(url).then(res => { if (res.ok) c.put(url, res); }))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Only fall back to index.html for navigation requests, not assets/PDFs
        if (e.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
