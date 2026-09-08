import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService } from '@/services/rotinas'
import { funcionariosService } from '@/services/funcionarios'
import type { Rotina, Funcionario } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreSelector } from '@/components/StoreSelector'
import {
  Users,
  Clock,
  ShieldCheck,
  RefreshCw,
  Briefcase,
  ChevronRight,
  UserCheck,
  Store,
  Phone,
} from 'lucide-react'
import { formatPhoneBR } from '@/lib/phone-utils'
import { Link } from 'react-router-dom'

export default function Equipe() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojaSelecionada } = useStore()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [allRoutines, allFuncs] = await Promise.all([
        rotinasService.getAll(lojaSelecionadaId),
        lojaSelecionadaId && lojaSelecionadaId !== 'todas'
          ? funcionariosService.getByLoja(lojaSelecionadaId)
          : funcionariosService.getAll(),
      ])
      setRotinas(allRoutines)
      setFuncionarios(allFuncs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user, lojaSelecionadaId])

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
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header & Seletor de Loja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
            Minha equipe
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {lojaSelecionada
              ? `Estrutura de equipe e rotinas para ${lojaSelecionada.nome}.`
              : 'Áreas, funções e responsáveis pelas rotinas operacionais.'}
          </p>
        </div>

        <StoreSelector />
      </div>

      {/* Membros da Equipe Cadastrados (se houver para a loja selecionada) */}
      {funcionarios.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
              Membros da equipe ({funcionarios.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {funcionarios.map((fc) => (
              <div
                key={fc.id}
                className="p-3 rounded-md border border-[#E5E7EB] bg-[#F7F7F5]/40 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#1F2937]">{fc.nome}</div>
                  <div className="text-xs text-[#2563EB] font-medium mt-0.5">
                    {fc.expand?.funcao?.nome || 'Função operacional'}
                  </div>
                  {fc.expand?.funcao?.chefe_imediato_funcao && (
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      Chefe imediato:{' '}
                      {fc.expand.funcao.expand?.chefe_imediato_funcao?.nome || 'Definido na função'}
                    </div>
                  )}
                  {fc.expand?.loja && (
                    <div className="text-xs text-[#6B7280] flex items-center gap-1 mt-1">
                      <Store className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{fc.expand.loja.nome}</span>
                    </div>
                  )}
                  {fc.telefone && (
                    <div className="text-xs text-gray-700 flex items-center gap-1 mt-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatPhoneBR(fc.telefone)}</span>
                    </div>
                  )}
                </div>
                {fc.ativo !== false ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ativo
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#6B7280]">
                    Inativo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Banner */}
      <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#3B82F6]/10 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1F2937]">
              {groupedData.length} Áreas operacionais mapeadas
            </div>
            <div className="text-xs text-[#6B7280]">
              Total de {rotinas.length}{' '}
              {rotinas.length === 1 ? 'rotina distribuída' : 'rotinas distribuídas'} entre funções
              de loja
            </div>
          </div>
        </div>

        <Link
          to="/rotinas"
          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1"
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
