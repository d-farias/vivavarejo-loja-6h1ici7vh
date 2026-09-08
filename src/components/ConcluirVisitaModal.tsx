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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  Clock,
  Store,
  UserCheck,
  Camera,
  CheckSquare,
  BarChart2,
  ShieldCheck,
} from 'lucide-react'

export interface ConcluirVisitaPayload {
  conclusao_check: string
  rotinas_executadas?: string
  foto_trabalho?: File
  checklist_abastecimento_100: boolean
  checklist_validades_ok: boolean
  checklist_layout_conforme: boolean
  quantidade_sortimento?: number
  perc_vendas?: number
  qtd_rupturas?: number
  itens_sem_vendas?: number
  responsavel_execucao?: string
  validador_fiscalizacao?: string
}

interface ConcluirVisitaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visita: VisitaPromotor | null
  rotinasDisponiveis?: RotinaPromotor[]
  onConcluir: (payload: ConcluirVisitaPayload | FormData) => Promise<void>
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
  const [fotoFile, setFotoFile] = useState<File | null>(null)

  // Checklist de Visita exigido textualmente pelo usuário
  const [checklistAbastecimento, setChecklistAbastecimento] = useState(true)
  const [checklistValidades, setChecklistValidades] = useState(true)
  const [checklistLayout, setChecklistLayout] = useState(true)

  // Indicadores de Sortimento e ERP
  const [quantidadeSortimento, setQuantidadeSortimento] = useState<number | string>(30)
  const [percVendas, setPercVendas] = useState<number | string>(95)
  const [qtdRupturas, setQtdRupturas] = useState<number | string>(0)
  const [itensSemVendas, setItensSemVendas] = useState<number | string>(0)

  // Governança: Encarregado/GO garante, Gerente fiscaliza
  const [responsavelExecucao, setResponsavelExecucao] = useState('Encarregado / GO')
  const [validadorFiscalizacao, setValidadorFiscalizacao] = useState('Gerente de Loja')

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
      setChecklistAbastecimento(visita.checklist_abastecimento_100 ?? true)
      setChecklistValidades(visita.checklist_validades_ok ?? true)
      setChecklistLayout(visita.checklist_layout_conforme ?? true)
      setQuantidadeSortimento(visita.quantidade_sortimento ?? 30)
      setPercVendas(visita.perc_vendas ?? 95)
      setQtdRupturas(visita.qtd_rupturas ?? 0)
      setItensSemVendas(visita.itens_sem_vendas ?? 0)
      setResponsavelExecucao(visita.responsavel_execucao || 'Encarregado / GO')
      setValidadorFiscalizacao(visita.validador_fiscalizacao || 'Gerente de Loja')
      setFotoFile(null)
    } else {
      setConclusaoCheck('')
      setSelectedRotinas([])
      setChecklistAbastecimento(true)
      setChecklistValidades(true)
      setChecklistLayout(true)
      setQuantidadeSortimento(30)
      setPercVendas(95)
      setQtdRupturas(0)
      setItensSemVendas(0)
      setResponsavelExecucao('Encarregado / GO')
      setValidadorFiscalizacao('Gerente de Loja')
      setFotoFile(null)
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

      if (fotoFile) {
        const formData = new FormData()
        formData.append('conclusao_check', conclusaoCheck.trim())
        if (rotinasTexto) formData.append('rotinas_executadas', rotinasTexto)
        formData.append('checklist_abastecimento_100', String(checklistAbastecimento))
        formData.append('checklist_validades_ok', String(checklistValidades))
        formData.append('checklist_layout_conforme', String(checklistLayout))
        if (quantidadeSortimento !== '')
          formData.append('quantidade_sortimento', String(quantidadeSortimento))
        if (percVendas !== '') formData.append('perc_vendas', String(percVendas))
        if (qtdRupturas !== '') formData.append('qtd_rupturas', String(qtdRupturas))
        if (itensSemVendas !== '') formData.append('itens_sem_vendas', String(itensSemVendas))
        formData.append('responsavel_execucao', responsavelExecucao)
        formData.append('validador_fiscalizacao', validadorFiscalizacao)
        formData.append('foto_trabalho', fotoFile)
        await onConcluir(formData)
      } else {
        await onConcluir({
          conclusao_check: conclusaoCheck.trim(),
          rotinas_executadas: rotinasTexto,
          checklist_abastecimento_100: checklistAbastecimento,
          checklist_validades_ok: checklistValidades,
          checklist_layout_conforme: checklistLayout,
          quantidade_sortimento:
            quantidadeSortimento !== '' ? Number(quantidadeSortimento) : undefined,
          perc_vendas: percVendas !== '' ? Number(percVendas) : undefined,
          qtd_rupturas: qtdRupturas !== '' ? Number(qtdRupturas) : undefined,
          itens_sem_vendas: itensSemVendas !== '' ? Number(itensSemVendas) : undefined,
          responsavel_execucao: responsavelExecucao,
          validador_fiscalizacao: validadorFiscalizacao,
        })
      }
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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
            <span>Avaliação & Conclusão de Visita</span>
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
          {/* Checklist Expresso do Usuário: Abastecimento 100%, Validades e Layout */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-700" />
              <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Checklist Operacional da Visita (Padrão de Reposição)
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={checklistAbastecimento}
                  onChange={(e) => setChecklistAbastecimento(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded border-gray-300"
                />
                <span>Abastecimento 100% com base no estoque em loja (critério reposição)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={checklistValidades}
                  onChange={(e) => setChecklistValidades(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded border-gray-300"
                />
                <span>Validades auditadas (FIFO aplicado e separação de trocas/quebras)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={checklistLayout}
                  onChange={(e) => setChecklistLayout(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded border-gray-300"
                />
                <span>Implantação conforme layout (espaço contratado em gôndola respeitado)</span>
              </label>
            </div>
          </div>

          {/* Foto de Abastecido / Trabalho Realizado (Mandatória) */}
          <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#2563EB]" />
                <Label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                  Foto do Trabalho Realizado / Gôndola Abastecida{' '}
                  <span className="text-red-500">*</span>
                </Label>
              </div>
              <span className="text-[10px] text-[#2563EB] font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">
                Obrigatório para Auditoria
              </span>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              Registre ou anexe a foto da gôndola abastecida conforme layout para validação pela
              gerência.
            </p>
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
                ✓ Arquivo selecionado: {fotoFile.name} ({(fotoFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          {/* Indicadores Integráveis com ERP (Vendas, Rupturas, Sem Vendas, Sortimento) */}
          <div className="p-3 bg-gray-50 border border-[#E5E7EB] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#4B5563]" />
                <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                  Indicadores de Sortimento & Loja
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                ERP / Manual
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Preencha os indicadores da visita ou aguarde sincronização futura via integração ERP.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-[#374151]">Qtd Sortimento</Label>
                <Input
                  type="number"
                  value={quantidadeSortimento}
                  onChange={(e) => setQuantidadeSortimento(e.target.value)}
                  placeholder="30"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-[#374151]">% Vendas</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={percVendas}
                  onChange={(e) => setPercVendas(e.target.value)}
                  placeholder="95.0"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-[#374151]">Rupturas</Label>
                <Input
                  type="number"
                  value={qtdRupturas}
                  onChange={(e) => setQtdRupturas(e.target.value)}
                  placeholder="0"
                  className="text-xs h-8 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-[#374151]">Itens sem Venda</Label>
                <Input
                  type="number"
                  value={itensSemVendas}
                  onChange={(e) => setItensSemVendas(e.target.value)}
                  placeholder="0"
                  className="text-xs h-8 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Governança de Validação: Encarregado executa, Gerente fiscaliza */}
          <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Governança & Fiscalização
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-[11px] font-semibold text-[#374151]">
                  Responsável Execução
                </Label>
                <Input
                  value={responsavelExecucao}
                  onChange={(e) => setResponsavelExecucao(e.target.value)}
                  className="text-xs h-8 bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-[#374151]">
                  Fiscalização / Validação
                </Label>
                <Input
                  value={validadorFiscalizacao}
                  onChange={(e) => setValidadorFiscalizacao(e.target.value)}
                  className="text-xs h-8 bg-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Checklist de Rotinas Operacionais do Promotor */}
          {rotinasDisponiveis.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#374151]">
                Rotinas de Trabalho Executadas nesta Visita:
              </Label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-[#E5E7EB] rounded-md p-2 bg-gray-50/50">
                {rotinasDisponiveis.map((rot) => {
                  const checked = selectedRotinas.includes(rot.titulo)
                  return (
                    <label
                      key={rot.id}
                      className="flex items-start gap-2.5 p-1 rounded hover:bg-white cursor-pointer transition-colors"
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
              rows={3}
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
              {submitting ? 'Salvando...' : 'Confirmar Avaliação e Concluir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
