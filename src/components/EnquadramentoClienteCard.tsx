import React, { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Tag,
  Briefcase,
  Layers,
  ChevronRight,
  Sparkles,
  Save,
  X,
  Info,
} from 'lucide-react'
import type { Cliente, TipoPessoaCliente } from '@/types'
import { clientesService } from '@/services/clientes'

export const VAREJO_SEGMENTOS = [
  'Moda e Vestuário',
  'Supermercado/Food',
  'Farmácia',
  'Eletrônicos',
  'Construção/Casa',
  'Cosméticos',
  'Pet',
  'Outro',
] as const

interface EnquadramentoClienteCardProps {
  clientes: Cliente[]
  onClienteUpdated?: () => void
}

export const EnquadramentoClienteCard: React.FC<EnquadramentoClienteCardProps> = ({
  clientes,
  onClienteUpdated,
}) => {
  const [selectedClienteId, setSelectedClienteId] = useState<string>(
    clientes.length > 0 ? clientes[0].id : '',
  )
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoaCliente>('PJ')
  const [segmento, setSegmento] = useState<string>('Moda e Vestuário')
  const [outroSegmento, setOutroSegmento] = useState<string>('')
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // Cliente atual selecionado
  const currentCliente = clientes.find((c) => c.id === selectedClienteId) || clientes[0]

  // Sincroniza campos quando cliente muda
  React.useEffect(() => {
    if (currentCliente) {
      if (currentCliente.tipo_pessoa) {
        setTipoPessoa(currentCliente.tipo_pessoa)
      } else {
        setTipoPessoa('PJ')
      }

      if (currentCliente.segmento) {
        if ((VAREJO_SEGMENTOS as readonly string[]).includes(currentCliente.segmento)) {
          setSegmento(currentCliente.segmento)
          setOutroSegmento('')
        } else {
          setSegmento('Outro')
          setOutroSegmento(currentCliente.segmento)
        }
      } else {
        setSegmento('Moda e Vestuário')
        setOutroSegmento('')
      }
    }
  }, [currentCliente])

  if (dismissed || clientes.length === 0) return null

  const handleSalvar = async () => {
    if (!currentCliente) return
    setSaving(true)
    setFeedback(null)
    const finalSegmento = segmento === 'Outro' ? outroSegmento.trim() || 'Outro' : segmento

    try {
      await clientesService.update(currentCliente.id, {
        tipo_pessoa: tipoPessoa,
        segmento: finalSegmento,
      })
      setFeedback('Enquadramento salvo com sucesso!')
      if (onClienteUpdated) {
        onClienteUpdated()
      }
      setTimeout(() => setFeedback(null), 3500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar enquadramento'
      setFeedback(msg)
    } finally {
      setSaving(false)
    }
  }

  const isEnquadrado = Boolean(currentCliente?.tipo_pessoa && currentCliente?.segmento)

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
      {/* Faixa decorativa teal */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F766E] to-teal-400" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
                Enquadramento do Cliente
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] uppercase tracking-wider">
                Exclusivo Consultor Admin
              </span>
              {isEnquadrado && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Enquadrado: {currentCliente?.tipo_pessoa} • {currentCliente?.segmento}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Classifique o perfil fiscal e o segmento do varejo para adaptar rotinas e relatórios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {clientes.length > 1 && (
            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] text-[#1F2937] font-semibold"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-[#9CA3AF] hover:text-[#4B5563] rounded-md hover:bg-gray-100 transition-colors"
            title="Ocultar bloco"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-[#115E59] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Passos rápidos */}
      <div className="space-y-4">
        {/* Step Tabs */}
        <div className="grid grid-cols-2 gap-2 border-b border-[#E5E7EB] pb-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
              step === 1 ? 'bg-teal-50 text-[#0F766E]' : 'text-[#6B7280] hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                step === 1 ? 'bg-[#0F766E] text-white' : 'bg-gray-200 text-[#4B5563]'
              }`}
            >
              1
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Passo 1: Tipo de Cliente</div>
              <div className="text-[10px] truncate">
                {tipoPessoa === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (CNPJ)'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
              step === 2 ? 'bg-teal-50 text-[#0F766E]' : 'text-[#6B7280] hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                step === 2 ? 'bg-[#0F766E] text-white' : 'bg-gray-200 text-[#4B5563]'
              }`}
            >
              2
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Passo 2: Tipo de Varejo</div>
              <div className="text-[10px] truncate">
                {segmento === 'Outro' && outroSegmento ? outroSegmento : segmento}
              </div>
            </div>
          </button>
        </div>

        {/* Step 1 Content: PF ou PJ */}
        {step === 1 && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#374151] block">
              Qual a natureza fiscal deste cliente ({currentCliente?.nome})?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoPessoa('PJ')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  tipoPessoa === 'PJ'
                    ? 'border-[#0F766E] bg-teal-50 ring-1 ring-[#0F766E]'
                    : 'border-[#E5E7EB] bg-[#F7F7F5]/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1F2937]">Pessoa Jurídica (CNPJ)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-[#0F766E]">
                    PJ
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Rede de lojas, franquias, supermercados ou empresas registradas com filial.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTipoPessoa('PF')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  tipoPessoa === 'PF'
                    ? 'border-[#0F766E] bg-teal-50 ring-1 ring-[#0F766E]'
                    : 'border-[#E5E7EB] bg-[#F7F7F5]/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1F2937]">Pessoa Física (PF)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-[#374151]">
                    PF
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Lojista individual, MEI, produtor ou consultoria direta para proprietário.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>Avançar para Segmento</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 Content: Tipo de Varejo */}
        {step === 2 && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#374151] block">
              Selecione o segmento de atuação do cliente:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VAREJO_SEGMENTOS.map((seg) => {
                const isSelected = segmento === seg
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => setSegmento(seg)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#0F766E] bg-teal-50 text-[#0F766E] ring-1 ring-[#0F766E]'
                        : 'border-[#E5E7EB] bg-[#F7F7F5]/50 text-[#1F2937] hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{seg}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {segmento === 'Outro' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                  Especifique o segmento
                </label>
                <input
                  type="text"
                  value={outroSegmento}
                  onChange={(e) => setOutroSegmento(e.target.value)}
                  placeholder="Ex: Ótica, Joalheria, Materiais Esportivos..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-lg outline-none text-[#1F2937]"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
              >
                ← Voltar ao Passo 1
              </button>

              <button
                type="button"
                onClick={handleSalvar}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Salvando...' : 'Salvar Enquadramento'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
