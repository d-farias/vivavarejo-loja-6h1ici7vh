import React, { useState } from 'react'
import { X, Camera, Check, Upload, Image as ImageIcon } from 'lucide-react'
import type { Rotina } from '@/types'

interface ConcluirRotinaModalProps {
  isOpen: boolean
  rotina: Rotina | null
  onClose: () => void
  onConfirm: (fotoFile: File | null) => Promise<void>
}

export const ConcluirRotinaModal: React.FC<ConcluirRotinaModalProps> = ({
  isOpen,
  rotina,
  onClose,
  onConfirm,
}) => {
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !rotina) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFotoFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFotoFile(null)
    setPreviewUrl(null)
  }

  const handleConfirmAction = async (withPhoto: boolean) => {
    setSubmitting(true)
    try {
      await onConfirm(withPhoto ? fotoFile : null)
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    handleRemovePhoto()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F7F7F5]/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                Concluir Rotina
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6B7280] truncate">
                Comprovação de execução (foto opcional)
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content com scroll vertical seguro */}
        <div className="scrollbar-mobile-vertical flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Rotina a ser registrada:
            </span>
            <div className="font-bold text-[#1F2937] text-base mt-0.5">{rotina.nome}</div>
            <div className="text-xs text-[#6B7280] mt-0.5">
              Responsável: <span className="text-[#374151] font-medium">{rotina.responsavel}</span>
              {rotina.area && (
                <>
                  {' '}
                  • Área: <span className="text-[#374151] font-medium">{rotina.area}</span>
                </>
              )}
            </div>
          </div>

          {/* Aviso sobre workflow de validação */}
          <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg p-3 text-xs text-[#4B5563] space-y-1">
            <div className="font-semibold text-[#1F2937]">Workflow de Validação:</div>
            <p className="text-[11px] text-[#6B7280]">
              Ao concluir, esta rotina entrará em <strong>aguardando validação</strong> pelo
              Regional da loja antes de ser definitivamente homologada.
            </p>
          </div>

          {/* Anexar Foto (Opcional) */}
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#374151] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Foto de Comprovação</span>
                <span className="text-[10px] text-[#6B7280] font-normal lowercase">(opcional)</span>
              </span>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] text-[#B91C1C] hover:underline"
                >
                  Remover foto
                </button>
              )}
            </div>

            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E5E7EB] bg-black/5 aspect-video flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Pré-visualização da foto"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#E5E7EB] hover:border-[#0F766E] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#F7F7F5]/50 hover:bg-teal-50/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-[#0F766E]">Tirar ou anexar foto</span>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">JPG, PNG ou WebP até 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer buttons fixos no fundo */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#E5E7EB] bg-[#F7F7F5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Opção sem foto rápida ou cancelar */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleConfirmAction(false)}
            className="px-3.5 py-2 text-xs font-medium text-[#4B5563] hover:bg-gray-200/70 rounded-lg transition-colors border border-[#E5E7EB] sm:border-transparent hover:border-[#E5E7EB] text-center"
          >
            {fotoFile ? 'Concluir sem esta foto' : 'Concluir em 1 toque (sem foto)'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleConfirmAction(Boolean(fotoFile))}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg shadow-xs transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>
              {submitting ? 'Salvando...' : fotoFile ? 'Confirmar e Enviar' : 'Concluir e Enviar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
