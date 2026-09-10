import { useState, useEffect, useCallback } from 'react'
import {
  getQueueCount,
  getPendingQueue,
  QueueItem,
  EVENT_OFFLINE_QUEUE_CHANGED,
  EVENT_OFFLINE_SYNC_COMPLETED,
} from '@/lib/offline/db'
import { triggerQueueSync, setupAutoSync, SyncResult } from '@/lib/offline/syncEngine'

export interface OfflineStatusState {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSyncedAt: Date | null
  pendingItems: QueueItem[]
}

/**
 * Hook central para monitorar e controlar o estado de conectividade e a fila offline do VivaVarejo
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  })
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [pendingItems, setPendingItems] = useState<QueueItem[]>([])

  const refreshQueueState = useCallback(async () => {
    try {
      const items = await getPendingQueue()
      setPendingItems(items)
      const nonSyncing = items.filter((i) => i.status !== 'syncing').length
      setPendingCount(nonSyncing)
    } catch {
      /* ignore */
    }
  }, [])

  // Inicialização e listeners globais
  useEffect(() => {
    setupAutoSync()

    const handleOnline = () => {
      setIsOnline(true)
      refreshQueueState()
      triggerQueueSync().catch(() => {})
    }

    const handleOffline = () => {
      setIsOnline(false)
      refreshQueueState()
    }

    const handleQueueChanged = () => {
      refreshQueueState()
    }

    const handleSyncCompleted = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail && detail.count > 0) {
        setLastSyncedAt(new Date())
      }
      refreshQueueState()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(EVENT_OFFLINE_QUEUE_CHANGED, handleQueueChanged)
    window.addEventListener(EVENT_OFFLINE_SYNC_COMPLETED, handleSyncCompleted)

    refreshQueueState()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(EVENT_OFFLINE_QUEUE_CHANGED, handleQueueChanged)
      window.removeEventListener(EVENT_OFFLINE_SYNC_COMPLETED, handleSyncCompleted)
    }
  }, [refreshQueueState])

  const forcarSincronizacao = useCallback(async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      return { total: 0, synced: 0, failed: 0, errors: [] }
    }
    setIsSyncing(true)
    try {
      const res = await triggerQueueSync()
      if (res.synced > 0) {
        setLastSyncedAt(new Date())
      }
      await refreshQueueState()
      return res
    } finally {
      setIsSyncing(false)
    }
  }, [refreshQueueState])

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncedAt,
    pendingItems,
    forcarSincronizacao,
    refreshQueueState,
  }
}
