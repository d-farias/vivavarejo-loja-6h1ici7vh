import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Tag, RefreshCw } from 'lucide-react'
import { comercialService } from '@/services/comercial'
import type { Loja, TipoAcaoComercial, MotivoRebaixa, StatusAcaoComercial } from '@/types'

interface NovaAcaoComercialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojas: Loja[]
  lojaSelecionada?: string
  onCriadoSucesso?: () => void
}

export function NovaAcaoComercialModal({
  open,
  onOpenChange,
  lojas,
  lojaSelecionada,
  onCriadoSucesso,
}: NovaAcaoComercialModalProps) {
  const [salvando, setSalvando] = useState(false)
  const [lojaId, setLojaId] = useState(
    lojaSelecionada && lojaSelecionada !== 'todas' ? lojaSelecionada : '',
  )
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoAcaoComercial>('acao_comercial')
  const [departamento, setDepartamento] = useState('')
  const [categoria, setCategoria] = useState('')
  const [produtoDescricao, setProdutoDescricao] = useState('')
  const [produtoCodigo, setProdutoCodigo] = useState('')
  const [precoDe, setPrecoDe] = useState('')
  const [precoPor, setPrecoPor] = useState('')
  const [motivoRebaixa, setMotivoRebaixa] = useState<MotivoRebaixa>('campanha')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [dataFim, setDataFim] = useState('')
  const [status, setStatus] = useState<StatusAcaoComercial>('planejada')
  const [mecanicaPromocional, setMecanicaPromocional] = useState('')
  const [responsavelNome, setResponsavelNome] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setSalvando(true)
    try {
      const vDe = parseFloat(precoDe.replace(',', '.')) || 0
      const vPor = parseFloat(precoPor.replace(',', '.')) || 0
      let descontoPerc = 0
      if (vDe > 0 && vPor > 0 && vPor < vDe) {
        descontoPerc = Math.round(((vDe - vPor) / vDe) * 10000) / 100
      }

      await comercialService.criarAcao({
        loja: lojaId || undefined,
        titulo: titulo.trim(),
        tipo,
        departamento: departamento.trim() || undefined,
        categoria: categoria.trim() || undefined,
        produto_codigo: produtoCodigo.trim() || undefined,
        produto_descricao: produtoDescricao.trim() || undefined,
        preco_de: vDe > 0 ? vDe : undefined,
        preco_por: vPor > 0 ? vPor : undefined,
        desconto_perc: descontoPerc > 0 ? descontoPerc : undefined,
        motivo_rebaixa: tipo === 'rebaixa' ? motivoRebaixa : undefined,
        data_inicio: dataInicio,
        data_fim: dataFim || undefined,
        status,
        mecanica_promocional: mecanicaPromocional.trim() || undefined,
        responsavel_nome: responsavelNome.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })

      onOpenChange(false)
      if (onCriadoSucesso) onCriadoSucesso()
    } catch (err) {
      console.error('Erro ao cadastrar ação comercial:', err)
      alert('Não foi possível salvar a ação comercial.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#0F766E]" />
            <span>Cadastrar Ação Comercial / Rebaixa / Pricing</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Registre campanhas promocionais, rebaixas de preço para giro de estoque ou ações de
            ponta de gôndola.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Título da Ação Comercial *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Queima de Estoque Biscoitos 30% OFF"
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Tipo de Ação
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAcaoComercial)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="acao_comercial">Ação Comercial</option>
                <option value="rebaixa">Rebaixa de Preço</option>
                <option value="pricing">Ajuste de Pricing</option>
                <option value="tabloide">Tabloide / Encarte</option>
                <option value="ponta_gondola">Ponta de Gôndola</option>
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
                Departamento
              </label>
              <input
                type="text"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ex: Mercearia"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Categoria</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Biscoitos e Snacks"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Produto / Item (Opcional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={produtoCodigo}
                onChange={(e) => setProdutoCodigo(e.target.value)}
                placeholder="Código SKU/EAN"
                className="col-span-1 text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
              <input
                type="text"
                value={produtoDescricao}
                onChange={(e) => setProdutoDescricao(e.target.value)}
                placeholder="Descrição do produto"
                className="col-span-2 text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Preço De (R$)
              </label>
              <input
                type="text"
                value={precoDe}
                onChange={(e) => setPrecoDe(e.target.value)}
                placeholder="0,00"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Preço Por (R$)
              </label>
              <input
                type="text"
                value={precoPor}
                onChange={(e) => setPrecoPor(e.target.value)}
                placeholder="0,00"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            {tipo === 'rebaixa' && (
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Motivo da Rebaixa
                </label>
                <select
                  value={motivoRebaixa}
                  onChange={(e) => setMotivoRebaixa(e.target.value as MotivoRebaixa)}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
                >
                  <option value="campanha">Campanha</option>
                  <option value="validade_proxima">Validade Próxima</option>
                  <option value="excesso_estoque">Excesso de Estoque</option>
                  <option value="descontinuado">Descontinuado</option>
                  <option value="concorrencia">Concorrência</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Data Início *
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Data Fim (Opcional)
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAcaoComercial)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="planejada">Planejada</option>
                <option value="em_vigor">Em Vigor / Ativa</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Responsável</label>
              <input
                type="text"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                placeholder="Ex: Comprador / Gerente Comercial"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Mecânica Promocional ou Observações
            </label>
            <input
              type="text"
              value={mecanicaPromocional}
              onChange={(e) => setMecanicaPromocional(e.target.value)}
              placeholder="Ex: Leve 3 Pague 2, ou Cartão Fidelidade"
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
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
              disabled={salvando || !titulo.trim()}
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
                  <span>Salvar Ação</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
