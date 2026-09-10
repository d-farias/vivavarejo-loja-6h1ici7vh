import type { RecordModel } from 'pocketbase'

export type PerfilUsuario = 'admin' | 'adm_rede' | 'lider' | 'funcionario' | 'regional'

export interface User extends RecordModel {
  id: string
  email: string
  name?: string
  avatar?: string
  telefone?: string
  perfil?: PerfilUsuario
  cliente?: string // ID do Cliente/Rede vinculado (obrigatório para adm_rede)
  ativo?: boolean
  primeiro_acesso_notificado?: boolean
  created: string
  updated: string
  expand?: {
    cliente?: Cliente
  }
}

export type FrequenciaRotina =
  | 'Diária'
  | 'Semanal'
  | 'Conforme vendas'
  | 'Rotinas'
  | 'A cada recebimento'

export type StatusRotina = 'Ativa' | 'Pendente' | 'Concluída'

export type TipoPessoaCliente = 'PF' | 'PJ'

export type SituacaoInventario = 'rotativo' | 'anual' | 'sem_controle'

export interface Cliente extends RecordModel {
  nome: string
  contato?: string
  observacoes?: string
  envio_semanal?: boolean
  tipo_pessoa?: TipoPessoaCliente
  segmento?: string
  info_negocio?: string
  gargalos?: string
  inventario_situacao?: string
  email_suporte?: string
  whatsapp_suporte?: string
  nome_atendimento?: string
  created: string
  updated: string
}

export interface ConfiguracaoSistema extends RecordModel {
  chave: string
  email_suporte?: string
  whatsapp_suporte?: string
  nome_atendimento?: string
  created: string
  updated: string
}

export interface ContatosAtendimento {
  email: string
  whatsapp: string
  whatsappRaw: string
  nomeAtendente: string
  origem: 'rede' | 'global'
  nomeRede?: string
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
  loja?: string
  telefone?: string
  chefe_imediato_funcao?: string // ID da função que chefia imediatamente esta função
  created: string
  updated: string
  expand?: {
    loja?: Loja
    chefe_imediato_funcao?: Funcao
  }
}

export interface Funcionario extends RecordModel {
  nome: string
  funcao: string
  loja: string
  telefone?: string
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
  telefone_responsavel?: string
  telefone_chefe?: string
  alerta_enviado_em?: string
  prioridade_dia?: number
  adiada_para_data?: string
  adiada_para_horario?: string
  expand?: {
    loja?: Loja
    funcao?: Funcao
  }
}

export type StatusValidacaoRotina = 'aguardando_validacao' | 'aprovada' | 'devolvida'

export interface ExecucaoRotina extends RecordModel {
  rotina: string
  usuario: string
  data_execucao: string // formato YYYY-MM-DD
  concluida: boolean
  foto?: string
  status_validacao?: StatusValidacaoRotina
  comentario_validacao?: string
  validado_por?: string
  validado_em?: string
  horario_planejado?: string
  prioridade_dia?: number
  adiada_para_data?: string
  motivo_adiamento?: string
  expand?: {
    rotina?: Rotina
    usuario?: User
    validado_por?: User
  }
}

export type StatusPlanoAcao = 'aberta' | 'em_andamento' | 'concluida'
export type PrioridadePlanoAcao = 'baixa' | 'media' | 'alta'

export type AreaDemandanteChamado =
  | 'Compras'
  | 'Abastecimento'
  | 'RH'
  | 'Marketing'
  | 'Logística'
  | 'Financeiro'
  | 'Operações'
  | 'Prevenção de Perdas'
  | 'Manutenção'
  | 'Outro'

export const AREAS_DEMANDANTES_CHAMADO: AreaDemandanteChamado[] = [
  'Compras',
  'Abastecimento',
  'RH',
  'Marketing',
  'Logística',
  'Financeiro',
  'Operações',
  'Prevenção de Perdas',
  'Manutenção',
]

export interface PlanoAcao extends RecordModel {
  descricao: string
  loja: string
  rotina?: string
  criado_por?: string
  responsavel?: string
  prazo?: string
  status: StatusPlanoAcao
  prioridade: PrioridadePlanoAcao
  area_demandante?: string
  observacoes?: string
  created: string
  updated: string
  expand?: {
    loja?: Loja
    rotina?: Rotina
    criado_por?: User
  }
}

export interface ModeloRotina extends RecordModel {
  nome: string
  cliente?: string
  segmento?: string
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

// ==================== MÓDULO PROMOTORES & FORNECEDORES ====================

export type PoliticaQuebras = 'troca_total' | 'troca_parcial' | 'sem_troca_avaria_loja'

export interface Fornecedor extends RecordModel {
  nome: string
  contato?: string
  telefone?: string
  observacoes?: string
  ativo?: boolean
  cliente?: string
  // Novos campos exigidos pelo usuário (Frente 2)
  comprador_nome?: string
  comprador_telefone?: string
  comprador_email?: string
  comprador_categoria?: string
  layout_descricao?: string
  layout_foto?: string
  frequencia_semanal?: string
  politica_quebras?: PoliticaQuebras
  is_exemplo?: boolean
  created: string
  updated: string
  expand?: {
    cliente?: Cliente
  }
}

export interface Promotor extends RecordModel {
  nome: string
  email?: string
  telefone?: string
  fornecedor: string
  usuario?: string
  ativo?: boolean
  created: string
  updated: string
  expand?: {
    fornecedor?: Fornecedor
    usuario?: User
  }
}

export interface RotinaPromotor extends RecordModel {
  titulo: string
  descricao?: string
  fornecedor?: string
  loja?: string
  frequencia?: string
  ativa?: boolean
  foto_trabalho?: string
  created: string
  updated: string
  expand?: {
    fornecedor?: Fornecedor
    loja?: Loja
  }
}

export type StatusVisitaPromotor = 'agendada' | 'realizada' | 'atrasada' | 'cancelada'

export interface VisitaPromotor extends RecordModel {
  promotor: string
  loja: string
  data_visita: string // YYYY-MM-DD ou ISO
  hora_prevista?: string // ex: "09:00" ou "14:30"
  status: StatusVisitaPromotor
  observacoes?: string
  conclusao_check?: string
  rotinas_executadas?: string
  realizada_em?: string
  registrado_por?: string
  alerta_enviado_em?: string
  // Campos de fluxo e check-in/check-out
  check_in?: string
  check_out?: string
  tempo_permanencia_minutos?: number
  // Novos campos exigidos pelo usuário (Frente 2)
  foto_trabalho?: string
  foto_gondola?: string
  foto_abastecimento?: string
  foto_validades?: string
  checklist_abastecimento_100?: boolean
  checklist_validades_ok?: boolean
  checklist_layout_conforme?: boolean
  quantidade_sortimento?: number
  perc_vendas?: number
  qtd_rupturas?: number
  itens_sem_vendas?: number
  responsavel_execucao?: string
  validador_fiscalizacao?: string
  status_fiscalizacao?: 'pendente' | 'aprovada' | 'devolvida'
  is_exemplo?: boolean
  created: string
  updated: string
  expand?: {
    promotor?: Promotor & {
      expand?: {
        fornecedor?: Fornecedor
      }
    }
    loja?: Loja
    registrado_por?: User
  }
}

// ==================== ATENDIMENTO PÓS-ACESSO INTELIGENTE ====================

export type EncontrouSolucao = 'sim' | 'ficou_duvida' | 'ainda_nao'
export type PrazoContato = 'hoje' | 'esta_semana' | 'so_explorar'

export interface Atendimento extends RecordModel {
  usuario?: string
  cliente_nome?: string
  email?: string
  encontrou_solucao?: EncontrouSolucao
  no_que_podemos_ajudar?: string
  prazo_contato?: PrazoContato
  maiores_dores?: string
  notificado_email?: boolean
  dispensado?: boolean
  created: string
  updated: string
  expand?: {
    usuario?: User
  }
}

// ==================== MÓDULO VALIDADE X CALENDÁRIO ====================

export type StatusTarefaValidade =
  | 'pendente'
  | 'em_andamento'
  | 'aguardando_validacao'
  | 'aprovada'
  | 'devolvida'

export interface TarefaValidade extends RecordModel {
  loja?: string
  setor_categoria: string
  descricao?: string
  semana_mes?: number // 1, 2, 3, 4 (rodízio mensal) ou undefined para todas as semanas
  data_especifica?: string // YYYY-MM-DD
  recorrencia?: string // "diaria", "toda terça", "pontual", etc.
  horario_inicio: string // ex: "09:00" ou "14:00"
  horario_fim?: string // ex: "15:00"
  status?: StatusTarefaValidade
  executor_nome?: string
  executor_usuario?: string
  validador_funcao_nome?: string // ex: "Gerente", "Líder Prevenção"
  validador_funcao?: string
  validador_usuario?: string
  telefone_responsavel?: string
  telefone_chefe?: string
  observacoes?: string
  observacao_execucao?: string
  foto?: string
  concluida_em?: string
  concluida_por?: string
  comentario_validacao?: string
  validado_por?: string
  validado_em?: string
  alerta_previo_enviado_em?: string
  alerta_atraso_enviado_em?: string
  created: string
  updated: string
  expand?: {
    loja?: Loja
    executor_usuario?: User
    validador_funcao?: Funcao
    validador_usuario?: User
    concluida_por?: User
    validado_por?: User
  }
}

// ==================== MÓDULO PERDAS & INVENTÁRIO ====================

export type TipoInventario = 'rotativo' | 'geral'
export type StatusInventario = 'planejado' | 'em_andamento' | 'concluido' | 'cancelado'

export interface Inventario extends RecordModel {
  loja?: string
  data: string // YYYY-MM-DD
  setor_categoria: string
  tipo: TipoInventario
  status: StatusInventario
  itens_contados?: number
  divergencias_encontradas?: number
  acuracidade_percentual?: number
  responsavel_nome?: string
  responsavel_usuario?: string
  observacao?: string
  created: string
  updated: string
  expand?: {
    loja?: Loja
    responsavel_usuario?: User
  }
}

export type MotivoPerda = 'vencimento' | 'avaria' | 'roubo' | 'erro de pedido' | 'outro'

export interface Perda extends RecordModel {
  loja?: string
  data: string // YYYY-MM-DD
  setor_categoria: string
  motivo: MotivoPerda
  item_descricao?: string
  quantidade: number
  valor_estimado: number
  observacao?: string
  foto?: string
  registrado_por?: string
  created: string
  updated: string
  expand?: {
    loja?: Loja
    registrado_por?: User
  }
}
