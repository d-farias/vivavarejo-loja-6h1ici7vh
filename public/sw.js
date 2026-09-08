// Service Worker para VivaVarejo PWA
// Versão do app: 0.0.65
// Estratégia de cache:
// 1. Navegação (HTML / App Shell): Network-first SEMPRE com timeout e fallback para cache apenas se offline.
//    Isso garante que celulares com o app instalado recebam imediatamente a nova versão ao abrir ou recarregar com internet.
// 2. Assets estáticos versionados pelo Vite (assets/*.js, assets/*.css): Cache-first / stale-while-revalidate com purge completo na ativação de nova versão.
// 3. NUNCA interceptar nem cachear chamadas de API do PocketBase (/api/) ou serviços externos.
// 4. Ativação imediata: self.skipWaiting() e clients.claim(), enviando mensagem de update aos clientes abertos.

const APP_VERSION = '0.0.65'
const CACHE_NAME = `vivavarejo-shell-v${APP_VERSION}`

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.ico',
]

// Instalação: baixa os assets essenciais e pula a espera imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((err) => {
        console.warn('[VivaVarejo SW] Erro no precache:', err)
      }),
  )
})

// Ativação: apaga TODOS os caches antigos (incluindo vivavarejo-shell-v2 e versões legadas) e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[VivaVarejo SW] Purgando cache antigo:', key)
              return caches.delete(key)
            }
          }),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Notifica todos os clientes abertos sobre a nova versão instalada
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION })
          })
        })
      }),
  )
})

// Permite que a página force a ativação via mensagem postMessage({ type: 'SKIP_WAITING' })
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // 1. NUNCA interceptar nem cachear requisições que não sejam GET
  if (req.method !== 'GET') {
    return
  }

  // 2. NUNCA interceptar chamadas de API de backend ou servidores de terceiros
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_/') ||
    url.hostname.includes('internal.goskip.dev') ||
    url.hostname.includes('goskip.dev') ||
    url.hostname.includes('usecurling.com') ||
    url.hostname.includes('127.0.0.1:8090')
  ) {
    return
  }

  // 3. Estratégia Network-first estrita para navegação HTML (document / App Shell)
  // Garante que o celular SEMPRE pegue o HTML mais novo com as tags corretas de scripts ao estar online
  if (
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy)
              cache.put('/index.html', copy.clone())
            })
          }
          return networkRes
        })
        .catch(async () => {
          // Fallback offline: responde com o HTML armazenado em cache
          const cache = await caches.open(CACHE_NAME)
          const cachedIndex = await cache.match('/index.html')
          return cachedIndex || (await cache.match('/'))
        }),
    )
    return
  }

  // 4. Recursos estáticos locais da mesma origem (JS, CSS, SVGs, fontes, imagens)
  if (url.origin === self.location.origin) {
    // Para bundles Vite com hash no nome (/assets/*-[hash].js ou .css),
    // podemos usar stale-while-revalidate ou network-first para garantir frescor
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
          }
          return networkRes
        })
        .catch(async () => {
          // Se offline ou rede falhou, tenta o cache
          const cached = await caches.match(req)
          if (cached) return cached
          // Se for rota de cliente em fallback, retorna o index.html
          if (req.destination === 'document') {
            const cache = await caches.open(CACHE_NAME)
            return cache.match('/index.html')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        }),
    )
  }
})
