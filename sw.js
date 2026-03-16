const CACHE_NAME = 'posimai-daily-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // 待機せず即座に新 SW に切り替える
});

self.addEventListener('activate', (event) => {
  // 古いキャッシュを全削除
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // 既存タブもすぐ新 SW が管理
  );
});

self.addEventListener('fetch', (event) => {
  // POST はキャッシュ不可（TTS 等）— SW では何もしない
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-First for external API（常に最新を取得）
  if (url.pathname.includes('/api/') && url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-First for static assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
