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
import { normalizarNomeCanonico, getChaveCanonico } from '@/lib/cargos'
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
  Eye,
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
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('Todos')
  const [selectedFuncao, setSelectedFuncao] = useState<string>('Todas')
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

  // Rotinas do catálogo do modelo selecionado (itens teóricos da biblioteca)
  const [itensCatalogoModelo, setItensCatalogoModelo] = useState<ModeloRotinaItem[]>([])
  const [loadingModeloRotinas, setLoadingModeloRotinas] = useState<boolean>(false)

  // Quando modeloSelecionado muda, busca os itens do catálogo na coleção modelos_rotinas_itens
  useEffect(() => {
    if (!modeloSelecionado) {
      setItensCatalogoModelo([])
      return
    }

    let isMounted = true
    setItensCatalogoModelo([])
    setLoadingModeloRotinas(true)

    const carregarItensCatalogo = async () => {
      try {
        const itens = await modelosRotinasService.getItens(modeloSelecionado.id)
        if (isMounted) {
          setItensCatalogoModelo(itens)
        }
      } catch (err) {
        console.error('Erro ao carregar catálogo do modelo:', err)
      } finally {
        if (isMounted) {
          setLoadingModeloRotinas(false)
        }
      }
    }

    carregarItensCatalogo()

    return () => {
      isMounted = false
    }
  }, [modeloSelecionado])

  // CONCILIAÇÃO COM A LOJA:
  // Rotinas EFETIVAMENTE CONCILIADAS com a loja para o modelo selecionado.
  // Regra de negócio:
  // - O usuário importou a planilha com as funções no contexto de Supermercado/Food.
  // - Para Supermercado/Food: as rotinas cadastradas/importadas na loja são as rotinas conciliadas deste modelo.
  // - Para os demais modelos (Farmácia, Moda, etc.): só há rotinas conciliadas se a loja tiver rotinas cadastradas
  //   que correspondam explicitamente aos itens desse modelo (ou que foram geradas ao aplicar o modelo na loja).
  // - NUNCA derivar rotinas da loja a partir do catálogo global do modelo.
  const rotinasConciliadas = useMemo(() => {
    if (!modeloSelecionado) return []

    // Helper para verificar se o modelo selecionado é Supermercado/Food (ou alimentício padrão)
    const seg = (modeloSelecionado.segmento || '').toLowerCase()
    const nome = (modeloSelecionado.nome || '').toLowerCase()
    const isModeloSupermercado =
      seg.includes('supermercado') ||
      seg.includes('food') ||
      seg.includes('alimentar') ||
      nome.includes('supermercado') ||
      nome.includes('food')

    if (isModeloSupermercado) {
      // No modelo Supermercado/Food, as rotinas operacionais cadastradas na loja (importadas da planilha)
      // são as rotinas conciliadas de fato.
      return rotinas
    }

    // Para outros modelos de negócio: concilia APENAS rotinas que foram efetivamente aplicadas /
    // pertencentes à loja e que correspondam aos itens deste modelo específico.
    if (itensCatalogoModelo.length === 0) return []

    const itensNomes = new Set(itensCatalogoModelo.map((it) => it.nome.trim().toLowerCase()))
    return rotinas.filter((r) => itensNomes.has((r.nome || '').trim().toLowerCase()))
  }, [modeloSelecionado, rotinas, itensCatalogoModelo])

  // Define se a loja já possui conciliação ativa para o modelo selecionado
  const isConciliado = rotinasConciliadas.length > 0

  // Importados de @/lib/cargos para manter o padrão unificado em todas as telas

  // 1. Departamentos / Setores: derivados de rotinas conciliadas da loja (ou área/função mapeada)
  // Se não houver rotinas conciliadas para este modelo, permanece em branco.
  const availableDepartamentos = useMemo(() => {
    if (!modeloSelecionado || !isConciliado) return []
    const deptosMap = new Map<string, string>()
    rotinasConciliadas.forEach((r) => {
      const raw = (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || ''
      if (!raw) return
      const canonico = normalizarNomeCanonico(raw)
      const chave = getChaveCanonico(canonico)
      if (!deptosMap.has(chave)) {
        deptosMap.set(chave, canonico)
      }
    })
    return Array.from(deptosMap.values()).sort((a, b) => a.localeCompare(b))
  }, [modeloSelecionado, isConciliado, rotinasConciliadas])

  // 2. Funções / Cargos: derivados APENAS de rotinas efetivamente conciliadas COM A LOJA
  // Se a loja ainda não conciliou rotinas daquele modelo, a seção fica em branco.
  // Agrupa variantes pelo nome canônico, somando rotinas associadas e unificando contatos sem descartar dados.
  const funcoesExibicao = useMemo(() => {
    if (!modeloSelecionado || !isConciliado) return []

    // Estrutura para cada cargo canônico agregado
    interface FuncaoAgregada extends Funcao {
      totalRotinas: number
    }

    const funcoesMap = new Map<string, FuncaoAgregada>()

    rotinasConciliadas.forEach((r) => {
      const nomeResp = (r.responsavel || '').trim()
      if (!nomeResp) return

      const nomeCanonico = normalizarNomeCanonico(nomeResp)
      const chave = getChaveCanonico(nomeCanonico)

      if (!funcoesMap.has(chave)) {
        // Busca cadastro de função da loja que case com a chave canônica ou o nome original
        const existente = funcoesLoja.find((f) => {
          const cF = getChaveCanonico(f.nome)
          return cF === chave || f.nome.trim().toLowerCase() === nomeResp.toLowerCase()
        })

        const telefoneInicial =
          existente?.telefone?.trim() ||
          r.telefone_responsavel?.trim() ||
          r.expand?.funcao?.telefone?.trim() ||
          ''

        const chefeInicial =
          existente?.chefe_imediato_funcao?.trim() ||
          r.telefone_chefe?.trim() ||
          r.expand?.funcao?.chefe_imediato_funcao?.trim() ||
          ''

        funcoesMap.set(chave, {
          id: existente?.id || `func-conc-${chave}`,
          collectionId: 'funcoes',
          collectionName: 'funcoes',
          created: existente?.created || new Date().toISOString(),
          updated: existente?.updated || new Date().toISOString(),
          nome: existente?.nome ? normalizarNomeCanonico(existente.nome) : nomeCanonico,
          telefone: telefoneInicial,
          chefe_imediato_funcao: chefeInicial,
          loja: lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : '',
          totalRotinas: 1,
        })
      } else {
        const atual = funcoesMap.get(chave)!
        atual.totalRotinas += 1

        // Preenche telefone e chefe imediato caso ainda estejam vazios, priorizando cadastro da loja e depois rotina
        if (!atual.telefone) {
          const telRotina = r.telefone_responsavel?.trim() || r.expand?.funcao?.telefone?.trim()
          if (telRotina) {
            atual.telefone = telRotina
          }
        }
        if (!atual.chefe_imediato_funcao) {
          const chefeRotina =
            r.telefone_chefe?.trim() || r.expand?.funcao?.chefe_imediato_funcao?.trim()
          if (chefeRotina) {
            atual.chefe_imediato_funcao = chefeRotina
          }
        }
      }
    })

    return Array.from(funcoesMap.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [modeloSelecionado, isConciliado, rotinasConciliadas, funcoesLoja, lojaSelecionadaId])

  // Rotinas para exibição na lista operacional:
  // São exclusivamente as rotinas conciliadas da loja. Se não houver conciliação, lista fica vazia.
  const rotinasExibicao = useMemo(() => {
    if (!modeloSelecionado) return []
    return rotinasConciliadas
  }, [modeloSelecionado, rotinasConciliadas])

  const frequencyFilters = ['Todas', 'Diária', 'Semanal', 'Conforme demanda']

  const handleToggle = async (rotinaId: string) => {
    if (!user || submittingId === rotinaId) return

    const targetRotinaId = rotinaId
    const existingExec = execucoes.find((e) => e.rotina === targetRotinaId && e.usuario === user.id)
    const isCurrentlyDone = !!existingExec?.concluida
    const nextState = !isCurrentlyDone

    const tempId = existingExec?.id || `temp-${Date.now()}`
    const optimisticRecord: ExecucaoRotina = {
      id: tempId,
      collectionId: 'execucoes_rotinas',
      collectionName: 'execucoes_rotinas',
      rotina: targetRotinaId,
      usuario: user.id,
      data_execucao: getTodayDateString(),
      concluida: nextState,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    setExecucoes((prev) => {
      const idx = prev.findIndex((e) => e.rotina === targetRotinaId && e.usuario === user.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], concluida: nextState, rotina: targetRotinaId }
        return copy
      }
      return [...prev, optimisticRecord]
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
      if (selectedRotina?.id === id) {
        setSelectedRotina(null)
      }
    } catch (err) {
      console.error('Erro ao excluir rotina:', err)
    } finally {
      setDeleteConfirmId(null)
    }
  }

  // Estado para expandir prévia das rotinas do modelo quando loja não estiver conciliada
  const [previaCatalogoAberto, setPreviaCatalogoAberto] = useState<boolean>(false)

  // Quando modeloSelecionado mudar, fecha a prévia do catálogo
  useEffect(() => {
    setPreviaCatalogoAberto(false)
  }, [modeloSelecionado])

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
        if (!matchName && !matchResp && !matchFerramenta && !matchValidacao) {
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

      // Filtro por Departamento / Setor (clicado no grupo acima)
      if (selectedDepartamento !== 'Todos') {
        const rawRoutineDept =
          (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || ''
        const canonicoRoutineDept = normalizarNomeCanonico(rawRoutineDept)
        const chaveRoutine = getChaveCanonico(canonicoRoutineDept)
        const chaveSelected = getChaveCanonico(selectedDepartamento)
        if (
          chaveRoutine !== chaveSelected &&
          canonicoRoutineDept !== selectedDepartamento &&
          rawRoutineDept !== selectedDepartamento
        ) {
          return false
        }
      }

      // Filtro por Função / Cargo (clicado no grupo acima)
      if (selectedFuncao !== 'Todas') {
        const rawResp = (r.responsavel && r.responsavel.trim()) || ''
        const canonicoResp = normalizarNomeCanonico(rawResp)
        const chaveResp = getChaveCanonico(canonicoResp)
        const chaveSelectedFunc = getChaveCanonico(selectedFuncao)
        if (
          chaveResp !== chaveSelectedFunc &&
          canonicoResp !== selectedFuncao &&
          rawResp !== selectedFuncao
        ) {
          return false
        }
      }

      return true
    })
  }, [rotinasExibicao, searchTerm, selectedFreq, selectedDepartamento, selectedFuncao])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedFreq('Todas')
    setSelectedDepartamento('Todos')
    setSelectedFuncao('Todas')
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
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#0F766E] text-white rounded-md hover:bg-[#115E59] transition-colors"
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
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#0F766E]" />
                <span>Importar Planilha</span>
              </button>

              <button
                onClick={() => {
                  setEditingRotina(null)
                  setIsFormModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
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
          if (modeloSelecionado) {
            try {
              const itens = await modelosRotinasService.getItens(modeloSelecionado.id)
              setItensCatalogoModelo(itens)
            } catch {
              // noop
            }
          }
        }}
        onSelectModelo={(mod) => {
          // Ao selecionar um modelo, resetamos os filtros para não manter filtros do modelo anterior
          setSelectedDepartamento('Todos')
          setSelectedFuncao('Todas')
          setSelectedFreq('Todas')
          setSearchTerm('')
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
            <div className="w-8 h-8 rounded-md bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-[#1F2937]">
                  Departamentos e Funções
                </h2>
                {modeloSelecionado ? (
                  isConciliado ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {availableDepartamentos.length} departamentos • {funcoesExibicao.length}{' '}
                      funções conciliadas ({modeloSelecionado.nome})
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Sem conciliação para {modeloSelecionado.nome} (0 funções)
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#6B7280]">
                    Aguardando seleção de modelo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B7280] truncate">
                {modeloSelecionado
                  ? isConciliado
                    ? 'Clique num departamento ou função para detalhar as rotinas correspondentes abaixo.'
                    : `Nenhuma função conciliada para ${modeloSelecionado.nome}. Importe a planilha ou aplique o modelo para conciliar.`
                  : 'Escolha um modelo na biblioteca acima para visualizar departamentos e funções mapeados.'}
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
          <div className="px-3.5 pb-4 pt-2 border-t border-[#E5E7EB] bg-[#F7F7F5]/30 space-y-4 animate-fade-in">
            {/* 1. Departamentos / Setores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  Departamentos / Setores ({availableDepartamentos.length})
                </span>
                {selectedDepartamento !== 'Todos' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDepartamento('Todos')}
                    className="text-[11px] text-[#0F766E] hover:underline font-semibold"
                  >
                    Mostrar todos os departamentos
                  </button>
                )}
              </div>
              {!modeloSelecionado ? (
                <p className="text-xs text-[#9CA3AF] italic">
                  Escolha um modelo na biblioteca acima para visualizar os departamentos mapeados.
                </p>
              ) : availableDepartamentos.length === 0 ? (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-md text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Nenhum departamento conciliado para este modelo.</p>
                  <p className="text-[11px] text-amber-800">
                    Importe a planilha de rotinas ou aplique o modelo na sua loja para conciliar os
                    departamentos.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDepartamento('Todos')
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      selectedDepartamento === 'Todos'
                        ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                        : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-gray-400'
                    }`}
                  >
                    <span>Todos</span>
                  </button>
                  {availableDepartamentos.map((depto) => {
                    const isSelected = selectedDepartamento === depto
                    const count = rotinasExibicao.filter((r) => {
                      const raw =
                        (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || ''
                      const canon = normalizarNomeCanonico(raw)
                      return (
                        getChaveCanonico(canon) === getChaveCanonico(depto) ||
                        canon === depto ||
                        raw === depto
                      )
                    }).length

                    return (
                      <button
                        key={depto}
                        type="button"
                        onClick={() => {
                          const next = isSelected ? 'Todos' : depto
                          setSelectedDepartamento(next)
                          // Rola suavemente até as rotinas detalhadas abaixo
                          setTimeout(() => {
                            const el = document.getElementById('catalogo-rotinas-container')
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }, 50)
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                            : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E]'
                        }`}
                        title={`Clique para detalhar as rotinas de ${depto} abaixo`}
                      >
                        <span>{depto}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#6B7280]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 2. Funções / Cargos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  Funções / Cargos ({funcoesExibicao.length})
                </span>
                {selectedFuncao !== 'Todas' && (
                  <button
                    type="button"
                    onClick={() => setSelectedFuncao('Todas')}
                    className="text-[11px] text-[#0F766E] hover:underline font-semibold"
                  >
                    Mostrar todas as funções
                  </button>
                )}
              </div>
              {!modeloSelecionado ? (
                <p className="text-xs text-[#9CA3AF] italic">
                  Escolha um modelo na biblioteca para visualizar as funções operacionais.
                </p>
              ) : funcoesExibicao.length === 0 ? (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-md text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Nenhuma função conciliada para este modelo.</p>
                  <p className="text-[11px] text-amber-800">
                    Importe a planilha ou aplique o modelo na loja para conciliar os cargos
                    operacionais.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {funcoesExibicao.map((f) => {
                    const isSelected = selectedFuncao === f.nome
                    const rotinasCount =
                      (f as unknown as { totalRotinas?: number }).totalRotinas || 0

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          const next = isSelected ? 'Todas' : f.nome
                          setSelectedFuncao(next)
                          // Rola suavemente até o detalhe da rotina abaixo
                          setTimeout(() => {
                            const el = document.getElementById('catalogo-rotinas-container')
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }, 50)
                        }}
                        className={`p-2.5 rounded-md text-xs text-left transition-all border flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-teal-50/80 border-[#0F766E] ring-2 ring-teal-600/20 shadow-xs'
                            : 'bg-white border-[#E5E7EB] hover:border-teal-600/60 hover:bg-gray-50/70 shadow-2xs'
                        }`}
                        title={`Clique para detalhar as rotinas de ${f.nome} abaixo`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-semibold block truncate ${
                                isSelected ? 'text-[#0F766E]' : 'text-[#1F2937]'
                              }`}
                            >
                              {f.nome}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                                isSelected
                                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                                  : 'bg-teal-50 text-[#0F766E] border-teal-200'
                              }`}
                            >
                              {rotinasCount} {rotinasCount === 1 ? 'rotina' : 'rotinas'}
                            </span>
                          </div>
                          {f.telefone ? (
                            <span className="text-[11px] text-[#6B7280] font-mono block truncate mt-0.5">
                              WhatsApp: {f.telefone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#9CA3AF] block truncate mt-0.5">
                              Responsável conciliado
                            </span>
                          )}
                        </div>
                        {isSelected ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F766E] text-white shrink-0">
                            Ativo
                          </span>
                        ) : f.chefe_imediato_funcao ? (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[#4B5563] shrink-0"
                            title={`Chefe imediato: ${f.chefe_imediato_funcao}`}
                          >
                            Subordinado
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fluxo das Rotinas: Só aparece após o usuário escolher um modelo na Biblioteca */}
      {!modeloSelecionado ? (
        <div className="p-8 sm:p-10 text-center bg-white border border-dashed border-[#E5E7EB] rounded-xl space-y-3 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 mx-auto flex items-center justify-center">
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
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[#0F766E] text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#1F2937] truncate">
                    {isConciliado ? 'Detalhamento de rotinas ativas:' : 'Modelo selecionado:'}{' '}
                    {modeloSelecionado.nome}
                  </span>
                  {modeloSelecionado.segmento && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-[#0F766E]">
                      {modeloSelecionado.segmento}
                    </span>
                  )}
                  {isConciliado ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Conciliado na loja
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Sem conciliação
                    </span>
                  )}
                  {(selectedDepartamento !== 'Todos' || selectedFuncao !== 'Todas') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F766E] text-white">
                      Filtrado por:{' '}
                      {[
                        selectedDepartamento !== 'Todos' ? selectedDepartamento : null,
                        selectedFuncao !== 'Todas' ? selectedFuncao : null,
                      ]
                        .filter(Boolean)
                        .join(' → ')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#4B5563] truncate">
                  {isConciliado
                    ? `${filteredRotinas.length} rotinas operacionais detalhadas abaixo sob o agrupamento selecionado.`
                    : 'Nenhuma rotina conciliada na sua loja para este modelo de negócio.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              {(selectedDepartamento !== 'Todos' || selectedFuncao !== 'Todas') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepartamento('Todos')
                    setSelectedFuncao('Todas')
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-1 rounded border border-[#E5E7EB] bg-white"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar seleção do grupo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setModeloSelecionado(null)
                  setSelectedDepartamento('Todos')
                  setSelectedFuncao('Todas')
                  setSelectedFreq('Todas')
                  setSearchTerm('')
                  try {
                    localStorage.removeItem('vivavarejo_rotinas_modelo_ativo')
                    localStorage.removeItem('vivavarejo_vitrine_segmento')
                  } catch {
                    // noop
                  }
                }}
                className="inline-flex items-center gap-1 text-xs text-[#0F766E] hover:text-[#115E59] font-semibold underline"
              >
                <span>Escolher outro modelo</span>
              </button>
            </div>
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
                  placeholder="Buscar por rotina ou responsável..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-600/25 text-[#1F2937] placeholder:text-gray-400"
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
                  <span className="ml-1 text-[#0F766E] animate-pulse">(atualizando modelo...)</span>
                )}
              </span>
            </div>

            {/* Filter Chips Bar (Apenas Frequência — Área foi removida) */}
            <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
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
                          ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-gray-400 hover:text-[#1F2937]'
                      }`}
                    >
                      {freq}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Routine Cards Grid */}
          {rotinasExibicao.length === 0 ? (
            <div className="p-8 sm:p-10 text-center bg-white border border-dashed border-[#E5E7EB] rounded-xl space-y-3 shadow-xs animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
                  Nenhuma rotina conciliada para {modeloSelecionado.nome}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  Esta loja ainda não possui rotinas conciliadas para este modelo de negócio. Os
                  dados não são derivados por inferência para garantir a realidade operacional da
                  sua loja.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
                {podeGerenciar && (
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-md shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Importar Planilha deste Modelo</span>
                  </button>
                )}
                {itensCatalogoModelo.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviaCatalogoAberto((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#374151] font-semibold rounded-md shadow-2xs transition-colors"
                  >
                    <Eye className="w-4 h-4 text-[#0F766E]" />
                    <span>
                      {previaCatalogoAberto
                        ? 'Ocultar prévia do modelo'
                        : `Ver prévia do modelo (${itensCatalogoModelo.length} sugestões)`}
                    </span>
                  </button>
                )}
              </div>

              {/* Se o usuário abrir a prévia das sugestões do catálogo */}
              {previaCatalogoAberto && itensCatalogoModelo.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-left space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between gap-2 flex-wrap bg-teal-50/60 p-3 rounded-lg border border-teal-200">
                    <div>
                      <span className="text-xs font-bold text-[#1F2937] block">
                        Prévia do Catálogo: {modeloSelecionado.nome} (Não conciliado na loja)
                      </span>
                      <span className="text-[11px] text-[#4B5563]">
                        Estas rotinas pertencem ao catálogo teórico do VivaVarejo e servem apenas
                        como referência.
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] shrink-0">
                      Modo Prévia
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {itensCatalogoModelo.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-[#1F2937] leading-snug">
                            {item.nome}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-[#4B5563] shrink-0">
                            {item.frequencia || 'Diária'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                          <span>Resp: {item.responsavel || item.funcao_nome || 'Operação'}</span>
                          {item.horario_limite && <span>• Até {item.horario_limite}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : filteredRotinas.length === 0 ? (
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
                          : 'border-[#E5E7EB] hover:border-[#0F766E]/50'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Name + Badges + Edit/Delete quick buttons */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className={`font-bold text-base leading-snug cursor-pointer hover:text-[#0F766E] transition-colors flex-1 ${
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
                              className="p-1 text-[#9CA3AF] hover:text-[#0F766E] rounded transition-colors"
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-teal-50 text-[#0F766E] rounded border border-teal-200">
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
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-[#0F766E] rounded border border-teal-200 hover:bg-teal-100 transition-colors"
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
                          <span>{normalizarNomeCanonico(rotina.responsavel)}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E7EB] text-[#4B5563]">
                          <span>{rotina.frequencia}</span>
                        </span>
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
                        className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 group transition-colors"
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
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : pastDue
                              ? 'border-red-400 hover:border-red-600 text-transparent hover:text-red-400 bg-white'
                              : 'border-[#D1D5DB] hover:border-[#0F766E] text-transparent hover:text-gray-300 bg-white'
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
                  <span className="font-medium text-[#1F2937]">
                    {normalizarNomeCanonico(selectedRotina.responsavel)}
                  </span>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 rounded-md transition-colors"
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
                          className="px-3 py-2 text-xs font-semibold rounded-md bg-teal-50 text-[#0F766E] hover:bg-teal-100 flex items-center gap-1.5 transition-colors border border-teal-200"
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
                            : 'bg-[#0F766E] text-white hover:bg-[#115E59]'
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
