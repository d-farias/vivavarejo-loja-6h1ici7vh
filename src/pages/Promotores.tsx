import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { useI18n } from '@/lib/i18n/context'
import { StoreSelector } from '@/components/StoreSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { PromotoresFornecedoresManager } from '@/components/PromotoresFornecedoresManager'
import { visitasPromotorService, rotinasPromotorService } from '@/services/visitasPromotor'
import { promotoresService } from '@/services/promotores'
import { fornecedoresService } from '@/services/fornecedores'
import { usersService } from '@/services/funcionarios'
import { clientesService } from '@/services/clientes'
import { saveLocalCache, getLocalCache, enqueueOfflineItem } from '@/lib/offline/db'
import { OfflineStatusIndicator } from '@/components/OfflineStatusIndicator'
import type { VisitaPromotor, RotinaPromotor, Promotor, Fornecedor, User, Cliente } from '@/types'
import { Handshake, AlertTriangle, CheckCircle2, X } from 'lucide-react'

export default function PromotoresPage() {
  const { user } = useAuth()
  const { lojas, lojaSelecionadaId } = useStore()
  const { t } = useI18n()

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
    const cacheKey = `vivavarejo_promotores_${lojaSelecionadaId || 'all'}`

    try {
      // 1. Tenta carregar do cache local IndexedDB primeiro
      const cached = await getLocalCache<{
        visitas: VisitaPromotor[]
        promotores: Promotor[]
        fornecedores: Fornecedor[]
        rotinasPromotor: RotinaPromotor[]
      }>(cacheKey)

      if (cached) {
        setVisitas(cached.visitas || [])
        setPromotores(cached.promotores || [])
        setFornecedores(cached.fornecedores || [])
        setRotinasPromotor(cached.rotinasPromotor || [])
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setLoading(false)
        return
      }

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

      // Salva no IndexedDB
      saveLocalCache(cacheKey, {
        visitas: vis,
        promotores: prom,
        fornecedores: forn,
        rotinasPromotor: rotProm,
      }).catch(() => {})
    } catch (err) {
      console.warn('Rede instável ao carregar dados de promotores, usando cache:', err)
      const cached = await getLocalCache<{
        visitas: VisitaPromotor[]
        promotores: Promotor[]
        fornecedores: Fornecedor[]
        rotinasPromotor: RotinaPromotor[]
      }>(cacheKey)
      if (cached) {
        setVisitas(cached.visitas || [])
        setPromotores(cached.promotores || [])
        setFornecedores(cached.fornecedores || [])
        setRotinasPromotor(cached.rotinasPromotor || [])
      }
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
              {t.promotores.title}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
              {t.promotores.badgeStoreOp}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">{t.promotores.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <OfflineStatusIndicator />
          <StoreSelector />
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-md text-xs sm:text-sm flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-[#1F2937]'
              : 'bg-red-50 border-red-200 text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
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
            const agoraIso = new Date().toISOString()
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
              // Modo Offline: enfileira para envio
              let fotoBlob: Blob | undefined
              let fotoFileName: string | undefined
              const extraFotos: Array<{ fieldName: string; blob: Blob; fileName: string }> = []
              const plainPayload: Record<string, unknown> = {}

              if (params instanceof FormData) {
                params.forEach((val, key) => {
                  if (val instanceof File) {
                    if (key === 'foto_trabalho' && !fotoBlob) {
                      fotoBlob = val
                      fotoFileName = val.name
                    } else {
                      extraFotos.push({ fieldName: key, blob: val, fileName: val.name })
                    }
                  } else {
                    plainPayload[key] = val
                  }
                })
              } else {
                Object.assign(plainPayload, params)
                if (params.foto_trabalho instanceof File) {
                  fotoBlob = params.foto_trabalho
                  fotoFileName = params.foto_trabalho.name
                }
              }

              const vis = visitas.find((v) => v.id === visitaId)
              await enqueueOfflineItem({
                type: 'visita_conclusao',
                createdAt: agoraIso,
                targetId: visitaId,
                userId: user?.id,
                lojaId: vis?.loja,
                payload: plainPayload,
                fotoBlob,
                fotoFileName,
                fotoFieldName: 'foto_trabalho',
                extraFotos: extraFotos.length > 0 ? extraFotos : undefined,
              })

              setVisitas((prev) =>
                prev.map((v) =>
                  v.id === visitaId ? { ...v, status: 'realizada', realizada_em: agoraIso } : v,
                ),
              )
              showFeedback('Visita concluída no aparelho (Modo Offline)!')
              return
            }

            try {
              if (params instanceof FormData) {
                if (user?.id && !params.has('registrado_por')) {
                  params.append('registrado_por', user.id)
                }
                await visitasPromotorService.registrarConclusao(visitaId, params)
              } else {
                await visitasPromotorService.registrarConclusao(visitaId, {
                  ...params,
                  registrado_por: user?.id,
                })
              }
              showFeedback('Visita avaliada e concluída com sucesso!')
              loadData()
            } catch (err) {
              console.warn('Erro de rede ao concluir visita, gravando na fila:', err)
              const vis = visitas.find((v) => v.id === visitaId)
              await enqueueOfflineItem({
                type: 'visita_conclusao',
                createdAt: agoraIso,
                targetId: visitaId,
                userId: user?.id,
                lojaId: vis?.loja,
                payload: params instanceof FormData ? {} : (params as any),
              })
              showFeedback('Salvo na fila de sincronização (Modo Offline)!')
            }
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
