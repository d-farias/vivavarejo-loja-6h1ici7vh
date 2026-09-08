/**
 * Módulo de Normalização Canônica de Cargos, Funções e Departamentos Operacionais
 * VivaVarejo - Padrão Unificado de Exibição e Agrupamento
 *
 * Regras:
 * - A unificação é estritamente para EXIBIÇÃO e AGRUPAMENTO/FILTRAGEM.
 * - Dados originais no backend não são mutados.
 * - Nomes fora das famílias conhecidas mantêm sua grafia original (sem inventar equivalências).
 * - Badges e totais somam todas as variantes agrupadas na chave canônica.
 */

/**
 * Normaliza um texto para chave canônica comparável:
 * minúsculo, sem acentos, sem caracteres especiais, espaços colapsados.
 */
export function getChaveCanonico(raw: string | undefined | null): string {
  if (!raw) return ''
  const canonico = normalizarNomeCanonico(raw)
  return canonico
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normaliza grafias variantes de planilhas e cadastros legados
 * para um padrão canônico único de cargo / departamento.
 */
export function normalizarNomeCanonico(raw: string | undefined | null): string {
  if (!raw) return ''
  const s = String(raw).trim()
  if (!s) return ''

  // Normalização preliminar para comparação: minúsculas, sem acentos e caracteres especiais
  const norm = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!norm) return s

  // 1. "Gerente de Loja": gerente, gerência, gerente geral, gerente de loja, gerente de operações, gerente operacional, "gerente/go", "go", prefixo "gerente..."
  if (
    norm === 'go' ||
    norm === 'gerente' ||
    norm === 'gerencia' ||
    norm === 'gerente geral' ||
    norm === 'gerente de loja' ||
    norm === 'gerente de operacoes' ||
    norm === 'gerente operacional' ||
    norm === 'gerente go' ||
    norm === 'gerente de secao' ||
    norm.startsWith('gerente ') ||
    norm.startsWith('gerente/') ||
    norm.startsWith('gerencia ')
  ) {
    return 'Gerente de Loja'
  }

  // 2. "Prevenção de Perdas": prevenção, prevenção de perdas, "prevencao/go", fiscal de prevenção, preventista, "app", "fiscal app", agente de prevenção, "gp", "lp"
  if (
    norm === 'app' ||
    norm === 'fiscal app' ||
    norm === 'prevencao' ||
    norm === 'prevencao de perdas' ||
    norm === 'prevencao perdas' ||
    norm === 'prevencao go' ||
    norm === 'fiscal de prevencao' ||
    norm === 'fiscal prevencao' ||
    norm === 'preventista' ||
    norm === 'agente de prevencao' ||
    norm === 'agente prevencao' ||
    norm === 'gp' ||
    norm === 'lp' ||
    norm === 'lider prevencao' ||
    norm === 'lider de prevencao' ||
    norm === 'lider prev' ||
    norm === 'fiscal de loja' ||
    norm === 'fiscal loja'
  ) {
    return 'Prevenção de Perdas'
  }

  // 3. "Encarregado de Loja": encarregado(s), "encarregados/go", "enc/gerente/prev.", líder de seção/setor, chefe de seção
  if (
    norm === 'encarregado' ||
    norm === 'encarregados' ||
    norm === 'encarregados go' ||
    norm === 'encarregado go' ||
    norm === 'encarregado de loja' ||
    norm === 'encarregado de setor' ||
    norm === 'encarregado de secao' ||
    norm === 'enc gerente prev' ||
    norm === 'enc gerente' ||
    norm === 'enc' ||
    norm === 'lider de secao' ||
    norm === 'lider de setor' ||
    norm === 'lider secao' ||
    norm === 'lider setor' ||
    norm === 'chefe de secao' ||
    norm === 'chefe secao' ||
    norm === 'lider de loja' ||
    norm === 'lider loja'
  ) {
    return 'Encarregado de Loja'
  }

  // 4. "Analista de Estoque / Auditoria": analista, analista de estoque, auditoria, auditor, "g. est/gerente"
  if (
    norm === 'analista' ||
    norm === 'analista de estoque' ||
    norm === 'analista estoque' ||
    norm === 'auditoria' ||
    norm === 'auditor' ||
    norm === 'auditor de estoque' ||
    norm === 'auditor estoque' ||
    norm === 'g est gerente' ||
    norm === 'gest gerente' ||
    norm === 'g est' ||
    norm === 'analista de perdas' ||
    norm === 'analista de inventario'
  ) {
    return 'Analista de Estoque / Auditoria'
  }

  // 5. "Cartazista": cartazista, comunicação visual
  if (
    norm === 'cartazista' ||
    norm === 'comunicacao visual' ||
    norm === 'comunicacao' ||
    norm === 'comunicacao visual / cartazista'
  ) {
    return 'Cartazista'
  }

  // 6. "Conferente": conferente, recebimento, conferência de cargas
  if (
    norm === 'conferente' ||
    norm === 'recebimento' ||
    norm === 'conferencia de cargas' ||
    norm === 'conferencia cargas' ||
    norm === 'conferencia' ||
    norm === 'recebimento de mercadorias' ||
    norm === 'recebimento e conferencia'
  ) {
    return 'Conferente'
  }

  // 7. "Operador de Caixa": operador de caixa, caixa, fiscal de caixa, atendente
  if (
    norm === 'operador de caixa' ||
    norm === 'operadora de caixa' ||
    norm === 'caixa' ||
    norm === 'caixas' ||
    norm === 'fiscal de caixa' ||
    norm === 'fiscal caixa' ||
    norm === 'atendente' ||
    norm === 'atendente de caixa' ||
    norm === 'operador de checkout' ||
    norm === 'frente de caixa'
  ) {
    return 'Operador de Caixa'
  }

  // 8. "Repositor": repositor, reposição, auxiliar de reposição
  if (
    norm === 'repositor' ||
    norm === 'repositores' ||
    norm === 'reposicao' ||
    norm === 'auxiliar de reposicao' ||
    norm === 'auxiliar reposicao' ||
    norm === 'promotor de reposicao' ||
    norm === 'repositor de mercadorias' ||
    norm === 'repositor de loja'
  ) {
    return 'Repositor'
  }

  // Fallback seguro: mantém a string original informada (sem inventar equivalência)
  return s
}

/**
 * Compara se dois nomes de função/departamento correspondem à mesma chave canônica.
 */
export function matchCargoCanonico(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const cA = getChaveCanonico(a)
  const cB = getChaveCanonico(b)
  if (!cA || !cB) return false
  return cA === cB
}

/**
 * Formata um responsável para exibição:
 * Se corresponder a um cargo/área canônica, normaliza para o nome canônico;
 * Se for nome de pessoa (ex: "Carlos Silva"), mantém o nome original.
 */
export function formatarCargoOuResponsavel(raw: string | undefined | null): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const canonico = normalizarNomeCanonico(trimmed)
  return canonico || trimmed
}
