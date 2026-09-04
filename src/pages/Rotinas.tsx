import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import type { Rotina, ExecucaoRotina } from '@/types'
import { isPastDue } from '@/lib/time-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Filter,
  Check,
  Clock,
  User,
  Wrench,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react'

export default function Rotinas() {
  const { user } = useAuth()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFreq, setSelectedFreq] = useState<string>('Todas')
  const [selectedArea, setSelectedArea] = useState<string>('Todas')
  const [selectedRotina, setSelectedRotina] = useState<Rotina | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [allRoutines, todayExecs] = await Promise.all([
        rotinasService.getAll(),
        execucoesService.getTodayExecutions(user.id),
      ])
      setRotinas(allRoutines)
      setExecucoes(todayExecs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime updates
  useRealtime<ExecucaoRotina>(
    'execucoes_rotinas',
    useCallback((data) => {
      const record = data.record
      const todayStr = getTodayDateString()
      const isToday = record.data_execucao && record.data_execucao.startsWith(todayStr)
      if (!isToday) return

      setExecucoes((prev) => {
        if (data.action === 'delete') {
          return prev.filter((item) => item.id !== record.id)
        }
        if (data.action === 'create') {
          const exists = prev.some((item) => item.id === record.id)
          return exists ? prev : [...prev, record]
        }
        if (data.action === 'update') {
          return prev.map((item) => (item.id === record.id ? record : item))
        }
        return prev
      })
    }, []),
    !!user,
  )

  const completionMap = useMemo(() => {
    const map = new Map<string, ExecucaoRotina>()
    for (const exec of execucoes) {
      if (exec.concluida) {
        map.set(exec.rotina, exec)
      }
    }
    return map
  }, [execucoes])

  // Extract unique areas from loaded routines
  const availableAreas = useMemo(() => {
    const areas = new Set<string>()
    rotinas.forEach((r) => {
      if (r.area) areas.add(r.area)
      else if (r.responsavel) areas.add(r.responsavel)
    })
    return Array.from(areas).sort()
  }, [rotinas])

  const frequencyFilters = ['Todas', 'Diária', 'Semanal', 'Conforme demanda']

  const handleToggle = async (rotinaId: string) => {
    if (!user || submittingId === rotinaId) return

    const existingExec = execucoes.find((e) => e.rotina === rotinaId && e.usuario === user.id)
    const isCurrentlyDone = !!existingExec?.concluida
    const nextState = !isCurrentlyDone

    const tempId = existingExec?.id || `temp-${Date.now()}`
    const optimisticRecord: ExecucaoRotina = {
      id: tempId,
      collectionId: 'execucoes_rotinas',
      collectionName: 'execucoes_rotinas',
      rotina: rotinaId,
      usuario: user.id,
      data_execucao: getTodayDateString(),
      concluida: nextState,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    setExecucoes((prev) => {
      const idx = prev.findIndex((e) => e.rotina === rotinaId && e.usuario === user.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], concluida: nextState }
        return copy
      }
      return [...prev, optimisticRecord]
    })

    setSubmittingId(rotinaId)

    try {
      const saved = await execucoesService.toggleExecution(
        rotinaId,
        user.id,
        isCurrentlyDone,
        existingExec?.id,
      )
      setExecucoes((prev) => {
        const filtered = prev.filter((e) => e.id !== tempId && e.id !== saved.id)
        return [...filtered, saved]
      })
    } catch {
      setExecucoes((prev) => {
        if (existingExec) {
          return prev.map((e) => (e.id === existingExec.id ? existingExec : e))
        }
        return prev.filter((e) => e.id !== tempId)
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Filtered routines
  const filteredRotinas = useMemo(() => {
    return rotinas.filter((r) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchName = r.nome.toLowerCase().includes(query)
        const matchResp = r.responsavel.toLowerCase().includes(query)
        const matchFerramenta = r.ferramenta?.toLowerCase().includes(query) || false
        const matchValidacao = r.validacao?.toLowerCase().includes(query) || false
        if (!matchName && !matchResp && !matchFerramenta && !matchValidacao) {
          return false
        }
      }

      // Frequency filter
      if (selectedFreq !== 'Todas') {
        if (selectedFreq === 'Conforme demanda') {
          if (
            r.frequencia !== 'Conforme vendas' &&
            r.frequencia !== 'A cada recebimento' &&
            r.frequencia !== 'Rotinas'
          ) {
            return false
          }
        } else if (r.frequencia !== selectedFreq) {
          return false
        }
      }

      // Area filter
      if (selectedArea !== 'Todas') {
        const routineArea = r.area || r.responsavel
        if (routineArea !== selectedArea) {
          return false
        }
      }

      return true
    })
  }, [rotinas, searchTerm, selectedFreq, selectedArea])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedFreq('Todas')
    setSelectedArea('Todas')
  }

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRotina(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-96 bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-full" />
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-full" />
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-44 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-44 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-[#E5E7EB] rounded-lg text-center space-y-3 shadow-xs">
        <p className="text-sm text-[#B91C1C] font-medium">
          Não foi possível carregar as rotinas. Tente novamente.
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
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
            Rotinas operacionais
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Biblioteca de rotinas da loja. Filtre, veja detalhes e marque execuções.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar rotina..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="space-y-3">
        {/* Frequency filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold text-[#4B5563] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Frequência:
          </span>
          {frequencyFilters.map((freq) => {
            const active = selectedFreq === freq
            return (
              <button
                key={freq}
                onClick={() => setSelectedFreq(freq)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                    : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
                }`}
              >
                {freq}
              </button>
            )
          })}
        </div>

        {/* Area filters */}
        {availableAreas.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-[#E5E7EB]">
            <span className="font-semibold text-[#4B5563] mr-1">Área:</span>
            <button
              onClick={() => setSelectedArea('Todas')}
              className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-200 ${
                selectedArea === 'Todas'
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
              }`}
            >
              Todas as áreas
            </button>
            {availableAreas.map((area) => {
              const active = selectedArea === area
              return (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
                  }`}
                >
                  {area}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Routine Cards Grid */}
      {filteredRotinas.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#E5E7EB] rounded-lg space-y-3">
          <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <p className="text-sm text-[#4B5563] font-medium">
            Nenhuma rotina encontrada com esses filtros.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold bg-[#F7F7F5] border border-[#E5E7EB] text-[#1F2937] hover:bg-gray-100 rounded-md transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRotinas.map((rotina) => {
            const isDone = completionMap.has(rotina.id)
            const pastDue = !isDone && isPastDue(rotina.horario_limite)

            return (
              <div
                key={rotina.id}
                className={`bg-white border rounded-lg p-4 flex flex-col justify-between shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isDone
                    ? 'opacity-70 border-[#E5E7EB] bg-gray-50/50'
                    : pastDue
                      ? 'border-red-200'
                      : 'border-[#E5E7EB] hover:border-[#0F766E]/50'
                }`}
              >
                <div>
                  {/* Routine Name */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <h3
                      className={`font-bold text-base leading-snug cursor-pointer hover:text-[#0F766E] transition-colors ${
                        isDone ? 'line-through text-[#6B7280]' : 'text-[#1F2937]'
                      }`}
                      onClick={() => setSelectedRotina(rotina)}
                    >
                      {rotina.nome}
                    </h3>
                    {pastDue && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-[#B91C1C] rounded">
                        Atrasada
                      </span>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E7EB] text-[#4B5563]">
                      <User className="w-3 h-3 text-[#9CA3AF]" />
                      <span>{rotina.responsavel}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E7EB] text-[#4B5563]">
                      <Clock className="w-3 h-3 text-[#9CA3AF]" />
                      <span>{rotina.frequencia}</span>
                    </span>

                    {rotina.horario_limite && (
                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                          pastDue
                            ? 'border-red-200 bg-red-50 text-[#B91C1C] font-semibold'
                            : 'border-[#E5E7EB] bg-[#F7F7F5] text-[#374151]'
                        }`}
                      >
                        Até {rotina.horario_limite}
                      </span>
                    )}
                  </div>

                  {/* Details Lines */}
                  <div className="space-y-1 text-xs text-[#6B7280] mb-4">
                    {rotina.ferramenta && (
                      <div className="flex items-start gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 mt-0.5" />
                        <span className="text-[#6B7280]">Ferramenta:</span>
                        <span className="text-[#374151] font-medium truncate">
                          {rotina.ferramenta}
                        </span>
                      </div>
                    )}
                    {rotina.validacao && (
                      <div className="flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 mt-0.5" />
                        <span className="text-[#6B7280]">Validação:</span>
                        <span className="text-[#374151] font-medium truncate">
                          {rotina.validacao}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedRotina(rotina)}
                    className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 group transition-colors"
                  >
                    <span>Ver detalhes</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    onClick={() => handleToggle(rotina.id)}
                    disabled={submittingId === rotina.id}
                    title={isDone ? 'Desmarcar conclusão' : 'Marcar conclusão hoje'}
                    aria-label={`Marcar ${rotina.nome}`}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 transform active:scale-90 ${
                      isDone
                        ? 'bg-[#0F766E] border-[#0F766E] text-white'
                        : 'border-[#D1D5DB] hover:border-[#0F766E] text-transparent hover:text-gray-300 bg-white'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Routine Detail Modal / Bottom Sheet */}
      {selectedRotina && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setSelectedRotina(null)}
          />

          {/* Modal / Bottom Sheet Box */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-xl sm:rounded-lg shadow-xl p-5 sm:p-6 z-10 border border-[#E5E7EB] max-h-[85vh] overflow-y-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0F766E]/10 text-[#0F766E] mb-1">
                  {selectedRotina.area || 'Operação de Loja'}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
                  {selectedRotina.nome}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRotina(null)}
                className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="py-4 space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-[#F7F7F5] border border-[#E5E7EB]">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Responsável
                  </span>
                  <span className="font-medium text-[#1F2937]">{selectedRotina.responsavel}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Frequência
                  </span>
                  <span className="font-medium text-[#1F2937]">{selectedRotina.frequencia}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Horário limite
                  </span>
                  <span className="font-mono font-medium text-[#1F2937]">
                    {selectedRotina.horario_limite || 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Validação
                  </span>
                  <span className="font-medium text-[#1F2937]">
                    {selectedRotina.validacao || 'Liderança'}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#4B5563] mb-1 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#9CA3AF]" />
                  Ferramenta necessária
                </span>
                <p className="text-xs sm:text-sm text-[#1F2937] bg-white border border-[#E5E7EB] p-2.5 rounded-md">
                  {selectedRotina.ferramenta || 'Nenhuma ferramenta específica informada.'}
                </p>
              </div>

              {selectedRotina.observacoes && (
                <div>
                  <span className="block text-xs font-semibold text-[#4B5563] mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#9CA3AF]" />
                    Observações e orientações
                  </span>
                  <p className="text-xs sm:text-sm text-[#4B5563] bg-white border border-[#E5E7EB] p-2.5 rounded-md leading-relaxed">
                    {selectedRotina.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedRotina(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors"
              >
                Fechar
              </button>
              {(() => {
                const isDone = completionMap.has(selectedRotina.id)
                return (
                  <button
                    onClick={() => {
                      handleToggle(selectedRotina.id)
                    }}
                    disabled={submittingId === selectedRotina.id}
                    className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-colors ${
                      isDone
                        ? 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'
                        : 'bg-[#0F766E] text-white hover:bg-[#115E59]'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isDone ? 'Concluída hoje (desmarcar)' : 'Concluir rotina'}</span>
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
