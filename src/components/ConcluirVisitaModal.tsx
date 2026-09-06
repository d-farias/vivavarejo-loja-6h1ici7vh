import React, { useState, useEffect } from 'react'
import type { VisitaPromotor, RotinaPromotor } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Clock, Store, UserCheck } from 'lucide-react'

interface ConcluirVisitaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visita: VisitaPromotor | null
  rotinasDisponiveis?: RotinaPromotor[]
  onConcluir: (params: { conclusao_check: string; rotinas_executadas?: string }) => Promise<void>
}

export function ConcluirVisitaModal({
  open,
  onOpenChange,
  visita,
  rotinasDisponiveis = [],
  onConcluir,
}: ConcluirVisitaModalProps) {
  const [conclusaoCheck, setConclusaoCheck] = useState('')
  const [selectedRotinas, setSelectedRotinas] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (visita) {
      setConclusaoCheck(visita.conclusao_check || '')
      if (visita.rotinas_executadas) {
        setSelectedRotinas(
          visita.rotinas_executadas
            .split('\n')
            .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
            .filter(Boolean),
        )
      } else {
        setSelectedRotinas([])
      }
    } else {
      setConclusaoCheck('')
      setSelectedRotinas([])
    }
  }, [visita, open])

  const toggleRotina = (titulo: string) => {
    setSelectedRotinas((prev) =>
      prev.includes(titulo) ? prev.filter((t) => t !== titulo) : [...prev, titulo],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visita || !conclusaoCheck.trim()) return

    setSubmitting(true)
    try {
      const rotinasTexto =
        selectedRotinas.length > 0 ? selectedRotinas.map((r) => `• ${r}`).join('\n') : undefined

      await onConcluir({
        conclusao_check: conclusaoCheck.trim(),
        rotinas_executadas: rotinasTexto,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!visita) return null

  const promotorNome = visita.expand?.promotor?.nome || 'Promotor'
  const fornecedorNome = visita.expand?.promotor?.expand?.fornecedor?.nome
  const lojaNome = visita.expand?.loja?.nome || 'Loja'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
            <span>Confirmar Realização de Visita</span>
          </DialogTitle>
        </DialogHeader>

        {/* Card resumo da visita */}
        <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg p-3 space-y-1.5 text-xs text-[#4B5563]">
          <div className="flex items-center gap-2 font-semibold text-[#1F2937]">
            <UserCheck className="w-4 h-4 text-[#2563EB]" />
            <span>{promotorNome}</span>
            {fornecedorNome && <span className="text-[#6B7280]">({fornecedorNome})</span>}
          </div>
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>{lojaNome}</span>
            <span className="text-gray-300">•</span>
            <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>
              {visita.data_visita ? visita.data_visita.substring(0, 10) : ''}{' '}
              {visita.hora_prevista ? `às ${visita.hora_prevista}` : ''}
            </span>
          </div>
          {visita.observacoes && (
            <div className="pt-1 border-t border-[#E5E7EB] text-[#6B7280] italic">
              Objetivo: {visita.observacoes}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Checklist de Rotinas Operacionais do Promotor */}
          {rotinasDisponiveis.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#374151]">
                Rotinas de Trabalho Executadas nesta Visita:
              </Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#E5E7EB] rounded-md p-2.5 bg-gray-50/50">
                {rotinasDisponiveis.map((rot) => {
                  const checked = selectedRotinas.includes(rot.titulo)
                  return (
                    <label
                      key={rot.id}
                      className="flex items-start gap-2.5 p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRotina(rot.titulo)}
                        className="w-4 h-4 mt-0.5 text-[#2563EB] rounded border-gray-300"
                      />
                      <div className="text-xs">
                        <div className="font-medium text-[#1F2937]">{rot.titulo}</div>
                        {rot.descricao && (
                          <div className="text-[11px] text-[#6B7280] leading-tight">
                            {rot.descricao}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Resumo / Observações do que foi Feito <span className="text-red-500">*</span>
            </Label>
            <Textarea
              required
              rows={4}
              value={conclusaoCheck}
              onChange={(e) => setConclusaoCheck(e.target.value)}
              placeholder="Ex: Abastecimento de 15 caixas de biscoito, gôndola alinhada com layout, sem rupturas. Validades conferidas."
              className="text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              disabled={submitting || !conclusaoCheck.trim()}
            >
              {submitting ? 'Salvando...' : 'Confirmar como Realizada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
