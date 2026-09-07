import * as XLSX from 'xlsx'
import type { ParsedValidadeRow } from '@/services/tarefasValidade'
import { parseHorarioLimite } from './time-utils'

/**
 * Normaliza datas ou recorrências (aceita datas pontuais como "15/05/2025", "2025-05-15"
 * e recorrências como "toda terça", "terça-feira", "diária", "segunda", etc.)
 */
export function normalizeDataOuRecorrencia(raw: any): {
  data_especifica?: string
  recorrencia?: string
} {
  if (raw === null || raw === undefined) {
    return { recorrencia: 'diaria' }
  }

  // Se já for objeto Date
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const yyyy = raw.getFullYear()
    const mm = String(raw.getMonth() + 1).padStart(2, '0')
    const dd = String(raw.getDate()).padStart(2, '0')
    return { data_especifica: `${yyyy}-${mm}-${dd}` }
  }

  // Se for número serial de data do Excel
  if (typeof raw === 'number' && raw > 25569 && raw < 60000) {
    const utcDays = Math.floor(raw - 25569)
    const dateObj = new Date(utcDays * 86400 * 1000)
    const yyyy = dateObj.getUTCFullYear()
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getUTCDate()).padStart(2, '0')
    return { data_especifica: `${yyyy}-${mm}-${dd}` }
  }

  const str = String(raw).trim()
  if (!str) {
    return { recorrencia: 'diaria' }
  }

  const lower = str.toLowerCase()

  // Checar formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const yyyy = isoMatch[1]
    const mm = isoMatch[2].padStart(2, '0')
    const dd = isoMatch[3].padStart(2, '0')
    return { data_especifica: `${yyyy}-${mm}-${dd}` }
  }

  // Checar formato DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (brMatch) {
    const dd = brMatch[1].padStart(2, '0')
    const mm = brMatch[2].padStart(2, '0')
    const yyyy = brMatch[3]
    return { data_especifica: `${yyyy}-${mm}-${dd}` }
  }

  // Recorrências por dia da semana
  if (lower.includes('segunda')) return { recorrencia: 'toda segunda' }
  if (lower.includes('terça') || lower.includes('terca')) return { recorrencia: 'toda terça' }
  if (lower.includes('quarta')) return { recorrencia: 'toda quarta' }
  if (lower.includes('quinta')) return { recorrencia: 'toda quinta' }
  if (lower.includes('sexta')) return { recorrencia: 'toda sexta' }
  if (lower.includes('sábado') || lower.includes('sabado')) return { recorrencia: 'todo sábado' }
  if (lower.includes('domingo')) return { recorrencia: 'todo domingo' }
  if (lower.includes('diári') || lower.includes('diari') || lower === 'todos os dias') {
    return { recorrencia: 'diaria' }
  }

  return { recorrencia: str }
}

/**
 * Normaliza horário no formato HH:MM
 */
export function normalizeHorarioStr(raw: any, fallback = '08:00'): string {
  if (raw === null || raw === undefined || raw === '') return fallback
  const parsed = parseHorarioLimite(raw)
  if (parsed.normalized && parsed.normalized !== 'Integral') {
    return parsed.normalized
  }
  const str = String(raw).trim()
  return str || fallback
}

/**
 * Encontra a chave de um objeto insensitive a maiúsculas e acentuação
 */
function findKey(row: Record<string, any>, candidates: string[]): string | undefined {
  const keys = Object.keys(row)
  for (const cand of candidates) {
    const candNorm = cand
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
    const found = keys.find((k) => {
      const kNorm = k
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
      return kNorm.includes(candNorm) || candNorm.includes(kNorm)
    })
    if (found) return found
  }
  return undefined
}

export function parseValidadeFile(file: File): Promise<{
  rows: ParsedValidadeRow[]
  headers: string[]
  totalLidas: number
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error('Arquivo vazio ou não pôde ser lido.')
        }

        const workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true,
          raw: false,
        })

        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          throw new Error('A planilha não contém nenhuma aba.')
        }

        const sheet = workbook.Sheets[firstSheetName]
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: '',
          raw: false,
        })

        if (!rawJson || rawJson.length === 0) {
          throw new Error('A planilha não possui linhas de dados.')
        }

        const headers = Object.keys(rawJson[0] || {})
        const rows: ParsedValidadeRow[] = []

        for (const row of rawJson) {
          // 1. Setor / Categoria
          const setorKey = findKey(row, ['setor', 'categoria', 'departamento', 'secao', 'área'])
          const setorVal = setorKey ? String(row[setorKey]).trim() : ''

          // 2. Descrição / Tarefa
          const descKey = findKey(row, [
            'tarefa',
            'descricao',
            'atividade',
            'rotina',
            'o que fazer',
          ])
          const descVal = descKey ? String(row[descKey]).trim() : ''

          // Se não houver nem setor nem descrição, pula a linha vazia
          if (!setorVal && !descVal) continue

          // 3. Data ou Recorrência
          const dataKey = findKey(row, [
            'data',
            'dia',
            'recorrencia',
            'frequencia',
            'periodo',
            'quando',
          ])
          const dataRaw = dataKey ? row[dataKey] : ''
          const { data_especifica, recorrencia } = normalizeDataOuRecorrencia(dataRaw)

          // 4. Horário Início
          const inicioKey = findKey(row, [
            'inicio',
            'horario inicio',
            'hora inicio',
            'horario de inicio',
            'janela inicio',
            'horario',
          ])
          let inicioVal = inicioKey ? row[inicioKey] : ''

          // 5. Horário Fim
          const fimKey = findKey(row, [
            'fim',
            'horario fim',
            'hora fim',
            'horario limite',
            'janela fim',
            'termino',
          ])
          let fimVal = fimKey ? row[fimKey] : ''

          // Se o horário veio num formato combinado "14h-15h" ou "14:00 - 15:00" em um único campo
          if (inicioVal && String(inicioVal).includes('-')) {
            const parts = String(inicioVal).split('-')
            inicioVal = parts[0].trim()
            if (!fimVal && parts[1]) {
              fimVal = parts[1].trim()
            }
          }

          const horario_inicio = normalizeHorarioStr(inicioVal, '08:00')
          const horario_fim = fimVal ? normalizeHorarioStr(fimVal, '09:00') : ''

          // 6. Loja
          const lojaKey = findKey(row, ['loja', 'filial', 'unidade'])
          const lojaVal = lojaKey ? String(row[lojaKey]).trim() : ''

          // 7. Validador
          const validadorKey = findKey(row, [
            'validador',
            'quem valida',
            'validacao',
            'responsavel pela validacao',
            'lider prevencao',
          ])
          const validadorVal = validadorKey ? String(row[validadorKey]).trim() : 'Líder Prevenção'

          // 8. Executor
          const executorKey = findKey(row, ['executor', 'responsavel', 'quem executa', 'operador'])
          const executorVal = executorKey ? String(row[executorKey]).trim() : ''

          rows.push({
            setor_categoria: setorVal || 'Geral',
            descricao: descVal || `Verificação de validade - ${setorVal || 'Setor'}`,
            data_especifica,
            recorrencia,
            dataOuRecorrencia: String(dataRaw || recorrencia || data_especifica || 'Diária'),
            horario_inicio,
            horario_fim,
            loja_nome_ou_codigo: lojaVal,
            validador_funcao_nome: validadorVal || 'Líder Prevenção',
            executor_nome: executorVal,
          })
        }

        resolve({
          rows,
          headers,
          totalLidas: rawJson.length,
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Erro ao carregar arquivo local.'))
    reader.readAsBinaryString(file)
  })
}
