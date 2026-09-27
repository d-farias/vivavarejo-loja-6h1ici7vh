import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, Calculator, ShieldCheck, Truck, Store } from 'lucide-react'
import { matchService, calcularCascataMatch } from '@/services/matchService'
import type { CurvaAbc, Loja, Fornecedor } from '@/types'

interface RegistrarOcorrenciaMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redeId?: string
  lojas: Loja[]
  lojaSelecionadaId?: string
  fornecedores?: Fornecedor[]
  userName?: string
  userId?: string
  onSucesso: () => void
}

export function RegistrarOcorrenciaMatchModal({
  open,
  onOpenChange,
  redeId,
  lojas,
  lojaSelecionadaId,
  fornecedores = [],
  userName = 'Gerente de Loja',
  userId,
  onSucesso,
}: RegistrarOcorrenciaMatchModalProps) {
  const [lojaId, setLojaId] = useState<string>(lojaSelecionadaId || '')
  const [produtoCodigo, setProdutoCodigo] = useState('')
  const [produtoDescricao, setProdutoDescricao] = useState('')
  const [curva, setCurva] = useState<CurvaAbc>('A')
  const [estoqueLoja, setEstoqueLoja] = useState<number>(0)
  const [estoqueSistema, setEstoqueSistema] = useState<number>(0)
  const [estoqueCd, setEstoqueCd] = useState<number>(0)
  const [estoqueTransito, setEstoqueTransito] = useState<boolean>(false)
  const [previsaoTransito, setPrevisaoTransito] = useState('')
  const [vendaMediaDiaria, setVendaMediaDiaria] = useState<number>(10)
  const [precoVenda, setPrecoVenda] = useState<number>(15)
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [leadTimeDias, setLeadTimeDias] = useState<number>(3)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Sincronizar loja ao abrir
  useEffect(() => {
    if (open) {
      if (lojaSelecionadaId && lojaSelecionadaId !== 'todas') {
        setLojaId(lojaSelecionadaId)
      } else if (lojas.length > 0 && !lojaId) {
        setLojaId(lojas[0].id)
      }
    }
  }, [open, lojaSelecionadaId, lojas])

  // Motor de decisão em cascata recalculado em tempo real
  const cascata = calcularCascataMatch({
    estoqueLoja: Number(estoqueLoja) || 0,
    estoqueSistema: Number(estoqueSistema) || 0,
    estoqueCd: Number(estoqueCd) || 0,
    estoqueTransito: Boolean(estoqueTransito),
    previsaoTransito,
    vendaMediaDiaria: Number(vendaMediaDiaria) || 0,
    precoVenda: Number(precoVenda) || 0,
    curva,
    leadTimeDias: Number(leadTimeDias) || 3,
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const handleFornecedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value
    setFornecedorId(fId)
    const forn = fornecedores.find((f) => f.id === fId)
    if (forn) {
      setFornecedorNome(forn.nome)
    } else if (fId === '') {
      setFornecedorNome('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!produtoDescricao.trim()) {
      alert('Informe a descrição do produto.')
      return
    }

    setSalvando(true)
    try {
      await matchService.criarDemanda({
        redeId,
        lojaId: lojaId || undefined,
        fornecedorId: fornecedorId || undefined,
        fornecedorNome: fornecedorNome.trim() || undefined,
        produtoCodigo: produtoCodigo.trim() || undefined,
        produtoDescricao: produtoDescricao.trim(),
        curva,
        estoqueLoja: Number(estoqueLoja) || 0,
        estoqueSistema: Number(estoqueSistema) || 0,
        estoqueCd: Number(estoqueCd) || 0,
        estoqueTransito: Boolean(estoqueTransito),
        previsaoEntregaTransito: previsaoTransito.trim() || undefined,
        vendaMediaDiaria: Number(vendaMediaDiaria) || 0,
        precoVenda: Number(precoVenda) || 0,
        leadTimeDias: Number(leadTimeDias) || 3,
        potencialVendaPerdida: cascata.potencialEstimado,
        situacao: cascata.situacao,
        acaoSugerida: cascata.acaoSugerida,
        prioridade: cascata.prioridade,
        observacaoInicial: observacao.trim() || undefined,
        registradoPorNome: userName,
        registradoPorUsuarioId: userId,
      })

      // Reset
      setProdutoCodigo('')
      setProdutoDescricao('')
      setEstoqueLoja(0)
      setEstoqueSistema(0)
      setEstoqueCd(0)
      setEstoqueTransito(false)
      setPrevisaoTransito('')
      setObservacao('')
      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao registrar ocorrência no Integração:', err)
      alert('Não foi possível registrar a ocorrência. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              VivaVarejo Integração • Diagnóstico Inteligente
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#0F766E]" />
            <span>Registrar Ocorrência de Abastecimento / Estoque</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Antes de gerar demanda, o sistema cruza físico × sistema × venda e indica onde está a
            verdade: demanda só quando há ação real; o resto vira conferência ou oportunidade
            comercial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Loja e Curva */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Loja da Ocorrência *
              </label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} {l.codigo ? `(${l.codigo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Curva ABC *</label>
              <select
                value={curva}
                onChange={(e) => setCurva(e.target.value as CurvaAbc)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E] font-bold"
              >
                <option value="A">Curva A (Crítico)</option>
                <option value="B">Curva B</option>
                <option value="C">Curva C</option>
                <option value="C+">Curva C+</option>
              </select>
            </div>
          </div>

          {/* Produto Código e Descrição */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Código / EAN
              </label>
              <input
                type="text"
                value={produtoCodigo}
                onChange={(e) => setProdutoCodigo(e.target.value)}
                placeholder="Ex: 7891000..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E] font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Descrição do SKU / Produto *
              </label>
              <input
                type="text"
                required
                value={produtoDescricao}
                onChange={(e) => setProdutoDescricao(e.target.value)}
                placeholder="Ex: Leite Integral UHT 1L, Café Almofada 500g..."
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Saldos: Físico da Loja × Sistema × CD × Trânsito */}
          <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Auditoria & Saldos de Estoque</span>
              </span>
              <span className="text-[11px] text-[#6B7280]">Cruze o piso de loja com o ERP</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Estoque Físico Loja *
                </label>
                <input
                  type="number"
                  min={0}
                  value={estoqueLoja}
                  onChange={(e) => setEstoqueLoja(Number(e.target.value))}
                  placeholder="0 un"
                  className={`w-full text-xs bg-white border rounded-lg px-2.5 py-1.5 font-bold outline-none ${
                    estoqueLoja <= 0
                      ? 'border-red-300 text-red-600 focus:border-red-500'
                      : 'border-[#D1D5DB] text-[#1F2937] focus:border-[#0F766E]'
                  }`}
                />
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Real na gôndola</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Estoque no Sistema *
                </label>
                <input
                  type="number"
                  min={0}
                  value={estoqueSistema}
                  onChange={(e) => setEstoqueSistema(Number(e.target.value))}
                  placeholder="Saldo no ERP"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 font-bold text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Saldo virtual ERP</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Estoque CD (un)
                </label>
                <input
                  type="number"
                  min={0}
                  value={estoqueCd}
                  onChange={(e) => setEstoqueCd(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 font-bold text-[#0F766E] outline-none focus:border-[#0F766E]"
                />
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Disponível no CD</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Em Trânsito?
                </label>
                <select
                  value={estoqueTransito ? 'sim' : 'nao'}
                  onChange={(e) => setEstoqueTransito(e.target.value === 'sim')}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 font-semibold text-[#1F2937] outline-none focus:border-[#0F766E]"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim (Carga em rota)</option>
                </select>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Pedido faturado</span>
              </div>
            </div>

            {estoqueTransito && (
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Previsão de Chegada do Pedido em Trânsito</span>
                </label>
                <input
                  type="text"
                  value={previsaoTransito}
                  onChange={(e) => setPrevisaoTransito(e.target.value)}
                  placeholder="Ex: Amanhã às 14h / NF 1284 emitida / Previsão 02 dias"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              </div>
            )}
          </div>

          {/* Venda Média, Preço, Lead Time e Fornecedor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Venda Média / Dia (un)
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={vendaMediaDiaria}
                onChange={(e) => setVendaMediaDiaria(Number(e.target.value))}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Preço Venda (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(Number(e.target.value))}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Lead Time (dias)
              </label>
              <input
                type="number"
                min={1}
                value={leadTimeDias}
                onChange={(e) => setLeadTimeDias(Number(e.target.value))}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                Fornecedor
              </label>
              {fornecedores.length > 0 ? (
                <select
                  value={fornecedorId}
                  onChange={handleFornecedorChange}
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E] truncate"
                >
                  <option value="">Selecione ou digite</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={fornecedorNome}
                  onChange={(e) => setFornecedorNome(e.target.value)}
                  placeholder="Nome do parceiro"
                  className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
                />
              )}
            </div>
          </div>

          {/* MOTOR DE DECISÃO EM CASCATA — DESTAQUE VISUAL (DIAGNÓSTICO E SUGESTÃO DO SISTEMA) */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F766E] flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#0F766E]" />
                <span>Diagnóstico VivaVarejo Integração</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  cascata.situacao === 'ruptura'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : cascata.situacao === 'divergencia_sistema_fisico'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : cascata.situacao === 'sem_giro'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : cascata.situacao === 'risco_ruptura'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {cascata.situacao === 'divergencia_sistema_fisico'
                  ? 'Divergência sistema × físico'
                  : cascata.situacao === 'sem_giro'
                    ? 'Sem giro comercial'
                    : cascata.situacao.replace('_', ' ')}{' '}
                • Prioridade {cascata.prioridade}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-teal-200 space-y-1">
              <div className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Ação indicada: {cascata.acaoSugerida}</span>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-relaxed">{cascata.justificativa}</p>
              {cascata.diagnosticoVerdade && (
                <div className="text-[10px] font-medium text-[#0F766E] pt-0.5">
                  Diagnóstico: {cascata.diagnosticoVerdade}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pt-1 text-[#374151]">
              <span>
                {cascata.geraDemandaAbastecimento
                  ? 'Gera demanda de abastecimento (cobertura interna / pedido).'
                  : 'NÃO gera demanda automática ao fornecedor (foco em conferência / giro).'}
              </span>
              <span className="font-bold text-[#0F766E]">
                {cascata.situacao === 'sem_giro' ? 'Estoque parado: ' : 'Impacto financeiro: '}
                {formatCurrency(cascata.potencialEstimado)}
              </span>
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Observação / Histórico Inicial (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Auditoria matinal encontrou prateleira vazia; etiqueta retirada pelo promotor..."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Ações */}
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
              disabled={salvando || !produtoDescricao.trim()}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Demanda no Integração</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
