import pb from '@/lib/pocketbase/client'
import type { Inventario, TipoInventario, StatusInventario } from '@/types'

export interface CreateInventarioData {
  loja?: string
  data: string
  setor_categoria: string
  tipo: TipoInventario
  status?: StatusInventario
  itens_contados?: number
  divergencias_encontradas?: number
  acuracidade_percentual?: number
  responsavel_nome?: string
  responsavel_usuario?: string
  observacao?: string
}

export const inventariosService = {
  async getAll(lojaId?: string | null): Promise<Inventario[]> {
    let filter = ''
    if (lojaId && lojaId !== 'todas') {
      filter = `loja = "${lojaId}" || loja = ""`
    }

    const list = await pb.collection('inventarios').getFullList<Inventario>({
      filter: filter || undefined,
      sort: '-data,-created',
      expand: 'loja,responsavel_usuario',
    })

    const seen = new Set<string>()
    return list.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  },

  async create(data: CreateInventarioData): Promise<Inventario> {
    const payload = {
      ...data,
      loja: data.loja || '',
      status: data.status || 'concluido',
    }

    return await pb.collection('inventarios').create<Inventario>(payload, {
      expand: 'loja,responsavel_usuario',
    })
  },

  async update(id: string, data: Partial<Inventario>): Promise<Inventario> {
    return await pb.collection('inventarios').update<Inventario>(id, data, {
      expand: 'loja,responsavel_usuario',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('inventarios').delete(id)
  },
}
