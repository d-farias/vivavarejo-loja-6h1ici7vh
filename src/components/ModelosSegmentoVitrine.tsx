import React, { useState, useEffect } from 'react'
import type { ModeloComContagem, Cliente, Loja, ModeloRotinaItem, PerfilUsuario } from '@/types'
import { modelosRotinasService } from '@/services/modelosRotinas'
import { VAREJO_SEGMENTOS } from '@/components/EnquadramentoClienteCard'
import { ModeloDetalhesModal } from '@/components/ModeloDetalhesModal'
import { AplicarModeloModal } from '@/components/AplicarModeloModal'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import {
  Layers,
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle2,
  Lock,
  MessageSquare,
  Clock,
  Briefcase,
  Store,
  Info,
  Check,
} from 'lucide-react'

interface ModelosSegmentoVitrineProps {
  userPerfil: PerfilUsuario
  lojas: Loja[]
  clientes: Cliente[]
  onRotinasAtualizadas?: () => void
}

export const ModelosSegmentoVitrine: React.FC<ModelosSegmentoVitrineProps> = ({
  userPerfil,
  lojas,
  clientes,
  onRotinasAtualizadas,
}) => {
  const [selectedSegmento, setSelectedSegmento] = useState<string>('Todos')
  const [modelos, setModelos] = useState<ModeloComContagem[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [detalhesModelo, setDetalhesModelo] = useState<ModeloComContagem | null>(null)
  const [aplicarModal, setAplicarModal] = useState<{
    open: boolean
    modeloId?: string
  }>({ open: false })
  const [falarModal, setFalarModal] = useState<{
    open: boolean
    assunto?: string
  }>({ open: false })

  const podeAplicarDeFato = userPerfil === 'admin' || userPerfil === 'adm_rede'

  const carregarModelos = async () => {
    setLoading(true)
    try {
      const data = await modelosRotinasService.getAllComContagem()
      setModelos(data)
    } catch (e) {
      console.error('Erro ao carregar modelos para vitrine:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarModelos()
  }, [])

  // Filtro de modelos por segmento
  const modelosFiltrados = modelos.filter((m) => {
    if (selectedSegmento === 'Todos') return true
    // Compara por segmento cadastrado explicitamente ou presença no nome
    if (m.segmento && m.segmento.toLowerCase() === selectedSegmento.toLowerCase()) return true
    if (m.nome.toLowerCase().includes(selectedSegmento.toLowerCase())) return true
    return false
  })

  const handleActionAplicar = (modelo: ModeloComContagem) => {
    if (podeAplicarDeFato) {
      setAplicarModal({ open: true, modeloId: modelo.id })
    } else {
      // Abre modal de demonstração / falar com especialista
      setFalarModal({
        open: true,
        assunto: `Interesse em liberar e aplicar na minha rede o modelo "${modelo.nome}"`,
      })
    }
  }

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                Modelos do meu segmento
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Explorar & Navegar
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
              Descubra rotinas e padrões prontos de excelência testados para o seu tipo de varejo.
              {podeAplicarDeFato ? (
                <strong className="text-[#2563EB] ml-1">
                  Seu perfil possui permissão para aplicar diretamente na sua loja.
                </strong>
              ) : (
                <span className="text-gray-500 ml-1">
                  Navegue como vitrine e demonstração. Para ativar na sua rede, solicite liberação
                  de acesso ADM.
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setFalarModal({
              open: true,
              assunto: 'Gostaria de liberar acesso de ADM de rede para minha operação',
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors self-start sm:self-auto shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Falar com especialista</span>
        </button>
      </div>

      {/* Segment Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedSegmento('Todos')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
            selectedSegmento === 'Todos'
              ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
              : 'bg-[#F7F7F5] text-[#4B5563] hover:bg-gray-200 hover:text-[#1F2937]'
          }`}
        >
          Todos os segmentos ({modelos.length})
        </button>
        {VAREJO_SEGMENTOS.map((seg) => {
          const count = modelos.filter(
            (m) =>
              (m.segmento && m.segmento.toLowerCase() === seg.toLowerCase()) ||
              m.nome.toLowerCase().includes(seg.toLowerCase()),
          ).length
          return (
            <button
              key={seg}
              type="button"
              onClick={() => setSelectedSegmento(seg)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                selectedSegmento === seg
                  ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                  : 'bg-[#F7F7F5] text-[#4B5563] hover:bg-gray-200 hover:text-[#1F2937]'
              }`}
            >
              {seg} {count > 0 ? `(${count})` : ''}
            </button>
          )
        })}
      </div>

      {/* Cards Grid de Modelos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 py-4">
          <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      ) : modelosFiltrados.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-[#E5E7EB] rounded-lg bg-[#F7F7F5]/50">
          <p className="text-xs text-[#6B7280]">
            Nenhum modelo específico cadastrado para o filtro &ldquo;{selectedSegmento}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSelectedSegmento('Todos')}
            className="mt-2 text-xs text-[#2563EB] hover:underline font-semibold"
          >
            Ver todos os modelos disponíveis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {modelosFiltrados.map((modelo) => {
            return (
              <div
                key={modelo.id}
                className="group relative bg-[#F7F7F5]/40 hover:bg-white border border-[#E5E7EB] hover:border-[#2563EB]/40 rounded-lg p-4 transition-all duration-150 flex flex-col justify-between shadow-2xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] uppercase tracking-wider">
                      {modelo.segmento || 'Varejo Padrão'}
                    </span>
                    <span className="text-[11px] text-[#6B7280] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#2563EB]" />
                      {modelo.totalItens || 0} rotinas
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1F2937] leading-snug group-hover:text-[#2563EB] transition-colors">
                    {modelo.nome}
                  </h3>

                  <p className="text-xs text-[#6B7280] mt-1.5 line-clamp-2 leading-relaxed">
                    {modelo.descricao || 'Padrão completo de rotinas operacionais.'}
                  </p>
                </div>

                {/* Footer do Card com Ações */}
                <div className="pt-3 mt-3 border-t border-[#E5E7EB]/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDetalhesModelo(modelo)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] hover:bg-gray-100 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Visualizar Rotinas</span>
                  </button>

                  {podeAplicarDeFato ? (
                    <button
                      type="button"
                      onClick={() => handleActionAplicar(modelo)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded transition-colors shadow-2xs"
                    >
                      <span>Aplicar na Loja</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActionAplicar(modelo)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded transition-colors"
                      title="Demonstração — Fale com o especialista para liberar acesso ADM para sua rede"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Liberar na Rede</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Aviso institucional sóbrio */}
      <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-[#374151] flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-[11px] leading-relaxed">
            Deseja personalizar ou construir um modelo exclusivo para as particularidades da sua
            rede? O consultor especialista estrutura as demandas e libera seu painel de ADM de rede.
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            setFalarModal({
              open: true,
              assunto: 'Desejo construir modelo exclusivo para minha rede',
            })
          }
          className="text-xs font-bold text-[#2563EB] hover:underline whitespace-nowrap shrink-0"
        >
          Conversar agora
        </button>
      </div>

      {/* Modal Detalhes do Modelo */}
      <ModeloDetalhesModal
        isOpen={Boolean(detalhesModelo)}
        onClose={() => setDetalhesModelo(null)}
        modelo={detalhesModelo}
      />

      {/* Modal Aplicar Modelo (para adm e adm_rede) */}
      {podeAplicarDeFato && (
        <AplicarModeloModal
          isOpen={aplicarModal.open}
          onClose={() => setAplicarModal({ open: false })}
          onSuccess={() => {
            setAplicarModal({ open: false })
            if (onRotinasAtualizadas) {
              onRotinasAtualizadas()
            }
          }}
          modelos={modelos}
          clientes={clientes}
          lojas={lojas}
          initialModeloId={aplicarModal.modeloId}
        />
      )}

      {/* Modal Falar com Especialista com contexto */}
      <FalarEspecialistaModal
        open={falarModal.open}
        onOpenChange={(open) => setFalarModal((prev) => ({ ...prev, open }))}
        assuntoContexto={falarModal.assunto}
      />
    </section>
  )
}
