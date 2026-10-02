import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  X,
  Users,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/lib/i18n/context'
import { funnelService, type StatusTrial } from '@/services/funnelService'
import { FalarEspecialistaModal } from './FalarEspecialistaModal'

export function TrialTopBanner() {
  const { user } = useAuth()
  const { locale } = useI18n()
  const isEn = locale === 'en'

  const [modalDemoOpen, setModalDemoOpen] = useState(false)
  const [inAppDismissed, setInAppDismissed] = useState(false)

  if (!user) return null

  const status: StatusTrial = funnelService.calcularStatusTrial(user)
  if (!status.isTrial) return null

  // Mapeia os textos verbatim por dia do teste:
  // Dia 1: "Bem-vindo à VivaVarejo. Comece criando sua primeira demanda e experimente o fluxo completo: identificar, priorizar, direcionar e acompanhar."
  // Dia 3-5: "Sua equipe já começou a usar? Convide os integrantes que participarão da execução e experimente a plataforma em uma situação real."
  // Dia 10: "Seu teste termina em 4 dias. Continue explorando a VivaVarejo ou agende uma demonstração para conhecer as possibilidades de aplicação na sua empresa."
  // Dia 13: "Seu teste termina amanhã. Quer continuar utilizando a VivaVarejo?" + botões "AGENDAR DEMONSTRAÇÃO" e "CONHECER PLANOS".

  const dia = status.diaDoTeste

  let mensagemInApp: {
    titulo: string
    texto: string
    ctaPrincipal?: { label: string; action: () => void }
    ctaSecundario?: { label: string; to?: string; action?: () => void }
  } | null = null

  if (dia === 1) {
    mensagemInApp = {
      titulo: isEn ? 'Day 1 of 14' : 'Dia 1 de 14',
      texto: isEn
        ? 'Welcome to VivaVarejo. Start by creating your first demand and experience the complete flow: identify, prioritize, direct, and track.'
        : 'Bem-vindo à VivaVarejo. Comece criando sua primeira demanda e experimente o fluxo completo: identificar, priorizar, direcionar e acompanhar.',
      ctaPrincipal: {
        label: isEn ? 'GO TO MY DAY' : 'IR PARA MEU DIA',
        action: () => {
          window.location.href = '/meu-dia'
        },
      },
    }
  } else if (dia >= 3 && dia <= 5) {
    mensagemInApp = {
      titulo: isEn ? `Day ${dia} of 14 • Team` : `Dia ${dia} de 14 • Equipe`,
      texto: isEn
        ? 'Has your team started using it? Invite the members who will participate in execution and experience the platform in a real scenario.'
        : 'Sua equipe já começou a usar? Convide os integrantes que participarão da execução e experimente a plataforma em uma situação real.',
      ctaPrincipal: {
        label: isEn ? 'INVITE TEAM (UP TO 5)' : 'CONVIDAR EQUIPE (ATÉ 5)',
        action: () => {
          window.location.href = '/agenda?tab=equipe'
        },
      },
    }
  } else if (dia >= 10 && dia < 13) {
    const faltam = Math.max(1, status.diasRestantes)
    mensagemInApp = {
      titulo: isEn ? `${faltam} days left` : `Restam ${faltam} dias`,
      texto: isEn
        ? 'Your trial ends in 4 days. Continue exploring VivaVarejo or schedule a demo to discover application possibilities for your company.'
        : 'Seu teste termina em 4 dias. Continue explorando a VivaVarejo ou agende uma demonstração para conhecer as possibilidades de aplicação na sua empresa.',
      ctaPrincipal: {
        label: isEn ? 'SCHEDULE A DEMO' : 'AGENDAR DEMONSTRAÇÃO',
        action: () => setModalDemoOpen(true),
      },
    }
  } else if (dia >= 13) {
    mensagemInApp = {
      titulo: isEn ? 'Trial ends soon' : 'Seu teste termina amanhã',
      texto: isEn
        ? 'Your trial ends tomorrow. Would you like to continue using VivaVarejo?'
        : 'Seu teste termina amanhã. Quer continuar utilizando a VivaVarejo?',
      ctaPrincipal: {
        label: isEn ? 'SCHEDULE A DEMO' : 'AGENDAR DEMONSTRAÇÃO',
        action: () => setModalDemoOpen(true),
      },
      ctaSecundario: {
        label: isEn ? 'TALK TO OUR TEAM' : 'CONHECER PLANOS',
        action: () => setModalDemoOpen(true),
      },
    }
  }

  // CASO TRIAL EXPIRADO: bloqueio amigável
  if (status.expirado) {
    return (
      <>
        <div className="w-full bg-rose-950 text-white border-b-2 border-rose-600 px-4 py-4 shadow-md">
          <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-300 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {isEn ? 'Your trial period has ended.' : 'Seu período de teste terminou.'}
                  </span>
                  <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded uppercase font-mono">
                    {isEn ? 'Expired' : 'Expirado'}
                  </span>
                </div>
                <p className="text-xs text-rose-100 max-w-2xl leading-relaxed">
                  {isEn
                    ? 'Your environment remains saved in accordance with our data retention policy. Your data was not deleted.'
                    : 'Seu ambiente permanece registrado conforme nossa política de retenção de dados.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setModalDemoOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs uppercase tracking-wide inline-flex items-center justify-center gap-1.5"
              >
                <span>{isEn ? 'CONTINUE WITH VIVAVAREJO' : 'CONTINUAR COM A VIVAVAREJO'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setModalDemoOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-colors uppercase tracking-wide inline-flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isEn ? 'TALK TO OUR TEAM' : 'FALAR COM NOSSA EQUIPE'}</span>
              </button>
            </div>
          </div>
        </div>

        <FalarEspecialistaModal
          open={modalDemoOpen}
          onOpenChange={setModalDemoOpen}
          assuntoContexto="Renovação e Contratação pós-teste de 14 dias"
        />
      </>
    )
  }

  // CASO TRIAL EM ANDAMENTO: Barra com contador + aviso contextual
  return (
    <>
      <div className="w-full bg-[#111827] text-white border-b border-[#374151] px-4 py-2 text-xs">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          {/* Contador visível verbatim: "Teste gratuito: X dias restantes" */}
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-300 uppercase tracking-wide text-[11px]">
                {isEn ? 'Free Trial:' : 'Teste gratuito:'}
              </span>
              <span className="font-mono font-bold text-white bg-teal-900/60 border border-teal-700/60 px-2 py-0.5 rounded text-[11px]">
                {status.diasRestantes} {isEn ? 'days left' : 'dias restantes'}
              </span>
              <span className="text-gray-400 text-[11px] hidden sm:inline">
                •{' '}
                {isEn
                  ? 'Up to 5 users • Full 4 pillars available'
                  : 'Até 5 usuários • 4 pilares completos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setModalDemoOpen(true)}
              className="px-3 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold rounded text-[11px] transition-colors shadow-2xs inline-flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{isEn ? 'TALK TO SPECIALIST' : 'FALAR COM ESPECIALISTA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mensagem In-App Contextual do Dia do Teste (Dismissable) */}
      {mensagemInApp && !inAppDismissed && (
        <div className="w-full bg-gradient-to-r from-teal-900 via-[#0F766E] to-teal-800 text-white px-4 py-2.5 shadow-sm text-xs">
          <div className="max-w-[1280px] mx-auto flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold text-[10px]">
                VV
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-teal-100 uppercase tracking-wider text-[10px] mr-2">
                  {mensagemInApp.titulo}
                </span>
                <span className="text-white text-xs leading-snug">{mensagemInApp.texto}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {mensagemInApp.ctaPrincipal && (
                <button
                  type="button"
                  onClick={mensagemInApp.ctaPrincipal.action}
                  className="px-3 py-1 bg-white text-[#0F766E] hover:bg-gray-100 font-bold rounded-lg text-[11px] transition-colors shadow-2xs whitespace-nowrap"
                >
                  {mensagemInApp.ctaPrincipal.label}
                </button>
              )}
              {mensagemInApp.ctaSecundario && (
                <button
                  type="button"
                  onClick={mensagemInApp.ctaSecundario.action}
                  className="px-3 py-1 bg-white/10 text-white hover:bg-white/20 border border-white/30 font-semibold rounded-lg text-[11px] transition-colors whitespace-nowrap"
                >
                  {mensagemInApp.ctaSecundario.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => setInAppDismissed(true)}
                className="text-white/70 hover:text-white p-1"
                aria-label="Fechar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <FalarEspecialistaModal
        open={modalDemoOpen}
        onOpenChange={setModalDemoOpen}
        assuntoContexto={`Acompanhamento de Teste Gratuito (Dia ${status.diaDoTeste} de 14)`}
      />
    </>
  )
}
export default TrialTopBanner
