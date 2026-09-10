import React from 'react'
import { useNavigate } from 'react-router-dom'
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
  ArrowRight,
  Compass,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { isPerfilCampo } from '@/lib/perfil-utils'
import type { HubShortcut } from './QuickAccessHubModal'

interface QuickAccessTopBannerProps {
  className?: string
}

export function QuickAccessTopBanner({ className = '' }: QuickAccessTopBannerProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')
  const emailLower = (user?.email || '').toLowerCase()
  const eCampo =
    isPerfilCampo(user) ||
    perfil === 'funcionario' ||
    emailLower.includes('promotor') ||
    emailLower.includes('repositor')
  const isAdmin = perfil === 'admin'
  const isAdmRede = perfil === 'adm_rede'
  const hasAdminAccess = isAdmin || isAdmRede

  // Atalhos para Perfil Operacional / Campo
  const shortcutsCampo: HubShortcut[] = [
    {
      to: '/meu-dia',
      label: 'Meu Dia',
      badge: 'Hoje',
      description: 'Prioridades e check-in',
      icon: Home,
      highlight: true,
    },
    {
      to: '/promotores',
      label: 'Visitas',
      badge: 'Loja',
      description: 'Atendimentos de promotores',
      icon: Handshake,
    },
    {
      to: '/agenda',
      label: 'Tarefas',
      badge: 'Agenda',
      description: 'Horários e evidências',
      icon: CheckSquare,
    },
    {
      to: '/validades',
      label: 'Validades',
      badge: 'Auditoria',
      description: 'Prevenção de vencimento',
      icon: CalendarCheck,
    },
  ]

  // Atalhos para Perfil Gestor / Líder / Admin
  const shortcutsGestao: HubShortcut[] = [
    {
      to: '/agenda',
      label: 'Agenda',
      badge: 'Diário',
      description: 'Rotinas e equipe no dia',
      icon: Calendar,
      highlight: true,
    },
    {
      to: '/rotinas',
      label: 'Rotinas',
      badge: 'Padrões',
      description: 'Cadastro e modelos',
      icon: ListChecks,
    },
    {
      to: '/validades',
      label: 'Validades',
      badge: 'Auditorias',
      description: 'Calendário e prevenção',
      icon: CalendarCheck,
    },
    {
      to: '/perdas',
      label: 'Perdas & Inventário',
      badge: 'Prevenção',
      description: 'Quebras e balanços',
      icon: ShieldAlert,
    },
    {
      to: '/promotores',
      label: 'Promotores',
      badge: 'Visitas',
      description: 'Controle de promotores',
      icon: Handshake,
    },
    {
      to: '/',
      label: 'Dashboard',
      badge: 'Geral',
      description: 'Indicadores e cumprimento',
      icon: LayoutDashboard,
    },
    ...(hasAdminAccess
      ? [
          {
            to: '/admin',
            label: isAdmRede ? 'Workflow Rede' : 'Workflow Geral',
            badge: 'Admin',
            description: 'Painel gerencial e regras',
            icon: GitBranch,
          },
        ]
      : []),
  ]

  const shortcuts = eCampo ? shortcutsCampo : shortcutsGestao

  return (
    <div
      aria-label="Atalhos rápidos de navegação"
      className={`bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#1F2937] leading-tight">
              Acesso Rápido aos Módulos
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              Direcione direto sem perder tempo ({eCampo ? 'Operação de Campo' : 'Gestão'})
            </p>
          </div>
        </div>
      </div>

      <div
        className={`grid gap-2.5 ${
          eCampo ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
        }`}
      >
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon
          const isHighlight = Boolean(shortcut.highlight)
          return (
            <button
              key={shortcut.to}
              type="button"
              onClick={() => navigate(shortcut.to)}
              className={`group text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-150 min-h-[58px] flex items-center gap-2.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                isHighlight
                  ? 'bg-teal-50/50 border-teal-200 hover:border-[#0F766E]'
                  : 'bg-[#F7F7F5] border-[#E5E7EB] hover:border-[#0F766E]/50 hover:bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  isHighlight
                    ? 'bg-[#0F766E] text-white shadow-2xs'
                    : 'bg-white border border-[#E5E7EB] text-[#0F766E]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#1F2937] group-hover:text-[#0F766E] truncate leading-tight">
                  {shortcut.label}
                </div>
                <div className="text-[10px] text-[#6B7280] truncate leading-tight mt-0.5">
                  {shortcut.description}
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
