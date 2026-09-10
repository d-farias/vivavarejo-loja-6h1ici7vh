import React, { useState } from 'react'
import type { Cliente } from '@/types'
import pb from '@/lib/pocketbase/client'
import { Sparkles, X, AlertTriangle, RefreshCw, Layers } from 'lucide-react'

interface GerarModeloIaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  clientes: Cliente[]
}

export function GerarModeloIaModal({
  isOpen,
  onClose,
  onSuccess,
  clientes,
}: GerarModeloIaModalProps) {
  const [descricao, setDescricao] = useState('')
  const [nomeSugerido, setNomeSugerido] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExemplo = (texto: string, nome: string) => {
    setDescricao(texto)
    setNomeSugerido(nome)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim()) {
      setErrorMsg('Descreva a operação da loja para a IA gerar o modelo.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await pb.send<{
        success: boolean
        modelo: { id: string; nome: string; descricao: string; totalItens: number }
        message: string
      }>('/backend/v1/vivavarejo/gerar-modelo-ia', {
        method: 'POST',
        body: {
          descricao: descricao.trim(),
          nome: nomeSugerido.trim() || undefined,
          cliente: clienteId || undefined,
        },
      })

      onSuccess(res.message || 'Modelo com rotinas gerado pela IA com sucesso!')
      onClose()
      setDescricao('')
      setNomeSugerido('')
      setClienteId('')
    } catch (err: any) {
      console.error('Erro ao gerar modelo com IA:', err)
      const msg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Falha ao gerar modelo de rotinas com IA. Tente novamente.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-teal-500/10 text-[#0F766E] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Gerar Modelo de Rotinas com IA</h2>
              <p className="text-xs text-[#6B7280]">
                Descreva a operação e deixe a consultoria de IA estruturar as rotinas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nome sugerido */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Nome do Modelo{' '}
              <span className="text-[#9CA3AF] lowercase">
                (opcional — a IA sugere se em branco)
              </span>
            </label>
            <input
              type="text"
              value={nomeSugerido}
              onChange={(e) => setNomeSugerido(e.target.value)}
              placeholder="Ex: Padrão Loja de Moda / Shopping"
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] text-[#1F2937]"
            />
          </div>

          {/* Cliente de destino */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Cliente / Rede de Destino <span className="text-[#9CA3AF] lowercase">(opcional)</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] text-[#1F2937]"
            >
              <option value="">Modelo Geral (Disponível para qualquer rede)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.segmento ? `(${c.segmento})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição em texto livre */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#374151]">
                Descrição da Operação da Loja <span className="text-[#B91C1C]">*</span>
              </label>
              <span className="text-[11px] text-[#6B7280]">{descricao.length} caracteres</span>
            </div>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              required
              disabled={loading}
              placeholder="Ex: Loja de moda feminina com 12 colaboradores, abertura às 09h e fechamento às 22h. Possui frente de caixa, estoque no mezanino, visual merchandising e recebimento diário de novas peças. Precisa de rotinas para abertura de caixa, arrumação de araras, conferência de estoque e fechamento."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] text-[#1F2937] leading-relaxed"
            />
          </div>

          {/* Atalhos de exemplo */}
          <div className="p-3 bg-[#F7F7F5] border border-[#E5E7EB] rounded-md space-y-2">
            <span className="text-[11px] font-semibold text-[#4B5563] block">
              Exemplos rápidos para preencher:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleExemplo(
                    'Supermercado de vizinhança com 28 colaboradores, 4 checkouts, padaria, açougue e recebimento de mercadorias. Abertura às 07h e fechamento às 21h. Foco em controle de validades (FIFO), ruptura de gôndola, auditoria de preços e prevenção de perdas.',
                    'Modelo Operacional — Supermercado Compacto',
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded hover:text-[#0F766E] transition-colors"
              >
                Supermercado de Vizinhança
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleExemplo(
                    'Loja de calçados e vestuário esportivo em shopping com 14 vendedores, abertura às 10h e encerramento às 22h. Foco em briefing diário de metas, conferência de sangria, organização de vitrine e reposição ágil do depósito.',
                    'Modelo Operacional — Varejo Moda Shopping',
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded hover:text-[#0F766E] transition-colors"
              >
                Loja de Moda / Shopping
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleExemplo(
                    'Drogaria e perfumaria de rua com 8 colaboradores e farmacêutico. Abertura às 08h e fechamento às 22h. Necessita de rotinas para conferência de medicamentos controlados (SNGPC), limpeza de prateleiras, precificação de cosméticos e caixa.',
                    'Modelo Operacional — Drogaria & Farmácia',
                  )
                }
                className="text-[11px] px-2.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded hover:text-[#0F766E] transition-colors"
              >
                Drogaria & Perfumaria
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !descricao.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando rotinas com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Modelo com IA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
