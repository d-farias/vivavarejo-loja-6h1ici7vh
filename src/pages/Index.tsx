import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import type { Rotina, ExecucaoRotina } from '@/types'
import { parseHorarioLimiteToMinutes, getHorarioStatus } from '@/lib/time-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Check,
  X,
  RefreshCw,
  User,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Index() {
  const { user } = useAuth()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dismissAlert, setDismissAlert] = useState(false)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('Todas')

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

  // Realtime subscription to rotinas (para refletir adições/edições/importações instantaneamente)
  useRealtime<Rotina>(
    'rotinas',
    useCallback((data) => {
      const record = data.record
      setRotinas((prev) => {
        if (data.action === 'delete') {
          return prev.filter((item) => item.id !== record.id)
        }
        if (data.action === 'create') {
          const exists = prev.some((item) => item.id === record.id)
          return exists ? prev : [record, ...prev]
        }
        if (data.action === 'update') {
          return prev.map((item) => (item.id === record.id ? record : item))
        }
        return prev
      })
    }, []),
    !!user,
  )

  // Realtime subscription to execucoes_rotinas
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

  // Mapping of executions by routine ID
  const completionMap = useMemo(() => {
    const map = new Map<string, ExecucaoRotina>()
    for (const exec of execucoes) {
      if (exec.concluida) {
        map.set(exec.rotina, exec)
      }
    }
    return map
  }, [execucoes])

  // Stats computation
  const stats = useMemo(() => {
    const total = rotinas.length
    let concluidas = 0
    let emAtraso = 0

    rotinas.forEach((r) => {
      const isDone = completionMap.has(r.id)
      if (isDone) {
        concluidas++
      } else {
        const status = getHorarioStatus(r.horario_limite, false)
        if (status.isAtrasada) {
          emAtraso++
        }
      }
    })

    const pendentes = Math.max(0, total - concluidas)
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0

    // Find most frequent validator
    const validatorCounts: Record<string, number> = {}
    rotinas.forEach((r) => {
      if (r.validacao) {
        validatorCounts[r.validacao] = (validatorCounts[r.validacao] || 0) + 1
      }
    })
    let topValidator = 'Gerente/GO'
    let maxCount = 0
    for (const [val, count] of Object.entries(validatorCounts)) {
      if (count > maxCount) {
        maxCount = count
        topValidator = val
      }
    }

    return {
      total,
      concluidas,
      pendentes,
      emAtraso,
      percentual,
      validador: topValidator,
    }
  }, [rotinas, completionMap])

  // Resumo por área (concluídas/total do dia por área)
  const areaSummary = useMemo(() => {
    const map = new Map<
      string,
      { area: string; total: number; concluidas: number; atrasadas: number }
    >()

    rotinas.forEach((r) => {
      const area = (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || 'Geral'
      const existing = map.get(area) || { area, total: 0, concluidas: 0, atrasadas: 0 }
      existing.total++

      const isDone = completionMap.has(r.id)
      if (isDone) {
        existing.concluidas++
      } else {
        const status = getHorarioStatus(r.horario_limite, false)
        if (status.isAtrasada) {
          existing.atrasadas++
        }
      }
      map.set(area, existing)
    })

    return Array.from(map.values()).sort((a, b) => {
      // Prioriza áreas com atraso, depois maior volume
      if (b.atrasadas !== a.atrasadas) return b.atrasadas - a.atrasadas
      return b.total - a.total
    })
  }, [rotinas, completionMap])

  // Lista ordenada de rotinas:
  // 1. Atrasadas não concluídas no topo
  // 2. Não concluídas dentro do prazo ordenadas por horário limite crescente
  // 3. Rotinas sem horário / integrais
  // 4. Rotinas já concluídas no final
  const sortedRoutines = useMemo(() => {
    let list = [...rotinas]
    if (selectedAreaFilter !== 'Todas') {
      list = list.filter((r) => {
        const area = (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || 'Geral'
        return area === selectedAreaFilter
      })
    }

    return list.sort((a, b) => {
      const aDone = completionMap.has(a.id)
      const bDone = completionMap.has(b.id)

      // Se status de conclusão difere, concluídas vão para o final
      if (aDone !== bDone) {
        return aDone ? 1 : -1
      }

      const aStatus = getHorarioStatus(a.horario_limite, aDone)
      const bStatus = getHorarioStatus(b.horario_limite, bDone)

      // Se não estão concluídas, atrasadas vão pro topo absoluto
      if (!aDone && !bDone) {
        if (aStatus.isAtrasada !== bStatus.isAtrasada) {
          return aStatus.isAtrasada ? -1 : 1
        }
      }

      // Ordena por horário limite em minutos (crescente)
      const aMin = parseHorarioLimiteToMinutes(a.horario_limite)
      const bMin = parseHorarioLimiteToMinutes(b.horario_limite)

      if (aMin !== null && bMin !== null) {
        if (aMin !== bMin) return aMin - bMin
      } else if (aMin !== null) {
        return -1
      } else if (bMin !== null) {
        return 1
      }

      // Desempate por nome
      return a.nome.localeCompare(b.nome)
    })
  }, [rotinas, completionMap, selectedAreaFilter])

  // Toggle routine completion with optimistic update
  const handleToggle = async (rotinaId: string) => {
    if (!user || submittingId === rotinaId) return

    const existingExec = execucoes.find((e) => e.rotina === rotinaId && e.usuario === user.id)
    const isCurrentlyDone = !!existingExec?.concluida
    const nextState = !isCurrentlyDone

    // Optimistic state
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
      // replace optimistic with real record
      setExecucoes((prev) => {
        const filtered = prev.filter((e) => e.id !== tempId && e.id !== saved.id)
        return [...filtered, saved]
      })
    } catch {
      // Rollback on failure
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

  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Líder'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-80 bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full bg-gray-200 rounded-lg" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-6 w-40 bg-gray-200" />
          <Skeleton className="h-20 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-20 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-20 w-full bg-gray-200 rounded-lg" />
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
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
            Olá, {firstName}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Painel diário de acompanhamento e controle operacional da loja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/rotinas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-xs font-semibold text-[#1F2937] rounded-md shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Gerenciar / Importar Rotinas</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Concluídas */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 flex items-center gap-3 shadow-xs hover:border-[#047857]/40 transition-colors">
          <div className="w-10 h-10 rounded-md bg-[#047857]/10 text-[#047857] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#1F2937]">
              {stats.concluidas}
            </div>
            <div className="text-[11px] sm:text-xs text-[#6B7280] leading-tight font-medium">
              Rotinas concluídas hoje
            </div>
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 flex items-center gap-3 shadow-xs hover:border-[#0F766E]/40 transition-colors">
          <div className="w-10 h-10 rounded-md bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#1F2937]">
              {stats.pendentes}
            </div>
            <div className="text-[11px] sm:text-xs text-[#6B7280] leading-tight font-medium">
              Rotinas pendentes
            </div>
          </div>
        </div>

        {/* Em atraso */}
        <div
          className={`bg-white border rounded-lg p-4 sm:p-5 flex items-center gap-3 shadow-xs transition-colors ${
            stats.emAtraso > 0 ? 'border-red-300 bg-red-50/20' : 'border-[#E5E7EB]'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
              stats.emAtraso > 0 ? 'bg-[#B91C1C]/15 text-[#B91C1C]' : 'bg-gray-100 text-[#9CA3AF]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div
              className={`text-xl sm:text-2xl font-bold font-mono ${
                stats.emAtraso > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
              }`}
            >
              {stats.emAtraso}
            </div>
            <div className="text-[11px] sm:text-xs text-[#6B7280] leading-tight font-medium">
              Rotinas em atraso
            </div>
          </div>
        </div>

        {/* Validador responsável */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 flex items-center gap-3 shadow-xs hover:border-[#0F766E]/40 transition-colors">
          <div className="w-10 h-10 rounded-md bg-gray-100 text-[#4B5563] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
              {stats.validador}
            </div>
            <div className="text-[11px] sm:text-xs text-[#6B7280] leading-tight font-medium">
              Validação principal
            </div>
          </div>
        </div>
      </div>

      {/* (a) FAIXA DE PROGRESSO DO DIA */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#1F2937]">
                Progresso Operacional de Hoje
              </span>
              <span className="text-xs text-[#6B7280] ml-2">
                {stats.concluidas} de {stats.total} rotinas concluídas ({stats.percentual}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {stats.emAtraso > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#B91C1C]">
                <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                {stats.emAtraso} atrasada(s)
              </span>
            )}
            {stats.total > 0 && stats.concluidas === stats.total && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#047857]">
                <Sparkles className="w-3.5 h-3.5" />
                100% da operação realizada!
              </span>
            )}
          </div>
        </div>

        {/* Barra de progresso sóbria */}
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              stats.percentual === 100
                ? 'bg-[#047857]'
                : stats.emAtraso > 0
                  ? 'bg-[#0F766E]'
                  : 'bg-[#0F766E]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, stats.percentual))}%` }}
          />
        </div>
      </div>

      {/* Alert Banner se houver rotinas atrasadas */}
      {stats.emAtraso > 0 && !dismissAlert && (
        <div className="p-3.5 sm:p-4 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-[#B91C1C] text-xs sm:text-sm animate-fade-in transition-all">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <span className="font-semibold">
              Atenção: há {stats.emAtraso} rotina(s) com horário limite ultrapassado pendentes de
              execução.
            </span>
          </div>
          <button
            onClick={() => setDismissAlert(true)}
            className="p-1 text-[#B91C1C] hover:text-red-900 rounded hover:bg-red-100 transition-colors"
            aria-label="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* (c) RESUMO POR ÁREA (concluídas / total do dia por área) */}
      {areaSummary.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                Acompanhamento por Área da Loja
              </h2>
              <p className="text-xs text-[#6B7280]">
                Status de execução consolidado por setor operacional
              </p>
            </div>
            {selectedAreaFilter !== 'Todas' && (
              <button
                onClick={() => setSelectedAreaFilter('Todas')}
                className="text-xs font-semibold text-[#0F766E] hover:underline"
              >
                Limpar filtro de área
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {areaSummary.map((item) => {
              const pct = item.total > 0 ? Math.round((item.concluidas / item.total) * 100) : 0
              const isSelected = selectedAreaFilter === item.area

              return (
                <button
                  key={item.area}
                  onClick={() =>
                    setSelectedAreaFilter((prev) => (prev === item.area ? 'Todas' : item.area))
                  }
                  className={`text-left p-3 rounded-md border transition-all ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#0F766E]/5 ring-1 ring-[#0F766E]'
                      : item.atrasadas > 0
                        ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                        : 'border-[#E5E7EB] bg-[#F7F7F5]/50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[#1F2937] truncate" title={item.area}>
                      {item.area}
                    </span>
                    {item.atrasadas > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-[#B91C1C]">
                        {item.atrasadas} atr.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] mb-1.5">
                    <span>
                      {item.concluidas}/{item.total} feitas
                    </span>
                    <span className="font-mono font-semibold text-[#1F2937]">{pct}%</span>
                  </div>

                  {/* Micro barra por área */}
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct === 100
                          ? 'bg-[#047857]'
                          : item.atrasadas > 0
                            ? 'bg-[#B91C1C]'
                            : 'bg-[#0F766E]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* (b) LISTA "ROTINAS DE HOJE" COM DESTAQUE DAS ATRASADAS NO TOPO E ORDENADAS POR HORÁRIO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1F2937]">Rotinas operacionais de hoje</h2>
              {selectedAreaFilter !== 'Todas' && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E]">
                  Filtrando: {selectedAreaFilter}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              Ordenadas com prioridade para rotinas em atraso e horário limite de execução
            </p>
          </div>

          <Link
            to="/rotinas"
            className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Gerenciar biblioteca completa ({rotinas.length})</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {sortedRoutines.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
            <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280]">Nenhuma rotina encontrada para a seleção.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedRoutines.map((rotina) => {
              const isDone = completionMap.has(rotina.id)
              const status = getHorarioStatus(rotina.horario_limite, isDone)
              const pastDue = status.isAtrasada

              return (
                <div
                  key={rotina.id}
                  className={`bg-white border rounded-lg p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all duration-200 ${
                    isDone
                      ? 'opacity-60 border-[#E5E7EB] bg-gray-50/60'
                      : pastDue
                        ? 'border-red-300 bg-red-50/20 shadow-xs'
                        : 'border-[#E5E7EB] hover:border-[#0F766E]/40 hover:shadow-xs'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm sm:text-base font-semibold ${
                          isDone ? 'line-through text-[#6B7280]' : 'text-[#1F2937]'
                        }`}
                      >
                        {rotina.nome}
                      </span>

                      {/* Sinalizador vermelho de atraso ou neutro/teal */}
                      {!isDone && pastDue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-[#B91C1C] border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            ATRASADA ({status.normalizedHorario || rotina.horario_limite})
                          </span>
                        </span>
                      )}

                      {!isDone && !pastDue && status.hasHorario && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                          <Clock className="w-3 h-3" />
                          <span>No prazo: {status.displayLabel}</span>
                        </span>
                      )}

                      {!isDone && status.isIntegral && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-[#4B5563] border border-gray-200">
                          Integral (dia todo)
                        </span>
                      )}

                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-[#047857] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Concluída hoje</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7280] flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span className="font-medium text-[#374151]">{rotina.responsavel}</span>
                      </span>

                      {rotina.area && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-[#4B5563]">
                          {rotina.area}
                        </span>
                      )}

                      {rotina.frequencia && (
                        <span className="text-[#6B7280]">• {rotina.frequencia}</span>
                      )}

                      {rotina.ferramenta && (
                        <span className="hidden md:inline text-[#6B7280]">
                          • Ferramenta: <span className="text-[#374151]">{rotina.ferramenta}</span>
                        </span>
                      )}

                      {rotina.validacao && (
                        <span className="hidden sm:inline text-[#6B7280]">
                          • Validação: <span className="text-[#374151]">{rotina.validacao}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Circular check toggle */}
                  <div className="shrink-0 pl-2">
                    <button
                      onClick={() => handleToggle(rotina.id)}
                      disabled={submittingId === rotina.id}
                      title={isDone ? 'Desmarcar conclusão' : 'Marcar como concluída'}
                      aria-label={`Marcar ${rotina.nome} como concluída`}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-150 transform active:scale-90 ${
                        isDone
                          ? 'bg-[#047857] border-[#047857] text-white'
                          : pastDue
                            ? 'border-red-400 hover:border-red-600 text-transparent hover:text-red-400 bg-white'
                            : 'border-[#D1D5DB] hover:border-[#0F766E] text-transparent hover:text-gray-300 bg-white'
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
