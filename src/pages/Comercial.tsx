import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  Percent,
  Calendar,
  Tag,
  PieChart,
  Search,
  Filter,
  Download,
  UploadCloud,
  Plus,
  RefreshCw,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreSelector } from '@/components/StoreSelector'
import { useStore } from '@/context/StoreContext'
import { comercialService } from '@/services/comercial'
import { ImportarComercialModal } from '@/components/ImportarComercialModal'
import { NovaAcaoComercialModal } from '@/components/NovaAcaoComercialModal'
import { NovaImplantacaoModal } from '@/components/NovaImplantacaoModal'
import type {
  ComercialProduto,
  ComercialCategoria,
  ComercialAcao,
  ComercialImplantacao,
} from '@/types'

export type AbaComercial =
  | 'resumo'
  | 'rupturas'
  | 'sortimento'
  | 'vendas'
  | 'negativos_sem_vendas'
  | 'curvas'
  | 'implantacao'
  | 'acoes'
  | 'quebras'

interface AbaItem {
  id: AbaComercial
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export default function ComercialPage() {
  const { lojaSelecionadaId, lojas } = useStore()

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaComercial>('resumo')

  // Filtros
  const [competencia, setCompetencia] = useState<string>(new Date().toISOString().slice(0, 7))
  const [busca, setBusca] = useState('')
  const [filtroCurva, setFiltroCurva] = useState('todas')
  const [filtroFaixaSemVenda, setFiltroFaixaSemVenda] = useState('todas')
  const [filtroDepto, setFiltroDepto] = useState('todos')

  // Dados do PocketBase
  const [produtos, setProdutos] = useState<ComercialProduto[]>([])
  const [categorias, setCategorias] = useState<ComercialCategoria[]>([])
  const [acoes, setAcoes] = useState<ComercialAcao[]>([])
  const [implantacoes, setImplantacoes] = useState<ComercialImplantacao[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [importarModalOpen, setImportarModalOpen] = useState(false)
  const [novaAcaoModalOpen, setNovaAcaoModalOpen] = useState(false)
  const [novaImplantacaoModalOpen, setNovaImplantacaoModalOpen] = useState(false)

  const lojaId = lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true)
    try {
      const [prodsData, catsData, acoesData, impData] = await Promise.all([
        comercialService.listarProdutos({
          lojaId: lojaId || undefined,
          competencia,
        }),
        comercialService.listarCategorias({
          lojaId: lojaId || undefined,
          competencia,
        }),
        comercialService.listarAcoes({
          lojaId: lojaId || undefined,
        }),
        comercialService.listarImplantacoes({
          lojaId: lojaId || undefined,
        }),
      ])

      setProdutos(prodsData)
      setCategorias(catsData)
      setAcoes(acoesData)
      setImplantacoes(impData)
    } catch (err) {
      console.error('Erro ao carregar dados comerciais:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [lojaId, competencia])

  // ==================== CÁLCULOS E RESUMO EXECUTIVO ====================
  const kpis = useMemo(() => {
    const totalProdutos = produtos.length
    const produtosRuptura = produtos.filter((p) => p.em_ruptura || (p.estoque_fisico || 0) <= 0)
    const taxaRuptura = totalProdutos > 0 ? (produtosRuptura.length / totalProdutos) * 100 : 0

    const produtosVirtuais = produtos.filter(
      (p) => (p.estoque_virtual || 0) > 0 && (p.estoque_fisico || 0) <= 0,
    )

    const produtosNegativos = produtos.filter((p) => (p.estoque_fisico || 0) < 0)

    const semVendas30 = produtos.filter(
      (p) => (p.dias_sem_venda || 0) >= 30 && (p.dias_sem_venda || 0) < 60,
    )
    const semVendas60 = produtos.filter(
      (p) => (p.dias_sem_venda || 0) >= 60 && (p.dias_sem_venda || 0) < 90,
    )
    const semVendas90 = produtos.filter((p) => (p.dias_sem_venda || 0) >= 90)
    const totalSemVendas = semVendas30.length + semVendas60.length + semVendas90.length

    // Vendas e Metas
    const vendaTotalRealizada =
      categorias.length > 0
        ? categorias.reduce((acc, c) => acc + (c.venda_valor || 0), 0)
        : produtos.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)

    const metaTotalVenda = categorias.reduce((acc, c) => acc + (c.meta_venda_valor || 0), 0)
    const atingimentoMetaGeral =
      metaTotalVenda > 0 ? (vendaTotalRealizada / metaTotalVenda) * 100 : 100

    const quebraTotalValor = categorias.reduce((acc, c) => acc + (c.quebra_valor || 0), 0)
    const quebraPercSobreVenda =
      vendaTotalRealizada > 0 ? (quebraTotalValor / vendaTotalRealizada) * 100 : 0

    // Curvas A / B / C / C+
    const totalVendaCurvas = produtos.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)
    const totalQtdCurvas = produtos.reduce((acc, p) => acc + (p.venda_qtd_periodo || 0), 0)

    const curvaA = produtos.filter((p) => p.curva === 'A')
    const curvaB = produtos.filter((p) => p.curva === 'B')
    const curvaC = produtos.filter((p) => p.curva === 'C')
    const curvaCPlus = produtos.filter((p) => p.curva === 'C+')

    const valorA = curvaA.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)
    const valorB = curvaB.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)
    const valorC = curvaC.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)
    const valorCPlus = curvaCPlus.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)

    const qtdA = curvaA.reduce((acc, p) => acc + (p.venda_qtd_periodo || 0), 0)
    const qtdB = curvaB.reduce((acc, p) => acc + (p.venda_qtd_periodo || 0), 0)
    const qtdC = curvaC.reduce((acc, p) => acc + (p.venda_qtd_periodo || 0), 0)
    const qtdCPlus = curvaCPlus.reduce((acc, p) => acc + (p.venda_qtd_periodo || 0), 0)

    const percValorA = totalVendaCurvas > 0 ? (valorA / totalVendaCurvas) * 100 : 0
    const percValorB = totalVendaCurvas > 0 ? (valorB / totalVendaCurvas) * 100 : 0
    const percValorC = totalVendaCurvas > 0 ? (valorC / totalVendaCurvas) * 100 : 0
    const percValorCPlus = totalVendaCurvas > 0 ? (valorCPlus / totalVendaCurvas) * 100 : 0

    const percQtdA = totalQtdCurvas > 0 ? (qtdA / totalQtdCurvas) * 100 : 0
    const percQtdB = totalQtdCurvas > 0 ? (qtdB / totalQtdCurvas) * 100 : 0
    const percQtdC = totalQtdCurvas > 0 ? (qtdC / totalQtdCurvas) * 100 : 0
    const percQtdCPlus = totalQtdCurvas > 0 ? (qtdCPlus / totalQtdCurvas) * 100 : 0

    // Giro médio ponderado
    const prodsComGiro = produtos.filter((p) => (p.giro_dias || 0) > 0)
    const giroMedioDias =
      prodsComGiro.length > 0
        ? Math.round(
            prodsComGiro.reduce((acc, p) => acc + (p.giro_dias || 0), 0) / prodsComGiro.length,
          )
        : 0

    // Margem média geral
    const prodsComMargem = produtos.filter((p) => (p.margem_perc || 0) > 0)
    const margemMediaPerc =
      prodsComMargem.length > 0
        ? (
            prodsComMargem.reduce((acc, p) => acc + (p.margem_perc || 0), 0) / prodsComMargem.length
          ).toFixed(1)
        : '0'

    // Rebaixas e Ações ativas
    const acoesAtivas = acoes.filter((a) => a.status === 'em_vigor' || a.status === 'planejada')
    const rebaixasAtivas = acoes.filter((a) => a.tipo === 'rebaixa')

    return {
      totalProdutos,
      produtosRupturaCount: produtosRuptura.length,
      taxaRuptura: taxaRuptura.toFixed(1),
      produtosVirtuaisCount: produtosVirtuais.length,
      produtosNegativosCount: produtosNegativos.length,
      semVendas30Count: semVendas30.length,
      semVendas60Count: semVendas60.length,
      semVendas90Count: semVendas90.length,
      totalSemVendas,
      vendaTotalRealizada,
      metaTotalVenda,
      atingimentoMetaGeral: atingimentoMetaGeral.toFixed(1),
      quebraTotalValor,
      quebraPercSobreVenda: quebraPercSobreVenda.toFixed(2),
      giroMedioDias,
      margemMediaPerc,
      acoesAtivasCount: acoesAtivas.length,
      rebaixasAtivasCount: rebaixasAtivas.length,
      curvas: {
        A: {
          count: curvaA.length,
          percValor: percValorA.toFixed(1),
          percQtd: percQtdA.toFixed(1),
          valor: valorA,
        },
        B: {
          count: curvaB.length,
          percValor: percValorB.toFixed(1),
          percQtd: percQtdB.toFixed(1),
          valor: valorB,
        },
        C: {
          count: curvaC.length,
          percValor: percValorC.toFixed(1),
          percQtd: percQtdC.toFixed(1),
          valor: valorC,
        },
        CPlus: {
          count: curvaCPlus.length,
          percValor: percValorCPlus.toFixed(1),
          percQtd: percQtdCPlus.toFixed(1),
          valor: valorCPlus,
        },
      },
    }
  }, [produtos, categorias, acoes])

  // Departamentos disponíveis para filtro
  const departamentosDisponiveis = useMemo(() => {
    const s = new Set<string>()
    produtos.forEach((p) => p.departamento && s.add(p.departamento))
    categorias.forEach((c) => c.departamento && s.add(c.departamento))
    return Array.from(s).sort()
  }, [produtos, categorias])

  // Produtos filtrados para exibição
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      if (filtroCurva !== 'todas' && p.curva !== filtroCurva) return false
      if (filtroDepto !== 'todos' && p.departamento !== filtroDepto) return false
      if (filtroFaixaSemVenda !== 'todas' && p.faixa_sem_venda !== filtroFaixaSemVenda) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const match =
          p.descricao.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q) ||
          (p.departamento || '').toLowerCase().includes(q) ||
          (p.fornecedor || '').toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [produtos, filtroCurva, filtroDepto, filtroFaixaSemVenda, busca])

  // Itens específicos por visão
  const itensRuptura = useMemo(() => {
    return produtosFiltrados.filter(
      (p) => p.em_ruptura || (p.estoque_fisico || 0) <= 0 || (p.estoque_virtual || 0) > 0,
    )
  }, [produtosFiltrados])

  const itensNegativosSemVenda = useMemo(() => {
    return produtosFiltrados.filter(
      (p) => (p.estoque_fisico || 0) < 0 || (p.dias_sem_venda || 0) >= 30,
    )
  }, [produtosFiltrados])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  // Exportar CSV da visão ativa
  const handleExportarCsv = () => {
    let csvHeader = ''
    let csvRows: string[] = []
    const filename = `comercial_${abaAtiva}_${competencia}.csv`

    if (
      abaAtiva === 'rupturas' ||
      abaAtiva === 'resumo' ||
      abaAtiva === 'sortimento' ||
      abaAtiva === 'curvas'
    ) {
      csvHeader =
        'Código;Descrição;Departamento;Categoria;Curva;Estoque Físico;Estoque Virtual;Ruptura;Tipo Ruptura;Preço;Giro (Dias);Margem %'
      csvRows = produtosFiltrados.map((p) =>
        [
          `"${p.codigo}"`,
          `"${p.descricao.replace(/"/g, '""')}"`,
          `"${(p.departamento || '').replace(/"/g, '""')}"`,
          `"${(p.categoria || '').replace(/"/g, '""')}"`,
          `"${p.curva || 'C'}"`,
          p.estoque_fisico ?? 0,
          p.estoque_virtual ?? 0,
          p.em_ruptura ? 'SIM' : 'NÃO',
          `"${p.tipo_ruptura || 'nenhuma'}"`,
          (p.preco_venda || 0).toFixed(2),
          p.giro_dias ?? 0,
          (p.margem_perc || 0).toFixed(1),
        ].join(';'),
      )
    } else if (abaAtiva === 'vendas' || abaAtiva === 'quebras') {
      csvHeader =
        'Departamento;Categoria;Venda (R$);Meta (R$);Atingimento %;Share %;Margem %;Quebra (R$);Quebra %'
      csvRows = categorias.map((c) =>
        [
          `"${c.departamento.replace(/"/g, '""')}"`,
          `"${c.categoria.replace(/"/g, '""')}"`,
          (c.venda_valor || 0).toFixed(2),
          (c.meta_venda_valor || 0).toFixed(2),
          (c.atingimento_meta_perc || 0).toFixed(1),
          (c.participacao_vendas_perc || 0).toFixed(1),
          (c.margem_lucro_perc || 0).toFixed(1),
          (c.quebra_valor || 0).toFixed(2),
          (c.quebra_perc_sobre_venda || 0).toFixed(2),
        ].join(';'),
      )
    } else if (abaAtiva === 'acoes') {
      csvHeader = 'Título;Tipo;Departamento;Produto;De;Por;Desconto %;Início;Fim;Status;Responsável'
      csvRows = acoes.map((a) =>
        [
          `"${a.titulo.replace(/"/g, '""')}"`,
          `"${a.tipo}"`,
          `"${(a.departamento || '').replace(/"/g, '""')}"`,
          `"${(a.produto_descricao || '').replace(/"/g, '""')}"`,
          (a.preco_de || 0).toFixed(2),
          (a.preco_por || 0).toFixed(2),
          (a.desconto_perc || 0).toFixed(1),
          a.data_inicio,
          a.data_fim || '',
          `"${a.status}"`,
          `"${(a.responsavel_nome || '').replace(/"/g, '""')}"`,
        ].join(';'),
      )
    } else if (abaAtiva === 'implantacao') {
      csvHeader =
        'Título;Tipo;Setor / Corredor;Data Prevista;Status;Progresso %;Responsável;Fornecedor'
      csvRows = implantacoes.map((i) =>
        [
          `"${i.titulo.replace(/"/g, '""')}"`,
          `"${i.tipo}"`,
          `"${i.departamento_setor.replace(/"/g, '""')}"`,
          i.data_prevista,
          `"${i.status}"`,
          i.progresso_perc ?? 0,
          `"${(i.responsavel_execucao || '').replace(/"/g, '""')}"`,
          `"${(i.fornecedor_parceiro || '').replace(/"/g, '""')}"`,
        ].join(';'),
      )
    }

    const csvContent = '\uFEFF' + [csvHeader, ...csvRows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Abas do Módulo Comercial
  const abas: AbaItem[] = [
    { id: 'resumo', label: 'Resumo Executivo', icon: TrendingUp },
    {
      id: 'rupturas',
      label: 'Rupturas & Virtual',
      icon: AlertTriangle,
      badge: kpis.produtosRupturaCount > 0 ? `${kpis.produtosRupturaCount}` : undefined,
    },
    { id: 'sortimento', label: 'Sortimento & Mix', icon: Package },
    { id: 'vendas', label: 'Vendas & Margem', icon: Percent },
    {
      id: 'negativos_sem_vendas',
      label: 'Negativos & Sem Vendas',
      icon: ArrowDownRight,
      badge: kpis.totalSemVendas > 0 ? `${kpis.totalSemVendas}` : undefined,
    },
    { id: 'curvas', label: 'Curvas A / B / C+', icon: Layers },
    { id: 'implantacao', label: 'Layout & Cronograma', icon: Calendar },
    { id: 'acoes', label: 'Ações, Pricing & Rebaixas', icon: Tag },
    { id: 'quebras', label: '% Quebras por Categoria', icon: PieChart },
  ]

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
              Gestão Comercial & Negócio
            </span>
            <span className="text-xs text-[#6B7280]">VivaVarejo • Visão de Negócio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight mt-1 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#0F766E]" />
            <span>Módulo Comercial</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Rupturas, sortimento, vendas, curvas A/B/C+, margens, layout e sincronização de dados
          </p>
        </div>

        {/* Ações Rápidas: StoreSelector + Importar Planilha + Exportar */}
        <div className="flex items-center gap-2 flex-wrap">
          <StoreSelector />

          <button
            onClick={handleExportarCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#374151] hover:text-[#0F766E] text-xs font-semibold rounded-xl shadow-2xs transition-colors"
            title="Exportar dados da visão atual em planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <Button
            size="sm"
            onClick={() => setImportarModalOpen(true)}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Importar Planilha</span>
          </Button>
        </div>
      </div>

      {/* Sincronização ERP Banner Discreto (Requisito 3) */}
      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#4B5563] shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 border border-teal-200">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">
            <strong className="text-[#1F2937]">Sincronização com ERP:</strong> Em breve conexão
            nativa API/Webhooks. Atualmente sincronize via <b>importação de planilhas</b> com
            substituição por competência.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
            Competência: {competencia}
          </span>
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1 text-[#1F2937] outline-none focus:border-[#0F766E]"
            title="Alterar mês de competência dos dados comerciais"
          />
        </div>
      </div>

      {/* Abas Horizontais com Scroll no Mobile */}
      <div className="border-b border-[#E5E7EB] overflow-x-auto scrollbar-thin">
        <nav className="flex space-x-1 sm:space-x-2 pb-px min-w-max">
          {abas.map((aba) => {
            const Icon = aba.icon
            const isAtiva = abaAtiva === aba.id
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as AbaComercial)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                  isAtiva
                    ? 'border-[#0F766E] text-[#0F766E] bg-white'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isAtiva ? 'text-[#0F766E]' : 'text-[#9CA3AF]'}`} />
                <span>{aba.label}</span>
                {aba.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isAtiva ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {aba.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Barra de Filtros Rápidos (quando não está no resumo executivo puro) */}
      {abaAtiva !== 'resumo' && abaAtiva !== 'implantacao' && abaAtiva !== 'acoes' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar SKU, produto, departamento..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-lg outline-none focus:border-[#0F766E] text-[#1F2937]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {departamentosDisponiveis.length > 0 && (
              <select
                value={filtroDepto}
                onChange={(e) => setFiltroDepto(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="todos">Todos Departamentos</option>
                {departamentosDisponiveis.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtroCurva}
              onChange={(e) => setFiltroCurva(e.target.value)}
              className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="todas">Todas as Curvas</option>
              <option value="A">Curva A</option>
              <option value="B">Curva B</option>
              <option value="C">Curva C</option>
              <option value="C+">Curva C+</option>
            </select>

            <button
              onClick={() => {
                setBusca('')
                setFiltroCurva('todas')
                setFiltroDepto('todos')
                setFiltroFaixaSemVenda('todas')
              }}
              className="px-2.5 py-1.5 text-xs text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Dinâmico Baseado na Aba Ativa */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : produtos.length === 0 &&
        categorias.length === 0 &&
        acoes.length === 0 &&
        implantacoes.length === 0 ? (
        /* Estado Vazio Amigável Conforme Requisito 3 */
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center mx-auto shadow-2xs">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
              Nenhum dado comercial registrado nesta competência
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1.5 max-w-md mx-auto leading-relaxed">
              O VivaVarejo opera com dados 100% integrados e sem números fictícios. Comece
              importando sua planilha de sortimento, rupturas ou vendas.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="sm"
              onClick={() => setImportarModalOpen(true)}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-2 shadow-xs w-full sm:w-auto"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Planilha (XLSX / CSV)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNovaAcaoModalOpen(true)}
              className="text-xs rounded-xl w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1 text-[#0F766E]" />
              <span>Cadastrar Ação Manual</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ==========================================================
              ABA 1: RESUMO EXECUTIVO (Cards Principais)
             ========================================================== */}
          {abaAtiva === 'resumo' && (
            <div className="space-y-6">
              {/* Cards de Indicadores Principais */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Ruptura % */}
                <div
                  onClick={() => setAbaAtiva('rupturas')}
                  className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Ruptura Global
                    </span>
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        Number(kpis.taxaRuptura) > 5 ? 'text-amber-500' : 'text-emerald-600'
                      }`}
                    />
                  </div>
                  <div className="mt-2.5">
                    <div
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        Number(kpis.taxaRuptura) > 5 ? 'text-amber-600' : 'text-emerald-700'
                      }`}
                    >
                      {kpis.taxaRuptura}%
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                      <span>{kpis.produtosRupturaCount} itens sem estoque</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#0F766E] transition-colors" />
                    </p>
                  </div>
                </div>

                {/* 2. Sem Vendas (30/60/90+) */}
                <div
                  onClick={() => setAbaAtiva('negativos_sem_vendas')}
                  className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Sem Venda 30/60/90+
                    </span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                      {kpis.totalSemVendas}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                      <span>
                        30d: {kpis.semVendas30Count} | 60d: {kpis.semVendas60Count} | 90d+:{' '}
                        {kpis.semVendas90Count}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#0F766E] transition-colors" />
                    </p>
                  </div>
                </div>

                {/* 3. Vendas Realizadas vs Metas */}
                <div
                  onClick={() => setAbaAtiva('vendas')}
                  className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Vendas do Período
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl sm:text-2xl font-extrabold text-[#0F766E] tracking-tight truncate">
                      {formatCurrency(kpis.vendaTotalRealizada)}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                      <span>Meta: {kpis.atingimentoMetaGeral}% atingida</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#0F766E] transition-colors" />
                    </p>
                  </div>
                </div>

                {/* 4. Curvas A/B/C (% Valor) */}
                <div
                  onClick={() => setAbaAtiva('curvas')}
                  className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Curvas (% Valor)
                    </span>
                    <Layers className="w-4 h-4 text-[#0F766E]" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                      <span className="text-[#0F766E]">A: {kpis.curvas.A.percValor}%</span>
                      <span className="text-blue-600">B: {kpis.curvas.B.percValor}%</span>
                      <span className="text-gray-500">C: {kpis.curvas.C.percValor}%</span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                      <span>{kpis.totalProdutos} SKUs cadastrados</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#0F766E] transition-colors" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Linha 2 de Indicadores: Negativos, Rebaixas, Margem e Giro */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Estoque Negativo
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-red-600 mt-1">
                    {kpis.produtosNegativosCount} itens
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Divergência física/virtual grave
                  </p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Margem Média
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-[#0F766E] mt-1">
                    {kpis.margemMediaPerc}%
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Média ponderada de rentabilidade
                  </p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Giro Médio (Cobertura)
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-[#1F2937] mt-1">
                    {kpis.giroMedioDias} dias
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Velocidade de renovação</p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Quebras Totais
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-red-700 mt-1">
                    {kpis.quebraPercSobreVenda}% ({formatCurrency(kpis.quebraTotalValor)})
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">% Sobre a venda total</p>
                </div>
              </div>

              {/* Blocos Enxutos Diretos para Cada Visão */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {abas
                  .filter((a) => a.id !== 'resumo')
                  .map((bloco) => {
                    const Icon = bloco.icon
                    return (
                      <div
                        key={bloco.id}
                        onClick={() => setAbaAtiva(bloco.id as AbaComercial)}
                        className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group flex flex-col justify-between h-36"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center border border-teal-200 shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#0F766E] transition-colors" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-[#1F2937] group-hover:text-[#0F766E] transition-colors">
                            {bloco.label}
                          </h2>
                          <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                            {bloco.id === 'rupturas' &&
                              'Visualizar rupturas físicas, virtuais e de gôndola.'}
                            {bloco.id === 'sortimento' &&
                              'Mix ativo por departamento e cobertura em dias.'}
                            {bloco.id === 'vendas' &&
                              'Faturamento e atingimento de metas por categoria.'}
                            {bloco.id === 'negativos_sem_vendas' &&
                              'Produtos sem giro há 30, 60 ou mais de 90 dias.'}
                            {bloco.id === 'curvas' &&
                              'Participação das curvas A, B e C em valor e quantidade.'}
                            {bloco.id === 'implantacao' &&
                              'Cronograma de reformas, novos mix e layout de gôndolas.'}
                            {bloco.id === 'acoes' &&
                              'Preços De/Por, rebaixas para desova e campanhas.'}
                            {bloco.id === 'quebras' &&
                              'Avarias e quebras percentuais sobre o faturamento.'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* ==========================================================
              ABA 2: RUPTURAS E VIRTUAL
             ========================================================== */}
          {abaAtiva === 'rupturas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Itens em Ruptura & Estoque Virtual ({itensRuptura.length})
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Prioridade de reposição para itens Curva A e B
                  </p>
                </div>
              </div>

              {/* Tabela no Desktop / Cards no Mobile */}
              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Departamento / Categoria</th>
                      <th className="p-3">Curva</th>
                      <th className="p-3">Estoque Físico</th>
                      <th className="p-3">Estoque Virtual</th>
                      <th className="p-3">Tipo Ruptura</th>
                      <th className="p-3">Venda Mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {itensRuptura.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-mono font-medium">{p.codigo}</td>
                        <td className="p-3 font-semibold text-[#1F2937]">{p.descricao}</td>
                        <td className="p-3 text-[#6B7280]">
                          {p.departamento} • {p.categoria}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              p.curva === 'A'
                                ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Curva {p.curva || 'C'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              (p.estoque_fisico || 0) <= 0
                                ? 'text-red-600 font-bold'
                                : 'text-[#1F2937]'
                            }
                          >
                            {p.estoque_fisico ?? 0}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-amber-600">{p.estoque_virtual ?? 0}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            {p.tipo_ruptura === 'virtual'
                              ? 'Estoque Virtual'
                              : p.tipo_ruptura === 'gondola'
                                ? 'Falta na Gôndola'
                                : 'Física'}
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          {formatCurrency(p.venda_valor_periodo || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards no Mobile */}
              <div className="md:hidden space-y-3">
                {itensRuptura.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#6B7280]">{p.codigo}</span>
                        <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
                          {p.descricao}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                        {p.curva || 'C'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Físico / Virtual:</span>
                        <span className="font-bold text-red-600">{p.estoque_fisico ?? 0}</span> /{' '}
                        {p.estoque_virtual ?? 0}
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Tipo Ruptura:</span>
                        <span className="font-semibold text-red-700 capitalize">
                          {p.tipo_ruptura || 'Física'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              ABA 3: SORTIMENTO & MIX
             ========================================================== */}
          {abaAtiva === 'sortimento' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Mix de Sortimento Ativo ({produtosFiltrados.length} itens)
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Cobertura de estoque e giro em dias por produto
                  </p>
                </div>
              </div>

              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Departamento</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Preço Venda</th>
                      <th className="p-3">Margem %</th>
                      <th className="p-3">Giro (Dias)</th>
                      <th className="p-3">Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {produtosFiltrados.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-mono text-[#6B7280]">{p.codigo}</td>
                        <td className="p-3 font-semibold text-[#1F2937]">{p.descricao}</td>
                        <td className="p-3 text-[#4B5563]">{p.departamento}</td>
                        <td className="p-3 text-[#4B5563]">{p.categoria}</td>
                        <td className="p-3 font-medium">{formatCurrency(p.preco_venda || 0)}</td>
                        <td className="p-3 font-bold text-[#0F766E]">
                          {(p.margem_perc || 0).toFixed(1)}%
                        </td>
                        <td className="p-3 font-medium">{p.giro_dias || 0} dias</td>
                        <td className="p-3 font-medium">{p.estoque_fisico ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards no Mobile */}
              <div className="md:hidden space-y-3">
                {produtosFiltrados.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#6B7280]">{p.codigo}</span>
                        <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
                          {p.descricao}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-[#0F766E]">
                        {(p.margem_perc || 0).toFixed(1)}% margem
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Preço / Estoque:</span>
                        <span className="font-semibold">
                          {formatCurrency(p.preco_venda || 0)}
                        </span>{' '}
                        ({p.estoque_fisico ?? 0} un)
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Giro em Dias:</span>
                        <span className="font-semibold">{p.giro_dias || 0} dias</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              ABA 4: VENDAS E MARGEM (Metas vs Realizado)
             ========================================================== */}
          {abaAtiva === 'vendas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Vendas, Metas & Margens por Categoria
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Desempenho financeiro e atingimento de metas do período
                  </p>
                </div>
              </div>

              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Departamento</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Venda Realizada</th>
                      <th className="p-3">Meta Prevista</th>
                      <th className="p-3">Atingimento %</th>
                      <th className="p-3">% Participação</th>
                      <th className="p-3">Margem Bruta %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {categorias.map((c) => {
                      const atingimento = c.atingimento_meta_perc || 100
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/80">
                          <td className="p-3 font-semibold text-[#1F2937]">{c.departamento}</td>
                          <td className="p-3 font-medium text-[#4B5563]">{c.categoria}</td>
                          <td className="p-3 font-bold text-[#0F766E]">
                            {formatCurrency(c.venda_valor || 0)}
                          </td>
                          <td className="p-3 text-[#6B7280]">
                            {formatCurrency(c.meta_venda_valor || 0)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                atingimento >= 100
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {atingimento.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 font-medium">
                            {(c.participacao_vendas_perc || 0).toFixed(1)}%
                          </td>
                          <td className="p-3 font-bold text-[#0F766E]">
                            {(c.margem_lucro_perc || 0).toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards no Mobile */}
              <div className="md:hidden space-y-3">
                {categorias.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-[#6B7280] uppercase">
                          {c.departamento}
                        </span>
                        <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
                          {c.categoria}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-[#0F766E]">
                        {formatCurrency(c.venda_valor || 0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">
                          Meta / Atingimento:
                        </span>
                        <span className="font-semibold">{c.atingimento_meta_perc || 100}%</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Margem Lucro:</span>
                        <span className="font-bold text-[#0F766E]">
                          {(c.margem_lucro_perc || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              ABA 5: NEGATIVOS E SEM VENDAS (30/60/90+ dias)
             ========================================================== */}
          {abaAtiva === 'negativos_sem_vendas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Itens Negativos & Sem Vendas ({itensNegativosSemVenda.length})
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Identificação de capital parado e divergências físicas de estoque
                  </p>
                </div>
                {/* Seletor rápido de faixa */}
                <div className="flex items-center gap-1.5 p-1 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB] w-fit">
                  <button
                    onClick={() => setFiltroFaixaSemVenda('todas')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                      filtroFaixaSemVenda === 'todas'
                        ? 'bg-white text-[#0F766E] shadow-2xs'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroFaixaSemVenda('30_dias')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                      filtroFaixaSemVenda === '30_dias'
                        ? 'bg-white text-[#0F766E] shadow-2xs'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    30 dias
                  </button>
                  <button
                    onClick={() => setFiltroFaixaSemVenda('60_dias')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                      filtroFaixaSemVenda === '60_dias'
                        ? 'bg-white text-[#0F766E] shadow-2xs'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    60 dias
                  </button>
                  <button
                    onClick={() => setFiltroFaixaSemVenda('acima_90_dias')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                      filtroFaixaSemVenda === 'acima_90_dias'
                        ? 'bg-white text-[#0F766E] shadow-2xs'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    90+ dias
                  </button>
                </div>
              </div>

              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Estoque Físico</th>
                      <th className="p-3">Dias Sem Venda</th>
                      <th className="p-3">Faixa</th>
                      <th className="p-3">Preço</th>
                      <th className="p-3">Ação Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {itensNegativosSemVenda.map((p) => {
                      const isNegativo = (p.estoque_fisico || 0) < 0
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80">
                          <td className="p-3 font-mono text-[#6B7280]">{p.codigo}</td>
                          <td className="p-3 font-semibold text-[#1F2937]">{p.descricao}</td>
                          <td className="p-3 text-[#4B5563]">{p.categoria}</td>
                          <td className="p-3 font-bold">
                            <span
                              className={
                                isNegativo
                                  ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200'
                                  : 'text-[#1F2937]'
                              }
                            >
                              {p.estoque_fisico ?? 0}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-amber-600">
                            {p.dias_sem_venda || 0} dias
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {p.faixa_sem_venda === 'acima_90_dias'
                                ? '90+ Dias'
                                : p.faixa_sem_venda === '60_dias'
                                  ? '60 Dias'
                                  : '30 Dias'}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{formatCurrency(p.preco_venda || 0)}</td>
                          <td className="p-3">
                            <span className="text-xs text-[#0F766E] font-medium">
                              {isNegativo ? 'Ajustar Inventário' : 'Rebaixa / Tabloide'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards no Mobile */}
              <div className="md:hidden space-y-3">
                {itensNegativosSemVenda.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#6B7280]">{p.codigo}</span>
                        <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
                          {p.descricao}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {p.dias_sem_venda || 0} dias sem giro
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Estoque Físico:</span>
                        <span
                          className={
                            (p.estoque_fisico || 0) < 0 ? 'font-bold text-red-600' : 'font-semibold'
                          }
                        >
                          {p.estoque_fisico ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Preço:</span>
                        <span className="font-semibold">{formatCurrency(p.preco_venda || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              ABA 6: CURVAS A / B / C+ (% Valor e % Quantidade)
             ========================================================== */}
          {abaAtiva === 'curvas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Curvas A, B, C e C+ (% em Valor e em Quantidade)
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Concentração de faturamento e volume físico de vendas
                  </p>
                </div>
              </div>

              {/* Cards de Distribuição por Curva */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {(['A', 'B', 'C', 'C+'] as const).map((letra) => {
                  const key = letra === 'C+' ? 'CPlus' : letra
                  const dados = kpis.curvas[key]
                  return (
                    <div
                      key={letra}
                      className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                          Curva {letra}
                        </span>
                        <span className="text-xs text-[#6B7280] font-semibold">
                          {dados.count} SKUs
                        </span>
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-[#1F2937]">
                          {dados.percValor}%{' '}
                          <span className="text-xs font-normal text-[#6B7280]">do faturamento</span>
                        </div>
                        <div className="text-sm font-semibold text-[#0F766E] mt-0.5">
                          {dados.percQtd}%{' '}
                          <span className="text-xs font-normal text-[#6B7280]">da quantidade</span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Total: {formatCurrency(dados.valor)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tabela dos Produtos com Curva */}
              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Curva</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Venda Valor</th>
                      <th className="p-3">% Share Valor</th>
                      <th className="p-3">Venda Qtd</th>
                      <th className="p-3">Giro (Dias)</th>
                      <th className="p-3">Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {produtosFiltrados.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-teal-50 text-[#0F766E] border border-teal-200">
                            {p.curva || 'C'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#6B7280]">{p.codigo}</td>
                        <td className="p-3 font-semibold text-[#1F2937]">{p.descricao}</td>
                        <td className="p-3 font-bold text-[#0F766E]">
                          {formatCurrency(p.venda_valor_periodo || 0)}
                        </td>
                        <td className="p-3 font-medium">
                          {(p.participacao_valor_perc || 0).toFixed(1)}%
                        </td>
                        <td className="p-3 font-medium">{p.venda_qtd_periodo ?? 0} un</td>
                        <td className="p-3">{p.giro_dias || 0} dias</td>
                        <td className="p-3 font-medium">{p.estoque_fisico ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {produtosFiltrados.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#6B7280]">{p.codigo}</span>
                        <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
                          {p.descricao}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                        Curva {p.curva || 'C'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Venda / Share:</span>
                        <span className="font-semibold text-[#0F766E]">
                          {formatCurrency(p.venda_valor_periodo || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Giro em Dias:</span>
                        <span className="font-semibold">{p.giro_dias || 0} dias</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              ABA 7: CRONOGRAMA DE IMPLANTAÇÃO E LAYOUT
             ========================================================== */}
          {abaAtiva === 'implantacao' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Cronograma de Implantação & Layout ({implantacoes.length})
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Projetos de remodelação, novos planogramas e viradas sazonais
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setNovaImplantacaoModalOpen(true)}
                  className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Projeto / Layout</span>
                </Button>
              </div>

              {implantacoes.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-xs text-[#6B7280]">
                  Nenhum cronograma de implantação cadastrado. Clique no botão acima para adicionar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {implantacoes.map((imp) => (
                    <div
                      key={imp.id}
                      className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                            {imp.tipo.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              imp.status === 'concluido'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : imp.status === 'em_andamento'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {imp.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1F2937] mt-2 leading-snug">
                          {imp.titulo}
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Setor: <b>{imp.departamento_setor}</b>{' '}
                          {imp.fornecedor_parceiro && `• ${imp.fornecedor_parceiro}`}
                        </p>
                        {imp.descricao_escopo && (
                          <p className="text-xs text-[#4B5563] mt-2 bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB]">
                            {imp.descricao_escopo}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                        <span>Prazo: {imp.data_prevista}</span>
                        <span className="font-bold text-[#0F766E]">{imp.progresso_perc ?? 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================
              ABA 8: AÇÕES COMERCIAIS, PRICING E REBAIXAS
             ========================================================== */}
          {abaAtiva === 'acoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    Ações Comerciais, Pricing & Rebaixas ({acoes.length})
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Preços promocionais, queima de estoque e campanhas de tabloide
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setNovaAcaoModalOpen(true)}
                  className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Ação / Rebaixa</span>
                </Button>
              </div>

              {acoes.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-xs text-[#6B7280]">
                  Nenhuma ação comercial ou rebaixa cadastrada. Clique no botão acima para
                  adicionar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {acoes.map((acao) => (
                    <div
                      key={acao.id}
                      className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 capitalize">
                            {acao.tipo.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              acao.status === 'em_vigor'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {acao.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1F2937] mt-2 leading-snug">
                          {acao.titulo}
                        </h3>
                        {acao.produto_descricao && (
                          <p className="text-xs text-[#6B7280] mt-0.5 font-medium">
                            {acao.produto_descricao}
                          </p>
                        )}
                        {(acao.preco_de || acao.preco_por) && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            {acao.preco_de && (
                              <span className="text-[#6B7280] line-through">
                                {formatCurrency(acao.preco_de)}
                              </span>
                            )}
                            {acao.preco_por && (
                              <span className="font-extrabold text-[#0F766E] text-base">
                                {formatCurrency(acao.preco_por)}
                              </span>
                            )}
                            {acao.desconto_perc && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                -{acao.desconto_perc}%
                              </span>
                            )}
                          </div>
                        )}
                        {acao.motivo_rebaixa && (
                          <p className="text-[11px] text-[#6B7280] mt-1">
                            Motivo: <b>{acao.motivo_rebaixa.replace(/_/g, ' ')}</b>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                        <span>Início: {acao.data_inicio}</span>
                        {acao.responsavel_nome && <span>{acao.responsavel_nome}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================
              ABA 9: % VENDAS E QUEBRAS POR CATEGORIA
             ========================================================== */}
          {abaAtiva === 'quebras' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    % Vendas e Quebras por Categoria e Departamento
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Impacto percentual de perdas e quebras sobre o faturamento do setor
                  </p>
                </div>
              </div>

              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563]">
                    <tr>
                      <th className="p-3">Departamento</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Vendas (R$)</th>
                      <th className="p-3">% Share Vendas</th>
                      <th className="p-3">Quebra Estimada (R$)</th>
                      <th className="p-3">% Quebra s/ Venda</th>
                      <th className="p-3">Taxa Ruptura %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {categorias.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-semibold text-[#1F2937]">{c.departamento}</td>
                        <td className="p-3 text-[#4B5563]">{c.categoria}</td>
                        <td className="p-3 font-bold text-[#0F766E]">
                          {formatCurrency(c.venda_valor || 0)}
                        </td>
                        <td className="p-3 font-medium">
                          {(c.participacao_vendas_perc || 0).toFixed(1)}%
                        </td>
                        <td className="p-3 font-bold text-red-600">
                          {formatCurrency(c.quebra_valor || 0)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (c.quebra_perc_sobre_venda || 0) > 2
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {(c.quebra_perc_sobre_venda || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          {(c.taxa_ruptura_perc || 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {categorias.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-[#6B7280] uppercase">
                          {c.departamento}
                        </span>
                        <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
                          {c.categoria}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-red-600">
                        Quebra: {(c.quebra_perc_sobre_venda || 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Vendas:</span>
                        <span className="font-semibold text-[#0F766E]">
                          {formatCurrency(c.venda_valor || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[10px]">Perda Estimada:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(c.quebra_valor || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modais de Suporte */}
      <ImportarComercialModal
        open={importarModalOpen}
        onOpenChange={setImportarModalOpen}
        lojas={lojas}
        lojaSelecionada={lojaId}
        competenciaAtual={competencia}
        onImportadoSucesso={carregarDados}
      />

      <NovaAcaoComercialModal
        open={novaAcaoModalOpen}
        onOpenChange={setNovaAcaoModalOpen}
        lojas={lojas}
        lojaSelecionada={lojaId}
        onCriadoSucesso={carregarDados}
      />

      <NovaImplantacaoModal
        open={novaImplantacaoModalOpen}
        onOpenChange={setNovaImplantacaoModalOpen}
        lojas={lojas}
        lojaSelecionada={lojaId}
        onCriadoSucesso={carregarDados}
      />
    </div>
  )
}
