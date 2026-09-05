import pb from '@/lib/pocketbase/client'
import type { Cliente } from '@/types'

export const clientesService = {
  async getAll(): Promise<Cliente[]> {
    return await pb.collection('clientes').getFullList<Cliente>({
      sort: 'nome',
    })
  },

  async getById(id: string): Promise<Cliente> {
    return await pb.collection('clientes').getOne<Cliente>(id)
  },

  async create(data: { nome: string; contato?: string; observacoes?: string }): Promise<Cliente> {
    return await pb.collection('clientes').create<Cliente>(data)
  },

  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    return await pb.collection('clientes').update<Cliente>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('clientes').delete(id)
  },

  async countDependencies(id: string): Promise<{ lojasCount: number }> {
    const lojas = await pb.collection('lojas').getList(1, 1, {
      filter: `cliente = "${id}"`,
    })
    return {
      lojasCount: lojas.totalItems,
    }
  },
}
