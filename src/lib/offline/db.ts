/**
 * VivaVarejo - Camada de Armazenamento Local e Fila Offline (IndexedDB)
 *
 * Permite que promotores e operadores de campo trabalhem 100% desconectados:
 * 1. Leitura: armazena rotinas, execuções do dia, visitas e rotinas de promotores.
 * 2. Escrita: enfileira execuções com foto (Blob), observações, check-in, check-out e conclusões.
 * 3. Preserva o horário real registrado pelo usuário no aparelho (offline_created_at).
 */

export interface CachedDataEntry<T = unknown> {
  key: string
  data: T
  updatedAt: number
}

export type QueueItemType =
  | 'execucao_rotina'
  | 'visita_checkin'
  | 'visita_checkout'
  | 'visita_conclusao'
  | 'tarefa_validade_execucao'

export interface QueueItem {
  id: string // UUID local
  type: QueueItemType
  createdAt: string // ISO timestamp exato do momento do registro no aparelho
  lojaId?: string
  userId?: string
  targetId: string // id da rotina ou id da visita
  payload: Record<string, unknown>
  // Blobs de imagens armazenados nativamente no IndexedDB
  fotoBlob?: Blob
  fotoFileName?: string
  fotoFieldName?: string
  // Outras fotos opcionais (ex: visita: foto_gondola, foto_abastecimento, foto_validades)
  extraFotos?: Array<{
    fieldName: string
    blob: Blob
    fileName: string
  }>
  // Controle de tentativas
  attempts: number
  lastError?: string
  status: 'pending' | 'syncing' | 'failed'
}

const DB_NAME = 'vivavarejo_offline_db'
const DB_VERSION = 1
const STORE_CACHE = 'daily_cache'
const STORE_QUEUE = 'sync_queue'

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      // Store 1: Cache de leitura (rotinas, execuções, visitas)
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' })
      }
      // Store 2: Fila de envio offline (fotos em Blob, status, timestamps reais)
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' })
        queueStore.createIndex('by_status', 'status', { unique: false })
        queueStore.createIndex('by_created', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

// ==========================================
// CACHE DE LEITURA (STORE_CACHE)
// ==========================================

export async function saveLocalCache<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite')
      const store = tx.objectStore(STORE_CACHE)
      const entry: CachedDataEntry<T> = {
        key,
        data,
        updatedAt: Date.now(),
      }
      const req = store.put(entry)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Erro ao salvar cache local:', key, err)
    // Fallback para sessionStorage caso IndexedDB falhe
    try {
      sessionStorage.setItem(`offline_${key}`, JSON.stringify(data))
    } catch {
      /* ignore */
    }
  }
}

export async function getLocalCache<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CACHE, 'readonly')
      const store = tx.objectStore(STORE_CACHE)
      const req = store.get(key)
      req.onsuccess = () => {
        const entry = req.result as CachedDataEntry<T> | undefined
        resolve(entry ? entry.data : null)
      }
      req.onerror = () => {
        // Fallback sessionStorage
        try {
          const item = sessionStorage.getItem(`offline_${key}`)
          resolve(item ? (JSON.parse(item) as T) : null)
        } catch {
          resolve(null)
        }
      }
    })
  } catch {
    try {
      const item = sessionStorage.getItem(`offline_${key}`)
      return item ? (JSON.parse(item) as T) : null
    } catch {
      return null
    }
  }
}

// ==========================================
// FILA DE SINCRONIZAÇÃO (STORE_QUEUE)
// ==========================================

export async function enqueueOfflineItem(
  item: Omit<QueueItem, 'id' | 'attempts' | 'status'>,
): Promise<QueueItem> {
  const db = await getDB()
  const fullItem: QueueItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    attempts: 0,
    status: 'pending',
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    const store = tx.objectStore(STORE_QUEUE)
    const req = store.add(fullItem)
    req.onsuccess = () => {
      dispatchQueueChangeEvent()
      resolve(fullItem)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getPendingQueue(): Promise<QueueItem[]> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly')
      const store = tx.objectStore(STORE_QUEUE)
      const req = store.getAll()
      req.onsuccess = () => {
        const all = (req.result as QueueItem[]) || []
        // Ordena estritamente pela data e hora de criação no celular (ordem cronológica real)
        all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        resolve(all)
      }
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Erro ao listar fila pendente:', err)
    return []
  }
}

export async function getQueueCount(): Promise<number> {
  try {
    const items = await getPendingQueue()
    return items.filter((i) => i.status !== 'syncing').length
  } catch {
    return 0
  }
}

export async function updateQueueItem(item: QueueItem): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    const store = tx.objectStore(STORE_QUEUE)
    const req = store.put(item)
    req.onsuccess = () => {
      dispatchQueueChangeEvent()
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    const store = tx.objectStore(STORE_QUEUE)
    const req = store.delete(id)
    req.onsuccess = () => {
      dispatchQueueChangeEvent()
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function clearAllQueue(): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    const store = tx.objectStore(STORE_QUEUE)
    const req = store.clear()
    req.onsuccess = () => {
      dispatchQueueChangeEvent()
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

// Disparo de evento customizado para reatividade em tempo real dos hooks React
export const EVENT_OFFLINE_QUEUE_CHANGED = 'vivavarejo:offline_queue_changed'
export const EVENT_OFFLINE_SYNC_COMPLETED = 'vivavarejo:offline_sync_completed'

export function dispatchQueueChangeEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_OFFLINE_QUEUE_CHANGED))
  }
}

export function dispatchSyncCompletedEvent(count: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_OFFLINE_SYNC_COMPLETED, { detail: { count } }))
  }
}
