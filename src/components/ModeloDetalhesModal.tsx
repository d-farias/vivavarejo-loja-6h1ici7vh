import React, { useState, useEffect } from 'react'
import type { ModeloRotina, ModeloRotinaItem } from '@/types'
import { modelosRotinasService } from '@/services/modelosRotinas'
import { Layers, X, Clock, RefreshCw, FileText } from 'lucide-react'

interface ModeloDetalhesModalProps {
  isOpen: boolean
  onClose: () => void
  modelo: ModeloRotina | null
}

export function ModeloDetalhesModal({ isOpen, onClose, modelo }: ModeloDetalhesModalProps) {
  const [itens, setItens] = useState<ModeloRotinaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && modelo) {
      setLoading(true)
      modelosRotinasService
        .getItens(modelo.id)
        .then((res) => setItens(res))
        .catch((err) => console.error('Erro ao carregar itens do modelo:', err))
        .finally(() => setLoading(false))
    } else {
      setItens([])
    }
  }, [isOpen, modelo])

  if (!isOpen || !modelo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3B82F6]/10 text-[#2563EB] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <span>{modelo.nome}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#4B5563]">
                  {itens.length} {itens.length === 1 ? 'rotina' : 'rotinas'}
                </span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                {modelo.descricao || 'Rotinas mapeadas neste template de consultoria'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937]"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#6B7280]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
              <span>Carregando rotinas do modelo...</span>
            </div>
          ) : itens.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="font-semibold text-[#1F2937]">
                Nenhuma rotina cadastrada neste modelo.
              </p>
              <p className="mt-1">
                Adicione rotinas importando planilha ou usando "Salvar loja como modelo".
              </p>
            </div>
          ) : (
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Rotina</th>
                    <th className="p-3">Função / Resp.</th>
                    <th className="p-3">Frequência</th>
                    <th className="p-3">Horário Limite</th>
                    <th className="p-3">Área</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {itens.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-[#1F2937] max-w-xs">{it.nome}</td>
                      <td className="p-3 text-[#4B5563]">
                        {it.funcao_nome || it.responsavel || '-'}
                      </td>
                      <td className="p-3 text-[#4B5563]">{it.frequencia}</td>
                      <td className="p-3 font-mono text-[11px] text-[#2563EB]">
                        {it.horario_limite || 'Integral'}
                      </td>
                      <td className="p-3 text-[#6B7280]">{it.area || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#F7F7F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#1F2937] rounded-md shadow-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
