import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, CheckCircle2, RefreshCw } from 'lucide-react'
import { comercialService } from '@/services/comercial'
import type { ComercialNegociacaoMarco } from '@/types'

interface RegistrarEvidenciaMarcoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  marco: ComercialNegociacaoMarco | null
  userName?: string
  onSucesso: () => void
}

export function RegistrarEvidenciaMarcoModal({
  open,
  onOpenChange,
  marco,
  userName = 'Responsável Loja',
  onSucesso,
}: RegistrarEvidenciaMarcoModalProps) {
  const [salvando, setSalvando] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [executadoPor, setExecutadoPor] = useState(userName)
  const [observacao, setObservacao] = useState('')
  const [semEvidencia, setSemEvidencia] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFotoFile(file)
      setSemEvidencia(false)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!marco) return
    if (!fotoFile && !semEvidencia) {
      alert(
        'Por favor, anexe uma foto da evidência da negociação ou marque a opção "Concluir sem foto".',
      )
      return
    }

    setSalvando(true)
    try {
      await comercialService.concluirMarcoComEvidencia(marco.id, {
        executadoPor: executadoPor.trim() || userName,
        observacao: observacao.trim() || undefined,
        fotoFile: semEvidencia ? null : fotoFile,
        semEvidencia,
      })

      onOpenChange(false)
      setFotoFile(null)
      setPreviewUrl(null)
      setObservacao('')
      setSemEvidencia(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao registrar evidência do marco:', err)
      alert('Não foi possível registrar a evidência da negociação.')
    } finally {
      setSalvando(false)
    }
  }

  if (!marco) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#0F766E]" />
            <span>Evidência da Negociação com Comprador</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Fotografe a execução do acordo na loja para comprovar ao comprador e fornecedor:
            <strong className="block text-[#1F2937] mt-1 font-semibold">{marco.titulo}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Quem executou / fotografou *
            </label>
            <input
              type="text"
              required
              value={executadoPor}
              onChange={(e) => setExecutadoPor(e.target.value)}
              placeholder="Nome do colaborador da loja"
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Foto da Gôndola / Ponto Extra / Acordo *
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={semEvidencia}
              className="w-full text-xs text-[#4B5563] file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer disabled:opacity-50"
            />
            {previewUrl && !semEvidencia && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-[#E5E7EB] max-h-48 flex items-center justify-center bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Prévia da evidência"
                  className="max-h-48 object-contain w-full"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="semEvidenciaCheckMarco"
              checked={semEvidencia}
              onChange={(e) => {
                setSemEvidencia(e.target.checked)
                if (e.target.checked) {
                  setFotoFile(null)
                  setPreviewUrl(null)
                }
              }}
              className="rounded border-[#D1D5DB] text-[#0F766E] focus:ring-[#0F766E]"
            />
            <label
              htmlFor="semEvidenciaCheckMarco"
              className="text-xs text-[#4B5563] cursor-pointer"
            >
              Concluir sem foto (marcar como &ldquo;sem evidência registrada&rdquo;)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Observação da Execução (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Ponta montada com todos os itens acordados e faixa de gôndola instalada."
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
              disabled={salvando || (!fotoFile && !semEvidencia)}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando evidência...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Marco</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
