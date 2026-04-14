const APP_CACHE = 'sa-trip-app-v1';
const PDF_CACHE = 'sa-trip-pdf-v1';

const APP_SHELL = [
  '/south-america-trip/',
  '/south-america-trip/index.html',
  '/south-america-trip/offline.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
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
    const { url } = e.data;
    const src = e.source;
    e.waitUntil(
      caches.open(PDF_CACHE)
        .then(c => c.add(url))
        .then(() => src?.postMessage({ type: 'PDF_CACHED', url }))
        .catch(err => src?.postMessage({ type: 'PDF_CACHE_ERROR', url, error: String(err) }))
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
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(APP_CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('/south-america-trip/offline.html'))
        )
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
      }).catch(() => undefined);
    })
  );
});
