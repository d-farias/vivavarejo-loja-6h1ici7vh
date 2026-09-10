import pb from '@/lib/pocketbase/client'
import type { Cliente, Loja, User } from '@/types'

export type AcaoAuditoria =
  | 'criacao'
  | 'alteracao'
  | 'exclusao'
  | 'conclusao'
  | 'validacao'
  | 'login'
  | 'troca_senha'

export type ModuloAuditoria =
  | 'rotinas'
  | 'execucoes'
  | 'validades'
  | 'perdas'
  | 'inventarios'
  | 'promotores'
  | 'visitas'
  | 'usuarios'
  | 'lojas'
  | 'configuracoes'

export interface RegistroAuditoria {
  id: string
  usuario?: string
  usuario_nome?: string
  usuario_perfil?: string
  cliente?: string
  loja?: string
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  registro_id?: string
  detalhes?: string
  created: string
  updated: string
  expand?: {
    usuario?: User
    cliente?: Cliente
    loja?: Loja
  }
}

export interface RegistrarAuditoriaParams {
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  registro_id?: string
  detalhes?: string
  lojaId?: string
  clienteId?: string
}

export const auditoriaService = {
  /**
   * Grava um novo log de auditoria no backend PocketBase.
   * Não lança exceção para não bloquear o fluxo da operação principal do usuário caso ocorra falha de rede.
   */
  async registrar(params: RegistrarAuditoriaParams): Promise<RegistroAuditoria | null> {
    try {
      const authUser = pb.authStore.record as unknown as User | null
      const usuarioId = authUser?.id || ''
      const usuarioNome = authUser?.name || authUser?.email || 'Usuário'
      const usuarioPerfil = authUser?.perfil || 'lider'
      const clienteId = params.clienteId || authUser?.cliente || ''

      const record = await pb.collection('auditoria_acoes').create<RegistroAuditoria>({
        usuario: usuarioId || undefined,
        usuario_nome: usuarioNome,
        usuario_perfil: usuarioPerfil,
        cliente: clienteId || undefined,
        loja: params.lojaId || undefined,
        acao: params.acao,
        modulo: params.modulo,
        registro_id: params.registro_id || undefined,
        detalhes: params.detalhes || undefined,
      })
      return record
    } catch (err) {
      console.warn('Falha ao registrar auditoria (silenciosa):', err)
      return null
    }
  },

  /**
   * Lista registros de auditoria com paginação e filtros (para Admin e Adm de Rede)
   */
  async getList(options?: {
    page?: number
    perPage?: number
    clienteId?: string
    lojaId?: string
    modulo?: string
    acao?: string
    usuario?: string
    dataInicio?: string
    dataFim?: string
  }): Promise<{ items: RegistroAuditoria[]; totalItems: number; totalPages: number }> {
    const page = options?.page || 1
    const perPage = options?.perPage || 30

    const filters: string[] = []

    if (options?.clienteId && options.clienteId !== 'todos') {
      filters.push(`cliente = "${options.clienteId}"`)
    }
    if (options?.lojaId && options.lojaId !== 'todas') {
      filters.push(`loja = "${options.lojaId}"`)
    }
    if (options?.modulo && options.modulo !== 'todos') {
      filters.push(`modulo = "${options.modulo}"`)
    }
    if (options?.acao && options.acao !== 'todas') {
      filters.push(`acao = "${options.acao}"`)
    }
    if (options?.usuario && options.usuario !== 'todos') {
      filters.push(`usuario = "${options.usuario}"`)
    }
    if (options?.dataInicio) {
      filters.push(`created >= "${options.dataInicio} 00:00:00"`)
    }
    if (options?.dataFim) {
      filters.push(`created <= "${options.dataFim} 23:59:59"`)
    }

    const filterStr = filters.join(' && ')

    const res = await pb.collection('auditoria_acoes').getList<RegistroAuditoria>(page, perPage, {
      sort: '-created',
      filter: filterStr || undefined,
      expand: 'usuario,cliente,loja',
    })

    return {
      items: res.items,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    }
  },
}
