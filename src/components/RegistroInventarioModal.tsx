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
import { inventariosService } from '@/services/inventarios'
import type { TipoInventario, StatusInventario, Inventario, Loja } from '@/types'
import { ClipboardList, Loader2, Sparkles } from 'lucide-react'

interface RegistroInventarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojas: Loja[]
  lojaSelecionadaId?: string
  initialSetor?: string
  userId?: string
  userName?: string
  onSaved: (inv: Inventario) => void
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
  'Geral (Loja Inteira)',
  'Outro',
]

export function RegistroInventarioModal({
  open,
  onOpenChange,
  lojas,
  lojaSelecionadaId,
  initialSetor = '',
  userId,
  userName,
  onSaved,
}: RegistroInventarioModalProps) {
  const [lojaId, setLojaId] = useState<string>(lojaSelecionadaId || lojas[0]?.id || '')
  const [dataInv, setDataInv] = useState<string>(new Date().toISOString().substring(0, 10))
  const [setor, setSetor] = useState<string>(initialSetor || SETORES_PADRAO[0])
  const [setorCustom, setSetorCustom] = useState<string>('')
  const [tipo, setTipo] = useState<TipoInventario>('rotativo')
  const [status, setStatus] = useState<StatusInventario>('concluido')
  const [itensContados, setItensContados] = useState<string>('')
  const [divergencias, setDivergencias] = useState<string>('0')
  const [acuracidade, setAcuracidade] = useState<string>('100')
  const [responsavelNome, setResponsavelNome] = useState<string>(userName || '')
  const [observacao, setObservacao] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setLojaId(lojaSelecionadaId || lojas[0]?.id || '')
      setDataInv(new Date().toISOString().substring(0, 10))
      setSetor(initialSetor || SETORES_PADRAO[0])
      setSetorCustom('')
      setTipo('rotativo')
      setStatus('concluido')
      setItensContados('')
      setDivergencias('0')
      setAcuracidade('100')
      setResponsavelNome(userName || '')
      setObservacao('')
      setErro(null)
    }
  }, [open, lojaSelecionadaId, lojas, initialSetor, userName])

  // Recalcula acuracidade aproximada ao digitar itens contados e divergências
  const handleCalcularAcuracidade = (contadosStr: string, divergenciasStr: string) => {
    const c = Number(contadosStr)
    const d = Number(divergenciasStr)
    if (!isNaN(c) && c > 0 && !isNaN(d)) {
      const acur = Math.max(0, Math.min(100, Math.round(((c - d) / c) * 100)))
      setAcuracidade(String(acur))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const setorFinal = setor === 'Outro' ? setorCustom.trim() : setor.trim()
    if (!setorFinal) {
      setErro('Informe o setor/categoria do inventário.')
      return
    }

    const cNum = itensContados ? Number(itensContados) : undefined
    const dNum = divergencias ? Number(divergencias) : undefined
    const aNum = acuracidade ? Number(acuracidade) : undefined

    setLoading(true)
    try {
      const novo = await inventariosService.create({
        loja: lojaId || undefined,
        data: dataInv,
        setor_categoria: setorFinal,
        tipo,
        status,
        itens_contados: cNum,
        divergencias_encontradas: dNum,
        acuracidade_percentual: aNum,
        responsavel_nome: responsavelNome.trim() || undefined,
        responsavel_usuario: userId || undefined,
        observacao: observacao.trim() || undefined,
      })

      onSaved(novo)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao registrar inventário:', err)
      setErro(err?.message || 'Erro ao salvar registro de inventário.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#1F2937]">
                Registrar Contagem de Inventário
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B7280]">
                Apontamento de inventário rotativo por setor ou geral da loja
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
              <Label className="text-xs font-semibold text-[#374151]">Data da Contagem</Label>
              <Input
                type="date"
                value={dataInv}
                onChange={(e) => setDataInv(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Tipo de Inventário (Rotativo vs Geral) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">Tipo de Inventário</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('rotativo')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  tipo === 'rotativo'
                    ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB]'
                    : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                }`}
              >
                <div className="font-semibold text-xs">Rotativo (Setor)</div>
                <div className="text-[10px] text-[#6B7280]">Contagem diária ou semanal</div>
              </button>
              <button
                type="button"
                onClick={() => setTipo('geral')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  tipo === 'geral'
                    ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB]'
                    : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                }`}
              >
                <div className="font-semibold text-xs">Geral (Loja)</div>
                <div className="text-[10px] text-[#6B7280]">Balanço completo da unidade</div>
              </button>
            </div>
          </div>

          {/* Setor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#374151]">
              Setor Contado <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-[#F7F7F5] rounded-md border border-[#E5E7EB]">
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
                placeholder="Nome do setor..."
                value={setorCustom}
                onChange={(e) => setSetorCustom(e.target.value)}
                className="text-xs mt-1.5"
                required
              />
            )}
          </div>

          {/* Itens contados e Divergências */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#374151]">Itens contados</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 120"
                value={itensContados}
                onChange={(e) => {
                  setItensContados(e.target.value)
                  handleCalcularAcuracidade(e.target.value, divergencias)
                }}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#374151]">Divergências</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 2"
                value={divergencias}
                onChange={(e) => {
                  setDivergencias(e.target.value)
                  handleCalcularAcuracidade(itensContados, e.target.value)
                }}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#374151]">Acuracidade %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={acuracidade}
                onChange={(e) => setAcuracidade(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#374151]">
              Responsável pela Contagem
            </Label>
            <Input
              type="text"
              placeholder="Ex: Carlos (Líder Prevenção)"
              value={responsavelNome}
              onChange={(e) => setResponsavelNome(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Observação */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#374151]">
              Observações do Inventário
            </Label>
            <Textarea
              rows={2}
              placeholder="Ex: Contagem realizada com coletor antes da abertura..."
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
                  <span>Salvar Inventário</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
