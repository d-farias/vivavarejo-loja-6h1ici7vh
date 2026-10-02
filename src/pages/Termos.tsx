import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Shield,
  ArrowLeft,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSelector } from '@/components/LanguageSelector'
import { APP_VERSION_LABEL } from '@/lib/version'

export default function Termos() {
  const { t } = useI18n()
  const term = t.terms

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2937] flex flex-col font-sans">
      {/* Topo sóbrio */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/bem-vindo"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#4B5563] hover:text-[#0F766E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{term.backToHome}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              to="/bem-vindo"
              className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1F2937]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0F766E] flex items-center justify-center text-white">
                <div className="w-3 h-3 border-2 border-white rotate-45 transform" />
              </div>
              <span className="hidden sm:inline">{t.common.appName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-[#0F766E]">
              <FileText className="w-3.5 h-3.5" />
              <span>{term.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
              {term.title}
            </h1>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-3xl">
              {term.subtitle}
            </p>
            <p className="text-xs font-medium text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
              {term.lastUpdated}
            </p>
          </div>

          {/* 1. O que é a plataforma */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Building className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                {term.section1Title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{term.section1Text}</p>
          </div>

          {/* 2. Responsabilidade do Usuário */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                {term.section2Title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{term.section2Text}</p>
          </div>

          {/* 3. Propriedade Intelectual e Uso Permitido */}
          {/* NOTA INTERNA: Cláusula de proteção de propriedade intelectual adaptada da base jurídica do cliente para revisão jurídica periódica */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Shield className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                {term.section3Title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{term.section3Text}</p>
            {term.section3Vedações && (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#374151] leading-relaxed">
                <strong>Vedações expressas:</strong> {term.section3Vedações}
              </div>
            )}
          </div>

          {/* 4. Proteção do Conteúdo do Cliente */}
          {/* NOTA INTERNA: Conteúdo do cliente ≠ Propriedade intelectual da VivaVarejo */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                {term.sectionProtectionTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              {term.sectionProtectionText}
            </p>
          </div>

          {/* 5. Disponibilidade do Serviço e Período de Teste */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Building className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                {term.section4Title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{term.section4Text}</p>
          </div>

          {/* 5. Contato & Suporte Oficial */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                {term.section5Title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{term.section5Text}</p>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span className="text-xs font-semibold text-[#1F2937]">Canal oficial:</span>
                <a
                  href="mailto:contato@vivavarejo.com.br"
                  className="text-xs font-bold text-[#0F766E] hover:underline"
                >
                  contato@vivavarejo.com.br
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/privacidade"
                  className="text-xs font-semibold text-[#4B5563] hover:text-[#0F766E] underline underline-offset-2"
                >
                  {term.goToPrivacy}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé básico */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-6 mt-auto">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span>
              © {new Date().getFullYear()} VivaVarejo. {t.common.allRightsReserved}
            </span>
            <span className="font-mono font-bold bg-teal-50 text-[#0F766E] px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">
              {APP_VERSION_LABEL}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacidade" className="hover:text-[#0F766E] transition-colors">
              {t.landing.footerPrivacyPolicy}
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/bem-vindo" className="hover:text-[#0F766E] transition-colors">
              {term.backToHome}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
