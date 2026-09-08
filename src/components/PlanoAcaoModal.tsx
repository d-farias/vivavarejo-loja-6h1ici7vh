import React, { useState, useEffect } from 'react'
import { X, Calendar, AlertTriangle, User, Store, CheckSquare, Wrench } from 'lucide-react'
import type { PlanoAcao, Loja, Rotina, StatusPlanoAcao, PrioridadePlanoAcao } from '@/types'
import { AREAS_DEMANDANTES_CHAMADO } from '@/types'

interface PlanoAcaoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<PlanoAcao>) => Promise<void>
  plano?: PlanoAcao | null
  lojas: Loja[]
  rotinas?: Rotina[]
  defaultLojaId?: string
  defaultRotina?: Rotina | null
  defaultAreaDemandante?: string
}

export const PlanoAcaoModal: React.FC<PlanoAcaoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  plano,
  lojas,
  rotinas = [],
  defaultLojaId,
  defaultRotina,
  defaultAreaDemandante,
}) => {
  const [descricao, setDescricao] = useState('')
  const [lojaId, setLojaId] = useState('')
  const [rotinaId, setRotinaId] = useState('')
  const [areaDemandante, setAreaDemandante] = useState<string>('Operações')
  const [responsavel, setResponsavel] = useState('')
  const [prazo, setPrazo] = useState('')
  const [status, setStatus] = useState<StatusPlanoAcao>('aberta')
  const [prioridade, setPrioridade] = useState<PrioridadePlanoAcao>('media')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (plano) {
        setDescricao(plano.descricao || '')
        setLojaId(plano.loja || '')
        setRotinaId(plano.rotina || '')
        setAreaDemandante(plano.area_demandante || 'Operações')
        setResponsavel(plano.responsavel || '')
        setPrazo(plano.prazo ? plano.prazo.split(' ')[0] : '')
        setStatus(plano.status || 'aberta')
        setPrioridade(plano.prioridade || 'media')
        setObservacoes(plano.observacoes || '')
      } else {
        const initialLoja =
          defaultLojaId && defaultLojaId !== 'todas'
            ? defaultLojaId
            : lojas.length > 0
              ? lojas[0].id
              : ''
        setLojaId(initialLoja)

        if (defaultRotina) {
          setDescricao(`Ajustar e normalizar execução da rotina: ${defaultRotina.nome}`)
          setRotinaId(defaultRotina.id)
          setAreaDemandante(defaultRotina.area || 'Operações')
          setResponsavel(defaultRotina.responsavel || '')
          setPrioridade('alta')
          setObservacoes(
            `Ação corretiva disparada por atraso na rotina ${defaultRotina.nome} (Área: ${defaultRotina.area || 'Geral'}, Horário limite: ${defaultRotina.horario_limite || 'Não definido'}).`,
          )
          if (defaultRotina.loja) {
            setLojaId(defaultRotina.loja)
          }
        } else {
          setDescricao('')
          setRotinaId('')
          setAreaDemandante(defaultAreaDemandante || 'Operações')
          setResponsavel('')
          setPrioridade('media')
          setObservacoes('')
        }

        // Prazo padrão: hoje + 2 dias
        const d = new Date()
        d.setDate(d.getDate() + 2)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        setPrazo(`${yyyy}-${mm}-${dd}`)
        setStatus('aberta')
      }
      setError(null)
    }
  }, [isOpen, plano, defaultLojaId, defaultRotina, defaultAreaDemandante, lojas])

  if (!isOpen) return null

  const handleExemploRapido = (area: string, desc: string, prio: PrioridadePlanoAcao) => {
    setAreaDemandante(area)
    setDescricao(desc)
    setPrioridade(prio)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedDesc = descricao.trim()
    if (!trimmedDesc) {
      setError('Por favor, informe o que será feito (descrição da ação ou chamado).')
      return
    }
    if (!lojaId) {
      setError('Selecione a loja da ação.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        descricao: trimmedDesc,
        loja: lojaId,
        rotina: rotinaId || undefined,
        area_demandante: areaDemandante || undefined,
        responsavel: responsavel.trim() || undefined,
        prazo: prazo ? `${prazo} 23:59:59.000Z` : undefined,
        status,
        prioridade,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar plano de ação/chamado'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F7F7F5]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">
                {plano
                  ? 'Editar Chamado / Plano de Ação'
                  : 'Novo Chamado de Manutenção / Ação (5W2H)'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                Área demandante, o quê, quem, prazo e loja com disparo na Agenda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#B91C1C] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Área Demandante */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151]">
                Área Demandante <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-[#6B7280]">Compras, Logística, Manutenção...</span>
            </div>
            <div className="relative">
              <Wrench className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={areaDemandante}
                onChange={(e) => setAreaDemandante(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none text-[#1F2937] font-medium"
              >
                {AREAS_DEMANDANTES_CHAMADO.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Exemplos rápidos para acelerar cadastro */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#9CA3AF] uppercase font-bold mr-0.5">
                Exemplos:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleExemploRapido(
                    'Logística',
                    'Caminhão atrasado: aguardando descarregamento na doca',
                    'alta',
                  )
                }
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-50 hover:text-[#2563EB] text-[#4B5563] transition-colors"
              >
                Caminhão atrasado (Logística)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleExemploRapido(
                    'Manutenção',
                    'Câmara fria com oscilação térmica acima do padrão',
                    'alta',
                  )
                }
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-50 hover:text-[#2563EB] text-[#4B5563] transition-colors"
              >
                Câmara fria (Manutenção)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleExemploRapido(
                    'Abastecimento',
                    'Ruptura crítica na gôndola de itens de curva A',
                    'alta',
                  )
                }
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-50 hover:text-[#2563EB] text-[#4B5563] transition-colors"
              >
                Ruptura de Curva A (Abastecimento)
              </button>
            </div>
          </div>

          {/* O quê (Descrição) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              O que fazer / Descrição do Chamado <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Troca de vedação da porta da câmara frigorífica ou cobrança de caminhão atrasado"
              rows={2}
              required
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937] resize-none"
            />
          </div>

          {/* Loja & Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                Loja <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={lojaId}
                  onChange={(e) => setLojaId(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none text-[#1F2937]"
                >
                  <option value="" disabled>
                    Selecione a loja
                  </option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} {l.codigo ? `(${l.codigo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                Responsável (Quem)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Ex: Gerente Carlos ou Operador"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937]"
                />
              </div>
            </div>
          </div>

          {/* Prazo & Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                Prazo Limite (Quando)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none text-[#1F2937]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadePlanoAcao)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none text-[#1F2937]"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta (Crítica)</option>
              </select>
            </div>
          </div>

          {/* Status & Rotina vinculada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                Status da Ação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPlanoAcao)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none text-[#1F2937]"
              >
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                Origem / Rotina Vinculada{' '}
                <span className="text-[#9CA3AF] lowercase font-normal">(opcional)</span>
              </label>
              <select
                value={rotinaId}
                onChange={(e) => setRotinaId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none text-[#1F2937]"
              >
                <option value="">Nenhuma (Ação avulsa / melhoria)</option>
                {rotinas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações / Como / Conclusão */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Observações / Método de Execução (Como)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva detalhes operacionais, causa-raiz identificada ou resultado obtido..."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-lg outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937] resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-[#4B5563] hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-xs transition-colors disabled:opacity-60"
            >
              {saving ? 'Salvando...' : plano ? 'Salvar Alterações' : 'Criar Ação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
