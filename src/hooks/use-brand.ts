import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { isGestorGeralUser } from '@/lib/perfil-utils'
import { pb } from '@/lib/pocketbase/client'
import type { Cliente } from '@/types'

export interface BrandConfig {
  isWhiteLabelActive: boolean
  redeNome?: string
  nomeExibicao?: string
  logoUrl?: string
  corPrimaria?: string
  corSecundaria?: string
}

/**
 * Hook que identifica se o usuário atual pertence a uma rede personalizada (white-label).
 * - O Gestor Geral (Dfarias) NUNCA recebe white-label.
 * - Usuários sem rede ou genéricos usam a identidade padrão VivaVarejo.
 * - Usuários vinculados a uma rede com marca definida (logo, nome_exibicao, cor_primaria)
 *   têm a marca aplicada suavemente via CSS variables e assets customizados.
 */
export function useBrand(): BrandConfig {
  const { user } = useAuth()

  // 1. Gestor geral nunca recebe white-label; usuários demo@ / teste@ genéricos também não mudam de aparência
  const userEmail = user?.email?.toLowerCase().trim() || ''

  if (!user || isGestorGeralUser(user)) {
    return {
      isWhiteLabelActive: false,
    }
  }

  // 2. Extrai dados do cliente vinculado
  const clienteExpand = user.expand?.cliente as Cliente | undefined

  // Se não houver cliente vinculado
  if (!user.cliente && !clienteExpand) {
    return {
      isWhiteLabelActive: false,
    }
  }

  // Usuários demo@/teste@ genéricos existentes sem marca configurada não mudam de aparência.
  // Mas se for uma conta de demonstração vinculada expressamente a uma rede com marca definida (ex: demo.supermaxi@...), white-label ativa.
  const hasCustomBrand = Boolean(
    clienteExpand &&
    (clienteExpand.nome_exibicao ||
      clienteExpand.logo ||
      (clienteExpand.cor_primaria && clienteExpand.cor_primaria !== '#0F766E') ||
      (clienteExpand.nome && !clienteExpand.nome.toLowerCase().includes('vivavarejo'))),
  )

  const isGenericDemoWithoutBrand =
    (userEmail === 'demo@vivavarejo.com.br' ||
      userEmail.startsWith('teste@') ||
      userEmail.startsWith('demo@')) &&
    !hasCustomBrand

  if (isGenericDemoWithoutBrand) {
    return {
      isWhiteLabelActive: false,
    }
  }

  const clienteNome = clienteExpand?.nome_exibicao || clienteExpand?.nome
  const corPrimaria = clienteExpand?.cor_primaria?.trim()
  const corSecundaria = clienteExpand?.cor_secundaria?.trim()
  let logoUrl: string | undefined

  if (clienteExpand?.logo && clienteExpand?.id) {
    logoUrl = pb.files.getUrl(clienteExpand, clienteExpand.logo)
  }

  const isWhiteLabelActive = Boolean(clienteExpand && hasCustomBrand)

  return {
    isWhiteLabelActive,
    redeNome: clienteExpand?.nome,
    nomeExibicao: clienteNome,
    logoUrl,
    corPrimaria: corPrimaria || undefined,
    corSecundaria: corSecundaria || undefined,
  }
}

/**
 * Injeta dinamicamente as variáveis de estilo da marca no elemento raiz quando ativo,
 * restaurando as variáveis padrão ao desmontar ou deslogar.
 */
export function useBrandTheme() {
  const brand = useBrand()

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    if (brand.isWhiteLabelActive && brand.corPrimaria) {
      // Aplica cor primária da rede nas CSS variables chave
      root.style.setProperty('--brand-primary', brand.corPrimaria)
      root.style.setProperty('--primary', brand.corPrimaria)
      root.style.setProperty('--ring', brand.corPrimaria)
      if (brand.corSecundaria) {
        root.style.setProperty('--brand-secondary', brand.corSecundaria)
      } else {
        root.style.removeProperty('--brand-secondary')
      }
    } else {
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-secondary')
      root.style.removeProperty('--primary')
      root.style.removeProperty('--ring')
    }

    return () => {
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-secondary')
      root.style.removeProperty('--primary')
      root.style.removeProperty('--ring')
    }
  }, [brand.isWhiteLabelActive, brand.corPrimaria])

  return brand
}
