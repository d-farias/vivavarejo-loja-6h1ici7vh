import pb from '@/lib/pocketbase/client'
import type { Loja } from '@/types'

export const lojasService = {
  async getAll(): Promise<Loja[]> {
    return await pb.collection('lojas').getFullList<Loja>({
      sort: 'nome',
      expand: 'cliente',
    })
  },

  async getByCliente(clienteId: string): Promise<Loja[]> {
    return await pb.collection('lojas').getFullList<Loja>({
      filter: `cliente = "${clienteId}"`,
      sort: 'nome',
      expand: 'cliente',
    })
  },

  async getById(id: string): Promise<Loja> {
    return await pb.collection('lojas').getOne<Loja>(id, {
      expand: 'cliente',
    })
  },

  async create(data: {
    nome: string
    cliente: string
    codigo?: string
    observacoes?: string
  }): Promise<Loja> {
    return await pb.collection('lojas').create<Loja>(data, {
      expand: 'cliente',
    })
  },

  async update(id: string, data: Partial<Loja>): Promise<Loja> {
    return await pb.collection('lojas').update<Loja>(id, data, {
      expand: 'cliente',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('lojas').delete(id)
  },

  async countDependencies(id: string): Promise<{
    funcoesCount: number
    funcionariosCount: number
    rotinasCount: number
  }> {
    const [funcoes, funcionarios, rotinas] = await Promise.all([
      pb.collection('funcoes').getList(1, 1, { filter: `loja = "${id}"` }),
      pb.collection('funcionarios').getList(1, 1, { filter: `loja = "${id}"` }),
      pb.collection('rotinas').getList(1, 1, { filter: `loja = "${id}"` }),
    ])

    return {
      funcoesCount: funcoes.totalItems,
      funcionariosCount: funcionarios.totalItems,
      rotinasCount: rotinas.totalItems,
    }
  },
}
