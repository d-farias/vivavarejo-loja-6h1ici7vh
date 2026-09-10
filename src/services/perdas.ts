import pb from '@/lib/pocketbase/client'
import type { Perda, MotivoPerda } from '@/types'

export interface CreatePerdaData {
  loja?: string
  data: string
  setor_categoria: string
  motivo: MotivoPerda
  item_descricao?: string
  quantidade: number
  valor_estimado: number
  observacao?: string
  registrado_por?: string
  fotoFile?: File | null
}

export const perdasService = {
  async getAll(lojaId?: string | null): Promise<Perda[]> {
    let filter = ''
    if (lojaId && lojaId !== 'todas') {
      filter = `loja = "${lojaId}" || loja = ""`
    }

    const list = await pb.collection('perdas').getFullList<Perda>({
      filter: filter || undefined,
      sort: '-data,-created',
      expand: 'loja,registrado_por',
    })

    const seen = new Set<string>()
    return list.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  },

  async create(data: CreatePerdaData): Promise<Perda> {
    if (data.fotoFile) {
      const formData = new FormData()
      if (data.loja) formData.append('loja', data.loja)
      formData.append('data', data.data)
      formData.append('setor_categoria', data.setor_categoria)
      formData.append('motivo', data.motivo)
      if (data.item_descricao) formData.append('item_descricao', data.item_descricao)
      formData.append('quantidade', String(data.quantidade))
      formData.append('valor_estimado', String(data.valor_estimado))
      if (data.observacao) formData.append('observacao', data.observacao)
      if (data.registrado_por) formData.append('registrado_por', data.registrado_por)
      formData.append('foto', data.fotoFile)

      const rec = await pb.collection('perdas').create<Perda>(formData, {
        expand: 'loja,registrado_por',
      })
      try {
        const { auditoriaService } = await import('@/services/auditoria')
        auditoriaService.registrar({
          acao: 'criacao',
          modulo: 'perdas',
          lojaId: data.loja,
          registro_id: rec.id,
          detalhes: `Perda registrada com foto: ${data.item_descricao || data.setor_categoria} (R$ ${data.valor_estimado})`,
        })
      } catch {
        /* intentionally ignored */
      }
      return rec
    }

    const payload: Record<string, unknown> = {
      loja: data.loja || '',
      data: data.data,
      setor_categoria: data.setor_categoria,
      motivo: data.motivo,
      item_descricao: data.item_descricao || '',
      quantidade: data.quantidade,
      valor_estimado: data.valor_estimado,
      observacao: data.observacao || '',
      registrado_por: data.registrado_por || '',
    }

    const rec = await pb.collection('perdas').create<Perda>(payload, {
      expand: 'loja,registrado_por',
    })
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'criacao',
        modulo: 'perdas',
        lojaId: data.loja,
        registro_id: rec.id,
        detalhes: `Perda registrada: ${data.item_descricao || data.setor_categoria} (R$ ${data.valor_estimado})`,
      })
    } catch {
      /* intentionally ignored */
    }
    return rec
  },

  async update(id: string, data: Partial<Perda>, fotoFile?: File | null): Promise<Perda> {
    let rec: Perda
    if (fotoFile) {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v))
        }
      })
      formData.append('foto', fotoFile)
      rec = await pb.collection('perdas').update<Perda>(id, formData, {
        expand: 'loja,registrado_por',
      })
    } else {
      rec = await pb.collection('perdas').update<Perda>(id, data, {
        expand: 'loja,registrado_por',
      })
    }
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'alteracao',
        modulo: 'perdas',
        lojaId: rec.loja,
        registro_id: id,
        detalhes: `Perda atualizada: ${rec.item_descricao || id}`,
      })
    } catch {
      /* intentionally ignored */
    }
    return rec
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'exclusao',
        modulo: 'perdas',
        registro_id: id,
        detalhes: `Perda excluída (ID: ${id})`,
      })
    } catch {
      /* intentionally ignored */
    }
    return await pb.collection('perdas').delete(id)
  },

  getFotoUrl(perda: Perda, thumb?: string): string | null {
    if (!perda.foto) return null
    return pb.files.getURL(perda, perda.foto, { thumb })
  },

  async getProtectedFotoUrl(perda: Perda, thumb?: string): Promise<string | null> {
    if (!perda.foto) return null
    try {
      const token = await pb.files.getToken()
      return pb.files.getURL(perda, perda.foto, { thumb, token })
    } catch (_) {
      return pb.files.getURL(perda, perda.foto, { thumb })
    }
  },
}
