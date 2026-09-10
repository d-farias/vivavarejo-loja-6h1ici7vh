import pb from '@/lib/pocketbase/client'
import type { TarefaValidade, StatusTarefaValidade } from '@/types'

export interface CreateTarefaValidadeData {
  loja?: string
  setor_categoria: string
  descricao?: string
  semana_mes?: number
  data_especifica?: string
  recorrencia?: string
  horario_inicio: string
  horario_fim?: string
  status?: StatusTarefaValidade
  executor_nome?: string
  executor_usuario?: string
  validador_funcao_nome?: string
  validador_funcao?: string
  validador_usuario?: string
  telefone_responsavel?: string
  telefone_chefe?: string
  observacoes?: string
}

export interface ParsedValidadeRow {
  dataOuRecorrencia?: string
  data_especifica?: string
  recorrencia?: string
  semana_mes?: number // 1, 2, 3, 4
  semana_rotulo?: string // "Primeira Semana", "Segunda Semana", etc.
  dia_semana?: string // "Segunda-feira", "Terça-feira", etc.
  setor_categoria: string
  descricao?: string
  horario_inicio: string
  horario_fim?: string
  loja_nome_ou_codigo?: string
  loja_id?: string
  validador_funcao_nome?: string
  executor_nome?: string
  observacoes?: string
}

export const tarefasValidadeService = {
  /**
   * Lista todas as tarefas de validade cadastradas, com filtro opcional por loja
   */
  async getAll(lojaId?: string | null): Promise<TarefaValidade[]> {
    let filter = ''
    if (lojaId && lojaId !== 'todas') {
      filter = `loja = "${lojaId}" || loja = ""`
    }

    const list = await pb.collection('tarefas_validade').getFullList<TarefaValidade>({
      filter: filter || undefined,
      sort: 'horario_inicio,setor_categoria',
      expand: 'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
    })

    // Deduplicação defensiva por ID
    const seen = new Set<string>()
    return list.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  },

  async getById(id: string): Promise<TarefaValidade> {
    return await pb.collection('tarefas_validade').getOne<TarefaValidade>(id, {
      expand: 'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
    })
  },

  /**
   * Cria ou atualiza (upsert) tarefa de validade com verificação por assinatura
   * (tarefa/descrição + semana do mês + dia da semana/recorrência + loja + setor) para não duplicar.
   */
  async create(data: CreateTarefaValidadeData): Promise<TarefaValidade> {
    const lojaId = data.loja || ''
    const desc = (data.descricao || '').trim().toLowerCase()
    const semMes = data.semana_mes || 0
    const setor = (data.setor_categoria || '').trim().toLowerCase()
    const inicio = (data.horario_inicio || '').trim().toLowerCase()
    const dataEsp = (data.data_especifica || '').trim()
    const rec = (data.recorrencia || '').trim().toLowerCase()

    try {
      const lojaFilter = lojaId ? `loja = "${lojaId}"` : 'loja = "" || loja = null'
      const existing = await pb.collection('tarefas_validade').getFullList<TarefaValidade>({
        filter: lojaFilter,
        fields:
          'id,setor_categoria,descricao,horario_inicio,data_especifica,recorrencia,semana_mes',
      })

      const match = existing.find((ex) => {
        const exSemMes = ex.semana_mes || 0
        const exSetor = (ex.setor_categoria || '').trim().toLowerCase()
        const exDesc = (ex.descricao || '').trim().toLowerCase()
        const exData = (ex.data_especifica || '').trim().substring(0, 10)
        const exRec = (ex.recorrencia || '').trim().toLowerCase()

        // 1. Assinatura forte com semana do mês:
        // Tarefa + Semana do mês + Dia da semana (recorrência) + Loja
        if (semMes > 0 && exSemMes > 0) {
          if (exSemMes === semMes && exRec === rec) {
            // Se tiver descrição igual ou setor correspondente
            if (desc && exDesc && desc === exDesc) return true
            if (exSetor === setor) return true
          }
        }

        // 2. Assinatura tradicional por setor + horário + dia/recorrência
        const exInicio = (ex.horario_inicio || '').trim().toLowerCase()
        if (exSetor === setor && exInicio === inicio && exSemMes === semMes) {
          if (dataEsp && exData === dataEsp) return true
          if (rec && exRec === rec) return true
          if (!dataEsp && !rec && !exData && !exRec) return true
        }

        return false
      })

      if (match) {
        // Atualiza a existente (upsert) em vez de criar duplicata cega
        return await pb.collection('tarefas_validade').update<TarefaValidade>(match.id, data, {
          expand:
            'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
        })
      }
    } catch (err) {
      console.warn('Erro ao verificar duplicidade de tarefa de validade:', err)
    }

    return await pb.collection('tarefas_validade').create<TarefaValidade>(
      {
        ...data,
        status: data.status || 'pendente',
      },
      {
        expand:
          'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
      },
    )
  },

  async update(id: string, data: Partial<TarefaValidade>): Promise<TarefaValidade> {
    return await pb.collection('tarefas_validade').update<TarefaValidade>(id, data, {
      expand: 'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('tarefas_validade').delete(id)
  },

  /**
   * Conclui uma tarefa de validade com registro de como foi realizada (observação + foto de prova)
   * Envia diretamente para o status "aguardando_validacao" para o Líder Prevenção / Validador.
   */
  async concluirComProva(
    id: string,
    params: {
      userId: string
      observacao: string
      fotoFile?: File | null
    },
  ): Promise<TarefaValidade> {
    const concluidaEm = new Date().toISOString()
    let rec: TarefaValidade

    if (params.fotoFile) {
      const formData = new FormData()
      formData.append('status', 'aguardando_validacao')
      formData.append('observacao_execucao', params.observacao || '')
      formData.append('concluida_por', params.userId)
      formData.append('concluida_em', concluidaEm)
      formData.append('foto', params.fotoFile)
      rec = await pb.collection('tarefas_validade').update<TarefaValidade>(id, formData, {
        expand:
          'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
      })
    } else {
      rec = await pb.collection('tarefas_validade').update<TarefaValidade>(
        id,
        {
          status: 'aguardando_validacao',
          observacao_execucao: params.observacao || '',
          concluida_por: params.userId,
          concluida_em: concluidaEm,
        },
        {
          expand:
            'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
        },
      )
    }

    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'conclusao',
        modulo: 'validades',
        lojaId: rec.loja,
        registro_id: id,
        detalhes: `Auditoria de validade enviada para validação: ${rec.setor_categoria || rec.descricao}`,
      })
    } catch {
      /* intentionally ignored */
    }

    return rec
  },

  /**
   * Validação pelo Líder Prevenção: Aprovar tarefa
   */
  async aprovarTarefa(id: string, validadorId: string): Promise<TarefaValidade> {
    const rec = await pb.collection('tarefas_validade').update<TarefaValidade>(
      id,
      {
        status: 'aprovada',
        validado_por: validadorId,
        validado_em: new Date().toISOString(),
      },
      {
        expand:
          'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
      },
    )

    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'validacao',
        modulo: 'validades',
        lojaId: rec.loja,
        registro_id: id,
        detalhes: `Tarefa de validade aprovada pelo líder: ${rec.setor_categoria || rec.descricao}`,
      })
    } catch {
      /* intentionally ignored */
    }

    return rec
  },

  /**
   * Validação pelo Líder Prevenção: Devolver tarefa com comentário de correção
   */
  async devolverTarefa(
    id: string,
    validadorId: string,
    comentario: string,
  ): Promise<TarefaValidade> {
    const rec = await pb.collection('tarefas_validade').update<TarefaValidade>(
      id,
      {
        status: 'devolvida',
        comentario_validacao: comentario,
        validado_por: validadorId,
        validado_em: new Date().toISOString(),
      },
      {
        expand:
          'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
      },
    )

    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'validacao',
        modulo: 'validades',
        lojaId: rec.loja,
        registro_id: id,
        detalhes: `Tarefa de validade devolvida com observação: "${comentario}"`,
      })
    } catch {
      /* intentionally ignored */
    }

    return rec
  },

  /**
   * Reabrir / Iniciar tarefa (status -> em_andamento)
   */
  async iniciarTarefa(id: string): Promise<TarefaValidade> {
    return await pb.collection('tarefas_validade').update<TarefaValidade>(
      id,
      {
        status: 'em_andamento',
      },
      {
        expand:
          'loja,executor_usuario,validador_funcao,validador_usuario,concluida_por,validado_por',
      },
    )
  },

  /**
   * Importação em lote a partir de planilha processada
   */
  async importarCronograma(
    itens: ParsedValidadeRow[],
    defaultLojaId?: string,
    onProgress?: (msg: string) => void,
  ): Promise<{ inseridos: number; atualizados: number }> {
    let inseridos = 0
    let atualizados = 0

    // Carregar tarefas existentes para aplicar upsert inteligente
    const lojaFilter = defaultLojaId ? `loja = "${defaultLojaId}"` : undefined
    const existentes = await pb.collection('tarefas_validade').getFullList<TarefaValidade>({
      filter: lojaFilter,
      fields:
        'id,setor_categoria,descricao,horario_inicio,data_especifica,recorrencia,loja,semana_mes',
    })

    // Assinatura anti-duplicação solicitada:
    // tarefa + semana do mês + dia da semana/recorrência + loja
    const buildKey = (
      loja: string | undefined,
      tarefaDesc: string,
      semanaMes: number | undefined,
      diaOuRec: string,
      setor: string,
    ) => {
      const cleanLoja = (loja || '').trim().toLowerCase()
      const cleanDesc = (tarefaDesc || '').trim().toLowerCase()
      const cleanSem = semanaMes ? String(semanaMes) : '0'
      const cleanDia = (diaOuRec || '').trim().toLowerCase()
      const cleanSetor = (setor || '').trim().toLowerCase()
      // Chave composta com fallback de setor
      return `${cleanLoja}:::${cleanDesc}:::sem${cleanSem}:::${cleanDia}:::${cleanSetor}`
    }

    const mapExistentes = new Map<string, string>() // key -> id
    for (const ex of existentes) {
      const dataStr = (ex.data_especifica || '').substring(0, 10)
      const recStr = ex.recorrencia || ''
      const key = buildKey(
        ex.loja,
        ex.descricao || '',
        ex.semana_mes,
        dataStr || recStr,
        ex.setor_categoria,
      )
      mapExistentes.set(key, ex.id)
    }

    for (let i = 0; i < itens.length; i++) {
      const it = itens[i]
      onProgress?.(`Importando linha ${i + 1} de ${itens.length}: ${it.setor_categoria}...`)

      const lojaId = it.loja_id || defaultLojaId || undefined
      const dataEsp = it.data_especifica || undefined
      const rec = it.recorrencia || (dataEsp ? undefined : 'diaria')
      const dataOuRec = dataEsp || rec || ''

      const key = buildKey(lojaId, it.descricao || '', it.semana_mes, dataOuRec, it.setor_categoria)
      let existingId = mapExistentes.get(key)

      // Fallback: se não achar com setor idêntico, tenta sem setor para o caso de ter mudado o texto do setor na mesma semana/dia
      if (!existingId && it.semana_mes) {
        for (const [mKey, mId] of mapExistentes.entries()) {
          const prefix = `${(lojaId || '').trim().toLowerCase()}:::${(it.descricao || '').trim().toLowerCase()}:::sem${it.semana_mes}:::${dataOuRec.trim().toLowerCase()}:::`
          if (mKey.startsWith(prefix)) {
            existingId = mId
            break
          }
        }
      }

      const payload = {
        loja: lojaId,
        setor_categoria: it.setor_categoria,
        descricao: it.descricao || '',
        semana_mes: it.semana_mes || undefined,
        data_especifica: dataEsp,
        recorrencia: rec,
        horario_inicio: it.horario_inicio,
        horario_fim: it.horario_fim || '',
        executor_nome: it.executor_nome || '',
        validador_funcao_nome: it.validador_funcao_nome || 'Gerente',
        observacoes: it.observacoes || '',
      }

      if (existingId) {
        await pb.collection('tarefas_validade').update(existingId, payload)
        atualizados++
      } else {
        const created = await pb.collection('tarefas_validade').create({
          ...payload,
          status: 'pendente',
        })
        mapExistentes.set(key, created.id)
        inseridos++
      }
    }

    return { inseridos, atualizados }
  },

  getFotoUrl(tarefa: TarefaValidade, thumb?: string): string | null {
    if (!tarefa.foto) return null
    return pb.files.getURL(tarefa, tarefa.foto, { thumb })
  },

  async getProtectedFotoUrl(tarefa: TarefaValidade, thumb?: string): Promise<string | null> {
    if (!tarefa.foto) return null
    try {
      const { getFileToken } = await import('@/lib/pocketbase/files')
      const token = await getFileToken()
      if (token) {
        return pb.files.getURL(tarefa, tarefa.foto, { thumb, token })
      }
      return pb.files.getURL(tarefa, tarefa.foto, { thumb })
    } catch (_) {
      return pb.files.getURL(tarefa, tarefa.foto, { thumb })
    }
  },
}
