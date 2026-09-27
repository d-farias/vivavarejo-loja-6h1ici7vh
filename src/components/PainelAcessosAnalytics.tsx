import React, { useState, useEffect } from 'react'
import {
  Users,
  Eye,
  UserPlus,
  TrendingUp,
  Smartphone,
  Monitor,
  RefreshCw,
  Calendar,
  Share2,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  Sparkles,
  FileText,
} from 'lucide-react'
import { analyticsService, isDemoEmail } from '@/services/analyticsService'
import type { ResumoAnalytics } from '@/types'
import { Badge } from '@/components/ui/badge'

export const PainelAcessosAnalytics: React.FC = () => {
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | '30dias'>('7dias')
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<ResumoAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtroIdentificacao, setFiltroIdentificacao] = useState<
    'todos' | 'identificados' | 'anonimos'
  >('todos')
  const [buscaTabela, setBuscaTabela] = useState('')

  const carregarDados = async (p: 'hoje' | '7dias' | '30dias') => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyticsService.getResumoAnalytics(p)
      setResumo(data)
    } catch (err) {
      console.error('Erro ao carregar dados de acessos:', err)
      setError('Não foi possível carregar os dados de visitas neste momento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados(periodo)
  }, [periodo])

  // Máximo para escala do gráfico de barras
  const maxAcessosDia = resumo ? Math.max(...resumo.acessosPorDia.map((d) => d.quantidade), 1) : 1

  return (
    <div className="space-y-6">
      {/* Topo informativo simples e leigo */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Exclusivo ADM Geral (Dfarias)
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#1F2937] mt-1.5">
            Acessos & Visitantes do VivaVarejo
          </h2>
          <p className="text-xs text-[#6B7280]">
            Saiba quantas pessoas entraram no App (pelo LinkedIn, Instagram ou direto), mesmo sem
            cadastro, e acompanhe o crescimento da sua rede.
          </p>
        </div>

        {/* Filtros de período: Hoje / 7 dias / 30 dias + Atualizar */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] p-1 text-xs">
            <button
              type="button"
              onClick={() => setPeriodo('hoje')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                periodo === 'hoje'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-gray-200'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('7dias')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                periodo === '7dias'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-gray-200'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('30dias')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                periodo === '30dias'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-gray-200'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Últimos 30 dias
            </button>
          </div>

          <button
            type="button"
            onClick={() => carregarDados(periodo)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded-lg shadow-2xs transition-colors"
            title="Atualizar números de acessos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0F766E]' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* 4 Cards Principais com Linguagem Leiga */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Acessos */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Total de Acessos
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
              {loading ? '...' : resumo?.totalAcessos.toLocaleString('pt-BR') || 0}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Quantas vezes as páginas foram abertas
            </p>
          </div>
        </div>

        {/* Card 2: Visitantes Únicos */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Pessoas Diferentes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
              {loading ? '...' : resumo?.visitantesUnicos.toLocaleString('pt-BR') || 0}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Visitantes únicos (celulares ou computadores distintos)
            </p>
          </div>
        </div>

        {/* Card 3: Contas Criadas */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Contas Criadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
              {loading ? '...' : resumo?.totalCadastros.toLocaleString('pt-BR') || 0}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Cadastros novos realizados no período
            </p>
          </div>
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Visitas que Viraram Conta
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F766E]">
              {loading ? '...' : `${resumo?.taxaConversao || 0}%`}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Taxa de conversão: visitante → cadastro
            </p>
          </div>
        </div>
      </div>

      {/* Sub-resumo: Usuário Identificado vs Anônimo */}
      <div className="bg-gradient-to-r from-teal-50/60 via-white to-gray-50 border border-teal-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-teal-200 shadow-2xs flex items-center justify-center text-[#0F766E] shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">
              Perfil dos Acessos: Identificados vs Anônimos
            </h4>
            <p className="text-[11px] text-[#6B7280]">
              Diferenciação clara entre clientes/gestores com login e visitantes sem identificação
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-emerald-200 shadow-2xs">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-700">Identificados</div>
              <div className="text-base font-extrabold text-[#1F2937] leading-none">
                {loading ? '...' : resumo?.totalIdentificados || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
            <UserX className="w-4 h-4 text-[#6B7280]" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Anônimos</div>
              <div className="text-base font-extrabold text-[#1F2937] leading-none">
                {loading ? '...' : resumo?.totalAnonimos || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Acessos por Dia em CSS Puro (Sóbrio sem bibliotecas pesadas) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F766E]" />
              Acessos por Dia
            </h3>
            <p className="text-xs text-[#6B7280]">
              Evolução diária de acessos no período selecionado
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E] inline-block" />
              Total de acessos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-200 inline-block" />
              Pessoas diferentes
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-44 flex items-center justify-center text-xs text-[#6B7280]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0F766E] mr-2" />
            Carregando gráfico...
          </div>
        ) : resumo?.acessosPorDia.length ? (
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 border-b border-[#E5E7EB] pb-2">
              {resumo.acessosPorDia.map((dia) => {
                const percTotal = Math.max(
                  (dia.quantidade / maxAcessosDia) * 100,
                  dia.quantidade > 0 ? 8 : 2,
                )
                const percUnicos = Math.max(
                  (dia.visitantesUnicos / maxAcessosDia) * 100,
                  dia.visitantesUnicos > 0 ? 6 : 1,
                )

                return (
                  <div
                    key={dia.data}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip flutuante no hover */}
                    <div className="absolute -top-12 bg-[#1F2937] text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                      <div className="font-bold">
                        {dia.dataLabel} ({dia.data})
                      </div>
                      <div>
                        {dia.quantidade} acessos · {dia.visitantesUnicos} únicos
                      </div>
                    </div>

                    {/* Barras duplas */}
                    <div className="w-full max-w-[28px] flex items-end gap-0.5 sm:gap-1 h-full">
                      {/* Barra total */}
                      <div
                        style={{ height: `${percTotal}%` }}
                        className="flex-1 bg-[#0F766E] hover:bg-[#115E59] rounded-t-sm transition-all"
                      />
                      {/* Barra pessoas únicas */}
                      <div
                        style={{ height: `${percUnicos}%` }}
                        className="flex-1 bg-teal-200 hover:bg-teal-300 rounded-t-sm transition-all"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Labels das datas embaixo */}
            <div className="flex gap-1 sm:gap-2">
              {resumo.acessosPorDia.map((dia, idx) => {
                // Em 30 dias, mostra labels espaçados para não sobrepor
                const shouldShowLabel =
                  periodo !== '30dias' ||
                  idx === 0 ||
                  idx === resumo.acessosPorDia.length - 1 ||
                  idx % 5 === 0

                return (
                  <div
                    key={dia.data}
                    className="flex-1 text-center text-[10px] text-[#6B7280] truncate"
                    title={dia.data}
                  >
                    {shouldShowLabel ? dia.dataLabel : '·'}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-[#6B7280]">
            Nenhum acesso registrado neste período ainda.
          </div>
        )}
      </div>

      {/* Grid de 2 Colunas: De Onde Vieram (Origens) & Páginas Mais Vistas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: De onde vieram as pessoas (Origem / Redes) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#0F766E]" />
                De Onde Vieram as Pessoas
              </h3>
              <p className="text-xs text-[#6B7280]">
                Origem dos acessos (LinkedIn, Instagram, link direto ou campanhas)
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0F766E]">
              {resumo?.origensRanking.length || 0} canais
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-[#6B7280]">Carregando canais...</div>
          ) : resumo?.origensRanking && resumo.origensRanking.length > 0 ? (
            <div className="space-y-3.5 flex-1">
              {resumo.origensRanking.map((item, idx) => (
                <div key={item.origem} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1F2937] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-[#4B5563] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {item.nomeAmigavel}
                    </span>
                    <span className="text-[#4B5563] font-medium">
                      <strong className="text-[#1F2937]">{item.quantidade}</strong> acessos (
                      {item.percentual.toFixed(1)}%)
                    </span>
                  </div>
                  {/* Barra de progresso visual */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F766E] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(item.percentual, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-[#6B7280]">
              Nenhum canal registrado ainda.
            </div>
          )}

          {/* Chips de Perfil Geográfico: Cidades / Regiões com mais acessos */}
          <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                Perfil Geográfico (Cidades/Estados)
              </span>
              <span className="text-[10px] font-semibold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                IP anônimo
              </span>
            </div>
            {resumo?.locaisRanking && resumo.locaisRanking.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {resumo.locaisRanking.map((loc) => (
                  <span
                    key={loc.local}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-50 border border-slate-200 text-slate-800 font-medium hover:bg-slate-100 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                    <span>{loc.local}</span>
                    <strong className="text-[#0F766E] font-bold">{loc.quantidade}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280] italic">
                Localização geográfica será preenchida conforme novos acessos forem registrados.
              </p>
            )}
          </div>

          {/* Dica leiga de como usar utm no LinkedIn */}
          <div className="mt-4 p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
            <strong className="text-[#1F2937] block">
              💡 Dica para suas postagens no LinkedIn:
            </strong>
            <p>
              Ao compartilhar no LinkedIn, adicione{' '}
              <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[#0F766E]">
                ?utm_source=linkedin
              </code>{' '}
              ao final do link para que o sistema identifique certinho que a visita veio do seu
              post!
            </p>
          </div>
        </div>

        {/* Bloco 2: O Que Mais Acessaram (Páginas Mais Visitadas) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0F766E]" />
                O Que Mais Foi Visitado
              </h3>
              <p className="text-xs text-[#6B7280]">
                Páginas públicas, telas do app ou anúncios que chamaram mais atenção
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0F766E]">
              {resumo?.paginasRanking.length || 0} telas
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-[#6B7280]">Carregando telas...</div>
          ) : resumo?.paginasRanking && resumo.paginasRanking.length > 0 ? (
            <div className="space-y-3.5 flex-1">
              {resumo.paginasRanking.map((item, idx) => (
                <div key={item.pagina} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1F2937] flex items-center gap-2 truncate max-w-[65%]">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-[#4B5563] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate" title={item.pagina}>
                        {item.nomeAmigavel}
                      </span>
                    </span>
                    <span className="text-[#4B5563] font-medium shrink-0">
                      <strong className="text-[#1F2937]">{item.quantidade}</strong> vezes (
                      {item.percentual.toFixed(1)}%)
                    </span>
                  </div>
                  {/* Barra de progresso visual */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(item.percentual, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-[#6B7280]">
              Nenhuma página registrada ainda.
            </div>
          )}

          {/* Resumo de Dispositivos Celular vs Computador */}
          <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563]">
            <span className="font-semibold text-[#1F2937]">Aparelho mais usado:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#0F766E]" />
                <strong>{resumo?.dispositivos.mobile || 0}</strong> Celular
              </span>
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#4B5563]" />
                <strong>{resumo?.dispositivos.desktop || 0}</strong> Computador
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Listagem de Visitas: Quem acessou (Data/Hora, Tela, Origem, Identificação) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0F766E]" />
              Registro de Acessos Recentes
            </h3>
            <p className="text-xs text-[#6B7280]">
              Últimos acessos ao sistema discriminando usuários identificados vs anônimos
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por tipo de identificação */}
            <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFiltroIdentificacao('todos')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filtroIdentificacao === 'todos'
                    ? 'bg-white text-[#0F766E] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroIdentificacao('identificados')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filtroIdentificacao === 'identificados'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                Identificados
              </button>
              <button
                type="button"
                onClick={() => setFiltroIdentificacao('anonimos')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filtroIdentificacao === 'anonimos'
                    ? 'bg-white text-gray-800 shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                Anônimos
              </button>
            </div>

            {/* Busca textual simples */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaTabela}
                onChange={(e) => setBuscaTabela(e.target.value)}
                placeholder="Buscar tela, origem, e-mail..."
                className="pl-8 pr-3 py-1 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F766E] w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0F766E] mx-auto mb-2" />
            Carregando acessos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563]">
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Data / Hora</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Tela / Página</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Origem do Tráfego</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Local (Cidade/UF)</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">
                    Identificação do Visitante
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">
                    Dispositivo
                  </th>{' '}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(() => {
                  const lista = (resumo?.visitasRecentes || []).filter((v) => {
                    const isIdent = Boolean(
                      (v.user_email && v.user_email.trim()) || (v.user_nome && v.user_nome.trim()),
                    )
                    if (filtroIdentificacao === 'identificados' && !isIdent) return false
                    if (filtroIdentificacao === 'anonimos' && isIdent) return false

                    if (buscaTabela.trim()) {
                      const termo = buscaTabela.toLowerCase().trim()
                      const matchPagina = (v.pagina || '').toLowerCase().includes(termo)
                      const matchOrigem = (v.origem || '').toLowerCase().includes(termo)
                      const matchEmail = (v.user_email || '').toLowerCase().includes(termo)
                      const matchNome = (v.user_nome || '').toLowerCase().includes(termo)
                      return matchPagina || matchOrigem || matchEmail || matchNome
                    }
                    return true
                  })

                  if (lista.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[#6B7280]">
                          Nenhum registro de acesso encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )
                  }
                  const formatOrigemLabel = (origemRaw?: string) => {
                    const o = (origemRaw || 'direto').toLowerCase().trim()
                    if (o === 'site_oficial') return 'Site Oficial (vivavarejo.com)'
                    if (o === 'linkedin') return 'LinkedIn'
                    if (o === 'instagram') return 'Instagram'
                    if (o === 'whatsapp') return 'WhatsApp'
                    if (o === 'google') return 'Google'
                    if (o === 'facebook') return 'Facebook'
                    if (o === 'direto') return 'Acesso Direto'
                    return o
                  }

                  return lista.map((v) => {
                    const isIdent = Boolean(
                      (v.user_email && v.user_email.trim()) || (v.user_nome && v.user_nome.trim()),
                    )
                    const dataFormatada = v.created
                      ? new Date(v.created.replace(' ', 'T')).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'

                    const origemFormatada = formatOrigemLabel(v.origem)

                    return (
                      <tr key={v.id} className="hover:bg-[#F9FAFB] transition-colors">
                        {/* Data / Hora */}
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#6B7280] whitespace-nowrap">
                          {dataFormatada}
                        </td>
                        {/* Tela */}
                        <td className="py-2.5 px-4 text-[#1F2937] font-medium whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[#374151]">
                            {v.pagina || '/'}
                          </span>
                        </td>
                        {/* Origem */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              v.origem === 'site_oficial'
                                ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                                : v.origem === 'linkedin'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : v.origem === 'instagram'
                                    ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                    : v.origem === 'whatsapp'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-gray-100 text-[#4B5563]'
                            }`}
                          >
                            {origemFormatada}
                          </span>
                        </td>
                        {/* Local (Cidade/UF) */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {v.cidade || v.regiao ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              <MapPin className="w-3 h-3 text-[#0F766E] shrink-0" />
                              {v.cidade && v.regiao
                                ? `${v.cidade} - ${v.regiao}`
                                : v.cidade || v.regiao}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] text-[11px]">—</span>
                          )}
                        </td>
                        {/* Identificação */}{' '}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isIdent ? (
                            (() => {
                              const isDemo = isDemoEmail(v.user_email)
                              return (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isDemo ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                  />
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-[#1F2937] leading-tight">
                                        {v.user_nome || v.user_email}
                                      </span>
                                      {isDemo && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1.5 py-0 h-4 bg-amber-50 text-amber-800 border-amber-300 font-bold inline-flex items-center gap-0.5"
                                        >
                                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                          Demo
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#6B7280] leading-tight">
                                      {v.user_email && v.user_nome ? v.user_email : ''}
                                      {v.user_perfil ? ` • perfil: ${v.user_perfil}` : ''}
                                    </span>
                                  </div>
                                </div>
                              )
                            })()
                          ) : (
                            <div className="flex items-center gap-1.5 text-[#6B7280]">
                              <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                              <span className="font-medium italic text-[11px]">
                                Anônimo (Visitante Externo)
                              </span>
                              <span className="text-[10px] font-mono text-[#9CA3AF]">
                                ({v.sessao_id.substring(0, 10)})
                              </span>
                            </div>
                          )}
                        </td>
                        {/* Dispositivo */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          {v.dispositivo === 'mobile' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-gray-100 text-[#4B5563]"
                              title="Celular / Tablet"
                            >
                              <Smartphone className="w-3 h-3 text-[#0F766E]" />
                              Mobile
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-gray-100 text-[#4B5563]"
                              title="Computador"
                            >
                              <Monitor className="w-3 h-3 text-[#4B5563]" />
                              Desktop
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PainelAcessosAnalytics
