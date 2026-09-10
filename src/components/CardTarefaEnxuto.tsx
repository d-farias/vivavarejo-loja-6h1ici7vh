import React, { useState } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isPastDue } from '@/lib/time-utils'
import type { Rotina } from '@/types'

export interface CardTarefaEnxutoProps {
  rotina: Rotina
  concluida?: boolean
  horarioStatus?: 'atrasado' | 'proximo' | 'em_dia' | 'sem_horario'
  onExecutar: (rotina: Rotina) => void
  onVerDetalhes?: (rotina: Rotina) => void
  onReadequar?: (rotina: Rotina) => void
  onPlanoAcao?: (rotina: Rotina) => void
  onWhatsApp?: (rotina: Rotina) => void
}

/**
 * Card de Tarefa Enxuto conforme item 3 e 4 das especificações:
 * "07:45 — Abertura de Loja / Alta prioridade / Atrasada / Conferir fundo de caixa e sangrias. / [botão Executar tarefa]"
 * Mantém apenas o essencial no card frontal. Detalhes secundários (validador, ferramentas, 5W2H)
 * expandem ao tocar em 'Ver detalhes' ou durante o fluxo guiado de execução.
 */
export function CardTarefaEnxuto({
  rotina,
  concluida,
  horarioStatus,
  onExecutar,
  onVerDetalhes,
  onReadequar,
  onPlanoAcao,
  onWhatsApp,
}: CardTarefaEnxutoProps) {
  const [expandido, setExpandido] = useState(false)

  const atrasada = !concluida && isPastDue(rotina.horario_limite)
  const horario = rotina.horario_limite ? rotina.horario_limite.replace('h', '') : 'Sem horário'

  // Prioridade inferida ou explícita
  const isCritica =
    atrasada ||
    rotina.nome.toLowerCase().includes('abertura') ||
    rotina.nome.toLowerCase().includes('caixa') ||
    rotina.nome.toLowerCase().includes('temperatura') ||
    (rotina.prioridade_dia && rotina.prioridade_dia <= 3)

  return (
    <div
      className={`rounded-xl border transition-all p-3.5 sm:p-4 bg-white shadow-xs ${
        concluida
          ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
          : atrasada
            ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
            : 'border-[#E5E7EB] hover:border-[#2563EB]/40'
      }`}
    >
      {/* Linha 1: Horário — Título da Tarefa + Badges enxutos */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-mono text-xs font-bold text-[#1F2937] bg-gray-100 px-1.5 py-0.5 rounded">
              {horario}
            </span>
            <span className="text-xs font-semibold text-[#1F2937] truncate">{rotina.nome}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {isCritica && !concluida && (
              <Badge
                variant="destructive"
                className="text-[10px] uppercase font-bold py-0 px-1.5 h-4.5 bg-red-600 text-white"
              >
                Alta prioridade
              </Badge>
            )}

            {atrasada && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold py-0 px-1.5 h-4.5 text-red-700 bg-red-50 border-red-300"
              >
                Atrasada
              </Badge>
            )}

            {concluida && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold py-0 px-1.5 h-4.5 text-emerald-700 bg-emerald-50 border-emerald-300 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Concluída
              </Badge>
            )}

            {rotina.responsavel && (
              <span className="text-[11px] text-[#6B7280]">• {rotina.responsavel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Linha 2: Resumo descritivo / O que fazer */}
      {rotina.observacoes && (
        <p className="text-xs text-[#4B5563] mt-2 line-clamp-2 leading-relaxed">
          {rotina.observacoes}
        </p>
      )}

      {/* Linha 3: Uma ação principal evidente + toggle de detalhes adicionais */}
      <div className="mt-3.5 pt-2.5 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="text-[11px] font-medium text-[#6B7280] hover:text-[#1F2937] underline decoration-dotted transition-colors"
          >
            {expandido ? 'Menos detalhes' : 'Mais informações'}
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {concluida ? (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Executada hoje
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => onExecutar(rotina)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold h-8 px-3 shadow-xs"
            >
              <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
              Executar tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Bloco expandido sob demanda: preserva 100% dos dados para quando necessário */}
      {expandido && (
        <div className="mt-3 pt-3 border-t border-dashed border-[#E5E7EB] text-xs space-y-2 bg-[#F9FAFB] p-2.5 rounded-lg text-[#374151]">
          {rotina.ferramenta && (
            <div>
              <span className="font-semibold text-[#1F2937]">Ferramenta: </span>
              <span>{rotina.ferramenta}</span>
            </div>
          )}
          {rotina.validacao && (
            <div>
              <span className="font-semibold text-[#1F2937]">Validador: </span>
              <span>{rotina.validacao}</span>
            </div>
          )}
          {rotina.area && (
            <div>
              <span className="font-semibold text-[#1F2937]">Área/Setor: </span>
              <span>{rotina.area}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            {onReadequar && !concluida && (
              <button
                type="button"
                onClick={() => onReadequar(rotina)}
                className="text-[11px] font-medium text-amber-700 hover:underline"
              >
                Readequar horário
              </button>
            )}
            {onPlanoAcao && (
              <button
                type="button"
                onClick={() => onPlanoAcao(rotina)}
                className="text-[11px] font-medium text-blue-700 hover:underline"
              >
                Criar Plano 5W2H
              </button>
            )}
            {onWhatsApp && (
              <button
                type="button"
                onClick={() => onWhatsApp(rotina)}
                className="text-[11px] font-medium text-emerald-700 hover:underline"
              >
                Aviso WhatsApp
              </button>
            )}
            {onVerDetalhes && (
              <button
                type="button"
                onClick={() => onVerDetalhes(rotina)}
                className="text-[11px] font-medium text-[#2563EB] hover:underline ml-auto"
              >
                Ver ficha completa →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
