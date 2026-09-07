import React from 'react'
import {
  Check,
  Minus,
  Sparkles,
  Printer,
  Share2,
  ShieldCheck,
  Clock,
  Layers,
  Store,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'

interface ComparativoItem {
  criterio: string
  subtexto: string
  vivavarejo: {
    status: boolean
    detalhe: string
  }
  tradicionais: {
    status: boolean | 'parcial'
    detalhe: string
  }
}

const COMPARATIVO_ITEMS: ComparativoItem[] = [
  {
    criterio: 'Implantação Operacional no Mesmo Dia',
    subtexto: 'Tempo para colocar a operação e a equipe rodando na loja',
    vivavarejo: {
      status: true,
      detalhe: 'No mesmo dia. Sem consultorias de semanas ou taxas extras de implantação.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Semanas de setup, consultorias de implantação cobradas à parte e onboarding burocrático.',
    },
  },
  {
    criterio: 'Validade × Calendário Nativa com Rodízio de 4 Semanas',
    subtexto: 'Controle de perdas com cronograma distribuído e alertas horários',
    vivavarejo: {
      status: true,
      detalhe:
        'Nativa e exclusiva: rodízio de 4 semanas, horários prévios e alarme sonoro/WhatsApp.',
    },
    tradicionais: {
      status: false,
      detalhe:
        'Inexistente no formato de calendário rotativo de 4 semanas. Apenas checklists genéricos estáticos.',
    },
  },
  {
    criterio: 'Cadeia de WhatsApp por Função Operacional',
    subtexto: 'Alerta hierárquico automático de rotinas atrasadas ou ignoradas',
    vivavarejo: {
      status: true,
      detalhe:
        'Escalonamento automático: responsável direto → chefe imediato → gerente de loja → regional.',
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
        'Projetado para consultores e redes: cada franqueado/diretor vê só suas lojas; o geral vê tudo.',
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
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8 print:p-0 print:space-y-6">
      {/* Top Banner de Ações da Apresentação */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB]">
              Apresentação Comercial & Pitch
            </span>
            <span className="text-xs text-[#6B7280]">Uso Interno e Apresentação a Clientes</span>
          </div>
          <h2 className="text-lg font-bold text-[#1F2937] tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <span>VivaVarejo × Sistemas Tradicionais de Checklist</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Material comparativo pronto para projetar na tela em reuniões ou imprimir/salvar em PDF
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Salvar em PDF</span>
        </button>
      </div>

      {/* DOCUMENTO PRINCIPAL (Imprimível e Visualizável) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-2">
        {/* Header do Material */}
        <div className="border-b border-[#E5E7EB] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
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
            <div className="text-[11px] text-[#6B7280] mt-1">
              Foco exclusivo na rotina real do varejo físico
            </div>
          </div>
        </div>

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
                    (Checklist Fácil, SULTS, genéricos)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {COMPARATIVO_ITEMS.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                  {/* Critério */}
                  <td className="p-3.5">
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
                      <div className="text-xs font-semibold text-[#1F2937] leading-snug">
                        {item.vivavarejo.detalhe}
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
                      <div className="text-xs text-[#6B7280] leading-snug">
                        {item.tradicionais.detalhe}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloco "Por que o VivaVarejo" (Os 3 Argumentos Chave) */}
        <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
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
            <span>Material comercial confidencial • Apresentação ao cliente</span>
          </div>
        </div>
      </div>
    </div>
  )
}
