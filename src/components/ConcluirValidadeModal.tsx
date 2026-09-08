import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle2, Camera, Upload, ShieldCheck, X } from 'lucide-react'
import type { TarefaValidade } from '@/types'
import { normalizarNomeCanonico } from '@/lib/cargos'

interface ConcluirValidadeModalProps {
  isOpen: boolean
  onClose: () => void
  tarefa: TarefaValidade | null
  onConfirm: (params: { observacao: string; fotoFile?: File | null }) => Promise<void>
}

export function ConcluirValidadeModal({
  isOpen,
  onClose,
  tarefa,
  onConfirm,
}: ConcluirValidadeModalProps) {
  const [observacao, setObservacao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setObservacao(tarefa?.observacao_execucao || '')
      setFotoFile(null)
      setFotoPreview(null)
    }
  }, [isOpen, tarefa])

  if (!isOpen || !tarefa) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onConfirm({
        observacao: observacao.trim(),
        fotoFile,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#1F2937]">
            <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
            <span>Concluir Tarefa de Validade</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Card Resumo */}
          <div className="p-3 bg-[#F7F7F5] rounded-md border border-[#E5E7EB] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Setor / Categoria
            </span>
            <p className="font-bold text-sm text-[#1F2937]">{tarefa.setor_categoria}</p>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] pt-0.5">
              <span>
                Janela: {tarefa.horario_inicio}{' '}
                {tarefa.horario_fim ? `– ${tarefa.horario_fim}` : ''}
              </span>
              <span>•</span>
              <span>
                Validador:{' '}
                {normalizarNomeCanonico(tarefa.validador_funcao_nome || 'Prevenção de Perdas')}
              </span>
            </div>
          </div>

          {/* Como foi realizada (Observação) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#374151] block">
              Como foi realizada a conferência? (Observações)
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ex: Auditoria realizada em 100% dos itens da gôndola. Nenhum item vencido encontrado; 3 itens etiquetados com 30% de desconto por vencer amanhã."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Foto de Prova (Igual às rotinas) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#374151] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#2563EB]" />
                <span>Foto de Prova da Execução</span>
              </span>
              <span className="text-[11px] font-normal text-[#6B7280]">
                Para aprovação da Prevenção
              </span>
            </label>

            {!fotoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D1D5DB] hover:border-[#2563EB] rounded-lg p-4 text-center cursor-pointer transition-colors bg-[#F7F7F5]/50 hover:bg-[#3B82F6]/5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-[#9CA3AF] mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-[#1F2937]">Tirar foto ou anexar imagem</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  JPG, PNG ou foto direta da câmera do celular
                </p>
              </div>
            ) : (
              <div className="relative border border-[#E5E7EB] rounded-lg overflow-hidden bg-black/5">
                <img
                  src={fotoPreview}
                  alt="Prévia da foto comprobatória"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveFoto}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  title="Remover foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Workflow Info */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-md text-[11px] text-[#2563EB] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Ao concluir, a tarefa será encaminhada para validação de{' '}
              <strong>
                {normalizarNomeCanonico(tarefa.validador_funcao_nome || 'Prevenção de Perdas')}
              </strong>{' '}
              para conferência da foto e observações.
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-2 border border-[#E5E7EB] hover:bg-gray-100 rounded-md text-xs font-semibold text-[#4B5563]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
            >
              {saving ? 'Enviando...' : 'Enviar para Validação'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
