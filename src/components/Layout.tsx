import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
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
  Users,
  Shield,
  KeyRound,
  Handshake,
  MessageSquare,
  MoreVertical,
  CalendarCheck,
  ShieldAlert,
  Smartphone,
  GitBranch,
} from 'lucide-react'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import { PwaInstallModal } from '@/components/PwaInstallModal'
import { InactivityWarningModal } from '@/components/InactivityWarningModal'
import { BottomNavMobile } from '@/components/BottomNavMobile'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { useAutoLogout } from '@/hooks/use-auto-logout'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [falarEspecialistaOpen, setFalarEspecialistaOpen] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)

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
  const isCampo =
    perfil === 'funcionario' || emailLower.includes('promotor') || emailLower.includes('repositor')
  const isAdminGeral = perfil === 'admin'
  const isAdmRede = perfil === 'adm_rede'
  const hasAdminAccess = isAdminGeral || isAdmRede
  const isLiderOrAdmin = perfil === 'admin' || perfil === 'adm_rede' || perfil === 'lider'

  // Se for perfil campo, exibe navegação simples e operacional focada em execução.
  // Se for gestão, exibe navegação analítica completa.
  const navLinks = isCampo
    ? [
        { to: '/meu-dia', label: 'Meu Dia', icon: Calendar },
        { to: '/promotores', label: 'Visitas', icon: Handshake },
        { to: '/agenda', label: 'Tarefas', icon: ListChecks },
        { to: '/validades', label: 'Validades', icon: CalendarCheck },
      ]
    : [
        { to: '/agenda', label: 'Agenda', icon: Calendar },
        { to: '/rotinas', label: 'Rotinas', icon: ListChecks },
        { to: '/validades', label: 'Validade × Calendário', icon: CalendarCheck },
        { to: '/perdas', label: 'Perdas & Inventário', icon: ShieldAlert },
        ...(isLiderOrAdmin ? [{ to: '/promotores', label: 'Promotores', icon: Handshake }] : []),
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        ...(hasAdminAccess
          ? [
              {
                to: '/admin',
                label: isAdmRede ? 'Workflow Rede' : 'Workflow Geral',
                icon: GitBranch,
              },
            ]
          : []),
      ]

  return (
    <div className="flex flex-col min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Top Navigation Bar escuro premium */}
      <header className="sticky top-0 z-40 w-full bg-[#0B1220]/95 backdrop-blur-md border-b border-[#1E293B] transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
                {/* Compact square diamond logo */}
                <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider uppercase text-white leading-tight">
                  VivaVarejo
                </span>
              </div>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          {!isAuthPage && user && (
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `relative px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-[#151E30] font-semibold'
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#151E30]/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="absolute bottom-[-6px] left-3 right-3 h-[2px] bg-[#3B82F6] rounded-full transition-all duration-200" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right Action / Avatar */}
          <div className="flex items-center gap-2">
            {!isAuthPage && user && (
              <button
                type="button"
                onClick={() => setFalarEspecialistaOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#151E30] border border-[#24344E] hover:border-[#3B82F6] hover:text-[#60A5FA] text-[#CBD5E1] shadow-2xs transition-colors"
                title="Fale diretamente com o consultor especialista"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Falar com especialista</span>
              </button>
            )}

            {!isAuthPage && user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Menu de 3 Pontos (⋮) no Cabeçalho / Topbar à Direita */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-xl border border-[#24344E] hover:border-[#3B82F6] bg-[#151E30] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30"
                      title="Contato com especialista"
                      aria-label="Contato com especialista"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-[#151E30] border border-[#223049] shadow-2xl text-white"
                  >
                    <DropdownMenuItem
                      onClick={() => setFalarEspecialistaOpen(true)}
                      className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2.5 text-[#CBD5E1] hover:text-white hover:bg-[#1E293B]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#60A5FA]" />
                      <span>Falar com especialista</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Avatar do Usuário */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/30 text-[#60A5FA] hover:bg-blue-500/25 flex items-center justify-center font-semibold text-xs tracking-wider transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30"
                      title={user.name || user.email}
                      aria-label="Menu do usuário"
                    >
                      {getInitials(user.name, user.email)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-[#151E30] border border-[#223049] shadow-2xl text-white"
                  >
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white leading-none">
                            {user.name || 'Líder'}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/20 text-[#60A5FA]">
                            {perfil}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] truncate leading-none">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    {hasAdminAccess && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2 text-[#60A5FA] hover:bg-[#1E293B]"
                        >
                          <GitBranch className="w-4 h-4" />
                          <span>{isAdmRede ? 'Workflow Rede' : 'Workflow Geral'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#223049]" />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setChangePasswordOpen(true)}
                      className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2 text-[#CBD5E1] hover:text-white hover:bg-[#1E293B]"
                    >
                      <KeyRound className="w-4 h-4 text-[#94A3B8]" />
                      <span>Alterar senha</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#223049]" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da conta</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#151E30] min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Abrir menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : isAuthPage ? (
              <span className="text-xs text-[#94A3B8] hidden sm:inline">Acesso de Liderança</span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && !isAuthPage && user && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-[#0D1526] h-full shadow-2xl flex flex-col z-10 border-r border-[#1E293B] transform transition-transform duration-200 ease-in-out text-white">
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white">
                  <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  VivaVarejo
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#1E293B] bg-[#151E30] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-[#60A5FA] font-semibold text-xs flex items-center justify-center border border-blue-500/30">
                {getInitials(user.name, user.email)}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {user.name || 'Líder'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-blue-500/20 text-[#60A5FA]">
                    {perfil}
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate">{user.email}</div>
              </div>
            </div>

            <nav className="p-3 space-y-1.5 flex-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#2563EB] text-white font-semibold shadow-md shadow-blue-600/30'
                          : 'text-[#94A3B8] hover:bg-[#151E30] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                )
              })}

              <div className="pt-3 space-y-2 border-t border-[#1E293B] mt-2">
                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleOpenInstall()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#60A5FA] bg-[#151E30] border border-[#24344E] hover:border-[#3B82F6] transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-[#3B82F6]" />
                    <span>Instalar app no celular</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setFalarEspecialistaOpen(true)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar com especialista</span>
                </button>
              </div>
            </nav>

            <div className="p-3 border-t border-[#1E293B] space-y-1 bg-[#0B1220]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setChangePasswordOpen(true)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#CBD5E1] hover:bg-[#151E30] hover:text-white transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#94A3B8]" />
                <span>Alterar senha</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/15 transition-colors"
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

      {/* Footer escuro premium */}
      <footer className="w-full border-t border-[#1E293B] bg-[#0B1220] py-4 mt-auto pb-20 md:pb-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">VivaVarejo</span>
            <span className="text-xs font-mono font-bold bg-blue-500/15 text-[#60A5FA] px-1.5 py-0.5 rounded border border-blue-500/30">
              v0.0.98
            </span>
          </div>{' '}
          <div>
            <span>© {new Date().getFullYear()} VivaVarejo. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

      {/* Navegação inferior fixa no mobile (Item 5 da especificação) */}
      {!isAuthPage && user && (
        <BottomNavMobile isCampo={isCampo} onOpenMais={() => setMobileMenuOpen(true)} />
      )}
    </div>
  )
}
