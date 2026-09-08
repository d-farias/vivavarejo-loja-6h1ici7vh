import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CalendarCheck, Store, Phone, Briefcase } from 'lucide-react'
import type { TarefaValidade, Loja, Funcao, Funcionario } from '@/types'
import { normalizarNomeCanonico } from '@/lib/cargos'
import { formatPhoneBR } from '@/lib/phone-utils'
import { funcoesService } from '@/services/funcoes'
import { funcionariosService } from '@/services/funcionarios'

interface TarefaValidadeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData?: TarefaValidade | null
  lojas: Loja[]
  funcoes: Funcao[]
  defaultLojaId?: string
}

export function TarefaValidadeFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  lojas,
  defaultLojaId,
}: TarefaValidadeFormModalProps) {
  const [lojaId, setLojaId] = useState<string>(
    initialData?.loja ||
      (defaultLojaId && defaultLojaId !== 'todas' ? defaultLojaId : lojas[0]?.id || ''),
  )
  const [setorCategoria, setSetorCategoria] = useState<string>(initialData?.setor_categoria || '')
  const [descricao, setDescricao] = useState<string>(initialData?.descricao || '')
  const [tipoAgendamento, setTipoAgendamento] = useState<'recorrente' | 'pontual'>(
    initialData?.data_especifica ? 'pontual' : 'recorrente',
  )
  const [dataEspecifica, setDataEspecifica] = useState<string>(
    initialData?.data_especifica ? initialData.data_especifica.substring(0, 10) : '',
  )
  const [recorrencia, setRecorrencia] = useState<string>(initialData?.recorrencia || 'diaria')
  const [horarioInicio, setHorarioInicio] = useState<string>(initialData?.horario_inicio || '14:00')
  const [horarioFim, setHorarioFim] = useState<string>(initialData?.horario_fim || '15:00')
  const [executorNome, setExecutorNome] = useState<string>(initialData?.executor_nome || '')
  const [validadorFuncaoNome, setValidadorFuncaoNome] = useState<string>(
    initialData?.validador_funcao_nome || 'Líder Prevenção',
  )

  // Telefones WhatsApp para alerta e autopreenchimento
  const [telefoneResponsavel, setTelefoneResponsavel] = useState<string>(
    formatPhoneBR(initialData?.telefone_responsavel || ''),
  )
  const [telefoneChefe, setTelefoneChefe] = useState<string>(
    formatPhoneBR(initialData?.telefone_chefe || ''),
  )

  const [funcoesLoja, setFuncoesLoja] = useState<Funcao[]>([])
  const [funcionariosLoja, setFuncionariosLoja] = useState<Funcionario[]>([])
  const [funcaoResponsavelId, setFuncaoResponsavelId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lojaId) {
      Promise.all([
        funcoesService.getByLoja(lojaId).catch(() => [] as Funcao[]),
        funcionariosService.getByLoja(lojaId).catch(() => [] as Funcionario[]),
      ]).then(([funcs, colabs]) => {
        setFuncoesLoja(funcs)
        setFuncionariosLoja(colabs)
      })
    } else {
      setFuncoesLoja([])
      setFuncionariosLoja([])
    }
  }, [lojaId])
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setorCategoria.trim()) {
      setError('Informe o setor ou categoria da verificação.')
      return
    }
    if (!horarioInicio.trim()) {
      setError('Informe o horário de início da janela.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        loja: lojaId || undefined,
        setor_categoria: setorCategoria.trim(),
        descricao: descricao.trim() || undefined,
        data_especifica: tipoAgendamento === 'pontual' ? dataEspecifica || undefined : undefined,
        recorrencia: tipoAgendamento === 'recorrente' ? recorrencia || 'diaria' : undefined,
        horario_inicio: horarioInicio.trim(),
        horario_fim: horarioFim.trim() || undefined,
        executor_nome: executorNome.trim() || undefined,
        validador_funcao_nome: validadorFuncaoNome.trim() || 'Líder Prevenção',
        telefone_responsavel: telefoneResponsavel.trim() || undefined,
        telefone_chefe: telefoneChefe.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar a tarefa de validade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border border-[#E5E7EB] text-[#1F2937]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#1F2937]">
            <CalendarCheck className="w-5 h-5 text-[#2563EB]" />
            <span>
              {initialData ? 'Editar Tarefa de Validade' : 'Nova Tarefa no Cronograma de Validades'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[#B91C1C] text-xs">
              {error}
            </div>
          )}

          {/* Loja */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#374151] flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Loja de Destino</span>
            </label>
            <select
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            >
              <option value="">Geral / Todas as Lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Setor e Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#374151]">
              Setor / Categoria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fiambreria, Laticínios, Mercearia Alta Rotatividade, Carnes"
              value={setorCategoria}
              onChange={(e) => setSetorCategoria(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#374151]">
              Descrição / O que verificar (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Verificar datas críticas de vencimento dos próximos 7 dias e aplicar etiqueta promocional se necessário."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Tipo de Agendamento: Pontual ou Recorrente */}
          <div className="p-3 bg-[#F7F7F5] rounded-md border border-[#E5E7EB] space-y-2">
            <label className="text-xs font-semibold text-[#374151] block">
              Programação no Calendário
            </label>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipoAgendamento"
                  checked={tipoAgendamento === 'recorrente'}
                  onChange={() => setTipoAgendamento('recorrente')}
                />
                <span>Recorrente (Semanal / Diária)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipoAgendamento"
                  checked={tipoAgendamento === 'pontual'}
                  onChange={() => setTipoAgendamento('pontual')}
                />
                <span>Data Específica (Pontual)</span>
              </label>
            </div>

            {tipoAgendamento === 'recorrente' ? (
              <div className="pt-1">
                <select
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
                >
                  <option value="diaria">Todos os dias (Diária)</option>
                  <option value="toda segunda">Toda Segunda-feira</option>
                  <option value="toda terça">Toda Terça-feira</option>
                  <option value="toda quarta">Toda Quarta-feira</option>
                  <option value="toda quinta">Toda Quinta-feira</option>
                  <option value="toda sexta">Toda Sexta-feira</option>
                  <option value="todo sábado">Todo Sábado</option>
                  <option value="todo domingo">Todo Domingo</option>
                </select>
              </div>
            ) : (
              <div className="pt-1">
                <input
                  type="date"
                  value={dataEspecifica}
                  onChange={(e) => setDataEspecifica(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
                  required={tipoAgendamento === 'pontual'}
                />
              </div>
            )}
          </div>

          {/* Janela Horária */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#374151]">
                Horário Início <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 14:00"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              />
              <span className="text-[10px] text-[#6B7280]">
                Alerta automático 1h antes ({' '}
                {horarioInicio
                  ? `${parseInt(horarioInicio.split(':')[0] || '14', 10) - 1 || 0}:00`
                  : ''}
                )
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#374151]">Horário Fim (Janela)</label>
              <input
                type="text"
                placeholder="Ex: 15:00"
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              />
              <span className="text-[10px] text-[#6B7280]">Limite da conferência</span>
            </div>
          </div>

          {/* Seleção de Função Responsável (para autopreencher executor e telefones) */}
          {funcoesLoja.length > 0 && (
            <div className="space-y-1 p-2.5 rounded-md bg-[#F7F7F5] border border-[#E5E7EB]">
              <label className="text-xs font-semibold text-[#374151] flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Autopreencher por Função / Cargo da Loja</span>
              </label>
              <select
                value={funcaoResponsavelId}
                onChange={(e) => {
                  const fid = e.target.value
                  setFuncaoResponsavelId(fid)
                  const fObj = funcoesLoja.find((f) => f.id === fid)
                  if (fObj) {
                    if (!executorNome) {
                      setExecutorNome(fObj.nome)
                    }
                    if (fObj.telefone && !telefoneResponsavel) {
                      setTelefoneResponsavel(formatPhoneBR(fObj.telefone))
                    }
                    // Resolver chefe imediato da função
                    if (fObj.chefe_imediato_funcao) {
                      const cargoChefe = funcoesLoja.find(
                        (cf) => cf.id === fObj.chefe_imediato_funcao,
                      )
                      if (cargoChefe) {
                        setValidadorFuncaoNome(cargoChefe.nome)
                        if (cargoChefe.telefone && !telefoneChefe) {
                          setTelefoneChefe(formatPhoneBR(cargoChefe.telefone))
                        } else {
                          const colabChefe = funcionariosLoja.find(
                            (fc) => fc.funcao === cargoChefe.id && fc.telefone,
                          )
                          if (colabChefe?.telefone && !telefoneChefe) {
                            setTelefoneChefe(formatPhoneBR(colabChefe.telefone))
                          }
                        }
                      }
                    }
                  }
                }}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              >
                <option value="">Selecione uma função para autopreenchimento...</option>
                {funcoesLoja.map((f) => (
                  <option key={f.id} value={f.id}>
                    {normalizarNomeCanonico(f.nome)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quem Executa e Quem Valida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#374151]">Executor / Repositor</label>
              <input
                type="text"
                placeholder="Ex: Repositor de Laticínios"
                value={executorNome}
                onChange={(e) => setExecutorNome(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#374151]">
                Responsável pela Validação
              </label>
              <input
                type="text"
                placeholder="Ex: Líder Prevenção"
                value={validadorFuncaoNome}
                onChange={(e) => setValidadorFuncaoNome(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB]"
              />
              <span className="text-[10px] text-[#6B7280]">
                Padrão: Líder Prevenção (avalia prova/foto)
              </span>
            </div>
          </div>

          {/* Telefones de Alerta WhatsApp */}
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2.5">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Avisos WhatsApp da Tarefa (Opcional)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-emerald-950">
                  Telefone do Responsável direto
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={telefoneResponsavel}
                  onChange={(e) => setTelefoneResponsavel(formatPhoneBR(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-md outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-[#1F2937]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-emerald-950">
                  Telefone do Chefe imediato
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={telefoneChefe}
                  onChange={(e) => setTelefoneChefe(formatPhoneBR(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-md outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-[#1F2937]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-[#E5E7EB] hover:bg-gray-100 rounded-md text-xs font-semibold text-[#4B5563]"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
            >
              {saving ? 'Salvando...' : 'Salvar Tarefa'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
