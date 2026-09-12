import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { ProfileType } from '@/types'
import {
  AlertCircle,
  Building2,
  Lock,
  Mail,
  User,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
  Boxes,
  HelpCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { VAREJO_SEGMENTOS } from '@/components/EnquadramentoClienteCard'
import {
  PasswordStrengthMeter,
  evaluatePasswordStrength,
  MSG_SENHA_REQUISITOS,
} from '@/components/PasswordStrengthMeter'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  // State vindo da Landing Page (/bem-vindo) via query params ou history state
  const stateData =
    (location.state as {
      tipoPessoa?: 'PF' | 'PJ'
      segmento?: string
      profileType?: ProfileType
    }) || {}
  const paramTipo = (searchParams.get('tipo') as 'PF' | 'PJ') || stateData.tipoPessoa
  const paramProfileType = (searchParams.get('perfil') as ProfileType) || stateData.profileType
  const paramSegmento = searchParams.get('segmento') || stateData.segmento

  const initialTipoPessoa: 'PF' | 'PJ' = paramTipo === 'PF' ? 'PF' : 'PJ'
  const initialProfileType: ProfileType =
    paramProfileType || (paramTipo === 'PF' ? 'gerente' : 'rede')
  const initialSegmento = paramSegmento || 'Moda e Vestuário'
  const hasPreselectedEnquadramento = Boolean(paramTipo || paramSegmento || paramProfileType)

  const [name, setName] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [profileType, setProfileType] = useState<ProfileType>(initialProfileType)
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>(initialTipoPessoa)
  const [segmento, setSegmento] = useState<string>(initialSegmento)
  const [outroSegmento, setOutroSegmento] = useState<string>(
    paramSegmento && !(VAREJO_SEGMENTOS as readonly string[]).includes(paramSegmento)
      ? paramSegmento
      : '',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Novos campos solicitados: Informações do negócio, Maiores gargalos e Controle de inventário
  const [infoNegocio, setInfoNegocio] = useState('')
  const [gargalos, setGargalos] = useState('')
  const [inventarioSituacao, setInventarioSituacao] = useState<
    'rotativo' | 'anual' | 'sem_controle' | ''
  >('')

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    empresa?: string
    email?: string
    password?: string
    confirmPassword?: string
    infoNegocio?: string
    gargalos?: string
    inventarioSituacao?: string
    general?: string
  }>({})

  const validate = () => {
    const errors: typeof fieldErrors = {}
    if (!name.trim()) {
      errors.name = 'O nome completo é obrigatório'
    }
    if (!email.trim()) {
      errors.email = 'O e-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Informe um e-mail válido'
    }
    if (!password) {
      errors.password = 'A senha é obrigatória'
    } else {
      const strength = evaluatePasswordStrength(password)
      if (!strength.isValid) {
        errors.password = MSG_SENHA_REQUISITOS
      }
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setFieldErrors({})

    const finalSegmento = segmento === 'Outro' ? outroSegmento.trim() || 'Outro' : segmento

    try {
      // Se não preencheu explicitamente a empresa mas veio da landing com interesse definido,
      // usa o nome pessoal ou uma denominação padrão para que o cliente seja criado com o enquadramento
      const finalTipoPessoa = profileType === 'gerente' ? 'PF' : 'PJ'
      const nomeEmpresaFinal =
        empresa.trim() ||
        (profileType === 'gerente' ? `Operação ${name.trim()}` : `Rede / Loja de ${name.trim()}`)

      await signup(
        email,
        password,
        name,
        nomeEmpresaFinal,
        finalTipoPessoa,
        finalSegmento,
        infoNegocio,
        gargalos,
        inventarioSituacao,
        profileType,
      )
      // Direcionamento pós-cadastro conforme o perfil escolhido:
      // Gerente -> /meu-dia (enxuto, chão de loja)
      // Rede -> /agenda (amplo, administrativo)
      navigate(profileType === 'gerente' ? '/meu-dia' : '/agenda', { replace: true })
    } catch (err: unknown) {
      const errorObj = err as {
        data?: { data?: Record<string, { message: string }> }
        response?: { data?: Record<string, { message: string }> }
        message?: string
      }
      const errors: typeof fieldErrors = {}

      const fieldData = errorObj?.data?.data || errorObj?.response?.data
      if (fieldData) {
        if (fieldData.email) {
          const emailMsg = fieldData.email.message
          if (
            emailMsg.toLowerCase().includes('unique') ||
            emailMsg.toLowerCase().includes('already') ||
            emailMsg.toLowerCase().includes('exist')
          ) {
            errors.email = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.'
          } else {
            errors.email = emailMsg
          }
        }
        if (fieldData.password) {
          errors.password = fieldData.password.message
        }
        if (fieldData.passwordConfirm) {
          errors.confirmPassword = fieldData.passwordConfirm.message
        }
        if (fieldData.name) {
          errors.name = fieldData.name.message
        }
      }

      if (Object.keys(errors).length === 0) {
        const rawMsg = errorObj?.message || ''
        if (
          rawMsg.toLowerCase().includes('already') ||
          rawMsg.toLowerCase().includes('unique') ||
          rawMsg.toLowerCase().includes('email')
        ) {
          errors.general =
            'Este e-mail já está em uso. Acesse a tela de login ou tente outro e-mail.'
        } else {
          errors.general = rawMsg || 'Falha ao criar conta. Verifique os dados e tente novamente.'
        }
      }

      setFieldErrors(errors)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 bg-[#F7F7F5]">
      <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header com link de voltar */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/bem-vindo"
            className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#1F2937] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à apresentação</span>
          </Link>
          <Link to="/login" className="text-xs font-bold text-[#0F766E] hover:underline">
            Já tenho conta
          </Link>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white mb-3 shadow-sm">
            <div className="w-5 h-5 border-2 border-white rotate-45 transform" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">Criar Conta de Acesso</h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-sm">
            Configure seu perfil de liderança e diagnóstico operacional — queremos ser parceiros dos
            seus resultados
          </p>
        </div>

        {/* Resumo do Enquadramento selecionado na Landing Page */}
        {hasPreselectedEnquadramento && (
          <div className="mb-5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F766E] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                Perfil selecionado:
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                {profileType === 'rede' ? 'CNPJ • ADM de Rede' : 'CPF • Gerente'}
              </span>
            </div>
            <p className="text-[#374151] mt-1 text-[11px]">
              Modelo do App:{' '}
              <strong className="text-[#1F2937]">
                {profileType === 'rede'
                  ? 'ADM de Rede (amplo, multi-lojas e comercial)'
                  : 'Gerente de Loja (enxuto, rotinas diárias e chão de loja)'}
              </strong>{' '}
              • Segmento:{' '}
              <strong className="text-[#1F2937]">
                {segmento === 'Outro' && outroSegmento ? outroSegmento : segmento}
              </strong>
            </p>
          </div>
        )}

        {/* Aviso de modelo demonstrativo configurável */}
        <div className="mb-5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Aviso importante:</strong> Você verá um modelo de demonstração inicial. Sendo
            REDE ou profissional, você configura demandas, rotinas e indicadores conforme suas
            opções e prioridades — ou nos envia que entregamos tudo pronto.
          </p>
        </div>

        {/* General Error Banner */}
        {fieldErrors.general && (
          <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SELETOR DE PERFIL: CNPJ vs CPF (Requisito 1) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-2">
              Como você irá usar o VivaVarejo?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção 1: REDE / Empresa (CNPJ) */}
              <button
                type="button"
                onClick={() => {
                  setProfileType('rede')
                  setTipoPessoa('PJ')
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  profileType === 'rede'
                    ? 'border-[#0F766E] bg-teal-50 ring-2 ring-[#0F766E]/20'
                    : 'border-[#E5E7EB] bg-white hover:border-[#0F766E]/40'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      profileType === 'rede'
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-teal-50 text-[#0F766E]'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                    CNPJ
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1F2937]">Sou REDE / empresa (CNPJ)</div>
                <p className="text-[11px] text-[#4B5563] mt-1 leading-snug">
                  Modelo ADM de Rede: multi-lojas, visão corporativa, Comercial completo e gestão de
                  usuários.
                </p>
              </button>

              {/* Opção 2: Profissional / Gerente (CPF) */}
              <button
                type="button"
                onClick={() => {
                  setProfileType('gerente')
                  setTipoPessoa('PF')
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  profileType === 'gerente'
                    ? 'border-[#0F766E] bg-teal-50 ring-2 ring-[#0F766E]/20'
                    : 'border-[#E5E7EB] bg-white hover:border-[#0F766E]/40'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      profileType === 'gerente'
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-teal-50 text-[#0F766E]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                    CPF
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1F2937]">Sou profissional (CPF)</div>
                <p className="text-[11px] text-[#4B5563] mt-1 leading-snug">
                  Modelo GERENTE: enxuto, foco na operação diária da loja, agenda/Meu Dia e
                  validações.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Nome completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Santos"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                  fieldErrors.name
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-[#E5E7EB] focus:border-[#0F766E]'
                } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                disabled={loading}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Empresa / Rede{' '}
              <span className="text-[#6B7280] font-normal lowercase">(opcional)</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ex: Supermercados Estrela ou Rede Alvorada"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]"
                disabled={loading}
              />
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Cadastraremos sua rede para você gerenciar lojas e modelos de rotinas.
            </p>
          </div>

          {/* Segmento do varejo */}
          <div className="space-y-2 p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E7EB]">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#374151] mb-1">
                Segmento de Atuação
              </label>
              <select
                value={
                  (VAREJO_SEGMENTOS as readonly string[]).includes(segmento) ? segmento : 'Outro'
                }
                onChange={(e) => {
                  const val = e.target.value
                  setSegmento(val)
                  if (val !== 'Outro') setOutroSegmento('')
                }}
                className="w-full px-2.5 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg outline-none text-[#1F2937]"
              >
                {VAREJO_SEGMENTOS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </div>

            {segmento === 'Outro' && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#374151] mb-1">
                  Especifique o segmento
                </label>
                <input
                  type="text"
                  value={outroSegmento}
                  onChange={(e) => setOutroSegmento(e.target.value)}
                  placeholder="Ex: Ótica, Joalheria, etc."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-lg outline-none text-[#1F2937]"
                />
              </div>
            )}
          </div>

          {/* Seção de Diagnóstico Operacional: Informações do negócio, gargalos e inventário */}
          <div className="pt-2 border-t border-[#E5E7EB] space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Diagnóstico Inicial da Operação</span>
            </div>

            {/* (a) Informações do negócio */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                Informações do negócio{' '}
                <span className="text-[#6B7280] font-normal lowercase">(opcional)</span>
              </label>
              <input
                type="text"
                value={infoNegocio}
                onChange={(e) => setInfoNegocio(e.target.value)}
                placeholder="Ex: 2 lojas, 14 colaboradores, Curitiba - PR"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]"
                disabled={loading}
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Informe número de unidades, quantidade de colaboradores ou cidade de atuação.
              </p>
            </div>

            {/* (b) Maiores gargalos ou problemas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Quais são seus maiores gargalos ou problemas?</span>
                <span className="text-[#6B7280] font-normal lowercase">(opcional)</span>
              </label>
              <textarea
                value={gargalos}
                onChange={(e) => setGargalos(e.target.value)}
                rows={2}
                placeholder="Ex: perdas recorrentes, equipe desorganizada, falta de padrão na abertura/fechamento, falta de tempo do gerente..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF] resize-none"
                disabled={loading}
              />
            </div>

            {/* (c) Pergunta sobre inventário e perdas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-[#0F766E]" />
                <span>Como está o controle de inventário da sua empresa?</span>
              </label>
              <select
                value={inventarioSituacao}
                onChange={(e) =>
                  setInventarioSituacao(
                    e.target.value as 'rotativo' | 'anual' | 'sem_controle' | '',
                  )
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937]"
                disabled={loading}
              >
                <option value="">Selecione uma opção (opcional)</option>
                <option value="rotativo">Fazemos inventário rotativo frequente</option>
                <option value="anual">Só inventário anual / esporádico</option>
                <option value="sem_controle">Não temos controle formal de inventário</option>
              </select>
              <p className="text-[11px] text-[#6B7280] mt-1">
                O inventário e os processos mapeados são fundamentais para reduzir perdas e proteger
                sua margem.
              </p>
            </div>
          </div>

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
              Senha (mínimo 8 caracteres, maiúscula, minúscula e número)
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
            <PasswordStrengthMeter password={password} />
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                  fieldErrors.confirmPassword
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-[#E5E7EB] focus:border-[#0F766E]'
                } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                disabled={loading}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? 'Cadastrando...' : 'Cadastre-se'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-xs text-[#4B5563]">
          Já tem conta?{' '}
          <Link to="/login" className="text-[#0F766E] font-bold hover:underline">
            Acesse sua conta
          </Link>
        </div>
      </div>
    </div>
  )
}
