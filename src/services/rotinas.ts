import pb from '@/lib/pocketbase/client'
import type { Rotina, ExecucaoRotina } from '@/types'

export function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const rotinasService = {
  async getAll(lojaId?: string | null): Promise<Rotina[]> {
    let filter = ''
    if (lojaId && lojaId !== 'todas') {
      // Rotinas da loja específica OU rotinas sem loja (compatibilidade legada)
      filter = `loja = "${lojaId}" || loja = ""`
    }

    return await pb.collection('rotinas').getFullList<Rotina>({
      filter: filter || undefined,
      sort: 'horario_limite,nome',
      expand: 'loja,funcao',
    })
  },

  async getById(id: string): Promise<Rotina> {
    return await pb.collection('rotinas').getOne<Rotina>(id, {
      expand: 'loja,funcao',
    })
  },

  async create(data: Partial<Rotina>): Promise<Rotina> {
    return await pb.collection('rotinas').create<Rotina>(data, {
      expand: 'loja,funcao',
    })
  },

  async update(id: string, data: Partial<Rotina>): Promise<Rotina> {
    return await pb.collection('rotinas').update<Rotina>(id, data, {
      expand: 'loja,funcao',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('rotinas').delete(id)
  },

  async deleteAll(lojaId?: string | null): Promise<void> {
    let filter = ''
    if (lojaId && lojaId !== 'todas') {
      filter = `loja = "${lojaId}"`
    }
    const all = await pb.collection('rotinas').getFullList<{ id: string }>({
      filter: filter || undefined,
      fields: 'id',
    })
    for (const item of all) {
      try {
        await pb.collection('rotinas').delete(item.id)
      } catch (e) {
        console.error('Erro ao deletar rotina:', item.id, e)
      }
    }
  },
}

export const execucoesService = {
  async getTodayExecutions(
    userId: string,
    dateStr = getTodayDateString(),
  ): Promise<ExecucaoRotina[]> {
    if (!userId) return []
    return await pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
      filter: `usuario = "${userId}" && data_execucao >= "${dateStr} 00:00:00" && data_execucao <= "${dateStr} 23:59:59"`,
    })
  },

  async toggleExecution(
    rotinaId: string,
    userId: string,
    currentlyDone: boolean,
    existingId?: string,
    dateStr = getTodayDateString(),
  ): Promise<ExecucaoRotina> {
    if (existingId) {
      return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(existingId, {
        concluida: !currentlyDone,
      })
    }

    // Try finding existing record for this date and routine
    try {
      const existing = await pb
        .collection('execucoes_rotinas')
        .getFirstListItem<ExecucaoRotina>(
          `usuario = "${userId}" && rotina = "${rotinaId}" && data_execucao >= "${dateStr} 00:00:00" && data_execucao <= "${dateStr} 23:59:59"`,
        )
      return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(existing.id, {
        concluida: !existing.concluida,
      })
    } catch {
      // Create new execution record
      return await pb.collection('execucoes_rotinas').create<ExecucaoRotina>({
        rotina: rotinaId,
        usuario: userId,
        data_execucao: `${dateStr} 12:00:00.000Z`,
        concluida: true,
      })
    }
  },
}
