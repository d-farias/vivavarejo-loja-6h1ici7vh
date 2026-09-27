import React, { useState, useEffect } from 'react'
import {
  X,
  Headphones,
  Mail,
  Phone,
  Building2,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { formatPhoneBR, sanitizePhoneForWaMe } from '@/lib/phone-utils'
import { configuracoesService } from '@/services/configuracoes'
import { clientesService } from '@/services/clientes'
import type { Cliente, ConfiguracaoSistema } from '@/types'

interface ContatosAtendimentoModalProps {
  open: boolean
  onClose: () => void
  isAdminGeral: boolean
  isAdmRede: boolean
  clientes: Cliente[]
  redeUsuarioId?: string
  onSaved: () => void
}

export const ContatosAtendimentoModal: React.FC<ContatosAtendimentoModalProps> = ({
  open,
  onClose,
  isAdminGeral,
  isAdmRede,
  clientes,
  redeUsuarioId,
  onSaved,
}) => {
  // Aba ativa: 'global' (ADM Geral apenas) ou id do cliente/rede selecionado
  const [selectedTarget, setSelectedTarget] = useState<string>('global')
  const [globalConfig, setGlobalConfig] = useState<ConfiguracaoSistema | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Campos do formulário
  const [emailSuporte, setEmailSuporte] = useState('')
  const [whatsappSuporte, setWhatsappSuporte] = useState('')
  const [nomeAtendimento, setNomeAtendimento] = useState('')

  // Inicializa target dependendo do perfil
  useEffect(() => {
    if (!open) return

    if (isAdminGeral) {
      setSelectedTarget('global')
    } else if (isAdmRede && redeUsuarioId) {
      setSelectedTarget(redeUsuarioId)
    } else if (clientes.length > 0) {
      setSelectedTarget(clientes[0].id)
    }
  }, [open, isAdminGeral, isAdmRede, redeUsuarioId, clientes])

  // Carrega configuração global e atualiza campos ao mudar target
  useEffect(() => {
    if (!open) return

    let isMounted = true
    const loadGlobal = async () => {
      setLoading(true)
      try {
        const cfg = await configuracoesService.getGlobal()
        if (isMounted) {
          setGlobalConfig(cfg)
        }
      } catch (err) {
        console.error('Erro ao carregar configuracoes_sistema:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadGlobal()
    return () => {
      isMounted = false
    }
  }, [open])

  // Preenche os campos conforme o target selecionado
  useEffect(() => {
    if (selectedTarget === 'global') {
      const gEmail = globalConfig?.email_suporte?.trim()
      setEmailSuporte(
        gEmail && gEmail.toLowerCase() !== 'dfarias53@gmail.com'
          ? gEmail
          : 'contato@vivavarejo.com',
      )
      setWhatsappSuporte(formatPhoneBR(globalConfig?.whatsapp_suporte || '(48) 99181-7542'))
      setNomeAtendimento(globalConfig?.nome_atendimento || '')
    } else {
      const cli = clientes.find((c) => c.id === selectedTarget)
      if (cli) {
        const cEmail = cli.email_suporte?.trim() || ''
        setEmailSuporte(cEmail.toLowerCase() === 'dfarias53@gmail.com' ? '' : cEmail)
        setWhatsappSuporte(formatPhoneBR(cli.whatsapp_suporte || ''))
        setNomeAtendimento(cli.nome_atendimento || '')
      }
    }
  }, [selectedTarget, globalConfig, clientes])

  if (!open) return null

  const selectedClienteObj = clientes.find((c) => c.id === selectedTarget)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappSuporte(formatPhoneBR(e.target.value))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      const cleanEmail = emailSuporte.trim().toLowerCase()
      const cleanWhatsapp = whatsappSuporte.trim()
      const cleanNome = nomeAtendimento.trim()

      if (selectedTarget === 'global') {
        if (!isAdminGeral) {
          throw new Error('Apenas o ADM Geral pode alterar o padrão global do sistema.')
        }

        const updated = await configuracoesService.saveGlobal({
          email_suporte: cleanEmail,
          whatsapp_suporte: cleanWhatsapp,
          nome_atendimento: cleanNome,
        })
        setGlobalConfig(updated)
        setFeedback({
          type: 'success',
          msg: 'Contatos de atendimento padrão global atualizados com sucesso!',
        })
      } else {
        // Salvar na rede/cliente
        await clientesService.update(selectedTarget, {
          email_suporte: cleanEmail,
          whatsapp_suporte: cleanWhatsapp,
          nome_atendimento: cleanNome,
        })
        setFeedback({
          type: 'success',
          msg: `Contatos de atendimento da rede "${selectedClienteObj?.nome || ''}" salvos com sucesso!`,
        })
      }

      onSaved()
      setTimeout(() => {
        setFeedback(null)
      }, 3500)
    } catch (err: any) {
      console.error('Erro ao salvar contatos de atendimento:', err)
      setFeedback({
        type: 'error',
        msg: err?.message || 'Erro ao salvar contatos de atendimento.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-5 sm:p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] leading-tight">
                Contatos de Atendimento & Especialista
              </h2>
              <p className="text-xs text-[#6B7280]">
                {isAdminGeral
                  ? 'Defina o padrão global da plataforma ou personalize contatos por rede/cliente'
                  : 'Configure o WhatsApp e e-mail de suporte exclusivos da sua rede'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Seletor de Escopo: Global vs Redes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#374151]">
            Configurar contatos para:
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdminGeral && (
              <button
                type="button"
                onClick={() => setSelectedTarget('global')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedTarget === 'global'
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                    : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Padrão Global (Landing Page & Visitantes)</span>
              </button>
            )}

            {clientes.map((c) => {
              const isSelected = selectedTarget === c.id
              const hasCustom = Boolean(c.email_suporte || c.whatsapp_suporte)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedTarget(c.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{c.nome}</span>
                  {hasCustom && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                      title="Possui contatos próprios configurados"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Explicação contextual */}
        <div className="p-3 rounded-lg bg-gray-50 border border-[#E5E7EB] text-xs text-[#4B5563] space-y-1 leading-relaxed">
          {selectedTarget === 'global' ? (
            <p>
              Estes são os contatos principais da consultoria <strong>VivaVarejo</strong>, exibidos
              no rodapé público da página inicial (<code>/bem-vindo</code>) e para usuários sem rede
              específica.
            </p>
          ) : (
            <p>
              Ao configurar contatos para <strong>{selectedClienteObj?.nome}</strong>, os usuários e
              líderes vinculados a esta rede verão estes canais ao clicar em &ldquo;Falar com
              especialista&rdquo;. Se deixados em branco, o sistema utilizará o padrão global.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs sm:text-sm">
          {/* Nome do Especialista / Atendente */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Nome do Especialista / Responsável pelo Atendimento
            </label>
            <input
              type="text"
              value={nomeAtendimento}
              onChange={(e) => setNomeAtendimento(e.target.value)}
              placeholder={
                selectedTarget === 'global'
                  ? 'Ex: Suporte Operacional'
                  : `Ex: Suporte Operacional ${selectedClienteObj?.nome || ''}`
              }
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Aparece na saudação do modal (&ldquo;Olá, [Nome]...&rdquo;).
            </p>
          </div>

          {/* E-mail de Suporte */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>E-mail de Suporte e Atendimento</span>
            </label>
            <input
              type="email"
              value={emailSuporte}
              onChange={(e) => setEmailSuporte(e.target.value)}
              placeholder="suporte@vivavarejo.com.br"
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* WhatsApp de Atendimento */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp de Atendimento (com DDD)</span>
            </label>
            <input
              type="text"
              value={whatsappSuporte}
              onChange={handlePhoneChange}
              placeholder="(48) 99181-7542"
              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Ao clicar no botão de WhatsApp, a conversa será iniciada para este número (
              {sanitizePhoneForWaMe(whatsappSuporte) || 'padrão nacional'}).
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
            {selectedTarget !== 'global' && (
              <button
                type="button"
                onClick={() => {
                  setEmailSuporte('')
                  setWhatsappSuporte('')
                  setNomeAtendimento('')
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Limpar (Usar padrão global)
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#1F2937] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white rounded-md shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Salvando...' : 'Salvar Contatos'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
