// Quadra Einstein — service worker do PWA.
//
// Só cuida de ASSETS (html/css/js/ícones), pra instalar como app e abrir rápido
// mesmo com conexão ruim. Dados (jogos, eventos, placar) NÃO passam por aqui —
// isso é responsabilidade da fila em js/offline-queue.js. Por isso o fetch
// handler ignora qualquer request pra fora da própria origem (Supabase inclusive).
const CACHE_NAME = 'quadra-einstein-v1';

const APP_SHELL = [
  './',
  'index.html',
  'choose.html',
  'manifest.json',
  'css/style.css',
  'js/supabase-client.js',
  'js/config.js',
  'js/auth.js',
  'js/utils.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: responde rápido com o que tem em cache (ou a rede, se
// for a primeira vez), e atualiza o cache em segundo plano pra próxima visita.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return; // nunca mexe em chamadas ao Supabase
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
