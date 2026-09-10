import type { User, PerfilUsuario } from '@/types'

export type ModoPerfil = 'campo' | 'gestao'

/**
 * Determina se o usuário logado opera no perfil de CAMPO (operacional de loja/promotor)
 * ou no perfil de GESTÃO (analítico, estratégico, coordenação).
 *
 * Perfil CAMPO:
 * - Promotor de vendas / repositor externo
 * - Funções operacionais de loja: encarregado, repositor, líder de setor, fiscal de caixa
 * - User com perfil 'funcionario' ou explicitamente sinalizado
 *
 * Perfil GESTÃO:
 * - Admin geral
 * - Administrador de rede (adm_rede)
 * - Gerente geral de loja / Diretor
 * - Supervisor regional / Consultor
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
