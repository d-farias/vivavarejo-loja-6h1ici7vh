/**
 * Utilitários para compartilhamento com a marca oficial VivaVarejo.
 *
 * Garante que em TODOS os pontos de compartilhamento (WhatsApp, Copiar link,
 * Web Share API, etc.), a URL gerada seja SEMPRE a oficial canônica de produção:
 * https://vivavarejo.goskip.app
 *
 * NUNCA vaza URLs de preview (ex. guia-para-lideres-do-varejo-...--preview.goskip.app),
 * domínios de desenvolvimento ou localhost.
 */

export const PRODUCTION_CANONICAL_ORIGIN = 'https://www.vivavarejo.com'
export const BRAND_NAME = 'VivaVarejo'
export const BRAND_TAGLINE = 'Da informação à execução no chão de loja.'

/**
 * Retorna a URL canônica para compartilhamento público.
 *
 * @param pathOrUrl - Caminho relativo (ex.: '/admin', '/bem-vindo') ou URL completa.
 *                    Se omitido, utiliza a rota atual (pathname + search + hash).
 */
export function getCanonicalShareUrl(pathOrUrl?: string): string {
  let targetPath = ''

  if (pathOrUrl) {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      try {
        const parsed = new URL(pathOrUrl)
        targetPath = parsed.pathname + parsed.search + parsed.hash
      } catch {
        targetPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
      }
    } else {
      targetPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
    }
  } else if (typeof window !== 'undefined') {
    targetPath = window.location.pathname + window.location.search + window.location.hash
  }

  // Normaliza caminhos vazios ou raiz
  if (!targetPath || targetPath === '/') {
    return PRODUCTION_CANONICAL_ORIGIN
  }

  // Garante barra inicial
  if (!targetPath.startsWith('/')) {
    targetPath = `/${targetPath}`
  }

  return `${PRODUCTION_CANONICAL_ORIGIN}${targetPath}`
}

/**
 * Utilitário para acionar navigator.share de forma padronizada VivaVarejo,
 * com fallback para cópia de link via clipboard.
 */
export interface ShareVivaVarejoOptions {
  title?: string
  text?: string
  pathOrUrl?: string
  onCopied?: () => void
  onError?: (err: unknown) => void
}

export async function shareVivaVarejo(
  options: ShareVivaVarejoOptions = {},
): Promise<'shared' | 'copied' | 'aborted' | 'failed'> {
  const url = getCanonicalShareUrl(options.pathOrUrl)
  const title = options.title ? `${options.title} — ${BRAND_NAME}` : BRAND_NAME
  const text = options.text || BRAND_TAGLINE

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url,
      })
      return 'shared'
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return 'aborted'
      }
      // Outros erros: fallback para cópia
    }
  }

  // Fallback: cópia para a área de transferência
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      options.onCopied?.()
      return 'copied'
    }
    throw new Error('Clipboard não suportado')
  } catch (err) {
    options.onError?.(err)
    return 'failed'
  }
}
