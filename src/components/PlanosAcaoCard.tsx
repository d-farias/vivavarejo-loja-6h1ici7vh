import React, { useState, useMemo } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Store,
  Edit2,
  Trash2,
  ArrowRight,
  MoreVertical,
  Layers,
} from 'lucide-react'
import type { PlanoAcao, Loja, Rotina, StatusPlanoAcao } from '@/types'
import { normalizarNomeCanonico, getChaveCanonico } from '@/lib/cargos'

interface PlanosAcaoCardProps {
  planos: PlanoAcao[]
  lojas: Loja[]
  rotinas?: Rotina[]
  onNewPlano: () => void
  onEditPlano: (plano: PlanoAcao) => void
  onDeletePlano: (plano: PlanoAcao) => void
  onToggleStatus: (plano: PlanoAcao, nextStatus: StatusPlanoAcao) => void
  selectedLojaId?: string
  title?: string
  subtitle?: string
  allowFilterLoja?: boolean
  selectedAreaDemandante?: string
}

export function isPlanoAtrasado(plano: PlanoAcao): boolean {
  if (plano.status === 'concluida') return false
  if (!plano.prazo) return false
  const prazoDate = new Date(plano.prazo)
  const now = new Date()
  return prazoDate.getTime() < now.getTime()
}

export const PlanosAcaoCard: React.FC<PlanosAcaoCardProps> = ({
  planos,
  lojas,
  onNewPlano,
  onEditPlano,
  onDeletePlano,
  onToggleStatus,
  selectedLojaId,
  title = 'Chamados de Manutenção & Planos de Ação',
  subtitle = 'Chamados por área demandante (Compras, Logística, Manutenção) e ações 5W2H',
  allowFilterLoja = false,
  selectedAreaDemandante,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [areaFilter, setAreaFilter] = useState<string>(selectedAreaDemandante || 'todas')
  const [localLojaFilter, setLocalLojaFilter] = useState<string>(selectedLojaId || 'todas')

  // Filtros aplicados
  const filteredPlanos = useMemo(() => {
    return planos.filter((p) => {
      // Filtro de Loja
      if (allowFilterLoja && localLojaFilter !== 'todas' && p.loja !== localLojaFilter) {
        return false
      }
      // Filtro de Área Demandante
      if (areaFilter !== 'todas') {
        const pArea = p.area_demandante || 'Operações'
        const chaveFiltro = getChaveCanonico(areaFilter)
        const chaveArea = getChaveCanonico(pArea)
        if (chaveFiltro !== chaveArea && pArea !== areaFilter) return false
      }
      // Filtro de Status
      if (statusFilter === 'abertas') {
        if (p.status !== 'aberta' && p.status !== 'em_andamento') return false
      } else if (statusFilter === 'concluidas') {
        if (p.status !== 'concluida') return false
      } else if (statusFilter === 'atrasadas') {
        if (!isPlanoAtrasado(p)) return false
      }

      // Busca
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchDesc = p.descricao.toLowerCase().includes(q)
        const areaNorm = normalizarNomeCanonico(p.area_demandante).toLowerCase()
        const respNorm = normalizarNomeCanonico(p.responsavel).toLowerCase()
        const matchArea = p.area_demandante?.toLowerCase().includes(q) || areaNorm.includes(q)
        const matchResp = p.responsavel?.toLowerCase().includes(q) || respNorm.includes(q)
        const matchObs = p.observacoes?.toLowerCase().includes(q)
        const matchLoja = p.expand?.loja?.nome?.toLowerCase().includes(q)
        const matchRotina = p.expand?.rotina?.nome?.toLowerCase().includes(q)
        if (!matchDesc && !matchArea && !matchResp && !matchObs && !matchLoja && !matchRotina)
          return false
      }

      return true
    })
  }, [planos, allowFilterLoja, localLojaFilter, areaFilter, statusFilter, searchTerm])

  // KPIs
  const kpis = useMemo(() => {
    let abertas = 0
    let atrasadas = 0
    let concluidas = 0

    planos.forEach((p) => {
      if (p.status === 'concluida') {
        concluidas++
      } else {
        abertas++
        if (isPlanoAtrasado(p)) {
          atrasadas++
        }
      }
    })

    return { abertas, atrasadas, concluidas, total: planos.length }
  }, [planos])

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
      {/* Header com KPIs e Botão Nova Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <span>{title}</span>
                {kpis.atrasadas > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#B91C1C] animate-pulse">
                    {kpis.atrasadas} em atraso
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#6B7280]">{subtitle}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewPlano}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Ação</span>
        </button>
      </div>

      {/* Mini KPIs rápidos */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === 'abertas' ? 'todos' : 'abertas'))}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'abertas'
              ? 'border-[#2563EB] bg-[#3B82F6]/5 ring-1 ring-[#2563EB]'
              : 'border-[#E5E7EB] bg-[#F7F7F5]/50 hover:bg-white'
          }`}
        >
          <div className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Abertas</span>
            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F2937] mt-1">{kpis.abertas}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === 'atrasadas' ? 'todos' : 'atrasadas'))}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'atrasadas'
              ? 'border-red-400 bg-red-50 ring-1 ring-red-400'
              : kpis.atrasadas > 0
                ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                : 'border-[#E5E7EB] bg-[#F7F7F5]/50 hover:bg-white'
          }`}
        >
          <div className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span className={kpis.atrasadas > 0 ? 'text-[#B91C1C] font-semibold' : ''}>
              Atrasadas
            </span>
            <AlertTriangle
              className={`w-3.5 h-3.5 ${kpis.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-gray-400'}`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold mt-1 ${
              kpis.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
            }`}
          >
            {kpis.atrasadas}
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter((prev) => (prev === 'concluidas' ? 'todos' : 'concluidas'))
          }
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'concluidas'
              ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
              : 'border-[#E5E7EB] bg-[#F7F7F5]/50 hover:bg-white'
          }`}
        >
          <div className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Concluídas</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F2937] mt-1">{kpis.concluidas}</div>
        </button>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ação, responsável, loja..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {allowFilterLoja && lojas.length > 0 && (
            <select
              value={localLojaFilter}
              onChange={(e) => setLocalLojaFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              <option value="todas">Todas as Lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          )}

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            title="Filtrar por Área Demandante"
          >
            <option value="todas">Todas as Áreas</option>
            <option value="Compras">Compras</option>
            <option value="Abastecimento">Abastecimento</option>
            <option value="RH">RH</option>
            <option value="Marketing">Marketing</option>
            <option value="Logística">Logística</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Operações">Operações</option>
            <option value="Prevenção de Perdas">Prevenção de Perdas</option>
            <option value="Manutenção">Manutenção</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
          >
            <option value="todos">Todos os Status</option>
            <option value="abertas">Abertas / Em Andamento</option>
            <option value="atrasadas">Apenas Atrasadas</option>
            <option value="concluidas">Apenas Concluídas</option>
          </select>

          {(searchTerm ||
            statusFilter !== 'todos' ||
            areaFilter !== 'todas' ||
            (allowFilterLoja && localLojaFilter !== 'todas')) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('todos')
                setAreaFilter('todas')
                setLocalLojaFilter('todas')
              }}
              className="text-xs text-[#2563EB] hover:underline whitespace-nowrap"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Ações */}
      {filteredPlanos.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#6B7280] bg-[#F7F7F5]/40 rounded-lg border border-dashed border-[#E5E7EB]">
          <CheckSquare className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
          <p className="font-medium text-[#1F2937]">Nenhuma ação encontrada</p>
          <p className="mt-0.5 text-[#6B7280]">
            Clique em "Nova Ação" ou converta uma rotina atrasada para criar um plano.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden">
          {filteredPlanos.map((plano) => {
            const isDone = plano.status === 'concluida'
            const atrasado = isPlanoAtrasado(plano)

            return (
              <div
                key={plano.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isDone
                    ? 'bg-gray-50/60 opacity-70'
                    : atrasado
                      ? 'bg-red-50/25 border-l-4 border-l-[#B91C1C]'
                      : 'bg-white hover:bg-[#F7F7F5]/50'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-[#6B7280]' : 'text-[#1F2937]'
                      }`}
                    >
                      {plano.area_demandante ? `[${plano.area_demandante}] ` : ''}
                      {plano.descricao}
                    </span>

                    {/* Área Demandante Badge */}
                    {plano.area_demandante && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                        {normalizarNomeCanonico(plano.area_demandante)}
                      </span>
                    )}

                    {/* Prioridade */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        plano.prioridade === 'alta'
                          ? 'bg-red-100 text-[#B91C1C]'
                          : plano.prioridade === 'media'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {plano.prioridade}
                    </span>

                    {/* Status / Atraso */}
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluída
                      </span>
                    ) : atrasado ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B91C1C] bg-red-100 px-2 py-0.5 rounded border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        ATRASADA
                      </span>
                    ) : plano.status === 'em_andamento' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Clock className="w-3 h-3" />
                        Em andamento
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        Aberta
                      </span>
                    )}
                  </div>

                  {/* Metadados: Loja, Responsável, Prazo, Rotina */}
                  <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
                    {plano.expand?.loja && (
                      <span className="flex items-center gap-1 font-medium text-[#374151]">
                        <Store className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{plano.expand.loja.nome}</span>
                      </span>
                    )}

                    {plano.responsavel && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{normalizarNomeCanonico(plano.responsavel)}</span>
                      </span>
                    )}

                    {plano.prazo && (
                      <span
                        className={`flex items-center gap-1 ${
                          atrasado ? 'font-bold text-[#B91C1C]' : 'text-[#6B7280]'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Prazo: {new Date(plano.prazo).toLocaleDateString('pt-BR')}</span>
                      </span>
                    )}

                    {plano.expand?.rotina && (
                      <span className="flex items-center gap-1 text-[11px] bg-blue-50/70 text-[#2563EB] px-1.5 py-0.5 rounded border border-blue-100">
                        <Layers className="w-3 h-3" />
                        <span>Rotina: {plano.expand.rotina.nome}</span>
                      </span>
                    )}
                  </div>

                  {plano.observacoes && (
                    <p className="text-[11px] text-[#4B5563] bg-[#F7F7F5] p-2 rounded border border-[#E5E7EB]">
                      {plano.observacoes}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onToggleStatus(plano, isDone ? 'em_andamento' : 'concluida')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      isDone
                        ? 'border border-[#E5E7EB] hover:bg-gray-100 text-[#4B5563]'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={isDone ? 'Reabrir ação' : 'Concluir ação'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isDone ? 'Reabrir' : 'Concluir'}</span>
                  </button>

                  <button
                    onClick={() => onEditPlano(plano)}
                    className="p-1.5 text-[#4B5563] hover:text-[#2563EB] hover:bg-gray-100 rounded-md transition-colors"
                    title="Editar ação"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeletePlano(plano)}
                    className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir ação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
