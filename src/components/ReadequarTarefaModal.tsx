import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Clock, Calendar, AlertCircle } from 'lucide-react'
import type { Rotina } from '@/types'

interface ReadequarTarefaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rotina: Rotina | null
  currentDateStr: string
  onSave: (params: {
    adiada_para_data?: string
    adiada_para_horario?: string
    prioridade_dia?: number
    observacoes?: string
  }) => Promise<void>
}

export function ReadequarTarefaModal({
  open,
  onOpenChange,
  rotina,
  currentDateStr,
  onSave,
}: ReadequarTarefaModalProps) {
  const [dataReadequada, setDataReadequada] = useState<string>(
    rotina?.adiada_para_data || currentDateStr,
  )
  const [horarioReadequado, setHorarioReadequado] = useState<string>(
    rotina?.adiada_para_horario || rotina?.horario_limite || '',
  )
  const [prioridade, setPrioridade] = useState<number>(rotina?.prioridade_dia || 1)
  const [motivo, setMotivo] = useState<string>(rotina?.observacoes || '')
  const [saving, setSaving] = useState<boolean>(false)

  // Quando abre modal com rotina diferente
  React.useEffect(() => {
    if (rotina) {
      setDataReadequada(rotina.adiada_para_data || currentDateStr)
      setHorarioReadequado(rotina.adiada_para_horario || rotina.horario_limite || '')
      setPrioridade(rotina.prioridade_dia || 1)
      setMotivo(rotina.observacoes || '')
    }
  }, [rotina, currentDateStr, open])

  if (!rotina) return null

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        adiada_para_data: dataReadequada || undefined,
        adiada_para_horario: horarioReadequado.trim() || undefined,
        prioridade_dia: Number(prioridade) || 1,
        observacoes: motivo.trim() || undefined,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleMoverParaAmanha = () => {
    const d = new Date(currentDateStr + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDataReadequada(`${yyyy}-${mm}-${dd}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#1F2937]">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>Readequar Tarefa no Dia</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmeter} className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 bg-[#F7F7F5] rounded-md border border-[#E5E7EB] space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Tarefa
            </span>
            <p className="font-semibold text-sm text-[#1F2937]">{rotina.nome}</p>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] pt-1">
              <span>Área: {rotina.area || rotina.responsavel || 'Geral'}</span>
              <span>•</span>
              <span>Horário original: {rotina.horario_limite || 'Sem horário'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#374151] flex items-center justify-between">
              <span>Data Prevista</span>
              <button
                type="button"
                onClick={handleMoverParaAmanha}
                className="text-[11px] font-medium text-[#2563EB] hover:underline"
              >
                + Adiar para amanhã
              </button>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dataReadequada}
                onChange={(e) => setDataReadequada(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#374151]">Novo Horário Limite</label>
              <input
                type="text"
                placeholder="Ex: 11:30 ou 16:00"
                value={horarioReadequado}
                onChange={(e) => setHorarioReadequado(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#374151]">Prioridade do Dia</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value={1}>1 - Alta prioridade (Topo)</option>
                <option value={2}>2 - Média prioridade</option>
                <option value={3}>3 - Normal / Regular</option>
                <option value={4}>4 - Pode esperar</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Motivo da Readequação / Observação (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Demanda imprevista na frente de caixa; repactuado com gerente."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-md text-[11px] text-[#2563EB] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              A readequação ajusta a ordem da agenda do dia para a equipe e registra o horário
              repactuado.
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3.5 py-2 border border-[#E5E7EB] hover:bg-gray-100 rounded-md text-xs font-semibold text-[#4B5563]"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
            >
              {saving ? 'Salvando...' : 'Salvar Readequação'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
