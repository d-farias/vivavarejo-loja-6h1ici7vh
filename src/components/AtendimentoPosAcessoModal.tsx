import React, { useState } from 'react'
import {
  X,
  HelpCircle,
  Clock,
  AlertTriangle,
  Send,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react'
import type { EncontrouSolucao, PrazoContato } from '@/types'
import { atendimentosService } from '@/services/atendimentos'

interface AtendimentoPosAcessoModalProps {
  isOpen: boolean
  onClose: () => void
  usuarioId?: string
  userEmail?: string
  userName?: string
  clienteNome?: string
  gargalosIniciais?: string
}

export function AtendimentoPosAcessoModal({
  isOpen,
  onClose,
  usuarioId,
  userEmail,
  userName,
  clienteNome,
  gargalosIniciais,
}: AtendimentoPosAcessoModalProps) {
  // 4 Perguntas especificadas pelo usuário:
  // 1. "Encontrou a solução que procura?" (sim / ficou dúvida / ainda não)
  const [encontrouSolucao, setEncontrouSolucao] = useState<EncontrouSolucao | ''>('')

  // 2. "No que podemos ajudar?" (campo livre)
  const [noQueAjudar, setNoQueAjudar] = useState('')

  // 3. "Em qual prazo você gostaria de contato?" (hoje / esta semana / só quero explorar por enquanto)
  const [prazoContato, setPrazoContato] = useState<PrazoContato | ''>('')

  // 4. "Quais as maiores dores hoje na operação e gestão de forma geral?"
  // (campo livre, pré-preenchido com o que ele já informou no cadastro, editável)
  const [maioresDores, setMaioresDores] = useState(gargalosIniciais || '')

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleDismiss = async () => {
    // Salva dispensa no localStorage e no banco de dados para nunca mais incomodar
    if (usuarioId) {
      localStorage.setItem(`vivavarejo_atendimento_dispensado_${usuarioId}`, 'true')
    }
    try {
      await atendimentosService.create({
        usuario: usuarioId,
        email: userEmail,
        cliente_nome: clienteNome,
        dispensado: true,
      })
    } catch {
      /* intentionally ignored */
    }
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await atendimentosService.create({
        usuario: usuarioId,
        email: userEmail,
        cliente_nome: clienteNome,
        encontrou_solucao: encontrouSolucao || undefined,
        no_que_podemos_ajudar: noQueAjudar.trim() || undefined,
        prazo_contato: prazoContato || undefined,
        maiores_dores: maioresDores.trim() || undefined,
        dispensado: false,
      })

      if (usuarioId) {
        localStorage.setItem(`vivavarejo_atendimento_respondido_${usuarioId}`, 'true')
      }

      setSubmitted(true)
      setTimeout(() => {
        onClose()
      }, 2200)
    } catch (err) {
      console.error('Erro ao salvar atendimento pós-acesso:', err)
      // Fecha graciosamente mesmo se houver instabilidade
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-lg border border-[#E5E7EB] shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Sóbrio institucional */}
        <div className="bg-white border-b border-[#E5E7EB] p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  VivaVarejo Consultoria
                </span>
                <span className="text-[11px] text-[#6B7280]">•</span>
                <span className="text-[11px] font-medium text-[#4B5563]">
                  Parceiro de Resultados
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] mt-0.5">
                Bem-vindo{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Queremos ser parceiros dos seus resultados. Como podemos acelerar sua operação?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#F7F7F5] transition-colors"
            title="Dispensar por enquanto"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo / Form */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1F2937]">Obrigado pelo retorno!</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed">
                Recebemos suas respostas e nosso time de consultoria já foi notificado. Estamos à
                disposição para construir os melhores resultados com você.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Pergunta 1: Encontrou a solução que procura? */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Encontrou a solução que procura?</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sim', label: 'Sim' },
                    { id: 'ficou_duvida', label: 'Ficou dúvida' },
                    { id: 'ainda_nao', label: 'Ainda não' },
                  ].map((opt) => {
                    const isSelected = encontrouSolucao === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEncontrouSolucao(opt.id as EncontrouSolucao)}
                        className={`py-2 px-2.5 rounded-md border text-xs font-medium text-center transition-all ${
                          isSelected
                            ? 'border-[#2563EB] bg-blue-50/80 text-[#2563EB] ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] bg-white hover:border-gray-300 text-[#374151]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pergunta 2: No que podemos ajudar? */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1F2937]">
                  No que podemos ajudar?
                </label>
                <textarea
                  value={noQueAjudar}
                  onChange={(e) => setNoQueAjudar(e.target.value)}
                  rows={2}
                  placeholder="Ex: estruturar rotinas do gerente, auditoria de preços, modelo de rotinas para minha equipe..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-md outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937] placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Pergunta 3: Em qual prazo você gostaria de contato? */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Em qual prazo você gostaria de contato?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'hoje', label: 'Hoje' },
                    { id: 'esta_semana', label: 'Esta semana' },
                    { id: 'so_explorar', label: 'Só quero explorar' },
                  ].map((opt) => {
                    const isSelected = prazoContato === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrazoContato(opt.id as PrazoContato)}
                        className={`py-2 px-2.5 rounded-md border text-xs font-medium text-center transition-all ${
                          isSelected
                            ? 'border-[#2563EB] bg-blue-50/80 text-[#2563EB] ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] bg-white hover:border-gray-300 text-[#374151]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pergunta 4: Quais as maiores dores hoje na operação e gestão de forma geral? */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quais as maiores dores hoje na operação e gestão de forma geral?</span>
                </label>
                <textarea
                  value={maioresDores}
                  onChange={(e) => setMaioresDores(e.target.value)}
                  rows={2}
                  placeholder="Ex: controle de perdas, rupturas de estoque, falta de engajamento da equipe..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-md outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#1F2937] placeholder:text-gray-400 resize-none"
                />
                <p className="text-[11px] text-[#6B7280]">
                  Pré-preenchido com seus dados do diagnóstico inicial. Você pode complementar.
                </p>
              </div>

              {/* Botões */}
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={loading}
                  className="text-xs text-[#6B7280] hover:text-[#1F2937] underline transition-colors"
                >
                  Dispensar por enquanto
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Enviando...' : 'Enviar respostas'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
