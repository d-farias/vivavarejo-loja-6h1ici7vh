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
import { Camera, Image as ImageIcon } from 'lucide-react'

interface RotinaPromotorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: RotinaPromotor | null
  fornecedores: Fornecedor[]
  lojas: Loja[]
  onSave: (payload: Partial<RotinaPromotor> | FormData) => Promise<void>
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
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) {
      setTitulo(data.titulo || '')
      setDescricao(data.descricao || '')
      setFornecedor(data.fornecedor || '')
      setLoja(data.loja || '')
      setFrequencia(data.frequencia || 'Em cada visita')
      setAtiva(data.ativa !== false)
      setFotoFile(null)
    } else {
      setTitulo('')
      setDescricao('')
      setFornecedor('')
      setLoja('')
      setFrequencia('Em cada visita')
      setAtiva(true)
      setFotoFile(null)
    }
  }, [data, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setSubmitting(true)
    try {
      if (fotoFile) {
        const formData = new FormData()
        formData.append('titulo', titulo.trim())
        if (descricao.trim()) formData.append('descricao', descricao.trim())
        if (fornecedor) formData.append('fornecedor', fornecedor)
        if (loja) formData.append('loja', loja)
        if (frequencia.trim()) formData.append('frequencia', frequencia.trim())
        formData.append('ativa', String(ativa))
        formData.append('foto_trabalho', fotoFile)
        await onSave(formData)
      } else {
        await onSave({
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          fornecedor: fornecedor || undefined,
          loja: loja || undefined,
          frequencia: frequencia.trim() || undefined,
          ativa,
        })
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const pbBase = (import.meta as any).env.VITE_POCKETBASE_URL || ''
  const currentFotoUrl =
    data?.foto_trabalho && data.id
      ? `${pbBase}/api/files/rotinas_promotor/${data.id}/${data.foto_trabalho}`
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[500px] p-0 gap-0 overflow-hidden bg-white max-h-[92vh] flex flex-col rounded-xl border border-[#E5E7EB] shadow-2xl">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#E5E7EB] bg-white shrink-0 text-left">
          <DialogTitle className="text-base font-bold text-[#1F2937]">
            {data ? 'Editar Rotina de Promotor' : 'Nova Rotina Operacional de Promotor'}
          </DialogTitle>
        </DialogHeader>

        <div className="scrollbar-mobile-vertical flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-4 text-left">
          <form id="rotina-promotor-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Título da Rotina em Loja <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Abastecimento 100% e Puxar Frente (FIFO)"
                className="text-sm bg-white"
              />
            </div>

            {/* Foto de Referência / Trabalho da Rotina */}
            <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#2563EB]" />
                  <Label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Foto do Trabalho / Exposição de Referência
                  </Label>
                </div>
                <span className="text-[10px] text-[#2563EB] font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">
                  Padrão / Execução
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                Anexe a foto do trabalho realizado ou modelo de execução de gôndola para esta
                rotina.
              </p>

              {currentFotoUrl && !fotoFile && (
                <div className="flex items-center gap-3 p-2 bg-white rounded border border-[#E5E7EB]">
                  <img
                    src={currentFotoUrl}
                    alt="Foto atual"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="text-xs text-[#374151]">
                    <div className="font-medium">Foto atual cadastrada</div>
                    <div className="text-[11px] text-[#6B7280]">
                      Selecione um novo arquivo para substituir
                    </div>
                  </div>
                </div>
              )}

              <Input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFotoFile(file)
                }}
                className="text-xs bg-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#2563EB]/10 file:text-[#2563EB]"
              />
              {fotoFile && (
                <div className="text-[11px] text-emerald-700 font-medium">
                  ✓ Novo arquivo: {fotoFile.name} ({(fotoFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Frequência / Horário Previsto
              </Label>
              <Input
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value)}
                placeholder="Ex: Toda visita, Semanal, Até 11:00..."
                className="text-sm bg-white"
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
                className="text-sm bg-white"
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
            form="rotina-promotor-form"
            type="submit"
            className="w-full sm:w-auto h-10 sm:h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
            disabled={submitting || !titulo.trim()}
          >
            {submitting ? 'Salvando...' : 'Salvar Rotina'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
