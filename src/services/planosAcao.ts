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

  async create(data: Partial<PlanoAcao>): Promise<PlanoAcao> {
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
