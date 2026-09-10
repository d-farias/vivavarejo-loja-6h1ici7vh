import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import { isPerfilCampo } from '@/lib/perfil-utils'
import { triggerQuickAccessHub } from '@/components/QuickAccessHubModal'
import { AlertCircle, Lock, Mail, CheckCircle2, KeyRound, ArrowLeft, Info } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Destino pós-login padrão: respeita rota de interceptação (se específica); caso contrário direciona por perfil
  const stateData =
    (location.state as { from?: { pathname: string }; expiredMessage?: string }) || {}
  const stateFrom = stateData.from?.pathname
  const expiredMessage = stateData.expiredMessage
  const hasSpecificFrom = stateFrom && stateFrom !== '/' && stateFrom !== '/login'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  // Estado da funcionalidade "Esqueci minha senha"
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotFeedback, setForgotFeedback] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
    details?: string
  } | null>(null)

  const validate = () => {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errors.email = 'O e-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Informe um e-mail válido'
    }
    if (!password) {
      errors.password = 'A senha é obrigatória'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setFieldErrors({})

    try {
      await login(email, password)
      // Dispara exibição do hub de acesso rápido logo após o login
      triggerQuickAccessHub()

      // Direcionamento inteligente conforme item 4 da especificação:
      // Gestores -> /agenda; Campo (promotores, repositores, funcionários operacionais) -> /meu-dia.
      // Se o usuário tentava acessar uma página específica diretamente, honra essa rota.
      if (hasSpecificFrom) {
        navigate(stateFrom!, { replace: true })
      } else {
        const loggedUser = pb.authStore.record as any
        const eCampo = isPerfilCampo(loggedUser)
        navigate(eCampo ? '/meu-dia' : '/agenda', { replace: true })
      }
    } catch (err: unknown) {
      const errorObj = err as {
        data?: { data?: Record<string, { message: string }> }
        message?: string
      }
      const errors: { email?: string; password?: string; general?: string } = {}

      if (errorObj?.data?.data) {
        if (errorObj.data.data.email) {
          errors.email = errorObj.data.data.email.message
        }
        if (errorObj.data.data.password) {
          errors.password = errorObj.data.data.password.message
        }
      }

      if (!errors.email && !errors.password) {
        errors.general = 'E-mail ou senha incorretos. Verifique suas credenciais.'
      }

      setFieldErrors(errors)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 bg-[#F7F7F5]">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Link Voltar à Landing Page */}
        <div className="mb-4">
          <Link
            to="/bem-vindo"
            className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#1F2937] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à apresentação</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white mb-3 shadow-sm">
            <div className="w-5 h-5 border-2 border-white rotate-45 transform" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">VivaVarejo</h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Acompanhamento operacional e gestão de rotinas
          </p>
        </div>

        {/* Banner de Expiração de Sessão por Inatividade */}
        {expiredMessage && !fieldErrors.general && (
          <div className="mb-5 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span className="font-medium">{expiredMessage}</span>
          </div>
        )}

        {/* General Error Banner */}
        {fieldErrors.general && (
          <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                  fieldErrors.email
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-[#E5E7EB] focus:border-[#0F766E]'
                } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                  fieldErrors.password
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-[#E5E7EB] focus:border-[#0F766E]'
                } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                disabled={loading}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? 'Acessando...' : 'Acesse sua conta'}
          </button>
        </form>

        {/* Forgot password link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setForgotEmail(email.trim())
              setForgotFeedback(null)
              setShowForgotModal(true)
            }}
            className="text-xs font-semibold text-[#0F766E] hover:underline transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>

        {/* Signup Link */}
        <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-center text-xs text-[#4B5563]">
          Não tem conta?{' '}
          <Link to="/signup" className="text-[#0F766E] font-bold hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>

      {/* Modal / Diálogo: Esqueci Minha Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => {
              if (!forgotLoading) setShowForgotModal(false)
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-6 z-10 space-y-4 text-[#1F2937]">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E7EB]">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Recuperar Senha</h3>
                <p className="text-xs text-[#4B5563]">
                  Instruções para redefinir o acesso à sua conta
                </p>
              </div>
            </div>

            {forgotFeedback && (
              <div
                className={`p-3.5 rounded-md border text-xs ${
                  forgotFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : forgotFeedback.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-200 text-[#B91C1C]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {forgotFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : forgotFeedback.type === 'warning' ? (
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{forgotFeedback.text}</p>
                    {forgotFeedback.details && (
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {forgotFeedback.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const trimmed = forgotEmail.trim()
                if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
                  setForgotFeedback({
                    type: 'error',
                    text: 'Informe um endereço de e-mail válido.',
                  })
                  return
                }

                setForgotLoading(true)
                setForgotFeedback(null)

                try {
                  await pb.collection('users').requestPasswordReset(trimmed)
                  setForgotFeedback({
                    type: 'success',
                    text: 'Enviamos um link de redefinição para seu e-mail.',
                    details:
                      'Verifique a caixa de entrada e a pasta de spam. Siga as instruções contidas na mensagem.',
                  })
                } catch (err: unknown) {
                  const errorObj = err as {
                    status?: number
                    message?: string
                    data?: { message?: string }
                  }
                  console.warn('Erro ao solicitar redefinição:', err)

                  // Se o backend falhar por falta de SMTP configurado ou similar
                  const msg = errorObj.data?.message || errorObj.message || ''
                  if (
                    errorObj.status === 500 ||
                    msg.toLowerCase().includes('mail') ||
                    msg.toLowerCase().includes('smtp') ||
                    msg.toLowerCase().includes('send')
                  ) {
                    setForgotFeedback({
                      type: 'warning',
                      text: 'O serviço de envio de e-mails automáticos não está configurado no servidor.',
                      details:
                        'Por favor, solicite a um Administrador do sistema a redefinição da sua senha diretamente no painel: Admin → Usuários & Perfis (gerando uma nova senha temporária ou ativando seu acesso).',
                    })
                  } else {
                    // Outro erro ou usuário não encontrado
                    setForgotFeedback({
                      type: 'warning',
                      text: 'Não foi possível enviar o e-mail de redefinição.',
                      details:
                        'Certifique-se de que o e-mail está cadastrado ou solicite ao administrador a redefinição direta em Admin → Usuários & Perfis.',
                    })
                  }
                } finally {
                  setForgotLoading(false)
                }
              }}
              className="space-y-3.5 text-xs sm:text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotLoading}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
                <p className="font-semibold text-[#1F2937]">Dica para Líderes e Colaboradores:</p>
                <p>
                  Caso não receba a mensagem em alguns minutos, qualquer usuário com perfil{' '}
                  <strong className="text-[#0F766E]">Admin</strong> pode gerar uma nova senha
                  temporária instantaneamente na aba <em>Usuários & Perfis</em>.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4B5563] hover:text-[#1F2937]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao login</span>
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
