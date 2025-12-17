
const CACHE_NAME = 'dragons-hoard-assets-v1';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients to control pages immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event - Intercept requests to asset domains
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache external assets (Pollinations AI images and Pixabay Audio)
  // We strictly cache GET requests to these domains
  if ((url.hostname === 'image.pollinations.ai' || url.hostname === 'cdn.pixabay.com') && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'cors' && networkResponse.type !== 'basic' && networkResponse.type !== 'opaque') {
            return networkResponse;
          }

          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }).catch((err) => {
            // Network failure fallback (could return a placeholder here if needed)
            console.warn('Fetch failed for asset:', event.request.url);
            throw err;
        });
      })
    );
  }
});
