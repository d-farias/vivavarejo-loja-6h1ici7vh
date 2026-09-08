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
  numero: number
  titulo: string
  subtitulo: string
  icone: React.ComponentType<{ className?: string }>
  beneficioPrincipal: string
  itensDetalhados: {
    titulo: string
    descricao: string
  }[]
  diferencialExclusivo: string
  dicaVendaInterna?: string
}

const COMPARATIVO_ITEMS: ComparativoItem[] = [
  {
    criterio: 'Motor de Execução Operacional vs Checklist Passivo',
    subtexto: 'Conecta dados da retaguarda aos cortes horários de loja',
    vivavarejo: {
      status: true,
      detalhe:
        'Converte metas e indicadores em rotinas com dono, horário de corte e conferência em piso de loja.',
      notaInterna:
        'O ERP informa o passado; o VivaVarejo dita o que fazer nos próximos 15 minutos.',
    },
    tradicionais: {
      status: false,
      detalhe: 'Formulários estáticos e auditorias esporádicas sem ritmo diário de corte de loja.',
      notaInterna: 'Concorrentes vendem auditoria de formulário sem ritmo de piso.',
    },
  },
  {
    criterio: 'Prevenção de Perdas Multissetorial com Rodízio',
    subtexto: 'Quebras por motivo e valor + rodízio de 4 semanas de validade',
    vivavarejo: {
      status: true,
      detalhe:
        'Apontamento financeiro de perdas por motivo e rodízio de validade em 4 semanas para qualquer segmento.',
      notaInterna:
        'Em moda evita perda de ponta de estoque; em farmácia atende controle de lotes; em pet shop reduz perdas de ração.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe: 'Foco restrito a checklists genéricos ou apuração contábil tardia de perdas.',
      notaInterna:
        'Geralmente tratam quebra apenas no fechamento do mês, quando o prejuízo já ocorreu.',
    },
  },
  {
    criterio: 'Gestão Nativa de Promotores e Fornecedores',
    subtexto: 'Agenda de visitas, tarefas em gôndola e controle de presença',
    vivavarejo: {
      status: true,
      detalhe:
        'Controle completo de promotores integrado à rotina da loja sem cobrança de ferramenta de trade à parte.',
      notaInterna:
        'Módulos de trade na concorrência custam de R$ 300 a R$ 800 extras/mês por loja.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Exige contratação de módulo terceirizado de trade marketing ou formulários manuais de portaria.',
    },
  },
  {
    criterio: 'Chamados Corporativos no Motor de Prioridade',
    subtexto: 'Demandas de áreas internas com criticidade e alerta escalonado',
    vivavarejo: {
      status: true,
      detalhe:
        'Compras, Abastecimento, Logística e Manutenção entram na Agenda da loja por criticidade com alerta WhatsApp.',
      notaInterna:
        'Substitui grupos caóticos de WhatsApp onde pedidos se perdem sem prazo e responsável.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Helpdesks corporativos e sistemas de checklist isolados forçando a equipe a abrir 3 sistemas.',
    },
  },
  {
    criterio: 'Workflow Gerencial com 4 Status e Devolução Formal',
    subtexto: 'Atrasada, Aguardando Validação, Devolvida e Aprovada',
    vivavarejo: {
      status: true,
      detalhe:
        'Workflow com validação gerencial obrigatória, motivo formal em devoluções e carimbo do auditor.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Mera caixa de seleção (concluído/não concluído) sem validação gerencial estruturada.',
    },
  },
  {
    criterio: 'Cadeia de Escalonamento Hierárquico no WhatsApp',
    subtexto: 'Cobrança do responsável direto até o Diretor Regional',
    vivavarejo: {
      status: true,
      detalhe:
        'Alertas contextualizados em 1 toque: Executor → Chefe imediato → Gerente de Operações → Regional.',
      notaInterna:
        'Piso de loja não lê e-mail; WhatsApp garante taxa de resposta e resolução imediata.',
    },
    tradicionais: {
      status: false,
      detalhe: 'Apenas e-mails frios ou push genéricos frequentemente ignorados pelo operador.',
    },
  },
  {
    criterio: 'Planos de Ação 5W2H Imediatos a Partir do Desvio',
    subtexto: 'Causa raiz, responsável, prazo e acompanhamento na Agenda',
    vivavarejo: {
      status: true,
      detalhe:
        'Qualquer rotina atrasada ou quebra gera plano corretivo 5W2H em 1 toque diretamente na Agenda.',
      notaInterna:
        'Uma inconformidade nunca morre na planilha: vira compromisso rastreável com cobrança.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Módulos complexos e burocráticos de planos de ação que a equipe abandona após a implantação.',
    },
  },
  {
    criterio: 'Visão Unificada: Painel Executivo e Relatório Loja a Loja',
    subtexto: 'Hoje, semana e mês, ranking de conformidade e exportação CSV',
    vivavarejo: {
      status: true,
      detalhe:
        'Comparativo entre filiais da rede, % de conclusão e aprovação, ranking e exportação CSV consolidada.',
      notaInterna:
        'Em 10 segundos o Diretor Geral sabe qual loja lidera e qual filial necessita de suporte urgente.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Relatórios fragmentados que exigem manipulação prévia de planilhas para gerar visão de rede.',
    },
  },
  {
    criterio: 'Implantação no Mesmo Dia com Modelos de Varejo e PWA Leve',
    subtexto: 'Biblioteca de rotinas prontas por segmento e app sem loja',
    vivavarejo: {
      status: true,
      detalhe:
        'Modelos prontos por segmento + importação Excel/CSV do ERP + PWA leve instalável no iPhone e Android.',
      notaInterna:
        'Quebra objeção de tempo: a loja não começa do zero e opera no mesmo dia sem consultoria cara.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Semanas de parametrização consultiva e aplicativos pesados que travam celulares simples.',
      notaInterna:
        'Concorrentes costumam cobrar taxa pesada de implantação de R$ 2.000 a R$ 5.000.',
    },
  },
]

const SOLUCOES_PLATAFORMA: SolucaoPilar[] = [
  {
    id: 'perdas',
    numero: 1,
    titulo: 'Perdas em TODO o Varejo (Não Só Supermercado)',
    subtitulo: 'Quebras detalhadas, inventários rotativos e rodízio de 4 semanas de validade',
    icone: ShieldAlert,
    beneficioPrincipal:
      'Solução universal que atende supermercado, farmácia, moda, açougue, pet shop e restaurante com disciplina preventiva diária.',
    itensDetalhados: [
      {
        titulo: 'Quebras por Motivo, Setor, Quantidade e Valor',
        descricao:
          'Apontamento no momento da ocorrência categorizado por vencimento, avaria, furto/roubo interno/externo ou erro de pedido, calculando impacto financeiro real.',
      },
      {
        titulo: 'Inventários Rotativos Setorizados',
        descricao:
          'Auditorias contínuas por seção (açougue, perfumaria, confecção, frios) com apuração automática de acuracidade de estoque e divergências antes do fechamento do mês.',
      },
      {
        titulo: 'Validade × Calendário em Rodízio de 4 Semanas',
        descricao:
          'Cronograma mensal inteligente que distribui as seções nas semanas 1 a 4, garantindo cobertura total da loja sem sobrecarregar nenhum turno.',
      },
      {
        titulo: 'Aplicabilidade Multissetorial Comprovada',
        descricao:
          'Em farmácias assegura controle de lotes e retenção regulatória; em moda evita avarias e peças órfãs; em pet shops monitora sacarias e rações; em restaurantes audita câmaras frias.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: transforma a prevenção de perdas em rotina diária no piso, em vez de um susto contábil descoberto semanas depois.',
    dicaVendaInterna:
      'Enfatize o argumento financeiro: perdas no varejo drenam de 1,5% a 3% do faturamento bruto. Uma redução de 20% nas quebras paga a plataforma imediatamente.',
  },
  {
    id: 'promotores',
    numero: 2,
    titulo: 'Controle de Promotores e Fornecedores',
    subtitulo: 'Agenda de visitas em loja, tarefas do promotor e acompanhamento de acordos',
    icone: Users,
    beneficioPrincipal:
      'Controle nativo de presença externa, execução de gôndola e cumprimento de acordos comerciais sem custo de ferramentas adicionais.',
    itensDetalhados: [
      {
        titulo: 'Agenda de Visitas em Loja',
        descricao:
          'Programação semanal e diária da escala de promotores com marca de fornecedor, data, horário previsto, status (agendada, realizada, atrasada) e promotor responsável.',
      },
      {
        titulo: 'Tarefas de Piso do Promotor',
        descricao:
          'Checklists direcionados por visita: reposição de mercadoria, conferência de precificação na ponta de gôndola, aplicação de material de merchandising e verificação de frentes.',
      },
      {
        titulo: 'Conferência de Acordos Comerciais',
        descricao:
          'Registro de conformidade e ocorrências para confrontar entregas de trade, bonificações acordadas e cumprimento das cotas de espaço em gôndola.',
      },
      {
        titulo: 'Solução Nativa sem Custo Adicional',
        descricao:
          'Módulo 100% incorporado à plataforma VivaVarejo, eliminando a contratação de ferramentas extras de trade marketing que costumam encarecer o custo mensal por loja.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: a loja passa a comprovar se o fornecedor parceiro realmente prestou o serviço combinado em gôndola com histórico auditável.',
    dicaVendaInterna:
      'Quase todo supermercadista ou lojista reclama que o promotor "finge que vai e ninguém confere". O VivaVarejo dá a ele evidência fotográfica e controle pontual da visita.',
  },
  {
    id: 'integracao_areas',
    numero: 3,
    titulo: 'Integração com Áreas da Empresa',
    subtitulo: 'Chamados instantâneos de retaguarda conectados ao Motor de Prioridade com WhatsApp',
    icone: Layers,
    beneficioPrincipal:
      'Centraliza demandas corporativas diretamente na fila de execução da loja, encerrando o caos de solicitações perdidas em grupos de mensagens.',
    itensDetalhados: [
      {
        titulo: 'Chamados Instantâneos por Área Demandante',
        descricao:
          'Canais diretos para Compras, Abastecimento, RH, Marketing, Logística, Financeiro, Operações, Prevenção de Perdas e Manutenção abrirem pedidos à loja.',
      },
      {
        titulo: 'Cenários Críticos em Tempo Real ("Caminhão Atrasado")',
        descricao:
          'Avisos urgentes (ex.: "Caminhão atrasado na rodovia", "Troca urgente de cartazete promocional") chegam imediatamente à gerência de loja para replanejar equipes e docas.',
      },
      {
        titulo: 'Motor de Prioridade da Agenda da Loja',
        descricao:
          'Os chamados entram automaticamente no fluxo diário da loja ordenados por criticidade (Baixa, Média, Alta) e prazo de corte para não ficarem esquecidos.',
      },
      {
        titulo: 'Alerta com Notificação Formatada via WhatsApp',
        descricao:
          'Disparo imediato ao encarregado e gestor responsável com mensagem estruturada, evitando ruídos de comunicação e acelerando a resposta.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: substitui a salada de grupos informais de WhatsApp por chamados rastreáveis com dono, criticidade e prazo de atendimento.',
    dicaVendaInterna:
      'Mostre como a Logística sofre ao avisar atraso de frete por e-mail e a doca de recebimento estar vazia ou sem pessoal. Com o VivaVarejo o encarregado é alertado na hora.',
  },
  {
    id: 'erp_execucao',
    numero: 4,
    titulo: 'Da Informação à Execução',
    subtitulo:
      'ERP/BI mostra o passado; VivaVarejo transforma planilha em rotina, prioridade e acompanhamento',
    icone: FileSpreadsheet,
    beneficioPrincipal:
      'A ponte definitiva entre relatórios da matriz e a operação no chão de loja: transforma dados estáticos em ação humana imediata.',
    itensDetalhados: [
      {
        titulo: 'Superação do Abismo entre Retaguarda e Loja',
        descricao:
          'O ERP e o BI revelam "o que deu errado ontem"; o VivaVarejo assegura o que precisa ser executado exatamente nas próximas horas do turno.',
      },
      {
        titulo: 'Transformação de Indicadores em Rotinas Vivas',
        descricao:
          'Cada meta, ruptura apontada ou divergência vira rotina prática atribuída a um cargo, com horário limite, ferramentas necessárias e tipo de conferência.',
      },
      {
        titulo: 'Importação Fácil via Planilhas Excel (.xlsx) e CSV',
        descricao:
          'Importador flexível de arquivos Excel e recurso de colagem direta de dados CSV exportados do seu ERP ou BI, com pré-visualização linha a linha.',
      },
      {
        titulo: 'Mecanismo de Desduplicação Inteligente',
        descricao:
          'Atualiza horários e responsáveis de rotinas existentes sem duplicar cadastros, preservando o histórico de execuções anteriores da loja.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: o lojista não precisa trocar de ERP nem investir em integrações caras; o VivaVarejo importa dados e governa o ritmo de execução.',
    dicaVendaInterna:
      'Dica central de fechamento: nunca diga que o ERP do cliente é ruim. Diga que o ERP é excelente para guardar o passado, mas o VivaVarejo é quem comanda o piso hoje.',
  },
  {
    id: 'visao_unica',
    numero: 5,
    titulo: 'Visão Única de Gestão',
    subtitulo: 'Dashboard executivo + relatórios consolidados loja a loja por Hoje, Semana e Mês',
    icone: BarChart3,
    beneficioPrincipal:
      'Visão panorâmica em tela única: diretoria, GOs e gerentes enxergam instantaneamente o padrão de conformidade e o ranking da rede.',
    itensDetalhados: [
      {
        titulo: 'Dashboard Executivo com Filtros Temporais',
        descricao:
          'Navegação rápida por Hoje, Esta Semana e Este Mês, com indicadores consolidados de volume de rotinas, concluídas, atrasadas e deltas percentuais.',
      },
      {
        titulo: 'Relatório Consolidado Loja a Loja',
        descricao:
          'Tabela comparativa lado a lado de todas as unidades da rede, permitindo identificar em segundos qual filial performa acima e qual requer socorro operacional.',
      },
      {
        titulo: 'Indicadores Centrais: % Conclusão, Validação e Pontualidade',
        descricao:
          'Taxa percentual de conclusão das tarefas, índice de validação e aprovação gerencial e taxa de rotinas cumpridas rigorosamente no prazo.',
      },
      {
        titulo: 'Ranking da Rede e Exportação Consolidada em CSV',
        descricao:
          'Classificação das lojas com base no índice de entrega e botão de exportação em planilha CSV para apresentações de conselho e reuniões de resultado.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: o Diretor de Operações sabe exatamente a saúde de 10, 50 ou 100 lojas em 10 segundos, sem ter que telefonar para cada gerente.',
    dicaVendaInterna:
      'Em reuniões de resultados semanais, o diretor não precisa abrir 10 telas. O Relatório Loja a Loja dá a foto completa de disciplina da rede inteira.',
  },
  {
    id: 'workflow_e_mais',
    numero: 6,
    titulo: '"E Tem Muito Mais": O Sistema Operacional da Loja',
    subtitulo:
      '4 status, 5W2H em 1 toque, fotos com zoom, cadeia WhatsApp, modelos por segmento e PWA',
    icone: Workflow,
    beneficioPrincipal:
      'Um ecossistema completo desenhado para os desafios reais do varejo físico, muito além de formulários genéricos de prateleira.',
    itensDetalhados: [
      {
        titulo: '4 Status Operacionais Claros',
        descricao:
          'Acompanhamento sem ambiguidade: Atrasada (vermelho), Aguardando Validação (âmbar), Devolvida com motivo de ajuste (laranja) e Aprovada (verde) com auditor e horário.',
      },
      {
        titulo: 'Planos de Ação 5W2H Gerados em 1 Toque',
        descricao:
          'Qualquer quebra ou desvio vira plano corretivo estruturado (O que, Quem, Quando, Onde, Por que e Como) para eliminar reincidências diretamente na Agenda.',
      },
      {
        titulo: 'Auditoria Visual com Fotos e Zoom',
        descricao:
          'Comprovação fotográfica com carimbo de data e hora, fotos obrigatórias por setor, visualizador ampliado e galeria de conferência para a liderança.',
      },
      {
        titulo: 'Cadeia de Escalonamento no WhatsApp',
        descricao:
          'Alerta com mensagens contextualizadas seguindo a hierarquia: Responsável direto → Chefe imediato / Encarregado → Gerente de Operações (GO) → Diretor Regional.',
      },
      {
        titulo: 'Biblioteca de Modelos por Segmento e PWA Leve',
        descricao:
          'Modelos prontos para Supermercados, Farmácias, Confecção/Moda, Açougues, Pet Shops e Restaurantes. PWA instalável no iPhone e Android sem lojas de aplicativos.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: é um sistema operacional completo para o piso, leve para qualquer smartphone e adotado espontaneamente pelas equipes de loja.',
    dicaVendaInterna:
      'O fechamento definitivo: "Outros aplicativos vendem formulários chatos. O VivaVarejo entrega ritmo diário, segurança operacional e proteção da margem da sua rede".',
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
      const originalTitle = document.title
      document.title = 'VivaVarejo'
      setTimeout(() => {
        window.print()
        document.title = originalTitle
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3.5">
            {SOLUCOES_PLATAFORMA.map((solucao) => {
              const Icon = solucao.icone || Sparkles
              return (
                <div
                  key={solucao.id}
                  className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 print:p-4 flex flex-col justify-between space-y-3 print:space-y-2.5 print-break-inside-avoid print:bg-white print:border-gray-300"
                >
                  <div className="space-y-2.5">
                    {/* Header da Solução */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5 border border-[#2563EB]/20 print:border-[#2563EB]/40">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1F2937] leading-tight">
                          {solucao.numero}. {solucao.titulo}
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
                          {solucao.subtitulo}
                        </p>
                      </div>
                    </div>

                    {/* Benefício Principal */}
                    <div className="text-xs font-semibold text-[#1F2937] bg-white print:bg-blue-50/40 p-2.5 rounded-lg border border-[#E5E7EB] print:border-blue-100">
                      {solucao.beneficioPrincipal}
                    </div>

                    {/* Itens Detalhados: Título em Negrito + Descrição Embaixo (padrão solicitado) */}
                    <div className="space-y-2 pt-1">
                      {solucao.itensDetalhados.map((item, iIdx) => (
                        <div key={iIdx} className="text-xs flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#1F2937] block leading-snug">
                              {item.titulo}
                            </span>
                            <span className="text-[#4B5563] text-[11px] sm:text-xs block leading-relaxed mt-0.5">
                              {item.descricao}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Destaque de Diferencial Exclusivo */}
                    <div className="text-[11px] text-[#2563EB] bg-blue-50/70 print:bg-gray-50 p-2 rounded-md border border-blue-100 print:border-gray-200 font-medium leading-snug">
                      {solucao.diferencialExclusivo}
                    </div>
                  </div>

                  {/* Dica de Venda Interna (Apenas versão interna com selo âmbar) */}
                  {!isCliente && solucao.dicaVendaInterna && (
                    <div className="pt-2 border-t border-[#E5E7EB]/80 print-break-inside-avoid">
                      <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 leading-tight">
                        <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] block mb-0.5">
                          [Confidencial • Dica de Pitch]:
                        </span>
                        <span>{solucao.dicaVendaInterna}</span>
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
        <div className="space-y-3 pt-2 print-break-inside-avoid">
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

          <div className="overflow-x-auto print:overflow-visible rounded-xl border border-[#E5E7EB] print:border-gray-300">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] print:bg-gray-100 border-b border-[#E5E7EB] print:border-gray-300 text-[#1F2937]">
                  <th className="p-3.5 print:p-2.5 font-bold uppercase tracking-wider text-xs w-[36%]">
                    Diferencial / Capacidade Operacional
                  </th>
                  <th className="p-3.5 print:p-2.5 font-bold uppercase tracking-wider text-xs bg-blue-50/80 print:bg-blue-100/70 text-[#2563EB] border-x border-[#E5E7EB] print:border-gray-300 w-[34%]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      <span>VivaVarejo</span>
                    </div>
                  </th>
                  <th className="p-3.5 print:p-2.5 font-bold uppercase tracking-wider text-xs text-[#6B7280] w-[30%]">
                    Sistemas Tradicionais
                    <span className="block text-[10px] font-normal lowercase tracking-normal text-[#9CA3AF]">
                      (Checklists Genéricos)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] print:divide-gray-300">
                {COMPARATIVO_ITEMS.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/60 print-break-inside-avoid transition-colors"
                  >
                    {/* Critério */}
                    <td className="p-3.5 print:p-2.5 align-top">
                      <div className="font-bold text-[#1F2937] leading-tight">{item.criterio}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">
                        {item.subtexto}
                      </div>
                    </td>

                    {/* VivaVarejo */}
                    <td className="p-3.5 print:p-2.5 bg-blue-50/30 print:bg-blue-50/20 border-x border-[#E5E7EB] print:border-gray-300 align-top">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 print:bg-emerald-50">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-[#1F2937] leading-snug">
                            {item.vivavarejo.detalhe}
                          </div>
                          {/* Nota Interna da Equipe (oculta na versão cliente) */}
                          {!isCliente && item.vivavarejo.notaInterna && (
                            <div className="text-[11px] font-normal text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1 leading-tight print:bg-amber-50">
                              <span className="font-bold text-amber-950 uppercase text-[10px]">
                                [Confidencial • Pitch]:{' '}
                              </span>
                              <span>{item.vivavarejo.notaInterna}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sistemas Tradicionais */}
                    <td className="p-3.5 print:p-2.5 align-top text-[#4B5563]">
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
                            <div className="text-[11px] font-normal text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1 leading-tight print:bg-amber-50">
                              <span className="font-bold text-amber-950 uppercase text-[10px]">
                                [Confidencial • Intel]:{' '}
                              </span>
                              <span>{item.tradicionais.notaInterna}</span>
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
        <div className="space-y-4 pt-4 border-t border-[#E5E7EB] print-break-inside-avoid">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {/* Argumento 1 */}
            <div className="bg-[#F7F7F5] print:bg-white border border-[#E5E7EB] print:border-gray-300 rounded-xl p-5 print:p-4 space-y-2.5 print-break-inside-avoid">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Foco 100% no Varejo Real de Loja
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Construído para o varejo físico real: cortes horários de piso, prevenção de perdas
                multissetorial, conferência ágil e interface simples para qualquer smartphone.
              </p>
            </div>

            {/* Argumento 2 */}
            <div className="bg-[#F7F7F5] print:bg-white border border-[#E5E7EB] print:border-gray-300 rounded-xl p-5 print:p-4 space-y-2.5 print-break-inside-avoid">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Implantação no Mesmo Dia com Modelos
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Zero tempo perdido: biblioteca de rotinas prontas por segmento e importação
                facilitada de dados do ERP permitem que a equipe execute as rotinas no mesmo dia.
              </p>
            </div>

            {/* Argumento 3 */}
            <div className="bg-[#F7F7F5] print:bg-white border border-[#E5E7EB] print:border-gray-300 rounded-xl p-5 print:p-4 space-y-2.5 print-break-inside-avoid">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Parceiro de Resultados & Execução
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Acompanhamento com especialista, workflow com validação formal e cadeia WhatsApp
                para blindar margens contra quebras, rupturas e desvios de processo.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé da Apresentação */}
        <div className="pt-6 border-t border-[#E5E7EB] print:pt-4 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280] print-break-inside-avoid">
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
