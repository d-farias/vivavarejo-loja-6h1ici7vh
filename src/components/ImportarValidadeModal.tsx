import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Store,
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
          'Nenhum item com formato válido foi encontrado. A planilha deve conter ao menos setor/categoria e horário.',
        )
      } else {
        setParsedRows(result.rows)
      }
    } catch (err: any) {
      setParseError(
        err?.message || 'Falha ao processar a planilha. Tente um formato .xlsx ou .csv válido.',
      )
    } finally {
      setParsing(false)
    }
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setProgressMsg('Iniciando importação do cronograma...')

    try {
      const resultado = await tarefasValidadeService.importarCronograma(
        parsedRows,
        targetLojaId || undefined,
        (msg) => setProgressMsg(msg),
      )

      setProgressMsg(
        `Importação finalizada! ${resultado.inseridos} novas tarefas criadas, ${resultado.atualizados} atualizadas (anti-duplicação).`,
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => !importing && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">Importar Cronograma de Validades</h2>
              <p className="text-xs text-[#6B7280]">
                Faça upload da planilha (Excel .xlsx ou CSV) com os setores e janelas horárias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#1F2937] transition-colors disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D1D5DB] hover:border-[#2563EB] rounded-lg p-8 text-center cursor-pointer transition-colors bg-[#F7F7F5]/50 hover:bg-[#3B82F6]/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-[#9CA3AF] group-hover:text-[#2563EB] mx-auto mb-3 transition-colors" />
              <p className="text-sm font-semibold text-[#1F2937]">
                Clique aqui para selecionar o cronograma de validades
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Suporta planilhas Excel (.xlsx) ou arquivos .csv
              </p>

              <div className="mt-4 inline-block px-3 py-1.5 rounded bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563] text-left">
                <strong>Colunas aceitas:</strong> Data (ou dia da semana / recorrência ex:
                &quot;toda terça&quot;), Setor / Categoria, Tarefa / Descrição, Horário Início,
                Horário Fim (ex: 14h–15h), Loja e Validador (Líder Prevenção).
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Arquivo selecionado */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <span className="text-xs font-bold text-[#1F2937] block">{file.name}</span>
                    <span className="text-[11px] text-[#6B7280]">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} tarefas mapeadas
                    </span>
                  </div>
                </div>

                {!importing && (
                  <button
                    onClick={handleReset}
                    className="text-xs font-semibold text-[#B91C1C] hover:underline"
                  >
                    Trocar arquivo
                  </button>
                )}
              </div>

              {parsing && (
                <div className="p-4 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                  <span>Processando estrutura do cronograma...</span>
                </div>
              )}

              {parseError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Loja de destino */}
              {lojas.length > 0 && (
                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB] space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Loja de Destino do Cronograma</span>
                  </label>
                  <select
                    value={targetLojaId}
                    onChange={(e) => setTargetLojaId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#2563EB] text-[#1F2937]"
                  >
                    <option value="">Aplicar para todas as lojas</option>
                    {lojas.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tabela de prévia */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#374151]">
                      Prévia das tarefas ({parsedRows.length} itens)
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Upsert inteligente ativo (não duplica se já existir)
                    </span>
                  </div>

                  <div className="border border-[#E5E7EB] rounded-md max-h-56 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] sticky top-0">
                        <tr>
                          <th className="p-2 font-semibold">Setor / Categoria</th>
                          <th className="p-2 font-semibold">Janela Horária</th>
                          <th className="p-2 font-semibold">Data / Recorrência</th>
                          <th className="p-2 font-semibold">Tarefa / Descrição</th>
                          <th className="p-2 font-semibold">Validador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {parsedRows.slice(0, 12).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 font-semibold text-[#1F2937]">
                              {row.setor_categoria}
                            </td>
                            <td className="p-2 font-mono text-[11px] text-[#2563EB]">
                              {row.horario_inicio} {row.horario_fim ? `– ${row.horario_fim}` : ''}
                            </td>
                            <td className="p-2 text-[#4B5563]">
                              {row.data_especifica || row.recorrencia || 'Diária'}
                            </td>
                            <td className="p-2 text-[#6B7280] max-w-[200px] truncate">
                              {row.descricao}
                            </td>
                            <td className="p-2 text-[#4B5563]">
                              {row.validador_funcao_nome || 'Líder Prevenção'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 12 && (
                    <p className="text-[11px] text-[#6B7280] text-center">
                      ... e mais {parsedRows.length - 12} tarefas mapeadas.
                    </p>
                  )}
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
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar e Importar {parsedRows.length} Tarefas</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
