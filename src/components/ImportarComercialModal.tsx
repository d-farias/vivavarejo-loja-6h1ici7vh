import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Layers,
} from 'lucide-react'
import {
  parseComercialFile,
  type ParsedComercialProdutoRow,
  type ParsedComercialCategoriaRow,
} from '@/lib/comercial-spreadsheet-parser'
import { comercialService } from '@/services/comercial'
import type { Loja } from '@/types'

interface ImportarComercialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojas: Loja[]
  lojaSelecionada?: string
  competenciaAtual: string
  onImportadoSucesso?: () => void
}

export function ImportarComercialModal({
  open,
  onOpenChange,
  lojas,
  lojaSelecionada,
  competenciaAtual,
  onImportadoSucesso,
}: ImportarComercialModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [lojaId, setLojaId] = useState<string>(
    lojaSelecionada && lojaSelecionada !== 'todas' ? lojaSelecionada : lojas[0]?.id || '',
  )
  const [competencia, setCompetencia] = useState<string>(
    competenciaAtual || new Date().toISOString().slice(0, 7),
  )

  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [previewProdutos, setPreviewProdutos] = useState<ParsedComercialProdutoRow[]>([])
  const [previewCategorias, setPreviewCategorias] = useState<ParsedComercialCategoriaRow[]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setErrorMsg(null)
    setParsing(true)
    try {
      const res = await parseComercialFile(selected)
      setPreviewProdutos(res.produtos)
      setPreviewCategorias(res.categorias)
      if (res.produtos.length === 0 && res.categorias.length === 0) {
        setErrorMsg(
          'Nenhuma linha de produto ou categoria reconhecida na planilha. Verifique o cabeçalho das colunas.',
        )
      }
    } catch (err: any) {
      console.error('Erro ao ler planilha comercial:', err)
      setErrorMsg(
        err.message ||
          'Falha ao processar o arquivo. Certifique-se de ser um arquivo .xlsx ou .csv válido.',
      )
    } finally {
      setParsing(false)
    }
  }

  const handleConfirmarImportacao = async () => {
    if (!competencia) {
      setErrorMsg('Informe a competência de referência (mês/ano).')
      return
    }
    if (previewProdutos.length === 0 && previewCategorias.length === 0) {
      setErrorMsg('Nenhum dado válido para importar.')
      return
    }

    setImporting(true)
    setProgress(5)
    setStatusMsg('Preparando importação e sobrescrita de competência...')
    setErrorMsg(null)

    try {
      // 1. Sobrescrever produtos se houver
      if (previewProdutos.length > 0) {
        setStatusMsg(`Importando ${previewProdutos.length} produtos...`)
        await comercialService.sobrescreverProdutosPorCompetencia(
          lojaId || undefined,
          competencia,
          previewProdutos.map((p) => ({
            ...p,
            competencia,
          })),
          (cur, tot) => {
            const perc = Math.round((cur / tot) * 70)
            setProgress(perc)
            setStatusMsg(`Importando produtos (${cur}/${tot})...`)
          },
        )
      }

      // 2. Sobrescrever categorias
      if (previewCategorias.length > 0) {
        setStatusMsg(`Importando ${previewCategorias.length} categorias/departamentos...`)
        await comercialService.sobrescreverCategoriasPorCompetencia(
          lojaId || undefined,
          competencia,
          previewCategorias.map((c) => ({
            ...c,
            competencia,
          })),
          (cur, tot) => {
            const perc = 70 + Math.round((cur / tot) * 28)
            setProgress(perc)
            setStatusMsg(`Importando categorias (${cur}/${tot})...`)
          },
        )
      }

      setProgress(100)
      setStatusMsg('Importação concluída com sucesso!')

      setTimeout(() => {
        setImporting(false)
        setFile(null)
        setPreviewProdutos([])
        setPreviewCategorias([])
        onOpenChange(false)
        if (onImportadoSucesso) {
          onImportadoSucesso()
        }
      }, 900)
    } catch (err: any) {
      console.error('Erro na importação de planilha:', err)
      setErrorMsg(err.message || 'Erro durante a gravação dos dados no servidor.')
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              Sincronização com Planilhas
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0F766E]" />
            <span>Importar Planilha Comercial (CSV / XLSX)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Envie sua planilha de sortimento, rupturas, vendas ou curvas. O sistema fará a
            substituição inteligente pela mesma loja e competência, sem duplicar dados.
          </DialogDescription>
        </DialogHeader>

        {/* Configurações de Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F7F7F5] rounded-xl border border-[#E5E7EB] mt-2">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Loja de Destino
            </label>
            <select
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              disabled={importing}
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            >
              <option value="">Rede / Todas as Lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Competência (Mês de Referência)</span>
            </label>
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              disabled={importing}
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>

        {/* Informação sobre Sobrescrita por Competência */}
        <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/80 flex items-start gap-2 text-xs text-[#0F766E]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Substituição idempotente:</strong> ao importar para a competência{' '}
            <b>{competencia}</b>, os registros existentes desse mesmo período e loja serão
            atualizados por completo, mantendo a integridade analítica.
          </div>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-[#D1D5DB] hover:border-[#0F766E] rounded-xl p-5 text-center transition-colors bg-white">
          <input
            type="file"
            id="comercial-spreadsheet-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={parsing || importing}
            className="hidden"
          />
          <label
            htmlFor="comercial-spreadsheet-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2937]">
                {file ? file.name : 'Clique para selecionar a planilha ou arraste aqui'}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou Texto Separado (.csv)
              </p>
            </div>
          </label>
        </div>

        {/* Feedback de Erro */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Progresso de Gravação */}
        {importing && (
          <div className="space-y-2 p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1F2937]">
              <span>{statusMsg}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200 text-[#0F766E]" />
          </div>
        )}

        {/* Preview dos Dados Extraídos */}
        {(previewProdutos.length > 0 || previewCategorias.length > 0) && !importing && (
          <div className="space-y-2 border border-[#E5E7EB] rounded-xl p-3 bg-[#F9FAFB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pré-visualização dos Dados Identificados</span>
              </span>
              <div className="flex items-center gap-2">
                {previewProdutos.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                    {previewProdutos.length} SKUs / Produtos
                  </span>
                )}
                {previewCategorias.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {previewCategorias.length} Categorias
                  </span>
                )}
              </div>
            </div>

            {/* Amostra rápida em tabela enxuta */}
            <div className="max-h-44 overflow-y-auto overflow-x-auto text-[11px] border border-[#E5E7EB] rounded-lg bg-white">
              <table className="w-full text-left">
                <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] sticky top-0">
                  <tr>
                    <th className="p-2">Código</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Curva</th>
                    <th className="p-2">Estoque</th>
                    <th className="p-2">Ruptura</th>
                    <th className="p-2">Sem Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {previewProdutos.slice(0, 5).map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 font-mono font-medium">{p.codigo}</td>
                      <td className="p-2 font-medium truncate max-w-[200px]">{p.descricao}</td>
                      <td className="p-2 font-bold text-[#0F766E]">{p.curva}</td>
                      <td className="p-2">{p.estoque_fisico}</td>
                      <td className="p-2">
                        {p.em_ruptura ? (
                          <span className="text-red-600 font-semibold">Sim ({p.tipo_ruptura})</span>
                        ) : (
                          <span className="text-emerald-600">Não</span>
                        )}
                      </td>
                      <td className="p-2">
                        {p.dias_sem_venda > 0 ? `${p.dias_sem_venda} dias` : 'Normal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-[#6B7280]">
              * Mostrando os primeiros 5 itens como amostra de conferência de layout das colunas.
            </p>
          </div>
        )}

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={importing}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={
              importing ||
              parsing ||
              (previewProdutos.length === 0 && previewCategorias.length === 0)
            }
            onClick={handleConfirmarImportacao}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5"
          >
            {importing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>Confirmar e Sobrescrever Competência</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
