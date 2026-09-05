import pb from '@/lib/pocketbase/client'
import type { Funcao } from '@/types'

export const funcoesService = {
  async getAll(): Promise<Funcao[]> {
    return await pb.collection('funcoes').getFullList<Funcao>({
      sort: 'nome',
      expand: 'loja,loja.cliente',
    })
  },

  async getByLoja(lojaId: string): Promise<Funcao[]> {
    return await pb.collection('funcoes').getFullList<Funcao>({
      filter: `loja = "${lojaId}"`,
      sort: 'nome',
      expand: 'loja',
    })
  },

  async getById(id: string): Promise<Funcao> {
    return await pb.collection('funcoes').getOne<Funcao>(id, {
      expand: 'loja',
    })
  },

  async create(data: { nome: string; loja: string }): Promise<Funcao> {
    return await pb.collection('funcoes').create<Funcao>(data, {
      expand: 'loja',
    })
  },

  async update(id: string, data: Partial<Funcao>): Promise<Funcao> {
    return await pb.collection('funcoes').update<Funcao>(id, data, {
      expand: 'loja',
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
