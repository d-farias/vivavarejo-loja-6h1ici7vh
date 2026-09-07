import pb from '@/lib/pocketbase/client'
import type { Atendimento, EncontrouSolucao, PrazoContato } from '@/types'

export interface CreateAtendimentoData {
  usuario?: string
  cliente_nome?: string
  email?: string
  encontrou_solucao?: EncontrouSolucao
  no_que_podemos_ajudar?: string
  prazo_contato?: PrazoContato
  maiores_dores?: string
  dispensado?: boolean
}

export const atendimentosService = {
  /**
   * Cria registro de atendimento pós-acesso na collection 'atendimentos'
   */
  async create(data: CreateAtendimentoData): Promise<Atendimento> {
    return pb.collection('atendimentos').create<Atendimento>(data)
  },

  /**
   * Verifica se já existe algum registro de atendimento ou dispensa para o usuário
   */
  async getByUsuario(usuarioId: string): Promise<Atendimento | null> {
    try {
      const records = await pb.collection('atendimentos').getList<Atendimento>(1, 1, {
        filter: `usuario = "${usuarioId}"`,
        sort: '-created',
      })
      return records.items[0] || null
    } catch {
      return null
    }
  },

  /**
   * Notifica primeiro acesso e navegação ao backend (se ainda não notificado)
   */
  async notificarPrimeiroAcesso(): Promise<{ status: string }> {
    try {
      const res = await pb.send('/api/vivavarejo/primeiro-acesso', {
        method: 'POST',
      })
      return res as { status: string }
    } catch (e) {
      console.warn('Não foi possível notificar primeiro acesso:', e)
      return { status: 'error' }
    }
  },
}
