import React from 'react'
import {
  ShieldCheck,
  Lock,
  Database,
  FileCheck,
  KeyRound,
  UserCheck,
  EyeOff,
  Server,
  Layers,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProtecaoDadosSecao() {
  const pilares = [
    {
      icon: Database,
      title: 'Isolamento Rigoroso por Rede / Cliente',
      desc: 'Todas as consultas, inserções e relatórios são hermeticamente filtrados pela chave do cliente no backend. Nenhuma rede tem visibilidade ou acesso a dados de concorrentes.',
      highlight: 'Multi-tenant real no nível do banco',
    },
    {
      icon: UserCheck,
      title: 'Acesso Baseado em Perfis (RBAC)',
      desc: 'Permissões restritas e bem delimitadas entre Administrador Geral, Administrador de Rede, Gerentes e Líderes Setoriais. Operadores não possuem privilégio de exclusão.',
      highlight: 'Hierarquia com princípio do menor privilégio',
    },
    {
      icon: FileCheck,
      title: 'Trilha de Auditoria Imutável',
      desc: 'Histórico auditável e à prova de adulteração para conclusões e validações de rotinas, lançamentos de perdas, conferência de validades e visitas de promotores.',
      highlight: 'Rastreabilidade operacional completa',
    },
    {
      icon: Lock,
      title: 'Arquivos e Fotos com Tokens Temporários',
      desc: 'Fotos de comprovação, gôndola, abastecimento e validades não ficam abertas à internet. Apenas usuários logados e autorizados geram tokens temporários de visualização.',
      highlight: 'Proteção contra vazamento de imagens de gôndola',
    },
    {
      icon: Server,
      title: 'Tráfego Criptografado & Sessão Segura',
      desc: 'Comunicação obrigatória via TLS/HTTPS de ponta a ponta. Sessões ativas contam com expiração automática por inatividade após 30 minutos com aviso prévio aos 28 minutos.',
      highlight: 'Criptografia em trânsito e em repouso',
    },
    {
      icon: KeyRound,
      title: 'Políticas Fortes de Senha',
      desc: 'Requisitos rígidos de complexidade para credenciais (mínimo de 8 caracteres contendo letras e números) com feedback visual de entropia no cadastro e troca.',
      highlight: 'Prevenção ativa contra credenciais fracas',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Banner de Apresentação Comercial e Corporativa */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-slate-900 to-blue-950 text-white p-8 border border-neutral-800 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Conformidade VivaVarejo & Segurança Corporativa
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Proteção de Dados & Governança Operacional
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            O VivaVarejo foi arquitetado com padrões de segurança bancária e isolamento
            multi-inquilino. Garantimos sigilo total de números de perdas, inventários, indicadores
            gerenciais e relatórios de fiscalização entre diferentes redes supermercadistas.
          </p>
        </div>
      </div>

      {/* Grid com os 6 pilares de segurança */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pilares.map((p, idx) => {
          const Icon = p.icon
          return (
            <Card
              key={idx}
              className="border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#2563EB]">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold leading-snug">{p.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className="mt-2 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    {p.highlight}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {p.desc}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabela de Enquadramento de Conformidade */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Matriz de Proteção e Acesso VivaVarejo
          </CardTitle>
          <CardDescription className="text-xs">
            Especificações técnicas das barreiras de proteção implementadas na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-300 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Camada de Segurança</th>
                  <th className="py-2.5 px-4">Mecanismo Implementado</th>
                  <th className="py-2.5 px-4">Status de Conformidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                    Isolamento de Banco de Dados
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                    Regras de API filtradas em nível de engine por{' '}
                    <code>@request.auth.cliente</code> e <code>loja.cliente</code>.
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo & Restrito
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                    Privacidade de Fotos & Anexos
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                    Campos de imagem configurados como <code>protected: true</code> com tokens de
                    curta duração via <code>pb.files.getToken()</code>.
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                    Trilha de Auditoria
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                    Registro de log imutável sem permissão de alteração ou exclusão para usuários
                    finais.
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                    Proteção de Sessão
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                    Logout automático aos 30 minutos de inatividade com aviso de continuidade aos 28
                    minutos.
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
