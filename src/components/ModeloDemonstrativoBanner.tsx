import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, SlidersHorizontal, SendHorizontal, X, Building2, UserCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUserProfileType } from '@/lib/perfil-utils'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'

interface ModeloDemonstrativoBannerProps {
  className?: string
}

export function ModeloDemonstrativoBanner({ className = '' }: ModeloDemonstrativoBannerProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [falarModalOpen, setFalarModalOpen] = useState(false)

  const profileType = getUserProfileType(user)
  const isRede = profileType === 'rede'

  useEffect(() => {
    if (!user) {
      setVisible(false)
      return
    }

    try {
      const dismissed = localStorage.getItem(`vivavarejo_banner_modelo_dismissed_${user.id}`)
      if (!dismissed) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [user])

  if (!visible || !user) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(`vivavarejo_banner_modelo_dismissed_${user.id}`, 'true')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  const handleConfigureVoceMesmo = () => {
    // Redireciona para o fluxo de rotinas/configuração existente
    navigate('/rotinas')
  }

  return (
    <>
      <div
        role="region"
        aria-label="Aviso de modelo demonstrativo"
        className={`bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-2xs mb-6 text-[#1F2937] transition-all ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Mensagem e aviso */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
              {isRede ? <Building2 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                  {isRede ? 'Modelo ADM de Rede' : 'Modelo Gerente de Loja'}
                </span>
                <span className="text-xs font-semibold text-[#6B7280]">
                  Ambiente de demonstração
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#374151] leading-relaxed">
                Este é apenas um modelo de demonstração. Sendo REDE ou profissional, você configura
                demandas, rotinas e indicadores conforme sua realidade — e atualiza quando quiser,
                na hora que quiser.
              </p>
            </div>
          </div>

          {/* Duas Ações Claras Solicitadas */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 md:pl-2">
            {/* Ação 1: Configure você mesmo */}
            <button
              type="button"
              onClick={handleConfigureVoceMesmo}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E] text-[#1F2937] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Configure as suas rotinas e demandas de processos</span>
            </button>

            {/* Ação 2: Nos envie que configuramos */}
            <button
              type="button"
              onClick={() => setFalarModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Nos envie que configuramos e entregamos pronto.</span>
            </button>

            {/* Fechar banner discretamente */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#4B5563] hover:bg-gray-100 transition-colors"
              title="Fechar aviso de demonstração"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <FalarEspecialistaModal
        open={falarModalOpen}
        clienteId={user.cliente}
        onOpenChange={setFalarModalOpen}
        assuntoContexto={`Configuração personalizada pela equipe VivaVarejo (${isRede ? 'Perfil ADM de Rede' : 'Perfil Gerente'})`}
      />
    </>
  )
}
