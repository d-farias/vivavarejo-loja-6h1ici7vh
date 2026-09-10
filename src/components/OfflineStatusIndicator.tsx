import React, { useState } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface OfflineStatusIndicatorProps {
  className?: string
  compact?: boolean
}

/**
 * Indicador discreto e elegante de status Online/Offline com contador de pendências
 * Projetado dentro do tema claro/verde aprovado do VivaVarejo, contraste WCAG AA,
 * sem quebrar layouts mobile nem desktop.
 */
export function OfflineStatusIndicator({
  className = '',
  compact = false,
}: OfflineStatusIndicatorProps) {
  const { isOnline, pendingCount, isSyncing, pendingItems, forcarSincronizacao } = useOfflineSync()
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false)

  // Rótulos de tipos amigáveis
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'execucao_rotina':
        return 'Execução de Rotina'
      case 'visita_checkin':
        return 'Check-in de Visita'
      case 'visita_checkout':
        return 'Check-out de Visita'
      case 'visita_conclusao':
        return 'Checklist & Conclusão de Visita'
      case 'tarefa_validade_execucao':
        return 'Validade de Produto'
      default:
        return 'Registro Operacional'
    }
  }

  // Se estiver online e sem pendências e for compacto, exibe uma pill mínima ou oculta se desejado
  return (
    <>
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => {
            if (pendingCount > 0 || !isOnline) {
              setModalDetalhesAberto(true)
            } else {
              forcarSincronizacao()
            }
          }}
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border shadow-2xs select-none ${
            !isOnline
              ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
              : pendingCount > 0
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F766E]/50'
          }`}
          title={
            !isOnline
              ? 'Modo Offline: Seus registros estão sendo salvos no aparelho'
              : pendingCount > 0
                ? `${pendingCount} item(ns) aguardando envio para o servidor`
                : 'Conectado à nuvem'
          }
        >
          {/* Ícone de status */}
          {!isOnline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          ) : isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-[#0F766E] animate-spin shrink-0" />
          ) : pendingCount > 0 ? (
            <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          )}

          {/* Texto / Contador */}
          {!isOnline ? (
            <span className="flex items-center gap-1">
              <span>Offline</span>
              {pendingCount > 0 && (
                <span className="bg-amber-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </span>
          ) : isSyncing ? (
            <span className="text-[#0F766E]">Enviando...</span>
          ) : pendingCount > 0 ? (
            <span className="flex items-center gap-1 text-emerald-900">
              <span className="hidden sm:inline">Aguardando:</span>
              <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            </span>
          ) : !compact ? (
            <span className="text-[#4B5563] hidden sm:inline">Online</span>
          ) : null}
        </button>
      </div>

      {/* Modal de Detalhes da Fila de Sincronização */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="w-[95vw] max-w-md p-0 gap-0 overflow-hidden bg-white rounded-xl border border-[#E5E7EB] shadow-2xl">
          <DialogHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F7F7F5] shrink-0 text-left">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  !isOnline
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-teal-50 text-[#0F766E] border-teal-200'
                }`}
              >
                {!isOnline ? 'Modo Desconectado' : 'Fila de Sincronização'}
              </span>
              <span className="text-xs font-mono font-semibold text-[#6B7280]">
                {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
              </span>
            </div>

            <DialogTitle className="text-base font-bold text-[#1F2937]">
              {!isOnline ? 'Você está operando offline' : 'Itens aguardando sincronização'}
            </DialogTitle>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {!isOnline
                ? 'Todas as suas ações (fotos, checklist, rotinas e horários reais) estão gravadas em segurança no celular. Assim que a rede voltar, o envio ocorrerá automaticamente.'
                : 'Os registros abaixo foram concluídos no aparelho e estão sendo transmitidos para o servidor VivaVarejo.'}
            </p>
          </DialogHeader>

          <div className="p-4 space-y-2.5 max-h-[320px] overflow-y-auto">
            {pendingItems.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-[#1F2937]">Tudo sincronizado!</h4>
                <p className="text-xs text-[#6B7280]">
                  Nenhum registro pendente na fila deste aparelho.
                </p>
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] flex items-start justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                      <Layers className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                      <span className="truncate">{getTipoLabel(item.type)}</span>
                      {item.fotoBlob && (
                        <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded shrink-0">
                          Com foto
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#4B5563]">
                      Registrado às:{' '}
                      <b>
                        {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </b>
                    </div>
                    {item.lastError && (
                      <div className="text-[10px] text-red-700 bg-red-50 p-1 rounded border border-red-200">
                        Tentativa falhou: {item.lastError} (tentará de novo)
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      item.status === 'syncing'
                        ? 'bg-teal-100 text-[#0F766E]'
                        : item.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status === 'syncing'
                      ? 'Transmitindo'
                      : item.status === 'failed'
                        ? 'Reagendado'
                        : 'Na fila'}
                  </span>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="px-5 py-3 border-t border-[#E5E7EB] bg-white flex flex-row items-center justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalDetalhesAberto(false)}
              className="text-xs"
            >
              Fechar
            </Button>

            {isOnline && pendingCount > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => forcarSincronizacao()}
                disabled={isSyncing}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Enviando...' : 'Sincronizar Agora'}</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
