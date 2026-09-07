import pb from '@/lib/pocketbase/client'
import type {
  ModeloRotina,
  ModeloRotinaItem,
  ModeloComContagem,
  Rotina,
  Funcao,
  FrequenciaRotina,
} from '@/types'

export interface AplicarModeloOptions {
  modeloId: string
  lojaId: string
  modo: 'append' | 'replace'
  deduplicar?: boolean // se true (padrão no modo append), ignora ou substitui rotinas com mesmo nome/área/função/horário
  onProgress?: (message: string) => void
}

export const modelosRotinasService = {
  /**
   * Lista todos os modelos cadastrados com expansão de cliente e criador.
   */
  async getAll(): Promise<ModeloRotina[]> {
    return await pb.collection('modelos_rotinas').getFullList<ModeloRotina>({
      sort: '-created',
      expand: 'cliente,criado_por',
    })
  },

  /**
   * Lista modelos com contagem do número de rotinas que cada um possui.
   */
  async getAllComContagem(): Promise<ModeloComContagem[]> {
    const [modelos, itens] = await Promise.all([
      pb.collection('modelos_rotinas').getFullList<ModeloRotina>({
        sort: '-created',
        expand: 'cliente,criado_por',
      }),
      pb.collection('modelos_rotinas_itens').getFullList<{ modelo: string }>({
        fields: 'modelo',
      }),
    ])

    const countByModelo: Record<string, number> = {}
    for (const item of itens) {
      countByModelo[item.modelo] = (countByModelo[item.modelo] || 0) + 1
    }

    return modelos.map((m) => ({
      ...m,
      totalItens: countByModelo[m.id] || 0,
    }))
  },

  async getById(id: string): Promise<ModeloRotina> {
    return await pb.collection('modelos_rotinas').getOne<ModeloRotina>(id, {
      expand: 'cliente,criado_por',
    })
  },

  /**
   * Retorna os itens de rotina associados ao modelo
   */
  async getItens(modeloId: string): Promise<ModeloRotinaItem[]> {
    return await pb.collection('modelos_rotinas_itens').getFullList<ModeloRotinaItem>({
      filter: `modelo = "${modeloId}"`,
      sort: 'horario_limite,nome',
    })
  },

  async create(data: {
    nome: string
    cliente?: string
    segmento?: string
    descricao?: string
    criado_por?: string
  }): Promise<ModeloRotina> {
    return await pb.collection('modelos_rotinas').create<ModeloRotina>(data, {
      expand: 'cliente,criado_por',
    })
  },

  async update(id: string, data: Partial<ModeloRotina>): Promise<ModeloRotina> {
    return await pb.collection('modelos_rotinas').update<ModeloRotina>(id, data, {
      expand: 'cliente,criado_por',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('modelos_rotinas').delete(id)
  },

  /**
   * Adiciona itens a um modelo existente
   */
  async addItens(
    modeloId: string,
    itens: Array<{
      nome: string
      responsavel?: string
      funcao_nome?: string
      frequencia: FrequenciaRotina
      horario_limite?: string
      ferramenta?: string
      validacao?: string
      area?: string
      observacoes?: string
    }>,
  ): Promise<void> {
    for (const item of itens) {
      await pb.collection('modelos_rotinas_itens').create({
        modelo: modeloId,
        nome: item.nome,
        responsavel: item.responsavel || '',
        funcao_nome: item.funcao_nome || '',
        frequencia: item.frequencia,
        horario_limite: item.horario_limite || '',
        ferramenta: item.ferramenta || '',
        validacao: item.validacao || '',
        area: item.area || '',
        observacoes: item.observacoes || '',
      })
    }
  },

  /**
   * Salva todas as rotinas de uma loja como um novo modelo reutilizável
   */
  async salvarLojaComoModelo(params: {
    lojaId: string
    nomeModelo: string
    segmento?: string
    descricao?: string
    clienteId?: string
    criadoPorId?: string
  }): Promise<{ modelo: ModeloRotina; totalRotinas: number }> {
    const { lojaId, nomeModelo, segmento, descricao, clienteId, criadoPorId } = params

    // 1. Buscar todas as rotinas da loja com expansão da função
    const rotinas = await pb.collection('rotinas').getFullList<Rotina>({
      filter: `loja = "${lojaId}"`,
      expand: 'funcao',
    })

    // 2. Criar o modelo
    const modelo = await pb.collection('modelos_rotinas').create<ModeloRotina>({
      nome: nomeModelo,
      cliente: clienteId || undefined,
      segmento: segmento || undefined,
      descricao:
        descricao || `Criado a partir da loja em ${new Date().toLocaleDateString('pt-BR')}`,
      criado_por: criadoPorId || undefined,
    })

    // 3. Clonar cada rotina como item do modelo
    for (const r of rotinas) {
      const funcaoNome = r.expand?.funcao?.nome || ''
      await pb.collection('modelos_rotinas_itens').create({
        modelo: modelo.id,
        nome: r.nome,
        responsavel: r.responsavel || '',
        funcao_nome: funcaoNome,
        frequencia: r.frequencia || 'Diária',
        horario_limite: r.horario_limite || '',
        ferramenta: r.ferramenta || '',
        validacao: r.validacao || '',
        area: r.area || '',
        observacoes: r.observacoes || '',
      })
    }

    return { modelo, totalRotinas: rotinas.length }
  },

  /**
   * Salva uma lista de rotinas (ex: oriundas de importação de planilha) como um modelo
   */
  async salvarImportacaoComoModelo(params: {
    nomeModelo: string
    descricao?: string
    segmento?: string
    clienteId?: string
    criadoPorId?: string
    itens: Array<{
      nome: string
      responsavel?: string
      funcao_nome?: string
      frequencia: FrequenciaRotina
      horario_limite?: string
      ferramenta?: string
      validacao?: string
      area?: string
      observacoes?: string
    }>
  }): Promise<ModeloRotina> {
    const { nomeModelo, descricao, segmento, clienteId, criadoPorId, itens } = params

    const modelo = await pb.collection('modelos_rotinas').create<ModeloRotina>({
      nome: nomeModelo,
      cliente: clienteId || undefined,
      segmento: segmento || undefined,
      descricao:
        descricao ||
        `Criado via importação de planilha em ${new Date().toLocaleDateString('pt-BR')}`,
      criado_por: criadoPorId || undefined,
    })

    for (const it of itens) {
      await pb.collection('modelos_rotinas_itens').create({
        modelo: modelo.id,
        nome: it.nome,
        responsavel: it.responsavel || '',
        funcao_nome: it.funcao_nome || '',
        frequencia: it.frequencia,
        horario_limite: it.horario_limite || '',
        ferramenta: it.ferramenta || '',
        validacao: it.validacao || '',
        area: it.area || '',
        observacoes: it.observacoes || '',
      })
    }

    return modelo
  },

  /**
   * Aplica um modelo a uma loja de destino:
   * - Clona os itens do modelo para a coleção rotinas
   * - Resolve funções existentes por nome dentro da loja de destino ou cria se não existir
   * - Suporta substituir ou adicionar
   */
  async aplicarModeloNaLoja(
    options: AplicarModeloOptions,
  ): Promise<{ totalAplicadas: number; ignoradasOuAtualizadas: number }> {
    const { modeloId, lojaId, modo, deduplicar = true, onProgress } = options

    onProgress?.('Carregando itens do modelo...')
    const itens = await pb.collection('modelos_rotinas_itens').getFullList<ModeloRotinaItem>({
      filter: `modelo = "${modeloId}"`,
      sort: 'horario_limite,nome',
    })

    if (itens.length === 0) {
      throw new Error('Este modelo não possui nenhuma rotina cadastrada.')
    }

    // Se modo for "replace", apagar rotinas existentes da loja de destino
    if (modo === 'replace') {
      onProgress?.('Removendo rotinas existentes da loja de destino...')
      const existentes = await pb.collection('rotinas').getFullList<{ id: string }>({
        filter: `loja = "${lojaId}"`,
        fields: 'id',
      })
      for (const ex of existentes) {
        try {
          await pb.collection('rotinas').delete(ex.id)
        } catch (e) {
          console.error('Erro ao deletar rotina anterior:', ex.id, e)
        }
      }
    }

    // Mapear rotinas já existentes na loja para prevenir duplicidade no modo append
    const rotinasExistentesNaLoja =
      modo === 'append'
        ? await pb.collection('rotinas').getFullList<Rotina>({
            filter: `loja = "${lojaId}" || loja = ""`,
          })
        : []

    // Helper para gerar assinatura de uma rotina
    const buildSignature = (
      nome: string,
      horario: string | undefined,
      resp: string | undefined,
      area: string | undefined,
    ) => {
      const n = (nome || '').trim().toLowerCase()
      const h = (horario || '').trim().toLowerCase()
      const r = (resp || '').trim().toLowerCase()
      const a = (area || '').trim().toLowerCase()
      return `${n}:::${h}:::${r}:::${a}`
    }

    const assinaturasExistentes = new Map<string, string>() // assinatura -> id existente
    for (const ex of rotinasExistentesNaLoja) {
      const sig = buildSignature(ex.nome, ex.horario_limite, ex.responsavel, ex.area)
      assinaturasExistentes.set(sig, ex.id)
      // Chave alternativa apenas por nome minúsculo para segurança adicional caso horário seja idêntico
      assinaturasExistentes.set(
        `${(ex.nome || '').trim().toLowerCase()}:::${(ex.horario_limite || '').trim().toLowerCase()}`,
        ex.id,
      )
    }

    // Carregar funções já existentes na loja de destino para resolver por nome
    onProgress?.('Mapeando funções operacionais da loja...')
    const funcoesLoja = await pb.collection('funcoes').getFullList<Funcao>({
      filter: `loja = "${lojaId}"`,
    })

    // Mapa de nome minúsculo para ID da função
    const funcaoMap = new Map<string, string>()
    for (const fn of funcoesLoja) {
      funcaoMap.set(fn.nome.trim().toLowerCase(), fn.id)
    }

    let contador = 0
    let criadas = 0
    let ignoradasOuAtualizadas = 0

    for (const it of itens) {
      contador++
      onProgress?.(`Processando rotina ${contador} de ${itens.length}: ${it.nome}...`)

      // Checar se já existe rotina idêntica na loja de destino (anti-duplicação)
      if (modo === 'append' && deduplicar) {
        const sigCompleta = buildSignature(it.nome, it.horario_limite, it.responsavel, it.area)
        const sigSimples = `${(it.nome || '').trim().toLowerCase()}:::${(it.horario_limite || '').trim().toLowerCase()}`

        const idExistente =
          assinaturasExistentes.get(sigCompleta) || assinaturasExistentes.get(sigSimples)

        if (idExistente) {
          // Atualiza as observações e ferramenta da existente em vez de clonar de novo
          try {
            await pb.collection('rotinas').update(idExistente, {
              frequencia: it.frequencia || 'Diária',
              ferramenta: it.ferramenta || '',
              validacao: it.validacao || '',
              area: it.area || '',
              observacoes: it.observacoes || '',
            })
          } catch (e) {
            console.warn('Erro ao atualizar rotina já existente:', idExistente, e)
          }
          ignoradasOuAtualizadas++
          continue
        }
      }

      // Resolver função responsável
      let funcaoId: string | undefined = undefined
      const nomeFuncaoDesejada = (it.funcao_nome || it.responsavel || '').trim()

      if (nomeFuncaoDesejada) {
        const chave = nomeFuncaoDesejada.toLowerCase()
        if (funcaoMap.has(chave)) {
          funcaoId = funcaoMap.get(chave)
        } else {
          // Criar função na loja de destino para não quebrar vínculo
          try {
            const novaFuncao = await pb.collection('funcoes').create<Funcao>({
              nome: nomeFuncaoDesejada,
              loja: lojaId,
            })
            funcaoId = novaFuncao.id
            funcaoMap.set(chave, novaFuncao.id)
          } catch (e) {
            console.warn('Não foi possível criar função automática:', nomeFuncaoDesejada, e)
            funcaoId = undefined
          }
        }
      }

      // Criar a rotina na loja
      const novaRotina = await pb.collection('rotinas').create({
        nome: it.nome,
        responsavel: it.responsavel || it.funcao_nome || 'Geral',
        frequencia: it.frequencia || 'Diária',
        horario_limite: it.horario_limite || '',
        ferramenta: it.ferramenta || '',
        validacao: it.validacao || '',
        area: it.area || '',
        observacoes: it.observacoes || '',
        status: 'Ativa',
        loja: lojaId,
        funcao: funcaoId || undefined,
      })

      // Registrar nova assinatura criada para evitar duplicar itens repetidos no próprio modelo
      const sigCriada = buildSignature(it.nome, it.horario_limite, it.responsavel, it.area)
      assinaturasExistentes.set(sigCriada, novaRotina.id)
      criadas++
    }

    onProgress?.('Modelo aplicado com sucesso!')
    return { totalAplicadas: criadas, ignoradasOuAtualizadas }
  },
}
