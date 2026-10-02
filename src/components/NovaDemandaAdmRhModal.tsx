import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, Plus, X } from 'lucide-react'
import { admRhService } from '@/services/admRh'
import type { SubAreaAdmRh, PrioridadeAdmRh } from '@/types'

interface NovaDemandaAdmRhModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subAreaDefault?: SubAreaAdmRh
  redeId?: string
  lojaId?: string
  userName?: string
  userId?: string
  onSucesso: () => void
}

const SUB_AREAS_INFO: Record<SubAreaAdmRh, { label: string; desc: string }> = {
  rh: { label: 'RH - Recursos Humanos', desc: 'Quadro de loja, vagas, clima e acolhimento' },
  dp: {
    label: 'DP - Departamento Pessoal',
    desc: 'eSocial, admissões, atestados, ponto e escalas',
  },
  adm: {
    label: 'ADM - Administrativo',
    desc: 'Documentos legais, alvarás, quadro de avisos e circular',
  },
  financeiro: { label: 'Financeiro', desc: 'Tesouraria, sangrias, fundo fixo e notas de despesa' },
  fiscal: { label: 'Fiscal', desc: 'NF-e de perdas/descarte, conferência de ICMS/NCM e CFOP' },
}

export function NovaDemandaAdmRhModal({
  open,
  onOpenChange,
  subAreaDefault = 'rh',
  redeId,
  lojaId,
  userName = 'Gerente de Loja',
  userId,
  onSucesso,
}: NovaDemandaAdmRhModalProps) {
  const [subArea, setSubArea] = useState<SubAreaAdmRh>(subAreaDefault)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridade, setPrioridade] = useState<PrioridadeAdmRh>('media')
  const [prazo, setPrazo] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [solicitanteNome, setSolicitanteNome] = useState(userName)
  const [categoriaCasoUso, setCategoriaCasoUso] = useState('documentos_internos')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Atualizar subArea quando abrir com padrão
  React.useEffect(() => {
    if (open) {
      setSubArea(subAreaDefault)
      setSolicitanteNome(userName)
    }
  }, [open, subAreaDefault, userName])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFotoFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemoverFoto = () => {
    setFotoFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) {
      alert('Informe o título da demanda.')
      return
    }

    setSalvando(true)
    try {
      await admRhService.criarDemanda({
        redeId,
        lojaId,
        subArea,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        prazo: prazo || undefined,
        responsavel: responsavel.trim() || undefined,
        solicitanteNome: solicitanteNome.trim() || userName,
        solicitanteUsuarioId: userId,
        categoriaCasoUso,
        fotoFile,
      })

      // Registra evento de funil: criou primeira demanda
      try {
        const { funnelService } = await import('@/services/funnelService')
        await funnelService.registrarEvento({
          evento: 'criou_primeira_demanda',
          userId,
          userNome: solicitanteNome.trim() || userName,
          detalhes: { titulo: titulo.trim(), subArea, prioridade },
        })
      } catch {
        /* ignore */
      }

      // Reset
      setTitulo('')
      setDescricao('')
      setPrazo('')
      setResponsavel('')
      handleRemoverFoto()
      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao cadastrar demanda Adm/RH:', err)
      alert('Não foi possível enviar a demanda. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#0F766E]" />
            <span>Nova Demanda para a Área Responsável</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            A loja registra a necessidade com evidência fotográfica. A área responsável (RH, DP,
            ADM, Financeiro ou Fiscal) recebe para tratamento imediato.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          {/* Sub-área */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Área de Destino *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(Object.keys(SUB_AREAS_INFO) as SubAreaAdmRh[]).map((areaKey) => {
                const isSelected = subArea === areaKey
                return (
                  <button
                    key={areaKey}
                    type="button"
                    onClick={() => setSubArea(areaKey)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                        : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:border-[#0F766E]/50'
                    }`}
                  >
                    {areaKey.toUpperCase()}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1 italic">{SUB_AREAS_INFO[subArea].desc}</p>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Título da Demanda *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ficha de admissão eSocial, Divergência de sangria, Circular quadro de avisos..."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Categoria / Caso de uso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Tipo de Demanda
              </label>
              <select
                value={categoriaCasoUso}
                onChange={(e) => setCategoriaCasoUso(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="documentos_legais">
                  Documentos Legais (eSocial, Alvarás, Atestados)
                </option>
                <option value="documentos_internos">Documentos Internos / Procedimentos</option>
                <option value="escalas_loja">Escala da Loja / Folgas / Horários</option>
                <option value="avisos_internos">Quadro de Avisos / Circulares</option>
                <option value="quadro_loja">Quadro de Funcionários / Vagas</option>
                <option value="outro">Outro Registro da Loja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Prioridade *
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeAdmRh)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="baixa">Baixa (Rotina padrão)</option>
                <option value="media">Média (Acompanhamento normal)</option>
                <option value="alta">Alta (Impacta operação da loja)</option>
                <option value="urgente">Urgente (Prazo legal / Risco fiscal)</option>
              </select>
            </div>
          </div>

          {/* Prazo e Solicitante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Prazo Desejado
              </label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Solicitante na Loja
              </label>
              <input
                type="text"
                value={solicitanteNome}
                onChange={(e) => setSolicitanteNome(e.target.value)}
                placeholder="Nome do gerente ou operador"
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Descrição detalhada */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Descrição e Detalhes da Demanda
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Explique o que a loja precisa que a área trate, anexe informações de colaboradores, valores ou prazos acordados..."
              className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg p-2.5 text-[#1F2937] outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Evidência Fotográfica (Upload / Câmera) */}
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#0F766E]" />
                <span>Evidência Fotográfica (Foto / Documento)</span>
              </label>
              {fotoFile && (
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Remover foto</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Tire foto com a câmera do celular ou anexe imagem da ficha assinada, atestado,
              comprovante de sangria ou quadro da loja.
            </p>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full text-xs text-[#4B5563] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-[#0F766E] hover:file:bg-teal-100 cursor-pointer"
            />

            {previewUrl && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-[#E5E7EB] max-h-40 flex items-center justify-center bg-gray-900">
                <img
                  src={previewUrl}
                  alt="Prévia da evidência fotográfica"
                  className="max-h-40 object-contain w-full"
                />
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !titulo.trim()}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Registrar e Enviar Demanda</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
