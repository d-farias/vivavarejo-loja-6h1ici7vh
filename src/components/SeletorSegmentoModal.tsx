import React, { useState } from 'react'
import {
  ShoppingCart,
  Pill,
  Dog,
  Shirt,
  Smartphone,
  Hammer,
  Store,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  X,
  Info,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { clearLocalCache } from '@/lib/offline/db'
import {
  SEGMENTOS_DISPONIVEIS,
  SegmentoInfo,
  segmentosService,
  normalizarSegmentoId,
} from '@/services/segmentos'
import { toast } from '@/hooks/use-toast'

interface SeletorSegmentoModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  obrigatorio?: boolean // se for true, usuário precisa escolher para desbloquear o app
}

function getIconComponent(iconeNome: string) {
  switch (iconeNome) {
    case 'ShoppingCart':
      return ShoppingCart
    case 'Pill':
      return Pill
    case 'Dog':
      return Dog
    case 'Shirt':
      return Shirt
    case 'Smartphone':
      return Smartphone
    case 'Hammer':
      return Hammer
    default:
      return Store
  }
}

export function SeletorSegmentoModal({
  open,
  onOpenChange,
  onSuccess,
  obrigatorio = false,
}: SeletorSegmentoModalProps) {
  const { user, refreshUser } = useAuth()
  const { lojaSelecionadaId } = useStore()
  const [selectedSegId, setSelectedSegId] = useState<string | null>(() => {
    return segmentosService.getSegmentoAtivo(user)
  })
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')

  if (!open) return null

  const segmentoAtual = segmentosService.getSegmentoAtivo(user)

  const handleConfirmar = async () => {
    if (!user || !selectedSegId) return
    setLoading(true)
    setProgressMsg('Iniciando configuração do seu ramo...')

    try {
      const res = await segmentosService.ativarSegmento({
        userId: user.id,
        segmentoId: selectedSegId,
        clienteId: user.cliente,
        lojaId: lojaSelecionadaId !== 'todas' ? lojaSelecionadaId : undefined,
        onProgress: (m) => setProgressMsg(m),
      })

      await refreshUser()

      // Limpa cache offline local para recarga total
      await clearLocalCache('vivavarejo_')

      // Dispara evento global para recarga instantânea em todas as telas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vivavarejo:segmento_alterado', {
            detail: { segmento: selectedSegId },
          }),
        )
      }

      toast({
        title: 'Ramo configurado com sucesso!',
        description: `${res.rotinasAtivadas} rotinas prontas foram ativadas para o seu dia a dia.`,
      })

      onOpenChange?.(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('Erro ao configurar ramo:', err)
      toast({
        title: 'Erro ao ativar ramo',
        description:
          err instanceof Error
            ? err.message
            : 'Ocorreu um erro ao configurar o modelo. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setProgressMsg('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="segmento-modal-title"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Faixa decorativa superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0F766E] via-teal-500 to-emerald-400" />

        {/* Header Amigável para Leigos */}
        <div className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                <Sparkles className="w-3 h-3 text-[#0F766E]" />
                <span>Configuração Inteligente Sem Complicação</span>
              </div>
              <h2
                id="segmento-modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight"
              >
                Qual é o ramo da sua loja?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Escolha o segmento do seu negócio com 1 clique. O VivaVarejo carrega automaticamente
                todas as rotinas prontas e oculta o que não for do seu setor — tudo feito para você
                sem complicação.
              </p>
            </div>

            {!obrigatorio && onOpenChange && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Grid de Escolha Simples (Cards Grandes e Limpos) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SEGMENTOS_DISPONIVEIS.map((seg) => {
              const Icon = getIconComponent(seg.icone)
              const isSelected = selectedSegId === seg.id
              const isAtual = normalizarSegmentoId(segmentoAtual) === seg.id

              return (
                <button
                  key={seg.id}
                  type="button"
                  disabled={loading}
                  onClick={() => setSelectedSegId(seg.id)}
                  className={`group relative text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0F766E] bg-teal-50/70 shadow-sm ring-2 ring-[#0F766E]/20'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50/80 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#0F766E] text-white'
                            : 'bg-teal-50 text-[#0F766E] group-hover:bg-teal-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAtual && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            Ativo
                          </span>
                        )}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#0F766E] bg-[#0F766E] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`text-sm font-bold transition-colors ${
                          isSelected ? 'text-[#0F766E]' : 'text-gray-900'
                        }`}
                      >
                        {seg.nome}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {seg.subtitulo}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 text-[11px] text-gray-600 flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700">Inclui:</span>
                    <span className="truncate text-gray-500">{seg.exemploRotina}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Mensagem de estado de progresso durante o salvamento */}
          {loading && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                <p className="text-teal-900 font-bold">{progressMsg || 'Configurando o app...'}</p>
                <p className="text-teal-700 font-normal mt-0.5">
                  Isso leva apenas alguns segundos. Não precisa cadastrar nada na mão.
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de apoio ao usuário leigo */}
          {!loading && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span>
                  Você pode trocar de ramo quando quiser. Ao alternar, o sistema guarda o histórico
                  e troca automaticamente as rotinas em exibição sem misturar nada.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botão de ação único e claro */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            {selectedSegId ? (
              <span>
                Selecionado: <strong className="text-gray-900">{selectedSegId}</strong>
              </span>
            ) : (
              <span>Selecione 1 opção acima para prosseguir</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {!obrigatorio && onOpenChange && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              disabled={!selectedSegId || loading}
              onClick={handleConfirmar}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aplicando rotinas...</span>
                </>
              ) : (
                <>
                  <span>{segmentoAtual ? 'Salvar e Carregar Rotinas' : 'Confirmar e Começar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Banner ou Card de Destaque quando o segmento ainda não foi definido,
 * ou card resumido para o topo de páginas permitindo troca rápida com 1 clique.
 */
interface SegmentoAtivoBadgeProps {
  onTrocarSegmento: () => void
}

export function SegmentoAtivoBadge({ onTrocarSegmento }: SegmentoAtivoBadgeProps) {
  const { user } = useAuth()
  const segmento = segmentosService.getSegmentoAtivo(user)
  const info = segmentosService.getInfo(segmento)

  if (!segmento) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold leading-tight">
              Defina o ramo da sua loja
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Escolha seu segmento para ver as rotinas e a agenda prontas para seu negócio.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTrocarSegmento}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Escolher ramo agora</span>
        </button>
      </div>
    )
  }

  const Icon = info ? getIconComponent(info.icone) : Store

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs text-xs">
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-teal-50 text-[#0F766E]"
        style={{
          backgroundColor: 'var(--brand-primary, #0F766E)1a',
          color: 'var(--brand-primary, #0F766E)',
        }}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Ramo ativo:</span>
        <strong className="text-gray-900 font-bold">{info?.nome || segmento}</strong>
      </div>
      <button
        type="button"
        onClick={onTrocarSegmento}
        style={{ color: 'var(--brand-primary, #0F766E)' }}
        className="ml-1 text-[11px] font-semibold hover:underline inline-flex items-center gap-1 hover:opacity-80"
        title="Trocar ramo da loja"
      >
        <SlidersHorizontal className="w-3 h-3" />
        <span>Trocar</span>
      </button>
    </div>
  )
}
