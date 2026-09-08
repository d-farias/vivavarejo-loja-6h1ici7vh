import pb from '@/lib/pocketbase/client'
import type { Fornecedor } from '@/types'

export const fornecedoresService = {
  async getAll(): Promise<Fornecedor[]> {
    return await pb.collection('fornecedores').getFullList<Fornecedor>({
      sort: 'nome',
      expand: 'cliente',
    })
  },

  async getById(id: string): Promise<Fornecedor> {
    return await pb.collection('fornecedores').getOne<Fornecedor>(id, {
      expand: 'cliente',
    })
  },

  async create(data: Partial<Fornecedor> | FormData): Promise<Fornecedor> {
    return await pb.collection('fornecedores').create<Fornecedor>(data)
  },

  async update(id: string, data: Partial<Fornecedor> | FormData): Promise<Fornecedor> {
    return await pb.collection('fornecedores').update<Fornecedor>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('fornecedores').delete(id)
  },

  async countDependencies(id: string): Promise<{ promotoresCount: number; rotinasCount: number }> {
    const [promotores, rotinas] = await Promise.all([
      pb.collection('promotores').getList(1, 1, { filter: `fornecedor = "${id}"` }),
      pb.collection('rotinas_promotor').getList(1, 1, { filter: `fornecedor = "${id}"` }),
    ])
    return {
      promotoresCount: promotores.totalItems,
      rotinasCount: rotinas.totalItems,
    }
  },
}
