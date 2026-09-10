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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4 h-15 max-w-lg mx-auto items-center px-2 py-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-[#0F766E] bg-teal-50 border border-teal-200 font-bold'
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100/70 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-[#0F766E]' : 'text-[#6B7280]'
                  }`}
                />
                <span
                  className={`text-[11px] mt-0.5 leading-none tracking-tight ${isActive ? 'text-[#0F766E] font-bold' : 'text-[#6B7280]'}`}
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
          className="flex flex-col items-center justify-center h-full py-1 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100/70 font-medium transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 leading-none tracking-tight">Mais</span>
        </button>
      </div>
    </nav>
  )
}
