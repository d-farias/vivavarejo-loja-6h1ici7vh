import React from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarDays, Store, CheckSquare, Menu, Home, Flame } from 'lucide-react'

interface BottomNavMobileProps {
  isCampo: boolean
  onOpenMais?: () => void
}

/**
 * Barra inferior fixa no mobile conforme item 5:
 * "Navegação inferior fixa no mobile com abas curtas.
 * Para perfil campo: Hoje | Visitas | Tarefas | Mais.
 * Para gestão: navegação completa como está (menu/topo desktop).
 * Preservar a rolagem vertical padrão e rolagem lateral de tabelas."
 */
export function BottomNavMobile({ isCampo, onOpenMais }: BottomNavMobileProps) {
  // Itens para Perfil Campo
  const campoItems = [
    {
      to: '/meu-dia',
      label: 'Hoje',
      icon: Home,
    },
    {
      to: '/promotores',
      label: 'Visitas',
      icon: Store,
    },
    {
      to: '/agenda',
      label: 'Tarefas',
      icon: CheckSquare,
    },
  ]

  // Itens para Perfil Gestão (atalhos rápidos no mobile para manter ergonomia móvel)
  const gestaoItems = [
    {
      to: '/agenda',
      label: 'Agenda',
      icon: CalendarDays,
    },
    {
      to: '/',
      label: 'Painel',
      icon: Home,
    },
    {
      to: '/promotores',
      label: 'Visitas',
      icon: Store,
    },
  ]

  const items = isCampo ? campoItems : gestaoItems

  return (
    <nav
      aria-label="Navegação inferior rápida"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-t border-[#1E293B] shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4 h-15 max-w-lg mx-auto items-center px-2 py-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-[#2563EB]/20 border border-[#3B82F6]/40 font-bold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#151E30] font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-[#60A5FA]' : 'text-[#94A3B8]'
                  }`}
                />
                <span
                  className={`text-[11px] mt-0.5 leading-none tracking-tight ${isActive ? 'text-[#60A5FA]' : 'text-[#94A3B8]'}`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Botão Mais: abre acesso a tudo o que existe no app sem remover nada */}
        <button
          type="button"
          onClick={onOpenMais}
          className="flex flex-col items-center justify-center h-full py-1 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#151E30] font-medium transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 leading-none tracking-tight">Mais</span>
        </button>
      </div>
    </nav>
  )
}
