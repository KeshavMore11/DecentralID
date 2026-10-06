const CACHE_NAME = 'ssi-wallet-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/app.js',
    '/js/crypto-utils.js',
    '/js/storage.js',
    '/js/did-manager.js',
    '/js/theme.js',
    '/js/role-switcher.js',
    '/js/credential-manager.js',
    '/js/selective-disclosure.js',
    '/js/did-auth.js',
    '/js/components/onboarding.js',
    '/js/components/dashboard.js',
    '/js/components/credential-issuer.js',
    '/js/components/credential-holder.js',
    '/js/components/credential-verifier.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Return offline fallback if available
                    return caches.match('/index.html');
                });
            })
    );
});

// Background sync (for future implementation)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-credentials') {
        event.waitUntil(syncCredentials());
    }
});

async function syncCredentials() {
    // Future implementation: sync credentials when online
    console.log('[Service Worker] Background sync triggered');
}
