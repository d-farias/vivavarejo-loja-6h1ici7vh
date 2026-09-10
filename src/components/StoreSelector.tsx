import React, { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { useAuth } from '@/context/AuthContext'
import { Store, ChevronDown, Check, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StoreSelectorProps {
  className?: string
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const { lojas, lojaSelecionadaId, lojaSelecionada, selecionarLoja, loadingLojas } = useStore()
  const [open, setOpen] = useState(false)

  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

  if (loadingLojas) {
    return (
      <div
        className={`h-9 w-48 bg-gray-100 rounded-md animate-pulse border border-[#E5E7EB] ${className}`}
      />
    )
  }

  // Se não há lojas cadastradas no sistema
  if (lojas.length === 0) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#F7F7F5] border border-[#E5E7EB] text-xs text-[#6B7280] ${className}`}
      >
        <Store className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <span>Nenhuma loja cadastrada</span>
      </div>
    )
  }

  const labelSelecionado =
    lojaSelecionadaId === 'todas'
      ? 'Todas as lojas'
      : lojaSelecionada
        ? `${lojaSelecionada.nome}${
            lojaSelecionada.expand?.cliente ? ` • ${lojaSelecionada.expand.cliente.nome}` : ''
          }`
        : 'Selecionar loja'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] rounded-md shadow-xs text-[#1F2937] transition-all outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 min-w-[200px] max-w-[320px] ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
            <span className="truncate">{labelSelecionado}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 ml-1" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-72 bg-white border border-[#E5E7EB] shadow-lg rounded-md p-1 z-50 text-xs"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
          Filtrar por Loja Operacional
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#E5E7EB]" />

        {/* Opção Todas as lojas (para admin ou quem tem múltiplas lojas) */}
        {(perfil === 'admin' || lojas.length > 1) && (
          <DropdownMenuItem
            onClick={() => selecionarLoja('todas')}
            className={`px-2.5 py-2 cursor-pointer rounded flex items-center justify-between ${
              lojaSelecionadaId === 'todas'
                ? 'bg-teal-50 text-[#0F766E] font-semibold'
                : 'text-[#1F2937] hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Todas as lojas (Visão Geral)</span>
            </div>
            {lojaSelecionadaId === 'todas' && <Check className="w-4 h-4 text-[#0F766E]" />}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-[#E5E7EB]" />

        {lojas.map((loja) => {
          const isSelected = lojaSelecionadaId === loja.id
          const clienteNome = loja.expand?.cliente?.nome

          return (
            <DropdownMenuItem
              key={loja.id}
              onClick={() => selecionarLoja(loja.id)}
              className={`px-2.5 py-2 cursor-pointer rounded flex items-center justify-between ${
                isSelected
                  ? 'bg-teal-50 text-[#0F766E] font-semibold'
                  : 'text-[#1F2937] hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="truncate font-medium">{loja.nome}</span>
                {clienteNome && (
                  <span className="text-[10px] text-[#6B7280] truncate leading-tight">
                    Cliente: {clienteNome} {loja.codigo ? `(${loja.codigo})` : ''}
                  </span>
                )}
              </div>
              {isSelected && <Check className="w-4 h-4 text-[#0F766E] shrink-0" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
