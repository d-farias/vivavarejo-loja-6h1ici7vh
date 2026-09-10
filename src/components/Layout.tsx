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
    <div className="flex flex-col min-h-screen bg-[#F7F7F5] text-[#1F2937]">
      {/* Top Navigation Bar sóbrio tema claro */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-2xs transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                {/* Compact square diamond logo */}
                <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight">
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
                        ? 'text-[#0F766E] bg-teal-50 font-bold'
                        : 'text-[#4B5563] hover:text-[#1F2937] hover:bg-gray-100/70'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="absolute bottom-[-6px] left-3 right-3 h-[2px] bg-[#0F766E] rounded-full transition-all duration-200" />
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
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] hover:text-[#0F766E] text-[#374151] shadow-2xs transition-colors"
                title="Fale diretamente com o consultor especialista"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Falar com especialista</span>
              </button>
            )}

            {!isAuthPage && user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Menu de 3 Pontos (⋮) no Cabeçalho / Topbar à Direita */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-xl border border-[#E5E7EB] hover:border-[#0F766E] bg-white text-[#4B5563] hover:text-[#1F2937] flex items-center justify-center transition-colors shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30"
                      title="Contato com especialista"
                      aria-label="Contato com especialista"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border border-[#E5E7EB] shadow-lg text-[#1F2937]"
                  >
                    <DropdownMenuItem
                      onClick={() => setFalarEspecialistaOpen(true)}
                      className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2.5 text-[#374151] hover:text-[#0F766E] hover:bg-teal-50"
                    >
                      <MessageSquare className="w-4 h-4 text-[#0F766E]" />
                      <span>Falar com especialista</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
                <div className="w-8 h-8 rounded-xl bg-[#0F766E] flex items-center justify-center text-white">
                  <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  VivaVarejo
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
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#0F766E] text-white font-bold shadow-sm'
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
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

      {/* Footer sóbrio tema claro */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-4 mt-auto pb-20 md:pb-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937]">VivaVarejo</span>
            <span className="text-xs font-mono font-bold bg-teal-50 text-[#0F766E] px-1.5 py-0.5 rounded border border-teal-200">
              v0.1.00
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
