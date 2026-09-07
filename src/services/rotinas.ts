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

  async reordenarPrioridades(itens: { id: string; prioridade_dia: number }[]): Promise<void> {
    for (const item of itens) {
      try {
        await pb.collection('rotinas').update(item.id, {
          prioridade_dia: item.prioridade_dia,
        })
      } catch (err) {
        console.error('Erro ao salvar prioridade da rotina:', item.id, err)
      }
    }
  },

  async adiarRotina(
    id: string,
    params: {
      adiada_para_data?: string
      adiada_para_horario?: string
      observacoes?: string
    },
  ): Promise<Rotina> {
    return await pb.collection('rotinas').update<Rotina>(
      id,
      {
        adiada_para_data: params.adiada_para_data,
        adiada_para_horario: params.adiada_para_horario,
        observacoes: params.observacoes,
      },
      {
        expand: 'loja,funcao',
      },
    )
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
      expand: 'rotina,usuario,validado_por',
    })
  },

  async getExecutionsByDate(dateStr: string): Promise<ExecucaoRotina[]> {
    return await pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
      filter: `data_execucao >= "${dateStr} 00:00:00" && data_execucao <= "${dateStr} 23:59:59"`,
      expand: 'rotina,usuario,validado_por',
    })
  },

  async getExecutionsBetween(startDateStr: string, endDateStr: string): Promise<ExecucaoRotina[]> {
    return await pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
      filter: `data_execucao >= "${startDateStr} 00:00:00" && data_execucao <= "${endDateStr} 23:59:59"`,
      expand: 'rotina,usuario,validado_por',
    })
  },

  async toggleExecution(
    rotinaId: string,
    userId: string,
    currentlyDone: boolean,
    existingId?: string,
    dateStr = getTodayDateString(),
    fotoFile?: File | null,
  ): Promise<ExecucaoRotina> {
    if (existingId) {
      const willBeDone = !currentlyDone
      if (fotoFile) {
        const formData = new FormData()
        formData.append('concluida', String(willBeDone))
        formData.append('status_validacao', willBeDone ? 'aguardando_validacao' : '')
        formData.append('foto', fotoFile)
        return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(existingId, formData)
      }
      return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(existingId, {
        concluida: willBeDone,
        status_validacao: willBeDone ? 'aguardando_validacao' : undefined,
      })
    }

    // Try finding existing record for this date and routine
    try {
      const existing = await pb
        .collection('execucoes_rotinas')
        .getFirstListItem<ExecucaoRotina>(
          `usuario = "${userId}" && rotina = "${rotinaId}" && data_execucao >= "${dateStr} 00:00:00" && data_execucao <= "${dateStr} 23:59:59"`,
        )
      const willBeDone = !existing.concluida
      if (fotoFile) {
        const formData = new FormData()
        formData.append('concluida', String(willBeDone))
        formData.append('status_validacao', willBeDone ? 'aguardando_validacao' : '')
        formData.append('comentario_validacao', '')
        formData.append('foto', fotoFile)
        return await pb
          .collection('execucoes_rotinas')
          .update<ExecucaoRotina>(existing.id, formData)
      }
      return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(existing.id, {
        concluida: willBeDone,
        status_validacao: willBeDone ? 'aguardando_validacao' : undefined,
        comentario_validacao: willBeDone ? '' : undefined,
      })
    } catch {
      // Create new execution record
      if (fotoFile) {
        const formData = new FormData()
        formData.append('rotina', rotinaId)
        formData.append('usuario', userId)
        formData.append('data_execucao', `${dateStr} 12:00:00.000Z`)
        formData.append('concluida', 'true')
        formData.append('status_validacao', 'aguardando_validacao')
        formData.append('foto', fotoFile)
        return await pb.collection('execucoes_rotinas').create<ExecucaoRotina>(formData)
      }
      return await pb.collection('execucoes_rotinas').create<ExecucaoRotina>({
        rotina: rotinaId,
        usuario: userId,
        data_execucao: `${dateStr} 12:00:00.000Z`,
        concluida: true,
        status_validacao: 'aguardando_validacao',
      })
    }
  },

  async aprovarExecucao(execucaoId: string, validadorId: string): Promise<ExecucaoRotina> {
    return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(execucaoId, {
      status_validacao: 'aprovada',
      validado_por: validadorId,
      validado_em: new Date().toISOString(),
      concluida: true,
    })
  },

  async devolverExecucao(
    execucaoId: string,
    validadorId: string,
    comentario: string,
  ): Promise<ExecucaoRotina> {
    return await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(execucaoId, {
      status_validacao: 'devolvida',
      comentario_validacao: comentario,
      validado_por: validadorId,
      validado_em: new Date().toISOString(),
      concluida: false, // Ao devolver, volta como pendente para a rotina do dia
    })
  },

  async aprovarTodas(execucoesIds: string[], validadorId: string): Promise<void> {
    const validadoEm = new Date().toISOString()
    for (const id of execucoesIds) {
      try {
        await pb.collection('execucoes_rotinas').update(id, {
          status_validacao: 'aprovada',
          validado_por: validadorId,
          validado_em: validadoEm,
          concluida: true,
        })
      } catch (err) {
        console.error('Erro ao aprovar execução em lote:', id, err)
      }
    }
  },

  getFotoUrl(execucao: ExecucaoRotina, thumb?: string): string | null {
    if (!execucao.foto) return null
    return pb.files.getURL(execucao, execucao.foto, { thumb })
  },
}
