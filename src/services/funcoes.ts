import pb from '@/lib/pocketbase/client'
import type { Funcao } from '@/types'

export const funcoesService = {
  async getAll(): Promise<Funcao[]> {
    return await pb.collection('funcoes').getFullList<Funcao>({
      sort: 'nome',
      expand: 'loja,loja.cliente,chefe_imediato_funcao',
    })
  },

  async getByLoja(lojaId: string): Promise<Funcao[]> {
    return await pb.collection('funcoes').getFullList<Funcao>({
      filter: `loja = "${lojaId}" || loja = ""`,
      sort: 'nome',
      expand: 'loja,chefe_imediato_funcao',
    })
  },

  async getById(id: string): Promise<Funcao> {
    return await pb.collection('funcoes').getOne<Funcao>(id, {
      expand: 'loja,chefe_imediato_funcao',
    })
  },

  async create(data: {
    nome: string
    loja?: string
    telefone?: string
    chefe_imediato_funcao?: string
  }): Promise<Funcao> {
    const payload: Record<string, any> = { ...data }
    if (!payload.chefe_imediato_funcao) {
      delete payload.chefe_imediato_funcao
    }
    return await pb.collection('funcoes').create<Funcao>(payload, {
      expand: 'loja,chefe_imediato_funcao',
    })
  },

  async update(id: string, data: Partial<Funcao>): Promise<Funcao> {
    return await pb.collection('funcoes').update<Funcao>(id, data, {
      expand: 'loja,chefe_imediato_funcao',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('funcoes').delete(id)
  },

  async countDependencies(id: string): Promise<{
    funcionariosCount: number
    rotinasCount: number
  }> {
    const [funcs, rotinas] = await Promise.all([
      pb.collection('funcionarios').getList(1, 1, { filter: `funcao = "${id}"` }),
      pb.collection('rotinas').getList(1, 1, { filter: `funcao = "${id}"` }),
    ])
    return {
      funcionariosCount: funcs.totalItems,
      rotinasCount: rotinas.totalItems,
    }
  },
}
