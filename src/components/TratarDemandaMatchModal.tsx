import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, RefreshCw, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { matchService } from '@/services/matchService'
import type {
  MatchDemanda,
  StatusMatchDemanda,
  RespostaPadraoMatch,
  OrigemResolucaoMatch,
} from '@/types'

interface TratarDemandaMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demanda: MatchDemanda | null
  userName?: string
  onSucesso: () => void
}

const RESPOSTAS_ESTRUTURADAS: { value: RespostaPadraoMatch; label: string; desc: string }[] = [
  {
    value: 'tenho_estoque',
    label: 'Tenho estoque disponível',
    desc: 'Disponível no CD ou retaguarda para separação imediata.',
  },
  {
    value: 'pedido_confirmado',
    label: 'Pedido confirmado',
    desc: 'Pedido inserido e confirmado com a indústria/comprador.',
  },
  {
    value: 'entrega_programada',
    label: 'Entrega programada',
    desc: 'Carga agendada na doca com dia e horário previsto.',
  },
  {
    value: 'nao_tenho_estoque',
    label: 'Não tenho estoque',
    desc: 'Item esgotado internamente e sem previsão imediata.',
  },
  {
    value: 'previsao_disponibilidade',
    label: 'Previsão de disponibilidade',
    desc: 'Lote aguardando chegada do fornecedor na fábrica/matriz.',
  },
  {
    value: 'problema_atendimento',
    label: 'Problema de atendimento',
    desc: 'Corte de pedido pela indústria, frete com avaria ou impasse comercial.',
  },
  {
    value: 'observacao_justificativa',
    label: 'Observação / justificativa',
    desc: 'Tratamento customizado ou alinhamento manual.',
  },
]

export function TratarDemandaMatchModal({
  open,
  onOpenChange,
  demanda,
  userName = 'Abastecimento / ADM',
  onSucesso,
}: TratarDemandaMatchModalProps) {
  const [novoStatus, setNovoStatus] = useState<StatusMatchDemanda>('cd_abastecimento')
  const [respostaPadrao, setRespostaPadrao] = useState<RespostaPadraoMatch>('tenho_estoque')
  const [observacao, setObservacao] = useState('')
  const [origemResolucao, setOrigemResolucao] = useState<OrigemResolucaoMatch>('cd')
  const [valorRecuperado, setValorRecuperado] = useState<number>(0)
  const [dentroSla, setDentroSla] = useState(true)
  const [salvando, setSalvando] = useState(false)

  React.useEffect(() => {
    if (demanda) {
      setNovoStatus(demanda.status)
      setRespostaPadrao(demanda.resposta_padrao || 'tenho_estoque')
      setObservacao(demanda.observacao_resposta || '')
      setOrigemResolucao(demanda.origem_resolucao || 'cd')
      setValorRecuperado(demanda.valor_recuperado || demanda.potencial_venda_perdida || 0)
      setDentroSla(demanda.dentro_sla ?? true)
    }
  }, [demanda])

  if (!demanda) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await matchService.atualizarStatus(demanda.id, {
        novoStatus,
        autorNome: userName,
        mensagem: observacao.trim()
          ? `${observacao.trim()}`
          : `Avanço de status: ${novoStatus}. Resposta registrada: ${respostaPadrao}`,
        respostaPadrao,
        observacaoResposta: observacao.trim(),
        origemResolucao: novoStatus === 'resolvida' ? origemResolucao : undefined,
        valorRecuperado: novoStatus === 'resolvida' ? Number(valorRecuperado) || 0 : undefined,
        dentroSla,
        historicoExistente: demanda.historico_andamento,
      })

      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao atualizar status da demanda no Integração:', err)
      alert('Não foi possível atualizar a demanda. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              Tratamento & Resposta • VivaVarejo Integração
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0F766E]" />
            <span>Tratar Demanda no Integração</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Atualize o ciclo de atendimento, selecione a resposta estruturada e registre o avanço
            para a loja acompanhar em tempo real.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Ocorrência */}
        <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-[#6B7280]">
                {demanda.produto_codigo || 'SEM-CÓDIGO'}
              </span>
              <h4 className="font-bold text-[#1F2937] text-sm leading-tight">
                {demanda.produto_descricao}
              </h4>
              <p className="text-[#6B7280] text-[11px] mt-0.5">
                Loja: {demanda.expand?.loja?.nome || 'Loja da Rede'} • Curva {demanda.curva} •
                Fornecedor: {demanda.fornecedor_nome || 'Não vinculado'}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                demanda.situacao === 'ruptura'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : demanda.situacao === 'divergencia_sistema_fisico'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : demanda.situacao === 'sem_giro'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {demanda.situacao === 'divergencia_sistema_fisico'
                ? 'Divergência sistêmica'
                : demanda.situacao === 'sem_giro'
                  ? 'Sem giro'
                  : demanda.situacao.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5E7EB] text-[11px]">
            <div>
              <span className="text-[#6B7280] block">Físico Loja:</span>
              <strong className={demanda.estoque_loja === 0 ? 'text-red-600' : 'text-[#1F2937]'}>
                {demanda.estoque_loja ?? 0} un.
              </strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">No Sistema (ERP):</span>
              <strong className="text-[#1F2937]">
                {demanda.estoque_sistema !== undefined ? `${demanda.estoque_sistema} un.` : '—'}
              </strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">Estoque CD:</span>
              <strong className="text-[#0F766E]">{demanda.estoque_cd ?? 0} un.</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">Impacto Financeiro:</span>
              <strong className="text-amber-700">
                {formatCurrency(demanda.potencial_venda_perdida || 0)}
              </strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Ciclo de Status */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Etapa do Ciclo de Atendimento *
            </label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusMatchDemanda)}
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] font-semibold outline-none focus:border-[#0F766E]"
            >
              <option value="aberta">1. Aberta (Loja registrou)</option>
              <option value="em_analise">2. Em Análise (Abastecimento triando)</option>
              <option value="cd_abastecimento">3. CD / Abastecimento (Separação interna)</option>
              <option value="fornecedor">4. Fornecedor (Demanda enviada à indústria)</option>
              <option value="entrega_programada">5. Entrega Programada (Carga em rota/doca)</option>
              <option value="recebida">6. Recebida na Loja (Conferência física)</option>
              <option value="disponivel_venda">7. Disponível para Venda (Gôndola reposta)</option>
              <option value="resolvida">8. Resolvida (Ciclo concluído)</option>
            </select>
          </div>

          {/* Respostas estruturadas */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Resposta Estruturada *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
              {RESPOSTAS_ESTRUTURADAS.map((r) => {
                const isSelected = respostaPadrao === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRespostaPadrao(r.value)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                        : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F766E]/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{r.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                    <p
                      className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${
                        isSelected ? 'text-teal-100' : 'text-[#6B7280]'
                      }`}
                    >
                      {r.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Observação / Justificativa */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Observação / Detalhes do Atendimento
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Pedido #9821 faturado com 30 caixas. Entrega prevista para o turno da manhã."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Se estiver marcando como Resolvida */}
          {novoStatus === 'resolvida' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fechamento & Resultado Financeiro Recuperado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Origem da Resolução
                  </label>
                  <select
                    value={origemResolucao}
                    onChange={(e) => setOrigemResolucao(e.target.value as OrigemResolucaoMatch)}
                    className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-[#1F2937]"
                  >
                    <option value="cd">Abastecido via CD</option>
                    <option value="fornecedor">Entregue por Fornecedor</option>
                    <option value="transferencia">Transferência Loja a Loja</option>
                    <option value="ajuste_local">Ajuste de Estoque Loja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Valor Recuperado (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={valorRecuperado}
                    onChange={(e) => setValorRecuperado(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-[#1F2937] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    SLA Atendido?
                  </label>
                  <select
                    value={dentroSla ? 'sim' : 'nao'}
                    onChange={(e) => setDentroSla(e.target.value === 'sim')}
                    className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-[#1F2937]"
                  >
                    <option value="sim">Sim (Dentro do SLA)</option>
                    <option value="nao">Não (Estourou prazo)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Histórico Anterior */}
          {demanda.historico_andamento && demanda.historico_andamento.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Histórico Rastreável do Ciclo
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {demanda.historico_andamento.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] p-2 rounded-lg bg-gray-50 border border-[#E5E7EB] space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span className="font-semibold text-[#1F2937]">{item.autor}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-[#374151]">{item.mensagem}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Salvar Atualização</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
