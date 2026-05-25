function manifest(req, res) {
  res.json({
    name: 'ReMon — Pencatat Keuangan',
    short_name: 'ReMon',
    description: 'Catat pengeluaran, split bill, tracking hutang.',
    start_url: '/ReMon/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/ReMon/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/ReMon/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });
}

function serviceWorker(req, res) {
  res.type('application/javascript');
  res.send(`
const CACHE_NAME = 'remon-v1';
const STATIC_ASSETS = [
  '/ReMon/css/app.css',
  '/ReMon/js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/ReMon/offline'))
    );
  }
});
  `.trim());
}

module.exports = { manifest, serviceWorker };
