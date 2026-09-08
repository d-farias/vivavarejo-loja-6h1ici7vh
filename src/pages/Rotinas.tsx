import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import type { Rotina, ExecucaoRotina } from '@/types'
import { getHorarioStatus } from '@/lib/time-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { RoutineFormModal } from '@/components/RoutineFormModal'
import { SpreadsheetImportModal } from '@/components/SpreadsheetImportModal'
import { StoreSelector } from '@/components/StoreSelector'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { BotaoAvisoWhatsApp } from '@/components/BotaoAvisoWhatsApp'
import { ModelosSegmentoVitrine } from '@/components/ModelosSegmentoVitrine'
import { clientesService } from '@/services/clientes'
import { funcoesService } from '@/services/funcoes'
import { modelosRotinasService } from '@/services/modelosRotinas'
import type { Cliente, Funcao, ModeloComContagem, ModeloRotinaItem } from '@/types'
import {
  Search,
  Filter,
  Check,
  Clock,
  User,
  Wrench,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
  RefreshCw,
  FileText,
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  AlertTriangle,
  Store,
  Camera,
  Phone,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'

export default function Rotinas() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojaSelecionada, lojas } = useStore()
  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')
  const podeGerenciar = perfil === 'admin' || perfil === 'adm_rede' || perfil === 'lider'

  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcoesLoja, setFuncoesLoja] = useState<Funcao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFreq, setSelectedFreq] = useState<string>('Todas')
  const [selectedArea, setSelectedArea] = useState<string>('Todas')
  const [selectedRotina, setSelectedRotina] = useState<Rotina | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [visualizarFotoExecucao, setVisualizarFotoExecucao] = useState<{
    execucao: ExecucaoRotina
    rotina?: Rotina
  } | null>(null)

  // Controle da seção recolhível de Departamentos e Funções (inicia recolhida para poupar espaço no mobile)
  const [departamentosAberto, setDepartamentosAberto] = useState<boolean>(false)

  // Controle de escolha do modelo na biblioteca para exibir rotinas
  // Inicia sempre neutro (null): o usuário precisa tocar/escolher um modelo na biblioteca
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloComContagem | null>(null)

  // Remove qualquer resquício legado de modelo gravado para garantir início neutro
  useEffect(() => {
    try {
      localStorage.removeItem('vivavarejo_rotinas_modelo_ativo')
    } catch {
      // noop
    }
  }, [])

  // Modais de CRUD e Importação
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingRotina, setEditingRotina] = useState<Rotina | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [allRoutines, todayExecs, allClientes, funcs] = await Promise.all([
        rotinasService.getAll(lojaSelecionadaId),
        execucoesService.getTodayExecutions(user.id),
        clientesService.getAll().catch(() => [] as Cliente[]),
        (lojaSelecionadaId && lojaSelecionadaId !== 'todas'
          ? funcoesService.getByLoja(lojaSelecionadaId)
          : funcoesService.getAll()
        ).catch(() => [] as Funcao[]),
      ])
      setRotinas(allRoutines)
      setExecucoes(todayExecs)
      setClientes(allClientes)
      setFuncoesLoja(funcs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user, lojaSelecionadaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime updates em rotinas (reflete criações, updates, deletes e importações imediatamente)
  useRealtime<Rotina>(
    'rotinas',
    useCallback((data) => {
      const record = data.record
      setRotinas((prev) => {
        if (data.action === 'delete') {
          return prev.filter((item) => item.id !== record.id)
        }
        if (data.action === 'create') {
          const exists = prev.some((item) => item.id === record.id)
          return exists ? prev : [record, ...prev]
        }
        if (data.action === 'update') {
          return prev.map((item) => (item.id === record.id ? record : item))
        }
        return prev
      })
    }, []),
    !!user,
  )

  // Realtime updates em execucoes
  useRealtime<ExecucaoRotina>(
    'execucoes_rotinas',
    useCallback((data) => {
      const record = data.record
      const todayStr = getTodayDateString()
      const isToday = record.data_execucao && record.data_execucao.startsWith(todayStr)
      if (!isToday) return

      setExecucoes((prev) => {
        if (data.action === 'delete') {
          return prev.filter((item) => item.id !== record.id)
        }
        if (data.action === 'create') {
          const exists = prev.some((item) => item.id === record.id)
          return exists ? prev : [...prev, record]
        }
        if (data.action === 'update') {
          return prev.map((item) => (item.id === record.id ? record : item))
        }
        return prev
      })
    }, []),
    !!user,
  )

  const completionMap = useMemo(() => {
    const map = new Map<string, ExecucaoRotina>()
    for (const exec of execucoes) {
      if (exec.concluida && exec.status_validacao !== 'devolvida') {
        map.set(exec.rotina, exec)
      }
    }
    return map
  }, [execucoes])

  // Se houver um modelo comercial selecionado na biblioteca, sincronizamos dinamicamente a listagem de rotinas
  // com as rotinas daquele modelo específico (seja ele Supermercado, Moda, Farmácia, Pet, Eletrônicos etc.)
  // e se o modelo foi aplicado na loja ou ainda está como preview, mantemos a visualização e operação imediata.
  const [rotinasModelo, setRotinasModelo] = useState<Rotina[]>([])
  const [loadingModeloRotinas, setLoadingModeloRotinas] = useState<boolean>(false)

  useEffect(() => {
    if (!modeloSelecionado) {
      setRotinasModelo([])
      return
    }

    let isMounted = true
    setLoadingModeloRotinas(true)

    const carregarRotinasDoModelo = async () => {
      try {
        // 1. Carrega os itens cadastrados no modelo
        const itensModelo = await modelosRotinasService.getItens(modeloSelecionado.id)
        if (!isMounted) return

        // 2. Mapeia para Rotina para que a interface exiba imediatamente as rotinas do novo modelo
        // Se a loja tiver rotinas cadastradas/aplicadas correspondentes, reconciliamos os IDs e execuções
        const rotinasMapeadas: Rotina[] = itensModelo.map((item, index) => {
          // Busca se já existe uma rotina na loja com mesmo nome e horário para preservar ID real da loja
          const correspondente = rotinas.find(
            (r) =>
              r.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() ||
              (item.horario_limite &&
                r.horario_limite?.trim() === item.horario_limite.trim() &&
                r.nome.toLowerCase().includes(item.nome.toLowerCase().slice(0, 15))),
          )

          if (correspondente) {
            return correspondente
          }

          // Caso ainda não tenha sido aplicada no banco como rotina individual da loja, gera objeto de exibição completo
          const pseudoId = `mod-${modeloSelecionado.id}-${item.id || index}`
          return {
            id: pseudoId,
            collectionId: 'rotinas',
            collectionName: 'rotinas',
            created: item.created || new Date().toISOString(),
            updated: item.updated || new Date().toISOString(),
            nome: item.nome,
            responsavel: item.responsavel || item.funcao_nome || 'Operação',
            frequencia: item.frequencia || 'Diária',
            horario_limite: item.horario_limite || '',
            ferramenta: item.ferramenta || '',
            validacao: item.validacao || '',
            area: item.area || '',
            observacoes: item.observacoes || '',
            status: 'Ativa',
            loja: lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : '',
          } as Rotina
        })

        if (isMounted) {
          setRotinasModelo(rotinasMapeadas)
        }
      } catch (err) {
        console.error('Erro ao carregar rotinas do modelo selecionado:', err)
      } finally {
        if (isMounted) {
          setLoadingModeloRotinas(false)
        }
      }
    }

    carregarRotinasDoModelo()

    return () => {
      isMounted = false
    }
  }, [modeloSelecionado, rotinas, lojaSelecionadaId])

  // Rotinas base para a listagem: quando há um modelo selecionado, exibe as rotinas desse modelo;
  // se não houver modelo (neutro), usa a listagem padrão da loja.
  const rotinasExibicao = useMemo(() => {
    if (!modeloSelecionado) return rotinas
    return rotinasModelo
  }, [modeloSelecionado, rotinasModelo, rotinas])

  // Extract unique areas from currently displayed routines (adapta-se ao modelo escolhido)
  const availableAreas = useMemo(() => {
    const areas = new Set<string>()
    rotinasExibicao.forEach((r) => {
      if (r.area && r.area.trim()) areas.add(r.area.trim())
      else if (r.responsavel && r.responsavel.trim()) areas.add(r.responsavel.trim())
    })
    return Array.from(areas).sort()
  }, [rotinasExibicao])

  const frequencyFilters = ['Todas', 'Diária', 'Semanal', 'Conforme demanda']

  const handleToggle = async (rotinaId: string) => {
    if (!user || submittingId === rotinaId) return

    // Se for uma rotina que veio dinamicamente do modelo (pseudo-id mod-...) e ainda não foi persistida como registro da loja,
    // criamos a rotina na loja automaticamente para permitir o checklist e execução transparente
    let targetRotinaId = rotinaId
    if (rotinaId.startsWith('mod-')) {
      const rotinaObj = rotinasExibicao.find((r) => r.id === rotinaId)
      if (rotinaObj) {
        try {
          const criada = await rotinasService.create({
            nome: rotinaObj.nome,
            responsavel: rotinaObj.responsavel,
            frequencia: rotinaObj.frequencia,
            horario_limite: rotinaObj.horario_limite,
            ferramenta: rotinaObj.ferramenta,
            validacao: rotinaObj.validacao,
            area: rotinaObj.area,
            observacoes: rotinaObj.observacoes,
            status: 'Ativa',
            loja:
              lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined,
          })
          targetRotinaId = criada.id
          setRotinas((prev) => [criada, ...prev])
          // Atualiza o item nas rotinas do modelo
          setRotinasModelo((prev) => prev.map((r) => (r.id === rotinaId ? criada : r)))
          if (selectedRotina?.id === rotinaId) {
            setSelectedRotina(criada)
          }
        } catch (err) {
          console.warn('Não foi possível persistir rotina do modelo antes da execução:', err)
        }
      }
    }

    const existingExec = execucoes.find(
      (e) => (e.rotina === targetRotinaId || e.rotina === rotinaId) && e.usuario === user.id,
    )
    const isCurrentlyDone = !!existingExec?.concluida
    const nextState = !isCurrentlyDone

    const tempId = existingExec?.id || `temp-${Date.now()}`
    const optimisticRecord: ExecucaoRotina = {
      id: tempId,
      collectionId: 'execucoes_rotinas',
      collectionName: 'execucoes_rotinas',
      rotina: rotinaId,
      usuario: user.id,
      data_execucao: getTodayDateString(),
      concluida: nextState,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    setExecucoes((prev) => {
      const idx = prev.findIndex(
        (e) => (e.rotina === targetRotinaId || e.rotina === rotinaId) && e.usuario === user.id,
      )
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], concluida: nextState, rotina: targetRotinaId }
        return copy
      }
      return [...prev, { ...optimisticRecord, rotina: targetRotinaId }]
    })

    setSubmittingId(rotinaId)

    try {
      const saved = await execucoesService.toggleExecution(
        targetRotinaId,
        user.id,
        isCurrentlyDone,
        existingExec?.id,
      )
      setExecucoes((prev) => {
        const filtered = prev.filter((e) => e.id !== tempId && e.id !== saved.id)
        return [...filtered, saved]
      })
    } catch {
      setExecucoes((prev) => {
        if (existingExec) {
          return prev.map((e) => (e.id === existingExec.id ? existingExec : e))
        }
        return prev.filter((e) => e.id !== tempId)
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Handle Save (Create or Update)
  const handleSaveRoutine = async (data: Partial<Rotina>) => {
    if (editingRotina) {
      const updated = await rotinasService.update(editingRotina.id, data)
      setRotinas((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      if (selectedRotina?.id === updated.id) {
        setSelectedRotina(updated)
      }
    } else {
      const created = await rotinasService.create(data)
      setRotinas((prev) => [created, ...prev])
    }
    setEditingRotina(null)
  }

  // Handle Delete
  const handleDeleteRoutine = async (id: string) => {
    try {
      if (!id.startsWith('mod-')) {
        await rotinasService.delete(id)
      }
      setRotinas((prev) => prev.filter((r) => r.id !== id))
      setRotinasModelo((prev) => prev.filter((r) => r.id !== id))
      if (selectedRotina?.id === id) {
        setSelectedRotina(null)
      }
    } catch (err) {
      console.error('Erro ao excluir rotina:', err)
    } finally {
      setDeleteConfirmId(null)
    }
  }

  // Open Edit modal from card or detail view
  const handleOpenEdit = (rotina: Rotina) => {
    setEditingRotina(rotina)
    setIsFormModalOpen(true)
  }

  // Filtered routines (com deduplicação defensiva por id) baseadas nas rotinas de exibição ativas
  const filteredRotinas = useMemo(() => {
    const seenIds = new Set<string>()
    return rotinasExibicao.filter((r) => {
      if (seenIds.has(r.id)) return false
      seenIds.add(r.id)
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchName = r.nome.toLowerCase().includes(query)
        const matchResp = r.responsavel.toLowerCase().includes(query)
        const matchFerramenta = r.ferramenta?.toLowerCase().includes(query) || false
        const matchValidacao = r.validacao?.toLowerCase().includes(query) || false
        const matchArea = r.area?.toLowerCase().includes(query) || false
        if (!matchName && !matchResp && !matchFerramenta && !matchValidacao && !matchArea) {
          return false
        }
      }

      // Frequency filter
      if (selectedFreq !== 'Todas') {
        if (selectedFreq === 'Conforme demanda') {
          if (
            r.frequencia !== 'Conforme vendas' &&
            r.frequencia !== 'A cada recebimento' &&
            r.frequencia !== 'Rotinas'
          ) {
            return false
          }
        } else if (r.frequencia !== selectedFreq) {
          return false
        }
      }

      // Area filter
      if (selectedArea !== 'Todas') {
        const routineArea = (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim())
        if (routineArea !== selectedArea) {
          return false
        }
      }

      return true
    })
  }, [rotinasExibicao, searchTerm, selectedFreq, selectedArea])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedFreq('Todas')
    setSelectedArea('Todas')
  }

  // Esc key closes modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRotina(null)
        setDeleteConfirmId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-96 bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-full" />
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-full" />
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-44 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-44 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-[#E5E7EB] rounded-lg text-center space-y-3 shadow-xs">
        <p className="text-sm text-[#B91C1C] font-medium">
          Não foi possível carregar as rotinas. Tente novamente.
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
    <div className="space-y-6">
      {/* Header Row: Título + Seletor de Loja + Ações de Gestão */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
            Rotinas Operacionais
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {lojaSelecionada
              ? `Acompanhamento e catálogo de rotinas ativas para ${lojaSelecionada.nome}.`
              : 'Gestão operacional de rotinas da loja. Cadastre, edite, exclua ou importe planilhas.'}
          </p>
        </div>

        {/* Action Buttons: Seletor de Loja + Importar Planilha + Nova Rotina */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <StoreSelector />

          {podeGerenciar && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
                <span>Importar Planilha</span>
              </button>

              <button
                onClick={() => {
                  setEditingRotina(null)
                  setIsFormModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Rotina</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bloco de Biblioteca de Modelos por Segmento (Revertido: volta a ficar aberta normalmente) */}
      <ModelosSegmentoVitrine
        userPerfil={perfil}
        lojas={lojas}
        clientes={clientes}
        onRotinasAtualizadas={async () => {
          await loadData()
          // Recarrega os itens do modelo ativo para atualizar com os IDs reais aplicados na loja
          if (modeloSelecionado) {
            try {
              const itens = await modelosRotinasService.getItens(modeloSelecionado.id)
              const rotinasMapeadas: Rotina[] = itens.map((item, index) => {
                const correspondente = rotinas.find(
                  (r) =>
                    r.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() ||
                    (item.horario_limite &&
                      r.horario_limite?.trim() === item.horario_limite.trim() &&
                      r.nome.toLowerCase().includes(item.nome.toLowerCase().slice(0, 15))),
                )
                if (correspondente) return correspondente
                return {
                  id: `mod-${modeloSelecionado.id}-${item.id || index}`,
                  collectionId: 'rotinas',
                  collectionName: 'rotinas',
                  created: item.created || new Date().toISOString(),
                  updated: item.updated || new Date().toISOString(),
                  nome: item.nome,
                  responsavel: item.responsavel || item.funcao_nome || 'Operação',
                  frequencia: item.frequencia || 'Diária',
                  horario_limite: item.horario_limite || '',
                  ferramenta: item.ferramenta || '',
                  validacao: item.validacao || '',
                  area: item.area || '',
                  observacoes: item.observacoes || '',
                  status: 'Ativa',
                  loja: lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : '',
                } as Rotina
              })
              setRotinasModelo(rotinasMapeadas)
            } catch {
              // noop
            }
          }
        }}
        onSelectModelo={(mod) => {
          setModeloSelecionado(mod)
          // Rola suavemente até o catálogo de rotinas caso o usuário esteja em celular
          setTimeout(() => {
            const el = document.getElementById('catalogo-rotinas-container')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
        }}
        selectedModeloId={modeloSelecionado?.id || null}
      />

      {/* Seção de Departamentos e Funções (Inicia RECOLHIDA — barra/botão compacto min-h 40px) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden transition-all">
        <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-[#1F2937]">
                  Departamentos e Funções
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#4B5563]">
                  {availableAreas.length} departamentos • {funcoesLoja.length} funções
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] truncate">
                {departamentosAberto
                  ? 'Mapeamento de áreas de atuação e cargos vinculados à operação.'
                  : 'Visão departamental e cargos operacionais da loja.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDepartamentosAberto((prev) => !prev)}
            aria-expanded={departamentosAberto}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-md border border-[#E5E7EB] bg-white hover:bg-gray-50 active:bg-gray-100 text-[#374151] transition-colors shadow-2xs self-stretch sm:self-auto"
          >
            {departamentosAberto ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Ocultar departamentos e funções</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Visualizar departamentos e funções</span>
              </>
            )}
          </button>
        </div>

        {/* Conteúdo Expansível: só renderiza quando o usuário clica para abrir */}
        {departamentosAberto && (
          <div className="px-3.5 pb-4 pt-2 border-t border-[#E5E7EB] bg-[#F7F7F5]/30 space-y-3.5 animate-fade-in">
            {/* Departamentos / Áreas */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] block mb-2">
                Departamentos / Setores Mapeados ({availableAreas.length})
              </span>
              {availableAreas.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] italic">
                  Nenhum departamento identificado nas rotinas cadastradas.
                </p>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedArea(selectedArea === area ? 'Todas' : area)
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        selectedArea === area
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-gray-400'
                      }`}
                      title={`Filtrar rotinas pelo departamento ${area}`}
                    >
                      <span>{area}</span>
                      <span className="text-[10px] opacity-75">
                        (
                        {
                          rotinasExibicao.filter(
                            (r) =>
                              (r.area && r.area.trim() === area) ||
                              (!r.area && r.responsavel && r.responsavel.trim() === area),
                          ).length
                        }
                        )
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Funções / Cargos Operacionais */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] block mb-2">
                Funções e Cargos Cadastrados ({funcoesLoja.length})
              </span>
              {funcoesLoja.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] italic">
                  Nenhuma função específica vinculada a esta loja ainda.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {funcoesLoja.map((f) => (
                    <div
                      key={f.id}
                      className="p-2 bg-white border border-[#E5E7EB] rounded-md text-xs flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1F2937] block truncate">
                          {f.nome}
                        </span>
                        {f.telefone && (
                          <span className="text-[11px] text-[#6B7280] font-mono block truncate">
                            WhatsApp: {f.telefone}
                          </span>
                        )}
                      </div>
                      {f.chefe_imediato_funcao && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100 shrink-0">
                          Subordinado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fluxo das Rotinas: Só aparece após o usuário escolher um modelo na Biblioteca */}
      {!modeloSelecionado ? (
        <div className="p-8 sm:p-10 text-center bg-white border border-dashed border-[#E5E7EB] rounded-xl space-y-3 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
              Nenhum modelo de rotinas selecionado
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              Escolha um modelo na Biblioteca de Modelos acima para carregar as rotinas da sua loja.
            </p>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            Clique em <strong>Visualizar Rotinas</strong> ou <strong>Aplicar na Loja</strong> em
            qualquer modelo para liberar o checklist operacional abaixo.
          </p>
        </div>
      ) : (
        <div id="catalogo-rotinas-container" className="space-y-6">
          {/* Barra indicadora do modelo atualmente ativo com opção de trocar */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#1F2937] truncate">
                    Rotinas ativas: {modeloSelecionado.nome}
                  </span>
                  {modeloSelecionado.segmento && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                      {modeloSelecionado.segmento}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#4B5563] truncate">
                  {filteredRotinas.length} rotinas operacionais disponíveis no catálogo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setModeloSelecionado(null)
                try {
                  localStorage.removeItem('vivavarejo_rotinas_modelo_ativo')
                  localStorage.removeItem('vivavarejo_vitrine_segmento')
                } catch {
                  // noop
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold underline self-start sm:self-auto shrink-0"
            >
              <span>Escolher outro modelo</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por rotina, responsável, área..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#3B82F6]/25 text-[#1F2937] placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <span className="text-xs text-[#6B7280]">
                Exibindo <strong>{filteredRotinas.length}</strong> de {rotinasExibicao.length}{' '}
                rotinas
                {loadingModeloRotinas && (
                  <span className="ml-1 text-[#2563EB] animate-pulse">(atualizando modelo...)</span>
                )}
              </span>
            </div>

            {/* Filter Chips Bar */}
            <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
              {/* Frequency filters */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-[#4B5563] flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Frequência:
                </span>
                {frequencyFilters.map((freq) => {
                  const active = selectedFreq === freq
                  return (
                    <button
                      key={freq}
                      onClick={() => setSelectedFreq(freq)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${
                        active
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
                      }`}
                    >
                      {freq}
                    </button>
                  )
                })}
              </div>

              {/* Area filters */}
              {availableAreas.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                  <span className="font-semibold text-[#4B5563] mr-1">Área:</span>
                  <button
                    onClick={() => setSelectedArea('Todas')}
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all duration-200 ${
                      selectedArea === 'Todas'
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
                    }`}
                  >
                    Todas
                  </button>
                  {availableAreas.map((area) => {
                    const active = selectedArea === area
                    return (
                      <button
                        key={area}
                        onClick={() => setSelectedArea(area)}
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all duration-200 ${
                          active
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
                        }`}
                      >
                        {area}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Routine Cards Grid */}
          {filteredRotinas.length === 0 ? (
            <div className="p-10 text-center bg-white border border-[#E5E7EB] rounded-lg space-y-3">
              <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <p className="text-sm text-[#4B5563] font-medium">
                Nenhuma rotina encontrada com esses critérios.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-semibold bg-[#F7F7F5] border border-[#E5E7EB] text-[#1F2937] hover:bg-gray-100 rounded-md transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRotinas.map((rotina) => {
                const isDone = completionMap.has(rotina.id)
                const status = getHorarioStatus(rotina.horario_limite, isDone)
                const pastDue = status.isAtrasada

                return (
                  <div
                    key={rotina.id}
                    className={`bg-white border rounded-lg p-4 flex flex-col justify-between shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isDone
                        ? 'opacity-70 border-[#E5E7EB] bg-gray-50/50'
                        : pastDue
                          ? 'border-red-300 bg-red-50/10'
                          : 'border-[#E5E7EB] hover:border-[#2563EB]/50'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Name + Badges + Edit/Delete quick buttons */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className={`font-bold text-base leading-snug cursor-pointer hover:text-[#2563EB] transition-colors flex-1 ${
                            isDone ? 'line-through text-[#6B7280]' : 'text-[#1F2937]'
                          }`}
                          onClick={() => setSelectedRotina(rotina)}
                        >
                          {rotina.nome}
                        </h3>

                        {podeGerenciar && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEdit(rotina)}
                              className="p-1 text-[#9CA3AF] hover:text-[#2563EB] rounded transition-colors"
                              title="Editar rotina"
                              aria-label={`Editar ${rotina.nome}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(rotina.id)}
                              className="p-1 text-[#9CA3AF] hover:text-[#B91C1C] rounded transition-colors"
                              title="Excluir rotina"
                              aria-label={`Excluir ${rotina.nome}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status do Horário Limite e Botão WhatsApp */}
                      <div className="mb-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!isDone && pastDue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-red-100 text-[#B91C1C] rounded border border-red-200">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>
                                ATRASADA ({status.normalizedHorario || rotina.horario_limite})
                              </span>
                            </span>
                          )}
                          {!isDone && !pastDue && status.hasHorario && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#2563EB]/10 text-[#2563EB] rounded border border-[#2563EB]/20">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{status.displayLabel}</span>
                            </span>
                          )}
                          {!isDone && status.isIntegral && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-[#4B5563] rounded border border-gray-200">
                              Integral (dia todo)
                            </span>
                          )}
                          {isDone && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                              <span>Concluída hoje</span>
                            </span>
                          )}
                        </div>
                        {/* Botão Avisar por WhatsApp quando não concluída */}
                        {!isDone && (pastDue || status.hasHorario) && (
                          <BotaoAvisoWhatsApp
                            lojaNome={rotina.expand?.loja?.nome}
                            tarefaTitulo={rotina.nome}
                            setor={rotina.area || 'Operação Loja'}
                            horario={status.normalizedHorario || rotina.horario_limite}
                            situacao={pastDue ? 'Atrasada' : 'Pendente (próxima do horário)'}
                            telefoneResponsavel={
                              rotina.telefone_responsavel || rotina.expand?.funcao?.telefone
                            }
                            telefoneChefe={
                              rotina.telefone_chefe ||
                              rotina.expand?.funcao?.expand?.chefe_imediato_funcao?.telefone
                            }
                            nomeResponsavel={rotina.responsavel}
                            nomeChefe={rotina.expand?.funcao?.expand?.chefe_imediato_funcao?.nome}
                            compact
                          />
                        )}

                        {isDone && completionMap.get(rotina.id)?.foto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const exec = completionMap.get(rotina.id)
                              if (exec) {
                                setVisualizarFotoExecucao({ execucao: exec, rotina })
                              }
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-[#2563EB] rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                            title="Ver foto de comprovação"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Foto</span>
                          </button>
                        )}
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E7EB] text-[#4B5563]">
                          <User className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{rotina.responsavel}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E7EB] text-[#4B5563]">
                          <span>{rotina.frequencia}</span>
                        </span>

                        {rotina.area && (
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[#4B5563] text-[11px]">
                            {rotina.area}
                          </span>
                        )}
                      </div>

                      {/* Details Lines */}
                      <div className="space-y-1 text-xs text-[#6B7280] mb-4">
                        {rotina.ferramenta && (
                          <div className="flex items-start gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 mt-0.5" />
                            <span className="text-[#6B7280]">Ferramenta:</span>
                            <span className="text-[#374151] font-medium truncate">
                              {rotina.ferramenta}
                            </span>
                          </div>
                        )}
                        {rotina.validacao && (
                          <div className="flex items-start gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 mt-0.5" />
                            <span className="text-[#6B7280]">Validação:</span>
                            <span className="text-[#374151] font-medium truncate">
                              {rotina.validacao}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedRotina(rotina)}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 group transition-colors"
                      >
                        <span>Ver detalhes</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      <button
                        onClick={() => handleToggle(rotina.id)}
                        disabled={submittingId === rotina.id}
                        title={isDone ? 'Desmarcar conclusão' : 'Marcar conclusão hoje'}
                        aria-label={`Marcar ${rotina.nome}`}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 transform active:scale-90 ${
                          isDone
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : pastDue
                              ? 'border-red-400 hover:border-red-600 text-transparent hover:text-red-400 bg-white'
                              : 'border-[#D1D5DB] hover:border-[#2563EB] text-transparent hover:text-gray-300 bg-white'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Routine Detail Modal */}
      {selectedRotina && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setSelectedRotina(null)}
          />

          {/* Modal Box */}
          <div className="relative w-full sm:max-w-xl bg-white rounded-t-xl sm:rounded-lg shadow-xl p-5 sm:p-6 z-10 border border-[#E5E7EB] max-h-[85vh] overflow-y-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#3B82F6]/10 text-[#2563EB] mb-1">
                  {selectedRotina.area || 'Operação de Loja'}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
                  {selectedRotina.nome}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRotina(null)}
                className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="py-4 space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-[#F7F7F5] border border-[#E5E7EB]">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Responsável
                  </span>
                  <span className="font-medium text-[#1F2937]">{selectedRotina.responsavel}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Frequência
                  </span>
                  <span className="font-medium text-[#1F2937]">{selectedRotina.frequencia}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Horário limite
                  </span>
                  <span className="font-mono font-medium text-[#1F2937]">
                    {selectedRotina.horario_limite || 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Validação
                  </span>
                  <span className="font-medium text-[#1F2937]">
                    {selectedRotina.validacao || 'Liderança'}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#4B5563] mb-1 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#9CA3AF]" />
                  Ferramenta necessária
                </span>
                <p className="text-xs sm:text-sm text-[#1F2937] bg-white border border-[#E5E7EB] p-2.5 rounded-md">
                  {selectedRotina.ferramenta || 'Nenhuma ferramenta específica informada.'}
                </p>
              </div>

              {/* Contatos WhatsApp vinculados à Rotina */}
              {(selectedRotina.telefone_responsavel ||
                selectedRotina.telefone_chefe ||
                selectedRotina.expand?.funcao?.telefone) && (
                <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      Contatos WhatsApp vinculados
                    </span>
                    <BotaoAvisoWhatsApp
                      lojaNome={selectedRotina.expand?.loja?.nome}
                      tarefaTitulo={selectedRotina.nome}
                      setor={selectedRotina.area || 'Operação Loja'}
                      horario={selectedRotina.horario_limite}
                      situacao="Aviso operacional de rotina"
                      telefoneResponsavel={
                        selectedRotina.telefone_responsavel ||
                        selectedRotina.expand?.funcao?.telefone
                      }
                      telefoneChefe={
                        selectedRotina.telefone_chefe ||
                        selectedRotina.expand?.funcao?.expand?.chefe_imediato_funcao?.telefone
                      }
                      nomeResponsavel={selectedRotina.responsavel}
                      nomeChefe={selectedRotina.expand?.funcao?.expand?.chefe_imediato_funcao?.nome}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-emerald-800 font-medium block">
                        Responsável:
                      </span>
                      <span className="font-mono text-gray-800">
                        {selectedRotina.telefone_responsavel ||
                          selectedRotina.expand?.funcao?.telefone ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-emerald-800 font-medium block">
                        Chefe Imediato:
                      </span>
                      <span className="font-mono text-gray-800">
                        {selectedRotina.telefone_chefe ||
                          selectedRotina.expand?.funcao?.expand?.chefe_imediato_funcao?.telefone ||
                          '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedRotina.observacoes && (
                <div>
                  <span className="block text-xs font-semibold text-[#4B5563] mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#9CA3AF]" />
                    Observações e orientações
                  </span>
                  <p className="text-xs sm:text-sm text-[#4B5563] bg-white border border-[#E5E7EB] p-2.5 rounded-md leading-relaxed">
                    {selectedRotina.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {podeGerenciar && (
                  <>
                    <button
                      onClick={() => {
                        handleOpenEdit(selectedRotina)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#3B82F6]/10 rounded-md transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(selectedRotina.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#B91C1C] hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRotina(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors"
                >
                  Fechar
                </button>
                {(() => {
                  const isDone = completionMap.has(selectedRotina.id)
                  const exec = completionMap.get(selectedRotina.id)
                  return (
                    <div className="flex items-center gap-1.5">
                      {isDone && exec?.foto && (
                        <button
                          type="button"
                          onClick={() => {
                            setVisualizarFotoExecucao({ execucao: exec, rotina: selectedRotina })
                          }}
                          className="px-3 py-2 text-xs font-semibold rounded-md bg-blue-50 text-[#2563EB] hover:bg-blue-100 flex items-center gap-1.5 transition-colors border border-blue-200"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Ver Prova (Foto)</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleToggle(selectedRotina.id)
                        }}
                        disabled={submittingId === selectedRotina.id}
                        className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-colors ${
                          isDone
                            ? 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'
                            : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isDone ? 'Concluída hoje (desmarcar)' : 'Concluir rotina hoje'}
                        </span>
                      </button>
                    </div>
                  )
                })()}
              </div>{' '}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-lg p-5 z-10 border border-[#E5E7EB] shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#B91C1C]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-[#1F2937]">Excluir rotina?</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              Esta ação removerá esta rotina operacional do sistema e do painel de acompanhamento.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-medium text-[#4B5563] hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteRoutine(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#B91C1C] hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Rotina */}
      <RoutineFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingRotina(null)
        }}
        onSave={handleSaveRoutine}
        initialData={editingRotina}
      />

      {/* Modal de Importação de Planilha Excel/CSV em Runtime */}
      <SpreadsheetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={async () => {
          await loadData()
        }}
      />

      {/* Modal de Visualização da Foto */}
      <FotoVisualizadorModal
        isOpen={Boolean(visualizarFotoExecucao)}
        execucao={visualizarFotoExecucao?.execucao || null}
        rotina={visualizarFotoExecucao?.rotina || null}
        onClose={() => setVisualizarFotoExecucao(null)}
      />
    </div>
  )
}
