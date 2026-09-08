import React, { useState } from 'react'
import {
  Check,
  Minus,
  Sparkles,
  Printer,
  Share2,
  Lock,
  Eye,
  FileText,
  MessageCircle,
  Copy,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
  ShieldAlert,
  Users,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Workflow,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export type VersaoMaterial = 'cliente' | 'interna'

interface ComparativoItem {
  criterio: string
  subtexto: string
  vivavarejo: {
    status: boolean
    detalhe: string
    notaInterna?: string // Nota visível apenas na versão interna
  }
  tradicionais: {
    status: boolean | 'parcial'
    detalhe: string
    notaInterna?: string // Nota visível apenas na versão interna
  }
}

interface SolucaoPilar {
  id: string
  titulo: string
  subtitulo: string
  icone: React.ComponentType<{ className?: string }>
  beneficioPrincipal: string
  pontosChave: string[]
  dicaVendaInterna?: string
}

const COMPARATIVO_ITEMS: ComparativoItem[] = [
  {
    criterio: 'Posicionamento: Camada de Execução Operacional',
    subtexto: 'Transforma dados do ERP/BI em prioridades, rotinas e cobrança ativa em loja',
    vivavarejo: {
      status: true,
      detalhe:
        'A ponte entre informação e execução: importa planilhas/CSV de qualquer ERP e cria rotinas com responsável, horário e cobrança imediata.',
      notaInterna:
        'Argumento central: o lojista já tem ERP que diz "o que aconteceu ontem"; o VivaVarejo diz "o que precisa ser feito nos próximos 15 minutos".',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Apenas formulários e checklists isolados que não conectam indicadores de retaguarda à rotina de quem está no chão.',
      notaInterna: 'Concorrentes vendem auditoria estática sem ritmo diário de corte de loja.',
    },
  },
  {
    criterio: 'Prevenção de Perdas em Todo o Varejo (Não Apenas Supermercados)',
    subtexto:
      'Quebras, vencimentos, inventário rotativo e criticidade por setor para qualquer segmento',
    vivavarejo: {
      status: true,
      detalhe:
        'Gestão de quebras por motivo e valor estimado, inventários rotativos setorizados e acuracidade em tempo real para supermercados, farmácias, moda, açougues, pet shops e restaurantes.',
      notaInterna:
        'Enfatize: não somos apenas alimentício. Em moda evita perdas de ponta de estoque e avarias; em farmácia atende controle estrito de lotes; em pet shop reduz vencimento de rações.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Foco restrito a checklists genéricos de loja ou módulos pesados de auditoria externa sem rotina preventiva diária.',
      notaInterna:
        'Geralmente tratam perdas apenas no fechamento contábil do mês, quando o prejuízo já ocorreu.',
    },
  },
  {
    criterio: 'Validade × Calendário Nativa com Rodízio de 4 Semanas & Workflow',
    subtexto: 'Cronograma distribuído, pré-alerta e validação com status e devolução formal',
    vivavarejo: {
      status: true,
      detalhe:
        'Rodízio mensal automático (semanas 1 a 4), pré-alertas sonoros/WhatsApp, workflow completo: Pendente → Aguardando Validação → Aprovada ou Devolvida com motivo.',
      notaInterna:
        'Diferencial exclusivo: o gerente não precisa auditar 100% dos itens todo dia; o sistema fatia a loja em 4 semanas e avisa se a auditoria foi aprovada ou devolvida.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Inexistente no formato de calendário rotativo de 4 semanas. Apenas listas estáticas com prazos manuais.',
      notaInterna:
        'Sistemas genéricos exigem recadastramento manual recorrente sem rodízio inteligente.',
    },
  },
  {
    criterio: 'Chamados Instantâneos Integrando Áreas da Empresa ao Motor de Prioridade',
    subtexto:
      'Compras, Abastecimento, RH, Marketing, Logística, Financeiro, Manutenção e Prevenção',
    vivavarejo: {
      status: true,
      detalhe:
        'Demandas das áreas corporativas (ex.: "Caminhão atrasado", "Manutenção de câmara", "Troca de cartazete") entram automaticamente no Motor de Prioridade da Agenda da loja com alerta WhatsApp.',
      notaInterna:
        'Elimina o grupo de WhatsApp bagunçado onde pedidos se perdem: toda área abre chamado rápido com prazo, prioridade (Baixa, Média, Alta) e responsável direto.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Sistemas de checklist desconectados de helpdesks corporativos, forçando equipes a usarem 3 softwares diferentes.',
    },
  },
  {
    criterio: 'Controle Completo de Promotores & Fornecedores Incluso',
    subtexto: 'Agenda de visitas em loja, tarefas do promotor e acompanhamento de acordos',
    vivavarejo: {
      status: true,
      detalhe:
        'Cadastro de marcas e fornecedores, promotores vinculados, agenda semanal de visitas em loja, checklist de tarefas do promotor e conferência de execução sem custo adicional.',
      notaInterna:
        'Módulos de trade marketing na concorrência custam de R$ 300 a R$ 800 extras/mês por loja. No VivaVarejo é parte nativa da plataforma.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Cobrado como módulo à parte de Trade Marketing ou exige aplicativo externo secundário.',
    },
  },
  {
    criterio: 'Escalonamento Hierárquico no WhatsApp por Nível de Cargo',
    subtexto: 'Cadeia de alertas quando a rotina atrasa ou sai da conformidade',
    vivavarejo: {
      status: true,
      detalhe:
        'Cadeia escalonada: Executor direto → Chefe imediato / Encarregado → Gerente de Operações (GO) → Diretor Regional com mensagens contextualizadas com 1 toque.',
      notaInterna:
        'Dica de fechamento: equipe operacional não abre e-mail corporativo. O WhatsApp garante índice de leitura acima de 98% e resposta em minutos.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Apenas notificações frias por e-mail ou push genérico ignorados pelo operador de piso.',
    },
  },
  {
    criterio: 'Workflow Operacional com Sinalização Clara de Pendências',
    subtexto: 'Acompanhamento de rotinas e tarefas em tempo real sem ambiguidade',
    vivavarejo: {
      status: true,
      detalhe:
        'Status visual explícito: Atrasada, Aguardando Validação, Devolvida com apontamento de correção e Aprovada com registro do validador e data/hora.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Mera caixa de seleção (concluído/não concluído) sem validação gerencial estruturada.',
    },
  },
  {
    criterio: 'Planos de Ação 5W2H Gerados em 1 Toque a Partir do Desvio',
    subtexto: 'O que, quem, quando, onde, por que e como resolver qualquer problema identificado',
    vivavarejo: {
      status: true,
      detalhe:
        'Qualquer rotina atrasada, avaria ou ruptura vira plano corretivo 5W2H com prazo, responsável e prioridade diretamente na Agenda da loja.',
      notaInterna:
        'Mostre no celular: uma inconformidade nunca fica "no ar". Ela vira um compromisso rastreável com cobrança hierárquica.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Módulos de planos de ação complexos, lentos e burocráticos que líderes de loja abandonam.',
    },
  },
  {
    criterio: 'Auditoria Visual com Fotos & Mídias de Comprovação Instantâneas',
    subtexto: 'Registro fotográfico com horário, zoom e visualizador rápido na web e mobile',
    vivavarejo: {
      status: true,
      detalhe:
        'Fotos obrigatórias ou opcionais capturadas na câmera do celular com carimbo de tempo, visualizador em modal e histórico por item.',
    },
    tradicionais: {
      status: true,
      detalhe: 'Permite foto, mas fluxos pesados e upload lento atrasam o ritmo de piso de loja.',
    },
  },
  {
    criterio: 'Visão Única: Dashboard Executivo + Relatório Loja a Loja Consolidado',
    subtexto: 'Acompanhamento comparativo em tela única por Hoje / Semana / Mês com exportação CSV',
    vivavarejo: {
      status: true,
      detalhe:
        'Visão unificada: % de conclusão, % de aprovação, ranking comparativo entre lojas da rede, deltas de evolução e exportação consolidada em CSV com 1 clique.',
      notaInterna:
        'Diretoria adora: em 10 segundos o Diretor Geral sabe qual loja está no topo e qual encarregado está com rotinas atrasadas.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Dashboards pesados e fragmentados em relatórios isolados com filtros lentos que exigem treinamento.',
    },
  },
  {
    criterio: 'Modelos Especializados por Segmento do Varejo & Importação Rápida',
    subtexto: 'Implantação no mesmo dia com catálogo pronto e inteligência de rotinas',
    vivavarejo: {
      status: true,
      detalhe:
        'Biblioteca de modelos operacionais para Supermercados, Farmácias, Lojas de Moda, Açougues, Pet Shops e Restaurantes. Aplicação com 1 clique ou importação CSV/ERP.',
      notaInterna:
        'Quebra a objeção clássica de falta de tempo: a loja não começa do zero, ela aplica o modelo do setor dela e sai rodando.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Consultorias caras e demoradas de semanas apenas para cadastrar perguntas e formulários.',
      notaInterna: 'Concorrentes costumam cobrar taxa de implantação de R$ 2.000 a R$ 5.000.',
    },
  },
  {
    criterio: 'PWA Nativo Instalável no Celular Sem Loja de Aplicativos',
    subtexto: 'Acesso rápido para toda a equipe, leve, atualizações transparentes',
    vivavarejo: {
      status: true,
      detalhe:
        'Instalação em 1 toque no iPhone (iOS) e Android sem necessidade de baixar centenas de megas em lojas, com navegação rápida pensada para operação no piso.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Aplicativos pesados que travam celulares mais simples dos operadores ou sites não responsivos.',
    },
  },
]

const SOLUCOES_PLATAFORMA: SolucaoPilar[] = [
  {
    id: 'perdas',
    titulo: '1. Prevenção de Perdas em Todo o Varejo',
    subtitulo: 'Controle de quebras, validades, inventário rotativo e criticidade por setor',
    icone: ShieldAlert,
    beneficioPrincipal:
      'Solução universal para qualquer segmento varejista: supermercados, hortifrutis, farmácias, confecção/moda, açougues, pet shops e restaurantes.',
    pontosChave: [
      'Apontamento de perdas com motivo (vencimento, avaria, roubo, erro de pedido), item, setor, quantidade e valor financeiro estimado.',
      'Validade × Calendário em rodízio inteligente de 4 semanas, distribuindo o esforço da equipe sem sobrecarregar nenhum dia.',
      'Inventários setorizados (rotativos ou gerais) com cálculo automático de acuracidade percentual e divergências.',
      'Registro fotográfico imediato das quebras e inconformidades como prova e rastreabilidade da loja.',
    ],
    dicaVendaInterna:
      'Lembre o cliente: em supermercados a perda atinge de 1% a 3% do faturamento; em farmácias, itens vencidos causam multas sanitárias graves; em pet e moda, avarias e desvios de estoque corroem a margem líquida.',
  },
  {
    id: 'promotores',
    titulo: '2. Controle de Promotores & Fornecedores',
    subtitulo: 'Gestão da presença externa, tarefas em gôndola e cumprimento de acordos',
    icone: Users,
    beneficioPrincipal:
      'Visibilidade total sobre quem entra na sua loja, com tarefas claras e garantia do padrão combinado com fornecedores.',
    pontosChave: [
      'Agenda de visitas em loja com data, horário previsto, status (agendada, realizada, atrasada) e promotor responsável.',
      'Checklist de rotinas do promotor: reposição, precificação, conferência de gôndola e aplicação de materiais promocionais.',
      'Acompanhamento de demandas de fornecedores com histórico das visitas concluídas e observações registradas.',
      'Módulo 100% nativo da plataforma, sem necessidade de contratar ferramentas caras de trade marketing à parte.',
    ],
    dicaVendaInterna:
      'Geralmente o varejista não sabe se o promotor do fornecedor foi à loja ou quanto tempo ficou. Com o VivaVarejo, a presença vira indicador de conformidade do acordo comercial.',
  },
  {
    id: 'integracao_areas',
    titulo: '3. Integração Fácil com Áreas da Empresa & Chamados Instantâneos',
    subtitulo:
      'Compras, Abastecimento, RH, Marketing, Logística, Financeiro e Manutenção conectados',
    icone: Layers,
    beneficioPrincipal:
      'Fim da bagunça de grupos de WhatsApp: toda área demandante abre chamados rápidos que entram direto na fila de execução da loja.',
    pontosChave: [
      'Chamados instantâneos por área demandante: Compras, Abastecimento, RH, Marketing, Logística (ex.: "Caminhão atrasado"), Financeiro, Operações, Prevenção de Perdas e Manutenção.',
      'Integração nativa com o Motor de Prioridade da Agenda da loja, ordenando tarefas por criticidade e horário de corte.',
      'Alerta imediato e escalonado via WhatsApp com mensagem formatada para o encarregado e gestor.',
      'Prazos e níveis de prioridade (Baixa, Média, Alta) com acompanhamento em tempo real até o fechamento.',
    ],
    dicaVendaInterna:
      'Exemplo real de pitch: quando a Logística avisa "caminhão atrasado", isso vira prioridade na Agenda para reposicionar a equipe de recebimento antes de gerar gargalo na doca.',
  },
  {
    id: 'erp_execucao',
    titulo: '4. Da Informação à Execução: A Camada Entre ERP/BI e a Loja',
    subtitulo: 'Transforma relatórios e planilhas em rotinas, prioridades e ação diária',
    icone: FileSpreadsheet,
    beneficioPrincipal:
      'O ERP e o BI mostram o que aconteceu no passado; o VivaVarejo garante a execução no presente com ritmo de loja.',
    pontosChave: [
      'Importação inteligente de planilhas Excel (.xlsx) e colagem direta de dados CSV exportados do seu ERP ou BI.',
      'Mapeamento automático de rotina, setor, responsável, horário limite, ferramentas necessárias e tipo de validação.',
      'Mecanismo de desduplicação inteligente para atualizar operações sem criar rotinas repetidas.',
      'Capacidade de salvar importações como novos modelos reutilizáveis para rápida replicação entre lojas da rede.',
    ],
    dicaVendaInterna:
      'O maior gap do varejo é que a diretoria tem dados no ERP, mas a loja não sabe o que priorizar às 09:00 ou 15:00. O VivaVarejo é exatamente o motor que fecha esse abismo.',
  },
  {
    id: 'visao_unica',
    titulo: '5. Visão Única: Relatórios de Gestão + Dashboard Loja a Loja',
    subtitulo: 'Painel executivo com Hoje, Semana e Mês, ranking comparativo e exportação CSV',
    icone: BarChart3,
    beneficioPrincipal:
      'Tudo em uma só tela: saiba instantaneamente quem cumpre o padrão, quem atrasa e qual loja necessita de suporte imediato.',
    pontosChave: [
      'Filtros por período pré-configurados: Hoje, Esta Semana e Este Mês com cálculo de deltas percentuais.',
      'Indicadores-chave consolidados: % de rotinas concluídas, % de validação/aprovação gerencial e taxa de pontualidade.',
      'Ranking comparativo entre lojas da rede, estimulando a disciplina operacional e identificando gargalos regionais.',
      'Exportação consolidada em CSV com 1 clique para integração com apresentações de diretoria e auditorias.',
    ],
    dicaVendaInterna:
      'Em reuniões de resultados semanais, o diretor não precisa abrir 10 telas. Basta a tela de Relatório Loja a Loja para ver o mapa completo de execução da rede.',
  },
  {
    id: 'workflow_e_mais',
    titulo: '6. E Tem Muito Mais: O Sistema Operacional Completo da Operação',
    subtitulo: 'Workflow estruturado, planos 5W2H, provas fotográficas, cadeia de WhatsApp e PWA',
    icone: Workflow,
    beneficioPrincipal:
      'Cada recurso foi construído pensando nas dores reais da liderança de chão de loja, não como um checklist genérico de prateleira.',
    pontosChave: [
      'Workflow com pendências e sinalização nítida: Atrasada, Aguardando Validação, Devolvida com apontamento de correção e Aprovada.',
      'Planos de ação 5W2H gerados em 1 toque para tratar causa raiz de inconformidades, com responsável e prazo definido.',
      'Auditoria visual com fotos obrigatórias/opcionais, histórico com carimbo de tempo e zoom de conferência.',
      'Validade × Calendário com avisos sonoros e lembretes antes do vencimento do horário de corte.',
      'Hierarquia com cadeia de alertas WhatsApp: Responsável direto → Chefe imediato → Gerente de Operações → Regional.',
      'Modelos prontos por segmento de varejo (Supermercados, Farmácias, Lojas de Moda, Açougues, Pet Shops, etc.).',
      'PWA instalável no celular em segundos, leve, rápido e sem complicações de lojas de aplicativos.',
    ],
    dicaVendaInterna:
      'Argumento forte: "Não somos mais um aplicativo de checklist que seus operadores vão desinstalar semana que vem; somos o sistema operacional da rotina diária da sua loja".',
  },
]

export function MaterialVendaAba() {
  const { toast } = useToast()
  const [versao, setVersao] = useState<VersaoMaterial>('cliente')
  const [copiado, setCopiado] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)

  const isCliente = versao === 'cliente'

  // Impressão / Salvar em PDF (otimizado para Mobile iOS Safari e Desktop)
  const handlePrint = () => {
    try {
      setImprimindo(true)
      setTimeout(() => {
        window.print()
        setImprimindo(false)
      }, 100)
    } catch (err) {
      console.error('Falha ao acionar window.print():', err)
      setImprimindo(false)
      toast({
        title: 'Não foi possível abrir o diálogo de impressão',
        description: 'Tente usar o botão de Compartilhar Link ou Enviar pelo WhatsApp.',
        variant: 'destructive',
      })
    }
  }

  // Obter link direto para envio
  const getShareUrl = () => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }

  const getShareText = () => {
    if (isCliente) {
      return (
        'VivaVarejo — Sistema Operacional de Loja & Prevenção de Perdas:\n\n' +
        'Conheça por que o VivaVarejo é a camada de execução entre o ERP e o chão de loja para supermercados, farmácias, moda, açougues e todo o varejo.\n\n' +
        'Acesse pelo link:\n' +
        getShareUrl()
      )
    }
    return (
      '[USO INTERNO] Apresentação Comercial, Matriz de Diferenciais e Pitch — VivaVarejo:\n' +
      getShareUrl()
    )
  }

  // Compartilhar Nativo (navigator.share com fallback para cópia)
  const handleNativeShare = async () => {
    const url = getShareUrl()
    const text = isCliente
      ? 'Apresentação Comercial VivaVarejo — A Camada de Execução no Varejo Físico'
      : 'Guia de Pitch Comercial VivaVarejo (Uso Interno da Equipe)'

    if (navigator.share) {
      try {
        await navigator.share({
          title: text,
          text: isCliente
            ? 'Guia completo de soluções e diferenciais do VivaVarejo frente a sistemas convencionais.'
            : text,
          url,
        })
        return
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    handleCopyLink()
  }

  // Copiar link
  const handleCopyLink = async () => {
    try {
      const url = getShareUrl()
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para sua área de transferência.',
      })
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie o endereço diretamente da barra do navegador.',
        variant: 'destructive',
      })
    }
  }

  // Enviar direto via WhatsApp
  const handleWhatsAppShare = () => {
    const mensagem = encodeURIComponent(getShareText())
    const waUrl = `https://api.whatsapp.com/send?text=${mensagem}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* =========================================================================
          PAINEL DE CONTROLE / CARD SUPERIOR (Oculto na impressão)
         ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-4 print:hidden">
        {/* Cabeçalho do Card com seletor de versão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB]">
                Apresentação Comercial & Pitch
              </span>

              {/* SELO DINÂMICO QUE REFLETE O ESTADO SELECIONADO */}
              {isCliente ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Eye className="w-3 h-3" />
                  <span>Versão Cliente Ativa</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3" />
                  <span>Versão Interna (Equipe)</span>
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-[#1F2937] tracking-tight mt-1.5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0" />
              <span>VivaVarejo: Todas as Soluções da Plataforma</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Material detalhado com a proposta completa da plataforma: perdas gerais, promotores,
              integração de áreas, ponte com ERP e relatórios de gestão.
            </p>
          </div>

          {/* SELETOR INTERNO VS CLIENTE */}
          <div className="flex items-center bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E7EB] self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setVersao('cliente')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isCliente
                  ? 'bg-white text-[#2563EB] shadow-2xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
              title="Material comercial limpo, sem anotações internas ou estratégias confidenciais"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Versão Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setVersao('interna')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                !isCliente
                  ? 'bg-white text-[#1F2937] shadow-2xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
              title="Material completo com notas estratégicas de pitch e anotações para a equipe de vendas"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Versão Interna</span>
            </button>
          </div>
        </div>

        {/* Dica explicativa do modo selecionado */}
        <div className="text-xs rounded-lg p-2.5 flex items-center gap-2 border bg-gray-50 border-gray-200 text-[#4B5563]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            {isCliente ? (
              <>
                <strong>Modo Cliente:</strong> Apresentação comercial sóbria e altamente persuasiva,
                pronta para projetar em reuniões ou enviar diretamente ao lojista sem anotações
                internas.
              </>
            ) : (
              <>
                <strong>Modo Interno:</strong> Revela notas de inteligência competitiva, dicas de
                fechamento, argumentos para cada objeção e pontos de pressão de vendas.
              </>
            )}
          </span>
        </div>

        {/* BARRA DE AÇÕES RÁPIDAS (Top) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB]">
          {/* Botão Principal: Imprimir / Salvar em PDF */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={imprimindo}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors min-h-[40px] flex-1 sm:flex-none"
          >
            <Printer className="w-4 h-4" />
            <span>{imprimindo ? 'Abrindo PDF...' : 'Imprimir / Salvar em PDF'}</span>
          </button>

          {/* Botão Compartilhar Nativo */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[40px]"
            title="Compartilhar material nativamente pelo celular"
          >
            <Share2 className="w-4 h-4 text-[#2563EB]" />
            <span>Compartilhar</span>
          </button>

          {/* Botão Copiar Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[40px]"
            title="Copiar link direto para este material"
          >
            {copiado ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-[#6B7280]" />
            )}
            <span>{copiado ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          {/* Botão Enviar por WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[40px]"
            title="Enviar material diretamente pelo WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          DOCUMENTO COMPLETO IMPRIMÍVEL (Card + Guia Completo)
          Todo este bloco é o que sai no PDF / Impressão e o cliente vê
         ========================================================================= */}
      <div
        id="material-venda-conteudo"
        className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:space-y-6"
      >
        {/* Header do Material Impresso */}
        <div className="border-b border-[#E5E7EB] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm shrink-0">
              <div className="w-5 h-5 border-2 border-white rotate-45 transform" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-wider uppercase text-[#1F2937]">
                VivaVarejo
              </div>
              <div className="text-xs text-[#6B7280]">
                Sistema Operacional de Loja & Prevenção de Perdas no Varejo Físico
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
              Soluções da Plataforma & Guia Comparativo
            </span>
            <div className="text-[11px] text-[#6B7280] mt-1 flex items-center sm:justify-end gap-1.5">
              <span>A camada de execução entre o ERP e o chão de loja</span>
              {!isCliente && (
                <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                  [Uso Interno]
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alerta de Modo Interno (quando ativo) */}
        {!isCliente && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Atenção: Visualizando Versão Interna da Equipe</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Este material inclui notas estratégicas de pitch, dados de inteligência competitiva
                e argumentos para cada módulo. Para apresentar ao lojista, ative a &ldquo;Versão
                Cliente&rdquo; no topo para ocultar notas confidenciais.
              </div>
            </div>
          </div>
        )}

        {/* Título e Proposta de Valor: A Camada de Execução */}
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
            <Workflow className="w-3.5 h-3.5" />
            <span>Da Informação à Execução: O Sistema Operacional da Loja</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
            Por que o VivaVarejo supera os checklists tradicionais de prateleira?
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
            Checklists genéricos focam em formulários estáticos que o piso abandona em poucas
            semanas. O VivaVarejo é a <strong>camada de execução operacional</strong>: conecta os
            números da retaguarda (ERP/BI) com quem abre e fecha a loja. Com rotinas horárias,
            prevenção ativa de perdas para todo o varejo, chamados instantâneos por área da empresa,
            controle de promotores e cobrança hierárquica no WhatsApp, garantimos que o padrão
            aconteça todos os dias.
          </p>
        </div>

        {/* =========================================================================
            NOVA SEÇÃO: AS 6 SOLUÇÕES COMPLETAS DA PLATAFORMA VIVAVAREJO
           ========================================================================= */}
        <div className="space-y-4 pt-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Soluções Integradas
            </span>
            <h2 className="text-lg font-extrabold text-[#1F2937] tracking-tight mt-0.5">
              Tudo o que a plataforma VivaVarejo entrega à sua operação
            </h2>
            <p className="text-xs text-[#6B7280]">
              Uma arquitetura robusta pensada para líderes de loja, encarregados, gerentes de
              operações e diretores de rede.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOLUCOES_PLATAFORMA.map((solucao) => {
              const Icon = solucao.icone || Sparkles
              return (
                <div
                  key={solucao.id}
                  className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Header da Solução */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5 border border-[#2563EB]/20">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1F2937] leading-tight">
                          {solucao.titulo}
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
                          {solucao.subtitulo}
                        </p>
                      </div>
                    </div>

                    {/* Benefício Principal */}
                    <div className="text-xs font-medium text-[#1F2937] bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
                      {solucao.beneficioPrincipal}
                    </div>

                    {/* Pontos Chave */}
                    <ul className="space-y-1.5 pt-1">
                      {solucao.pontosChave.map((ponto, pIdx) => (
                        <li key={pIdx} className="text-xs text-[#4B5563] flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                          <span className="leading-tight">{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dica de Venda Interna (Apenas versão interna) */}
                  {!isCliente && solucao.dicaVendaInterna && (
                    <div className="pt-2 border-t border-[#E5E7EB]/80">
                      <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 leading-tight">
                        <span className="font-bold text-amber-950">Dica de Pitch: </span>
                        {solucao.dicaVendaInterna}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* =========================================================================
            TABELA COMPARATIVA EXPANDIDA & ESPECÍFICA
           ========================================================================= */}
        <div className="space-y-3 pt-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Comparativo Técnico de Mercado
            </span>
            <h2 className="text-lg font-extrabold text-[#1F2937] tracking-tight mt-0.5">
              Matriz Comparativa: VivaVarejo × Checklists Tradicionais
            </h2>
            <p className="text-xs text-[#6B7280]">
              Veja no detalhe como cada capacidade resolve as dores do dia a dia do varejo físico
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#1F2937]">
                  <th className="p-3.5 font-bold uppercase tracking-wider text-xs w-[36%]">
                    Diferencial / Capacidade Operacional
                  </th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-xs bg-blue-50/80 text-[#2563EB] border-x border-[#E5E7EB] w-[34%]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      <span>VivaVarejo</span>
                    </div>
                  </th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-xs text-[#6B7280] w-[30%]">
                    Sistemas Tradicionais
                    <span className="block text-[10px] font-normal lowercase tracking-normal text-[#9CA3AF]">
                      (Checklists Genéricos de Mercado)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {COMPARATIVO_ITEMS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    {/* Critério */}
                    <td className="p-3.5 align-top">
                      <div className="font-bold text-[#1F2937] leading-tight">{item.criterio}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">
                        {item.subtexto}
                      </div>
                    </td>

                    {/* VivaVarejo */}
                    <td className="p-3.5 bg-blue-50/30 border-x border-[#E5E7EB] align-top">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-[#1F2937] leading-snug">
                            {item.vivavarejo.detalhe}
                          </div>
                          {/* Nota Interna da Equipe (oculta na versão cliente) */}
                          {!isCliente && item.vivavarejo.notaInterna && (
                            <div className="text-[11px] font-normal text-blue-900 bg-blue-100/70 p-1.5 rounded border border-blue-200 mt-1 leading-tight">
                              <span className="font-bold">Dica de Pitch: </span>
                              {item.vivavarejo.notaInterna}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sistemas Tradicionais */}
                    <td className="p-3.5 align-top text-[#4B5563]">
                      <div className="flex items-start gap-2">
                        {item.tradicionais.status === true ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : item.tradicionais.status === 'parcial' ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                            ~
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-200 text-[#6B7280] flex items-center justify-center shrink-0 mt-0.5">
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="text-xs text-[#6B7280] leading-snug">
                            {item.tradicionais.detalhe}
                          </div>
                          {/* Nota Interna da Equipe (oculta na versão cliente) */}
                          {!isCliente && item.tradicionais.notaInterna && (
                            <div className="text-[11px] font-normal text-amber-900 bg-amber-100/70 p-1.5 rounded border border-amber-200 mt-1 leading-tight">
                              <span className="font-bold">Inteligência: </span>
                              {item.tradicionais.notaInterna}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            PILARES ESTRATÉGICOS (Por que o VivaVarejo?)
           ========================================================================= */}
        <div className="space-y-4 pt-4 border-t border-[#E5E7EB] page-break-inside-avoid">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Pilares Estratégicos
            </span>
            <h3 className="text-lg font-extrabold text-[#1F2937] tracking-tight mt-0.5">
              Por que a liderança de rede escolhe o VivaVarejo?
            </h3>
            <p className="text-xs text-[#6B7280]">
              Três motivos incontestáveis que transformam a rotina de quem opera o chão de loja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Argumento 1 */}
            <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Foco 100% no Varejo Real de Loja
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Não somos um formulário genérico para auditorias aleatórias. Toda tela e rotina foi
                pensada para a dinâmica do comércio físico: horários de corte, prevenção de perdas
                em qualquer segmento (supermercados, farmácias, moda, açougues, pet shops,
                restaurantes), promotores e conferência em 2 toques.
              </p>
            </div>

            {/* Argumento 2 */}
            <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Implantação no Mesmo Dia com Modelos
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Esqueça semanas de parametrização e contratos de consultoria caros apenas para
                iniciar. Com a biblioteca de Modelos de Rotinas por segmento e a importação de
                planilhas do ERP, a loja entra em operação em minutos e a equipe já executa pelo
                celular no mesmo dia.
              </p>
            </div>

            {/* Argumento 3 */}
            <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Parceiro de Resultados & Execução
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Não entregamos apenas software: acompanhamos os índices de execução com apoio do
                consultor especialista. A cadeia de cobrança no WhatsApp garante que nada caia no
                esquecimento, blindando a margem do lojista contra perdas, rupturas e quebras de
                padrão.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé da Apresentação */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937]">VivaVarejo</span>
            <span>— Excelência em Operação de Varejo & Prevenção de Perdas</span>
          </div>
          <div>
            <span>
              {isCliente
                ? 'Material comercial exclusivo para apresentação a parceiros e clientes'
                : 'Material comercial confidencial • Uso interno da equipe VivaVarejo'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          AÇÕES NO FIM DO MATERIAL
         ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <span>Gostou deste comparativo? Salve ou envie agora ao cliente</span>
          </h4>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Você está visualizando a{' '}
            <strong className="text-[#1F2937]">
              {isCliente ? 'Versão Cliente' : 'Versão Interna'}
            </strong>
            . Use as ações rápidas abaixo direto do seu celular:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            disabled={imprimindo}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex-1 sm:flex-none min-h-[40px]"
          >
            <Printer className="w-4 h-4" />
            <span>Salvar em PDF</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[40px]"
            title="Compartilhar link pelo celular"
          >
            <Share2 className="w-4 h-4 text-[#2563EB]" />
            <span>Compartilhar link</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[40px]"
            title="Enviar pelo WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  )
}
