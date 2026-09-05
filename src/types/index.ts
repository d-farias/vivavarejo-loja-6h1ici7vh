import type { RecordModel } from 'pocketbase'

export type PerfilUsuario = 'admin' | 'lider' | 'funcionario'

export interface User extends RecordModel {
  id: string
  email: string
  name?: string
  avatar?: string
  perfil?: PerfilUsuario
  created: string
  updated: string
}

export type FrequenciaRotina =
  | 'Diária'
  | 'Semanal'
  | 'Conforme vendas'
  | 'Rotinas'
  | 'A cada recebimento'

export type StatusRotina = 'Ativa' | 'Pendente' | 'Concluída'

export interface Cliente extends RecordModel {
  nome: string
  contato?: string
  observacoes?: string
  created: string
  updated: string
}

export interface Loja extends RecordModel {
  nome: string
  cliente: string
  codigo?: string
  observacoes?: string
  created: string
  updated: string
  expand?: {
    cliente?: Cliente
  }
}

export interface Funcao extends RecordModel {
  nome: string
  loja: string
  created: string
  updated: string
  expand?: {
    loja?: Loja
  }
}

export interface Funcionario extends RecordModel {
  nome: string
  funcao: string
  loja: string
  usuario?: string
  ativo?: boolean
  created: string
  updated: string
  expand?: {
    funcao?: Funcao
    loja?: Loja
    usuario?: User
  }
}

export interface Rotina extends RecordModel {
  nome: string
  responsavel: string
  frequencia: FrequenciaRotina
  horario_limite?: string
  ferramenta?: string
  validacao?: string
  status?: StatusRotina
  observacoes?: string
  area?: string
  loja?: string
  funcao?: string
  expand?: {
    loja?: Loja
    funcao?: Funcao
  }
}

export interface ExecucaoRotina extends RecordModel {
  rotina: string
  usuario: string
  data_execucao: string // formato YYYY-MM-DD
  concluida: boolean
  expand?: {
    rotina?: Rotina
    usuario?: User
  }
}
