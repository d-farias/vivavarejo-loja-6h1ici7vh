import pb from '@/lib/pocketbase/client'
import type {
  ComercialProduto,
  ComercialCategoria,
  ComercialAcao,
  ComercialImplantacao,
  ComercialNegociacao,
  ComercialNegociacaoMarco,
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
  categoria?: string
  sort?: string
}

export interface ListComercialNegociacoesParams {
  lojaId?: string
  sazonalidade?: string
  status?: string
  tipoAcordo?: string
  fornecedor?: string
  busca?: string
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
    if (params.categoria && params.categoria !== 'todas') {
      filters.push(`categoria = "${params.categoria}"`)
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : undefined

    return pb.collection('comercial_implantacao').getFullList<ComercialImplantacao>({
      filter: filterStr,
      sort: params.sort || 'data_prevista',
      expand: 'loja,responsavel_usuario',
      requestKey: null,
    })
  },

  async criarImplantacao(
    data: Partial<ComercialImplantacao>,
    fotoFile?: File | null,
  ): Promise<ComercialImplantacao> {
    if (fotoFile) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
        }
      })
      formData.append('foto_evidencia', fotoFile)
      return pb.collection('comercial_implantacao').create<ComercialImplantacao>(formData)
    }
    return pb.collection('comercial_implantacao').create<ComercialImplantacao>(data)
  },

  async atualizarImplantacao(
    id: string,
    data: Partial<ComercialImplantacao>,
    fotoFile?: File | null,
  ): Promise<ComercialImplantacao> {
    if (fotoFile) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
        }
      })
      formData.append('foto_evidencia', fotoFile)
      return pb.collection('comercial_implantacao').update<ComercialImplantacao>(id, formData)
    }
    return pb.collection('comercial_implantacao').update<ComercialImplantacao>(id, data)
  },

  async concluirImplantacaoComEvidencia(
    id: string,
    params: {
      executadoPor: string
      observacao?: string
      fotoFile?: File | null
      semEvidencia?: boolean
    },
  ): Promise<ComercialImplantacao> {
    const dataConclusao = new Date().toISOString().slice(0, 10)
    const agoraFormatado =
      new Date().toLocaleDateString('pt-BR') +
      ' ' +
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const payload: Partial<ComercialImplantacao> = {
      status: 'concluido',
      progresso_perc: 100,
      data_conclusao: dataConclusao,
      foto_executado_por: params.executadoPor,
      foto_executado_em: agoraFormatado,
      observacao_execucao: params.observacao || undefined,
      concluido_sem_evidencia: params.semEvidencia || !params.fotoFile,
    }

    if (params.fotoFile) {
      const formData = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) formData.append(k, String(v))
      })
      formData.append('foto_evidencia', params.fotoFile)
      return pb.collection('comercial_implantacao').update<ComercialImplantacao>(id, formData)
    }

    return pb.collection('comercial_implantacao').update<ComercialImplantacao>(id, payload)
  },

  async excluirImplantacao(id: string): Promise<boolean> {
    return pb.collection('comercial_implantacao').delete(id)
  },

  getImplantacaoFotoUrl(imp: ComercialImplantacao, thumb?: string): string | null {
    if (!imp.foto_evidencia) return null
    return pb.files.getURL(imp, imp.foto_evidencia, { thumb })
  },

  // ==================== NEGOCIAÇÕES COM COMPRADOR & SAZONALIDADE ====================
  async listarNegociacoes(
    params: ListComercialNegociacoesParams = {},
  ): Promise<ComercialNegociacao[]> {
    const filters: string[] = []

    if (params.lojaId && params.lojaId !== 'todas') {
      filters.push(`(loja = "${params.lojaId}" || loja = null || loja = "")`)
    }
    if (params.sazonalidade && params.sazonalidade !== 'todas') {
      filters.push(`sazonalidade ~ "${params.sazonalidade}"`)
    }
    if (params.status && params.status !== 'todos') {
      filters.push(`status = "${params.status}"`)
    }
    if (params.tipoAcordo && params.tipoAcordo !== 'todos') {
      filters.push(`tipo_acordo = "${params.tipoAcordo}"`)
    }
    if (params.fornecedor && params.fornecedor.trim()) {
      filters.push(`fornecedor ~ "${params.fornecedor.trim()}"`)
    }
    if (params.busca && params.busca.trim()) {
      const q = params.busca.trim().replace(/"/g, '\\"')
      filters.push(
        `(titulo ~ "${q}" || fornecedor ~ "${q}" || comprador_nome ~ "${q}" || sazonalidade ~ "${q}" || produto_descricao ~ "${q}")`,
      )
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : undefined

    return pb.collection('comercial_negociacoes').getFullList<ComercialNegociacao>({
      filter: filterStr,
      sort: params.sort || '-data_inicio',
      expand: 'loja,responsavel_usuario',
      requestKey: null,
    })
  },

  async criarNegociacao(data: Partial<ComercialNegociacao>): Promise<ComercialNegociacao> {
    return pb.collection('comercial_negociacoes').create<ComercialNegociacao>(data)
  },

  async atualizarNegociacao(
    id: string,
    data: Partial<ComercialNegociacao>,
  ): Promise<ComercialNegociacao> {
    return pb.collection('comercial_negociacoes').update<ComercialNegociacao>(id, data)
  },

  async excluirNegociacao(id: string): Promise<boolean> {
    return pb.collection('comercial_negociacoes').delete(id)
  },

  // ==================== MARCOS DA NEGOCIAÇÃO (AGENDA & EVIDÊNCIAS) ====================
  async listarMarcos(negociacaoId?: string): Promise<ComercialNegociacaoMarco[]> {
    const filter = negociacaoId ? `negociacao = "${negociacaoId}"` : undefined
    return pb.collection('comercial_negociacao_marcos').getFullList<ComercialNegociacaoMarco>({
      filter,
      sort: 'data_limite',
      expand: 'negociacao',
      requestKey: null,
    })
  },

  async criarMarco(
    data: Partial<ComercialNegociacaoMarco>,
    fotoFile?: File | null,
  ): Promise<ComercialNegociacaoMarco> {
    if (fotoFile) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
        }
      })
      formData.append('foto_evidencia', fotoFile)
      return pb.collection('comercial_negociacao_marcos').create<ComercialNegociacaoMarco>(formData)
    }
    return pb.collection('comercial_negociacao_marcos').create<ComercialNegociacaoMarco>(data)
  },

  async atualizarMarco(
    id: string,
    data: Partial<ComercialNegociacaoMarco>,
    fotoFile?: File | null,
  ): Promise<ComercialNegociacaoMarco> {
    if (fotoFile) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
        }
      })
      formData.append('foto_evidencia', fotoFile)
      return pb
        .collection('comercial_negociacao_marcos')
        .update<ComercialNegociacaoMarco>(id, formData)
    }
    return pb.collection('comercial_negociacao_marcos').update<ComercialNegociacaoMarco>(id, data)
  },

  async concluirMarcoComEvidencia(
    id: string,
    params: {
      executadoPor: string
      observacao?: string
      fotoFile?: File | null
      semEvidencia?: boolean
    },
  ): Promise<ComercialNegociacaoMarco> {
    const agoraFormatado =
      new Date().toLocaleDateString('pt-BR') +
      ' ' +
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const payload: Partial<ComercialNegociacaoMarco> = {
      status: 'concluido',
      executado_por: params.executadoPor,
      executado_em: agoraFormatado,
      observacao: params.observacao || undefined,
      concluido_sem_evidencia: params.semEvidencia || !params.fotoFile,
    }

    if (params.fotoFile) {
      const formData = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) formData.append(k, String(v))
      })
      formData.append('foto_evidencia', params.fotoFile)
      return pb
        .collection('comercial_negociacao_marcos')
        .update<ComercialNegociacaoMarco>(id, formData)
    }

    return pb
      .collection('comercial_negociacao_marcos')
      .update<ComercialNegociacaoMarco>(id, payload)
  },

  async excluirMarco(id: string): Promise<boolean> {
    return pb.collection('comercial_negociacao_marcos').delete(id)
  },

  getMarcoFotoUrl(marco: ComercialNegociacaoMarco, thumb?: string): string | null {
    if (!marco.foto_evidencia) return null
    return pb.files.getURL(marco, marco.foto_evidencia, { thumb })
  },
}
