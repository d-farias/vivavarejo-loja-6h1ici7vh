import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Building2,
  Users,
  Layers,
  ChevronUp,
  ChevronDown,
  Info,
  Calendar,
  Mail,
  Check,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import pb from '../lib/pocketbase/client'
import { Cliente, Loja, Rotina, ExecucaoRotina, PlanoAcao } from '../types'
import { isPastDue, getHorarioStatus } from '../lib/time-utils'
import { getTodayDateString } from '../services/rotinas'
import { clientesService } from '../services/clientes'
import { lojasService } from '../services/lojas'
import { planosAcaoService } from '../services/planosAcao'
import { isPlanoAtrasado } from './PlanosAcaoCard'

interface PainelGerencialProps {
  clientes: Cliente[]
  lojas: Loja[]
  isAdmin?: boolean
  onClienteUpdated?: () => void
  onLojaUpdated?: () => void
  onOpenAplicarModelo?: (lojaId?: string) => void
}

interface DiaExecucao {
  dateStr: string // YYYY-MM-DD
  label: string // Seg, Ter... DD/MM
  totalEsperado: number
  totalConcluido: number
  percentual: number
}

interface AreaPerformance {
  area: string
  totalRotinas: number
  totalEsperadoSemana: number
  conclusoesSemana: number
  percentualSemana: number
  conclusoesHoje: number
  totalHoje: number
  percentualHoje: number
  atrasadasHoje: number
}

interface LiderPerformance {
  responsavel: string
  totalRotinas: number
  totalEsperadoSemana: number
  conclusoesSemana: number
  percentualSemana: number
}

interface LojaRanking {
  lojaId: string
  lojaNome: string
  clienteNome: string
  totalRotinas: number
  totalEsperadoSemana: number
  conclusoesSemana: number
  percentualSemana: number
  taxaHoje: number
  atrasadasHoje: number
}

interface PontoAtencao {
  id: string
  tipo: 'atraso_hoje' | 'area_baixa' | 'sem_execucao'
  titulo: string
  descricao: string
  dadoConcreto: string
  severidade: 'alta' | 'media'
}

interface PropostaMelhoria {
  id: string
  categoria: string
  titulo: string
  sugestao: string
  evidencia: string
  impacto: 'Alto' | 'Médio'
}

export const PainelGerencial: React.FC<PainelGerencialProps> = ({
  clientes,
  lojas,
  isAdmin = true,
  onClienteUpdated,
  onLojaUpdated,
  onOpenAplicarModelo,
}) => {
  // Filtros internos da aba
  const [selectedClienteId, setSelectedClienteId] = useState<string>('todos')
  const [selectedLojaId, setSelectedLojaId] = useState<string>('todas')

  // Dados brutos
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Estado local para toggles de envio semanal de e-mail por cliente
  const [updatingClienteId, setUpdatingClienteId] = useState<string | null>(null)
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null)
  const [localClientes, setLocalClientes] = useState<Cliente[]>(clientes)

  // Estado local para lojas e configuração de alertas atrasados
  const [localLojas, setLocalLojas] = useState<Loja[]>(lojas)
  const [updatingLojaId, setUpdatingLojaId] = useState<string | null>(null)
  const [alertasFeedback, setAlertasFeedback] = useState<string | null>(null)
  const [editingRegionalLojaId, setEditingRegionalLojaId] = useState<string | null>(null)
  const [tempEmailRegional, setTempEmailRegional] = useState<string>('')

  useEffect(() => {
    setLocalClientes(clientes)
  }, [clientes])

  useEffect(() => {
    setLocalLojas(lojas)
  }, [lojas])

  const handleToggleEnvioSemanal = async (clienteId: string, currentVal: boolean) => {
    if (!isAdmin) return
    const newVal = !currentVal
    setUpdatingClienteId(clienteId)
    try {
      await clientesService.update(clienteId, { envio_semanal: newVal })
      setLocalClientes((prev) =>
        prev.map((c) => (c.id === clienteId ? { ...c, envio_semanal: newVal } : c)),
      )
      setEmailFeedback('Configuração de envio atualizada com sucesso!')
      setTimeout(() => setEmailFeedback(null), 3500)
      if (onClienteUpdated) {
        onClienteUpdated()
      }
    } catch (err: any) {
      console.error('Erro ao atualizar envio_semanal do cliente:', err)
      setEmailFeedback(err?.message || 'Erro ao atualizar envio por e-mail.')
      setTimeout(() => setEmailFeedback(null), 4000)
    } finally {
      setUpdatingClienteId(null)
    }
  }

  const handleToggleAlertasLoja = async (lojaId: string, currentVal: boolean) => {
    if (!isAdmin) return
    const newVal = !currentVal
    setUpdatingLojaId(lojaId)
    try {
      await lojasService.update(lojaId, { alertas_ativos: newVal })
      setLocalLojas((prev) =>
        prev.map((l) => (l.id === lojaId ? { ...l, alertas_ativos: newVal } : l)),
      )
      setAlertasFeedback('Status do alerta de rotinas atualizado!')
      setTimeout(() => setAlertasFeedback(null), 3500)
      if (onLojaUpdated) {
        onLojaUpdated()
      }
    } catch (err: any) {
      console.error('Erro ao atualizar alertas_ativos da loja:', err)
      setAlertasFeedback(err?.message || 'Erro ao atualizar alerta da loja.')
      setTimeout(() => setAlertasFeedback(null), 4000)
    } finally {
      setUpdatingLojaId(null)
    }
  }

  const handleStartEditRegional = (loja: Loja) => {
    if (!isAdmin) return
    setEditingRegionalLojaId(loja.id)
    setTempEmailRegional(loja.email_regional || '')
  }

  const handleCancelEditRegional = () => {
    setEditingRegionalLojaId(null)
    setTempEmailRegional('')
  }

  const handleSaveEmailRegional = async (lojaId: string) => {
    if (!isAdmin) return
    setUpdatingLojaId(lojaId)
    try {
      const trimmed = tempEmailRegional.trim()
      await lojasService.update(lojaId, { email_regional: trimmed })
      setLocalLojas((prev) =>
        prev.map((l) => (l.id === lojaId ? { ...l, email_regional: trimmed } : l)),
      )
      setEditingRegionalLojaId(null)
      setTempEmailRegional('')
      setAlertasFeedback('E-mail do regional atualizado com sucesso!')
      setTimeout(() => setAlertasFeedback(null), 3500)
      if (onLojaUpdated) {
        onLojaUpdated()
      }
    } catch (err: any) {
      console.error('Erro ao salvar email regional da loja:', err)
      setAlertasFeedback(err?.message || 'Erro ao salvar e-mail do regional.')
      setTimeout(() => setAlertasFeedback(null), 4000)
    } finally {
      setUpdatingLojaId(null)
    }
  }

  // Clientes elegíveis para envio (com campo contato preenchido)
  const clientesComContato = useMemo(() => {
    return localClientes.filter((c) => Boolean(c.contato && c.contato.trim()))
  }, [localClientes])

  // Carrega rotinas e execuções dos últimos 7 dias
  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Calcula data de 7 dias atrás no formato YYYY-MM-DD
      const now = new Date()
      const d7 = new Date(now)
      d7.setDate(d7.getDate() - 6)
      const dateMin = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(
        d7.getDate(),
      ).padStart(2, '0')}`

      const [rotinasRes, execRes, planosRes] = await Promise.all([
        pb.collection('rotinas').getFullList<Rotina>({
          sort: 'nome',
          expand: 'loja,funcao',
        }),
        pb.collection('execucoes_rotinas').getFullList<ExecucaoRotina>({
          filter: `data_execucao >= "${dateMin} 00:00:00"`,
          sort: '-created',
          expand: 'rotina,usuario,validado_por',
        }),
        planosAcaoService.getAll().catch(() => [] as PlanoAcao[]),
      ])

      setRotinas(rotinasRes)
      setExecucoes(execRes)
      setPlanosAcao(planosRes)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Erro ao carregar dados do Painel Gerencial:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregamento inicial e realtime SSE nas coleções
  useEffect(() => {
    loadData()

    // Subscrição Realtime SSE para rotinas, execuções e planos_acao
    const unsubscribeRotinas = pb.collection('rotinas').subscribe('*', () => {
      loadData()
    })
    const unsubscribeExec = pb.collection('execucoes_rotinas').subscribe('*', () => {
      loadData()
    })
    const unsubscribePlanos = pb.collection('planos_acao').subscribe('*', () => {
      loadData()
    })

    return () => {
      unsubscribeRotinas.then((unsub) => unsub()).catch(() => {})
      unsubscribeExec.then((unsub) => unsub()).catch(() => {})
      unsubscribePlanos.then((unsub) => unsub()).catch(() => {})
    }
  }, [loadData])

  // Lojas filtradas pelo cliente selecionado
  const lojasFiltradasPorCliente = useMemo(() => {
    if (selectedClienteId === 'todos') return lojas
    return lojas.filter((l) => l.cliente === selectedClienteId)
  }, [lojas, selectedClienteId])

  // Rotinas filtradas pelos filtros da aba
  const rotinasFiltradas = useMemo(() => {
    return rotinas.filter((r) => {
      // Filtro de loja
      if (selectedLojaId !== 'todas') {
        // Se a rotina tem loja específica, deve bater
        if (r.loja && r.loja !== selectedLojaId) return false
      }
      // Filtro de cliente
      if (selectedClienteId !== 'todos') {
        const lojaDaRotina = lojas.find((l) => l.id === r.loja)
        if (lojaDaRotina && lojaDaRotina.cliente !== selectedClienteId) return false
      }
      return true
    })
  }, [rotinas, selectedLojaId, selectedClienteId, lojas])

  // IDs das rotinas filtradas
  const rotinasFiltradasIds = useMemo(() => {
    return new Set(rotinasFiltradas.map((r) => r.id))
  }, [rotinasFiltradas])

  // Execuções filtradas pelas rotinas selecionadas
  const execucoesFiltradas = useMemo(() => {
    return execucoes.filter((e) => {
      if (!rotinasFiltradasIds.has(e.rotina)) return false
      // Se filtro de loja estiver ativo e a execução tiver loja anotada
      if (selectedLojaId !== 'todas' && e.loja && e.loja !== selectedLojaId) return false
      return true
    })
  }, [execucoes, rotinasFiltradasIds, selectedLojaId])

  const todayStr = useMemo(() => getTodayDateString(), [])

  // Conjunto de rotinas concluídas hoje (concluida = true e status_validacao != 'devolvida')
  const concluidasHojeIds = useMemo(() => {
    const s = new Set<string>()
    execucoesFiltradas.forEach((e) => {
      const eDate = e.data_execucao ? e.data_execucao.substring(0, 10) : ''
      if (eDate === todayStr && e.concluida && e.status_validacao !== 'devolvida') {
        s.add(e.rotina)
      }
    })
    return s
  }, [execucoesFiltradas, todayStr])

  // Rotinas atrasadas hoje
  const rotinasAtrasadasHoje = useMemo(() => {
    return rotinasFiltradas.filter((r) => {
      if (concluidasHojeIds.has(r.id)) return false
      return isPastDue(r.horario_limite)
    })
  }, [rotinasFiltradas, concluidasHojeIds])

  // Indicadores de topo (KPIs)
  const kpis = useMemo(() => {
    const totalRotinas = rotinasFiltradas.length
    const concluidasHoje = concluidasHojeIds.size
    const atrasadasAgora = rotinasAtrasadasHoje.length
    const pendentesHoje = Math.max(0, totalRotinas - concluidasHoje)
    const taxaHoje = totalRotinas > 0 ? Math.round((concluidasHoje / totalRotinas) * 100) : 0
    const totalExecucoesPeriodo = execucoesFiltradas.length

    // KPIs de Planos de Ação (Abertas, Atrasadas, Concluídas na Semana)
    const filteredPlanos = planosAcao.filter((p) => {
      if (selectedLojaId !== 'todas' && p.loja !== selectedLojaId) return false
      if (selectedClienteId !== 'todos') {
        const lj = lojas.find((l) => l.id === p.loja)
        if (lj && lj.cliente !== selectedClienteId) return false
      }
      return true
    })

    let planosAbertas = 0
    let planosAtrasadas = 0
    let planosConcluidasSemana = 0

    const now = new Date()
    const d7 = new Date(now)
    d7.setDate(d7.getDate() - 7)

    filteredPlanos.forEach((p) => {
      if (p.status === 'concluida') {
        const updatedTime = new Date(p.updated || p.created).getTime()
        if (updatedTime >= d7.getTime()) {
          planosConcluidasSemana++
        }
      } else {
        planosAbertas++
        if (isPlanoAtrasado(p)) {
          planosAtrasadas++
        }
      }
    })

    return {
      totalRotinas,
      concluidasHoje,
      atrasadasAgora,
      pendentesHoje,
      taxaHoje,
      totalExecucoesPeriodo,
      planosAbertas,
      planosAtrasadas,
      planosConcluidasSemana,
      totalPlanos: filteredPlanos.length,
    }
  }, [
    rotinasFiltradas,
    concluidasHojeIds,
    rotinasAtrasadasHoje,
    execucoesFiltradas,
    planosAcao,
    selectedLojaId,
    selectedClienteId,
    lojas,
  ])

  // Relatório semanal agrupado por dia (últimos 7 dias)
  const relatorioSemanalDias: DiaExecucao[] = useMemo(() => {
    const dias: DiaExecucao[] = []
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const totalRotinas = rotinasFiltradas.length

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`

      // Rotinas válidas concluídas no dia (concluida = true e status != 'devolvida')
      const dayExecs = execucoesFiltradas.filter((e) => {
        const eDate = e.data_execucao ? e.data_execucao.substring(0, 10) : ''
        return eDate === dateStr && e.concluida && e.status_validacao !== 'devolvida'
      })
      // Rotinas únicas concluídas no dia
      const uniqueDone = new Set(dayExecs.map((e) => e.rotina)).size
      const percentual = totalRotinas > 0 ? Math.round((uniqueDone / totalRotinas) * 100) : 0

      const diaSemana = weekDays[d.getDay()]
      const diaMes = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`

      dias.push({
        dateStr,
        label: i === 0 ? `Hoje (${diaSemana})` : `${diaSemana} ${diaMes}`,
        totalEsperado: totalRotinas,
        totalConcluido: uniqueDone,
        percentual: Math.min(100, percentual),
      })
    }

    return dias
  }, [rotinasFiltradas, execucoesFiltradas])

  // Relatório por área
  const relatorioAreas: AreaPerformance[] = useMemo(() => {
    const map = new Map<string, Rotina[]>()
    rotinasFiltradas.forEach((r) => {
      const a = (r.area || 'Geral').trim()
      if (!map.has(a)) map.set(a, [])
      map.get(a)!.push(r)
    })

    const result: AreaPerformance[] = []
    map.forEach((rots, area) => {
      const rotIds = new Set(rots.map((r) => r.id))
      const totalEsperadoSemana = rots.length * 7

      // Execuções válidas da semana para essa área (não devolvidas)
      const execsArea = execucoesFiltradas.filter(
        (e) => rotIds.has(e.rotina) && e.concluida && e.status_validacao !== 'devolvida',
      )
      const conclusoesSemana = execsArea.length
      const percentualSemana =
        totalEsperadoSemana > 0 ? Math.round((conclusoesSemana / totalEsperadoSemana) * 100) : 0

      // Hoje
      const execsHoje = execsArea.filter((e) => {
        const eDate = e.data_execucao ? e.data_execucao.substring(0, 10) : ''
        return eDate === todayStr
      })
      const conclusoesHoje = new Set(execsHoje.map((e) => e.rotina)).size
      const totalHoje = rots.length
      const percentualHoje = totalHoje > 0 ? Math.round((conclusoesHoje / totalHoje) * 100) : 0

      const atrasadasHoje = rots.filter(
        (r) => !concluidasHojeIds.has(r.id) && isPastDue(r.horario_limite),
      ).length

      result.push({
        area,
        totalRotinas: rots.length,
        totalEsperadoSemana,
        conclusoesSemana,
        percentualSemana: Math.min(100, percentualSemana),
        conclusoesHoje,
        totalHoje,
        percentualHoje: Math.min(100, percentualHoje),
        atrasadasHoje,
      })
    })

    return result.sort((a, b) => a.percentualSemana - b.percentualSemana)
  }, [rotinasFiltradas, execucoesFiltradas, todayStr, concluidasHojeIds])

  // Relatório por líder / responsável
  const relatorioLideres: LiderPerformance[] = useMemo(() => {
    const map = new Map<string, Rotina[]>()
    rotinasFiltradas.forEach((r) => {
      const resp = (r.responsavel || 'Não atribuído').trim()
      if (!map.has(resp)) map.set(resp, [])
      map.get(resp)!.push(r)
    })

    const result: LiderPerformance[] = []
    map.forEach((rots, responsavel) => {
      const rotIds = new Set(rots.map((r) => r.id))
      const totalEsperadoSemana = rots.length * 7
      const conclusoesSemana = execucoesFiltradas.filter(
        (e) => rotIds.has(e.rotina) && e.concluida && e.status_validacao !== 'devolvida',
      ).length
      const percentualSemana =
        totalEsperadoSemana > 0 ? Math.round((conclusoesSemana / totalEsperadoSemana) * 100) : 0

      result.push({
        responsavel,
        totalRotinas: rots.length,
        totalEsperadoSemana,
        conclusoesSemana,
        percentualSemana: Math.min(100, percentualSemana),
      })
    })

    return result.sort((a, b) => b.percentualSemana - a.percentualSemana)
  }, [rotinasFiltradas, execucoesFiltradas])

  // Ranking de Lojas (quando há lojas cadastradas)
  const rankingLojas: LojaRanking[] = useMemo(() => {
    return lojasFiltradasPorCliente
      .map((loja) => {
        const clienteObj = clientes.find((c) => c.id === loja.cliente)
        const rotsLoja = rotinas.filter((r) => !r.loja || r.loja === loja.id)
        const rotIds = new Set(rotsLoja.map((r) => r.id))
        const totalEsperadoSemana = rotsLoja.length * 7

        const execsLoja = execucoes.filter((e) => {
          if (!rotIds.has(e.rotina)) return false
          if (!e.concluida || e.status_validacao === 'devolvida') return false
          return true
        })
        const conclusoesSemana = execsLoja.length
        const percentualSemana =
          totalEsperadoSemana > 0
            ? Math.min(100, Math.round((conclusoesSemana / totalEsperadoSemana) * 100))
            : 0

        // Hoje
        const execsHoje = execsLoja.filter((e) => {
          const eDate = e.data_execucao ? e.data_execucao.substring(0, 10) : ''
          return eDate === todayStr
        })
        const concluidasHojeSet = new Set(execsHoje.map((e) => e.rotina))
        const taxaHoje =
          rotsLoja.length > 0
            ? Math.min(100, Math.round((concluidasHojeSet.size / rotsLoja.length) * 100))
            : 0

        const atrasadasHoje = rotsLoja.filter(
          (r) => !concluidasHojeSet.has(r.id) && isPastDue(r.horario_limite),
        ).length

        return {
          lojaId: loja.id,
          lojaNome: loja.nome,
          clienteNome: clienteObj?.nome || '—',
          totalRotinas: rotsLoja.length,
          totalEsperadoSemana,
          conclusoesSemana,
          percentualSemana,
          taxaHoje,
          atrasadasHoje,
        }
      })
      .sort((a, b) => b.percentualSemana - a.percentualSemana)
  }, [lojasFiltradasPorCliente, clientes, rotinas, execucoes, todayStr])

  // Pontos de Atenção (reais e concretos)
  const pontosAtencao: PontoAtencao[] = useMemo(() => {
    const list: PontoAtencao[] = []

    // 1. Rotinas mais atrasadas hoje com horário estourado
    rotinasAtrasadasHoje.slice(0, 4).forEach((r) => {
      const status = getHorarioStatus(r.horario_limite)
      list.push({
        id: `atraso-${r.id}`,
        tipo: 'atraso_hoje',
        titulo: `Rotina Atrasada Hoje: ${r.nome}`,
        descricao: `Responsável: ${r.responsavel} • Área: ${r.area || 'Geral'}`,
        dadoConcreto: `Limite era ${status.displayLabel} (ultrapassado)`,
        severidade: 'alta',
      })
    })

    // 2. Áreas com execução abaixo de 70% na semana
    relatorioAreas
      .filter((a) => a.percentualSemana < 70 && a.totalRotinas > 0)
      .slice(0, 3)
      .forEach((a) => {
        list.push({
          id: `area-${a.area}`,
          tipo: 'area_baixa',
          titulo: `Baixa taxa semanal na área ${a.area}`,
          descricao: `Apenas ${a.conclusoesSemana} de ${a.totalEsperadoSemana} execuções esperadas nos 7 dias.`,
          dadoConcreto: `${a.percentualSemana}% de execução na semana`,
          severidade: a.percentualSemana < 50 ? 'alta' : 'media',
        })
      })

    // 3. Lojas com taxa crítica hoje (< 50%) se houver mais de uma
    if (rankingLojas.length > 1) {
      rankingLojas
        .filter((l) => l.taxaHoje < 50 && l.totalRotinas > 0)
        .slice(0, 2)
        .forEach((l) => {
          list.push({
            id: `loja-critica-${l.lojaId}`,
            tipo: 'sem_execucao',
            titulo: `Loja com baixa adesão hoje: ${l.lojaNome}`,
            descricao: `Cliente ${l.clienteNome} • ${l.atrasadasHoje} rotina(s) em atraso agora.`,
            dadoConcreto: `Taxa hoje: ${l.taxaHoje}% (${l.totalRotinas} rotinas)`,
            severidade: 'alta',
          })
        })
    }

    return list
  }, [rotinasAtrasadasHoje, relatorioAreas, rankingLojas])

  // Propostas de melhoria (geradas a partir de dados reais, sem IA externa)
  const propostasMelhoria: PropostaMelhoria[] = useMemo(() => {
    const list: PropostaMelhoria[] = []

    // Proposta 1: Rotinas de abertura com atraso
    const atrasadasManha = rotinasAtrasadasHoje.filter((r) => {
      const h = (r.horario_limite || '').toLowerCase()
      return h.includes('07:') || h.includes('08:') || h.includes('09:')
    })
    if (atrasadasManha.length > 0) {
      const rotExemplo = atrasadasManha[0]
      list.push({
        id: 'prop-abertura',
        categoria: 'Abertura de Loja',
        titulo: 'Reforçar acompanhamento no checklist matinal',
        sugestao: `Definir conferência prévia 15 minutos antes da abertura e ajustar o checklist para ${rotExemplo.responsavel}.`,
        evidencia: `${atrasadasManha.length} rotina(s) matinais em atraso hoje, incluindo "${rotExemplo.nome}".`,
        impacto: 'Alto',
      })
    }

    // Proposta 2: Áreas com baixa execução (<70%)
    const areasCriticas = relatorioAreas.filter((a) => a.percentualSemana < 70)
    if (areasCriticas.length > 0) {
      const piorArea = areasCriticas[0]
      list.push({
        id: `prop-area-${piorArea.area}`,
        categoria: 'Gestão Setorial',
        titulo: `Revisar rotinas e ferramentas da área "${piorArea.area}"`,
        sugestao: `Agendar alinhamento semanal com o líder da área e avaliar se as ferramentas/coletores estão operacionais.`,
        evidencia: `Adesão semanal de apenas ${piorArea.percentualSemana}% (${piorArea.conclusoesSemana}/${piorArea.totalEsperadoSemana} execuções).`,
        impacto: 'Alto',
      })
    }

    // Proposta 3: Concentração de carga por responsável
    if (relatorioLideres.length > 0) {
      const liderSobrecarregado = [...relatorioLideres].sort(
        (a, b) => b.totalRotinas - a.totalRotinas,
      )[0]
      if (
        liderSobrecarregado &&
        liderSobrecarregado.totalRotinas >= 4 &&
        liderSobrecarregado.percentualSemana < 75
      ) {
        list.push({
          id: `prop-carga-${liderSobrecarregado.responsavel}`,
          categoria: 'Distribuição de Carga',
          titulo: `Redistribuir responsabilidades de "${liderSobrecarregado.responsavel}"`,
          sugestao: `Descentralizar rotinas secundárias para assistentes ou operadores para manter as críticas no prazo.`,
          evidencia: `Concentra ${liderSobrecarregado.totalRotinas} rotinas diárias com taxa semanal de ${liderSobrecarregado.percentualSemana}%.`,
          impacto: 'Médio',
        })
      }
    }

    // Proposta 4: Loja com menor desempenho geral
    if (rankingLojas.length > 1) {
      const piorLoja = rankingLojas[rankingLojas.length - 1]
      const melhorLoja = rankingLojas[0]
      if (melhorLoja.percentualSemana - piorLoja.percentualSemana >= 15) {
        list.push({
          id: `prop-bench-${piorLoja.lojaId}`,
          categoria: 'Benchmarking Interno',
          titulo: `Compartilhar práticas da unidade ${melhorLoja.lojaNome}`,
          sugestao: `Realizar troca de rotinas entre gerentes para replicar a rotina de validação da loja líder na unidade com menor adesão.`,
          evidencia: `Diferença de ${melhorLoja.percentualSemana - piorLoja.percentualSemana} p.p. entre ${melhorLoja.lojaNome} (${melhorLoja.percentualSemana}%) e ${piorLoja.lojaNome} (${piorLoja.percentualSemana}%).`,
          impacto: 'Alto',
        })
      }
    }

    // Proposta padrão caso a operação esteja 100% redonda
    if (list.length === 0) {
      list.push({
        id: 'prop-padrao',
        categoria: 'Manutenção de Padrão',
        titulo: 'Sustentabilidade operacional e auditoria surpresa',
        sugestao:
          'Manter a cadência de validações pelo gerente de loja e realizar auditoria semanal por amostragem.',
        evidencia: `Operação estável com taxa diária em ${kpis.taxaHoje}% e sem pontos críticos no período.`,
        impacto: 'Médio',
      })
    }

    return list
  }, [rotinasAtrasadasHoje, relatorioAreas, relatorioLideres, rankingLojas, kpis.taxaHoje])

  // Exportação CSV do Relatório para reuniões com clientes
  const handleExportCSV = () => {
    try {
      const now = new Date()
      const dataFormatada = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
      let csv = '\uFEFF' // BOM para Excel abrir acentos em UTF-8 corretamente

      // Cabeçalho institucional
      csv += 'VIVAVAREJO - RELATÓRIO GERENCIAL DE EXECUÇÃO OPERACIONAL\n'
      csv += `Gerado em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}\n`
      csv += `Filtro Cliente: ${
        selectedClienteId === 'todos'
          ? 'Todos'
          : clientes.find((c) => c.id === selectedClienteId)?.nome || selectedClienteId
      }\n`
      csv += `Filtro Loja: ${
        selectedLojaId === 'todas'
          ? 'Todas'
          : lojas.find((l) => l.id === selectedLojaId)?.nome || selectedLojaId
      }\n\n`

      // Bloco 1: KPIs Gerais
      csv += 'INDICADORES CONSOLIDADOS\n'
      csv +=
        'Total de Rotinas;Rotinas Concluídas Hoje;Atrasadas Agora;Taxa Execução Hoje;Total Execuções 7 Dias\n'
      csv += `${kpis.totalRotinas};${kpis.concluidasHoje};${kpis.atrasadasAgora};${kpis.taxaHoje}%;${kpis.totalExecucoesPeriodo}\n\n`

      // Bloco 2: Execução Semanal por Dia
      csv += 'HISTÓRICO DE EXECUÇÃO DOS ÚLTIMOS 7 DIAS\n'
      csv += 'Dia;Data;Rotinas Esperadas;Concluídas;% Execução\n'
      relatorioSemanalDias.forEach((d) => {
        csv += `${d.label};${d.dateStr};${d.totalEsperado};${d.totalConcluido};${d.percentual}%\n`
      })
      csv += '\n'

      // Bloco 3: Desempenho por Área
      csv += 'EXECUÇÃO POR ÁREA OPERACIONAL (SEMANA)\n'
      csv +=
        'Área;Rotinas Cadastradas;Esperadas (7d);Concluídas (7d);% Semanal;Concluídas Hoje;% Hoje;Atrasadas Hoje\n'
      relatorioAreas.forEach((a) => {
        csv += `"${a.area}";${a.totalRotinas};${a.totalEsperadoSemana};${a.conclusoesSemana};${a.percentualSemana}%;${a.conclusoesHoje};${a.percentualHoje}%;${a.atrasadasHoje}\n`
      })
      csv += '\n'

      // Bloco 4: Desempenho por Líder / Responsável
      csv += 'EXECUÇÃO POR LÍDER / RESPONSÁVEL (SEMANA)\n'
      csv += 'Líder / Responsável;Rotinas;Esperadas (7d);Concluídas (7d);% Semanal\n'
      relatorioLideres.forEach((l) => {
        csv += `"${l.responsavel}";${l.totalRotinas};${l.totalEsperadoSemana};${l.conclusoesSemana};${l.percentualSemana}%\n`
      })
      csv += '\n'

      // Bloco 5: Propostas de Melhoria Sugeridas
      csv += 'PROPOSTAS DE MELHORIA BASEADAS NOS DADOS\n'
      csv += 'Categoria;Título;Sugestão de Ação;Evidência dos Dados;Impacto\n'
      propostasMelhoria.forEach((p) => {
        csv += `"${p.categoria}";"${p.titulo}";"${p.sugestao.replace(/"/g, '""')}";"${p.evidencia.replace(
          /"/g,
          '""',
        )}";"${p.impacto}"\n`
      })

      // Download do arquivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `VivaVarejo_Painel_Gerencial_${dataFormatada}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar CSV:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros Internos + Ações de Velocidade */}
      <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1F2937]">
          <Filter className="w-4 h-4 text-[#2563EB]" />
          <span>Filtros do Painel:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          {/* Filtro Cliente */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <span className="text-xs text-[#6B7280] font-semibold whitespace-nowrap">Cliente:</span>
            <select
              value={selectedClienteId}
              onChange={(e) => {
                setSelectedClienteId(e.target.value)
                setSelectedLojaId('todas')
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              <option value="todos">Todos os Clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Loja */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <span className="text-xs text-[#6B7280] font-semibold whitespace-nowrap">Loja:</span>
            <select
              value={selectedLojaId}
              onChange={(e) => setSelectedLojaId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              <option value="todas">Todas as Lojas</option>
              {lojasFiltradasPorCliente.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome} {l.codigo ? `(${l.codigo})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isAdmin && onOpenAplicarModelo && (
            <button
              onClick={() =>
                onOpenAplicarModelo(selectedLojaId !== 'todas' ? selectedLojaId : undefined)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 rounded-md shadow-xs transition-colors"
              title="Replicar modelo de rotinas em uma loja da rede"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Aplicar modelo em nova loja</span>
            </button>
          )}

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] rounded-md shadow-xs transition-colors"
            title="Atualizar dados agora"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : 'text-[#6B7280]'}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors"
            title="Exportar dados consolidados em planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Card de Ação Rápida: Velocidade de Onboarding Multi-loja */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 to-white border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <span>Modelos de Rotinas & Replicabilidade Multi-Loja</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                Consultoria
              </span>
            </h4>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Padronize seus processos operacionais criando modelos de rotinas reutilizáveis.
              Aplique instantaneamente um checklist padronizado em qualquer filial da rede.
            </p>
          </div>
        </div>

        {isAdmin && onOpenAplicarModelo && (
          <button
            onClick={() =>
              onOpenAplicarModelo(selectedLojaId !== 'todas' ? selectedLojaId : undefined)
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Aplicar modelo em nova loja</span>
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Indicadores de Topo (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Rotinas */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Rotinas Mapeadas
            </span>
            <Layers className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">{kpis.totalRotinas}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">no escopo atual</div>
        </div>

        {/* Concluídas Hoje */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Concluídas Hoje
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">{kpis.concluidasHoje}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">de {kpis.totalRotinas} esperadas</div>
        </div>

        {/* % Execução Diária */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              % Execução Hoje
            </span>
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">{kpis.taxaHoje}%</div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, kpis.taxaHoje)}%` }}
            />
          </div>
        </div>

        {/* Atrasadas Agora */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Atrasadas Agora
            </span>
            <Clock
              className={`w-4 h-4 ${kpis.atrasadasAgora > 0 ? 'text-[#B91C1C]' : 'text-gray-400'}`}
            />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold ${
              kpis.atrasadasAgora > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
            }`}
          >
            {kpis.atrasadasAgora}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {kpis.atrasadasAgora > 0 ? 'horário estourado' : 'tudo no prazo'}
          </div>
        </div>

        {/* Total Execuções Registradas */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Execuções (7 Dias)
            </span>
            <Calendar className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
            {kpis.totalExecucoesPeriodo}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">conclusões registradas</div>
        </div>
      </div>

      {/* Card Painel Gerencial: KPIs de Plano de Ação (Abertas, Atrasadas, Concluídas na semana) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2563EB]" />
              <span>Plano de Ação Operacional (5W2H)</span>
              {kpis.planosAtrasadas > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#B91C1C]">
                  {kpis.planosAtrasadas} atrasada{kpis.planosAtrasadas > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Acompanhamento de ações corretivas, preventivas e prazos da rede
            </p>
          </div>
          <div className="text-xs text-[#6B7280] font-medium">
            Total monitoradas: <strong className="text-[#1F2937]">{kpis.totalPlanos}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5]/50">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Ações Abertas
              </span>
              <Clock className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-bold text-[#1F2937] mt-1">{kpis.planosAbertas}</div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">pendentes ou em andamento</p>
          </div>

          <div
            className={`p-3.5 rounded-lg border ${
              kpis.planosAtrasadas > 0
                ? 'border-red-300 bg-red-50/50'
                : 'border-[#E5E7EB] bg-[#F7F7F5]/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-semibold uppercase tracking-wider text-[10px] ${
                  kpis.planosAtrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#6B7280]'
                }`}
              >
                Ações Atrasadas
              </span>
              <AlertTriangle
                className={`w-4 h-4 ${kpis.planosAtrasadas > 0 ? 'text-[#B91C1C]' : 'text-gray-400'}`}
              />
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                kpis.planosAtrasadas > 0 ? 'text-[#B91C1C]' : 'text-[#1F2937]'
              }`}
            >
              {kpis.planosAtrasadas}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">prazo limite estourado</p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5]/50">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Concluídas na Semana
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-[#1F2937] mt-1">
              {kpis.planosConcluidasSemana}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">resolvidas nos últimos 7 dias</p>
          </div>
        </div>
      </div>

      {/* Relatório de Execução Semanal (Gráfico de Barras por Dia) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
              <span>Relatório de Execução Semanal (% de Conclusão dos Últimos 7 Dias)</span>
            </h3>
            <p className="text-xs text-[#6B7280]">
              Evolução diária da taxa de rotinas realizadas dentro da operação
            </p>
          </div>
          <span className="text-[11px] text-[#6B7280]">
            Atualizado em tempo real via SSE (
            {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {relatorioSemanalDias.map((dia) => (
            <div key={dia.dateStr} className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#1F2937]">{dia.percentual}%</span>
              <div className="w-full bg-gray-100 h-28 rounded-md flex flex-col justify-end p-1">
                <div
                  className="w-full bg-[#2563EB] rounded transition-all duration-500 hover:bg-[#1D4ED8]"
                  style={{ height: `${Math.max(4, dia.percentual)}%` }}
                  title={`${dia.label}: ${dia.totalConcluido} de ${dia.totalEsperado} rotinas (${dia.percentual}%)`}
                />
              </div>
              <div className="text-center">
                <span className="text-[11px] font-medium text-[#4B5563] block truncate max-w-[60px] sm:max-w-none">
                  {dia.label}
                </span>
                <span className="text-[10px] text-[#9CA3AF] block">
                  {dia.totalConcluido}/{dia.totalEsperado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Duas Colunas: Desempenho por Área e Desempenho por Líder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Desempenho por Área */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <span>Execução por Área Operacional</span>
              </h3>
              <p className="text-xs text-[#6B7280]">Taxa semanal consolidada e status do dia</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#4B5563]">
              {relatorioAreas.length} áreas
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB] overflow-auto max-h-80 flex-1">
            {relatorioAreas.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">Nenhuma área encontrada.</p>
            ) : (
              relatorioAreas.map((area) => (
                <div key={area.area} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#1F2937]">{area.area}</span>
                    <div className="flex items-center gap-2">
                      {area.atrasadasHoje > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-50 text-[#B91C1C]">
                          {area.atrasadasHoje} atrasada{area.atrasadasHoje > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="font-bold text-[#1F2937]">
                        {area.percentualSemana}% semana
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        area.percentualSemana < 70 ? 'bg-[#B91C1C]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${area.percentualSemana}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
                    <span>
                      {area.totalRotinas} rotinas • Hoje: {area.conclusoesHoje}/{area.totalHoje} (
                      {area.percentualHoje}%)
                    </span>
                    <span>
                      {area.conclusoesSemana}/{area.totalEsperadoSemana} na semana
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Desempenho por Líder / Responsável */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>Execução por Líder / Responsável</span>
              </h3>
              <p className="text-xs text-[#6B7280]">Cumprimento de rotinas atribuídas na semana</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#4B5563]">
              {relatorioLideres.length} líderes
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB] overflow-auto max-h-80 flex-1">
            {relatorioLideres.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">
                Nenhum responsável encontrado.
              </p>
            ) : (
              relatorioLideres.map((lider) => (
                <div key={lider.responsavel} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#1F2937]">{lider.responsavel}</span>
                    <span className="font-bold text-[#1F2937]">
                      {lider.percentualSemana}% semana
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        lider.percentualSemana < 70 ? 'bg-[#B91C1C]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${lider.percentualSemana}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
                    <span>{lider.totalRotinas} rotinas diárias</span>
                    <span>
                      {lider.conclusoesSemana}/{lider.totalEsperadoSemana} concluídas
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ranking Simples de Lojas (Melhor e Pior % de Execução na Semana) */}
      {rankingLojas.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>Ranking de Lojas — Performance Semanal e Atual</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Classificação das lojas ordenadas pelo percentual de execução dos últimos 7 dias
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#2563EB]">
              {rankingLojas.length} {rankingLojas.length === 1 ? 'Loja' : 'Lojas'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] border-y border-[#E5E7EB] text-[#4B5563]">
                <tr>
                  <th className="p-2.5 font-semibold">Posição</th>
                  <th className="p-2.5 font-semibold">Loja</th>
                  <th className="p-2.5 font-semibold">Cliente</th>
                  <th className="p-2.5 font-semibold text-center">Rotinas</th>
                  <th className="p-2.5 font-semibold text-center">Taxa Hoje</th>
                  <th className="p-2.5 font-semibold text-center">Atrasadas Hoje</th>
                  <th className="p-2.5 font-semibold text-right">% Semanal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {rankingLojas.map((loja, idx) => {
                  const isTop = idx === 0 && rankingLojas.length > 1
                  const isBottom = idx === rankingLojas.length - 1 && rankingLojas.length > 1

                  return (
                    <tr key={loja.lojaId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-2.5 font-semibold">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                            isTop
                              ? 'bg-[#3B82F6]/15 text-[#2563EB]'
                              : isBottom
                                ? 'bg-red-100 text-[#B91C1C]'
                                : 'bg-gray-100 text-[#4B5563]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-[#1F2937]">{loja.lojaNome}</td>
                      <td className="p-2.5 text-[#6B7280]">{loja.clienteNome}</td>
                      <td className="p-2.5 text-center text-[#4B5563]">{loja.totalRotinas}</td>
                      <td className="p-2.5 text-center">
                        <span className="font-semibold text-[#1F2937]">{loja.taxaHoje}%</span>
                      </td>
                      <td className="p-2.5 text-center">
                        {loja.atrasadasHoje > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-[#B91C1C]">
                            {loja.atrasadasHoje}
                          </span>
                        ) : (
                          <span className="text-[#6B7280]">—</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#1F2937]">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isTop
                              ? 'text-[#2563EB]'
                              : isBottom
                                ? 'text-[#B91C1C]'
                                : 'text-[#1F2937]'
                          }`}
                        >
                          {isTop && <ChevronUp className="w-3.5 h-3.5" />}
                          {isBottom && <ChevronDown className="w-3.5 h-3.5" />}
                          {loja.percentualSemana}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid Duas Colunas Inferior: Pontos de Atenção e Propostas de Melhoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pontos de Atenção */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
                <span>Pontos de Atenção Operacional</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Rotinas em atraso no momento e áreas abaixo do limiar de 70%
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-[#B91C1C]">
              {pontosAtencao.length} alertas
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-auto max-h-80">
            {pontosAtencao.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B7280]">
                <CheckCircle2 className="w-6 h-6 text-[#2563EB] mx-auto mb-1.5" />
                <span>Nenhum ponto de atenção crítico no momento. Operação dentro do padrão.</span>
              </div>
            ) : (
              pontosAtencao.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-md border text-xs flex flex-col gap-1 ${
                    item.severidade === 'alta'
                      ? 'border-red-200 bg-red-50/40 text-[#1F2937]'
                      : 'border-amber-200 bg-amber-50/30 text-[#1F2937]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[#1F2937]">{item.titulo}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${
                        item.severidade === 'alta'
                          ? 'bg-red-100 text-[#B91C1C]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.severidade === 'alta' ? 'Crítico' : 'Atenção'}
                    </span>
                  </div>
                  <p className="text-[#4B5563] text-[11px]">{item.descricao}</p>
                  <div className="flex items-center gap-1.5 font-medium text-[11px] text-[#B91C1C] mt-0.5">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>{item.dadoConcreto}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Propostas de Melhoria Automáticas baseadas nos Dados */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#2563EB]" />
                <span>Propostas de Melhoria (Sugestões Automáticas)</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Plano de ação gerado a partir dos dados concretos da operação para levar ao cliente
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#2563EB] bg-[#3B82F6]/10 px-2 py-0.5 rounded">
              Baseado em regras
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-auto max-h-80">
            {propostasMelhoria.map((prop) => (
              <div
                key={prop.id}
                className="p-3 rounded-md border border-[#E5E7EB] bg-[#F7F7F5]/50 text-xs flex flex-col gap-1.5 hover:border-[#2563EB]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-200 text-[#374151]">
                      {prop.categoria}
                    </span>
                    <span className="font-bold text-[#1F2937]">{prop.titulo}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      prop.impacto === 'Alto'
                        ? 'bg-[#3B82F6]/15 text-[#2563EB]'
                        : 'bg-gray-100 text-[#4B5563]'
                    }`}
                  >
                    Impacto {prop.impacto}
                  </span>
                </div>

                <p className="text-[#374151] font-medium text-[11px] leading-relaxed">
                  {prop.sugestao}
                </p>

                <div className="text-[10px] text-[#6B7280] flex items-center gap-1 pt-1 border-t border-gray-200/60">
                  <span className="font-semibold text-[#4B5563]">Evidência:</span>
                  <span>{prop.evidencia}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Configurações de Automação: Resumo Semanal + Alertas de Rotinas Atrasadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Resumo Semanal por E-mail */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>Resumo semanal por e-mail</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Disparo automatizado às <strong>segundas-feiras às 06:30</strong> com KPIs e
                propostas
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#2563EB] self-start sm:self-auto shrink-0">
              <Calendar className="w-3 h-3" />
              <span>Segundas-feiras</span>
            </span>
          </div>

          {emailFeedback && (
            <div className="mb-3 p-2.5 text-xs rounded bg-blue-50 text-[#1D4ED8] border border-blue-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{emailFeedback}</span>
            </div>
          )}

          <div className="flex-1 overflow-auto max-h-96">
            {clientesComContato.length === 0 ? (
              <div className="p-4 bg-[#F7F7F5] border border-dashed border-[#E5E7EB] rounded-md text-xs text-[#6B7280] text-center">
                Nenhum cliente cadastrado com e-mail/contato preenchido. Cadastre ou edite um
                cliente na aba <strong>Clientes</strong> informando o e-mail de contato para ativar
                o resumo semanal.
              </div>
            ) : (
              <div className="border border-[#E5E7EB] rounded-md divide-y divide-[#E5E7EB] overflow-hidden">
                {clientesComContato.map((c) => {
                  const isEnabled = c.envio_semanal !== false // padrão ativo se não for false
                  const isUpdating = updatingClienteId === c.id

                  return (
                    <div
                      key={c.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white hover:bg-[#F7F7F5]/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">{c.nome}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              isEnabled
                                ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                                : 'bg-gray-100 text-[#6B7280]'
                            }`}
                          >
                            {isEnabled ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4B5563] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{c.contato}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <span className="text-[11px] text-[#6B7280] hidden sm:inline">
                          {isEnabled ? 'Recebe semanal' : 'Desativado'}
                        </span>
                        <button
                          type="button"
                          disabled={!isAdmin || isUpdating}
                          onClick={() => handleToggleEnvioSemanal(c.id, isEnabled)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                            isEnabled ? 'bg-[#2563EB]' : 'bg-gray-200'
                          }`}
                          title={
                            !isAdmin
                              ? 'Apenas administradores podem alterar configurações de envio'
                              : isEnabled
                                ? 'Clique para desativar envio semanal'
                                : 'Clique para ativar envio semanal'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Alertas de Rotinas Atrasadas (Disparo a cada 5 min) */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                <span>Alertas de rotinas atrasadas</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Varredura a <strong>cada 5 minutos</strong>: avisa Gerente e Regional quando o
                horário limite é ultrapassado
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto shrink-0">
              <Clock className="w-3 h-3" />
              <span>A cada 5 min</span>
            </span>
          </div>

          {alertasFeedback && (
            <div className="mb-3 p-2.5 text-xs rounded bg-blue-50 text-[#1D4ED8] border border-blue-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{alertasFeedback}</span>
            </div>
          )}

          <div className="flex-1 overflow-auto max-h-96">
            {localLojas.length === 0 ? (
              <div className="p-4 bg-[#F7F7F5] border border-dashed border-[#E5E7EB] rounded-md text-xs text-[#6B7280] text-center">
                Nenhuma loja cadastrada. Adicione lojas na aba <strong>Lojas</strong> para
                configurar alertas de rotinas em atraso.
              </div>
            ) : (
              <div className="border border-[#E5E7EB] rounded-md divide-y divide-[#E5E7EB] overflow-hidden">
                {localLojas.map((loja) => {
                  const isEnabled = loja.alertas_ativos !== false // padrão ativo se não for false
                  const isUpdating = updatingLojaId === loja.id
                  const isEditingRegional = editingRegionalLojaId === loja.id
                  const clienteObj = clientes.find((c) => c.id === loja.cliente)

                  return (
                    <div
                      key={loja.id}
                      className="p-3 flex flex-col gap-2.5 bg-white hover:bg-[#F7F7F5]/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1F2937]">
                            {loja.nome} {loja.codigo ? `(${loja.codigo})` : ''}
                          </span>
                          <span className="text-[10px] text-[#6B7280] font-medium bg-gray-100 px-1.5 py-0.2 rounded">
                            {clienteObj?.nome || 'Cliente não vinculado'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              isEnabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-[#6B7280]'
                            }`}
                          >
                            {isEnabled ? 'Alertas Ativos' : 'Desativados'}
                          </span>
                        </div>

                        {/* Toggle Alertas Ativos */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={!isAdmin || isUpdating}
                            onClick={() => handleToggleAlertasLoja(loja.id, isEnabled)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                              isEnabled ? 'bg-[#2563EB]' : 'bg-gray-200'
                            }`}
                            title={
                              !isAdmin
                                ? 'Apenas administradores podem alterar alertas'
                                : isEnabled
                                  ? 'Clique para desativar alertas desta loja'
                                  : 'Clique para ativar alertas desta loja'
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* E-mail do Regional com edição inline */}
                      <div className="text-[11px] text-[#4B5563] pt-1 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="font-semibold text-[#6B7280] whitespace-nowrap">
                            E-mail do Regional:
                          </span>
                          {isEditingRegional ? (
                            <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                              <input
                                type="email"
                                value={tempEmailRegional}
                                onChange={(e) => setTempEmailRegional(e.target.value)}
                                placeholder="regional@cliente.com"
                                className="w-full px-2 py-1 text-xs bg-white border border-[#2563EB] rounded outline-none text-[#1F2937]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEmailRegional(loja.id)
                                  if (e.key === 'Escape') handleCancelEditRegional()
                                }}
                              />
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleSaveEmailRegional(loja.id)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                title="Salvar e-mail"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditRegional}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="Cancelar edição"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={`truncate ${
                                  loja.email_regional
                                    ? 'text-[#1F2937] font-medium'
                                    : 'text-[#9CA3AF] italic'
                                }`}
                              >
                                {loja.email_regional || 'Nenhum e-mail regional cadastrado'}
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditRegional(loja)}
                                  className="p-1 text-[#6B7280] hover:text-[#2563EB] hover:bg-gray-100 rounded shrink-0 transition-colors"
                                  title="Editar e-mail do regional"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {!isEditingRegional && (
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">
                            Destinatários: Responsável direto + Chefe imediato + Gerente da loja + Regional
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
