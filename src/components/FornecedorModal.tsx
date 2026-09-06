import React, { useState, useEffect } from 'react'
import type { Fornecedor, Cliente } from '@/types'
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

interface FornecedorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Fornecedor | null
  clientes: Cliente[]
  onSave: (payload: Partial<Fornecedor>) => Promise<void>
}

export function FornecedorModal({
  open,
  onOpenChange,
  data,
  clientes,
  onSave,
}: FornecedorModalProps) {
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cliente, setCliente] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) {
      setNome(data.nome || '')
      setContato(data.contato || '')
      setTelefone(data.telefone || '')
      setCliente(data.cliente || '')
      setObservacoes(data.observacoes || '')
      setAtivo(data.ativo !== false)
    } else {
      setNome('')
      setContato('')
      setTelefone('')
      setCliente('')
      setObservacoes('')
      setAtivo(true)
    }
  }, [data, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setSubmitting(true)
    try {
      await onSave({
        nome: nome.trim(),
        contato: contato.trim() || undefined,
        telefone: telefone.trim() || undefined,
        cliente: cliente || undefined,
        observacoes: observacoes.trim() || undefined,
        ativo,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1F2937]">
            {data ? 'Editar Fornecedor / Fabricante' : 'Novo Fornecedor / Fabricante'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Razão Social / Nome Fantasia <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Nestlé Brasil, Ambev, M. Dias Branco"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">E-mail / Contato</Label>
              <Input
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="contato@fornecedor.com"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Telefone de Atendimento
              </Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 3000-0000"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Vinculado à Rede/Cliente (Opcional)
            </Label>
            <select
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            >
              <option value="">Atendimento Multicliente (Geral em todas as redes)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280]">
              Deixe em aberto para fornecedores que atendem várias redes de supermercados.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">Observações Operacionais</Label>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Dias de entrega, regras de troca, coordenador regional de vendas..."
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="fornecedor-ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded border-gray-300"
            />
            <label
              htmlFor="fornecedor-ativo"
              className="text-xs font-medium text-[#374151] cursor-pointer"
            >
              Fornecedor com contrato ativo
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
              disabled={submitting || !nome.trim()}
            >
              {submitting ? 'Salvando...' : 'Salvar Fornecedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
