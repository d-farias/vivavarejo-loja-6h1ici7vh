import React, { useState, useEffect } from 'react'
import type { Promotor, Fornecedor, User } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PromotorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Promotor | null
  fornecedores: Fornecedor[]
  usuarios: User[]
  onSave: (payload: Partial<Promotor>) => Promise<void>
}

export function PromotorModal({
  open,
  onOpenChange,
  data,
  fornecedores,
  usuarios,
  onSave,
}: PromotorModalProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [usuario, setUsuario] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) {
      setNome(data.nome || '')
      setEmail(data.email || '')
      setTelefone(data.telefone || '')
      setFornecedor(data.fornecedor || (fornecedores[0]?.id ?? ''))
      setUsuario(data.usuario || '')
      setAtivo(data.ativo !== false)
    } else {
      setNome('')
      setEmail('')
      setTelefone('')
      setFornecedor(fornecedores[0]?.id ?? '')
      setUsuario('')
      setAtivo(true)
    }
  }, [data, fornecedores, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !fornecedor) return

    setSubmitting(true)
    try {
      await onSave({
        nome: nome.trim(),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        fornecedor,
        usuario: usuario || undefined,
        ativo,
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
            {data ? 'Editar Promotor / Representante' : 'Novo Promotor / Representante'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Nome do Promotor <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Eduardo Silva"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Fornecedor / Indústria Representada <span className="text-red-500">*</span>
            </Label>
            <select
              required
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            >
              <option value="" disabled>
                Selecione a empresa fornecedora
              </option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.ativo === false ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">E-mail de Contato</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="promotor@empresa.com"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">Telefone / WhatsApp</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Vincular a Usuário do Sistema (opcional)
            </Label>
            <select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            >
              <option value="">Sem vínculo direto de login</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.email})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280]">
              Permite que o promotor acesse diretamente sua lista de visitas ao efetuar login.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="promotor-ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded border-gray-300"
            />
            <label
              htmlFor="promotor-ativo"
              className="text-xs font-medium text-[#374151] cursor-pointer"
            >
              Promotor ativo para agendamento de visitas
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
              disabled={submitting || !nome.trim() || !fornecedor}
            >
              {submitting ? 'Salvando...' : 'Salvar Promotor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
