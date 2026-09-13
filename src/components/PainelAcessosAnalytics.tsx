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
  FileText,
  Compass,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { analyticsService } from '@/services/analyticsService'
import type { ResumoAnalytics } from '@/types'

export const PainelAcessosAnalytics: React.FC = () => {
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | '30dias'>('7dias')
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<ResumoAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)

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

          {/* Dica leiga de como usar utm no LinkedIn */}
          <div className="mt-5 p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
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
    </div>
  )
}

export default PainelAcessosAnalytics
