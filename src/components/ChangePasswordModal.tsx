import React, { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { auditoriaService } from '@/services/auditoria'
import {
  PasswordStrengthMeter,
  evaluatePasswordStrength,
  MSG_SENHA_REQUISITOS,
} from '@/components/PasswordStrengthMeter'

interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  userId: string
}

export function ChangePasswordModal({
  open,
  onOpenChange,
  userEmail,
  userId,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleClose = () => {
    if (loading) return
    setOldPassword('')
    setPassword('')
    setPasswordConfirm('')
    setErrorMsg(null)
    setSuccessMsg(null)
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const strength = evaluatePasswordStrength(password)
    if (!strength.isValid) {
      setErrorMsg(MSG_SENHA_REQUISITOS)
      return
    }

    if (password !== passwordConfirm) {
      setErrorMsg('A confirmação da nova senha não confere.')
      return
    }

    if (password === oldPassword) {
      setErrorMsg('A nova senha não pode ser idêntica à senha atual.')
      return
    }

    setLoading(true)

    try {
      // 1. Reautenticar para validar a senha atual
      await pb.collection('users').authWithPassword(userEmail, oldPassword)

      // 2. Atualizar a senha
      await pb.collection('users').update(userId, {
        oldPassword: oldPassword,
        password: password,
        passwordConfirm: passwordConfirm,
      })

      // 3. Atualizar a sessão local com as novas credenciais
      await pb.collection('users').authWithPassword(userEmail, password)

      // Registrar auditoria
      auditoriaService.registrar({
        acao: 'troca_senha',
        modulo: 'usuarios',
        registro_id: userId,
        detalhes: `Troca de senha efetuada com sucesso pelo próprio usuário (${userEmail})`,
      })

      setSuccessMsg('Senha alterada com sucesso!')
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number
        message?: string
        data?: { message?: string; data?: Record<string, { message: string }> }
      }

      if (errorObj.status === 400 && errorObj.data?.data?.oldPassword) {
        setErrorMsg('Senha atual incorreta.')
      } else if (errorObj.data?.message) {
        setErrorMsg(errorObj.data.message)
      } else if (errorObj.message?.toLowerCase().includes('failed to authenticate')) {
        setErrorMsg('Senha atual incorreta.')
      } else {
        setErrorMsg('Não foi possível alterar a senha. Verifique os dados informados.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <KeyRound className="w-5 h-5" />
            <DialogTitle className="text-base sm:text-lg font-bold text-[#1F2937]">
              Alterar Minha Senha
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#6B7280]">
            Para sua segurança, digite sua senha atual antes de cadastrar uma nova.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm pt-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
              Senha atual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Digite sua senha atual"
                className="w-full pr-10 pl-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937]"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
              Nova senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                placeholder="Mínimo 8 caracteres (letras e números)"
                className="w-full pr-10 pl-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1">
              Confirmar nova senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              placeholder="Repita a nova senha"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-[#4B5563] hover:text-[#1F2937] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Atualizar Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
