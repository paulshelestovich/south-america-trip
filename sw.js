const APP_CACHE = 'sa-trip-app-v2';
const PDF_CACHE = 'sa-trip-pdf-v1';

const APP_SHELL = [
  '/south-america-trip/',
  '/south-america-trip/index.html',

];

const PDF_PRELOAD = [
  '/south-america-trip/docs/WEB2651809.pdf',
  '/south-america-trip/docs/WEB2743574.pdf',
  '/south-america-trip/docs/Boletos_2444279.pdf',
  '/south-america-trip/docs/Boletos_2444567.pdf',
  '/south-america-trip/docs/boarding-SCL-LIM-Pavel.pdf',
  '/south-america-trip/docs/boarding-SCL-LIM-Darya.pdf',
  '/south-america-trip/docs/boarding-SCL-LIM-Yevhenii.pdf',
  '/south-america-trip/docs/boarding-SCL-LIM-Tetiana.pdf',
  '/south-america-trip/docs/boarding-SCL-LIM-Valentin.pdf',
  '/south-america-trip/docs/boarding-LIM-CUZ-Pavel.pdf',
  '/south-america-trip/docs/boarding-LIM-CUZ-Darya.pdf',
  '/south-america-trip/docs/boarding-LIM-CUZ-Yevhenii.pdf',
  '/south-america-trip/docs/boarding-LIM-CUZ-Tetiana.pdf',
  '/south-america-trip/docs/boarding-LIM-CUZ-Valentin.pdf',
  '/south-america-trip/docs/Consettur-Bus-Tickets.pdf',
  '/south-america-trip/docs/boarding-LIM-GYE-Pavel.pdf',
  '/south-america-trip/docs/boarding-LIM-GYE-Darya.pdf',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_CACHE).then(c => c.addAll(APP_SHELL))
      .then(() => caches.open(PDF_CACHE).then(c => c.addAll(PDF_PRELOAD).catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== APP_CACHE && k !== PDF_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'CACHE_PDF') {
    const { url, auto } = e.data;
    const src = e.source;
    e.waitUntil(
      caches.open(PDF_CACHE)
        .then(c => c.add(url))
        .then(() => src?.postMessage({ type: 'PDF_CACHED', url, auto }))
        .catch(err => src?.postMessage({ type: 'PDF_CACHE_ERROR', url, auto, error: String(err) }))
    );
  }
  if (e.data?.type === 'REMOVE_PDF') {
    const { url } = e.data;
    const src = e.source;
    e.waitUntil(
      caches.open(PDF_CACHE)
        .then(c => c.delete(url))
        .then(() => src?.postMessage({ type: 'PDF_REMOVED', url }))
    );
  }
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  if (url.pathname.endsWith('.pdf')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(PDF_CACHE).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('PDF not available offline. Open the app online and tap "Save offline" first.', {
          status: 503, headers: { 'Content-Type': 'text/plain' }
        }));
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match(request).then(cached => {
        const netFetch = fetch(request).then(res => {
          if (res.ok) caches.open(APP_CACHE).then(c => c.put(request, res.clone()));
          return res;
        });
        return cached ? (netFetch.catch(() => {}), cached) : netFetch;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(APP_CACHE).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => new Response('', {status:503}));
    })
  );
});
