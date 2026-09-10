import React, { useState, useEffect, useRef } from 'react'
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
  Sparkles,
  MoveHorizontal,
} from 'lucide-react'

export interface ConcluirVisitaPayload {
  conclusao_check: string
  rotinas_executadas?: string
  foto_trabalho?: File
  foto_gondola?: File
  foto_abastecimento?: File
  foto_validades?: File
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

export type CriterioFoco = 'abastecimento' | 'validades' | 'layout' | 'geral'

interface ConcluirVisitaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visita: VisitaPromotor | null
  rotinasDisponiveis?: RotinaPromotor[]
  focoInicial?: CriterioFoco
  onConcluir: (payload: ConcluirVisitaPayload | FormData) => Promise<void>
}

export function ConcluirVisitaModal({
  open,
  onOpenChange,
  visita,
  rotinasDisponiveis = [],
  focoInicial = 'geral',
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

  // Refs para scroll/foco imediato
  const checklistRef = useRef<HTMLDivElement>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll into view no foco em dispositivos móveis (evita corte com teclado virtual)
  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 280)
  }

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

      // Se abrir por um critério específico que não estava feito, pré-marca ou prepara para preenchimento
      if (focoInicial === 'abastecimento') {
        setChecklistAbastecimento(true)
      } else {
        setChecklistAbastecimento(visita.checklist_abastecimento_100 ?? true)
      }

      if (focoInicial === 'validades') {
        setChecklistValidades(true)
      } else {
        setChecklistValidades(visita.checklist_validades_ok ?? true)
      }

      if (focoInicial === 'layout') {
        setChecklistLayout(true)
      } else {
        setChecklistLayout(visita.checklist_layout_conforme ?? true)
      }

      setQuantidadeSortimento(visita.quantidade_sortimento ?? 30)
      setPercVendas(visita.perc_vendas ?? 95)
      setQtdRupturas(visita.qtd_rupturas ?? 0)
      setItensSemVendas(visita.itens_sem_vendas ?? 0)
      setResponsavelExecucao(visita.responsavel_execucao || 'Encarregado / GO')
      setValidadorFiscalizacao(visita.validador_fiscalizacao || 'Gerente de Loja')
      setFotoFile(null)

      // Se não havia resumo preenchido, sugerir texto baseado no foco
      if (!visita.conclusao_check) {
        if (focoInicial === 'layout') {
          setConclusaoCheck('Exposição e gôndola organizadas conforme planograma e foto anexada.')
        } else if (focoInicial === 'abastecimento') {
          setConclusaoCheck('Reposição e abastecimento 100% finalizados com foto comprobatória.')
        } else if (focoInicial === 'validades') {
          setConclusaoCheck('Auditoria de validades realizada e trocas segregadas.')
        }
      }

      // Foco suave
      setTimeout(() => {
        if (focoInicial !== 'geral') {
          checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
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
  }, [visita, open, focoInicial])

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

        // Se o foco era layout/gondola, alimentar também foto_gondola
        if (focoInicial === 'layout') {
          formData.append('foto_gondola', fotoFile)
        } else if (focoInicial === 'abastecimento') {
          formData.append('foto_abastecimento', fotoFile)
        } else if (focoInicial === 'validades') {
          formData.append('foto_validades', fotoFile)
        }

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
      <DialogContent className="w-[96vw] max-w-[580px] p-0 gap-0 overflow-hidden bg-white max-h-[94vh] flex flex-col rounded-xl border border-[#E5E7EB] shadow-2xl">
        {/* Cabeçalho fixo no topo do modal */}
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#E5E7EB] bg-white shrink-0 text-left">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />
            <span className="truncate">Avaliação & Conclusão de Visita</span>
          </DialogTitle>
        </DialogHeader>

        {/* Corpo rolável com suporte a rolagem suave, sem corte horizontal e com padding extra para safe-area */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-mobile-vertical flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-4 text-left"
        >
          {/* Card resumo da visita */}
          <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg p-3 space-y-1.5 text-xs text-[#4B5563]">
            <div className="flex items-center gap-2 font-semibold text-[#1F2937] flex-wrap">
              <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span className="break-words">{promotorNome}</span>
              {fornecedorNome && <span className="text-[#6B7280]">({fornecedorNome})</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                <span className="break-words">{lojaNome}</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                <span>
                  {visita.data_visita ? visita.data_visita.substring(0, 10) : ''}{' '}
                  {visita.hora_prevista ? `às ${visita.hora_prevista}` : ''}
                </span>
              </span>
              {visita.check_in && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-700 font-medium">
                    Check-in:{' '}
                    {new Date(visita.check_in).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>
            {visita.observacoes && (
              <div className="pt-1 border-t border-[#E5E7EB] text-[#6B7280] italic break-words">
                Objetivo: {visita.observacoes}
              </div>
            )}
          </div>

          {focoInicial !== 'geral' && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-[#1E40AF] flex items-start sm:items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5 sm:mt-0" />
              <span className="break-words">
                Preenchimento rápido para o critério:{' '}
                <b>
                  {focoInicial === 'layout'
                    ? 'Layout / Gôndola Conforme'
                    : focoInicial === 'abastecimento'
                      ? 'Abastecimento 100%'
                      : 'Validades OK'}
                </b>
                . Marque o critério e anexe a foto comprobatória abaixo.
              </span>
            </div>
          )}

          <form id="concluir-visita-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Checklist Expresso do Usuário: Abastecimento 100%, Validades e Layout */}
            <div
              ref={checklistRef}
              className={`p-3 rounded-lg space-y-2 border ${
                focoInicial !== 'geral'
                  ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100'
                  : 'bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider truncate">
                    Checklist Operacional da Visita
                  </div>
                </div>
                <span className="text-[10px] text-[#2563EB] font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0">
                  Toque para marcar
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label
                  className={`flex items-start sm:items-center gap-2 cursor-pointer p-1.5 rounded transition-colors ${
                    focoInicial === 'abastecimento'
                      ? 'bg-blue-100/60 font-bold text-[#1E3A8A]'
                      : 'font-medium text-[#1F2937] hover:bg-white/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklistAbastecimento}
                    onChange={(e) => setChecklistAbastecimento(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-[#2563EB] rounded border-gray-300 shrink-0"
                  />
                  <span className="break-words">
                    Abastecimento 100% com base no estoque em loja (critério reposição)
                  </span>
                </label>

                <label
                  className={`flex items-start sm:items-center gap-2 cursor-pointer p-1.5 rounded transition-colors ${
                    focoInicial === 'validades'
                      ? 'bg-blue-100/60 font-bold text-[#1E3A8A]'
                      : 'font-medium text-[#1F2937] hover:bg-white/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklistValidades}
                    onChange={(e) => setChecklistValidades(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-[#2563EB] rounded border-gray-300 shrink-0"
                  />
                  <span className="break-words">
                    Validades auditadas (FIFO aplicado e separação de trocas/quebras)
                  </span>
                </label>

                <label
                  className={`flex items-start sm:items-center gap-2 cursor-pointer p-1.5 rounded transition-colors ${
                    focoInicial === 'layout'
                      ? 'bg-blue-100/60 font-bold text-[#1E3A8A]'
                      : 'font-medium text-[#1F2937] hover:bg-white/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklistLayout}
                    onChange={(e) => setChecklistLayout(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-[#2563EB] rounded border-gray-300 shrink-0"
                  />
                  <span className="break-words">
                    Implantação conforme layout (espaço contratado em gôndola respeitado)
                  </span>
                </label>
              </div>
            </div>

            {/* Foto de Abastecido / Trabalho Realizado (Mandatória) */}
            <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Camera className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <Label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider truncate">
                    Foto do Trabalho / Gôndola <span className="text-red-500">*</span>
                  </Label>
                </div>
                <span className="text-[10px] text-[#2563EB] font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0">
                  Obrigatório
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] break-words">
                {focoInicial === 'layout'
                  ? 'Anexe a foto da exposição ou gôndola para comprovação visual imediata.'
                  : 'Registre ou anexe a foto da gôndola abastecida conforme layout para validação pela gerência.'}
              </p>
              <Input
                ref={fotoInputRef}
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
                <div className="text-[11px] text-emerald-700 font-medium break-all">
                  ✓ Arquivo selecionado: {fotoFile.name} ({(fotoFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
              {visita.foto_trabalho && !fotoFile && (
                <div className="text-[11px] text-[#6B7280]">
                  Já existe foto registrada nesta visita. Enviar novo arquivo substituirá a foto
                  atual.
                </div>
              )}
            </div>

            {/* Indicadores Integráveis com ERP (Vendas, Rupturas, Sem Vendas, Sortimento) */}
            {/* Bloco com indicação de rolagem e scrollbar visível quando em telas estreitas */}
            <div className="p-3 bg-gray-50 border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <BarChart2 className="w-4 h-4 text-[#4B5563] shrink-0" />
                  <div className="text-xs font-bold text-[#1F2937] uppercase tracking-wider truncate">
                    Indicadores de Sortimento & Loja
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="hidden sm:inline-flex text-[10px] text-[#6B7280] font-medium items-center gap-0.5">
                    <MoveHorizontal className="w-3 h-3 text-[#9CA3AF]" />
                    Arrastar lado
                  </span>
                  <span className="text-[10px] font-semibold text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                    ERP / Manual
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Preencha os indicadores da visita ou mantenha os valores sincronizados. Se os campos
                ficarem justos no celular, deslize para o lado.
              </p>

              {/* Contêiner de rolagem horizontal dedicada para os 4 campos de indicadores */}
              <div className="scrollbar-thin-horizontal w-full pb-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 min-w-[280px]">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-[#374151]">
                      Qtd Sortimento
                    </Label>
                    <Input
                      type="number"
                      value={quantidadeSortimento}
                      onChange={(e) => setQuantidadeSortimento(e.target.value)}
                      onFocus={handleInputFocus}
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
                      onFocus={handleInputFocus}
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
                      onFocus={handleInputFocus}
                      placeholder="0"
                      className="text-xs h-8 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-[#374151]">
                      Itens sem Venda
                    </Label>
                    <Input
                      type="number"
                      value={itensSemVendas}
                      onChange={(e) => setItensSemVendas(e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                      className="text-xs h-8 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Governança de Validação: Encarregado executa, Gerente fiscaliza */}
            <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
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
                    onFocus={handleInputFocus}
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
                    onFocus={handleInputFocus}
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
                <div className="space-y-1.5 max-h-36 scrollbar-mobile-vertical border border-[#E5E7EB] rounded-md p-2 bg-gray-50/50">
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
                          className="w-4 h-4 mt-0.5 text-[#2563EB] rounded border-gray-300 shrink-0"
                        />
                        <div className="text-xs min-w-0">
                          <div className="font-medium text-[#1F2937] break-words">{rot.titulo}</div>
                          {rot.descricao && (
                            <div className="text-[11px] text-[#6B7280] leading-tight break-words">
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
                ref={textareaRef}
                required
                rows={3}
                value={conclusaoCheck}
                onChange={(e) => setConclusaoCheck(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Ex: Abastecimento de 15 caixas de biscoito, gôndola alinhada com layout, sem rupturas. Validades conferidas."
                className="text-sm bg-white"
              />
            </div>
          </form>
        </div>

        {/* Rodapé Fixo de Ações - Sempre visível, nunca encoberto por teclado ou barra de navegação */}
        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#E5E7EB] bg-[#F7F7F5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto h-10 sm:h-9 text-xs font-semibold"
          >
            Voltar
          </Button>
          <Button
            form="concluir-visita-form"
            type="submit"
            className="w-full sm:w-auto h-10 sm:h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
            disabled={submitting || !conclusaoCheck.trim()}
          >
            {submitting ? 'Salvando...' : 'Confirmar e Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
