export function parseHorarioLimiteToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null
  const clean = timeStr.trim().toLowerCase()
  // Matches e.g. 08:00, 08:00h, 8:00, 8h, 08h30
  const match = clean.match(/^(\d{1,2}):?(\d{2})?/)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  if (isNaN(hours) || hours < 0 || hours > 24) return null
  return hours * 60 + minutes
}

export function isPastDue(timeStr?: string): boolean {
  const targetMinutes = parseHorarioLimiteToMinutes(timeStr)
  if (targetMinutes === null) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return currentMinutes > targetMinutes
}
