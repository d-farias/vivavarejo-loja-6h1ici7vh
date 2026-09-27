import React from 'react'
import { useI18n } from '@/lib/i18n/context'
import { FlagBrazil, FlagUSA } from './FlagIcons'

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
}

/**
 * Seletor de idioma sóbrio e compacto com bandeirinhas Brasil (PT) e EUA (EN).
 * Atende aos requisitos:
 * - Localizado ao lado do botão "Entrar" (deslogado) e no topo/header (logado)
 * - Design sóbrio, elegante, harmônico com a identidade visual do VivaVarejo
 * - Troca imediata sem recarregar a página
 * - Persistido em localStorage
 */
export function LanguageSelector({ className = '', compact = false }: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n()

  return (
    <div
      role="group"
      aria-label="Seletor de idioma / Language selector"
      className={`inline-flex items-center p-0.5 rounded-lg border border-[#E5E7EB] bg-white shadow-2xs ${className}`}
    >
      {/* Botão Português */}
      <button
        type="button"
        onClick={() => setLocale('pt')}
        aria-pressed={locale === 'pt'}
        title="Versão em Português (Brasil)"
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
          locale === 'pt'
            ? 'bg-teal-50 text-[#0F766E] border border-teal-200/80 shadow-2xs font-bold'
            : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-50 border border-transparent opacity-75 hover:opacity-100'
        }`}
      >
        <FlagBrazil className="w-4 h-3 shrink-0 rounded-xs" />
        {!compact && <span className="text-[11px] uppercase tracking-wider">PT</span>}
      </button>

      {/* Botão Inglês */}
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        title="English version (United States)"
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
          locale === 'en'
            ? 'bg-teal-50 text-[#0F766E] border border-teal-200/80 shadow-2xs font-bold'
            : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-50 border border-transparent opacity-75 hover:opacity-100'
        }`}
      >
        <FlagUSA className="w-4 h-3 shrink-0 rounded-xs" />
        {!compact && <span className="text-[11px] uppercase tracking-wider">EN</span>}
      </button>
    </div>
  )
}
