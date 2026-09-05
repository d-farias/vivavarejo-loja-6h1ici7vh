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
import { LogOut, Menu, X, User as UserIcon, LayoutDashboard, ListChecks, Users } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

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

  const navLinks = [
    { to: '/', label: 'Início', icon: LayoutDashboard },
    { to: '/rotinas', label: 'Rotinas', icon: ListChecks },
    { to: '/equipe', label: 'Minha Equipe', icon: Users },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F5] text-[#1F2937]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB] transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-[#0F766E] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                {/* Compact square diamond logo */}
                <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider uppercase text-[#1F2937] leading-tight">
                  Painel da Loja
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
                        ? 'text-[#0F766E] font-semibold'
                        : 'text-[#6B7280] hover:text-[#1F2937]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] bg-[#0F766E] rounded-full transition-all duration-200" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right Action / Avatar */}
          <div className="flex items-center gap-2">
            {!isAuthPage && user ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] hover:bg-[#0F766E]/20 flex items-center justify-center font-semibold text-xs tracking-wider transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30"
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
                        <p className="text-sm font-semibold text-[#1F2937] leading-none">
                          {user.name || 'Líder'}
                        </p>
                        <p className="text-xs text-[#6B7280] truncate leading-none">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
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
                <div className="w-7 h-7 rounded bg-[#0F766E] flex items-center justify-center text-white">
                  <div className="w-3 h-3 border-2 border-white rotate-45 transform" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  Painel da Loja
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
              <div className="w-9 h-9 rounded-full bg-[#0F766E]/15 text-[#0F766E] font-semibold text-xs flex items-center justify-center border border-[#0F766E]/20">
                {getInitials(user.name, user.email)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-[#1F2937] truncate">
                  {user.name || 'Líder'}
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
                          ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold'
                          : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1F2937]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            <div className="p-3 border-t border-[#E5E7EB]">
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

      {/* Footer */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-4 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1F2937]">Painel da Loja</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[#6B7280]">Acompanhamento de rotinas e liderança de loja</span>
          </div>
          <div>
            <span>
              © {new Date().getFullYear()} Operações de Loja. Todos os direitos reservados.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
