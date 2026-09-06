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

  async create(data: Partial<VisitaPromotor>): Promise<VisitaPromotor> {
    return await pb.collection('visitas_promotor').create<VisitaPromotor>(data, {
      expand: 'promotor,promotor.fornecedor,loja',
    })
  },

  async update(id: string, data: Partial<VisitaPromotor>): Promise<VisitaPromotor> {
    return await pb.collection('visitas_promotor').update<VisitaPromotor>(id, data, {
      expand: 'promotor,promotor.fornecedor,loja',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('visitas_promotor').delete(id)
  },

  async registrarConclusao(
    id: string,
    params: {
      conclusao_check: string
      rotinas_executadas?: string
      registrado_por?: string
    },
  ): Promise<VisitaPromotor> {
    return await pb.collection('visitas_promotor').update<VisitaPromotor>(
      id,
      {
        status: 'realizada',
        conclusao_check: params.conclusao_check,
        rotinas_executadas: params.rotinas_executadas,
        registrado_por: params.registrado_por,
        realizada_em: new Date().toISOString(),
      },
      {
        expand: 'promotor,promotor.fornecedor,loja',
      },
    )
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

  async create(data: Partial<RotinaPromotor>): Promise<RotinaPromotor> {
    return await pb.collection('rotinas_promotor').create<RotinaPromotor>(data, {
      expand: 'fornecedor,loja',
    })
  },

  async update(id: string, data: Partial<RotinaPromotor>): Promise<RotinaPromotor> {
    return await pb.collection('rotinas_promotor').update<RotinaPromotor>(id, data, {
      expand: 'fornecedor,loja',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('rotinas_promotor').delete(id)
  },
}
