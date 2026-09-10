import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Handshake, RefreshCw } from 'lucide-react'
import { comercialService } from '@/services/comercial'
import type { Loja, TipoAcordoNegociacao, StatusNegociacao, ComercialNegociacao } from '@/types'

interface NovaNegociacaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojas: Loja[]
  lojaSelecionada?: string
  negociacaoParaEditar?: ComercialNegociacao | null
  onSucesso: () => void
}

export function NovaNegociacaoModal({
  open,
  onOpenChange,
  lojas,
  lojaSelecionada,
  negociacaoParaEditar,
  onSucesso,
}: NovaNegociacaoModalProps) {
  const [salvando, setSalvando] = useState(false)

  const [titulo, setTitulo] = useState(negociacaoParaEditar?.titulo || '')
  const [lojaId, setLojaId] = useState(
    negociacaoParaEditar?.loja ||
      (lojaSelecionada && lojaSelecionada !== 'todas' ? lojaSelecionada : ''),
  )
  const [compradorNome, setCompradorNome] = useState(negociacaoParaEditar?.comprador_nome || '')
  const [fornecedor, setFornecedor] = useState(negociacaoParaEditar?.fornecedor || '')
  const [departamento, setDepartamento] = useState(negociacaoParaEditar?.departamento || '')
  const [categoria, setCategoria] = useState(negociacaoParaEditar?.categoria || '')
  const [sazonalidade, setSazonalidade] = useState(negociacaoParaEditar?.sazonalidade || 'Páscoa')
  const [tipoAcordo, setTipoAcordo] = useState<TipoAcordoNegociacao>(
    negociacaoParaEditar?.tipo_acordo || 'espaco_extra',
  )
  const [descricaoAcordo, setDescricaoAcordo] = useState(
    negociacaoParaEditar?.descricao_acordo || '',
  )
  const [produtoCodigo, setProdutoCodigo] = useState(negociacaoParaEditar?.produto_codigo || '')
  const [produtoDescricao, setProdutoDescricao] = useState(
    negociacaoParaEditar?.produto_descricao || '',
  )
  const [precoDe, setPrecoDe] = useState(negociacaoParaEditar?.preco_de?.toString() || '')
  const [precoPor, setPrecoPor] = useState(negociacaoParaEditar?.preco_por?.toString() || '')
  const [descontoPerc, setDescontoPerc] = useState(
    negociacaoParaEditar?.desconto_perc?.toString() || '',
  )
  const [bonificacaoDetalhe, setBonificacaoDetalhe] = useState(
    negociacaoParaEditar?.bonificacao_detalhe || '',
  )
  const [espacoGondola, setEspacoGondola] = useState(
    negociacaoParaEditar?.espaco_gondola_acordado || '',
  )
  const [dataInicio, setDataInicio] = useState(
    negociacaoParaEditar?.data_inicio || new Date().toISOString().slice(0, 10),
  )
  const [dataFim, setDataFim] = useState(negociacaoParaEditar?.data_fim || '')
  const [status, setStatus] = useState<StatusNegociacao>(
    negociacaoParaEditar?.status || 'planejada',
  )
  const [responsavelLoja, setResponsavelLoja] = useState(
    negociacaoParaEditar?.responsavel_loja || '',
  )
  const [observacoes, setObservacoes] = useState(negociacaoParaEditar?.observacoes || '')

  // Atualizar form quando negociacaoParaEditar mudar
  React.useEffect(() => {
    if (negociacaoParaEditar) {
      setTitulo(negociacaoParaEditar.titulo || '')
      setLojaId(negociacaoParaEditar.loja || '')
      setCompradorNome(negociacaoParaEditar.comprador_nome || '')
      setFornecedor(negociacaoParaEditar.fornecedor || '')
      setDepartamento(negociacaoParaEditar.departamento || '')
      setCategoria(negociacaoParaEditar.categoria || '')
      setSazonalidade(negociacaoParaEditar.sazonalidade || 'Páscoa')
      setTipoAcordo(negociacaoParaEditar.tipo_acordo || 'espaco_extra')
      setDescricaoAcordo(negociacaoParaEditar.descricao_acordo || '')
      setProdutoCodigo(negociacaoParaEditar.produto_codigo || '')
      setProdutoDescricao(negociacaoParaEditar.produto_descricao || '')
      setPrecoDe(negociacaoParaEditar.preco_de ? String(negociacaoParaEditar.preco_de) : '')
      setPrecoPor(negociacaoParaEditar.preco_por ? String(negociacaoParaEditar.preco_por) : '')
      setDescontoPerc(
        negociacaoParaEditar.desconto_perc ? String(negociacaoParaEditar.desconto_perc) : '',
      )
      setBonificacaoDetalhe(negociacaoParaEditar.bonificacao_detalhe || '')
      setEspacoGondola(negociacaoParaEditar.espaco_gondola_acordado || '')
      setDataInicio(negociacaoParaEditar.data_inicio || new Date().toISOString().slice(0, 10))
      setDataFim(negociacaoParaEditar.data_fim || '')
      setStatus(negociacaoParaEditar.status || 'planejada')
      setResponsavelLoja(negociacaoParaEditar.responsavel_loja || '')
      setObservacoes(negociacaoParaEditar.observacoes || '')
    } else {
      setTitulo('')
      setLojaId(lojaSelecionada && lojaSelecionada !== 'todas' ? lojaSelecionada : '')
      setCompradorNome('')
      setFornecedor('')
      setDepartamento('')
      setCategoria('')
      setSazonalidade('Páscoa')
      setTipoAcordo('espaco_extra')
      setDescricaoAcordo('')
      setProdutoCodigo('')
      setProdutoDescricao('')
      setPrecoDe('')
      setPrecoPor('')
      setDescontoPerc('')
      setBonificacaoDetalhe('')
      setEspacoGondola('')
      setDataInicio(new Date().toISOString().slice(0, 10))
      setDataFim('')
      setStatus('planejada')
      setResponsavelLoja('')
      setObservacoes('')
    }
  }, [negociacaoParaEditar, lojaSelecionada, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !dataInicio) return

    setSalvando(true)
    try {
      const pDe = precoDe ? parseFloat(precoDe.replace(',', '.')) : undefined
      const pPor = precoPor ? parseFloat(precoPor.replace(',', '.')) : undefined
      const dPerc = descontoPerc ? parseFloat(descontoPerc.replace(',', '.')) : undefined

      const payload: Partial<ComercialNegociacao> = {
        titulo: titulo.trim(),
        loja: lojaId || undefined,
        comprador_nome: compradorNome.trim() || undefined,
        fornecedor: fornecedor.trim() || undefined,
        departamento: departamento.trim() || undefined,
        categoria: categoria.trim() || undefined,
        sazonalidade: sazonalidade.trim() || undefined,
        tipo_acordo: tipoAcordo,
        descricao_acordo: descricaoAcordo.trim() || undefined,
        produto_codigo: produtoCodigo.trim() || undefined,
        produto_descricao: produtoDescricao.trim() || undefined,
        preco_de: isNaN(Number(pDe)) ? undefined : pDe,
        preco_por: isNaN(Number(pPor)) ? undefined : pPor,
        desconto_perc: isNaN(Number(dPerc)) ? undefined : dPerc,
        bonificacao_detalhe: bonificacaoDetalhe.trim() || undefined,
        espaco_gondola_acordado: espacoGondola.trim() || undefined,
        data_inicio: dataInicio,
        data_fim: dataFim || undefined,
        status,
        responsavel_loja: responsavelLoja.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      }

      if (negociacaoParaEditar) {
        await comercialService.atualizarNegociacao(negociacaoParaEditar.id, payload)
      } else {
        await comercialService.criarNegociacao(payload)
      }

      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao salvar negociação comercial:', err)
      alert('Não foi possível salvar a negociação comercial.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[#0F766E]" />
            <span>
              {negociacaoParaEditar
                ? 'Editar Acordo Comercial & Sazonalidade'
                : 'Nova Negociação com Comprador & Sazonalidade'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Cadastre os termos acordados entre comprador e fornecedor para garantir o cumprimento na
            loja física com agendas de prazos e evidências.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          {/* Linha 1: Título e Loja */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Título do Acordo / Negociação *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Ponta de Gôndola Especial de Páscoa Nestlé/Garoto"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Loja de Aplicação
              </label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="">Todas as Lojas da Rede</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 2: Comprador, Fornecedor e Sazonalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Nome do Comprador
              </label>
              <input
                type="text"
                value={compradorNome}
                onChange={(e) => setCompradorNome(e.target.value)}
                placeholder="Ex: Carlos Compras / Gerência Comercial"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Fornecedor / Indústria
              </label>
              <input
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex: Nestlé, Ambev, Unilever"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Sazonalidade / Campanha *
              </label>
              <input
                type="text"
                value={sazonalidade}
                onChange={(e) => setSazonalidade(e.target.value)}
                placeholder="Ex: Páscoa, Dia das Mães, Festa Junina, Black Friday..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Linha 3: Departamento, Categoria e Tipo de Acordo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ex: Mercearia Doce"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Categoria</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Chocolates & Ovos"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Tipo do Acordo
              </label>
              <select
                value={tipoAcordo}
                onChange={(e) => setTipoAcordo(e.target.value as TipoAcordoNegociacao)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="espaco_extra">Espaço Extra / Ponto Promocional</option>
                <option value="ponta_gondola">Ponta de Gôndola Exclusiva</option>
                <option value="ilha_destaque">Ilha de Destaque no Corredor</option>
                <option value="preco_rebaixa">Rebaixa de Preço Acordada</option>
                <option value="tabloide_encarte">Tabloide / Encarte Promocional</option>
                <option value="bonificacao">Bonificação de Mercadoria</option>
                <option value="compre_ganhe">Mecânica Compre & Ganhe</option>
                <option value="outro">Outro Acordo Comercial</option>
              </select>
            </div>
          </div>

          {/* Linha 4: Produto e Preços Acordados */}
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
              Detalhes de Produto & Condições Comerciais
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Cód. Produto / EAN
                </label>
                <input
                  type="text"
                  value={produtoCodigo}
                  onChange={(e) => setProdutoCodigo(e.target.value)}
                  placeholder="Ex: 789123456"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Descrição do Produto / Itens do Pacote
                </label>
                <input
                  type="text"
                  value={produtoDescricao}
                  onChange={(e) => setProdutoDescricao(e.target.value)}
                  placeholder="Ex: Ovo de Páscoa Especial 250g Sortido"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Preço De (R$)
                </label>
                <input
                  type="text"
                  value={precoDe}
                  onChange={(e) => setPrecoDe(e.target.value)}
                  placeholder="49,90"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Preço Por (R$)
                </label>
                <input
                  type="text"
                  value={precoPor}
                  onChange={(e) => setPrecoPor(e.target.value)}
                  placeholder="39,90"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Desconto (%)
                </label>
                <input
                  type="text"
                  value={descontoPerc}
                  onChange={(e) => setDescontoPerc(e.target.value)}
                  placeholder="20%"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Espaço Gôndola Acordado
                </label>
                <input
                  type="text"
                  value={espacoGondola}
                  onChange={(e) => setEspacoGondola(e.target.value)}
                  placeholder="Ex: 3 frentes / 1 ponta"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Bonificação / Contrapartida Acordada (Opcional)
              </label>
              <input
                type="text"
                value={bonificacaoDetalhe}
                onChange={(e) => setBonificacaoDetalhe(e.target.value)}
                placeholder="Ex: 50 caixas bonificadas no pedido inicial ou verba de marketing de R$ 2.000"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Linha 5: Vigência e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Data Início da Ação *
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
                Data Término da Ação
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusNegociacao)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="planejada">Planejada</option>
                <option value="aguardando_execucao">Aguardando Execução na Loja</option>
                <option value="em_vigor">Em Vigor / Ativa na Loja</option>
                <option value="concluida">Concluída</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Linha 6: Responsável Loja e Descrição detalhada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Responsável na Loja (Execução / Fiscalização)
              </label>
              <input
                type="text"
                value={responsavelLoja}
                onChange={(e) => setResponsavelLoja(e.target.value)}
                placeholder="Ex: Gerente da Loja / Encarregado de Mercearia"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Observações Adicionais
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Exige cartaz especial na entrada."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Descrição Completa do Acordo com o Comprador
            </label>
            <textarea
              rows={2}
              value={descricaoAcordo}
              onChange={(e) => setDescricaoAcordo(e.target.value)}
              placeholder="Ex: Fornecedor garantiu abastecimento contínuo sem ruptura e material de PDV entregue até 3 dias antes da data de início."
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
              disabled={salvando || !titulo.trim() || !dataInicio}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando negociação...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{negociacaoParaEditar ? 'Salvar Alterações' : 'Cadastrar Negociação'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
