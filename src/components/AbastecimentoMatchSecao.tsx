import { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Plus,
  RefreshCw,
  Lightbulb,
  Settings,
  ArrowRight,
  ShieldCheck,
  Building2,
  Trash2,
  Store,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RegistrarOcorrenciaMatchModal } from '@/components/RegistrarOcorrenciaMatchModal'
import { TratarDemandaMatchModal } from '@/components/TratarDemandaMatchModal'
import { NovaOportunidadeMatchModal } from '@/components/NovaOportunidadeMatchModal'
import { ParametrosMatchModal } from '@/components/ParametrosMatchModal'
import { matchService } from '@/services/matchService'
import type {
  MatchDemanda,
  MatchOportunidade,
  Loja,
  Fornecedor,
  User,
  StatusMatchDemanda,
} from '@/types'

interface AbastecimentoMatchSecaoProps {
  lojas: Loja[]
  lojaSelecionadaId?: string
  fornecedores?: Fornecedor[]
  user: User | null
  isGerente: boolean
  isRedeOuAdmin: boolean
  redeId?: string
}

export function AbastecimentoMatchSecao({
  lojas,
  lojaSelecionadaId,
  fornecedores = [],
  user,
  isGerente,
  isRedeOuAdmin,
  redeId,
}: AbastecimentoMatchSecaoProps) {
  // Aba interna do Integração: Demandas x Oportunidades
  const [subAba, setSubAba] = useState<'demandas' | 'oportunidades'>('demandas')

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('todas')
  const [filtroCurva, setFiltroCurva] = useState('todas')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroFornecedor, setFiltroFornecedor] = useState('todos')
  const [filtroLoja, setFiltroLoja] = useState<string>(
    isGerente ? lojaSelecionadaId || 'todas' : 'todas',
  )

  // Dados
  const [demandas, setDemandas] = useState<MatchDemanda[]>([])
  const [oportunidades, setOportunidades] = useState<MatchOportunidade[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [novaOcorrenciaModalOpen, setNovaOcorrenciaModalOpen] = useState(false)
  const [tratarDemandaModal, setTratarDemandaModal] = useState<{
    open: boolean
    demanda: MatchDemanda | null
  }>({ open: false, demanda: null })
  const [novaOportunidadeModalOpen, setNovaOportunidadeModalOpen] = useState(false)
  const [oportunidadeParaEditar, setOportunidadeParaEditar] = useState<MatchOportunidade | null>(
    null,
  )
  const [parametrosModalOpen, setParametrosModalOpen] = useState(false)

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true)
    try {
      // Se for perfil Gerente, restringe estritamente para a sua loja (lojaSelecionadaId ou primeira loja da lista)
      const lojaDoGerente =
        lojaSelecionadaId && lojaSelecionadaId !== 'todas'
          ? lojaSelecionadaId
          : lojas.length > 0
            ? lojas[0].id
            : undefined

      const lojaFiltroEfetiva = isGerente
        ? lojaDoGerente
        : filtroLoja && filtroLoja !== 'todas'
          ? filtroLoja
          : lojaSelecionadaId && lojaSelecionadaId !== 'todas'
            ? lojaSelecionadaId
            : undefined

      const [dems, opps] = await Promise.all([
        matchService.listarDemandas({
          redeId: isRedeOuAdmin ? redeId : undefined,
          lojaId: lojaFiltroEfetiva,
          situacao: filtroSituacao,
          curva: filtroCurva,
          status: filtroStatus,
          fornecedor: filtroFornecedor,
          busca,
        }),
        matchService.listarOportunidades({
          redeId: isRedeOuAdmin ? redeId : undefined,
        }),
      ])

      setDemandas(dems)
      setOportunidades(opps)
    } catch (err) {
      console.error('Erro ao carregar dados match:', err)
    } finally {
      setLoading(false)
    }
  }

  // Recarregar quando filtros mudarem
  useEffect(() => {
    carregarDados()
  }, [
    filtroSituacao,
    filtroCurva,
    filtroStatus,
    filtroFornecedor,
    filtroLoja,
    busca,
    lojaSelecionadaId,
    redeId,
  ])

  // Formatador BRL
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  // Indicadores Executivos calculados
  const kpis = useMemo(() => {
    const total = demandas.length
    const emRuptura = demandas.filter((d) => d.situacao === 'ruptura')
    const emDivergencia = demandas.filter((d) => d.situacao === 'divergencia_sistema_fisico')
    const semGiro = demandas.filter((d) => d.situacao === 'sem_giro')
    const emRisco = demandas.filter((d) => d.situacao === 'risco_ruptura')

    // R$ em risco por ruptura
    const valorEmRisco = demandas.reduce((acc, d) => {
      if (d.status !== 'resolvida') {
        return acc + (d.potencial_venda_perdida || 0)
      }
      return acc
    }, 0)

    // R$ recuperado após atendimento
    const valorRecuperado = demandas.reduce((acc, d) => {
      if (d.status === 'resolvida') {
        return acc + (d.valor_recuperado || d.potencial_venda_perdida || 0)
      }
      return acc
    }, 0)

    // % de ruptura por curva
    const curvaA = demandas.filter((d) => d.curva === 'A')
    const curvaARuptura = curvaA.filter((d) => d.situacao === 'ruptura').length
    const taxaCurvaA = curvaA.length > 0 ? (curvaARuptura / curvaA.length) * 100 : 0

    // Demandas resolvidas e SLA
    const resolvidas = demandas.filter((d) => d.status === 'resolvida')
    const dentroSla = resolvidas.filter((d) => d.dentro_sla !== false).length
    const taxaSla = resolvidas.length > 0 ? (dentroSla / resolvidas.length) * 100 : 100

    // Atendimento CD x Fornecedor
    const viaCd = demandas.filter((d) => d.origem_resolucao === 'cd').length
    const viaFornecedor = demandas.filter((d) => d.origem_resolucao === 'fornecedor').length

    // Oportunidades comerciais
    const totalOportunidades = oportunidades.length
    const convertidas = oportunidades.filter((o) => o.status === 'convertida')
    const valorConvertidoOpp = convertidas.reduce(
      (acc, o) => acc + (o.valor_convertido_reais || o.gap_estimado_reais || 0),
      0,
    )

    return {
      total,
      emRupturaCount: emRuptura.length,
      emDivergenciaCount: emDivergencia.length,
      semGiroCount: semGiro.length,
      emRiscoCount: emRisco.length,
      valorEmRisco,
      valorRecuperado,
      taxaCurvaA: taxaCurvaA.toFixed(0),
      resolvidasCount: resolvidas.length,
      taxaSla: taxaSla.toFixed(0),
      viaCd,
      viaFornecedor,
      totalOportunidades,
      convertidasCount: convertidas.length,
      valorConvertidoOpp,
    }
  }, [demandas, oportunidades])

  const handleDeleteDemanda = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja excluir esta ocorrência de demanda?')) return
    try {
      await matchService.excluirDemanda(id)
      carregarDados()
    } catch {
      alert('Falha ao excluir demanda.')
    }
  }

  const handleDeleteOportunidade = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja excluir esta oportunidade comercial?')) return
    try {
      await matchService.excluirOportunidade(id)
      carregarDados()
    } catch {
      alert('Falha ao excluir oportunidade.')
    }
  }

  // Cores de prioridade sóbrias (sem visual berrante)
  const renderPrioridadeBadge = (prio: string) => {
    switch (prio) {
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>Alta</span>
          </span>
        )
      case 'media':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Média</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>Baixa</span>
          </span>
        )
    }
  }

  const renderSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'ruptura':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
            Ruptura real
          </span>
        )
      case 'divergencia_sistema_fisico':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
            Divergência sistema × físico
          </span>
        )
      case 'sem_giro':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Sem giro
          </span>
        )
      case 'risco_ruptura':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Risco
          </span>
        )
      case 'pedido_aberto':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Pedido aberto
          </span>
        )
      case 'excesso_estoque':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Excesso
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {situacao.replace('_', ' ')}
          </span>
        )
    }
  }

  const renderStatusDemandaBadge = (st: StatusMatchDemanda) => {
    const map: Record<StatusMatchDemanda, { label: string; cls: string }> = {
      aberta: { label: 'Aberta', cls: 'bg-gray-100 text-gray-800 border-gray-200' },
      em_analise: { label: 'Em Análise', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      cd_abastecimento: {
        label: 'CD / Abastecimento',
        cls: 'bg-teal-50 text-[#0F766E] border-teal-200 font-bold',
      },
      fornecedor: { label: 'Fornecedor', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
      entrega_programada: {
        label: 'Entrega Programada',
        cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      recebida: { label: 'Recebida na Loja', cls: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
      disponivel_venda: {
        label: 'Disponível na Gôndola',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      },
      resolvida: {
        label: 'Resolvida',
        cls: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      },
    }
    const info = map[st] || { label: st, cls: 'bg-gray-100 text-gray-700' }
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${info.cls}`}
      >
        {info.label}
      </span>
    )
  }

  return (
    <div className="space-y-5">
      {/* LINHA DIRETRIZ E CONCEITO CENTRAL */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-gray-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#0F766E] text-white">
                VivaVarejo Integração
              </span>
              <span className="text-xs font-semibold text-[#0F766E] bg-teal-100/60 px-2 py-0.5 rounded-md border border-teal-200">
                Loja • CD • Abastecimento • Fornecedor
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#1F2937] tracking-tight">
              Integração Operacional: Diagnóstico de Estoque Antes de Gerar Demanda
            </h3>
            <p className="text-xs text-[#4B5563] leading-relaxed max-w-2xl">
              Antes de gerar demanda, o sistema cruza físico × sistema × venda e indica onde está a
              verdade: demanda só quando há ação real; o resto vira conferência física ou
              oportunidade comercial.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {isRedeOuAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setParametrosModalOpen(true)}
                className="text-xs rounded-xl gap-1.5 hover:border-[#0F766E] hover:text-[#0F766E]"
                title="Configurar SLA e parâmetros por rede"
              >
                <Settings className="w-3.5 h-3.5 text-[#0F766E]" />
                <span className="hidden sm:inline">Parâmetros</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => {
                if (subAba === 'oportunidades') {
                  setOportunidadeParaEditar(null)
                  setNovaOportunidadeModalOpen(true)
                } else {
                  setNovaOcorrenciaModalOpen(true)
                }
              }}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {subAba === 'oportunidades' ? 'Nova Oportunidade' : 'Registrar Ocorrência'}
              </span>
            </Button>
          </div>
        </div>

        {/* Linha Diretriz Visual: DADO -> INTELIGÊNCIA -> FILTRO -> DEMANDA -> RESPONSÁVEL -> RESOLUÇÃO -> RESULTADO */}
        <div className="pt-2 border-t border-teal-200/60">
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#4B5563] overflow-x-auto pb-1 no-scrollbar">
            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] shrink-0 text-[#1F2937]">
              1. DADO
            </span>
            <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] shrink-0 text-[#1F2937]">
              2. INTELIGÊNCIA
            </span>
            <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] shrink-0 text-[#1F2937]">
              3. FILTRO
            </span>
            <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] border border-teal-300 shrink-0 font-extrabold">
              4. DEMANDA
            </span>
            <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] shrink-0 text-[#1F2937]">
              5. RESPONSÁVEL
            </span>
            <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] shrink-0 text-[#1F2937]">
              6. RESOLUÇÃO
            </span>
            <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 font-extrabold">
              7. RESULTADO
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#4B5563] mt-2">
            <div className="flex items-center gap-1.5 font-medium text-[#0F766E]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Princípio de Integração:</strong> Cruzamos físico × sistema × venda para não
                gerar demanda à toa. Se o sistema marca estoque mas a loja zerou, é divergência
                física (inventário). Se há físico e não vende, é exposição comercial. Ruptura real
                aciona CD primeiro e fornecedor só sem saldo interno.
              </span>
            </div>
            {isGerente && (
              <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
                Visão Enxuta da Minha Loja
              </span>
            )}
          </div>
        </div>
      </div>

      {/* INDICADORES EXECUTIVOS (Destaque Financeiro: Ruptura em Dinheiro) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: R$ em risco por ruptura */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Potencial em Risco
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-red-600 tracking-tight">
            {formatCurrency(kpis.valorEmRisco)}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            {kpis.emRupturaCount} lojas/SKUs em ruptura física
          </p>
        </div>

        {/* Card 2: R$ recuperado após atendimento */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Venda Recuperada
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
            {formatCurrency(kpis.valorRecuperado)}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            {kpis.resolvidasCount} ocorrências atendidas e salvas
          </p>
        </div>

        {/* Card 3: % Atendimento CD x Fornecedor */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              CD × Fornecedor
            </span>
            <Building2 className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight flex items-center gap-2">
            <span className="text-[#0F766E]">{kpis.viaCd} CD</span>
            <span className="text-gray-300 font-normal">/</span>
            <span className="text-purple-700">{kpis.viaFornecedor} Ind</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Resoluções internas vs compras externas</p>
        </div>

        {/* Card 4: SLA e Curva A */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              SLA & Curva A
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-[#0F766E] tracking-tight">
            {kpis.taxaSla}% no SLA
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Curva A: {kpis.taxaCurvaA}% com ruptura</p>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUB-ABAS DO MATCH (Menu limpo e sem poluição) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB]">
        <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-[#E5E7EB] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubAba('demandas')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subAba === 'demandas'
                ? 'bg-white text-[#0F766E] shadow-2xs font-bold'
                : 'text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            Central de Demandas ({demandas.length})
          </button>
          <button
            type="button"
            onClick={() => setSubAba('oportunidades')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subAba === 'oportunidades'
                ? 'bg-white text-[#0F766E] shadow-2xs font-bold'
                : 'text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            Oportunidades Comerciais ({oportunidades.length})
          </button>
        </div>

        {/* Informação contextual de valor em dinheiro */}
        <div className="text-xs text-[#374151] flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>
            {demandas.filter((d) => d.curva === 'A' && d.situacao === 'ruptura').length} Curva A em
            ruptura • Impacto projetado:{' '}
            <strong className="text-red-600">{formatCurrency(kpis.valorEmRisco)}</strong>
          </span>
        </div>
      </div>

      {/* ==============================================================
          SUB-ABA 1: CENTRAL DE DEMANDAS
          ============================================================== */}
      {subAba === 'demandas' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS LIMPA */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar SKU, produto, parceiro..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-lg outline-none focus:border-[#0F766E] text-[#1F2937]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro de Loja (se não for gerente com loja fixa) */}
              {!isGerente && lojas.length > 0 && (
                <select
                  value={filtroLoja}
                  onChange={(e) => setFiltroLoja(e.target.value)}
                  className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                >
                  <option value="todas">Todas as Lojas</option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              )}

              {/* Filtro de Situação */}
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="todas">Todas as Situações</option>
                <option value="ruptura">Ruptura real (Físico 0 e Sistema 0)</option>
                <option value="divergencia_sistema_fisico">Divergência sistema × físico</option>
                <option value="sem_giro">Sem giro (Físico &gt; 0 e sem venda)</option>
                <option value="risco_ruptura">Risco de Ruptura</option>
                <option value="pedido_aberto">Pedido Aberto / Em Trânsito</option>
                <option value="excesso_estoque">Estoque Excessivo</option>
                <option value="oportunidade">Oportunidade</option>
              </select>

              {/* Filtro de Curva */}
              <select
                value={filtroCurva}
                onChange={(e) => setFiltroCurva(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="todas">Todas Curvas</option>
                <option value="A">Curva A</option>
                <option value="B">Curva B</option>
                <option value="C">Curva C</option>
                <option value="C+">Curva C+</option>
              </select>

              {/* Filtro de Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="todos">Todos Status</option>
                <option value="aberta">Aberta</option>
                <option value="em_analise">Em Análise</option>
                <option value="cd_abastecimento">CD / Abastecimento</option>
                <option value="fornecedor">Fornecedor</option>
                <option value="entrega_programada">Entrega Programada</option>
                <option value="recebida">Recebida</option>
                <option value="disponivel_venda">Disponível Venda</option>
                <option value="resolvida">Resolvida</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setBusca('')
                  setFiltroSituacao('todas')
                  setFiltroCurva('todas')
                  setFiltroStatus('todos')
                  setFiltroFornecedor('todos')
                  setFiltroLoja('todas')
                  carregarDados()
                }}
                className="px-2.5 py-1.5 text-xs text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* LISTA / TABELA DA FILA PRIORIZADA */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 bg-gray-200 rounded-xl" />
              ))}
            </div>
          ) : demandas.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-2xl space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-[#1F2937]">Nenhuma demanda encontrada</h4>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Sua fila está em dia ou não há ocorrências cadastradas para os filtros selecionados.
              </p>
              <Button
                size="sm"
                onClick={() => setNovaOcorrenciaModalOpen(true)}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Primeira Demanda</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Tabela no Desktop */}
              <div className="hidden lg:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Prioridade</th>
                      <th className="p-3">Loja</th>
                      <th className="p-3">SKU / Produto</th>
                      <th className="p-3 text-center">Curva</th>
                      <th className="p-3 text-right">Físico Loja</th>
                      <th className="p-3 text-right">No Sistema</th>
                      <th className="p-3 text-right">Estoque CD</th>
                      <th className="p-3">Situação Classificada</th>
                      <th className="p-3">Ação Sugerida</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Venda em Risco</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {demandas.map((dem) => (
                      <tr
                        key={dem.id}
                        onClick={() => setTratarDemandaModal({ open: true, demanda: dem })}
                        className="hover:bg-teal-50/40 cursor-pointer transition-colors"
                      >
                        <td className="p-3">{renderPrioridadeBadge(dem.prioridade)}</td>
                        <td className="p-3 font-medium text-[#1F2937]">
                          {dem.expand?.loja?.nome || 'Loja da Rede'}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#1F2937] leading-tight">
                            {dem.produto_descricao}
                          </div>
                          <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                            {dem.produto_codigo || 'SEM-CÓD'} •{' '}
                            {dem.fornecedor_nome || 'Sem parceiro'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              dem.curva === 'A'
                                ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {dem.curva}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={
                              (dem.estoque_loja || 0) <= 0
                                ? 'text-red-600 font-bold'
                                : 'text-[#1F2937]'
                            }
                          >
                            {dem.estoque_loja ?? 0}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-[#1F2937]">
                          {dem.estoque_sistema !== undefined ? dem.estoque_sistema : '—'}
                        </td>
                        <td className="p-3 text-right font-medium">
                          <span
                            className={
                              (dem.estoque_cd || 0) > 0
                                ? 'text-[#0F766E] font-bold'
                                : 'text-gray-400'
                            }
                          >
                            {dem.estoque_cd ?? 0}
                          </span>
                        </td>
                        <td className="p-3">{renderSituacaoBadge(dem.situacao)}</td>
                        <td className="p-3 max-w-xs">
                          <div className="text-[11px] font-semibold text-[#1F2937] truncate">
                            {dem.acao_sugerida}
                          </div>
                          {dem.resposta_padrao && (
                            <div className="text-[10px] text-[#0F766E] truncate mt-0.5">
                              Resp: {dem.resposta_padrao.replace('_', ' ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">{renderStatusDemandaBadge(dem.status)}</td>
                        <td className="p-3 text-right font-bold text-amber-700">
                          {formatCurrency(dem.potencial_venda_perdida || 0)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setTratarDemandaModal({ open: true, demanda: dem })
                              }}
                              className="text-xs h-7 px-2 hover:border-[#0F766E] hover:text-[#0F766E]"
                            >
                              Tratar
                            </Button>
                            {isRedeOuAdmin && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDemanda(dem.id, e)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors"
                                title="Excluir demanda"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards no Mobile / Tablet */}
              <div className="lg:hidden space-y-3">
                {demandas.map((dem) => (
                  <div
                    key={dem.id}
                    onClick={() => setTratarDemandaModal({ open: true, demanda: dem })}
                    className="bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-3.5 shadow-2xs space-y-2.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {renderPrioridadeBadge(dem.prioridade)}
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                            Curva {dem.curva}
                          </span>
                          <span className="text-[10px] text-[#6B7280]">
                            {dem.expand?.loja?.nome || 'Loja da Rede'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1F2937] mt-1 leading-snug">
                          {dem.produto_descricao}
                        </h4>
                        <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                          {dem.produto_codigo || 'SEM-CÓD'} •{' '}
                          {dem.fornecedor_nome || 'Sem parceiro'}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {renderStatusDemandaBadge(dem.status)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50 border border-[#E5E7EB] text-xs space-y-1">
                      <div className="text-[11px] font-bold text-[#1F2937]">
                        Ação: {dem.acao_sugerida}
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {renderSituacaoBadge(dem.situacao)}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] text-[#4B5563] pt-1">
                        <div>
                          Físico:{' '}
                          <strong
                            className={dem.estoque_loja === 0 ? 'text-red-600' : 'text-[#1F2937]'}
                          >
                            {dem.estoque_loja ?? 0}
                          </strong>
                        </div>
                        <div>
                          Sistema:{' '}
                          <strong className="text-[#1F2937]">
                            {dem.estoque_sistema !== undefined ? dem.estoque_sistema : '—'}
                          </strong>
                        </div>
                        <div>
                          CD: <strong className="text-[#0F766E]">{dem.estoque_cd ?? 0}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F3F4F6]">
                      <span className="text-[11px] text-amber-700 font-bold">
                        Venda em risco: {formatCurrency(dem.potencial_venda_perdida || 0)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0F766E] inline-flex items-center gap-1">
                        <span>Tratar</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==============================================================
          SUB-ABA 2: OPORTUNIDADES COMERCIAIS
          ============================================================== */}
      {subAba === 'oportunidades' && (
        <div className="space-y-4">
          <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-[#1F2937] text-sm flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#0F766E]" />
                <span>Oportunidades Comerciais Entre Lojas Comparáveis</span>
              </span>
              <p className="text-[#6B7280]">
                Produtos com alta penetração em certas lojas da rede e baixa presença em outras com
                mesmo perfil.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setOportunidadeParaEditar(null)
                setNovaOportunidadeModalOpen(true)
              }}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Oportunidade</span>
            </Button>
          </div>

          {oportunidades.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-2xl space-y-3">
              <Lightbulb className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#1F2937]">Nenhuma oportunidade registrada</h4>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Registre produtos que performam bem em algumas filiais para expandir o mix e
                capturar o potencial de vendas nas demais lojas.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setOportunidadeParaEditar(null)
                  setNovaOportunidadeModalOpen(true)
                }}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Oportunidade</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {oportunidades.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => {
                    setOportunidadeParaEditar(opp)
                    setNovaOportunidadeModalOpen(true)
                  }}
                  className="bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs space-y-3 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#6B7280]">
                        {opp.produto_codigo || 'SEM-CÓD'} • {opp.categoria || 'Geral'}
                      </span>
                      <h4 className="text-sm font-bold text-[#1F2937] leading-tight mt-0.5">
                        {opp.produto_descricao}
                      </h4>
                      <p className="text-[11px] text-[#0F766E] font-semibold mt-0.5">
                        Fornecedor: {opp.fornecedor_nome || 'Parceiro da Rede'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        opp.status === 'convertida'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : opp.status === 'em_negociacao'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {opp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB] text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block">Lojas Referência:</span>
                      <strong className="text-[#1F2937] truncate block">
                        {opp.lojas_referencia || '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] block">Lojas com Gap:</span>
                      <strong className="text-red-700 truncate block">
                        {opp.lojas_com_gap || '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F3F4F6]">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block">Gap Estimado / Mês:</span>
                      <strong className="text-sm font-extrabold text-[#0F766E]">
                        {formatCurrency(opp.gap_estimado_reais || 0)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOportunidadeParaEditar(opp)
                          setNovaOportunidadeModalOpen(true)
                        }}
                        className="text-xs h-7 px-2 hover:border-[#0F766E] hover:text-[#0F766E]"
                      >
                        Editar
                      </Button>
                      {isRedeOuAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOportunidade(opp.id, e)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir oportunidade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RODAPÉ DO MÓDULO — TOM DO PRODUTO (REQUISITO 10) */}
      <div className="mt-8 p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E7EB] text-center text-xs text-[#4B5563]">
        <p className="font-semibold text-[#1F2937]">
          &ldquo;VivaVarejo: identificar onde a empresa está perdendo execução e venda, transformar
          isso em demanda e conectar os responsáveis pela solução.&rdquo;
        </p>
      </div>

      {/* MODAIS */}
      <RegistrarOcorrenciaMatchModal
        open={novaOcorrenciaModalOpen}
        onOpenChange={setNovaOcorrenciaModalOpen}
        redeId={redeId}
        lojas={lojas}
        lojaSelecionadaId={lojaSelecionadaId}
        fornecedores={fornecedores}
        userName={user?.nome || 'Operador / Gerente'}
        userId={user?.id}
        onSucesso={carregarDados}
      />

      <TratarDemandaMatchModal
        open={tratarDemandaModal.open}
        onOpenChange={(open) => setTratarDemandaModal((prev) => ({ ...prev, open }))}
        demanda={tratarDemandaModal.demanda}
        userName={user?.nome || 'Abastecimento / ADM'}
        onSucesso={carregarDados}
      />

      <NovaOportunidadeMatchModal
        open={novaOportunidadeModalOpen}
        onOpenChange={setNovaOportunidadeModalOpen}
        redeId={redeId}
        oportunidadeParaEditar={oportunidadeParaEditar}
        onSucesso={carregarDados}
      />

      <ParametrosMatchModal
        open={parametrosModalOpen}
        onOpenChange={setParametrosModalOpen}
        redeId={redeId}
        onSucesso={carregarDados}
      />
    </div>
  )
}
