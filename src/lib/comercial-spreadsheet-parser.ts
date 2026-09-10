import * as XLSX from 'xlsx'
import type { CurvaAbc, TipoRuptura, FaixaSemVenda } from '@/types'

export interface ParsedComercialProdutoRow {
  codigo: string
  descricao: string
  departamento: string
  categoria: string
  fornecedor: string
  curva: CurvaAbc
  estoque_fisico: number
  estoque_virtual: number
  em_ruptura: boolean
  tipo_ruptura: TipoRuptura
  dias_sem_venda: number
  faixa_sem_venda: FaixaSemVenda
  preco_venda: number
  custo_medio: number
  margem_perc: number
  giro_dias: number
  venda_qtd_periodo: number
  venda_valor_periodo: number
  participacao_valor_perc: number
  participacao_qtd_perc: number
  ativo_sortimento: boolean
}

export interface ParsedComercialCategoriaRow {
  departamento: string
  categoria: string
  venda_valor: number
  venda_qtd: number
  meta_venda_valor: number
  atingimento_meta_perc: number
  participacao_vendas_perc: number
  margem_lucro_perc: number
  quebra_valor: number
  quebra_perc_sobre_venda: number
  total_skus_sortimento: number
  total_skus_ruptura: number
  taxa_ruptura_perc: number
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback
  if (typeof val === 'number') return isNaN(val) ? fallback : val
  // Limpar formatação pt-BR (ex: R$ 1.250,50 ou 15,4%)
  let str = String(val)
    .trim()
    .replace(/[R$\s%]/g, '')
  if (str.includes(',') && str.includes('.')) {
    // 1.250,50 -> 1250.50
    str = str.replace(/\./g, '').replace(',', '.')
  } else if (str.includes(',')) {
    str = str.replace(',', '.')
  }
  const n = parseFloat(str)
  return isNaN(n) ? fallback : n
}

function parseBool(val: any): boolean {
  if (typeof val === 'boolean') return val
  const str = cleanString(val).toLowerCase()
  return str === 'sim' || str === 's' || str === 'true' || str === '1' || str === 'x'
}

export function parseComercialFile(file: File): Promise<{
  produtos: ParsedComercialProdutoRow[]
  categorias: ParsedComercialCategoriaRow[]
  sheetNames: string[]
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
        const sheetNames = workbook.SheetNames

        let produtos: ParsedComercialProdutoRow[] = []
        let categorias: ParsedComercialCategoriaRow[] = []

        // 1. Tentar localizar aba de produtos ou ler a primeira aba
        const prodSheetName =
          sheetNames.find(
            (s) =>
              s.toLowerCase().includes('prod') ||
              s.toLowerCase().includes('item') ||
              s.toLowerCase().includes('sortimento') ||
              s.toLowerCase().includes('ruptura'),
          ) || sheetNames[0]

        if (prodSheetName && workbook.Sheets[prodSheetName]) {
          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(
            workbook.Sheets[prodSheetName],
            { defval: '' },
          )

          produtos = rawRows
            .map((r) => {
              // Buscar chaves flexíveis
              const keys = Object.keys(r)
              const findKey = (candidates: string[]) => {
                const lower = candidates.map((c) => c.toLowerCase())
                const k = keys.find((key) => {
                  const cleaned = key.toLowerCase().replace(/[^a-z0-9]/g, '')
                  return lower.some((c) => cleaned.includes(c))
                })
                return k ? r[k] : undefined
              }

              const codigo = cleanString(findKey(['codigo', 'cod', 'sku', 'ean', 'barras', 'id']))
              const descricao = cleanString(
                findKey(['descricao', 'produto', 'nome', 'item', 'desc']),
              )

              if (!descricao && !codigo) return null

              const departamento =
                cleanString(findKey(['departamento', 'depto', 'setor'])) || 'Geral'
              const categoria =
                cleanString(findKey(['categoria', 'subcategoria', 'secao'])) || 'Diversos'
              const fornecedor = cleanString(findKey(['fornecedor', 'marca', 'fabricante'])) || ''

              let curvaRaw = cleanString(findKey(['curva', 'abc', 'curvaabc'])).toUpperCase()
              let curva: CurvaAbc = 'C'
              if (curvaRaw.includes('A')) curva = 'A'
              else if (curvaRaw.includes('B')) curva = 'B'
              else if (curvaRaw.includes('C+') || curvaRaw.includes('C_PLUS')) curva = 'C+'
              else if (curvaRaw.includes('C')) curva = 'C'

              const estoque_fisico = parseNumber(
                findKey(['estoquefisico', 'fisico', 'saldo', 'estq', 'estoque']),
                0,
              )
              const estoque_virtual = parseNumber(findKey(['estoquevirtual', 'virtual']), 0)

              let em_ruptura = parseBool(findKey(['ruptura', 'emruptura', 'falta']))
              if (!em_ruptura && estoque_fisico <= 0) {
                em_ruptura = true
              }

              let tipo_ruptura: TipoRuptura = 'nenhuma'
              const trRaw = cleanString(findKey(['tiporuptura', 'motivo'])).toLowerCase()
              if (trRaw.includes('virt')) tipo_ruptura = 'virtual'
              else if (trRaw.includes('gond') || trRaw.includes('reposicao'))
                tipo_ruptura = 'gondola'
              else if (em_ruptura || estoque_fisico <= 0) tipo_ruptura = 'fisica'

              const dias_sem_venda = parseNumber(
                findKey(['diassemvenda', 'semvenda', 'diassemgiro']),
                0,
              )
              let faixa_sem_venda: FaixaSemVenda = 'nenhuma'
              if (dias_sem_venda >= 90) faixa_sem_venda = 'acima_90_dias'
              else if (dias_sem_venda >= 60) faixa_sem_venda = '60_dias'
              else if (dias_sem_venda >= 30) faixa_sem_venda = '30_dias'

              const preco_venda = parseNumber(
                findKey(['preco', 'precovenda', 'vlr_unit', 'pvenda']),
                0,
              )
              const custo_medio = parseNumber(findKey(['custo', 'customedio', 'cm']), 0)
              let margem_perc = parseNumber(findKey(['margem', 'margemper', 'lucromargem']), 0)
              if (margem_perc === 0 && preco_venda > 0 && custo_medio > 0) {
                margem_perc = Math.round(((preco_venda - custo_medio) / preco_venda) * 10000) / 100
              }

              const giro_dias = parseNumber(
                findKey(['giro', 'cobertura', 'coberturadias', 'girodias']),
                0,
              )
              const venda_qtd_periodo = parseNumber(
                findKey(['vendaqtd', 'qtdvenda', 'quantidadepesquisada', 'vendasqtd']),
                0,
              )
              const venda_valor_periodo = parseNumber(
                findKey(['vendavalor', 'vendasvalor', 'faturamento', 'receita']),
                0,
              )
              const participacao_valor_perc = parseNumber(
                findKey(['partvalor', 'sharevalor', 'participacaovalor']),
                0,
              )
              const participacao_qtd_perc = parseNumber(
                findKey(['partqtd', 'shareqtd', 'participacaoqtd']),
                0,
              )
              const ativo_sortimento =
                parseBool(findKey(['ativo', 'sortimento', 'cadastrado'])) || true

              return {
                codigo: codigo || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
                descricao: descricao || 'Produto sem descrição',
                departamento,
                categoria,
                fornecedor,
                curva,
                estoque_fisico,
                estoque_virtual,
                em_ruptura,
                tipo_ruptura,
                dias_sem_venda,
                faixa_sem_venda,
                preco_venda,
                custo_medio,
                margem_perc,
                giro_dias,
                venda_qtd_periodo,
                venda_valor_periodo,
                participacao_valor_perc,
                participacao_qtd_perc,
                ativo_sortimento,
              }
            })
            .filter(Boolean) as ParsedComercialProdutoRow[]
        }

        // 2. Se houver uma aba com nome relacionado a categorias/departamentos
        const catSheetName = sheetNames.find(
          (s) =>
            s.toLowerCase().includes('categ') ||
            s.toLowerCase().includes('dept') ||
            s.toLowerCase().includes('departamento') ||
            s.toLowerCase().includes('quebra'),
        )

        if (catSheetName && workbook.Sheets[catSheetName]) {
          const rawRowsCat: Record<string, any>[] = XLSX.utils.sheet_to_json(
            workbook.Sheets[catSheetName],
            { defval: '' },
          )

          categorias = rawRowsCat
            .map((r) => {
              const keys = Object.keys(r)
              const findKey = (candidates: string[]) => {
                const lower = candidates.map((c) => c.toLowerCase())
                const k = keys.find((key) => {
                  const cleaned = key.toLowerCase().replace(/[^a-z0-9]/g, '')
                  return lower.some((c) => cleaned.includes(c))
                })
                return k ? r[k] : undefined
              }

              const departamento =
                cleanString(findKey(['departamento', 'depto', 'setor'])) || 'Geral'
              const categoria = cleanString(findKey(['categoria', 'subcategoria', 'secao']))
              if (!categoria && !departamento) return null

              const venda_valor = parseNumber(findKey(['vendavalor', 'faturamento', 'venda']), 0)
              const venda_qtd = parseNumber(findKey(['vendaqtd', 'qtd', 'volume']), 0)
              const meta_venda_valor = parseNumber(findKey(['meta', 'metavalor', 'metavenda']), 0)
              let atingimento_meta_perc = parseNumber(
                findKey(['atingimento', 'atingimentometa', 'percmeta']),
                0,
              )
              if (atingimento_meta_perc === 0 && meta_venda_valor > 0) {
                atingimento_meta_perc = Math.round((venda_valor / meta_venda_valor) * 10000) / 100
              }

              const participacao_vendas_perc = parseNumber(
                findKey(['participacao', 'share', 'participacaovendas']),
                0,
              )
              const margem_lucro_perc = parseNumber(findKey(['margem', 'margemlucro']), 0)
              const quebra_valor = parseNumber(findKey(['quebra', 'quebravalor', 'perda']), 0)
              let quebra_perc_sobre_venda = parseNumber(
                findKey(['quebrarec', 'quebraperc', 'percap']),
                0,
              )
              if (quebra_perc_sobre_venda === 0 && venda_valor > 0 && quebra_valor > 0) {
                quebra_perc_sobre_venda = Math.round((quebra_valor / venda_valor) * 10000) / 100
              }

              const total_skus_sortimento = parseNumber(findKey(['skus', 'totalskus', 'mix']), 0)
              const total_skus_ruptura = parseNumber(findKey(['skusruptura', 'rupturas']), 0)
              let taxa_ruptura_perc = parseNumber(findKey(['taxaruptura', 'rupturaperc']), 0)
              if (taxa_ruptura_perc === 0 && total_skus_sortimento > 0) {
                taxa_ruptura_perc =
                  Math.round((total_skus_ruptura / total_skus_sortimento) * 10000) / 100
              }

              return {
                departamento,
                categoria: categoria || 'Geral',
                venda_valor,
                venda_qtd,
                meta_venda_valor,
                atingimento_meta_perc,
                participacao_vendas_perc,
                margem_lucro_perc,
                quebra_valor,
                quebra_perc_sobre_venda,
                total_skus_sortimento,
                total_skus_ruptura,
                taxa_ruptura_perc,
              }
            })
            .filter(Boolean) as ParsedComercialCategoriaRow[]
        }

        // Se não houver aba explícita de categorias mas tivermos produtos, agregar categorias automaticamente!
        if (categorias.length === 0 && produtos.length > 0) {
          const catMap = new Map<string, ParsedComercialCategoriaRow>()
          const totalVendaGeral = produtos.reduce((acc, p) => acc + (p.venda_valor_periodo || 0), 0)

          produtos.forEach((p) => {
            const key = `${p.departamento}:::${p.categoria}`
            const cur = catMap.get(key) || {
              departamento: p.departamento,
              categoria: p.categoria,
              venda_valor: 0,
              venda_qtd: 0,
              meta_venda_valor: 0,
              atingimento_meta_perc: 100,
              participacao_vendas_perc: 0,
              margem_lucro_perc: 0,
              quebra_valor: 0,
              quebra_perc_sobre_venda: 0,
              total_skus_sortimento: 0,
              total_skus_ruptura: 0,
              taxa_ruptura_perc: 0,
            }

            cur.venda_valor += p.venda_valor_periodo || 0
            cur.venda_qtd += p.venda_qtd_periodo || 0
            cur.total_skus_sortimento += 1
            if (p.em_ruptura) {
              cur.total_skus_ruptura += 1
            }
            catMap.set(key, cur)
          })

          categorias = Array.from(catMap.values()).map((c) => {
            const part = totalVendaGeral > 0 ? (c.venda_valor / totalVendaGeral) * 100 : 0
            const taxaRup =
              c.total_skus_sortimento > 0
                ? (c.total_skus_ruptura / c.total_skus_sortimento) * 100
                : 0
            return {
              ...c,
              participacao_vendas_perc: Math.round(part * 100) / 100,
              taxa_ruptura_perc: Math.round(taxaRup * 100) / 100,
              meta_venda_valor: Math.round(c.venda_valor * 1.05), // estimativa inicial de meta
              atingimento_meta_perc: Math.round(
                (c.venda_valor / (c.venda_valor * 1.05 || 1)) * 100,
              ),
              margem_lucro_perc: 26.5,
              quebra_valor: Math.round(c.venda_valor * 0.018), // estimativa de quebra ~1.8%
              quebra_perc_sobre_venda: 1.8,
            }
          })
        }

        resolve({ produtos, categorias, sheetNames })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}
