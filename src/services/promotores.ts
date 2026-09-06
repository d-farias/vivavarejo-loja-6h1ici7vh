import pb from '@/lib/pocketbase/client'
import type { Promotor } from '@/types'

export const promotoresService = {
  async getAll(): Promise<Promotor[]> {
    return await pb.collection('promotores').getFullList<Promotor>({
      sort: 'nome',
      expand: 'fornecedor,usuario',
    })
  },

  async getById(id: string): Promise<Promotor> {
    return await pb.collection('promotores').getOne<Promotor>(id, {
      expand: 'fornecedor,usuario',
    })
  },

  async create(data: Partial<Promotor>): Promise<Promotor> {
    return await pb.collection('promotores').create<Promotor>(data)
  },

  async update(id: string, data: Partial<Promotor>): Promise<Promotor> {
    return await pb.collection('promotores').update<Promotor>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('promotores').delete(id)
  },

  async countDependencies(id: string): Promise<{ visitasCount: number }> {
    const visitas = await pb.collection('visitas_promotor').getList(1, 1, {
      filter: `promotor = "${id}"`,
    })
    return {
      visitasCount: visitas.totalItems,
    }
  },
}
