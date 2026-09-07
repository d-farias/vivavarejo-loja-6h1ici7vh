import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react'

interface PwaInstallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isIOS: boolean
  onNativePrompt?: () => Promise<void>
}

export function PwaInstallModal({
  open,
  onOpenChange,
  isIOS,
  onNativePrompt,
}: PwaInstallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-sm">
              <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#1F2937]">
                Instalar app no celular
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B7280]">
                Acesse o VivaVarejo em tela cheia com 1 toque, como app nativo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isIOS ? (
          <div className="py-2 space-y-3.5 text-xs text-[#374151]">
            <p className="font-medium text-[#1F2937]">Para instalar no iPhone / iPad (Safari):</p>
            <div className="space-y-2.5 bg-[#F7F7F5] p-3.5 rounded-lg border border-[#E5E7EB]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  1
                </span>
                <span className="leading-tight">
                  Toque no botão{' '}
                  <strong className="inline-flex items-center gap-1 font-semibold text-[#1F2937]">
                    <Share2 className="w-3.5 h-3.5 text-[#2563EB]" /> Compartilhar
                  </strong>{' '}
                  na barra do Safari (ícone de quadrado com seta para cima).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  2
                </span>
                <span className="leading-tight">
                  Role o menu para baixo e selecione{' '}
                  <strong className="inline-flex items-center gap-1 font-semibold text-[#1F2937]">
                    <PlusSquare className="w-3.5 h-3.5 text-[#2563EB]" /> Adicionar à Tela de Início
                  </strong>
                  .
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  3
                </span>
                <span className="leading-tight">
                  Toque em <strong>Adicionar</strong> no topo direito. O ícone do VivaVarejo
                  aparecerá na sua tela de início!
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-3 text-xs text-[#374151]">
            <p className="leading-relaxed">
              O VivaVarejo pode ser instalado direto no seu dispositivo (Android ou computador),
              funcionando mais rápido e em tela cheia sem a barra de endereços do navegador.
            </p>
            <ul className="space-y-1.5 bg-[#F7F7F5] p-3 rounded-lg border border-[#E5E7EB]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Acesso instantâneo com um toque</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Interface limpa em tela cheia</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Carregamento otimizado de telas</span>
              </li>
            </ul>
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            {isIOS ? 'Entendi' : 'Agora não'}
          </Button>
          {!isIOS && onNativePrompt && (
            <Button
              type="button"
              size="sm"
              onClick={onNativePrompt}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs inline-flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar agora</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
