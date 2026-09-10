import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import { visitasPromotorService, rotinasPromotorService } from '@/services/visitasPromotor'
import { planosAcaoService } from '@/services/planosAcao'
import { StoreSelector } from '@/components/StoreSelector'
import { ConcluirVisitaModal } from '@/components/ConcluirVisitaModal'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { isPlanoAtrasado } from '@/components/PlanosAcaoCard'
import { isVisitaAtrasada } from '@/services/visitasPromotor'
import { getHorarioStatus } from '@/lib/time-utils'
import { AgendaMinhaEquipeSecao } from '@/components/AgendaMinhaEquipeSecao'
import type { Rotina, ExecucaoRotina, VisitaPromotor, RotinaPromotor, PlanoAcao } from '@/types'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Handshake,
  CheckSquare,
  Check,
  Camera,
  Layers,
  Building2,
  Eye,
  AlertCircle,
} from 'lucide-react'

export function AgendaPage() {
  return <AgendaDefault />
}

export default function AgendaDefault() {
  const { user } = useAuth()
  const { lojaSelecionadaId } = useStore()

  // Data atual da visualização da Agenda (padrão hoje)
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getTodayDateString())

  // Estados de dados
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [visitas, setVisitas] = useState<VisitaPromotor[]>([])
  const [rotinasPromotores, setRotinasPromotores] = useState<RotinaPromotor[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [, setLoading] = useState<boolean>(true)

  // Modais ativos
  const [concluirVisitaModal, setConcluirVisitaModal] = useState<VisitaPromotor | null>(null)
  const [visualizarFoto, setVisualizarFoto] = useState<{
    execucao?: ExecucaoRotina
    rotina?: Rotina
    fotoUrl?: string
    titulo?: string
    subtitulo?: string
  } | null>(null)

  // Carregamento de dados
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r, e, v, rp, p] = await Promise.all([
        rotinasService.getAll(lojaSelecionadaId),
        execucoesService.getExecutionsByDate(currentDateStr).catch(() => [] as ExecucaoRotina[]),
        visitasPromotorService
          .getAll(lojaSelecionadaId || undefined)
          .catch(() => [] as VisitaPromotor[]),
        rotinasPromotorService
          .getAll(lojaSelecionadaId || undefined)
          .catch(() => [] as RotinaPromotor[]),
        planosAcaoService.getAll(lojaSelecionadaId).catch(() => [] as PlanoAcao[]),
      ])

      setRotinas(r)
      setExecucoes(e)
      setVisitas(v)
      setRotinasPromotores(rp)
      setPlanosAcao(p)
    } catch (err) {
      console.error('Erro ao carregar agenda:', err)
    } finally {
      setLoading(false)
    }
  }, [lojaSelecionadaId, currentDateStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Navegação de dias
  const isToday = currentDateStr === getTodayDateString()

  const handleMudarDia = (offsetDays: number) => {
    const parts = currentDateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    d.setDate(d.getDate() + offsetDays)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setCurrentDateStr(`${yyyy}-${mm}-${dd}`)
  }

  const handleIrParaHoje = () => {
    setCurrentDateStr(getTodayDateString())
  }

  const formatarDataCabecalho = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    const dayAndMonth = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      formatted: dayAndMonth,
    }
  }

  // Mapeamento de execuções da data
  const execucoesMap = useMemo(() => {
    const map = new Map<string, ExecucaoRotina>()
    for (const ex of execucoes) {
      map.set(ex.rotina, ex)
    }
    return map
  }, [execucoes])

  // Rotinas do dia (considerando se foi adiada para outra data ou adiada para a data corrente)
  const rotinasDoDia = useMemo(() => {
    const seenIds = new Set<string>()
    return rotinas.filter((r) => {
      if (seenIds.has(r.id)) return false
      seenIds.add(r.id)

      if (r.adiada_para_data && r.adiada_para_data !== currentDateStr) {
        return false
      }
      return true
    })
  }, [rotinas, currentDateStr])

  // Mapeamento dos itens de rotinas e status de horário rompido
  const itensAgenda = useMemo(() => {
    return rotinasDoDia.map((r) => {
      const exec = execucoesMap.get(r.id)
      const concluida = Boolean(exec?.concluida && exec.status_validacao !== 'devolvida')
      const devolvida = exec?.status_validacao === 'devolvida'
      const aguardandoValidacao = Boolean(
        exec?.concluida && exec.status_validacao === 'aguardando_validacao',
      )
      const aprovada = Boolean(exec?.concluida && exec.status_validacao === 'aprovada')

      const horarioEfetivo = r.adiada_para_horario || r.horario_limite || ''
      const horarioStatus = getHorarioStatus(horarioEfetivo, concluida)
      const isAtrasada = !concluida && isToday && horarioStatus.isAtrasada

      return {
        rotina: r,
        execucao: exec,
        concluida,
        devolvida,
        aguardandoValidacao,
        aprovada,
        isAtrasada,
        horarioEfetivo,
      }
    })
  }, [rotinasDoDia, execucoesMap, isToday])

  // Lista de rotinas com horário limite rompido (atrasadas)
  const rotinasAtrasadas = useMemo(() => {
    return itensAgenda.filter((item) => item.isAtrasada)
  }, [itensAgenda])

  // Evidências fotográficas enviadas no dia (rotinas executadas com foto anexada)
  // Robusto contra variações de fuso horário UTC vs data local do navegador
  const evidenciasDoDia = useMemo(() => {
    const list: Array<{
      execucao: ExecucaoRotina
      rotina?: Rotina
      titulo: string
      responsavel?: string
      horario?: string
    }> = []

    for (const ex of execucoes) {
      if (ex.foto && execucoesService.matchesDate(currentDateStr, ex.data_execucao, ex.created)) {
        const r = rotinas.find((item) => item.id === ex.rotina)
        list.push({
          execucao: ex,
          rotina: r,
          titulo: r?.nome || ex.expand?.rotina?.nome || 'Comprovação Visual',
          responsavel: r?.responsavel || ex.expand?.usuario?.name || 'Equipe',
          horario: ex.created
            ? new Date(ex.created).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined,
        })
      }
    }
    return list
  }, [execucoes, rotinas, currentDateStr])

  // Visitas de promotores na data
  const visitasDoDia = useMemo(() => {
    return visitas.filter((v) => {
      const vData = v.data_visita ? v.data_visita.substring(0, 10) : ''
      return vData === currentDateStr
    })
  }, [visitas, currentDateStr])

  // Planos de ação com prazo na data de hoje
  const planosHoje = useMemo(() => {
    return planosAcao.filter((p) => {
      if (!p.prazo) return false
      const pPrazo = p.prazo.substring(0, 10)
      return pPrazo === currentDateStr
    })
  }, [planosAcao, currentDateStr])

  // Planos de ação com prazo na data ou em atraso
  const planosDoDiaTotal = useMemo(() => {
    return planosAcao.filter((p) => {
      if (!p.prazo) return false
      const pPrazo = p.prazo.substring(0, 10)
      return pPrazo === currentDateStr || (pPrazo < currentDateStr && p.status !== 'concluida')
    })
  }, [planosAcao, currentDateStr])

  const planosHojeStatus = useMemo(() => {
    const totalHoje = planosHoje.length
    const concluidosHoje = planosHoje.filter((p) => p.status === 'concluida').length
    const abertosHoje = totalHoje - concluidosHoje
    const atrasadosGeral = planosDoDiaTotal.filter((p) => isPlanoAtrasado(p)).length

    return {
      totalHoje,
      concluidosHoje,
      abertosHoje,
      atrasadosGeral,
    }
  }, [planosHoje, planosDoDiaTotal])

  // Contadores KPIs do topo
  const statsDia = useMemo(() => {
    const total = itensAgenda.length
    const concluidas = itensAgenda.filter((i) => i.concluida).length
    const atrasadas = rotinasAtrasadas.length
    const aguardando = itensAgenda.filter((i) => i.aguardandoValidacao).length
    const devolvidas = itensAgenda.filter((i) => i.devolvida).length
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0

    return {
      total,
      concluidas,
      atrasadas,
      aguardando,
      devolvidas,
      taxa,
      evidenciasCount: evidenciasDoDia.length,
      visitasCount: visitasDoDia.length,
      planosCount: planosHoje.length,
    }
  }, [itensAgenda, rotinasAtrasadas, evidenciasDoDia, visitasDoDia, planosHoje])

  // Concluir visita de promotor do dia
  const handleConcluirVisita = async (visitaId: string, params: any) => {
    if (!user) return
    try {
      if (params instanceof FormData) {
        if (!params.has('registrado_por')) {
          params.append('registrado_por', user.id)
        }
        await visitasPromotorService.registrarConclusao(visitaId, params)
      } else {
        await visitasPromotorService.registrarConclusao(visitaId, {
          ...params,
          registrado_por: user.id,
        })
      }
      loadData()
    } catch (err) {
      console.error('Erro ao concluir visita:', err)
    }
  }

  const dataInfo = formatarDataCabecalho(currentDateStr)

  return (
    <div className="space-y-6">
      {/* Top Header & Store Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
              Agenda Operacional do Dia
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              Dia × Tarefas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Ordem cronológica das rotinas, horários limite, visitas de promotores e planos de ação
            da loja.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StoreSelector />
        </div>
      </div>

      {/* Date Navigation Bar sóbrio tema claro */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMudarDia(-1)}
            className="p-2 rounded-xl border border-[#E5E7EB] hover:bg-gray-100 text-[#1F2937] transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F7F7F5] rounded-xl border border-[#E5E7EB]">
            <CalendarIcon className="w-4 h-4 text-[#0F766E]" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <span>{dataInfo.weekday}</span>
                {isToday && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0F766E] text-white">
                    Hoje
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#4B5563]">{dataInfo.formatted}</div>
            </div>
          </div>

          <button
            onClick={() => handleMudarDia(1)}
            className="p-2 rounded-xl border border-[#E5E7EB] hover:bg-gray-100 text-[#1F2937] transition-colors"
            title="Dia seguinte"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleIrParaHoje}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0F766E] border border-teal-200 hover:bg-teal-50 transition-colors"
            >
              Voltar para Hoje
            </button>
          )}
        </div>

        {/* Input direto de data */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-[#4B5563]">Ir para:</span>
          <input
            type="date"
            value={currentDateStr}
            onChange={(e) => e.target.value && setCurrentDateStr(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0F766E] text-[#1F2937]"
          />
        </div>
      </div>

      {/* 6 Cards de Indicadores Enriquecidos com tiles coloridos consistentes e tons sóbrios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Rotinas do Dia - Tile Sóbrio Teal */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <span className="text-xs text-[#4B5563] font-medium flex items-center justify-between">
            <span>Rotinas do Dia</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {statsDia.total}
          </div>
          <span className="text-xs text-[#4B5563] mt-1.5 block">
            {statsDia.concluidas} concluídas
          </span>
        </div>

        {/* Card 2: % Concluído - Tile Verde Sóbrio */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <span className="text-xs text-[#4B5563] font-medium flex items-center justify-between">
            <span>% Concluído</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-1 leading-none ${
              statsDia.taxa >= 90
                ? 'text-emerald-700'
                : statsDia.taxa >= 70
                  ? 'text-amber-700'
                  : 'text-rose-700'
            }`}
          >
            {statsDia.taxa}%
          </div>
          <div className="w-full bg-[#F7F7F5] rounded-full h-1.5 mt-2 overflow-hidden border border-[#E5E7EB]">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                statsDia.taxa >= 90
                  ? 'bg-emerald-600'
                  : statsDia.taxa >= 70
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${statsDia.taxa}%` }}
            />
          </div>
        </div>

        {/* Card 3: Atrasadas - Tile Vermelho Sóbrio */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs border ${
            statsDia.atrasadas > 0
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-white border-[#E5E7EB]'
          }`}
        >
          <span className="text-xs font-medium flex items-center justify-between">
            <span className={statsDia.atrasadas > 0 ? 'font-bold text-rose-800' : 'text-[#4B5563]'}>
              Atrasadas
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <div
              className={`text-2xl sm:text-3xl font-bold leading-none ${
                statsDia.atrasadas > 0 ? 'text-rose-800' : 'text-[#1F2937]'
              }`}
            >
              {statsDia.atrasadas}
            </div>
            {statsDia.atrasadas > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Rompido
              </span>
            )}
          </div>
          <span className="text-xs text-[#4B5563] mt-1.5 block truncate">
            {statsDia.atrasadas > 0
              ? `${statsDia.atrasadas} ${statsDia.atrasadas === 1 ? 'rotina rompeu' : 'rotinas romperam'} o limite`
              : 'Nenhum limite rompido'}
          </span>
        </div>

        {/* Card 4: Evidências/Fotos - Tile Roxo Sóbrio */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <span className="text-xs text-[#4B5563] font-medium flex items-center justify-between">
            <span>Evidências / Fotos</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] leading-none">
              {statsDia.evidenciasCount}
            </div>
            {statsDia.evidenciasCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Hoje
              </span>
            )}
          </div>
          <div className="text-xs text-[#4B5563] mt-1.5 flex items-center justify-between">
            <span>{statsDia.evidenciasCount === 1 ? 'Foto enviada' : 'Fotos enviadas'}</span>
            {statsDia.evidenciasCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const first = evidenciasDoDia[0]
                  if (first) {
                    setVisualizarFoto({
                      execucao: first.execucao,
                      rotina: first.rotina,
                      titulo: first.titulo,
                      subtitulo: `Evidência de ${first.responsavel || 'Equipe'}${first.horario ? ` às ${first.horario}` : ''}`,
                    })
                  }
                }}
                className="text-[11px] font-semibold text-[#0F766E] hover:text-[#115E59] inline-flex items-center gap-0.5 hover:underline"
                title="Visualizar evidência fotográfica enviada"
              >
                <Eye className="w-3 h-3" />
                <span>Ver</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 5: Visitas Promotores - Tile Laranja/Âmbar Sóbrio */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <span className="text-xs text-[#4B5563] font-medium flex items-center justify-between">
            <span>Visitas Promotores</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Handshake className="w-3.5 h-3.5" />
            </div>
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {statsDia.visitasCount}
          </div>
          <span className="text-xs text-[#4B5563] mt-1.5 block">
            {visitasDoDia.filter((v) => v.status === 'realizada').length} realizadas hoje
          </span>
        </div>

        {/* Card 6: Status dos Planos de Ação 5W2H - Tile Ciano/Teal Sóbrio */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs border ${
            planosHojeStatus.atrasadosGeral > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-white border-[#E5E7EB]'
          }`}
        >
          <span className="text-xs font-medium flex items-center justify-between">
            <span
              className={
                planosHojeStatus.atrasadosGeral > 0
                  ? 'text-amber-800 font-semibold'
                  : 'text-[#4B5563]'
              }
            >
              Planos 5W2H (Hoje)
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] leading-none">
              {planosHojeStatus.totalHoje}
            </div>
            {planosHojeStatus.concluidosHoje > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {planosHojeStatus.concluidosHoje} ok
              </span>
            )}
          </div>
          <span className="text-xs text-[#4B5563] mt-1.5 block truncate">
            {planosHojeStatus.totalHoje === 0
              ? planosHojeStatus.atrasadosGeral > 0
                ? `${planosHojeStatus.atrasadosGeral} em atraso geral`
                : 'Nenhum prazo hoje'
              : `${planosHojeStatus.abertosHoje} pendente(s) hoje`}
          </span>
        </div>
      </div>

      {/* Mini-carrossel / Tira compacta de Evidências Fotográficas do Dia (quando houver fotos) */}
      {evidenciasDoDia.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1F2937] flex items-center gap-2">
                <span>Evidências Fotográficas do Dia</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                  {evidenciasDoDia.length}
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] truncate">
                Fotos e comprovações de rotinas enviadas pelos operadores na loja hoje
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {evidenciasDoDia.slice(0, 4).map((ev) => (
              <button
                key={ev.execucao.id}
                type="button"
                onClick={() =>
                  setVisualizarFoto({
                    execucao: ev.execucao,
                    rotina: ev.rotina,
                    titulo: ev.titulo,
                    subtitulo: `Registro por ${ev.responsavel || 'Equipe'}${ev.horario ? ` às ${ev.horario}` : ''}`,
                  })
                }
                className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] hover:bg-gray-100 hover:border-[#0F766E]/50 transition-colors text-left shrink-0"
                title={`Visualizar foto: ${ev.titulo}`}
              >
                <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 max-w-[140px]">
                  <div className="text-xs font-semibold text-[#1F2937] truncate group-hover:text-[#0F766E]">
                    {ev.titulo}
                  </div>
                  <div className="text-[10px] text-[#4B5563] truncate">
                    {ev.responsavel} {ev.horario ? `• ${ev.horario}` : ''}
                  </div>
                </div>
                <Eye className="w-3.5 h-3.5 text-[#4B5563] group-hover:text-[#0F766E] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerta de Atrasadas com Horário Limite Rompido (se houver) */}
      {rotinasAtrasadas.length > 0 && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#B91C1C]">
                Atenção: {rotinasAtrasadas.length}{' '}
                {rotinasAtrasadas.length === 1 ? 'rotina rompeu' : 'rotinas romperam'} o horário
                limite estabelecido!
              </span>
              <p className="text-red-800">
                {rotinasAtrasadas
                  .slice(0, 3)
                  .map((i) => `${i.rotina.nome} (limite ${i.horarioEfetivo})`)
                  .join(' • ')}
                {rotinasAtrasadas.length > 3 ? ` e mais ${rotinasAtrasadas.length - 3}...` : ''}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-[#B91C1C] border border-red-300 shrink-0 hidden sm:inline-block">
            Prioridade
          </span>
        </div>
      )}

      {/* Alerta de Devolvidas pelo Regional (Retrabalho imediato) */}
      {statsDia.devolvidas > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold">
              Atenção: {statsDia.devolvidas} rotina(s) devolvida(s) na validação do regional!
            </span>
            <p>
              O regional apontou correções necessárias na execução. Verifique as observações da
              rotina na seção da equipe, realize os ajustes e reenvie a foto comprobatória.
            </p>
          </div>
        </div>
      )}

      {/* AGENDA MINHA EQUIPE: Unificação da visão Minha Equipe embutida diretamente na Agenda */}
      <AgendaMinhaEquipeSecao
        embedded
        tituloCustomizado="Agenda Minha Equipe"
        currentDateStr={currentDateStr}
        execucoesExternas={execucoes}
        onDataChange={loadData}
      />

      {/* Seção Integrada: Visitas de Promotores Agendadas para o Dia */}
      {visitasDoDia.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-teal-50/40 via-white to-white border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">Visitas de Promotores do Dia</h3>
                <p className="text-[11px] text-[#6B7280]">
                  Representantes e promotores agendados para atendimento na loja hoje
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              {visitasDoDia.length} visita{visitasDoDia.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {visitasDoDia.map((v) => {
              const atrasada = isVisitaAtrasada(v)
              const promotorNome = v.expand?.promotor?.nome || 'Promotor'
              const fornNome = v.expand?.promotor?.expand?.fornecedor?.nome
              const isRealizada = v.status === 'realizada'

              return (
                <div
                  key={v.id}
                  className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isRealizada
                      ? 'bg-emerald-50/30'
                      : atrasada
                        ? 'bg-red-50/30 border-l-4 border-l-[#B91C1C]'
                        : 'hover:bg-gray-50/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm text-[#1F2937]">
                        {promotorNome}
                      </span>
                      {fornNome && (
                        <span className="text-[11px] font-medium text-[#4B5563] bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#6B7280]" />
                          <span>{fornNome}</span>
                        </span>
                      )}
                      {v.hora_prevista && (
                        <span className="text-xs text-[#6B7280] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Previsto: {v.hora_prevista}</span>
                        </span>
                      )}
                      {isRealizada ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          REALIZADA
                        </span>
                      ) : atrasada ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#B91C1C] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ATRASADA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          AGENDADA
                        </span>
                      )}
                    </div>
                    {v.observacoes && (
                      <p className="text-xs text-[#6B7280] italic">Objetivo: {v.observacoes}</p>
                    )}
                  </div>

                  {!isRealizada && (
                    <button
                      onClick={() => setConcluirVisitaModal(v)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-2xs self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir Atendimento</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Concluir Visita */}
      <ConcluirVisitaModal
        open={!!concluirVisitaModal}
        onOpenChange={(open) => !open && setConcluirVisitaModal(null)}
        visita={concluirVisitaModal}
        rotinasDisponiveis={rotinasPromotores.filter((r) => r.ativa !== false)}
        onConcluir={(params) => {
          if (!concluirVisitaModal) return Promise.resolve()
          return handleConcluirVisita(concluirVisitaModal.id, params)
        }}
      />

      {/* Modal Visualizar Foto */}
      {visualizarFoto && (
        <FotoVisualizadorModal
          isOpen={!!visualizarFoto}
          onClose={() => setVisualizarFoto(null)}
          execucao={visualizarFoto.execucao}
          rotina={visualizarFoto.rotina}
          titulo={visualizarFoto.titulo}
          subtitulo={visualizarFoto.subtitulo}
        />
      )}
    </div>
  )
}
