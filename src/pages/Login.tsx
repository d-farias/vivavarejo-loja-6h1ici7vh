import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AlertCircle, Lock, Mail } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

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
      navigate(from, { replace: true })
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
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded bg-[#0F766E] flex items-center justify-center text-white mb-3 shadow-xs">
            <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">Acesse sua conta</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Gestão operacional e acompanhamento de rotinas da loja
          </p>
        </div>

        {/* General Error Banner */}
        {fieldErrors.general && (
          <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        {/* Demo credentials hint */}
        <div className="mb-5 p-3 rounded bg-[#F7F7F5] border border-[#E5E7EB] text-xs text-[#4B5563]">
          <span className="font-semibold block mb-0.5 text-[#1F2937]">Acesso inicial:</span>
          <span>
            E-mail: <code>dfarias53@gmail.com</code> | Senha: <code>Skip@Pass</code>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              E-mail corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@varejo.com.br"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                  fieldErrors.email
                    ? 'border-[#B91C1C] focus:ring-red-200'
                    : 'border-[#E5E7EB] focus:border-[#0F766E]'
                } rounded-md outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-gray-400`}
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-[#B91C1C] mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                  fieldErrors.password
                    ? 'border-[#B91C1C] focus:ring-red-200'
                    : 'border-[#E5E7EB] focus:border-[#0F766E]'
                } rounded-md outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-gray-400`}
                disabled={loading}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-[#B91C1C] mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-md shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center text-xs text-[#6B7280]">
          Não tem conta?{' '}
          <Link to="/signup" className="text-[#0F766E] font-semibold hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  )
}
