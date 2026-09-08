import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import type { Rotina, ExecucaoRotina, PlanoAcao, Cliente, PrioridadePlanoAcao } from '@/types'
import { parseHorarioLimiteToMinutes, getHorarioStatus } from '@/lib/time-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreSelector } from '@/components/StoreSelector'
import { PlanoAcaoModal } from '@/components/PlanoAcaoModal'
import { BotaoAvisoWhatsApp } from '@/components/BotaoAvisoWhatsApp'
import { PwaInstallModal } from '@/components/PwaInstallModal'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { EnquadramentoClienteCard } from '@/components/EnquadramentoClienteCard'
import { AtendimentoPosAcessoModal } from '@/components/AtendimentoPosAcessoModal'
import { planosAcaoService } from '@/services/planosAcao'
import { clientesService } from '@/services/clientes'
import { atendimentosService } from '@/services/atendimentos'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Layers,
  Smartphone,
  Calendar,
  Check,
  Wrench,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

type PeriodoDashboard = 'hoje' | 'semana' | 'mes'

export default function Index() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojaSelecionada } = useStore()

  const [periodo, setPeriodo] = useState<PeriodoDashboard>('hoje')
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoesPeriodo, setExecucoesPeriodo] = useState<ExecucaoRotina[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [clientesAdmin, setClientesAdmin] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Modal Chamado / Plano de Ação
  const [planoModalOpen, setPlanoModalOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<PlanoAcao | null>(null)
  const [rotinaOrigemPlano, setRotinaOrigemPlano] = useState<Rotina | null>(null)

  // Atendimento Pós-Acesso Inteligente
  const [atendimentoModalOpen, setAtendimentoModalOpen] = useState(false)
  const [clienteDoUsuario, setClienteDoUsuario] = useState<Cliente | null>(null)

  // PWA Install
  const [pwaModalOpen, setPwaModalOpen] = useState(false)
  const { isInstalled, isIOS, promptInstall } = usePwaInstall()

  const handleOpenInstall = async () => {
    if (isIOS) {
      setPwaModalOpen(true)
    } else {
      const res = await promptInstall()
      if (res === 'unavailable') {
        setPwaModalOpen(true)
      }
    }
  }

  const isAdmin = user?.perfil === 'admin' || user?.email === 'dfarias53@gmail.com'

  // Determinar range de datas para o período selecionado
  const dateRange = useMemo(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    if (periodo === 'hoje') {
      return { startStr: todayStr, endStr: todayStr, daysCount: 1 }
    }

    if (periodo === 'semana') {
      const d7 = new Date(today)
      d7.setDate(d7.getDate() - 6)
      const y7 = d7.getFullYear()
      const m7 = String(d7.getMonth() + 1).padStart(2, '0')
      const dia7 = String(d7.getDate()).padStart(2, '0')
      return { startStr: `${y7}-${m7}-${dia7}`, endStr: todayStr, daysCount: 7 }
    }

    // mes: últimos 30 dias
    const d30 = new Date(today)
    d30.setDate(d30.getDate() - 29)
    const y30 = d30.getFullYear()
    const m30 = String(d30.getMonth() + 1).padStart(2, '0')
    const dia30 = String(d30.getDate()).padStart(2, '0')
    return { startStr: `${y30}-${m30}-${dia30}`, endStr: todayStr, daysCount: 30 }
  }, [periodo])

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [allRoutines, execs, planos, clientes] = await Promise.all([
        rotinasService.getAll(lojaSelecionadaId),
        periodo === 'hoje'
          ? execucoesService.getTodayExecutions(user.id)
          : execucoesService.getExecutionsBetween(dateRange.startStr, dateRange.endStr),
        planosAcaoService.getAll(lojaSelecionadaId).catch(() => [] as PlanoAcao[]),
        isAdmin
          ? clientesService.getAll().catch(() => [] as Cliente[])
          : Promise.resolve([] as Cliente[]),
      ])

      setRotinas(allRoutines)
      setExecucoesPeriodo(execs)
      setPlanosAcao(planos)
      setClientesAdmin(clientes)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user, lojaSelecionadaId, periodo, dateRange.startStr, dateRange.endStr, isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Verificação e exibição do Atendimento Pós-Acesso Inteligente
  useEffect(() => {
    if (!user || user.email === 'dfarias53@gmail.com') return

    atendimentosService.notificarPrimeiroAcesso().catch(() => {})

    const localDispensado = localStorage.getItem(`vivavarejo_atendimento_dispensado_${user.id}`)
    const localRespondido = localStorage.getItem(`vivavarejo_atendimento_respondido_${user.id}`)

    if (localDispensado || localRespondido) return

    clientesService
      .getAll()
      .then((clis) => {
        const found = clis.find((c) => c.contato && c.contato.includes(user.email))
        if (found) {
          setClienteDoUsuario(found)
        }
      })
      .catch(() => {})

    atendimentosService
      .getByUsuario(user.id)
      .then((existente) => {
        if (!existente) {
          const timer = setTimeout(() => {
            setAtendimentoModalOpen(true)
          }, 900)
          return () => clearTimeout(timer)
        }
      })
      .catch(() => {})
  }, [user])

  // Realtime subscription
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

  useRealtime<ExecucaoRotina>(
    'execucoes_rotinas',
    useCallback(
      (data) => {
        const record = data.record
        const execDate = record.data_execucao ? record.data_execucao.substring(0, 10) : ''
        const isInRange = execDate >= dateRange.startStr && execDate <= dateRange.endStr
        if (!isInRange) return

        setExecucoesPeriodo((prev) => {
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
      },
      [dateRange],
    ),
    !!user,
  )

  // Map de execuções válidas de hoje
  const todayExecMap = useMemo(() => {
    const todayStr = getTodayDateString()
    const map = new Map<string, ExecucaoRotina>()
    for (const exec of execucoesPeriodo) {
      if (
        exec.data_execucao &&
        exec.data_execucao.startsWith(todayStr) &&
        exec.concluida &&
        exec.status_validacao !== 'devolvida'
      ) {
        map.set(exec.rotina, exec)
      }
    }
    return map
  }, [execucoesPeriodo])

  // Indicadores consolidados do período selecionado
  const kpis = useMemo(() => {
    const totalProgramadas = rotinas.length * dateRange.daysCount

    // Concluídas
    const validExecs = execucoesPeriodo.filter(
      (e) => e.concluida && e.status_validacao !== 'devolvida',
    )
    const concluidas = validExecs.length
    const aprovadas = validExecs.filter((e) => e.status_validacao === 'aprovada').length
    const aguardandoValidacao = validExecs.filter(
      (e) => e.status_validacao === 'aguardando_validacao' || !e.status_validacao,
    ).length

    // Atrasadas: para 'hoje', analisa horário limite das rotinas não concluídas.
    // Para 'semana' / 'mes', considera a meta programada menos as concluídas no período.
    let atrasadas = 0
    if (periodo === 'hoje') {
      rotinas.forEach((r) => {
        const isDone = todayExecMap.has(r.id)
        if (!isDone) {
          const status = getHorarioStatus(r.horario_limite, false)
          if (status.isAtrasada) {
            atrasadas++
          }
        }
      })
    } else {
      atrasadas = Math.max(0, totalProgramadas - concluidas)
    }

    const taxaConclusao =
      totalProgramadas > 0 ? Math.min(100, Math.round((concluidas / totalProgramadas) * 100)) : 0
    const taxaAprovacao =
      concluidas > 0 ? Math.min(100, Math.round((aprovadas / concluidas) * 100)) : 0

    // Semântica sóbria de cores conforme resultado:
    // Conclusão/Aderência: >= 90% esmeralda sóbrio (#059669), 70-89% âmbar (#D97706), < 70% vermelho (#DC2626)
    const conclusaoColorClass =
      taxaConclusao >= 90
        ? 'text-emerald-700'
        : taxaConclusao >= 70
          ? 'text-amber-700'
          : 'text-red-700'

    const conclusaoBadgeClass =
      taxaConclusao >= 90
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : taxaConclusao >= 70
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-red-50 text-red-700 border-red-200'

    const conclusaoIconClass =
      taxaConclusao >= 90
        ? 'bg-emerald-50 text-emerald-600'
        : taxaConclusao >= 70
          ? 'bg-amber-50 text-amber-600'
          : 'bg-red-50 text-red-600'

    const conclusaoHex =
      taxaConclusao >= 90 ? '#059669' : taxaConclusao >= 70 ? '#D97706' : '#DC2626'

    return {
      totalTarefas: totalProgramadas,
      concluidas,
      aprovadas,
      aguardandoValidacao,
      atrasadas,
      taxaConclusao,
      taxaAprovacao,
      conclusaoColorClass,
      conclusaoBadgeClass,
      conclusaoIconClass,
      conclusaoHex,
    }
  }, [rotinas, execucoesPeriodo, dateRange.daysCount, periodo, todayExecMap])

  // Dados para Gráfico de Rosca / Donut de Aderência
  const donutData = useMemo(() => {
    return [
      { name: 'Aprovadas / Validadas', value: kpis.aprovadas, color: '#059669' },
      { name: 'Aguardando Validação', value: kpis.aguardandoValidacao, color: '#2563EB' },
      {
        name: 'Atrasadas / Pendentes',
        value: Math.max(0, kpis.atrasadas),
        color: kpis.atrasadas > 0 ? '#DC2626' : '#94A3B8',
      },
    ].filter((item) => item.value > 0)
  }, [kpis])

  // Dados para Gráfico de Barras por Setor / Área da Loja
  const barChartPorSetor = useMemo(() => {
    const areaMap = new Map<
      string,
      {
        setor: string
        programadas: number
        concluidas: number
        aprovadas: number
        atrasadas: number
      }
    >()

    // Popular todas as áreas presentes nas rotinas
    rotinas.forEach((r) => {
      const area = (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || 'Geral'
      const existing = areaMap.get(area) || {
        setor: area,
        programadas: 0,
        concluidas: 0,
        aprovadas: 0,
        atrasadas: 0,
      }
      existing.programadas += dateRange.daysCount

      // Cálculo de atrasadas para o dia
      if (periodo === 'hoje') {
        const isDone = todayExecMap.has(r.id)
        if (!isDone) {
          const status = getHorarioStatus(r.horario_limite, false)
          if (status.isAtrasada) {
            existing.atrasadas++
          }
        }
      }
      areaMap.set(area, existing)
    })

    // Contabilizar execuções válidas
    execucoesPeriodo.forEach((e) => {
      if (!e.concluida || e.status_validacao === 'devolvida') return
      const r = rotinas.find((rot) => rot.id === e.rotina)
      const area = (r?.area && r.area.trim()) || (r?.responsavel && r.responsavel.trim()) || 'Geral'
      const existing = areaMap.get(area)
      if (existing) {
        existing.concluidas++
        if (e.status_validacao === 'aprovada') {
          existing.aprovadas++
        }
      }
    })

    // Ajuste de atrasadas para semana/mês
    if (periodo !== 'hoje') {
      areaMap.forEach((val) => {
        val.atrasadas = Math.max(0, val.programadas - val.concluidas)
      })
    }

    return Array.from(areaMap.values())
      .sort((a, b) => b.programadas - a.programadas)
      .slice(0, 7) // Top 7 setores para caber com elegância em qualquer tela
  }, [rotinas, execucoesPeriodo, dateRange.daysCount, periodo, todayExecMap])

  // Desvios Críticos e Alertas para WhatsApp Direto (Sem lista longa de rotinas)
  const desviosCriticos = useMemo(() => {
    // 1. Rotinas em atraso no momento
    const atrasos = rotinas
      .filter((r) => {
        const isDone = todayExecMap.has(r.id)
        if (isDone) return false
        const status = getHorarioStatus(r.horario_limite, false)
        return status.isAtrasada
      })
      .map((r) => {
        const status = getHorarioStatus(r.horario_limite, false)
        return {
          id: `rotina-${r.id}`,
          tipo: 'Rotina Atrasada',
          titulo: r.nome,
          setor: r.area || 'Operação Loja',
          horario: status.normalizedHorario || r.horario_limite,
          responsavel: r.responsavel,
          telefone: r.telefone_responsavel || r.expand?.funcao?.telefone,
          rotinaRef: r,
        }
      })

    // 2. Chamados / Planos de ação com prioridade alta ou atrasados
    const chamadosCriticos = planosAcao
      .filter(
        (p) =>
          p.status !== 'concluida' &&
          (p.prioridade === 'alta' || (p.prazo && new Date(p.prazo) < new Date())),
      )
      .map((p) => ({
        id: `plano-${p.id}`,
        tipo: p.area_demandante ? `Chamado (${p.area_demandante})` : 'Plano 5W2H',
        titulo: p.descricao,
        setor: p.area_demandante || p.expand?.rotina?.area || 'Operações',
        horario: p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : undefined,
        responsavel: p.responsavel,
        telefone: undefined,
        rotinaRef: null,
      }))

    return [...atrasos, ...chamadosCriticos].slice(0, 4)
  }, [rotinas, todayExecMap, planosAcao])

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-72 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-[#E5E7EB] rounded-lg text-center space-y-3 shadow-xs">
        <p className="text-sm text-[#B91C1C] font-medium">
          Não foi possível carregar os indicadores analíticos do Dashboard.
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
      {/* Welcome Header, Filtro de Período e Seletor de Loja */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
              Dashboard Analítico
            </h1>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
              Operação em Tempo Real
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Olá, {firstName}. Visualização consolidada de desempenho, aderência e desvios
            operacionais.
          </p>
        </div>

        {/* Controles de Topo: Seletor de Loja + Seletor de Período HOJE / SEMANA / MÊS */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <StoreSelector />

          {/* Seletor de Período Analítico com tap target confortável */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setPeriodo('hoje')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-all min-h-[40px] flex items-center justify-center ${
                periodo === 'hoje'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('semana')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-all min-h-[40px] flex items-center justify-center ${
                periodo === 'semana'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('mes')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-all min-h-[40px] flex items-center justify-center ${
                periodo === 'mes'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              Mês
            </button>
          </div>

          {/* Ações de atalho direto com tap target confortável */}
          <button
            type="button"
            onClick={() => {
              setRotinaOrigemPlano(null)
              setEditingPlano(null)
              setPlanoModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white rounded-md shadow-xs transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Abrir Chamado / Ação</span>
          </button>

          {!isInstalled && (
            <button
              type="button"
              onClick={handleOpenInstall}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-[#2563EB] rounded-md transition-colors"
              title="Instale o VivaVarejo no celular"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar app</span>
            </button>
          )}
        </div>
      </div>

      {/* Menu de Enquadramento do Cliente (Exclusivo Admin) */}
      {isAdmin && clientesAdmin.length > 0 && (
        <EnquadramentoClienteCard clientes={clientesAdmin} onClienteUpdated={loadData} />
      )}

      {/* 4 KPIs Curtos no Topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Tarefas Programadas */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937] leading-none">
              {kpis.totalTarefas}
            </div>
            <div className="text-xs text-[#6B7280] font-medium mt-1">Tarefas programadas</div>
          </div>
        </div>

        {/* Taxa de Conclusão - Destaque de cor conforme resultado */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${kpis.conclusaoIconClass}`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none ${kpis.conclusaoColorClass}`}
            >
              {kpis.taxaConclusao}%
            </div>
            <div className="text-xs text-[#6B7280] font-medium mt-1 truncate">
              Concluídas ({kpis.concluidas})
            </div>
          </div>
        </div>

        {/* Aprovadas / Validadas */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937] leading-none">
              {kpis.aprovadas}
            </div>
            <div className="text-xs text-[#6B7280] font-medium mt-1 truncate">
              Aprovadas ({kpis.taxaAprovacao}%)
            </div>
          </div>
        </div>

        {/* Atrasadas / Em Risco - Vermelho sóbrio se > 0, neutro se 0 */}
        <div
          className={`bg-white border rounded-lg p-3.5 sm:p-5 shadow-xs flex items-center gap-3 transition-colors ${
            kpis.atrasadas > 0 ? 'border-red-300 bg-red-50/20' : 'border-[#E5E7EB]'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
              kpis.atrasadas > 0 ? 'bg-red-100 text-[#B91C1C]' : 'bg-gray-100 text-[#9CA3AF]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none ${
                kpis.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
              }`}
            >
              {kpis.atrasadas}
            </div>
            <div
              className={`text-xs font-medium mt-1 truncate ${
                kpis.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#6B7280]'
              }`}
            >
              {periodo === 'hoje' ? 'Tarefas atrasadas' : 'Desvios pendentes'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Sóbrios: Barras Comparativas por Setor + Donut de Aderência */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Barras Comparativas Concluídas x Aprovadas x Atrasadas por Setor (2 colunas em desktop) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">
                  Execução e Aderência por Setor Operacional
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Comparativo de tarefas concluídas, aprovadas e atrasadas ({periodo.toUpperCase()})
                </p>
              </div>
            </div>
          </div>

          {barChartPorSetor.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-[#6B7280]">
              <Clock className="w-6 h-6 text-gray-300 mb-2" />
              <span>Nenhum dado registrado para o período selecionado.</span>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartPorSetor}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="setor"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Bar
                    dataKey="concluidas"
                    name="Concluídas"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="aprovadas" name="Aprovadas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="atrasadas"
                    name="Atrasadas / Pendentes"
                    fill="#94A3B8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico 2: Donut de Aderência Operacional (1 coluna em desktop) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Donut de Aderência</h3>
              <p className="text-xs text-[#6B7280]">Composição das tarefas no período</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            {donutData.length === 0 ? (
              <span className="text-xs text-[#6B7280]">Sem tarefas apontadas</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Taxa centralizada no centro do Donut destacando cor conforme resultado */}
            {donutData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={`text-2xl font-extrabold leading-none ${kpis.conclusaoColorClass}`}
                >
                  {kpis.taxaConclusao}%
                </span>
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold mt-0.5">
                  Aderência
                </span>
              </div>
            )}
          </div>

          {/* Legenda customizada */}
          <div className="space-y-1.5 pt-3 border-t border-[#F1F5F9] text-xs">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[#4B5563]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                </div>
                <span className="font-semibold text-[#1F2937]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desvios Críticos e Notificações Rápidas WhatsApp (Sem carregar listas longas) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                Desvios Críticos & Alertas Imediatos
              </h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              Disparo contextual para líderes e encarregados sem poluir o painel analítico
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/agenda"
              className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
            >
              <span>Abrir Motor de Prioridade da Agenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {desviosCriticos.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Nenhum desvio crítico ou chamado pendente em atraso neste momento.</span>
            </div>
            <span className="font-semibold text-emerald-700">Operação em Conformidade</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {desviosCriticos.map((desvio) => (
              <div
                key={desvio.id}
                className="p-3.5 rounded-lg border border-red-200 bg-red-50/20 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-[#B91C1C] border border-red-200">
                      {desvio.tipo}
                    </span>
                    <span
                      className="text-xs sm:text-sm font-bold text-[#1F2937] truncate"
                      title={desvio.titulo}
                    >
                      {desvio.titulo}
                    </span>
                  </div>
                  <div className="text-xs text-[#6B7280] flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#4B5563]">Setor: {desvio.setor}</span>
                    <span>•</span>
                    <span>{desvio.responsavel || 'Sem responsável'}</span>
                    {desvio.horario && (
                      <>
                        <span>•</span>
                        <span className="text-[#B91C1C] font-semibold">
                          Limite: {desvio.horario}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <BotaoAvisoWhatsApp
                    lojaNome={lojaSelecionada?.nome}
                    tarefaTitulo={desvio.titulo}
                    setor={desvio.setor}
                    horario={desvio.horario}
                    situacao={desvio.tipo}
                    telefoneResponsavel={desvio.telefone}
                    nomeResponsavel={desvio.responsavel}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navegação Rápida para Módulos Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/agenda"
          className="p-4 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#2563EB] shadow-xs flex items-center justify-between group transition-all"
        >
          <div>
            <div className="text-xs font-bold uppercase text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
              Agenda & Motor de Prioridade
            </div>
            <div className="text-[11px] text-[#6B7280]">
              Execuções detalhadas do dia, checagem e score
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors" />
        </Link>

        <Link
          to="/rotinas"
          className="p-4 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#2563EB] shadow-xs flex items-center justify-between group transition-all"
        >
          <div>
            <div className="text-xs font-bold uppercase text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
              Biblioteca de Rotinas
            </div>
            <div className="text-[11px] text-[#6B7280]">
              Cadastre, edite modelos e atribua frequências
            </div>
          </div>
          <Layers className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors" />
        </Link>

        <Link
          to="/validades"
          className="p-4 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#2563EB] shadow-xs flex items-center justify-between group transition-all"
        >
          <div>
            <div className="text-xs font-bold uppercase text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
              Gestão de Validades & Perdas
            </div>
            <div className="text-[11px] text-[#6B7280]">
              Auditoria preventiva e giro de produtos críticos
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors" />
        </Link>
      </div>

      {/* Modal Novo / Editar Chamado e Plano de Ação */}
      <PlanoAcaoModal
        isOpen={planoModalOpen}
        onClose={() => {
          setPlanoModalOpen(false)
          setEditingPlano(null)
          setRotinaOrigemPlano(null)
        }}
        plano={editingPlano}
        defaultRotina={rotinaOrigemPlano}
        defaultLojaId={lojaSelecionadaId || undefined}
        lojas={lojaSelecionada ? [lojaSelecionada] : []}
        rotinas={rotinas}
        onSave={async (data) => {
          if (editingPlano) {
            await planosAcaoService.update(editingPlano.id, data)
          } else {
            await planosAcaoService.create({
              ...data,
              criado_por: user?.id,
            })
          }
          loadData()
        }}
      />

      {/* Modal Instalar App (PWA) */}
      <PwaInstallModal
        open={pwaModalOpen}
        onOpenChange={setPwaModalOpen}
        isIOS={isIOS}
        onNativePrompt={async () => {
          await promptInstall()
          setPwaModalOpen(false)
        }}
      />

      {/* Modal de Atendimento Pós-Acesso Inteligente */}
      <AtendimentoPosAcessoModal
        isOpen={atendimentoModalOpen}
        onClose={() => setAtendimentoModalOpen(false)}
        usuarioId={user?.id}
        userEmail={user?.email}
        userName={user?.name}
        clienteNome={clienteDoUsuario?.nome}
        gargalosIniciais={clienteDoUsuario?.gargalos}
      />
    </div>
  )
}
