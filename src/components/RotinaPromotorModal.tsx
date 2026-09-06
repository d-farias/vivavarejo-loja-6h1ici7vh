import React, { useState, useEffect } from 'react'
import type { RotinaPromotor, Fornecedor, Loja } from '@/types'
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

interface RotinaPromotorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: RotinaPromotor | null
  fornecedores: Fornecedor[]
  lojas: Loja[]
  onSave: (payload: Partial<RotinaPromotor>) => Promise<void>
}

export function RotinaPromotorModal({
  open,
  onOpenChange,
  data,
  fornecedores,
  lojas,
  onSave,
}: RotinaPromotorModalProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [loja, setLoja] = useState('')
  const [frequencia, setFrequencia] = useState('Em cada visita')
  const [ativa, setAtiva] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) {
      setTitulo(data.titulo || '')
      setDescricao(data.descricao || '')
      setFornecedor(data.fornecedor || '')
      setLoja(data.loja || '')
      setFrequencia(data.frequencia || 'Em cada visita')
      setAtiva(data.ativa !== false)
    } else {
      setTitulo('')
      setDescricao('')
      setFornecedor('')
      setLoja('')
      setFrequencia('Em cada visita')
      setAtiva(true)
    }
  }, [data, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setSubmitting(true)
    try {
      await onSave({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        fornecedor: fornecedor || undefined,
        loja: loja || undefined,
        frequencia: frequencia.trim() || undefined,
        ativa,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1F2937]">
            {data ? 'Editar Rotina de Promotor' : 'Nova Rotina Operacional de Promotor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Título da Rotina em Loja <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Abastecimento de gôndola e pontos extras"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Frequência / Horário Previsto
            </Label>
            <Input
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
              placeholder="Ex: Em cada visita, Semanal, Até 11:00..."
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Fornecedor Específico (opcional)
              </Label>
              <select
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value="">Todos os fornecedores</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Loja Específica (opcional)
              </Label>
              <select
                value={loja}
                onChange={(e) => setLoja(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value="">Todas as lojas da rede</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Descrição do Procedimento
            </Label>
            <Textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Instruções para o promotor: conferir layout, auditar preços, puxar frente de gôndola..."
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rotina-ativa"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded border-gray-300"
            />
            <label
              htmlFor="rotina-ativa"
              className="text-xs font-medium text-[#374151] cursor-pointer"
            >
              Rotina ativa no checklist de visitas
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              disabled={submitting || !titulo.trim()}
            >
              {submitting ? 'Salvando...' : 'Salvar Rotina'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
