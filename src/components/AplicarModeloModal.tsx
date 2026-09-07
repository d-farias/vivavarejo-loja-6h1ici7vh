import React, { useState } from 'react'
import type { ModeloComContagem, Cliente, Loja } from '@/types'
import { modelosRotinasService } from '@/services/modelosRotinas'
import {
  Layers,
  X,
  AlertTriangle,
  RefreshCw,
  Building2,
  Store,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

interface AplicarModeloModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  modelos: ModeloComContagem[]
  clientes: Cliente[]
  lojas: Loja[]
  initialModeloId?: string
  initialLojaId?: string
}

export function AplicarModeloModal({
  isOpen,
  onClose,
  onSuccess,
  modelos,
  clientes,
  lojas,
  initialModeloId,
  initialLojaId,
}: AplicarModeloModalProps) {
  const [selectedModeloId, setSelectedModeloId] = useState<string>(
    initialModeloId || modelos[0]?.id || '',
  )
  const [selectedClienteId, setSelectedClienteId] = useState<string>(() => {
    if (initialLojaId) {
      const l = lojas.find((item) => item.id === initialLojaId)
      if (l) return l.cliente
    }
    return 'todos'
  })
  const [selectedLojaId, setSelectedLojaId] = useState<string>(initialLojaId || lojas[0]?.id || '')
  const [modo, setModo] = useState<'append' | 'replace'>('append')
  const [deduplicar, setDeduplicar] = useState(true)
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  if (!isOpen) return null

  const lojasDisponiveis =
    selectedClienteId === 'todos' ? lojas : lojas.filter((l) => l.cliente === selectedClienteId)

  const selectedModelo = modelos.find((m) => m.id === selectedModeloId)
  const selectedLoja = lojas.find((l) => l.id === selectedLojaId)

  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId)
    const filtered = clienteId === 'todos' ? lojas : lojas.filter((l) => l.cliente === clienteId)
    if (filtered.length > 0) {
      setSelectedLojaId(filtered[0].id)
    } else {
      setSelectedLojaId('')
    }
  }

  const handleConfirm = async () => {
    if (!selectedModeloId || !selectedLojaId) {
      setErrorMessage('Selecione o modelo e a loja de destino.')
      return
    }

    if (modo === 'replace' && !confirmReplace) {
      setErrorMessage(
        'Você selecionou o modo "Substituir todas as rotinas". Marque a confirmação antes de prosseguir.',
      )
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await modelosRotinasService.aplicarModeloNaLoja({
        modeloId: selectedModeloId,
        lojaId: selectedLojaId,
        modo,
        deduplicar,
        onProgress: (m) => setProgressMsg(m),
      })

      const feedback =
        res.ignoradasOuAtualizadas > 0
          ? `Modelo "${selectedModelo?.nome}" aplicado com sucesso! ${res.totalAplicadas} novas rotinas adicionadas e ${res.ignoradasOuAtualizadas} rotinas existentes atualizadas/não duplicadas.`
          : `Modelo "${selectedModelo?.nome}" aplicado com sucesso! ${res.totalAplicadas} rotinas clonadas para a loja "${selectedLoja?.nome}".`

      onSuccess(feedback)
      onClose()
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao aplicar modelo na loja selecionada.')
    } finally {
      setLoading(false)
      setProgressMsg('')
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
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3B82F6]/10 text-[#2563EB] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                Aplicar Modelo em Loja
              </h2>
              <p className="text-xs text-[#6B7280]">
                Replique o padrão de rotinas do modelo em uma nova loja ou loja existente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Seleção do Modelo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151]">
              1. Escolha o Modelo de Rotinas
            </label>
            <select
              value={selectedModeloId}
              onChange={(e) => setSelectedModeloId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
            >
              {modelos.length === 0 && <option value="">Nenhum modelo cadastrado</option>}
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.totalItens || 0} rotinas)
                  {m.expand?.cliente ? ` • ${m.expand.cliente.nome}` : ' • Padrão Geral'}
                </option>
              ))}
            </select>
            {selectedModelo && (
              <p className="text-[11px] text-[#6B7280]">
                {selectedModelo.descricao || 'Sem descrição cadastrada.'}
              </p>
            )}
          </div>

          {/* 2. Seleção de Cliente e Loja de Destino */}
          <div className="space-y-3 p-3.5 bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#374151] flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>2. Selecione a Loja de Destino</span>
            </span>

            {/* Filtro de cliente */}
            <div>
              <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                Filtrar por Cliente / Rede:
              </label>
              <select
                value={selectedClienteId}
                onChange={(e) => handleClienteChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
              >
                <option value="todos">Todos os Clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor da Loja */}
            <div>
              <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                Loja de Destino:
              </label>
              <select
                value={selectedLojaId}
                onChange={(e) => setSelectedLojaId(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
              >
                {lojasDisponiveis.length === 0 && (
                  <option value="">Nenhuma loja disponível para o cliente selecionado</option>
                )}
                {lojasDisponiveis.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} {l.codigo ? `(${l.codigo})` : ''}
                    {l.expand?.cliente ? ` • ${l.expand.cliente.nome}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Modo de Aplicação */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#374151]">
              3. Modo de Clonagem
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-colors ${
                  modo === 'append'
                    ? 'border-[#2563EB] bg-[#3B82F6]/5 font-semibold text-[#2563EB]'
                    : 'border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="modoAplicacao"
                  checked={modo === 'append'}
                  onChange={() => {
                    setModo('append')
                    setConfirmReplace(false)
                  }}
                  disabled={loading}
                  className="mt-0.5"
                />
                <div>
                  <span>Adicionar às existentes</span>
                  <p className="text-[11px] font-normal text-[#6B7280] mt-0.5">
                    Mantém as rotinas atuais da loja e adiciona as novas do modelo.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-colors ${
                  modo === 'replace'
                    ? 'border-[#B91C1C] bg-red-50/40 font-semibold text-[#B91C1C]'
                    : 'border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="modoAplicacao"
                  checked={modo === 'replace'}
                  onChange={() => setModo('replace')}
                  disabled={loading}
                  className="mt-0.5"
                />
                <div>
                  <span>Substituir rotinas existentes</span>
                  <p className="text-[11px] font-normal text-[#6B7280] mt-0.5">
                    Apaga as rotinas anteriores desta loja e insere apenas as do modelo.
                  </p>
                </div>
              </label>
            </div>

            {/* Proteção anti-duplicidade no modo Adicionar */}
            {modo === 'append' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md">
                <label className="flex items-start gap-2 text-xs cursor-pointer text-[#92400E]">
                  <input
                    type="checkbox"
                    checked={deduplicar}
                    onChange={(e) => setDeduplicar(e.target.checked)}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB]"
                    disabled={loading}
                  />
                  <span>
                    <strong>Anti-duplicidade ativado (Recomendado):</strong> se a loja já possuir
                    rotinas com o mesmo nome e horário, não criar cópias duplicadas — atualizar os
                    dados da rotina existente.
                  </span>
                </label>
              </div>
            )}

            {modo === 'replace' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <label className="flex items-start gap-2 text-xs cursor-pointer text-[#B91C1C]">
                  <input
                    type="checkbox"
                    checked={confirmReplace}
                    onChange={(e) => setConfirmReplace(e.target.checked)}
                    className="mt-0.5"
                    disabled={loading}
                  />
                  <span>
                    Confirmo que desejo apagar as rotinas atuais da loja{' '}
                    <strong>{selectedLoja?.nome || 'selecionada'}</strong> e substituí-las pelas
                    rotinas do modelo.
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="p-3 rounded-md bg-blue-50/70 border border-blue-100 text-[11px] text-[#1E40AF]">
            💡 <strong>Resolução automática de funções:</strong> As funções responsáveis (ex:
            Cartazista, Gerente, Balconista) serão mapeadas automaticamente para as funções da loja
            de destino; caso não existam, serão criadas para preservar a governança da loja.
          </div>

          {loading && (
            <div className="p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-md text-xs text-[#2563EB] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{progressMsg || 'Processando clonagem de rotinas...'}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-[#F7F7F5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !selectedModeloId || !selectedLojaId}
            className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Aplicando...</span>
              </>
            ) : (
              <>
                <span>Confirmar e Aplicar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
