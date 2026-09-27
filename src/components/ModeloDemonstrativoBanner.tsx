import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, SlidersHorizontal, SendHorizontal, X, Building2, UserCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUserProfileType } from '@/lib/perfil-utils'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import { useBrand } from '@/hooks/use-brand'

interface ModeloDemonstrativoBannerProps {
  className?: string
}

export function ModeloDemonstrativoBanner({ className = '' }: ModeloDemonstrativoBannerProps) {
  const { user } = useAuth()
  const brand = useBrand()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [falarModalOpen, setFalarModalOpen] = useState(false)

  const profileType = getUserProfileType(user)
  const isRede = profileType === 'rede'
  const isDemo = user?.email?.toLowerCase().trim() === 'demo@vivavarejo.com.br'
  const nomeRedeMarca = brand.isWhiteLabelActive ? brand.nomeExibicao || brand.redeNome : null

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
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={
                brand.isWhiteLabelActive && brand.corPrimaria
                  ? {
                      backgroundColor: `${brand.corPrimaria}18`,
                      borderColor: `${brand.corPrimaria}40`,
                      color: brand.corPrimaria,
                      borderWidth: '1px',
                    }
                  : {
                      backgroundColor: '#F0FDFA',
                      borderColor: '#CCFBF1',
                      color: '#0F766E',
                      borderWidth: '1px',
                    }
              }
            >
              {isRede ? <Building2 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* No usuário DEMO padrão, ocultar etiqueta 'Modelo ADM de Rede' */}
                {!isDemo && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={
                      brand.isWhiteLabelActive && brand.corPrimaria
                        ? {
                            backgroundColor: `${brand.corPrimaria}18`,
                            color: brand.corPrimaria,
                            borderColor: `${brand.corPrimaria}40`,
                            borderWidth: '1px',
                          }
                        : {
                            backgroundColor: '#F0FDFA',
                            color: '#0F766E',
                            borderColor: '#CCFBF1',
                            borderWidth: '1px',
                          }
                    }
                  >
                    {nomeRedeMarca || (isRede ? 'Modelo ADM de Rede' : 'Modelo Gerente de Loja')}
                  </span>
                )}
                <span className="text-xs font-semibold text-[#6B7280]">
                  {nomeRedeMarca
                    ? `Ambiente de demonstração preparado para a ${nomeRedeMarca}`
                    : 'Ambiente de demonstração'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#374151] leading-relaxed">
                {nomeRedeMarca ? (
                  <>
                    Este ambiente foi personalizado especialmente para a{' '}
                    <strong className="font-semibold text-[#1F2937]">{nomeRedeMarca}</strong>.
                    Demandas, rotinas, checklists e indicadores sob medida para sua operação — e
                    atualizados sempre que você precisar.
                  </>
                ) : (
                  <>
                    Este é apenas um modelo demonstrativo. Cada rede ou profissional tem sua
                    realidade: demandas, rotinas e indicadores configurados por nós, conforme o seu
                    negócio — e atualizados sempre que precisar.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Ação Única: 'Nos envie que configuramos e entregamos pronto.' (decisão do dono) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 md:pl-2">
            <button
              type="button"
              onClick={() => setFalarModalOpen(true)}
              style={
                brand.isWhiteLabelActive && brand.corPrimaria
                  ? { backgroundColor: brand.corPrimaria }
                  : undefined
              }
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <SendHorizontal className="w-4 h-4" />
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
