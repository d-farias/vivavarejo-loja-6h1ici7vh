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
  if (lower.includes('sábado') || (lower.includes('sabado') && lower.includes('domingo'))) {
    return { recorrencia: 'todo sábado e domingo' }
  }
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
export function normalizeHorarioStr(raw: any, fallback = '09:00'): string {
  if (raw === null || raw === undefined || raw === '') return fallback
  const parsed = parseHorarioLimite(raw)
  if (parsed.normalized && parsed.normalized !== 'Integral') {
    return parsed.normalized
  }
  const str = String(raw).trim()
  return str || fallback
}

/**
 * Mapeia siglas de funções comuns (como GO e LP) para nomes descritivos
 */
export function expandirSiglasFuncao(raw?: string): string {
  if (!raw) return ''
  const str = String(raw).trim()
  const upper = str.toUpperCase()

  // Se tiver "GO" e "LP" juntos
  if (upper.includes('GO') && upper.includes('LP')) {
    return 'Gerente Operacional (GO) / Líder Prevenção (LP)'
  }
  if (upper === 'GO' || upper.startsWith('GO ') || upper.endsWith(' GO')) {
    return 'Gerente Operacional (GO)'
  }
  if (upper === 'LP' || upper.startsWith('LP ') || upper.endsWith(' LP')) {
    return 'Líder Prevenção (LP)'
  }
  if (upper === 'GP') {
    return 'Gerente de Prevenção (GP)'
  }

  return str
}

/**
 * Extrai janelas horárias de textos livres de tarefas
 * ex: "Auditoria Validades até 15hs (finalizar)" -> inicio: "09:00", fim: "15:00"
 */
export function extrairHorariosDeTexto(texto: string): { inicio: string; fim: string } {
  let inicio = '09:00'
  let fim = '15:00'

  if (!texto) return { inicio, fim }

  const matchAte = texto.match(/até\s*(\d{1,2})(?:[:h](\d{1,2}))?\s*h/i)
  if (matchAte) {
    const h = String(parseInt(matchAte[1], 10)).padStart(2, '0')
    const m = matchAte[2] ? String(parseInt(matchAte[2], 10)).padStart(2, '0') : '00'
    fim = `${h}:${m}`
  }

  const matchJanela = texto.match(
    /(\d{1,2})(?:[:h](\d{1,2}))?\s*(?:às|as|-|a)\s*(\d{1,2})(?:[:h](\d{1,2}))?\s*h?/i,
  )
  if (matchJanela) {
    const h1 = String(parseInt(matchJanela[1], 10)).padStart(2, '0')
    const m1 = matchJanela[2] ? String(parseInt(matchJanela[2], 10)).padStart(2, '0') : '00'
    const h2 = String(parseInt(matchJanela[3], 10)).padStart(2, '0')
    const m2 = matchJanela[4] ? String(parseInt(matchJanela[4], 10)).padStart(2, '0') : '00'
    inicio = `${h1}:${m1}`
    fim = `${h2}:${m2}`
  }

  return { inicio, fim }
}

/**
 * Detecta se uma string representa uma divisão de ciclo semanal
 * Ex: "Primeira Semana", "Segunda Semana", "1ª Semana", "Semana 1", etc.
 */
export function extrairCicloSemana(str: string): { semanaNum: number; rotulo: string } | null {
  if (!str) return null
  const s = str.trim().toLowerCase()

  if (
    s.includes('primeira semana') ||
    s.includes('1ª semana') ||
    s.includes('semana 1') ||
    s.includes('1a semana')
  ) {
    return { semanaNum: 1, rotulo: 'Primeira Semana' }
  }
  if (
    s.includes('segunda semana') ||
    s.includes('2ª semana') ||
    s.includes('semana 2') ||
    s.includes('2a semana')
  ) {
    return { semanaNum: 2, rotulo: 'Segunda Semana' }
  }
  if (
    s.includes('terceira semana') ||
    s.includes('3ª semana') ||
    s.includes('semana 3') ||
    s.includes('3a semana')
  ) {
    return { semanaNum: 3, rotulo: 'Terceira Semana' }
  }
  if (
    s.includes('quarta semana') ||
    s.includes('4ª semana') ||
    s.includes('semana 4') ||
    s.includes('4a semana')
  ) {
    return { semanaNum: 4, rotulo: 'Quarta Semana' }
  }

  return null
}

/**
 * Detecta dia da semana em uma string
 */
export function extrairDiaDaSemana(str: string): { dia: string; recorrencia: string } | null {
  if (!str) return null
  const s = str.trim().toLowerCase()

  if (s.includes('segunda')) return { dia: 'Segunda-feira', recorrencia: 'toda segunda' }
  if (s.includes('terça') || s.includes('terca'))
    return { dia: 'Terça-feira', recorrencia: 'toda terça' }
  if (s.includes('quarta')) return { dia: 'Quarta-feira', recorrencia: 'toda quarta' }
  if (s.includes('quinta')) return { dia: 'Quinta-feira', recorrencia: 'toda quinta' }
  if (s.includes('sexta')) return { dia: 'Sexta-feira', recorrencia: 'toda sexta' }
  if (s.includes('sabado') || s.includes('sábado')) {
    if (s.includes('domingo')) {
      return { dia: 'Sábado e Domingo', recorrencia: 'todo sábado e domingo' }
    }
    return { dia: 'Sábado', recorrencia: 'todo sábado' }
  }
  if (s.includes('domingo')) return { dia: 'Domingo', recorrencia: 'todo domingo' }

  return null
}

/**
 * Detecta se a linha é rodapé com assinaturas ou observações descartáveis
 */
export function isLinhaRodape(str: string): boolean {
  if (!str) return false
  const s = str.trim().toLowerCase()
  if (
    s.startsWith('ass.') ||
    s.startsWith('assinatura') ||
    s.includes('ass. prev') ||
    s.includes('ass. geren')
  ) {
    return true
  }
  return false
}

/**
 * Limpa e padroniza a string de setores/categorias
 */
export function normalizarSetoresTexto(str: string): string {
  if (!str) return ''
  return str
    .replace(/\s+/g, ' ')
    .replace(/\s*([,/])\s*/g, ' $1 ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\/\s*$/, '') // remove barra no fim, ex: "Mercearia complementar/"
    .trim()
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
  observacaoDetectada?: string
  tarefaNomeDetectado?: string
  horarioInicioSugerido?: string
  horarioFimSugerido?: string
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

        // 1. Ler em formato de matriz de células brutas (AOA - Array of Arrays)
        // para conseguir detectar layouts tabulares de cabeçalho especial (como cronogramas com rodízio semanal)
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        })

        if (!rawRows || rawRows.length === 0) {
          throw new Error('A planilha não possui linhas de dados.')
        }

        // Tentar detectar se a primeira linha tem cabeçalho de tarefa ("Auditoria Validades até 15hs...")
        const headerRow = rawRows[0] || []
        const headerFirstCol = String(headerRow[0] || '').trim()

        // Checar se é o layout de rodízio de validades (seja por nome da coluna ou presença de "Primeira Semana")
        let isRodizioLayout = false
        let detectedTaskName = 'Auditoria Validades'
        let { inicio: detectedInicio, fim: detectedFim } = extrairHorariosDeTexto(headerFirstCol)

        // Se o cabeçalho tiver texto de tarefa
        if (
          headerFirstCol.toLowerCase().includes('auditoria') ||
          headerFirstCol.toLowerCase().includes('validade')
        ) {
          detectedTaskName = headerFirstCol
          isRodizioLayout = true
        }

        // Procurar em todas as linhas brutas se há menções a "Primeira Semana", "Segunda Semana", etc.
        for (const r of rawRows) {
          const firstVal = String(r[0] || '').trim()
          if (extrairCicloSemana(firstVal)) {
            isRodizioLayout = true
            break
          }
        }

        // Variável para capturar observações gerais encontradas no rodapé
        let observacaoDetectada = ''

        const rows: ParsedValidadeRow[] = []

        if (isRodizioLayout) {
          // =========================================================================
          // PARSER ESPECIALIZADO: LAYOUT DE RODÍZIO SEMANAL (4 SEMANAS)
          // =========================================================================
          let semanaAtual: { semanaNum: number; rotulo: string } | null = null
          let respAtual = ''
          let validadorAtual = 'Gerente'

          // Mapear índices das colunas a partir do cabeçalho
          let colSetoresIdx = 1
          let colRespIdx = 3
          let colValidadorIdx = 4

          for (let c = 0; c < headerRow.length; c++) {
            const h = String(headerRow[c] || '').toLowerCase()
            if (h.includes('resp') || h.includes('lider') || h.includes('setor/lider')) {
              colRespIdx = c
            } else if (h.includes('valida') || h.includes('validação')) {
              colValidadorIdx = c
            }
          }

          // Percorrer da linha 1 em diante (linha 0 foi o cabeçalho)
          for (let rIdx = 1; rIdx < rawRows.length; rIdx++) {
            const row = rawRows[rIdx]
            if (!row || row.length === 0) continue

            const col0 = String(row[0] || '').trim()
            const col1 = String(row[colSetoresIdx] || '').trim()
            const colResp = String(row[colRespIdx] || '').trim()
            const colVal = String(row[colValidadorIdx] || '').trim()

            // 1. Checar se é linha de observações
            if (
              col0.toLowerCase().includes('observaç') ||
              col0.toLowerCase().includes('observacao') ||
              col0.toLowerCase().includes('obs:')
            ) {
              const cleanObs = col0
                .replace(/^(?:observações|observacoes|obs:?)\s*(?:loja:?)?\s*:?/i, '')
                .trim()
              observacaoDetectada = cleanObs || col0
              continue
            }

            // 2. Checar se é linha de assinaturas ou rodapé descartável
            if (
              isLinhaRodape(col0) ||
              isLinhaRodape(col1) ||
              isLinhaRodape(colResp) ||
              isLinhaRodape(colVal)
            ) {
              continue
            }

            // 3. Checar se é linha de ciclo semanal ("Primeira Semana", "Segunda Semana", etc.)
            const ciclo = extrairCicloSemana(col0)
            if (ciclo) {
              semanaAtual = ciclo
              if (colResp) respAtual = expandirSiglasFuncao(colResp)
              if (colVal) validadorAtual = colVal.trim()
              continue
            }

            // 4. Checar se é linha de dia da semana ("Segunda-feira", "Terça-feira", etc.)
            const diaInfo = extrairDiaDaSemana(col0)
            if (diaInfo) {
              // Se tiver setores preenchidos na linha
              const setoresTexto = normalizarSetoresTexto(col1)

              // Se a linha do dia tiver responsável/validador específico, usa; senão herda do cabeçalho da semana
              const respLinha = colResp ? expandirSiglasFuncao(colResp) : respAtual
              const valLinha = colVal ? colVal.trim() : validadorAtual

              // Se não tiver setor preenchido (ex: Sabado e Domingo em branco)
              if (!setoresTexto) {
                // Sábado e domingo sem setor definido podem ser ignorados conforme regra
                continue
              }

              const semanaNum = semanaAtual ? semanaAtual.semanaNum : 1
              const semanaRotulo = semanaAtual ? semanaAtual.rotulo : 'Semana 1'

              // Descrição inteligente e informativa
              const desc = `${detectedTaskName} • ${semanaRotulo} • ${diaInfo.dia}`

              rows.push({
                semana_mes: semanaNum,
                semana_rotulo: semanaRotulo,
                dia_semana: diaInfo.dia,
                recorrencia: diaInfo.recorrencia,
                dataOuRecorrencia: `${semanaRotulo} (${diaInfo.dia})`,
                setor_categoria: setoresTexto,
                descricao: desc,
                horario_inicio: detectedInicio,
                horario_fim: detectedFim,
                executor_nome: respLinha,
                validador_funcao_nome: valLinha || 'Gerente',
                observacoes: observacaoDetectada,
              })
            }
          }
        }

        // Se após o parsing de rodízio não encontrou tarefas (ou se for o layout tabular padrão), usa o fallback padrão
        if (rows.length === 0) {
          const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
            defval: '',
            raw: false,
          })

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

            // 4. Horários
            const inicioKey = findKey(row, [
              'inicio',
              'horario inicio',
              'hora inicio',
              'horario de inicio',
              'janela inicio',
              'horario',
            ])
            let inicioVal = inicioKey ? row[inicioKey] : ''

            const fimKey = findKey(row, [
              'fim',
              'horario fim',
              'hora fim',
              'horario limite',
              'janela fim',
              'termino',
            ])
            let fimVal = fimKey ? row[fimKey] : ''

            if (inicioVal && String(inicioVal).includes('-')) {
              const parts = String(inicioVal).split('-')
              inicioVal = parts[0].trim()
              if (!fimVal && parts[1]) {
                fimVal = parts[1].trim()
              }
            }

            const horario_inicio = normalizeHorarioStr(inicioVal, '09:00')
            const horario_fim = fimVal ? normalizeHorarioStr(fimVal, '15:00') : '15:00'

            // 5. Loja
            const lojaKey = findKey(row, ['loja', 'filial', 'unidade'])
            const lojaVal = lojaKey ? String(row[lojaKey]).trim() : ''

            // 6. Validador
            const validadorKey = findKey(row, [
              'validador',
              'quem valida',
              'validacao',
              'responsavel pela validacao',
              'lider prevencao',
              'gerente',
            ])
            const validadorVal = validadorKey ? String(row[validadorKey]).trim() : 'Gerente'

            // 7. Executor
            const executorKey = findKey(row, [
              'executor',
              'responsavel',
              'quem executa',
              'operador',
              'resp. setor/lider',
            ])
            const executorVal = executorKey ? expandirSiglasFuncao(String(row[executorKey])) : ''

            rows.push({
              setor_categoria: normalizarSetoresTexto(setorVal) || 'Geral',
              descricao: descVal || `Auditoria Validades - ${setorVal || 'Setor'}`,
              data_especifica,
              recorrencia,
              dataOuRecorrencia: String(dataRaw || recorrencia || data_especifica || 'Diária'),
              horario_inicio,
              horario_fim,
              loja_nome_ou_codigo: lojaVal,
              validador_funcao_nome: validadorVal || 'Gerente',
              executor_nome: executorVal,
            })
          }
        }

        // Se tiver observação detectada no rodapé, associar a todas as linhas que não tiverem
        if (observacaoDetectada) {
          for (const r of rows) {
            if (!r.observacoes) {
              r.observacoes = observacaoDetectada
            }
          }
        }

        const headers = headerRow.map((h: any) => String(h || '').trim()).filter(Boolean)

        resolve({
          rows,
          headers,
          totalLidas: rows.length,
          observacaoDetectada,
          tarefaNomeDetectado: detectedTaskName,
          horarioInicioSugerido: detectedInicio,
          horarioFimSugerido: detectedFim,
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Erro ao carregar arquivo local.'))
    reader.readAsBinaryString(file)
  })
}
