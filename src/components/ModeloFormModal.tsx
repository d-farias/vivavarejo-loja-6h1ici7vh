import React, { useState } from 'react'
import type { ModeloRotina, Cliente } from '@/types'
import { modelosRotinasService } from '@/services/modelosRotinas'
import { useAuth } from '@/context/AuthContext'
import { Layers, X, AlertTriangle, RefreshCw } from 'lucide-react'

interface ModeloFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  modelo: ModeloRotina | null
  clientes: Cliente[]
}

export function ModeloFormModal({
  isOpen,
  onClose,
  onSuccess,
  modelo,
  clientes,
}: ModeloFormModalProps) {
  const { user } = useAuth()
  const [nome, setNome] = useState(modelo?.nome || '')
  const [descricao, setDescricao] = useState(modelo?.descricao || '')
  const [clienteId, setClienteId] = useState(modelo?.cliente || '')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErrorMsg('O nome do modelo é obrigatório.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      if (modelo) {
        await modelosRotinasService.update(modelo.id, {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          cliente: clienteId || undefined,
        })
        onSuccess('Modelo atualizado com sucesso!')
      } else {
        await modelosRotinasService.create({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          cliente: clienteId || undefined,
          criado_por: user?.id,
        })
        onSuccess('Modelo criado com sucesso!')
      }
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao salvar modelo.')
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
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3B82F6]/10 text-[#2563EB] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">
                {modelo ? 'Editar Modelo de Rotinas' : 'Novo Modelo de Rotinas'}
              </h2>
              <p className="text-xs text-[#6B7280]">
                Defina o template de rotinas reutilizável para a rede
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Nome do Modelo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Padrão Lojas Compactas / Supermercado"
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Cliente / Rede Proprietária{' '}
              <span className="text-[#9CA3AF] lowercase">(opcional)</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              <option value="">Modelo Geral (Visível para todas as redes)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Descrição / Observações <span className="text-[#9CA3AF] lowercase">(opcional)</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva o escopo das rotinas incluídas neste modelo..."
              disabled={loading}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            />
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
              disabled={loading || !nome.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
