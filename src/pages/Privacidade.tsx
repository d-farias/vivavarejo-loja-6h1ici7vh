import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Mail,
  FileCheck,
  Database,
  UserCheck,
  Server,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSelector } from '@/components/LanguageSelector'
import { APP_VERSION_LABEL } from '@/lib/version'

export default function Privacidade() {
  const { t } = useI18n()
  const p = t.privacy

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
            <span>{p.backToHome}</span>
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{p.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
              {p.title}
            </h1>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-3xl">
              {p.subtitle}
            </p>
            <p className="text-xs font-medium text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
              {p.lastUpdated}
            </p>
          </div>

          {/* 1. Compromisso */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Lock className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.introTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.introText}</p>
          </div>

          {/* 2. Dados Coletados */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Database className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.collectedTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.collectedText}</p>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] space-y-1">
                <div className="text-xs font-bold text-[#1F2937] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                  <span>Cadastro e Funil Comercial</span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">{p.collectedLeadItem}</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] space-y-1">
                <div className="text-xs font-bold text-[#1F2937] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                  <span>Dados Operacionais em Loja</span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {p.collectedOperationalItem}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] space-y-1">
                <div className="text-xs font-bold text-[#1F2937] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                  <span>Armazenamento Local Estrito (Sem cookies de terceiros)</span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">{p.collectedNoCookiesItem}</p>
              </div>
            </div>
          </div>

          {/* 3. Finalidades */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <FileCheck className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.howWeUseTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.howWeUseText}</p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#4B5563]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>{p.howWeUse1}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>{p.howWeUse2}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>{p.howWeUse3}</span>
              </li>
            </ul>
          </div>

          {/* 4. Não venda de dados */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Server className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.noSaleTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.noSaleText}</p>
          </div>

          {/* 5. Direitos do Titular */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.rightsTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.rightsText}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] text-xs text-[#374151]">
                <strong>Acesso:</strong> {p.right1}
              </div>
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] text-xs text-[#374151]">
                <strong>Correção:</strong> {p.right2}
              </div>
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] text-xs text-[#374151]">
                <strong>Eliminação:</strong> {p.right3}
              </div>
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] text-xs text-[#374151]">
                <strong>Revogação:</strong> {p.right4}
              </div>
            </div>

            <p className="text-xs text-[#6B7280] pt-2">
              {p.rightsContactText}{' '}
              <a
                href="mailto:contato@vivavarejo.com.br"
                className="font-bold text-[#0F766E] underline underline-offset-2 hover:text-[#115E59]"
              >
                contato@vivavarejo.com.br
              </a>
            </p>
          </div>

          {/* 6. Segurança */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.securityTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.securityText}</p>
          </div>

          {/* 7. Contato */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0F766E]">
              <Mail className="w-5 h-5 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">{p.contactTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{p.contactText}</p>
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span className="text-xs font-semibold text-[#1F2937]">{p.emailLabel}</span>
                <a
                  href="mailto:contato@vivavarejo.com.br"
                  className="text-xs font-bold text-[#0F766E] hover:underline"
                >
                  contato@vivavarejo.com.br
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/termos"
                  className="text-xs font-semibold text-[#4B5563] hover:text-[#0F766E] underline underline-offset-2"
                >
                  {p.goToTerms}
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
            <Link to="/termos" className="hover:text-[#0F766E] transition-colors">
              {t.landing.footerTermsOfUse}
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/bem-vindo" className="hover:text-[#0F766E] transition-colors">
              {p.backToHome}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
