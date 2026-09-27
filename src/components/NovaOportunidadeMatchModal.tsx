import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lightbulb, RefreshCw, Plus } from 'lucide-react'
import { matchService } from '@/services/matchService'
import type { MatchOportunidade, StatusMatchOportunidade } from '@/types'

interface NovaOportunidadeMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redeId?: string
  oportunidadeParaEditar?: MatchOportunidade | null
  onSucesso: () => void
}

export function NovaOportunidadeMatchModal({
  open,
  onOpenChange,
  redeId,
  oportunidadeParaEditar,
  onSucesso,
}: NovaOportunidadeMatchModalProps) {
  const [produtoCodigo, setProdutoCodigo] = useState('')
  const [produtoDescricao, setProdutoDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [lojasReferencia, setLojasReferencia] = useState('')
  const [lojasComGap, setLojasComGap] = useState('')
  const [vendaReferenciaMensal, setVendaReferenciaMensal] = useState<number>(0)
  const [vendaAtualMensal, setVendaAtualMensal] = useState<number>(0)
  const [acaoSugerida, setAcaoSugerida] = useState('')
  const [status, setStatus] = useState<StatusMatchOportunidade>('identificada')
  const [valorConvertido, setValorConvertido] = useState<number>(0)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  React.useEffect(() => {
    if (oportunidadeParaEditar) {
      setProdutoCodigo(oportunidadeParaEditar.produto_codigo || '')
      setProdutoDescricao(oportunidadeParaEditar.produto_descricao || '')
      setCategoria(oportunidadeParaEditar.categoria || '')
      setFornecedorNome(oportunidadeParaEditar.fornecedor_nome || '')
      setLojasReferencia(oportunidadeParaEditar.lojas_referencia || '')
      setLojasComGap(oportunidadeParaEditar.lojas_com_gap || '')
      setVendaReferenciaMensal(oportunidadeParaEditar.venda_referencia_mensal || 0)
      setVendaAtualMensal(oportunidadeParaEditar.venda_atual_mensal || 0)
      setAcaoSugerida(oportunidadeParaEditar.acao_sugerida || '')
      setStatus(oportunidadeParaEditar.status || 'identificada')
      setValorConvertido(oportunidadeParaEditar.valor_convertido_reais || 0)
      setObservacao(oportunidadeParaEditar.observacao || '')
    } else {
      setProdutoCodigo('')
      setProdutoDescricao('')
      setCategoria('')
      setFornecedorNome('')
      setLojasReferencia('')
      setLojasComGap('')
      setVendaReferenciaMensal(0)
      setVendaAtualMensal(0)
      setAcaoSugerida('')
      setStatus('identificada')
      setValorConvertido(0)
      setObservacao('')
    }
  }, [oportunidadeParaEditar, open])

  const gapCalculado = Math.max(0, (vendaReferenciaMensal || 0) - (vendaAtualMensal || 0))

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!produtoDescricao.trim()) {
      alert('Informe a descrição do produto.')
      return
    }

    setSalvando(true)
    try {
      const payload: Partial<MatchOportunidade> = {
        rede: redeId || undefined,
        produto_codigo: produtoCodigo.trim() || undefined,
        produto_descricao: produtoDescricao.trim(),
        categoria: categoria.trim() || undefined,
        fornecedor_nome: fornecedorNome.trim() || undefined,
        lojas_referencia: lojasReferencia.trim() || undefined,
        lojas_com_gap: lojasComGap.trim() || undefined,
        venda_referencia_mensal: Number(vendaReferenciaMensal) || 0,
        venda_atual_mensal: Number(vendaAtualMensal) || 0,
        gap_estimado_reais: gapCalculado,
        acao_sugerida: acaoSugerida.trim() || undefined,
        status,
        valor_convertido_reais:
          status === 'convertida' ? Number(valorConvertido) || gapCalculado : undefined,
        observacao: observacao.trim() || undefined,
      }

      if (oportunidadeParaEditar) {
        await matchService.atualizarOportunidade(oportunidadeParaEditar.id, payload)
      } else {
        await matchService.criarOportunidade(payload)
      }

      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao salvar oportunidade match:', err)
      alert('Não foi possível salvar a oportunidade comercial. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              Oportunidade Comercial • VivaVarejo Match
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#0F766E]" />
            <span>
              {oportunidadeParaEditar ? 'Editar Oportunidade' : 'Registrar Nova Oportunidade'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Identifique produtos que performam acima da média em lojas comparáveis e possuem gap de
            penetração em outras da rede.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Código / EAN
              </label>
              <input
                type="text"
                value={produtoCodigo}
                onChange={(e) => setProdutoCodigo(e.target.value)}
                placeholder="Ex: 789..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Descrição do SKU / Produto *
              </label>
              <input
                type="text"
                required
                value={produtoDescricao}
                onChange={(e) => setProdutoDescricao(e.target.value)}
                placeholder="Ex: Azeite Extra Virgem 500ml, Sabão Líquido 3L..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Categoria / Setor
              </label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Mercearia, Limpeza, Bebidas..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Fornecedor Parceiro
              </label>
              <input
                type="text"
                value={fornecedorNome}
                onChange={(e) => setFornecedorNome(e.target.value)}
                placeholder="Ex: Bunge, Unilever, Nestlé..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Comparativo Loja Referência x Loja com Gap */}
          <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-3.5 space-y-2.5 text-xs">
            <span className="font-bold text-[#1F2937] text-xs block">
              Comparativo entre Lojas da Rede
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Lojas Referência (Boa penetração)
                </label>
                <input
                  type="text"
                  value={lojasReferencia}
                  onChange={(e) => setLojasReferencia(e.target.value)}
                  placeholder="Ex: Loja Matriz, Loja Centro"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Lojas com Gap (Baixa venda)
                </label>
                <input
                  type="text"
                  value={lojasComGap}
                  onChange={(e) => setLojasComGap(e.target.value)}
                  placeholder="Ex: Loja 02, Loja Sul"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Venda Ref. (R$/mês)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={vendaReferenciaMensal}
                  onChange={(e) => setVendaReferenciaMensal(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 font-bold text-[#0F766E] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Venda Atual (R$/mês)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={vendaAtualMensal}
                  onChange={(e) => setVendaAtualMensal(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 font-bold text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Gap Estimado (R$)
                </label>
                <div className="text-xs bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5 font-extrabold text-[#0F766E] flex items-center h-[34px]">
                  {formatCurrency(gapCalculado)}
                </div>
              </div>
            </div>
          </div>

          {/* Ação sugerida e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Ação Sugerida
              </label>
              <input
                type="text"
                value={acaoSugerida}
                onChange={(e) => setAcaoSugerida(e.target.value)}
                placeholder="Ex: Introduzir SKU no mix, ponta de gôndola, rebaixa..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusMatchOportunidade)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] font-semibold outline-none focus:border-[#0F766E]"
              >
                <option value="identificada">Identificada</option>
                <option value="em_negociacao">Em Negociação Comercial</option>
                <option value="acao_em_loja">Ação em Loja (Execução)</option>
                <option value="convertida">Convertida (Resultado obtido)</option>
                <option value="descartada">Descartada</option>
              </select>
            </div>
          </div>

          {status === 'convertida' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <label className="block text-xs font-bold text-emerald-900">
                Valor Convertido em Vendas Reais (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={valorConvertido}
                onChange={(e) => setValorConvertido(Number(e.target.value))}
                className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-2 text-[#1F2937] font-bold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes da conversa com o fornecedor, prazo de teste na loja..."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

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
              disabled={salvando || !produtoDescricao.trim()}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Salvar Oportunidade</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
