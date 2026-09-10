import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ShieldAlert, Clock, LogOut } from 'lucide-react'

interface InactivityWarningModalProps {
  open: boolean
  secondsRemaining: number
  onExtend: () => void
  onLogoutNow: () => void
}

export function InactivityWarningModal({
  open,
  secondsRemaining,
  onExtend,
  onLogoutNow,
}: InactivityWarningModalProps) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md bg-white p-6 rounded-lg border border-amber-200 shadow-2xl z-[100]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-center text-[#1F2937]">
            Sua sessão vai expirar em breve
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-[#6B7280]">
            Por motivos de segurança operacional, contas sem interação por 30 minutos são
            automaticamente desconectadas.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Tempo restante de sessão:</span>
          </div>
          <div className="text-3xl font-mono font-bold text-amber-900 tracking-wider">
            {timeFormatted}
          </div>
          <p className="text-[11px] text-amber-700">
            Clique no botão abaixo para manter sua sessão ativa e continuar trabalhando.
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onLogoutNow}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-[#4B5563] hover:text-[#B91C1C] hover:bg-red-50 rounded-md border border-[#E5E7EB] transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair agora</span>
          </button>
          <button
            type="button"
            onClick={onExtend}
            autoFocus
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Continuar conectado</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
