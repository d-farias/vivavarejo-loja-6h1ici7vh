import React, { useState, useEffect } from 'react'
import type { Rotina, FrequenciaRotina, StatusRotina } from '@/types'
import { formatHorarioLimite } from '@/lib/time-utils'
import { useStore } from '@/context/StoreContext'
import { funcoesService } from '@/services/funcoes'
import type { Funcao } from '@/types'
import { X, Clock, Wrench, ShieldCheck, Info, Store, Briefcase } from 'lucide-react'

interface RoutineFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Rotina>) => Promise<void>
  initialData?: Rotina | null
}

const FREQUENCIAS: FrequenciaRotina[] = [
  'Diária',
  'Semanal',
  'Conforme vendas',
  'Rotinas',
  'A cada recebimento',
]

const STATUS_OPTIONS: StatusRotina[] = ['Ativa', 'Pendente', 'Concluída']

export function RoutineFormModal({ isOpen, onClose, onSave, initialData }: RoutineFormModalProps) {
  const { lojas, lojaSelecionadaId } = useStore()
  const isEditing = Boolean(initialData?.id)

  const [nome, setNome] = useState(initialData?.nome || '')
  const [responsavel, setResponsavel] = useState(initialData?.responsavel || '')
  const [frequencia, setFrequencia] = useState<FrequenciaRotina>(
    initialData?.frequencia || 'Diária',
  )
  const [horarioLimite, setHorarioLimite] = useState(initialData?.horario_limite || '')
  const [ferramenta, setFerramenta] = useState(initialData?.ferramenta || '')
  const [validacao, setValidacao] = useState(initialData?.validacao || '')
  const [status, setStatus] = useState<StatusRotina>(initialData?.status || 'Ativa')
  const [area, setArea] = useState(initialData?.area || '')
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || '')

  // Loja e Função vinculada à rotina
  const [lojaId, setLojaId] = useState<string>(() => {
    if (initialData?.loja) return initialData.loja
    if (lojaSelecionadaId && lojaSelecionadaId !== 'todas') return lojaSelecionadaId
    return lojas[0]?.id || ''
  })
  const [funcaoId, setFuncaoId] = useState<string>(initialData?.funcao || '')
  const [funcoesLoja, setFuncoesLoja] = useState<Funcao[]>([])

  useEffect(() => {
    if (lojaId) {
      funcoesService
        .getByLoja(lojaId)
        .then(setFuncoesLoja)
        .catch(() => setFuncoesLoja([]))
    } else {
      setFuncoesLoja([])
    }
  }, [lojaId])

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ nome?: string; responsavel?: string }>({})

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { nome?: string; responsavel?: string } = {}
    if (!nome.trim()) {
      newErrors.nome = 'O nome da rotina é obrigatório'
    }
    if (!responsavel.trim()) {
      newErrors.responsavel = 'O responsável é obrigatório'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const normalizedHorario = horarioLimite.trim()
        ? formatHorarioLimite(horarioLimite.trim())
        : ''

      await onSave({
        nome: nome.trim(),
        responsavel: responsavel.trim(),
        frequencia,
        horario_limite: normalizedHorario,
        ferramenta: ferramenta.trim(),
        validacao: validacao.trim(),
        status,
        area: area.trim() || responsavel.trim(),
        observacoes: observacoes.trim(),
        loja: lojaId || undefined,
        funcao: funcaoId || undefined,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#1F2937]">
              {isEditing ? 'Editar Rotina' : 'Nova Rotina Operacional'}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {isEditing
                ? 'Atualize as orientações, horários e responsáveis da rotina'
                : 'Cadastre uma nova rotina para acompanhamento no Painel da Loja'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {/* Vínculo de Loja e Função */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-md bg-[#F7F7F5] border border-[#E5E7EB]">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Loja de Aplicação</span>
              </label>
              <select
                value={lojaId}
                onChange={(e) => {
                  setLojaId(e.target.value)
                  setFuncaoId('')
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
              >
                <option value="">Todas as lojas (Sem vínculo exclusivo)</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} {l.expand?.cliente ? `• ${l.expand.cliente.nome}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Função de Loja (opcional)</span>
              </label>
              <select
                value={funcaoId}
                onChange={(e) => {
                  const val = e.target.value
                  setFuncaoId(val)
                  // Se escolheu função, atualiza o responsável automaticamente se estiver em branco
                  const fObj = funcoesLoja.find((f) => f.id === val)
                  if (fObj && !responsavel) {
                    setResponsavel(fObj.nome)
                  }
                }}
                disabled={!lojaId || funcoesLoja.length === 0}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] disabled:opacity-50"
              >
                <option value="">Selecione ou deixe geral...</option>
                {funcoesLoja.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nome da Rotina */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
              Nome da rotina <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Auditoria Matinal de Preços e Encartes"
              className={`w-full px-3 py-2 text-sm bg-white border ${
                errors.nome ? 'border-red-400' : 'border-[#E5E7EB]'
              } rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]`}
            />
            {errors.nome && <p className="text-[11px] text-red-500 mt-1">{errors.nome}</p>}
          </div>

          {/* Grid 2 col: Responsável e Área */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                Responsável <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Cartazista, Analista, Gerente"
                className={`w-full px-3 py-2 text-sm bg-white border ${
                  errors.responsavel ? 'border-red-400' : 'border-[#E5E7EB]'
                } rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]`}
              />
              {errors.responsavel && (
                <p className="text-[11px] text-red-500 mt-1">{errors.responsavel}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                Área / Setor da Loja
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ex: Prevenção, Mercearia, Frente de Caixa"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
              />
            </div>
          </div>

          {/* Grid 2 col: Frequência e Horário Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                Frequência
              </label>
              <select
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value as FrequenciaRotina)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
              >
                {FREQUENCIAS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center justify-between">
                <span>Horário Limite</span>
                <span className="text-[10px] text-[#6B7280] font-normal lowercase">
                  ex: 10:00 ou Integral
                </span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={horarioLimite}
                  onChange={(e) => setHorarioLimite(e.target.value)}
                  placeholder="Ex: 10:00, 11Hs, Integral"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
                />
              </div>
            </div>
          </div>

          {/* Grid 2 col: Validação e Ferramenta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Validação (quem valida)</span>
              </label>
              <input
                type="text"
                value={validacao}
                onChange={(e) => setValidacao(e.target.value)}
                placeholder="Ex: Gerente/GO, Prev/Gerente"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Ferramenta necessária</span>
              </label>
              <input
                type="text"
                value={ferramenta}
                onChange={(e) => setFerramenta(e.target.value)}
                placeholder="Ex: Coletor RF, Checklist, Manual"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
              Status da Rotina
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    status === st
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Observações / Justificativas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Observações / Orientações / Justificativa</span>
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções operacionais para quem executa ou valida..."
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors disabled:opacity-60"
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Rotina' : 'Cadastrar Rotina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
