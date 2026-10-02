import pb from '@/lib/pocketbase/client'
import type { FunnelEventType, FunnelEvent, ConsentRecord } from '@/types'
import { getOrCreateSessionId, detectarOrigem } from './analyticsService'

export const VERSAO_TERMOS_ATUAL = 'v1.0 — 2025'
export const VERSAO_PRIVACIDADE_ATUAL = 'v1.0 — 2025'
export const DURACAO_TRIAL_DIAS = 14
export const MAX_USUARIOS_TRIAL = 5

export interface RegistrarConsentimentoParams {
  userId?: string
  email: string
  nome?: string
  empresa?: string
  termosAceitos: boolean
  termosVersao?: string
  privacidadeAceita: boolean
  privacidadeVersao?: string
  receberNovidades?: boolean
}

export interface RegistrarEventoFunilParams {
  evento: FunnelEventType | string
  userId?: string
  userEmail?: string
  userNome?: string
  perfil?: string
  segmento?: string
  detalhes?: Record<string, unknown>
}

export interface StatusTrial {
  isTrial: boolean
  diasRestantes: number
  expirado: boolean
  expiresAt: Date | null
  startedAt: Date | null
  diaDoTeste: number
}

export const funnelService = {
  /**
   * Registra o consentimento jurídico e preferências de comunicação na collection 'consent_records'
   */
  async registrarConsentimento(
    params: RegistrarConsentimentoParams,
  ): Promise<ConsentRecord | null> {
    try {
      const record = await pb.collection('consent_records').create<ConsentRecord>({
        user: params.userId || undefined,
        email: params.email.trim().toLowerCase(),
        nome: params.nome?.trim() || '',
        empresa: params.empresa?.trim() || '',
        termos_aceitos: Boolean(params.termosAceitos),
        termos_versao: params.termosVersao || VERSAO_TERMOS_ATUAL,
        privacidade_aceita: Boolean(params.privacidadeAceita),
        privacidade_versao: params.privacidadeVersao || VERSAO_PRIVACIDADE_ATUAL,
        receber_novidades: Boolean(params.receberNovidades),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      })
      return record
    } catch (err) {
      console.warn('[funnelService] Não foi possível registrar consent_record:', err)
      return null
    }
  },

  /**
   * Registra um evento da jornada B2B na collection 'funnel_events'
   */
  async registrarEvento(params: RegistrarEventoFunilParams): Promise<FunnelEvent | null> {
    try {
      const sessaoId = getOrCreateSessionId()
      const search = typeof window !== 'undefined' ? window.location.search : ''
      const searchParams = new URLSearchParams(search)
      const detectado = detectarOrigem(searchParams)

      const payload = {
        evento: params.evento,
        sessao_id: sessaoId,
        user_email: params.userEmail?.toLowerCase().trim() || undefined,
        user_nome: params.userNome?.trim() || undefined,
        user_id: params.userId || undefined,
        perfil: params.perfil || undefined,
        segmento: params.segmento || undefined,
        origem: detectado.origem,
        detalhes: params.detalhes || {},
      }

      const record = await pb.collection('funnel_events').create<FunnelEvent>(payload)
      return record
    } catch (err) {
      // Falha silenciosa para não quebrar a navegação
      console.warn(`[funnelService] Falha ao registrar evento '${params.evento}':`, err)
      return null
    }
  },

  /**
   * Calcula o status do trial de 14 dias para um usuário
   */
  calcularStatusTrial(
    user:
      | {
          is_trial?: boolean
          trial_expires_at?: string
          trial_started_at?: string
          created?: string
          email?: string
        }
      | null
      | undefined,
  ): StatusTrial {
    if (!user) {
      return {
        isTrial: false,
        diasRestantes: 0,
        expirado: false,
        expiresAt: null,
        startedAt: null,
        diaDoTeste: 0,
      }
    }

    // Se o usuário não é trial explicitly, checa se tem expires_at ou is_trial flag
    const isTrial = Boolean(user.is_trial || user.trial_expires_at)
    if (!isTrial) {
      return {
        isTrial: false,
        diasRestantes: 0,
        expirado: false,
        expiresAt: null,
        startedAt: null,
        diaDoTeste: 0,
      }
    }

    const agora = new Date()
    let expiresAt: Date
    let startedAt: Date

    if (user.trial_expires_at) {
      expiresAt = new Date(user.trial_expires_at)
    } else {
      startedAt = user.trial_started_at
        ? new Date(user.trial_started_at)
        : user.created
          ? new Date(user.created)
          : new Date()
      expiresAt = new Date(startedAt.getTime() + DURACAO_TRIAL_DIAS * 24 * 60 * 60 * 1000)
    }

    startedAt = user.trial_started_at
      ? new Date(user.trial_started_at)
      : user.created
        ? new Date(user.created)
        : new Date(expiresAt.getTime() - DURACAO_TRIAL_DIAS * 24 * 60 * 60 * 1000)

    const msRestantes = expiresAt.getTime() - agora.getTime()
    const diasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)))
    const msCorridos = agora.getTime() - startedAt.getTime()
    const diaDoTeste = Math.min(14, Math.max(1, Math.floor(msCorridos / (1000 * 60 * 60 * 24)) + 1))
    const expirado = msRestantes <= 0

    return {
      isTrial: true,
      diasRestantes,
      expirado,
      expiresAt,
      startedAt,
      diaDoTeste,
    }
  },

  /**
   * Obtém as métricas agregadas do funil para o painel do gestor
   */
  async getMetricasFunil(dias: number = 30) {
    try {
      const dataCorte = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const events = await pb.collection('funnel_events').getFullList<FunnelEvent>({
        filter: `created >= "${dataCorte}"`,
        sort: '-created',
      })

      const contagem: Record<string, number> = {
        visitou_previa: 0,
        iniciou_cadastro: 0,
        criou_conta: 0,
        primeiro_acesso: 0,
        criou_primeira_demanda: 0,
        direcionou_primeira_acao: 0,
        convidou_usuarios: 0,
        acoes_concluidas: 0,
        solicitou_demonstracao: 0,
      }

      events.forEach((ev) => {
        if (typeof contagem[ev.evento] === 'number') {
          contagem[ev.evento]++
        }
      })

      return {
        totalEventos: events.length,
        contagem,
        eventosRecentes: events.slice(0, 20),
      }
    } catch (err) {
      console.warn('[funnelService] Erro ao buscar métricas do funil:', err)
      return {
        totalEventos: 0,
        contagem: {
          visitou_previa: 0,
          iniciou_cadastro: 0,
          criou_conta: 0,
          primeiro_acesso: 0,
          criou_primeira_demanda: 0,
          direcionou_primeira_acao: 0,
          convidou_usuarios: 0,
          acoes_concluidas: 0,
          solicitou_demonstracao: 0,
        },
        eventosRecentes: [],
      }
    }
  },
}
