import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ShieldAlert, ShieldCheck, Check, RotateCcw } from 'lucide-react'
import type { TarefaValidade } from '@/types'
import { normalizarNomeCanonico } from '@/lib/cargos'
import { tarefasValidadeService } from '@/services/tarefasValidade'

interface ValidarValidadeModalProps {
  isOpen: boolean
  onClose: () => void
  tarefa: TarefaValidade | null
  onAprovar: (tarefaId: string) => Promise<void>
  onDevolver: (tarefaId: string, motivo: string) => Promise<void>
}

export function ValidarValidadeModal({
  isOpen,
  onClose,
  tarefa,
  onAprovar,
  onDevolver,
}: ValidarValidadeModalProps) {
  const [modo, setModo] = useState<'aprovar' | 'devolver' | null>(null)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setModo(null)
      setComentario('')
    }
  }, [isOpen])

  if (!isOpen || !tarefa) return null

  const fotoUrl = tarefasValidadeService.getFotoUrl(tarefa)

  const handleConfirmarAprovacao = async () => {
    setLoading(true)
    try {
      await onAprovar(tarefa.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarDevolucao = async () => {
    if (!comentario.trim()) return
    setLoading(true)
    try {
      await onDevolver(tarefa.id, comentario.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-lg bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#1F2937]">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <span>
              Validação de Tarefa —{' '}
              {normalizarNomeCanonico(tarefa.validador_funcao_nome || 'Prevenção de Perdas')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* Dados da Tarefa */}
          <div className="p-3 bg-[#F7F7F5] rounded-md border border-[#E5E7EB] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Setor / Categoria
            </span>
            <p className="font-bold text-sm text-[#1F2937]">{tarefa.setor_categoria}</p>
            <p className="text-xs text-[#4B5563]">
              {tarefa.descricao || 'Verificação de validade'}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] pt-1">
              <span>
                Janela: {tarefa.horario_inicio}{' '}
                {tarefa.horario_fim ? `– ${tarefa.horario_fim}` : ''}
              </span>
              {tarefa.concluida_em && (
                <>
                  <span>•</span>
                  <span>
                    Concluída em:{' '}
                    {new Date(tarefa.concluida_em).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Registro de Como foi Realizada */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#374151] block">
              Observações do Executor:
            </span>
            <div className="p-3 rounded-md bg-white border border-[#E5E7EB] text-xs text-[#1F2937] italic">
              {tarefa.observacao_execucao || 'Nenhuma observação informada.'}
            </div>
          </div>

          {/* Foto de Prova */}
          {fotoUrl && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#374151] block">
                Foto de Prova Anexada:
              </span>
              <a
                href={fotoUrl}
                target="_blank"
                rel="noreferrer"
                className="block border border-[#E5E7EB] rounded-lg overflow-hidden group relative hover:opacity-95"
              >
                <img
                  src={fotoUrl}
                  alt="Foto comprobatória da validade"
                  className="w-full max-h-56 object-contain bg-black/5"
                />
                <span className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white font-medium">
                  Clique para ampliar
                </span>
              </a>
            </div>
          )}

          {/* Modo Devolver selecionado */}
          {modo === 'devolver' && (
            <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
              <label className="text-xs font-semibold text-[#B91C1C] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Motivo da Devolução / Ajustes Necessários</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Foto ilegível, faltou conferir o lote superior da gôndola, refaça a conferência."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-red-200 rounded-md outline-none focus:border-[#B91C1C]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-3">
          {modo === null ? (
            <>
              <button
                type="button"
                onClick={() => setModo('devolver')}
                className="px-3.5 py-2 border border-red-200 text-[#B91C1C] hover:bg-red-50 rounded-md text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Devolver para Ajuste</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmarAprovacao}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Aprovando...' : 'Aprovar Tarefa'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setModo(null)}
                className="px-3.5 py-2 border border-[#E5E7EB] hover:bg-gray-100 rounded-md text-xs font-semibold text-[#4B5563]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDevolucao}
                disabled={loading || !comentario.trim()}
                className="px-4 py-2 bg-[#B91C1C] hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{loading ? 'Devolvendo...' : 'Confirmar Devolução'}</span>
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
