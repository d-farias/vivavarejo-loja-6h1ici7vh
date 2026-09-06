import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { StoreSelector } from '@/components/StoreSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { PromotoresFornecedoresManager } from '@/components/PromotoresFornecedoresManager'
import { visitasPromotorService, rotinasPromotorService } from '@/services/visitasPromotor'
import { promotoresService } from '@/services/promotores'
import { fornecedoresService } from '@/services/fornecedores'
import { usersService } from '@/services/funcionarios'
import { clientesService } from '@/services/clientes'
import type { VisitaPromotor, RotinaPromotor, Promotor, Fornecedor, User, Cliente } from '@/types'
import { Handshake, AlertTriangle, CheckCircle2, X } from 'lucide-react'

export default function PromotoresPage() {
  const { user } = useAuth()
  const { lojas, lojaSelecionadaId } = useStore()

  const [visitas, setVisitas] = useState<VisitaPromotor[]>([])
  const [promotores, setPromotores] = useState<Promotor[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [rotinasPromotor, setRotinasPromotor] = useState<RotinaPromotor[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [loading, setLoading] = useState(true)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vis, prom, forn, rotProm, usrs, clis] = await Promise.all([
        visitasPromotorService.getAll(lojaSelecionadaId || undefined),
        promotoresService.getAll().catch(() => [] as Promotor[]),
        fornecedoresService.getAll().catch(() => [] as Fornecedor[]),
        rotinasPromotorService
          .getAll(lojaSelecionadaId || undefined)
          .catch(() => [] as RotinaPromotor[]),
        usersService.getAll().catch(() => [] as User[]),
        clientesService.getAll().catch(() => [] as Cliente[]),
      ])
      setVisitas(vis)
      setPromotores(prom)
      setFornecedores(forn)
      setRotinasPromotor(rotProm)
      setUsuarios(usrs)
      setClientes(clis)
    } catch (err) {
      console.error('Erro ao carregar dados de promotores:', err)
      showFeedback('Erro ao carregar módulo de promotores.', 'error')
    } finally {
      setLoading(false)
    }
  }, [lojaSelecionadaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
              Promotores & Fornecedores
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB]">
              Operação de Loja
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Gestão de visitas, representantes de marcas e rotinas de abastecimento e auditoria em
            loja
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StoreSelector />
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-md text-xs sm:text-sm flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-blue-50 border-[#2563EB]/30 text-[#1F2937]'
              : 'bg-red-50 border-red-200 text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-64 w-full bg-gray-200 rounded-lg" />
        </div>
      ) : (
        <PromotoresFornecedoresManager
          visitas={visitas}
          promotores={promotores}
          fornecedores={fornecedores}
          lojas={lojas}
          rotinasPromotor={rotinasPromotor}
          usuarios={usuarios}
          clientes={clientes}
          onRefresh={loadData}
          onSaveVisita={async (payload, id) => {
            if (id) {
              await visitasPromotorService.update(id, payload)
              showFeedback('Visita atualizada!')
            } else {
              await visitasPromotorService.create(payload)
              showFeedback('Visita agendada com sucesso!')
            }
            loadData()
          }}
          onConcluirVisita={async (visitaId, params) => {
            await visitasPromotorService.registrarConclusao(visitaId, {
              ...params,
              registrado_por: user?.id,
            })
            showFeedback('Visita concluída com sucesso!')
            loadData()
          }}
          onCancelarVisita={async (visitaId, motivo) => {
            await visitasPromotorService.cancelarVisita(visitaId, motivo)
            showFeedback('Visita cancelada.')
            loadData()
          }}
          onDeleteVisita={async (visitaId) => {
            await visitasPromotorService.delete(visitaId)
            showFeedback('Visita excluída.')
            loadData()
          }}
          onSavePromotor={async (payload, id) => {
            if (id) {
              await promotoresService.update(id, payload)
              showFeedback('Promotor atualizado!')
            } else {
              await promotoresService.create(payload)
              showFeedback('Promotor cadastrado!')
            }
            loadData()
          }}
          onDeletePromotor={async (prom) => {
            const dep = await promotoresService.countDependencies(prom.id)
            if (dep.visitasCount > 0) {
              alert(
                `Não é possível excluir: existem ${dep.visitasCount} visita(s) vinculadas a este promotor.`,
              )
              return
            }
            if (confirm(`Deseja excluir o promotor "${prom.nome}"?`)) {
              await promotoresService.delete(prom.id)
              showFeedback('Promotor excluído.')
              loadData()
            }
          }}
          onSaveFornecedor={async (payload, id) => {
            if (id) {
              await fornecedoresService.update(id, payload)
              showFeedback('Fornecedor atualizado!')
            } else {
              await fornecedoresService.create(payload)
              showFeedback('Fornecedor cadastrado com sucesso!')
            }
            loadData()
          }}
          onDeleteFornecedor={async (forn) => {
            const dep = await fornecedoresService.countDependencies(forn.id)
            if (dep.promotoresCount > 0 || dep.rotinasCount > 0) {
              alert(
                `Não é possível excluir: existem ${dep.promotoresCount} promotor(es) e ${dep.rotinasCount} rotina(s) vinculadas a este fornecedor.`,
              )
              return
            }
            if (confirm(`Deseja excluir o fornecedor "${forn.nome}"?`)) {
              await fornecedoresService.delete(forn.id)
              showFeedback('Fornecedor excluído.')
              loadData()
            }
          }}
          onSaveRotinaPromotor={async (payload, id) => {
            if (id) {
              await rotinasPromotorService.update(id, payload)
              showFeedback('Rotina de promotor atualizada!')
            } else {
              await rotinasPromotorService.create(payload)
              showFeedback('Rotina de promotor cadastrada!')
            }
            loadData()
          }}
          onDeleteRotinaPromotor={async (rot) => {
            if (confirm(`Deseja excluir a rotina "${rot.titulo}"?`)) {
              await rotinasPromotorService.delete(rot.id)
              showFeedback('Rotina excluída.')
              loadData()
            }
          }}
        />
      )}
    </div>
  )
}
