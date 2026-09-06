import type { RecordModel } from 'pocketbase'

export type PerfilUsuario = 'admin' | 'lider' | 'funcionario'

export interface User extends RecordModel {
  id: string
  email: string
  name?: string
  avatar?: string
  perfil?: PerfilUsuario
  ativo?: boolean
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
  envio_semanal?: boolean
  created: string
  updated: string
}

export interface Loja extends RecordModel {
  nome: string
  cliente: string
  codigo?: string
  observacoes?: string
  email_regional?: string
  alertas_ativos?: boolean
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
  alerta_enviado_em?: string
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

export interface ModeloRotina extends RecordModel {
  nome: string
  cliente?: string
  descricao?: string
  criado_por?: string
  created: string
  updated: string
  expand?: {
    cliente?: Cliente
    criado_por?: User
  }
}

export interface ModeloRotinaItem extends RecordModel {
  modelo: string
  nome: string
  responsavel?: string
  funcao_nome?: string
  frequencia: FrequenciaRotina
  horario_limite?: string
  ferramenta?: string
  validacao?: string
  area?: string
  observacoes?: string
  created: string
  updated: string
  expand?: {
    modelo?: ModeloRotina
  }
}

export interface ModeloComContagem extends ModeloRotina {
  totalItens?: number
}
