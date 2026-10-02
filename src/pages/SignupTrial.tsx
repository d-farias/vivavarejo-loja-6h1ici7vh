import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Building2,
  Store,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSelector } from '@/components/LanguageSelector'
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter'
import {
  funnelService,
  VERSAO_TERMOS_ATUAL,
  VERSAO_PRIVACIDADE_ATUAL,
} from '@/services/funnelService'

const SEGMENTOS_TRIAL = [
  'Supermercado/Food',
  'Açougue / Carnes',
  'Padaria / Confeitaria',
  'Farmácia / Drogaria',
  'Moda / Vestuário',
  'Pet Shop / Veterinária',
  'Restaurante / Alimentação',
  'Outro Segmento',
]

export default function SignupTrialPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signupTrial } = useAuth()
  const { t, locale } = useI18n()
  const isEn = locale === 'en'

  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [segmento, setSegmento] = useState('Supermercado/Food')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Checkboxes de Aceite e Consentimento (obrigatórios os 2 primeiros, opcional o 3º)
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [privacidadeAceita, setPrivacidadeAceita] = useState(false)
  const [receberNovidades, setReceberNovidades] = useState(true)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    try {
      funnelService.registrarEvento({
        evento: 'iniciou_cadastro',
        detalhes: { rota: '/teste', tipo: 'trial_14_dias' },
      })
    } catch {
      /* ignore */
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!nome.trim()) {
      setErrorMsg(isEn ? 'Please enter your name.' : 'Por favor, informe seu nome.')
      return
    }
    if (!empresa.trim()) {
      setErrorMsg(
        isEn ? 'Please enter your company name.' : 'Por favor, informe o nome da sua empresa.',
      )
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(
        isEn ? 'Please enter a valid work email.' : 'Por favor, informe um e-mail válido.',
      )
      return
    }
    if (senha.length < 8) {
      setErrorMsg(
        isEn
          ? 'Password must be at least 8 characters long.'
          : 'A senha deve conter no mínimo 8 caracteres.',
      )
      return
    }
    if (senha !== confirmSenha) {
      setErrorMsg(isEn ? 'Passwords do not match.' : 'As senhas não coincidem.')
      return
    }
    if (!termosAceitos) {
      setErrorMsg(
        isEn
          ? 'You must accept the Terms of Use to proceed.'
          : 'É necessário aceitar os Termos de Uso.',
      )
      return
    }
    if (!privacidadeAceita) {
      setErrorMsg(
        isEn
          ? 'You must accept the Privacy Policy to proceed.'
          : 'É necessário aceitar a Política de Privacidade.',
      )
      return
    }

    setLoading(true)
    try {
      await signupTrial(
        email.trim(),
        senha,
        nome.trim(),
        empresa.trim(),
        segmento,
        telefone.trim() || undefined,
        {
          termosAceitos: true,
          privacidadeAceita: true,
          receberNovidades,
        },
      )
      navigate('/meu-dia', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('already exists') || msg.includes('unique') || msg.includes('email')) {
        setErrorMsg(
          isEn
            ? 'This email is already registered. Please log in or use another email.'
            : 'Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.',
        )
      } else {
        setErrorMsg(
          msg || (isEn ? 'Error creating trial account.' : 'Erro ao criar conta de teste.'),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2937] flex flex-col font-sans">
      {/* Header enxuto */}
      <header className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/bem-vindo" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
              <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937]">
              {t.common.appName}
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <LanguageSelector />
            <Link
              to="/login"
              className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] hover:text-[#0F766E] rounded-lg font-semibold transition-colors"
            >
              {t.common.login}
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Proposta de Valor e Selos do Teste */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-[#0F766E]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEn ? 'Evaluation Period' : 'Período de Avaliação'}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight leading-tight">
                {isEn ? 'Try VivaVarejo for 14 days.' : 'Experimente a VivaVarejo por 14 dias.'}
              </h1>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                {isEn
                  ? 'Organize priorities, direct actions, and track execution with your team.'
                  : 'Organize prioridades, direcione ações e acompanhe a execução com sua equipe.'}
              </p>
            </div>

            {/* 3 Selos obrigatórios verbatim */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>{isEn ? 'No credit card required.' : 'Sem cartão de crédito.'}</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <span>
                  {isEn ? 'Immediate access after signup.' : 'Acesso imediato após o cadastro.'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>
                  {isEn
                    ? 'Up to 5 users during the trial period.'
                    : 'Até 5 usuários durante o período de teste.'}
                </span>
              </div>
            </div>

            {/* Texto de aviso curto de avaliação (verbatim) */}
            <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-1.5 text-xs text-[#4B5563]">
              <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                <span>{isEn ? 'Evaluation Access —' : 'Acesso para avaliação —'}</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                {isEn
                  ? 'The trial period is intended exclusively for authorized evaluation and use of VivaVarejo. Reproduction of the platform, its materials, or protected components to build own or third-party solutions is not permitted.'
                  : 'O período de teste destina-se exclusivamente à avaliação e utilização autorizada da VivaVarejo. A reprodução da plataforma, de seus materiais ou de componentes protegidos para desenvolvimento de solução própria ou de terceiros não é permitida.'}
              </p>
            </div>
          </div>

          {/* Coluna Direita: Formulário de Cadastro do Teste */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                  {isEn ? 'Full Name *' : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={isEn ? 'e.g. John Doe' : 'Ex: Carlos Silva'}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                  {isEn ? 'Company / Store Name *' : 'Nome da Empresa / Loja *'}
                </label>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder={isEn ? 'e.g. Central Supermarkets' : 'Ex: Supermercado São José'}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                    {isEn ? 'Work Email *' : 'E-mail Profissional *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Segmento */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                    {isEn ? 'Retail Segment *' : 'Segmento de Atuação *'}
                  </label>
                  <select
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors"
                  >
                    {SEGMENTOS_TRIAL.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Telefone / WhatsApp (Opcional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151]">
                    {isEn ? 'Phone / WhatsApp' : 'Telefone / WhatsApp'}
                  </label>
                  <span className="text-[11px] text-[#9CA3AF]">
                    {isEn ? '(optional)' : '(opcional)'}
                  </span>
                </div>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Senha e Confirmação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                    {isEn ? 'Password *' : 'Senha de Acesso *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                    {isEn ? 'Confirm Password *' : 'Confirmar Senha *'}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmSenha}
                    onChange={(e) => setConfirmSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {senha && <PasswordStrengthMeter password={senha} />}

              {/* ACEITES COM CHECKBOXES */}
              <div className="pt-3 pb-2 border-t border-[#E5E7EB] space-y-3">
                {/* Termos de Uso (obrigatório) */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#374151]">
                  <input
                    type="checkbox"
                    checked={termosAceitos}
                    onChange={(e) => setTermosAceitos(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>
                    {isEn ? 'I have read and accept the ' : 'Li e aceito os '}
                    <Link
                      to="/termos"
                      target="_blank"
                      className="font-bold text-[#0F766E] underline underline-offset-2 hover:text-[#115E59]"
                    >
                      {isEn ? 'Terms of Use' : 'Termos de Uso'}
                    </Link>{' '}
                    ({VERSAO_TERMOS_ATUAL}).
                  </span>
                </label>

                {/* Política de Privacidade (obrigatório) */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#374151]">
                  <input
                    type="checkbox"
                    checked={privacidadeAceita}
                    onChange={(e) => setPrivacidadeAceita(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>
                    {isEn ? 'I have read the ' : 'Li a '}
                    <Link
                      to="/privacidade"
                      target="_blank"
                      className="font-bold text-[#0F766E] underline underline-offset-2 hover:text-[#115E59]"
                    >
                      {isEn ? 'Privacy Policy' : 'Política de Privacidade'}
                    </Link>{' '}
                    ({VERSAO_PRIVACIDADE_ATUAL}).
                  </span>
                </label>

                {/* Novidades e Informações Comerciais (opcional e separado) */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#4B5563]">
                  <input
                    type="checkbox"
                    checked={receberNovidades}
                    onChange={(e) => setReceberNovidades(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>
                    {isEn
                      ? 'I want to receive product updates and commercial information from VivaVarejo (optional).'
                      : 'Quero receber novidades e informações comerciais da VivaVarejo.'}
                  </span>
                </label>
              </div>

              {/* Botão de Finalizar */}
              <button
                type="submit"
                disabled={loading || !termosAceitos || !privacidadeAceita}
                className="w-full py-3 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm tracking-wide uppercase rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{isEn ? 'CREATING TRIAL ACCOUNT...' : 'CRIANDO SEU ACESSO...'}</span>
                ) : (
                  <>
                    <span>{isEn ? 'START 14-DAY FREE TRIAL' : 'COMEÇAR TESTE DE 14 DIAS'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* MENSAGEM DE SEGURANÇA ABAIXO (verbatim) */}
              <div className="pt-3 border-t border-gray-100 text-[11px] text-[#6B7280] leading-relaxed">
                <p>
                  <strong>
                    {isEn
                      ? 'Your data and information are handled responsibly.'
                      : 'Seus dados e informações são tratados com responsabilidade.'}
                  </strong>{' '}
                  {isEn
                    ? 'The data provided during registration will be used to create and manage your access to VivaVarejo, in accordance with our Privacy Policy. During the trial period, do not enter confidential information or personal data of third parties without proper authorization.'
                    : 'Os dados fornecidos no cadastro serão utilizados para criar e administrar seu acesso à VivaVarejo, conforme nossa Política de Privacidade. Durante o período de teste, não insira informações confidenciais ou dados pessoais de terceiros sem a devida autorização.'}
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
