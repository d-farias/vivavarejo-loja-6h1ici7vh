import { useStore } from '@/context/StoreContext'
import { StoreSelector } from '@/components/StoreSelector'
import { AgendaMinhaEquipeSecao } from '@/components/AgendaMinhaEquipeSecao'

export default function Equipe() {
  const { lojaSelecionada } = useStore()

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header & Seletor de Loja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
            Minha equipe
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {lojaSelecionada
              ? `Estrutura de equipe e rotinas para ${lojaSelecionada.nome}.`
              : 'Áreas, funções e responsáveis pelas rotinas operacionais.'}
          </p>
        </div>

        <StoreSelector />
      </div>

      {/* Conteúdo compartilhado de Minha Equipe */}
      <AgendaMinhaEquipeSecao embedded={false} />
    </div>
  )
}
