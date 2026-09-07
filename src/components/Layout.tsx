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
} from 'lucide-react'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'
import { FalarEspecialistaModal } from '@/components/FalarEspecialistaModal'
import { PwaInstallModal } from '@/components/PwaInstallModal'
import { usePwaInstall } from '@/hooks/use-pwa-install'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [falarEspecialistaOpen, setFalarEspecialistaOpen] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)

  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwaInstall()

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
  const isAdminGeral = perfil === 'admin'
  const isAdmRede = perfil === 'adm_rede'
  const hasAdminAccess = isAdminGeral || isAdmRede
  const isLiderOrAdmin = perfil === 'admin' || perfil === 'adm_rede' || perfil === 'lider'

  const navLinks = [
    { to: '/', label: 'Início (Dashboard)', icon: LayoutDashboard },
    { to: '/agenda', label: 'Agenda & Workflow', icon: Calendar },
    { to: '/rotinas', label: 'Rotinas', icon: ListChecks },
    { to: '/equipe', label: 'Minha Equipe', icon: Users },
    ...(isLiderOrAdmin ? [{ to: '/promotores', label: 'Promotores', icon: Handshake }] : []),
    ...(hasAdminAccess
      ? [
          {
            to: '/admin',
            label: isAdmRede ? 'Minha Rede (BI)' : 'Admin Geral (BI)',
            icon: Shield,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F5] text-[#1F2937]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-[#2563EB] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                {/* Compact square diamond logo */}
                <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight">
                  VivaVarejo
                </span>
                <span className="text-[10px] text-[#6B7280] leading-none tracking-normal">
                  Varejo Operacional
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
                    `relative px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#2563EB] font-semibold'
                        : 'text-[#6B7280] hover:text-[#1F2937]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] bg-[#2563EB] rounded-full transition-all duration-200" />
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
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#2563EB] hover:text-[#2563EB] text-[#374151] shadow-2xs transition-colors"
                title="Fale diretamente com o consultor especialista"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Falar com especialista</span>
              </button>
            )}

            {!isAuthPage && user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Menu de 3 Pontos (⋮) no Cabeçalho / Topbar à Direita */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-md border border-[#E5E7EB] hover:border-[#2563EB] bg-white text-[#4B5563] hover:text-[#2563EB] flex items-center justify-center transition-colors shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30"
                      title="Mais opções do sistema"
                      aria-label="Menu de opções"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 bg-white border border-[#E5E7EB] shadow-lg"
                  >
                    <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] px-3 py-2">
                      Módulos Operacionais
                    </DropdownMenuLabel>

                    {/* Módulo Validade x Calendário */}
                    <DropdownMenuItem
                      onClick={() => navigate('/validades')}
                      className={`cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2.5 transition-colors ${
                        location.pathname === '/validades'
                          ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                          : 'text-[#1F2937] hover:text-[#2563EB]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">Validade × Calendário</span>
                        <span className="text-[10px] text-[#6B7280]">
                          Cronograma e alertas por setor
                        </span>
                      </div>
                    </DropdownMenuItem>

                    {/* Módulo Perdas & Inventário */}
                    <DropdownMenuItem
                      onClick={() => navigate('/perdas')}
                      className={`cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2.5 transition-colors ${
                        location.pathname === '/perdas'
                          ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                          : 'text-[#1F2937] hover:text-[#2563EB]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-red-100 text-[#B91C1C] flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">Perdas & Inventário</span>
                        <span className="text-[10px] text-[#6B7280]">
                          Quebras × validades pendentes
                        </span>
                      </div>
                    </DropdownMenuItem>

                    {/* Instalar App no Celular */}
                    {!isInstalled && (
                      <DropdownMenuItem
                        onClick={handleOpenInstall}
                        className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2.5 text-[#2563EB] hover:bg-blue-50/60"
                      >
                        <div className="w-6 h-6 rounded bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Instalar app no celular</span>
                          <span className="text-[10px] text-[#6B7280]">
                            Adicionar à tela de início
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-[#E5E7EB]" />

                    <DropdownMenuItem
                      onClick={() => setFalarEspecialistaOpen(true)}
                      className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2.5 text-[#374151] hover:text-[#2563EB]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                      <span>Falar com especialista</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Avatar do Usuário */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#2563EB] hover:bg-[#3B82F6]/20 flex items-center justify-center font-semibold text-xs tracking-wider transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30"
                      title={user.name || user.email}
                      aria-label="Menu do usuário"
                    >
                      {getInitials(user.name, user.email)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border border-[#E5E7EB] shadow-lg"
                  >
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#1F2937] leading-none">
                            {user.name || 'Líder'}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-[#3B82F6]/10 text-[#2563EB]">
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
                          className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2 text-[#2563EB]"
                        >
                          <Shield className="w-4 h-4" />
                          <span>{isAdmRede ? 'Minha Rede' : 'Painel Administrativo'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setChangePasswordOpen(true)}
                      className="cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2 text-[#1F2937] hover:text-[#2563EB]"
                    >
                      <KeyRound className="w-4 h-4 text-[#6B7280]" />
                      <span>Alterar senha</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-[#B91C1C] focus:text-[#B91C1C] focus:bg-red-50 cursor-pointer p-2.5 font-medium text-xs flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da conta</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-md text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-r border-[#E5E7EB] transform transition-transform duration-200 ease-in-out">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#2563EB] flex items-center justify-center text-white">
                  <div className="w-3 h-3 border-2 border-white rotate-45 transform" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  VivaVarejo
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-[#6B7280] hover:text-[#1F2937]"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#E5E7EB] bg-[#F7F7F5]/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#3B82F6]/15 text-[#2563EB] font-semibold text-xs flex items-center justify-center border border-[#3B82F6]/25">
                {getInitials(user.name, user.email)}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#1F2937] truncate">
                    {user.name || 'Líder'}
                  </span>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded uppercase bg-[#3B82F6]/15 text-[#2563EB]">
                    {perfil}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B7280] truncate">{user.email}</div>
              </div>
            </div>

            <nav className="p-3 space-y-1 flex-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#3B82F6]/10 text-[#2563EB] font-semibold'
                          : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1F2937]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                )
              })}

              <div className="pt-2 space-y-1">
                <NavLink
                  to="/validades"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#3B82F6]/10 text-[#2563EB] font-semibold'
                        : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1F2937]'
                    }`
                  }
                >
                  <CalendarCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Validade × Calendário</span>
                </NavLink>

                <NavLink
                  to="/perdas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#3B82F6]/10 text-[#2563EB] font-semibold'
                        : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1F2937]'
                    }`
                  }
                >
                  <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
                  <span>Perdas & Inventário</span>
                </NavLink>

                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleOpenInstall()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-[#2563EB] bg-blue-50/70 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-[#2563EB]" />
                    <span>Instalar app no celular</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setFalarEspecialistaOpen(true)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-[#2563EB] bg-blue-50/60 border border-blue-100 hover:bg-blue-100/60 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                  <span>Falar com especialista</span>
                </button>
              </div>
            </nav>

            <div className="p-3 border-t border-[#E5E7EB] space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setChangePasswordOpen(true)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[#1F2937] hover:bg-gray-100 transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#6B7280]" />
                <span>Alterar senha</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[#B91C1C] hover:bg-red-50 transition-colors"
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

      {/* Footer */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-4 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1F2937]">VivaVarejo</span>
            <span className="text-[11px] text-[#9CA3AF] font-mono">v0.0.40</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} VivaVarejo. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
