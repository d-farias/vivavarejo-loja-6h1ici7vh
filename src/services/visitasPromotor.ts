import pb from '@/lib/pocketbase/client'
import type { VisitaPromotor, RotinaPromotor } from '@/types'

/**
 * Determina se uma visita com status 'agendada' está efetivamente atrasada.
 * Regra: se a data da visita foi em dia anterior, ou hoje e o horário previsto já passou.
 */
export function isVisitaAtrasada(visita: VisitaPromotor): boolean {
  if (visita.status === 'realizada' || visita.status === 'cancelada') {
    return false
  }
  if (visita.status === 'atrasada') {
    return true
  }

  // Se continua 'agendada', checa data e hora
  if (!visita.data_visita) return false

  // visita.data_visita pode ser "2026-09-06" ou "2026-09-06 00:00:00.000Z"
  const dateStr = visita.data_visita.substring(0, 10)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (dateStr < todayStr) {
    return true
  }

  if (dateStr === todayStr && visita.hora_prevista) {
    const [h, m] = visita.hora_prevista.split(':').map((v) => parseInt(v, 10))
    if (!isNaN(h) && !isNaN(m)) {
      const scheduledMinutes = h * 60 + m
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (currentMinutes > scheduledMinutes) {
        return true
      }
    }
  }

  return false
}

export const visitasPromotorService = {
  async getAll(lojaId?: string): Promise<VisitaPromotor[]> {
    const options: Record<string, any> = {
      sort: '-data_visita,-created',
      expand: 'promotor,promotor.fornecedor,loja,registrado_por',
    }
    if (lojaId) {
      options.filter = `loja = "${lojaId}"`
    }
    return await pb.collection('visitas_promotor').getFullList<VisitaPromotor>(options)
  },

  async getById(id: string): Promise<VisitaPromotor> {
    return await pb.collection('visitas_promotor').getOne<VisitaPromotor>(id, {
      expand: 'promotor,promotor.fornecedor,loja,registrado_por',
    })
  },

  async create(data: Partial<VisitaPromotor> | FormData): Promise<VisitaPromotor> {
    return await pb.collection('visitas_promotor').create<VisitaPromotor>(data, {
      expand: 'promotor,promotor.fornecedor,loja',
    })
  },

  async update(id: string, data: Partial<VisitaPromotor> | FormData): Promise<VisitaPromotor> {
    return await pb.collection('visitas_promotor').update<VisitaPromotor>(id, data, {
      expand: 'promotor,promotor.fornecedor,loja',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('visitas_promotor').delete(id)
  },

  async registrarConclusao(
    id: string,
    params:
      | FormData
      | {
          conclusao_check: string
          rotinas_executadas?: string
          registrado_por?: string
          checklist_abastecimento_100?: boolean
          checklist_validades_ok?: boolean
          checklist_layout_conforme?: boolean
          quantidade_sortimento?: number
          perc_vendas?: number
          qtd_rupturas?: number
          itens_sem_vendas?: number
          responsavel_execucao?: string
          validador_fiscalizacao?: string
          status_fiscalizacao?: 'pendente' | 'aprovada' | 'devolvida'
          foto_trabalho?: string
          foto_gondola?: string
          foto_abastecimento?: string
          foto_validades?: string
        },
  ): Promise<VisitaPromotor> {
    const nowIso = new Date().toISOString()
    let rec: VisitaPromotor
    if (params instanceof FormData) {
      if (!params.has('status')) params.append('status', 'realizada')
      if (!params.has('realizada_em')) params.append('realizada_em', nowIso)
      rec = await pb.collection('visitas_promotor').update<VisitaPromotor>(id, params, {
        expand: 'promotor,promotor.fornecedor,loja',
      })
    } else {
      rec = await pb.collection('visitas_promotor').update<VisitaPromotor>(
        id,
        {
          status: 'realizada',
          conclusao_check: params.conclusao_check,
          rotinas_executadas: params.rotinas_executadas,
          registrado_por: params.registrado_por,
          realizada_em: nowIso,
          checklist_abastecimento_100: params.checklist_abastecimento_100,
          checklist_validades_ok: params.checklist_validades_ok,
          checklist_layout_conforme: params.checklist_layout_conforme,
          quantidade_sortimento: params.quantidade_sortimento,
          perc_vendas: params.perc_vendas,
          qtd_rupturas: params.qtd_rupturas,
          itens_sem_vendas: params.itens_sem_vendas,
          responsavel_execucao: params.responsavel_execucao,
          validador_fiscalizacao: params.validador_fiscalizacao,
          status_fiscalizacao: params.status_fiscalizacao || 'pendente',
          foto_trabalho: params.foto_trabalho,
          foto_gondola: params.foto_gondola,
          foto_abastecimento: params.foto_abastecimento,
          foto_validades: params.foto_validades,
        },
        {
          expand: 'promotor,promotor.fornecedor,loja',
        },
      )
    }

    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'conclusao',
        modulo: 'visitas',
        lojaId: rec.loja,
        registro_id: id,
        detalhes: `Visita de promotor concluída com checklist (Fornecedor: ${rec.expand?.promotor?.expand?.fornecedor?.nome || 'Fornecedor'})`,
      })
    } catch {
      /* intentionally ignored */
    }

    return rec
  },

  async cancelarVisita(id: string, motivo?: string): Promise<VisitaPromotor> {
    const current = await this.getById(id)
    const obs = motivo
      ? `${current.observacoes ? current.observacoes + ' | ' : ''}Cancelada: ${motivo}`
      : current.observacoes
    return await pb.collection('visitas_promotor').update<VisitaPromotor>(id, {
      status: 'cancelada',
      observacoes: obs,
    })
  },
}

export const rotinasPromotorService = {
  async getAll(lojaId?: string, fornecedorId?: string): Promise<RotinaPromotor[]> {
    const filters: string[] = []
    if (lojaId) {
      filters.push(`(loja = "" || loja = "${lojaId}")`)
    }
    if (fornecedorId) {
      filters.push(`(fornecedor = "" || fornecedor = "${fornecedorId}")`)
    }

    const options: Record<string, any> = {
      sort: 'titulo',
      expand: 'fornecedor,loja',
    }
    if (filters.length > 0) {
      options.filter = filters.join(' && ')
    }

    return await pb.collection('rotinas_promotor').getFullList<RotinaPromotor>(options)
  },

  async create(data: Partial<RotinaPromotor> | FormData): Promise<RotinaPromotor> {
    return await pb.collection('rotinas_promotor').create<RotinaPromotor>(data, {
      expand: 'fornecedor,loja',
    })
  },

  async update(id: string, data: Partial<RotinaPromotor> | FormData): Promise<RotinaPromotor> {
    return await pb.collection('rotinas_promotor').update<RotinaPromotor>(id, data, {
      expand: 'fornecedor,loja',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('rotinas_promotor').delete(id)
  },
}
