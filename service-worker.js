const CACHE_NAME = 'crechenow-v1';
const STATIC_ASSETS = [
  '/', '/index.html', '/dashboard-parent.html', '/dashboard-staff.html',
  '/assets/css/main.css', '/assets/css/components.css',
  '/assets/js/app.js', '/assets/js/auth.js', '/assets/js/notifications.js', '/assets/js/storage.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Instalação: Precache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
});

// Fetch: Cache-first para estáticos, Network-first para dados, fallback offline
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/data/')) {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});

// Push notifications (simulado para MVP)
self.addEventListener('push', (e) => {
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, icon: '/assets/img/icons/icon-192x192.png' })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/dashboard-parent.html'));
});