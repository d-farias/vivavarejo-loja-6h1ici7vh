import React, { useState, useEffect } from 'react'
import type { Fornecedor, Cliente, PoliticaQuebras } from '@/types'
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
import { UserCheck, Layers, AlertCircle } from 'lucide-react'

interface FornecedorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Fornecedor | null
  clientes: Cliente[]
  onSave: (payload: Partial<Fornecedor> | FormData) => Promise<void>
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

  // Novos campos exigidos pelo usuário (Frente 2)
  const [compradorNome, setCompradorNome] = useState('')
  const [compradorCategoria, setCompradorCategoria] = useState('')
  const [compradorTelefone, setCompradorTelefone] = useState('')
  const [compradorEmail, setCompradorEmail] = useState('')
  const [layoutDescricao, setLayoutDescricao] = useState('')
  const [frequenciaSemanal, setFrequenciaSemanal] = useState('')
  const [politicaQuebras, setPoliticaQuebras] = useState<PoliticaQuebras>('troca_total')
  const [layoutFotoFile, setLayoutFotoFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) {
      setNome(data.nome || '')
      setContato(data.contato || '')
      setTelefone(data.telefone || '')
      setCliente(data.cliente || '')
      setObservacoes(data.observacoes || '')
      setAtivo(data.ativo !== false)
      setCompradorNome(data.comprador_nome || '')
      setCompradorCategoria(data.comprador_categoria || '')
      setCompradorTelefone(data.comprador_telefone || '')
      setCompradorEmail(data.comprador_email || '')
      setLayoutDescricao(data.layout_descricao || '')
      setFrequenciaSemanal(data.frequencia_semanal || '')
      setPoliticaQuebras(data.politica_quebras || 'troca_total')
      setLayoutFotoFile(null)
    } else {
      setNome('')
      setContato('')
      setTelefone('')
      setCliente('')
      setObservacoes('')
      setAtivo(true)
      setCompradorNome('')
      setCompradorCategoria('')
      setCompradorTelefone('')
      setCompradorEmail('')
      setLayoutDescricao('')
      setFrequenciaSemanal('')
      setPoliticaQuebras('troca_total')
      setLayoutFotoFile(null)
    }
  }, [data, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setSubmitting(true)
    try {
      // Se houver arquivo para upload, usar FormData
      if (layoutFotoFile) {
        const formData = new FormData()
        formData.append('nome', nome.trim())
        if (contato.trim()) formData.append('contato', contato.trim())
        if (telefone.trim()) formData.append('telefone', telefone.trim())
        if (cliente) formData.append('cliente', cliente)
        if (observacoes.trim()) formData.append('observacoes', observacoes.trim())
        formData.append('ativo', String(ativo))
        if (compradorNome.trim()) formData.append('comprador_nome', compradorNome.trim())
        if (compradorCategoria.trim())
          formData.append('comprador_categoria', compradorCategoria.trim())
        if (compradorTelefone.trim())
          formData.append('comprador_telefone', compradorTelefone.trim())
        if (compradorEmail.trim()) formData.append('comprador_email', compradorEmail.trim())
        if (layoutDescricao.trim()) formData.append('layout_descricao', layoutDescricao.trim())
        if (frequenciaSemanal.trim())
          formData.append('frequencia_semanal', frequenciaSemanal.trim())
        formData.append('politica_quebras', politicaQuebras)
        formData.append('layout_foto', layoutFotoFile)
        await onSave(formData)
      } else {
        await onSave({
          nome: nome.trim(),
          contato: contato.trim() || undefined,
          telefone: telefone.trim() || undefined,
          cliente: cliente || undefined,
          observacoes: observacoes.trim() || undefined,
          ativo,
          comprador_nome: compradorNome.trim() || undefined,
          comprador_categoria: compradorCategoria.trim() || undefined,
          comprador_telefone: compradorTelefone.trim() || undefined,
          comprador_email: compradorEmail.trim() || undefined,
          layout_descricao: layoutDescricao.trim() || undefined,
          frequencia_semanal: frequenciaSemanal.trim() || undefined,
          politica_quebras: politicaQuebras,
        })
      }
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
              <Label className="text-xs font-semibold text-[#374151]">E-mail / Representante</Label>
              <Input
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="contato@fornecedor.com"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Telefone da Indústria / Representante
              </Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 3000-0000"
                className="text-sm"
              />
            </div>
          </div>

          {/* Seção Comprador / Gestor de Categoria (Pedido expresso do usuário) */}
          <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#2563EB]" />
              <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Comprador / Gestor de Categoria
              </div>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              Contato direto do comprador responsável na rede para aviso imediato caso o promotor
              não compareça.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#374151]">
                  Nome do Comprador / Gestor
                </Label>
                <Input
                  value={compradorNome}
                  onChange={(e) => setCompradorNome(e.target.value)}
                  placeholder="Ex: Carlos Compras / Renata Gestora"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#374151]">
                  Categoria / Linha
                </Label>
                <Input
                  value={compradorCategoria}
                  onChange={(e) => setCompradorCategoria(e.target.value)}
                  placeholder="Ex: Mercearia Doce, Bebidas, Higiene"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#374151]">
                  WhatsApp / Telefone Comprador
                </Label>
                <Input
                  value={compradorTelefone}
                  onChange={(e) => setCompradorTelefone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#374151]">E-mail Comprador</Label>
                <Input
                  type="email"
                  value={compradorEmail}
                  onChange={(e) => setCompradorEmail(e.target.value)}
                  placeholder="comprador@varejo.com.br"
                  className="text-xs h-8 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Seção Comercial, Implantação e Layout (Pedido expresso do usuário) */}
          <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Comercial, Layout & Quebras
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#374151]">
                  Frequência Semanal
                </Label>
                <Input
                  value={frequenciaSemanal}
                  onChange={(e) => setFrequenciaSemanal(e.target.value)}
                  placeholder="Ex: 3x por semana (Seg / Qua / Sex)"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-[#374151]">
                  Política de Quebras
                </Label>
                <select
                  value={politicaQuebras}
                  onChange={(e) => setPoliticaQuebras(e.target.value as PoliticaQuebras)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] h-8"
                >
                  <option value="troca_total">Troca Total (100% recolhido pelo promotor)</option>
                  <option value="troca_parcial">Troca Parcial (mediante nota / bonificação)</option>
                  <option value="sem_troca_avaria_loja">
                    Sem Troca (quebra/avaria por conta da loja)
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#374151]">
                Espaço em Gôndola / Layout Contratado
              </Label>
              <Textarea
                rows={2}
                value={layoutDescricao}
                onChange={(e) => setLayoutDescricao(e.target.value)}
                placeholder="Ex: 2 módulos de 1,20m no corredor 3; itens principais na 3ª e 4ª prateleira (altura dos olhos)."
                className="text-xs bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#374151]">
                Foto / Planograma do Layout (Opcional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setLayoutFotoFile(file)
                }}
                className="text-xs bg-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#2563EB]/10 file:text-[#2563EB]"
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
