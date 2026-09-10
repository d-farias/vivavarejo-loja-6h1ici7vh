import pb from '@/lib/pocketbase/client'
import type {
  ComercialProduto,
  ComercialCategoria,
  ComercialAcao,
  ComercialImplantacao,
} from '@/types'

export interface ListComercialProdutosParams {
  lojaId?: string
  competencia?: string
  curva?: string
  emRuptura?: boolean
  tipoRuptura?: string
  faixaSemVenda?: string
  apenasNegativos?: boolean
  busca?: string
  sort?: string
}

export interface ListComercialCategoriasParams {
  lojaId?: string
  competencia?: string
  departamento?: string
  sort?: string
}

export interface ListComercialAcoesParams {
  lojaId?: string
  tipo?: string
  status?: string
  sort?: string
}

export interface ListComercialImplantacaoParams {
  lojaId?: string
  tipo?: string
  status?: string
  sort?: string
}

export const comercialService = {
  // ==================== PRODUTOS ====================
  async listarProdutos(params: ListComercialProdutosParams = {}): Promise<ComercialProduto[]> {
    const filters: string[] = []

    if (params.lojaId && params.lojaId !== 'todas') {
      filters.push(`loja = "${params.lojaId}"`)
    }
    if (params.competencia) {
      filters.push(`competencia = "${params.competencia}"`)
    }
    if (params.curva && params.curva !== 'todas') {
      filters.push(`curva = "${params.curva}"`)
    }
    if (params.emRuptura !== undefined) {
      filters.push(`em_ruptura = ${params.emRuptura}`)
    }
    if (params.tipoRuptura && params.tipoRuptura !== 'todos') {
      filters.push(`tipo_ruptura = "${params.tipoRuptura}"`)
    }
    if (params.faixaSemVenda && params.faixaSemVenda !== 'todas') {
      filters.push(`faixa_sem_venda = "${params.faixaSemVenda}"`)
    }
    if (params.apenasNegativos) {
      filters.push(`estoque_fisico < 0`)
    }
    if (params.busca && params.busca.trim()) {
      const q = params.busca.trim().replace(/"/g, '\\"')
      filters.push(
        `(descricao ~ "${q}" || codigo ~ "${q}" || departamento ~ "${q}" || categoria ~ "${q}")`,
      )
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : undefined

    return pb.collection('comercial_produtos').getFullList<ComercialProduto>({
      filter: filterStr,
      sort: params.sort || '-venda_valor_periodo',
      expand: 'loja',
      requestKey: null,
    })
  },

  async criarProduto(data: Partial<ComercialProduto>): Promise<ComercialProduto> {
    return pb.collection('comercial_produtos').create<ComercialProduto>(data)
  },

  async atualizarProduto(id: string, data: Partial<ComercialProduto>): Promise<ComercialProduto> {
    return pb.collection('comercial_produtos').update<ComercialProduto>(id, data)
  },

  async excluirProduto(id: string): Promise<boolean> {
    return pb.collection('comercial_produtos').delete(id)
  },

  /**
   * Sobrescreve produtos por competência e loja (para importação de planilha idempotente)
   */
  async sobrescreverProdutosPorCompetencia(
    lojaId: string | undefined,
    competencia: string,
    novosProdutos: Array<Omit<ComercialProduto, 'id' | 'created' | 'updated'>>,
    onProgress?: (index: number, total: number) => void,
  ): Promise<{ inseridos: number; substituidos: number }> {
    // 1. Localizar registros antigos para apagar/substituir
    const filtros: string[] = [`competencia = "${competencia}"`]
    if (lojaId) {
      filtros.push(`loja = "${lojaId}"`)
    }

    const antigos = await pb.collection('comercial_produtos').getFullList({
      filter: filtros.join(' && '),
      fields: 'id',
      requestKey: null,
    })

    const substituidos = antigos.length
    for (const antigo of antigos) {
      try {
        await pb.collection('comercial_produtos').delete(antigo.id)
      } catch (err) {
        console.warn('Erro ao deletar registro antigo:', err)
      }
    }

    // 2. Inserir novos produtos
    let inseridos = 0
    const total = novosProdutos.length
    for (let i = 0; i < total; i++) {
      const item = novosProdutos[i]
      await pb.collection('comercial_produtos').create({
        ...item,
        loja: lojaId || undefined,
        competencia,
      })
      inseridos++
      if (onProgress) {
        onProgress(inseridos, total)
      }
    }

    return { inseridos, substituidos }
  },

  // ==================== CATEGORIAS ====================
  async listarCategorias(
    params: ListComercialCategoriasParams = {},
  ): Promise<ComercialCategoria[]> {
    const filters: string[] = []

    if (params.lojaId && params.lojaId !== 'todas') {
      filters.push(`loja = "${params.lojaId}"`)
    }
    if (params.competencia) {
      filters.push(`competencia = "${params.competencia}"`)
    }
    if (params.departamento && params.departamento !== 'todos') {
      filters.push(`departamento = "${params.departamento}"`)
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : undefined

    return pb.collection('comercial_categorias').getFullList<ComercialCategoria>({
      filter: filterStr,
      sort: params.sort || '-venda_valor',
      expand: 'loja',
      requestKey: null,
    })
  },

  async sobrescreverCategoriasPorCompetencia(
    lojaId: string | undefined,
    competencia: string,
    novasCategorias: Array<Omit<ComercialCategoria, 'id' | 'created' | 'updated'>>,
    onProgress?: (index: number, total: number) => void,
  ): Promise<{ inseridos: number; substituidos: number }> {
    const filtros: string[] = [`competencia = "${competencia}"`]
    if (lojaId) {
      filtros.push(`loja = "${lojaId}"`)
    }

    const antigas = await pb.collection('comercial_categorias').getFullList({
      filter: filtros.join(' && '),
      fields: 'id',
      requestKey: null,
    })

    const substituidos = antigas.length
    for (const antiga of antigas) {
      try {
        await pb.collection('comercial_categorias').delete(antiga.id)
      } catch (err) {
        console.warn('Erro ao remover categoria antiga:', err)
      }
    }

    let inseridos = 0
    const total = novasCategorias.length
    for (let i = 0; i < total; i++) {
      const item = novasCategorias[i]
      await pb.collection('comercial_categorias').create({
        ...item,
        loja: lojaId || undefined,
        competencia,
      })
      inseridos++
      if (onProgress) {
        onProgress(inseridos, total)
      }
    }

    return { inseridos, substituidos }
  },

  // ==================== AÇÕES COMERCIAIS & PRICING ====================
  async listarAcoes(params: ListComercialAcoesParams = {}): Promise<ComercialAcao[]> {
    const filters: string[] = []

    if (params.lojaId && params.lojaId !== 'todas') {
      filters.push(`loja = "${params.lojaId}"`)
    }
    if (params.tipo && params.tipo !== 'todos') {
      filters.push(`tipo = "${params.tipo}"`)
    }
    if (params.status && params.status !== 'todos') {
      filters.push(`status = "${params.status}"`)
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : undefined

    return pb.collection('comercial_acoes').getFullList<ComercialAcao>({
      filter: filterStr,
      sort: params.sort || '-data_inicio',
      expand: 'loja,responsavel_usuario',
      requestKey: null,
    })
  },

  async criarAcao(data: Partial<ComercialAcao>): Promise<ComercialAcao> {
    return pb.collection('comercial_acoes').create<ComercialAcao>(data)
  },

  async atualizarAcao(id: string, data: Partial<ComercialAcao>): Promise<ComercialAcao> {
    return pb.collection('comercial_acoes').update<ComercialAcao>(id, data)
  },

  async excluirAcao(id: string): Promise<boolean> {
    return pb.collection('comercial_acoes').delete(id)
  },

  // ==================== CRONOGRAMA IMPLANTAÇÃO / LAYOUT ====================
  async listarImplantacoes(
    params: ListComercialImplantacaoParams = {},
  ): Promise<ComercialImplantacao[]> {
    const filters: string[] = []

    if (params.lojaId && params.lojaId !== 'todas') {
      filters.push(`loja = "${params.lojaId}"`)
    }
    if (params.tipo && params.tipo !== 'todos') {
      filters.push(`tipo = "${params.tipo}"`)
    }
    if (params.status && params.status !== 'todos') {
      filters.push(`status = "${params.status}"`)
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : undefined

    return pb.collection('comercial_implantacao').getFullList<ComercialImplantacao>({
      filter: filterStr,
      sort: params.sort || 'data_prevista',
      expand: 'loja,responsavel_usuario',
      requestKey: null,
    })
  },

  async criarImplantacao(data: Partial<ComercialImplantacao>): Promise<ComercialImplantacao> {
    return pb.collection('comercial_implantacao').create<ComercialImplantacao>(data)
  },

  async atualizarImplantacao(
    id: string,
    data: Partial<ComercialImplantacao>,
  ): Promise<ComercialImplantacao> {
    return pb.collection('comercial_implantacao').update<ComercialImplantacao>(id, data)
  },

  async excluirImplantacao(id: string): Promise<boolean> {
    return pb.collection('comercial_implantacao').delete(id)
  },
}
