import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Camera,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  Edit2,
} from 'lucide-react'
import { useStore } from '@/context/StoreContext'
import { useAuth } from '@/context/AuthContext'
import { StoreSelector } from '@/components/StoreSelector'
import { ImportarValidadeModal } from '@/components/ImportarValidadeModal'
import { BotaoAvisoWhatsApp } from '@/components/BotaoAvisoWhatsApp'
import { TarefaValidadeFormModal } from '@/components/TarefaValidadeFormModal'
import { ConcluirValidadeModal } from '@/components/ConcluirValidadeModal'
import { ValidarValidadeModal } from '@/components/ValidarValidadeModal'
import { tarefasValidadeService } from '@/services/tarefasValidade'
import { parseHorarioLimiteToMinutes } from '@/lib/time-utils'
import type { TarefaValidade, StatusTarefaValidade } from '@/types'

export default function ValidadesPage() {
  const { lojas, lojaSelecionada, lojaSelecionadaId } = useStore()
  const { user } = useAuth()

  // Data atual de visualização (padrão: hoje no fuso local)
  const [dataVisualizacao, setDataVisualizacao] = useState<string>(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })

  const [tarefas, setTarefas] = useState<TarefaValidade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todas')
  const [setorFilter, setSetorFilter] = useState<string>('todos')
  const [semanaFilter, setSemanaFilter] = useState<string>('todas')

  // Modais
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingTarefa, setEditingTarefa] = useState<TarefaValidade | null>(null)
  const [concluirModalTarefa, setConcluirModalTarefa] = useState<TarefaValidade | null>(null)
  const [validarModalTarefa, setValidarModalTarefa] = useState<TarefaValidade | null>(null)

  const perfil = user?.perfil || 'lider'
  const podeGerenciar = perfil === 'admin' || perfil === 'adm_rede' || perfil === 'lider'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await tarefasValidadeService.getAll(lojaSelecionadaId)
      setTarefas(data)
    } catch (err) {
      console.error('Erro ao carregar tarefas de validade:', err)
    } finally {
      setLoading(false)
    }
  }, [lojaSelecionadaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Navegação de dias
  const handleMudarDia = (offset: number) => {
    const parts = dataVisualizacao.split('-')
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    d.setDate(d.getDate() + offset)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDataVisualizacao(`${yyyy}-${mm}-${dd}`)
  }

  const handleIrParaHoje = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDataVisualizacao(`${yyyy}-${mm}-${dd}`)
  }

  // Dia da semana da visualização
  const dataParts = dataVisualizacao.split('-')
  const dateObj = new Date(Number(dataParts[0]), Number(dataParts[1]) - 1, Number(dataParts[2]))
  const diasSemanaNomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
  const diaDaSemana = diasSemanaNomes[dateObj.getDay()]

  const hojeStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const isToday = dataVisualizacao === hojeStr

  // Minutos atuais para checagem de atraso
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Semana do mês da visualização atual (1 a 4)
  const semanaDoMes = useMemo(() => {
    const diaNum = Number(dataParts[2])
    return Math.min(Math.ceil(diaNum / 7), 4)
  }, [dataParts])

  // Tarefas que se aplicam ao dia selecionado (respeitando rodízio de semanas do mês)
  const tarefasDoDia = useMemo(() => {
    return tarefas.filter((t) => {
      // 1. Checar se a tarefa tem semana do mês associada
      if (t.semana_mes && t.semana_mes > 0) {
        if (t.semana_mes !== semanaDoMes) {
          return false
        }
      }

      const dataEsp = (t.data_especifica || '').substring(0, 10)
      const rec = (t.recorrencia || '').toLowerCase().trim()

      if (dataEsp) {
        return dataEsp === dataVisualizacao
      }
      if (rec) {
        if (rec === 'diaria' || rec === 'diária' || rec === 'todos os dias') return true
        if (rec.includes(diaDaSemana) || (diaDaSemana === 'terça' && rec.includes('terca')))
          return true
        if (diaDaSemana === 'sábado' && rec.includes('sabado')) return true
        if (diaDaSemana === 'domingo' && rec.includes('domingo')) return true
        return false
      }
      return true
    })
  }, [tarefas, dataVisualizacao, diaDaSemana, semanaDoMes])

  // Filtradas por busca, status e setor
  const tarefasFiltradas = useMemo(() => {
    return tarefasDoDia.filter((t) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchSetor = t.setor_categoria.toLowerCase().includes(q)
        const matchDesc = t.descricao?.toLowerCase().includes(q) || false
        const matchExec = t.executor_nome?.toLowerCase().includes(q) || false
        const matchVal = t.validador_funcao_nome?.toLowerCase().includes(q) || false
        if (!matchSetor && !matchDesc && !matchExec && !matchVal) return false
      }

      if (statusFilter !== 'todas') {
        if (t.status !== statusFilter) return false
      }

      if (setorFilter !== 'todos') {
        if (t.setor_categoria !== setorFilter) return false
      }

      if (semanaFilter !== 'todas') {
        if (String(t.semana_mes || '') !== semanaFilter) return false
      }

      return true
    })
  }, [tarefasDoDia, searchTerm, statusFilter, setorFilter, semanaFilter])

  // Lista de setores disponíveis para o filtro
  const setoresDisponiveis = useMemo(() => {
    const set = new Set<string>()
    for (const t of tarefasDoDia) {
      if (t.setor_categoria) set.add(t.setor_categoria)
    }
    return Array.from(set).sort()
  }, [tarefasDoDia])

  // Cálculos de KPI do dia
  const stats = useMemo(() => {
    let pendentes = 0
    let emAndamento = 0
    let aguardando = 0
    let aprovadas = 0
    let atrasadas = 0

    for (const t of tarefasDoDia) {
      const st = t.status || 'pendente'
      if (st === 'aprovada') aprovadas++
      else if (st === 'aguardando_validacao') aguardando++
      else if (st === 'em_andamento') emAndamento++
      else pendentes++

      // Checagem de atraso: se hoje já passou do horario_inicio e está pendente
      if (isToday && st === 'pendente') {
        const minInicio = parseHorarioLimiteToMinutes(t.horario_inicio)
        if (minInicio !== null && currentMinutes > minInicio) {
          atrasadas++
        }
      }
    }

    const total = tarefasDoDia.length
    const concluidaPct = total > 0 ? Math.round((aprovadas / total) * 100) : 0

    return { total, pendentes, emAndamento, aguardando, aprovadas, atrasadas, concluidaPct }
  }, [tarefasDoDia, isToday, currentMinutes])

  // Handlers
  const handleIniciar = async (t: TarefaValidade) => {
    try {
      await tarefasValidadeService.iniciarTarefa(t.id)
      await loadData()
    } catch (err) {
      console.error('Erro ao iniciar tarefa:', err)
      alert('Não foi possível iniciar a tarefa. Tente novamente.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover esta tarefa do cronograma de validades?')) {
      try {
        await tarefasValidadeService.delete(id)
        await loadData()
      } catch (err) {
        console.error('Erro ao deletar tarefa:', err)
        alert('Não foi possível excluir a tarefa. Tente novamente.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Store Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
              Validade × Calendário
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
              Cronograma Operacional
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Cronograma diário de auditoria de validades por setor/categoria com alerta de 1h antes e
            validação pelo Líder Prevenção.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <StoreSelector />

          {podeGerenciar && (
            <>
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-md shadow-2xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
                <span>Importar Cronograma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTarefa(null)
                  setFormModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Tarefa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMudarDia(-1)}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 text-[#374151] transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB]">
            <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#1F2937] flex items-center gap-2 capitalize">
                <span>{diaDaSemana}</span>
                {isToday && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#2563EB] text-white">
                    Hoje
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                <span>
                  {dataParts[2]}/{dataParts[1]}/{dataParts[0]}
                </span>
                <span>•</span>
                <span className="font-semibold text-[#2563EB]">Semana {semanaDoMes} do mês</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleMudarDia(1)}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 text-[#374151] transition-colors"
            title="Dia seguinte"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleIrParaHoje}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] border border-[#2563EB]/40 hover:bg-blue-50 transition-colors"
            >
              Voltar para Hoje
            </button>
          )}
        </div>

        {/* Input direto de data */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-[#6B7280]">Ir para data:</span>
          <input
            type="date"
            value={dataVisualizacao}
            onChange={(e) => e.target.value && setDataVisualizacao(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
          />
        </div>
      </div>

      {/* KPI Cards do Cronograma */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Tarefas Programadas</span>
            <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {stats.total}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">{stats.aprovadas} aprovadas</span>
        </div>

        <div
          className={`p-3.5 sm:p-4 rounded-lg shadow-2xs border ${
            stats.atrasadas > 0
              ? 'bg-red-50/60 border-red-200 text-[#B91C1C]'
              : 'bg-white border-[#E5E7EB]'
          }`}
        >
          <span className="text-xs font-medium flex items-center justify-between">
            <span className={stats.atrasadas > 0 ? 'font-bold text-[#B91C1C]' : 'text-[#6B7280]'}>
              Não abertas / atrasadas
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${stats.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-gray-400'}`}
            />
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-1 leading-none ${
              stats.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
            }`}
          >
            {stats.atrasadas}
          </div>
          <span className="text-xs opacity-80 mt-1 block">
            {stats.atrasadas > 0 ? 'Janela ultrapassada sem abertura' : 'Tudo no horário'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Aguardando Validação</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1 leading-none">
            {stats.aguardando}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">Líder Prevenção</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Aprovadas</span>
            <CheckCircle2
              className={`w-4 h-4 ${
                stats.concluidaPct >= 90
                  ? 'text-emerald-600'
                  : stats.concluidaPct >= 70
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            />
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-1 leading-none ${
              stats.concluidaPct >= 90
                ? 'text-emerald-700'
                : stats.concluidaPct >= 70
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {stats.aprovadas}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">{stats.concluidaPct}% concluído</span>
        </div>

        <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-[#6B7280] font-medium flex items-center justify-between">
            <span>Robô de Alertas</span>
            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          </span>
          <div className="text-xs font-bold text-[#1F2937] mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ativo (a cada 5min)</span>
          </div>
          <span className="text-[10px] text-[#6B7280]">1h antes + Alerta não abertura</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por setor, descrição, validador..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-[#4B5563]">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value="todas">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="aguardando_validacao">Aguardando Validação</option>
                <option value="aprovada">Aprovada</option>
                <option value="devolvida">Devolvida</option>
              </select>
            </div>

            {setoresDisponiveis.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-[#4B5563]">
                <span>Setor:</span>
                <select
                  value={setorFilter}
                  onChange={(e) => setSetorFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
                >
                  <option value="todos">Todos os setores</option>
                  {setoresDisponiveis.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Tarefas do Dia */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-lg">
          <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB] mx-auto mb-2" />
          <p className="text-xs text-[#6B7280]">Carregando cronograma de validades...</p>
        </div>
      ) : tarefasFiltradas.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#E5E7EB] rounded-lg space-y-3">
          <CalendarIcon className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <p className="text-sm font-semibold text-[#1F2937]">
            Nenhuma tarefa de validade programada para este dia.
          </p>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            Importe o cronograma de validades via planilha (Excel/CSV) ou cadastre as tarefas
            manualmente por setor e janela horária.
          </p>
          {podeGerenciar && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#2563EB] rounded-md"
              >
                Importar Planilha
              </button>
              <button
                onClick={() => {
                  setEditingTarefa(null)
                  setFormModalOpen(true)
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md"
              >
                Cadastrar Manualmente
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tarefasFiltradas.map((tarefa) => {
            const st: StatusTarefaValidade = tarefa.status || 'pendente'
            const minInicio = parseHorarioLimiteToMinutes(tarefa.horario_inicio)
            const isAtrasada =
              isToday && st === 'pendente' && minInicio !== null && currentMinutes > minInicio

            return (
              <div
                key={tarefa.id}
                className={`bg-white border rounded-xl p-4 shadow-2xs transition-all ${
                  st === 'aprovada'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isAtrasada
                      ? 'border-red-300 bg-red-50/25 border-l-4 border-l-[#B91C1C]'
                      : st === 'aguardando_validacao'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-[#E5E7EB] hover:border-[#2563EB]/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Informações da Tarefa */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[#1F2937]">
                        {tarefa.setor_categoria}
                      </span>

                      {/* Selo de Semana do Mês se houver rodízio */}
                      {tarefa.semana_mes ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1E40AF]">
                          Semana {tarefa.semana_mes}
                        </span>
                      ) : null}

                      {/* Selo de Horário / Janela */}
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                        <Clock className="w-3 h-3" />
                        <span>
                          {tarefa.horario_inicio}
                          {tarefa.horario_fim ? ` – ${tarefa.horario_fim}` : ''}
                        </span>
                      </span>

                      {/* Status Badge */}
                      {st === 'aprovada' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          APROVADA
                        </span>
                      )}
                      {st === 'aguardando_validacao' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Shield className="w-3 h-3" />
                          AGUARDANDO LÍDER PREVENÇÃO
                        </span>
                      )}
                      {st === 'em_andamento' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
                          <Play className="w-3 h-3" />
                          EM ANDAMENTO
                        </span>
                      )}
                      {st === 'devolvida' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#B91C1C]">
                          <RotateCcw className="w-3 h-3" />
                          DEVOLVIDA PARA AJUSTE
                        </span>
                      )}
                      {st === 'pendente' && isAtrasada && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#B91C1C] border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          NÃO ABERTA • ATRASADA
                        </span>
                      )}
                      {st === 'pendente' && !isAtrasada && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-[#4B5563]">
                          PENDENTE
                        </span>
                      )}

                      {/* Tag de Alerta 1h antes */}
                      {tarefa.alerta_previo_enviado_em && (
                        <span
                          className="text-[10px] text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"
                          title={`Alerta prévio enviado em ${tarefa.alerta_previo_enviado_em}`}
                        >
                          ✉ Alerta 1h enviado
                        </span>
                      )}
                    </div>

                    {tarefa.descricao && (
                      <p className="text-xs text-[#4B5563]">{tarefa.descricao}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap pt-0.5">
                      <span>
                        Validador:{' '}
                        <strong>{tarefa.validador_funcao_nome || 'Líder Prevenção'}</strong>
                      </span>
                      {tarefa.executor_nome && (
                        <>
                          <span>•</span>
                          <span>
                            Responsável direto: <strong>{tarefa.executor_nome}</strong>
                          </span>
                        </>
                      )}
                      {tarefa.observacoes && (
                        <>
                          <span>•</span>
                          <span className="text-[#4B5563]">Nota: {tarefa.observacoes}</span>
                        </>
                      )}
                      {tarefa.expand?.loja && (
                        <>
                          <span>•</span>
                          <span>Loja: {tarefa.expand.loja.nome}</span>
                        </>
                      )}
                      {tarefa.observacao_execucao && (
                        <>
                          <span>•</span>
                          <span className="italic text-[#1F2937]">
                            Obs: &quot;{tarefa.observacao_execucao}&quot;
                          </span>
                        </>
                      )}
                    </div>

                    {/* Alerta de Devolução */}
                    {st === 'devolvida' && tarefa.comentario_validacao && (
                      <div className="mt-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong>Motivo do retorno pelo validador:</strong>{' '}
                        {tarefa.comentario_validacao}
                      </div>
                    )}
                  </div>

                  {/* Ações da Tarefa */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    {/* Botão de Foto (se já anexada) */}
                    {tarefa.foto && (
                      <a
                        href={tarefasValidadeService.getFotoUrl(tarefa) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold hover:bg-blue-100"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ver Foto</span>
                      </a>
                    )}

                    {/* Botão WhatsApp para aviso quando pendente/atrasada */}
                    {(st === 'pendente' || st === 'em_andamento' || st === 'devolvida') && (
                      <BotaoAvisoWhatsApp
                        lojaNome={tarefa.expand?.loja?.nome || lojaSelecionada?.nome}
                        tarefaTitulo={`Validade: ${tarefa.setor_categoria}`}
                        setor={tarefa.setor_categoria}
                        horario={`${tarefa.horario_inicio}${tarefa.horario_fim ? ` às ${tarefa.horario_fim}` : ''}`}
                        situacao={
                          isAtrasada
                            ? 'Atrasada / Não aberta após 15h'
                            : st === 'devolvida'
                              ? 'Devolvida para ajuste'
                              : 'Auditoria de Validade pendente'
                        }
                        telefoneResponsavel={tarefa.telefone_responsavel}
                        telefoneChefe={tarefa.telefone_chefe}
                        nomeResponsavel={tarefa.executor_nome}
                        nomeChefe={tarefa.validador_funcao_nome}
                        compact
                      />
                    )}

                    {/* Botão Iniciar (para status pendente) */}
                    {st === 'pendente' && (
                      <button
                        type="button"
                        onClick={() => handleIniciar(tarefa)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#374151] text-xs font-semibold"
                        title="Marcar como iniciada na loja"
                      >
                        <Play className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Iniciar</span>
                      </button>
                    )}

                    {/* Botão Concluir com Foto */}
                    {(st === 'pendente' || st === 'em_andamento' || st === 'devolvida') && (
                      <button
                        type="button"
                        onClick={() => setConcluirModalTarefa(tarefa)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Concluir com Prova</span>
                      </button>
                    )}

                    {/* Botão de Validação do Líder Prevenção */}
                    {st === 'aguardando_validacao' && podeGerenciar && (
                      <button
                        type="button"
                        onClick={() => setValidarModalTarefa(tarefa)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Validar Tarefa</span>
                      </button>
                    )}

                    {/* Edição / Exclusão */}
                    {podeGerenciar && (
                      <div className="flex items-center gap-1 border-l border-[#E5E7EB] pl-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTarefa(tarefa)
                            setFormModalOpen(true)
                          }}
                          className="p-1 text-[#9CA3AF] hover:text-[#2563EB] rounded transition-colors"
                          title="Editar tarefa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tarefa.id)}
                          className="p-1 text-[#9CA3AF] hover:text-[#B91C1C] rounded transition-colors"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Importação de Cronograma */}
      <ImportarValidadeModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadData}
        lojas={lojas}
        initialLojaId={lojaSelecionadaId}
      />

      {/* Modal Cadastro/Edição Manual */}
      <TarefaValidadeFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingTarefa(null)
        }}
        initialData={editingTarefa}
        lojas={lojas}
        funcoes={[]}
        defaultLojaId={lojaSelecionadaId}
        onSave={async (data) => {
          if (editingTarefa) {
            await tarefasValidadeService.update(editingTarefa.id, data)
          } else {
            await tarefasValidadeService.create(data)
          }
          loadData()
        }}
      />

      {/* Modal Concluir com Foto */}
      <ConcluirValidadeModal
        isOpen={Boolean(concluirModalTarefa)}
        onClose={() => setConcluirModalTarefa(null)}
        tarefa={concluirModalTarefa}
        onConfirm={async (params) => {
          if (!concluirModalTarefa || !user) return
          await tarefasValidadeService.concluirComProva(concluirModalTarefa.id, {
            userId: user.id,
            observacao: params.observacao,
            fotoFile: params.fotoFile,
          })
          loadData()
        }}
      />

      {/* Modal Validação (Líder Prevenção) */}
      <ValidarValidadeModal
        isOpen={Boolean(validarModalTarefa)}
        onClose={() => setValidarModalTarefa(null)}
        tarefa={validarModalTarefa}
        onAprovar={async (tId) => {
          if (!user) return
          await tarefasValidadeService.aprovarTarefa(tId, user.id)
          loadData()
        }}
        onDevolver={async (tId, motivo) => {
          if (!user) return
          await tarefasValidadeService.devolverTarefa(tId, user.id, motivo)
          loadData()
        }}
      />
    </div>
  )
}
