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
  Download,
  UploadCloud,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  Handshake,
  Camera,
  Eye,
  Check,
  AlertCircle,
  ChevronDown,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreSelector } from '@/components/StoreSelector'
import { useStore } from '@/context/StoreContext'
import { comercialService } from '@/services/comercial'
import { ImportarComercialModal } from '@/components/ImportarComercialModal'
import { NovaAcaoComercialModal } from '@/components/NovaAcaoComercialModal'
import { NovaImplantacaoModal } from '@/components/NovaImplantacaoModal'
import { RegistrarEvidenciaImplantacaoModal } from '@/components/RegistrarEvidenciaImplantacaoModal'
import { NovaNegociacaoModal } from '@/components/NovaNegociacaoModal'
import { NovoMarcoNegociacaoModal } from '@/components/NovoMarcoNegociacaoModal'
import { RegistrarEvidenciaMarcoModal } from '@/components/RegistrarEvidenciaMarcoModal'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { AbastecimentoMatchSecao } from '@/components/AbastecimentoMatchSecao'
import { fornecedoresService } from '@/services/fornecedores'
import { isPerfilGerente, isPerfilRede, isGestorGeralUser } from '@/lib/perfil-utils'
import { useAuth } from '@/context/AuthContext'
import type {
  ComercialProduto,
  ComercialCategoria,
  ComercialAcao,
  ComercialImplantacao,
  ComercialNegociacao,
  ComercialNegociacaoMarco,
  Fornecedor,
} from '@/types'

export type AbaComercial =
  | 'rupturas'
  | 'sortimento'
  | 'vendas'
  | 'negativos_sem_vendas'
  | 'curvas'
  | 'quebras'
  | 'acoes'
  | 'implantacao'
  | 'negociacoes'

export type SecaoComercialId = AbaComercial

export default function ComercialPage() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojas } = useStore()

  // Seletor principal do Comercial: Gestão Comercial x Abastecimento & Match
  // Mantém menu enxuto e sem poluição, perfeito para mobile
  const [visaoComercial, setVisaoComercial] = useState<'match' | 'gestao'>('match')

  // Lista de fornecedores para o Match
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  // Identificação de perfis
  const isGerente = isPerfilGerente(user)
  const isRede = isPerfilRede(user)
  const isDfarias = isGestorGeralUser(user)
  const isRedeOuAdmin = isRede || isDfarias || Boolean(user?.is_admin)

  // Estado dos acordeões (flags) da gestão comercial
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rupturas: true,
  })

  // Filtros
  const [competencia, setCompetencia] = useState<string>(new Date().toISOString().slice(0, 7))
  const [busca, setBusca] = useState('')
  const [filtroCurva, setFiltroCurva] = useState('todas')
  const [filtroFaixaSemVenda, setFiltroFaixaSemVenda] = useState('todas')
  const [filtroDepto, setFiltroDepto] = useState('todos')
  const [filtroCategoriaImplantacao, setFiltroCategoriaImplantacao] = useState('todas')
  const [filtroSazonalidadeNegociacao, setFiltroSazonalidadeNegociacao] = useState('todas')
  const [filtroStatusNegociacao, setFiltroStatusNegociacao] = useState('todos')

  // Dados do PocketBase
  const [produtos, setProdutos] = useState<ComercialProduto[]>([])
  const [categorias, setCategorias] = useState<ComercialCategoria[]>([])
  const [acoes, setAcoes] = useState<ComercialAcao[]>([])
  const [implantacoes, setImplantacoes] = useState<ComercialImplantacao[]>([])
  const [negociacoes, setNegociacoes] = useState<ComercialNegociacao[]>([])
  const [marcosPorNegociacao, setMarcosPorNegociacao] = useState<
    Record<string, ComercialNegociacaoMarco[]>
  >({})
  const [loading, setLoading] = useState(true)

  // Modais de Criação & Edição
  const [importarModalOpen, setImportarModalOpen] = useState(false)
  const [novaAcaoModalOpen, setNovaAcaoModalOpen] = useState(false)
  const [novaImplantacaoModalOpen, setNovaImplantacaoModalOpen] = useState(false)
  const [evidenciaImplantacaoModal, setEvidenciaImplantacaoModal] = useState<{
    open: boolean
    implantacao: ComercialImplantacao | null
  }>({ open: false, implantacao: null })

  // Modais de Negociações & Marcos
  const [novaNegociacaoModalOpen, setNovaNegociacaoModalOpen] = useState(false)
  const [negociacaoParaEditar, setNegociacaoParaEditar] = useState<ComercialNegociacao | null>(null)
  const [novoMarcoModal, setNovoMarcoModal] = useState<{
    open: boolean
    negociacao: ComercialNegociacao | null
  }>({ open: false, negociacao: null })
  const [evidenciaMarcoModal, setEvidenciaMarcoModal] = useState<{
    open: boolean
    marco: ComercialNegociacaoMarco | null
  }>({ open: false, marco: null })

  // Visualizador Seguro de Foto
  const [fotoVisualizador, setFotoVisualizador] = useState<{
    open: boolean
    url: string
    title: string
  }>({ open: false, url: '', title: '' })

  const lojaId = lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true)
    try {
      const [prodsData, catsData, acoesData, impData, negsData] = await Promise.all([
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
        comercialService.listarNegociacoes({
          lojaId: lojaId || undefined,
        }),
      ])

      setProdutos(prodsData)
      setCategorias(catsData)
      setAcoes(acoesData)
      setImplantacoes(impData)
      setNegociacoes(negsData)

      // Carregar marcos das negociações existentes
      const marcosMap: Record<string, ComercialNegociacaoMarco[]> = {}
      if (negsData.length > 0) {
        const marcosPromessas = negsData.map(async (n) => {
          const list = await comercialService.listarMarcos(n.id)
          marcosMap[n.id] = list
        })
        await Promise.all(marcosPromessas)
      }
      setMarcosPorNegociacao(marcosMap)
    } catch (err) {
      console.error('Erro ao carregar dados comerciais:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
    fornecedoresService
      .listar()
      .then((data) => setFornecedores(data))
      .catch((err) => console.warn('Falha ao listar fornecedores:', err))
  }, [lojaId, competencia])

  // ==================== CÁLCULOS E RESUMO EXECUTIVO ====================
  const kpis = useMemo(() => {
    const totalProdutos = produtos.length
    const temDadosProdutos = totalProdutos > 0
    const temDadosCategorias = categorias.length > 0

    const produtosRuptura = produtos.filter((p) => p.em_ruptura || (p.estoque_fisico || 0) <= 0)
    const taxaRuptura = totalProdutos > 0 ? (produtosRuptura.length / totalProdutos) * 100 : null

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
      metaTotalVenda > 0
        ? (vendaTotalRealizada / metaTotalVenda) * 100
        : temDadosProdutos || temDadosCategorias
          ? 100
          : 0

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
        : null

    // Margem média geral
    const prodsComMargem = produtos.filter((p) => (p.margem_perc || 0) > 0)
    const margemMediaPerc =
      prodsComMargem.length > 0
        ? (
            prodsComMargem.reduce((acc, p) => acc + (p.margem_perc || 0), 0) / prodsComMargem.length
          ).toFixed(1)
        : null

    // Rebaixas e Ações ativas
    const acoesAtivas = acoes.filter((a) => a.status === 'em_vigor' || a.status === 'planejada')
    const rebaixasAtivas = acoes.filter((a) => a.tipo === 'rebaixa')

    return {
      totalProdutos,
      temDadosProdutos,
      temDadosCategorias,
      produtosRupturaCount: produtosRuptura.length,
      taxaRuptura: taxaRuptura !== null ? taxaRuptura.toFixed(1) : null,
      produtosVirtuaisCount: produtosVirtuais.length,
      produtosNegativosCount: produtosNegativos.length,
      semVendas30Count: semVendas30.length,
      semVendas60Count: semVendas60.length,
      semVendas90Count: semVendas90.length,
      totalSemVendas,
      vendaTotalRealizada,
      metaTotalVenda,
      atingimentoMetaGeral: atingimentoMetaGeral !== null ? atingimentoMetaGeral.toFixed(1) : null,
      quebraTotalValor,
      quebraPercSobreVenda:
        temDadosCategorias || temDadosProdutos ? quebraPercSobreVenda.toFixed(2) : null,
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

  // Controle dos Acordeões
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const expandAll = () => {
    setExpandedSections({
      rupturas: true,
      sortimento: true,
      vendas: true,
      negativos_sem_vendas: true,
      curvas: true,
      quebras: true,
      acoes: true,
      implantacao: true,
      negociacoes: true,
    })
  }

  const collapseAll = () => {
    setExpandedSections({})
  }

  const openAndScrollToSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: true,
    }))
    setTimeout(() => {
      const el = document.getElementById(`secao-comercial-${id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Exportar CSV completo do Comercial
  const handleExportarCsv = () => {
    let csvHeader = ''
    let csvRows: string[] = []
    const filename = `comercial_completo_${competencia}.csv`

    csvHeader =
      'Código;Descrição;Departamento;Categoria;Curva;Estoque Físico;Estoque Virtual;Ruptura;Tipo Ruptura;Preço;Giro (Dias);Margem %;Venda Valor;Venda Qtd;Dias Sem Venda'
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
        (p.venda_valor_periodo || 0).toFixed(2),
        p.venda_qtd_periodo ?? 0,
        p.dias_sem_venda ?? 0,
      ].join(';'),
    )

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
              Módulo Comercial • VivaVarejo
            </span>
            {isGerente && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                Chão de Loja (Gerente)
              </span>
            )}
            {isRedeOuAdmin && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100/70 text-[#0F766E] border border-teal-300">
                Visão de Rede (ADM)
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight mt-1 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#0F766E]" />
            <span>Comercial & Negociações</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            {visaoComercial === 'match'
              ? 'VivaVarejo Match: conexão Loja, CD, Abastecimento e Fornecedor com decisão em cascata.'
              : 'Sortimento, vendas, curvas A/B/C+, margens, layout, rebaixas e sincronização ERP.'}
          </p>
        </div>

        {/* Seletor de Loja & Ações */}
        <div className="flex items-center gap-2 flex-wrap">
          <StoreSelector />

          {visaoComercial === 'gestao' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* SELETOR ENXUTO DE VISÃO: ABASTECIMENTO & MATCH x GESTÃO COMERCIAL */}
      {/* Design sóbrio, 1 toque, limpo no celular (sem menu poluído) */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
        <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-[#E5E7EB] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setVisaoComercial('match')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              visaoComercial === 'match'
                ? 'bg-white text-[#0F766E] shadow-2xs font-bold border border-teal-200'
                : 'text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
            <span>Abastecimento & Match</span>
          </button>

          <button
            type="button"
            onClick={() => setVisaoComercial('gestao')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              visaoComercial === 'gestao'
                ? 'bg-white text-[#0F766E] shadow-2xs font-bold border border-teal-200'
                : 'text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <span>Gestão & Sortimento</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span className="font-semibold text-[#1F2937]">VivaVarejo Match</span>
          <span>• Fluxo em cascata anti-ruptura</span>
        </div>
      </div>

      {/* VISÃO 1: ABASTECIMENTO & MATCH (CONCEITO CENTRAL DO MATCH) */}
      {visaoComercial === 'match' && (
        <AbastecimentoMatchSecao
          lojas={lojas}
          lojaSelecionadaId={lojaId}
          fornecedores={fornecedores}
          user={user}
          isGerente={isGerente}
          isRedeOuAdmin={isRedeOuAdmin}
          redeId={user?.cliente}
        />
      )}

      {/* VISÃO 2: GESTÃO & SORTIMENTO (ESTRUTURA ORIGINAL PRESERVADA 100%) */}
      {visaoComercial === 'gestao' && (
        <div className="space-y-6">
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

          {/* Barra de Busca e Filtros Rápidos dos SKUs */}
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

          {/* Conteúdo da Página Comercial */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* ==========================================================
              RESUMO EXECUTIVO (Topo Permanente - Requisito 2)
              Renderiza sempre, com valores '—' ou '0' quando sem dados
             ========================================================== */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                      Resumo Executivo Comercial
                    </h2>
                  </div>
                  <span className="text-xs text-[#6B7280]">
                    {kpis.totalProdutos > 0 ? `${kpis.totalProdutos} SKUs` : 'Sem SKUs'} •
                    Competência {competencia}
                  </span>
                </div>

                {/* Linha 1 de Indicadores Principais */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Ruptura % */}
                  <div
                    onClick={() => openAndScrollToSection('rupturas')}
                    className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                    title="Toque para abrir a seção Rupturas & Virtual"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Ruptura Global
                      </span>
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          kpis.taxaRuptura !== null && Number(kpis.taxaRuptura) > 5
                            ? 'text-amber-500'
                            : 'text-emerald-600'
                        }`}
                      />
                    </div>
                    <div className="mt-2.5">
                      <div
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                          kpis.taxaRuptura === null
                            ? 'text-[#9CA3AF]'
                            : Number(kpis.taxaRuptura) > 5
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                        }`}
                      >
                        {kpis.taxaRuptura !== null ? `${kpis.taxaRuptura}%` : '—'}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                        <span>
                          {kpis.temDadosProdutos
                            ? `${kpis.produtosRupturaCount} itens sem estoque`
                            : 'Sem dados de ruptura'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#0F766E] group-hover:underline">
                          Ver seção ↓
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 2. Sem Vendas (30/60/90+) */}
                  <div
                    onClick={() => openAndScrollToSection('negativos_sem_vendas')}
                    className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                    title="Toque para abrir a seção Negativos & Sem Vendas"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Sem Venda 30/60/90+
                      </span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                        {kpis.temDadosProdutos ? kpis.totalSemVendas : '—'}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                        <span>
                          {kpis.temDadosProdutos
                            ? `30d: ${kpis.semVendas30Count} | 60d: ${kpis.semVendas60Count} | 90d+: ${kpis.semVendas90Count}`
                            : 'Sem dados de giro'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#0F766E] group-hover:underline">
                          Ver seção ↓
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 3. Vendas Realizadas vs Metas */}
                  <div
                    onClick={() => openAndScrollToSection('vendas')}
                    className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                    title="Toque para abrir a seção Vendas & Margens"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Vendas do Período
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl sm:text-2xl font-extrabold text-[#0F766E] tracking-tight truncate">
                        {kpis.temDadosCategorias || kpis.temDadosProdutos
                          ? formatCurrency(kpis.vendaTotalRealizada)
                          : '—'}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                        <span>
                          {kpis.atingimentoMetaGeral !== null
                            ? `Meta: ${kpis.atingimentoMetaGeral}% atingida`
                            : 'Sem meta cadastrada'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#0F766E] group-hover:underline">
                          Ver seção ↓
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 4. Curvas A/B/C (% Valor) */}
                  <div
                    onClick={() => openAndScrollToSection('curvas')}
                    className="cursor-pointer bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-4 shadow-2xs transition-all hover:shadow-xs group"
                    title="Toque para abrir a seção Curvas A/B/C+"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Curvas (% Valor)
                      </span>
                      <Layers className="w-4 h-4 text-[#0F766E]" />
                    </div>
                    <div className="mt-2.5">
                      {kpis.temDadosProdutos ? (
                        <div className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                          <span className="text-[#0F766E]">A: {kpis.curvas.A.percValor}%</span>
                          <span className="text-blue-600">B: {kpis.curvas.B.percValor}%</span>
                          <span className="text-gray-500">C: {kpis.curvas.C.percValor}%</span>
                        </div>
                      ) : (
                        <div className="text-2xl sm:text-3xl font-extrabold text-[#9CA3AF] tracking-tight">
                          —
                        </div>
                      )}
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                        <span>
                          {kpis.temDadosProdutos
                            ? `${kpis.totalProdutos} SKUs cadastrados`
                            : 'Sem SKUs na competência'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#0F766E] group-hover:underline">
                          Ver seção ↓
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Linha 2 de Indicadores: Negativos, Rebaixas, Margem e Giro */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div
                    onClick={() => openAndScrollToSection('negativos_sem_vendas')}
                    className="bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-3.5 shadow-2xs cursor-pointer transition-colors"
                    title="Ver itens negativos e sem vendas"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Estoque Negativo
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-red-600 mt-1">
                      {kpis.temDadosProdutos ? `${kpis.produtosNegativosCount} itens` : '0 itens'}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Divergência física/virtual grave
                    </p>
                  </div>

                  <div
                    onClick={() => openAndScrollToSection('vendas')}
                    className="bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-3.5 shadow-2xs cursor-pointer transition-colors"
                    title="Ver vendas e margens"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Margem Média
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-[#0F766E] mt-1">
                      {kpis.margemMediaPerc !== null ? `${kpis.margemMediaPerc}%` : '—'}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Média ponderada de rentabilidade
                    </p>
                  </div>

                  <div
                    onClick={() => openAndScrollToSection('sortimento')}
                    className="bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-3.5 shadow-2xs cursor-pointer transition-colors"
                    title="Ver sortimento e giro"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Giro Médio (Cobertura)
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-[#1F2937] mt-1">
                      {kpis.giroMedioDias !== null ? `${kpis.giroMedioDias} dias` : '—'}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Velocidade de renovação</p>
                  </div>

                  <div
                    onClick={() => openAndScrollToSection('quebras')}
                    className="bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-xl p-3.5 shadow-2xs cursor-pointer transition-colors"
                    title="Ver % de quebras por categoria"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Quebras Totais
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-red-700 mt-1">
                      {kpis.quebraPercSobreVenda !== null
                        ? `${kpis.quebraPercSobreVenda}% (${formatCurrency(kpis.quebraTotalValor)})`
                        : '—'}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">% Sobre a venda total</p>
                  </div>
                </div>
              </div>

              {/* Controles Globais dos Acordeões (flags) - padrão Agenda Minha Equipe */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Bookmark className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>
                    Toque em qualquer seção (flag) para expandir ou recolher seus dados e tabelas
                  </span>
                </span>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="hover:text-[#0F766E] font-semibold transition-colors px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Abrir todos
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="hover:text-[#0F766E] font-semibold transition-colors px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Recolher todos
                  </button>
                </div>
              </div>

              {/* ==========================================================
              SEÇÕES SEQUENCIAIS EM ACORDEÕES (FLAGS)
              Ordem estrita (Requisito 3):
              1. Rupturas & Virtual
              2. Sortimento & Mix
              3. Vendas & Margens
              4. Negativos & Sem Vendas
              5. Curvas A/B/C+
              6. % Quebras por Categoria
              7. Ações Comerciais, Pricing & Rebaixas
              8. Layout & Cronograma de Implantação
              9. Negociações & Sazonalidade
             ========================================================== */}
              <div className="space-y-4">
                {/* --------------------------------------------------------
                SEÇÃO 1: RUPTURAS & VIRTUAL
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-rupturas"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.rupturas
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('rupturas')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.rupturas}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Rupturas & Estoque Virtual
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Itens sem estoque físico, rupturas virtuais e faltas na gôndola
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {kpis.produtosRupturaCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {kpis.produtosRupturaCount} em ruptura
                        </span>
                      )}
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        Taxa: {kpis.taxaRuptura !== null ? `${kpis.taxaRuptura}%` : '—'}
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.rupturas
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.rupturas ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.rupturas && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            Itens em Ruptura & Estoque Virtual ({itensRuptura.length})
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Prioridade de reposição para itens Curva A e B
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setImportarModalOpen(true)}
                          className="text-xs rounded-xl gap-1.5 self-start sm:self-auto hover:border-[#0F766E] hover:text-[#0F766E]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Importar Planilha</span>
                        </Button>
                      </div>

                      {itensRuptura.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem dados de ruptura nesta competência — importe sua planilha.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setImportarModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Importar Planilha</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Tabela no Desktop / Cards no Mobile */}
                          <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                            {' '}
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
                                    <td className="p-3 font-semibold text-[#1F2937]">
                                      {p.descricao}
                                    </td>
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
                                    <td className="p-3 font-medium text-amber-600">
                                      {p.estoque_virtual ?? 0}
                                    </td>
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
                                    <span className="text-[10px] font-mono text-[#6B7280]">
                                      {p.codigo}
                                    </span>
                                    <h4 className="text-xs font-bold text-[#1F2937] leading-tight">
                                      {p.descricao}
                                    </h4>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                                    {p.curva || 'C'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Físico / Virtual:
                                    </span>
                                    <span className="font-bold text-red-600">
                                      {p.estoque_fisico ?? 0}
                                    </span>{' '}
                                    / {p.estoque_virtual ?? 0}
                                  </div>
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Tipo Ruptura:
                                    </span>
                                    <span className="font-semibold text-red-700 capitalize">
                                      {p.tipo_ruptura || 'Física'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* --------------------------------------------------------
                SEÇÃO 2: SORTIMENTO & MIX
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-sortimento"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.sortimento
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('sortimento')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.sortimento}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Sortimento & Mix
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Mix ativo por departamento, preços, margens e cobertura de estoque em dias
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        {produtosFiltrados.length} SKUs
                      </span>
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
                        Giro médio: {kpis.giroMedioDias !== null ? `${kpis.giroMedioDias}d` : '—'}
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.sortimento
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.sortimento ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.sortimento && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            Mix de Sortimento Ativo ({produtosFiltrados.length} itens)
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Cobertura de estoque e giro em dias por produto
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setImportarModalOpen(true)}
                          className="text-xs rounded-xl gap-1.5 self-start sm:self-auto hover:border-[#0F766E] hover:text-[#0F766E]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Importar Planilha</span>
                        </Button>
                      </div>

                      {produtosFiltrados.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem dados de sortimento e mix nesta competência — importe sua planilha.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setImportarModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Importar Planilha</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                            {' '}
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
                                    <td className="p-3 font-semibold text-[#1F2937]">
                                      {p.descricao}
                                    </td>
                                    <td className="p-3 text-[#4B5563]">{p.departamento}</td>
                                    <td className="p-3 text-[#4B5563]">{p.categoria}</td>
                                    <td className="p-3 font-medium">
                                      {formatCurrency(p.preco_venda || 0)}
                                    </td>
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
                                    <span className="text-[10px] font-mono text-[#6B7280]">
                                      {p.codigo}
                                    </span>
                                    <h4 className="text-xs font-bold text-[#1F2937] leading-tight">
                                      {p.descricao}
                                    </h4>
                                  </div>
                                  <span className="text-xs font-bold text-[#0F766E]">
                                    {(p.margem_perc || 0).toFixed(1)}% margem
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Preço / Estoque:
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(p.preco_venda || 0)}
                                    </span>{' '}
                                    ({p.estoque_fisico ?? 0} un)
                                  </div>
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Giro em Dias:
                                    </span>
                                    <span className="font-semibold">{p.giro_dias || 0} dias</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* --------------------------------------------------------
                SEÇÃO 3: VENDAS & MARGENS
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-vendas"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.vendas
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('vendas')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.vendas}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Vendas & Margens
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Vendas realizadas, metas orçadas, atingimento e margem bruta por categoria
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                        {kpis.temDadosCategorias || kpis.temDadosProdutos
                          ? formatCurrency(kpis.vendaTotalRealizada)
                          : '—'}
                      </span>
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        {kpis.atingimentoMetaGeral !== null
                          ? `${kpis.atingimentoMetaGeral}% da meta`
                          : 'Sem meta'}
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.vendas
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.vendas ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.vendas && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            Vendas, Metas & Margens por Categoria
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Desempenho financeiro e atingimento de metas do período
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setImportarModalOpen(true)}
                          className="text-xs rounded-xl gap-1.5 self-start sm:self-auto hover:border-[#0F766E] hover:text-[#0F766E]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Importar Planilha</span>
                        </Button>
                      </div>

                      {categorias.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem dados de vendas e margens nesta competência — importe sua planilha.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setImportarModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Importar Planilha</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                            {' '}
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
                                      <td className="p-3 font-semibold text-[#1F2937]">
                                        {c.departamento}
                                      </td>
                                      <td className="p-3 font-medium text-[#4B5563]">
                                        {c.categoria}
                                      </td>
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
                                    <h4 className="text-xs font-bold text-[#1F2937] leading-tight">
                                      {c.categoria}
                                    </h4>
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
                                    <span className="font-semibold">
                                      {c.atingimento_meta_perc || 100}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Margem Lucro:
                                    </span>
                                    <span className="font-bold text-[#0F766E]">
                                      {(c.margem_lucro_perc || 0).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* --------------------------------------------------------
                SEÇÃO 4: NEGATIVOS & SEM VENDAS (30/60/90+ dias)
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-negativos_sem_vendas"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.negativos_sem_vendas
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('negativos_sem_vendas')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.negativos_sem_vendas}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                        <ArrowDownRight className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Negativos & Sem Vendas
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Estoque negativo e produtos sem giro há 30, 60 ou mais de 90 dias
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {kpis.totalSemVendas > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {kpis.totalSemVendas} sem giro
                        </span>
                      )}
                      {kpis.produtosNegativosCount > 0 && (
                        <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          {kpis.produtosNegativosCount} negativos
                        </span>
                      )}
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.negativos_sem_vendas
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={
                          expandedSections.negativos_sem_vendas
                            ? 'Recolher seção'
                            : 'Expandir seção'
                        }
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.negativos_sem_vendas && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            Itens Negativos & Sem Vendas ({itensNegativosSemVenda.length})
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Identificação de capital parado e divergências físicas de estoque
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setImportarModalOpen(true)}
                            className="text-xs rounded-xl gap-1.5 hover:border-[#0F766E] hover:text-[#0F766E]"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-[#0F766E]" />
                            <span>Importar Planilha</span>
                          </Button>
                          {/* Seletor rápido de faixa */}
                          <div className="flex items-center gap-1.5 p-1 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB] w-fit">
                            <button
                              type="button"
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
                              type="button"
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
                              type="button"
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
                              type="button"
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
                      </div>

                      {itensNegativosSemVenda.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem dados de negativos ou itens sem vendas nesta competência — importe
                            sua planilha.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setImportarModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Importar Planilha</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                            {' '}
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
                                      <td className="p-3 font-semibold text-[#1F2937]">
                                        {p.descricao}
                                      </td>
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
                                      <td className="p-3 font-medium">
                                        {formatCurrency(p.preco_venda || 0)}
                                      </td>
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
                                    <span className="text-[10px] font-mono text-[#6B7280]">
                                      {p.codigo}
                                    </span>
                                    <h4 className="text-xs font-bold text-[#1F2937] leading-tight">
                                      {p.descricao}
                                    </h4>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    {p.dias_sem_venda || 0} dias sem giro
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Estoque Físico:
                                    </span>
                                    <span
                                      className={
                                        (p.estoque_fisico || 0) < 0
                                          ? 'font-bold text-red-600'
                                          : 'font-semibold'
                                      }
                                    >
                                      {p.estoque_fisico ?? 0}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">Preço:</span>
                                    <span className="font-semibold">
                                      {formatCurrency(p.preco_venda || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* --------------------------------------------------------
                SEÇÃO 5: CURVAS A / B / C+
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-curvas"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.curvas
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('curvas')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.curvas}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Curvas A / B / C+
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Distribuição de SKUs e concentração por faturamento (R$) e volume físico
                          (Qtd)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                        Curva A: {kpis.temDadosProdutos ? `${kpis.curvas.A.percValor}% R$` : '—'}
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.curvas
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.curvas ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.curvas && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            Curvas A, B, C e C+ (% em Valor e em Quantidade)
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Concentração de faturamento e volume físico de vendas
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setImportarModalOpen(true)}
                          className="text-xs rounded-xl gap-1.5 self-start sm:self-auto hover:border-[#0F766E] hover:text-[#0F766E]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Importar Planilha</span>
                        </Button>
                      </div>

                      {produtosFiltrados.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem dados de curvas A/B/C+ nesta competência — importe sua planilha.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setImportarModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Importar Planilha</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Cards de Distribuição por Curva */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {' '}
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
                                      <span className="text-xs font-normal text-[#6B7280]">
                                        do faturamento
                                      </span>
                                    </div>
                                    <div className="text-sm font-semibold text-[#0F766E] mt-0.5">
                                      {dados.percQtd}%{' '}
                                      <span className="text-xs font-normal text-[#6B7280]">
                                        da quantidade
                                      </span>
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
                                    <td className="p-3 font-semibold text-[#1F2937]">
                                      {p.descricao}
                                    </td>
                                    <td className="p-3 font-bold text-[#0F766E]">
                                      {formatCurrency(p.venda_valor_periodo || 0)}
                                    </td>
                                    <td className="p-3 font-medium">
                                      {(p.participacao_valor_perc || 0).toFixed(1)}%
                                    </td>
                                    <td className="p-3 font-medium">
                                      {p.venda_qtd_periodo ?? 0} un
                                    </td>
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
                                    <span className="text-[10px] font-mono text-[#6B7280]">
                                      {p.codigo}
                                    </span>
                                    <h4 className="text-xs font-bold text-[#1F2937] leading-tight">
                                      {p.descricao}
                                    </h4>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                                    Curva {p.curva || 'C'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Venda / Share:
                                    </span>
                                    <span className="font-semibold text-[#0F766E]">
                                      {formatCurrency(p.venda_valor_periodo || 0)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Giro em Dias:
                                    </span>
                                    <span className="font-semibold">{p.giro_dias || 0} dias</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* --------------------------------------------------------
                SEÇÃO 6: % QUEBRAS POR CATEGORIA
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-quebras"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.quebras
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('quebras')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.quebras}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                        <PieChart className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          % Quebras por Categoria
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Impacto de avarias, vencidos e perdas sobre as vendas do período
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        {kpis.quebraPercSobreVenda !== null
                          ? `${kpis.quebraPercSobreVenda}% (${formatCurrency(kpis.quebraTotalValor)})`
                          : '—'}
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.quebras
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.quebras ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.quebras && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            % Vendas e Quebras por Categoria e Departamento
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Impacto percentual de perdas e quebras sobre o faturamento do setor
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setImportarModalOpen(true)}
                          className="text-xs rounded-xl gap-1.5 self-start sm:self-auto hover:border-[#0F766E] hover:text-[#0F766E]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Importar Planilha</span>
                        </Button>
                      </div>

                      {categorias.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem dados de quebras por categoria nesta competência — importe sua
                            planilha.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setImportarModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Importar Planilha</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-x-auto">
                            {' '}
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
                                    <td className="p-3 font-semibold text-[#1F2937]">
                                      {c.departamento}
                                    </td>
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
                                    <h4 className="text-xs font-bold text-[#1F2937] leading-tight">
                                      {c.categoria}
                                    </h4>
                                  </div>
                                  <span className="text-xs font-bold text-red-600">
                                    Quebra: {(c.quebra_perc_sobre_venda || 0).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F3F4F6]">
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Vendas:
                                    </span>
                                    <span className="font-semibold text-[#0F766E]">
                                      {formatCurrency(c.venda_valor || 0)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#6B7280] block text-[10px]">
                                      Perda Estimada:
                                    </span>
                                    <span className="font-semibold text-red-600">
                                      {formatCurrency(c.quebra_valor || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* --------------------------------------------------------
                SEÇÃO 7: AÇÕES COMERCIAIS, PRICING & REBAIXAS
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-acoes"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.acoes
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('acoes')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.acoes}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Ações Comerciais, Pricing & Rebaixas
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Preços promocionais, queima de estoque, De/Por e campanhas de tabloide
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        {acoes.length} ações
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.acoes
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.acoes ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.acoes && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937]">
                            Ações Comerciais, Pricing & Rebaixas ({acoes.length})
                          </h4>
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
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem ações comerciais ou rebaixas nesta competência — cadastre uma nova
                            ação.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setNovaAcaoModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nova Ação</span>
                          </Button>
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
                                <h4 className="text-sm font-bold text-[#1F2937] mt-2 leading-snug">
                                  {acao.titulo}
                                </h4>
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
                </div>

                {/* --------------------------------------------------------
                SEÇÃO 8: LAYOUT & CRONOGRAMA DE IMPLANTAÇÃO
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-implantacao"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.implantacao
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('implantacao')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.implantacao}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Layout & Cronograma de Implantação
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Agenda de reformas, novas gôndolas e evidências fotográficas por categoria
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        {implantacoes.length} etapas
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.implantacao
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.implantacao ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.implantacao && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#0F766E]" />
                            <span>
                              Agenda de Implantação, Layout & Evidências ({implantacoes.length})
                            </span>
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Agenda de execução por categoria, acompanhamento de prazos e comprovação
                            fotográfica
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setNovaImplantacaoModalOpen(true)}
                          className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs self-start sm:self-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Novo Projeto / Etapa</span>
                        </Button>
                      </div>

                      {/* Filtro por Categoria da Gôndola e Status do Prazo */}
                      <div className="flex items-center gap-2 flex-wrap text-xs bg-white border border-[#E5E7EB] p-2.5 rounded-xl shadow-2xs">
                        <span className="text-[#6B7280] font-semibold text-[11px] uppercase tracking-wider">
                          Filtrar Categoria:
                        </span>
                        <select
                          value={filtroCategoriaImplantacao}
                          onChange={(e) => setFiltroCategoriaImplantacao(e.target.value)}
                          className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1 text-[#1F2937] outline-none focus:border-[#0F766E]"
                        >
                          <option value="todas">Todas as Categorias</option>
                          {Array.from(
                            new Set(implantacoes.map((i) => i.categoria).filter(Boolean)),
                          ).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        <div className="ml-auto flex items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {implantacoes.filter((i) => i.status === 'concluido').length}{' '}
                              Concluídas
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>
                              {
                                implantacoes.filter((i) => {
                                  const hoje = new Date().toISOString().slice(0, 10)
                                  return i.status !== 'concluido' && i.data_prevista < hoje
                                }).length
                              }{' '}
                              Atrasadas
                            </span>
                          </span>
                        </div>
                      </div>

                      {implantacoes.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem cronograma de implantação nesta competência — cadastre um novo
                            projeto.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setNovaImplantacaoModalOpen(true)}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Novo Projeto</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {implantacoes
                            .filter((imp) => {
                              if (
                                filtroCategoriaImplantacao !== 'todas' &&
                                imp.categoria !== filtroCategoriaImplantacao
                              ) {
                                return false
                              }
                              return true
                            })
                            .map((imp) => {
                              const hoje = new Date().toISOString().slice(0, 10)
                              const estaAtrasado =
                                imp.status !== 'concluido' && imp.data_prevista < hoje
                              const venceHoje =
                                imp.status !== 'concluido' && imp.data_prevista === hoje
                              const fotoUrl = comercialService.getImplantacaoFotoUrl(imp)

                              return (
                                <div
                                  key={imp.id}
                                  className={`bg-white border rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between transition-all ${
                                    estaAtrasado
                                      ? 'border-amber-300 ring-1 ring-amber-200'
                                      : venceHoje
                                        ? 'border-teal-400 ring-1 ring-teal-200'
                                        : 'border-[#E5E7EB]'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                                        {imp.tipo.replace(/_/g, ' ')}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {estaAtrasado && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                            Atrasado
                                          </span>
                                        )}
                                        {venceHoje && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                            Vence Hoje
                                          </span>
                                        )}
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
                                    </div>

                                    <h4 className="text-sm font-bold text-[#1F2937] mt-2 leading-snug">
                                      {imp.titulo}
                                    </h4>

                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#4B5563]">
                                      {imp.categoria && (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded">
                                          Categoria: {imp.categoria}
                                        </span>
                                      )}
                                      {imp.etapa && (
                                        <span className="inline-flex items-center gap-1 text-[#4B5563] bg-gray-100 px-2 py-0.5 rounded">
                                          Etapa: {imp.etapa}
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-xs text-[#6B7280] mt-1.5">
                                      Setor: <b>{imp.departamento_setor}</b>{' '}
                                      {imp.fornecedor_parceiro &&
                                        `• Parceiro: ${imp.fornecedor_parceiro}`}
                                    </p>

                                    {imp.descricao_escopo && (
                                      <p className="text-xs text-[#4B5563] mt-2 bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB] line-clamp-3">
                                        {imp.descricao_escopo}
                                      </p>
                                    )}

                                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F6]">
                                      <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="font-semibold text-[#374151] flex items-center gap-1">
                                          <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                                          <span>Evidência da Gôndola / Layout:</span>
                                        </span>
                                        {imp.concluido_sem_evidencia && (
                                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded">
                                            Concluído sem foto
                                          </span>
                                        )}
                                      </div>

                                      {fotoUrl ? (
                                        <div className="space-y-1.5">
                                          <div
                                            onClick={() =>
                                              setFotoVisualizador({
                                                open: true,
                                                url: fotoUrl,
                                                title: `${imp.titulo} — Categoria: ${imp.categoria || 'Layout'}`,
                                              })
                                            }
                                            className="cursor-pointer group relative rounded-lg overflow-hidden border border-[#E5E7EB] bg-gray-50 aspect-video flex items-center justify-center hover:opacity-95 transition-opacity"
                                          >
                                            <img
                                              src={fotoUrl}
                                              alt={`Evidência ${imp.titulo}`}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                              <Eye className="w-4 h-4" />
                                              <span>Ampliar Foto</span>
                                            </div>
                                          </div>
                                          <div className="text-[11px] text-[#6B7280] flex items-center justify-between">
                                            <span>
                                              Por: <b>{imp.foto_executado_por || 'Colaborador'}</b>
                                            </span>
                                            <span>{imp.foto_executado_em || ''}</span>
                                          </div>
                                          {imp.observacao_execucao && (
                                            <p className="text-[11px] text-[#4B5563] italic bg-teal-50/50 p-1.5 rounded border border-teal-100/50">
                                              &ldquo;{imp.observacao_execucao}&rdquo;
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="p-2.5 rounded-lg border border-dashed border-[#D1D5DB] text-center bg-gray-50/50">
                                          <p className="text-[11px] text-[#6B7280]">
                                            Nenhuma foto de comprovação anexada ainda.
                                          </p>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              setEvidenciaImplantacaoModal({
                                                open: true,
                                                implantacao: imp,
                                              })
                                            }
                                            className="mt-1.5 text-xs h-7 text-[#0F766E] border-teal-200 hover:bg-teal-50"
                                          >
                                            <Camera className="w-3 h-3 mr-1" />
                                            <span>Registrar Evidência</span>
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                                    <div className="flex flex-col">
                                      <span>
                                        Prazo: <b className="text-[#1F2937]">{imp.data_prevista}</b>
                                      </span>
                                      {imp.responsavel_execucao && (
                                        <span className="text-[11px]">
                                          Resp: {imp.responsavel_execucao}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {imp.status !== 'concluido' && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() =>
                                            setEvidenciaImplantacaoModal({
                                              open: true,
                                              implantacao: imp,
                                            })
                                          }
                                          className="h-7 text-xs bg-[#0F766E] hover:bg-[#115E59] text-white gap-1 px-2.5"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Concluir</span>
                                        </Button>
                                      )}
                                      <span className="font-bold text-[#0F766E] ml-1">
                                        {imp.progresso_perc ?? 0}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* --------------------------------------------------------
                SEÇÃO 9: NEGOCIAÇÕES COM COMPRADOR & SAZONALIDADE
               -------------------------------------------------------- */}
                <div
                  id="secao-comercial-negociacoes"
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-colors ${
                    expandedSections.negociacoes
                      ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection('negociacoes')}
                    className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                    aria-expanded={expandedSections.negociacoes}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F766E] shrink-0 shadow-2xs">
                        <Handshake className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                          Negociações & Sazonalidade
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">
                          Acordos comerciais, sazonalidade, agenda de marcos e evidências
                          fotográficas em loja
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        {negociacoes.length} acordos
                      </span>
                      <div
                        className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                          expandedSections.negociacoes
                            ? 'rotate-180 text-[#0F766E] border-teal-500/40'
                            : ''
                        }`}
                        title={expandedSections.negociacoes ? 'Recolher seção' : 'Expandir seção'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {expandedSections.negociacoes && (
                    <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in-50 duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                            <Handshake className="w-4 h-4 text-[#0F766E]" />
                            <span>
                              Negociações com Comprador & Sazonalidade ({negociacoes.length})
                            </span>
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            Acordos comerciais, sazonalidade, cronograma de marcos e evidências
                            fotográficas na loja
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Button
                            size="sm"
                            onClick={() => {
                              setNegociacaoParaEditar(null)
                              setNovaNegociacaoModalOpen(true)
                            }}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Nova Negociação</span>
                          </Button>
                        </div>
                      </div>

                      {/* Filtros de Sazonalidade e Status */}
                      <div className="flex items-center gap-2 flex-wrap text-xs bg-white border border-[#E5E7EB] p-2.5 rounded-xl shadow-2xs">
                        <span className="text-[#6B7280] font-semibold text-[11px] uppercase tracking-wider">
                          Sazonalidade:
                        </span>
                        <select
                          value={filtroSazonalidadeNegociacao}
                          onChange={(e) => setFiltroSazonalidadeNegociacao(e.target.value)}
                          className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1 text-[#1F2937] outline-none focus:border-[#0F766E]"
                        >
                          <option value="todas">Todas as Campanhas / Sazonalidades</option>
                          {Array.from(
                            new Set(negociacoes.map((n) => n.sazonalidade).filter(Boolean)),
                          ).map((saz) => (
                            <option key={saz} value={saz}>
                              {saz}
                            </option>
                          ))}{' '}
                        </select>

                        <span className="text-[#6B7280] font-semibold text-[11px] uppercase tracking-wider ml-2">
                          Status:
                        </span>
                        <select
                          value={filtroStatusNegociacao}
                          onChange={(e) => setFiltroStatusNegociacao(e.target.value)}
                          className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1 text-[#1F2937] outline-none focus:border-[#0F766E]"
                        >
                          <option value="todos">Todos os Status</option>
                          <option value="planejada">Planejada</option>
                          <option value="aguardando_execucao">Aguardando Execução</option>
                          <option value="em_vigor">Em Vigor</option>
                          <option value="concluida">Concluída</option>
                          <option value="vencida">Vencida</option>
                        </select>

                        <div className="ml-auto flex items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                            <Handshake className="w-3 h-3" />
                            <span>
                              {negociacoes.filter((n) => n.status === 'em_vigor').length} Ativas
                            </span>
                          </span>
                        </div>
                      </div>

                      {negociacoes.length === 0 ? (
                        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <span className="text-[#6B7280] text-center sm:text-left">
                            Sem negociações cadastradas nesta competência — registre um novo acordo.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNegociacaoParaEditar(null)
                              setNovaNegociacaoModalOpen(true)
                            }}
                            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nova Negociação</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {negociacoes
                            .filter((neg) => {
                              if (
                                filtroSazonalidadeNegociacao !== 'todas' &&
                                neg.sazonalidade !== filtroSazonalidadeNegociacao
                              ) {
                                return false
                              }
                              if (
                                filtroStatusNegociacao !== 'todos' &&
                                neg.status !== filtroStatusNegociacao
                              ) {
                                return false
                              }
                              return true
                            })
                            .map((neg) => {
                              const marcos = marcosPorNegociacao[neg.id] || []
                              const marcosConcluidos = marcos.filter(
                                (m) => m.status === 'concluido',
                              ).length
                              const totalMarcos = marcos.length
                              const hoje = new Date().toISOString().slice(0, 10)
                              const marcosAtrasados = marcos.filter(
                                (m) => m.status !== 'concluido' && m.data_limite < hoje,
                              ).length

                              return (
                                <div
                                  key={neg.id}
                                  className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4 transition-all hover:border-[#0F766E]"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#F3F4F6]">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F766E] border border-teal-200 uppercase tracking-wide">
                                          {neg.sazonalidade || 'Sazonal'}
                                        </span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                          {neg.tipo_acordo
                                            ? neg.tipo_acordo.replace(/_/g, ' ')
                                            : 'Acordo'}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            neg.status === 'em_vigor'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : neg.status === 'aguardando_execucao'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : neg.status === 'concluida'
                                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                  : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {neg.status.replace(/_/g, ' ')}
                                        </span>
                                        {marcosAtrasados > 0 && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{marcosAtrasados} marco(s) atrasado(s)</span>
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-base font-bold text-[#1F2937] leading-snug pt-0.5">
                                        {neg.titulo}
                                      </h4>
                                      <p className="text-xs text-[#6B7280]">
                                        Comprador: <b>{neg.comprador_nome || 'Não especificado'}</b>{' '}
                                        • Fornecedor: <b>{neg.fornecedor || 'Indústria'}</b> •
                                        Vigência: <b>{neg.data_inicio}</b> até{' '}
                                        <b>{neg.data_fim || 'Indeterminado'}</b>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setNegociacaoParaEditar(neg)
                                          setNovaNegociacaoModalOpen(true)
                                        }}
                                        className="h-8 text-xs text-[#374151] border-[#D1D5DB]"
                                      >
                                        Editar Acordo
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() =>
                                          setNovoMarcoModal({ open: true, negociacao: neg })
                                        }
                                        className="h-8 text-xs bg-[#0F766E] hover:bg-[#115E59] text-white gap-1"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Adicionar Marco</span>
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] text-xs">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                                        Produto & Espaço Acordado
                                      </span>
                                      <div className="font-semibold text-[#1F2937]">
                                        {neg.produto_descricao || 'Mix geral da negociação'}
                                      </div>
                                      {neg.espaco_gondola_acordado && (
                                        <p className="text-[11px] text-[#0F766E] font-medium">
                                          Espaço: {neg.espaco_gondola_acordado}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                                        Condições de Preço
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {neg.preco_de && (
                                          <span className="text-[#6B7280] line-through text-xs">
                                            {formatCurrency(neg.preco_de)}
                                          </span>
                                        )}
                                        {neg.preco_por && (
                                          <span className="font-bold text-[#0F766E] text-sm">
                                            {formatCurrency(neg.preco_por)}
                                          </span>
                                        )}
                                        {neg.desconto_perc && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                                            -{neg.desconto_perc}%
                                          </span>
                                        )}
                                      </div>
                                      {neg.bonificacao_detalhe && (
                                        <p className="text-[11px] text-[#4B5563]">
                                          Bonif: {neg.bonificacao_detalhe}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                                        Execução na Loja
                                      </span>
                                      <p className="text-[11px] text-[#4B5563]">
                                        Responsável:{' '}
                                        <b>{neg.responsavel_loja || 'Equipe da Loja'}</b>
                                      </p>
                                      <p className="text-[11px] text-[#6B7280]">
                                        Progresso dos Marcos:{' '}
                                        <b>
                                          {marcosConcluidos}/{totalMarcos}
                                        </b>{' '}
                                        concluídos
                                      </p>
                                    </div>
                                  </div>

                                  {neg.descricao_acordo && (
                                    <p className="text-xs text-[#4B5563] bg-teal-50/40 p-2.5 rounded-lg border border-teal-100/60 leading-relaxed">
                                      <strong className="text-[#0F766E] block mb-0.5">
                                        Descrição do Acordado:
                                      </strong>
                                      {neg.descricao_acordo}
                                    </p>
                                  )}

                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between text-xs font-semibold text-[#374151]">
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                                        <span>
                                          Agenda de Marcos & Evidências em Loja ({totalMarcos})
                                        </span>
                                      </span>
                                      <span className="text-[11px] text-[#6B7280]">
                                        Garante o cumprimento do acordado com checagem fotográfica
                                      </span>
                                    </div>

                                    {marcos.length === 0 ? (
                                      <div className="p-3 bg-gray-50 rounded-lg text-center text-[11px] text-[#6B7280] border border-dashed border-[#E5E7EB]">
                                        Nenhum marco agendado ainda. Clique em &ldquo;Adicionar
                                        Marco&rdquo; acima (ex: Entrada do display, início do preço,
                                        fotos da ponta).
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                        {marcos.map((m) => {
                                          const mFotoUrl = comercialService.getMarcoFotoUrl(m)
                                          const mAtrasado =
                                            m.status !== 'concluido' && m.data_limite < hoje
                                          const mVenceHoje =
                                            m.status !== 'concluido' && m.data_limite === hoje

                                          return (
                                            <div
                                              key={m.id}
                                              className={`p-3 rounded-xl border flex flex-col justify-between text-xs space-y-2.5 bg-white ${
                                                mAtrasado
                                                  ? 'border-amber-300 ring-1 ring-amber-200'
                                                  : mVenceHoje
                                                    ? 'border-teal-400 ring-1 ring-teal-200'
                                                    : 'border-[#E5E7EB]'
                                              }`}
                                            >
                                              <div>
                                                <div className="flex items-start justify-between gap-1.5">
                                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                                                    {m.tipo_marco
                                                      ? m.tipo_marco.replace(/_/g, ' ')
                                                      : 'Marco'}
                                                  </span>
                                                  <div className="flex items-center gap-1">
                                                    {mAtrasado && (
                                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                                                        Atrasado
                                                      </span>
                                                    )}
                                                    {mVenceHoje && (
                                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                                                        Hoje
                                                      </span>
                                                    )}
                                                    <span
                                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        m.status === 'concluido'
                                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                      }`}
                                                    >
                                                      {m.status}
                                                    </span>
                                                  </div>
                                                </div>

                                                <h5 className="font-bold text-[#1F2937] mt-1.5 leading-snug">
                                                  {m.titulo}
                                                </h5>
                                                <p className="text-[11px] text-[#6B7280] mt-0.5">
                                                  Prazo:{' '}
                                                  <b className="text-[#1F2937]">{m.data_limite}</b>{' '}
                                                  {m.responsavel && `• Resp: ${m.responsavel}`}
                                                </p>
                                                {m.observacao && (
                                                  <p className="text-[11px] text-[#4B5563] mt-1 italic">
                                                    {m.observacao}
                                                  </p>
                                                )}

                                                <div className="mt-2 pt-2 border-t border-[#F3F4F6]">
                                                  {mFotoUrl ? (
                                                    <div className="space-y-1">
                                                      <div
                                                        onClick={() =>
                                                          setFotoVisualizador({
                                                            open: true,
                                                            url: mFotoUrl,
                                                            title: `${neg.titulo} — ${m.titulo}`,
                                                          })
                                                        }
                                                        className="cursor-pointer group relative rounded-lg overflow-hidden border border-[#E5E7EB] bg-gray-50 aspect-video flex items-center justify-center hover:opacity-95 transition-opacity"
                                                      >
                                                        <img
                                                          src={mFotoUrl}
                                                          alt={`Evidência ${m.titulo}`}
                                                          className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1">
                                                          <Eye className="w-3.5 h-3.5" />
                                                          <span>Ver Foto</span>
                                                        </div>
                                                      </div>
                                                      <div className="text-[10px] text-[#6B7280] flex items-center justify-between">
                                                        <span>
                                                          Por: <b>{m.executado_por || 'Loja'}</b>
                                                        </span>
                                                        <span>{m.executado_em || ''}</span>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="p-2 rounded bg-gray-50 border border-dashed border-[#D1D5DB] text-center">
                                                      <p className="text-[10px] text-[#6B7280]">
                                                        {m.concluido_sem_evidencia
                                                          ? 'Concluído sem foto registrada.'
                                                          : 'Sem evidência fotográfica.'}
                                                      </p>
                                                      {m.status !== 'concluido' && (
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() =>
                                                            setEvidenciaMarcoModal({
                                                              open: true,
                                                              marco: m,
                                                            })
                                                          }
                                                          className="mt-1 h-6 text-[10px] text-[#0F766E] border-teal-200 hover:bg-teal-50"
                                                        >
                                                          <Camera className="w-2.5 h-2.5 mr-1" />
                                                          <span>Fotografar Loja</span>
                                                        </Button>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Ações do Marco */}
                                              {m.status !== 'concluido' && (
                                                <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-end">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                      setEvidenciaMarcoModal({
                                                        open: true,
                                                        marco: m,
                                                      })
                                                    }
                                                    className="h-7 text-xs bg-[#0F766E] hover:bg-[#115E59] text-white gap-1 w-full justify-center"
                                                  >
                                                    <Check className="w-3 h-3" />
                                                    <span>Concluir Marco</span>
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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

      <RegistrarEvidenciaImplantacaoModal
        open={evidenciaImplantacaoModal.open}
        onOpenChange={(open) => setEvidenciaImplantacaoModal((prev) => ({ ...prev, open }))}
        implantacao={evidenciaImplantacaoModal.implantacao}
        userName={user?.nome || 'Responsável'}
        onSucesso={carregarDados}
      />

      <NovaNegociacaoModal
        open={novaNegociacaoModalOpen}
        onOpenChange={setNovaNegociacaoModalOpen}
        lojas={lojas}
        lojaSelecionada={lojaId}
        negociacaoParaEditar={negociacaoParaEditar}
        onSucesso={carregarDados}
      />

      <NovoMarcoNegociacaoModal
        open={novoMarcoModal.open}
        onOpenChange={(open) => setNovoMarcoModal((prev) => ({ ...prev, open }))}
        negociacao={novoMarcoModal.negociacao}
        onSucesso={carregarDados}
      />

      <RegistrarEvidenciaMarcoModal
        open={evidenciaMarcoModal.open}
        onOpenChange={(open) => setEvidenciaMarcoModal((prev) => ({ ...prev, open }))}
        marco={evidenciaMarcoModal.marco}
        userName={user?.nome || 'Responsável'}
        onSucesso={carregarDados}
      />

      <FotoVisualizadorModal
        isOpen={fotoVisualizador.open}
        onClose={() => setFotoVisualizador((prev) => ({ ...prev, open: false }))}
        fotoUrl={fotoVisualizador.url}
        titulo={fotoVisualizador.title}
      />
    </div>
  )
}
