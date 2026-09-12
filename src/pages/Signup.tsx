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
  Phone,
  Briefcase,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { VAREJO_SEGMENTOS } from '@/components/EnquadramentoClienteCard'
import {
  PasswordStrengthMeter,
  evaluatePasswordStrength,
  MSG_SENHA_REQUISITOS,
} from '@/components/PasswordStrengthMeter'
import { formatPhoneBR } from '@/lib/phone-utils'

/**
 * Utilitário de máscara de CNPJ brasileira (XX.XXX.XXX/XXXX-XX)
 */
function formatCNPJ(value: string | undefined | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

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

  // Se o usuário veio com perfil pré-selecionado (ex: pelo funil do /bem-vindo),
  // iniciamos no passo 2; caso contrário, iniciamos no passo 1 (apenas escolha de perfil).
  const initialSelectedPerfil: 'cpf' | 'cnpj' | null =
    paramTipo === 'PF' || paramProfileType === 'gerente'
      ? 'cpf'
      : paramTipo === 'PJ' || paramProfileType === 'rede'
        ? 'cnpj'
        : null

  const [step, setStep] = useState<1 | 2>(initialSelectedPerfil ? 2 : 1)
  const [selectedPerfil, setSelectedPerfil] = useState<'cpf' | 'cnpj' | null>(initialSelectedPerfil)

  // ==================== CAMPOS COMUNS E PF ====================
  // PF: Nome, Telefone, Cargo, Empresa (opcional), Email, Senha, Confirmar Senha
  const [name, setName] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cargo, setCargo] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // ==================== CAMPOS CNPJ (AMPLIADO) ====================
  // CNPJ: Nome do responsável, CNPJ, Razão / Nome da empresa, Telefone da empresa,
  // Segmento, Maiores problemas / gargalos, Informações do negócio, Controle de inventário, Email, Senha
  const [cnpj, setCnpj] = useState('')
  const [segmento, setSegmento] = useState<string>(paramSegmento || 'Moda e Vestuário')
  const [outroSegmento, setOutroSegmento] = useState<string>(
    paramSegmento && !(VAREJO_SEGMENTOS as readonly string[]).includes(paramSegmento)
      ? paramSegmento
      : '',
  )
  const [infoNegocio, setInfoNegocio] = useState('')
  const [gargalos, setGargalos] = useState('')
  const [inventarioSituacao, setInventarioSituacao] = useState<
    'rotativo' | 'anual' | 'sem_controle' | ''
  >('')

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    telefone?: string
    cargo?: string
    empresa?: string
    cnpj?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})

  // Manipulador para escolher perfil no Passo 1 e avançar para o Passo 2
  const handleSelectPerfil = (perfil: 'cpf' | 'cnpj') => {
    setSelectedPerfil(perfil)
    setFieldErrors({})
    setStep(2)
  }

  // Voltar ao Passo 1 (escolha de perfil)
  const handleBackToStep1 = () => {
    setFieldErrors({})
    setStep(1)
  }

  const validate = () => {
    const errors: typeof fieldErrors = {}

    if (!name.trim()) {
      errors.name = 'O nome completo é obrigatório'
    }

    if (!telefone.trim()) {
      errors.telefone = 'O telefone / WhatsApp é obrigatório'
    } else {
      const digits = telefone.replace(/\D/g, '')
      if (digits.length < 10) {
        errors.telefone = 'Informe um telefone com DDD válido'
      }
    }

    if (selectedPerfil === 'cpf') {
      if (!cargo.trim()) {
        errors.cargo = 'O cargo é obrigatório'
      }
    }

    if (selectedPerfil === 'cnpj') {
      if (!empresa.trim()) {
        errors.empresa = 'O nome da empresa / rede é obrigatório'
      }
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

    const isCPF = selectedPerfil === 'cpf'
    const profileType: ProfileType = isCPF ? 'gerente' : 'rede'
    const tipoPessoa: 'PF' | 'PJ' = isCPF ? 'PF' : 'PJ'

    const finalSegmento = isCPF
      ? 'Geral'
      : segmento === 'Outro'
        ? outroSegmento.trim() || 'Outro'
        : segmento

    try {
      const nomeEmpresaFinal =
        empresa.trim() || (isCPF ? `Operação ${name.trim()}` : `Rede / Loja de ${name.trim()}`)

      await signup(
        email,
        password,
        name,
        nomeEmpresaFinal,
        tipoPessoa,
        finalSegmento,
        isCPF ? '' : infoNegocio,
        isCPF ? '' : gargalos,
        isCPF ? '' : inventarioSituacao,
        profileType,
        {
          telefone: telefone.trim(),
          cargo: isCPF ? cargo.trim() : undefined,
          cnpj: isCPF ? undefined : cnpj.trim(),
        },
      )

      // Direcionamento pós-cadastro conforme o perfil escolhido:
      // CPF (gerente) -> /meu-dia (enxuto, chão de loja)
      // CNPJ (rede) -> /agenda (amplo, administrativo de rede)
      navigate(isCPF ? '/meu-dia' : '/agenda', { replace: true })
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
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-4">
          {step === 2 ? (
            <button
              type="button"
              onClick={handleBackToStep1}
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#0F766E] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para escolha de perfil</span>
            </button>
          ) : (
            <Link
              to="/bem-vindo"
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#1F2937] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à apresentação</span>
            </Link>
          )}

          <Link to="/login" className="text-xs font-bold text-[#0F766E] hover:underline">
            Já tenho conta
          </Link>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center justify-center gap-2 mb-4 text-[11px] font-semibold text-[#6B7280]">
          <span
            className={`px-2.5 py-0.5 rounded-full ${
              step === 1
                ? 'bg-[#0F766E] text-white'
                : 'bg-teal-50 text-[#0F766E] border border-teal-200'
            }`}
          >
            1. Escolha de Perfil
          </span>
          <span className="text-[#D1D5DB]">→</span>
          <span
            className={`px-2.5 py-0.5 rounded-full ${
              step === 2 ? 'bg-[#0F766E] text-white' : 'bg-gray-100 text-[#9CA3AF]'
            }`}
          >
            2. Dados de Cadastro
          </span>
        </div>

        {/* Cabeçalho do Card */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white mb-3 shadow-sm">
            <div className="w-5 h-5 border-2 border-white rotate-45 transform" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
            {step === 1
              ? 'Como você irá usar o VivaVarejo?'
              : selectedPerfil === 'cpf'
                ? 'Cadastro de Profissional (CPF)'
                : 'Cadastro de Rede / Empresa (CNPJ)'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-sm">
            {step === 1
              ? 'Escolha uma das opções abaixo para abrir o cadastro adequado à sua realidade'
              : selectedPerfil === 'cpf'
                ? 'Preencha seus dados para acessar o Modelo GERENTE (enxuto, Meu Dia e chão de loja)'
                : 'Preencha os dados da sua operação para acessar o Modelo ADM de Rede'}
          </p>
        </div>

        {/* Aviso de modelo demonstrativo configurável (exigido para ambos os perfis) */}
        <div className="mb-5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Este é apenas um modelo de demonstração inicial:</strong> Sendo REDE ou
            profissional, você configura demandas, rotinas e indicadores conforme suas opções e
            prioridades — ou nos envia que entregamos tudo pronto.
          </p>
        </div>

        {/* General Error Banner */}
        {fieldErrors.general && (
          <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 1: APENAS OS 2 CARDS DE ESCOLHA (CNPJ OU CPF)       */}
        {/* Não há formulário visível nesta primeira tela             */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {/* Opção 1: REDE / Empresa (CNPJ) */}
              <button
                type="button"
                onClick={() => handleSelectPerfil('cnpj')}
                className="group p-4 sm:p-5 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0F766E] bg-white hover:bg-teal-50/40 text-left transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white flex items-center justify-center transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                    CNPJ
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1F2937] group-hover:text-[#0F766E] transition-colors flex items-center justify-between">
                    <span>Sou REDE / empresa (CNPJ)</span>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                    Modelo ADM de Rede: multi-lojas, visão corporativa, Comercial completo,
                    diagnóstico de perdas e gestão de usuários.
                  </p>
                </div>
              </button>

              {/* Opção 2: Profissional / Gerente (CPF) */}
              <button
                type="button"
                onClick={() => handleSelectPerfil('cpf')}
                className="group p-4 sm:p-5 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0F766E] bg-white hover:bg-teal-50/40 text-left transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white flex items-center justify-center transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                    CPF
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1F2937] group-hover:text-[#0F766E] transition-colors flex items-center justify-between">
                    <span>Sou profissional (CPF)</span>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                    Modelo GERENTE: enxuto, foco na operação diária da loja, agenda Meu Dia e
                    validações de rotinas.
                  </p>
                </div>
              </button>
            </div>

            <p className="text-center text-[11px] text-[#6B7280] pt-2">
              Toque em uma das opções para abrir o formulário correspondente.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 2: FORMULÁRIOS CONFORME A OPÇÃO ESCOLHIDA          */}
        {/* Substitui os cards e não é renderizado abaixo deles       */}
        {/* ========================================================= */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Banner com perfil ativo e botão rápido de troca */}
            <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span className="text-[#1F2937] font-semibold text-[11px]">
                  {selectedPerfil === 'cpf'
                    ? 'Perfil: Profissional (CPF) • Modelo Gerente'
                    : 'Perfil: REDE / Empresa (CNPJ) • Modelo ADM de Rede'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleBackToStep1}
                className="text-[11px] font-bold text-[#0F766E] hover:underline cursor-pointer"
              >
                Alterar
              </button>
            </div>

            {/* ----------------------------------------------------- */}
            {/* FORMULÁRIO CPF (PROFISSIONAL) — ENXUTO                */}
            {/* Campos: Nome, Telefone, Cargo, Empresa (opcional),    */}
            {/* Email, Senha, Confirmar senha                         */}
            {/* ----------------------------------------------------- */}
            {selectedPerfil === 'cpf' && (
              <>
                {/* Nome completo */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                    Nome completo <span className="text-rose-500">*</span>
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

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                    Telefone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                      placeholder="(00) 90000-0000"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                        fieldErrors.telefone
                          ? 'border-rose-500 focus:ring-rose-500/30'
                          : 'border-[#E5E7EB] focus:border-[#0F766E]'
                      } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                      disabled={loading}
                    />
                  </div>
                  {fieldErrors.telefone && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.telefone}
                    </p>
                  )}
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                    Cargo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder="Ex: Gerente de Loja, Encarregado, Líder Operacional..."
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                        fieldErrors.cargo
                          ? 'border-rose-500 focus:ring-rose-500/30'
                          : 'border-[#E5E7EB] focus:border-[#0F766E]'
                      } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                      disabled={loading}
                    />
                  </div>
                  {fieldErrors.cargo && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.cargo}
                    </p>
                  )}
                </div>

                {/* Empresa (OPCIONAL) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                    Empresa <span className="text-[#6B7280] font-normal lowercase">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      placeholder="Ex: Supermercados Estrela (opcional)"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Se não preencher, identificaremos sua operação pelo seu nome.
                  </p>
                </div>
              </>
            )}

            {/* ----------------------------------------------------- */}
            {/* FORMULÁRIO CNPJ (REDE/EMPRESA) — AMPLIADO             */}
            {/* Campos: Nome do responsável, CNPJ, Nome da empresa,   */}
            {/* Telefone, Segmento, Diagnóstico/Maiores gargalos,     */}
            {/* Informações do negócio, Inventário, Email, Senha      */}
            {/* ----------------------------------------------------- */}
            {selectedPerfil === 'cnpj' && (
              <>
                {/* Nome do responsável */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                    Nome do responsável <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Maria Fernandes"
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

                {/* Razão Social / Nome da Empresa / Rede */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                    Nome da Empresa / Rede <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      placeholder="Ex: Supermercados Alvorada Ltda"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                        fieldErrors.empresa
                          ? 'border-rose-500 focus:ring-rose-500/30'
                          : 'border-[#E5E7EB] focus:border-[#0F766E]'
                      } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                      disabled={loading}
                    />
                  </div>
                  {fieldErrors.empresa && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.empresa}
                    </p>
                  )}
                </div>

                {/* CNPJ e Telefone lado a lado em telas maiores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                      CNPJ <span className="text-[#6B7280] font-normal lowercase">(opcional)</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cnpj}
                        onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                      Telefone / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                        placeholder="(00) 90000-0000"
                        className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                          fieldErrors.telefone
                            ? 'border-rose-500 focus:ring-rose-500/30'
                            : 'border-[#E5E7EB] focus:border-[#0F766E]'
                        } rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]`}
                        disabled={loading}
                      />
                    </div>
                    {fieldErrors.telefone && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.telefone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Segmento de Atuação */}
                <div className="space-y-2 p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E7EB]">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#374151] mb-1">
                      Segmento de Atuação
                    </label>
                    <select
                      value={
                        (VAREJO_SEGMENTOS as readonly string[]).includes(segmento)
                          ? segmento
                          : 'Outro'
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

                {/* Diagnóstico Operacional: Maiores gargalos/problemas, Informações e Inventário */}
                <div className="pt-2 border-t border-[#E5E7EB] space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Diagnóstico Inicial da Operação</span>
                  </div>

                  {/* Maiores gargalos ou problemas */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Quais são seus maiores problemas ou gargalos?</span>
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

                  {/* Informações do negócio */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
                      Informações do negócio{' '}
                      <span className="text-[#6B7280] font-normal lowercase">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={infoNegocio}
                      onChange={(e) => setInfoNegocio(e.target.value)}
                      placeholder="Ex: 3 lojas, 28 colaboradores, Londrina - PR"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] focus:border-[#0F766E] rounded-xl outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#1F2937] placeholder:text-[#9CA3AF]"
                      disabled={loading}
                    />
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      Informe número de lojas, quantidade de colaboradores ou cidade de atuação.
                    </p>
                  </div>

                  {/* Inventário */}
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
                  </div>
                </div>
              </>
            )}

            {/* ----------------------------------------------------- */}
            {/* CREDENCIAIS DE ACESSO (COMUNS A AMBOS OS PERFIS)      */}
            {/* E-mail, Senha e Confirmação de Senha                  */}
            {/* ----------------------------------------------------- */}
            <div className="pt-2 border-t border-[#E5E7EB] space-y-3.5">
              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                  E-mail <span className="text-rose-500">*</span>
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

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                  Senha <span className="text-rose-500">*</span>{' '}
                  <span className="text-[11px] text-[#6B7280] font-normal lowercase">
                    (mínimo 8 caracteres, maiúscula, minúscula e número)
                  </span>
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
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5">
                  Confirmar senha <span className="text-rose-500">*</span>
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
            </div>

            {/* Ações do Formulário */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleBackToStep1}
                disabled={loading}
                className="w-full sm:w-1/3 py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#374151] font-semibold text-sm rounded-xl transition-all cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-2/3 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading
                  ? 'Cadastrando...'
                  : selectedPerfil === 'cpf'
                    ? 'Finalizar Cadastro PF'
                    : 'Finalizar Cadastro CNPJ'}
              </button>
            </div>
          </form>
        )}

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
