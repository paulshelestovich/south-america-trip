const CACHE = 'sa-trip-v2';
const ASSETS = [
  '/', '/index.html',
  '/south-america-trip/docs/Cusco%20Airbnb%20.pdf',
  '/south-america-trip/docs/Lima%20Airbnb%20Receipt.pdf',
  '/south-america-trip/docs/Pudahuel%20Airbnb%20.pdf',
  '/south-america-trip/docs/San%20Crist%C3%B3bal%20Airbnb%20.pdf',
  '/south-america-trip/docs/Santa%20Cruz%20Airbnb.pdf',
  '/south-america-trip/docs/Santiago%20Airbnb%201.pdf',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
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
      }).catch(() => caches.match('/index.html'));
    })
  );
});
