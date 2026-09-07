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
  FileText,
  Trash2,
  Edit2,
  Layers,
  Phone,
  Mail,
} from 'lucide-react'
import { PromotorModal } from '@/components/PromotorModal'
import { FornecedorModal } from '@/components/FornecedorModal'
import { AgendarVisitaModal } from '@/components/AgendarVisitaModal'
import { ConcluirVisitaModal } from '@/components/ConcluirVisitaModal'
import { RotinaPromotorModal } from '@/components/RotinaPromotorModal'

interface PromotoresFornecedoresManagerProps {
  visitas: VisitaPromotor[]
  promotores: Promotor[]
  fornecedores: Fornecedor[]
  lojas: Loja[]
  rotinasPromotor: RotinaPromotor[]
  onRefresh: () => Promise<void>
  onSaveVisita: (payload: Partial<VisitaPromotor>, id?: string) => Promise<void>
  onConcluirVisita: (
    visitaId: string,
    params: { conclusao_check: string; rotinas_executadas?: string },
  ) => Promise<void>
  onCancelarVisita: (visitaId: string, motivo?: string) => Promise<void>
  onDeleteVisita: (visitaId: string) => Promise<void>
  onSavePromotor: (payload: Partial<Promotor>, id?: string) => Promise<void>
  onDeletePromotor: (promotor: Promotor) => Promise<void>
  onSaveFornecedor: (payload: Partial<Fornecedor>, id?: string) => Promise<void>
  onDeleteFornecedor: (fornecedor: Fornecedor) => Promise<void>
  onSaveRotinaPromotor: (payload: Partial<RotinaPromotor>, id?: string) => Promise<void>
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

  const [promotorModalOpen, setPromotorModalOpen] = useState(false)
  const [editingPromotor, setEditingPromotor] = useState<Promotor | null>(null)

  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)

  const [rotinaModalOpen, setRotinaModalOpen] = useState(false)
  const [editingRotina, setEditingRotina] = useState<RotinaPromotor | null>(null)

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
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              setSubTab('visitas')
              setSearchTerm('')
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              subTab === 'visitas'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Visitas em Loja ({visitas.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('promotores')
              setSearchTerm('')
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              subTab === 'promotores'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Promotores ({promotores.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('fornecedores')
              setSearchTerm('')
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              subTab === 'fornecedores'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Fornecedores ({fornecedores.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('rotinas')
              setSearchTerm('')
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              subTab === 'rotinas'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <Layers className="w-4 h-4" />
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
            <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Visitas da Semana</span>
                <Calendar className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="mt-1 text-2xl font-bold text-[#1F2937]">{kpis.daSemana}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                {kpis.total} registradas no total
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Realizadas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">{kpis.realizadas}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">Taxa: {kpis.taxaRealizacao}%</div>
            </div>

            <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Atrasadas</span>
                <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
              </div>
              <div className="mt-1 text-2xl font-bold text-[#B91C1C]">{kpis.atrasadas}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">Prazo expirado sem check</div>
            </div>

            <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Agendadas</span>
                <Clock className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="mt-1 text-2xl font-bold text-[#2563EB]">{kpis.agendadas}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">Aguardando atendimento</div>
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

          {/* Tabela de Visitas */}
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
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Data & Hora</th>
                    <th className="p-3.5">Promotor / Fornecedor</th>
                    <th className="p-3.5">Loja</th>
                    <th className="p-3.5">Rotinas / Conclusão</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredVisitas.map((v) => {
                    const atrasada = isVisitaAtrasada(v)
                    const pObj = promotores.find((p) => p.id === v.promotor)
                    const fObj = fornecedores.find((f) => f.id === pObj?.fornecedor)
                    const lObj = lojas.find((l) => l.id === v.loja)

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

                        <td className="p-3.5 text-[#4B5563] max-w-xs">
                          {v.conclusao_check ? (
                            <div className="space-y-1">
                              <div
                                className="text-xs text-[#1F2937] font-medium truncate"
                                title={v.conclusao_check}
                              >
                                {v.conclusao_check}
                              </div>
                              {v.rotinas_executadas && (
                                <div className="text-[11px] text-emerald-700 font-medium">
                                  ✓ Rotinas registradas
                                </div>
                              )}
                            </div>
                          ) : v.observacoes ? (
                            <span
                              className="text-xs text-[#6B7280] italic truncate block"
                              title={v.observacoes}
                            >
                              {v.observacoes}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            {v.status !== 'realizada' && v.status !== 'cancelada' && (
                              <button
                                onClick={() => {
                                  setVisitaParaConcluir(v)
                                  setConcluirModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition-colors border border-emerald-200"
                                title="Marcar visita como realizada"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Concluir</span>
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
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Promotor</th>
                    <th className="p-3.5">Fornecedor / Indústria</th>
                    <th className="p-3.5">Contato</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
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
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Fornecedor / Indústria</th>
                    <th className="p-3.5">Rede Vinculada</th>
                    <th className="p-3.5">Contato & Telefone</th>
                    <th className="p-3.5">Observações</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredFornecedores.map((f) => {
                    const cObj = clientes.find((c: any) => c.id === f.cliente)
                    return (
                      <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3.5 font-semibold text-[#1F2937]">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                            <span>{f.nome}</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-[#4B5563]">
                          {cObj ? (
                            <span className="text-xs font-medium text-[#1F2937]">{cObj.nome}</span>
                          ) : (
                            <span className="text-[11px] font-medium text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Multicliente (Geral)
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-[#4B5563]">
                          <div className="space-y-0.5">
                            {f.contato && <div className="text-xs">{f.contato}</div>}
                            {f.telefone && (
                              <div className="text-[11px] text-[#6B7280]">{f.telefone}</div>
                            )}
                            {!f.contato && !f.telefone && <span className="text-gray-400">-</span>}
                          </div>
                        </td>

                        <td className="p-3.5 text-[#6B7280] max-w-xs truncate">
                          {f.observacoes || '-'}
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
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Título da Rotina</th>
                    <th className="p-3.5">Frequência</th>
                    <th className="p-3.5">Fornecedor / Loja</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredRotinas.map((r) => {
                    const fObj = fornecedores.find((f) => f.id === r.fornecedor)
                    const lObj = lojas.find((l) => l.id === r.loja)

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3.5 font-semibold text-[#1F2937]">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#2563EB] shrink-0" />
                            <span>{r.titulo}</span>
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
    </div>
  )
}
