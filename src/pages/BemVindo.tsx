import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  User,
  ShoppingBag,
  UtensilsCrossed,
  Pill,
  Tv,
  Hammer,
  Sparkles,
  Dog,
  Store,
  Mail,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  Instagram,
  Linkedin,
} from 'lucide-react'
import { TipoPessoaCliente } from '@/types'
import { useContatosAtendimento } from '@/hooks/use-contatos-atendimento'

/**
 * Endereços de redes sociais do rodapé da landing page.
 * Versão sincronizada com os blocos completos da página institucional.
 */
const INSTAGRAM_URL = 'https://www.instagram.com/vivavarejo/'
const LINKEDIN_PERSONAL_URL = 'https://br.linkedin.com/in/dalvanifarias'

interface SegmentOption {
  id: string
  label: string
  icon: typeof ShoppingBag
  description: string
}

interface ExemploRotina {
  titulo: string
  descricao: string
}

const EXEMPLOS_ROTINAS_POR_SEGMENTO: Record<string, ExemploRotina[]> = {
  Açougue: [
    {
      titulo: 'Temperatura de câmara fria e balcão',
      descricao: 'Aferição matinal e vespertina das câmaras e balcões com registro de conformidade',
    },
    {
      titulo: 'Afiação/higienização de serras e moedores',
      descricao: 'Desmonte, sanitização química e conferência de segurança e afiação das lâminas',
    },
    {
      titulo: 'FIFO e maturação a vácuo',
      descricao:
        'Conferência de primeiro que entra, primeiro que sai e integridade das embalagens a vácuo',
    },
  ],
  Farmácia: [
    {
      titulo: 'Registro de temperatura da geladeira de medicamentos',
      descricao: 'Controle contínuo de termolábeis entre +2°C e +8°C com apontamento obrigatório',
    },
    {
      titulo: 'Auditoria de validade com alerta 90 dias',
      descricao: 'Varredura preventiva de lotes a vencer para evitar perdas e recolhimento prévio',
    },
    {
      titulo: 'Contagem de psicotrópicos SNGPC',
      descricao:
        'Conferência diária do armário restrito com conferência física versus livro/sistema',
    },
  ],
  'Padaria/Confeitaria': [
    {
      titulo: 'Higienização de fornos e masseiras',
      descricao: 'Checklist rigoroso de limpeza pós-forneio e esterilização dos tachos',
    },
    {
      titulo: 'Controle de fermentação e validade de fatiados',
      descricao:
        'Acompanhamento do tempo de câmara de fermentação e etiquetagem padrão de fatiados',
    },
  ],
  'Moda/Confecção': [
    {
      titulo: 'Vitrine e reposição por grade/tamanho',
      descricao:
        'Conferência do padrão visual de manequins e reposição ágil de numerações faltantes',
    },
    {
      titulo: 'Conferência de antifurto em peças de alto valor',
      descricao: 'Inspeção do travamento de sensores magnéticos em casacos, jeans e peças nobres',
    },
  ],
  'Pet Shop': [
    {
      titulo: 'Desinfecção do setor de banho e tosa',
      descricao: 'Higienização e esterilização de lâminas, baias e toalhas entre atendimentos',
    },
    {
      titulo: 'Auditoria de rações a granel',
      descricao: 'Controle de vedação, umidade, data de lote e rodízio FIFO nas caixas de granel',
    },
  ],
  'Restaurante/Alimentação': [
    {
      titulo: 'Etiquetagem e validade de pré-preparados',
      descricao: 'Identificação visual obrigatória com data de manipulação e validade secundária',
    },
    {
      titulo: 'Temperatura de cocção e banho-maria',
      descricao: 'Monitoramento térmico da pista quente acima de 60°C para garantia sanitária',
    },
  ],
  'Supermercado/Mercearia': [
    {
      titulo: 'Ruptura na abertura',
      descricao:
        'Varredura nos corredores principais antes de abrir as portas para reposição de gôndola',
    },
    {
      titulo: 'Validade de laticínios e frios',
      descricao: 'Auditoria de lotes próximos ao vencimento e aplicação do rodízio preventivo',
    },
  ],
}

const EXEMPLO_GENERICO_LOJA: ExemploRotina[] = [
  {
    titulo: 'Checklist de abertura e fechamento de caixa',
    descricao: 'Conferência de fundo de troco, suprimentos e batimento financeiro de encerramento',
  },
  {
    titulo: 'Auditoria de precificação e exposição de loja',
    descricao:
      'Conferência entre etiqueta de gôndola e leitor de código de barras para evitar atrito no caixa',
  },
  {
    titulo: 'Prevenção de quebras e controle de estoque',
    descricao:
      'Contagem rotativa dos itens de maior giro e verificação de itens danificados ou avariados',
  },
]

const SEGMENT_OPTIONS: SegmentOption[] = [
  {
    id: 'Supermercado/Mercearia',
    label: 'Supermercado/Mercearia',
    icon: UtensilsCrossed,
    description: 'Mercados, mercearias e minimercados',
  },
  {
    id: 'Açougue',
    label: 'Açougue / Carnes',
    icon: UtensilsCrossed,
    description: 'Casas de carnes, boutiques de cortes e peixarias',
  },
  {
    id: 'Padaria/Confeitaria',
    label: 'Padaria / Confeitaria',
    icon: Sparkles,
    description: 'Panificação, confeitarias, bistrôs e empórios',
  },
  {
    id: 'Farmácia',
    label: 'Farmácia / Drogaria',
    icon: Pill,
    description: 'Drogarias, farmácias e dermocosméticos',
  },
  {
    id: 'Moda/Confecção',
    label: 'Moda / Confecção',
    icon: ShoppingBag,
    description: 'Lojas de roupas, calçados e acessórios',
  },
  {
    id: 'Pet Shop',
    label: 'Pet Shop / Veterinária',
    icon: Dog,
    description: 'Pet shops, clínicas, rações e banho & tosa',
  },
  {
    id: 'Restaurante/Alimentação',
    label: 'Restaurante / Alimentação',
    icon: UtensilsCrossed,
    description: 'Restaurantes, lanchonetes e alimentação fora do lar',
  },
  {
    id: 'Outro',
    label: 'Outro Segmento',
    icon: Store,
    description: 'Materiais de construção, óticas, eletrônicos ou outros',
  },
]

export default function BemVindo() {
  const navigate = useNavigate()
  const { contatos } = useContatosAtendimento()

  // Funil de interesse em 2 passos
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoaCliente | null>(null)
  const [segmento, setSegmento] = useState<string | null>(null)
  const [outroSegmento, setOutroSegmento] = useState('')

  const isStep1Complete = tipoPessoa !== null
  const isStep2Complete =
    segmento !== null && (segmento !== 'Outro' || outroSegmento.trim().length > 0)
  const canContinue = isStep1Complete && isStep2Complete

  const handleContinue = () => {
    if (!canContinue) return
    const finalSegmento = segmento === 'Outro' ? outroSegmento.trim() || 'Outro' : segmento
    const params = new URLSearchParams()
    if (tipoPessoa) params.set('tipo', tipoPessoa)
    if (finalSegmento) params.set('segmento', finalSegmento)

    navigate(`/signup?${params.toString()}`, {
      state: {
        tipoPessoa,
        segmento: finalSegmento,
      },
    })
  }

  const handleScrollToInterest = () => {
    const el = document.getElementById('opcao-interesse')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex flex-col font-sans">
      {/* Header escuro premium com efeito de vidro fosco */}
      <header className="sticky top-0 z-40 w-full bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-white leading-tight">
              VivaVarejo
            </span>
          </Link>

          {/* Links no cabeçalho */}
          <nav className="flex items-center gap-2 sm:gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={handleScrollToInterest}
              className="px-3 py-1.5 text-[#94A3B8] hover:text-white hover:bg-[#151E30] rounded-lg transition-colors"
            >
              Tenho interesse
            </button>
            <Link
              to="/login"
              className="px-3.5 py-1.5 bg-[#151E30] hover:bg-[#1E293B] border border-[#24344E] hover:border-[#3B82F6] text-white hover:text-[#60A5FA] rounded-lg transition-colors font-semibold shadow-xs"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Seção Hero: Fundo escuro azul-marinho com gradiente sutil e destaque azul vibrante */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-20 px-4 sm:px-6 border-b border-[#1E293B] overflow-hidden bg-gradient-to-b from-[#0D1526] via-[#0B1220] to-[#0B1220]">
          {/* Luz ambiente azul suave no fundo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            {/* Chip pequeno no topo */}
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[#151E30] border border-[#24344E] text-xs sm:text-sm font-semibold text-[#60A5FA] shadow-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#3B82F6]" />
              <span className="leading-snug">
                Plataforma de Operação para Líderes, Gerentes e Redes
              </span>
            </div>

            {/* Título grande em negrito + Descrição de apoio */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
                A camada de execução entre o ERP e o chão de loja
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                O VivaVarejo é a plataforma de execução operacional no ponto de venda que organiza a
                rotina das equipes, direciona prioridades, comprova a execução com fotos e
                transforma o que acontece na loja em informação para gestão.
              </p>
            </div>

            {/* CTAs no padrão de destaque azul vibrante */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleScrollToInterest}
                className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
              >
                <span>Tenho interesse</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3 bg-[#151E30] hover:bg-[#1E293B] border border-[#24344E] hover:border-[#3B82F6] text-white font-semibold text-sm rounded-xl transition-all inline-flex items-center justify-center shadow-xs"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Três linhas com check */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-[#94A3B8]">
              <span className="inline-flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                Sem necessidade de cartão
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                Ativação em menos de 2 minutos
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                Compatível com celular e desktop
              </span>
            </div>
          </div>
        </section>
        {/* Nova Seção: O Desafio do Varejo (Inovação VivaVarejo — Da Informação à Execução) */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#0B1220] border-b border-[#1E293B]">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-[#151E30] border border-[#24344E] text-xs font-semibold text-[#60A5FA]">
              O Desafio do Varejo
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                O desafio do varejo não é falta de informação. É falta de execução.
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-3xl mx-auto leading-relaxed">
                ERP registra. BI mostra. WhatsApp distribui. E o gerente fica no meio, juntando tudo
                em vez de estar no chão de loja. O VivaVarejo é a camada que falta: transforma
                informação em prioridade, ação, responsável e prazo — e acompanha a execução até o
                problema estar resolvido.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
              <div className="inline-block px-5 py-2.5 rounded-xl bg-[#151E30] border border-[#24344E] text-xs sm:text-sm font-bold text-white shadow-sm">
                <span className="text-[#60A5FA]">
                  Informação → Prioridade → Ação → Acompanhamento → Resultado.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Banner de destaque tipo banner de referência (bloco azul vibrante com CTA) */}
        <section className="px-4 sm:px-6 py-6 bg-[#0B1220]">
          <div className="max-w-5xl mx-auto rounded-2xl bg-[#151E30] border border-[#2B3B56] p-6 sm:p-8 text-white shadow-xl shadow-blue-950/40 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 text-center sm:text-left relative z-10">
              <span className="text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[#93C5FD]">
                VivaVarejo em Campo
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-white">
                Tudo o que sua equipe precisa, em um só lugar.
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl leading-relaxed">
                Agenda de rotinas, controle de validade, presença de promotores com fotos e chamados
                5W2H no celular.
              </p>
            </div>
            <button
              type="button"
              onClick={handleScrollToInterest}
              className="relative z-10 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/30 transition-all shrink-0 hover:scale-105 border border-blue-400/30"
            >
              Começar agora
            </button>
          </div>
        </section>

        {/* Seção "O que você ganha no dia a dia" (6 itens com tiles coloridos) */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#0D1526] border-b border-[#1E293B]">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-[#151E30] border border-[#24344E] text-xs font-semibold text-[#60A5FA]">
                Operação Real de Loja
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                O que você ganha no dia a dia
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                Menos improviso e mais clareza para líderes, encarregados e equipe de chão de loja.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Item 1 - Azul */}
              <div className="bg-[#151E30] p-5 rounded-2xl border border-[#223049] shadow-sm flex items-start gap-3.5 hover:border-[#3B82F6]/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Rotinas estruturadas</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Saiba o que precisa ser feito, quando e como.
                  </p>
                </div>
              </div>

              {/* Item 2 - Roxo */}
              <div className="bg-[#151E30] p-5 rounded-2xl border border-[#223049] shadow-sm flex items-start gap-3.5 hover:border-purple-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Orientação operacional</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Tenha alternativas e recomendações para cada situação.
                  </p>
                </div>
              </div>

              {/* Item 3 - Verde */}
              <div className="bg-[#151E30] p-5 rounded-2xl border border-[#223049] shadow-sm flex items-start gap-3.5 hover:border-emerald-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Alertas imediatos</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Não espere o fechamento do mês para descobrir um problema.
                  </p>
                </div>
              </div>

              {/* Item 4 - Laranja */}
              <div className="bg-[#151E30] p-5 rounded-2xl border border-[#223049] shadow-sm flex items-start gap-3.5 hover:border-amber-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Acompanhamento</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Saiba o que foi realizado, o que está pendente e onde atuar.
                  </p>
                </div>
              </div>

              {/* Item 5 - Ciano */}
              <div className="bg-[#151E30] p-5 rounded-2xl border border-[#223049] shadow-sm flex items-start gap-3.5 hover:border-cyan-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Padronização</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Faça a operação acontecer de acordo com o processo definido.
                  </p>
                </div>
              </div>

              {/* Item 6 - Rosa/Vermelho */}
              <div className="bg-[#151E30] p-5 rounded-2xl border border-[#223049] shadow-sm flex items-start gap-3.5 hover:border-rose-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Gestão na ponta</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Transforme conhecimento operacional em ação dentro da loja.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Frase de Impacto */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#0B1220] border-b border-[#1E293B]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#151E30] border border-[#223049] rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-lg">
              <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-[#0B1220] border border-[#24344E] text-xs font-semibold text-[#60A5FA]">
                Operação em Tempo Real
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Não espere o relatório para agir
                </h2>
                <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                  O VivaVarejo acompanha a operação enquanto ela acontece, permitindo corrigir
                  desvios na hora.
                </p>
              </div>

              {/* Apoio visual com a lógica do produto */}
              <div className="pt-4 border-t border-[#223049] max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-xl bg-[#0B1220] border border-[#223049]">
                  <span className="block text-[10px] uppercase font-bold text-[#64748B]">
                    Relatório
                  </span>
                  <span className="font-semibold text-[#94A3B8]">é passado</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1220] border border-[#3B82F6]/40">
                  <span className="block text-[10px] uppercase font-bold text-[#60A5FA]">
                    Alerta
                  </span>
                  <span className="font-bold text-[#60A5FA]">é presente</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1220] border border-[#223049]">
                  <span className="block text-[10px] uppercase font-bold text-white">
                    Orientação
                  </span>
                  <span className="font-semibold text-white">é ação</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1220] border border-emerald-500/30">
                  <span className="block text-[10px] uppercase font-bold text-emerald-400">
                    Acompanhamento
                  </span>
                  <span className="font-semibold text-emerald-400">é gestão</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Seção: As Três Camadas do VivaVarejo */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#0D1526] border-b border-[#1E293B]">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-[#151E30] border border-[#24344E] text-xs font-semibold text-[#60A5FA]">
                Arquitetura Operacional
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Como o VivaVarejo funciona na prática
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
                Três camadas integradas que tiram o conhecimento da teoria e colocam a loja em
                movimento com foco em execução e resultados.
              </p>
            </div>

            <div className="space-y-4">
              {/* Camada 1: Conhecimento */}
              <div className="bg-[#151E30] p-5 sm:p-6 rounded-2xl border border-[#223049] shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#60A5FA] font-bold text-base flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
                    Camada 1
                  </div>
                  <h3 className="text-lg font-extrabold text-white">CONHECIMENTO</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    A experiência de varejo acumulada. As melhores práticas organizadas para apoiar
                    as decisões diárias da sua equipe.
                  </p>
                </div>
              </div>

              {/* Camada 2: Processo */}
              <div className="bg-[#151E30] p-5 sm:p-6 rounded-2xl border border-[#223049] shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold text-base flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                    Camada 2
                  </div>
                  <h3 className="text-lg font-extrabold text-white">PROCESSO</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Essa experiência transformada em rotinas, checklists, padrões, alternativas e
                    procedimentos práticos no dia a dia.
                  </p>
                </div>
              </div>

              {/* Camada 3: Inteligência Operacional */}
              <div className="bg-[#151E30] p-5 sm:p-6 rounded-2xl border border-blue-500/40 shadow-lg shadow-blue-950/30 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md">
                  3
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
                      Camada 3 • Em tempo real
                    </div>
                    <h3 className="text-lg font-extrabold text-white">INTELIGÊNCIA OPERACIONAL</h3>
                    <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 leading-relaxed">
                      Orientação ativa durante o turno com alertas em tempo real. O sistema dizendo
                      no momento exato:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="p-2.5 rounded-xl bg-[#0B1220] border border-[#223049] text-[#CBD5E1]">
                      “Aconteceu isso.”
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#93C5FD] font-medium">
                      “Faça isso agora.”
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0B1220] border border-[#223049] text-[#CBD5E1]">
                      “Se não puder fazer dessa maneira, utilize esta alternativa.”
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0B1220] border border-[#223049] text-[#CBD5E1]">
                      “Isso continua pendente.”
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium sm:col-span-2">
                      “Atenção: esse processo não foi executado.”
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#223049]">
                    <p className="text-xs font-semibold text-[#60A5FA]">
                      Isso é muito mais valioso que um dashboard: é suporte à decisão onde o
                      resultado acontece.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco "Opção de interesse" / Funil PF/CNPJ */}
        <section id="opcao-interesse" className="py-12 sm:py-16 px-4 sm:px-6 bg-[#0B1220]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#151E30] border border-[#223049] rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
              {/* Cabeçalho do Funil */}
              <div className="border-b border-[#223049] pb-5 space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#60A5FA]">
                  <span>Perfil de Atuação</span>
                  <span>•</span>
                  <span>Passo {isStep1Complete ? '2 de 2' : '1 de 2'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Perfil de Atuação
                </h2>
                <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                  Personalizamos as rotinas de acordo com o porte e o segmento da sua loja.
                </p>
              </div>

              {/* Passo 1: PF ou PJ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        isStep1Complete ? 'bg-[#2563EB] text-white' : 'bg-[#1E293B] text-[#94A3B8]'
                      }`}
                    >
                      1
                    </span>
                    <span>Você é pessoa física ou jurídica?</span>
                  </label>
                  {tipoPessoa && (
                    <span className="text-xs font-medium text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {tipoPessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Cartão PJ */}
                  <button
                    type="button"
                    onClick={() => setTipoPessoa('PJ')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tipoPessoa === 'PJ'
                        ? 'border-[#3B82F6] bg-blue-500/15 ring-2 ring-blue-500/40'
                        : 'border-[#223049] bg-[#0B1220] hover:border-[#3B82F6]/50 hover:bg-[#0D1526]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-[#60A5FA]">
                        CNPJ
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">Pessoa Jurídica / Rede</div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      Lojas físicas, redes com filiais, franquias, supermercados ou empresas
                      estruturadas.
                    </p>
                  </button>

                  {/* Cartão PF */}
                  <button
                    type="button"
                    onClick={() => setTipoPessoa('PF')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tipoPessoa === 'PF'
                        ? 'border-[#3B82F6] bg-blue-500/15 ring-2 ring-blue-500/40'
                        : 'border-[#223049] bg-[#0B1220] hover:border-[#3B82F6]/50 hover:bg-[#0D1526]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                        PF / MEI
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">Pessoa Física / Lojista</div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      Lojista independente, MEI, consultor de varejo ou profissional autônomo.
                    </p>
                  </button>
                </div>
              </div>

              {/* Passo 2: Segmento */}
              {isStep1Complete && (
                <div className="space-y-3 pt-4 border-t border-[#223049]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                          isStep2Complete
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#1E293B] text-[#94A3B8]'
                        }`}
                      >
                        2
                      </span>
                      <span>Qual é o segmento da sua loja?</span>
                    </label>
                    {segmento && (
                      <span className="text-xs font-medium text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {segmento === 'Outro' && outroSegmento ? outroSegmento : segmento}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SEGMENT_OPTIONS.map((seg, idx) => {
                      const Icon = seg.icon
                      const isSelected = segmento === seg.id
                      const tileColors = [
                        'bg-blue-500/10 border-blue-500/20 text-blue-300',
                        'bg-rose-500/10 border-rose-500/20 text-rose-300',
                        'bg-amber-500/10 border-amber-500/20 text-amber-300',
                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
                        'bg-purple-500/10 border-purple-500/20 text-purple-300',
                        'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
                        'bg-orange-500/10 border-orange-500/20 text-orange-300',
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
                      ]
                      const colorClass = tileColors[idx % tileColors.length]
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => setSegmento(seg.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#3B82F6] bg-blue-500/15 ring-2 ring-blue-500/30'
                              : 'border-[#223049] bg-[#0B1220] hover:border-[#3B82F6]/50 hover:bg-[#0D1526]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                isSelected ? 'bg-[#2563EB] text-white border-blue-400' : colorClass
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`text-xs font-bold leading-tight ${
                                isSelected ? 'text-[#60A5FA]' : 'text-white'
                              }`}
                            >
                              {seg.label}
                            </div>
                            <p className="text-[10px] text-[#94A3B8] mt-1 line-clamp-2">
                              {seg.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {segmento === 'Outro' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-white mb-1">
                        Especifique o segmento da sua loja:
                      </label>
                      <input
                        type="text"
                        value={outroSegmento}
                        onChange={(e) => setOutroSegmento(e.target.value)}
                        placeholder="Ex.: Ótica, Joalheria, Papelaria, Suplementos..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#0B1220] border border-[#24344E] focus:border-[#3B82F6] rounded-xl outline-none focus:ring-2 focus:ring-[#3B82F6]/25 text-white"
                      />
                    </div>
                  )}

                  {/* Modelos do segmento escolhido */}
                  {segmento && (
                    <div className="mt-3.5 p-4 rounded-xl bg-[#0B1220] border border-[#24344E] animate-in fade-in duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                          <span className="text-xs font-bold text-white">
                            Exemplos de rotinas de{' '}
                            {SEGMENT_OPTIONS.find((s) => s.id === segmento)?.label || segmento}:
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#60A5FA] bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                          Modelo Operacional
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(EXEMPLOS_ROTINAS_POR_SEGMENTO[segmento] || EXEMPLO_GENERICO_LOJA).map(
                          (ex, idx) => (
                            <div
                              key={idx}
                              className="bg-[#151E30] p-3 rounded-xl border border-[#223049]"
                            >
                              <div className="text-xs font-bold text-white leading-snug">
                                {ex.titulo}
                              </div>
                              <div className="text-[11px] text-[#94A3B8] mt-1 leading-normal">
                                {ex.descricao}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Avanço / Continuar */}
              <div className="pt-4 border-t border-[#223049] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#94A3B8]">
                  {!isStep1Complete ? (
                    <span>Selecione Pessoa Física ou Pessoa Jurídica para avançar.</span>
                  ) : !isStep2Complete ? (
                    <span>Selecione o segmento da sua loja para continuar.</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Pronto! Clique em Continuar para configurar sua conta com esse perfil.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé escuro premium */}
      <footer className="w-full border-t border-[#1E293B] bg-[#0B1220] py-8 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-6">
          {/* Linha superior: Identificação da plataforma | Links de acesso */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-white tracking-wider uppercase leading-snug">
                VivaVarejo • Rotinas de Gestão
              </span>
            </div>

            {/* Links de navegação e acesso rápido */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#94A3B8]">
              <Link to="/login" className="hover:text-white font-medium transition-colors">
                Já tenho conta
              </Link>
              <span className="text-[#334155]">•</span>
              <button
                type="button"
                onClick={handleScrollToInterest}
                className="hover:text-white font-medium transition-colors"
              >
                Tenho interesse
              </button>
            </div>
          </div>

          {/* Resumo de Segurança e Proteção de Dados VivaVarejo */}
          <div className="p-4 rounded-2xl bg-[#151E30] border border-[#223049] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">
                  Plataforma Blindada & Dados Isolados por Rede
                </div>
                <p className="text-[#94A3B8] text-[11px] mt-0.5">
                  Arquitetura multi-inquilino com sigilo absoluto entre redes, trilha de auditoria
                  contínua, tráfego criptografado e fotos de gôndola com links protegidos.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium text-[10px] border border-emerald-500/30">
                100% Conforme LGPD
              </span>
            </div>
          </div>

          {/* Linha de contato e redes sociais */}
          <div className="pt-4 border-t border-[#1E293B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#94A3B8]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mr-1">
                Conecte-se:
              </span>

              {/* Instagram */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da VivaVarejo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24344E] bg-[#151E30] text-[#CBD5E1] hover:text-white hover:border-[#3B82F6] transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span className="font-medium">Instagram</span>
              </a>

              {/* LinkedIn */}
              <a
                href={LINKEDIN_PERSONAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24344E] bg-[#151E30] text-[#CBD5E1] hover:text-white hover:border-[#3B82F6] transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span className="font-medium">LinkedIn</span>
              </a>

              {/* WhatsApp */}
              <a
                href={
                  contatos.whatsappRaw
                    ? `https://wa.me/${contatos.whatsappRaw}?text=${encodeURIComponent(
                        'Olá! Estou navegando na página do VivaVarejo e gostaria de tirar dúvidas.',
                      )}`
                    : 'https://wa.me/5548991817542?text=Ol%C3%A1!%20Estou%20navegando%20na%20p%C3%A1gina%20do%20VivaVarejo%20e%20gostaria%20de%20tirar%20d%C3%BAvidas.'
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp VivaVarejo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#24344E] bg-[#151E30] text-[#CBD5E1] hover:text-white hover:border-[#3B82F6] transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.42C8.87 7.42 8.61 7.48 8.38 7.73C8.16 7.97 7.54 8.55 7.54 9.72C7.54 10.89 8.39 12.02 8.51 12.18C8.63 12.34 10.15 14.75 12.53 15.72C14.51 16.53 14.91 16.37 15.34 16.33C15.77 16.29 16.73 15.76 16.93 15.2C17.13 14.64 17.13 14.16 17.07 14.06C17.01 13.96 16.85 13.9 16.6 13.78C16.35 13.66 15.12 13.05 14.89 12.97C14.66 12.89 14.5 12.85 14.33 13.09C14.16 13.33 13.69 13.9 13.55 14.06C13.41 14.22 13.26 14.24 13.02 14.12C12.77 14 11.98 13.74 11.04 12.9C10.31 12.25 9.82 11.45 9.68 11.2C9.54 10.96 9.66 10.83 9.78 10.71C9.9 10.6 10.04 10.42 10.17 10.27C10.3 10.12 10.34 10.02 10.42 9.85C10.5 9.69 10.46 9.55 10.4 9.42C10.34 9.3 9.87 8.14 9.67 7.66C9.48 7.19 9.28 7.25 9.13 7.24C9 7.24 8.87 7.42 9.04 7.42Z" />
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>
            </div>

            {/* E-mail de dúvidas */}
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
              <span className="text-[#64748B]">Tire suas dúvidas:</span>
              <a
                href="mailto:dfarias53@gmail.com"
                className="font-medium text-white hover:text-[#60A5FA] underline underline-offset-2 transition-colors"
              >
                dfarias53@gmail.com
              </a>
            </div>
          </div>

          {/* Linha de copyright e versão */}
          <div className="pt-3 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} VivaVarejo. Todos os direitos reservados.</span>
              <span className="font-mono font-bold bg-blue-500/15 text-[#60A5FA] px-1.5 py-0.5 rounded border border-blue-500/30 text-[10px]">
                v0.0.99
              </span>
            </div>
            <span>
              Plataforma de execução operacional, processos e prevenção de perdas no varejo físico.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
