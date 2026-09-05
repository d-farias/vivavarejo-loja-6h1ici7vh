import React, { useState, useRef } from 'react'
import type { Rotina, Loja } from '@/types'
import { parseUploadedSpreadsheet, ParsedSheetRoutine } from '@/lib/spreadsheet-parser'
import { rotinasService } from '@/services/rotinas'
import { useStore } from '@/context/StoreContext'
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Store,
} from 'lucide-react'

interface SpreadsheetImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  initialLojaId?: string
}

export function SpreadsheetImportModal({
  isOpen,
  onClose,
  onSuccess,
  initialLojaId,
}: SpreadsheetImportModalProps) {
  const { lojas, lojaSelecionadaId } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedSheetRoutine[]>([])
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([])
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [progressMsg, setProgressMsg] = useState('')

  // Loja de destino da importação
  const [targetLojaId, setTargetLojaId] = useState<string>(() => {
    if (initialLojaId && initialLojaId !== 'todas') return initialLojaId
    if (lojaSelecionadaId && lojaSelecionadaId !== 'todas') return lojaSelecionadaId
    return lojas[0]?.id || ''
  })

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseError(null)
    setParsing(true)
    setParsedData([])

    try {
      const result = await parseUploadedSpreadsheet(selectedFile)
      if (result.routines.length === 0) {
        setParseError(
          'Nenhuma rotina com formato válido foi identificada. Certifique-se de que a planilha possui as colunas de Rotina e Responsável.',
        )
      } else {
        setParsedData(result.routines)
        setDetectedHeaders(result.headers)
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
    if (parsedData.length === 0) return

    setImporting(true)
    setProgressMsg('Iniciando importação...')

    try {
      // Se modo for substituir, apaga as rotinas anteriores desta loja (ou todas se nenhuma loja vinculada)
      if (importMode === 'replace') {
        setProgressMsg('Substituindo: removendo rotinas anteriores...')
        await rotinasService.deleteAll(targetLojaId || null)
      }

      let insertedCount = 0
      for (const item of parsedData) {
        insertedCount++
        setProgressMsg(`Importando rotina ${insertedCount} de ${parsedData.length}...`)
        await rotinasService.create({
          nome: item.nome,
          responsavel: item.responsavel,
          frequencia: item.frequencia,
          horario_limite: item.horario_limite,
          ferramenta: item.ferramenta,
          validacao: item.validacao,
          area: item.area,
          observacoes: item.observacoes,
          status: 'Ativa',
          loja: targetLojaId || undefined,
        })
      }

      setProgressMsg('Importação concluída com sucesso!')
      await onSuccess()
      onClose()
    } catch (err: any) {
      setParseError(err?.message || 'Falha ao salvar as rotinas no banco de dados.')
    } finally {
      setImporting(false)
      setProgressMsg('')
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedData([])
    setDetectedHeaders([])
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => !importing && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">Importar Planilha de Rotinas</h2>
              <p className="text-xs text-[#6B7280]">
                Faça upload de arquivo Excel (.xlsx) ou CSV para alimentar o Painel da Loja
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

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* File Picker State */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D1D5DB] hover:border-[#0F766E] rounded-lg p-8 text-center cursor-pointer transition-colors bg-[#F7F7F5]/50 hover:bg-[#0F766E]/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-[#9CA3AF] group-hover:text-[#0F766E] mx-auto mb-3 transition-colors" />
              <p className="text-sm font-semibold text-[#1F2937]">
                Clique aqui para selecionar a planilha
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Suporta planilhas Excel (.xlsx) ou arquivos .csv
              </p>

              <div className="mt-4 inline-block px-3 py-1.5 rounded bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563]">
                Mapeamento automático: <strong>Rotina</strong>, <strong>Responsável</strong>,{' '}
                <strong>Frequência</strong>, <strong>Horário limite</strong>,{' '}
                <strong>Ferramenta</strong>, <strong>Validação</strong>, <strong>Área</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-[#0F766E]" />
                  <div>
                    <span className="text-xs font-bold text-[#1F2937] block">{file.name}</span>
                    <span className="text-[11px] text-[#6B7280]">
                      {(file.size / 1024).toFixed(1)} KB • {parsedData.length} rotinas identificadas
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

              {/* Parsing Indicator */}
              {parsing && (
                <div className="p-4 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0F766E]" />
                  <span>Processando e estruturando dados da planilha no navegador...</span>
                </div>
              )}

              {/* Error Banner */}
              {parseError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-[#B91C1C] text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Loja de Destino da Importação */}
              {lojas.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB] space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Loja de Destino das Rotinas</span>
                  </label>
                  <select
                    value={targetLojaId}
                    onChange={(e) => setTargetLojaId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] text-[#1F2937]"
                  >
                    <option value="">Nenhuma loja específica (Visível em todas)</option>
                    {lojas.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} {l.expand?.cliente ? `• ${l.expand.cliente.nome}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#6B7280]">
                    As rotinas importadas serão associadas a esta loja e filtradas nos painéis.
                  </p>
                </div>
              )}

              {/* Import Options (Append vs Replace) */}
              {parsedData.length > 0 && (
                <div className="p-3.5 rounded-lg bg-white border border-[#E5E7EB] space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#374151]">
                    Modo de importação
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        importMode === 'append'
                          ? 'border-[#0F766E] bg-[#0F766E]/5 font-semibold text-[#0F766E]'
                          : 'border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="mt-0.5"
                      />
                      <div>
                        <span>Adicionar às existentes</span>
                        <p className="text-[11px] font-normal text-[#6B7280]">
                          Mantém as rotinas já cadastradas e adiciona as novas da planilha.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        importMode === 'replace'
                          ? 'border-[#B91C1C] bg-red-50/40 font-semibold text-[#B91C1C]'
                          : 'border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5"
                      />
                      <div>
                        <span>Substituir todas as rotinas</span>
                        <p className="text-[11px] font-normal text-[#6B7280]">
                          Apaga as rotinas anteriores e grava apenas as rotinas da planilha.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table of Parsed Routines */}
              {parsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#374151]">
                      Prévia dos dados mapeados ({parsedData.length} itens)
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Role para ver todas as colunas
                    </span>
                  </div>

                  <div className="border border-[#E5E7EB] rounded-md max-h-56 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] sticky top-0">
                        <tr>
                          <th className="p-2 font-semibold">Rotina</th>
                          <th className="p-2 font-semibold">Responsável</th>
                          <th className="p-2 font-semibold">Horário Limite</th>
                          <th className="p-2 font-semibold">Frequência</th>
                          <th className="p-2 font-semibold">Validação</th>
                          <th className="p-2 font-semibold">Área</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {parsedData.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 font-medium text-[#1F2937] max-w-[200px] truncate">
                              {row.nome}
                            </td>
                            <td className="p-2 text-[#4B5563] whitespace-nowrap">
                              {row.responsavel}
                            </td>
                            <td className="p-2 font-mono text-[11px] text-[#0F766E] whitespace-nowrap">
                              {row.horario_limite || 'Integral'}
                            </td>
                            <td className="p-2 text-[#4B5563] whitespace-nowrap">
                              {row.frequencia}
                            </td>
                            <td className="p-2 text-[#6B7280] whitespace-nowrap">
                              {row.validacao}
                            </td>
                            <td className="p-2 text-[#6B7280] whitespace-nowrap">{row.area}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 15 && (
                    <p className="text-[11px] text-[#6B7280] text-center">
                      ... e mais {parsedData.length - 15} rotinas na lista.
                    </p>
                  )}
                </div>
              )}

              {/* Progress message during write */}
              {importing && (
                <div className="p-3 bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-md text-xs text-[#0F766E] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-[#F7F7F5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>

          {parsedData.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={importing}
              className="px-5 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Confirmar e Importar {parsedData.length}{' '}
                    {parsedData.length === 1 ? 'Rotina' : 'Rotinas'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
