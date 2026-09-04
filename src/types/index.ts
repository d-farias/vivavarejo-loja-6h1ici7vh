export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
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

export interface Rotina {
  id: string
  nome: string
  responsavel: string
  frequencia: FrequenciaRotina
  horario_limite?: string
  ferramenta?: string
  validacao?: string
  status?: StatusRotina
  observacoes?: string
  area?: string
  created: string
  updated: string
}

import type { RecordModel } from 'pocketbase'

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
