import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, RefreshCw } from 'lucide-react'
import { comercialService } from '@/services/comercial'
import type { TipoMarcoNegociacao, StatusMarcoNegociacao, ComercialNegociacao } from '@/types'

interface NovoMarcoNegociacaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  negociacao: ComercialNegociacao | null
  onSucesso: () => void
}

export function NovoMarcoNegociacaoModal({
  open,
  onOpenChange,
  negociacao,
  onSucesso,
}: NovoMarcoNegociacaoModalProps) {
  const [salvando, setSalvando] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [tipoMarco, setTipoMarco] = useState<TipoMarcoNegociacao>('montagem_espaco')
  const [dataLimite, setDataLimite] = useState(
    negociacao?.data_inicio || new Date().toISOString().slice(0, 10),
  )
  const [status, setStatus] = useState<StatusMarcoNegociacao>('pendente')
  const [responsavel, setResponsavel] = useState(negociacao?.responsavel_loja || '')
  const [observacao, setObservacao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)

  React.useEffect(() => {
    if (negociacao) {
      setDataLimite(negociacao.data_inicio || new Date().toISOString().slice(0, 10))
      setResponsavel(negociacao.responsavel_loja || '')
    }
  }, [negociacao, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!negociacao || !titulo.trim() || !dataLimite) return

    setSalvando(true)
    try {
      await comercialService.criarMarco(
        {
          negociacao: negociacao.id,
          titulo: titulo.trim(),
          tipo_marco: tipoMarco,
          data_limite: dataLimite,
          status,
          responsavel: responsavel.trim() || undefined,
          observacao: observacao.trim() || undefined,
        },
        fotoFile,
      )

      onOpenChange(false)
      setTitulo('')
      setObservacao('')
      setFotoFile(null)
      onSucesso()
    } catch (err) {
      console.error('Erro ao adicionar marco de negociação:', err)
      alert('Não foi possível salvar o marco da negociação.')
    } finally {
      setSalvando(false)
    }
  }

  if (!negociacao) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F766E]" />
            <span>Adicionar Marco à Agenda da Negociação</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Defina uma etapa com prazo para a ação:
            <strong className="block text-[#1F2937] mt-0.5">{negociacao.titulo}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Etapa / Marco *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Chegada do Display, Montagem da Ponta, Início do Preço"
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Tipo do Marco
              </label>
              <select
                value={tipoMarco}
                onChange={(e) => setTipoMarco(e.target.value as TipoMarcoNegociacao)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="entrada_material">Entrada do Material PDV</option>
                <option value="montagem_espaco">Montagem do Ponto Extra</option>
                <option value="inicio_preco">Início do Preço Oferta</option>
                <option value="auditoria_meio">Auditoria / Checagem Loja</option>
                <option value="retirada_material">Desmontagem / Retirada</option>
                <option value="outro">Outro Marco</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Prazo Limite *
              </label>
              <input
                type="date"
                required
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Responsável</label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Encarregado Loja"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusMarcoNegociacao)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="pendente">Pendente</option>
                <option value="concluido">Concluído</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Observações / Critérios do Acordo
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Garantir foto da ponta com precificador amarelo."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Evidência Fotográfica Inicial (Opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-[#4B5563] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer"
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
              disabled={salvando || !titulo.trim() || !dataLimite}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Marco</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
