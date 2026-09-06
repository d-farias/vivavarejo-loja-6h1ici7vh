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
  Clock,
  Mail,
  Camera,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Check,
} from 'lucide-react'
import { TipoPessoaCliente } from '@/types'
import { VAREJO_SEGMENTOS } from '@/components/EnquadramentoClienteCard'

interface SegmentOption {
  id: string
  label: string
  icon: typeof ShoppingBag
  description: string
}

const SEGMENT_OPTIONS: SegmentOption[] = [
  {
    id: 'Moda e Vestuário',
    label: 'Moda e Vestuário',
    icon: ShoppingBag,
    description: 'Lojas de roupas, calçados e acessórios',
  },
  {
    id: 'Supermercado/Food',
    label: 'Supermercado/Food',
    icon: UtensilsCrossed,
    description: 'Mercados, empórios, hortifrútis e padarias',
  },
  {
    id: 'Farmácia',
    label: 'Farmácia',
    icon: Pill,
    description: 'Drogarias, farmácias e cosméticos de balcão',
  },
  {
    id: 'Eletrônicos',
    label: 'Eletrônicos',
    icon: Tv,
    description: 'Celulares, informática, games e eletrodomésticos',
  },
  {
    id: 'Construção/Casa',
    label: 'Construção/Casa',
    icon: Hammer,
    description: 'Materiais de construção, tintas, utilidades e decoração',
  },
  {
    id: 'Cosméticos',
    label: 'Cosméticos',
    icon: Sparkles,
    description: 'Perfumaria, beleza, estética e franquias de maquiagem',
  },
  {
    id: 'Pet',
    label: 'Pet Shop / Veterinária',
    icon: Dog,
    description: 'Pet shops, clínicas, rações e acessórios',
  },
  {
    id: 'Outro',
    label: 'Outro Varejo',
    icon: Store,
    description: 'Óticas, joalherias, livrarias, automotivo ou outros',
  },
]

export default function BemVindo() {
  const navigate = useNavigate()

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
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2937] flex flex-col font-sans">
      {/* Header sóbrio */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/bem-vindo" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
              <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight">
                VivaVarejo
              </span>
              <span className="text-[10px] text-[#6B7280] leading-none">
                Rotinas e liderança para o varejo
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-[#4B5563] hover:text-[#1F2937] hover:bg-gray-100 rounded-md transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Criar conta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Seção Hero */}
        <section className="pt-12 pb-14 sm:pt-16 sm:pb-20 px-4 sm:px-6 border-b border-[#E5E7EB] bg-white">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Plataforma de Operação para Líderes, Gerentes e Redes</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1F2937] tracking-tight leading-tight sm:leading-tight">
              Organize as rotinas da sua loja e lidere com clareza
            </h1>

            <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
              Elimine o improviso no chão de loja. Defina responsáveis, horários limite, validação
              com fotos e acompanhe a execução em tempo real na palma da mão ou no painel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleScrollToInterest}
                className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-md shadow-xs transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Quero começar</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3 bg-[#F7F7F5] hover:bg-gray-200 border border-[#E5E7EB] text-[#374151] font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Micro métricas de credibilidade */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Sem fidelidade
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Ativação em menos de 2 minutos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Compatível com celular e desktop
              </span>
            </div>
          </div>
        </section>

        {/* Bloco "Opção de interesse" (Núcleo do pedido) */}
        <section id="opcao-interesse" className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs space-y-8">
              {/* Cabeçalho do Funil */}
              <div className="border-b border-[#E5E7EB] pb-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-1">
                  <span>Opção de Interesse</span>
                  <span>•</span>
                  <span>Passo {isStep1Complete ? '2 de 2' : '1 de 2'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
                  Conte-nos sobre a sua atuação no varejo
                </h2>
                <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                  Personalizamos modelos prontos de abertura de loja, caixa, reposição e fechamento
                  de acordo com seu perfil.
                </p>
              </div>

              {/* Passo 1: PF ou CNPJ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        isStep1Complete ? 'bg-[#2563EB] text-white' : 'bg-gray-200 text-[#4B5563]'
                      }`}
                    >
                      1
                    </span>
                    <span>Você é pessoa física ou empresa?</span>
                  </label>
                  {tipoPessoa && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
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
                    className={`p-4 rounded-lg border text-left transition-all ${
                      tipoPessoa === 'PJ'
                        ? 'border-[#2563EB] bg-[#3B82F6]/10 ring-2 ring-[#2563EB]/30'
                        : 'border-[#E5E7EB] bg-white hover:border-gray-300 hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                        CNPJ
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#1F2937]">Pessoa Jurídica / Rede</div>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                      Lojas físicas, redes com filiais, franquias, supermercados ou empresas
                      estruturadas.
                    </p>
                  </button>

                  {/* Cartão PF */}
                  <button
                    type="button"
                    onClick={() => setTipoPessoa('PF')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      tipoPessoa === 'PF'
                        ? 'border-[#2563EB] bg-[#3B82F6]/10 ring-2 ring-[#2563EB]/30'
                        : 'border-[#E5E7EB] bg-white hover:border-gray-300 hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 text-[#374151] flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-200 text-[#374151]">
                        PF / MEI
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#1F2937]">Pessoa Física / Lojista</div>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                      Lojista independente, consultor de varejo, MEI ou líder gerindo loja própria.
                    </p>
                  </button>
                </div>
              </div>

              {/* Passo 2: Segmento (aparece ou ganha destaque após escolher o tipo) */}
              {isStep1Complete && (
                <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#374151] flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                          isStep2Complete ? 'bg-[#2563EB] text-white' : 'bg-gray-200 text-[#4B5563]'
                        }`}
                      >
                        2
                      </span>
                      <span>Qual o seu tipo de varejo?</span>
                    </label>
                    {segmento && (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {segmento === 'Outro' && outroSegmento ? outroSegmento : segmento}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SEGMENT_OPTIONS.map((seg) => {
                      const Icon = seg.icon
                      const isSelected = segmento === seg.id
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => setSegmento(seg.id)}
                          className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#2563EB] bg-[#3B82F6]/10 ring-2 ring-[#2563EB]/30'
                              : 'border-[#E5E7EB] bg-white hover:border-gray-300 hover:bg-[#F7F7F5]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#2563EB] text-white'
                                  : 'bg-gray-100 text-[#4B5563]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`text-xs font-bold leading-tight ${
                                isSelected ? 'text-[#2563EB]' : 'text-[#1F2937]'
                              }`}
                            >
                              {seg.label}
                            </div>
                            <p className="text-[10px] text-[#6B7280] mt-1 line-clamp-2">
                              {seg.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {segmento === 'Outro' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                        Especifique o seu segmento de varejo:
                      </label>
                      <input
                        type="text"
                        value={outroSegmento}
                        onChange={(e) => setOutroSegmento(e.target.value)}
                        placeholder="Ex: Ótica, Joalheria, Suplementos, Papelaria..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-md outline-none focus:ring-2 focus:ring-[#3B82F6]/25 text-[#1F2937]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Avanço / Continuar */}
              <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#6B7280]">
                  {!isStep1Complete ? (
                    <span>Selecione se é Pessoa Física ou CNPJ para avançar.</span>
                  ) : !isStep2Complete ? (
                    <span>Selecione o seu segmento de varejo para continuar.</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Pronto! Clique em Continuar para configurar sua conta com esse enquadramento.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-md shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Breve de Benefícios (Linguagem de resultado para dono de loja/rede) */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-t border-b border-[#E5E7EB]">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Benefícios comprovados
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                Tudo o que sua equipe precisa para bater metas sem retrabalho
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] max-w-xl mx-auto">
                Uma solução enxuta que substitui pranchetas de papel, cadernos e mensagens perdidas
                no WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Benefício 1 */}
              <div className="p-5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5]/50 space-y-3">
                <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">Rotinas com Horário Limite</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Abertura de caixa, abastecimento de gôndola e contagem de cofre com prazos claros
                  para cada turno.
                </p>
              </div>

              {/* Benefício 2 */}
              <div className="p-5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5]/50 space-y-3">
                <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">Alertas de Atraso por E-mail</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Receba avisos automáticos se uma rotina crítica não for cumprida a tempo, antes de
                  impactar o cliente.
                </p>
              </div>

              {/* Benefício 3 */}
              <div className="p-5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5]/50 space-y-3">
                <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">Plano de Ação 5W2H</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Identifique desvios operacionais e crie planos de correção com responsáveis,
                  prazos e acompanhamento direto.
                </p>
              </div>

              {/* Benefício 4 */}
              <div className="p-5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5]/50 space-y-3">
                <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">Prova de Execução com Foto</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Validação visual instantânea: vitrines arrumadas, depósitos limpos e fechamento de
                  caixa auditável.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center bg-white border border-[#E5E7EB] rounded-xl p-8 sm:p-10 shadow-xs space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
              Pronto para padronizar as operações da sua loja?
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-lg mx-auto">
              Junte-se aos gestores que acompanham suas filiais com precisão, rotinas bem
              distribuídas e relatórios sem complicação.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-md shadow-xs transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Criar conta gratuita</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3 bg-[#F7F7F5] hover:bg-gray-100 border border-[#E5E7EB] text-[#374151] font-semibold text-sm rounded-md transition-colors"
              >
                Acessar conta existente
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé sóbrio igual ao do app */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-6 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#2563EB] flex items-center justify-center text-white">
              <div className="w-2 h-2 border border-white rotate-45 transform" />
            </div>
            <span className="font-semibold text-[#1F2937]">VivaVarejo</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[#6B7280]">Rotinas e liderança para o varejo</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#1F2937] transition-colors">
              Entrar
            </Link>
            <Link to="/signup" className="hover:text-[#1F2937] transition-colors">
              Criar conta
            </Link>
            <span>© {new Date().getFullYear()} VivaVarejo. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
