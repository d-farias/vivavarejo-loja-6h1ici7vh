import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  User,
  ShoppingBag,
  UtensilsCrossed,
  Pill,
  Sparkles,
  Dog,
  Store,
  Mail,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Instagram,
  Linkedin,
  CalendarCheck,
  Camera,
  BadgeAlert,
  Users2,
  GitBranch,
  TrendingUp,
  Lock,
  MessageSquare,
  Clock,
  PlayCircle,
  AlertCircle,
  FileText,
  MapPin,
  ListTodo,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { TipoPessoaCliente } from '@/types'
import { useContatosAtendimento } from '@/hooks/use-contatos-atendimento'
import { APP_VERSION_LABEL } from '@/lib/version'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ProtecaoDadosSecao } from '@/components/ProtecaoDadosSecao'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useI18n } from '@/lib/i18n/context'

const INSTAGRAM_URL = 'https://www.vivavarejo.com?utm_source=instagram'
const LINKEDIN_PERSONAL_URL = 'https://www.vivavarejo.com?utm_source=linkedin'

interface SegmentOption {
  id: string
  label: string
  icon: typeof ShoppingBag
  description: string
}

interface ExemploRotina {
  titulo: string
  descricao: string
}

const EXEMPLOS_ROTINAS_POR_SEGMENTO: Record<string, ExemploRotina[]> = {
  Açougue: [
    {
      titulo: 'Temperatura de câmara fria e balcão',
      descricao: 'Aferição matinal e vespertina das câmaras e balcões com registro de conformidade',
    },
    {
      titulo: 'Afiação/higienização de serras e moedores',
      descricao: 'Desmonte, sanitização química e conferência de segurança e afiação das lâminas',
    },
    {
      titulo: 'FIFO e maturação a vácuo',
      descricao:
        'Conferência de primeiro que entra, primeiro que sai e integridade das embalagens a vácuo',
    },
  ],
  Farmácia: [
    {
      titulo: 'Registro de temperatura da geladeira de medicamentos',
      descricao: 'Controle contínuo de termolábeis entre +2°C e +8°C com apontamento obrigatório',
    },
    {
      titulo: 'Auditoria de validade com alerta 90 dias',
      descricao: 'Varredura preventiva de lotes a vencer para evitar perdas e recolhimento prévio',
    },
    {
      titulo: 'Contagem de psicotrópicos SNGPC',
      descricao:
        'Conferência diária do armário restrito com conferência física versus livro/sistema',
    },
  ],
  'Padaria/Confeitaria': [
    {
      titulo: 'Higienização de fornos e masseiras',
      descricao: 'Checklist rigoroso de limpeza pós-forneio e esterilização dos tachos',
    },
    {
      titulo: 'Controle de fermentação e validade de fatiados',
      descricao:
        'Acompanhamento do tempo de câmara de fermentação e etiquetagem padrão de fatiados',
    },
  ],
  'Moda/Confecção': [
    {
      titulo: 'Vitrine e reposição por grade/tamanho',
      descricao:
        'Conferência do padrão visual de manequins e reposição ágil de numerações faltantes',
    },
    {
      titulo: 'Conferência de antifurto em peças de alto valor',
      descricao: 'Inspeção do travamento de sensores magnéticos em casacos, jeans e peças nobres',
    },
  ],
  'Pet Shop': [
    {
      titulo: 'Desinfecção do setor de banho e tosa',
      descricao: 'Higienização e esterilização de lâminas, baias e toalhas entre atendimentos',
    },
    {
      titulo: 'Auditoria de rações a granel',
      descricao: 'Controle de vedação, umidade, data de lote e rodízio FIFO nas caixas de granel',
    },
  ],
  'Restaurante/Alimentação': [
    {
      titulo: 'Etiquetagem e validade de pré-preparados',
      descricao: 'Identificação visual obrigatória com data de manipulação e validade secundária',
    },
    {
      titulo: 'Temperatura de cocção e banho-maria',
      descricao: 'Monitoramento térmico da pista quente acima de 60°C para garantia sanitária',
    },
  ],
  'Supermercado/Mercearia': [
    {
      titulo: 'Ruptura na abertura',
      descricao:
        'Varredura nos corredores principais antes de abrir as portas para reposição de gôndola',
    },
    {
      titulo: 'Validade de laticínios e frios',
      descricao: 'Auditoria de lotes próximos ao vencimento e aplicação do rodízio preventivo',
    },
  ],
}

const EXEMPLO_GENERICO_LOJA: ExemploRotina[] = [
  {
    titulo: 'Checklist de abertura e fechamento de caixa',
    descricao: 'Conferência de fundo de troco, suprimentos e batimento financeiro de encerramento',
  },
  {
    titulo: 'Auditoria de precificação e exposição de loja',
    descricao:
      'Conferência entre etiqueta de gôndola e leitor de código de barras para evitar atrito no caixa',
  },
  {
    titulo: 'Prevenção de quebras e controle de estoque',
    descricao:
      'Contagem rotativa dos itens de maior giro e verificação de itens danificados ou avariados',
  },
]

const SEGMENT_OPTIONS: SegmentOption[] = [
  {
    id: 'Supermercado/Mercearia',
    label: 'Supermercado/Mercearia',
    icon: UtensilsCrossed,
    description: 'Mercados, mercearias e minimercados',
  },
  {
    id: 'Açougue',
    label: 'Açougue / Carnes',
    icon: UtensilsCrossed,
    description: 'Casas de carnes, boutiques de cortes e peixarias',
  },
  {
    id: 'Padaria/Confeitaria',
    label: 'Padaria / Confeitaria',
    icon: Sparkles,
    description: 'Panificação, confeitarias, bistrôs e empórios',
  },
  {
    id: 'Farmácia',
    label: 'Farmácia / Drogaria',
    icon: Pill,
    description: 'Drogarias, farmácias e dermocosméticos',
  },
  {
    id: 'Moda/Confecção',
    label: 'Moda / Confecção',
    icon: ShoppingBag,
    description: 'Lojas de roupas, calçados e acessórios',
  },
  {
    id: 'Pet Shop',
    label: 'Pet Shop / Veterinária',
    icon: Dog,
    description: 'Pet shops, clínicas, rações e banho & tosa',
  },
  {
    id: 'Restaurante/Alimentação',
    label: 'Restaurante / Alimentação',
    icon: UtensilsCrossed,
    description: 'Restaurantes, lanchonetes e alimentação fora do lar',
  },
  {
    id: 'Outro',
    label: 'Outro Segmento',
    icon: Store,
    description: 'Materiais de construção, óticas, eletrônicos ou outros',
  },
]

export default function BemVindo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const { contatos } = useContatosAtendimento()

  // Detecta se o visitante é o Gestor Geral (Dfarias — perfil 'admin' ou email dfarias53@gmail.com)
  const authRecord =
    pb.authStore.isValid && pb.authStore.record
      ? (pb.authStore.record as { email?: string; perfil?: string })
      : null
  const currentUserEmail = user?.email || authRecord?.email || ''
  const currentUserPerfil = user?.perfil || authRecord?.perfil || ''
  const isGestorGeral =
    currentUserPerfil === 'admin' || currentUserEmail.toLowerCase() === 'dfarias53@gmail.com'

  // Modal de Proteção de Dados
  const [modalProtecaoOpen, setModalProtecaoOpen] = useState(false)
  // Modal de Falar com Especialista
  const [modalEspecialistaOpen, setModalEspecialistaOpen] = useState(false)

  // Funil de interesse em 2 passos
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoaCliente | null>(null)
  const [segmento, setSegmento] = useState<string | null>(null)
  const [outroSegmento, setOutroSegmento] = useState('')

  const isStep1Complete = tipoPessoa !== null
  const isStep2Complete =
    segmento !== null && (segmento !== 'Outro' || outroSegmento.trim().length > 0)
  const canContinue = isStep1Complete && isStep2Complete

  const handleContinue = () => {
    if (!canContinue) return
    const finalSegmento = segmento === 'Outro' ? outroSegmento.trim() || 'Outro' : segmento
    const params = new URLSearchParams()
    if (tipoPessoa) {
      params.set('tipo', tipoPessoa)
      params.set('perfil', tipoPessoa === 'PJ' ? 'rede' : 'gerente')
    }
    if (finalSegmento) params.set('segmento', finalSegmento)

    navigate(`/signup?${params.toString()}`, {
      state: {
        tipoPessoa,
        profileType: tipoPessoa === 'PJ' ? 'rede' : 'gerente',
        segmento: finalSegmento,
      },
    })
  }

  const handleScrollToInterest = () => {
    const el = document.getElementById('opcao-interesse')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2937] flex flex-col font-sans">
      {/* Header sóbrio: apenas marca à esquerda e botão Entrar à direita com seletor de idioma */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight">
              {t.common.appName}
            </span>
          </Link>

          {/* Área de Ações: Seletor de Idioma lado a lado com Entrar */}
          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
            <LanguageSelector />
            {!isGestorGeral && (
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] hover:text-[#0F766E] rounded-lg transition-colors font-semibold shadow-2xs"
              >
                {t.common.login}
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* HERO: Da prioridade à execução (com mockup real da tela Meu Dia à direita) */}
        <section className="pt-10 pb-14 sm:pt-16 sm:pb-16 px-4 sm:px-6 border-b border-[#E5E7EB] bg-[#F7F7F5]">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Coluna Esquerda: Texto do Hero enxuto + CTAs */}
              <div className="lg:col-span-6 space-y-5 text-left">
                {/* Chip discreto */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0F766E] shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#0F766E]" />
                  <span>{t.landing.badgeHero}</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F2937] tracking-tight leading-[1.15]">
                    {t.landing.heroTitle}
                  </h1>
                  <p className="text-base sm:text-lg font-semibold text-[#0F766E] leading-snug">
                    {t.landing.heroSubtitle}
                  </p>
                  <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                    {t.landing.heroParagraph}
                  </p>
                </div>

                {/* CTAs comerciais (ocultados para o Gestor Geral) */}
                {!isGestorGeral && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleScrollToInterest}
                        className="px-5 py-3 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm tracking-wide uppercase rounded-xl shadow-xs transition-all hover:scale-[1.01] inline-flex items-center justify-center gap-2"
                      >
                        <span>{t.landing.btnSeePlatform}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalEspecialistaOpen(true)}
                        className="px-5 py-3 bg-white hover:bg-gray-50 border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] hover:text-[#0F766E] font-bold text-xs sm:text-sm tracking-wide uppercase rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <MessageSquare className="w-4 h-4 text-[#0F766E]" />
                        <span>{t.landing.btnRequestDemo}</span>
                      </button>
                    </div>

                    {/* Frase de apoio sob os botões */}
                    <p className="text-xs text-[#6B7280]">{t.landing.heroTargetAudience}</p>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Representação REAL do sistema ("Meu Dia") em HTML/CSS nativo */}
              <div className="lg:col-span-6 w-full">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-md overflow-hidden">
                  {/* Barra da janela / identificação */}
                  <div className="bg-[#1F2937] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#374151]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="ml-2 text-xs font-semibold tracking-wide text-gray-200">
                        {t.common.appName} • {t.landing.previewScreenName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-white/10 text-emerald-300 px-2 py-0.5 rounded">
                      {t.landing.previewLiveBadge}
                    </span>
                  </div>

                  {/* Sub-header da tela Meu Dia */}
                  <div className="p-3.5 sm:p-4 bg-[#F7F7F5] border-b border-[#E5E7EB] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                        VV
                      </div>
                      <div>
                        <div className="font-bold text-[#1F2937] leading-tight">
                          {t.landing.previewStoreName}
                        </div>
                        <div className="text-[10px] text-[#6B7280] leading-tight">
                          {t.landing.previewSupplierText}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      {t.landing.previewProgressText}
                    </span>
                  </div>

                  {/* Conteúdo fiel ao MeuDia.tsx */}
                  <div className="p-4 space-y-3 bg-[#F7F7F5]">
                    {/* Card 1: Próxima Visita com borda teal */}
                    <div className="bg-white rounded-xl border border-teal-600/40 shadow-2xs overflow-hidden">
                      <div className="bg-gradient-to-r from-[#0F766E] to-[#115E59] px-3.5 py-1.5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-white" />
                          <span>{t.landing.previewNextVisitTitle}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {t.landing.previewCheckinBadge}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1F2937]">
                            {t.landing.previewStoreName}
                          </span>
                          <span className="text-[11px] font-bold font-mono text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.landing.previewTimeText}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="bg-gray-100 text-[#374151] px-2 py-0.5 rounded font-medium">
                            {t.landing.previewTaskCount}
                          </span>
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold">
                            {t.landing.previewPriorityCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Motor Faça Agora (borda rose) */}
                    <div className="p-3.5 rounded-xl border-2 border-rose-500 bg-rose-500/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                          {t.landing.previewDoNowTitle}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-rose-700">08:30</span>
                      </div>
                      <div className="text-xs font-bold text-[#1F2937] leading-snug">
                        {t.landing.previewDoNowTask}
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-tight">
                        {t.landing.previewDoNowDesc}
                      </p>
                      <div className="pt-1.5 flex items-center justify-between border-t border-rose-200/60 text-[10px]">
                        <span className="text-[#6B7280]">{t.landing.previewDoNowOwner}</span>
                        <span className="bg-rose-600 text-white font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                          <PlayCircle className="w-3 h-3" />
                          {t.landing.previewDoNowAction}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Depois (borda amber discreta) */}
                    <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/40 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {t.landing.previewLaterTitle}
                        </div>
                        <div className="text-xs font-semibold text-[#1F2937] truncate">
                          {t.landing.previewLaterTask}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#0F766E] shrink-0">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. NOVA SEÇÃO DA DOR: O desafio não é apenas identificar... */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-[#E5E7EB]">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight leading-tight">
                {t.landing.painSectionTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                {t.landing.painSectionParagraph}
              </p>
            </div>

            {/* 4 situações em cards pequenos e sóbrios (ícone + frase curta) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#1F2937] leading-snug">
                  {t.landing.pain1Title}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <ListTodo className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#1F2937] leading-snug">
                  {t.landing.pain2Title}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Users2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#1F2937] leading-snug">
                  {t.landing.pain3Title}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 text-[#4B5563] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#1F2937] leading-snug">
                  {t.landing.pain4Title}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SEÇÃO MÓDULOS INTEGRADOS: 6 cards existentes + linha fina de fluxo conectando */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#F7F7F5] border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-[#0F766E]">
                {t.landing.modulesTag}
              </div>
            </div>

            {/* Linha fina de fluxo discreta conectando os 4 passos como correnteza */}
            <div className="flex items-center justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 bg-white rounded-full border border-[#E5E7EB] text-xs font-semibold text-[#374151] shadow-2xs">
                <span className="text-[#0F766E]">{t.landing.flowStep1}</span>
                <span className="text-gray-300 font-normal">→</span>
                <span className="text-[#0F766E]">{t.landing.flowStep2}</span>
                <span className="text-gray-300 font-normal">→</span>
                <span className="text-[#0F766E]">{t.landing.flowStep3}</span>
                <span className="text-gray-300 font-normal">→</span>
                <span className="text-[#0F766E]">{t.landing.flowStep4}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Módulo 1: Agenda & Meu Dia */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 transition-colors space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{t.landing.mod1Title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{t.landing.mod1Desc}</p>
              </div>

              {/* Módulo 2: Execução com Foto */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 transition-colors space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{t.landing.mod2Title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{t.landing.mod2Desc}</p>
              </div>

              {/* Módulo 3: Validades */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 transition-colors space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{t.landing.mod3Title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{t.landing.mod3Desc}</p>
              </div>

              {/* Módulo 4: Perdas & Inventário */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 transition-colors space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{t.landing.mod4Title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{t.landing.mod4Desc}</p>
              </div>

              {/* Módulo 5: Promotores & Visitas */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 transition-colors space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                  <Users2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{t.landing.mod5Title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{t.landing.mod5Desc}</p>
              </div>

              {/* Módulo 6: Workflow 5W2H */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 transition-colors space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                  <GitBranch className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">{t.landing.mod6Title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{t.landing.mod6Desc}</p>
              </div>
            </div>

            {/* 4. Linha discreta de cross-industry (sem cards artificiais de segmentos) */}
            <div className="pt-3 text-center">
              <p className="text-xs text-[#6B7280] italic">{t.landing.crossIndustryNote}</p>
            </div>
          </div>
        </section>

        {/* 7. Funil de interesse em 2 passos: PF/PJ e Segmento (ocultado para o Gestor Geral) */}
        {!isGestorGeral && (
          <section id="opcao-interesse" className="py-12 sm:py-16 px-4 sm:px-6 bg-[#F7F7F5]">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* Cabeçalho do Funil */}
                <div className="border-b border-[#E5E7EB] pb-4 space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                    <span>{t.landing.funnelTag}</span>
                    <span>•</span>
                    <span>
                      {isStep1Complete ? t.landing.funnelStep2Label : t.landing.funnelStep1Label}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
                    {t.landing.funnelTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                    {t.landing.funnelDesc}
                  </p>
                </div>

                {/* Passo 1: PF ou PJ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                          isStep1Complete ? 'bg-[#0F766E] text-white' : 'bg-gray-200 text-[#4B5563]'
                        }`}
                      >
                        1
                      </span>
                      <span>{t.landing.funnelStep1Title}</span>
                    </label>
                    {tipoPessoa && (
                      <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {tipoPessoa === 'PJ' ? t.landing.funnelPjTitle : t.landing.funnelPfTitle}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Cartão PJ */}
                    <button
                      type="button"
                      onClick={() => setTipoPessoa('PJ')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        tipoPessoa === 'PJ'
                          ? 'border-[#0F766E] bg-teal-50 ring-2 ring-[#0F766E]/20'
                          : 'border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                          CNPJ
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#1F2937]">
                        {t.landing.funnelPjTitle}
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                        {t.landing.funnelPjDesc}
                      </p>
                    </button>

                    {/* Cartão PF */}
                    <button
                      type="button"
                      onClick={() => setTipoPessoa('PF')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        tipoPessoa === 'PF'
                          ? 'border-[#0F766E] bg-teal-50 ring-2 ring-[#0F766E]/20'
                          : 'border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                          PF / MEI
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#1F2937]">
                        {t.landing.funnelPfTitle}
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                        {t.landing.funnelPfDesc}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Passo 2: Segmento */}
                {isStep1Complete && (
                  <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            isStep2Complete
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-gray-200 text-[#4B5563]'
                          }`}
                        >
                          2
                        </span>
                        <span>{t.landing.funnelStep2Title}</span>
                      </label>
                      {segmento && (
                        <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {segmento === 'Outro' && outroSegmento ? outroSegmento : segmento}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {SEGMENT_OPTIONS.map((seg) => {
                        const Icon = seg.icon
                        const isSelected = segmento === seg.id
                        return (
                          <button
                            key={seg.id}
                            type="button"
                            onClick={() => setSegmento(seg.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#0F766E] bg-teal-50 ring-2 ring-[#0F766E]/20'
                                : 'border-[#E5E7EB] bg-white hover:border-[#0F766E]/50 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                  isSelected
                                    ? 'bg-[#0F766E] text-white border-[#0F766E]'
                                    : 'bg-[#F7F7F5] border-[#E5E7EB] text-[#4B5563]'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                              )}
                            </div>
                            <div>
                              <div
                                className={`text-xs font-bold leading-tight ${
                                  isSelected ? 'text-[#0F766E]' : 'text-[#1F2937]'
                                }`}
                              >
                                {seg.label}
                              </div>
                              <p className="text-[10px] text-[#6B7280] mt-1 line-clamp-2">
                                {seg.description}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {segmento === 'Outro' && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                          {t.landing.funnelSpecifySegment}
                        </label>
                        <input
                          type="text"
                          value={outroSegmento}
                          onChange={(e) => setOutroSegmento(e.target.value)}
                          placeholder={t.landing.funnelSpecifyPlaceholder}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
                        />
                      </div>
                    )}

                    {/* Exemplos de rotinas */}
                    {segmento && (
                      <div className="mt-3.5 p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E7EB]">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-[#1F2937]">
                            {t.landing.funnelRoutineExamples}{' '}
                            {SEGMENT_OPTIONS.find((s) => s.id === segmento)?.label || segmento}:
                          </span>
                          <span className="text-[10px] font-semibold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {t.landing.funnelReadyModel}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {(EXEMPLOS_ROTINAS_POR_SEGMENTO[segmento] || EXEMPLO_GENERICO_LOJA).map(
                            (ex, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-3 rounded-xl border border-[#E5E7EB]"
                              >
                                <div className="text-xs font-bold text-[#1F2937] leading-snug">
                                  {ex.titulo}
                                </div>
                                <div className="text-[11px] text-[#6B7280] mt-1 leading-normal">
                                  {ex.descricao}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-[#4B5563]">
                    {!isStep1Complete ? (
                      <span>{t.landing.funnelPromptStep1}</span>
                    ) : !isStep2Complete ? (
                      <span>{t.landing.funnelPromptStep2}</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {t.landing.funnelPromptReady}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setModalEspecialistaOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-gray-50 border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>{t.common.talkToSpecialist}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={!canContinue}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <span>{t.common.continue}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Rodapé sóbrio */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-8 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-6">
          {/* Linha superior: Marca e links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F2937] tracking-wider uppercase">
                {t.common.appName}
              </span>
              <span className="text-xs text-[#6B7280]">{t.landing.footerTagline}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6B7280]">
              {!isGestorGeral && (
                <>
                  <Link to="/login" className="hover:text-[#0F766E] font-medium transition-colors">
                    {t.landing.footerAlreadyHaveAccount}
                  </Link>
                  <span className="text-gray-300 leading-none">•</span>
                  <button
                    type="button"
                    onClick={() => setModalEspecialistaOpen(true)}
                    className="hover:text-[#0F766E] font-medium transition-colors cursor-pointer"
                  >
                    {t.landing.footerTalkSpecialist}
                  </button>
                  <span className="text-gray-300 leading-none">•</span>
                  <button
                    type="button"
                    onClick={handleScrollToInterest}
                    className="hover:text-[#0F766E] font-medium transition-colors cursor-pointer"
                  >
                    {t.landing.footerSignup}
                  </button>
                  <span className="text-gray-300 leading-none">•</span>
                </>
              )}
              <Link
                to="/privacidade"
                className="hover:text-[#0F766E] font-medium transition-colors"
              >
                {t.landing.footerPrivacyPolicy}
              </Link>
              <span className="text-gray-300 leading-none">•</span>
              <Link to="/termos" className="hover:text-[#0F766E] font-medium transition-colors">
                {t.landing.footerTermsOfUse}
              </Link>
            </div>
          </div>

          {/* Acionador discreto: Sobre proteção */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-1 text-xs text-[#6B7280]">
            <button
              type="button"
              onClick={() => setModalProtecaoOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0F766E] transition-colors group cursor-pointer focus:outline-none"
            >
              <ShieldCheck className="w-4 h-4 text-[#0F766E] group-hover:scale-105 transition-transform shrink-0" />
              <span className="underline decoration-dotted underline-offset-4 group-hover:decoration-solid">
                {t.landing.footerAboutProtection}
              </span>
            </button>
            <span className="text-[11px] text-[#9CA3AF] inline-flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#9CA3AF] shrink-0" />
              <span>{t.landing.footerSecurityNote}</span>
            </span>
          </div>

          {/* Diálogo / Modal com os 6 pilares de proteção de dados */}
          <Dialog open={modalProtecaoOpen} onOpenChange={setModalProtecaoOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                  {t.landing.protectionModalTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6B7280]">
                  {t.landing.protectionModalDesc}
                </DialogDescription>
              </DialogHeader>

              <div className="pt-2">
                <ProtecaoDadosSecao />
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Falar com Especialista */}
          <FalarEspecialistaModal
            open={modalEspecialistaOpen}
            onOpenChange={setModalEspecialistaOpen}
            assuntoContexto="Demonstração VivaVarejo"
          />

          {/* Linha de contato e redes sociais com alinhamento rigoroso */}
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs text-[#6B7280]">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] shrink-0 mr-0.5">
                {t.landing.footerConnect}
              </span>

              {/* Instagram */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da VivaVarejo"
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:text-[#0F766E] hover:border-[#0F766E] transition-colors leading-none"
              >
                <Instagram className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-xs leading-none">Instagram</span>
              </a>

              {/* LinkedIn */}
              <a
                href={LINKEDIN_PERSONAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn da VivaVarejo"
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:text-[#0F766E] hover:border-[#0F766E] transition-colors leading-none"
              >
                <Linkedin className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-xs leading-none">LinkedIn</span>
              </a>

              {/* WhatsApp */}
              <a
                href={
                  contatos.whatsappRaw
                    ? `https://wa.me/${contatos.whatsappRaw}?text=${encodeURIComponent(
                        'Olá! Estou navegando na página do VivaVarejo e gostaria de tirar dúvidas.',
                      )}`
                    : 'https://wa.me/5548991817542?text=Ol%C3%A1!%20Estou%20navegando%20na%20p%C3%A1gina%20do%20VivaVarejo%20e%20gostaria%20de%20tirar%20d%C3%BAvidas.'
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp VivaVarejo"
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:text-[#0F766E] hover:border-[#0F766E] transition-colors leading-none"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.42C8.87 7.42 8.61 7.48 8.38 7.73C8.16 7.97 7.54 8.55 7.54 9.72C7.54 10.89 8.39 12.02 8.51 12.18C8.63 12.34 10.15 14.75 12.53 15.72C14.51 16.53 14.91 16.37 15.34 16.33C15.77 16.29 16.73 15.76 16.93 15.2C17.13 14.64 17.13 14.16 17.07 14.06C17.01 13.96 16.85 13.9 16.6 13.78C16.35 13.66 15.12 13.05 14.89 12.97C14.66 12.89 14.5 12.85 14.33 13.09C14.16 13.33 13.69 13.9 13.55 14.06C13.41 14.22 13.26 14.24 13.02 14.12C12.77 14 11.98 13.74 11.04 12.9C10.31 12.25 9.82 11.45 9.68 11.2C9.54 10.96 9.66 10.83 9.78 10.71C9.9 10.6 10.04 10.42 10.17 10.27C10.3 10.12 10.34 10.02 10.42 9.85C10.5 9.69 10.46 9.55 10.4 9.42C10.34 9.3 9.87 8.14 9.67 7.66C9.48 7.19 9.28 7.25 9.13 7.24C9 7.24 8.87 7.42 9.04 7.42Z" />
                </svg>
                <span className="font-medium text-xs leading-none">WhatsApp</span>
              </a>
            </div>

            {/* E-mail de dúvidas */}
            <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white leading-none shrink-0 self-start md:self-auto">
              <Mail className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span className="text-[#6B7280] text-xs leading-none">
                {t.landing.footerQuestions}
              </span>
              {(() => {
                const emailExibido =
                  contatos.email && contatos.email.toLowerCase() !== 'dfarias53@gmail.com'
                    ? contatos.email
                    : 'contato@vivavarejo.com.br'
                return (
                  <a
                    href={`mailto:${emailExibido}`}
                    className="font-medium text-xs text-[#1F2937] hover:text-[#0F766E] underline underline-offset-2 transition-colors leading-none"
                  >
                    {emailExibido}
                  </a>
                )
              })()}
            </div>
          </div>

          {/* Linha de copyright e versão */}
          <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span>
                © {new Date().getFullYear()} VivaVarejo. {t.common.allRightsReserved}
              </span>
              <span className="font-mono font-bold bg-teal-50 text-[#0F766E] px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">
                {APP_VERSION_LABEL}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
