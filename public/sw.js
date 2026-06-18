// Service worker — offline-first для Школярика (PWA).
// База визначається з власного шляху воркера, тож працює і на GH Pages
// (/shkolyaryk/sw.js → base "/shkolyaryk"), і під власним доменом (base "").
const CACHE = 'shkolyaryk-v1';
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const APP_SHELL = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/favicon.png`,
  `${BASE}/icon.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll падає весь, якщо один ресурс 404 — кладемо по одному best-effort.
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Не чіпаємо cross-origin (Supabase auth/sync тощо) — лишаємо мережі.
  if (url.origin !== self.location.origin) return;

  // SPA-навігація: мережа перша, офлайн → кешована оболонка.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(`${BASE}/index.html`)),
    );
    return;
  }

  // Статика (JS/CSS/шрифти/зображення/аудіо): кеш перший, інакше мережа + докешування.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
    }),
  );
});
