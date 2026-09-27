import pb from '@/lib/pocketbase/client'
import type { VisitaAnalytics, ResumoAnalytics } from '@/types'

const SESSAO_STORAGE_KEY = 'vivavarejo_sessao_id'
const DEBOUNCE_VISITA_KEY = 'vivavarejo_last_visita'
const GESTOR_STORAGE_FLAG = 'vivavarejo_gestor_logado'

/**
 * Lista explícita de e-mails de Gestor Geral / Admin Interno que NUNCA devem ter acessos
 * gravados ou exibidos no Analytics de visitas.
 */
export const EMAILS_GESTOR_EXCLUIDOS: string[] = ['dfarias53@gmail.com']

/**
 * Lista de e-mails conhecidos de demonstração e teste liberados.
 * Devem ser SEMPRE contabilizados como visitantes identificados ("Demo").
 */
export const EMAILS_DEMO_LIBERADOS: string[] = ['demo@vivavarejo.com.br', 'teste@vivavarejo.com.br']

/**
 * Determina se um e-mail é de conta de demonstração/teste liberada.
 */
export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false
  const em = email.toLowerCase().trim()
  return (
    EMAILS_DEMO_LIBERADOS.some((demo) => demo === em) ||
    em.startsWith('demo@') ||
    em.startsWith('teste@')
  )
}

/**
 * Determina se o usuário atual é o Gestor Geral Dfarias ou tem perfil de administrador geral interno.
 */
export function isGestorOuAdminGeral(
  user?: {
    email?: string | null
    perfil?: string | null
    name?: string | null
  } | null,
): boolean {
  if (!user) return false
  const emailLower = (user.email || '').toLowerCase().trim()
  if (EMAILS_GESTOR_EXCLUIDOS.includes(emailLower) || emailLower.includes('dfarias')) {
    return true
  }
  if (user.perfil === 'admin') {
    return true
  }
  const nomeLower = (user.name || '').toLowerCase()
  if (nomeLower.includes('dfarias') && (user.perfil === 'admin' || !user.perfil)) {
    return true
  }
  return false
}

/**
 * Obtém ou inicializa um ID de sessão único e persistente no navegador.
 * Permite agrupar visitas e calcular visitantes únicos mesmo sem login.
 */
export function getOrCreateSessionId(): string {
  try {
    let sessaoId = localStorage.getItem(SESSAO_STORAGE_KEY)
    if (!sessaoId) {
      sessaoId = 'ses_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      localStorage.setItem(SESSAO_STORAGE_KEY, sessaoId)
    }
    return sessaoId
  } catch {
    return 'ses_' + Math.random().toString(36).substring(2, 15)
  }
}

/**
 * Detecta se o dispositivo é mobile (celular/tablet) ou desktop
 */
export function detectarDispositivo(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
    window.innerWidth <= 768
  return isMobile ? 'mobile' : 'desktop'
}

/**
 * Extrai a origem de tráfego de maneira legível:
 * Prioriza utm_source, parâmetros de URL ou referrer externo (LinkedIn, Instagram, Google, WhatsApp, Direto).
 */
export function detectarOrigem(
  searchParams: URLSearchParams,
  referrerUrl?: string,
): {
  origem: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
} {
  const utm_source = searchParams.get('utm_source') || undefined
  const utm_medium = searchParams.get('utm_medium') || undefined
  const utm_campaign = searchParams.get('utm_campaign') || undefined

  if (utm_source) {
    const s = utm_source.toLowerCase()
    if (
      s === 'site_oficial' ||
      s === 'siteoficial' ||
      s.includes('vivavarejo.com') ||
      s === 'site'
    ) {
      return { origem: 'site_oficial', utm_source, utm_medium, utm_campaign }
    }
    if (s.includes('linkedin')) return { origem: 'linkedin', utm_source, utm_medium, utm_campaign }
    if (s.includes('instagram') || s.includes('insta'))
      return { origem: 'instagram', utm_source, utm_medium, utm_campaign }
    if (s.includes('facebook') || s.includes('fb'))
      return { origem: 'facebook', utm_source, utm_medium, utm_campaign }
    if (s.includes('whatsapp') || s.includes('wa'))
      return { origem: 'whatsapp', utm_source, utm_medium, utm_campaign }
    if (s.includes('google')) return { origem: 'google', utm_source, utm_medium, utm_campaign }
    return { origem: s, utm_source, utm_medium, utm_campaign }
  }

  // Verificar referrer do navegador
  const ref =
    referrerUrl !== undefined
      ? referrerUrl
      : typeof document !== 'undefined'
        ? document.referrer
        : ''
  if (ref) {
    const r = ref.toLowerCase()
    // Acessos vindos da página principal oficial www.vivavarejo.com ou vivavarejo.com
    if (r.includes('vivavarejo.com')) {
      return { origem: 'site_oficial', utm_medium: 'referral' }
    }
    if (r.includes('linkedin.com') || r.includes('lnkd.in')) {
      return { origem: 'linkedin', utm_medium: 'referral' }
    }
    if (r.includes('instagram.com') || r.includes('l.instagram.com')) {
      return { origem: 'instagram', utm_medium: 'referral' }
    }
    if (r.includes('facebook.com') || r.includes('fb.com')) {
      return { origem: 'facebook', utm_medium: 'referral' }
    }
    if (r.includes('whatsapp.com') || r.includes('wa.me')) {
      return { origem: 'whatsapp', utm_medium: 'referral' }
    }
    if (r.includes('google.com') || r.includes('google.com.br')) {
      return { origem: 'google', utm_medium: 'organic' }
    }
    if (r.includes('t.co') || r.includes('twitter.com') || r.includes('x.com')) {
      return { origem: 'twitter/x', utm_medium: 'referral' }
    }
    try {
      const parsedHost = new URL(ref).hostname
      // Se não for o próprio domínio do app
      if (typeof window !== 'undefined' && parsedHost !== window.location.hostname) {
        return { origem: parsedHost, utm_medium: 'referral' }
      }
    } catch {
      // url inválida
    }
  }

  return { origem: 'direto' }
}

export interface RegistrarVisitaOptions {
  pagina?: string
  userEmail?: string
  userName?: string
  userPerfil?: string
  isAdmin?: boolean
  cadastrou?: boolean
  search?: string
}

export const analyticsService = {
  /**
   * Registra uma visita/acesso anônimo ou identificado com debounce.
   */
  async registrarVisita(options?: RegistrarVisitaOptions): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      const pathname = options?.pagina || window.location.pathname
      const search = options?.search || window.location.search
      const searchParams = new URLSearchParams(search)

      const sessaoId = getOrCreateSessionId()
      const dispositivo = detectarDispositivo()
      const { origem, utm_source, utm_medium, utm_campaign } = detectarOrigem(
        searchParams,
        document.referrer,
      )

      // Identificação do usuário logado (se houver)
      let userEmail = options?.userEmail
      let userNome = options?.userName
      let userPerfil = options?.userPerfil
      let isAdmin = options?.isAdmin || false

      // Verifica sessão salva previamente como gestor
      try {
        if (sessionStorage.getItem(GESTOR_STORAGE_FLAG) === 'true') {
          return // Acesso do gestor geral Dfarias — desconsiderar totalmente
        }
      } catch {
        // ignore
      }

      if (pb.authStore.isValid && pb.authStore.record) {
        const rec = pb.authStore.record as {
          email?: string
          name?: string
          perfil?: string
          cargo?: string
        }
        if (!userEmail) userEmail = rec.email
        if (!userNome) userNome = rec.name
        if (!userPerfil) userPerfil = rec.perfil || rec.cargo

        if (
          isGestorOuAdminGeral(rec) ||
          isGestorOuAdminGeral({ email: userEmail, perfil: userPerfil, name: userNome })
        ) {
          isAdmin = true
          try {
            sessionStorage.setItem(GESTOR_STORAGE_FLAG, 'true')
          } catch {
            // ignore
          }
        }
      }

      // Se o usuário for gestor geral/admin, NÃO registrar para não poluir os dados do painel
      if (
        isAdmin ||
        isGestorOuAdminGeral({ email: userEmail, perfil: userPerfil, name: userNome })
      ) {
        return
      }

      // Debounce simples: não registrar a mesma página na mesma sessão em menos de 10 segundos
      const debounceKey = `${sessaoId}:${pathname}`
      const lastVisitTimeStr = sessionStorage.getItem(DEBOUNCE_VISITA_KEY)
      const now = Date.now()
      if (lastVisitTimeStr) {
        try {
          const parsed = JSON.parse(lastVisitTimeStr) as { key: string; time: number }
          if (parsed.key === debounceKey && now - parsed.time < 10000) {
            // Ignora disparo duplicado consecutivo
            return
          }
        } catch {
          // ignore
        }
      }
      sessionStorage.setItem(DEBOUNCE_VISITA_KEY, JSON.stringify({ key: debounceKey, time: now }))

      const payload = {
        pagina: pathname || '/',
        origem: origem || 'direto',
        utm_source: utm_source || '',
        utm_medium: utm_medium || '',
        utm_campaign: utm_campaign || '',
        dispositivo,
        sessao_id: sessaoId,
        user_email: userEmail || '',
        user_nome: userNome || '',
        user_perfil: userPerfil || '',
        cadastrou: options?.cadastrou || false,
        is_admin: false,
        referrer: document.referrer ? document.referrer.substring(0, 250) : '',
        user_agent: navigator.userAgent ? navigator.userAgent.substring(0, 250) : '',
      }

      await pb.collection('visitas').create(payload)
    } catch (err) {
      // Analytics não deve interromper fluxo do app se falhar
      console.warn('analyticsService.registrarVisita aviso:', err)
    }
  },

  /**
   * Marca que a sessão atual concluiu um cadastro com sucesso.
   * Se já existirem registros anteriores da sessão, atualiza-os ou salva a flag.
   */
  async marcarCadastroConcluido(email?: string): Promise<void> {
    try {
      const sessaoId = getOrCreateSessionId()
      // Registra uma visita na rota de sucesso/onboarding já com cadastrou = true
      await this.registrarVisita({
        pagina: window.location.pathname || '/cadastro-sucesso',
        userEmail: email,
        cadastrou: true,
      })
    } catch {
      // silent
    }
  },

  /**
   * Busca e processa as estatísticas consolidadas para o Gestor Geral.
   * Permite filtrar por: 'hoje', '7dias', '30dias'.
   */
  async getResumoAnalytics(
    periodo: 'hoje' | '7dias' | '30dias' = '7dias',
  ): Promise<ResumoAnalytics> {
    // Calcula a data limite de corte
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    let dataCorte = new Date()
    if (periodo === 'hoje') {
      dataCorte = hoje
    } else if (periodo === '7dias') {
      dataCorte = new Date(hoje.getTime() - 6 * 24 * 60 * 60 * 1000)
    } else {
      // 30 dias
      dataCorte = new Date(hoje.getTime() - 29 * 24 * 60 * 60 * 1000)
    }

    const isoCorte = dataCorte.toISOString().replace('T', ' ').substring(0, 19)

    // Filtro PocketBase: excluir visitas marcadas como is_admin = true e e-mail dfarias
    const filter = `created >= '${isoCorte}' && is_admin != true && user_email !~ 'dfarias'`

    // Busca até 5000 registros para o período (paginado em lote completo)
    const todasVisitas = await pb.collection('visitas').getFullList<VisitaAnalytics>({
      filter,
      sort: '-created',
      requestKey: null,
    })

    // Filtro em memória estrito para garantir que NENHUM acesso do gestor Dfarias ou admin apareça:
    // Contas DEMO e TESTE (demo@vivavarejo.com.br, teste@vivavarejo.com.br) e visitantes externos/anônimos são MANTIDOS e contabilizados normalmente.
    const visitas = todasVisitas.filter((v) => {
      if (v.is_admin) return false
      if (isGestorOuAdminGeral({ email: v.user_email, perfil: v.user_perfil, name: v.user_nome })) {
        return false
      }
      return true
    })

    // Contagem de signups no período diretamente da collection users para precisão real
    let totalCadastros = 0
    try {
      const usersPeriodo = await pb.collection('users').getFullList({
        filter: `created >= '${isoCorte}' && email != 'dfarias53@gmail.com' && email !~ 'dfarias'`,
        requestKey: null,
      })
      totalCadastros = usersPeriodo.length
    } catch {
      // fallback: somar da collection visitas
      const sessoesCadastradas = new Set(
        visitas
          .filter((v) => v.cadastrou || (v.pagina.includes('cadastro') && v.user_email))
          .map((v) => v.sessao_id),
      )
      totalCadastros = sessoesCadastradas.size
    }

    // Métricas
    const totalAcessos = visitas.length
    const sessoesUnicas = new Set(visitas.map((v) => v.sessao_id))
    const visitantesUnicos = sessoesUnicas.size

    // Taxa de conversão: cadastros / visitantes únicos
    const taxaConversao = visitantesUnicos > 0 ? (totalCadastros / visitantesUnicos) * 100 : 0

    // Origens
    const origensCount: Record<string, number> = {}
    for (const v of visitas) {
      let orig = (v.origem || 'direto').toLowerCase().trim()
      if (orig === 'direct' || !orig) orig = 'direto'
      origensCount[orig] = (origensCount[orig] || 0) + 1
    }

    const nomesOrigensMap: Record<string, string> = {
      site_oficial: 'Site Oficial (vivavarejo.com)',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      facebook: 'Facebook',
      whatsapp: 'WhatsApp',
      google: 'Google (Busca)',
      direto: 'Acesso Direto (Digitou URL)',
      'twitter/x': 'X / Twitter',
    }

    const origensRanking = Object.entries(origensCount)
      .map(([origem, quantidade]) => ({
        origem,
        nomeAmigavel: nomesOrigensMap[origem] || origem,
        quantidade,
        percentual: totalAcessos > 0 ? (quantidade / totalAcessos) * 100 : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)

    // Páginas mais visitadas
    const paginasCount: Record<string, number> = {}
    for (const v of visitas) {
      let p = (v.pagina || '/').trim()
      if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1)
      paginasCount[p] = (paginasCount[p] || 0) + 1
    }

    const nomesPaginasMap: Record<string, string> = {
      '/': 'Página Inicial (Indicadores)',
      '/bem-vindo': 'Página de Boas-Vindas / Apresentação',
      '/login': 'Página de Login',
      '/signup': 'Página de Cadastro',
      '/cadastro': 'Página de Cadastro',
      '/anuncio.html': 'Anúncio 1200×628 (Execução em Loja)',
      '/carrossel.html': 'Carrossel de Slides (Demonstração)',
      '/meu-dia': 'Meu Dia',
      '/agenda': 'Agenda de Rotinas',
      '/rotinas': 'Rotinas & Modelos',
      '/validades': 'Controle de Validades',
      '/perdas': 'Perdas & Inventário',
      '/comercial': 'Comercial & Negociações',
      '/adm-rh': 'Adm/RH',
      '/admin': 'Painel Administrativo',
    }

    const paginasRanking = Object.entries(paginasCount)
      .map(([pagina, quantidade]) => ({
        pagina,
        nomeAmigavel: nomesPaginasMap[pagina] || pagina,
        quantidade,
        percentual: totalAcessos > 0 ? (quantidade / totalAcessos) * 100 : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)

    // Dispositivos e distinção de Usuário Identificado vs Anônimo
    let mobileCount = 0
    let desktopCount = 0
    let totalIdentificados = 0
    let totalAnonimos = 0

    for (const v of visitas) {
      if (v.dispositivo === 'mobile') mobileCount++
      else desktopCount++

      const isIdentificado = Boolean(
        (v.user_email && v.user_email.trim()) || (v.user_nome && v.user_nome.trim()),
      )

      if (isIdentificado) {
        totalIdentificados++
      } else {
        totalAnonimos++
      }
    }

    // Obter as 150 visitas mais recentes para listagem no painel
    const visitasRecentes = visitas.slice(0, 150)

    // Gráfico de acessos por dia
    // Monta todos os dias do período (para não ficar com buraco)
    const diasRange: string[] = []
    const numDias = periodo === 'hoje' ? 1 : periodo === '7dias' ? 7 : 30
    for (let i = numDias - 1; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      diasRange.push(`${yyyy}-${mm}-${dd}`)
    }

    const visitasPorDia: Record<string, { total: number; sessoes: Set<string> }> = {}
    for (const dia of diasRange) {
      visitasPorDia[dia] = { total: 0, sessoes: new Set() }
    }

    for (const v of visitas) {
      const diaIso = (v.created || '').substring(0, 10)
      if (visitasPorDia[diaIso]) {
        visitasPorDia[diaIso].total++
        visitasPorDia[diaIso].sessoes.add(v.sessao_id)
      }
    }

    const acessosPorDia = diasRange.map((dia) => {
      const [ano, mes, d] = dia.split('-')
      const hojeStr = hoje.toISOString().substring(0, 10)
      const dataLabel = dia === hojeStr ? 'Hoje' : `${d}/${mes}`
      const info = visitasPorDia[dia] || { total: 0, sessoes: new Set() }
      return {
        data: dia,
        dataLabel,
        quantidade: info.total,
        visitantesUnicos: info.sessoes.size,
      }
    })

    return {
      totalAcessos,
      visitantesUnicos,
      totalCadastros,
      taxaConversao: Math.round(taxaConversao * 10) / 10,
      totalIdentificados,
      totalAnonimos,
      origensRanking,
      paginasRanking,
      acessosPorDia,
      dispositivos: {
        mobile: mobileCount,
        desktop: desktopCount,
      },
      visitasRecentes,
    }
  },
}

export default analyticsService
