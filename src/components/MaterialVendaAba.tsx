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
  somenteInterno?: boolean
}

const COMPARATIVO_ITEMS: ComparativoItem[] = [
  {
    criterio: 'Implantação Operacional no Mesmo Dia',
    subtexto: 'Tempo para colocar a operação e a equipe rodando na loja',
    vivavarejo: {
      status: true,
      detalhe: 'No mesmo dia. Sem consultorias de semanas ou taxas extras de implantação.',
      notaInterna:
        'Argumento de fechamento: destaque que enquanto a concorrência cobra taxa de setup, nosso onboarding é autoexplicativo pelo WhatsApp.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Semanas de setup, consultorias de implantação cobradas à parte e onboarding burocrático.',
      notaInterna: 'Concorrentes costumam cobrar de R$ 2.000 a R$ 5.000 apenas pelo setup inicial.',
    },
  },
  {
    criterio: 'Validade × Calendário Nativa com Rodízio de 4 Semanas',
    subtexto: 'Controle de perdas com cronograma distribuído e alertas horários',
    vivavarejo: {
      status: true,
      detalhe:
        'Nativa e exclusiva: rodízio de 4 semanas, horários prévios e alarme sonoro/WhatsApp.',
      notaInterna:
        'Maior dor do supermercadista: quebra por vencimento corrói de 1% a 3% do faturamento bruto da loja.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Inexistente no formato de calendário rotativo de 4 semanas. Apenas checklists genéricos estáticos.',
      notaInterna:
        'Sistemas genéricos tratam validade como mera lista de checagem sem periodicidade estruturada.',
    },
  },
  {
    criterio: 'Cadeia de WhatsApp por Função Operacional',
    subtexto: 'Alerta hierárquico automático de rotinas atrasadas ou ignoradas',
    vivavarejo: {
      status: true,
      detalhe:
        'Escalonamento automático: responsável direto → encarregado → gerente de loja → regional.',
      notaInterna:
        'Diferencial decisivo: funcionários de chão de loja ignoram e-mail; o WhatsApp é o único canal que gera resposta imediata.',
    },
    tradicionais: {
      status: false,
      detalhe: 'Apenas notificações por e-mail ou push que funcionários de chão de loja não abrem.',
    },
  },
  {
    criterio: 'Auditoria com Provas em Foto Obrigatórias/Opcionais',
    subtexto: 'Verificação visual de limpeza, reposição, layout e precificação',
    vivavarejo: {
      status: true,
      detalhe:
        'Envio rápido direto do celular com carimbo de horário e visualização instantânea pelo líder.',
    },
    tradicionais: {
      status: true,
      detalhe: 'Permite foto, mas exige múltiplos passos e fluxos pesados que atrasam a rotina.',
    },
  },
  {
    criterio: 'Plano de Ação Corretiva 5W2H Integrado',
    subtexto: 'O que fazer, quem faz, prazo e causa raiz quando algo sai do padrão',
    vivavarejo: {
      status: true,
      detalhe:
        'Gera plano 5W2H em 1 toque a partir de qualquer rotina atrasada ou apontamento de quebra.',
      notaInterna:
        'Demonstrar na reunião como uma inconformidade vira plano de ação com responsável e prazo em segundos.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe: 'Exige navegação em telas complexas fora do fluxo rápido da loja.',
    },
  },
  {
    criterio: 'Módulo de Promotores & Fornecedores Incluso',
    subtexto: 'Controle de entrada, rotinas e cumprimento de acordos comerciais',
    vivavarejo: {
      status: true,
      detalhe:
        'Incluso no pacote base: agenda de visitas, rotinas de promotores e conferência no recebimento.',
      notaInterna: 'Concorrentes cobram módulos adicionais para gestão de trade e promotores.',
    },
    tradicionais: {
      status: false,
      detalhe: 'Cobrado como módulo à parte ou requer aquisição de ferramenta externa secundária.',
    },
  },
  {
    criterio: 'Hierarquia Clara: ADM Geral → ADM de Rede → Líder de Loja',
    subtexto: 'Gestão multi-loja com governança sem vazamento de dados entre redes',
    vivavarejo: {
      status: true,
      detalhe:
        'Projetado para consultores e redes: cada franqueado/diretor vê só suas lojas; a liderança vê o todo.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe: 'Permissões engessadas, necessitando parametrizações demoradas com suporte técnico.',
    },
  },
  {
    criterio: 'Relatórios Loja a Loja Dia / Semana / Mês com Exportação CSV',
    subtexto: 'Acompanhamento comparativo de quem cumpre ou atrasa rotinas',
    vivavarejo: {
      status: true,
      detalhe:
        'Dashboard comparativo pronto com delta de evolução, ranking e exportação em 1 clique.',
    },
    tradicionais: {
      status: 'parcial',
      detalhe: 'Relatórios lentos com filtros complexos e pouca ênfase no ritmo diário do varejo.',
    },
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
      // Pequeno timeout para garantir renderização de estados caso necessário
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

  // Obter link direto para envio (se logado ou landing pública /bem-vindo)
  const getShareUrl = () => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }

  const getShareText = () => {
    if (isCliente) {
      return (
        'Confira o comparativo do VivaVarejo: Por que o sistema supera checklists tradicionais na rotina real de loja e prevenção de perdas.\n\n' +
        'Acesse pelo link:\n' +
        getShareUrl()
      )
    }
    return (
      '[USO INTERNO] Apresentação Comercial e Pitch — VivaVarejo × Sistemas Tradicionais de Checklist:\n' +
      getShareUrl()
    )
  }

  // Compartilhar Nativo (navigator.share com fallback para cópia)
  const handleNativeShare = async () => {
    const url = getShareUrl()
    const text = isCliente
      ? 'Apresentação Comercial VivaVarejo — Superando Checklists Tradicionais no Varejo'
      : 'Guia de Pitch Comercial VivaVarejo (Uso Interno)'

    if (navigator.share) {
      try {
        await navigator.share({
          title: text,
          text: isCliente
            ? 'Guia comparativo de diferenciais do VivaVarejo frente a sistemas convencionais.'
            : text,
          url,
        })
        return
      } catch (err: unknown) {
        // Se o usuário cancelou o share nativo, não faz nada
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    // Fallback: copiar para área de transferência
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
              <span>VivaVarejo × Sistemas Tradicionais de Checklist</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Material comparativo pronto para projetar na tela em reuniões, imprimir ou salvar em
              PDF pelo celular.
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
                <strong>Modo Cliente:</strong> Apresentação comercial limpa e persuasiva, perfeita
                para enviar ao lojista ou projetar na reunião.
              </>
            ) : (
              <>
                <strong>Modo Interno:</strong> Inclui notas de argumentação de vendas, comparativos
                de preço de concorrentes e dicas de pitch confidenciais.
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

          {/* Botão Compartilhar Nativo / Link */}
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
                Acompanhamento Operacional & Gestão de Rotinas de Loja
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
              Guia Comparativo de Diferenciais
            </span>
            <div className="text-[11px] text-[#6B7280] mt-1 flex items-center sm:justify-end gap-1.5">
              <span>Foco exclusivo na rotina real do varejo físico</span>
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
                Este material inclui notas de argumentação e dados de inteligência competitiva. Ao
                enviar ou apresentar ao cliente, alterne para o seletor &ldquo;Versão Cliente&rdquo;
                no topo.
              </div>
            </div>
          </div>
        )}

        {/* Título e Proposta de Valor */}
        <div className="max-w-3xl space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
            Por que o VivaVarejo supera os checklists tradicionais de prateleira?
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
            Sistemas convencionais focam em auditorias genéricas e burocráticas que a equipe da loja
            abandona em poucos dias. O VivaVarejo foi construído na linha de frente: rotinas diárias
            com horário limite, cobrança ativa por WhatsApp, controle rigoroso de validade e foco em
            perdas zero.
          </p>
        </div>

        {/* Tabela Comparativa */}
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#1F2937]">
                <th className="p-3.5 font-bold uppercase tracking-wider text-xs w-[40%]">
                  Diferencial / Capacidade
                </th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-xs bg-blue-50/80 text-[#2563EB] border-x border-[#E5E7EB] w-[30%]">
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

        {/* Bloco "Por que o VivaVarejo" (Os 3 Argumentos Chave) */}
        <div className="space-y-4 pt-4 border-t border-[#E5E7EB] page-break-inside-avoid">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Pilares Estratégicos
            </span>
            <h3 className="text-lg font-extrabold text-[#1F2937] tracking-tight mt-0.5">
              Por que escolher o VivaVarejo?
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
                Foco 100% no Varejo de Loja
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Não somos um formulário genérico para auditorias aleatórias. Toda tela e rotina foi
                pensada para a dinâmica de supermercados, hortifrutis, farmácias e comércio:
                horários de corte, prevenção de perdas, promotores e conferência em 2 toques.
              </p>
            </div>

            {/* Argumento 2 */}
            <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Pronto no Mesmo Dia
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Esqueça semanas de parametrização e contratos de consultoria caros apenas para
                iniciar. Com os Modelos de Rotinas pré-prontos do VivaVarejo, a loja importa sua
                operação inteira em minutos e a equipe já executa pelo celular no mesmo dia.
              </p>
            </div>

            {/* Argumento 3 */}
            <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-[#1F2937] leading-tight">
                Parceiro de Resultados
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Não entregamos apenas software: acompanhamos os índices de execução com apoio do
                consultor especialista. A cadeia de cobrança no WhatsApp garante que nada caia no
                esquecimento, protegendo a margem do lojista contra perdas e rupturas.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé da Apresentação */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937]">VivaVarejo</span>
            <span>— Excelência em Operação de Varejo</span>
          </div>
          <div>
            <span>
              {isCliente
                ? 'Material comercial exclusivo para apresentação a clientes'
                : 'Material comercial confidencial • Uso interno da equipe'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          AÇÕES NO FIM DO MATERIAL (Item 3 do pedido do usuário)
          "Embaixo ficou completo, seria interessante p salvar tb e mandar p clientes"
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
