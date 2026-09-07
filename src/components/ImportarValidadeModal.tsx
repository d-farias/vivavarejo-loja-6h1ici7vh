import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Store,
  Clock,
  Calendar,
  UserCheck,
  Shield,
  FileText,
  Info,
  Edit3,
} from 'lucide-react'
import type { Loja } from '@/types'
import { parseValidadeFile } from '@/lib/validade-spreadsheet-parser'
import { tarefasValidadeService, ParsedValidadeRow } from '@/services/tarefasValidade'

interface ImportarValidadeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  lojas: Loja[]
  initialLojaId?: string
}

export function ImportarValidadeModal({
  isOpen,
  onClose,
  onSuccess,
  lojas,
  initialLojaId,
}: ImportarValidadeModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedValidadeRow[]>([])
  const [progressMsg, setProgressMsg] = useState('')

  // Configurações globais sugeridas da prévia
  const [tarefaNome, setTarefaNome] = useState('Auditoria Validades')
  const [horarioInicioGlobal, setHorarioInicioGlobal] = useState('09:00')
  const [horarioFimGlobal, setHorarioFimGlobal] = useState('15:00')
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [validadorPadrao, setValidadorPadrao] = useState('Líder Prevenção')
  const [hasRodizio, setHasRodizio] = useState(false)

  // Filtro na prévia
  const [filtroSemana, setFiltroSemana] = useState<string>('todas')

  // Item selecionado para edição rápida
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [targetLojaId, setTargetLojaId] = useState<string>(() => {
    if (initialLojaId && initialLojaId !== 'todas') return initialLojaId
    return lojas[0]?.id || ''
  })

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setParseError(null)
    setParsing(true)
    setParsedRows([])

    try {
      const result = await parseValidadeFile(selected)
      if (result.rows.length === 0) {
        setParseError(
          'Nenhum item válido foi encontrado no arquivo. A planilha deve conter setores/categorias e ciclos de dias.',
        )
      } else {
        setParsedRows(result.rows)
        if (result.tarefaNomeDetectado) {
          setTarefaNome(result.tarefaNomeDetectado)
        }
        if (result.horarioInicioSugerido) {
          setHorarioInicioGlobal(result.horarioInicioSugerido)
        }
        if (result.horarioFimSugerido) {
          setHorarioFimGlobal(result.horarioFimSugerido)
        }
        if (result.observacaoDetectada) {
          setObservacaoGeral(result.observacaoDetectada)
        }

        const temSemanas = result.rows.some((r) => r.semana_mes && r.semana_mes > 0)
        setHasRodizio(temSemanas)

        // Se a primeira linha tiver validador definido, sugere como padrão
        const primeiroValidador = result.rows.find(
          (r) => r.validador_funcao_nome,
        )?.validador_funcao_nome
        if (primeiroValidador) {
          setValidadorPadrao(primeiroValidador)
        }
      }
    } catch (err: any) {
      setParseError(
        err?.message ||
          'Falha ao processar a planilha. Certifique-se de que é um arquivo Excel (.xlsx) ou CSV válido.',
      )
    } finally {
      setParsing(false)
    }
  }

  // Aplicar alterações globais de horário para todas as linhas
  const handleAplicarHorarioGlobal = () => {
    setParsedRows((prev) =>
      prev.map((r) => ({
        ...r,
        horario_inicio: horarioInicioGlobal,
        horario_fim: horarioFimGlobal,
      })),
    )
  }

  // Aplicar alterações globais de validador para todas as linhas
  const handleAplicarValidadorGlobal = (novoVal: string) => {
    setValidadorPadrao(novoVal)
    setParsedRows((prev) =>
      prev.map((r) => ({
        ...r,
        validador_funcao_nome: novoVal,
      })),
    )
  }

  // Atualizar linha individual na prévia
  const handleUpdateRow = (index: number, updates: Partial<ParsedValidadeRow>) => {
    setParsedRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setProgressMsg('Iniciando importação do cronograma de validades...')

    try {
      // Ajusta dados com as observações gerais se preenchidas
      const rowsToImport = parsedRows.map((r) => ({
        ...r,
        observacoes: r.observacoes || observacaoGeral,
      }))

      const resultado = await tarefasValidadeService.importarCronograma(
        rowsToImport,
        targetLojaId || undefined,
        (msg) => setProgressMsg(msg),
      )

      setProgressMsg(
        `Importação concluída! ${resultado.inseridos} tarefas criadas e ${resultado.atualizados} atualizadas (anti-duplicação preservada).`,
      )
      await onSuccess()
      onClose()
    } catch (err: any) {
      setParseError(err?.message || 'Falha ao salvar as tarefas no banco de dados.')
    } finally {
      setImporting(false)
      setProgressMsg('')
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedRows([])
    setParseError(null)
    setObservacaoGeral('')
    setEditingIndex(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Linhas filtradas para exibição na prévia
  const rowsFiltradas = parsedRows.filter((r) => {
    if (filtroSemana === 'todas') return true
    return String(r.semana_mes) === filtroSemana
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => !importing && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F7F7F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                  Importar Cronograma de Validades
                </h2>
                {hasRodizio && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
                    Rodízio Mensal (4 Semanas)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                Reconhecimento automático de layout, divisores semanais, responsáveis e deadline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#1F2937] hover:bg-gray-200 transition-colors disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D1D5DB] hover:border-[#2563EB] rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors bg-[#F7F7F5]/50 hover:bg-[#3B82F6]/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-12 h-12 text-[#9CA3AF] group-hover:text-[#2563EB] mx-auto mb-3 transition-colors" />
              <p className="text-sm sm:text-base font-semibold text-[#1F2937]">
                Selecione o arquivo do Cronograma de Validades
              </p>
              <p className="text-xs text-[#6B7280] mt-1 max-w-lg mx-auto">
                Arraste ou clique para carregar arquivos Excel (.xlsx) ou CSV com layout semanal ou
                rodízio mensal de 4 semanas.
              </p>

              <div className="mt-5 max-w-xl mx-auto p-3.5 rounded-lg bg-white border border-[#E5E7EB] text-left text-xs text-[#4B5563] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                  <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Layout inteligente suportado:</span>
                </div>
                <p>
                  • <strong>Detecção de Rodízio Semanal:</strong> linhas divisoras &quot;Primeira
                  Semana&quot;, &quot;Segunda Semana&quot;, &quot;Terceira Semana&quot; e
                  &quot;Quarta Semana&quot;.
                </p>
                <p>
                  • <strong>Dias e Setores:</strong> Mapeamento por dia da semana (Segunda a Sexta),
                  ignora automaticamente finais de semana vazios.
                </p>
                <p>
                  • <strong>Herança de Funções:</strong> Siglas <em>GO</em> (Gerente Operacional
                  (GO)) e <em>LP</em> (Líder Prevenção) são mapeadas e herdadas do cabeçalho de cada
                  semana.{' '}
                </p>
                <p>
                  • <strong>Deadline Implícito:</strong> Tarefas com &quot;até 15hs&quot; sugerem
                  automaticamente a janela 09:00–15:00 configurável na prévia.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Arquivo selecionado & Resumo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-[#1F2937] block">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} tarefas identificadas
                      {hasRodizio && ' • Rodízio de 4 semanas ativado'}
                    </span>
                  </div>
                </div>

                {!importing && (
                  <button
                    onClick={handleReset}
                    className="text-xs font-semibold text-[#B91C1C] hover:underline self-start sm:self-auto"
                  >
                    Trocar arquivo
                  </button>
                )}
              </div>

              {parsing && (
                <div className="p-4 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                  <span>Processando estrutura do cronograma e ciclos semanais...</span>
                </div>
              )}

              {parseError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Bloco de Configurações Globais Sugeridas (Tarefa, Janela Horária, Loja, Validador) */}
              {parsedRows.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-lg bg-blue-50/50 border border-blue-100">
                  {/* Nome da Tarefa */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#2563EB]" />
                      <span>Nome da Tarefa</span>
                    </label>
                    <input
                      type="text"
                      value={tarefaNome}
                      onChange={(e) => setTarefaNome(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#BFDBFE] rounded text-[#1F2937] outline-none focus:border-[#2563EB]"
                      placeholder="Ex: Auditoria Validades até 15hs"
                    />
                  </div>

                  {/* Janela Horária Configurável */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#2563EB]" />
                        <span>Janela Horária (Início - Fim)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAplicarHorarioGlobal}
                        className="text-[10px] text-[#2563EB] hover:underline font-bold"
                        title="Aplicar para todas as tarefas abaixo"
                      >
                        Aplicar a todas
                      </button>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={horarioInicioGlobal}
                        onChange={(e) => setHorarioInicioGlobal(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-[#BFDBFE] rounded text-[#1F2937] outline-none font-mono"
                      />
                      <span className="text-xs text-[#6B7280]">às</span>
                      <input
                        type="time"
                        value={horarioFimGlobal}
                        onChange={(e) => setHorarioFimGlobal(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-[#BFDBFE] rounded text-[#1F2937] outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Loja de Destino */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1">
                      <Store className="w-3 h-3 text-[#2563EB]" />
                      <span>Loja de Destino</span>
                    </label>
                    <select
                      value={targetLojaId}
                      onChange={(e) => setTargetLojaId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#BFDBFE] rounded text-[#1F2937] outline-none focus:border-[#2563EB]"
                    >
                      <option value="">Aplicar para todas as lojas</option>
                      {lojas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Validador Padrão */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#2563EB]" />
                      <span>Validador Padrão</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={validadorPadrao}
                        onChange={(e) => setValidadorPadrao(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#BFDBFE] rounded text-[#1F2937] outline-none"
                        placeholder="Ex: Gerente"
                      />
                      <button
                        type="button"
                        onClick={() => handleAplicarValidadorGlobal(validadorPadrao)}
                        className="px-2 py-1.5 text-[10px] font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded shrink-0"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {/* Observações da Loja Detectadas */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#2563EB]" />
                      <span>Nota/Observação da Loja (sugerida do rodapé)</span>
                    </label>
                    <input
                      type="text"
                      value={observacaoGeral}
                      onChange={(e) => setObservacaoGeral(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#BFDBFE] rounded text-[#1F2937] outline-none italic"
                      placeholder="Ex: Equipe fixa com GO e Líder Prevenção acompanhando..."
                    />
                  </div>
                </div>
              )}

              {/* Tabela de Prévia e Ajustes */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                        Prévia detalhada ({parsedRows.length} tarefas)
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        • Anti-duplicação por Tarefa + Semana + Dia + Loja
                      </span>
                    </div>

                    {/* Filtro por Semana do Mês */}
                    {hasRodizio && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#6B7280]">Semana:</span>
                        <div className="inline-flex rounded-md shadow-2xs border border-[#E5E7EB] bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setFiltroSemana('todas')}
                            className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
                              filtroSemana === 'todas'
                                ? 'bg-[#2563EB] text-white'
                                : 'text-[#4B5563] hover:bg-gray-50'
                            }`}
                          >
                            Todas
                          </button>
                          {[1, 2, 3, 4].map((sem) => (
                            <button
                              key={sem}
                              type="button"
                              onClick={() => setFiltroSemana(String(sem))}
                              className={`px-2 py-1 text-[11px] font-semibold border-l border-[#E5E7EB] transition-colors ${
                                filtroSemana === String(sem)
                                  ? 'bg-[#2563EB] text-white'
                                  : 'text-[#4B5563] hover:bg-gray-50'
                              }`}
                            >
                              Sem {sem}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-[#E5E7EB] rounded-lg max-h-72 overflow-auto bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 font-semibold">Semana do Mês</th>
                          <th className="p-2.5 font-semibold">Dia da Semana</th>
                          <th className="p-2.5 font-semibold">Setores / Categorias</th>
                          <th className="p-2.5 font-semibold">Janela Horária</th>
                          <th className="p-2.5 font-semibold">Responsável (Sigla/Função)</th>
                          <th className="p-2.5 font-semibold">Validador</th>
                          <th className="p-2.5 font-semibold text-center w-12">Ajustar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {rowsFiltradas.map((row, idx) => {
                          const realIdx = parsedRows.indexOf(row)
                          const isEditing = editingIndex === realIdx

                          return (
                            <tr key={idx} className="hover:bg-blue-50/20">
                              {/* Semana */}
                              <td className="p-2.5">
                                {row.semana_mes ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-blue-100 text-[#1E40AF]">
                                    <Calendar className="w-3 h-3 text-[#2563EB]" />
                                    <span>Semana {row.semana_mes}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#6B7280]">Geral</span>
                                )}
                              </td>

                              {/* Dia da Semana */}
                              <td className="p-2.5 font-semibold text-[#1F2937]">
                                {row.dia_semana || row.recorrencia || 'Diária'}
                              </td>

                              {/* Setores */}
                              <td className="p-2.5">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={row.setor_categoria}
                                    onChange={(e) =>
                                      handleUpdateRow(realIdx, { setor_categoria: e.target.value })
                                    }
                                    className="w-full px-2 py-1 text-xs border border-[#2563EB] rounded bg-white"
                                  />
                                ) : (
                                  <span className="font-medium text-[#1F2937] leading-tight block">
                                    {row.setor_categoria}
                                  </span>
                                )}
                              </td>

                              {/* Janela Horária */}
                              <td className="p-2.5 whitespace-nowrap">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="time"
                                      value={row.horario_inicio}
                                      onChange={(e) =>
                                        handleUpdateRow(realIdx, { horario_inicio: e.target.value })
                                      }
                                      className="px-1.5 py-0.5 text-[11px] border rounded font-mono"
                                    />
                                    <span>-</span>
                                    <input
                                      type="time"
                                      value={row.horario_fim || '15:00'}
                                      onChange={(e) =>
                                        handleUpdateRow(realIdx, { horario_fim: e.target.value })
                                      }
                                      className="px-1.5 py-0.5 text-[11px] border rounded font-mono"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-mono text-[11px] font-bold text-[#2563EB] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                                    {row.horario_inicio}{' '}
                                    {row.horario_fim ? `– ${row.horario_fim}` : ''}
                                  </span>
                                )}
                              </td>

                              {/* Responsável */}
                              <td className="p-2.5">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={row.executor_nome || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(realIdx, { executor_nome: e.target.value })
                                    }
                                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                                    placeholder="Ex: GO e LP"
                                  />
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#374151]">
                                    <UserCheck className="w-3 h-3 text-[#6B7280]" />
                                    <span>{row.executor_nome || 'Liderança de Loja'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Validador */}
                              <td className="p-2.5">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={row.validador_funcao_nome || 'Gerente'}
                                    onChange={(e) =>
                                      handleUpdateRow(realIdx, {
                                        validador_funcao_nome: e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                                  />
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F2937]">
                                    <Shield className="w-3 h-3 text-amber-600" />
                                    <span>{row.validador_funcao_nome || 'Gerente'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Ação de Edição */}
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(isEditing ? null : realIdx)}
                                  className="p-1 text-[#9CA3AF] hover:text-[#2563EB] rounded transition-colors"
                                  title={isEditing ? 'Salvar ajuste' : 'Ajustar linha'}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importing && (
                <div className="p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-md text-xs text-[#2563EB] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-[#F7F7F5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={importing}
              className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importando para o Banco...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar e Gravar {parsedRows.length} Tarefas no Banco</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
