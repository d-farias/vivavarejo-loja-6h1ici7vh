import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  Briefcase,
  Building,
  DollarSign,
  Receipt,
  Plus,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  MessageSquare,
  Layers,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoreSelector } from '@/components/StoreSelector'
import { useStore } from '@/context/StoreContext'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/lib/i18n/context'
import { getUserProfileType } from '@/lib/perfil-utils'
import { admRhService } from '@/services/admRh'
import { NovaDemandaAdmRhModal } from '@/components/NovaDemandaAdmRhModal'
import { TratarDemandaAdmRhModal } from '@/components/TratarDemandaAdmRhModal'
import { FotoVisualizadorModal } from '@/components/FotoVisualizadorModal'
import { OfflineStatusIndicator } from '@/components/OfflineStatusIndicator'
import { SegmentoAtivoBadge, SeletorSegmentoModal } from '@/components/SeletorSegmentoModal'
import type { AdmRhDemanda, SubAreaAdmRh, StatusAdmRh, PrioridadeAdmRh } from '@/types'

const SUB_AREAS_CONFIG: Array<{
  id: SubAreaAdmRh
  label: string
  sublabel: string
  icon: React.ElementType
  exemplosCasos: string
}> = [
  {
    id: 'rh',
    label: 'RH',
    sublabel: 'Recursos Humanos',
    icon: Users,
    exemplosCasos: 'Quadro da loja atual, processo seletivo, acolhimento e clima organizacional',
  },
  {
    id: 'dp',
    label: 'DP',
    sublabel: 'Departamento Pessoal',
    icon: Briefcase,
    exemplosCasos: 'Documentos legais, eSocial, ficha de registro, atestados e escalas da loja',
  },
  {
    id: 'adm',
    label: 'ADM',
    sublabel: 'Administrativo',
    icon: Building,
    exemplosCasos: 'Documentos internos, circular de normas a assinar, alvarás e quadro de avisos',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    sublabel: 'Tesouraria & Caixa',
    icon: DollarSign,
    exemplosCasos: 'Fechamento de cofre, sangrias, notas de fundo fixo e divergências de caixa',
  },
  {
    id: 'fiscal',
    label: 'Fiscal',
    sublabel: 'Tributos & NF-e',
    icon: Receipt,
    exemplosCasos: 'Notas de descarte/perda, inconsistência de ICMS/NCM e CFOP de recebimento',
  },
]

const STATUS_LABELS: Record<StatusAdmRh, { label: string; badgeCls: string; dotCls: string }> = {
  pendente: {
    label: 'Pendente',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    dotCls: 'bg-amber-500',
  },
  recebida: {
    label: 'Recebida',
    badgeCls: 'bg-blue-50 text-blue-800 border-blue-200',
    dotCls: 'bg-blue-500',
  },
  em_tratamento: {
    label: 'Em Tratamento',
    badgeCls: 'bg-teal-50 text-[#0F766E] border-teal-200',
    dotCls: 'bg-[#0F766E]',
  },
  resolvida: {
    label: 'Resolvida',
    badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotCls: 'bg-emerald-600',
  },
  cancelada: {
    label: 'Cancelada',
    badgeCls: 'bg-gray-100 text-[#4B5563] border-[#E5E7EB]',
    dotCls: 'bg-gray-400',
  },
}

const PRIORIDADE_LABELS: Record<PrioridadeAdmRh, { label: string; badgeCls: string }> = {
  baixa: {
    label: 'Baixa',
    badgeCls: 'bg-gray-100 text-[#4B5563] border-[#E5E7EB]',
  },
  media: {
    label: 'Média',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  alta: {
    label: 'Alta',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  urgente: {
    label: 'Urgente',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  },
}

export default function AdmRhPage() {
  const { user } = useAuth()
  const { lojaSelecionadaId, lojas } = useStore()
  const { t } = useI18n()

  // Perfil: Rede vs Gerente
  const profileType = getUserProfileType(user)
  const isModeloGerente = profileType === 'gerente'
  const isModeloRede = !isModeloGerente

  // Sub-área selecionada (RH, DP, ADM, Financeiro, Fiscal)
  const [subAreaAtiva, setSubAreaAtiva] = useState<SubAreaAdmRh>('rh')

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas')

  // Dados
  const [demandas, setDemandas] = useState<AdmRhDemanda[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false)
  const [seletorSegmentoOpen, setSeletorSegmentoOpen] = useState(false)
  const [tratarModal, setTratarModal] = useState<{
    open: boolean
    demanda: AdmRhDemanda | null
  }>({ open: false, demanda: null })

  // Visualizador de Foto
  const [fotoVisualizador, setFotoVisualizador] = useState<{
    open: boolean
    url: string
    title: string
    subtitulo?: string
    dataHora?: string
  }>({ open: false, url: '', title: '' })

  const lojaIdEfetivo =
    lojaSelecionadaId && lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined
  const clienteIdEfetivo = user?.cliente || undefined

  // Carregar dados
  const carregarDemandas = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Tentar carregar demandas existentes
      let list = await admRhService.listarDemandas({
        redeId: isModeloRede ? clienteIdEfetivo : undefined,
        lojaId: lojaIdEfetivo,
      })

      // 2. Se vazio, semear os exemplos reduzidos para a rede/loja
      if (list.length === 0) {
        list = await admRhService.inicializarExemplosSeVazio(clienteIdEfetivo, lojaIdEfetivo)
      }

      setDemandas(list)
    } catch (err) {
      console.error('Erro ao carregar demandas Adm/RH:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteIdEfetivo, lojaIdEfetivo, isModeloRede])

  useEffect(() => {
    carregarDemandas()
  }, [carregarDemandas])

  // Listener para evento 'vivavarejo:segmento_alterado' (Requisito 6)
  useEffect(() => {
    const handleSegmentoAlterado = () => {
      carregarDemandas()
    }
    window.addEventListener('vivavarejo:segmento_alterado', handleSegmentoAlterado)
    return () => {
      window.removeEventListener('vivavarejo:segmento_alterado', handleSegmentoAlterado)
    }
  }, [carregarDemandas])

  // Demandas da sub-área ativa com filtros aplicados
  const demandasSubArea = useMemo(() => {
    return demandas.filter((d) => d.sub_area === subAreaAtiva)
  }, [demandas, subAreaAtiva])

  const demandasFiltradas = useMemo(() => {
    return demandasSubArea.filter((d) => {
      if (filtroStatus !== 'todos' && d.status !== filtroStatus) return false
      if (filtroPrioridade !== 'todas' && d.prioridade !== filtroPrioridade) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const match =
          d.titulo.toLowerCase().includes(q) ||
          (d.descricao || '').toLowerCase().includes(q) ||
          (d.responsavel || '').toLowerCase().includes(q) ||
          (d.solicitante_nome || '').toLowerCase().includes(q) ||
          (d.resposta_area || '').toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [demandasSubArea, filtroStatus, filtroPrioridade, busca])

  // KPIs da sub-área atual
  const statsSubArea = useMemo(() => {
    const total = demandasSubArea.length
    const pendentes = demandasSubArea.filter(
      (d) => d.status === 'pendente' || d.status === 'recebida',
    ).length
    const emTratamento = demandasSubArea.filter((d) => d.status === 'em_tratamento').length
    const resolvidas = demandasSubArea.filter((d) => d.status === 'resolvida').length
    const comFoto = demandasSubArea.filter((d) => Boolean(d.foto)).length

    return {
      total,
      pendentes,
      emTratamento,
      resolvidas,
      comFoto,
    }
  }, [demandasSubArea])

  // KPI geral do módulo Adm/RH
  const statsGerais = useMemo(() => {
    const totalGeral = demandas.length
    const pendentesGeral = demandas.filter(
      (d) => d.status === 'pendente' || d.status === 'recebida',
    ).length
    const emTratamentoGeral = demandas.filter((d) => d.status === 'em_tratamento').length
    const resolvidasGeral = demandas.filter((d) => d.status === 'resolvida').length

    return {
      totalGeral,
      pendentesGeral,
      emTratamentoGeral,
      resolvidasGeral,
    }
  }, [demandas])

  // Abrir visualizador de foto
  const handleVerFoto = (url: string, titulo: string, subtitulo?: string) => {
    setFotoVisualizador({
      open: true,
      url,
      title: titulo,
      subtitulo,
    })
  }

  // Nome da sub-área ativa
  const subAreaInfo = SUB_AREAS_CONFIG.find((s) => s.id === subAreaAtiva)!

  return (
    <div className="space-y-6">
      {/* Cabeçalho Sóbrio com Identificação do Modelo (CNPJ / CPF) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
              {t.admRh.title}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              {isModeloGerente ? 'Modelo Gerente (Loja)' : 'Modelo ADM de Rede (Multi-lojas)'}
            </span>
            <SegmentoAtivoBadge onTrocarSegmento={() => setSeletorSegmentoOpen(true)} />
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5">
            {isModeloGerente ? t.admRh.managerSubtitle : t.admRh.chainSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <OfflineStatusIndicator />
          {/* Seletor de loja visível para ambos, mas rede tem visão geral */}
          <StoreSelector />
          <Button
            size="sm"
            onClick={() => setNovaDemandaOpen(true)}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.admRh.btnNewDemand}</span>
          </Button>
        </div>
      </div>

      {/* 5 Abas / Seletor de Sub-áreas */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-1.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
          {SUB_AREAS_CONFIG.map((area) => {
            const Icon = area.icon
            const isAtiva = subAreaAtiva === area.id
            const countSubArea = demandas.filter((d) => d.sub_area === area.id).length
            const pendentesArea = demandas.filter(
              (d) => d.sub_area === area.id && (d.status === 'pendente' || d.status === 'recebida'),
            ).length

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSubAreaAtiva(area.id)}
                className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                  isAtiva
                    ? 'bg-[#0F766E] text-white shadow-xs font-bold'
                    : 'bg-transparent text-[#374151] hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isAtiva ? 'bg-white/15 text-white' : 'bg-teal-50 text-[#0F766E]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold leading-tight truncate">
                      {area.label}
                    </div>
                    <div
                      className={`text-[10px] sm:text-[11px] truncate ${
                        isAtiva ? 'text-teal-100' : 'text-[#6B7280]'
                      }`}
                    >
                      {area.sublabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {pendentesArea > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isAtiva ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                      }`}
                      title={`${pendentesArea} pendente(s)`}
                    >
                      {pendentesArea}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isAtiva ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#4B5563]'
                    }`}
                  >
                    {countSubArea}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Banner explicativo sóbrio da Sub-área Ativa e seus Casos de Uso */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
            <subAreaInfo.icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-[#1F2937]">
                Área {subAreaInfo.label} • {subAreaInfo.sublabel}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 font-semibold">
                Fluxo Loja ⇄ Área Central
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
              <strong>Finalidades comuns:</strong> {subAreaInfo.exemplosCasos}. A loja anexa a foto
              de comprovação e acompanha a tratativa da equipe corporativa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={carregarDemandas}
            disabled={loading}
            className="text-xs gap-1 border-[#E5E7EB] hover:bg-gray-50 text-[#374151]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setNovaDemandaOpen(true)}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Enviar Demanda {subAreaInfo.label}</span>
          </Button>
        </div>
      </div>

      {/* Cards de Indicadores da Sub-área (Sóbrios, off-white e teal) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total da Sub-área */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>Total {subAreaInfo.label}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1 leading-none">
            {statsSubArea.total}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1.5 block">
            {statsSubArea.comFoto} com evidência fotográfica
          </span>
        </div>

        {/* Pendentes / Em Triagem */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>Pendentes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1 leading-none">
            {statsSubArea.pendentes}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1.5 block">
            Aguardando análise da área
          </span>
        </div>

        {/* Em Tratamento */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>Em Tratamento</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F766E] mt-1 leading-none">
            {statsSubArea.emTratamento}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1.5 block">
            Equipe corporativa atuando
          </span>
        </div>

        {/* Resolvidas */}
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>Resolvidas</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-1 leading-none">
            {statsSubArea.resolvidas}
          </div>
          <span className="text-[11px] text-[#6B7280] mt-1.5 block">
            Regularizadas e arquivadas
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Buscar por título, colaborador, solicitante ou parecer de ${subAreaInfo.label}...`}
            className="w-full text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-[#1F2937] outline-none focus:border-[#0F766E] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-[#374151] outline-none focus:border-[#0F766E]"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="recebida">Recebida</option>
            <option value="em_tratamento">Em Tratamento</option>
            <option value="resolvida">Resolvida</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Filtro Prioridade */}
          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="text-xs bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-[#374151] outline-none focus:border-[#0F766E]"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Lista de Demandas da Sub-área */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
            <span>Carregando demandas da área {subAreaInfo.label}...</span>
          </div>
        ) : demandasFiltradas.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-xs text-[#6B7280] space-y-2">
            <subAreaInfo.icon className="w-8 h-8 mx-auto text-[#9CA3AF] stroke-[1.5]" />
            <p className="font-semibold text-sm text-[#1F2937]">
              Nenhuma demanda encontrada para {subAreaInfo.label}
            </p>
            <p className="max-w-md mx-auto text-[#4B5563]">
              Não há registros com os filtros selecionados. A loja pode criar uma demanda para a
              área anexando fotos de documentos ou relatórios.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => setNovaDemandaOpen(true)}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Demanda</span>
              </Button>
            </div>
          </div>
        ) : (
          demandasFiltradas.map((demanda) => {
            const statusCfg = STATUS_LABELS[demanda.status] || STATUS_LABELS.pendente
            const prioridadeCfg = PRIORIDADE_LABELS[demanda.prioridade] || PRIORIDADE_LABELS.media
            const fotoUrl = admRhService.getFotoUrl(demanda)
            const fotoRespostaUrl = admRhService.getFotoRespostaUrl(demanda)

            return (
              <div
                key={demanda.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-[#0F766E]/40 transition-all space-y-3.5"
              >
                {/* Linha 1: Título, Badges e Ações */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                        {demanda.sub_area.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${prioridadeCfg.badgeCls}`}
                      >
                        {prioridadeCfg.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 ${statusCfg.badgeCls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotCls}`} />
                        <span>{statusCfg.label}</span>
                      </span>
                      {demanda.is_exemplo && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-gray-100 text-[#6B7280]">
                          Exemplo Padrão
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#1F2937] leading-snug">
                      {demanda.titulo}
                    </h3>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTratarModal({ open: true, demanda })}
                      className="text-xs h-8 px-2.5 border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E] text-[#374151] font-semibold gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isModeloRede ? 'Tratar / Responder' : 'Responder'}</span>
                    </Button>
                  </div>
                </div>

                {/* Linha 2: Descrição da Demanda */}
                {demanda.descricao && (
                  <p className="text-xs text-[#4B5563] leading-relaxed bg-[#F9FAFB] p-3 rounded-xl border border-[#F3F4F6]">
                    {demanda.descricao}
                  </p>
                )}

                {/* Linha 3: Evidência Fotográfica Enviada pela Loja */}
                {fotoUrl && (
                  <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-[#D1D5DB] flex items-center justify-center">
                        <img src={fotoUrl} alt="Evidência" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1F2937] truncate">
                          Evidência Fotográfica da Loja
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate">
                          Anexada para comprovação pelo solicitante
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleVerFoto(
                          fotoUrl,
                          demanda.titulo,
                          `Evidência fotográfica • Solicitante: ${demanda.solicitante_nome || 'Loja'}`,
                        )
                      }
                      className="text-xs h-8 gap-1 border-[#D1D5DB] text-[#0F766E] hover:bg-teal-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Foto</span>
                    </Button>
                  </div>
                )}

                {/* Linha 4: Resposta / Tratamento da Área Responsável */}
                {demanda.resposta_area && (
                  <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F766E] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Parecer da Área Responsável</span>
                      </span>
                      {demanda.respondido_por && (
                        <span className="text-[11px] text-[#4B5563]">
                          Por: <strong>{demanda.respondido_por}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#1F2937] leading-relaxed">
                      {demanda.resposta_area}
                    </p>

                    {fotoRespostaUrl && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#0F766E] font-medium">
                          Comprovante/protocolo digital anexado
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleVerFoto(
                              fotoRespostaUrl,
                              `Comprovante: ${demanda.titulo}`,
                              `Resposta de ${demanda.respondido_por || 'Área Central'}`,
                            )
                          }
                          className="text-xs text-[#0F766E] font-bold hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Anexo</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Linha 5: Metadados Rodapé */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F3F4F6] text-[11px] text-[#6B7280]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      Solicitante:{' '}
                      <strong className="text-[#374151]">
                        {demanda.solicitante_nome || 'Gerente de Loja'}
                      </strong>
                    </span>
                    {demanda.responsavel && (
                      <span>
                        Atribuído a:{' '}
                        <strong className="text-[#374151]">{demanda.responsavel}</strong>
                      </span>
                    )}
                    {demanda.expand?.loja?.nome && (
                      <span>
                        Loja: <strong className="text-[#374151]">{demanda.expand.loja.nome}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {demanda.prazo && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#9CA3AF]" />
                        <span>Prazo: {demanda.prazo}</span>
                      </span>
                    )}
                    <span>{new Date(demanda.created).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Nova Demanda */}
      <NovaDemandaAdmRhModal
        open={novaDemandaOpen}
        onOpenChange={setNovaDemandaOpen}
        subAreaDefault={subAreaAtiva}
        redeId={clienteIdEfetivo}
        lojaId={lojaIdEfetivo}
        userName={user?.name || user?.email}
        userId={user?.id}
        onSucesso={() => {
          carregarDemandas()
        }}
      />

      {/* Modal Tratar Demanda */}
      <TratarDemandaAdmRhModal
        open={tratarModal.open}
        onOpenChange={(open) => setTratarModal((prev) => ({ ...prev, open }))}
        demanda={tratarModal.demanda}
        userName={user?.name || user?.email}
        onSucesso={() => {
          carregarDemandas()
        }}
      />

      {/* Visualizador de Foto com Zoom */}
      <FotoVisualizadorModal
        isOpen={fotoVisualizador.open}
        fotoUrl={fotoVisualizador.url}
        titulo={fotoVisualizador.title}
        subtitulo={fotoVisualizador.subtitulo}
        onClose={() => setFotoVisualizador({ open: false, url: '', title: '' })}
      />

      {/* Modal Seletor de Segmento */}
      <SeletorSegmentoModal
        open={seletorSegmentoOpen}
        onOpenChange={setSeletorSegmentoOpen}
        onSuccess={() => {
          setSeletorSegmentoOpen(false)
          carregarDemandas()
        }}
      />
    </div>
  )
}
