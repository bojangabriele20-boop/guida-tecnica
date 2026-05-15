// service-worker.js
// Guida Tecnica Universale — PWA Service Worker

const CACHE_NAME = 'guida-tecnica-v1';

// File da salvare in cache per uso offline
const FILES_TO_CACHE = [
  './guida-tecnica.html',
  './manifest.json',
];

// ── INSTALL ──────────────────────────────────────────────
// Si attiva la prima volta che il SW viene registrato.
// Mette in cache tutti i file essenziali.
self.addEventListener('install', event => {
  console.log('[SW] Installazione in corso...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] File salvati in cache');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Attiva subito senza aspettare che le vecchie tab si chiudano
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────
// Si attiva dopo l'install. Pulisce le vecchie cache
// di versioni precedenti del SW.
self.addEventListener('activate', event => {
  console.log('[SW] Attivato');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Cache vecchia eliminata:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Prende controllo di tutte le tab aperte subito
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────
// Intercetta ogni richiesta di rete.
// Strategia: Cache First → se il file è in cache lo serve
// da lì (veloce e offline). Se non c'è, prova la rete.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Trovato in cache → risposta istantanea
        return cachedResponse;
      }

      // Non in cache → prova la rete
      return fetch(event.request).then(networkResponse => {
        // Se la risposta è valida, salvala in cache per dopo
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Rete non disponibile e non in cache:
        // mostra pagina offline di fallback (se vuoi aggiungerla)
        console.log('[SW] Offline e non in cache:', event.request.url);
      });
    })
  );
});
