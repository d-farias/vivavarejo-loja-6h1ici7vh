import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService } from '@/services/rotinas'
import { funcionariosService } from '@/services/funcionarios'
import type { Rotina, Funcionario } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Clock,
  ShieldCheck,
  RefreshCw,
  Briefcase,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Store,
  Phone,
  Bookmark,
} from 'lucide-react'
import { formatPhoneBR } from '@/lib/phone-utils'
import { normalizarNomeCanonico, getChaveCanonico } from '@/lib/cargos'
import { Link } from 'react-router-dom'

interface AgendaMinhaEquipeSecaoProps {
  /** Se true, oculta o seletor de loja próprio e o título de cabeçalho h1 da página (usado quando embutido na Agenda) */
  embedded?: boolean
  /** Título customizado da seção quando embutido */
  tituloCustomizado?: string
}

export function AgendaMinhaEquipeSecao({
  embedded = false,
  tituloCustomizado = 'Agenda Minha Equipe',
}: AgendaMinhaEquipeSecaoProps) {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojaSelecionada } = useStore()
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // Estado para acordeão: inicia RECOLHIDO por solicitação textual do dono do produto
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [allRoutines, allFuncs] = await Promise.all([
        rotinasService.getAll(lojaSelecionadaId),
        lojaSelecionadaId && lojaSelecionadaId !== 'todas'
          ? funcionariosService.getByLoja(lojaSelecionadaId)
          : funcionariosService.getAll(),
      ])
      setRotinas(allRoutines)
      setFuncionarios(allFuncs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user, lojaSelecionadaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Agrupar colaboradores por função canônica
  const colaboradoresPorFuncao = useMemo(() => {
    const map = new Map<string, Funcionario[]>()
    funcionarios.forEach((fc) => {
      const raw = fc.expand?.funcao?.nome || 'Operação'
      const canonico = normalizarNomeCanonico(raw) || 'Operação'
      const chave = getChaveCanonico(canonico) || 'operacao'
      if (!map.has(chave)) {
        map.set(chave, [])
      }
      map.get(chave)!.push(fc)
    })
    return map
  }, [funcionarios])

  // Group routines by Area (or responsavel fallback) using unified canonical names
  // Unifica também com contagem de colaboradores da mesma função canônica
  const groupedData = useMemo(() => {
    const map = new Map<
      string,
      {
        chave: string
        funcaoNome: string
        items: Rotina[]
        colaboradores: Funcionario[]
      }
    >()

    rotinas.forEach((rotina) => {
      const raw = rotina.area || rotina.responsavel || 'Geral'
      const canonico = normalizarNomeCanonico(raw) || 'Geral'
      const chave = getChaveCanonico(canonico) || 'geral'

      if (!map.has(chave)) {
        map.set(chave, {
          chave,
          funcaoNome: canonico,
          items: [],
          colaboradores: colaboradoresPorFuncao.get(chave) || [],
        })
      }
      map.get(chave)!.items.push(rotina)
    })

    // Adiciona funções que têm funcionários mas eventualmente não têm rotinas cadastradas ainda
    colaboradoresPorFuncao.forEach((funcs, chave) => {
      if (!map.has(chave) && funcs.length > 0) {
        const canonico = normalizarNomeCanonico(funcs[0].expand?.funcao?.nome) || 'Outros'
        map.set(chave, {
          chave,
          funcaoNome: canonico,
          items: [],
          colaboradores: funcs,
        })
      }
    })

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        totalRotinas: group.items.length,
        totalColaboradores: group.colaboradores.length,
      }))
      .sort((a, b) => b.totalRotinas - a.totalRotinas || a.funcaoNome.localeCompare(b.funcaoNome))
  }, [rotinas, colaboradoresPorFuncao])

  const toggleGroup = (chave: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }))
  }

  const expandAll = () => {
    const next: Record<string, boolean> = {}
    groupedData.forEach((g) => {
      next[g.chave] = true
    })
    setExpandedKeys(next)
  }

  const collapseAll = () => {
    setExpandedKeys({})
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-gray-200" />
          <Skeleton className="h-4 w-72 bg-gray-200" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-[#E5E7EB] rounded-lg text-center space-y-3 shadow-xs">
        <p className="text-sm text-[#B91C1C] font-medium">
          Não foi possível carregar as rotinas da equipe. Tente novamente.
        </p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Título de Seção (quando embutido na Agenda) */}
      {embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] tracking-tight">
                {tituloCustomizado}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              {lojaSelecionada
                ? `Estrutura de equipe e rotinas para ${lojaSelecionada.nome}.`
                : 'Áreas, funções e responsáveis pelas rotinas operacionais.'}
            </p>
          </div>
        </div>
      )}

      {/* Membros da Equipe Cadastrados (se houver para a loja selecionada) */}
      {funcionarios.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
              Membros da equipe ({funcionarios.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {funcionarios.map((fc) => (
              <div
                key={fc.id}
                className="p-3 rounded-md border border-[#E5E7EB] bg-[#F7F7F5]/40 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#1F2937]">{fc.nome}</div>
                  <div className="text-xs text-[#2563EB] font-medium mt-0.5">
                    {normalizarNomeCanonico(fc.expand?.funcao?.nome) || 'Função operacional'}
                  </div>
                  {fc.expand?.funcao?.chefe_imediato_funcao && (
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      Chefe imediato:{' '}
                      {normalizarNomeCanonico(
                        fc.expand.funcao.expand?.chefe_imediato_funcao?.nome,
                      ) || 'Definido na função'}
                    </div>
                  )}
                  {fc.expand?.loja && (
                    <div className="text-xs text-[#6B7280] flex items-center gap-1 mt-1">
                      <Store className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{fc.expand.loja.nome}</span>
                    </div>
                  )}
                  {fc.telefone && (
                    <div className="text-xs text-gray-700 flex items-center gap-1 mt-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatPhoneBR(fc.telefone)}</span>
                    </div>
                  )}
                </div>
                {fc.ativo !== false ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ativo
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#6B7280]">
                    Inativo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Banner */}
      <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#3B82F6]/10 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1F2937]">
              {groupedData.length} Áreas operacionais mapeadas
            </div>
            <div className="text-xs text-[#6B7280]">
              Total de {rotinas.length}{' '}
              {rotinas.length === 1 ? 'rotina distribuída' : 'rotinas distribuídas'} entre funções
              de loja
            </div>
          </div>
        </div>

        <Link
          to="/rotinas"
          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1"
        >
          <span>Gerenciar rotinas</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Controles de visualização do Acordeão */}
      <div className="flex items-center justify-between gap-2 text-xs text-[#6B7280]">
        <span className="flex items-center gap-1.5 font-medium">
          <Bookmark className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Toque no flag para expandir e ver as rotinas detalhadas da função</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="hover:text-[#2563EB] font-semibold transition-colors"
          >
            Abrir todos
          </button>
          <span>•</span>
          <button
            onClick={collapseAll}
            className="hover:text-[#2563EB] font-semibold transition-colors"
          >
            Recolher todos
          </button>
        </div>
      </div>

      {/* Area Groups List — Acordeão recolhido por função e quantidade */}
      <div className="space-y-3">
        {groupedData.map(
          ({ chave, funcaoNome, items, colaboradores, totalRotinas, totalColaboradores }) => {
            const isExpanded = !!expandedKeys[chave]

            return (
              <div
                key={chave}
                className={`bg-white border rounded-lg overflow-hidden shadow-xs transition-colors ${
                  isExpanded ? 'border-[#2563EB]/40 ring-1 ring-[#2563EB]/20' : 'border-[#E5E7EB]'
                }`}
              >
                {/* Group Header com botão Acordeão / Flag clicável */}
                <button
                  type="button"
                  onClick={() => toggleGroup(chave)}
                  className="w-full p-4 bg-[#F7F7F5] hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left gap-3 focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-white border border-[#E5E7EB] flex items-center justify-center text-[#2563EB] shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                        {funcaoNome}
                      </h4>
                      {totalColaboradores > 0 && (
                        <span className="text-[11px] text-[#6B7280] block sm:hidden">
                          {totalColaboradores} {totalColaboradores === 1 ? 'membro' : 'membros'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Badges de Quantidade ao lado do nome da função */}
                    {totalColaboradores > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#4B5563]">
                        <UserCheck className="w-3 h-3 text-[#2563EB]" />
                        <span>
                          {totalColaboradores} {totalColaboradores === 1 ? 'membro' : 'membros'}
                        </span>
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                      {totalRotinas} {totalRotinas === 1 ? 'rotina' : 'rotinas'}
                    </span>

                    {/* Flag / Chevron indicando expansão da rotina */}
                    <div
                      className={`p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-[#2563EB] border-[#2563EB]/40' : ''
                      }`}
                      title={isExpanded ? 'Recolher rotinas' : 'Abrir rotinas detalhadas'}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Rotinas Detalhadas — Apenas quando expandido */}
                {isExpanded && (
                  <div className="divide-y divide-[#E5E7EB] bg-white animate-in fade-in-50 duration-150">
                    {/* Colaboradores desta função (se houver) */}
                    {colaboradores.length > 0 && (
                      <div className="p-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center gap-2 flex-wrap text-xs text-[#4B5563]">
                        <span className="font-semibold text-[#1F2937] flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Equipe nesta função:</span>
                        </span>
                        {colaboradores.map((fc) => (
                          <span
                            key={fc.id}
                            className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-medium text-[#1F2937]"
                          >
                            {fc.nome}
                            {fc.telefone && ` (${formatPhoneBR(fc.telefone)})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {items.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#6B7280]">
                        Nenhuma rotina cadastrada para esta função.
                      </div>
                    ) : (
                      items.map((routine) => (
                        <div
                          key={routine.id}
                          className="p-3.5 sm:p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[#1F2937]">
                              {routine.nome}
                            </div>
                            {routine.observacoes && (
                              <p className="text-xs text-[#6B7280] line-clamp-2 mt-0.5">
                                {routine.observacoes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#6B7280] shrink-0 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              <span>{routine.frequencia}</span>
                            </span>

                            {routine.horario_limite && (
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-[#F7F7F5] text-[#374151]">
                                {routine.horario_limite}
                              </span>
                            )}

                            {routine.validacao && (
                              <span className="flex items-center gap-1 text-[11px] text-[#4B5563]">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                <span>Validação: {normalizarNomeCanonico(routine.validacao)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          },
        )}
      </div>
    </div>
  )
}
