import type { User, ProfileType } from '@/types'

export type ModoPerfil = 'campo' | 'gestao'

/**
 * Resolve o modelo do app do usuário:
 * - 'rede': Modelo ADM de Rede (amplo, parecido com a DEMO: multi-rede, lojas, Comercial completo, negociações, layout, gestão de usuários)
 * - 'gerente': Modelo GERENTE (enxuto, foco operação diária: Meu Dia/agenda, execução com evidência, validações e o essencial do Comercial da loja)
 */
export function getUserProfileType(user: User | null): ProfileType {
  if (!user) return 'rede'
  // Se tiver o campo profile_type salvo no usuário
  if (user.profile_type === 'gerente') return 'gerente'
  if (user.profile_type === 'rede') return 'rede'

  // Se o perfil for estritamente admin ou adm_rede, é modelo rede
  if (user.perfil === 'admin' || user.perfil === 'adm_rede') return 'rede'

  // Se veio vinculado a cliente com tipo_pessoa = 'PF', modelo gerente
  if (
    user.expand?.cliente?.tipo_pessoa === 'PF' ||
    user.expand?.cliente?.profile_type === 'gerente'
  ) {
    return 'gerente'
  }

  // Se for funcionário operacional ou email de promotor/gerente de campo
  if (user.perfil === 'funcionario') return 'gerente'

  // Por padrão compatível com a base existente: 'rede'
  return 'rede'
}

/**
 * Determina se o usuário opera no modelo Gerente (enxuto, chão de loja)
 */
export function isPerfilGerente(user: User | null): boolean {
  return getUserProfileType(user) === 'gerente'
}

/**
 * Determina se o usuário opera no modelo ADM de Rede (amplo, multi-loja, comercial)
 */
export function isPerfilRede(user: User | null): boolean {
  return getUserProfileType(user) === 'rede'
}

/**
 * Determina se o usuário logado opera no perfil de CAMPO (operacional de loja/promotor)
 * ou no perfil de GESTÃO (analítico, estratégico, coordenação).
 */
export function isPerfilCampo(user: User | null): boolean {
  if (!user) return false
  const perfil = user.perfil || (user.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

  // Se for admin ou adm_rede, é estritamente gestão
  if (perfil === 'admin' || perfil === 'adm_rede') {
    return false
  }

  // Se o perfil for 'funcionario', é campo
  if (perfil === 'funcionario') {
    return true
  }

  // Se o email ou cargo contiver indicativo de promotor / repositor
  const emailLower = user.email.toLowerCase()
  const nameLower = (user.name || '').toLowerCase()

  if (
    emailLower.includes('promotor') ||
    emailLower.includes('repositor') ||
    emailLower.includes('campo') ||
    nameLower.includes('promotor') ||
    nameLower.includes('repositor')
  ) {
    return true
  }

  // Se o usuário alternou manualmente via preferência local
  const override = localStorage.getItem(`vivavarejo_modo_perfil_${user.id}`)
  if (override === 'campo') return true
  if (override === 'gestao') return false

  // Por padrão: 'funcionario' é campo.
  // 'lider' pode alternar ou ver gestão por padrão, mas líderes de campo também usam 'Meu Dia'.
  // Para proporcionar a melhor experiência móvel de campo sem quebrar contas de gerente:
  return false
}

export function getModoPerfil(user: User | null): ModoPerfil {
  return isPerfilCampo(user) ? 'campo' : 'gestao'
}

export function setModoPerfilOverride(userId: string, modo: ModoPerfil) {
  localStorage.setItem(`vivavarejo_modo_perfil_${userId}`, modo)
}

/**
 * Identifica se o usuário é o Gestor Geral (Dfarias):
 * critério padrão do sistema: perfil 'admin' ou email 'dfarias53@gmail.com'.
 */
export function isGestorGeralUser(
  user: { email?: string | null; perfil?: string | null } | null | undefined,
): boolean {
  if (!user) return false
  const emailLower = (user.email || '').toLowerCase().trim()
  const perfil = user.perfil || (emailLower === 'dfarias53@gmail.com' ? 'admin' : '')
  return perfil === 'admin' || emailLower === 'dfarias53@gmail.com'
}
