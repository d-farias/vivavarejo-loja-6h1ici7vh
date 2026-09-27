import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { clientesService } from '@/services/clientes'
import {
  configuracoesService,
  DEFAULT_CONTATO_EMAIL,
  DEFAULT_CONTATO_WHATSAPP,
  DEFAULT_CONTATO_NOME,
} from '@/services/configuracoes'
import { formatPhoneBR, sanitizePhoneForWaMe } from '@/lib/phone-utils'
import type { ContatosAtendimento } from '@/types'

export function useContatosAtendimento(clienteIdParam?: string): {
  contatos: ContatosAtendimento
  loading: boolean
  refetch: () => Promise<void>
} {
  const { user } = useAuth()
  const [contatos, setContatos] = useState<ContatosAtendimento>(() => ({
    email: DEFAULT_CONTATO_EMAIL,
    whatsapp: DEFAULT_CONTATO_WHATSAPP,
    whatsappRaw: sanitizePhoneForWaMe(DEFAULT_CONTATO_WHATSAPP),
    nomeAtendente: DEFAULT_CONTATO_NOME,
    origem: 'global',
  }))
  const [loading, setLoading] = useState(true)

  const carregarContatos = async () => {
    try {
      // 1. Determina se há um cliente/rede contextual:
      // se passado explicitamente via parâmetro ou vindo do usuário autenticado (user.cliente)
      const targetClienteId = clienteIdParam || user?.cliente

      // Busca configuração global primeiro (ou em paralelo)
      const globalConfig = await configuracoesService.getGlobal().catch(() => null)
      const rawGlobalEmail = globalConfig?.email_suporte?.trim()
      // Blindagem estrita: nunca expor e-mail pessoal do gestor dfarias53@gmail.com como contato
      const globalEmail =
        rawGlobalEmail && rawGlobalEmail.toLowerCase() !== 'dfarias53@gmail.com'
          ? rawGlobalEmail
          : DEFAULT_CONTATO_EMAIL
      const globalWhatsapp = globalConfig?.whatsapp_suporte?.trim() || DEFAULT_CONTATO_WHATSAPP
      const globalNome = globalConfig?.nome_atendimento?.trim() || DEFAULT_CONTATO_NOME

      if (targetClienteId) {
        try {
          const cliente = await clientesService.getById(targetClienteId)
          // Se o cliente/rede tiver contatos próprios configurados, prioriza-os
          const rawEmailRede = cliente.email_suporte?.trim()
          const emailRede =
            rawEmailRede && rawEmailRede.toLowerCase() !== 'dfarias53@gmail.com'
              ? rawEmailRede
              : undefined
          const whatsappRede = cliente.whatsapp_suporte?.trim()
          const nomeRedeAtendente = cliente.nome_atendimento?.trim()

          if (emailRede || whatsappRede || nomeRedeAtendente) {
            const finalEmail = emailRede || globalEmail
            const finalWhatsapp = whatsappRede || globalWhatsapp
            const finalNome = nomeRedeAtendente || cliente.nome || globalNome

            setContatos({
              email:
                finalEmail.toLowerCase() === 'dfarias53@gmail.com'
                  ? DEFAULT_CONTATO_EMAIL
                  : finalEmail,
              whatsapp: formatPhoneBR(finalWhatsapp),
              whatsappRaw: sanitizePhoneForWaMe(finalWhatsapp),
              nomeAtendente: finalNome,
              origem: 'rede',
              nomeRede: cliente.nome,
            })
            setLoading(false)
            return
          }
        } catch (_) {
          // Fallback para global se não encontrar o cliente
        }
      }

      // Fallback global
      setContatos({
        email:
          globalEmail.toLowerCase() === 'dfarias53@gmail.com' ? DEFAULT_CONTATO_EMAIL : globalEmail,
        whatsapp: formatPhoneBR(globalWhatsapp),
        whatsappRaw: sanitizePhoneForWaMe(globalWhatsapp),
        nomeAtendente: globalNome,
        origem: 'global',
      })
    } catch (err) {
      console.warn('Erro ao carregar contatos de atendimento:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarContatos()
  }, [clienteIdParam, user?.cliente])

  return {
    contatos,
    loading,
    refetch: carregarContatos,
  }
}
