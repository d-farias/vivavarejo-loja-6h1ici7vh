import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, User, ShieldAlert, ExternalLink, ChevronDown } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/phone-utils'

export interface BotaoAvisoWhatsAppProps {
  lojaNome?: string
  tarefaTitulo: string
  setor?: string
  horario?: string
  situacao: string
  telefoneResponsavel?: string
  telefoneChefe?: string
  nomeResponsavel?: string
  nomeChefe?: string
  /**
   * Classe adicional para customização visual do botão
   */
  className?: string
  /**
   * Estilo compacto para tabelas e cards apertados
   */
  compact?: boolean
}

/**
 * Botão discreto para disparar aviso via WhatsApp (wa.me)
 * Abre menu suspenso com as opções:
 * - Responsável direto
 * - Chefe imediato
 * Só exibe se houver ao menos um dos dois telefones cadastrados.
 */
export function BotaoAvisoWhatsApp({
  lojaNome,
  tarefaTitulo,
  setor,
  horario,
  situacao,
  telefoneResponsavel,
  telefoneChefe,
  nomeResponsavel,
  nomeChefe,
  className = '',
  compact = false,
}: BotaoAvisoWhatsAppProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const hasResponsavel = Boolean(telefoneResponsavel && telefoneResponsavel.trim())
  const hasChefe = Boolean(telefoneChefe && telefoneChefe.trim())

  // Se não há nenhum telefone configurado, o botão não é exibido
  if (!hasResponsavel && !hasChefe) {
    return null
  }

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const linkResponsavel = hasResponsavel
    ? buildWhatsAppLink({
        loja: lojaNome,
        tarefa: tarefaTitulo,
        setor,
        horario,
        situacao,
        telefone: telefoneResponsavel!,
        destinatario: nomeResponsavel || 'Responsável',
      })
    : null

  const linkChefe = hasChefe
    ? buildWhatsAppLink({
        loja: lojaNome,
        tarefa: tarefaTitulo,
        setor,
        horario,
        situacao,
        telefone: telefoneChefe!,
        destinatario: nomeChefe || 'Chefe imediato',
      })
    : null

  // Se tem apenas um dos dois, clique direto ou menu
  const handleClickTrigger = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Se tiver ambos, abre o dropdown para escolher
    // Se tiver apenas um, abre direto
    if (hasResponsavel && !hasChefe && linkResponsavel) {
      window.open(linkResponsavel, '_blank', 'noopener,noreferrer')
      return
    }
    if (!hasResponsavel && hasChefe && linkChefe) {
      window.open(linkChefe, '_blank', 'noopener,noreferrer')
      return
    }
    setOpen((prev) => !prev)
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={handleClickTrigger}
        title="Avisar por WhatsApp"
        aria-label="Avisar por WhatsApp"
        className={`inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors shadow-2xs font-medium ${
          compact ? 'p-1 text-[11px]' : 'px-2 py-1 text-xs'
        }`}
      >
        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/10" />
        <span className={compact ? 'hidden sm:inline' : ''}>WhatsApp</span>
        {hasResponsavel && hasChefe && (
          <ChevronDown className="w-3 h-3 text-emerald-600 opacity-70" />
        )}
      </button>

      {open && hasResponsavel && hasChefe && (
        <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-50 w-56 rounded-md bg-white border border-[#E5E7EB] shadow-lg py-1 text-xs focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 flex items-center justify-between">
            <span>Avisar por WhatsApp</span>
            <MessageCircle className="w-3 h-3 text-emerald-600" />
          </div>

          {linkResponsavel && (
            <a
              href={linkResponsavel}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-[11px] text-[#1F2937]">Responsável direto</div>
                  {nomeResponsavel && (
                    <div className="text-[10px] text-gray-500 truncate">{nomeResponsavel}</div>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-400 shrink-0 ml-1" />
            </a>
          )}

          {linkChefe && (
            <a
              href={linkChefe}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors border-t border-gray-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-[11px] text-[#1F2937]">Chefe imediato</div>
                  {nomeChefe && (
                    <div className="text-[10px] text-gray-500 truncate">{nomeChefe}</div>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-400 shrink-0 ml-1" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
