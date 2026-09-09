import React, { useState, useMemo } from 'react'
import type { VisitaPromotor, Promotor, Fornecedor, Loja, RotinaPromotor } from '@/types'
import { isVisitaAtrasada } from '@/services/visitasPromotor'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building2,
  Store,
  XCircle,
  Trash2,
  Edit2,
  Layers,
  Phone,
  Mail,
  Camera,
  MessageCircle,
  Sparkles,
  MoveHorizontal,
} from 'lucide-react'
import { PromotorModal } from '@/components/PromotorModal'
import { FornecedorModal } from '@/components/FornecedorModal'
import { AgendarVisitaModal } from '@/components/AgendarVisitaModal'
import { ConcluirVisitaModal, type CriterioFoco } from '@/components/ConcluirVisitaModal'
import { RotinaPromotorModal } from '@/components/RotinaPromotorModal'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { buildWhatsAppLink, formatPhoneBR } from '@/lib/phone-utils'

interface PromotoresFornecedoresManagerProps {
  visitas: VisitaPromotor[]
  promotores: Promotor[]
  fornecedores: Fornecedor[]
  lojas: Loja[]
  rotinasPromotor: RotinaPromotor[]
  onRefresh: () => Promise<void>
  onSaveVisita: (payload: Partial<VisitaPromotor>, id?: string) => Promise<void>
  onConcluirVisita: (visitaId: string, params: any) => Promise<void>
  onCancelarVisita: (visitaId: string, motivo?: string) => Promise<void>
  onDeleteVisita: (visitaId: string) => Promise<void>
  onSavePromotor: (payload: Partial<Promotor>, id?: string) => Promise<void>
  onDeletePromotor: (promotor: Promotor) => Promise<void>
  onSaveFornecedor: (payload: Partial<Fornecedor> | FormData, id?: string) => Promise<void>
  onDeleteFornecedor: (fornecedor: Fornecedor) => Promise<void>
  onSaveRotinaPromotor: (payload: Partial<RotinaPromotor> | FormData, id?: string) => Promise<void>
  onDeleteRotinaPromotor: (rotina: RotinaPromotor) => Promise<void>
  usuarios?: any[]
  clientes?: any[]
}

type SubTab = 'visitas' | 'promotores' | 'fornecedores' | 'rotinas'

export function PromotoresFornecedoresManager({
  visitas,
  promotores,
  fornecedores,
  lojas,
  rotinasPromotor,
  onSaveVisita,
  onConcluirVisita,
  onCancelarVisita,
  onDeleteVisita,
  onSavePromotor,
  onDeletePromotor,
  onSaveFornecedor,
  onDeleteFornecedor,
  onSaveRotinaPromotor,
  onDeleteRotinaPromotor,
  usuarios = [],
  clientes = [],
}: PromotoresFornecedoresManagerProps) {
  const [subTab, setSubTab] = useState<SubTab>('visitas')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFornecedor, setFilterFornecedor] = useState<string>('todos')
  const [filterPromotor, setFilterPromotor] = useState<string>('todos')
  const [filterLoja, setFilterLoja] = useState<string>('todas')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterPeriodo, setFilterPeriodo] = useState<string>('todos') // 'todos' | 'hoje' | 'semana' | 'mes'

  // Modais
  const [agendarModalOpen, setAgendarModalOpen] = useState(false)
  const [editingVisita, setEditingVisita] = useState<VisitaPromotor | null>(null)

  const [concluirModalOpen, setConcluirModalOpen] = useState(false)
  const [visitaParaConcluir, setVisitaParaConcluir] = useState<VisitaPromotor | null>(null)
  const [focoCriterio, setFocoCriterio] = useState<CriterioFoco>('geral')

  const [promotorModalOpen, setPromotorModalOpen] = useState(false)
  const [editingPromotor, setEditingPromotor] = useState<Promotor | null>(null)

  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)

  const [rotinaModalOpen, setRotinaModalOpen] = useState(false)
  const [editingRotina, setEditingRotina] = useState<RotinaPromotor | null>(null)

  // Visualizador de foto em tela cheia com zoom
  const [fotoModalState, setFotoModalState] = useState<{
    isOpen: boolean
    fotoUrl: string | null
    titulo: string
    subtitulo?: string
    dataHora?: string
  }>({
    isOpen: false,
    fotoUrl: null,
    titulo: '',
  })

  const pbBase = (import.meta as any).env.VITE_POCKETBASE_URL || ''

  // KPIs
  const kpis = useMemo(() => {
    const total = visitas.length
    let realizadas = 0
    let atrasadas = 0
    let agendadas = 0
    let canceladas = 0

    // Semana atual
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    let daSemana = 0

    visitas.forEach((v) => {
      const atrasada = isVisitaAtrasada(v)
      if (v.status === 'realizada') {
        realizadas++
      } else if (v.status === 'cancelada') {
        canceladas++
      } else if (atrasada) {
        atrasadas++
      } else {
        agendadas++
      }

      if (v.data_visita) {
        const d = new Date(v.data_visita.substring(0, 10))
        if (d >= startOfWeek && d < endOfWeek) {
          daSemana++
        }
      }
    })

    const totalAtivas = total - canceladas
    const taxaRealizacao = totalAtivas > 0 ? Math.round((realizadas / totalAtivas) * 100) : 0

    return {
      total,
      daSemana,
      realizadas,
      atrasadas,
      agendadas,
      canceladas,
      taxaRealizacao,
    }
  }, [visitas])

  // Lista filtrada de visitas
  const filteredVisitas = useMemo(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    return visitas.filter((v) => {
      const atrasada = isVisitaAtrasada(v)
      const effectiveStatus = atrasada ? 'atrasada' : v.status

      if (filterStatus !== 'todos' && effectiveStatus !== filterStatus) {
        return false
      }

      if (filterLoja !== 'todas' && v.loja !== filterLoja) {
        return false
      }

      if (filterPromotor !== 'todos' && v.promotor !== filterPromotor) {
        return false
      }

      const pObj = promotores.find((p) => p.id === v.promotor)
      if (filterFornecedor !== 'todos' && pObj?.fornecedor !== filterFornecedor) {
        return false
      }

      const vDateStr = v.data_visita ? v.data_visita.substring(0, 10) : ''
      if (filterPeriodo === 'hoje' && vDateStr !== todayStr) {
        return false
      }

      if (filterPeriodo === 'semana') {
        const d = new Date(vDateStr)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        if (d < startOfWeek || d >= endOfWeek) {
          return false
        }
      }

      if (filterPeriodo === 'mes') {
        const d = new Date(vDateStr)
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
          return false
        }
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const promNome = pObj?.nome?.toLowerCase() || ''
        const fornNome =
          fornecedores.find((f) => f.id === pObj?.fornecedor)?.nome?.toLowerCase() || ''
        const lojaNome = lojas.find((l) => l.id === v.loja)?.nome?.toLowerCase() || ''
        const obs = v.observacoes?.toLowerCase() || ''
        const conc = v.conclusao_check?.toLowerCase() || ''

        if (
          !promNome.includes(term) &&
          !fornNome.includes(term) &&
          !lojaNome.includes(term) &&
          !obs.includes(term) &&
          !conc.includes(term)
        ) {
          return false
        }
      }

      return true
    })
  }, [
    visitas,
    promotores,
    fornecedores,
    lojas,
    filterStatus,
    filterLoja,
    filterPromotor,
    filterFornecedor,
    filterPeriodo,
    searchTerm,
  ])

  // Lista filtrada de promotores
  const filteredPromotores = useMemo(() => {
    return promotores.filter((p) => {
      if (filterFornecedor !== 'todos' && p.fornecedor !== filterFornecedor) {
        return false
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const nome = p.nome.toLowerCase()
        const forn = fornecedores.find((f) => f.id === p.fornecedor)?.nome?.toLowerCase() || ''
        const email = p.email?.toLowerCase() || ''
        const tel = p.telefone?.toLowerCase() || ''
        if (
          !nome.includes(term) &&
          !forn.includes(term) &&
          !email.includes(term) &&
          !tel.includes(term)
        ) {
          return false
        }
      }
      return true
    })
  }, [promotores, fornecedores, filterFornecedor, searchTerm])

  // Lista filtrada de fornecedores
  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter((f) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const nome = f.nome.toLowerCase()
        const contato = f.contato?.toLowerCase() || ''
        const obs = f.observacoes?.toLowerCase() || ''
        if (!nome.includes(term) && !contato.includes(term) && !obs.includes(term)) {
          return false
        }
      }
      return true
    })
  }, [fornecedores, searchTerm])

  // Lista filtrada de rotinas padrão
  const filteredRotinas = useMemo(() => {
    return rotinasPromotor.filter((r) => {
      if (filterFornecedor !== 'todos' && r.fornecedor && r.fornecedor !== filterFornecedor) {
        return false
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const tit = r.titulo.toLowerCase()
        const desc = r.descricao?.toLowerCase() || ''
        if (!tit.includes(term) && !desc.includes(term)) {
          return false
        }
      }
      return true
    })
  }, [rotinasPromotor, filterFornecedor, searchTerm])

  return (
    <div className="space-y-6">
      {/* Sub-navegação do Módulo Promotores & Fornecedores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-3">
        <div className="scrollbar-thin-horizontal flex items-center gap-1.5 pb-1 w-full sm:w-auto">
          <button
            onClick={() => {
              setSubTab('visitas')
              setSearchTerm('')
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              subTab === 'visitas'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Visitas em Loja ({visitas.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('promotores')
              setSearchTerm('')
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              subTab === 'promotores'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Promotores ({promotores.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('fornecedores')
              setSearchTerm('')
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              subTab === 'fornecedores'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Fornecedores ({fornecedores.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('rotinas')
              setSearchTerm('')
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              subTab === 'rotinas'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Rotinas Padrão ({rotinasPromotor.length})</span>
          </button>
        </div>

        {/* Botão de Ação Primária dependendo da subTab */}
        <div className="flex items-center gap-2">
          {subTab === 'visitas' && (
            <button
              onClick={() => {
                setEditingVisita(null)
                setAgendarModalOpen(true)
              }}
              disabled={promotores.length === 0 || lojas.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar Visita</span>
            </button>
          )}

          {subTab === 'promotores' && (
            <button
              onClick={() => {
                setEditingPromotor(null)
                setPromotorModalOpen(true)
              }}
              disabled={fornecedores.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Promotor</span>
            </button>
          )}

          {subTab === 'fornecedores' && (
            <button
              onClick={() => {
                setEditingFornecedor(null)
                setFornecedorModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Fornecedor</span>
            </button>
          )}

          {subTab === 'rotinas' && (
            <button
              onClick={() => {
                setEditingRotina(null)
                setRotinaModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Rotina de Promotor</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================= ABA VISITAS ======================= */}
      {subTab === 'visitas' && (
        <div className="space-y-6">
          {/* KPIs no Topo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Visitas da Semana</span>
                <Calendar className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-bold text-[#1F2937] leading-none">
                {kpis.daSemana}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">{kpis.total} registradas no total</div>
            </div>

            <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Realizadas</span>
                <CheckCircle2
                  className={`w-4 h-4 ${
                    kpis.taxaRealizacao >= 90
                      ? 'text-emerald-600'
                      : kpis.taxaRealizacao >= 70
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                />
              </div>
              <div
                className={`mt-1 text-2xl sm:text-3xl font-bold leading-none ${
                  kpis.taxaRealizacao >= 90
                    ? 'text-emerald-700'
                    : kpis.taxaRealizacao >= 70
                      ? 'text-amber-700'
                      : 'text-red-700'
                }`}
              >
                {kpis.realizadas}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">Taxa: {kpis.taxaRealizacao}%</div>
            </div>

            <div
              className={`p-3.5 sm:p-4 rounded-lg shadow-xs border ${
                kpis.atrasadas > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={kpis.atrasadas > 0 ? 'font-bold text-[#B91C1C]' : 'text-[#6B7280]'}
                >
                  Atrasadas
                </span>
                <AlertTriangle
                  className={`w-4 h-4 ${kpis.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-gray-400'}`}
                />
              </div>
              <div
                className={`mt-1 text-2xl sm:text-3xl font-bold leading-none ${
                  kpis.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
                }`}
              >
                {kpis.atrasadas}
              </div>
              <div className="text-xs opacity-80 mt-1">Prazo expirado sem check</div>
            </div>

            <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Agendadas</span>
                <Clock className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="mt-1 text-2xl sm:text-3xl font-bold text-[#2563EB] leading-none">
                {kpis.agendadas}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">Aguardando atendimento</div>
            </div>
          </div>

          {/* Filtros de Visitas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 border border-[#E5E7EB] rounded-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por promotor, fornecedor, loja ou observações..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F7F5] border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <Filter className="w-3.5 h-3.5 text-[#6B7280]" />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F5] border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="todos">Todos os status</option>
                <option value="agendada">Agendadas</option>
                <option value="realizada">Realizadas</option>
                <option value="atrasada">Atrasadas</option>
                <option value="cancelada">Canceladas</option>
              </select>

              <select
                value={filterLoja}
                onChange={(e) => setFilterLoja(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F5] border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="todas">Todas as lojas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>

              <select
                value={filterFornecedor}
                onChange={(e) => setFilterFornecedor(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F5] border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="todos">Todos os fornecedores</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>

              <select
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F5] border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="todos">Todo o período</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </select>
            </div>
          </div>

          {/* Tabela de Visitas com scroll horizontal dedicado e aviso no celular */}
          {filteredVisitas.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
              <Calendar className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">Nenhuma visita encontrada.</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Agende visitas de repositores e representantes nas lojas para controlar a eficiência
                do atendimento.
              </p>
              {promotores.length > 0 && lojas.length > 0 && (
                <button
                  onClick={() => {
                    setEditingVisita(null)
                    setAgendarModalOpen(true)
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar primeira visita</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Dica de rolagem horizontal para telas pequenas */}
              <div className="sm:hidden flex items-center justify-between text-[11px] text-[#6B7280] px-1">
                <span className="flex items-center gap-1 font-medium text-[#2563EB]">
                  <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
                  <span>Deslize a tabela para o lado para ver todos os campos e ações</span>
                </span>
                <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                  {filteredVisitas.length} registros
                </span>
              </div>

              <div className="scrollbar-thin-horizontal bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[760px]">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Status</th>
                      <th className="p-3.5 whitespace-nowrap">Data & Hora</th>
                      <th className="p-3.5 whitespace-nowrap">Promotor / Fornecedor</th>
                      <th className="p-3.5 whitespace-nowrap">Loja</th>
                      <th className="p-3.5 min-w-[280px]">Rotinas / Conclusão & Checklist</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredVisitas.map((v) => {
                      const atrasada = isVisitaAtrasada(v)
                      const pObj = promotores.find((p) => p.id === v.promotor)
                      const fObj = fornecedores.find((f) => f.id === pObj?.fornecedor)
                      const lObj = lojas.find((l) => l.id === v.loja)

                      // Resolução de foto de gôndola/trabalho da visita ou do fornecedor
                      const fotoGondolaVisita = v.foto_gondola || v.foto_trabalho
                      const fotoGondolaUrl = fotoGondolaVisita
                        ? `${pbBase}/api/files/visitas_promotor/${v.id}/${fotoGondolaVisita}`
                        : fObj?.layout_foto
                          ? `${pbBase}/api/files/fornecedores/${fObj.id}/${fObj.layout_foto}`
                          : null

                      const fotoAbastecimentoVisita = v.foto_abastecimento || v.foto_trabalho
                      const fotoAbastecimentoUrl = fotoAbastecimentoVisita
                        ? `${pbBase}/api/files/visitas_promotor/${v.id}/${fotoAbastecimentoVisita}`
                        : null

                      const fotoValidadesVisita = v.foto_validades || v.foto_trabalho
                      const fotoValidadesUrl = fotoValidadesVisita
                        ? `${pbBase}/api/files/visitas_promotor/${v.id}/${fotoValidadesVisita}`
                        : null

                      // Status dos 3 critérios
                      const hasLayoutConforme = !!v.checklist_layout_conforme
                      const hasAbastecimento100 = !!v.checklist_abastecimento_100
                      const hasValidadesOk = !!v.checklist_validades_ok

                      return (
                        <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5">
                            {v.status === 'realizada' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>REALIZADA</span>
                              </span>
                            ) : v.status === 'cancelada' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>CANCELADA</span>
                              </span>
                            ) : atrasada ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-[#B91C1C] border border-red-200 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>ATRASADA</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>AGENDADA</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-medium text-[#1F2937]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                              <span>{v.data_visita ? v.data_visita.substring(0, 10) : '-'}</span>
                            </div>
                            {v.hora_prevista && (
                              <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{v.hora_prevista}</span>
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-[#1F2937]">
                              {pObj?.nome || v.expand?.promotor?.nome || 'Promotor'}
                            </div>
                            <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>
                                {fObj?.nome ||
                                  v.expand?.promotor?.expand?.fornecedor?.nome ||
                                  'Fornecedor'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 text-[#4B5563]">
                            <div className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-[#6B7280]" />
                              <span className="font-medium text-[#1F2937]">
                                {lObj?.nome || v.expand?.loja?.nome || '-'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 text-[#4B5563] max-w-sm">
                            <div className="space-y-1.5">
                              {/* Resumo da Conclusão */}
                              {v.conclusao_check ? (
                                <div
                                  className="text-xs text-[#1F2937] font-medium line-clamp-2"
                                  title={v.conclusao_check}
                                >
                                  {v.conclusao_check}
                                </div>
                              ) : v.observacoes ? (
                                <span
                                  className="text-xs text-[#6B7280] italic truncate block"
                                  title={v.observacoes}
                                >
                                  {v.observacoes}
                                </span>
                              ) : null}

                              {/* CRITÉRIOS DO CHECKLIST CLICÁVEIS (Requisito 1) */}
                              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                {/* 1. Layout / Gôndola Conforme */}
                                {hasLayoutConforme ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (fotoGondolaUrl) {
                                        setFotoModalState({
                                          isOpen: true,
                                          fotoUrl: fotoGondolaUrl,
                                          titulo: `Gôndola / Layout: ${fObj?.nome || 'Fornecedor'}`,
                                          subtitulo: `Comprovação de exposição na loja ${lObj?.nome || 'Loja'}`,
                                          dataHora: v.data_visita
                                            ? v.data_visita.substring(0, 10)
                                            : undefined,
                                        })
                                      } else {
                                        setVisitaParaConcluir(v)
                                        setFocoCriterio('layout')
                                        setConcluirModalOpen(true)
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs"
                                    title={
                                      fotoGondolaUrl
                                        ? 'Critério atendido com foto! Toque para ver a foto em tela cheia com zoom'
                                        : 'Layout atendido. Toque para anexar foto ou editar'
                                    }
                                  >
                                    {fotoGondolaUrl && (
                                      <Camera className="w-3 h-3 text-amber-700" />
                                    )}
                                    <span>Layout/Gôndola Conforme</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVisitaParaConcluir(v)
                                      setFocoCriterio('layout')
                                      setConcluirModalOpen(true)
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 font-normal hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                                    title="Não feito: toque para preencher critério e anexar foto"
                                  >
                                    <span>+ Gôndola</span>
                                  </button>
                                )}

                                {/* 2. Abastecido 100% */}
                                {hasAbastecimento100 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (fotoAbastecimentoUrl) {
                                        setFotoModalState({
                                          isOpen: true,
                                          fotoUrl: fotoAbastecimentoUrl,
                                          titulo: `Abastecimento 100%: ${fObj?.nome || 'Fornecedor'}`,
                                          subtitulo: `Comprovação de abastecimento na loja ${lObj?.nome || 'Loja'}`,
                                          dataHora: v.data_visita
                                            ? v.data_visita.substring(0, 10)
                                            : undefined,
                                        })
                                      } else {
                                        setVisitaParaConcluir(v)
                                        setFocoCriterio('abastecimento')
                                        setConcluirModalOpen(true)
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-colors shadow-2xs ${
                                      fotoAbastecimentoUrl
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold hover:bg-emerald-100'
                                        : 'border-emerald-200 bg-emerald-50/60 text-emerald-800 font-medium hover:bg-emerald-100'
                                    }`}
                                    title={
                                      fotoAbastecimentoUrl
                                        ? 'Abastecimento com foto! Toque para ver em tela cheia com zoom'
                                        : 'Abastecimento atendido. Toque para anexar foto ou editar'
                                    }
                                  >
                                    {fotoAbastecimentoUrl && (
                                      <Camera className="w-3 h-3 text-emerald-700" />
                                    )}
                                    <span>Abastecido 100%</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVisitaParaConcluir(v)
                                      setFocoCriterio('abastecimento')
                                      setConcluirModalOpen(true)
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 font-normal hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                                    title="Não feito: toque para preencher critério e anexar foto"
                                  >
                                    <span>+ Abastecimento</span>
                                  </button>
                                )}

                                {/* 3. Validades OK */}
                                {hasValidadesOk ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (fotoValidadesUrl) {
                                        setFotoModalState({
                                          isOpen: true,
                                          fotoUrl: fotoValidadesUrl,
                                          titulo: `Validades Auditadas: ${fObj?.nome || 'Fornecedor'}`,
                                          subtitulo: `Auditoria de validades na loja ${lObj?.nome || 'Loja'}`,
                                          dataHora: v.data_visita
                                            ? v.data_visita.substring(0, 10)
                                            : undefined,
                                        })
                                      } else {
                                        setVisitaParaConcluir(v)
                                        setFocoCriterio('validades')
                                        setConcluirModalOpen(true)
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-colors shadow-2xs ${
                                      fotoValidadesUrl
                                        ? 'border-blue-300 bg-blue-50 text-blue-900 font-bold hover:bg-blue-100'
                                        : 'border-blue-200 bg-blue-50/60 text-blue-800 font-medium hover:bg-blue-100'
                                    }`}
                                    title={
                                      fotoValidadesUrl
                                        ? 'Validades com foto! Toque para ver em tela cheia com zoom'
                                        : 'Validades atendidas. Toque para anexar foto ou editar'
                                    }
                                  >
                                    {fotoValidadesUrl && (
                                      <Camera className="w-3 h-3 text-blue-700" />
                                    )}
                                    <span>Validades OK</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVisitaParaConcluir(v)
                                      setFocoCriterio('validades')
                                      setConcluirModalOpen(true)
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 font-normal hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                                    title="Não feito: toque para preencher critério e anexar foto"
                                  >
                                    <span>+ Validades</span>
                                  </button>
                                )}
                              </div>

                              {/* Indicadores de Loja da Visita */}
                              {(v.quantidade_sortimento !== undefined ||
                                v.perc_vendas !== undefined) && (
                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 flex-wrap">
                                  {v.quantidade_sortimento !== undefined && (
                                    <span>
                                      Sortimento: <b>{v.quantidade_sortimento} itens</b>
                                    </span>
                                  )}
                                  {v.perc_vendas !== undefined && (
                                    <span>
                                      Vendas: <b>{v.perc_vendas}%</b>
                                    </span>
                                  )}
                                  {v.qtd_rupturas !== undefined && v.qtd_rupturas > 0 && (
                                    <span className="text-red-600 font-semibold">
                                      Rupturas: {v.qtd_rupturas}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Link direto para a foto geral do trabalho se existir */}
                              {v.foto_trabalho && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = `${pbBase}/api/files/visitas_promotor/${v.id}/${v.foto_trabalho}`
                                    setFotoModalState({
                                      isOpen: true,
                                      fotoUrl: url,
                                      titulo: `Foto da Visita: ${pObj?.nome || 'Promotor'}`,
                                      subtitulo: `Loja ${lObj?.nome || 'Loja'} - ${v.data_visita ? v.data_visita.substring(0, 10) : ''}`,
                                      dataHora: v.data_visita
                                        ? v.data_visita.substring(0, 10)
                                        : undefined,
                                    })
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline font-semibold mt-0.5"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>Ver foto do trabalho em tela cheia</span>
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* Botão de Aviso ao Comprador quando houver atraso ou ausência */}
                              {atrasada && fObj?.comprador_telefone && (
                                <a
                                  href={buildWhatsAppLink(
                                    fObj.comprador_telefone,
                                    `Olá, ${fObj.comprador_nome || 'Gestor'}. Aviso da loja ${lObj?.nome || 'Supermercado'}: O promotor ${pObj?.nome || 'representante'} do fornecedor ${fObj.nome} estava agendado para hoje às ${v.hora_prevista || 'horário comercial'} e até o momento NÃO compareceu à visita. Favor alinhar com a indústria.`,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-semibold border border-amber-300 transition-colors"
                                  title="Avisar Comprador/Gestor da Categoria via WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-amber-700" />
                                  <span className="hidden sm:inline">Avisar Comprador</span>
                                </a>
                              )}

                              {v.status !== 'realizada' && v.status !== 'cancelada' && (
                                <button
                                  onClick={() => {
                                    setVisitaParaConcluir(v)
                                    setFocoCriterio('geral')
                                    setConcluirModalOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition-colors border border-emerald-200"
                                  title="Avaliar e concluir visita"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Avaliar/Concluir</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingVisita(v)
                                  setAgendarModalOpen(true)
                                }}
                                className="p-1.5 text-[#4B5563] hover:text-[#2563EB] rounded hover:bg-gray-100"
                                title="Editar visita"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {v.status !== 'cancelada' && v.status !== 'realizada' && (
                                <button
                                  onClick={() => {
                                    const mot = prompt('Motivo do cancelamento (opcional):')
                                    if (mot !== null) {
                                      onCancelarVisita(v.id, mot)
                                    }
                                  }}
                                  className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                  title="Cancelar visita"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm('Deseja excluir este registro de visita?')) {
                                    onDeleteVisita(v.id)
                                  }
                                }}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir visita"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= ABA PROMOTORES ======================= */}
      {subTab === 'promotores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 border border-[#E5E7EB] rounded-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email, telefone ou fornecedor..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F7F5] border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
              <select
                value={filterFornecedor}
                onChange={(e) => setFilterFornecedor(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F5] border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="todos">Todos Fornecedores</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPromotores.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
              <UserCheck className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">Nenhum promotor cadastrado.</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Cadastre promotores vinculados aos fornecedores para agendar roteiros de
                atendimento.
              </p>
              {fornecedores.length > 0 && (
                <button
                  onClick={() => {
                    setEditingPromotor(null)
                    setPromotorModalOpen(true)
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Promotor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="sm:hidden flex items-center justify-between text-[11px] text-[#6B7280] px-1">
                <span className="flex items-center gap-1 font-medium text-[#2563EB]">
                  <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
                  <span>Deslize a tabela para o lado</span>
                </span>
                <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                  {filteredPromotores.length} promotores
                </span>
              </div>
              <div className="scrollbar-thin-horizontal bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Promotor</th>
                      <th className="p-3.5 whitespace-nowrap">Fornecedor / Indústria</th>
                      <th className="p-3.5 whitespace-nowrap">Contato</th>
                      <th className="p-3.5 whitespace-nowrap">Status</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredPromotores.map((p) => {
                      const fObj = fornecedores.find((f) => f.id === p.fornecedor)
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
                                {p.nome.slice(0, 2).toUpperCase()}
                              </div>
                              <span>{p.nome}</span>
                            </div>
                          </td>

                          <td className="p-3.5 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-[#374151]">
                              <Building2 className="w-3 h-3 text-[#6B7280]" />
                              <span>{fObj?.nome || p.expand?.fornecedor?.nome || '-'}</span>
                            </span>
                          </td>

                          <td className="p-3.5 text-[#4B5563]">
                            <div className="space-y-0.5">
                              {p.telefone && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Phone className="w-3 h-3 text-[#6B7280]" />
                                  <span>{p.telefone}</span>
                                </div>
                              )}
                              {p.email && (
                                <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                                  <Mail className="w-3 h-3" />
                                  <span>{p.email}</span>
                                </div>
                              )}
                              {!p.telefone && !p.email && <span className="text-gray-400">-</span>}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {p.ativo !== false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                                Inativo
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingPromotor(p)
                                  setPromotorModalOpen(true)
                                }}
                                className="p-1.5 text-[#4B5563] hover:text-[#2563EB] rounded hover:bg-gray-100"
                                title="Editar promotor"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeletePromotor(p)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir promotor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= ABA FORNECEDORES ======================= */}
      {subTab === 'fornecedores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2.5 bg-white p-3 border border-[#E5E7EB] rounded-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar fornecedores por razão social ou contato..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F7F5] border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
          </div>

          {filteredFornecedores.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
              <Building2 className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">Nenhum fornecedor cadastrado.</p>
              <button
                onClick={() => {
                  setEditingFornecedor(null)
                  setFornecedorModalOpen(true)
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Fornecedor</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="sm:hidden flex items-center justify-between text-[11px] text-[#6B7280] px-1">
                <span className="flex items-center gap-1 font-medium text-[#2563EB]">
                  <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
                  <span>Deslize a tabela para o lado</span>
                </span>
                <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                  {filteredFornecedores.length} fornecedores
                </span>
              </div>
              <div className="scrollbar-thin-horizontal bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Fornecedor / Indústria</th>
                      <th className="p-3.5 whitespace-nowrap">Comprador / Gestor</th>
                      <th className="p-3.5 whitespace-nowrap">Layout & Frequência</th>
                      <th className="p-3.5 whitespace-nowrap">Política de Quebras</th>
                      <th className="p-3.5 whitespace-nowrap">Status</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredFornecedores.map((f) => {
                      return (
                        <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{f.nome}</span>
                                </div>
                                <div className="text-xs text-[#6B7280] font-normal">
                                  {f.telefone || f.contato || 'Sem contato indústria'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Comprador / Gestor de Categoria (Frente 2) */}
                          <td className="p-3.5 text-[#4B5563]">
                            {f.comprador_nome ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-xs text-[#1F2937] flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                                  <span>{f.comprador_nome}</span>
                                </div>
                                {f.comprador_categoria && (
                                  <div className="text-[11px] text-[#2563EB]">
                                    {f.comprador_categoria}
                                  </div>
                                )}
                                {f.comprador_telefone && (
                                  <a
                                    href={buildWhatsAppLink(
                                      f.comprador_telefone,
                                      `Olá, ${f.comprador_nome}. Contato da loja referente ao fornecedor ${f.nome}: `,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-mono"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{formatPhoneBR(f.comprador_telefone)}</span>
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Não informado</span>
                            )}
                          </td>

                          {/* Layout & Frequência (Frente 2) */}
                          <td className="p-3.5 text-[#4B5563] max-w-xs">
                            <div className="space-y-1">
                              {f.frequencia_semanal && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-[#374151]">
                                  <Clock className="w-3 h-3 text-[#6B7280]" />
                                  <span>{f.frequencia_semanal}</span>
                                </div>
                              )}
                              {f.layout_descricao ? (
                                <p
                                  className="text-xs text-[#6B7280] line-clamp-2"
                                  title={f.layout_descricao}
                                >
                                  {f.layout_descricao}
                                </p>
                              ) : (
                                <span className="text-xs text-gray-400 block">
                                  Layout não descrito
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Política de Quebras (Frente 2) */}
                          <td className="p-3.5">
                            {f.politica_quebras === 'troca_total' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Troca Total (100%)
                              </span>
                            ) : f.politica_quebras === 'troca_parcial' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Troca Parcial
                              </span>
                            ) : f.politica_quebras === 'sem_troca_avaria_loja' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                Sem Troca (Loja)
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">A definir</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {f.ativo !== false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                                Inativo
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingFornecedor(f)
                                  setFornecedorModalOpen(true)
                                }}
                                className="p-1.5 text-[#4B5563] hover:text-[#2563EB] rounded hover:bg-gray-100"
                                title="Editar fornecedor"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteFornecedor(f)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir fornecedor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= ABA ROTINAS PADRÃO DE PROMOTOR ======================= */}
      {subTab === 'rotinas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2.5 bg-white p-3 border border-[#E5E7EB] rounded-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar rotinas de trabalho dos promotores..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F7F5] border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
          </div>

          {filteredRotinas.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
              <Layers className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">
                Nenhuma rotina de promotor cadastrada.
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Defina checklists padrão (ex: abastecimento, precificação, conferência de validades)
                que os promotores marcam ao concluir visitas.
              </p>
              <button
                onClick={() => {
                  setEditingRotina(null)
                  setRotinaModalOpen(true)
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Rotina de Promotor</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="sm:hidden flex items-center justify-between text-[11px] text-[#6B7280] px-1">
                <span className="flex items-center gap-1 font-medium text-[#2563EB]">
                  <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
                  <span>Deslize a tabela para o lado</span>
                </span>
                <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                  {filteredRotinas.length} rotinas
                </span>
              </div>
              <div className="scrollbar-thin-horizontal bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Título da Rotina (Item Padrão)</th>
                      <th className="p-3.5 whitespace-nowrap">Frequência</th>
                      <th className="p-3.5 whitespace-nowrap">Fornecedor / Loja</th>
                      <th className="p-3.5 min-w-[200px]">Descrição</th>
                      <th className="p-3.5 whitespace-nowrap">Status</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredRotinas.map((r, idx) => {
                      const fObj = fornecedores.find((f) => f.id === r.fornecedor)
                      const lObj = lojas.find((l) => l.id === r.loja)

                      // REGRA DO REQUISITO 2:
                      // Primeiro item da rotina padrão do promotor (idx === 0) ou rotina com foto
                      const isPrimeiroItem = idx === 0
                      const hasFoto = !!r.foto_trabalho
                      const rotinaFotoUrl = hasFoto
                        ? `${pbBase}/api/files/rotinas_promotor/${r.id}/${r.foto_trabalho}`
                        : null

                      return (
                        <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Título com regra visual do Requisito 2:
                            - com foto/executado -> NEGRITO e toque abre a foto
                            - sem foto/não feito -> SEM NEGRITO e toque abre o campo para preencher/anexar */}
                          <td className="p-3.5 text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-[#2563EB] shrink-0" />

                              {hasFoto ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (rotinaFotoUrl) {
                                      setFotoModalState({
                                        isOpen: true,
                                        fotoUrl: rotinaFotoUrl,
                                        titulo: r.titulo,
                                        subtitulo: `Foto de execução da rotina (${fObj?.nome || 'Fornecedor'})`,
                                      })
                                    }
                                  }}
                                  className="font-bold text-[#1F2937] hover:text-[#2563EB] inline-flex items-center gap-1.5 transition-colors text-left"
                                  title="Rotina com foto de trabalho: toque para ver em tela cheia com zoom"
                                >
                                  <span>{r.titulo}</span>
                                  <Camera className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRotina(r)
                                    setRotinaModalOpen(true)
                                  }}
                                  className="font-normal text-[#4B5563] hover:text-[#2563EB] text-left transition-colors"
                                  title="Sem foto de trabalho: toque para editar e anexar a foto do trabalho"
                                >
                                  <span>{r.titulo}</span>
                                  {isPrimeiroItem && (
                                    <span className="ml-1 text-[10px] text-[#2563EB] font-medium bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                      + Anexar Foto
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-xs font-medium">
                              <Clock className="w-3 h-3 text-[#6B7280]" />
                              <span>{r.frequencia || 'Em cada visita'}</span>
                            </span>
                          </td>

                          <td className="p-3.5 text-[#4B5563]">
                            <div className="space-y-0.5 text-xs">
                              <div>{fObj ? fObj.nome : 'Todos os fornecedores'}</div>
                              {lObj && (
                                <div className="text-[11px] text-[#6B7280]">Loja: {lObj.nome}</div>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-[#6B7280] max-w-xs truncate">
                            {r.descricao || '-'}
                          </td>

                          <td className="p-3.5">
                            {r.ativa !== false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                                Inativa
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingRotina(r)
                                  setRotinaModalOpen(true)
                                }}
                                className="p-1.5 text-[#4B5563] hover:text-[#2563EB] rounded hover:bg-gray-100"
                                title="Editar rotina"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteRotinaPromotor(r)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir rotina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modais de Gestão */}
      <AgendarVisitaModal
        open={agendarModalOpen}
        onOpenChange={setAgendarModalOpen}
        data={editingVisita}
        promotores={promotores.filter((p) => p.ativo !== false)}
        lojas={lojas}
        onSave={(payload) => onSaveVisita(payload, editingVisita?.id)}
      />

      <ConcluirVisitaModal
        open={concluirModalOpen}
        onOpenChange={setConcluirModalOpen}
        visita={visitaParaConcluir}
        rotinasDisponiveis={rotinasPromotor.filter((r) => r.ativa !== false)}
        focoInicial={focoCriterio}
        onConcluir={(params) => {
          if (!visitaParaConcluir) return Promise.resolve()
          return onConcluirVisita(visitaParaConcluir.id, params)
        }}
      />

      <PromotorModal
        open={promotorModalOpen}
        onOpenChange={setPromotorModalOpen}
        data={editingPromotor}
        fornecedores={fornecedores}
        usuarios={usuarios}
        onSave={(payload) => onSavePromotor(payload, editingPromotor?.id)}
      />

      <FornecedorModal
        open={fornecedorModalOpen}
        onOpenChange={setFornecedorModalOpen}
        data={editingFornecedor}
        clientes={clientes}
        onSave={(payload) => onSaveFornecedor(payload, editingFornecedor?.id)}
      />

      <RotinaPromotorModal
        open={rotinaModalOpen}
        onOpenChange={setRotinaModalOpen}
        data={editingRotina}
        fornecedores={fornecedores}
        lojas={lojas}
        onSave={(payload) => onSaveRotinaPromotor(payload, editingRotina?.id)}
      />

      {/* Visualizador de Foto em Tela Cheia com Zoom (Reutilizando FotoVisualizadorModal) */}
      <FotoVisualizadorModal
        isOpen={fotoModalState.isOpen}
        fotoUrl={fotoModalState.fotoUrl}
        titulo={fotoModalState.titulo}
        subtitulo={fotoModalState.subtitulo}
        dataHora={fotoModalState.dataHora}
        onClose={() => setFotoModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
