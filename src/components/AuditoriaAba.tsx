import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  LogIn,
  Key,
  PlusCircle,
  FileText,
  User as UserIcon,
  Store,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  auditoriaService,
  type RegistroAuditoria,
  type AcaoAuditoria,
  type ModuloAuditoria,
} from '@/services/auditoria'
import type { Loja, User } from '@/types'

interface AuditoriaAbaProps {
  lojas: Loja[]
  usuarios: User[]
  clienteId?: string
}

export function AuditoriaAba({ lojas, usuarios, clienteId }: AuditoriaAbaProps) {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setPagesTotal] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filtros
  const [filtroAcao, setFiltroAcao] = useState<string>('todas')
  const [filtroModulo, setFiltroModulo] = useState<string>('todos')
  const [filtroLoja, setFiltroLoja] = useState<string>('todas')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')
  const [termoBusca, setTermoBusca] = useState<string>('')

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditoriaService.getList({
        page,
        perPage: 25,
        clienteId: clienteId || undefined,
        lojaId: filtroLoja !== 'todas' ? filtroLoja : undefined,
        modulo: filtroModulo !== 'todos' ? filtroModulo : undefined,
        acao: filtroAcao !== 'todas' ? filtroAcao : undefined,
        usuario: filtroUsuario !== 'todos' ? filtroUsuario : undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      })
      setRegistros(res.items)
      setTotalItems(res.totalItems)
      setPagesTotal(res.totalPages || 1)
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err)
    } finally {
      setLoading(false)
    }
  }, [page, clienteId, filtroLoja, filtroModulo, filtroAcao, filtroUsuario, dataInicio, dataFim])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Badge visual por ação
  const renderBadgeAcao = (acao: AcaoAuditoria) => {
    switch (acao) {
      case 'conclusao':
      case 'validacao':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            {acao === 'conclusao' ? 'Conclusão' : 'Validação'}
          </Badge>
        )
      case 'alteracao':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 font-medium">
            <Edit className="w-3 h-3" />
            Alteração
          </Badge>
        )
      case 'exclusao':
        return (
          <Badge className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 font-medium">
            <Trash2 className="w-3 h-3" />
            Exclusão
          </Badge>
        )
      case 'criacao':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 font-medium">
            <PlusCircle className="w-3 h-3" />
            Criação
          </Badge>
        )
      case 'login':
        return (
          <Badge className="bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1 font-medium">
            <LogIn className="w-3 h-3" />
            Login
          </Badge>
        )
      case 'troca_senha':
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 font-medium">
            <Key className="w-3 h-3" />
            Senha
          </Badge>
        )
      default:
        return <Badge variant="outline">{acao}</Badge>
    }
  }

  const formatModulo = (mod: ModuloAuditoria) => {
    const mapa: Record<ModuloAuditoria, string> = {
      rotinas: 'Rotinas',
      execucoes: 'Execuções',
      validades: 'Validades',
      perdas: 'Perdas',
      inventarios: 'Inventários',
      promotores: 'Promotores',
      visitas: 'Visitas',
      usuarios: 'Usuários',
      lojas: 'Lojas',
      configuracoes: 'Configurações',
    }
    return mapa[mod] || mod
  }

  // Filtragem local pelo termo de busca (detalhes ou nome)
  const registrosFiltrados = registros.filter((reg) => {
    if (!termoBusca.trim()) return true
    const term = termoBusca.toLowerCase()
    const detalhes = (reg.detalhes || '').toLowerCase()
    const usuario = (reg.usuario_nome || '').toLowerCase()
    return detalhes.includes(term) || usuario.includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Header do Módulo de Auditoria */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Trilha de Auditoria & Conformidade
            </h2>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-xs">
              LGPD & Segurança
            </Badge>
          </div>
          <p className="text-sm text-neutral-300 max-w-2xl">
            Registro imutável de todas as ações operacionais críticas realizadas na rede: validações
            de rotinas, controle de perdas e validades, acessos e alterações de usuários.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => carregarDados()}
          className="bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-700 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar registros
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Filtro Módulo */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Módulo</label>
              <Select
                value={filtroModulo}
                onValueChange={(val) => {
                  setFiltroModulo(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Módulos</SelectItem>
                  <SelectItem value="rotinas">Rotinas</SelectItem>
                  <SelectItem value="execucoes">Execuções de Rotina</SelectItem>
                  <SelectItem value="validades">Validades</SelectItem>
                  <SelectItem value="perdas">Perdas</SelectItem>
                  <SelectItem value="inventarios">Inventários</SelectItem>
                  <SelectItem value="promotores">Promotores</SelectItem>
                  <SelectItem value="visitas">Visitas de Promotor</SelectItem>
                  <SelectItem value="usuarios">Usuários</SelectItem>
                  <SelectItem value="lojas">Lojas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Ação */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Ação</label>
              <Select
                value={filtroAcao}
                onValueChange={(val) => {
                  setFiltroAcao(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Ações</SelectItem>
                  <SelectItem value="conclusao">Conclusão</SelectItem>
                  <SelectItem value="validacao">Validação</SelectItem>
                  <SelectItem value="alteracao">Alteração</SelectItem>
                  <SelectItem value="exclusao">Exclusão</SelectItem>
                  <SelectItem value="criacao">Criação</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="troca_senha">Troca de Senha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Loja */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Loja</label>
              <Select
                value={filtroLoja}
                onValueChange={(val) => {
                  setFiltroLoja(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Lojas</SelectItem>
                  {lojas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Usuário */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Usuário</label>
              <Select
                value={filtroUsuario}
                onValueChange={(val) => {
                  setFiltroUsuario(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Usuários</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Data Início */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">
                A partir de
              </label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value)
                  setPage(1)
                }}
                className="h-9 text-xs"
              />
            </div>

            {/* Filtro Data Fim */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Até</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value)
                  setPage(1)
                }}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Search className="w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar por texto em detalhes, descrição ou nome de usuário..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="h-9 text-xs flex-1"
            />
            {(filtroAcao !== 'todas' ||
              filtroModulo !== 'todos' ||
              filtroLoja !== 'todas' ||
              filtroUsuario !== 'todos' ||
              dataInicio ||
              dataFim ||
              termoBusca) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiltroAcao('todas')
                  setFiltroModulo('todos')
                  setFiltroLoja('todas')
                  setFiltroUsuario('todos')
                  setDataInicio('')
                  setDataFim('')
                  setTermoBusca('')
                  setPage(1)
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Registros de Auditoria */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-6 bg-neutral-50/50 dark:bg-neutral-900/50 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Eventos Registrados</CardTitle>
            <CardDescription className="text-xs">
              Exibindo {registrosFiltrados.length} de {totalItems} registros auditados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100/75 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Loja</th>
                  <th className="py-3 px-4">Detalhes do Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
                        <span>Carregando trilha de auditoria...</span>
                      </div>
                    </td>
                  </tr>
                ) : registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-neutral-400" />
                        <p className="font-medium text-neutral-700 dark:text-neutral-300">
                          Nenhum evento registrado encontrado
                        </p>
                        <p className="text-xs text-neutral-500">
                          Tente ajustar os filtros selecionados acima.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((item) => {
                    const dataObj = new Date(item.created)
                    const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })

                    const lojaNome =
                      item.expand?.loja?.nome || lojas.find((l) => l.id === item.loja)?.nome || '-'

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors text-xs"
                      >
                        {/* Data / Hora */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                          <div>{dataFormatada}</div>
                          <div className="text-[11px] text-neutral-400">{horaFormatada}</div>
                        </td>

                        {/* Badge Ação */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderBadgeAcao(item.acao)}
                        </td>

                        {/* Módulo */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-800 dark:text-neutral-200">
                          {formatModulo(item.modulo)}
                        </td>

                        {/* Usuário */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {item.usuario_nome ||
                                item.expand?.usuario?.name ||
                                item.expand?.usuario?.email ||
                                'Sistema'}
                            </span>
                          </div>
                          {item.usuario_perfil && (
                            <div className="text-[10px] text-neutral-400 pl-5 uppercase">
                              {item.usuario_perfil}
                            </div>
                          )}
                        </td>

                        {/* Loja */}
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{lojaNome}</span>
                          </div>
                        </td>

                        {/* Detalhes */}
                        <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 max-w-md">
                          <p className="line-clamp-2">{item.detalhes || '-'}</p>
                          {item.registro_id && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              ID: {item.registro_id}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
