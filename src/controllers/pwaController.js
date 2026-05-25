function manifest(req, res) {
  res.json({
    name: 'ReMon — Pencatat Keuangan',
    short_name: 'ReMon',
    description: 'Catat pengeluaran, split bill, tracking hutang — semua dalam satu aplikasi.',
    start_url: '/ReMon/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/ReMon/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/ReMon/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  });
}

function serviceWorker(req, res) {
  res.type('application/javascript');
  res.render('pwa/sw', null, (err, html) => {
    if (err) {
      // Fallback basic SW
      res.send(`
const CACHE = 'remon-v1';
const STATIC = ['/ReMon/css/app.css','/ReMon/js/app.js','/ReMon/icons/icon-192.svg','/ReMon/icons/icon-512.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (STATIC.includes(u.pathname)) return e.respondWith(caches.match(e.request));
  e.respondWith(fetch(e.request).catch(() => caches.match('/ReMon/offline')));
});
      `.trim());
    } else {
      res.send(html);
    }
  });
}

module.exports = { manifest, serviceWorker };
