function manifest(req, res) {
  res.json({
    name: 'ReMon — Pencatat Keuangan',
    short_name: 'ReMon',
    description: 'Catat pengeluaran, split bill, tracking hutang — semua dalam satu aplikasi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  });
}

function serviceWorker(req, res) {
  res.type('application/javascript');
  // IMPORTANT: Service Worker must never be cached by the browser.
  // Without this, the browser will serve the old SW indefinitely.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.render('pwa/sw', { version: '9' }, (err, html) => {
    if (err) {
      // Fallback basic SW
      res.send(`
const CACHE = 'remon-v1';
const STATIC = ['/css/app.css','/js/app.js','/icons/icon-192.svg','/icons/icon-512.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (STATIC.includes(u.pathname)) return e.respondWith(caches.match(e.request));
  e.respondWith(fetch(e.request).catch(() => caches.match('/offline')));
});
      `.trim());
    } else {
      res.send(html);
    }
  });
}

module.exports = { manifest, serviceWorker };
