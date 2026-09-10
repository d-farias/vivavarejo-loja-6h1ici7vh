import pb from '@/lib/pocketbase/client'
import type { Funcionario, User, PerfilUsuario } from '@/types'

export const funcionariosService = {
  async getAll(): Promise<Funcionario[]> {
    return await pb.collection('funcionarios').getFullList<Funcionario>({
      sort: 'nome',
      expand: 'funcao,loja,loja.cliente,usuario',
    })
  },

  async getByLoja(lojaId: string): Promise<Funcionario[]> {
    return await pb.collection('funcionarios').getFullList<Funcionario>({
      filter: `loja = "${lojaId}"`,
      sort: 'nome',
      expand: 'funcao,loja,usuario',
    })
  },

  async getByUsuario(userId: string): Promise<Funcionario[]> {
    return await pb.collection('funcionarios').getFullList<Funcionario>({
      filter: `usuario = "${userId}"`,
      expand: 'funcao,loja,loja.cliente',
    })
  },

  async getById(id: string): Promise<Funcionario> {
    return await pb.collection('funcionarios').getOne<Funcionario>(id, {
      expand: 'funcao,loja,usuario',
    })
  },

  async create(data: {
    nome: string
    funcao: string
    loja: string
    telefone?: string
    usuario?: string
    ativo?: boolean
  }): Promise<Funcionario> {
    return await pb.collection('funcionarios').create<Funcionario>(data, {
      expand: 'funcao,loja,usuario',
    })
  },

  async update(id: string, data: Partial<Funcionario>): Promise<Funcionario> {
    return await pb.collection('funcionarios').update<Funcionario>(id, data, {
      expand: 'funcao,loja,usuario',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('funcionarios').delete(id)
  },
}

export const usersService = {
  async getAll(): Promise<User[]> {
    return await pb.collection('users').getFullList<User>({
      sort: 'name,email',
      expand: 'cliente',
    })
  },

  async updatePerfil(userId: string, perfil: PerfilUsuario): Promise<User> {
    return await pb.collection('users').update<User>(userId, { perfil })
  },

  async update(userId: string, data: Partial<User>): Promise<User> {
    const user = await pb.collection('users').update<User>(userId, data)
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'alteracao',
        modulo: 'usuarios',
        registro_id: userId,
        detalhes: `Usuário atualizado: ${user.name || user.email}`,
      })
    } catch {
      /* intentionally ignored */
    }
    return user
  },

  async create(data: {
    email: string
    password: string
    passwordConfirm: string
    name: string
    perfil: PerfilUsuario
    cliente?: string
    telefone?: string
    ativo?: boolean
  }): Promise<User> {
    const user = await pb.collection('users').create<User>(data)
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'criacao',
        modulo: 'usuarios',
        registro_id: user.id,
        clienteId: user.cliente,
        detalhes: `Usuário criado: ${user.name} (${user.email}, perfil: ${user.perfil})`,
      })
    } catch {
      /* intentionally ignored */
    }
    return user
  },

  async resetPassword(userId: string, novaSenha: string): Promise<User> {
    const user = await pb.collection('users').update<User>(userId, {
      password: novaSenha,
      passwordConfirm: novaSenha,
    })
    try {
      const { auditoriaService } = await import('@/services/auditoria')
      auditoriaService.registrar({
        acao: 'troca_senha',
        modulo: 'usuarios',
        registro_id: userId,
        detalhes: `Senha do usuário resetada pelo administrador (${user.email})`,
      })
    } catch {
      /* intentionally ignored */
    }
    return user
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    return await pb.collection('users').requestPasswordReset(email.trim())
  },

  async toggleAtivo(userId: string, ativoAtual?: boolean): Promise<User> {
    const novoStatus = ativoAtual === false ? true : false
    return await pb.collection('users').update<User>(userId, { ativo: novoStatus })
  },
}
