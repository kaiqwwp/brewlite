/* BrewLite service worker (PWA).
 * - Trang (navigation): ưu tiên mạng, mất mạng thì dùng bản đã lưu hoặc trang /offline.html.
 * - Tài nguyên tĩnh (/_next/static, /images, /icons): cache-first.
 * - Không bao giờ cache API (giá, tồn kho, đơn hàng phải luôn mới) và mọi request không phải GET.
 */
const VERSION = 'brewlite-v2';
const SHELL = ['/', '/offline.html', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // API ở origin khác: để mạng xử lý

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline.html'))),
    );
    return;
  }

  if (/^\/(_next\/static|images|icons)\//.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })),
    );
  }
});
