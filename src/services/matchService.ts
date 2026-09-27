import pb from '@/lib/pocketbase/client'
import type {
  MatchDemanda,
  MatchOportunidade,
  MatchConfiguracao,
  SituacaoMatch,
  CurvaAbc,
  PrioridadeMatch,
  StatusMatchDemanda,
  RespostaPadraoMatch,
  OrigemResolucaoMatch,
  MatchHistoricoItem,
} from '@/types'

export interface SugestaoCascataMatch {
  situacao: SituacaoMatch
  acaoSugerida: string
  prioridade: PrioridadeMatch
  potencialEstimado: number
  justificativa: string
  geraDemandaAbastecimento: boolean
  diagnosticoVerdade: string
}

/**
 * MOTOR DE DECISÃO EM CASCATA — VivaVarejo Integração
 * Princípio chave: "Antes de gerar demanda, o sistema cruza físico × sistema × venda e
 * indica onde está a verdade — demanda só quando há ação real; o resto vira conferência ou oportunidade."
 *
 * Classificação prévia em 3 situações ANTES da cascata de decisão:
 * a) VENDA ATÉ ZERAR O FÍSICO, MAS SISTEMA AINDA MOSTRA ESTOQUE:
 *    (venda média > 0, estoque físico da loja <= 0, estoque no SISTEMA > 0)
 *    -> Divergência sistema × físico (merma, furto, baixa não lançada).
 *    -> AÇÃO SUGERIDA: Conferência física / inventário cíclico na loja (NÃO gera demanda de abastecimento).
 *
 * b) TEM FÍSICO E NÃO VENDE:
 *    (estoque físico > 0, venda média <= 0.05 ou sem giro)
 *    -> NÃO é abastecimento. Classificar como "Sem giro — exposição/preço/posicionamento".
 *    -> AÇÃO SUGERIDA: Direcionar ao Comercial como sinal/oportunidade de análise.
 *
 * c) SEM FÍSICO E SEM ESTOQUE NO SISTEMA (físico <= 0 e sistema <= 0) com venda média > 0:
 *    -> Ruptura real, e segue a cascata de abastecimento:
 *       1. CD tem estoque -> abastecer via CD
 *       2. Pedido em trânsito -> acompanhar SLA
 *       3. Sem cobertura interna -> demanda ao fornecedor
 */
export function calcularCascataMatch(params: {
  estoqueLoja: number
  estoqueSistema?: number
  estoqueCd: number
  estoqueTransito: boolean
  previsaoTransito?: string
  vendaMediaDiaria: number
  precoVenda?: number
  curva: CurvaAbc
  leadTimeDias?: number
  estoqueCriticoParam?: number
}): SugestaoCascataMatch {
  const {
    estoqueLoja = 0,
    estoqueSistema,
    estoqueCd = 0,
    estoqueTransito = false,
    vendaMediaDiaria = 0,
    precoVenda = 0,
    curva = 'A',
    leadTimeDias = 3,
    estoqueCriticoParam = 10,
  } = params

  const leadTime = Math.max(1, leadTimeDias || 3)
  const potencialEstimado = Math.round(vendaMediaDiaria * leadTime * precoVenda * 100) / 100

  // Se estoqueSistema não for informado explicitamente, assume o mesmo valor do físico para compatibilidade retroativa
  const sistemaVal = estoqueSistema !== undefined ? estoqueSistema : estoqueLoja

  // =========================================================================
  // SITUAÇÃO A: Venda até zerar o físico, mas sistema ainda mostra estoque
  // (venda > 0, físico <= 0, sistema > 0) -> Divergência sistema × físico
  // =========================================================================
  if (estoqueLoja <= 0 && sistemaVal > 0 && vendaMediaDiaria > 0) {
    const valorDivergencia = Math.round(sistemaVal * precoVenda * 100) / 100
    return {
      situacao: 'divergencia_sistema_fisico',
      acaoSugerida: 'Conferência física / inventário cíclico na loja',
      prioridade: curva === 'A' ? 'alta' : 'media',
      potencialEstimado: valorDivergencia > 0 ? valorDivergencia : potencialEstimado,
      justificativa: `Físico zerado com saldo virtual no sistema (${sistemaVal} un.). Provável perda, furto, mercadoria extraviada ou baixa não registrada. Correção na loja antes de abastecer.`,
      geraDemandaAbastecimento: false,
      diagnosticoVerdade: 'Divergência sistêmica: o sistema pensa que tem, o cliente não encontra.',
    }
  }

  // =========================================================================
  // SITUAÇÃO B: Tem físico e não vende (físico > 0 e venda média ≈ 0)
  // -> Sem giro / exposição / preço / posicionamento
  // =========================================================================
  if (estoqueLoja > 0 && vendaMediaDiaria <= 0.05) {
    const valorImobilizado = Math.round(estoqueLoja * precoVenda * 100) / 100
    return {
      situacao: 'sem_giro',
      acaoSugerida: 'Análise comercial: rever exposição, gôndola, preço ou campanha de ativação',
      prioridade: 'media',
      potencialEstimado: valorImobilizado,
      justificativa: `Estoque físico em loja (${estoqueLoja} un.) sem registro de vendas representativo. Não requer abastecimento; requer ação de sell-out ou reposicionamento no piso.`,
      geraDemandaAbastecimento: false,
      diagnosticoVerdade: 'Produto disponível fisicamente, mas sem tração de vendas.',
    }
  }

  // =========================================================================
  // SITUAÇÃO C: Sem físico e sem estoque no sistema (ou físico <= 0 e sistema <= 0)
  // com venda média > 0 -> Ruptura real, entra na cascata de abastecimento
  // =========================================================================
  if (estoqueLoja <= 0) {
    // 1. Ruptura real + CD possui estoque -> abastecer via CD
    if (estoqueCd > 0) {
      return {
        situacao: 'ruptura',
        acaoSugerida: `Abastecer via CD (${estoqueCd} un. disponíveis internamente)`,
        prioridade: curva === 'A' ? 'alta' : 'media',
        potencialEstimado,
        justificativa: `Ruptura real confirmada (físico 0 e sistema ${sistemaVal}). CD possui estoque para suprir a loja imediatamente sem compra externa.`,
        geraDemandaAbastecimento: true,
        diagnosticoVerdade: 'Ruptura real com cobertura interna pronta no CD.',
      }
    }

    // 2. Ruptura real + pedido em trânsito -> Acompanhar SLA
    if (estoqueTransito) {
      return {
        situacao: 'pedido_aberto',
        acaoSugerida: 'Existe atendimento em andamento. Acompanhar prazo e SLA',
        prioridade: curva === 'A' ? 'alta' : 'media',
        potencialEstimado,
        justificativa:
          'Ruptura real confirmada, porém já há pedido faturado/em trânsito. Acompanhar SLA para evitar pedido duplicado.',
        geraDemandaAbastecimento: false,
        diagnosticoVerdade: 'Ruptura em atendimento — carga já despachada pelo fornecedor/CD.',
      }
    }

    // 3. Ruptura real + sem CD + sem trânsito -> Demanda ao fornecedor
    return {
      situacao: 'ruptura',
      acaoSugerida: 'Não existe cobertura interna. Gerar demanda para fornecedor',
      prioridade: curva === 'A' ? 'alta' : curva === 'B' ? 'alta' : 'media',
      potencialEstimado,
      justificativa:
        'Ruptura real confirmada sem cobertura interna (CD zerado e sem trânsito). Necessário acionar fornecedor.',
      geraDemandaAbastecimento: true,
      diagnosticoVerdade: 'Ruptura real desprovida de qualquer cobertura interna.',
    }
  }

  // =========================================================================
  // DEMAIS CENÁRIOS: Risco de ruptura, excesso ou regular
  // =========================================================================
  const coberturaDias = vendaMediaDiaria > 0 ? estoqueLoja / vendaMediaDiaria : 999
  const abaixoDoCritico = estoqueLoja <= estoqueCriticoParam || coberturaDias <= leadTime

  if (abaixoDoCritico) {
    if (estoqueCd > 0) {
      return {
        situacao: 'risco_ruptura',
        acaoSugerida: 'Antecipar abastecimento via CD (prevenir antes de romper)',
        prioridade: curva === 'A' ? 'alta' : 'media',
        potencialEstimado: Math.round(potencialEstimado * 0.5 * 100) / 100,
        justificativa: 'Estoque da loja em faixa de alerta e o CD possui saldo de cobertura.',
        geraDemandaAbastecimento: true,
        diagnosticoVerdade: 'Risco iminente de ruptura com cobertura disponível no CD.',
      }
    }

    if (estoqueTransito) {
      return {
        situacao: 'pedido_aberto',
        acaoSugerida: 'Pedido em trânsito cobrirá o risco. Acompanhar pontualidade',
        prioridade: 'media',
        potencialEstimado: Math.round(potencialEstimado * 0.3 * 100) / 100,
        justificativa: 'Atendimento já faturado ou despachado cobrirá o consumo projetado.',
        geraDemandaAbastecimento: false,
        diagnosticoVerdade: 'Risco coberto por pedido já em trânsito.',
      }
    }

    return {
      situacao: 'risco_ruptura',
      acaoSugerida: 'Antecipar pedido ao fornecedor (sem saldo no CD)',
      prioridade: curva === 'A' ? 'media' : 'baixa',
      potencialEstimado: Math.round(potencialEstimado * 0.5 * 100) / 100,
      justificativa: 'Loja corre risco de romper e o CD não dispõe de estoque reserva.',
      geraDemandaAbastecimento: true,
      diagnosticoVerdade: 'Risco de ruptura sem saldo no CD — acionar fornecedor antecipadamente.',
    }
  }

  // Estoque excessivo (mais de 45 dias de cobertura)
  if (coberturaDias >= 45 && estoqueLoja > 30) {
    return {
      situacao: 'excesso_estoque',
      acaoSugerida: 'Analisar redistribuição entre lojas / ação comercial de giro',
      prioridade: 'baixa',
      potencialEstimado: 0,
      justificativa: `Cobertura estimada em ${Math.round(coberturaDias)} dias. Risco de capital parado.`,
      geraDemandaAbastecimento: false,
      diagnosticoVerdade: 'Sobrecarga de estoque em loja.',
    }
  }

  // Regular
  return {
    situacao: 'oportunidade',
    acaoSugerida: 'Manter abastecimento regular conforme demanda do PDV',
    prioridade: 'baixa',
    potencialEstimado: 0,
    justificativa: 'Estoque atual suficiente para cobrir o lead time com folga operacional.',
    geraDemandaAbastecimento: false,
    diagnosticoVerdade: 'Estoque e giro equilibrados.',
  }
}

export const matchService = {
  // ==================== DEMANDAS ====================
  async listarDemandas(params?: {
    redeId?: string
    lojaId?: string
    situacao?: string
    curva?: string
    status?: string
    fornecedor?: string
    busca?: string
  }): Promise<MatchDemanda[]> {
    const filters: string[] = []

    if (params?.redeId) {
      filters.push(`rede = "${params.redeId}"`)
    }
    if (params?.lojaId && params.lojaId !== 'todas') {
      filters.push(`loja = "${params.lojaId}"`)
    }
    if (params?.situacao && params.situacao !== 'todas') {
      filters.push(`situacao = "${params.situacao}"`)
    }
    if (params?.curva && params.curva !== 'todas') {
      filters.push(`curva = "${params.curva}"`)
    }
    if (params?.status && params.status !== 'todos') {
      filters.push(`status = "${params.status}"`)
    }
    if (params?.fornecedor && params.fornecedor !== 'todos') {
      filters.push(`fornecedor_nome ~ "${params.fornecedor}"`)
    }
    if (params?.busca?.trim()) {
      const q = params.busca.trim().toLowerCase()
      filters.push(
        `(produto_descricao ~ "${q}" || produto_codigo ~ "${q}" || fornecedor_nome ~ "${q}")`,
      )
    }

    try {
      return await pb.collection('match_demandas').getFullList<MatchDemanda>({
        filter: filters.length > 0 ? filters.join(' && ') : undefined,
        sort: '-created',
        expand: 'rede,loja,fornecedor,registrado_por_usuario',
      })
    } catch (err) {
      console.warn('Erro ao listar demandas match:', err)
      return []
    }
  },

  async criarDemanda(data: {
    redeId?: string
    lojaId?: string
    fornecedorId?: string
    fornecedorNome?: string
    produtoCodigo?: string
    produtoDescricao: string
    curva: CurvaAbc
    estoqueLoja?: number
    estoqueSistema?: number
    estoqueCd?: number
    estoqueTransito?: boolean
    previsaoEntregaTransito?: string
    vendaMediaDiaria?: number
    precoVenda?: number
    leadTimeDias?: number
    potencialVendaPerdida?: number
    situacao: SituacaoMatch
    acaoSugerida: string
    prioridade: PrioridadeMatch
    status?: StatusMatchDemanda
    observacaoInicial?: string
    registradoPorNome?: string
    registradoPorUsuarioId?: string
    isExemplo?: boolean
  }): Promise<MatchDemanda> {
    const historicoInicial: MatchHistoricoItem[] = [
      {
        data: new Date().toISOString(),
        autor: data.registradoPorNome || 'Loja',
        status: data.status || 'aberta',
        mensagem: data.observacaoInicial
          ? `Registro inicial: ${data.observacaoInicial}`
          : `Ocorrência registrada no piso de loja. Situação: ${data.situacao}. Ação sugerida: ${data.acaoSugerida}`,
      },
    ]

    return await pb.collection('match_demandas').create<MatchDemanda>({
      rede: data.redeId || null,
      loja: data.lojaId || null,
      fornecedor: data.fornecedorId || null,
      fornecedor_nome: data.fornecedorNome || '',
      produto_codigo: data.produtoCodigo || '',
      produto_descricao: data.produtoDescricao.trim(),
      curva: data.curva,
      estoque_loja: data.estoqueLoja ?? 0,
      estoque_sistema:
        data.estoqueSistema !== undefined ? data.estoqueSistema : (data.estoqueLoja ?? 0),
      estoque_cd: data.estoqueCd ?? 0,
      estoque_transito: Boolean(data.estoqueTransito),
      previsao_entrega_transito: data.previsaoEntregaTransito || '',
      venda_media_diaria: data.vendaMediaDiaria ?? 0,
      preco_venda: data.precoVenda ?? 0,
      lead_time_dias: data.leadTimeDias ?? 3,
      potencial_venda_perdida: data.potencialVendaPerdida ?? 0,
      situacao: data.situacao,
      acao_sugerida: data.acaoSugerida,
      prioridade: data.prioridade,
      status: data.status || 'aberta',
      historico_andamento: historicoInicial,
      registrado_por_nome: data.registradoPorNome || '',
      registrado_por_usuario: data.registradoPorUsuarioId || null,
      is_exemplo: Boolean(data.isExemplo),
    })
  },

  async atualizarStatus(
    id: string,
    params: {
      novoStatus: StatusMatchDemanda
      autorNome: string
      mensagem?: string
      respostaPadrao?: RespostaPadraoMatch
      observacaoResposta?: string
      origemResolucao?: OrigemResolucaoMatch
      valorRecuperado?: number
      dentroSla?: boolean
      historicoExistente?: MatchHistoricoItem[]
    },
  ): Promise<MatchDemanda> {
    const novoItemHistorico: MatchHistoricoItem = {
      data: new Date().toISOString(),
      autor: params.autorNome || 'Abastecimento / ADM',
      status: params.novoStatus,
      mensagem:
        params.mensagem ||
        `Status atualizado para "${params.novoStatus}"${
          params.respostaPadrao ? ` — Resposta: ${params.respostaPadrao}` : ''
        }`,
    }

    const historicoAtualizado = [...(params.historicoExistente || []), novoItemHistorico]

    const updatePayload: Record<string, unknown> = {
      status: params.novoStatus,
      historico_andamento: historicoAtualizado,
    }

    if (params.respostaPadrao) {
      updatePayload.resposta_padrao = params.respostaPadrao
    }
    if (params.observacaoResposta !== undefined) {
      updatePayload.observacao_resposta = params.observacaoResposta
    }
    if (params.origemResolucao) {
      updatePayload.origem_resolucao = params.origemResolucao
    }
    if (params.valorRecuperado !== undefined) {
      updatePayload.valor_recuperado = params.valorRecuperado
    }
    if (params.dentroSla !== undefined) {
      updatePayload.dentro_sla = params.dentroSla
    }

    if (params.novoStatus === 'resolvida') {
      updatePayload.resolvido_em = new Date().toISOString()
    }

    return await pb.collection('match_demandas').update<MatchDemanda>(id, updatePayload)
  },

  async excluirDemanda(id: string): Promise<boolean> {
    return await pb.collection('match_demandas').delete(id)
  },

  // ==================== OPORTUNIDADES COMERCIAIS ====================
  async listarOportunidades(params?: {
    redeId?: string
    status?: string
    busca?: string
  }): Promise<MatchOportunidade[]> {
    const filters: string[] = []

    if (params?.redeId) {
      filters.push(`rede = "${params.redeId}"`)
    }
    if (params?.status && params.status !== 'todos') {
      filters.push(`status = "${params.status}"`)
    }
    if (params?.busca?.trim()) {
      const q = params.busca.trim().toLowerCase()
      filters.push(`(produto_descricao ~ "${q}" || categoria ~ "${q}" || fornecedor_nome ~ "${q}")`)
    }

    try {
      return await pb.collection('match_oportunidades').getFullList<MatchOportunidade>({
        filter: filters.length > 0 ? filters.join(' && ') : undefined,
        sort: '-created',
        expand: 'rede',
      })
    } catch (err) {
      console.warn('Erro ao listar oportunidades match:', err)
      return []
    }
  },

  async criarOportunidade(data: Partial<MatchOportunidade>): Promise<MatchOportunidade> {
    return await pb.collection('match_oportunidades').create<MatchOportunidade>(data)
  },

  async atualizarOportunidade(
    id: string,
    data: Partial<MatchOportunidade>,
  ): Promise<MatchOportunidade> {
    return await pb.collection('match_oportunidades').update<MatchOportunidade>(id, data)
  },

  async excluirOportunidade(id: string): Promise<boolean> {
    return await pb.collection('match_oportunidades').delete(id)
  },

  // ==================== PARÂMETROS / CONFIGURAÇÕES ====================
  async obterConfiguracao(redeId?: string): Promise<MatchConfiguracao | null> {
    if (!redeId) return null
    try {
      const list = await pb.collection('match_configuracoes').getList<MatchConfiguracao>(1, 1, {
        filter: `rede = "${redeId}"`,
      })
      return list.items[0] || null
    } catch {
      return null
    }
  },

  async salvarConfiguracao(data: {
    redeId: string
    slaDiasPadrao: number
    estoqueCriticoPadrao: number
    metodologiaPotencial?: string
  }): Promise<MatchConfiguracao> {
    const existente = await this.obterConfiguracao(data.redeId)
    if (existente) {
      return await pb.collection('match_configuracoes').update<MatchConfiguracao>(existente.id, {
        sla_dias_padrao: data.slaDiasPadrao,
        estoque_critico_padrao: data.estoqueCriticoPadrao,
        metodologia_potencial: data.metodologiaPotencial || 'venda_media_x_dias',
      })
    }

    return await pb.collection('match_configuracoes').create<MatchConfiguracao>({
      rede: data.redeId,
      sla_dias_padrao: data.slaDiasPadrao,
      estoque_critico_padrao: data.estoqueCriticoPadrao,
      metodologia_potencial: data.metodologiaPotencial || 'venda_media_x_dias',
    })
  },
}
