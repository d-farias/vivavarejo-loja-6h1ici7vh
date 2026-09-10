import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2,
  XCircle,
  Camera,
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'

export interface ExecucaoGuiadaResult {
  conforme: boolean
  fotoFile?: File
  observacao?: string
}

interface ExecucaoGuiadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  subtitulo?: string
  horarioLimite?: string
  responsavel?: string
  ferramenta?: string
  validacao?: string
  observacoesOriginais?: string
  onConcluir: (result: ExecucaoGuiadaResult) => Promise<void>
}

type EtapaFluxo = 1 | 2 | 3 | 4

export function ExecucaoGuiadaModal({
  open,
  onOpenChange,
  titulo,
  subtitulo,
  horarioLimite,
  responsavel,
  ferramenta,
  validacao,
  observacoesOriginais,
  onConcluir,
}: ExecucaoGuiadaModalProps) {
  const [etapa, setEtapa] = useState<EtapaFluxo>(1)
  const [conforme, setConforme] = useState<boolean | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Reset do estado ao abrir
  React.useEffect(() => {
    if (open) {
      setEtapa(1)
      setConforme(null)
      setFotoFile(null)
      setFotoPreview(null)
      setObservacao('')
      setSalvando(false)
    }
  }, [open])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFotoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFotoPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFinalizar = async () => {
    if (conforme === null) return
    setSalvando(true)
    try {
      await onConcluir({
        conforme,
        fotoFile: fotoFile || undefined,
        observacao: observacao.trim() || undefined,
      })
      onOpenChange(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 overflow-hidden bg-white rounded-xl border border-[#E5E7EB] shadow-2xl">
        {/* Cabeçalho com indicador de etapas */}
        <DialogHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F7F7F5] shrink-0 text-left">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Execução Guiada Passo a Passo
            </span>
            <span className="text-xs font-mono font-semibold text-[#6B7280]">
              Etapa {etapa} de 4
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#1F2937] leading-snug">
            {titulo}
          </DialogTitle>
          {subtitulo && <p className="text-xs text-[#6B7280] mt-0.5">{subtitulo}</p>}

          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#0F766E] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(etapa / 4) * 100}%` }}
            />
          </div>
        </DialogHeader>

        {/* Corpo com a etapa corrente */}
        <div className="p-5 space-y-4 min-h-[260px] flex flex-col justify-center">
          {/* ETAPA 1: Conforme / Não Conforme */}
          {etapa === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-[#1F2937]">
                  Como está a execução desta tarefa?
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Avalie se o padrão operacional foi cumprido integralmente ou se há não
                  conformidade.
                </p>
              </div>

              {/* Informações de apoio se existirem */}
              {(horarioLimite || ferramenta || observacoesOriginais) && (
                <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB] text-xs space-y-1 text-[#4B5563]">
                  {horarioLimite && (
                    <div className="flex items-center gap-1.5 font-medium text-[#1F2937]">
                      <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Horário limite: {horarioLimite}</span>
                    </div>
                  )}
                  {ferramenta && <div>Ferramenta/Padrão: {ferramenta}</div>}
                  {observacoesOriginais && (
                    <div className="italic text-[#6B7280]">Obs: {observacoesOriginais}</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setConforme(true)
                    setEtapa(2)
                  }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-left ${
                    conforme === true
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-[#E5E7EB] hover:border-emerald-500 hover:bg-emerald-50/50 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-emerald-950">Conforme</div>
                    <div className="text-[11px] text-[#4B5563] mt-0.5">
                      Executado 100% dentro do padrão
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConforme(false)
                    setEtapa(2)
                  }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-left ${
                    conforme === false
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-200'
                      : 'border-[#E5E7EB] hover:border-red-500 hover:bg-red-50/50 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-red-950">Não conforme</div>
                    <div className="text-[11px] text-[#4B5563] mt-0.5">
                      Houve desvio, pendência ou avaria
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 2: Foto Comprovatória */}
          {etapa === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-[#1F2937]">Registrar foto comprovatória</h3>
                <p className="text-xs text-[#6B7280]">
                  Tire uma foto da gôndola, balcão ou área finalizada (ou anexe da galeria).
                </p>
              </div>

              <div className="border-2 border-dashed border-[#D1D5DB] hover:border-[#0F766E] rounded-xl p-4 text-center bg-[#F7F7F5]/50 transition-colors">
                {fotoPreview ? (
                  <div className="space-y-3">
                    <img
                      src={fotoPreview}
                      alt="Prévia da foto"
                      className="max-h-48 mx-auto rounded-lg object-contain shadow-xs border border-[#E5E7EB]"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#0F766E] text-xs font-semibold rounded-md shadow-2xs">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Trocar foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFotoChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFotoFile(null)
                          setFotoPreview(null)
                        }}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md font-semibold"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-[#1F2937]">
                      Toque para abrir a câmera ou galeria
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      Formatos JPEG, PNG ou WEBP (opcional caso sem câmera agora)
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 3: Observação / Ocorrência */}
          {etapa === 3 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1F2937]">Observações ou apontamentos</h3>
                <p className="text-xs text-[#6B7280]">
                  {conforme === false
                    ? 'Descreva a divergência encontrada para que a liderança possa apoiar.'
                    : 'Adicione algum detalhe relevante da execução (opcional).'}
                </p>
              </div>

              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
                placeholder={
                  conforme === false
                    ? 'Ex: Faltou produto X na gôndola, estoque em depósito divergente...'
                    : 'Ex: Reposição realizada 100%, gôndola limpa e precificada.'
                }
                className="w-full text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E]"
              />

              {conforme === false && !observacao.trim() && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Recomendado detalhar o motivo da não conformidade.
                </p>
              )}
            </div>
          )}

          {/* ETAPA 4: Revisão e Conclusão */}
          {etapa === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1F2937]">Revisão da Execução</h3>
                <p className="text-xs text-[#6B7280]">
                  Confirme os dados antes de registrar a finalização.
                </p>
              </div>

              <div className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#E5E7EB] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Status da Execução:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      conforme ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {conforme ? 'Conforme' : 'Não conforme'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Foto Comprovatória:</span>
                  <span className="font-semibold text-[#1F2937]">
                    {fotoFile ? 'Anexada com sucesso' : 'Sem foto'}
                  </span>
                </div>

                {observacao.trim() && (
                  <div>
                    <span className="text-[#6B7280] block mb-0.5">Observação:</span>
                    <p className="text-[#1F2937] italic bg-white p-2 rounded border border-[#E5E7EB]">
                      {observacao}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé fixo com botões de navegação */}
        <DialogFooter className="px-5 py-3 border-t border-[#E5E7EB] bg-white flex flex-row items-center justify-between gap-2 shrink-0">
          <div>
            {etapa > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEtapa((prev) => (prev - 1) as EtapaFluxo)}
                disabled={salvando}
                className="text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs text-[#6B7280]"
            >
              Cancelar
            </Button>

            {etapa < 4 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (etapa === 1 && conforme === null) {
                    setConforme(true)
                  }
                  setEtapa((prev) => (prev + 1) as EtapaFluxo)
                }}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleFinalizar}
                disabled={salvando}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {salvando ? (
                  'Gravando...'
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Concluir Tarefa</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
