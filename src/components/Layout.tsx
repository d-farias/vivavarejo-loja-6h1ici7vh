import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { APP_VERSION_LABEL } from '@/lib/version'
import { OfflineStatusIndicator } from '@/components/OfflineStatusIndicator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  ListChecks,
  KeyRound,
  Handshake,
  MessageSquare,
  CalendarCheck,
  ShieldAlert,
  Smartphone,
  GitBranch,
  TrendingUp,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import { PwaInstallModal } from '@/components/PwaInstallModal'
import { InactivityWarningModal } from '@/components/InactivityWarningModal'
import { BottomNavMobile } from '@/components/BottomNavMobile'
import { QuickAccessHubModal } from '@/components/QuickAccessHubModal'
import { ModeloDemonstrativoBanner } from '@/components/ModeloDemonstrativoBanner'
import { getUserProfileType, isGestorGeralUser } from '@/lib/perfil-utils'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { segmentosService } from '@/services/segmentos'
import { SeletorSegmentoModal } from '@/components/SeletorSegmentoModal'
import { useAutoLogout } from '@/hooks/use-auto-logout'
import { useBrandTheme } from '@/hooks/use-brand'

export default function Layout() {
  const { user, logout } = useAuth()
  const brand = useBrandTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [falarEspecialistaOpen, setFalarEspecialistaOpen] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)
  const [seletorSegmentoOpen, setSeletorSegmentoOpen] = useState(false)

  // Perfil operacional x gestão
  const emailLower = (user?.email || '').toLowerCase()
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwaInstall()

  const handleInactivityLogout = React.useCallback(() => {
    logout()
    navigate('/login', {
      replace: true,
      state: {
        expiredMessage:
          'Sua sessão expirou por inatividade para sua segurança. Faça login novamente.',
      },
    })
  }, [logout, navigate])

  const { showWarning, secondsRemaining, extendSession } = useAutoLogout({
    enabled: Boolean(user),
    onLogout: handleInactivityLogout,
  })

  const handleOpenInstall = async () => {
    if (isIOS) {
      setPwaModalOpen(true)
    } else {
      const res = await promptInstall()
      if (res === 'unavailable') {
        setPwaModalOpen(true)
      }
    }
  }

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/cadastro'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'GL'
  }

  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')
  const profileType = getUserProfileType(user)
  const isGerente = profileType === 'gerente'
  const isAdminGeral = perfil === 'admin'
  const isAdmRede = perfil === 'adm_rede'
  const hasAdminAccess = isAdminGeral || isAdmRede
  const isLiderOrAdmin = perfil === 'admin' || perfil === 'adm_rede' || perfil === 'lider'

  // Modelos de navegação definidos pelo usuário (Requisito 2):
  const isDemo = user?.email?.toLowerCase().trim() === 'demo@vivavarejo.com.br'

  // Modelos de navegação definidos pelo usuário (Requisito 2):
  // 1) CPF -> modelo GERENTE (enxuto, foco operação diária): Meu Dia, Agenda/tarefas da loja,
  //    validações, Comercial essencial (sem módulos corporativos de gestão multi-rede / admin multi-lojas).
  // 2) CNPJ -> modelo ADM DE REDE (amplo, parecido com a DEMO existente): multi-rede, lojas,
  //    Comercial completo, negociações, layout/cronograma, gestão de usuários/Workflow.
  // Obs.: para demo@vivavarejo.com.br, o atalho "Rotinas & Modelos" é removido da navegação conforme decisão do dono.
  const navLinksGerente = [
    { to: '/meu-dia', label: 'Meu Dia', icon: Calendar },
    { to: '/agenda', label: 'Agenda da Loja', icon: CalendarCheck },
    { to: '/validades', label: 'Validades', icon: ShieldAlert },
    { to: '/comercial', label: 'Comercial Loja', icon: TrendingUp },
    { to: '/adm-rh', label: 'Adm/RH', icon: Users },
    { to: '/rotinas', label: 'Rotinas & Padrões', icon: ListChecks },
  ]

  const navLinksRede = [
    { to: '/agenda', label: 'Agenda da Rede', icon: Calendar },
    ...(!isDemo ? [{ to: '/rotinas', label: 'Rotinas & Modelos', icon: ListChecks }] : []),
    { to: '/validades', label: 'Validade × Calendário', icon: CalendarCheck },
    { to: '/comercial', label: 'Comercial & Negociações', icon: TrendingUp },
    { to: '/adm-rh', label: 'Adm/RH', icon: Users },
    { to: '/perdas', label: 'Perdas & Inventário', icon: ShieldAlert },
    ...(isLiderOrAdmin ? [{ to: '/promotores', label: 'Promotores', icon: Handshake }] : []),
    ...(hasAdminAccess
      ? [
          {
            to: '/admin',
            label: isAdmRede ? 'Gestão da Rede' : 'Workflow Geral',
            icon: GitBranch,
          },
        ]
      : []),
  ]

  const segmentoAtivo = segmentosService.getSegmentoAtivo(user)
  const temSegmentoDefinido = Boolean(segmentoAtivo)

  // Requisito 3: "Quando o usuário ainda não definiu o segmento, mostrar esse componente em destaque
  // e OCULTAR do menu os módulos que dependem de definição (rotinas/agenda), conforme pedido:
  // 'até definir mantenha links ocultos'."
  const allNavLinks = isGerente ? navLinksGerente : navLinksRede
  const navLinks = temSegmentoDefinido
    ? allNavLinks
    : allNavLinks.filter(
        (link) => link.to !== '/rotinas' && link.to !== '/agenda' && link.to !== '/meu-dia',
      )

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F5] text-[#1F2937]">
      {/* Top Navigation Bar sóbrio tema claro */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-2xs transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-6">
            <NavLink
              to={isGerente ? '/meu-dia' : '/agenda'}
              className="flex items-center gap-2.5 group shrink-0"
            >
              {brand.isWhiteLabelActive && brand.logoUrl ? (
                <div className="h-9 max-w-[130px] flex items-center justify-center transition-transform group-hover:scale-105">
                  <img
                    src={brand.logoUrl}
                    alt={brand.nomeExibicao || 'Logo da Rede'}
                    className="max-h-9 max-w-[130px] object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor:
                      brand.isWhiteLabelActive && brand.corPrimaria ? brand.corPrimaria : '#0F766E',
                  }}
                >
                  <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight">
                  {brand.isWhiteLabelActive && brand.nomeExibicao
                    ? brand.nomeExibicao
                    : 'VivaVarejo'}
                </span>
                {brand.isWhiteLabelActive && (
                  <span className="text-[9px] font-semibold text-[#6B7280] leading-none">
                    Rede Parceira
                  </span>
                )}
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            {!isAuthPage && user && (
              <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      style={({ isActive }) =>
                        isActive && brand.isWhiteLabelActive && brand.corPrimaria
                          ? { backgroundColor: brand.corPrimaria, color: '#ffffff' }
                          : undefined
                      }
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                          isActive
                            ? brand.isWhiteLabelActive && brand.corPrimaria
                              ? 'text-white shadow-2xs'
                              : 'bg-[#0F766E] text-white shadow-2xs'
                            : 'text-[#4B5563] hover:text-[#1F2937] hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </NavLink>
                  )
                })}
              </nav>
            )}
          </div>

          {/* Right Action / Avatar */}
          <div className="flex items-center gap-2">
            {!isAuthPage && user && (
              <>
                {/* Indicador de status Offline / Online e fila de envio */}
                <OfflineStatusIndicator compact />

                {/* Botão de Trocar Segmento no Topo para Acesso Fácil */}
                <button
                  type="button"
                  onClick={() => setSeletorSegmentoOpen(true)}
                  style={
                    brand.isWhiteLabelActive && brand.corPrimaria
                      ? { borderColor: brand.corPrimaria, color: brand.corPrimaria }
                      : undefined
                  }
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E] text-[#374151] shadow-2xs transition-colors"
                  title={
                    segmentoAtivo
                      ? `Ramo: ${segmentoAtivo}. Clique para trocar.`
                      : 'Escolha o ramo da sua loja'
                  }
                >
                  <SlidersHorizontal
                    className="w-3.5 h-3.5"
                    style={{
                      color:
                        brand.isWhiteLabelActive && brand.corPrimaria
                          ? brand.corPrimaria
                          : '#0F766E',
                    }}
                  />
                  <span>{segmentoAtivo ? `Ramo: ${segmentoAtivo}` : 'Definir Ramo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFalarEspecialistaOpen(true)}
                  style={
                    brand.isWhiteLabelActive && brand.corPrimaria
                      ? {
                          backgroundColor: brand.corPrimaria,
                          borderColor: brand.corPrimaria,
                          color: '#ffffff',
                        }
                      : undefined
                  }
                  className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors ${
                    brand.isWhiteLabelActive && brand.corPrimaria
                      ? 'border hover:opacity-90'
                      : 'bg-white border border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E] text-[#374151]'
                  }`}
                  title="Fale diretamente com o consultor especialista"
                >
                  <MessageSquare
                    className="w-3.5 h-3.5"
                    style={
                      brand.isWhiteLabelActive && brand.corPrimaria
                        ? { color: '#ffffff' }
                        : { color: '#0F766E' }
                    }
                  />
                  <span>Falar com especialista</span>
                </button>
              </>
            )}

            {!isAuthPage && user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Avatar do Usuário */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] hover:bg-teal-100 flex items-center justify-center font-bold text-xs tracking-wider transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 shadow-2xs"
                      title={user.name || user.email}
                      aria-label="Menu do usuário"
                    >
                      {getInitials(user.name, user.email)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border border-[#E5E7EB] shadow-lg text-[#1F2937]"
                  >
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#1F2937] leading-none">
                            {user.name || 'Líder'}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                            {perfil}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] truncate leading-none">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    {hasAdminAccess && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2 text-[#0F766E] hover:bg-teal-50"
                        >
                          <GitBranch className="w-4 h-4" />
                          <span>{isAdmRede ? 'Workflow Rede' : 'Workflow Geral'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setChangePasswordOpen(true)}
                      className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2 text-[#374151] hover:text-[#1F2937] hover:bg-gray-50"
                    >
                      <KeyRound className="w-4 h-4 text-[#6B7280]" />
                      <span>Alterar senha</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer p-2.5 font-semibold text-xs flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da conta</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-[#4B5563] hover:text-[#1F2937] hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Abrir menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : isAuthPage ? (
              <span className="text-xs text-[#6B7280] hidden sm:inline">Acesso de Liderança</span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && !isAuthPage && user && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-r border-[#E5E7EB] transform transition-transform duration-200 ease-in-out text-[#1F2937]">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {brand.isWhiteLabelActive && brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.nomeExibicao || 'Logo da Rede'}
                    className="h-8 max-w-[100px] object-contain"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{
                      backgroundColor:
                        brand.isWhiteLabelActive && brand.corPrimaria
                          ? brand.corPrimaria
                          : '#0F766E',
                    }}
                  >
                    <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
                  </div>
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  {brand.isWhiteLabelActive && brand.nomeExibicao
                    ? brand.nomeExibicao
                    : 'VivaVarejo'}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#1F2937]"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#E5E7EB] bg-[#F7F7F5] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0F766E] font-bold text-xs flex items-center justify-center border border-teal-200">
                {getInitials(user.name, user.email)}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#1F2937] truncate">
                    {user.name || 'Líder'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
                    {perfil}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B7280] truncate">{user.email}</div>
              </div>
            </div>

            <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) =>
                      isActive && brand.isWhiteLabelActive && brand.corPrimaria
                        ? { backgroundColor: brand.corPrimaria, color: '#ffffff' }
                        : undefined
                    }
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? brand.isWhiteLabelActive && brand.corPrimaria
                            ? 'text-white font-bold shadow-sm'
                            : 'bg-[#0F766E] text-white font-bold shadow-sm'
                          : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1F2937]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                )
              })}

              <div className="pt-3 space-y-2 border-t border-[#E5E7EB] mt-2">
                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleOpenInstall()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#374151] bg-white border border-[#E5E7EB] hover:bg-gray-100 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-[#0F766E]" />
                    <span>Instalar app no celular</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setFalarEspecialistaOpen(true)
                  }}
                  style={
                    brand.isWhiteLabelActive && brand.corPrimaria
                      ? { backgroundColor: brand.corPrimaria }
                      : undefined
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] shadow-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar com especialista</span>
                </button>
              </div>
            </nav>

            <div className="p-3 border-t border-[#E5E7EB] space-y-1 bg-[#F7F7F5]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setChangePasswordOpen(true)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#374151] hover:bg-white hover:text-[#1F2937] transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#6B7280]" />
                <span>Alterar senha</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Banner do Modelo Demonstrativo com as 2 ações de configuração (Requisitos 3 e 4) */}
        {!isAuthPage && user && <ModeloDemonstrativoBanner />}
        <Outlet />
      </main>

      {/* Modal Alterar Senha */}
      {user && (
        <ChangePasswordModal
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          userEmail={user.email}
          userId={user.id}
        />
      )}

      {/* Modal de Escolha de Segmento (Obrigatório se não definido ou voluntário se clicado no botão) */}
      {!isAuthPage && user && (
        <SeletorSegmentoModal
          open={seletorSegmentoOpen || !temSegmentoDefinido}
          obrigatorio={!temSegmentoDefinido}
          onOpenChange={setSeletorSegmentoOpen}
          onSuccess={() => {
            setSeletorSegmentoOpen(false)
          }}
        />
      )}

      {/* Hub de Acesso Rápido (Logo após o login e na entrada do sistema, oculto para Gestor Geral) */}
      {!isAuthPage && user && !isGestorGeralUser(user) && <QuickAccessHubModal />}

      {/* Modal Falar com Especialista */}
      <FalarEspecialistaModal
        open={falarEspecialistaOpen}
        clienteId={user?.cliente}
        onOpenChange={setFalarEspecialistaOpen}
      />

      {/* Modal Instalar App (PWA) */}
      <PwaInstallModal
        open={pwaModalOpen}
        onOpenChange={setPwaModalOpen}
        isIOS={isIOS}
        onNativePrompt={async () => {
          await promptInstall()
          setPwaModalOpen(false)
        }}
      />

      {/* Modal de Aviso de Inatividade (Logout Automático aos 30min / Aviso aos 28min) */}
      <InactivityWarningModal
        open={showWarning}
        secondsRemaining={secondsRemaining}
        onExtend={extendSession}
        onLogoutNow={() => {
          handleInactivityLogout()
        }}
      />

      {/* Footer sóbrio tema claro */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-4 mt-auto pb-20 md:pb-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937]">
              {brand.isWhiteLabelActive && brand.nomeExibicao ? brand.nomeExibicao : 'VivaVarejo'}
            </span>
            <span className="text-xs font-mono font-bold bg-teal-50 text-[#0F766E] px-1.5 py-0.5 rounded border border-teal-200">
              {APP_VERSION_LABEL}
            </span>
          </div>{' '}
          <div>
            <span>
              © {new Date().getFullYear()}{' '}
              {brand.isWhiteLabelActive && brand.nomeExibicao
                ? `${brand.nomeExibicao} • VivaVarejo`
                : 'VivaVarejo'}
              . Todos os direitos reservados.
            </span>
          </div>
        </div>
      </footer>

      {/* Navegação inferior fixa no mobile (Item 5 da especificação) */}
      {!isAuthPage && user && (
        <BottomNavMobile isCampo={isGerente} onOpenMais={() => setMobileMenuOpen(true)} />
      )}
    </div>
  )
}
