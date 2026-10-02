import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Users,
  Target,
  Layers,
  ChevronRight,
  Eye,
  Lock,
  Calendar,
  Check,
} from 'lucide-react'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useI18n } from '@/lib/i18n/context'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import { funnelService } from '@/services/funnelService'

// Exemplos fictícios para demonstrar o ciclo completo de 4 pilares:
// 1. Identificar (demanda e ponto de atenção)
// 2. Priorizar (classificação de prioridade e urgência)
// 3. Direcionar (responsável, prazo e plano de ação)
// 4. Acompanhar (status, andamento e conclusão com evidência)

interface DemandaExemplo {
  id: string
  titulo: string
  setor: string
  origem: string
  tipo: 'Ponto de Atenção' | 'Oportunidade' | 'Ruptura' | 'Validade'
  prioridade: 'Alta' | 'Média' | 'Crítica'
  impacto: string
  responsavel: string
  cargo: string
  prazo: string
  status: 'Concluído' | 'Em Andamento' | 'Atrasado' | 'Pendente'
  progresso: number
  acaoPlanejada: string
  evidencia: string
}

const DEMANDAS_EXEMPLO: DemandaExemplo[] = [
  {
    id: 'DEM-01',
    titulo: 'Variação de temperatura na câmara fria de laticínios',
    setor: 'Frios & Laticínios',
    origem: 'Ronda matinal / Meu Dia',
    tipo: 'Ponto de Atenção',
    prioridade: 'Crítica',
    impacto: 'Risco de descarte de mercadoria e não conformidade sanitária',
    responsavel: 'Carlos Eduardo',
    cargo: 'Encarregado de Perecíveis',
    prazo: 'Hoje até 10:30',
    status: 'Concluído',
    progresso: 100,
    acaoPlanejada:
      'Regulagem da condensadora, aferição manual do termômetro e foto da temperatura estabilizada a 4°C.',
    evidencia: 'Foto anexada às 10:14 • Aprovado pelo Gerente',
  },
  {
    id: 'DEM-02',
    titulo: 'Ruptura de estoque em itens de alto giro de mercearia (óleo e café)',
    setor: 'Mercearia de Alto Giro',
    origem: 'Auditoria de abertura',
    tipo: 'Ruptura',
    prioridade: 'Alta',
    impacto: 'Perda direta de vendas no primeiro horário de pico',
    responsavel: 'Mariana Santos',
    cargo: 'Líder de Mercearia',
    prazo: 'Hoje até 12:00',
    status: 'Em Andamento',
    progresso: 75,
    acaoPlanejada: 'Puxada imediata do depósito aéreo e reposição nas gôndolas frontais.',
    evidencia: '3 paletes repostos • Restam 2 frentes a finalizar',
  },
  {
    id: 'DEM-03',
    titulo: 'Lote de iogurtes com vencimento em 4 dias sem etiqueta de oferta',
    setor: 'Laticínios',
    origem: 'Cronograma de Validade × Calendário',
    tipo: 'Validade',
    prioridade: 'Alta',
    impacto: 'Risco de perda financeira de R$ 1.840,00 se não comercializado',
    responsavel: 'Roberto Silva',
    cargo: 'Operador de Loja',
    prazo: 'Hoje até 14:00',
    status: 'Em Andamento',
    progresso: 50,
    acaoPlanejada:
      'Aplicação de precificação promocional de giro rápido e transferência para ponta de gôndola.',
    evidencia: 'Etiquetas impressas • Montagem do ponto extra em execução',
  },
  {
    id: 'DEM-04',
    titulo: 'Ausência de precificação visível na categoria de higiene bucal',
    setor: 'Higiene & Limpeza',
    origem: 'Conferência de cartazeamento',
    tipo: 'Oportunidade',
    prioridade: 'Média',
    impacto: 'Dúvida do cliente no corredor e desistência da compra no caixa',
    responsavel: 'Juliana Costa',
    cargo: 'Cartazista / Frente de Loja',
    prazo: 'Amanhã 09:00',
    status: 'Pendente',
    progresso: 20,
    acaoPlanejada:
      'Impressão de etiquetas de gôndola com código legível e colocação em réguas plásticas.',
    evidencia: 'Aguardando validação do lote pelo financeiro',
  },
]

export default function PreviewPlataforma() {
  const { t, locale } = useI18n()
  const isEn = locale === 'en'

  const [filtroPilar, setFiltroPilar] = useState<
    'todos' | 'identificar' | 'priorizar' | 'direcionar' | 'acompanhar'
  >('todos')
  const [demandaSelecionada, setDemandaSelecionada] = useState<DemandaExemplo>(DEMANDAS_EXEMPLO[0])
  const [modalDemoOpen, setModalDemoOpen] = useState(false)

  // Registra evento de funil de visita à prévia
  useEffect(() => {
    try {
      funnelService.registrarEvento({
        evento: 'visitou_previa',
        detalhes: { pilar_inicial: 'todos', pagina: '/previa' },
      })
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2937] flex flex-col font-sans">
      {/* 1. BANNER FIXO OBRIGATÓRIO DE AMBIENTE DEMONSTRATIVO */}
      <div className="w-full bg-[#111827] text-white border-b border-[#374151] px-4 py-3 shadow-sm">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="leading-snug">
              <span className="font-bold text-amber-300 uppercase tracking-wide mr-1.5">
                {isEn ? 'Demonstration Environment —' : 'Ambiente demonstrativo —'}
              </span>
              <span className="text-gray-300">
                {isEn
                  ? 'This demo uses fictional information and is intended solely to present VivaVarejo features. Access does not authorize the reproduction of the platform, its materials, or protected components.'
                  : 'Esta demonstração utiliza informações fictícias e destina-se exclusivamente à apresentação das funcionalidades da VivaVarejo. O acesso não autoriza a reprodução da plataforma, seus materiais ou componentes protegidos.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold text-[11px]">
              <Eye className="w-3 h-3" />
              {isEn ? 'Read-only preview' : 'Modo somente-leitura'}
            </span>
            <Link
              to="/teste"
              className="px-3 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold rounded text-xs transition-colors shadow-2xs"
            >
              {isEn ? 'Start 14-day trial' : 'Testar por 14 dias'}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. HEADER DA PRÉVIA */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/bem-vindo" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight block">
                {t.common.appName}
              </span>
              <span className="text-[10px] text-[#0F766E] font-semibold tracking-wide uppercase">
                {isEn ? 'Interactive Preview' : 'Prévia Interativa'}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
            <LanguageSelector />
            <Link
              to="/teste"
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEn ? 'TRY FOR FREE' : 'TESTAR GRATUITAMENTE'}</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* 3. CONTEÚDO PRINCIPAL: O CICLO COMPLETO DOS 4 PILARES */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Apresentação da Jornada do Ciclo */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-[#0F766E]">
              <Layers className="w-3.5 h-3.5" />
              <span>{isEn ? 'Methodology in 4 Pillars' : 'Metodologia em 4 Pilares'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
              {isEn
                ? 'Experience the complete cycle: Identify, Prioritize, Direct, and Track.'
                : 'Experimente o ciclo completo: Identificar, Priorizar, Direcionar e Acompanhar.'}
            </h1>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              {isEn
                ? 'Navigate through real daily retail operational examples. Understand how a problem spotted in store is immediately prioritized, delegated to a store leader with a strict deadline, and tracked until photo evidence is approved.'
                : 'Navegue por exemplos reais de uma operação varejista. Entenda como uma demanda identificada no chão de loja é imediatamente classificada, delegada a um responsável com prazo e acompanhada até a comprovação com foto.'}
            </p>
          </div>

          {/* Os 4 Cards do Ciclo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
            {/* Pilar 1: Identificar */}
            <div
              onClick={() => setFiltroPilar('identificar')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                filtroPilar === 'identificar'
                  ? 'border-[#0F766E] bg-teal-50/50 shadow-2xs'
                  : 'border-[#E5E7EB] bg-[#F7F7F5] hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                  01 • {isEn ? 'Identify' : 'Identificar'}
                </span>
                <Search className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-xs font-bold text-[#1F2937] mb-1">
                {isEn ? 'Spot demands & alerts' : 'Demandas & Pontos de Atenção'}
              </h3>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                {isEn
                  ? 'Register operational issues, temperature alerts, expired batches, or missed routines with photos.'
                  : 'Registro de quebras, riscos de validade, variações térmicas e oportunidades no Meu Dia.'}
              </p>
            </div>

            {/* Pilar 2: Priorizar */}
            <div
              onClick={() => setFiltroPilar('priorizar')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                filtroPilar === 'priorizar'
                  ? 'border-[#0F766E] bg-teal-50/50 shadow-2xs'
                  : 'border-[#E5E7EB] bg-[#F7F7F5] hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                  02 • {isEn ? 'Prioritize' : 'Priorizar'}
                </span>
                <Target className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-xs font-bold text-[#1F2937] mb-1">
                {isEn ? 'Filter by impact' : 'Classificação de Prioridades'}
              </h3>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                {isEn
                  ? 'Separate what must be resolved right now (Faça agora) from later routines (Depois).'
                  : 'Separação imediata do que é crítico e impacta faturamento do que pode esperar.'}
              </p>
            </div>

            {/* Pilar 3: Direcionar */}
            <div
              onClick={() => setFiltroPilar('direcionar')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                filtroPilar === 'direcionar'
                  ? 'border-[#0F766E] bg-teal-50/50 shadow-2xs'
                  : 'border-[#E5E7EB] bg-[#F7F7F5] hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                  03 • {isEn ? 'Direct' : 'Direcionar'}
                </span>
                <Users className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-xs font-bold text-[#1F2937] mb-1">
                {isEn ? 'Owner & clear deadline' : 'Responsável, Prazo & Ação'}
              </h3>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                {isEn
                  ? 'Each task gets a single assigned store leader, limit time, and exact expected action.'
                  : 'Atribuição nominal a um executor na loja com limite de horário e instrução clara.'}
              </p>
            </div>

            {/* Pilar 4: Acompanhar */}
            <div
              onClick={() => setFiltroPilar('acompanhar')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                filtroPilar === 'acompanhar'
                  ? 'border-[#0F766E] bg-teal-50/50 shadow-2xs'
                  : 'border-[#E5E7EB] bg-[#F7F7F5] hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                  04 • {isEn ? 'Track' : 'Acompanhar'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-xs font-bold text-[#1F2937] mb-1">
                {isEn ? 'Status & photo proof' : 'Status, Andamento & Conclusão'}
              </h3>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                {isEn
                  ? 'Real-time visibility of progress, delay alerts, and photo evidence validation.'
                  : 'Painel visual de taxa de conclusão, atrasos do turno e validação com foto da evidência.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. VISUALIZADOR INTERATIVO COM DADOS FICTÍCIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lista de Demandas Exemplares (5 colunas) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937]">
                  {isEn ? 'Fictional Retail Scenarios' : 'Cenários Varejistas de Exemplo'}
                </h2>
                <span className="text-[11px] text-[#6B7280]">
                  {isEn
                    ? 'Click an item to see its complete cycle'
                    : 'Toque em um item para inspecionar'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-teal-50 text-[#0F766E] px-2 py-0.5 rounded border border-teal-200">
                {DEMANDAS_EXEMPLO.length} {isEn ? 'cases' : 'casos'}
              </span>
            </div>

            <div className="space-y-2.5">
              {DEMANDAS_EXEMPLO.map((item) => {
                const isSelected = item.id === demandaSelecionada.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setDemandaSelecionada(item)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0F766E] bg-teal-50/40 shadow-xs'
                        : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#6B7280]">
                        {item.id} • {item.setor}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.prioridade === 'Crítica'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.prioridade === 'Alta'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.prioridade}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#1F2937] leading-snug line-clamp-2 mb-2">
                      {item.titulo}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 border-t border-gray-100">
                      <span className="truncate max-w-[140px] font-medium text-[#374151]">
                        👤 {item.responsavel}
                      </span>
                      <span
                        className={`font-semibold ${
                          item.status === 'Concluído'
                            ? 'text-emerald-700'
                            : item.status === 'Em Andamento'
                              ? 'text-teal-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {item.status} ({item.progresso}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Aviso de restrição na prévia */}
            <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-[11px] text-[#6B7280] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#374151]">
                <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>{isEn ? 'Preview Restrictions:' : 'Restrições desta prévia:'}</span>
              </div>
              <p className="leading-tight text-[11px]">
                {isEn
                  ? 'Editing, exporting, system configurations, and real customer data are strictly locked. To manage your real team, start the 14-day evaluation.'
                  : 'Edição, exclusão, exportação, configurações e dados de clientes reais estão bloqueados. Para operar com sua equipe, inicie o teste de 14 dias.'}
              </p>
            </div>
          </div>

          {/* Detalhe do Ciclo Completo da Demanda Selecionada (7 colunas) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {demandaSelecionada.id} • {demandaSelecionada.tipo}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#1F2937] mt-1.5 leading-snug">
                  {demandaSelecionada.titulo}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6B7280] block">
                  {isEn ? 'Current Status' : 'Status Atual'}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-block">
                  ✓ {demandaSelecionada.status}
                </span>
              </div>
            </div>

            {/* Os 4 Passos Aplicados a este Caso Real */}
            <div className="space-y-3">
              {/* Passo 1: Identificar */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#F7F7F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      {isEn ? '1. Identify (Origin & Alert)' : '1. Identificar (Origem & Alerta)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] font-mono">
                    {demandaSelecionada.origem}
                  </span>
                </div>
                <p className="text-xs text-[#374151] pl-7 leading-relaxed">
                  <strong className="text-[#1F2937]">
                    {isEn ? 'Observed issue: ' : 'Ponto identificado: '}
                  </strong>
                  {demandaSelecionada.impacto}
                </p>
              </div>

              {/* Passo 2: Priorizar */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#F7F7F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      {isEn ? '2. Prioritize (Impact & Turn)' : '2. Priorizar (Impacto & Turno)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    {isEn ? 'Priority: ' : 'Prioridade: '} {demandaSelecionada.prioridade}
                  </span>
                </div>
                <p className="text-xs text-[#374151] pl-7 leading-relaxed">
                  {isEn
                    ? 'Classified in the Shift Engine as Faça Agora (Do Now) due to immediate financial risk.'
                    : 'Classificada no Motor de Turnos como prioridade de ação imediata para evitar prejuízo.'}
                </p>
              </div>

              {/* Passo 3: Direcionar */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#F7F7F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      {isEn
                        ? '3. Direct (Owner, Deadline & Action)'
                        : '3. Direcionar (Responsável, Prazo & Ação)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0F766E] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {demandaSelecionada.prazo}
                  </span>
                </div>
                <div className="pl-7 space-y-1 text-xs text-[#374151]">
                  <div>
                    <span className="font-semibold text-[#1F2937]">
                      {demandaSelecionada.responsavel}
                    </span>{' '}
                    • {demandaSelecionada.cargo} ({demandaSelecionada.setor})
                  </div>
                  <div className="text-[#4B5563] bg-white p-2.5 rounded-lg border border-gray-200 text-[11px]">
                    <strong>{isEn ? 'Planned Action: ' : 'Ação Planejada: '}</strong>
                    {demandaSelecionada.acaoPlanejada}
                  </div>
                </div>
              </div>

              {/* Passo 4: Acompanhar */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#F7F7F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      {isEn
                        ? '4. Track (Progress & Evidence)'
                        : '4. Acompanhar (Andamento & Evidência)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {demandaSelecionada.progresso}% {isEn ? 'completed' : 'concluído'}
                  </span>
                </div>
                <div className="pl-7 space-y-2 text-xs">
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F766E] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${demandaSelecionada.progresso}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#4B5563] flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{demandaSelecionada.evidencia}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de ação desabilitada com segurança na prévia */}
            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {isEn
                    ? 'Actions locked: visitors cannot mutate demo data.'
                    : 'Ações de gravação restritas: visitantes navegam apenas em modo leitura.'}
                </span>
              </div>

              <Link
                to="/teste"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>{isEn ? 'Try with your own data' : 'Experimentar com dados reais'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. CHAMADA FINAL AO TÉRMINO DA PRÉVIA (Texto verbatim do usuário) */}
        <div className="bg-gradient-to-br from-white via-white to-teal-50/40 rounded-2xl border-2 border-[#0F766E]/30 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-[#0F766E] mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
              {isEn
                ? 'Liked what you saw? Try VivaVarejo with your team for 14 days.'
                : 'Gostou do que viu? Experimente a VivaVarejo com sua equipe por 14 dias.'}
            </h2>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              {isEn
                ? 'No credit card required. Immediate access. Up to 5 team members to organize priorities and track retail routines.'
                : 'Sem cartão de crédito. Acesso imediato após o cadastro. Até 5 integrantes na sua equipe para organizar prioridades e acompanhar a execução.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              to="/teste"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm tracking-wide uppercase rounded-xl shadow-xs transition-all hover:scale-[1.01] inline-flex items-center justify-center gap-2"
            >
              <span>{isEn ? 'TRY FOR FREE' : 'TESTAR GRATUITAMENTE'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-2 text-xs text-[#6B7280] space-y-1">
            <p>
              {isEn
                ? 'Prefer to explore the platform with our team?'
                : 'Prefere conhecer a plataforma com nossa equipe?'}
            </p>
            <button
              type="button"
              onClick={() => setModalDemoOpen(true)}
              className="font-bold text-[#0F766E] hover:underline uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isEn ? 'REQUEST A DEMO' : 'SOLICITAR DEMONSTRAÇÃO'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Agendamento de Demonstração */}
      <FalarEspecialistaModal
        open={modalDemoOpen}
        onOpenChange={setModalDemoOpen}
        assuntoContexto="Demonstração da Plataforma (origem Prévia)"
      />

      {/* Rodapé discreto */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-6 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <span>© {new Date().getFullYear()} VivaVarejo. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-[#0F766E] transition-colors">
              {t.landing.footerTermsOfUse}
            </Link>
            <span>•</span>
            <Link to="/privacidade" className="hover:text-[#0F766E] transition-colors">
              {t.landing.footerPrivacyPolicy}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
