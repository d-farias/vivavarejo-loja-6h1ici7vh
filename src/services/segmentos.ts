import pb from '@/lib/pocketbase/client'
import { clearLocalCache } from '@/lib/offline/db'
import type { ModeloRotina, ModeloRotinaItem, Rotina, User, Cliente, Funcao } from '@/types'

export interface SegmentoInfo {
  id: string
  nome: string
  subtitulo: string
  icone: string // identificador de ícone para UI
  exemploRotina: string
  aliases: string[]
}

export const SEGMENTOS_DISPONIVEIS: SegmentoInfo[] = [
  {
    id: 'Supermercado/Food',
    nome: 'Supermercado/Food',
    subtitulo: 'Supermercados, minimercados, hortifrúti, padarias e mercearias',
    icone: 'ShoppingCart',
    exemploRotina: 'PVPS, validade de perecíveis, temperatura de carnes e laticínios',
    aliases: ['Supermercado/Food', 'Supermercado / Food', 'Supermercado', 'Food', 'Alimentar'],
  },
  {
    id: 'Farmácia & Drogaria',
    nome: 'Farmácia & Drogaria',
    subtitulo: 'Drogarias, farmácias de manipulação e perfumaria farmacêutica',
    icone: 'Pill',
    exemploRotina: 'Termo-higrômetro, controle SNGPC e dermocosméticos',
    aliases: ['Farmácia & Drogaria', 'Farmácia', 'Drogaria', 'Farmacia'],
  },
  {
    id: 'Pet Shop & Clínica',
    nome: 'Pet Shop & Clínica',
    subtitulo: 'Pet shops, clínicas veterinárias, banho e tosa e agropecuárias',
    icone: 'Dog',
    exemploRotina: 'Higienização de banho e tosa, rações fracionadas e balança',
    aliases: ['Pet Shop & Clínica', 'Pet', 'Pet Shop', 'Veterinária'],
  },
  {
    id: 'Moda & Vestuário',
    nome: 'Moda & Vestuário',
    subtitulo: 'Lojas de roupas, calçados, bolsas, acessórios e óticas',
    icone: 'Shirt',
    exemploRotina: 'Visual merchandising, reposição de provadores e vitrine',
    aliases: ['Moda & Vestuário', 'Moda e Vestuário', 'Moda', 'Vestuário', 'Vestuario'],
  },
  {
    id: 'Eletrônicos',
    nome: 'Eletrônicos',
    subtitulo: 'Lojas de celulares, computadores, eletros e tecnologia',
    icone: 'Smartphone',
    exemploRotina: 'Segurança de bancadas, carga de expositores e baterias',
    aliases: ['Eletrônicos', 'Eletrônicos & Telefonia', 'Eletronicos', 'Telefonia'],
  },
  {
    id: 'Construção & Lar',
    nome: 'Construção & Lar',
    subtitulo: 'Materiais de construção, ferragens, tintas, utilidades e decoração',
    icone: 'Hammer',
    exemploRotina: 'Conferência de lotes/pisos, expedição pesada e conferência de caminhões',
    aliases: ['Construção & Lar', 'Construção/Casa', 'Construção', 'Casa & Construção', 'Lar'],
  },
]

/**
 * Normaliza qualquer variação de texto para o ID oficial do segmento
 */
export function normalizarSegmentoId(rawSegmento?: string | null): string | null {
  if (!rawSegmento) return null
  const clean = rawSegmento.trim().toLowerCase()
  if (!clean) return null

  for (const seg of SEGMENTOS_DISPONIVEIS) {
    if (seg.id.toLowerCase() === clean || seg.nome.toLowerCase() === clean) {
      return seg.id
    }
    for (const alias of seg.aliases) {
      if (alias.toLowerCase() === clean) {
        return seg.id
      }
    }
  }

  // Tenta correspondência parcial
  for (const seg of SEGMENTOS_DISPONIVEIS) {
    for (const alias of seg.aliases) {
      if (clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean)) {
        return seg.id
      }
    }
  }

  return rawSegmento.trim()
}

/**
 * Helper para verificar se uma rotina pertence ao segmento fornecido
 */
export function rotinaPertenceAoSegmento(rotina: Rotina, segmentoAlvo: string): boolean {
  if (!rotina) return false
  const rSeg = normalizarSegmentoId(rotina.segmento)
  const targetSeg = normalizarSegmentoId(segmentoAlvo)

  // Se o segmento normalizado for idêntico
  if (rSeg && targetSeg && rSeg === targetSeg) return true

  // Verificação tolerante de aliases caso o nome não seja 100% canônico
  if (rotina.segmento) {
    const rawLower = rotina.segmento.toLowerCase()
    const info = SEGMENTOS_DISPONIVEIS.find((s) => s.id === targetSeg)
    if (info) {
      if (info.aliases.some((a) => rawLower.includes(a.toLowerCase()))) {
        return true
      }
    }
  }

  return false
}

export const segmentosService = {
  getDisponiveis(): SegmentoInfo[] {
    return SEGMENTOS_DISPONIVEIS
  },

  getInfo(segmentoId?: string | null): SegmentoInfo | undefined {
    const norm = normalizarSegmentoId(segmentoId)
    if (!norm) return undefined
    return SEGMENTOS_DISPONIVEIS.find((s) => s.id === norm)
  },

  /**
   * Obtém o segmento ativo do usuário atual a partir de seu perfil ou cliente vinculado
   */
  getSegmentoAtivo(user?: User | null, cliente?: Cliente | null): string | null {
    if (!user) return null
    if (user.segmento && user.segmento.trim()) {
      return normalizarSegmentoId(user.segmento)
    }
    if (cliente?.segmento && cliente.segmento.trim()) {
      return normalizarSegmentoId(cliente.segmento)
    }
    if (user.expand?.cliente?.segmento && user.expand.cliente.segmento.trim()) {
      return normalizarSegmentoId(user.expand.cliente.segmento)
    }
    return null
  },

  /**
   * Busca no catálogo de modelos de rotinas o modelo correspondente a um segmento
   */
  async getModeloPorSegmento(segmentoId: string): Promise<{
    modelo: ModeloRotina | null
    itens: ModeloRotinaItem[]
  }> {
    const targetInfo = this.getInfo(segmentoId)
    const aliases = targetInfo ? targetInfo.aliases : [segmentoId]

    // Busca todos os modelos
    const modelos = await pb.collection('modelos_rotinas').getFullList<ModeloRotina>({
      sort: 'nome',
    })

    let matchedModelo: ModeloRotina | null = null
    for (const m of modelos) {
      const segModel = (m.segmento || '').toLowerCase()
      const nomeModel = (m.nome || '').toLowerCase()

      const match = aliases.some(
        (a) => segModel === a.toLowerCase() || nomeModel.includes(a.toLowerCase()),
      )
      if (match) {
        matchedModelo = m
        break
      }
    }

    if (!matchedModelo) {
      return { modelo: null, itens: [] }
    }

    const itens = await pb.collection('modelos_rotinas_itens').getFullList<ModeloRotinaItem>({
      filter: `modelo = "${matchedModelo.id}"`,
      sort: 'horario_limite,nome',
    })

    return { modelo: matchedModelo, itens }
  },

  /**
   * Aplica a troca ou definição de segmento para o usuário:
   * 1. Salva o segmento ativo no cadastro do usuário e no cliente
   * 2. Desativa rotinas de segmentos anteriores (ativo = false)
   * 3. Ativa rotinas do novo segmento se já existirem na loja (ativo = true)
   * 4. Se não existirem rotinas do novo segmento na loja, clona os itens do modelo correspondente
   * 5. Retorna o número de rotinas ativadas/criadas
   */
  async ativarSegmento(params: {
    userId: string
    segmentoId: string
    clienteId?: string | null
    lojaId?: string | null
    onProgress?: (mensagem: string) => void
  }): Promise<{ sucesso: boolean; rotinasAtivadas: number }> {
    const { userId, segmentoId, clienteId, lojaId, onProgress } = params
    const segmentoCanônico = normalizarSegmentoId(segmentoId) || segmentoId

    onProgress?.('Gravando ramo de atividade no seu perfil...')

    // 1. Atualizar user
    try {
      await pb.collection('users').update(userId, {
        segmento: segmentoCanônico,
      })
    } catch (e) {
      console.warn('Erro ao atualizar segmento no user:', e)
    }

    // 2. Atualizar cliente se houver
    if (clienteId) {
      try {
        await pb.collection('clientes').update(clienteId, {
          segmento: segmentoCanônico,
        })
      } catch (e) {
        console.warn('Erro ao atualizar segmento no cliente:', e)
      }
    }

    onProgress?.('Organizando rotinas do seu ramo...')

    // 3. Buscar todas as rotinas existentes (da loja ou gerais)
    const filterLoja = lojaId && lojaId !== 'todas' ? `loja = "${lojaId}" || loja = ""` : undefined

    const rotinasExistentes = await pb.collection('rotinas').getFullList<Rotina>({
      filter: filterLoja,
    })

    let ativadas = 0

    // 4. Ocultar (desativar) rotinas que NÃO são do segmento selecionado
    // E ativar as que pertencem ao novo segmento
    const rotinasDoNovoSegmento: Rotina[] = []

    for (const r of rotinasExistentes) {
      const pertence = rotinaPertenceAoSegmento(r, segmentoCanônico)
      if (pertence) {
        rotinasDoNovoSegmento.push(r)
        if (!r.ativo) {
          try {
            await pb.collection('rotinas').update(r.id, {
              ativo: true,
              segmento: segmentoCanônico,
            })
            ativadas++
          } catch (e) {
            console.warn('Erro ao ativar rotina:', r.id, e)
          }
        } else {
          ativadas++
        }
      } else {
        // Rotina de outro segmento: desativa (oculta sem apagar)
        if (r.ativo !== false) {
          try {
            await pb.collection('rotinas').update(r.id, {
              ativo: false,
            })
          } catch (e) {
            console.warn('Erro ao ocultar rotina de outro segmento:', r.id, e)
          }
        }
      }
    }

    // 5. Se ainda não há rotinas deste segmento na loja, carregar automaticamente do modelo!
    if (rotinasDoNovoSegmento.length === 0) {
      onProgress?.('Carregando modelo de rotinas pronto para seu ramo...')
      const { modelo, itens } = await this.getModeloPorSegmento(segmentoCanônico)

      if (itens.length > 0) {
        // Mapear funções da loja para resolver IDs
        const funcoesLoja =
          lojaId && lojaId !== 'todas'
            ? await pb.collection('funcoes').getFullList<Funcao>({
                filter: `loja = "${lojaId}"`,
              })
            : []

        const funcaoMap = new Map<string, string>()
        for (const fn of funcoesLoja) {
          funcaoMap.set(fn.nome.trim().toLowerCase(), fn.id)
        }

        for (const it of itens) {
          let funcaoId: string | undefined
          const nomeCargo = (it.funcao_nome || it.responsavel || '').trim()

          if (nomeCargo && lojaId && lojaId !== 'todas') {
            const cKey = nomeCargo.toLowerCase()
            if (funcaoMap.has(cKey)) {
              funcaoId = funcaoMap.get(cKey)
            } else {
              try {
                const nova = await pb.collection('funcoes').create<Funcao>({
                  nome: nomeCargo,
                  loja: lojaId,
                })
                funcaoId = nova.id
                funcaoMap.set(cKey, nova.id)
              } catch (_) {
                funcaoId = undefined
              }
            }
          }

          try {
            await pb.collection('rotinas').create({
              nome: it.nome,
              responsavel: it.responsavel || it.funcao_nome || 'Equipe',
              frequencia: it.frequencia || 'Diária',
              horario_limite: it.horario_limite || '',
              ferramenta: it.ferramenta || '',
              validacao: it.validacao || '',
              area: it.area || '',
              observacoes: it.observacoes || '',
              status: 'Ativa',
              loja: lojaId && lojaId !== 'todas' ? lojaId : undefined,
              funcao: funcaoId,
              segmento: segmentoCanônico,
              ativo: true,
            })
            ativadas++
          } catch (e) {
            console.warn('Erro ao criar rotina do modelo:', it.nome, e)
          }
        }
      }
    }

    // 6. Invalida o cache local offline para garantir recarga limpa do novo formato
    try {
      await clearLocalCache('vivavarejo_')
    } catch (e) {
      console.warn('Erro ao limpar cache offline ao ativar segmento:', e)
    }

    // 7. Dispara evento global para que todas as telas atualizem em tempo real
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vivavarejo:segmento_alterado', {
          detail: { segmento: segmentoCanônico },
        }),
      )
    }

    onProgress?.('Tudo pronto! Seu ambiente de rotinas está configurado.')
    return { sucesso: true, rotinasAtivadas: ativadas }
  },

  /**
   * Filtra uma lista de rotinas para retornar APENAS as que pertencem
   * ao segmento ativo e estão marcadas como ativas (`ativo = true`).
   */
  filtrarRotinasAtivasPorSegmento(rotinas: Rotina[], segmentoAtivo?: string | null): Rotina[] {
    if (!segmentoAtivo) {
      // Se não houver segmento definido, não exibe rotinas (conforme requisito 3 e 4)
      return []
    }
    const targetCanônico = normalizarSegmentoId(segmentoAtivo) || segmentoAtivo

    return rotinas.filter((r) => {
      // Regra estrita: ativo === true e segmento igual ao ativo
      if (r.ativo === false) return false
      return rotinaPertenceAoSegmento(r, targetCanônico)
    })
  },
}
