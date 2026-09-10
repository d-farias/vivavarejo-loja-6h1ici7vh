import pb from '@/lib/pocketbase/client'

// Cache em memória do fileToken para evitar requisições repetidas ao endpoint de token
let cachedToken: string | null = null
let cachedTokenExpiresAt = 0

/**
 * Obtém ou reutiliza um token temporário de arquivo para acesso a campos de arquivo protegidos (protected: true).
 * Tokens do PocketBase têm validade padrão (ex: 120s ou 180s). Renovamos com margem de segurança.
 */
export async function getFileToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedTokenExpiresAt > now + 15_000) {
    return cachedToken
  }

  try {
    if (!pb.authStore.isValid) {
      return ''
    }
    const token = await pb.files.getToken()
    cachedToken = token
    // Validade de 100 segundos no cache
    cachedTokenExpiresAt = now + 100_000
    return token
  } catch (err) {
    console.warn('Erro ao obter token de arquivo protegido:', err)
    return ''
  }
}

/**
 * Constrói a URL autenticada de um arquivo protegido com `token` query param.
 */
export async function buildProtectedFileUrl(
  collectionIdOrName: string,
  recordId: string,
  filename: string,
  thumb?: string,
): Promise<string> {
  if (!filename) return ''

  const base = pb.baseURL || ''
  const token = await getFileToken()
  const params = new URLSearchParams()
  if (thumb) {
    params.set('thumb', thumb)
  }
  if (token) {
    params.set('token', token)
  }

  const queryStr = params.toString() ? `?${params.toString()}` : ''
  return `${base}/api/files/${collectionIdOrName}/${recordId}/${filename}${queryStr}`
}

/**
 * Constrói a URL síncrona usando o token já em cache se disponível, ou limpa se não logado.
 */
export function buildProtectedFileUrlSync(
  collectionIdOrName: string,
  recordId: string,
  filename: string,
  thumb?: string,
): string {
  if (!filename) return ''
  const base = pb.baseURL || ''
  const params = new URLSearchParams()
  if (thumb) {
    params.set('thumb', thumb)
  }
  if (cachedToken) {
    params.set('token', cachedToken)
  }
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  return `${base}/api/files/${collectionIdOrName}/${recordId}/${filename}${queryStr}`
}
