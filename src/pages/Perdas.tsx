import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { normalizarNomeCanonico, getChaveCanonico } from '@/lib/cargos'
import { perdasService } from '@/services/perdas'
import { inventariosService } from '@/services/inventarios'
import { tarefasValidadeService } from '@/services/tarefasValidade'
import { lojasService } from '@/services/lojas'
import { clientesService } from '@/services/clientes'
import type { Perda, Inventario, TarefaValidade, Loja, Cliente, MotivoPerda } from '@/types'
import { RegistroPerdaModal } from '@/components/RegistroPerdaModal'
import { RegistroInventarioModal } from '@/components/RegistroInventarioModal'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingDown,
  AlertTriangle,
  ClipboardCheck,
  CalendarCheck,
  Plus,
  Download,
  Filter,
  Search,
  Store,
  Layers,
  ArrowUpDown,
  Camera,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  BarChart2,
} from 'lucide-react'

export default function PerdasPage() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojaSelecionada } = useStore()

  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')
  const isAdminGeral = perfil === 'admin'
  const isAdmRede = perfil === 'adm_rede'

  // Estados de dados
  const [perdas, setPerdas] = useState<Perda[]>([])
  const [inventarios, setInventarios] = useState<Inventario[]>([])
  const [tarefasValidade, setTarefasValidade] = useState<TarefaValidade[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<'7' | '30' | '90' | 'tudo'>('30')
  const [filtroLoja, setFiltroLoja] = useState<string>(lojaSelecionadaId || 'todas')
  const [filtroSetor, setFiltroSetor] = useState<string>('todos')
  const [filtroMotivo, setFiltroMotivo] = useState<string>('todos')
  const [busca, setBusca] = useState<string>('')

  // Modais
  const [registroPerdaOpen, setRegistroPerdaOpen] = useState(false)
  const [registroInventarioOpen, setRegistroInventarioOpen] = useState(false)
  const [setorPreSelecionado, setSetorPreSelecionado] = useState<string>('')
  const [fotoModal, setFotoModal] = useState<{
    url: string
    titulo: string
    subtitulo?: string
    dataHora?: string
  } | null>(null)

  // Atualizar filtro de loja ao mudar lojaSelecionada globalmente
  useEffect(() => {
    if (lojaSelecionadaId) {
      setFiltroLoja(lojaSelecionadaId)
    }
  }, [lojaSelecionadaId])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pList, iList, tvList, lList, cList] = await Promise.all([
        perdasService.getAll().catch(() => [] as Perda[]),
        inventariosService.getAll().catch(() => [] as Inventario[]),
        tarefasValidadeService.getAll().catch(() => [] as TarefaValidade[]),
        lojasService.getAll().catch(() => [] as Loja[]),
        isAdminGeral
          ? clientesService.getAll().catch(() => [] as Cliente[])
          : Promise.resolve([] as Cliente[]),
      ])

      // Se for ADM de rede, restringir aos dados da rede
      if (isAdmRede && user?.cliente) {
        const lojasDaRede = lList.filter((l) => l.cliente === user.cliente)
        const lojaIds = new Set(lojasDaRede.map((l) => l.id))
        setLojas(lojasDaRede)
        setPerdas(pList.filter((p) => !p.loja || lojaIds.has(p.loja)))
        setInventarios(iList.filter((i) => !i.loja || lojaIds.has(i.loja)))
        setTarefasValidade(tvList.filter((tv) => !tv.loja || lojaIds.has(tv.loja)))
      } else {
        setLojas(lList)
        setPerdas(pList)
        setInventarios(iList)
        setTarefasValidade(tvList)
      }
      setClientes(cList)
    } catch (err) {
      console.error('Erro ao carregar dados de perdas e inventários:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdminGeral, isAdmRede, user?.cliente])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Normalização de datas para filtro de período
  const dataCorte = useMemo(() => {
    if (filtroPeriodo === 'tudo') return null
    const dias = Number(filtroPeriodo)
    const d = new Date()
    d.setDate(d.getDate() - dias)
    return d.toISOString().substring(0, 10)
  }, [filtroPeriodo])

  // Filtragem de Perdas
  const perdasFiltradas = useMemo(() => {
    return perdas.filter((p) => {
      if (filtroLoja !== 'todas' && p.loja && p.loja !== filtroLoja) {
        return false
      }
      if (dataCorte && p.data && p.data < dataCorte) {
        return false
      }
      if (filtroSetor !== 'todos') {
        const chaveFiltro = getChaveCanonico(filtroSetor)
        const chaveSetor = getChaveCanonico(p.setor_categoria)
        if (chaveFiltro !== chaveSetor && p.setor_categoria !== filtroSetor) {
          return false
        }
      }
      if (filtroMotivo !== 'todos' && p.motivo !== filtroMotivo) {
        return false
      }
      if (busca.trim()) {
        const b = busca.toLowerCase()
        const setor = (p.setor_categoria || '').toLowerCase()
        const setorNorm = normalizarNomeCanonico(p.setor_categoria).toLowerCase()
        const item = (p.item_descricao || '').toLowerCase()
        const obs = (p.observacao || '').toLowerCase()
        if (!setor.includes(b) && !setorNorm.includes(b) && !item.includes(b) && !obs.includes(b)) {
          return false
        }
      }
      return true
    })
  }, [perdas, filtroLoja, dataCorte, filtroSetor, filtroMotivo, busca])

  // Filtragem de Inventários
  const inventariosFiltrados = useMemo(() => {
    return inventarios.filter((inv) => {
      if (filtroLoja !== 'todas' && inv.loja && inv.loja !== filtroLoja) {
        return false
      }
      if (dataCorte && inv.data && inv.data < dataCorte) {
        return false
      }
      if (filtroSetor !== 'todos') {
        const chaveFiltro = getChaveCanonico(filtroSetor)
        const chaveSetor = getChaveCanonico(inv.setor_categoria)
        if (chaveFiltro !== chaveSetor && inv.setor_categoria !== filtroSetor) {
          return false
        }
      }
      return true
    })
  }, [inventarios, filtroLoja, dataCorte, filtroSetor])

  // Filtragem de Tarefas de Validade
  const tarefasValidadeFiltradas = useMemo(() => {
    return tarefasValidade.filter((t) => {
      if (filtroLoja !== 'todas' && t.loja && t.loja !== filtroLoja) {
        return false
      }
      if (filtroSetor !== 'todos') {
        const chaveFiltro = getChaveCanonico(filtroSetor)
        const chaveSetor = getChaveCanonico(t.setor_categoria)
        if (chaveFiltro !== chaveSetor && t.setor_categoria !== filtroSetor) {
          return false
        }
      }
      return true
    })
  }, [tarefasValidade, filtroLoja, filtroSetor])

  // ==========================================
  // KPIs PRINCIPAIS
  // ==========================================

  // 1. Perda Total do Período (R$)
  const perdaTotalR$ = useMemo(() => {
    return perdasFiltradas.reduce((acc, p) => acc + (Number(p.valor_estimado) || 0), 0)
  }, [perdasFiltradas])

  // 2. Setores com soma de perdas para achar o Top Setor Crítico (agrupados por padrão canônico)
  const perdasPorSetor = useMemo(() => {
    const map = new Map<
      string,
      { setor: string; totalValor: number; totalQtd: number; count: number }
    >()
    perdasFiltradas.forEach((p) => {
      const raw = p.setor_categoria || 'Outro'
      const s = normalizarNomeCanonico(raw) || 'Outro'
      const chave = getChaveCanonico(s) || 'outro'
      const cur = map.get(chave) || { setor: s, totalValor: 0, totalQtd: 0, count: 0 }
      cur.totalValor += Number(p.valor_estimado) || 0
      cur.totalQtd += Number(p.quantidade) || 0
      cur.count += 1
      map.set(chave, cur)
    })
    return map
  }, [perdasFiltradas])

  const topSetorCritico = useMemo(() => {
    let top = { setor: 'Nenhum', valor: 0 }
    perdasPorSetor.forEach((val) => {
      if (val.totalValor > top.valor) {
        top = { setor: val.setor, valor: val.totalValor }
      }
    })
    return top
  }, [perdasPorSetor])

  // 3. Tarefas de validade perdidas/não abertas no prazo (pendentes/atrasadas)
  // Tarefas cujo status é 'pendente' ou 'devolvida' ou não foram concluídas no prazo
  const tarefasValidadeNaoAbertas = useMemo(() => {
    return tarefasValidadeFiltradas.filter((t) => {
      const st = t.status || 'pendente'
      return st === 'pendente' || st === 'devolvida' || st === 'em_andamento'
    })
  }, [tarefasValidadeFiltradas])

  // 4. Cobertura de Inventário (% setores com contagem nos últimos 30 dias)
  const coberturaInventario = useMemo(() => {
    const d30 = new Date()
    d30.setDate(d30.getDate() - 30)
    const d30Str = d30.toISOString().substring(0, 10)

    // Setores conhecidos (da operação de validade + perdas + inventários)
    const todosSetoresSet = new Set<string>()
    tarefasValidade.forEach((t) => t.setor_categoria && todosSetoresSet.add(t.setor_categoria))
    perdas.forEach((p) => p.setor_categoria && todosSetoresSet.add(p.setor_categoria))
    inventarios.forEach((i) => i.setor_categoria && todosSetoresSet.add(i.setor_categoria))

    if (todosSetoresSet.size === 0) {
      return { totalSetores: 0, contados: 0, percentual: 100 }
    }

    const setoresContados30Dias = new Set<string>()
    inventarios.forEach((inv) => {
      if (inv.data >= d30Str && (filtroLoja === 'todas' || !inv.loja || inv.loja === filtroLoja)) {
        setoresContados30Dias.add(inv.setor_categoria)
      }
    })

    const totalSetores = todosSetoresSet.size
    const contados = setoresContados30Dias.size
    const percentual = Math.min(100, Math.round((contados / totalSetores) * 100))

    return { totalSetores, contados, percentual }
  }, [tarefasValidade, perdas, inventarios, filtroLoja])

  // ==========================================
  // O CRUZAMENTO (DIFERENCIAL DE MERCADO)
  // Tarefa de Validade NÃO realizada no prazo x Perdas Registradas do setor
  // ==========================================
  const cruzamentoSetores = useMemo(() => {
    const map = new Map<
      string,
      {
        setor: string
        tarefasPendentesCount: number
        tarefasExemplos: TarefaValidade[]
        perdaTotalR$: number
        perdasCount: number
        itensAtingidos: string[]
        ultimoInventario?: Inventario
      }
    >()

    // 1. Mapear setores com tarefas de validade pendentes (unificado pelo padrão canônico)
    tarefasValidadeNaoAbertas.forEach((t) => {
      const raw = t.setor_categoria || 'Geral'
      const s = normalizarNomeCanonico(raw) || 'Geral'
      const chave = getChaveCanonico(s) || 'geral'
      const cur = map.get(chave) || {
        setor: s,
        tarefasPendentesCount: 0,
        tarefasExemplos: [],
        perdaTotalR$: 0,
        perdasCount: 0,
        itensAtingidos: [],
      }
      cur.tarefasPendentesCount += 1
      if (cur.tarefasExemplos.length < 3) {
        cur.tarefasExemplos.push(t)
      }
      map.set(chave, cur)
    })

    // 2. Mapear setores que têm perdas registradas (agrupando pela mesma chave canônica)
    perdasFiltradas.forEach((p) => {
      const raw = p.setor_categoria || 'Outro'
      const s = normalizarNomeCanonico(raw) || 'Outro'
      const chave = getChaveCanonico(s) || 'outro'
      const cur = map.get(chave) || {
        setor: s,
        tarefasPendentesCount: 0,
        tarefasExemplos: [],
        perdaTotalR$: 0,
        perdasCount: 0,
        itensAtingidos: [],
      }
      cur.perdaTotalR$ += Number(p.valor_estimado) || 0
      cur.perdasCount += 1
      if (p.item_descricao && !cur.itensAtingidos.includes(p.item_descricao)) {
        cur.itensAtingidos.push(p.item_descricao)
      }
      map.set(chave, cur)
    })

    // 3. Vincular último inventário do setor
    inventarios.forEach((inv) => {
      const chave = getChaveCanonico(inv.setor_categoria)
      const cur = map.get(chave)
      if (cur) {
        if (!cur.ultimoInventario || inv.data > cur.ultimoInventario.data) {
          cur.ultimoInventario = inv
        }
      }
    })

    // Converter para array e ordenar: setores com AMBOS (tarefas pendentes E perda registrada) têm prioridade máxima
    return Array.from(map.values()).sort((a, b) => {
      const aAmbos = a.tarefasPendentesCount > 0 && a.perdaTotalR$ > 0
      const bAmbos = b.tarefasPendentesCount > 0 && b.perdaTotalR$ > 0

      if (aAmbos && !bAmbos) return -1
      if (!aAmbos && bAmbos) return 1

      // Desempate por valor total de perda
      if (b.perdaTotalR$ !== a.perdaTotalR$) {
        return b.perdaTotalR$ - a.perdaTotalR$
      }
      return b.tarefasPendentesCount - a.tarefasPendentesCount
    })
  }, [tarefasValidadeNaoAbertas, perdasFiltradas, inventarios])

  // Setores com ambos pendência de validade E perda registrada
  const setoresCriticosRiscoDuplo = useMemo(() => {
    return cruzamentoSetores.filter((c) => c.tarefasPendentesCount > 0 && c.perdaTotalR$ > 0)
  }, [cruzamentoSetores])

  // ==========================================
  // EXPORTAÇÃO CSV
  // ==========================================
  const handleExportarCsv = () => {
    const cabecalho = [
      'Data',
      'Loja',
      'Setor / Categoria',
      'Motivo da Perda',
      'Item / Descrição',
      'Quantidade',
      'Valor Estimado (R$)',
      'Registrado Por',
      'Observação',
    ]

    const linhas = perdasFiltradas.map((p) => {
      const lojaNome = p.expand?.loja?.nome || 'Loja Principal'
      const regPor = p.expand?.registrado_por?.name || p.expand?.registrado_por?.email || 'Operador'
      return [
        p.data,
        `"${lojaNome.replace(/"/g, '""')}"`,
        `"${(p.setor_categoria || '').replace(/"/g, '""')}"`,
        `"${p.motivo}"`,
        `"${(p.item_descricao || '').replace(/"/g, '""')}"`,
        p.quantidade,
        p.valor_estimado.toFixed(2),
        `"${regPor.replace(/"/g, '""')}"`,
        `"${(p.observacao || '').replace(/"/g, '""')}"`,
      ]
    })

    const csvContent =
      '\uFEFF' + [cabecalho.join(';'), ...linhas.map((row) => row.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `relatorio_perdas_e_inventarios_${new Date().toISOString().substring(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Deletar perda
  const handleDeletePerda = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de perda?')) return
    try {
      await perdasService.delete(id)
      setPerdas((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Erro ao excluir perda:', err)
      alert('Não foi possível excluir o registro de perda.')
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-100 text-[#B91C1C]">
              Prevenção Operacional
            </span>
            <span className="text-xs text-[#6B7280]">Perdas & Validades × Inventário</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-[#2563EB]" />
            <span>Painel de Perdas & Inventário</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Cruzamento inteligente de quebras com rotinas de validade não realizadas no prazo
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportarCsv}
            disabled={perdasFiltradas.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#374151] hover:text-[#2563EB] text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            title="Exportar planilha de perdas e quebras em formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setSetorPreSelecionado('')
              setRegistroInventarioOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Contagem de Inventário</span>
          </button>

          <button
            onClick={() => {
              setSetorPreSelecionado('')
              setRegistroPerdaOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Perda (2 toques)</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Seletor de Período */}
          <div className="flex items-center gap-1 p-1 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB] w-fit">
            <button
              onClick={() => setFiltroPeriodo('7')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filtroPeriodo === '7'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setFiltroPeriodo('30')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filtroPeriodo === '30'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => setFiltroPeriodo('90')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filtroPeriodo === '90'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Últimos 90 dias
            </button>
            <button
              onClick={() => setFiltroPeriodo('tudo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filtroPeriodo === 'tudo'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Tudo
            </button>
          </div>

          {/* Filtros em linha */}
          <div className="flex items-center gap-2 flex-wrap">
            {lojas.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Store className="w-3.5 h-3.5 text-[#6B7280]" />
                <select
                  value={filtroLoja}
                  onChange={(e) => setFiltroLoja(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB] text-xs"
                >
                  <option value="todas">Todas as Lojas</option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
              <select
                value={filtroMotivo}
                onChange={(e) => setFiltroMotivo(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB] text-xs"
              >
                <option value="todos">Todos os Motivos</option>
                <option value="vencimento">Vencimento</option>
                <option value="avaria">Avaria</option>
                <option value="roubo">Furto / Roubo</option>
                <option value="erro de pedido">Erro de Pedido</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar item ou setor..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937] w-40 sm:w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs no Topo (Requisito 2) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Perda Total do Período */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-[#B91C1C]" />
                <span>Perda Total no Período</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-[#B91C1C]">
                {perdasFiltradas.length} reg.
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#B91C1C] tracking-tight leading-none">
                {formatCurrency(perdaTotalR$)}
              </div>
              <p className="text-xs text-[#6B7280] mt-1.5">
                Soma estimada de perdas físicas e quebras apontadas
              </p>
            </div>
          </div>

          {/* KPI 2: Top Setor Crítico */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Top Setor Crítico</span>
              </span>
            </div>
            <div className="mt-2.5">
              <div
                className="text-lg sm:text-xl font-bold text-[#1F2937] truncate leading-tight"
                title={topSetorCritico.setor}
              >
                {topSetorCritico.setor}
              </div>
              <p className="text-xs text-[#B91C1C] font-semibold mt-1">
                {topSetorCritico.valor > 0
                  ? formatCurrency(topSetorCritico.valor)
                  : 'Sem perdas apontadas'}
              </p>
            </div>
          </div>

          {/* KPI 3: Tarefas de Validade Perdidas / Não Abertas no Prazo */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-[#2563EB]" />
                <span>Validades Pendentes</span>
              </span>
              {tarefasValidadeNaoAbertas.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-[#B91C1C]">
                  Risco Ativo
                </span>
              )}
            </div>
            <div className="mt-2.5">
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none flex items-baseline gap-2 ${
                  tarefasValidadeNaoAbertas.length > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
                }`}
              >
                <span>{tarefasValidadeNaoAbertas.length}</span>
                <span className="text-xs font-normal text-[#6B7280]">não concluídas</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1.5">
                Rotinas de validação não finalizadas que aumentam a quebra
              </p>
            </div>
          </div>

          {/* KPI 4: Cobertura de Inventário (últimos 30 dias) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <span>Cobertura de Inventário</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                30 dias
              </span>
            </div>
            <div className="mt-2.5">
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${
                  coberturaInventario.percentual >= 90
                    ? 'text-emerald-700'
                    : coberturaInventario.percentual >= 70
                      ? 'text-amber-700'
                      : 'text-red-700'
                }`}
              >
                {coberturaInventario.percentual}%
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${coberturaInventario.percentual}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1.5">
                {coberturaInventario.contados} de {coberturaInventario.totalSetores} setores com
                contagem recente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QUADRO ÚNICO DO CRUZAMENTO (O DIFERENCIAL): Validade Pendente × Perda Registrada */}
      <div className="bg-white border-2 border-amber-300/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#1F2937]">
                  Cruzamento: Validade Pendente × Perda Registrada
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB] text-white uppercase tracking-wider">
                  Diferencial VivaVarejo
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Quando a verificação de validade de um setor não é aberta no prazo, o sistema
                correlaciona com as perdas reais sofridas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {setoresCriticosRiscoDuplo.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-[#B91C1C] border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{setoresCriticosRiscoDuplo.length} setor(es) em alto risco</span>
              </span>
            )}
          </div>
        </div>

        {cruzamentoSetores.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7280] bg-[#F7F7F5]/50 rounded-lg border border-dashed border-[#E5E7EB]">
            Nenhum apontamento pendente de validade ou perda para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cruzamentoSetores.map((item) => {
              const temRiscoDuplo = item.tarefasPendentesCount > 0 && item.perdaTotalR$ > 0

              return (
                <div
                  key={item.setor}
                  className={`rounded-xl p-3.5 border transition-all ${
                    temRiscoDuplo
                      ? 'bg-red-50/40 border-red-300 shadow-2xs'
                      : item.tarefasPendentesCount > 0
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-[#F7F7F5]/40 border-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{item.setor}</span>
                      </span>
                    </div>

                    {temRiscoDuplo ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white shrink-0">
                        Alto Risco
                      </span>
                    ) : item.tarefasPendentesCount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 shrink-0">
                        Validade Pendente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-[#4B5563] shrink-0">
                        Perda Monitorada
                      </span>
                    )}
                  </div>

                  {/* Detalhes do Cruzamento */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-md bg-white border border-[#E5E7EB]">
                      <span className="text-[#6B7280] flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Validades não abertas:</span>
                      </span>
                      <strong
                        className={
                          item.tarefasPendentesCount > 0 ? 'text-[#B91C1C]' : 'text-emerald-700'
                        }
                      >
                        {item.tarefasPendentesCount} tarefa(s)
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-md bg-white border border-[#E5E7EB]">
                      <span className="text-[#6B7280] flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-[#B91C1C]" />
                        <span>Perda acumulada (R$):</span>
                      </span>
                      <strong
                        className={item.perdaTotalR$ > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'}
                      >
                        {formatCurrency(item.perdaTotalR$)} ({item.perdasCount} reg.)
                      </strong>
                    </div>

                    {item.itensAtingidos.length > 0 && (
                      <div className="text-[11px] text-[#4B5563] pt-1">
                        <span className="font-semibold text-[#1F2937]">Itens apontados: </span>
                        <span>{item.itensAtingidos.slice(0, 3).join(', ')}</span>
                        {item.itensAtingidos.length > 3 && (
                          <span className="text-[#6B7280]">
                            {' '}
                            (+{item.itensAtingidos.length - 3})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Botões de Ação do Card */}
                    <div className="pt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSetorPreSelecionado(item.setor)
                          setRegistroPerdaOpen(true)
                        }}
                        className="flex-1 py-1.5 px-2 rounded-md bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#374151] hover:text-[#2563EB] text-[11px] font-semibold transition-colors text-center"
                      >
                        + Apontar perda
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSetorPreSelecionado(item.setor)
                          setRegistroInventarioOpen(true)
                        }}
                        className="flex-1 py-1.5 px-2 rounded-md bg-white border border-[#E5E7EB] hover:border-emerald-600 text-[#374151] hover:text-emerald-700 text-[11px] font-semibold transition-colors text-center"
                      >
                        Contar inventário
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Listagem de Perdas e Quebras Registradas */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden space-y-3 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1F2937] flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#B91C1C]" />
              <span>Registros de Perdas Recentes</span>
              <span className="text-xs font-normal text-[#6B7280]">
                ({perdasFiltradas.length} apontamentos)
              </span>
            </h3>
            <p className="text-xs text-[#6B7280]">
              Histórico detalhado com setor, motivo, valor estimado e foto comprobatória
            </p>
          </div>
        </div>

        {perdasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B7280] bg-[#F7F7F5]/50 rounded-lg border border-dashed border-[#E5E7EB]">
            Nenhuma perda registrada com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Loja</th>
                  <th className="p-3">Setor</th>
                  <th className="p-3">Motivo</th>
                  <th className="p-3">Item / Descrição</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Valor Estimado</th>
                  <th className="p-3 text-center">Foto</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {perdasFiltradas.map((p) => {
                  const fotoUrl = perdasService.getFotoUrl(p)
                  const lojaNome = p.expand?.loja?.nome || 'Loja Principal'

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 whitespace-nowrap text-[#1F2937] font-medium">
                        {p.data.split('-').reverse().join('/')}
                      </td>
                      <td className="p-3 text-[#4B5563] font-medium">{lojaNome}</td>
                      <td className="p-3 text-[#1F2937] font-semibold">
                        {normalizarNomeCanonico(p.setor_categoria)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            p.motivo === 'vencimento'
                              ? 'bg-red-100 text-[#B91C1C]'
                              : p.motivo === 'avaria'
                                ? 'bg-amber-100 text-amber-800'
                                : p.motivo === 'roubo'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-[#4B5563]'
                          }`}
                        >
                          {p.motivo}
                        </span>
                      </td>
                      <td className="p-3 text-[#374151]">
                        <div>
                          <span>{p.item_descricao || '—'}</span>
                          {p.observacao && (
                            <span className="block text-[11px] text-[#6B7280] italic truncate max-w-xs">
                              {p.observacao}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-[#1F2937]">{p.quantidade}</td>
                      <td className="p-3 text-right font-bold text-[#B91C1C]">
                        {formatCurrency(p.valor_estimado)}
                      </td>
                      <td className="p-3 text-center">
                        {p.foto ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const protectedUrl = await perdasService.getProtectedFotoUrl(p)
                              setFotoModal({
                                url: protectedUrl || fotoUrl || '',
                                titulo: `Perda: ${p.setor_categoria}`,
                                subtitulo: p.item_descricao
                                  ? `${p.item_descricao} • ${p.quantidade} un • ${formatCurrency(p.valor_estimado)}`
                                  : `Motivo: ${p.motivo} • ${p.quantidade} un`,
                                dataHora: p.data
                                  ? p.data.split('-').reverse().join('/')
                                  : undefined,
                              })
                            }}
                            className="p-1 rounded text-[#2563EB] hover:bg-blue-50 transition-colors"
                            title="Visualizar foto da comprovação com zoom seguro"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[#9CA3AF] text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeletePerda(p.id)}
                          className="p-1 rounded text-[#6B7280] hover:text-[#B91C1C] hover:bg-red-50 transition-colors"
                          title="Excluir apontamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico Recente de Inventários Contados */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden space-y-3 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1F2937] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Contagens de Inventário Recentes</span>
              <span className="text-xs font-normal text-[#6B7280]">
                ({inventariosFiltrados.length} inventários)
              </span>
            </h3>
            <p className="text-xs text-[#6B7280]">
              Acompanhamento de acuracidade por setor e coberturas de estoque
            </p>
          </div>
        </div>

        {inventariosFiltrados.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6B7280] bg-[#F7F7F5]/50 rounded-lg border border-dashed border-[#E5E7EB]">
            Nenhum inventário registrado no período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Loja</th>
                  <th className="p-3">Setor</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Itens Contados</th>
                  <th className="p-3 text-center">Divergências</th>
                  <th className="p-3 text-center">Acuracidade</th>
                  <th className="p-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {inventariosFiltrados.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 text-[#1F2937] font-medium whitespace-nowrap">
                      {inv.data.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3 text-[#4B5563]">
                      {inv.expand?.loja?.nome || 'Loja Principal'}
                    </td>
                    <td className="p-3 font-semibold text-[#1F2937]">
                      {normalizarNomeCanonico(inv.setor_categoria)}
                    </td>
                    <td className="p-3 capitalize text-[#4B5563]">
                      {inv.tipo === 'rotativo' ? 'Rotativo (Setor)' : 'Geral'}
                    </td>
                    <td className="p-3 text-center font-bold text-[#1F2937]">
                      {inv.itens_contados ?? '—'}
                    </td>
                    <td className="p-3 text-center text-[#B91C1C] font-semibold">
                      {inv.divergencias_encontradas ?? 0}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {inv.acuracidade_percentual ?? 100}%
                      </span>
                    </td>
                    <td className="p-3 text-[#6B7280]">
                      {normalizarNomeCanonico(inv.responsavel_nome) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Registro de Perda */}
      <RegistroPerdaModal
        open={registroPerdaOpen}
        onOpenChange={setRegistroPerdaOpen}
        lojas={lojas}
        lojaSelecionadaId={filtroLoja !== 'todas' ? filtroLoja : lojaSelecionadaId}
        initialSetor={setorPreSelecionado}
        userId={user?.id}
        onSaved={(nova) => {
          setPerdas((prev) => [nova, ...prev])
        }}
      />

      {/* Modal de Registro de Inventário */}
      <RegistroInventarioModal
        open={registroInventarioOpen}
        onOpenChange={setRegistroInventarioOpen}
        lojas={lojas}
        lojaSelecionadaId={filtroLoja !== 'todas' ? filtroLoja : lojaSelecionadaId}
        initialSetor={setorPreSelecionado}
        userId={user?.id}
        userName={user?.name || user?.email}
        onSaved={(novo) => {
          setInventarios((prev) => [novo, ...prev])
        }}
      />

      {/* Visualizador de Foto Modal Seguro com Token e Zoom */}
      <FotoVisualizadorModal
        isOpen={Boolean(fotoModal)}
        fotoUrl={fotoModal?.url}
        titulo={fotoModal?.titulo}
        subtitulo={fotoModal?.subtitulo || 'Comprovação de perda apontada'}
        dataHora={fotoModal?.dataHora}
        onClose={() => setFotoModal(null)}
      />
    </div>
  )
}
