import pb from '@/lib/pocketbase/client'
import type { PlanoAcao } from '@/types'

export const planosAcaoService = {
  async getAll(lojaId?: string | null): Promise<PlanoAcao[]> {
    let filter = ''
    if (lojaId && lojaId !== 'todas') {
      filter = `loja = "${lojaId}"`
    }

    return await pb.collection('planos_acao').getFullList<PlanoAcao>({
      filter: filter || undefined,
      sort: '-created',
      expand: 'loja,rotina,criado_por',
    })
  },

  async getById(id: string): Promise<PlanoAcao> {
    return await pb.collection('planos_acao').getOne<PlanoAcao>(id, {
      expand: 'loja,rotina,criado_por',
    })
  },

  /**
   * Cria ou atualiza (upsert) plano de ação, prevenindo duplicatas para a mesma
   * rotina, mesma loja, mesma descrição e prazo.
   */
  async create(data: Partial<PlanoAcao>): Promise<PlanoAcao> {
    const desc = (data.descricao || '').trim().toLowerCase()
    const lojaId = data.loja || ''
    const rotinaId = data.rotina || ''
    const prazo = data.prazo || ''

    if (desc && (lojaId || rotinaId)) {
      try {
        let filter = ''
        if (rotinaId) {
          filter = `rotina = "${rotinaId}" && status != "concluida"`
        } else if (lojaId) {
          filter = `loja = "${lojaId}" && status != "concluida"`
        }

        if (filter) {
          const abertos = await pb.collection('planos_acao').getFullList<PlanoAcao>({
            filter,
            fields: 'id,descricao,prazo,status',
          })

          const match = abertos.find(
            (p) =>
              (p.descricao || '').trim().toLowerCase() === desc && (!prazo || p.prazo === prazo),
          )

          if (match) {
            // Já existe plano aberto idêntico para a rotina/loja — atualiza em vez de duplicar
            return await pb.collection('planos_acao').update<PlanoAcao>(match.id, data, {
              expand: 'loja,rotina,criado_por',
            })
          }
        }
      } catch (err) {
        console.warn('Erro ao verificar duplicidade de plano de ação:', err)
      }
    }

    return await pb.collection('planos_acao').create<PlanoAcao>(data, {
      expand: 'loja,rotina,criado_por',
    })
  },

  async update(id: string, data: Partial<PlanoAcao>): Promise<PlanoAcao> {
    return await pb.collection('planos_acao').update<PlanoAcao>(id, data, {
      expand: 'loja,rotina,criado_por',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('planos_acao').delete(id)
  },
}
