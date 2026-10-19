// Foto Cantiere — service worker: l'app si apre anche senza rete.
const VERSION = 'fc-v5-accesso-cantiere'; // cache del codice: aggiornarla non tocca i dati (IndexedDB e Drive)
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google (accesso e Drive) mai in cache
  if (/googleapis\.com$|google\.com$|googleusercontent\.com$/.test(url.hostname) && url.hostname !== 'fonts.googleapis.com') return;
  if (url.origin === location.origin) {
    // pagina: prima la rete (per ricevere gli aggiornamenti), poi la copia salvata
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(m => m || fetch(req)));
    return;
  }
  // caratteri e lettore PDF da CDN: copia salvata se disponibile
  if (/fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
  }
});
