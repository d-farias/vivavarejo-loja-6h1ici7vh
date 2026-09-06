import React, { useState } from 'react'
import type { Cliente, Loja } from '@/types'
import { modelosRotinasService } from '@/services/modelosRotinas'
import { useAuth } from '@/context/AuthContext'
import { Layers, X, AlertTriangle, RefreshCw, Store } from 'lucide-react'

interface SalvarLojaComoModeloModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  lojas: Loja[]
  clientes: Cliente[]
  initialLojaId?: string
}

export function SalvarLojaComoModeloModal({
  isOpen,
  onClose,
  onSuccess,
  lojas,
  clientes,
  initialLojaId,
}: SalvarLojaComoModeloModalProps) {
  const { user } = useAuth()
  const [selectedLojaId, setSelectedLojaId] = useState<string>(initialLojaId || lojas[0]?.id || '')
  const [nomeModelo, setNomeModelo] = useState<string>(() => {
    const l = lojas.find((item) => item.id === (initialLojaId || lojas[0]?.id))
    return l ? `Modelo Padrão - ${l.nome}` : ''
  })
  const [descricao, setDescricao] = useState<string>('')
  const [clienteId, setClienteId] = useState<string>(() => {
    const l = lojas.find((item) => item.id === (initialLojaId || lojas[0]?.id))
    return l?.cliente || ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLojaChange = (id: string) => {
    setSelectedLojaId(id)
    const l = lojas.find((item) => item.id === id)
    if (l) {
      setNomeModelo(`Modelo Padrão - ${l.nome}`)
      setClienteId(l.cliente || '')
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLojaId) {
      setErrorMsg('Selecione uma loja de origem.')
      return
    }
    if (!nomeModelo.trim()) {
      setErrorMsg('Informe o nome do novo modelo.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const result = await modelosRotinasService.salvarLojaComoModelo({
        lojaId: selectedLojaId,
        nomeModelo: nomeModelo.trim(),
        descricao: descricao.trim() || undefined,
        clienteId: clienteId || undefined,
        criadoPorId: user?.id,
      })

      onSuccess(
        `Modelo "${result.modelo.nome}" criado com sucesso contendo ${result.totalRotinas} rotinas!`,
      )
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao salvar rotinas da loja como modelo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3B82F6]/10 text-[#2563EB] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                Salvar Loja como Modelo
              </h2>
              <p className="text-xs text-[#6B7280]">
                Crie um modelo reutilizável a partir de todas as rotinas cadastradas nesta loja
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

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Loja de Origem */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Loja de Origem</span>
            </label>
            <select
              value={selectedLojaId}
              onChange={(e) => handleLojaChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome} {l.expand?.cliente ? `• ${l.expand.cliente.nome}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Nome do Modelo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Nome do Modelo de Rotinas
            </label>
            <input
              type="text"
              value={nomeModelo}
              onChange={(e) => setNomeModelo(e.target.value)}
              placeholder="Ex: Padrão Lojas Express, Modelo Hipermercado..."
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            />
          </div>

          {/* Cliente Proprietário (opcional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Rede / Cliente Proprietário{' '}
              <span className="text-[#9CA3AF] lowercase">(opcional)</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              <option value="">Modelo Geral (Disponível para qualquer cliente)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Descrição / Observações <span className="text-[#9CA3AF] lowercase">(opcional)</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Ex: Modelo desenhado para lojas com açougue e padaria integrados..."
              disabled={loading}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            />
          </div>

          {/* Footer */}
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
              disabled={loading || !nomeModelo.trim() || !selectedLojaId}
              className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando Modelo...</span>
                </>
              ) : (
                <span>Criar Modelo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
