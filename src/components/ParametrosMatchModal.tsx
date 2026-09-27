import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { matchService } from '@/services/matchService'
import type { MatchConfiguracao } from '@/types'

interface ParametrosMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redeId?: string
  onSucesso: () => void
}

export function ParametrosMatchModal({
  open,
  onOpenChange,
  redeId,
  onSucesso,
}: ParametrosMatchModalProps) {
  const [slaDias, setSlaDias] = useState<number>(3)
  const [estoqueCritico, setEstoqueCritico] = useState<number>(10)
  const [metodologia, setMetodologia] = useState<string>('venda_media_x_dias')
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open && redeId) {
      setCarregando(true)
      matchService
        .obterConfiguracao(redeId)
        .then((cfg: MatchConfiguracao | null) => {
          if (cfg) {
            setSlaDias(cfg.sla_dias_padrao || 3)
            setEstoqueCritico(cfg.estoque_critico_padrao || 10)
            setMetodologia(cfg.metodologia_potencial || 'venda_media_x_dias')
          }
        })
        .finally(() => setCarregando(false))
    }
  }, [open, redeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!redeId) {
      alert('Selecione uma rede ou cliente válido.')
      return
    }

    setSalvando(true)
    try {
      await matchService.salvarConfiguracao({
        redeId,
        slaDiasPadrao: Number(slaDias) || 3,
        estoqueCriticoPadrao: Number(estoqueCritico) || 10,
        metodologiaPotencial: metodologia,
      })

      onOpenChange(false)
      onSucesso()
    } catch (err) {
      console.error('Erro ao salvar parâmetros no Integração:', err)
      alert('Não foi possível salvar os parâmetros. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] text-[#1F2937] p-5 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              Parametrização por Rede • VivaVarejo Integração
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#0F766E]" />
            <span>Configurações & Parâmetros do Integração</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#4B5563]">
            Ajuste as regras de cálculo do motor de integração, nível crítico de estoque e meta de
            SLA em dias.
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="py-8 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0F766E]" />
            <span>Carregando parâmetros...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                SLA Padrão de Resolução (em dias)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={slaDias}
                onChange={(e) => setSlaDias(Number(e.target.value))}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E] font-bold"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Prazo máximo para suprimento via CD ou fornecedor antes de estourar indicador de
                SLA.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Estoque Crítico Padrão na Loja (unidades)
              </label>
              <input
                type="number"
                min={1}
                required
                value={estoqueCritico}
                onChange={(e) => setEstoqueCritico(Number(e.target.value))}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E] font-bold"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Abaixo deste saldo o sistema aciona o status de <strong>Risco de Ruptura</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Metodologia de Venda Perdida em R$
              </label>
              <select
                value={metodologia}
                onChange={(e) => setMetodologia(e.target.value)}
                className="w-full text-xs bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-2 text-[#1F2937] outline-none focus:border-[#0F766E]"
              >
                <option value="venda_media_x_dias">Venda Média Diária × Lead Time (Padrão)</option>
                <option value="venda_media_x_sla">Venda Média Diária × SLA da Rede</option>
                <option value="valor_fixo_curva">Ponderação por Curva ABC</option>
              </select>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
              <div className="font-bold text-[#0F766E] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Prático e sem burocracia</span>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-relaxed">
                As regras valem para todas as lojas da rede de forma imediata. O motor de decisão
                utiliza esses valores para sugerir antecipação antes de faltar na gôndola.
              </p>
            </div>

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
                disabled={salvando}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold gap-1.5 shadow-2xs"
              >
                {salvando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Parâmetros</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
