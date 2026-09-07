/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

// Registro do Service Worker do PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[VivaVarejo PWA] Service worker registrado:', reg.scope)
      })
      .catch((err) => {
        console.warn('[VivaVarejo PWA] Falha ao registrar service worker:', err)
      })
  })
}
