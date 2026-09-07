import React, { useState, useMemo } from 'react'
import type { Cliente, Loja, Rotina, ExecucaoRotina, PlanoAcao, VisitaPromotor } from '@/types'
import { isPlanoAtrasado } from '@/components/PlanosAcaoCard'
import { isVisitaAtrasada } from '@/services/visitasPromotor'
import { isPastDue } from '@/lib/time-utils'
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  Store,
  Layers,
  CheckCircle2,
  Clock,
  RotateCcw,
  CheckSquare,
  Handshake,
  ArrowUpDown,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react'

export type PeriodoTipo = 'dia' | 'semana' | 'mes'

interface RelatorioLojaLojaProps {
  clientes: Cliente[]
  lojas: Loja[]
  rotinas: Rotina[]
  execucoes: ExecucaoRotina[]
  planosAcao: PlanoAcao[]
  visitas: VisitaPromotor[]
  isAdmRede?: boolean
}

interface LojaConsolidado {
  lojaId: string
  lojaNome: string
  clienteNome: string
  codigo?: string
  totalRotinas: number
  totalEsperadoPeriodo: number
  totalConcluidas: number
  taxaExecucao: number
  rotinasAtrasadas: number
  rotinasDevolvidas: number
  planosAbertos: number
  planosAtrasados: number
  visitasAgendadas: number
  visitasRealizadas: number
  taxaVisitas: number
  // Comparação com período anterior
  taxaAnterior: number
  deltaPercentual: number
}

// Helpers para cálculo de datas (YYYY-MM-DD)
function toDateStr(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function RelatorioLojaLoja({
  clientes,
  lojas,
  rotinas,
  execucoes,
  planosAcao,
  visitas,
  isAdmRede = false,
}: RelatorioLojaLojaProps) {
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>('semana')
  const [periodoOffset, setPeriodoOffset] = useState<number>(0) // 0 = atual, -1 = anterior, etc.
  const [ordenacao, setOrdenacao] = useState<'taxa_desc' | 'taxa_asc' | 'atrasadas_desc' | 'nome'>(
    'taxa_desc',
  )
  const [busca, setBusca] = useState<string>('')
  const [clienteFiltro, setClienteFiltro] = useState<string>('todos')

  // Calcula limites de data do período atual e do período de comparação (anterior)
  const rangeDates = useMemo(() => {
    const now = new Date()

    if (periodoTipo === 'dia') {
      const d = new Date(now)
      d.setDate(d.getDate() + periodoOffset)
      const dataInicio = toDateStr(d)
      const dataFim = dataInicio

      const dAnt = new Date(d)
      dAnt.setDate(dAnt.getDate() - 1)
      const dataInicioAnt = toDateStr(dAnt)
      const dataFimAnt = dataInicioAnt

      const label = d.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const labelAnt = 'Dia anterior'

      return { dataInicio, dataFim, dataInicioAnt, dataFimAnt, label, labelAnt, diasCount: 1 }
    }

    if (periodoTipo === 'semana') {
      // Semana começa na segunda-feira e vai até domingo
      const d = new Date(now)
      // Ajusta para início da semana atual
      const day = d.getDay()
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1) // ajusta quando domingo
      d.setDate(diffToMonday + periodoOffset * 7)

      const start = new Date(d)
      const end = new Date(d)
      end.setDate(end.getDate() + 6)

      const startAnt = new Date(start)
      startAnt.setDate(startAnt.getDate() - 7)
      const endAnt = new Date(end)
      endAnt.setDate(endAnt.getDate() - 7)

      const label = `Semana de ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
      const labelAnt = 'Semana anterior'

      return {
        dataInicio: toDateStr(start),
        dataFim: toDateStr(end),
        dataInicioAnt: toDateStr(startAnt),
        dataFimAnt: toDateStr(endAnt),
        label,
        labelAnt,
        diasCount: 7,
      }
    }

    // Mês
    const d = new Date(now.getFullYear(), now.getMonth() + periodoOffset, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)

    const startAnt = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const endAnt = new Date(d.getFullYear(), d.getMonth(), 0)

    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const labelAnt = 'Mês anterior'
    const diasCount = end.getDate()

    return {
      dataInicio: toDateStr(start),
      dataFim: toDateStr(end),
      dataInicioAnt: toDateStr(startAnt),
      dataFimAnt: toDateStr(endAnt),
      label: label.charAt(0).toUpperCase() + label.slice(1),
      labelAnt,
      diasCount,
    }
  }, [periodoTipo, periodoOffset])

  // Lojas filtradas por cliente
  const lojasFiltradas = useMemo(() => {
    return lojas.filter((l) => {
      if (clienteFiltro !== 'todos' && l.cliente !== clienteFiltro) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const matchNome = l.nome.toLowerCase().includes(q)
        const matchCod = l.codigo?.toLowerCase().includes(q)
        if (!matchNome && !matchCod) return false
      }
      return true
    })
  }, [lojas, clienteFiltro, busca])

  // Processamento comparativo por loja
  const dadosLojas: LojaConsolidado[] = useMemo(() => {
    const { dataInicio, dataFim, dataInicioAnt, dataFimAnt, diasCount } = rangeDates

    return lojasFiltradas.map((loja) => {
      const clienteObj = clientes.find((c) => c.id === loja.cliente)
      const clienteNome = clienteObj?.nome || 'Rede Geral'

      // Rotinas da loja
      const rotinasDaLoja = rotinas.filter((r) => r.loja === loja.id || !r.loja)
      const rotinasLojaIds = new Set(rotinasDaLoja.map((r) => r.id))

      // Fator de multiplicação de acordo com a frequência das rotinas
      // Rotinas diárias esperadas = total de rotinas diárias * diasCount
      // Rotinas semanais esperadas = total semanais * (periodoTipo === 'dia' ? 0.2 : periodoTipo === 'semana' ? 1 : 4)
      let totalEsperadoPeriodo = 0
      rotinasDaLoja.forEach((r) => {
        if (r.frequencia === 'Diária') {
          totalEsperadoPeriodo += diasCount
        } else if (r.frequencia === 'Semanal') {
          totalEsperadoPeriodo +=
            periodoTipo === 'dia' ? 1 : periodoTipo === 'semana' ? 1 : Math.round(diasCount / 7)
        } else {
          totalEsperadoPeriodo += periodoTipo === 'dia' ? 1 : Math.round(diasCount / 5)
        }
      })
      if (totalEsperadoPeriodo === 0 && rotinasDaLoja.length > 0) {
        totalEsperadoPeriodo = rotinasDaLoja.length
      }

      // Execuções no período atual
      const execsPeriodo = execucoes.filter((e) => {
        if (!rotinasLojaIds.has(e.rotina)) return false
        const d = e.data_execucao ? e.data_execucao.substring(0, 10) : ''
        return d >= dataInicio && d <= dataFim
      })

      // Concluídas válidas (não devolvidas)
      const concluidasPeriodo = execsPeriodo.filter(
        (e) => e.concluida && e.status_validacao !== 'devolvida',
      ).length

      // Devolvidas na validação
      const rotinasDevolvidas = execsPeriodo.filter(
        (e) => e.status_validacao === 'devolvida',
      ).length

      // Atrasadas (rotinas sem conclusão cujo horário limite passou)
      // No dia corrente, baseia-se no horário limite; em períodos anteriores, se concluidas < esperado
      let rotinasAtrasadas = 0
      if (periodoTipo === 'dia') {
        const concluidasIds = new Set(
          execsPeriodo
            .filter((e) => e.concluida && e.status_validacao !== 'devolvida')
            .map((e) => e.rotina),
        )
        rotinasDaLoja.forEach((r) => {
          if (!concluidasIds.has(r.id) && isPastDue(r.horario_limite)) {
            rotinasAtrasadas++
          }
        })
      } else {
        rotinasAtrasadas = Math.max(0, totalEsperadoPeriodo - concluidasPeriodo)
      }

      // Taxa de execução atual
      const taxaExecucao =
        totalEsperadoPeriodo > 0
          ? Math.min(100, Math.round((concluidasPeriodo / totalEsperadoPeriodo) * 100))
          : 0

      // Execuções no período anterior (para comparar evolução)
      const execsPeriodoAnt = execucoes.filter((e) => {
        if (!rotinasLojaIds.has(e.rotina)) return false
        const d = e.data_execucao ? e.data_execucao.substring(0, 10) : ''
        return d >= dataInicioAnt && d <= dataFimAnt
      })
      const concluidasAnt = execsPeriodoAnt.filter(
        (e) => e.concluida && e.status_validacao !== 'devolvida',
      ).length
      const taxaAnterior =
        totalEsperadoPeriodo > 0
          ? Math.min(100, Math.round((concluidasAnt / totalEsperadoPeriodo) * 100))
          : 0
      const deltaPercentual = taxaExecucao - taxaAnterior

      // Planos de Ação da Loja
      const planosLoja = planosAcao.filter((p) => p.loja === loja.id)
      const planosAbertos = planosLoja.filter((p) => p.status !== 'concluida').length
      const planosAtrasados = planosLoja.filter((p) => isPlanoAtrasado(p)).length

      // Visitas de Promotores da Loja no Período
      const visitasLojaPeriodo = visitas.filter((v) => {
        if (v.loja !== loja.id) return false
        const d = v.data_visita ? v.data_visita.substring(0, 10) : ''
        return d >= dataInicio && d <= dataFim
      })
      const visitasAgendadas = visitasLojaPeriodo.length
      const visitasRealizadas = visitasLojaPeriodo.filter((v) => v.status === 'realizada').length
      const taxaVisitas =
        visitasAgendadas > 0 ? Math.round((visitasRealizadas / visitasAgendadas) * 100) : 100

      return {
        lojaId: loja.id,
        lojaNome: loja.nome,
        clienteNome,
        codigo: loja.codigo,
        totalRotinas: rotinasDaLoja.length,
        totalEsperadoPeriodo,
        totalConcluidas: concluidasPeriodo,
        taxaExecucao,
        rotinasAtrasadas,
        rotinasDevolvidas,
        planosAbertos,
        planosAtrasados,
        visitasAgendadas,
        visitasRealizadas,
        taxaVisitas,
        taxaAnterior,
        deltaPercentual,
      }
    })
  }, [lojasFiltradas, rotinas, execucoes, planosAcao, visitas, clientes, rangeDates, periodoTipo])

  // Ranking ordenado
  const lojasOrdenadas = useMemo(() => {
    return [...dadosLojas].sort((a, b) => {
      if (ordenacao === 'taxa_desc') return b.taxaExecucao - a.taxaExecucao
      if (ordenacao === 'taxa_asc') return a.taxaExecucao - b.taxaExecucao
      if (ordenacao === 'atrasadas_desc') return b.rotinasAtrasadas - a.rotinasAtrasadas
      return a.lojaNome.localeCompare(b.lojaNome)
    })
  }, [dadosLojas, ordenacao])

  // Destaques: Melhor e Pior Loja do período (mínimo 1 loja com tarefas)
  const destaques = useMemo(() => {
    if (dadosLojas.length === 0) return { melhor: null, pior: null }
    const validas = dadosLojas.filter((l) => l.totalEsperadoPeriodo > 0)
    if (validas.length === 0) return { melhor: null, pior: null }

    const sortedByRate = [...validas].sort((a, b) => b.taxaExecucao - a.taxaExecucao)
    const melhor = sortedByRate[0]
    const pior = sortedByRate.length > 1 ? sortedByRate[sortedByRate.length - 1] : null

    return { melhor, pior }
  }, [dadosLojas])

  // Médias Consolidadas da Rede
  const mediasConsolidadas = useMemo(() => {
    const totalLojas = dadosLojas.length
    if (totalLojas === 0)
      return {
        taxaMedia: 0,
        totalEsperado: 0,
        totalConcluidas: 0,
        totalAtrasadas: 0,
        totalDevolvidas: 0,
        totalPlanosAtrasados: 0,
      }

    const sumTaxa = dadosLojas.reduce((acc, l) => acc + l.taxaExecucao, 0)
    const totalEsperado = dadosLojas.reduce((acc, l) => acc + l.totalEsperadoPeriodo, 0)
    const totalConcluidas = dadosLojas.reduce((acc, l) => acc + l.totalConcluidas, 0)
    const totalAtrasadas = dadosLojas.reduce((acc, l) => acc + l.rotinasAtrasadas, 0)
    const totalDevolvidas = dadosLojas.reduce((acc, l) => acc + l.rotinasDevolvidas, 0)
    const totalPlanosAtrasados = dadosLojas.reduce((acc, l) => acc + l.planosAtrasados, 0)

    return {
      taxaMedia: Math.round(sumTaxa / totalLojas),
      totalEsperado,
      totalConcluidas,
      totalAtrasadas,
      totalDevolvidas,
      totalPlanosAtrasados,
    }
  }, [dadosLojas])

  // Exportar Relatório CSV Consolidado
  const handleExportarCsv = () => {
    const cabecalho = [
      'Loja',
      'Código',
      'Rede/Cliente',
      'Período',
      'Data Início',
      'Data Fim',
      '% Execução Rotinas',
      'Rotinas Concluídas',
      'Rotinas Esperadas',
      'Rotinas Atrasadas',
      'Rotinas Devolvidas',
      'Planos de Ação Abertos',
      'Planos Atrasados',
      'Visitas Promotores Agendadas',
      'Visitas Promotores Realizadas',
      '% Visitas Promotores',
      '% Período Anterior',
      'Evolução (pp)',
    ]

    const linhas = dadosLojas.map((d) => [
      `"${d.lojaNome.replace(/"/g, '""')}"`,
      `"${(d.codigo || '').replace(/"/g, '""')}"`,
      `"${d.clienteNome.replace(/"/g, '""')}"`,
      `"${rangeDates.label.replace(/"/g, '""')}"`,
      rangeDates.dataInicio,
      rangeDates.dataFim,
      `${d.taxaExecucao}%`,
      d.totalConcluidas,
      d.totalEsperadoPeriodo,
      d.rotinasAtrasadas,
      d.rotinasDevolvidas,
      d.planosAbertos,
      d.planosAtrasados,
      d.visitasAgendadas,
      d.visitasRealizadas,
      `${d.taxaVisitas}%`,
      `${d.taxaAnterior}%`,
      `${d.deltaPercentual > 0 ? '+' : ''}${d.deltaPercentual}%`,
    ])

    const csvContent =
      '\uFEFF' + [cabecalho.join(';'), ...linhas.map((row) => row.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `relatorio_loja_a_loja_${periodoTipo}_${rangeDates.dataInicio}_a_${rangeDates.dataFim}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Controles de Período e Exportação */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Store className="w-5 h-5 text-[#2563EB]" />
              <span>Dashboard Comparativo Loja a Loja</span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              Performance consolidada de execução das rotinas operacionais, planos 5W2H e visitas de
              promotores
            </p>
          </div>

          <button
            onClick={handleExportarCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
            title="Exportar planilha consolidada em formato CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Barra de Filtro de Período: Dia / Semana / Mês e Navegação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB]">
          {/* Seletor do Tipo de Período */}
          <div className="flex items-center gap-1 p-1 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB] w-fit">
            <button
              onClick={() => {
                setPeriodoTipo('dia')
                setPeriodoOffset(0)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                periodoTipo === 'dia'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => {
                setPeriodoTipo('semana')
                setPeriodoOffset(0)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                periodoTipo === 'semana'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => {
                setPeriodoTipo('mes')
                setPeriodoOffset(0)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                periodoTipo === 'mes'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Mês
            </button>
          </div>

          {/* Navegação de Período (Anterior / Atual / Próximo) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeriodoOffset((prev) => prev - 1)}
              className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 text-[#374151] transition-colors"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3.5 py-1.5 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB] text-center min-w-[220px]">
              <div className="text-xs sm:text-sm font-bold text-[#1F2937] flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-[#2563EB]" />
                <span>{rangeDates.label}</span>
              </div>
              <div className="text-[10px] text-[#6B7280]">
                {periodoOffset === 0
                  ? 'Período Atual'
                  : `${Math.abs(periodoOffset)} ${periodoTipo}(s) ${periodoOffset < 0 ? 'atrás' : 'à frente'}`}
              </div>
            </div>

            <button
              onClick={() => setPeriodoOffset((prev) => prev + 1)}
              className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 text-[#374151] transition-colors"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {periodoOffset !== 0 && (
              <button
                onClick={() => setPeriodoOffset(0)}
                className="text-xs text-[#2563EB] hover:underline px-2 py-1 font-medium"
              >
                Voltar ao atual
              </button>
            )}
          </div>

          {/* Filtros e Busca */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isAdmRede && clientes.length > 1 && (
              <select
                value={clienteFiltro}
                onChange={(e) => setClienteFiltro(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="todos">Todas as Redes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar loja..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937] w-36 sm:w-44"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Destaque: Melhor Loja, Pior Loja e Média Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Melhor Loja */}
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Melhor Performance</span>
            </span>
            {destaques.melhor && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {destaques.melhor.taxaExecucao}%
              </span>
            )}
          </div>
          {destaques.melhor ? (
            <div className="mt-2">
              <h3 className="text-base font-bold text-[#1F2937] truncate">
                {destaques.melhor.lojaNome}
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {destaques.melhor.totalConcluidas} de {destaques.melhor.totalEsperadoPeriodo}{' '}
                rotinas concluídas
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {destaques.melhor.deltaPercentual >= 0
                    ? `+${destaques.melhor.deltaPercentual}%`
                    : `${destaques.melhor.deltaPercentual}%`}
                </span>
                <span className="text-[#6B7280]">vs. {rangeDates.labelAnt}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] mt-2">Sem dados no período</p>
          )}
        </div>

        {/* Pior Loja / Maior Atenção */}
        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
              <span>Ponto de Atenção</span>
            </span>
            {destaques.pior && (
              <span className="text-xs font-bold text-[#B91C1C] bg-red-100 px-2 py-0.5 rounded-full">
                {destaques.pior.taxaExecucao}%
              </span>
            )}
          </div>
          {destaques.pior ? (
            <div className="mt-2">
              <h3 className="text-base font-bold text-[#1F2937] truncate">
                {destaques.pior.lojaNome}
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {destaques.pior.rotinasAtrasadas} rotina(s) em atraso /{' '}
                {destaques.pior.planosAtrasados} plano(s) atrasados
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-[#B91C1C] font-semibold flex items-center gap-0.5">
                  {destaques.pior.deltaPercentual < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {destaques.pior.deltaPercentual >= 0
                    ? `+${destaques.pior.deltaPercentual}%`
                    : `${destaques.pior.deltaPercentual}%`}
                </span>
                <span className="text-[#6B7280]">vs. {rangeDates.labelAnt}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] mt-2">Sem discrepâncias registradas</p>
          )}
        </div>

        {/* Média Consolidada */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>Média Geral da Rede</span>
            </span>
            <span className="text-xs font-bold text-[#2563EB] bg-blue-100 px-2 py-0.5 rounded-full">
              {mediasConsolidadas.taxaMedia}%
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-base font-bold text-[#1F2937]">
              {mediasConsolidadas.totalConcluidas} concluídas
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              De {mediasConsolidadas.totalEsperado} tarefas esperadas no período
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${mediasConsolidadas.taxaMedia}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela do Dashboard Comparativo Loja a Loja */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden space-y-3 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1F2937] flex items-center gap-2">
              <span>Ranking e Desempenho por Unidade</span>
              <span className="text-xs font-normal text-[#6B7280]">
                ({lojasOrdenadas.length} lojas monitoradas)
              </span>
            </h3>
            <p className="text-xs text-[#6B7280]">
              Clique nos cabeçalhos para ordenar por taxa de execução ou atrasos
            </p>
          </div>

          {/* Ordenação Rápida */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
            >
              <option value="taxa_desc">Maior % de Execução</option>
              <option value="taxa_asc">Menor % de Execução</option>
              <option value="atrasadas_desc">Mais Rotinas Atrasadas</option>
              <option value="nome">Ordem Alfabética</option>
            </select>
          </div>
        </div>

        {lojasOrdenadas.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B7280] bg-[#F7F7F5]/50 rounded-lg border border-dashed border-[#E5E7EB]">
            Nenhuma loja encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Loja</th>
                  <th className="p-3 text-center">% Execução</th>
                  <th className="p-3 text-center">Concluídas / Total</th>
                  <th className="p-3 text-center">Atrasadas</th>
                  <th className="p-3 text-center">Devolvidas</th>
                  <th className="p-3 text-center">Planos 5W2H</th>
                  <th className="p-3 text-center">Visitas Promotores</th>
                  <th className="p-3 text-right">Evolução vs. Ant.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {lojasOrdenadas.map((loja, index) => {
                  const isTop = index === 0 && loja.taxaExecucao > 0
                  const hasCritico = loja.rotinasAtrasadas > 0 || loja.planosAtrasados > 0

                  return (
                    <tr
                      key={loja.lojaId}
                      className={`transition-colors hover:bg-gray-50/80 ${
                        isTop ? 'bg-emerald-50/20' : hasCritico ? 'hover:bg-red-50/20' : ''
                      }`}
                    >
                      {/* Loja e Rede */}
                      <td className="p-3 font-semibold text-[#1F2937]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center text-xs font-bold text-[#6B7280]">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{loja.lojaNome}</span>
                              {loja.codigo && (
                                <span className="text-[10px] text-[#6B7280] bg-gray-100 px-1 rounded">
                                  {loja.codigo}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-normal text-[#6B7280]">
                              {loja.clienteNome}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* % de Execução com Barra */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-bold ${
                              loja.taxaExecucao >= 80
                                ? 'text-emerald-700'
                                : loja.taxaExecucao >= 50
                                  ? 'text-amber-700'
                                  : 'text-[#B91C1C]'
                            }`}
                          >
                            {loja.taxaExecucao}%
                          </span>
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                loja.taxaExecucao >= 80
                                  ? 'bg-emerald-600'
                                  : loja.taxaExecucao >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-[#B91C1C]'
                              }`}
                              style={{ width: `${loja.taxaExecucao}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Concluídas x Total */}
                      <td className="p-3 text-center text-[#374151] font-medium">
                        {loja.totalConcluidas} / {loja.totalEsperadoPeriodo}
                      </td>

                      {/* Atrasadas */}
                      <td className="p-3 text-center">
                        {loja.rotinasAtrasadas > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#B91C1C]">
                            <AlertTriangle className="w-3 h-3" />
                            {loja.rotinasAtrasadas}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs">0</span>
                        )}
                      </td>

                      {/* Devolvidas */}
                      <td className="p-3 text-center">
                        {loja.rotinasDevolvidas > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <RotateCcw className="w-3 h-3" />
                            {loja.rotinasDevolvidas}
                          </span>
                        ) : (
                          <span className="text-[#6B7280] text-xs">-</span>
                        )}
                      </td>

                      {/* Planos 5W2H */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-[#374151]">
                            {loja.planosAbertos} abertos
                          </span>
                          {loja.planosAtrasados > 0 && (
                            <span className="text-[10px] font-bold text-[#B91C1C]">
                              ({loja.planosAtrasados} em atraso)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visitas de Promotores */}
                      <td className="p-3 text-center">
                        <span className="text-xs text-[#374151] font-medium">
                          {loja.visitasRealizadas} / {loja.visitasAgendadas}
                        </span>
                        {loja.visitasAgendadas > 0 && (
                          <div className="text-[10px] text-[#6B7280]">
                            {loja.taxaVisitas}% realizadas
                          </div>
                        )}
                      </td>

                      {/* Evolução vs Período Anterior */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {loja.deltaPercentual > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700">
                              <TrendingUp className="w-3.5 h-3.5" />+{loja.deltaPercentual}%
                            </span>
                          ) : loja.deltaPercentual < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#B91C1C]">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {loja.deltaPercentual}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#6B7280]">
                              <Minus className="w-3 h-3" />
                              0%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6B7280]">
                          (ant: {loja.taxaAnterior}%)
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
