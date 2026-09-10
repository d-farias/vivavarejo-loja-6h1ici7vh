import React from 'react'
import { Check, X } from 'lucide-react'

export interface PasswordStrengthResult {
  hasMinLength: boolean
  hasLetter: boolean
  hasNumber: boolean
  hasSpecial?: boolean
  isValid: boolean
  score: number // 0 a 4
  label: 'Fraca' | 'Média' | 'Boa' | 'Forte'
  color: string
}

export const MSG_SENHA_REQUISITOS =
  'A senha deve ter pelo menos 8 caracteres e conter pelo menos uma letra e um número.'

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  let score = 0
  if (password.length >= 8) score++
  if (hasLetter && hasNumber) score++
  if (password.length >= 10) score++
  if (hasSpecial) score++

  const isValid = hasMinLength && hasLetter && hasNumber

  let label: 'Fraca' | 'Média' | 'Boa' | 'Forte' = 'Fraca'
  let color = 'bg-rose-500'

  if (!isValid || score <= 1) {
    label = 'Fraca'
    color = 'bg-rose-500'
  } else if (score === 2) {
    label = 'Média'
    color = 'bg-amber-500'
  } else if (score === 3) {
    label = 'Boa'
    color = 'bg-blue-600'
  } else {
    label = 'Forte'
    color = 'bg-emerald-600'
  }

  return {
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecial,
    isValid,
    score,
    label,
    color,
  }
}

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) {
    return <div className="text-[11px] text-neutral-500 mt-1">{MSG_SENHA_REQUISITOS}</div>
  }

  const { hasMinLength, hasLetter, hasNumber, score, label, color, isValid } =
    evaluatePasswordStrength(password)

  const bars = [1, 2, 3, 4]

  return (
    <div className="space-y-1.5 mt-1.5 text-xs">
      {/* Barras de progresso visual */}
      <div className="flex items-center gap-1.5">
        {bars.map((b) => (
          <div
            key={b}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              b <= score ? color : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          />
        ))}
        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 ml-1">
          {label}
        </span>
      </div>

      {/* Checklist de requisitos */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
        <span
          className={`inline-flex items-center gap-1 ${
            hasMinLength ? 'text-emerald-600 font-medium' : 'text-neutral-500'
          }`}
        >
          {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-500" />}
          8+ caracteres
        </span>
        <span
          className={`inline-flex items-center gap-1 ${
            hasLetter ? 'text-emerald-600 font-medium' : 'text-neutral-500'
          }`}
        >
          {hasLetter ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-500" />}
          Pelo menos 1 letra
        </span>
        <span
          className={`inline-flex items-center gap-1 ${
            hasNumber ? 'text-emerald-600 font-medium' : 'text-neutral-500'
          }`}
        >
          {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-500" />}
          Pelo menos 1 número
        </span>
      </div>

      {!isValid && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          {MSG_SENHA_REQUISITOS}
        </p>
      )}
    </div>
  )
}
