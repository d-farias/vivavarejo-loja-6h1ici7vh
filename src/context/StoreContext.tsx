import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { lojasService } from '@/services/lojas'
import { funcionariosService } from '@/services/funcionarios'
import type { Loja } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'

interface StoreContextType {
  lojas: Loja[]
  lojaSelecionadaId: string // 'todas' ou id da loja
  lojaSelecionada: Loja | null
  selecionarLoja: (id: string) => void
  loadingLojas: boolean
  recarregarLojas: () => Promise<void>
  temMultiplasLojas: boolean
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const STORAGE_KEY = 'painel_loja_selecionada_id'

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [lojaSelecionadaId, setLojaSelecionadaId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'todas'
  })
  const [loadingLojas, setLoadingLojas] = useState(true)

  const recarregarLojas = useCallback(async () => {
    if (!user) {
      setLojas([])
      setLoadingLojas(false)
      return
    }

    setLoadingLojas(true)
    try {
      const perfil = user.perfil || (user.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

      if (perfil === 'admin') {
        // ADM Geral vê todas as lojas de todas as redes
        const todasLojas = await lojasService.getAll()
        setLojas(todasLojas)
      } else if (perfil === 'adm_rede') {
        // ADM de Rede vê apenas as lojas da sua rede/cliente
        const todasLojas = await lojasService.getAll()
        if (user.cliente) {
          const lojasDaRede = todasLojas.filter((l) => l.cliente === user.cliente)
          setLojas(lojasDaRede)
        } else {
          setLojas(todasLojas)
        }
      } else {
        // Líder ou funcionário: vê apenas as lojas às quais está vinculado via funcionario.usuario
        const vinculos = await funcionariosService.getByUsuario(user.id)
        const lojaIdsVinculadas = new Set<string>()
        vinculos.forEach((v) => {
          if (v.loja && v.ativo !== false) {
            lojaIdsVinculadas.add(v.loja)
          }
        })

        if (lojaIdsVinculadas.size > 0) {
          const todasLojas = await lojasService.getAll()
          const permitidas = todasLojas.filter((l) => lojaIdsVinculadas.has(l.id))
          setLojas(permitidas)
        } else {
          // Fallback para líder sem vínculo restrito explícito
          const todasLojas = await lojasService.getAll()
          setLojas(todasLojas)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar lojas para o usuário:', err)
    } finally {
      setLoadingLojas(false)
    }
  }, [user])

  useEffect(() => {
    recarregarLojas()
  }, [recarregarLojas])

  // Ajustar seleção de loja se a atual não for mais válida
  useEffect(() => {
    if (loadingLojas) return

    if (lojas.length === 0) {
      setLojaSelecionadaId('todas')
      localStorage.setItem(STORAGE_KEY, 'todas')
      return
    }

    // Se o usuário só tem 1 loja, seleciona ela automaticamente
    if (lojas.length === 1 && lojaSelecionadaId === 'todas') {
      const unica = lojas[0].id
      setLojaSelecionadaId(unica)
      localStorage.setItem(STORAGE_KEY, unica)
      return
    }

    // Se a selecionada não existe na lista e não é 'todas', volta para 'todas' ou primeira
    if (lojaSelecionadaId !== 'todas' && !lojas.some((l) => l.id === lojaSelecionadaId)) {
      const fallback = lojas.length > 0 ? (lojas.length === 1 ? lojas[0].id : 'todas') : 'todas'
      setLojaSelecionadaId(fallback)
      localStorage.setItem(STORAGE_KEY, fallback)
    }
  }, [lojas, lojaSelecionadaId, loadingLojas])

  // Realtime updates em lojas
  useRealtime<Loja>(
    'lojas',
    useCallback(() => {
      recarregarLojas()
    }, [recarregarLojas]),
    !!user,
  )

  const selecionarLoja = (id: string) => {
    setLojaSelecionadaId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const lojaSelecionada = lojas.find((l) => l.id === lojaSelecionadaId) || null
  const temMultiplasLojas = lojas.length > 1

  return (
    <StoreContext.Provider
      value={{
        lojas,
        lojaSelecionadaId,
        lojaSelecionada,
        selecionarLoja,
        loadingLojas,
        recarregarLojas,
        temMultiplasLojas,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
