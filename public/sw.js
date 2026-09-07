// Service Worker para VivaVarejo PWA
// Cacheia estáticos essenciais (app shell).
// NUNCA cacheia requisições para a API do PocketBase (/api/ ou domínios de backend) - sempre rede para dados.

const CACHE_NAME = 'vivavarejo-shell-v1'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // 1. NUNCA interceptar nem cachear chamadas da API do PocketBase ou requisições não-GET
  if (
    req.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('internal.goskip.dev') ||
    url.hostname.includes('goskip.dev') ||
    url.hostname.includes('127.0.0.1:8090')
  ) {
    return
  }

  // 2. Para navegações de página (HTML), estratégia Network-first com fallback para index em cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedIndex = await cache.match('/index.html')
        return cachedIndex || (await cache.match('/'))
      }),
    )
    return
  }

  // 3. Para ativos estáticos locais (scripts, css, imagens locais), stale-while-revalidate ou cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Revalidar em background
          fetch(req)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes))
              }
            })
            .catch(() => {})
          return cached
        }
        return fetch(req).then((networkRes) => {
          if (
            networkRes &&
            networkRes.status === 200 &&
            (url.pathname.endsWith('.js') ||
              url.pathname.endsWith('.css') ||
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.ico'))
          ) {
            const copy = networkRes.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
          }
          return networkRes
        })
      }),
    )
  }
})
