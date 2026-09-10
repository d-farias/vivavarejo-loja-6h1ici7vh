import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import { visitasPromotorService, rotinasPromotorService } from '@/services/visitasPromotor'
import { planosAcaoService } from '@/services/planosAcao'
import { tarefasValidadeService } from '@/services/tarefasValidade'
import { perdasService } from '@/services/perdas'
import { ConcluirValidadeModal } from '@/components/ConcluirValidadeModal'
import { StoreSelector } from '@/components/StoreSelector'
import { ReadequarTarefaModal } from '@/components/ReadequarTarefaModal'
import { ConcluirRotinaModal } from '@/components/ConcluirRotinaModal'
import { ConcluirVisitaModal } from '@/components/ConcluirVisitaModal'
import { ExecucaoGuiadaModal, ExecucaoGuiadaResult } from '@/components/ExecucaoGuiadaModal'
import { PlanoAcaoModal } from '@/components/PlanoAcaoModal'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { BotaoAvisoWhatsApp } from '@/components/BotaoAvisoWhatsApp'
import { isPlanoAtrasado } from '@/components/PlanosAcaoCard'
import { isVisitaAtrasada } from '@/services/visitasPromotor'
import { parseHorarioLimiteToMinutes, getHorarioStatus } from '@/lib/time-utils'
import { normalizarNomeCanonico, getChaveCanonico } from '@/lib/cargos'
import { AgendaMinhaEquipeSecao } from '@/components/AgendaMinhaEquipeSecao'
import type {
  Rotina,
  ExecucaoRotina,
  VisitaPromotor,
  RotinaPromotor,
  PlanoAcao,
  TarefaValidade,
  Perda,
  StatusValidacaoRotina,
} from '@/types'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Handshake,
  CheckSquare,
  ArrowUpDown,
  Filter,
  Search,
  Check,
  Camera,
  Layers,
  Sparkles,
  Info,
  Building2,
  Store,
  User,
  Plus,
  PlayCircle,
} from 'lucide-react'
import { pb } from '@/lib/pocketbase/client'

export default function AgendaPage() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojaSelecionada } = useStore()

  // Data atual da visualização da Agenda (padrão hoje)
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getTodayDateString())

  // Estados de dados
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [visitas, setVisitas] = useState<VisitaPromotor[]>([])
  const [rotinasPromotores, setRotinasPromotores] = useState<RotinaPromotor[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [tarefasValidade, setTarefasValidade] = useState<TarefaValidade[]>([])
  const [perdasLoja, setPerdasLoja] = useState<Perda[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Filtros locais
  const [filtroArea, setFiltroArea] = useState<string>('Todas')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState<string>('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  // Modais
  const [readequarModal, setReadequarModal] = useState<{
    open: boolean
    rotina: Rotina | null
  }>({ open: false, rotina: null })

  const [concluirModalRotina, setConcluirModalRotina] = useState<Rotina | null>(null)
  const [execucaoGuiadaRotina, setExecucaoGuiadaRotina] = useState<Rotina | null>(null)
  const [concluirVisitaModal, setConcluirVisitaModal] = useState<VisitaPromotor | null>(null)
  const [concluirValidadeModal, setConcluirValidadeModal] = useState<TarefaValidade | null>(null)
  const [planoAcaoModal, setPlanoAcaoModal] = useState<{ open: boolean; rotina?: Rotina | null }>({
    open: false,
    rotina: null,
  })
  const [visualizarFoto, setVisualizarFoto] = useState<{
    execucao: ExecucaoRotina
    rotina?: Rotina
  } | null>(null)

  // Carregamento de dados
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r, e, v, rp, p, tv, pd] = await Promise.all([
        rotinasService.getAll(lojaSelecionadaId),
        execucoesService.getExecutionsByDate(currentDateStr).catch(() => [] as ExecucaoRotina[]),
        visitasPromotorService
          .getAll(lojaSelecionadaId || undefined)
          .catch(() => [] as VisitaPromotor[]),
        rotinasPromotorService
          .getAll(lojaSelecionadaId || undefined)
          .catch(() => [] as RotinaPromotor[]),
        planosAcaoService.getAll(lojaSelecionadaId).catch(() => [] as PlanoAcao[]),
        tarefasValidadeService.getAll(lojaSelecionadaId).catch(() => [] as TarefaValidade[]),
        perdasService.getAll(lojaSelecionadaId).catch(() => [] as Perda[]),
      ])

      setRotinas(r)
      setExecucoes(e)
      setVisitas(v)
      setRotinasPromotores(rp)
      setPlanosAcao(p)
      setTarefasValidade(tv)
      setPerdasLoja(pd)
    } catch (err) {
      console.error('Erro ao carregar agenda:', err)
    } finally {
      setLoading(false)
    }
  }, [lojaSelecionadaId, currentDateStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Navegação de dias
  const isToday = currentDateStr === getTodayDateString()

  // Dia da semana e semana do mês da data selecionada para filtrar tarefas de validade
  const { diaDaSemana, semanaDoMes } = useMemo(() => {
    const parts = currentDateStr.split('-').map(Number)
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2])
    const diasSemanaNomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
    const semMes = Math.min(Math.ceil(parts[2] / 7), 4)
    return {
      diaDaSemana: diasSemanaNomes[dateObj.getDay()],
      semanaDoMes: semMes,
    }
  }, [currentDateStr])

  // Tarefas de Validade que se aplicam à data selecionada
  const tarefasValidadeDoDia = useMemo(() => {
    return tarefasValidade.filter((t) => {
      if (t.semana_mes && t.semana_mes > 0) {
        if (t.semana_mes !== semanaDoMes) return false
      }
      const dataEsp = (t.data_especifica || '').substring(0, 10)
      const rec = (t.recorrencia || '').toLowerCase().trim()

      if (dataEsp) return dataEsp === currentDateStr
      if (rec) {
        if (rec === 'diaria' || rec === 'diária' || rec === 'todos os dias') return true
        if (rec.includes(diaDaSemana) || (diaDaSemana === 'terça' && rec.includes('terca')))
          return true
        if (diaDaSemana === 'sábado' && rec.includes('sabado')) return true
        if (diaDaSemana === 'domingo' && rec.includes('domingo')) return true
        return false
      }
      return true
    })
  }, [tarefasValidade, currentDateStr, diaDaSemana, semanaDoMes])

  // Setores críticos com perdas registradas na loja (usar dados do módulo Perdas & Inventário)
  const setoresComPerdas = useMemo(() => {
    const set = new Set<string>()
    for (const p of perdasLoja) {
      if (p.setor_categoria) {
        set.add(p.setor_categoria.trim().toLowerCase())
      }
    }
    return set
  }, [perdasLoja])

  // Minutos atuais para avaliar prazo vencido ou dentro da próxima hora
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const handleMudarDia = (offsetDays: number) => {
    const parts = currentDateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    d.setDate(d.getDate() + offsetDays)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setCurrentDateStr(`${yyyy}-${mm}-${dd}`)
  }

  const handleIrParaHoje = () => {
    setCurrentDateStr(getTodayDateString())
  }

  const formatarDataCabecalho = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    const dayAndMonth = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      formatted: dayAndMonth,
    }
  }

  // Mapeamento de execuções da data
  const execucoesMap = useMemo(() => {
    const map = new Map<string, ExecucaoRotina>()
    for (const ex of execucoes) {
      // Se houver mais de uma, preserva a mais recente
      map.set(ex.rotina, ex)
    }
    return map
  }, [execucoes])

  // Rotinas do dia (considerando se foi adiada para outra data ou adiada para a data corrente)
  // Com deduplicação por id e por assinatura na renderização para nunca listar 2x
  const rotinasDoDia = useMemo(() => {
    const seenIds = new Set<string>()
    return rotinas.filter((r) => {
      if (seenIds.has(r.id)) return false
      seenIds.add(r.id)

      // Se tiver campo adiada_para_data e for diferente da data atual, não aparece hoje
      if (r.adiada_para_data && r.adiada_para_data !== currentDateStr) {
        return false
      }
      // Se a rotina tem frequência diária ou se é a data planejada
      return true
    })
  }, [rotinas, currentDateStr])

  // Todas as áreas presentes nas rotinas (unificadas pelo padrão canônico)
  const areasDisponiveis = useMemo(() => {
    const areasMap = new Map<string, string>()
    rotinas.forEach((r) => {
      const raw = (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()) || ''
      if (!raw) return
      const canonico = normalizarNomeCanonico(raw)
      const chave = getChaveCanonico(canonico)
      if (!areasMap.has(chave)) {
        areasMap.set(chave, canonico)
      }
    })
    return Array.from(areasMap.values()).sort((a, b) => a.localeCompare(b))
  }, [rotinas])

  // Status de cada rotina do dia
  const itensAgenda = useMemo(() => {
    return rotinasDoDia.map((r) => {
      const exec = execucoesMap.get(r.id)
      const concluida = Boolean(exec?.concluida && exec.status_validacao !== 'devolvida')
      const devolvida = exec?.status_validacao === 'devolvida'
      const aguardandoValidacao = Boolean(
        exec?.concluida && exec.status_validacao === 'aguardando_validacao',
      )
      const aprovada = Boolean(exec?.concluida && exec.status_validacao === 'aprovada')

      // Horário efetivo para a agenda (horário readequado ou horário limite original)
      const horarioEfetivo = r.adiada_para_horario || r.horario_limite || ''
      const horarioStatus = getHorarioStatus(horarioEfetivo, concluida)
      const isAtrasada = !concluida && isToday && horarioStatus.isAtrasada

      let statusFormatado:
        | 'concluida'
        | 'aguardando_validacao'
        | 'devolvida'
        | 'atrasada'
        | 'no_prazo'
        | 'pendente' = 'pendente'
      if (devolvida) {
        statusFormatado = 'devolvida'
      } else if (aprovada) {
        statusFormatado = 'concluida'
      } else if (aguardandoValidacao) {
        statusFormatado = 'aguardando_validacao'
      } else if (isAtrasada) {
        statusFormatado = 'atrasada'
      } else if (horarioEfetivo) {
        statusFormatado = 'no_prazo'
      }

      const minutosHorario = parseHorarioLimiteToMinutes(horarioEfetivo)
      const prioridade = r.prioridade_dia || 2

      return {
        rotina: r,
        execucao: exec,
        concluida,
        devolvida,
        aguardandoValidacao,
        aprovada,
        isAtrasada,
        horarioEfetivo,
        minutosHorario,
        prioridade,
        statusFormatado,
        area:
          normalizarNomeCanonico(
            (r.area && r.area.trim()) || (r.responsavel && r.responsavel.trim()),
          ) || 'Geral',
      }
    })
  }, [rotinasDoDia, execucoesMap, isToday])

  // Filtragem e Ordenação da Agenda
  const itensFiltrados = useMemo(() => {
    const chaveFiltro = filtroArea !== 'Todas' ? getChaveCanonico(filtroArea) : ''

    return itensAgenda
      .filter((item) => {
        if (filtroArea !== 'Todas') {
          const itemChave = getChaveCanonico(item.area)
          const respChave = getChaveCanonico(item.rotina.responsavel)
          if (itemChave !== chaveFiltro && respChave !== chaveFiltro && item.area !== filtroArea) {
            return false
          }
        }

        if (filtroStatus === 'concluidas' && !item.concluida) return false
        if (filtroStatus === 'atrasadas' && !item.isAtrasada) return false
        if (filtroStatus === 'pendentes' && item.concluida) return false
        if (filtroStatus === 'aguardando' && !item.aguardandoValidacao) return false
        if (filtroStatus === 'devolvidas' && !item.devolvida) return false

        if (busca.trim()) {
          const q = busca.toLowerCase()
          const matchNome = item.rotina.nome.toLowerCase().includes(q)
          const matchResp = item.rotina.responsavel?.toLowerCase().includes(q)
          const matchArea = item.area.toLowerCase().includes(q)
          const matchHorario = item.horarioEfetivo.toLowerCase().includes(q)
          if (!matchNome && !matchResp && !matchArea && !matchHorario) return false
        }

        return true
      })
      .sort((a, b) => {
        // 1. Concluídas vão para o final
        if (a.concluida !== b.concluida) {
          return a.concluida ? 1 : -1
        }

        // 2. Atrasadas têm prioridade máxima de alerta no topo se não concluídas
        if (!a.concluida && !b.concluida) {
          if (a.isAtrasada !== b.isAtrasada) {
            return a.isAtrasada ? -1 : 1
          }
        }

        // 3. Devolvidas recebem destaque para retrabalho
        if (a.devolvida !== b.devolvida) {
          return a.devolvida ? -1 : 1
        }

        // 4. Prioridade do dia definida (1 = topo, 2, 3...)
        if (a.prioridade !== b.prioridade) {
          return a.prioridade - b.prioridade
        }

        // 5. Ordenação por Horário Limite em minutos (crescente)
        if (a.minutosHorario !== null && b.minutosHorario !== null) {
          if (a.minutosHorario !== b.minutosHorario) {
            return a.minutosHorario - b.minutosHorario
          }
        } else if (a.minutosHorario !== null) {
          return -1
        } else if (b.minutosHorario !== null) {
          return 1
        }

        return a.rotina.nome.localeCompare(b.rotina.nome)
      })
  }, [itensAgenda, filtroArea, filtroStatus, busca])

  // Visitas de promotores na data
  const visitasDoDia = useMemo(() => {
    return visitas.filter((v) => {
      const vData = v.data_visita ? v.data_visita.substring(0, 10) : ''
      return vData === currentDateStr
    })
  }, [visitas, currentDateStr])

  // Planos de ação com prazo na data ou atrasados
  const planosDoDia = useMemo(() => {
    return planosAcao.filter((p) => {
      if (!p.prazo) return false
      const pPrazo = p.prazo.substring(0, 10)
      return pPrazo === currentDateStr || (pPrazo <= currentDateStr && p.status !== 'concluida')
    })
  }, [planosAcao, currentDateStr])

  // =========================================================================
  // MOTOR DE PRIORIDADE: Itens Abertos Críticos do Dia ("Precisam de atenção agora")
  // =========================================================================
  interface ItemCritico {
    id: string
    tipo: 'rotina' | 'validade' | 'plano' | 'visita'
    titulo: string
    setor: string
    responsavel: string
    prazo: string
    statusBadge: 'Atrasada' | 'Aguardando Validação' | 'Devolvida' | 'No prazo'
    statusVariant: 'atrasada' | 'aguardando' | 'devolvida' | 'no_prazo'
    score: number
    motivos: string[]
    // Referências para ações rápidas reutilizando fluxos existentes
    rotinaRef?: Rotina
    validadeRef?: TarefaValidade
    planoRef?: PlanoAcao
    visitaRef?: VisitaPromotor
  }

  const itensCriticos = useMemo(() => {
    const list: ItemCritico[] = []

    // 1. ROTINAS ABERTAS DO DIA
    for (const item of itensAgenda) {
      if (item.concluida) continue // Concluídas somem de ambos

      let score = 0
      const motivos: string[] = []

      // Status Devolvida (retrabalho urgente)
      if (item.devolvida) {
        score += 80
        motivos.push('Devolvida pelo regional')
      }

      // Prazo vencido vs dentro da próxima hora
      if (item.isAtrasada) {
        score += 100
        if (item.minutosHorario !== null) {
          const diffAtraso = currentMinutes - item.minutosHorario
          if (diffAtraso > 0) {
            score += Math.min(diffAtraso, 120) // peso maior quanto mais atrasado
          }
        }
        motivos.push('Prazo vencido')
      } else if (item.minutosHorario !== null && isToday) {
        const diff = item.minutosHorario - currentMinutes
        if (diff >= 0 && diff <= 60) {
          score += 40
          motivos.push('Vence na próxima hora')
        }
      }

      // Prioridade alta do dia (P1)
      if (item.prioridade === 1) {
        score += 35
        motivos.push('Prioridade alta')
      } else if (item.prioridade === 2) {
        score += 10
      }

      // Setor crítico com perdas registradas
      if (item.area && setoresComPerdas.has(item.area.trim().toLowerCase())) {
        score += 30
        motivos.push('Setor com histórico de perdas')
      }

      // Aguardando validação
      if (item.aguardandoValidacao) {
        score += 25
        motivos.push('Aguardando validação')
      }

      // Só qualifica se tiver alguma criticidade (score >= 25)
      if (score >= 25) {
        let badge: ItemCritico['statusBadge'] = 'No prazo'
        let variant: ItemCritico['statusVariant'] = 'no_prazo'

        if (item.devolvida) {
          badge = 'Devolvida'
          variant = 'devolvida'
        } else if (item.aguardandoValidacao) {
          badge = 'Aguardando Validação'
          variant = 'aguardando'
        } else if (item.isAtrasada) {
          badge = 'Atrasada'
          variant = 'atrasada'
        }

        list.push({
          id: item.rotina.id,
          tipo: 'rotina',
          titulo: item.rotina.nome,
          setor: normalizarNomeCanonico(item.area),
          responsavel: normalizarNomeCanonico(item.rotina.responsavel) || 'Equipe',
          prazo: item.horarioEfetivo ? `Limite: ${item.horarioEfetivo}` : 'Integral',
          statusBadge: badge,
          statusVariant: variant,
          score,
          motivos,
          rotinaRef: item.rotina,
        })
      }
    }

    // 2. TAREFAS DE VALIDADE × CALENDÁRIO ABERTAS DO DIA
    for (const tv of tarefasValidadeDoDia) {
      const st = tv.status || 'pendente'
      if (st === 'aprovada') continue // Concluídas somem

      let score = 0
      const motivos: string[] = []
      const minInicio = parseHorarioLimiteToMinutes(tv.horario_inicio)
      const minFim = parseHorarioLimiteToMinutes(tv.horario_fim || '15:00')
      const isAtrasadaValidade =
        isToday && st === 'pendente' && minInicio !== null && currentMinutes > minInicio

      if (st === 'devolvida') {
        score += 85
        motivos.push('Devolvida para ajuste')
      }

      if (isAtrasadaValidade) {
        score += 95
        if (minInicio !== null) {
          const diff = currentMinutes - minInicio
          if (diff > 0) score += Math.min(diff, 100)
        }
        motivos.push('Não aberta no horário')
      } else if (minInicio !== null && isToday) {
        const diff = minInicio - currentMinutes
        if (diff >= 0 && diff <= 60) {
          score += 45
          motivos.push('Abertura na próxima hora')
        }
      }

      // Se passou do horário final e continua pendente/em andamento
      if (minFim !== null && isToday && currentMinutes > minFim && st !== 'aguardando_validacao') {
        score += 50
        motivos.push('Prazo final ultrapassado')
      }

      if (st === 'aguardando_validacao') {
        score += 30
        motivos.push('Aguardando Líder Prevenção')
      }

      // Setor crítico com perdas
      if (tv.setor_categoria && setoresComPerdas.has(tv.setor_categoria.trim().toLowerCase())) {
        score += 35
        motivos.push('Setor crítico com perdas')
      }

      if (score >= 25) {
        let badge: ItemCritico['statusBadge'] = 'No prazo'
        let variant: ItemCritico['statusVariant'] = 'no_prazo'

        if (st === 'devolvida') {
          badge = 'Devolvida'
          variant = 'devolvida'
        } else if (st === 'aguardando_validacao') {
          badge = 'Aguardando Validação'
          variant = 'aguardando'
        } else if (isAtrasadaValidade) {
          badge = 'Atrasada'
          variant = 'atrasada'
        }

        list.push({
          id: tv.id,
          tipo: 'validade',
          titulo: `Validade: ${tv.setor_categoria}`,
          setor: normalizarNomeCanonico(tv.setor_categoria),
          responsavel:
            tv.executor_nome ||
            normalizarNomeCanonico(tv.validador_funcao_nome) ||
            'Prevenção de Perdas',
          prazo: `${tv.horario_inicio}${tv.horario_fim ? ` – ${tv.horario_fim}` : ''}`,
          statusBadge: badge,
          statusVariant: variant,
          score,
          motivos,
          validadeRef: tv,
        })
      }
    }

    // 3. PLANOS DE AÇÃO / CHAMADOS DE MANUTENÇÃO & ALERTA ABERTOS
    for (const plano of planosDoDia) {
      if (plano.status === 'concluida') continue // Concluídos somem

      let score = 0
      const motivos: string[] = []
      const atrasado = isPlanoAtrasado(plano)

      if (atrasado) {
        score += 110 // Plano/Chamado atrasado é desvio não corrigido
        motivos.push(
          plano.area_demandante
            ? `Chamado (${plano.area_demandante}) atrasado`
            : 'Ação 5W2H atrasada',
        )
      } else {
        score += 35
        motivos.push('Prazo hoje')
      }

      if (plano.prioridade === 'alta') {
        score += 30
        motivos.push('Prioridade alta / crítica')
      }

      const pPrazo = plano.prazo ? plano.prazo.substring(0, 10) : ''
      const setorExibicao = plano.area_demandante || plano.expand?.rotina?.area || 'Operações'
      const prefixoTitulo = plano.area_demandante
        ? `Chamado [${plano.area_demandante}]: `
        : 'Ação 5W2H: '

      list.push({
        id: plano.id,
        tipo: 'plano',
        titulo: `${prefixoTitulo}${plano.descricao}`,
        setor: normalizarNomeCanonico(setorExibicao),
        responsavel: normalizarNomeCanonico(plano.responsavel) || 'Responsável',
        prazo: pPrazo ? `Prazo: ${pPrazo.split('-').reverse().slice(0, 2).join('/')}` : 'Sem prazo',
        statusBadge: atrasado ? 'Atrasada' : 'No prazo',
        statusVariant: atrasado ? 'atrasada' : 'no_prazo',
        score,
        motivos,
        planoRef: plano,
      })
    }

    // 4. VISITAS DE PROMOTORES DO DIA
    for (const v of visitasDoDia) {
      if (v.status === 'realizada') continue

      const atrasada = isVisitaAtrasada(v)
      let score = 0
      const motivos: string[] = []

      if (atrasada) {
        score += 75
        motivos.push('Visita de promotor atrasada')
      } else if (v.hora_prevista && isToday) {
        const minVis = parseHorarioLimiteToMinutes(v.hora_prevista)
        if (minVis !== null && minVis - currentMinutes <= 60 && minVis >= currentMinutes) {
          score += 30
          motivos.push('Atendimento na próxima hora')
        }
      }

      if (score >= 25) {
        const promotorNome = v.expand?.promotor?.nome || 'Promotor'
        const fornNome = v.expand?.promotor?.expand?.fornecedor?.nome
        list.push({
          id: v.id,
          tipo: 'visita',
          titulo: `Atendimento: ${promotorNome}${fornNome ? ` (${fornNome})` : ''}`,
          setor: 'Promotores & Fornecedores',
          responsavel: promotorNome,
          prazo: v.hora_prevista ? `Previsto: ${v.hora_prevista}` : 'Hoje',
          statusBadge: atrasada ? 'Atrasada' : 'No prazo',
          statusVariant: atrasada ? 'atrasada' : 'no_prazo',
          score,
          motivos,
          visitaRef: v,
        })
      }
    }

    // Ordenar pelos mais críticos (score decrescente) e retornar os 5 mais críticos
    return list.sort((a, b) => b.score - a.score).slice(0, 5)
  }, [
    itensAgenda,
    tarefasValidadeDoDia,
    planosDoDia,
    visitasDoDia,
    setoresComPerdas,
    currentMinutes,
    isToday,
  ])

  // Total de itens abertos do dia para saber se a lista do dia está 100% concluída
  const totalItensAbertosNoDia = useMemo(() => {
    const rotinasAbertas = itensAgenda.filter((i) => !i.concluida).length
    const validadesAbertas = tarefasValidadeDoDia.filter((t) => t.status !== 'aprovada').length
    const planosAbertos = planosDoDia.filter((p) => p.status !== 'concluida').length
    const visitasAbertas = visitasDoDia.filter((v) => v.status !== 'realizada').length
    return rotinasAbertas + validadesAbertas + planosAbertos + visitasAbertas
  }, [itensAgenda, tarefasValidadeDoDia, planosDoDia, visitasDoDia])

  // Contadores KPIs do dia
  const statsDia = useMemo(() => {
    const total = itensAgenda.length
    const concluidas = itensAgenda.filter((i) => i.concluida).length
    const atrasadas = itensAgenda.filter((i) => i.isAtrasada).length
    const aguardando = itensAgenda.filter((i) => i.aguardandoValidacao).length
    const devolvidas = itensAgenda.filter((i) => i.devolvida).length
    const pendentes = Math.max(0, total - concluidas)
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0

    return {
      total,
      concluidas,
      atrasadas,
      aguardando,
      devolvidas,
      pendentes,
      taxa,
      visitasCount: visitasDoDia.length,
      planosCount: planosDoDia.length,
    }
  }, [itensAgenda, visitasDoDia, planosDoDia])

  // Toque rápido para alternar conclusão da rotina
  const handleToggleConclusao = async (rotinaId: string) => {
    if (!user || submittingId === rotinaId) return

    const existingExec = execucoesMap.get(rotinaId)
    const isCurrentlyDone = Boolean(
      existingExec?.concluida && existingExec.status_validacao !== 'devolvida',
    )

    setSubmittingId(rotinaId)
    try {
      const saved = await execucoesService.toggleExecution(
        rotinaId,
        user.id,
        isCurrentlyDone,
        existingExec?.id,
        currentDateStr,
      )
      setExecucoes((prev) => {
        const filtered = prev.filter((e) => e.id !== saved.id && e.rotina !== rotinaId)
        return [...filtered, saved]
      })
    } catch (err) {
      console.error('Erro ao alternar conclusão na agenda:', err)
    } finally {
      setSubmittingId(null)
    }
  }

  // Salvar readequação de tarefa
  const handleSaveReadequacao = async (params: {
    adiada_para_data?: string
    adiada_para_horario?: string
    prioridade_dia?: number
    observacoes?: string
  }) => {
    if (!readequarModal.rotina) return
    const rotinaId = readequarModal.rotina.id

    try {
      await rotinasService.adiarRotina(rotinaId, {
        adiada_para_data: params.adiada_para_data,
        adiada_para_horario: params.adiada_para_horario,
        observacoes: params.observacoes,
      })
      if (params.prioridade_dia) {
        await rotinasService.update(rotinaId, { prioridade_dia: params.prioridade_dia })
      }
      loadData()
    } catch (err) {
      console.error('Erro ao readequar tarefa:', err)
    }
  }

  // Concluir visita de promotor do dia
  const handleConcluirVisita = async (visitaId: string, params: any) => {
    if (!user) return
    try {
      if (params instanceof FormData) {
        if (!params.has('registrado_por')) {
          params.append('registrado_por', user.id)
        }
        await visitasPromotorService.registrarConclusao(visitaId, params)
      } else {
        await visitasPromotorService.registrarConclusao(visitaId, {
          ...params,
          registrado_por: user.id,
        })
      }
      loadData()
    } catch (err) {
      console.error('Erro ao concluir visita:', err)
    }
  }

  const dataInfo = formatarDataCabecalho(currentDateStr)

  const handleConcluirExecucaoGuiadaAgenda = async (result: ExecucaoGuiadaResult) => {
    if (!execucaoGuiadaRotina || !user) return
    const existingExec = execucoesMap.get(execucaoGuiadaRotina.id)
    const isCurrentlyDone = Boolean(
      existingExec?.concluida && existingExec.status_validacao !== 'devolvida',
    )
    await execucoesService.toggleExecution(
      execucaoGuiadaRotina.id,
      user.id,
      isCurrentlyDone,
      existingExec?.id,
      currentDateStr,
      result.fotoFile,
    )
    if (result.observacao || !result.conforme) {
      // Atualiza observação / status se necessário
      const updatedList = await execucoesService.getExecutionsByDate(currentDateStr)
      const thisExec = updatedList.find((e) => e.rotina === execucaoGuiadaRotina.id)
      if (thisExec) {
        await pb.collection('execucoes_rotinas').update(thisExec.id, {
          observacao: result.observacao,
          status_validacao: result.conforme ? 'aprovada' : 'aguardando_validacao',
        })
      }
    }
    setExecucaoGuiadaRotina(null)
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Store Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
              Agenda Operacional do Dia
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
              Dia × Tarefas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Ordem cronológica das rotinas, horários limite, visitas de promotores e planos de ação
            da loja.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StoreSelector />
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMudarDia(-1)}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 text-[#374151] transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB]">
            <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <span>{dataInfo.weekday}</span>
                {isToday && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#2563EB] text-white">
                    Hoje
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#6B7280]">{dataInfo.formatted}</div>
            </div>
          </div>

          <button
            onClick={() => handleMudarDia(1)}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 text-[#374151] transition-colors"
            title="Dia seguinte"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleIrParaHoje}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] border border-[#2563EB]/40 hover:bg-blue-50 transition-colors"
            >
              Voltar para Hoje
            </button>
          )}
        </div>

        {/* Input direto de data */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-[#6B7280]">Ir para:</span>
          <input
            type="date"
            value={currentDateStr}
            onChange={(e) => e.target.value && setCurrentDateStr(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
          />
        </div>
      </div>

      {/* KPI Cards do Dia */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Rotinas do Dia</span>
            <Layers className="w-4 h-4 text-[#2563EB]" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {statsDia.total}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">
            {statsDia.concluidas} concluídas
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>% Concluído</span>
            <CheckCircle2
              className={`w-4 h-4 ${
                statsDia.taxa >= 90
                  ? 'text-emerald-600'
                  : statsDia.taxa >= 70
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            />
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-1 leading-none ${
              statsDia.taxa >= 90
                ? 'text-emerald-700'
                : statsDia.taxa >= 70
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {statsDia.taxa}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                statsDia.taxa >= 90
                  ? 'bg-emerald-600'
                  : statsDia.taxa >= 70
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${statsDia.taxa}%` }}
            />
          </div>
        </div>

        <div
          className={`p-3 sm:p-4 rounded-lg shadow-2xs border ${
            statsDia.atrasadas > 0
              ? 'bg-red-50/60 border-red-200 text-[#B91C1C]'
              : 'bg-white border-[#E5E7EB]'
          }`}
        >
          <span className="text-xs font-medium flex items-center justify-between">
            <span
              className={statsDia.atrasadas > 0 ? 'font-bold text-[#B91C1C]' : 'text-[#6B7280]'}
            >
              Atrasadas
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${statsDia.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-gray-400'}`}
            />
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-1 leading-none ${
              statsDia.atrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
            }`}
          >
            {statsDia.atrasadas}
          </div>
          <span className="text-xs opacity-80 mt-1 block">
            {statsDia.atrasadas > 0 ? 'Necessita readequação' : 'Tudo no prazo'}
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Validação Regional</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1 leading-none">
            {statsDia.aguardando}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">
            {statsDia.devolvidas > 0
              ? `${statsDia.devolvidas} devolvida(s)`
              : 'Aguardando validação'}
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Visitas Promotores</span>
            <Handshake className="w-4 h-4 text-[#2563EB]" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {statsDia.visitasCount}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">
            {visitasDoDia.filter((v) => v.status === 'realizada').length} realizadas hoje
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium flex items-center justify-between">
            <span>Planos 5W2H (Prazo)</span>
            <CheckSquare className="w-4 h-4 text-[#2563EB]" />
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {statsDia.planosCount}
          </div>
          <span className="text-xs text-[#6B7280] mt-1 block">
            {planosDoDia.filter((p) => p.status === 'concluida').length} concluídos
          </span>
        </div>
      </div>

      {/* MOTOR DE PRIORIDADE: "Precisam de atenção agora" (topo da Agenda antes da lista do dia) */}
      {totalItensAbertosNoDia > 0 && (
        <div className="bg-white border-2 border-[#2563EB]/40 rounded-xl shadow-xs overflow-hidden">
          {/* Header do Motor de Prioridade */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/40 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#1F2937]">
                    Precisam de atenção agora
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2563EB] text-white">
                    Motor de Prioridade
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Itens mais críticos do dia da loja (rotinas, validades, planos 5W2H e visitas)
                  ordenados por urgência e impacto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-[#6B7280]">
                {itensCriticos.length > 0
                  ? `Mostrando ${itensCriticos.length} mais críticos`
                  : 'Fila sob controle'}
              </span>
            </div>
          </div>

          {/* Conteúdo: Lista dos 5 mais críticos ou mensagem positiva curta */}
          {itensCriticos.length === 0 ? (
            <div className="p-5 text-center bg-[#F7F7F5]/50 flex items-center justify-center gap-2 text-xs text-[#374151]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Nada crítico agora. Boa gestão!</span>
              <span className="text-[#6B7280]">
                — Todas as pendências imediatas estão encaminhadas ou dentro do prazo.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {itensCriticos.map((item, idx) => (
                <div
                  key={`${item.tipo}-${item.id}`}
                  className={`p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                    item.statusVariant === 'atrasada'
                      ? 'bg-red-50/30 border-l-4 border-l-[#B91C1C]'
                      : item.statusVariant === 'devolvida'
                        ? 'bg-amber-50/30 border-l-4 border-l-amber-500'
                        : item.statusVariant === 'aguardando'
                          ? 'bg-blue-50/20 border-l-4 border-l-[#2563EB]'
                          : 'bg-white hover:bg-gray-50/60 border-l-4 border-l-blue-300'
                  }`}
                >
                  {/* Informações do Item Crítico */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold w-5 h-5 rounded-full bg-gray-100 text-[#4B5563] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <span className="font-bold text-xs sm:text-sm text-[#1F2937]">
                        {item.titulo}
                      </span>

                      {/* Badge de Status Padrão */}
                      {item.statusBadge === 'Atrasada' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#B91C1C] border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          Atrasada
                        </span>
                      )}
                      {item.statusBadge === 'Devolvida' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <RotateCcw className="w-3 h-3" />
                          Devolvida
                        </span>
                      )}
                      {item.statusBadge === 'Aguardando Validação' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] border border-blue-200">
                          <Clock className="w-3 h-3" />
                          Aguardando Validação
                        </span>
                      )}
                      {item.statusBadge === 'No prazo' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#4B5563]">
                          <Clock className="w-3 h-3" />
                          No prazo
                        </span>
                      )}

                      {/* Motivos da Criticidade / Pontuação */}
                      {item.motivos.slice(0, 2).map((motivo, mIdx) => (
                        <span
                          key={mIdx}
                          className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white border border-[#E5E7EB] text-[#4B5563]"
                        >
                          {motivo}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
                      <span className="font-medium text-[#1F2937] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{item.prazo}</span>
                      </span>

                      <span className="px-1.5 py-0.2 rounded bg-gray-100 text-[11px] font-medium text-[#4B5563]">
                        {item.setor}
                      </span>

                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{item.responsavel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Ação rápida para resolver/concluir (reusando ações já existentes — não duplica fluxo) */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Caso 1: Rotina */}
                    {item.tipo === 'rotina' && item.rotinaRef && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleConclusao(item.rotinaRef!.id)}
                          disabled={submittingId === item.rotinaRef.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                          title="Concluir rotina em 1 toque"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConcluirModalRotina(item.rotinaRef!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-xs font-semibold transition-colors"
                          title="Concluir anexando foto"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Com foto</span>
                        </button>
                      </>
                    )}

                    {/* Caso 2: Validade */}
                    {item.tipo === 'validade' && item.validadeRef && (
                      <button
                        type="button"
                        onClick={() => setConcluirValidadeModal(item.validadeRef!)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
                        title="Concluir auditoria com foto"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Concluir Auditoria</span>
                      </button>
                    )}

                    {/* Caso 3: Plano 5W2H / Chamado de Manutenção */}
                    {item.tipo === 'plano' && item.planoRef && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await planosAcaoService.update(item.planoRef!.id, {
                              status: 'concluida',
                            })
                            loadData()
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                          title="Marcar chamado ou plano como concluído"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                        <BotaoAvisoWhatsApp
                          lojaNome={lojaSelecionada?.nome || item.planoRef.expand?.loja?.nome}
                          tarefaTitulo={`Chamado: ${item.planoRef.descricao}`}
                          setor={
                            item.planoRef.area_demandante ||
                            item.planoRef.expand?.rotina?.area ||
                            'Operações'
                          }
                          horario={
                            item.planoRef.prazo
                              ? new Date(item.planoRef.prazo).toLocaleDateString('pt-BR')
                              : undefined
                          }
                          situacao={
                            item.statusVariant === 'atrasada'
                              ? 'Chamado/Ação Atrasada'
                              : 'Atenção Operacional'
                          }
                          nomeResponsavel={item.planoRef.responsavel}
                          compact
                        />
                      </>
                    )}

                    {/* Caso 4: Visita de Promotor */}
                    {item.tipo === 'visita' && item.visitaRef && (
                      <button
                        type="button"
                        onClick={() => setConcluirVisitaModal(item.visitaRef!)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
                        title="Registrar atendimento do promotor"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Concluir Atendimento</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AGENDA MINHA EQUIPE: Unificação da visão Minha Equipe embutida diretamente na Agenda */}
      <AgendaMinhaEquipeSecao embedded tituloCustomizado="Agenda Minha Equipe" />

      {/* Alerta de Devolvidas pelo Regional (Retrabalho imediato) */}
      {statsDia.devolvidas > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold">
              Atenção: {statsDia.devolvidas} rotina(s) devolvida(s) na validação do regional!
            </span>
            <p>
              O regional apontou correções necessárias na execução. Verifique as observações da
              rotina, realize os ajustes e reenvie a foto comprobatória.
            </p>
          </div>
        </div>
      )}

      {/* Seção Integrada: Visitas de Promotores Agendadas para o Dia */}
      {visitasDoDia.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/50 via-white to-white border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">Visitas de Promotores do Dia</h3>
                <p className="text-[11px] text-[#6B7280]">
                  Representantes e promotores agendados para atendimento na loja hoje
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
              {visitasDoDia.length} visita{visitasDoDia.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {visitasDoDia.map((v) => {
              const atrasada = isVisitaAtrasada(v)
              const promotorNome = v.expand?.promotor?.nome || 'Promotor'
              const fornNome = v.expand?.promotor?.expand?.fornecedor?.nome
              const isRealizada = v.status === 'realizada'

              return (
                <div
                  key={v.id}
                  className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isRealizada
                      ? 'bg-emerald-50/30'
                      : atrasada
                        ? 'bg-red-50/30 border-l-4 border-l-[#B91C1C]'
                        : 'hover:bg-gray-50/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm text-[#1F2937]">
                        {promotorNome}
                      </span>
                      {fornNome && (
                        <span className="text-[11px] font-medium text-[#4B5563] bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#6B7280]" />
                          <span>{fornNome}</span>
                        </span>
                      )}
                      {v.hora_prevista && (
                        <span className="text-xs text-[#6B7280] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Previsto: {v.hora_prevista}</span>
                        </span>
                      )}
                      {isRealizada ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          REALIZADA
                        </span>
                      ) : atrasada ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#B91C1C] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ATRASADA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          AGENDADA
                        </span>
                      )}
                    </div>
                    {v.observacoes && (
                      <p className="text-xs text-[#6B7280] italic">Objetivo: {v.observacoes}</p>
                    )}
                  </div>

                  {!isRealizada && (
                    <button
                      onClick={() => setConcluirVisitaModal(v)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir Atendimento</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seção Integrada: Planos de Ação 5W2H com Prazo no Dia */}
      {planosDoDia.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/50 via-white to-white border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">
                  Planos de ação 5W2H (prazo hoje)
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Ações corretivas com vencimento repactuado para esta data
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
              {planosDoDia.length} ação{planosDoDia.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {planosDoDia.map((plano) => {
              const isDone = plano.status === 'concluida'
              const atrasado = isPlanoAtrasado(plano)

              return (
                <div
                  key={plano.id}
                  className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isDone
                      ? 'bg-emerald-50/20 opacity-70'
                      : atrasado
                        ? 'bg-red-50/30 border-l-4 border-l-[#B91C1C]'
                        : 'hover:bg-gray-50/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-xs sm:text-sm ${isDone ? 'line-through text-[#6B7280]' : 'text-[#1F2937]'}`}
                      >
                        {plano.area_demandante ? `[${plano.area_demandante}] ` : ''}
                        {plano.descricao}
                      </span>
                      {plano.area_demandante && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                          {plano.area_demandante}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-gray-100 text-[#4B5563]">
                        {plano.prioridade}
                      </span>
                      {isDone ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          CONCLUÍDO
                        </span>
                      ) : atrasado ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#B91C1C] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ATRASADO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
                          NO PRAZO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                      {plano.responsavel && <span>Resp: {plano.responsavel}</span>}
                      {plano.expand?.rotina && <span>Rotina: {plano.expand.rotina.nome}</span>}
                    </div>
                  </div>

                  {!isDone && (
                    <button
                      onClick={async () => {
                        await planosAcaoService.update(plano.id, { status: 'concluida' })
                        loadData()
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir ação</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bloco Principal: Agenda de Rotinas / Tarefas do Dia */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
        {/* Header e Filtros da Agenda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>Rotinas previstas do dia</span>
              <span className="text-xs font-normal text-[#6B7280]">
                ({itensFiltrados.length} de {itensAgenda.length})
              </span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              Organizadas por horário limite, prioridade de atendimento e status operacional
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de Área */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
              >
                <option value="Todas">Todas as áreas</option>
                {areasDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
            >
              <option value="todos">Todos os status</option>
              <option value="pendentes">Pendentes / Em aberto</option>
              <option value="atrasadas">Apenas atrasadas</option>
              <option value="aguardando">Aguardando validação</option>
              <option value="devolvidas">Devolvidas</option>
              <option value="concluidas">Apenas concluídas</option>
            </select>
          </div>
        </div>

        {/* Barra de Busca rápida */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por tarefa, responsável, área ou horário..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Tabela / Lista de Tarefas do Dia */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">
            Carregando agenda do dia...
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="py-12 text-center bg-[#F7F7F5]/50 border border-dashed border-[#E5E7EB] rounded-lg">
            <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-[#1F2937]">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-[#6B7280] mt-1">
              {busca || filtroArea !== 'Todas' || filtroStatus !== 'todos'
                ? 'Tente ajustar os filtros aplicados.'
                : 'Não há rotinas cadastradas para esta loja nesta data.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden">
            {itensFiltrados.map((item) => {
              const {
                rotina,
                execucao,
                concluida,
                devolvida,
                aguardandoValidacao,
                aprovada,
                isAtrasada,
                horarioEfetivo,
              } = item

              return (
                <div
                  key={rotina.id}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    concluida
                      ? 'bg-gray-50/50'
                      : isAtrasada
                        ? 'bg-red-50/30 border-l-4 border-l-[#B91C1C]'
                        : devolvida
                          ? 'bg-amber-50/40 border-l-4 border-l-amber-500'
                          : 'bg-white hover:bg-[#F7F7F5]/40 border-l-4 border-l-blue-400'
                  }`}
                >
                  {/* Informações da Tarefa */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Checkbox de Conclusão Rápida com tap target generoso */}
                      <button
                        type="button"
                        onClick={() => handleToggleConclusao(rotina.id)}
                        disabled={submittingId === rotina.id}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          concluida
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[#D1D5DB] hover:border-[#2563EB] bg-white'
                        }`}
                        title={concluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
                      >
                        {concluida && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <span
                        className={`font-semibold text-sm ${
                          concluida ? 'line-through text-[#6B7280]' : 'text-[#1F2937]'
                        }`}
                      >
                        {rotina.nome}
                      </span>

                      {/* Badge Prioridade do Dia */}
                      {rotina.prioridade_dia && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                          P{rotina.prioridade_dia}
                        </span>
                      )}

                      {/* Badge de Status Oficial */}
                      {aprovada ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          APROVADA
                        </span>
                      ) : aguardandoValidacao ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
                          <Clock className="w-3 h-3" />
                          AGUARDANDO VALIDAÇÃO
                        </span>
                      ) : devolvida ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <RotateCcw className="w-3 h-3" />
                          DEVOLVIDA
                        </span>
                      ) : isAtrasada ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#B91C1C]">
                          <AlertTriangle className="w-3 h-3" />
                          ATRASADA
                        </span>
                      ) : horarioEfetivo ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#4B5563]">
                          <Clock className="w-3 h-3" />
                          NO PRAZO
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-[#6B7280]">
                          INTEGRAL
                        </span>
                      )}
                    </div>

                    {/* Metadados: Horário limite, Área, Responsável, Ferramenta */}
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
                      {horarioEfetivo && (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isAtrasada ? 'text-[#B91C1C] font-bold' : 'text-[#374151]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Limite: {horarioEfetivo}</span>
                        </span>
                      )}

                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-[#4B5563]">
                        {normalizarNomeCanonico(item.area)}
                      </span>

                      {rotina.responsavel && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{normalizarNomeCanonico(rotina.responsavel)}</span>
                        </span>
                      )}

                      {rotina.validacao && (
                        <span className="text-[11px] text-[#6B7280]">
                          Validador: {normalizarNomeCanonico(rotina.validacao)}
                        </span>
                      )}

                      {/* Notação de tarefa repactuada */}
                      {rotina.adiada_para_horario && (
                        <span className="text-[10px] font-semibold text-[#2563EB] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Horário repactuado
                        </span>
                      )}
                    </div>

                    {/* Comentário de Devolução do Regional se houver */}
                    {devolvida && execucao?.comentario_validacao && (
                      <div className="p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 mt-1">
                        <span className="font-bold">Motivo da devolução: </span>
                        <span>{execucao.comentario_validacao}</span>
                      </div>
                    )}

                    {/* Observações da rotina / readequação */}
                    {rotina.observacoes && (
                      <p className="text-[11px] text-[#6B7280] italic">Obs: {rotina.observacoes}</p>
                    )}
                  </div>

                  {/* Ações da Linha na Agenda */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                    {/* Botão de Ver Foto se houver comprovação */}
                    {execucao?.foto && (
                      <button
                        onClick={() => setVisualizarFoto({ execucao, rotina })}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded text-[#2563EB] hover:bg-blue-50 border border-blue-200"
                        title="Ver foto comprovatória enviada"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}

                    {/* Botão Execução Guiada / Concluir */}
                    {!concluida && (
                      <button
                        onClick={() => setExecucaoGuiadaRotina(rotina)}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-md text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs transition-colors"
                        title="Executar tarefa com fluxo guiado"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Executar tarefa</span>
                      </button>
                    )}

                    {/* Botão Readequar (Mudar horário ou adiar para outro dia) */}
                    <button
                      onClick={() => setReadequarModal({ open: true, rotina })}
                      className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-md text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#374151] hover:text-[#2563EB] transition-colors"
                      title="Readequar horário, prioridade ou adiar dia"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Readequar</span>
                    </button>

                    {/* Botão Converter em Plano de Ação 5W2H (especialmente se atrasada) */}
                    {isAtrasada && (
                      <button
                        onClick={() => setPlanoAcaoModal({ open: true, rotina })}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold bg-red-100 hover:bg-red-200 text-[#B91C1C] transition-colors"
                        title="Abrir Plano de Ação 5W2H para tratar o atraso"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>5W2H</span>
                      </button>
                    )}

                    {/* Botão WhatsApp para aviso rápido se atrasada ou no prazo */}
                    {!concluida && (isAtrasada || horarioEfetivo) && (
                      <BotaoAvisoWhatsApp
                        lojaNome={rotina.expand?.loja?.nome || lojaSelecionada?.nome}
                        tarefaTitulo={rotina.nome}
                        setor={rotina.area || 'Operação Loja'}
                        horario={horarioEfetivo || rotina.horario_limite}
                        situacao={isAtrasada ? 'Atrasada na Agenda' : 'Pendente na Agenda do dia'}
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
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Readequação de Tarefa */}
      <ReadequarTarefaModal
        open={readequarModal.open}
        onOpenChange={(open) => !open && setReadequarModal({ open: false, rotina: null })}
        rotina={readequarModal.rotina}
        currentDateStr={currentDateStr}
        onSave={handleSaveReadequacao}
      />

      {/* Modal Execução Guiada Passo a Passo (Item 4) */}
      {execucaoGuiadaRotina && user && (
        <ExecucaoGuiadaModal
          open={!!execucaoGuiadaRotina}
          onOpenChange={(op) => !op && setExecucaoGuiadaRotina(null)}
          titulo={execucaoGuiadaRotina.nome}
          subtitulo={`Responsável: ${execucaoGuiadaRotina.responsavel || 'Operador'} • Loja: ${lojaSelecionada?.nome || ''}`}
          horarioLimite={execucaoGuiadaRotina.horario_limite}
          responsavel={execucaoGuiadaRotina.responsavel}
          ferramenta={execucaoGuiadaRotina.ferramenta}
          validacao={execucaoGuiadaRotina.validacao}
          observacoesOriginais={execucaoGuiadaRotina.observacoes}
          onConcluir={handleConcluirExecucaoGuiadaAgenda}
        />
      )}

      {/* Modal Concluir Rotina com Foto */}
      {concluirModalRotina && user && (
        <ConcluirRotinaModal
          isOpen={!!concluirModalRotina}
          rotina={concluirModalRotina}
          onClose={() => setConcluirModalRotina(null)}
          onConfirm={async (fotoFile) => {
            const existingExec = execucoesMap.get(concluirModalRotina.id)
            const isCurrentlyDone = Boolean(
              existingExec?.concluida && existingExec.status_validacao !== 'devolvida',
            )
            await execucoesService.toggleExecution(
              concluirModalRotina.id,
              user.id,
              isCurrentlyDone,
              existingExec?.id,
              currentDateStr,
              fotoFile,
            )
            setConcluirModalRotina(null)
            loadData()
          }}
        />
      )}

      {/* Modal Concluir Validade */}
      {concluirValidadeModal && user && (
        <ConcluirValidadeModal
          isOpen={Boolean(concluirValidadeModal)}
          onClose={() => setConcluirValidadeModal(null)}
          tarefa={concluirValidadeModal}
          onConfirm={async (params) => {
            if (!concluirValidadeModal || !user) return
            await tarefasValidadeService.concluirComProva(concluirValidadeModal.id, {
              userId: user.id,
              observacao: params.observacao,
              fotoFile: params.fotoFile,
            })
            setConcluirValidadeModal(null)
            loadData()
          }}
        />
      )}

      {/* Modal Concluir Visita */}
      <ConcluirVisitaModal
        open={!!concluirVisitaModal}
        onOpenChange={(open) => !open && setConcluirVisitaModal(null)}
        visita={concluirVisitaModal}
        rotinasDisponiveis={rotinasPromotores.filter((r) => r.ativa !== false)}
        onConcluir={(params) => {
          if (!concluirVisitaModal) return Promise.resolve()
          return handleConcluirVisita(concluirVisitaModal.id, params)
        }}
      />

      {/* Modal Plano de Ação 5W2H */}
      {planoAcaoModal.open && (
        <PlanoAcaoModal
          isOpen={planoAcaoModal.open}
          onClose={() => setPlanoAcaoModal({ open: false, rotina: null })}
          lojas={lojaSelecionada ? [lojaSelecionada] : []}
          defaultRotina={planoAcaoModal.rotina || undefined}
          defaultLojaId={lojaSelecionadaId || undefined}
          onSave={async (data) => {
            await planosAcaoService.create({
              ...data,
              criado_por: user?.id,
            })
            setPlanoAcaoModal({ open: false, rotina: null })
            loadData()
          }}
        />
      )}

      {/* Modal Visualizar Foto */}
      {visualizarFoto && (
        <FotoVisualizadorModal
          isOpen={!!visualizarFoto}
          onClose={() => setVisualizarFoto(null)}
          execucao={visualizarFoto.execucao}
          rotina={visualizarFoto.rotina}
        />
      )}
    </div>
  )
}
