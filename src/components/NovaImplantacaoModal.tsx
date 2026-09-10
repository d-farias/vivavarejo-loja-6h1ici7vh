import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, RefreshCw } from 'lucide-react'
import { comercialService } from '@/services/comercial'
import type { Loja, TipoImplantacaoLayout, StatusImplantacaoLayout } from '@/types'

interface NovaImplantacaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojas: Loja[]
  lojaSelecionada?: string
  onCriadoSucesso?: () => void
}

export function NovaImplantacaoModal({
  open,
  onOpenChange,
  lojas,
  lojaSelecionada,
  onCriadoSucesso,
}: NovaImplantacaoModalProps) {
  const [salvando, setSalvando] = useState(false)
  const [lojaId, setLojaId] = useState(
    lojaSelecionada && lojaSelecionada !== 'todas' ? lojaSelecionada : '',
  )
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoImplantacaoLayout>('layout_gondola')
  const [departamentoSetor, setDepartamentoSetor] = useState('')
  const [dataPrevista, setDataPrevista] = useState(new Date().toISOString().slice(0, 10))
  const [dataConclusao, setDataConclusao] = useState('')
  const [status, setStatus] = useState<StatusImplantacaoLayout>('planejado')
  const [responsavelExecucao, setResponsavelExecucao] = useState('')
  const [progressoPerc, setProgressoPerc] = useState('0')
  const [fornecedorParceiro, setFornecedorParceiro] = useState('')
  const [descricaoEscopo, setDescricaoEscopo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !departamentoSetor.trim()) return

    setSalvando(true)
    try {
      const prog = parseInt(progressoPerc, 10) || 0

      await comercialService.criarImplantacao({
        loja: lojaId || undefined,
        titulo: titulo.trim(),
        tipo,
        departamento_setor: departamentoSetor.trim(),
        data_prevista: dataPrevista,
        data_conclusao: dataConclusao || undefined,
        status,
        responsavel_execucao: responsavelExecucao.trim() || undefined,
        progresso_perc: Math.min(100, Math.max(0, prog)),
        fornecedor_parceiro: fornecedorParceiro.trim() || undefined,
        descricao_escopo: descricaoEscopo.trim() || undefined,
      })

      onOpenChange(false)
      if (onCriadoSucesso) onCriadoSucesso()
    } catch (err) {
      console.error('Erro ao cadastrar cronograma de layout:', err)
      alert('Não foi possível salvar o cronograma de implantação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0F766E]" />
            <span>Cadastrar Cronograma de Implantação / Layout</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Planeje remodelações de gôndolas, viradas de linha sazonal, planogramas ou implantação
            de novos mix.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Título do Projeto / Layout *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Novo Planograma de Higiene & Beleza Corredor 3"
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Tipo de Implantação
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoImplantacaoLayout)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="layout_gondola">Layout de Gôndola</option>
                <option value="implantacao_mix">Implantação de Novo Mix</option>
                <option value="ajuste_planograma">Ajuste de Planograma</option>
                <option value="virada_sazonal">Virada Sazonal (Páscoa/Natal/Etc)</option>
                <option value="reforma_setor">Reforma / Expansão de Setor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Loja</label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="">Todas as Lojas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Departamento / Setor *
              </label>
              <input
                type="text"
                required
                value={departamentoSetor}
                onChange={(e) => setDepartamentoSetor(e.target.value)}
                placeholder="Ex: Perfumaria / Corredor 3"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Fornecedor / Parceiro (Opcional)
              </label>
              <input
                type="text"
                value={fornecedorParceiro}
                onChange={(e) => setFornecedorParceiro(e.target.value)}
                placeholder="Ex: Unilever / P&G"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Data Prevista / Prazo *
              </label>
              <input
                type="date"
                required
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Data Conclusão Real (Opcional)
              </label>
              <input
                type="date"
                value={dataConclusao}
                onChange={(e) => setDataConclusao(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusImplantacaoLayout)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="planejado">Planejado</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Progresso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressoPerc}
                onChange={(e) => setProgressoPerc(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Responsável</label>
              <input
                type="text"
                value={responsavelExecucao}
                onChange={(e) => setResponsavelExecucao(e.target.value)}
                placeholder="Ex: Líder de Loja"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Escopo / Detalhes de Layout
            </label>
            <textarea
              rows={2}
              value={descricaoEscopo}
              onChange={(e) => setDescricaoEscopo(e.target.value)}
              placeholder="Ex: Redução de 2 módulos para 1 na marca X e ampliação de frentes na marca líder."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !titulo.trim() || !departamentoSetor.trim()}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Salvar Implantação</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
