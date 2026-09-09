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
  CalendarCheck,
  TrendingUp,
  Boxes,
  ZoomIn,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getCanonicalShareUrl, shareVivaVarejo } from '@/lib/share-utils'

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
  destaqueBadge?: string
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
    criterio: 'Controle de Promotores e Gestão de Fornecedores',
    subtexto:
      'Comprador por categoria, aviso no WhatsApp se faltar, layout/planograma e fotos por critério',
    vivavarejo: {
      status: true,
      detalhe:
        'Gestão de fornecedores com comprador/gestor vinculado, disparo WhatsApp em atraso, planograma com foto, checklist (abastecimento 100%, validades, layout, sortimento), % vendas, rupturas e fotos com zoom.',
      notaInterna:
        'Principal isca e diferencial novo: supermercadistas e lojistas sofrem com promotores fantasmas. O módulo substitui apps de trade de R$ 400 a R$ 900/loja e dá poder imediato ao comprador nas negociações.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Inexistente ou restrito a planilhas de portaria manuais e módulos terceirizados caros e desconectados da rotina da loja.',
      notaInterna:
        'Concorrentes de checklists não possuem vínculo com comprador nem fotos separadas por gôndola/abastecimento/validade.',
    },
  },
  {
    criterio: 'Prevenção de Perdas em Todo o Varejo com Rodízio',
    subtexto: 'Quebras por motivo, quantidade e valor + inventários rotativos e ciclo de 4 semanas',
    vivavarejo: {
      status: true,
      detalhe:
        'Apontamento financeiro por vencimento/avaria/furto/erro, inventários rotativos com acuracidade (%) e calendário inteligente em rodízio de 4 semanas para supermercados, farmácias, moda, açougues e pet shops.',
      notaInterna:
        'O varejo perde de 1,5% a 3% do faturamento. Em farmácia atende lotes; em confecção/moda audita ponta de estoque; em pet shop reduz perdas de ração. O rodízio em 4 semanas viabiliza auditar a loja inteira sem estresse.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Tratam perdas apenas no fechamento contábil tardio ou checklists genéricos sem cálculo de valor financeiro nem acuracidade.',
      notaInterna:
        'Quando a diretoria descobre a perda no DRE, o dinheiro já foi para o lixo. O VivaVarejo atua antes do produto vencer.',
    },
  },
  {
    criterio: 'Agenda com Motor de Prioridade e Workflow com 4 Status',
    subtexto: 'Organização dinâmica, 5W2H em 1 toque, login direto e workflow com devolução formal',
    vivavarejo: {
      status: true,
      detalhe:
        'Motor que ordena o dia por corte horário e criticidade; workflow seguro (Atrasada, Aguardando Validação, Devolvida e Aprovada); plano de ação 5W2H gerado em 1 toque a partir do desvio; login direto na Agenda.',
      notaInterna:
        'O gerente não precisa planejar o dia no papel: ao logar, a Agenda já entrega a fila ordenada. A devolução formal com motivo obriga o executor a refazer com qualidade.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Listas estáticas tipo "to-do" com mera caixa de seleção (check), sem cálculo de prioridade diária nem devolução auditável.',
    },
  },
  {
    criterio: 'Biblioteca de Modelos por Segmento e Unificação de Cargos',
    subtexto: 'Conciliação inteligente por nicho e normalização canônica de departamentos',
    vivavarejo: {
      status: true,
      detalhe:
        'Rotinas prontas por segmento (Supermercados, Farmácias, Açougues, Pet Shops, Moda, Restaurantes), unificação canônica de cargos (Gerente = Gerente de Loja, Prevenção = Prevenção de Perdas) e blocos recolhíveis.',
      notaInterna:
        'Quebra a objeção clássica: "meu segmento é diferente" ou "não tenho tempo para cadastrar tudo". O cliente aplica o modelo do segmento e opera no dia 1.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Telas em branco exigindo semanas de consultoria de parametrização e preenchimento manual cadastro por cadastro.',
      notaInterna:
        'Cobram taxas pesadas de implantação de R$ 2.500 a R$ 6.000 para desenhar processos básicos.',
    },
  },
  {
    criterio: 'Chamados Instantâneos Integrando Áreas da Empresa',
    subtexto:
      'Compras, Abastecimento, RH, Logística, Marketing, Operações e Manutenção direto no piso',
    vivavarejo: {
      status: true,
      detalhe:
        'Canais diretos das áreas demandantes direto para a loja no Motor de Prioridade. Avisos urgentes (ex.: caminhão atrasado, ruptura de oferta) chegam ao responsável com prazo e criticidade.',
      notaInterna:
        'Elimina a bagunça de dezenas de grupos de WhatsApp da rede. A matriz solicita com prazo e acompanha na mesma tela da loja.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Helpdesks corporativos pesados que o piso de loja não acessa ou pedidos perdidos em e-mails e grupos informais.',
    },
  },
  {
    criterio: 'Cadeia de Escalonamento Hierárquico no WhatsApp',
    subtexto: 'Do executor direto ao Diretor Regional em 1 toque',
    vivavarejo: {
      status: true,
      detalhe:
        'Alertas estruturados em 1 toque: Responsável direto → Chefe imediato / Encarregado → Gerente de Operações (GO) → Diretor Regional. Disparo contextualizado com nome da loja e tarefa.',
      notaInterna:
        'Piso de loja não lê e-mail corporativo. O WhatsApp garante taxa de leitura de 98% e resposta em minutos.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Apenas notificações push genéricas ou e-mails frios que a equipe desativa ou ignora.',
    },
  },
  {
    criterio: 'Dashboard de Eficiência e Indicadores de Negócio',
    subtexto: 'Rotinas, chamados, validades, perdas e visitas + correlação com vendas e quebras',
    vivavarejo: {
      status: true,
      detalhe:
        'Visão unificada de todo o trabalho da loja comparado por Setor, Líder e Loja; indicadores de Vendas, Quebras, Rupturas, Itens sem Vendas, Estoque Virtual e Estoque Parado; correlação direta de redução de perdas.',
      notaInterna:
        'Prova o ROI do VivaVarejo na cara do diretor: mostra em dados reais que setores com 90%+ de rotina cumprida têm até 35% menos rupturas e 28% menos quebras.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Apenas gráficos de percentual de formulários preenchidos, sem qualquer relação com indicadores financeiros ou perda de mercadoria.',
    },
  },
  {
    criterio: 'Relatórios de Gestão e Relatório Loja a Loja Consolidado',
    subtexto: 'Hoje, Semana e Mês, taxa de conclusão, validação, pontualidade, ranking e CSV',
    vivavarejo: {
      status: true,
      detalhe:
        'Comparativo entre filiais da rede em tela única, percentuais de conclusão, aprovação e pontualidade, ranking de conformidade e botão de exportação consolidada em CSV.',
      notaInterna:
        'Em 10 segundos o Diretor de Operações sabe qual gerente comanda a loja exemplar e qual loja requer visita de alinhamento.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Exportações truncadas que demandam horas de montagem de tabelas dinâmicas no Excel para comparar lojas.',
    },
  },
  {
    criterio: 'Da Informação à Execução (Ponte ERP / BI)',
    subtexto:
      'O ERP/BI mostra o passado; o VivaVarejo transforma planilha em rotina no chão de loja',
    vivavarejo: {
      status: true,
      detalhe:
        'Importador ágil de planilhas Excel (.xlsx) e recurso de colagem direta de CSV exportado do ERP/BI, com desduplicação inteligente sem perder histórico da loja.',
      notaInterna:
        'Argumento mestre: não competimos com o ERP Totvs, Linx, Protheus ou Bluesoft. O ERP registra o passado; o VivaVarejo comanda o piso hoje.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Exigem APIs complexas e lentas para qualquer carga de rotinas ou recadastramento forçado a cada mudança.',
    },
  },
  {
    criterio: 'Usabilidade Mobile Real: PWA Instalável em Retrato',
    subtexto:
      'Funciona natural no celular sem virar a tela, tabelas com scroll lateral e fotos com zoom',
    vivavarejo: {
      status: true,
      detalhe:
        'PWA leve instalável no iPhone e Android sem lojas de app; navegação confortável na vertical; tabelas com rolagem lateral que nunca quebram o layout; botões sempre acessíveis e visualizador de foto com zoom.',
      notaInterna:
        'Quebra a resistência do operador: funciona em smartphones baratos, não ocupa memória do aparelho e abre instantaneamente.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe:
        'Apps nativos pesados que ocupam 200MB, travam em celulares simples ou interfaces web que cortam na tela em pé.',
    },
  },
]

const SOLUCOES_PLATAFORMA: SolucaoPilar[] = [
  {
    id: 'promotores',
    numero: 1,
    titulo: 'Controle de Promotores e Fornecedores',
    subtitulo:
      'Gestão da categoria, comprador vinculado, aviso no WhatsApp ao faltar, layout e fotos com zoom',
    icone: Users,
    destaqueBadge: 'Novo Diferencial Exclusivo',
    beneficioPrincipal:
      'Fim dos promotores fantasmas: controle absoluto de presença, abastecimento em gôndola, layout do fornecedor e comunicação direta com o comprador da categoria.',
    itensDetalhados: [
      {
        titulo: 'Gestão da Categoria com Comprador Vinculado & Alerta WhatsApp',
        descricao:
          'Cada fornecedor é cadastrado com seu comprador/gestor de categoria responsável. Se o promotor não comparecer no horário agendado, a loja dispara em 1 toque um aviso formatado no WhatsApp do comprador para cobrar a indústria.',
      },
      {
        titulo: 'Layout e Planograma do Fornecedor na Palma da Mão',
        descricao:
          'Foto e orientações do planograma oficial da marca acessíveis direto na tela da loja. Encarregados e promotores conferem o espaço de gôndola acordado comercialmente sem precisar consultar manuais impressos.',
      },
      {
        titulo: 'Política de Quebras Parametrizada por Fornecedor',
        descricao:
          'Regras comerciais transparentes no cadastro de cada parceiro: Troca Total, Troca Parcial ou Sem Troca (avaria de loja), respaldando a equipe na triagem de produtos avariados ou vencidos.',
      },
      {
        titulo: 'Checklist Rígido por Visita & Indicadores de Sortimento',
        descricao:
          'Conferência em 4 critérios objetivos: abastecimento 100% do estoque da loja, conferência de validades, implantação conforme layout oficial e quantidade de itens do sortimento ativo.',
      },
      {
        titulo: 'Campos Prontos para Integração com ERP (% Vendas, Rupturas e Itens sem Vendas)',
        descricao:
          'Registro da fatia de vendas do fornecedor, quantidade de rupturas identificadas e itens sem giro na loja, preparando a operação para a integração contínua de dados com a retaguarda comercial.',
      },
      {
        titulo: 'Foto Obrigatória com Zoom por Critério e Dupla Governança',
        descricao:
          'Comprovação fotográfica com zoom e tela cheia separada por foco (gôndola, abastecimento e validades). Governança em duas etapas: Encarregado e GO garantem a execução, e o Gerente de Loja fiscaliza e aprova.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: transforma o promotor de "visitante desgovernado" em ativo auditável de vendas, dando ao comprador munição imediata para renegociar contratos comerciais.',
    dicaVendaInterna:
      'A dor nº 1 do supermercadista com indústria é o promotor que assina o livro e não abastece. O VivaVarejo dá evidência com foto em zoom, checklist e avisa o comprador pelo WhatsApp se o promotor faltar. Fecha vendas na hora!',
  },
  {
    id: 'perdas',
    numero: 2,
    titulo: 'Prevenção de Perdas em TODO o Varejo',
    subtitulo:
      'Quebras por motivo/setor/valor, inventários rotativos e rodízio de 4 semanas de validade',
    icone: ShieldAlert,
    beneficioPrincipal:
      'Solução universal contra perdas aplicável a supermercados, farmácias, moda/confecção, açougues, pet shops, restaurantes e materiais de construção.',
    itensDetalhados: [
      {
        titulo: 'Apontamento Financeiro de Quebras na Origem',
        descricao:
          'Registro imediato categorizado por motivo (vencimento, avaria, roubo/furto, erro de pedido ou descarte), calculando setor, quantidade de unidades e impacto financeiro em reais.',
      },
      {
        titulo: 'Inventários Rotativos com Cálculo de Acuracidade (%)',
        descricao:
          'Contagens contínuas setorizadas (carnes, perfumaria, confecção, laticínios) com índice percentual automático de acuracidade e levantamento de divergências antes do fechamento contábil.',
      },
      {
        titulo: 'Validade × Calendário em Rodízio Inteligente de 4 Semanas',
        descricao:
          'Metodologia preventiva consagrada: a loja divide as categorias nas semanas 1 a 4 do mês. Todo o sortimento é auditado continuamente sem sobrecarregar nenhum turno ou encarregado.',
      },
      {
        titulo: 'Aplicabilidade Universal Multissetorial',
        descricao:
          'Farmácias controlam lotes e regulatórios; lojas de moda evitam avarias e peças órfãs de mostruário; açougues controlam desossa e quebra de balcão; pet shops monitoram sacarias e validade de rações.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: a prevenção de perdas deixa de ser uma auditoria policialesca e vira disciplina diária de piso, preservando diretamente a margem líquida.',
    dicaVendaInterna:
      'O varejista opera com margem líquida apertada (2% a 5%). Reduzir 20% das quebras de loja pode aumentar o lucro líquido da empresa em até 30%. Use essa matemática no pitch.',
  },
  {
    id: 'modelos_rotinas',
    numero: 3,
    titulo: 'Rotinas com Modelos por Segmento de Negócio',
    subtitulo:
      'Biblioteca de modelos, conciliação por segmento, unificação canônica e rotinas detalhadas',
    icone: CalendarCheck,
    beneficioPrincipal:
      'Sua loja não começa de uma folha em branco: ative bibliotecas completas desenhadas por especialistas para o seu segmento e opere no mesmo dia.',
    itensDetalhados: [
      {
        titulo: 'Biblioteca de Modelos Especializados por Segmento',
        descricao:
          'Acervo pré-configurado de rotinas críticas para Supermercados, Farmácias, Açougues, Pet Shops, Lojas de Moda/Vestuário e Restaurantes/Food Service.',
      },
      {
        titulo: 'Conciliação Inteligente de Processos por Segmento',
        descricao:
          'Ao aplicar um modelo, o sistema concilia funções e rotinas sem duplicar cadastros, preservando as particularidades já existentes na sua loja.',
      },
      {
        titulo: 'Unificação Canônica de Cargos e Departamentos',
        descricao:
          'Padronização automática das variações de nomenclaturas do varejo (ex.: Gerência / Gerente = Gerente de Loja; Prevenção / APP = Prevenção de Perdas; Repositor / Mercearia = Reposição).',
      },
      {
        titulo: 'Departamentos e Funções Recolhíveis por Opção & Detalhes em 1 Toque',
        descricao:
          'Interface limpa: blocos de cargos recolhidos para economizar espaço no celular, permitindo expandir e visualizar as tarefas detalhadas de cada função com um clique.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: implementação ultrarrápida no mesmo dia sem custos de consultoria de processos, com as melhores práticas operacionais do varejo já embutidas.',
    dicaVendaInterna:
      'Mostre a vitrine de modelos ao vivo na demonstração. Quando o cliente vê a rotina do segmento dele pronta na tela, a objeção de "dá trabalho para implantar" desaparece.',
  },
  {
    id: 'agenda_motor',
    numero: 4,
    titulo: 'Agenda com Motor de Prioridade & Workflow Seguro',
    subtitulo:
      'Fila dinâmica por corte horário, 4 status, 5W2H em 1 toque, cadeia WhatsApp e login direto',
    icone: Workflow,
    destaqueBadge: 'Ritmo Diário de Loja',
    beneficioPrincipal:
      'A tela central de trabalho de todo líder: ordena as tarefas do dia pelo horário de corte, audita a qualidade e dispara correções imediatas.',
    itensDetalhados: [
      {
        titulo: 'Motor de Prioridade por Horário de Corte e Criticidade',
        descricao:
          'A Agenda reorganiza a fila de execução em tempo real: tarefas com horário de corte próximo ou em atraso sobem imediatamente para o topo da lista da equipe.',
      },
      {
        titulo: 'Workflow Gerencial com 4 Status Rigorosos',
        descricao:
          'Acompanhamento transparente sem espaço para dúvidas: Atrasada (vermelho), Aguardando Validação (azul), Devolvida com justificativa formal (laranja) e Aprovada (verde).',
      },
      {
        titulo: 'Planos de Ação 5W2H Gerados em 1 Toque',
        descricao:
          'Qualquer rotina em atraso ou inconformidade gera um plano 5W2H imediato (O que, Quem, Quando, Onde, Por que, Como) com prazo e responsável rastreáveis.',
      },
      {
        titulo: 'Cadeia de Escalonamento Hierárquico no WhatsApp',
        descricao:
          'Disparo de alertas contextualizados em 1 toque: Executor da tarefa → Chefe imediato / Encarregado → Gerente de Operações (GO) → Diretor Regional da rede.',
      },
      {
        titulo: 'Login Direto na Agenda da Loja',
        descricao:
          'Acesso sem atritos: encarregados e líderes vão direto para a Agenda de execução ao entrar no sistema, focando imediatamente nas prioridades do turno.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: não é uma lista estática de tarefas. É um motor dinâmico que comanda o ritmo do piso e garante validação gerencial antes da conclusão.',
    dicaVendaInterna:
      'Explique que a maioria dos apps é "passiva" (o operador só preenche se quiser). O VivaVarejo é "ativo": avisa quem deve fazer, cobra no WhatsApp se atrasar e exige aprovação gerencial.',
  },
  {
    id: 'chamados_areas',
    numero: 5,
    titulo: 'Chamados Instantâneos das Áreas Corporativas',
    subtitulo:
      'Compras, Abastecimento, RH, Logística, Marketing, Manutenção e Prevenção conectados à loja',
    icone: Layers,
    beneficioPrincipal:
      'Integração total da matriz com as filiais: demandas dos setores centrais entram diretamente no Motor de Prioridade da loja com criticidade e prazo.',
    itensDetalhados: [
      {
        titulo: 'Canais Especializados para Todas as Áreas da Empresa',
        descricao:
          'Compras, Abastecimento, Logística, Marketing, RH, Financeiro, Manutenção, Prevenção de Perdas e Operações abrem chamados oficiais direto para as lojas.',
      },
      {
        titulo: 'Entrada Automática no Motor de Prioridade da Loja',
        descricao:
          'Em vez de ficarem perdidos em caixas de e-mail, os chamados entram na fila de execução diária do gerente de loja com nível de criticidade (Baixa, Média, Alta).',
      },
      {
        titulo: 'Comunicação Ágil em Cenários Críticos',
        descricao:
          'Avisos de frete (ex.: caminhão atrasado na doca), alteração urgente de precificação ou troca emergencial de comunicação de marketing chegam ao encarregado na hora.',
      },
      {
        titulo: 'Notificações Estruturadas via WhatsApp',
        descricao:
          'Aviso formatado com loja, setor, solicitante e descrição do chamado enviado direto ao responsável, agilizando respostas operacionais.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: encerra o abismo entre o escritório central e a ponta da loja, acabando com a perda de prazos e o caos de grupos de mensagens.',
    dicaVendaInterna:
      'Converse com o Diretor de Operações sobre a dor de alinhar marketing ou logística com os gerentes. Ele vai adorar ver que os chamados caem com prazo na Agenda do gerente.',
  },
  {
    id: 'dashboard_eficiencia',
    numero: 6,
    titulo: 'Dashboard de Eficiência & Indicadores de Negócio',
    subtitulo:
      'Todo tipo de trabalho (rotinas, chamados, validades, perdas, visitas) e correlação com vendas/quebras',
    icone: BarChart3,
    destaqueBadge: 'Visão Executiva & ERP',
    beneficioPrincipal:
      'Painel analítico em tempo real: compara a eficiência por Setor, Líder e Loja e cruza o cumprimento de processos com os resultados comerciais da rede.',
    itensDetalhados: [
      {
        titulo: 'Consolidação de Todo Tipo de Trabalho da Loja',
        descricao:
          'Métricas unificadas de rotinas operacionais, chamados corporativos, planos 5W2H, tarefas de validade, apontamentos de perdas e visitas de promotores.',
      },
      {
        titulo: 'Comparativo por Setor, por Líder e por Loja',
        descricao:
          'Gráficos sóbrios de barras e rosca de aderência permitindo enxergar quais departamentos e líderes apresentam melhor disciplina de execução na unidade.',
      },
      {
        titulo: '6 Indicadores de Negócio em Tempo Real',
        descricao:
          'Acompanhamento de Vendas, Quebras, Rupturas, Itens sem Vendas, Estoque Virtual e Estoques Parados (>45 dias) com comparativo ao período anterior.',
      },
      {
        titulo: 'Correlação Estatística Comprovada: Execução × Perdas',
        descricao:
          'O sistema evidencia o reflexo das rotinas nos indicadores: setores com conclusão ≥ 90% alcançam até 28% menos quebras e 35% menos rupturas.',
      },
      {
        titulo: 'Campos Prontos para Integração com ERP / BI',
        descricao:
          'Estrutura preparada para receber os números do ERP da rede e alimentar de volta a retaguarda com os dados auditados de piso de loja.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: comprova cientificamente para os acionistas que a disciplina de loja protege a margem e impulsiona as vendas.',
    dicaVendaInterna:
      'Mostre ao Diretor Financeiro ou CEO o banner de correlação. O VivaVarejo não é "custo de software", é ferramenta de geração de margem e redução de ruptura.',
  },
  {
    id: 'relatorios_gestao',
    numero: 7,
    titulo: 'Relatórios de Gestão & Relatório Loja a Loja',
    subtitulo:
      'Filtros Hoje/Semana/Mês, % conclusão, validação gerencial, pontualidade, ranking e exportação CSV',
    icone: FileText,
    beneficioPrincipal:
      'Visão de águia para Diretores de Operações e Gerentes Regionais: compare dezenas de lojas lado a lado em poucos segundos.',
    itensDetalhados: [
      {
        titulo: 'Filtros Flexíveis: Hoje, Esta Semana e Este Mês',
        descricao:
          'Alternância instantânea de visão para acompanhar a operação do turno corrente ou analisar tendências de disciplina de fechamento do mês.',
      },
      {
        titulo: 'Tríade de Conformidade: Conclusão, Validação e Pontualidade',
        descricao:
          'Métricas separadas para avaliar: volume de tarefas executadas, taxa de validação/aprovação pela liderança e percentual de entrega estritamente no horário previsto.',
      },
      {
        titulo: 'Relatório Loja a Loja Comparativo & Ranking da Rede',
        descricao:
          'Tabela comparativa de todas as lojas da rede com classificação automática por índice de entrega, destacando as filiais referências e as que demandam apoio.',
      },
      {
        titulo: 'Exportação Consolidada em Planilhas CSV',
        descricao:
          'Download em 1 clique de planilhas formatadas para alimentação de apresentações de diretoria, conselhos de administração e reuniões de resultados.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: consolida a disciplina operacional da rede inteira em uma única tela, dispensando ligações diárias para conferir se a loja abriu nos conformes.',
    dicaVendaInterna:
      'Em redes de 3 ou mais lojas, o Diretor de Operações perde manhãs inteiras ligando para gerentes. O Relatório Loja a Loja dá essa resposta em 10 segundos.',
  },
  {
    id: 'erp_execucao',
    numero: 8,
    titulo: 'Da Informação à Execução: A Camada Entre o ERP e a Loja',
    subtitulo:
      'O ERP/BI mostra o passado; o VivaVarejo transforma planilha e indicador em rotina no chão de loja',
    icone: FileSpreadsheet,
    beneficioPrincipal:
      'A ponte definitiva que faltava no varejo: converte relatórios e metas frias da retaguarda em tarefas práticas com dono, horário e acompanhamento.',
    itensDetalhados: [
      {
        titulo: 'Superação do Abismo Entre a Matriz e o Piso de Loja',
        descricao:
          'O ERP e o BI revelam o que deu errado ontem ou no mês passado. O VivaVarejo garante o que precisa ser executado rigorosamente nas próximas horas de hoje.',
      },
      {
        titulo: 'Transformação de Indicadores em Rotinas Vivas',
        descricao:
          'Metas de vendas, alertas de quebra e produtos em risco de vencimento viram rotinas operacionais automáticas distribuídas para os cargos certos da loja.',
      },
      {
        titulo: 'Importação Ágil de Excel (.xlsx) e Colagem Direta de CSV',
        descricao:
          'Importador flexível de arquivos Excel e recurso de colagem direta de dados de rotinas e validades extraídos do seu ERP, com validação e prévia linha a linha.',
      },
      {
        titulo: 'Mecanismo de Desduplicação Inteligente',
        descricao:
          'Atualiza horários, cargos e parâmetros de tarefas existentes sem duplicar registros, preservando o histórico e score das execuções passadas da loja.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: o lojista não precisa trocar o ERP atual nem contratar consultorias de integração caras para começar a ter disciplina operacional.',
    dicaVendaInterna:
      'Nunca critique o ERP do cliente (Totvs, Linx, Bluesoft, Protheus etc.). Valorize: "Seu ERP é fantástico para armazenar dados e faturamento. O VivaVarejo é quem garante que o operador execute o que o ERP planejou".',
  },
  {
    id: 'mobile_real',
    numero: 9,
    titulo: 'Usabilidade Mobile Real: PWA Instalável no Celular',
    subtitulo:
      'Rolagem natural em retrato sem virar o aparelho, tabelas com scroll lateral e fotos com zoom',
    icone: Smartphone,
    destaqueBadge: 'PWA Leve & Rápido',
    beneficioPrincipal:
      'Construído para o uso real em piso de loja: funciona no smartphone de qualquer operador com rapidez, sem burocracias de lojas de aplicativos.',
    itensDetalhados: [
      {
        titulo: 'PWA Instalável no iPhone e Android sem Lojas de App',
        descricao:
          'Instalação em 1 toque diretamente do navegador, sem consumir armazenamento pesado do aparelho e com atualizações automáticas instantâneas.',
      },
      {
        titulo: 'Uso Natural em Modo Retrato (Vertical)',
        descricao:
          'Interface 100% pensada para uma mão: o operador nunca precisa girar o aparelho para ler tarefas, preencher formulários ou aprovar itens.',
      },
      {
        titulo: 'Tabelas com Rolagem Lateral Fluida',
        descricao:
          'Tabelas comparativas e relatórios adaptados com scroll horizontal seguro, preservando o cabeçalho e impedindo que o layout da página quebre no mobile.',
      },
      {
        titulo: 'Formulários com Botões Sempre Acessíveis & Fotos com Zoom',
        descricao:
          'Botões de ação com altura mínima confortável (min-h-[40px]), visualizador de fotos em tela cheia com zoom até 300% para auditar detalhes de gôndola e rótulos.',
      },
    ],
    diferencialExclusivo:
      'Diferencial exclusivo: taxa de adoção espontânea pelas equipes de loja, eliminando a resistência comum de aplicativos corporativos lentos e pesados.',
    dicaVendaInterna:
      'Faça a demonstração no próprio celular do cliente. Ao ver que é rápido, não precisa baixar nada na Google Play/App Store e funciona na vertical, a aceitação é unânime.',
  },
]

export function MaterialVendaAba() {
  const { toast } = useToast()
  const [versao, setVersao] = useState<VersaoMaterial>('cliente')
  const [copiado, setCopiado] = useState(false)

  const isCliente = versao === 'cliente'

  // Impressão / Salvar em PDF (otimizado para Mobile iOS Safari e Desktop)
  // Disparo 100% síncrono no mesmo tick do clique/toque, sem estados intermediários
  // que causem re-render, reflow ou mensagens na tela do celular antes de abrir.
  const handlePrint = () => {
    const originalTitle = document.title
    document.title = 'VivaVarejo'

    const cleanup = () => {
      document.title = originalTitle
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    try {
      window.print()
    } catch (err) {
      console.error('Falha ao acionar window.print():', err)
      cleanup()
      toast({
        title: 'Não foi possível abrir o diálogo de impressão',
        description: 'Tente usar o botão de Compartilhar Link ou Enviar pelo WhatsApp.',
        variant: 'destructive',
      })
    }

    // Fallback de segurança para restaurar o título após o retorno do diálogo
    setTimeout(() => {
      if (document.title === 'VivaVarejo') {
        document.title = originalTitle
      }
    }, 1000)
  }

  // Obter link direto canônico para envio (produção sempre)
  const getShareUrl = () => {
    return getCanonicalShareUrl('/admin')
  }

  const getShareText = () => {
    const link = getShareUrl()
    if (isCliente) {
      return (
        'VivaVarejo — Sistema Operacional de Loja & Prevenção de Perdas:\n\n' +
        'Conheça por que o VivaVarejo é a camada de execução entre o ERP e o chão de loja para supermercados, farmácias, moda, açougues e todo o varejo.\n\n' +
        'Acesse pelo link:\n' +
        link
      )
    }
    return (
      'VivaVarejo — Apresentação Comercial, Matriz de Diferenciais e Pitch:\n\n' +
      'Acesse pelo link:\n' +
      link
    )
  }

  // Compartilhar Nativo (navigator.share com fallback para cópia)
  const handleNativeShare = async () => {
    const result = await shareVivaVarejo({
      title: isCliente ? 'Apresentação Comercial VivaVarejo' : 'Guia de Soluções VivaVarejo',
      text: isCliente
        ? 'VivaVarejo — Da informação à execução no chão de loja.'
        : 'VivaVarejo — Sistema Operacional de Loja & Prevenção de Perdas.',
      pathOrUrl: '/admin',
      onCopied: () => {
        setCopiado(true)
        toast({
          title: 'Link copiado!',
          description: 'O link oficial VivaVarejo foi copiado para sua área de transferência.',
        })
        setTimeout(() => setCopiado(false), 2500)
      },
      onError: () => {
        toast({
          title: 'Erro ao copiar',
          description: 'Não foi possível copiar o link automaticamente.',
          variant: 'destructive',
        })
      },
    })

    if (result === 'copied') {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  // Copiar link oficial
  const handleCopyLink = async () => {
    try {
      const url = getShareUrl()
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast({
        title: 'Link copiado!',
        description: 'O link oficial VivaVarejo foi copiado para sua área de transferência.',
      })
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie o endereço oficial: ' + getShareUrl(),
        variant: 'destructive',
      })
    }
  }

  // Enviar direto via WhatsApp (usa wa.me com target _blank e fallback seguro)
  const handleWhatsAppShare = () => {
    const mensagem = encodeURIComponent(getShareText())
    const waUrl = `https://wa.me/?text=${mensagem}`
    const win = window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!win) {
      window.location.href = waUrl
    }
  }

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* =========================================================================
          BARRA DE AÇÃO RÁPIDA FIXA/DESTACADA PARA MOBILE E DESKTOP (Print hidden)
         ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-xs space-y-4 print:hidden">
        {/* Cabeçalho do Card com seletor de versão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB]">
                Material de Vendas Oficial
              </span>

              {/* SELO DINÂMICO QUE REFLETE O ESTADO SELECIONADO */}
              {isCliente ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Versão Cliente (Comercial Limpa)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Versão Interna (Equipe & Pitch)</span>
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-[#1F2937] tracking-tight mt-1.5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0" />
              <span>VivaVarejo: Todas as Ferramentas & Diferenciais Atualizados</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Material revisado: Promotores com comprador e WhatsApp, perdas multissetorial, rotinas
              por segmento, Agenda com motor de prioridade, chamados corporativos e dashboard de
              eficiência.
            </p>
          </div>

          {/* SELETOR INTERNO VS CLIENTE COM BOTÕES GRANDES (Min 40px) */}
          <div className="flex items-center bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E7EB] self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setVersao('cliente')}
              className={`flex-1 sm:flex-none px-3.5 py-2 min-h-[40px] rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isCliente
                  ? 'bg-white text-[#2563EB] shadow-2xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
              title="Material comercial limpo, sem anotações internas ou estratégias confidenciais"
            >
              <Eye className="w-4 h-4" />
              <span>Versão Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setVersao('interna')}
              className={`flex-1 sm:flex-none px-3.5 py-2 min-h-[40px] rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                !isCliente
                  ? 'bg-white text-[#1F2937] shadow-2xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
              title="Material completo com notas estratégicas de pitch e inteligência de concorrentes"
            >
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Versão Interna</span>
            </button>
          </div>
        </div>

        {/* Dica explicativa do modo selecionado */}
        <div className="text-xs rounded-lg p-3 flex items-center gap-2.5 border bg-gray-50 border-gray-200 text-[#4B5563]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            {isCliente ? (
              <>
                <strong>Versão Cliente Ativa:</strong> Proposta comercial e técnica de alto valor,
                sem anotações internas, sem credenciais demo e sem nomes de terceiros. Perfeita para
                projetar em reuniões ou salvar em PDF para o cliente.
              </>
            ) : (
              <>
                <strong>Versão Interna (Equipe) Ativa:</strong> Inclui notas de pitch comercial,
                análise da concorrência, pontos de fechamento e argumentos por dor do lojista. Selo{' '}
                <span className="font-bold text-amber-900">[Confidencial]</span> em cada bloco.
              </>
            )}
          </span>
        </div>

        {/* BARRA DE AÇÕES RÁPIDAS (Imprimir / Salvar PDF / Compartilhar) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB]">
          {/* Botão Principal: Imprimir / Salvar em PDF (SEMPRE ACESSÍVEL) */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] flex-1 sm:flex-none cursor-pointer"
            title="Abrir diálogo de impressão do sistema / Salvar PDF (funciona no celular e computador)"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Gerar PDF</span>
          </button>

          {/* Botão Compartilhar Nativo */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[42px] flex-1 sm:flex-none"
            title="Compartilhar material nativamente pelo celular"
          >
            <Share2 className="w-4 h-4 text-[#2563EB]" />
            <span>Compartilhar</span>
          </button>

          {/* Botão Copiar Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[42px]"
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
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[42px] flex-1 sm:flex-none"
            title="Enviar material diretamente pelo WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          DOCUMENTO COMPLETO IMPRIMÍVEL (A4 controlado, cabeçalho VivaVarejo sem Skip)
         ========================================================================= */}
      <div
        id="material-venda-conteudo"
        className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:space-y-3.5"
      >
        {/* Header do Material Impresso — EXCLUSIVAMENTE VIVAVAREJO */}
        <div className="border-b border-[#E5E7EB] pb-6 print:pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 print:w-9 print:h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm shrink-0">
              <div className="w-5 h-5 print:w-4 print:h-4 border-2 border-white rotate-45 transform" />
            </div>
            <div>
              <div className="text-lg print:text-base font-extrabold tracking-wider uppercase text-[#1F2937]">
                VivaVarejo
              </div>
              <div className="text-xs print:text-[10px] text-[#6B7280]">
                Sistema Operacional de Loja & Prevenção de Perdas no Varejo Físico
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 print:px-2 print:py-0.5 rounded-full text-xs print:text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
              Apresentação de Soluções & Guia de Diferenciais
            </span>
            <div className="text-[11px] print:text-[9.5px] text-[#6B7280] mt-1 print:mt-0.5 flex items-center sm:justify-end gap-1.5">
              <span>A camada de execução entre o ERP e o chão de loja</span>
              {!isCliente && (
                <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                  [Uso Interno Confidencial]
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alerta de Modo Interno (quando ativo) */}
        {!isCliente && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5 print-break-inside-avoid">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Atenção: Visualizando Versão Interna da Equipe</div>
              <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Este material inclui notas estratégicas de pitch, dados de inteligência competitiva,
                argumentos para cada módulo e dicas de fechamento. Para enviar ou projetar ao
                cliente, alterne para a <strong>&ldquo;Versão Cliente&rdquo;</strong> para ocultar
                anotações confidenciais.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABERTURA E PILARES — VERSÃO CLIENTE (TEXTO APROVADO VERBATIM)
            OU VERSÃO INTERNA (9 SOLUÇÕES COMPLETAS COM NOTAS DE PITCH CONFIDENCIAIS)
           ========================================================================= */}
        {isCliente ? (
          <div className="space-y-6 print:space-y-3.5">
            {/* Abertura Verbatim Versão Cliente */}
            <div className="space-y-3 print:space-y-1.5 print-break-inside-avoid">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 print:px-2 print:py-0.5 rounded-full text-xs print:text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                <Workflow className="w-3.5 h-3.5 print:w-3 print:h-3" />
                <span>Da informação à execução no chão de loja</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl print:text-lg font-extrabold text-[#1F2937] tracking-tight">
                  VivaVarejo
                </h1>
                <p className="text-base sm:text-lg print:text-sm font-semibold text-[#2563EB] mt-0.5">
                  Da informação à execução no chão de loja.
                </p>
              </div>
              <p className="text-xs sm:text-sm print:text-xs text-[#4B5563] leading-relaxed max-w-3xl">
                A VivaVarejo transforma indicadores, demandas e problemas operacionais em ações
                práticas — com responsável, prioridade, prazo e acompanhamento em tempo real.
              </p>
            </div>

            {/* Os 5 Pilares Verbatim: O que a VivaVarejo resolve */}
            <div className="space-y-4 print:space-y-2 pt-2 border-t border-[#E5E7EB]">
              <div>
                <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                  Entrega de Valor
                </span>
                <h2 className="text-lg print:text-sm font-extrabold text-[#1F2937] tracking-tight mt-0.5">
                  O que a VivaVarejo resolve
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
                {/* 1. Rotina operacional */}
                <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid print:bg-white print:border-gray-300">
                  <div className="flex items-start gap-3 print:gap-2">
                    <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                        Rotina operacional
                      </h3>
                      <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed mt-1 print:mt-0.5">
                        O dia da loja organizado por prioridade e horário, com execução, atraso,
                        aprovação e plano de ação automático.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Matriz × Loja */}
                <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid print:bg-white print:border-gray-300">
                  <div className="flex items-start gap-3 print:gap-2">
                    <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                        Matriz × Loja
                      </h3>
                      <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed mt-1 print:mt-0.5">
                        Compras, RH, Logística, Marketing, Manutenção e Prevenção abrem demandas
                        direto na fila de execução da loja. Nada mais se perde em e-mails e grupos
                        de WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Promotores e Fornecedores */}
                <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid print:bg-white print:border-gray-300">
                  <div className="flex items-start gap-3 print:gap-2">
                    <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                        Promotores e Fornecedores
                      </h3>
                      <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed mt-1 print:mt-0.5">
                        Presença, abastecimento, validade, layout e registro fotográfico de cada
                        visita — com alerta ao comprador quando algo sair do combinado.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Prevenção de perdas */}
                <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid print:bg-white print:border-gray-300">
                  <div className="flex items-start gap-3 print:gap-2">
                    <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h3 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                        Prevenção de perdas
                      </h3>
                      <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed mt-1 print:mt-0.5">
                        Quebras por motivo e valor, inventários rotativos, controle de validade e
                        acuracidade em acompanhamento contínuo.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Gestão e indicadores */}
                <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid print:bg-white print:border-gray-300 md:col-span-2">
                  <div className="flex items-start gap-3 print:gap-2">
                    <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs shrink-0 mt-0.5">
                      5
                    </div>
                    <div>
                      <h3 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                        Gestão e indicadores
                      </h3>
                      <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed mt-1 print:mt-0.5">
                        Uma única visão: execução, pontualidade, validação, chamados, perdas,
                        rupturas e vendas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* O grande diferencial Verbatim */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 print:p-3 space-y-3 print:space-y-1.5 print-break-inside-avoid print:bg-white print:border-gray-300">
              <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                Posicionamento Estratégico
              </span>
              <h2 className="text-base sm:text-lg print:text-sm font-extrabold text-[#1F2937] tracking-tight">
                O grande diferencial
              </h2>
              <div className="space-y-2 print:space-y-1 text-xs sm:text-sm print:text-xs text-[#1F2937] leading-relaxed">
                <p>
                  ERP e BI mostram o que aconteceu. A VivaVarejo garante que o que precisa ser feito
                  seja feito — criando a camada operacional entre a retaguarda e o chão de loja.
                </p>
                <p className="font-semibold text-[#2563EB]">
                  Resultado: mais velocidade e disciplina operacional, com menos gerente atrás da
                  tela e mais foco na execução dentro da loja.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VERSÃO INTERNA (COM NOTAS CONFIDENCIAIS, PITCH E 9 SOLUÇÕES)
             ========================================================================= */
          <div className="space-y-6">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                <Workflow className="w-3.5 h-3.5" />
                <span>Da Informação à Execução: O Sistema Operacional da Loja</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
                Por que o VivaVarejo supera checklists tradicionais e planilhas passivas?
              </h1>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Checklists genéricos são formulários estáticos que o piso de loja abandona em poucas
                semanas. O VivaVarejo é a <strong>camada viva de execução operacional</strong>:
                conecta os dados da retaguarda (ERP/BI) com quem abre e fecha a loja. Com rotinas
                horárias com dono, prevenção ativa de perdas em rodízio, controle rigoroso de
                promotores integrado ao comprador, chamados corporativos e alertas escalonados no
                WhatsApp, garantimos que o padrão operacional aconteça todos os dias sem desvios.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  Soluções Integradas (Uso Interno)
                </span>
                <h2 className="text-lg font-extrabold text-[#1F2937] tracking-tight mt-0.5">
                  Tudo o que a plataforma VivaVarejo entrega à sua operação
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Uma arquitetura completa para lojistas, encarregados, gerentes de loja, GOs e
                  diretores de rede com notas de pitch e concorrência.
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-[#1F2937] leading-tight">
                                {solucao.numero}. {solucao.titulo}
                              </h3>
                              {solucao.destaqueBadge && (
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#2563EB] text-white">
                                  {solucao.destaqueBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
                              {solucao.subtitulo}
                            </p>
                          </div>
                        </div>

                        {/* Benefício Principal */}
                        <div className="text-xs font-semibold text-[#1F2937] bg-white print:bg-blue-50/40 p-2.5 rounded-lg border border-[#E5E7EB] print:border-blue-100 leading-snug">
                          {solucao.beneficioPrincipal}
                        </div>

                        {/* Itens Detalhados: Título em Negrito + Descrição Embaixo */}
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
                      {solucao.dicaVendaInterna && (
                        <div className="pt-2 border-t border-[#E5E7EB]/80 print-break-inside-avoid">
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-200 leading-relaxed">
                            <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] block mb-0.5">
                              [Confidencial • Dica de Pitch & Fechamento]:
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
          </div>
        )}

        {/* =========================================================================
            MATRIZ COMPARATIVA EXPANDIDA & ESPECÍFICA (Tabela com overflow contido)
           ========================================================================= */}
        <div className="space-y-3 print:space-y-1.5 pt-4 print:pt-2 border-t border-[#E5E7EB]">
          <div>
            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
              Comparativo Técnico de Mercado
            </span>
            <h2 className="text-lg print:text-sm font-extrabold text-[#1F2937] tracking-tight mt-0.5">
              Matriz Comparativa: VivaVarejo × Checklists Tradicionais
            </h2>
            <p className="text-xs print:text-[10.5px] text-[#6B7280]">
              Veja no detalhe como cada capacidade resolve as dores do dia a dia do varejo físico
            </p>
          </div>

          <div className="overflow-x-auto print:overflow-visible rounded-xl border border-[#E5E7EB] print:border-gray-300">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] print:bg-gray-100 border-b border-[#E5E7EB] print:border-gray-300 text-[#1F2937]">
                  <th className="p-3.5 print:p-1.5 font-bold uppercase tracking-wider text-xs print:text-[10px] w-[36%]">
                    Diferencial / Capacidade Operacional
                  </th>
                  <th className="p-3.5 print:p-1.5 font-bold uppercase tracking-wider text-xs print:text-[10px] bg-blue-50/80 print:bg-blue-100/70 text-[#2563EB] border-x border-[#E5E7EB] print:border-gray-300 w-[34%]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      <span>VivaVarejo</span>
                    </div>
                  </th>
                  <th className="p-3.5 print:p-1.5 font-bold uppercase tracking-wider text-xs print:text-[10px] text-[#6B7280] w-[30%]">
                    Sistemas Tradicionais
                    <span className="block text-[10px] print:text-[9px] font-normal lowercase tracking-normal text-[#9CA3AF]">
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
                    <td className="p-3.5 print:p-1.5 align-top">
                      <div className="font-bold text-[#1F2937] leading-tight print:text-[11px]">
                        {item.criterio}
                      </div>
                      <div className="text-[11px] print:text-[9.5px] text-[#6B7280] mt-0.5 leading-snug">
                        {item.subtexto}
                      </div>
                    </td>

                    {/* VivaVarejo */}
                    <td className="p-3.5 print:p-1.5 bg-blue-50/30 print:bg-blue-50/20 border-x border-[#E5E7EB] print:border-gray-300 align-top">
                      <div className="flex items-start gap-2 print:gap-1.5">
                        <div className="w-5 h-5 print:w-4 print:h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 print:bg-emerald-50">
                          <Check className="w-3.5 h-3.5 print:w-3 print:h-3 stroke-[3]" />
                        </div>
                        <div className="space-y-1 print:space-y-0.5">
                          <div className="text-xs print:text-[10.5px] font-semibold text-[#1F2937] leading-snug">
                            {item.vivavarejo.detalhe}
                          </div>
                          {/* Nota Interna da Equipe (oculta na versão cliente) */}
                          {!isCliente && item.vivavarejo.notaInterna && (
                            <div className="text-[11px] print:text-[9.5px] font-normal text-amber-900 bg-amber-50 p-1.5 print:p-1 rounded border border-amber-200 mt-1 leading-snug print:bg-amber-50">
                              <span className="font-bold text-amber-950 uppercase text-[10px] print:text-[9px]">
                                [Confidencial • Pitch]:{' '}
                              </span>
                              <span>{item.vivavarejo.notaInterna}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sistemas Tradicionais */}
                    <td className="p-3.5 print:p-1.5 align-top text-[#4B5563]">
                      <div className="flex items-start gap-2 print:gap-1.5">
                        {item.tradicionais.status === true ? (
                          <div className="w-5 h-5 print:w-4 print:h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 print:w-3 print:h-3 stroke-[2.5]" />
                          </div>
                        ) : item.tradicionais.status === 'parcial' ? (
                          <div className="w-5 h-5 print:w-4 print:h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs print:text-[10px] font-bold">
                            ~
                          </div>
                        ) : (
                          <div className="w-5 h-5 print:w-4 print:h-4 rounded-full bg-gray-200 text-[#6B7280] flex items-center justify-center shrink-0 mt-0.5">
                            <Minus className="w-3 h-3 print:w-2.5 print:h-2.5 stroke-[2.5]" />
                          </div>
                        )}
                        <div className="space-y-1 print:space-y-0.5">
                          <div className="text-xs print:text-[10.5px] text-[#6B7280] leading-snug">
                            {item.tradicionais.detalhe}
                          </div>
                          {/* Nota Interna da Equipe (oculta na versão cliente) */}
                          {!isCliente && item.tradicionais.notaInterna && (
                            <div className="text-[11px] print:text-[9.5px] font-normal text-amber-900 bg-amber-50 p-1.5 print:p-1 rounded border border-amber-200 mt-1 leading-snug print:bg-amber-50">
                              <span className="font-bold text-amber-950 uppercase text-[10px] print:text-[9px]">
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
        <div className="space-y-4 print:space-y-2 pt-4 print:pt-2 border-t border-[#E5E7EB] print-break-inside-avoid">
          <div>
            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
              Pilares Estratégicos
            </span>
            <h3 className="text-lg print:text-sm font-extrabold text-[#1F2937] tracking-tight mt-0.5">
              Por que a liderança de rede escolhe o VivaVarejo?
            </h3>
            <p className="text-xs print:text-[10.5px] text-[#6B7280]">
              Três motivos incontestáveis que transformam a rotina de quem opera o chão de loja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            {/* Argumento 1 */}
            <div className="bg-[#F7F7F5] print:bg-white border border-[#E5E7EB] print:border-gray-300 rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid">
              <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs">
                1
              </div>
              <h4 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                Foco 100% no Varejo Real de Piso
              </h4>
              <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed">
                Construído para o chão de loja: cortes horários de turno, prevenção de perdas
                multissetorial, controle rigoroso de promotores e interface leve para celular.
              </p>
            </div>

            {/* Argumento 2 */}
            <div className="bg-[#F7F7F5] print:bg-white border border-[#E5E7EB] print:border-gray-300 rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid">
              <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs">
                2
              </div>
              <h4 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                Implantação Imediata com Modelos Prontos
              </h4>
              <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed">
                Zero tempo perdido: biblioteca de rotinas por segmento e importação fácil do ERP
                permitem que a equipe execute as rotinas no dia 1, sem semanas de consultoria.
              </p>
            </div>

            {/* Argumento 3 */}
            <div className="bg-[#F7F7F5] print:bg-white border border-[#E5E7EB] print:border-gray-300 rounded-xl p-5 print:p-2.5 space-y-2.5 print:space-y-1 print-break-inside-avoid">
              <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm print:text-xs">
                3
              </div>
              <h4 className="text-sm print:text-xs font-bold text-[#1F2937] leading-tight">
                Geração Direta de Margem e Disciplina
              </h4>
              <p className="text-xs print:text-[11px] text-[#4B5563] leading-relaxed">
                Workflow com validação gerencial, cadeia de WhatsApp e redução estatística de 28%
                nas quebras e 35% nas rupturas protegem o lucro líquido da empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Assinatura Final de Fechamento em Destaque */}
        {isCliente && (
          <div className="bg-[#2563EB]/5 border-2 border-[#2563EB]/30 rounded-2xl p-6 sm:p-7 print:p-3 text-center space-y-3 print:space-y-1.5 print-break-inside-avoid print:bg-white print:border-[#2563EB]">
            <div className="text-xl sm:text-2xl print:text-base font-black text-[#1F2937] tracking-wider uppercase">
              VivaVarejo
            </div>
            <div className="inline-block px-4 py-2 print:px-3 print:py-1 rounded-xl bg-[#2563EB] text-white font-extrabold text-sm sm:text-base print:text-xs tracking-wide shadow-xs print:bg-white print:text-[#2563EB] print:border print:border-[#2563EB]">
              Informação → Prioridade → Ação → Acompanhamento → Resultado.
            </div>
            <p className="text-xs print:text-[11px] text-[#4B5563] max-w-xl mx-auto pt-1 print:pt-0">
              A camada de execução definitiva que transforma números e metas em disciplina no chão
              de loja.
            </p>
          </div>
        )}

        {/* Rodapé da Apresentação */}
        <div className="pt-6 border-t border-[#E5E7EB] print:pt-2 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-3 print:gap-1 text-xs print:text-[10px] text-[#6B7280] print-break-inside-avoid">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937]">VivaVarejo</span>
            <span>— Excelência em Operação de Varejo & Prevenção de Perdas</span>
          </div>
          <div>
            <span>
              {isCliente
                ? 'Material comercial exclusivo para apresentação a parceiros e clientes'
                : 'Material confidencial • Uso restrito da equipe comercial e operacional VivaVarejo'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          AÇÕES NO FIM DO MATERIAL (Print hidden) — SEMPRE VISÍVEL
         ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <span>Disponibilize o Material a Qualquer Momento</span>
          </h4>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Você está visualizando a{' '}
            <strong className="text-[#1F2937]">
              {isCliente
                ? 'Versão Cliente (Sem notas internas)'
                : 'Versão Interna (Com dicas e pitch)'}
            </strong>
            . Use as ações rápidas abaixo direto do celular ou computador:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Botão Salvar em PDF / Imprimir */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex-1 sm:flex-none min-h-[42px] cursor-pointer"
            title="Gerar PDF ou imprimir este material"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar em PDF</span>
          </button>

          {/* Botão Compartilhar Link */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[42px]"
            title="Compartilhar link pelo celular"
          >
            <Share2 className="w-4 h-4 text-[#2563EB]" />
            <span>Compartilhar</span>
          </button>

          {/* Botão Enviar WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors min-h-[42px]"
            title="Enviar pelo WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  )
}
