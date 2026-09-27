import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Calendar,
  ListChecks,
  CalendarCheck,
  ShieldAlert,
  Handshake,
  LayoutDashboard,
  GitBranch,
  Home,
  CheckSquare,
  Sparkles,
  ArrowRight,
  X,
  Compass,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUserProfileType, isGestorGeralUser } from '@/lib/perfil-utils'

interface QuickAccessHubModalProps {
  forceOpen?: boolean
  onClose?: () => void
}

export interface HubShortcut {
  to: string
  label: string
  badge?: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}

export const STORAGE_KEY_FLAG = 'vivavarejo_show_quick_hub'
export const STORAGE_KEY_SEEN_PREFIX = 'vivavarejo_quick_hub_seen_session_'

export function triggerQuickAccessHub() {
  try {
    sessionStorage.setItem(STORAGE_KEY_FLAG, 'true')
  } catch {
    /* intentionally ignored */
  }
}

export function QuickAccessHubModal({ forceOpen, onClose }: QuickAccessHubModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [naoMostrarNovamenteHoje, setNaoMostrarNovamenteHoje] = useState(false)

  const isGestorGeral = isGestorGeralUser(user)
  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')
  const profileType = getUserProfileType(user)
  const isGerente = profileType === 'gerente'
  const isAdmin = perfil === 'admin'
  const isAdmRede = perfil === 'adm_rede'
  const hasAdminAccess = isAdmin || isAdmRede

  useEffect(() => {
    // Gestor Geral (Dfarias) não deve ver atalhos de forma alguma
    if (isGestorGeral) {
      setOpen(false)
      return
    }

    if (forceOpen !== undefined) {
      setOpen(forceOpen)
      return
    }

    if (!user) {
      setOpen(false)
      return
    }

    // Não exibe em telas de auth públicas
    const isAuthPath =
      location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname === '/cadastro' ||
      location.pathname === '/bem-vindo'
    if (isAuthPath) {
      setOpen(false)
      return
    }

    try {
      const today = new Date().toISOString().slice(0, 10)
      const optOutDate = localStorage.getItem(`vivavarejo_quick_hub_optout_${user.id}`)
      if (optOutDate === today) {
        return
      }

      // Verifica flag explícita pós-login ou primeira abertura na sessão
      const explicitFlag = sessionStorage.getItem(STORAGE_KEY_FLAG) === 'true'
      const sessionSeen = sessionStorage.getItem(`${STORAGE_KEY_SEEN_PREFIX}${user.id}`) === 'true'

      if (explicitFlag || !sessionSeen) {
        setOpen(true)
        sessionStorage.setItem(`${STORAGE_KEY_SEEN_PREFIX}${user.id}`, 'true')
        sessionStorage.removeItem(STORAGE_KEY_FLAG)
      }
    } catch {
      /* intentionally ignored */
    }
  }, [user, location.pathname, forceOpen])

  if (!open || !user || isGestorGeral) return null

  const handleClose = () => {
    if (naoMostrarNovamenteHoje && user) {
      try {
        const today = new Date().toISOString().slice(0, 10)
        localStorage.setItem(`vivavarejo_quick_hub_optout_${user.id}`, today)
      } catch {
        /* ignore */
      }
    }
    setOpen(false)
    if (onClose) onClose()
  }

  const handleNavigate = (to: string) => {
    handleClose()
    navigate(to)
  }

  // Atalhos para Perfil Gerente (enxuto, foco na operação diária da loja)
  const shortcutsGerente: HubShortcut[] = [
    {
      to: '/meu-dia',
      label: 'Meu Dia',
      badge: 'Hoje',
      description: 'Minhas tarefas imediatas e prioridades de turno',
      icon: Home,
      highlight: true,
    },
    {
      to: '/agenda',
      label: 'Agenda da Loja',
      badge: 'Loja',
      description: 'Horários, execução com evidência e validações',
      icon: Calendar,
      highlight: true,
    },
    {
      to: '/validades',
      label: 'Validades',
      badge: 'Auditoria',
      description: 'Conferência de lotes críticos e prevenção',
      icon: CalendarCheck,
    },
    {
      to: '/comercial',
      label: 'Comercial da Loja',
      badge: 'Gôndola',
      description: 'Rupturas, produtos sem venda e reposição',
      icon: TrendingUp,
    },
    {
      to: '/adm-rh',
      label: 'Adm / RH',
      badge: 'Loja',
      description: 'Demandas com foto para RH, DP, ADM, Financeiro e Fiscal',
      icon: Users,
    },
    {
      to: '/rotinas',
      label: 'Rotinas & Padrões',
      badge: 'Padrão',
      description: 'Consulte os padrões de execução da loja',
      icon: ListChecks,
    },
  ]

  const isDemo = user?.email?.toLowerCase().trim() === 'demo@vivavarejo.com.br'

  // Atalhos para Perfil ADM de Rede (amplo, visão multi-lojas e comercial completo)
  const shortcutsRede: HubShortcut[] = [
    {
      to: '/agenda',
      label: 'Agenda',
      badge: 'Diário',
      description: 'Ordem cronológica das rotinas e equipe',
      icon: Calendar,
      highlight: true,
    },
    {
      to: '/comercial',
      label: 'Comercial',
      badge: 'Negócio',
      description: 'Rupturas, vendas, curvas A/B/C+, margens e layout',
      icon: TrendingUp,
      highlight: true,
    },
    {
      to: '/adm-rh',
      label: 'Adm / RH',
      badge: 'Corporativo',
      description: 'Triagem e tratamento de demandas de RH, DP, ADM, Financeiro e Fiscal',
      icon: Users,
    },
    ...(!isDemo
      ? [
          {
            to: '/rotinas',
            label: 'Rotinas',
            badge: 'Padrões',
            description: 'Cadastro, horários limites e modelos',
            icon: ListChecks,
          },
        ]
      : []),
    {
      to: '/validades',
      label: 'Validades',
      badge: 'Calendário',
      description: 'Prevenção de vencimento e auditorias',
      icon: CalendarCheck,
    },
    {
      to: '/perdas',
      label: 'Perdas & Inventário',
      badge: 'Prevenção',
      description: 'Quebras, avarias e balanços de estoque',
      icon: ShieldAlert,
    },
    {
      to: '/promotores',
      label: 'Promotores',
      badge: 'Visitas',
      description: 'Controle de promotores e fornecedores',
      icon: Handshake,
    },
    ...(hasAdminAccess
      ? [
          {
            to: '/admin',
            label: isAdmRede ? 'Workflow Rede' : 'Workflow Geral',
            badge: 'Admin',
            description: isAdmRede
              ? 'Painel gerencial, relatórios, promotores e equipe da rede'
              : 'Painel gerencial, auditoria e usuários',
            icon: GitBranch,
          },
        ]
      : []),
  ]

  const shortcuts = isGerente ? shortcutsGerente : shortcutsRede

  const primeFirstName = (user.name || '').trim().split(/\s+/)[0] || 'Líder'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hub-acesso-rapido-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#F7F7F5] border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] text-[#1F2937]">
        {/* Top Header sóbrio */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 py-3.5 sm:px-6 sm:py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                  Acesso Rápido
                </span>
                {!isDemo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                    {isGerente ? 'Modelo Gerente (CPF)' : 'Modelo ADM de Rede (CNPJ)'}
                  </span>
                )}
              </div>
              <h2
                id="hub-acesso-rapido-title"
                className="text-base sm:text-lg font-bold text-[#1F2937] mt-0.5"
              >
                Olá, {primeFirstName}! Onde deseja atuar agora?
              </h2>
              <p className="text-xs text-[#4B5563] mt-0.5">
                Direcione direto para a sua rotina sem perder tempo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="Fechar acesso rápido"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grade de Atalhos Grandes de Toque (mínimo 44px de altura, mobile-first) */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div
            className={`grid gap-3 ${
              isGerente ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon
              const isHighlight = Boolean(shortcut.highlight)
              return (
                <button
                  key={shortcut.to}
                  type="button"
                  onClick={() => handleNavigate(shortcut.to)}
                  className={`group relative text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 min-h-[68px] sm:min-h-[80px] flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                    isHighlight
                      ? 'bg-white border-[#0F766E] shadow-sm hover:border-[#115E59] hover:shadow-md'
                      : 'bg-white border-[#E5E7EB] hover:border-[#0F766E]/60 hover:bg-[#F9FAFB] shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isHighlight
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-teal-50 text-[#0F766E] border border-teal-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-[#1F2937] group-hover:text-[#0F766E] transition-colors leading-tight">
                        {shortcut.label}
                      </span>
                      {shortcut.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isHighlight
                              ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                              : 'bg-gray-100 text-[#4B5563]'
                          }`}
                        >
                          {shortcut.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#4B5563] mt-1 line-clamp-2 leading-relaxed">
                      {shortcut.description}
                    </p>
                  </div>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Dica operacional discreta */}
          <div className="mt-4 p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between gap-2 text-xs text-[#4B5563]">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span className="truncate">
                Dica: selecione qualquer atalho para navegar diretamente à sua rotina.
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none shrink-0 text-[#374151]">
              {' '}
              <input
                type="checkbox"
                checked={naoMostrarNovamenteHoje}
                onChange={(e) => setNaoMostrarNovamenteHoje(e.target.checked)}
                className="rounded border-[#D1D5DB] text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span className="hidden sm:inline">Não abrir automaticamente hoje</span>
              <span className="sm:hidden">Hoje não</span>
            </label>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="bg-white border-t border-[#E5E7EB] px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] min-h-[44px] px-3 rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Agora não, explorar livremente
          </button>

          <button
            type="button"
            onClick={() => handleNavigate(shortcuts[0]?.to || '/agenda')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors min-h-[44px]"
          >
            <span>Ir para {shortcuts[0]?.label || 'Início'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
