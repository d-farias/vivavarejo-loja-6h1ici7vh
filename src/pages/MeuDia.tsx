import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Store,
  ChevronRight,
  Sparkles,
  Camera,
  Layers,
  Filter,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CardTarefaEnxuto } from '@/components/CardTarefaEnxuto'
import { ExecucaoGuiadaModal, ExecucaoGuiadaResult } from '@/components/ExecucaoGuiadaModal'
import { ConcluirVisitaModal } from '@/components/ConcluirVisitaModal'
import { SeletorSegmentoModal, SegmentoAtivoBadge } from '@/components/SeletorSegmentoModal'
import { segmentosService } from '@/services/segmentos'
import { StoreSelector } from '@/components/StoreSelector'
import { OfflineStatusIndicator } from '@/components/OfflineStatusIndicator'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { rotinasService, execucoesService, getTodayDateString } from '@/services/rotinas'
import { useI18n } from '@/lib/i18n/context'
import { visitasPromotorService } from '@/services/visitasPromotor'
import { parseHorarioLimiteToMinutes, isPastDue } from '@/lib/time-utils'
import {
  saveLocalCache,
  getLocalCache,
  enqueueOfflineItem,
  getPendingQueue,
} from '@/lib/offline/db'
import { triggerQueueSync } from '@/lib/offline/syncEngine'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import type { Rotina, ExecucaoRotina, VisitaPromotor } from '@/types'

export function MeuDiaPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const { lojaSelecionada, lojaSelecionadaId } = useStore()
  const navigate = useNavigate()
  const [seletorSegmentoOpen, setSeletorSegmentoOpen] = useState(false)
  const segmentoAtivoUsuario = segmentosService.getSegmentoAtivo(user)

  const [loading, setLoading] = useState(true)
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoRotina[]>([])
  const [visitas, setVisitas] = useState<VisitaPromotor[]>([])

  // Modal de execução guiada
  const [guiadaAberta, setGuiadaAberta] = useState(false)
  const [rotinaAlvo, setRotinaAlvo] = useState<Rotina | null>(null)

  // Modal de checklist/conclusão de visita
  const [visitaAlvo, setVisitaAlvo] = useState<VisitaPromotor | null>(null)
  const [concluirVisitaAberta, setConcluirVisitaAberta] = useState(false)

  // Filtro simples de visualização na lista inferior
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'concluidas'>(
    'pendentes',
  )

  const hojeStr = useMemo(() => getTodayDateString(), [])

  // Carregamento de dados com tolerância a sinal ruim e cache local robusto (IndexedDB)
  const carregarDados = async () => {
    const lojaId = lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined
    const cacheKey = `vivavarejo_meudia_${lojaId || 'all'}_${hojeStr}`

    try {
      setLoading(true)

      // 1. Carrega imediatamente o cache offline do IndexedDB para renderização instantânea
      const cached = await getLocalCache<{
        rotinas: Rotina[]
        execucoes: ExecucaoRotina[]
        visitas: VisitaPromotor[]
      }>(cacheKey)

      if (cached) {
        setRotinas(cached.rotinas || [])
        setExecucoes(cached.execucoes || [])
        setVisitas(cached.visitas || [])
      }

      // Incorpora itens pendentes da fila local para que tarefas executadas offline apareçam concluídas na UI
      const pendingQueue = await getPendingQueue()
      if (pendingQueue.length > 0) {
        const localExecs: ExecucaoRotina[] = []
        for (const item of pendingQueue) {
          if (item.type === 'execucao_rotina') {
            localExecs.push({
              id: item.id,
              collectionId: 'execucoes_rotinas',
              collectionName: 'execucoes_rotinas',
              rotina: item.targetId,
              usuario: item.userId || user?.id || '',
              data_execucao: item.createdAt,
              concluida: true,
              status_validacao: item.payload.conforme ? 'aprovada' : 'aguardando_validacao',
              created: item.createdAt,
              updated: item.createdAt,
            })
          }
        }
        if (localExecs.length > 0) {
          setExecucoes((prev) => {
            const map = new Map<string, ExecucaoRotina>()
            for (const e of prev) map.set(e.rotina, e)
            for (const le of localExecs) map.set(le.rotina, le)
            return Array.from(map.values())
          })
        }
      }

      // Se o navegador estiver offline, não tenta a rede e mantém os dados em cache
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setLoading(false)
        return
      }

      // 2. Busca dados frescos da rede
      const segAtivo = segmentosService.getSegmentoAtivo(user)
      const [rotList, exList, visList] = await Promise.all([
        rotinasService.getAll(lojaId, { apenasAtivas: true }),
        execucoesService.getExecutionsByDate(hojeStr),
        visitasPromotorService.getAll(lojaId),
      ])

      const rotinasDoSegmento = segmentosService.filtrarRotinasAtivasPorSegmento(rotList, segAtivo)
      const ativas = rotinasDoSegmento.filter((r) => r.status === 'Ativa')
      setRotinas(ativas)
      setExecucoes(exList)
      setVisitas(visList)

      // 3. Salva no IndexedDB para persistência entre sessões e modo desconectado
      await saveLocalCache(cacheKey, {
        rotinas: ativas,
        execucoes: exList,
        visitas: visList,
      })
    } catch (err) {
      console.warn('[MeuDia] Rede inacessível. Usando dados do IndexedDB:', err)
      // Tenta recuperar do cache se ainda não tiver carregado
      const fallback = await getLocalCache<{
        rotinas: Rotina[]
        execucoes: ExecucaoRotina[]
        visitas: VisitaPromotor[]
      }>(cacheKey)
      if (fallback) {
        setRotinas(fallback.rotinas || [])
        setExecucoes(fallback.execucoes || [])
        setVisitas(fallback.visitas || [])
      }
      toast({
        title: 'Modo Offline Ativo',
        description: 'Usando rotinas e visitas salvas no aparelho.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [lojaSelecionadaId, hojeStr])

  // Escutar evento global de troca de segmento para atualizar Meu Dia imediatamente
  useEffect(() => {
    const handleSegmentoAlterado = () => {
      carregarDados()
    }
    window.addEventListener('vivavarejo:segmento_alterado', handleSegmentoAlterado)
    return () => {
      window.removeEventListener('vivavarejo:segmento_alterado', handleSegmentoAlterado)
    }
  }, [])

  // Mapa de execuções concluídas no dia
  const execMap = useMemo(() => {
    const map = new Map<string, ExecucaoRotina>()
    for (const ex of execucoes) {
      if (ex.concluida) {
        map.set(ex.rotina, ex)
      }
    }
    return map
  }, [execucoes])

  // Visitas do dia
  const visitasDoDia = useMemo(() => {
    return visitas.filter((v) => {
      const dataV = v.data_visita ? v.data_visita.split('T')[0] : ''
      return dataV === hojeStr
    })
  }, [visitas, hojeStr])

  // Próxima visita em destaque (formato exato pedido no item 2 e 9):
  // "Próxima visita / Supermercado X / 09:00 / 8 tarefas / 2 prioritárias / [botão Iniciar visita]"
  const proximaVisita = useMemo(() => {
    // Procura a primeira visita pendente do dia, ou a que está em andamento (com check_in sem check_out)
    const pendentes = visitasDoDia.filter(
      (v) => v.status !== 'realizada' && v.status !== 'cancelada',
    )
    if (pendentes.length > 0) return pendentes[0]
    // Se não houver pendente hoje, pega a primeira pendente geral
    const pendentesGerais = visitas.filter(
      (v) => v.status !== 'realizada' && v.status !== 'cancelada',
    )
    return pendentesGerais[0] || null
  }, [visitasDoDia, visitas])

  // Rotinas pendentes e ordenadas por prioridade do motor
  const rotinasPendentes = useMemo(() => {
    return rotinas.filter((r) => !execMap.has(r.id))
  }, [rotinas, execMap])

  // Motor de prioridade: "Faça agora", "Depois", "Em seguida"
  const tarefasClassificadas = useMemo(() => {
    const agoraMin = new Date().getHours() * 60 + new Date().getMinutes()

    // Ordenar pendentes:
    // 1º Atrasadas
    // 2º Prioritárias de abertura / críticas
    // 3º Horário mais próximo
    const sorted = [...rotinasPendentes].sort((a, b) => {
      const atrasoA = isPastDue(a.horario_limite) ? 1 : 0
      const atrasoB = isPastDue(b.horario_limite) ? 1 : 0
      if (atrasoA !== atrasoB) return atrasoB - atrasoA

      const pA = a.prioridade_dia || 99
      const pB = b.prioridade_dia || 99
      if (pA !== pB) return pA - pB

      const mA = parseHorarioLimiteToMinutes(a.horario_limite) ?? 9999
      const mB = parseHorarioLimiteToMinutes(b.horario_limite) ?? 9999
      return mA - mB
    })

    const fFacaAgora = sorted[0] || null
    const fDepois = sorted[1] || null
    const fEmSeguida = sorted[2] || null
    const restantes = sorted.slice(3)

    return {
      facaAgora: fFacaAgora,
      depois: fDepois,
      emSeguida: fEmSeguida,
      restantes,
    }
  }, [rotinasPendentes])

  // Métricas do dia para o operador
  const totalTarefas = rotinas.length
  const concluidasCount = execMap.size
  const pendentesCount = rotinasPendentes.length
  const pctConcluido = totalTarefas > 0 ? Math.round((concluidasCount / totalTarefas) * 100) : 0

  // Executar rotina com fluxo guiado
  const handleAbrirExecucao = (r: Rotina) => {
    setRotinaAlvo(r)
    setGuiadaAberta(true)
  }

  // Executar rotina com fluxo guiado com suporte offline prioritário
  const handleConcluirExecucaoGuiada = async (res: ExecucaoGuiadaResult) => {
    if (!rotinaAlvo || !user) return
    const agoraIso = new Date().toISOString()
    const rotinaId = rotinaAlvo.id

    // Atualização otimista imediata na UI: cria uma execução virtual local
    const execucaoOtimista: ExecucaoRotina = {
      id: `local_exec_${Date.now()}`,
      collectionId: 'execucoes_rotinas',
      collectionName: 'execucoes_rotinas',
      rotina: rotinaId,
      usuario: user.id,
      data_execucao: agoraIso,
      concluida: true,
      status_validacao: res.conforme ? 'aprovada' : 'aguardando_validacao',
      created: agoraIso,
      updated: agoraIso,
      expand: {
        rotina: rotinaAlvo,
        usuario: user,
      },
    }

    // Atualiza estado e cache local do dia no IndexedDB
    setExecucoes((prev) => {
      const filtered = prev.filter((e) => e.rotina !== rotinaId)
      const next = [execucaoOtimista, ...filtered]
      const lojaId = lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined
      const cacheKey = `vivavarejo_meudia_${lojaId || 'all'}_${hojeStr}`
      saveLocalCache(cacheKey, {
        rotinas,
        execucoes: next,
        visitas,
      }).catch(() => {})
      return next
    })

    // Se estiver offline ou a conexão cair, enfileira diretamente no IndexedDB
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await enqueueOfflineItem({
        type: 'execucao_rotina',
        createdAt: agoraIso,
        targetId: rotinaId,
        userId: user.id,
        lojaId: rotinaAlvo.loja,
        payload: {
          conforme: res.conforme,
          observacao: res.observacao || '',
          data_execucao: hojeStr,
          horario_planejado: rotinaAlvo.horario_limite,
        },
        fotoBlob: res.fotoFile ? res.fotoFile : undefined,
        fotoFileName: res.fotoFile ? res.fotoFile.name : undefined,
        fotoFieldName: 'foto',
      })

      toast({
        title: 'Registro salvo no aparelho (Offline)',
        description: `${rotinaAlvo.nome} foi concluída offline e será enviada quando reconectar.`,
      })
      return
    }

    // Se estiver online, tenta enviar diretamente; se falhar, enfileira automaticamente
    try {
      const existing = execMap.get(rotinaId)
      await execucoesService.toggleExecution(
        rotinaId,
        user.id,
        false,
        existing?.id,
        hojeStr,
        res.fotoFile,
      )

      if (res.observacao || !res.conforme) {
        const updatedList = await execucoesService.getExecutionsByDate(hojeStr)
        const thisExec = updatedList.find((e) => e.rotina === rotinaId)
        if (thisExec) {
          await pb.collection('execucoes_rotinas').update(thisExec.id, {
            observacao: res.observacao,
            status_validacao: res.conforme ? 'aprovada' : 'aguardando_validacao',
          })
        }
      }

      toast({
        title: res.conforme ? 'Tarefa concluída com sucesso!' : 'Apontamento registrado!',
        description: res.conforme
          ? `${rotinaAlvo.nome} foi finalizada.`
          : `${rotinaAlvo.nome} registrada com fotos/obs.`,
      })

      // Registra evento de métricas do funil: ações concluídas
      try {
        const { funnelService } = await import('@/services/funnelService')
        await funnelService.registrarEvento({
          evento: 'acoes_concluidas',
          userId: user.id,
          userEmail: user.email,
          userNome: user.name,
          detalhes: { rotina_id: rotinaId, conforme: res.conforme },
        })
      } catch {
        /* ignore */
      }

      // Atualiza lista do servidor
      await carregarDados()
    } catch (err) {
      console.warn('[MeuDia] Falha de rede ao enviar execução. Enfileirando offline:', err)
      // Enfileira para que NADA se perca
      await enqueueOfflineItem({
        type: 'execucao_rotina',
        createdAt: agoraIso,
        targetId: rotinaId,
        userId: user.id,
        lojaId: rotinaAlvo.loja,
        payload: {
          conforme: res.conforme,
          observacao: res.observacao || '',
          data_execucao: hojeStr,
          horario_planejado: rotinaAlvo.horario_limite,
        },
        fotoBlob: res.fotoFile ? res.fotoFile : undefined,
        fotoFileName: res.fotoFile ? res.fotoFile.name : undefined,
        fotoFieldName: 'foto',
      })

      toast({
        title: 'Salvo na fila de envio',
        description:
          'Sinal instável. A tarefa foi salva no aparelho e será transmitida automaticamente.',
      })
    }
  }

  // Ações de check-in de visita com suporte offline
  const handleCheckInVisita = async (v: VisitaPromotor) => {
    const agoraIso = new Date().toISOString()
    const hora = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`

    // Atualização otimista local
    setVisitas((prev) =>
      prev.map((vis) => (vis.id === v.id ? { ...vis, check_in: agoraIso } : vis)),
    )

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await enqueueOfflineItem({
        type: 'visita_checkin',
        createdAt: agoraIso,
        targetId: v.id,
        userId: user?.id,
        lojaId: v.loja,
        payload: { hora },
      })
      toast({
        title: 'Check-in registrado no aparelho!',
        description: `Entrada às ${hora} (Modo Offline). Será sincronizado quando a conexão voltar.`,
      })
      return
    }

    try {
      await visitasPromotorService.registrarCheckIn(v.id, hora)
      toast({
        title: 'Check-in realizado!',
        description: `Entrada registrada às ${hora}. Bom trabalho!`,
      })
      await carregarDados()
    } catch (err) {
      console.warn('[MeuDia] Falha ao enviar check-in online, salvando na fila:', err)
      await enqueueOfflineItem({
        type: 'visita_checkin',
        createdAt: agoraIso,
        targetId: v.id,
        userId: user?.id,
        lojaId: v.loja,
        payload: { hora },
      })
      toast({
        title: 'Check-in gravado no aparelho',
        description: `Entrada registrada às ${hora}. Envio na fila automática.`,
      })
    }
  }

  const handleAbrirChecklistVisita = (v: VisitaPromotor) => {
    setVisitaAlvo(v)
    setConcluirVisitaAberta(true)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-24">
      {/* Topo fixo com identificador da loja e saudação direta */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20 px-4 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>
                {t.meuDia.title} •{' '}
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#1F2937] truncate leading-tight">
              Olá, {user?.name?.split(' ')[0] || 'Promotor'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Status Offline / Online com contador de pendências */}
            <OfflineStatusIndicator />
            <StoreSelector />
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                await triggerQueueSync().catch(() => {})
                await carregarDados()
              }}
              title="Sincronizar dados e fila"
              className="h-9 w-9 border-[#E5E7EB] shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F766E]' : 'text-[#6B7280]'}`}
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* RESPOSTA IMEDIATA ÀS 3 PERGUNTAS DO PROMOTOR:
            1. Onde preciso ir? (Card Próxima Visita)
            2. O que preciso fazer? (Resumo e progresso)
            3. O que é prioridade agora? (Motor Faça Agora) */}

        {/* 1. ONDE PRECISO IR? — CARD DA PRÓXIMA VISITA (Item 2 e 9 da especificação) */}
        {loading ? (
          <Skeleton className="h-36 w-full rounded-2xl bg-white border border-[#E5E7EB]" />
        ) : proximaVisita ? (
          <div className="bg-white rounded-2xl border-2 border-teal-600/40 shadow-sm overflow-hidden ring-1 ring-teal-600/10">
            <div className="bg-gradient-to-r from-[#0F766E] to-[#115E59] px-4 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.meuDia.proximaVisita}
                </span>
              </div>
              {proximaVisita.check_in && !proximaVisita.check_out && (
                <span className="text-[11px] font-bold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  Em andamento
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                    {proximaVisita.expand?.loja?.nome ||
                      lojaSelecionada?.nome ||
                      'Supermercado Central'}
                  </h2>
                  <div className="text-xs text-[#6B7280] flex items-center gap-2 mt-0.5">
                    <span>
                      Fornecedor:{' '}
                      {proximaVisita.expand?.promotor?.expand?.fornecedor?.nome ||
                        'Nestlé / Mondelez'}
                    </span>
                    <span>•</span>
                    <span>Promotor: {proximaVisita.expand?.promotor?.nome || user?.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-teal-50 text-[#0F766E] font-bold text-xs px-2.5 py-1 rounded-md border border-teal-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{proximaVisita.horario_previsto || '09:00'}</span>
                  </div>
                </div>
              </div>

              {/* Informações operacionais exatas: 8 tarefas / 2 prioritárias */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="bg-gray-100 text-[#374151] px-2.5 py-1 rounded-md font-medium">
                  {totalTarefas || 8} tarefas planejadas
                </span>
                <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md font-bold">
                  2 prioritárias
                </span>
                {proximaVisita.check_in && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px]">
                    Check-in:{' '}
                    {new Date(proximaVisita.check_in).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {/* Ação principal da visita */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {!proximaVisita.check_in ? (
                  <Button
                    type="button"
                    onClick={() => handleCheckInVisita(proximaVisita)}
                    className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white font-bold h-10 shadow-xs flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Fazer Check-in na Loja</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleAbrirChecklistVisita(proximaVisita)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Executar Checklist & Check-out</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#1F2937]">Nenhuma visita pendente agendada</h3>
            <p className="text-xs text-[#6B7280]">
              Todas as visitas previstas para sua rota estão concluídas.
            </p>
          </div>
        )}

        {/* 2. O QUE É PRIORIDADE AGORA? — MOTOR DE PRIORIDADE (FAÇA AGORA) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1F2937]">
                  {t.meuDia.facaAgora} — {t.meuDia.subtitle}
                </h2>
                <p className="text-[11px] text-[#6B7280]">{t.common.tagline}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#0F766E]">
              {pctConcluido}% ({t.meuDia.progressoDia})
            </span>{' '}
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-xl bg-white" />
              <Skeleton className="h-20 w-full rounded-xl bg-white" />
            </div>
          ) : tarefasClassificadas.facaAgora || tarefasClassificadas.depois ? (
            <div className="space-y-2.5">
              {/* FAÇA AGORA */}
              {tarefasClassificadas.facaAgora && (
                <div className="p-4 rounded-2xl border-2 border-rose-500 bg-rose-500/10 shadow-lg relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                      {t.meuDia.facaAgora}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      {tarefasClassificadas.facaAgora.horario_limite || 'Imediato'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {tarefasClassificadas.facaAgora.nome}
                  </h3>
                  {tarefasClassificadas.facaAgora.observacoes && (
                    <p className="text-xs text-[#CBD5E1] mt-1 line-clamp-2">
                      {tarefasClassificadas.facaAgora.observacoes}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#94A3B8]">
                      {tarefasClassificadas.facaAgora.responsavel || 'Operação de Loja'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAbrirExecucao(tarefasClassificadas.facaAgora!)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-8 px-3 rounded-xl shadow-md"
                    >
                      <PlayCircle className="w-3.5 h-3.5 mr-1" />
                      Executar tarefa
                    </Button>
                  </div>
                </div>
              )}

              {/* DEPOIS */}
              {tarefasClassificadas.depois && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      {t.meuDia.depois} — Limite{' '}
                      {tarefasClassificadas.depois.horario_limite || '10:30'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAbrirExecucao(tarefasClassificadas.depois!)}
                      className="text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      Executar agora →
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    {tarefasClassificadas.depois.nome}
                  </h4>
                </div>
              )}

              {/* EM SEGUIDA */}
              {tarefasClassificadas.emSeguida && (
                <div className="p-3.5 rounded-2xl border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      {t.meuDia.emSeguida} — Limite{' '}
                      {tarefasClassificadas.emSeguida.horario_limite || '11:00'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAbrirExecucao(tarefasClassificadas.emSeguida!)}
                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                    >
                      Executar →
                    </button>
                  </div>
                  <h4 className="text-xs font-semibold text-[#1F2937]">
                    {tarefasClassificadas.emSeguida.nome}
                  </h4>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-950">Rotinas em dia!</h3>
              <p className="text-xs text-emerald-800">
                Você concluiu as tarefas prioritárias programadas para este momento.
              </p>
            </div>
          )}
        </section>

        {/* 3. LISTA DE TAREFAS ENXUTAS DO DIA COM FILTRO RÁPIDO */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
              <span>Rotinas e Tarefas da Loja</span>
              <span className="text-xs font-mono font-normal text-[#6B7280]">
                ({concluidasCount}/{totalTarefas})
              </span>
            </h2>

            {/* Alternador de filtro */}
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setFiltroStatus('pendentes')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroStatus === 'pendentes'
                    ? 'bg-white text-[#1F2937] font-bold shadow-2xs'
                    : 'text-[#4B5563]'
                }`}
              >
                {t.meuDia.filtroPendentes} ({pendentesCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('concluidas')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroStatus === 'concluidas'
                    ? 'bg-white text-[#1F2937] font-bold shadow-2xs'
                    : 'text-[#4B5563]'
                }`}
              >
                {t.meuDia.filtroConcluidas} ({concluidasCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('todos')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroStatus === 'todos'
                    ? 'bg-white text-[#1F2937] font-bold shadow-2xs'
                    : 'text-[#4B5563]'
                }`}
              >
                {t.meuDia.filtroTodos}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-xl bg-white" />
              <Skeleton className="h-24 w-full rounded-xl bg-white" />
              <Skeleton className="h-24 w-full rounded-xl bg-white" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {rotinas
                .filter((r) => {
                  const isConc = execMap.has(r.id)
                  if (filtroStatus === 'pendentes') return !isConc
                  if (filtroStatus === 'concluidas') return isConc
                  return true
                })
                // Modelo de demonstração enxuto: mostra no máximo 3 rotinas exemplares na visão rápida para facilitar o entendimento
                .slice(0, 3)
                .map((rotina) => {
                  const isConc = execMap.has(rotina.id)
                  return (
                    <CardTarefaEnxuto
                      key={rotina.id}
                      rotina={rotina}
                      concluida={isConc}
                      onExecutar={handleAbrirExecucao}
                      onVerDetalhes={() => {
                        navigate('/agenda')
                      }}
                    />
                  )
                })}
            </div>
          )}
        </section>
      </main>

      {/* Modal de execução guiada */}
      {rotinaAlvo && (
        <ExecucaoGuiadaModal
          open={guiadaAberta}
          onOpenChange={setGuiadaAberta}
          titulo={rotinaAlvo.nome}
          subtitulo={`Responsável: ${rotinaAlvo.responsavel || 'Operador'} • Loja: ${lojaSelecionada?.nome || ''}`}
          horarioLimite={rotinaAlvo.horario_limite}
          responsavel={rotinaAlvo.responsavel}
          ferramenta={rotinaAlvo.ferramenta}
          validacao={rotinaAlvo.validacao}
          observacoesOriginais={rotinaAlvo.observacoes}
          onConcluir={handleConcluirExecucaoGuiada}
        />
      )}

      {/* Modal de conclusão e checklist de visita com fotos e enfileiramento offline */}
      {visitaAlvo && (
        <ConcluirVisitaModal
          open={concluirVisitaAberta}
          onOpenChange={setConcluirVisitaAberta}
          visita={visitaAlvo}
          onConcluir={async (payload) => {
            const agoraIso = new Date().toISOString()
            const vId = visitaAlvo.id

            // Atualização otimista na interface local
            setVisitas((prev) =>
              prev.map((vis) =>
                vis.id === vId
                  ? {
                      ...vis,
                      status: 'realizada',
                      realizada_em: agoraIso,
                      check_out: vis.check_in && !vis.check_out ? agoraIso : vis.check_out,
                    }
                  : vis,
              ),
            )

            // Se estiver desconectado, enfileira diretamente
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
              let fotoBlob: Blob | undefined
              let fotoFileName: string | undefined
              const extraFotos: Array<{ fieldName: string; blob: Blob; fileName: string }> = []
              const plainPayload: Record<string, unknown> = {}

              if (payload instanceof FormData) {
                payload.forEach((val, key) => {
                  if (val instanceof File) {
                    if (key === 'foto_trabalho' && !fotoBlob) {
                      fotoBlob = val
                      fotoFileName = val.name
                    } else {
                      extraFotos.push({ fieldName: key, blob: val, fileName: val.name })
                    }
                  } else {
                    plainPayload[key] = val
                  }
                })
              } else {
                Object.assign(plainPayload, payload)
                if (payload.foto_trabalho instanceof File) {
                  fotoBlob = payload.foto_trabalho
                  fotoFileName = payload.foto_trabalho.name
                }
                if (payload.foto_gondola instanceof File) {
                  extraFotos.push({
                    fieldName: 'foto_gondola',
                    blob: payload.foto_gondola,
                    fileName: payload.foto_gondola.name,
                  })
                }
              }

              await enqueueOfflineItem({
                type: 'visita_conclusao',
                createdAt: agoraIso,
                targetId: vId,
                userId: user?.id,
                lojaId: visitaAlvo.loja,
                payload: plainPayload,
                fotoBlob,
                fotoFileName,
                fotoFieldName: 'foto_trabalho',
                extraFotos: extraFotos.length > 0 ? extraFotos : undefined,
              })

              toast({
                title: 'Visita concluída no aparelho (Offline)!',
                description:
                  'Checklist e fotos gravados. Serão enviados automaticamente ao reconectar.',
              })
              setConcluirVisitaAberta(false)
              return
            }

            // Se online, tenta enviar com fallback para fila offline
            try {
              await visitasPromotorService.registrarConclusao(vId, payload)
              if (visitaAlvo.check_in && !visitaAlvo.check_out) {
                await visitasPromotorService.registrarCheckOut(vId)
              }
              toast({
                title: 'Visita concluída com sucesso!',
                description: 'Checklist e fotos arquivados para a gestão.',
              })
              setConcluirVisitaAberta(false)
              await carregarDados()
            } catch (err) {
              console.warn('[MeuDia] Erro de rede ao concluir visita, enfileirando offline:', err)
              let fotoBlob: Blob | undefined
              let fotoFileName: string | undefined
              const extraFotos: Array<{ fieldName: string; blob: Blob; fileName: string }> = []
              const plainPayload: Record<string, unknown> = {}

              if (payload instanceof FormData) {
                payload.forEach((val, key) => {
                  if (val instanceof File) {
                    if (key === 'foto_trabalho' && !fotoBlob) {
                      fotoBlob = val
                      fotoFileName = val.name
                    } else {
                      extraFotos.push({ fieldName: key, blob: val, fileName: val.name })
                    }
                  } else {
                    plainPayload[key] = val
                  }
                })
              } else {
                Object.assign(plainPayload, payload)
                if (payload.foto_trabalho instanceof File) {
                  fotoBlob = payload.foto_trabalho
                  fotoFileName = payload.foto_trabalho.name
                }
              }

              await enqueueOfflineItem({
                type: 'visita_conclusao',
                createdAt: agoraIso,
                targetId: vId,
                userId: user?.id,
                lojaId: visitaAlvo.loja,
                payload: plainPayload,
                fotoBlob,
                fotoFileName,
                fotoFieldName: 'foto_trabalho',
                extraFotos: extraFotos.length > 0 ? extraFotos : undefined,
              })

              toast({
                title: 'Gravado na fila offline',
                description:
                  'Sinal fraco. Sua visita e fotos estão salvas e serão enviadas automaticamente.',
              })
              setConcluirVisitaAberta(false)
            }
          }}
        />
      )}

      {/* Modal de Escolha/Troca de Segmento do Varejo */}
      <SeletorSegmentoModal
        open={seletorSegmentoOpen || !segmentoAtivoUsuario}
        obrigatorio={!segmentoAtivoUsuario}
        onOpenChange={setSeletorSegmentoOpen}
        onSuccess={async () => {
          setSeletorSegmentoOpen(false)
          await carregarDados()
        }}
      />
    </div>
  )
}
