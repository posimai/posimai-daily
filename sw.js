const CACHE_NAME = 'posimai-daily-v11';
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

const ORIGIN = self.location.origin;
self.addEventListener('fetch', (event) => {
  // POST はキャッシュ不可（TTS 等）— SW では何もしない
  if (event.request.method !== 'GET') return;
  // クロスオリジン（Brain API / Feed API 等）はブラウザに委譲（キャッシュしない）
  if (!event.request.url.startsWith(ORIGIN)) return;

  // Cache-First for static assets（同一オリジンのみ）
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
