import pb from '@/lib/pocketbase/client'
import type { AdmRhDemanda, SubAreaAdmRh, StatusAdmRh, PrioridadeAdmRh } from '@/types'

export interface ListAdmRhDemandasParams {
  redeId?: string
  lojaId?: string
  subArea?: SubAreaAdmRh
  status?: StatusAdmRh
  prioridade?: PrioridadeAdmRh
  busca?: string
}

export interface CriarAdmRhDemandaData {
  redeId?: string
  lojaId?: string
  subArea: SubAreaAdmRh
  titulo: string
  descricao?: string
  prioridade: PrioridadeAdmRh
  prazo?: string
  responsavel?: string
  solicitanteNome?: string
  solicitanteUsuarioId?: string
  fotoFile?: File | null
  categoriaCasoUso?: string
  isExemplo?: boolean
}

export interface TratarAdmRhDemandaData {
  status: StatusAdmRh
  respostaArea: string
  respondidoPor: string
  responsavel?: string
  fotoRespostaFile?: File | null
}

// Exemplos enxutos (2-3 por sub-área) para popular caso a base esteja vazia
export const EXEMPLOS_ADM_RH_BASE = [
  // 1. RH
  {
    sub_area: 'rh' as const,
    titulo: 'Quadro atual de funcionários e escala de folgas',
    descricao:
      'Envio do quadro atual de colaboradores ativos da loja e conferência das coberturas de turnos para o próximo mês.',
    prioridade: 'media' as const,
    status: 'em_tratamento' as const,
    responsavel: 'Coordenação RH',
    categoria_caso_uso: 'quadro_loja',
    prazo: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area:
      'Quadro recebido. Ajustando reposição do operador de caixa e validando banco de horas.',
    respondido_por: 'Bruna RH',
  },
  {
    sub_area: 'rh' as const,
    titulo: 'Processo seletivo repositor de hortifrúti / mercearia',
    descricao:
      'Solicitação de abertura de vaga para repositor noturno com urgência para reposição de perdas e layout.',
    prioridade: 'alta' as const,
    status: 'recebida' as const,
    responsavel: 'Seleção RH',
    categoria_caso_uso: 'quadro_loja',
    prazo: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
  },

  // 2. DP (Departamento Pessoal)
  {
    sub_area: 'dp' as const,
    titulo: 'Documentos legais / pendência eSocial admissão',
    descricao:
      'Ficha de registro de novo colaborador e comprovante de exame admissional (ASO) com foto para validação legal no eSocial.',
    prioridade: 'urgente' as const,
    status: 'recebida' as const,
    responsavel: 'Analista DP',
    categoria_caso_uso: 'documentos_legais',
    prazo: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area: 'Documento em triagem legal. Pendente envio do espelho de ponto assinado.',
    respondido_por: 'Carlos DP',
  },
  {
    sub_area: 'dp' as const,
    titulo: 'Escala semanal e atestados médicos de afastamento',
    descricao:
      'Atestado médico de 3 dias de colaborador do açougue e envio da escala de substituição emergencial.',
    prioridade: 'alta' as const,
    status: 'resolvida' as const,
    responsavel: 'DP Central',
    categoria_caso_uso: 'escalas_loja',
    prazo: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area: 'Atestado lançado no sistema de ponto e abono registrado na folha de pagamento.',
    respondido_por: 'Carlos DP',
  },

  // 3. ADM (Administrativo Geral)
  {
    sub_area: 'adm' as const,
    titulo: 'Circular interna de promoção a assinar e quadro de avisos',
    descricao:
      'Circular de normas de segurança e política de quebras afixada no quadro de avisos da loja com confirmação fotográfica.',
    prioridade: 'media' as const,
    status: 'resolvida' as const,
    responsavel: 'Administrativo Central',
    categoria_caso_uso: 'avisos_internos',
    prazo: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area:
      'Protocolo arquivado na pasta digital da unidade. Quadro de avisos regularizado.',
    respondido_por: 'Mariana ADM',
  },
  {
    sub_area: 'adm' as const,
    titulo: 'Renovação do alvará dos bombeiros e dedetização',
    descricao:
      'Envio do certificado de dedetização trimestral da loja para compor o prontuário de fiscalização.',
    prioridade: 'alta' as const,
    status: 'em_tratamento' as const,
    responsavel: 'ADM Predial',
    categoria_caso_uso: 'documentos_legais',
    prazo: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
  },

  // 4. Financeiro
  {
    sub_area: 'financeiro' as const,
    titulo: 'Comprovante de sangria e fechamento de tesouraria',
    descricao:
      'Divergência de R$ 42,50 no fechamento do cofre da frente de caixa. Anexo do espelho do terminal e comprovante de sangria.',
    prioridade: 'alta' as const,
    status: 'em_tratamento' as const,
    responsavel: 'Tesouraria Central',
    categoria_caso_uso: 'documentos_internos',
    prazo: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area:
      'Localizado comprovante de sangria offline no lote anterior. Ajuste financeiro lançado.',
    respondido_por: 'Fernanda Financeiro',
  },
  {
    sub_area: 'financeiro' as const,
    titulo: 'Fundo fixo da loja / reembolso de pequenos suprimentos',
    descricao:
      'Notas fiscais e recibos de compra de materiais de limpeza emergenciais para reposição do fundo de caixa.',
    prioridade: 'media' as const,
    status: 'resolvida' as const,
    responsavel: 'Contas a Pagar',
    categoria_caso_uso: 'documentos_internos',
    prazo: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area: 'Reembolso aprovado e creditado na conta de despesas miúdas da loja.',
    respondido_por: 'Fernanda Financeiro',
  },

  // 5. Fiscal
  {
    sub_area: 'fiscal' as const,
    titulo: 'Inconsistência de alíquota ICMS/NCM no recebimento de mercadorias',
    descricao:
      'NF-e de fornecedor com CFOP divergente na entrada de bebidas. Foto do DANFE e do espelho fiscal da loja.',
    prioridade: 'urgente' as const,
    status: 'recebida' as const,
    responsavel: 'Controladoria Fiscal',
    categoria_caso_uso: 'documentos_legais',
    prazo: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area:
      'Analista fiscal acionou o comprador para carta de correção eletrônica (CC-e) do fornecedor.',
    respondido_por: 'Lucas Fiscal',
  },
  {
    sub_area: 'fiscal' as const,
    titulo: 'Emissão de nota fiscal de descarte e perda por avaria/vencimento',
    descricao:
      'Solicitação de geração de NF de baixa de estoque fiscal para o lote de perecíveis descartados da semana.',
    prioridade: 'media' as const,
    status: 'resolvida' as const,
    responsavel: 'Fiscal Central',
    categoria_caso_uso: 'documentos_internos',
    prazo: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    solicitante_nome: 'Gerente da Loja',
    resposta_area:
      'NF-e de perda/baixa autorizada pela SEFAZ. Chave de acesso arquivada no módulo Perdas.',
    respondido_por: 'Lucas Fiscal',
  },
]

export const admRhService = {
  /**
   * Lista demandas com filtros dinâmicos
   */
  async listarDemandas(params: ListAdmRhDemandasParams = {}): Promise<AdmRhDemanda[]> {
    const filters: string[] = []

    if (params.redeId) {
      filters.push(`rede = "${params.redeId}"`)
    }
    if (params.lojaId) {
      filters.push(`loja = "${params.lojaId}"`)
    }
    if (params.subArea) {
      filters.push(`sub_area = "${params.subArea}"`)
    }
    if (params.status) {
      filters.push(`status = "${params.status}"`)
    }
    if (params.prioridade) {
      filters.push(`prioridade = "${params.prioridade}"`)
    }
    if (params.busca && params.busca.trim()) {
      const q = params.busca.replace(/"/g, '\\"')
      filters.push(
        `(titulo ~ "${q}" || descricao ~ "${q}" || responsavel ~ "${q}" || solicitante_nome ~ "${q}")`,
      )
    }

    const filterStr = filters.join(' && ')

    try {
      const records = await pb.collection('adm_rh_demandas').getFullList<AdmRhDemanda>({
        filter: filterStr || undefined,
        sort: '-created',
        expand: 'rede,loja,solicitante_usuario',
      })
      return records
    } catch (err) {
      console.warn('Erro ao consultar adm_rh_demandas:', err)
      return []
    }
  },

  /**
   * Garante seed de exemplos caso a base esteja vazia para a rede/loja
   */
  async inicializarExemplosSeVazio(redeId?: string, lojaId?: string): Promise<AdmRhDemanda[]> {
    try {
      const existentes = await this.listarDemandas({ redeId, lojaId })
      if (existentes.length > 0) {
        return existentes
      }

      // Se não há nenhuma demanda, cria os exemplos reduzidos
      const criados: AdmRhDemanda[] = []
      for (const ex of EXEMPLOS_ADM_RH_BASE) {
        const payload: Record<string, any> = {
          rede: redeId || undefined,
          loja: lojaId || undefined,
          sub_area: ex.sub_area,
          titulo: ex.titulo,
          descricao: ex.descricao,
          prioridade: ex.prioridade,
          status: ex.status,
          responsavel: ex.responsavel,
          categoria_caso_uso: ex.categoria_caso_uso,
          prazo: ex.prazo,
          solicitante_nome: ex.solicitante_nome,
          resposta_area: ex.resposta_area || undefined,
          respondido_por: ex.respondido_por || undefined,
          respondido_em: ex.resposta_area ? new Date().toISOString() : undefined,
          is_exemplo: true,
        }

        try {
          const rec = await pb.collection('adm_rh_demandas').create<AdmRhDemanda>(payload)
          criados.push(rec)
        } catch (itemErr) {
          console.warn('Erro ao semear exemplo individual Adm/RH:', itemErr)
        }
      }

      return await this.listarDemandas({ redeId, lojaId })
    } catch (err) {
      console.warn('Falha na inicialização de exemplos Adm/RH:', err)
      return []
    }
  },

  /**
   * Criação de nova demanda (com foto opcional)
   */
  async criarDemanda(data: CriarAdmRhDemandaData): Promise<AdmRhDemanda> {
    const formData = new FormData()

    if (data.redeId) formData.append('rede', data.redeId)
    if (data.lojaId) formData.append('loja', data.lojaId)
    formData.append('sub_area', data.subArea)
    formData.append('titulo', data.titulo.trim())
    if (data.descricao) formData.append('descricao', data.descricao.trim())
    formData.append('prioridade', data.prioridade)
    if (data.prazo) formData.append('prazo', data.prazo)
    formData.append('status', 'pendente')
    if (data.responsavel) formData.append('responsavel', data.responsavel.trim())
    if (data.solicitanteNome) formData.append('solicitante_nome', data.solicitanteNome.trim())
    if (data.solicitanteUsuarioId) formData.append('solicitante_usuario', data.solicitanteUsuarioId)
    if (data.categoriaCasoUso) formData.append('categoria_caso_uso', data.categoriaCasoUso)
    if (data.isExemplo) formData.append('is_exemplo', 'true')

    if (data.fotoFile) {
      formData.append('foto', data.fotoFile)
    }

    const rec = await pb.collection('adm_rh_demandas').create<AdmRhDemanda>(formData, {
      expand: 'rede,loja,solicitante_usuario',
    })
    return rec
  },

  /**
   * Tratamento / Resposta pela área responsável (com foto opcional de resposta)
   */
  async tratarDemanda(id: string, data: TratarAdmRhDemandaData): Promise<AdmRhDemanda> {
    const formData = new FormData()
    formData.append('status', data.status)
    formData.append('resposta_area', data.respostaArea.trim())
    formData.append('respondido_por', data.respondidoPor.trim())
    formData.append('respondido_em', new Date().toISOString())
    if (data.responsavel) {
      formData.append('responsavel', data.responsavel.trim())
    }
    if (data.fotoRespostaFile) {
      formData.append('foto_resposta', data.fotoRespostaFile)
    }

    const updated = await pb.collection('adm_rh_demandas').update<AdmRhDemanda>(id, formData, {
      expand: 'rede,loja,solicitante_usuario',
    })
    return updated
  },

  /**
   * Atualiza apenas o status
   */
  async atualizarStatus(id: string, status: StatusAdmRh): Promise<AdmRhDemanda> {
    return await pb
      .collection('adm_rh_demandas')
      .update<AdmRhDemanda>(id, { status }, { expand: 'rede,loja,solicitante_usuario' })
  },

  /**
   * Exclusão de demanda
   */
  async excluirDemanda(id: string): Promise<boolean> {
    return await pb.collection('adm_rh_demandas').delete(id)
  },

  /**
   * URLs de foto
   */
  getFotoUrl(demanda: AdmRhDemanda, thumb?: string): string | null {
    if (!demanda.foto) return null
    return pb.files.getURL(demanda, demanda.foto, { thumb })
  },

  getFotoRespostaUrl(demanda: AdmRhDemanda, thumb?: string): string | null {
    if (!demanda.foto_resposta) return null
    return pb.files.getURL(demanda, demanda.foto_resposta, { thumb })
  },
}
