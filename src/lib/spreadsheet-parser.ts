import { parseHorarioLimite } from '@/lib/time-utils'
import type { FrequenciaRotina } from '@/types'

export interface ParsedSheetRoutine {
  nome: string
  responsavel: string
  frequencia: FrequenciaRotina
  horario_limite: string
  ferramenta: string
  validacao: string
  area: string
  observacoes: string
}

const VALID_FREQUENCIAS: FrequenciaRotina[] = [
  'Diária',
  'Semanal',
  'Conforme vendas',
  'Rotinas',
  'A cada recebimento',
]

/**
 * Normaliza o valor de frequência da planilha para os valores válidos da collection 'rotinas'.
 */
export function normalizeFrequencia(rawVal?: string | null): FrequenciaRotina {
  if (!rawVal) return 'Diária'
  const val = String(rawVal).trim().toLowerCase()
  if (val.includes('seman')) return 'Semanal'
  if (val.includes('vend')) return 'Conforme vendas'
  if (val.includes('receb')) return 'A cada recebimento'
  if (val.includes('rotina')) return 'Rotinas'
  return 'Diária'
}

/**
 * Carrega a biblioteca SheetJS sob demanda via script tag no browser (para garantir suporte total a .xlsx e .csv)
 */
async function getXLSXLib(): Promise<any> {
  if ((window as any).XLSX) {
    return (window as any).XLSX
  }

  // Tenta carregar via tag de script CDN
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sheetjs]')
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).XLSX))
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    script.async = true
    script.setAttribute('data-sheetjs', 'true')
    script.onload = () => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX)
      } else {
        reject(new Error('SheetJS não foi inicializado corretamente.'))
      }
    }
    script.onerror = () => {
      // Fallback para cdnjs
      const fallbackScript = document.createElement('script')
      fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      fallbackScript.async = true
      fallbackScript.onload = () => resolve((window as any).XLSX)
      fallbackScript.onerror = () =>
        reject(new Error('Falha ao carregar o motor de leitura Excel.'))
      document.head.appendChild(fallbackScript)
    }
    document.head.appendChild(script)
  })
}

/**
 * Converte arquivo CSV texto plano simples (caso offline/fallback)
 */
function parseCSVText(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  // Detect delimiter (, or ;)
  const headerLine = lines[0]
  const delimiter = headerLine.includes(';') ? ';' : ','
  const headers = headerLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim())

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim())
    const rowObj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] || ''
    })
    rows.push(rowObj)
  }
  return rows
}

/**
 * Faz o mapeamento flexível das colunas para os campos do sistema.
 * Suporta as colunas de exemplo da especificação:
 * - Rotina / Loja: Rotinas Lojas / Nome -> nome
 * - Responsável pela rotina / Responsavel / 1029 -> responsavel
 * - Frequência / Frequencia -> frequencia
 * - Horário limite / Horario limite -> horario_limite
 * - Ferramenta necessária / Ferramenta -> ferramenta
 * - Validação (quem) / Validacao -> validacao
 * - necessidade identificada/Area / Area -> area
 * - Justificativas / Observações / Observacoes -> observacoes
 */
export function mapRowToRoutine(
  row: Record<string, any>,
  headersMap: { [key: string]: string } = {},
): ParsedSheetRoutine | null {
  const getColValue = (candidates: string[]): string => {
    // Primeiro tenta via mapeamento direto de chaves originais
    for (const key of Object.keys(row)) {
      const lowerKey = key.trim().toLowerCase()
      for (const cand of candidates) {
        if (lowerKey === cand.toLowerCase() || lowerKey.includes(cand.toLowerCase())) {
          const val = row[key]
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim()
          }
        }
      }
    }
    return ''
  }

  // Se o usuário fez mapeamento explícito
  const getValueByHeader = (targetField: string, candidates: string[]): string => {
    if (headersMap[targetField] && row[headersMap[targetField]] !== undefined) {
      return String(row[headersMap[targetField]]).trim()
    }
    return getColValue(candidates)
  }

  const nome = getValueByHeader('nome', [
    'rotina',
    'rotinas',
    'nome',
    'atividade',
    'tarefa',
    'loja: rotinas',
  ])
  const responsavel = getValueByHeader('responsavel', [
    'responsável pela rotina',
    'responsavel pela rotina',
    'responsável',
    'responsavel',
    'quem pode executar',
    'executante',
    'função',
    'funcao',
    '1029',
  ])
  const frequenciaRaw = getValueByHeader('frequencia', [
    'frequência',
    'frequencia',
    'periodicidade sugerida',
    'periodicidade',
  ])
  const horarioRaw = getValueByHeader('horario_limite', [
    'horário limite',
    'horario limite',
    'horário',
    'horario',
    'prazo',
    'limite',
  ])
  const ferramenta = getValueByHeader('ferramenta', [
    'ferramenta necessária',
    'ferramenta necessaria',
    'ferramenta / recurso',
    'ferramenta',
    'recurso',
  ])
  const validacao = getValueByHeader('validacao', [
    'validação (quem)',
    'validacao (quem)',
    'validação',
    'validacao',
    'quem valida',
    'validador',
  ])
  const area = getValueByHeader('area', [
    'necessidade identificada/area',
    'necessidade identificada/área',
    'necessidade identificada',
    'área',
    'area',
    'setor',
  ])
  const observacoes = getValueByHeader('observacoes', [
    'justificativas',
    'justificativa',
    'observações',
    'observacoes',
    'objetivo',
    'detalhes',
  ])

  // Se não tem nem nome nem responsável, descarta linha vazia ou cabeçalho redundante
  if (!nome || nome.toLowerCase() === 'rotina' || nome.toLowerCase().includes('rotinas lojas')) {
    return null
  }

  const parsedHorario = parseHorarioLimite(horarioRaw)
  const normalizedHorario = parsedHorario.isIntegral
    ? 'Integral'
    : parsedHorario.normalized || horarioRaw

  return {
    nome,
    responsavel: responsavel || 'Equipe de Loja',
    frequencia: normalizeFrequencia(frequenciaRaw),
    horario_limite: normalizedHorario,
    ferramenta: ferramenta || '',
    validacao: validacao || 'Gerente de Loja',
    area: area || responsavel || 'Operação',
    observacoes: observacoes || '',
  }
}

/**
 * Lê o arquivo (.xlsx ou .csv) fornecido pelo usuário e retorna lista de rotinas identificadas
 */
export async function parseUploadedSpreadsheet(file: File): Promise<{
  routines: ParsedSheetRoutine[]
  sheetNames: string[]
  headers: string[]
  rawRowsCount: number
}> {
  const isCSV = file.name.endsWith('.csv') || file.type.includes('csv')

  if (isCSV) {
    const text = await file.text()
    const rows = parseCSVText(text)
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    const routines: ParsedSheetRoutine[] = []

    for (const r of rows) {
      const routine = mapRowToRoutine(r)
      if (routine) routines.push(routine)
    }

    return {
      routines,
      sheetNames: ['CSV'],
      headers,
      rawRowsCount: rows.length,
    }
  }

  // Caso seja Excel (.xlsx / .xls)
  const XLSX = await getXLSXLib()
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: false })

  const sheetNames: string[] = workbook.SheetNames || []
  if (sheetNames.length === 0) {
    throw new Error('Nenhuma planilha encontrada no arquivo.')
  }

  // Tenta achar a planilha principal (ex: Levantamento Operacional ou a primeira)
  let sheetToUse = sheetNames[0]
  for (const name of sheetNames) {
    if (name.toLowerCase().includes('levantamento') || name.toLowerCase().includes('operacional')) {
      sheetToUse = name
      break
    }
  }

  const sheet = workbook.Sheets[sheetToUse]
  // Converte para JSON
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (rawData.length === 0) {
    return { routines: [], sheetNames, headers: [], rawRowsCount: 0 }
  }

  // Localiza a linha de cabeçalho: procura por 'rotina', 'responsável', 'frequência', etc.
  let headerRowIndex = 0
  for (let r = 0; r < Math.min(rawData.length, 5); r++) {
    const lineJoined = rawData[r].map((v) => String(v).toLowerCase()).join(' ')
    if (
      lineJoined.includes('rotina') ||
      lineJoined.includes('respons') ||
      lineJoined.includes('frequ') ||
      lineJoined.includes('horário')
    ) {
      headerRowIndex = r
      break
    }
  }

  const headers = rawData[headerRowIndex].map((h, i) => String(h || `col_${i}`).trim())
  const routines: ParsedSheetRoutine[] = []
  let rawRowsCount = 0

  for (let r = headerRowIndex + 1; r < rawData.length; r++) {
    const rowArray = rawData[r]
    if (!rowArray || rowArray.length === 0) continue

    const rowObj: Record<string, any> = {}
    let hasData = false

    headers.forEach((h, idx) => {
      const cellVal = rowArray[idx]
      if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
        hasData = true
        rowObj[h] = cellVal
      }
    })

    if (!hasData) continue
    rawRowsCount++

    const routine = mapRowToRoutine(rowObj)
    if (routine) {
      routines.push(routine)
    }
  }

  return {
    routines,
    sheetNames,
    headers,
    rawRowsCount,
  }
}
