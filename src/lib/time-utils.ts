/**
 * Utilitários para tratamento e normalização de horários limites de rotinas.
 * Trata múltiplos formatos:
 * - "10:00h", "10:00hs", "11Hs", "12:00", "08h", "08h30", "15:00 h", "17h00"
 * - "Sat Dec 30 1899 09:00:00 GMT+0000 (Coordinated Universal Time)" (valores de data/hora do Excel/SheetJS)
 * - Números decimais de fração do dia do Excel (ex: 0.375 = 09:00)
 * - "Integral", "Diária", "", null, undefined => sem horário limite específico (retorna null)
 */

export interface ParsedHorario {
  normalized: string // ex: "10:00", "11:00", "Integral" ou "Sem horário"
  minutes: number | null // minutos desde 00:00 (0 a 1439) ou null se integral/vazio
  isIntegral: boolean // true se for integral ou sem limite
}

export function parseHorarioLimite(timeVal?: string | number | null): ParsedHorario {
  if (timeVal === undefined || timeVal === null) {
    return { normalized: '', minutes: null, isIntegral: false }
  }

  // Se veio número (fração de dia do Excel, ex: 0.5 = 12:00)
  if (typeof timeVal === 'number') {
    if (isNaN(timeVal)) {
      return { normalized: '', minutes: null, isIntegral: false }
    }
    // Caso seja número inteiro de horas (ex: 10 ou 15)
    if (timeVal >= 1 && timeVal <= 24 && Number.isInteger(timeVal)) {
      const h = timeVal === 24 ? 0 : timeVal
      const hh = String(h).padStart(2, '0')
      return {
        normalized: `${hh}:00`,
        minutes: h * 60,
        isIntegral: false,
      }
    }
    // Caso seja fração do dia (ex: 0.375)
    const totalMinutes = Math.round((timeVal % 1) * 24 * 60)
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    return {
      normalized: `${hh}:${mm}`,
      minutes: hours * 60 + minutes,
      isIntegral: false,
    }
  }

  const str = String(timeVal).trim()
  if (!str) {
    return { normalized: '', minutes: null, isIntegral: false }
  }

  const lower = str.toLowerCase()

  // Casos de integral ou sem limite estrito
  if (
    lower.includes('integral') ||
    lower === 'dia todo' ||
    lower === 'livre' ||
    lower === 'sem limite'
  ) {
    return { normalized: 'Integral', minutes: null, isIntegral: true }
  }

  // Verifica se é string de Data do Excel/JavaScript:
  // Ex: "Sat Dec 30 1899 09:00:00 GMT..." ou ISO "1899-12-30T09:00:00..."
  if (
    lower.includes('1899') ||
    lower.includes('gmt') ||
    lower.includes('utc') ||
    /^[a-z]{3} [a-z]{3} \d{1,2}/.test(lower)
  ) {
    const parsedDate = new Date(str)
    if (!isNaN(parsedDate.getTime())) {
      // Usar getHours() ou getUTCHours() dependendo do formato GMT
      const hours =
        lower.includes('gmt+0000') || lower.includes('utc')
          ? parsedDate.getUTCHours()
          : parsedDate.getHours()
      const minutes =
        lower.includes('gmt+0000') || lower.includes('utc')
          ? parsedDate.getUTCMinutes()
          : parsedDate.getMinutes()
      const hh = String(hours).padStart(2, '0')
      const mm = String(minutes).padStart(2, '0')
      return {
        normalized: `${hh}:${mm}`,
        minutes: hours * 60 + minutes,
        isIntegral: false,
      }
    }
  }

  // Regex para capturar padrões comuns:
  // "10:00h", "10:00hs", "12:00", "08:30"
  // "11Hs", "11h", "11h30", "11 h", "8h", "8:00"
  const colonMatch = lower.match(/^(\d{1,2}):(\d{2})/i)
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10)
    const minutes = parseInt(colonMatch[2], 10)
    if (
      !isNaN(hours) &&
      hours >= 0 &&
      hours < 24 &&
      !isNaN(minutes) &&
      minutes >= 0 &&
      minutes < 60
    ) {
      const hh = String(hours).padStart(2, '0')
      const mm = String(minutes).padStart(2, '0')
      return {
        normalized: `${hh}:${mm}`,
        minutes: hours * 60 + minutes,
        isIntegral: false,
      }
    }
  }

  const hMatch = lower.match(/^(\d{1,2})\s*h(?:s)?(?:\s*(\d{2}))?/i)
  if (hMatch) {
    const hours = parseInt(hMatch[1], 10)
    const minutes = hMatch[2] ? parseInt(hMatch[2], 10) : 0
    if (
      !isNaN(hours) &&
      hours >= 0 &&
      hours < 24 &&
      !isNaN(minutes) &&
      minutes >= 0 &&
      minutes < 60
    ) {
      const hh = String(hours).padStart(2, '0')
      const mm = String(minutes).padStart(2, '0')
      return {
        normalized: `${hh}:${mm}`,
        minutes: hours * 60 + minutes,
        isIntegral: false,
      }
    }
  }

  // Regex fallback: tenta qualquer padrão número:número ou número seguido de h no texto
  const genericMatch = lower.match(/(\d{1,2})(?::(\d{2})|\s*h(?:s)?)/i)
  if (genericMatch) {
    const hours = parseInt(genericMatch[1], 10)
    const minutes = genericMatch[2] ? parseInt(genericMatch[2], 10) : 0
    if (
      !isNaN(hours) &&
      hours >= 0 &&
      hours < 24 &&
      !isNaN(minutes) &&
      minutes >= 0 &&
      minutes < 60
    ) {
      const hh = String(hours).padStart(2, '0')
      const mm = String(minutes).padStart(2, '0')
      return {
        normalized: `${hh}:${mm}`,
        minutes: hours * 60 + minutes,
        isIntegral: false,
      }
    }
  }

  // Se for apenas o número da hora (ex: "10" ou "15")
  const justHour = lower.match(/^(\d{1,2})$/)
  if (justHour) {
    const hours = parseInt(justHour[1], 10)
    if (!isNaN(hours) && hours >= 0 && hours < 24) {
      const hh = String(hours).padStart(2, '0')
      return {
        normalized: `${hh}:00`,
        minutes: hours * 60,
        isIntegral: false,
      }
    }
  }

  // Caso não reconhecido, mantém a string limpa original para não perder informação
  return {
    normalized: str,
    minutes: null,
    isIntegral: false,
  }
}

/**
 * Retorna os minutos desde 00:00 (ou null)
 */
export function parseHorarioLimiteToMinutes(timeVal?: string | number | null): number | null {
  return parseHorarioLimite(timeVal).minutes
}

/**
 * Retorna o horário limite normalizado (ex: "10:00", "Integral", ou string original)
 */
export function formatHorarioLimite(timeVal?: string | number | null): string {
  const parsed = parseHorarioLimite(timeVal)
  return parsed.normalized || (timeVal ? String(timeVal) : '')
}

/**
 * Verifica se a rotina está em atraso com base no horário limite e no relógio atual.
 * Se for "Integral", vazia ou sem limite identificado, nunca é considerada em atraso por horário.
 */
export function isPastDue(timeVal?: string | number | null): boolean {
  const parsed = parseHorarioLimite(timeVal)
  if (parsed.isIntegral || parsed.minutes === null) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return currentMinutes > parsed.minutes
}

/**
 * Retorna o status de atraso detalhado para uso nos componentes de interface
 */
export function getHorarioStatus(
  timeVal?: string | number | null,
  isConcluida = false,
): {
  isAtrasada: boolean
  isIntegral: boolean
  hasHorario: boolean
  displayLabel: string
  normalizedHorario: string
  minutes: number | null
} {
  const parsed = parseHorarioLimite(timeVal)

  if (parsed.isIntegral) {
    return {
      isAtrasada: false,
      isIntegral: true,
      hasHorario: false,
      displayLabel: 'Integral',
      normalizedHorario: 'Integral',
      minutes: null,
    }
  }

  if (parsed.minutes === null) {
    return {
      isAtrasada: false,
      isIntegral: false,
      hasHorario: Boolean(parsed.normalized),
      displayLabel: parsed.normalized || 'Sem horário',
      normalizedHorario: parsed.normalized,
      minutes: null,
    }
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isAtrasada = !isConcluida && currentMinutes > parsed.minutes

  return {
    isAtrasada,
    isIntegral: false,
    hasHorario: true,
    displayLabel: `Até ${parsed.normalized}`,
    normalizedHorario: parsed.normalized,
    minutes: parsed.minutes,
  }
}
