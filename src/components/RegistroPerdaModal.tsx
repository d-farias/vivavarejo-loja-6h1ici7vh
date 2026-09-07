import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { perdasService } from '@/services/perdas'
import type { MotivoPerda, Perda, Loja } from '@/types'
import { AlertOctagon, Camera, Loader2, Sparkles, X } from 'lucide-react'

interface RegistroPerdaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojas: Loja[]
  lojaSelecionadaId?: string
  initialSetor?: string
  initialMotivo?: MotivoPerda
  userId?: string
  onSaved: (perda: Perda) => void
}

const SETORES_PADRAO = [
  'Hortifrúti / FLV',
  'Açougue / Carnes',
  'Padaria & Confeitaria',
  'Frios e Laticínios',
  'Mercearia Seca',
  'Mercearia Doce',
  'Bebidas',
  'Limpeza',
  'Higiene e Beleza / Perfumaria',
  'Congelados',
  'Bazar / Utilidades',
  'Outro',
]

const MOTIVOS_OPTIONS: { id: MotivoPerda; label: string; desc: string }[] = [
  { id: 'vencimento', label: 'Vencimento', desc: 'Item perdeu a data de validade' },
  { id: 'avaria', label: 'Avaria', desc: 'Embalagem rasgada/quebrada' },
  { id: 'roubo', label: 'Furto / Roubo', desc: 'Furto interno ou externo' },
  { id: 'erro de pedido', label: 'Erro de Pedido', desc: 'Sobra ou pedido incorreto' },
  { id: 'outro', label: 'Outro Motivo', desc: 'Descarte operacional diverso' },
]

export function RegistroPerdaModal({
  open,
  onOpenChange,
  lojas,
  lojaSelecionadaId,
  initialSetor = '',
  initialMotivo = 'vencimento',
  userId,
  onSaved,
}: RegistroPerdaModalProps) {
  const [lojaId, setLojaId] = useState<string>(lojaSelecionadaId || lojas[0]?.id || '')
  const [setor, setSetor] = useState<string>(initialSetor || SETORES_PADRAO[0])
  const [setorCustom, setSetorCustom] = useState<string>('')
  const [motivo, setMotivo] = useState<MotivoPerda>(initialMotivo)
  const [dataPerda, setDataPerda] = useState<string>(new Date().toISOString().substring(0, 10))
  const [itemDescricao, setItemDescricao] = useState<string>('')
  const [quantidade, setQuantidade] = useState<string>('1')
  const [valorEstimado, setValorEstimado] = useState<string>('')
  const [observacao, setObservacao] = useState<string>('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Reset initial values ao abrir
  React.useEffect(() => {
    if (open) {
      setLojaId(lojaSelecionadaId || lojas[0]?.id || '')
      setSetor(initialSetor || SETORES_PADRAO[0])
      setSetorCustom('')
      setMotivo(initialMotivo)
      setDataPerda(new Date().toISOString().substring(0, 10))
      setItemDescricao('')
      setQuantidade('1')
      setValorEstimado('')
      setObservacao('')
      setFotoFile(null)
      setFotoPreview(null)
      setErro(null)
    }
  }, [open, lojaSelecionadaId, lojas, initialSetor, initialMotivo])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const setorFinal = setor === 'Outro' ? setorCustom.trim() : setor.trim()
    if (!setorFinal) {
      setErro('Informe o setor/categoria da perda.')
      return
    }

    const qtdNum = Number(quantidade.replace(',', '.'))
    if (isNaN(qtdNum) || qtdNum <= 0) {
      setErro('Informe uma quantidade válida maior que zero.')
      return
    }

    const valNum = Number(valorEstimado.replace(',', '.'))
    if (isNaN(valNum) || valNum < 0) {
      setErro('Informe um valor estimado válido em R$.')
      return
    }

    setLoading(true)
    try {
      const novaPerda = await perdasService.create({
        loja: lojaId || undefined,
        data: dataPerda,
        setor_categoria: setorFinal,
        motivo,
        item_descricao: itemDescricao.trim() || undefined,
        quantidade: qtdNum,
        valor_estimado: valNum,
        observacao: observacao.trim() || undefined,
        registrado_por: userId || undefined,
        fotoFile,
      })

      onSaved(novaPerda)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao registrar perda:', err)
      setErro(err?.message || 'Erro ao registrar perda no banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-[#B91C1C] flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#1F2937]">
                Registro Rápido de Perda
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B7280]">
                2 toques para apontar perdas de validade, quebras ou avarias na loja
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {erro && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#B91C1C] text-xs">
              {erro}
            </div>
          )}

          {/* Loja e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lojas.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#374151]">Loja</Label>
                <select
                  value={lojaId}
                  onChange={(e) => setLojaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#2563EB]"
                >
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} {l.codigo ? `(${l.codigo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#374151]">Data do Registro</Label>
              <Input
                type="date"
                value={dataPerda}
                onChange={(e) => setDataPerda(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Motivo da Perda (Toque Rápido) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Motivo Principal <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOTIVOS_OPTIONS.map((opt) => {
                const isSelected = motivo === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMotivo(opt.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB] shadow-2xs'
                        : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-xs leading-tight">{opt.label}</div>
                    <div className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Setor / Categoria (Toque Rápido) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Setor / Categoria <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#F7F7F5] rounded-md border border-[#E5E7EB]">
              {SETORES_PADRAO.map((s) => {
                const isSelected = setor === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSetor(s)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            {setor === 'Outro' && (
              <Input
                type="text"
                placeholder="Digite o nome do setor..."
                value={setorCustom}
                onChange={(e) => setSetorCustom(e.target.value)}
                className="text-xs mt-1.5"
                required
              />
            )}
          </div>

          {/* Descrição do Item (opcional) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#374151]">
              Item / Produto (opcional)
            </Label>
            <Input
              type="text"
              placeholder="Ex: Iogurte Grego 100g, Peito de Frango resfriado..."
              value={itemDescricao}
              onChange={(e) => setItemDescricao(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Quantidade e Valor Estimado R$ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#374151]">
                Quantidade <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder="Ex: 5"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#374151]">
                Valor Estimado (R$) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B7280]">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value)}
                  required
                  className="text-xs pl-9"
                />
              </div>
            </div>
          </div>

          {/* Foto Opcional de Prova */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151] flex items-center justify-between">
              <span>Foto de Comprovação (opcional)</span>
              <span className="text-[10px] text-[#6B7280]">Ajuda na auditoria</span>
            </Label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[#F7F7F5] border border-[#E5E7EB] hover:border-[#2563EB] rounded-md text-xs font-medium text-[#374151] transition-colors">
                <Camera className="w-4 h-4 text-[#2563EB]" />
                <span>{fotoFile ? 'Trocar foto' : 'Tirar / Anexar foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>

              {fotoPreview && (
                <div className="relative group">
                  <img
                    src={fotoPreview}
                    alt="Pré-visualização"
                    className="w-12 h-12 object-cover rounded-md border border-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoFile(null)
                      setFotoPreview(null)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                    title="Remover foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#374151]">Observação operacional</Label>
            <Textarea
              rows={2}
              placeholder="Ex: Produto recolhido da gôndola 2 após ronda matinal..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="flex-row justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs inline-flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Registrar Perda</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
