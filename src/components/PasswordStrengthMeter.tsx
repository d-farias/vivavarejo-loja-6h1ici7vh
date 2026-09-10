import React from 'react'
import { Check, X } from 'lucide-react'

export interface PasswordStrengthResult {
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial?: boolean
  isValid: boolean
  score: number // 0 a 4
  label: 'Fraca' | 'Média' | 'Boa' | 'Forte'
  color: string
}

export const MSG_SENHA_REQUISITOS =
  'A senha deve ter pelo menos 8 caracteres e conter letra maiúscula, minúscula e número.'

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  let score = 0
  if (hasMinLength) score++
  if (hasUppercase && hasLowercase) score++
  if (hasNumber) score++
  if (password.length >= 10 || hasSpecial) score++

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber

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
    hasUppercase,
    hasLowercase,
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

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = React.memo(
  function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const strength = React.useMemo(() => evaluatePasswordStrength(password), [password])

    if (!password) {
      return <div className="text-[11px] text-neutral-500 mt-1">{MSG_SENHA_REQUISITOS}</div>
    }

    const { hasMinLength, hasUppercase, hasLowercase, hasNumber, score, label, color, isValid } =
      strength

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
              hasUppercase ? 'text-emerald-600 font-medium' : 'text-neutral-500'
            }`}
          >
            {hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-500" />}
            Maiúscula (A-Z)
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              hasLowercase ? 'text-emerald-600 font-medium' : 'text-neutral-500'
            }`}
          >
            {hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-500" />}
            Minúscula (a-z)
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              hasNumber ? 'text-emerald-600 font-medium' : 'text-neutral-500'
            }`}
          >
            {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-500" />}
            Número (0-9)
          </span>
        </div>

        {!isValid && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {MSG_SENHA_REQUISITOS}
          </p>
        )}
      </div>
    )
  },
)
