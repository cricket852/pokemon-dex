var CACHE_NAME = 'pokemon-dex-v2';
var STATIC_ASSETS = ['/pokemon-dex/', '/pokemon-dex/index.html', '/pokemon-dex/manifest.json'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(STATIC_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.hostname === 'pokeapi.co' || url.hostname === 'raw.githubusercontent.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function() {
            return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
          });
        });
      })
    );
    return;
  }
  event.respondWith(
    fetch(event.request).catch(function() { return caches.match(event.request); })
  );
});
