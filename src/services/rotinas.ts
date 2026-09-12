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
  async getAll(lojaId?: string | null, options?: { apenasAtivas?: boolean }): Promise<Rotina[]> {
    const filters: string[] = []
    if (lojaId && lojaId !== 'todas') {
      filters.push(`(loja = "${lojaId}" || loja = "")`)
    }
    if (options?.apenasAtivas) {
      filters.push(`ativo = true`)
    }

    const filter = filters.length > 0 ? filters.join(' && ') : ''

    const list = await pb.collection('rotinas').getFullList<Rotina>({
      filter: filter || undefined,
      sort: 'horario_limite,nome',
      expand: 'loja,funcao,funcao.chefe_imediato_funcao',
    })

    // Deduplicação defensiva na camada de dados: garante que nunca retorne registros duplicados
    const seen = new Set<string>()
    return list.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  },

  async getById(id: string): Promise<Rotina> {
    return await pb.collection('rotinas').getOne<Rotina>(id, {
      expand: 'loja,funcao',
    })
  },

  /**
   * Cria ou atualiza (upsert) rotina com base na assinatura única:
   * (loja + nome + horario_limite + responsavel + area)
   * Evita duplicar tarefas mesmo em chamadas repetidas ou concorrência.
   */
  async create(data: Partial<Rotina>, options?: { allowDuplicate?: boolean }): Promise<Rotina> {
    const nomeNorm = (data.nome || '').trim()
    const lojaId = data.loja || ''
    const horarioNorm = (data.horario_limite || '').trim()
    const respNorm = (data.responsavel || '').trim()
    const areaNorm = (data.area || '').trim()

    if (!options?.allowDuplicate && nomeNorm) {
      try {
        // Buscar rotinas existentes na loja para verificar assinatura
        const lojaFilter = lojaId ? `loja = "${lojaId}"` : 'loja = "" || loja = null'
        const existingList = await pb.collection('rotinas').getFullList<Rotina>({
          filter: lojaFilter,
          fields: 'id,nome,horario_limite,responsavel,area',
        })

        const buildSig = (n?: string, h?: string, r?: string, a?: string) =>
          `${(n || '').trim().toLowerCase()}:::${(h || '').trim().toLowerCase()}:::${(r || '').trim().toLowerCase()}:::${(a || '').trim().toLowerCase()}`

        const targetSig = buildSig(nomeNorm, horarioNorm, respNorm, areaNorm)
        const match = existingList.find(
          (ex) => buildSig(ex.nome, ex.horario_limite, ex.responsavel, ex.area) === targetSig,
        )

        if (match) {
          // Atualiza registro existente (upsert) em vez de criar duplicata cega
          return await pb.collection('rotinas').update<Rotina>(match.id, data, {
            expand: 'loja,funcao',
          })
        }
      } catch (err) {
        console.warn('Erro ao verificar duplicidade de rotina antes de criar:', err)
      }
    }

    return await pb.collection('rotinas').create<Rotina>(data, {
      expand: 'loja,funcao,funcao.chefe_imediato_funcao',
    })
  },

  async update(id: string, data: Partial<Rotina>): Promise<Rotina> {
    return await pb.collection('rotinas').update<Rotina>(id, data, {
      expand: 'loja,funcao,funcao.chefe_imediato_funcao',
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
  /**
   * Helper para verificar se um registro pertence ao dia local (YYYY-MM-DD)
   * comparando tanto data_execucao quanto created em UTC e fuso local.
   */
  matchesDate(targetDateStr: string, dateField?: string, createdField?: string): boolean {
    const target = targetDateStr.slice(0, 10)
    if (!target) return false

    // 1. Verificação direta por string prefix/substring
    if (dateField && dateField.slice(0, 10) === target) return true
    if (createdField && createdField.slice(0, 10) === target) return true

    // 2. Verificação convertendo para data local (evita que UTC meia-noite mude de dia no Brasil UTC-3)
    if (dateField) {
      try {
        const d = new Date(dateField)
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          if (`${y}-${m}-${day}` === target) return true
        }
      } catch {
        /* ignore */
      }
    }

    if (createdField) {
      try {
        const d = new Date(createdField)
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          if (`${y}-${m}-${day}` === target) return true
        }
      } catch {
        /* ignore */
      }
    }

    return false
  },

  async getTodayExecutions(
    userId: string,
    dateStr = getTodayDateString(),
  ): Promise<ExecucaoRotina[]> {
    if (!userId) return []
    const cleanDate = dateStr.slice(0, 10)
    // Busca janela ampla (+/- 1 dia em UTC) para não perder execuções com offset de fuso local
    const targetD = new Date(cleanDate + 'T12:00:00')
    const prevD = new Date(targetD)
    prevD.setDate(prevD.getDate() - 1)
    const nextD = new Date(targetD)
    nextD.setDate(nextD.getDate() + 1)
    const prevStr = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${String(prevD.getDate()).padStart(2, '0')}`
    const nextStr = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`

    const list = await pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
      filter: `usuario = "${userId}" && (data_execucao >= "${prevStr} 00:00:00" && data_execucao <= "${nextStr} 23:59:59" || created >= "${prevStr} 00:00:00" && created <= "${nextStr} 23:59:59")`,
      expand: 'rotina,usuario,validado_por',
      sort: '-created',
    })

    return list.filter((ex) => this.matchesDate(cleanDate, ex.data_execucao, ex.created))
  },

  async getExecutionsByDate(dateStr: string): Promise<ExecucaoRotina[]> {
    const cleanDate = dateStr.slice(0, 10)
    // Janela de segurança de +/- 1 dia no backend para cobrir fusos UTC vs local (ex: UTC-3 Brasil)
    const targetD = new Date(cleanDate + 'T12:00:00')
    const prevD = new Date(targetD)
    prevD.setDate(prevD.getDate() - 1)
    const nextD = new Date(targetD)
    nextD.setDate(nextD.getDate() + 1)
    const prevStr = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${String(prevD.getDate()).padStart(2, '0')}`
    const nextStr = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`

    const list = await pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
      filter: `(data_execucao >= "${prevStr} 00:00:00" && data_execucao <= "${nextStr} 23:59:59") || (created >= "${prevStr} 00:00:00" && created <= "${nextStr} 23:59:59")`,
      expand: 'rotina,usuario,validado_por',
      sort: '-created',
    })

    return list.filter((ex) => this.matchesDate(cleanDate, ex.data_execucao, ex.created))
  },

  async getExecutionsBetween(startDateStr: string, endDateStr: string): Promise<ExecucaoRotina[]> {
    const cleanStart = startDateStr.slice(0, 10)
    const cleanEnd = endDateStr.slice(0, 10)
    return await pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
      filter: `(data_execucao >= "${cleanStart} 00:00:00" && data_execucao <= "${cleanEnd} 23:59:59") || (created >= "${cleanStart} 00:00:00" && created <= "${cleanEnd} 23:59:59")`,
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
    const updated = await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(execucaoId, {
      status_validacao: 'aprovada',
      validado_por: validadorId,
      validado_em: new Date().toISOString(),
      concluida: true,
    })
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'validacao',
        modulo: 'execucoes',
        registro_id: execucaoId,
        detalhes: 'Execução de rotina validada e aprovada pelo líder',
      })
    } catch {
      /* intentionally ignored */
    }
    return updated
  },

  async devolverExecucao(
    execucaoId: string,
    validadorId: string,
    comentario: string,
  ): Promise<ExecucaoRotina> {
    const updated = await pb.collection('execucoes_rotinas').update<ExecucaoRotina>(execucaoId, {
      status_validacao: 'devolvida',
      comentario_validacao: comentario,
      validado_por: validadorId,
      validado_em: new Date().toISOString(),
      concluida: false, // Ao devolver, volta como pendente para a rotina do dia
    })
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'validacao',
        modulo: 'execucoes',
        registro_id: execucaoId,
        detalhes: `Execução de rotina devolvida para correção: "${comentario}"`,
      })
    } catch {
      /* intentionally ignored */
    }
    return updated
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

  async getProtectedFotoUrl(execucao: ExecucaoRotina, thumb?: string): Promise<string | null> {
    if (!execucao.foto) return null
    try {
      const token = await pb.files.getToken()
      return pb.files.getURL(execucao, execucao.foto, { thumb, token })
    } catch (_) {
      return pb.files.getURL(execucao, execucao.foto, { thumb })
    }
  },
}
