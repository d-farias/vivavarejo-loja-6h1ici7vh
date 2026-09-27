/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// Redirecionamento de fallback em produção para domínio canônico oficial:
// Redireciona EXATAMENTE os hostnames 'vivavarejo.goskip.app' e 'guia-para-lideres-do-varejo-921a5.goskip.app'
// para https://www.vivavarejo.com preservando pathname, search (incluindo utm_*) e hash.
// Defensivo: nunca redireciona 'www.vivavarejo.com' nem outros subdomínios goskip (não quebra previews de desenvolvimento).
if (typeof window !== 'undefined' && window.location) {
  const currentHostname = window.location.hostname.toLowerCase()
  const TARGET_REDIRECT_HOSTS = [
    'vivavarejo.goskip.app',
    'guia-para-lideres-do-varejo-921a5.goskip.app',
  ]

  if (TARGET_REDIRECT_HOSTS.includes(currentHostname)) {
    const destination = `https://www.vivavarejo.com${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.replace(destination)
  }
}

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

// Registro do Service Worker do PWA com atualização automática e imediata no celular
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let isRefreshing = false

  // Ao detectar mudança de controller (novo SW ativado assumiu a página), recarrega 1 vez para servir o bundle mais novo
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true
      console.log('[VivaVarejo PWA] Novo service worker assumiu o controle. Recarregando página...')
      window.location.reload()
    }
  })

  // Mensagem direta do SW ativado (SW_UPDATED)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED' && !isRefreshing) {
      isRefreshing = true
      console.log('[VivaVarejo PWA] Notificação de nova versão recebida do SW. Recarregando...')
      window.location.reload()
    }
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        console.log('[VivaVarejo PWA] Service worker registrado:', reg.scope)

        // Força checagem de nova versão do sw.js imediatamente ao carregar
        reg.update().catch((err) => {
          console.warn('[VivaVarejo PWA] Não foi possível verificar atualização do SW:', err)
        })

        // Se houver um worker esperando para ativar (waiting), envia mensagem para pular espera
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        // Se um novo worker for detectado instalando, monitora seu estado
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Nova versão instalada e pronta: manda pular espera
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              }
            })
          }
        })
      })
      .catch((err) => {
        console.warn('[VivaVarejo PWA] Falha ao registrar service worker:', err)
      })
  })

  // Quando o usuário volta ao app no celular (minimizado / background -> foreground), checa atualizações
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().catch(() => {})
        }
      })
    }
  })
}
