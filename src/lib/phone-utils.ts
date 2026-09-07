/**
 * Utilitários para formatação e manipulação de telefones brasileiros e links WhatsApp
 */

/**
 * Aplica máscara de telefone brasileiro: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
 */
export function formatPhoneBR(value: string | undefined | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')

  // Se já veio com código do país 55 e tem mais de 11 dígitos, remove o 55 inicial
  const clean = digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits

  if (clean.length <= 2) {
    return clean.length > 0 ? `(${clean}` : ''
  }
  if (clean.length <= 6) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2)}`
  }
  if (clean.length <= 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
  }
  // 11 dígitos (celular padrão BR)
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`
}

/**
 * Limpa o telefone para dígitos com DDI 55 para uso em links wa.me
 */
export function sanitizePhoneForWaMe(phone: string | undefined | null): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (!digits) return ''

  // Se tiver 10 ou 11 dígitos (DDD + número), prefixa com 55 (Brasil)
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`
  }
  return digits
}

export interface AlertaWhatsAppParams {
  lojaNome?: string
  tarefaNome: string
  setorOuArea?: string
  horarioLimiteOuJanela?: string
  status?: string
  destinatarioPapel?: 'responsavel' | 'chefe' | 'gerente' | 'validador'
}

/**
 * Gera o texto sóbrio e profissional do alerta para WhatsApp
 */
export function gerarMensagemAlertaWhatsApp(params: AlertaWhatsAppParams): string {
  const loja = params.lojaNome ? `*Loja:* ${params.lojaNome}\n` : ''
  const setor = params.setorOuArea ? `*Setor/Área:* ${params.setorOuArea}\n` : ''
  const horario = params.horarioLimiteOuJanela ? `*Horário:* ${params.horarioLimiteOuJanela}\n` : ''
  const statusStr = params.status
    ? `*Situação:* ${params.status}\n`
    : '*Situação:* Atenção necessária\n'
  const papel =
    params.destinatarioPapel === 'chefe'
      ? 'Aviso ao Chefe Imediato / Gerência:'
      : 'Aviso ao Responsável Direto:'

  return `🔔 *VIVAVAREJO — ALERTA OPERACIONAL*\n${papel}\n\n*Tarefa:* ${params.tarefaNome}\n${loja}${setor}${horario}${statusStr}\nTarefa não foi aberta no sistema e está pendente. Por favor, acesse o VivaVarejo para verificar e registrar o andamento.`
}

/**
 * Cria a URL do WhatsApp (wa.me) para envio direto com mensagem pré-preenchida
 */
export interface BuildWhatsAppLinkOptions {
  loja?: string
  tarefa: string
  setor?: string
  horario?: string
  situacao?: string
  telefone: string
  destinatario?: string
}

/**
 * Cria a URL do WhatsApp (wa.me) para envio direto com mensagem pré-preenchida
 * Suporta assinatura por objeto de opções ou direta (phone, text).
 */
export function buildWhatsAppLink(
  optionsOrPhone: BuildWhatsAppLinkOptions | string | undefined | null,
  rawText?: string,
): string {
  if (typeof optionsOrPhone === 'object' && optionsOrPhone !== null) {
    const opts = optionsOrPhone
    const text = gerarMensagemAlertaWhatsApp({
      lojaNome: opts.loja,
      tarefaNome: opts.tarefa,
      setorOuArea: opts.setor,
      horarioLimiteOuJanela: opts.horario,
      status: opts.situacao,
      destinatarioPapel: opts.destinatario?.toLowerCase().includes('chefe')
        ? 'chefe'
        : 'responsavel',
    })
    const sanitized = sanitizePhoneForWaMe(opts.telefone)
    const encodedText = encodeURIComponent(text)
    if (!sanitized) {
      return `https://wa.me/?text=${encodedText}`
    }
    return `https://wa.me/${sanitized}?text=${encodedText}`
  }

  const phone = typeof optionsOrPhone === 'string' ? optionsOrPhone : undefined
  const sanitized = sanitizePhoneForWaMe(phone)
  const encodedText = encodeURIComponent(rawText || '')
  if (!sanitized) {
    return `https://wa.me/?text=${encodedText}`
  }
  return `https://wa.me/${sanitized}?text=${encodedText}`
}
