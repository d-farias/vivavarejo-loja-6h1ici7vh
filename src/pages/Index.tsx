import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import type { Rotina, ExecucaoRotina } from '@/types'
import { isPastDue } from '@/lib/time-utils'
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

  // Filter today's routines (Diária, Semanal, etc. or top 8 for display)
  const todayRoutines = useMemo(() => {
    return rotinas.slice(0, 8)
  }, [rotinas])

  // Stats computation
  const stats = useMemo(() => {
    const total = rotinas.length
    let concluidas = 0
    let emAtraso = 0

    rotinas.forEach((r) => {
      const isDone = completionMap.has(r.id)
      if (isDone) {
        concluidas++
      } else if (isPastDue(r.horario_limite)) {
        emAtraso++
      }
    })

    const pendentes = Math.max(0, total - concluidas)

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
      concluidas,
      pendentes,
      emAtraso,
      validador: topValidator,
    }
  }, [rotinas, completionMap])

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
          Olá, {firstName}
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">Acompanhe as rotinas da sua loja hoje.</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Concluídas */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 flex items-center gap-3 shadow-xs hover:border-[#0F766E]/40 transition-colors">
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
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 flex items-center gap-3 shadow-xs hover:border-red-300 transition-colors">
          <div className="w-10 h-10 rounded-md bg-[#B91C1C]/10 text-[#B91C1C] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#B91C1C]">
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
              Validador responsável
            </div>
          </div>
        </div>
      </div>

      {/* Alert Panel (Past due routines) */}
      {stats.emAtraso > 0 && !dismissAlert && (
        <div className="p-3.5 sm:p-4 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-between text-[#92400E] text-xs sm:text-sm animate-fade-in transition-all">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="font-medium">
              Há {stats.emAtraso} rotina(s) em atraso. Revise a lista de hoje abaixo.
            </span>
          </div>
          <button
            onClick={() => setDismissAlert(true)}
            className="p-1 text-[#92400E] hover:text-[#78350F] rounded hover:bg-[#FDE68A]/60 transition-colors"
            aria-label="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rotinas de Hoje Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1F2937]">Rotinas de hoje</h2>
            <p className="text-xs text-[#6B7280]">Ordenadas por horário limite de execução</p>
          </div>
          <Link
            to="/rotinas"
            className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 group"
          >
            <span>Ver biblioteca completa</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {todayRoutines.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
            <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280]">Nenhuma rotina cadastrada para hoje.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayRoutines.map((rotina) => {
              const isDone = completionMap.has(rotina.id)
              const pastDue = !isDone && isPastDue(rotina.horario_limite)

              return (
                <div
                  key={rotina.id}
                  className={`bg-white border rounded-lg p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all duration-200 ${
                    isDone
                      ? 'opacity-60 border-[#E5E7EB] bg-gray-50/60'
                      : pastDue
                        ? 'border-red-200 hover:border-red-300'
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
                      {pastDue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-[#B91C1C]">
                          Atrasada
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280] flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{rotina.responsavel}</span>
                      </span>

                      {rotina.horario_limite && (
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                            pastDue
                              ? 'border-red-200 bg-red-50 text-[#B91C1C] font-semibold'
                              : 'border-[#E5E7EB] bg-[#F7F7F5] text-[#374151]'
                          }`}
                        >
                          Até {rotina.horario_limite}
                        </span>
                      )}

                      {rotina.ferramenta && (
                        <span className="hidden sm:inline text-[#6B7280]">
                          Ferramenta:{' '}
                          <strong className="font-normal text-[#374151]">
                            {rotina.ferramenta}
                          </strong>
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
                          ? 'bg-[#0F766E] border-[#0F766E] text-white'
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
