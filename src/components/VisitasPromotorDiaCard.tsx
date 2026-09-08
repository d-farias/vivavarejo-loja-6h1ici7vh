import React, { useState } from 'react'
import type { VisitaPromotor, RotinaPromotor } from '@/types'
import { isVisitaAtrasada } from '@/services/visitasPromotor'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Check,
  Store,
  ChevronRight,
  Handshake,
} from 'lucide-react'
import { ConcluirVisitaModal } from '@/components/ConcluirVisitaModal'

interface VisitasPromotorDiaCardProps {
  visitas: VisitaPromotor[]
  rotinasPromotor: RotinaPromotor[]
  onConcluirVisita: (visitaId: string, params: any) => Promise<void>
  onNavigateToPromotores?: () => void
}

export function VisitasPromotorDiaCard({
  visitas,
  rotinasPromotor,
  onConcluirVisita,
  onNavigateToPromotores,
}: VisitasPromotorDiaCardProps) {
  const [modalVisita, setModalVisita] = useState<VisitaPromotor | null>(null)

  if (visitas.length === 0) return null

  // Filtra as visitas do dia ou com pendência/atraso
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const visitasDoDia = visitas.filter((v) => {
    const vDate = v.data_visita ? v.data_visita.substring(0, 10) : ''
    // Mostra se for hoje ou se for agendada/atrasada de data anterior
    return vDate === todayStr || (v.status !== 'realizada' && v.status !== 'cancelada')
  })

  if (visitasDoDia.length === 0) return null

  const realizadas = visitasDoDia.filter((v) => v.status === 'realizada').length
  const atrasadas = visitasDoDia.filter((v) => isVisitaAtrasada(v)).length

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-blue-50/40 via-white to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#1F2937]">
                Visitas de Promotores & Fornecedores
              </h2>
              {atrasadas > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#B91C1C] border border-red-200">
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {atrasadas} ATRASADA{atrasadas > 1 ? 'S' : ''}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              Controle de atendimento dos representantes em loja ({realizadas}/{visitasDoDia.length}{' '}
              realizadas hoje)
            </p>
          </div>
        </div>

        {onNavigateToPromotores && (
          <button
            onClick={onNavigateToPromotores}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors self-start sm:self-auto"
          >
            <span>Ver controle completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de Visitas */}
      <div className="divide-y divide-[#E5E7EB]">
        {visitasDoDia.map((v) => {
          const atrasada = isVisitaAtrasada(v)
          const promotorNome = v.expand?.promotor?.nome || 'Promotor'
          const fornecedorNome = v.expand?.promotor?.expand?.fornecedor?.nome
          const lojaNome = v.expand?.loja?.nome

          return (
            <div
              key={v.id}
              className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                atrasada
                  ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-[#B91C1C]'
                  : v.status === 'realizada'
                    ? 'bg-gray-50/40 hover:bg-gray-50/70 border-l-4 border-l-emerald-500'
                    : 'hover:bg-gray-50/60 border-l-4 border-l-blue-400'
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs sm:text-sm text-[#1F2937]">
                    {promotorNome}
                  </span>

                  {fornecedorNome && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-[#4B5563]">
                      <Building2 className="w-3 h-3 text-[#6B7280]" />
                      <span>{fornecedorNome}</span>
                    </span>
                  )}

                  {lojaNome && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[11px] font-medium text-[#2563EB]">
                      <Store className="w-3 h-3 text-[#2563EB]" />
                      <span>{lojaNome}</span>
                    </span>
                  )}

                  {v.status === 'realizada' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      REALIZADA
                    </span>
                  ) : atrasada ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#B91C1C]">
                      <AlertTriangle className="w-3 h-3" />
                      ATRASADA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                      <Clock className="w-3 h-3" />
                      AGENDADA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{v.data_visita ? v.data_visita.substring(0, 10) : ''}</span>
                  </span>
                  {v.hora_prevista && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Previsto: {v.hora_prevista}</span>
                    </span>
                  )}
                </div>

                {v.conclusao_check && (
                  <div className="text-xs text-[#374151] pt-1">
                    <span className="font-semibold text-emerald-700">Check: </span>
                    <span>{v.conclusao_check}</span>
                  </div>
                )}

                {v.observacoes && !v.conclusao_check && (
                  <div className="text-xs text-[#6B7280] italic">Objetivo: {v.observacoes}</div>
                )}
              </div>

              {/* Botão de Conclusão Rápida */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {v.status !== 'realizada' && v.status !== 'cancelada' ? (
                  <button
                    onClick={() => setModalVisita(v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir Visita</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Concluída
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConcluirVisitaModal
        open={!!modalVisita}
        onOpenChange={(open) => !open && setModalVisita(null)}
        visita={modalVisita}
        rotinasDisponiveis={rotinasPromotor.filter((r) => r.ativa !== false)}
        onConcluir={(params) => {
          if (!modalVisita) return Promise.resolve()
          return onConcluirVisita(modalVisita.id, params)
        }}
      />
    </div>
  )
}
