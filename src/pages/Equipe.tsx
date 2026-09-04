import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { rotinasService } from '@/services/rotinas'
import type { Rotina } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Clock, ShieldCheck, RefreshCw, Briefcase, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Equipe() {
  const { user } = useAuth()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const allRoutines = await rotinasService.getAll()
      setRotinas(allRoutines)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Group routines by Area (or responsavel fallback)
  const groupedData = useMemo(() => {
    const map = new Map<string, Rotina[]>()

    rotinas.forEach((rotina) => {
      const areaKey = rotina.area || rotina.responsavel || 'Geral'
      const existing = map.get(areaKey) || []
      existing.push(rotina)
      map.set(areaKey, existing)
    })

    return Array.from(map.entries())
      .map(([area, items]) => ({
        area,
        items,
        count: items.length,
      }))
      .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area))
  }, [rotinas])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-96 bg-gray-200" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-36 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-36 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-36 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-[#E5E7EB] rounded-lg text-center space-y-3 shadow-xs">
        <p className="text-sm text-[#B91C1C] font-medium">
          Não foi possível carregar as rotinas da equipe. Tente novamente.
        </p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#0F766E] text-white rounded-md hover:bg-[#115E59] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
          Minha equipe
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">Áreas e responsáveis pelas rotinas da loja.</p>
      </div>

      {/* Summary Banner */}
      <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1F2937]">
              {groupedData.length} Áreas Operacionais Mapeadas
            </div>
            <div className="text-xs text-[#6B7280]">
              Total de {rotinas.length} rotinas distribuídas entre funções de loja
            </div>
          </div>
        </div>

        <Link
          to="/rotinas"
          className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] inline-flex items-center gap-1"
        >
          <span>Gerenciar rotinas</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Area Groups List */}
      <div className="space-y-5">
        {groupedData.map(({ area, items, count }) => (
          <div
            key={area}
            className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs"
          >
            {/* Group Header */}
            <div className="p-4 bg-[#F7F7F5] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[#4B5563]">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-base font-bold text-[#1F2937]">{area}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                {count} {count === 1 ? 'rotina' : 'rotinas'}
              </span>
            </div>

            {/* Routines Under Group */}
            <div className="divide-y divide-[#E5E7EB]">
              {items.map((routine) => (
                <div
                  key={routine.id}
                  className="p-3.5 sm:p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#1F2937]">{routine.nome}</div>
                    {routine.observacoes && (
                      <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">
                        {routine.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6B7280] shrink-0 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{routine.frequencia}</span>
                    </span>

                    {routine.horario_limite && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-[#F7F7F5] text-[#374151]">
                        {routine.horario_limite}
                      </span>
                    )}

                    {routine.validacao && (
                      <span className="flex items-center gap-1 text-[11px] text-[#4B5563]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>Validação: {routine.validacao}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
