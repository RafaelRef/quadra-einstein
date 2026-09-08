// Quadra Einstein — service worker do PWA.
//
// Só cuida de ASSETS (html/css/js/ícones), pra instalar como app e abrir rápido
// mesmo com conexão ruim. Dados (jogos, eventos, placar) NÃO passam por aqui —
// isso é responsabilidade da fila em js/offline-queue.js. Por isso o fetch
// handler ignora qualquer request pra fora da própria origem (Supabase inclusive).
const CACHE_NAME = 'quadra-einstein-v2';

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

// Network-first: sempre busca a versão mais nova primeiro (crítico enquanto o
// app está em desenvolvimento ativo — ninguém quer ficar preso numa tela
// antiga sem saber por quê). Só cai pro cache se a rede falhar de verdade
// (offline), que é o cenário que o PWA existe pra cobrir.
//
// Versão anterior era stale-while-revalidate (mostrava o cache antigo na hora
// e só atualizava em segundo plano pra PRÓXIMA visita) — na prática isso fazia
// qualquer deploy novo parecer "não teve efeito" pra quem já tinha visitado
// antes, porque a tela antiga aparecia primeiro sempre.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return; // nunca mexe em chamadas ao Supabase
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
