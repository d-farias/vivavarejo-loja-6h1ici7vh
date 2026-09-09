import React, { useState, useEffect } from 'react'
import type { VisitaPromotor, Promotor, Loja, RotinaPromotor } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface AgendarVisitaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: VisitaPromotor | null
  promotores: Promotor[]
  lojas: Loja[]
  rotinasDisponiveis?: RotinaPromotor[]
  defaultLojaId?: string
  onSave: (payload: Partial<VisitaPromotor>) => Promise<void>
}

export function AgendarVisitaModal({
  open,
  onOpenChange,
  data,
  promotores,
  lojas,
  defaultLojaId,
  onSave,
}: AgendarVisitaModalProps) {
  const [promotor, setPromotor] = useState('')
  const [loja, setLoja] = useState('')
  const [dataVisita, setDataVisita] = useState('')
  const [horaPrevista, setHoraPrevista] = useState('09:00')
  const [status, setStatus] = useState<'agendada' | 'realizada' | 'atrasada' | 'cancelada'>(
    'agendada',
  )
  const [observacoes, setObservacoes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) {
      setPromotor(data.promotor || (promotores[0]?.id ?? ''))
      setLoja(data.loja || (lojas[0]?.id ?? ''))
      setDataVisita(data.data_visita ? data.data_visita.substring(0, 10) : '')
      setHoraPrevista(data.hora_prevista || '09:00')
      setStatus(data.status || 'agendada')
      setObservacoes(data.observacoes || '')
    } else {
      const today = new Date().toISOString().substring(0, 10)
      setPromotor(promotores[0]?.id ?? '')
      setLoja(defaultLojaId || (lojas[0]?.id ?? ''))
      setDataVisita(today)
      setHoraPrevista('09:00')
      setStatus('agendada')
      setObservacoes('')
    }
  }, [data, promotores, lojas, defaultLojaId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promotor || !loja || !dataVisita) return

    setSubmitting(true)
    try {
      await onSave({
        promotor,
        loja,
        data_visita: `${dataVisita} 00:00:00.000Z`,
        hora_prevista: horaPrevista || undefined,
        status,
        observacoes: observacoes.trim() || undefined,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[500px] p-0 gap-0 overflow-hidden bg-white max-h-[92vh] flex flex-col rounded-xl border border-[#E5E7EB] shadow-2xl">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#E5E7EB] bg-white shrink-0 text-left">
          <DialogTitle className="text-base font-bold text-[#1F2937]">
            {data ? 'Editar Visita Técnica' : 'Agendar Nova Visita de Promotor'}
          </DialogTitle>
        </DialogHeader>

        <div className="scrollbar-mobile-vertical flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-4 text-left">
          <form id="agendar-visita-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Promotor / Representante <span className="text-red-500">*</span>
              </Label>
              <select
                required
                value={promotor}
                onChange={(e) => setPromotor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value="" disabled>
                  Selecione o promotor
                </option>
                {promotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.expand?.fornecedor ? `(${p.expand.fornecedor.nome})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Loja de Destino <span className="text-red-500">*</span>
              </Label>
              <select
                required
                value={loja}
                onChange={(e) => setLoja(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value="" disabled>
                  Selecione a loja
                </option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} {l.expand?.cliente ? `- ${l.expand.cliente.nome}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#374151]">
                  Data da Visita <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  required
                  value={dataVisita}
                  onChange={(e) => setDataVisita(e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#374151]">Horário Previsto</Label>
                <Input
                  type="time"
                  value={horaPrevista}
                  onChange={(e) => setHoraPrevista(e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
            </div>

            {data && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#374151]">Status da Visita</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
                >
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="atrasada">Atrasada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Observações / Objetivos da Visita
              </Label>
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Auditoria de pontas de gôndola, abastecimento de tabloide, conferência de validades..."
                className="text-sm bg-white"
              />
            </div>
          </form>
        </div>

        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#E5E7EB] bg-[#F7F7F5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto h-10 sm:h-9 text-xs font-semibold"
          >
            Cancelar
          </Button>
          <Button
            form="agendar-visita-form"
            type="submit"
            className="w-full sm:w-auto h-10 sm:h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
            disabled={submitting || !promotor || !loja || !dataVisita}
          >
            {submitting ? 'Salvando...' : 'Salvar Visita'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
