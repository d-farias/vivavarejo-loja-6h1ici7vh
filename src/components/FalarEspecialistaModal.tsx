import React, { useState } from 'react'
import {
  MessageSquare,
  Mail,
  Phone,
  ExternalLink,
  X,
  Sparkles,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import { useContatosAtendimento } from '@/hooks/use-contatos-atendimento'

interface FalarEspecialistaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assuntoContexto?: string
  clienteId?: string
}

export const FalarEspecialistaModal: React.FC<FalarEspecialistaModalProps> = ({
  open,
  onOpenChange,
  assuntoContexto,
  clienteId,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const { contatos } = useContatosAtendimento(clienteId)

  if (!open) return null

  const specialistName = contatos.nomeAtendente || 'Especialista'
  const specialistEmail = contatos.email
  const whatsappPhoneLabel = contatos.whatsapp
  const whatsappNumberClean = contatos.whatsappRaw
  const whatsappUrl = whatsappNumberClean
    ? `https://wa.me/${whatsappNumberClean}`
    : 'https://wa.me/5548991817542'

  const whatsappMessage = encodeURIComponent(
    assuntoContexto
      ? `Olá, ${specialistName}! Gostaria de falar sobre o VivaVarejo: ${assuntoContexto}`
      : `Olá, ${specialistName}! Estou navegando no VivaVarejo e gostaria de tirar dúvidas sobre o atendimento/operação.`,
  )

  const mailtoLink = `mailto:${specialistEmail}?subject=${encodeURIComponent(
    assuntoContexto
      ? `[VivaVarejo] ${assuntoContexto}`
      : '[VivaVarejo] Contato com Suporte e Especialista',
  )}&body=${encodeURIComponent(
    `Olá, ${specialistName},\n\nGostaria de entender melhor como liberar o acesso e implementar as rotinas operacionais para a minha rede/lojas no VivaVarejo.\n\nAguardo retorno!`,
  )}`

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(specialistEmail)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-5 sm:p-6 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] leading-tight">
                Falar com Especialista
              </h2>
              <p className="text-xs text-[#6B7280]">
                {contatos.origem === 'rede' && contatos.nomeRede
                  ? `Suporte e Atendimento • ${contatos.nomeRede}`
                  : 'Consultoria em gestão e padrões operacionais de varejo'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {contatos.origem === 'rede' && contatos.nomeRede && (
          <div className="px-3 py-2 rounded-md bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Contatos de atendimento validados para a rede <strong>{contatos.nomeRede}</strong>.
            </span>
          </div>
        )}

        {assuntoContexto && (
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-[#115E59] flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-[#0F766E] mt-0.5" />
            <div>
              <span className="font-semibold block">Interesse em modelo ou liberação:</span>
              <span>{assuntoContexto}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-[#4B5563] space-y-2 leading-relaxed">
          <p>
            O <strong>VivaVarejo</strong> disponibiliza atendimento direto com{' '}
            <strong className="text-[#1F2937]">{specialistName}</strong> para sanar dúvidas,
            implantar processos, auditar rotinas e alinhar demandas operacionais.
          </p>
        </div>

        {/* Canais de Contato Direto */}
        <div className="space-y-3">
          {/* WhatsApp Direct */}
          <a
            href={`${whatsappUrl}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Conversar pelo WhatsApp</span>
                  <ExternalLink className="w-3 h-3 text-emerald-700 opacity-70 group-hover:opacity-100" />
                </div>
                <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                  {whatsappPhoneLabel}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">
              Online
            </span>
          </a>

          {/* E-mail Direct */}
          <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F2937]">E-mail de suporte</div>
                  <div className="text-[11px] text-[#4B5563] font-mono">{specialistEmail}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={mailtoLink}
                className="flex-1 text-center py-1.5 px-3 bg-white border border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E] text-xs font-semibold rounded text-[#1F2937] transition-colors"
              >
                Abrir no seu E-mail
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="py-1.5 px-3 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-xs font-semibold rounded text-[#1F2937] transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedEmail ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado</span>
                  </>
                ) : (
                  <span>Copiar</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
          <span className="text-[11px] text-[#6B7280]">
            {contatos.origem === 'rede' && contatos.nomeRede
              ? `${contatos.nomeRede} • Suporte ao Usuário`
              : 'VivaVarejo • Consultoria Estratégica'}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] hover:bg-gray-100 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
