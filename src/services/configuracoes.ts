import pb from '@/lib/pocketbase/client'
import type { ConfiguracaoSistema } from '@/types'

export const DEFAULT_CONTATO_EMAIL = 'contato@vivavarejo.com'
export const DEFAULT_CONTATO_WHATSAPP = '(48) 99181-7542'
export const DEFAULT_CONTATO_NOME = ''

export const configuracoesService = {
  /**
   * Obtém a configuração global do sistema (chave = "global")
   */
  async getGlobal(): Promise<ConfiguracaoSistema | null> {
    try {
      return await pb
        .collection('configuracoes_sistema')
        .getFirstListItem<ConfiguracaoSistema>('chave = "global"')
    } catch (_) {
      return null
    }
  },

  /**
   * Atualiza ou cria a configuração global do sistema (apenas Admin Geral)
   */
  async saveGlobal(data: {
    email_suporte?: string
    whatsapp_suporte?: string
    nome_atendimento?: string
  }): Promise<ConfiguracaoSistema> {
    const existing = await this.getGlobal()
    if (existing) {
      return await pb
        .collection('configuracoes_sistema')
        .update<ConfiguracaoSistema>(existing.id, data)
    }

    return await pb.collection('configuracoes_sistema').create<ConfiguracaoSistema>({
      chave: 'global',
      ...data,
    })
  },
}
