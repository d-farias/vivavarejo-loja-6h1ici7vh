/**
 * Motor de Sincronização em Fila VivaVarejo
 *
 * Regras mandatórias:
 * 1. Envio na ordem estrita de criação (ordem cronológica).
 * 2. Preservar o horário REAL do registro no aparelho (data_execucao / check_in / realizada_em).
 * 3. Tratar conflitos simples: registro já existente = pular / atualizar sem duplicar.
 * 4. Tolerância a falhas: se falhar, o item permanece na fila para tentar novamente.
 * 5. Notificação de conclusão e reatividade.
 */

import pb from '@/lib/pocketbase/client'
import {
  getPendingQueue,
  updateQueueItem,
  removeQueueItem,
  dispatchSyncCompletedEvent,
  QueueItem,
} from './db'
import type { ExecucaoRotina, VisitaPromotor } from '@/types'

let isSyncRunning = false

export interface SyncResult {
  total: number
  synced: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

/**
 * Converte um Blob de volta em File para envio no FormData do PocketBase
 */
function blobToFile(blob: Blob, fileName?: string): File {
  const name = fileName || `foto_${Date.now()}.jpg`
  const type = blob.type || 'image/jpeg'
  return new File([blob], name, { type, lastModified: Date.now() })
}

/**
 * Executa a sincronização de um item individual da fila
 */
async function processQueueItem(item: QueueItem): Promise<void> {
  const { type, payload, createdAt, fotoBlob, fotoFileName, fotoFieldName, extraFotos } = item

  switch (type) {
    case 'execucao_rotina': {
      const rotinaId = item.targetId
      const userId = item.userId
      const dataStr = (payload.data_execucao as string) || createdAt.split('T')[0]
      const observacao = (payload.observacao as string) || ''
      const conforme = payload.conforme !== false

      // Verifica se já existe execução para essa rotina e data
      let existingRecord: ExecucaoRotina | null = null
      try {
        if (userId) {
          existingRecord = await pb
            .collection('execucoes_rotinas')
            .getFirstListItem<ExecucaoRotina>(
              `usuario = "${userId}" && rotina = "${rotinaId}" && data_execucao >= "${dataStr} 00:00:00" && data_execucao <= "${dataStr} 23:59:59"`,
            )
        }
      } catch {
        existingRecord = null
      }

      // Preparação do envio com preservação do horário original do registro
      if (fotoBlob) {
        const formData = new FormData()
        formData.append('rotina', rotinaId)
        if (userId) formData.append('usuario', userId)
        // Preserva a data e hora REAL do registro no aparelho
        formData.append('data_execucao', createdAt)
        formData.append('concluida', 'true')
        formData.append('status_validacao', conforme ? 'aprovada' : 'aguardando_validacao')
        if (observacao) formData.append('observacao', observacao)
        if (payload.horario_planejado) {
          formData.append('horario_planejado', String(payload.horario_planejado))
        }

        const file = blobToFile(fotoBlob, fotoFileName)
        formData.append(fotoFieldName || 'foto', file)

        if (existingRecord) {
          // Atualiza registro existente (evita duplicidade)
          await pb.collection('execucoes_rotinas').update(existingRecord.id, formData)
        } else {
          // Cria novo registro
          await pb.collection('execucoes_rotinas').create(formData)
        }
      } else {
        // Envio sem foto
        const dataObj: Record<string, unknown> = {
          rotina: rotinaId,
          usuario: userId,
          data_execucao: createdAt,
          concluida: true,
          status_validacao: conforme ? 'aprovada' : 'aguardando_validacao',
          observacao: observacao || undefined,
          horario_planejado: payload.horario_planejado || undefined,
        }

        if (existingRecord) {
          await pb.collection('execucoes_rotinas').update(existingRecord.id, dataObj)
        } else {
          await pb.collection('execucoes_rotinas').create(dataObj)
        }
      }
      break
    }

    case 'visita_checkin': {
      const visitaId = item.targetId
      const horaStr = (payload.hora as string) || createdAt.slice(11, 16)

      // Busca estado da visita para evitar sobrescrever se já houve checkout posterior
      try {
        const v = await pb.collection('visitas_promotor').getOne<VisitaPromotor>(visitaId)
        // Se já tem check_in registrado no backend, mantém o mais antigo ou atualiza caso estivesse vazio
        if (!v.check_in) {
          await pb.collection('visitas_promotor').update(visitaId, {
            check_in: createdAt,
            observacoes: v.observacoes
              ? `${v.observacoes} | Check-in offline às ${horaStr}`
              : `Check-in offline às ${horaStr}`,
          })
        }
      } catch (err) {
        // Tenta update direto com createdAt real
        await pb.collection('visitas_promotor').update(visitaId, {
          check_in: createdAt,
        })
      }
      break
    }

    case 'visita_checkout': {
      const visitaId = item.targetId
      try {
        const v = await pb.collection('visitas_promotor').getOne<VisitaPromotor>(visitaId)
        let permanencia: number | undefined
        const entradaIso = v.check_in || (payload.check_in as string)
        if (entradaIso) {
          const entradaMs = new Date(entradaIso).getTime()
          const saidaMs = new Date(createdAt).getTime()
          const diff = Math.round((saidaMs - entradaMs) / (1000 * 60))
          if (diff > 0) permanencia = diff
        }

        await pb.collection('visitas_promotor').update(visitaId, {
          check_out: createdAt,
          tempo_permanencia_minutos: permanencia,
        })
      } catch {
        await pb.collection('visitas_promotor').update(visitaId, {
          check_out: createdAt,
        })
      }
      break
    }

    case 'visita_conclusao': {
      const visitaId = item.targetId
      // Cria FormData caso haja fotoBlob ou extraFotos
      if (fotoBlob || (extraFotos && extraFotos.length > 0)) {
        const formData = new FormData()
        formData.append('status', 'realizada')
        formData.append('realizada_em', createdAt) // Preserva o horário REAL da conclusão

        // Copia os campos do payload
        for (const [key, val] of Object.entries(payload)) {
          if (val !== undefined && val !== null) {
            formData.append(key, String(val))
          }
        }

        if (fotoBlob) {
          const file = blobToFile(fotoBlob, fotoFileName)
          formData.append(fotoFieldName || 'foto_trabalho', file)
        }

        if (extraFotos) {
          for (const extra of extraFotos) {
            const extraFile = blobToFile(extra.blob, extra.fileName)
            formData.append(extra.fieldName, extraFile)
          }
        }

        await pb.collection('visitas_promotor').update(visitaId, formData)
      } else {
        await pb.collection('visitas_promotor').update(visitaId, {
          status: 'realizada',
          realizada_em: createdAt,
          ...payload,
        })
      }
      break
    }

    case 'tarefa_validade_execucao': {
      const tarefaId = item.targetId
      if (fotoBlob) {
        const formData = new FormData()
        formData.append('status', 'aguardando_validacao')
        formData.append('concluida_em', createdAt)
        for (const [key, val] of Object.entries(payload)) {
          if (val !== undefined && val !== null) {
            formData.append(key, String(val))
          }
        }
        const file = blobToFile(fotoBlob, fotoFileName)
        formData.append('foto', file)
        await pb.collection('tarefas_validade').update(tarefaId, formData)
      } else {
        await pb.collection('tarefas_validade').update(tarefaId, {
          status: 'aguardando_validacao',
          concluida_em: createdAt,
          ...payload,
        })
      }
      break
    }

    default:
      console.warn('[SyncEngine] Tipo de item de fila não reconhecido:', type)
  }
}

/**
 * Dispara o processamento sequencial da fila offline
 */
export async function triggerQueueSync(): Promise<SyncResult> {
  if (isSyncRunning) {
    return { total: 0, synced: 0, failed: 0, errors: [] }
  }

  // Verifica se o navegador está online antes de começar
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { total: 0, synced: 0, failed: 0, errors: [] }
  }

  isSyncRunning = true
  let synced = 0
  let failed = 0
  const errors: Array<{ id: string; error: string }> = []

  try {
    const queue = await getPendingQueue()
    const total = queue.length

    if (total === 0) {
      isSyncRunning = false
      return { total: 0, synced: 0, failed: 0, errors: [] }
    }

    console.log(`[SyncEngine] Iniciando sincronização de ${total} item(ns) pendente(s)...`)

    for (const item of queue) {
      // Marca status como syncing
      item.status = 'syncing'
      await updateQueueItem(item)

      try {
        await processQueueItem(item)
        // Sucesso: remove o item da fila (nada se perde antes disso)
        await removeQueueItem(item.id)
        synced++
        console.log(`[SyncEngine] Item ${item.id} (${item.type}) sincronizado com sucesso.`)
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`[SyncEngine] Falha ao sincronizar item ${item.id}:`, errorMsg)

        // Se for erro permanente de registro apagado (404), descarta defensivamente
        const is404 = errorMsg.includes('404') || errorMsg.includes('not found')
        if (is404 && item.attempts >= 3) {
          console.warn(
            `[SyncEngine] Registro ${item.targetId} não existe mais no servidor. Removendo da fila.`,
          )
          await removeQueueItem(item.id)
        } else {
          // Permanece na fila para nova tentativa
          item.status = 'failed'
          item.attempts += 1
          item.lastError = errorMsg
          await updateQueueItem(item)
          failed++
          errors.push({ id: item.id, error: errorMsg })
        }
      }
    }

    if (synced > 0) {
      dispatchSyncCompletedEvent(synced)
    }

    return { total, synced, failed, errors }
  } finally {
    isSyncRunning = false
  }
}

/**
 * Inicializador automático do motor de sincronização:
 * - Ouve eventos 'online' do window
 * - Ouve eventos de visibilidade da página
 * - Checa a cada 30 segundos se houver itens pendentes e conexão
 */
let autoSyncSetupDone = false

export function setupAutoSync(): void {
  if (autoSyncSetupDone || typeof window === 'undefined') return
  autoSyncSetupDone = true

  // Ao reconectar na internet
  window.addEventListener('online', () => {
    console.log('[SyncEngine] Conexão detectada. Disparando sincronização automática...')
    triggerQueueSync().catch(() => {})
  })

  // Ao trazer o app de volta para o primeiro plano no celular
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      triggerQueueSync().catch(() => {})
    }
  })

  // Intervalo periódico em segundo plano (a cada 25 segundos)
  setInterval(() => {
    if (navigator.onLine && !isSyncRunning) {
      triggerQueueSync().catch(() => {})
    }
  }, 25000)

  // Primeira tentativa na carga da página
  if (navigator.onLine) {
    setTimeout(() => {
      triggerQueueSync().catch(() => {})
    }, 2000)
  }
}
