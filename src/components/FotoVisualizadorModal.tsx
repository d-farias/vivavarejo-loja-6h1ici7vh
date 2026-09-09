import React, { useState } from 'react'
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
} from 'lucide-react'
import type { ExecucaoRotina, Rotina } from '@/types'
import { execucoesService } from '@/services/rotinas'

interface FotoVisualizadorModalProps {
  isOpen: boolean
  execucao?: ExecucaoRotina | null
  rotina?: Rotina | null
  // Propriedades diretas para permitir reutilização em qualquer entidade (visitas, gôndolas, perdas, etc.)
  fotoUrl?: string | null
  titulo?: string
  subtitulo?: string
  dataHora?: string
  onClose: () => void
}

export const FotoVisualizadorModal: React.FC<FotoVisualizadorModalProps> = ({
  isOpen,
  execucao,
  rotina,
  fotoUrl,
  titulo,
  subtitulo,
  dataHora,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  if (!isOpen) return null

  // Resolver URL da foto
  let resolvedUrl: string | null = fotoUrl || null
  if (!resolvedUrl && execucao && execucao.foto) {
    resolvedUrl = execucoesService.getFotoUrl(execucao)
  }

  if (!resolvedUrl) return null

  const rotinaNome =
    titulo || rotina?.nome || execucao?.expand?.rotina?.nome || 'Comprovação Visual'

  const dataFormatada = dataHora
    ? dataHora
    : execucao?.data_execucao
      ? new Date(execucao.data_execucao).toLocaleDateString('pt-BR')
      : 'Hoje'

  const horaFormatada = execucao?.created
    ? new Date(execucao.created).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const resolvedSubtitulo =
    subtitulo ||
    `Registro comprobatório em ${dataFormatada}${horaFormatada ? ` às ${horaFormatada}` : ''}`

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.3, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.7))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-2 sm:inset-4 max-w-none max-h-none h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)]'
            : 'max-w-3xl max-h-[94vh]'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1F2937] leading-tight truncate">
                {rotinaNome}
              </h3>
              <p className="text-[11px] text-[#6B7280] truncate">{resolvedSubtitulo}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Controles de Zoom */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5 mr-1 border border-gray-200">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.7}
                className="p-1.5 text-gray-700 hover:text-black hover:bg-white rounded disabled:opacity-40"
                title="Reduzir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-1 text-[11px] font-mono text-gray-700 hover:text-black hover:bg-white rounded"
                title="Tamanho 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 text-gray-700 hover:text-black hover:bg-white rounded disabled:opacity-40"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              title={isFullscreen ? 'Reduzir tela' : 'Tela cheia'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Imagem com suporte a zoom e scroll */}
        <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-auto p-2 select-none min-h-[300px]">
          <img
            src={resolvedUrl}
            alt={rotinaNome}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-[68vh] max-w-full object-contain rounded shadow-lg"
          />
        </div>

        {/* Footer info e ações */}
        <div className="px-4 py-2.5 bg-[#F7F7F5] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#374151]">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>{dataFormatada}</span>
            </span>
            {horaFormatada && (
              <span className="flex items-center gap-1.5 text-[#6B7280]">
                <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span>{horaFormatada}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50 rounded font-medium"
              >
                <Download className="w-3 h-3" />
                <span>Abrir original</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#1F2937] font-semibold rounded-md shadow-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
