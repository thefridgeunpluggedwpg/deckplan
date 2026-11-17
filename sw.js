const CACHE = 'deckplan-v1.3.4';
const FILES = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/cj-watermark.png', 'vendor/jspdf.umd.min.js', 'vendor/svg2pdf.umd.min.js', 'vendor/osifont.js', 'vendor/osifont-lgpl3fe.ttf',
  'js/engine.js', 'js/svgkit.js', 'js/watermark.js', 'js/estimate-mark.js', 'js/sheets.js', 'js/sheets2.js', 'js/sheets3.js', 'js/defaults.js', 'js/app.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
