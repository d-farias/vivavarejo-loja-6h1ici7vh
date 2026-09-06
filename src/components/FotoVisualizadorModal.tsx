import React from 'react'
import { X, Calendar, User, Clock, CheckCircle2 } from 'lucide-react'
import type { ExecucaoRotina, Rotina } from '@/types'
import { execucoesService } from '@/services/rotinas'

interface FotoVisualizadorModalProps {
  isOpen: boolean
  execucao: ExecucaoRotina | null
  rotina?: Rotina | null
  onClose: () => void
}

export const FotoVisualizadorModal: React.FC<FotoVisualizadorModalProps> = ({
  isOpen,
  execucao,
  rotina,
  onClose,
}) => {
  if (!isOpen || !execucao || !execucao.foto) return null

  const fullFotoUrl = execucoesService.getFotoUrl(execucao)
  const rotinaNome = rotina?.nome || execucao.expand?.rotina?.nome || 'Rotina concluída'
  const dataFormatada = execucao.data_execucao
    ? new Date(execucao.data_execucao).toLocaleDateString('pt-BR')
    : 'Hoje'
  const horaFormatada = execucao.created
    ? new Date(execucao.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] leading-tight">{rotinaNome}</h3>
              <p className="text-[11px] text-[#6B7280]">
                Prova de execução registrada em {dataFormatada}{' '}
                {horaFormatada ? `às ${horaFormatada}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Imagem */}
        <div className="p-3 bg-neutral-900 flex items-center justify-center overflow-hidden max-h-[65vh]">
          {fullFotoUrl ? (
            <img
              src={fullFotoUrl}
              alt={`Comprovação da rotina ${rotinaNome}`}
              className="max-h-[60vh] max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="text-gray-400 text-xs py-10">Imagem indisponível</div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#F7F7F5] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>{dataFormatada}</span>
            </span>
            {horaFormatada && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span>{horaFormatada}</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] font-semibold rounded-md shadow-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
