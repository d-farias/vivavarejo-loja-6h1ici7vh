import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, RefreshCw, MessageSquare, Camera, X } from 'lucide-react'
import { admRhService } from '@/services/admRh'
import type { AdmRhDemanda, StatusAdmRh } from '@/types'

interface TratarDemandaAdmRhModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demanda: AdmRhDemanda | null
  userName?: string
  onSucesso: () => void
}

export function TratarDemandaAdmRhModal({
  open,
  onOpenChange,
  demanda,
  userName = 'Responsável Adm/RH',
  onSucesso,
}: TratarDemandaAdmRhModalProps) {
  const [status, setStatus] = useState<StatusAdmRh>('em_tratamento')
  const [respostaArea, setRespostaArea] = useState('')
  const [respondidoPor, setRespondidoPor] = useState(userName)
  const [responsavel, setResponsavel] = useState('')
  const [fotoRespostaFile, setFotoRespostaFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  React.useEffect(() => {
    if (demanda) {
      setStatus(demanda.status === 'pendente' ? 'em_tratamento' : demanda.status)
      setRespostaArea(demanda.resposta_area || '')
      setRespondidoPor(demanda.respondido_por || userName)
      setResponsavel(demanda.responsavel || '')
      setFotoRespostaFile(null)
      setPreviewUrl(null)
    }
  }, [demanda, userName])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFotoRespostaFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemoverFoto = () => {
    setFotoRespostaFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!demanda) return
    if (!respostaArea.trim()) {
      alert('Informe o parecer ou resposta da área responsável.')
      return
    }

    setSalvando(true)
    try {
      await admRhService.tratarDemanda(demanda.id, {
        status,
        respostaArea: respostaArea.trim(),
        respondidoPor: respondidoPor.trim() || userName,
        responsavel: responsavel.trim() || undefined,
        fotoRespostaFile,
      })

      handleRemoverFoto()
      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao tratar demanda Adm/RH:', err)
      alert('Não foi possível salvar o tratamento da demanda.')
    } finally {
      setSalvando(false)
    }
  }

  if (!demanda) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0F766E]" />
            <span>Tratar Demanda • {demanda.sub_area.toUpperCase()}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Atualize o status e envie a resposta da área central para acompanhamento da loja.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da demanda aberta */}
        <div className="mt-2 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[#1F2937]">{demanda.titulo}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
              {demanda.sub_area.toUpperCase()}
            </span>
          </div>
          {demanda.descricao && (
            <p className="text-[#4B5563] text-[11px] leading-relaxed">{demanda.descricao}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
            <span>
              Solicitado por: <strong>{demanda.solicitante_nome || 'Loja'}</strong>
            </span>
            {demanda.prazo && <span>Prazo: {demanda.prazo}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          {/* Novo Status */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Status da Demanda *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusAdmRh)}
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="recebida">Recebida pela Área (Triagem)</option>
              <option value="em_tratamento">Em Tratamento (Em andamento)</option>
              <option value="resolvida">Resolvida / Concluída com Sucesso</option>
              <option value="cancelada">Cancelada / Devolvida</option>
            </select>
          </div>

          {/* Quem tratou e responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Atendente / Analista *
              </label>
              <input
                type="text"
                required
                value={respondidoPor}
                onChange={(e) => setRespondidoPor(e.target.value)}
                placeholder="Ex: Carlos DP, Bruna RH"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Responsável Atribuído
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Coordenação RH"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Resposta / Parecer da Área */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Parecer e Resposta para a Loja *
            </label>
            <textarea
              rows={3}
              required
              value={respostaArea}
              onChange={(e) => setRespostaArea(e.target.value)}
              placeholder="Descreva o procedimento adotado, protocolo de eSocial, liberação financeira, validação fiscal ou orientação para a loja..."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Anexo de Comprovante de Resposta (opcional) */}
          <div className="p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Foto do Comprovante / Protocolo de Resposta</span>
              </label>
              {fotoRespostaFile && (
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Remover</span>
                </button>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-[#4B5563] file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer"
            />
            {previewUrl && (
              <div className="mt-1 relative rounded-lg overflow-hidden border border-[#E5E7EB] max-h-36 flex items-center justify-center bg-gray-900">
                <img
                  src={previewUrl}
                  alt="Prévia do comprovante"
                  className="max-h-36 object-contain w-full"
                />
              </div>
            )}
          </div>

          {/* Ações */}
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
              disabled={salvando || !respostaArea.trim()}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Resposta</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
