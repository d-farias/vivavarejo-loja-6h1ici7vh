import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import { clientesService } from '@/services/clientes'
import { lojasService } from '@/services/lojas'
import { funcoesService } from '@/services/funcoes'
import { funcionariosService, usersService } from '@/services/funcionarios'
import type { Cliente, Loja, Funcao, Funcionario, User, PerfilUsuario } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  Store,
  Briefcase,
  Users,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Phone,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react'

type TabType = 'clientes' | 'lojas' | 'funcoes' | 'funcionarios' | 'usuarios'

export default function Admin() {
  const { user } = useAuth()
  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

  const [activeTab, setActiveTab] = useState<TabType>('clientes')

  // Estados de dados
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])

  const [loading, setLoading] = useState(true)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClienteFilter, setSelectedClienteFilter] = useState<string>('todos')
  const [selectedLojaFilter, setSelectedLojaFilter] = useState<string>('todas')
  const [selectedFuncaoFilter, setSelectedFuncaoFilter] = useState<string>('todas')

  // Modais de Criação/Edição
  const [clienteModal, setClienteModal] = useState<{ open: boolean; data: Cliente | null }>({
    open: false,
    data: null,
  })
  const [lojaModal, setLojaModal] = useState<{ open: boolean; data: Loja | null }>({
    open: false,
    data: null,
  })
  const [funcaoModal, setFuncaoModal] = useState<{ open: boolean; data: Funcao | null }>({
    open: false,
    data: null,
  })
  const [funcionarioModal, setFuncionarioModal] = useState<{
    open: boolean
    data: Funcionario | null
  }>({ open: false, data: null })

  // Modal de Exclusão com verificação de dependências
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'cliente' | 'loja' | 'funcao' | 'funcionario'
    id: string
    title: string
    dependenciesMsg: string | null
    isBlocked: boolean
  }>({
    open: false,
    type: 'cliente',
    id: '',
    title: '',
    dependenciesMsg: null,
    isBlocked: false,
  })

  // Carregamento unificado
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [c, l, fn, fc, u] = await Promise.all([
        clientesService.getAll(),
        lojasService.getAll(),
        funcoesService.getAll(),
        funcionariosService.getAll(),
        usersService.getAll(),
      ])
      setClientes(c)
      setLojas(l)
      setFuncoes(fn)
      setFuncionarios(fc)
      setUsuarios(u)
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err)
      setFeedbackMsg({ type: 'error', text: 'Erro ao carregar dados do painel ADM.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  // ==================== GESTÃO DE CLIENTES ====================
  const handleSaveCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const contato = (formData.get('contato') as string)?.trim()
    const observacoes = (formData.get('observacoes') as string)?.trim()

    if (!nome) return

    try {
      if (clienteModal.data) {
        await clientesService.update(clienteModal.data.id, { nome, contato, observacoes })
        showFeedback('Cliente atualizado com sucesso!')
      } else {
        await clientesService.create({ nome, contato, observacoes })
        showFeedback('Cliente cadastrado com sucesso!')
      }
      setClienteModal({ open: false, data: null })
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao salvar cliente', 'error')
    }
  }

  const prepareDeleteCliente = async (cliente: Cliente) => {
    const dep = await clientesService.countDependencies(cliente.id)
    if (dep.lojasCount > 0) {
      setDeleteDialog({
        open: true,
        type: 'cliente',
        id: cliente.id,
        title: `Excluir Cliente: ${cliente.nome}`,
        dependenciesMsg: `Não é possível excluir este cliente pois existem ${dep.lojasCount} loja(s) vinculada(s) a ele. Remova ou transfira as lojas primeiro.`,
        isBlocked: true,
      })
    } else {
      setDeleteDialog({
        open: true,
        type: 'cliente',
        id: cliente.id,
        title: `Excluir Cliente: ${cliente.nome}`,
        dependenciesMsg: 'Tem certeza de que deseja excluir este cliente?',
        isBlocked: false,
      })
    }
  }

  // ==================== GESTÃO DE LOJAS ====================
  const handleSaveLoja = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const cliente = formData.get('cliente') as string
    const codigo = (formData.get('codigo') as string)?.trim()
    const observacoes = (formData.get('observacoes') as string)?.trim()

    if (!nome || !cliente) return

    try {
      if (lojaModal.data) {
        await lojasService.update(lojaModal.data.id, { nome, cliente, codigo, observacoes })
        showFeedback('Loja atualizada com sucesso!')
      } else {
        await lojasService.create({ nome, cliente, codigo, observacoes })
        showFeedback('Loja cadastrada com sucesso!')
      }
      setLojaModal({ open: false, data: null })
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao salvar loja', 'error')
    }
  }

  const prepareDeleteLoja = async (loja: Loja) => {
    const dep = await lojasService.countDependencies(loja.id)
    const totalDeps = dep.funcoesCount + dep.funcionariosCount + dep.rotinasCount
    if (totalDeps > 0) {
      setDeleteDialog({
        open: true,
        type: 'loja',
        id: loja.id,
        title: `Excluir Loja: ${loja.nome}`,
        dependenciesMsg: `Esta loja possui dependências ativas: ${dep.funcoesCount} função(ões), ${dep.funcionariosCount} funcionário(s) e ${dep.rotinasCount} rotina(s). Exclua ou desvincule esses itens primeiro.`,
        isBlocked: true,
      })
    } else {
      setDeleteDialog({
        open: true,
        type: 'loja',
        id: loja.id,
        title: `Excluir Loja: ${loja.nome}`,
        dependenciesMsg: 'Confirma a exclusão desta loja?',
        isBlocked: false,
      })
    }
  }

  // ==================== GESTÃO DE FUNÇÕES ====================
  const handleSaveFuncao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const loja = formData.get('loja') as string

    if (!nome || !loja) return

    try {
      if (funcaoModal.data) {
        await funcoesService.update(funcaoModal.data.id, { nome, loja })
        showFeedback('Função atualizada com sucesso!')
      } else {
        await funcoesService.create({ nome, loja })
        showFeedback('Função cadastrada com sucesso!')
      }
      setFuncaoModal({ open: false, data: null })
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao salvar função', 'error')
    }
  }

  const prepareDeleteFuncao = async (func: Funcao) => {
    const dep = await funcoesService.countDependencies(func.id)
    if (dep.funcionariosCount > 0 || dep.rotinasCount > 0) {
      setDeleteDialog({
        open: true,
        type: 'funcao',
        id: func.id,
        title: `Excluir Função: ${func.nome}`,
        dependenciesMsg: `Não é possível excluir: existem ${dep.funcionariosCount} funcionário(s) e ${dep.rotinasCount} rotina(s) associadas a esta função.`,
        isBlocked: true,
      })
    } else {
      setDeleteDialog({
        open: true,
        type: 'funcao',
        id: func.id,
        title: `Excluir Função: ${func.nome}`,
        dependenciesMsg: 'Confirma a exclusão desta função operacional?',
        isBlocked: false,
      })
    }
  }

  // ==================== GESTÃO DE FUNCIONÁRIOS ====================
  const [formLojaId, setFormLojaId] = useState<string>('')

  const handleOpenFuncionarioModal = (func: Funcionario | null) => {
    const defaultLoja = func?.loja || (lojas.length > 0 ? lojas[0].id : '')
    setFormLojaId(defaultLoja)
    setFuncionarioModal({ open: true, data: func })
  }

  const handleSaveFuncionario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const loja = formData.get('loja') as string
    const funcao = formData.get('funcao') as string
    const usuario = (formData.get('usuario') as string) || ''
    const ativo = formData.get('ativo') === 'true'

    if (!nome || !loja || !funcao) return

    try {
      if (funcionarioModal.data) {
        await funcionariosService.update(funcionarioModal.data.id, {
          nome,
          loja,
          funcao,
          usuario: usuario || undefined,
          ativo,
        })
        showFeedback('Funcionário atualizado!')
      } else {
        await funcionariosService.create({
          nome,
          loja,
          funcao,
          usuario: usuario || undefined,
          ativo,
        })
        showFeedback('Funcionário cadastrado com sucesso!')
      }
      setFuncionarioModal({ open: false, data: null })
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao salvar funcionário', 'error')
    }
  }

  const prepareDeleteFuncionario = (func: Funcionario) => {
    setDeleteDialog({
      open: true,
      type: 'funcionario',
      id: func.id,
      title: `Excluir Funcionário: ${func.nome}`,
      dependenciesMsg: 'Tem certeza de que deseja excluir este cadastro de funcionário?',
      isBlocked: false,
    })
  }

  // Confirmação de exclusão genérica
  const handleConfirmDelete = async () => {
    if (deleteDialog.isBlocked || !deleteDialog.id) return
    try {
      if (deleteDialog.type === 'cliente') {
        await clientesService.delete(deleteDialog.id)
        showFeedback('Cliente excluído com sucesso!')
      } else if (deleteDialog.type === 'loja') {
        await lojasService.delete(deleteDialog.id)
        showFeedback('Loja excluída com sucesso!')
      } else if (deleteDialog.type === 'funcao') {
        await funcoesService.delete(deleteDialog.id)
        showFeedback('Função excluída com sucesso!')
      } else if (deleteDialog.type === 'funcionario') {
        await funcionariosService.delete(deleteDialog.id)
        showFeedback('Funcionário excluído com sucesso!')
      }
      setDeleteDialog({ ...deleteDialog, open: false })
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao excluir item', 'error')
    }
  }

  // ==================== GESTÃO DE USUÁRIOS ====================
  const handleUpdatePerfil = async (userId: string, novoPerfil: PerfilUsuario) => {
    try {
      await usersService.updatePerfil(userId, novoPerfil)
      setUsuarios((prev) => prev.map((u) => (u.id === userId ? { ...u, perfil: novoPerfil } : u)))
      showFeedback('Perfil de acesso atualizado com sucesso!')
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao alterar perfil', 'error')
    }
  }

  // Filtros computados
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return c.nome.toLowerCase().includes(q) || (c.contato && c.contato.toLowerCase().includes(q))
    })
  }, [clientes, searchTerm])

  const filteredLojas = useMemo(() => {
    return lojas.filter((l) => {
      if (selectedClienteFilter !== 'todos' && l.cliente !== selectedClienteFilter) return false
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return (
        l.nome.toLowerCase().includes(q) ||
        (l.codigo && l.codigo.toLowerCase().includes(q)) ||
        (l.expand?.cliente && l.expand.cliente.nome.toLowerCase().includes(q))
      )
    })
  }, [lojas, selectedClienteFilter, searchTerm])

  const filteredFuncoes = useMemo(() => {
    return funcoes.filter((f) => {
      if (selectedLojaFilter !== 'todas' && f.loja !== selectedLojaFilter) return false
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return (
        f.nome.toLowerCase().includes(q) ||
        (f.expand?.loja && f.expand.loja.nome.toLowerCase().includes(q))
      )
    })
  }, [funcoes, selectedLojaFilter, searchTerm])

  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter((fc) => {
      if (selectedLojaFilter !== 'todas' && fc.loja !== selectedLojaFilter) return false
      if (selectedFuncaoFilter !== 'todas' && fc.funcao !== selectedFuncaoFilter) return false
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return (
        fc.nome.toLowerCase().includes(q) ||
        (fc.expand?.funcao && fc.expand.funcao.nome.toLowerCase().includes(q)) ||
        (fc.expand?.loja && fc.expand.loja.nome.toLowerCase().includes(q))
      )
    })
  }, [funcionarios, selectedLojaFilter, selectedFuncaoFilter, searchTerm])

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return u.email.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
    })
  }, [usuarios, searchTerm])

  // Redireciona se não for admin
  if (perfil !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
              Área Administrativa
            </h1>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestão multi-cliente de consultoria: cadastre clientes, lojas, funções operacionais,
            equipe e perfis de acesso.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded-md shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0F766E]' : ''}`} />
          <span>Atualizar dados</span>
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-[#047857]'
              : 'bg-red-50 border-red-200 text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('clientes')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'clientes'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clientes ({clientes.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('lojas')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'lojas'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Lojas ({lojas.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('funcoes')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'funcoes'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Funções ({funcoes.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('funcionarios')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'funcionarios'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Funcionários ({funcionarios.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('usuarios')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'usuarios'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Usuários & Perfis ({usuarios.length})</span>
        </button>
      </div>

      {/* Skeletons on loading */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-72 bg-gray-200 rounded-md" />
            <Skeleton className="h-10 w-36 bg-gray-200 rounded-md" />
          </div>
          <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white space-y-3">
            <Skeleton className="h-12 w-full bg-gray-200 rounded-md" />
            <Skeleton className="h-12 w-full bg-gray-200 rounded-md" />
            <Skeleton className="h-12 w-full bg-gray-200 rounded-md" />
          </div>
        </div>
      ) : (
        <>
          {/* ======================= ABA CLIENTES ======================= */}
          {activeTab === 'clientes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar clientes por nome..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setClienteModal({ open: true, data: null })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cliente</span>
                </button>
              </div>

              {filteredClientes.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                  <Building2 className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1F2937]">Nenhum cliente cadastrado.</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Cadastre a rede ou cliente de consultoria para começar a adicionar lojas.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Contato</th>
                        <th className="p-3.5">Observações</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredClientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">{cliente.nome}</td>
                          <td className="p-3.5 text-[#4B5563]">
                            {cliente.contato ? (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                <span>{cliente.contato}</span>
                              </span>
                            ) : (
                              <span className="text-[#9CA3AF]">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-[#6B7280] max-w-xs truncate">
                            {cliente.observacoes || '-'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setClienteModal({ open: true, data: cliente })}
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Editar cliente"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => prepareDeleteCliente(cliente)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir cliente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= ABA LOJAS ======================= */}
          {activeTab === 'lojas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-1">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar lojas..."
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  {/* Filtro por Cliente */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
                    <select
                      value={selectedClienteFilter}
                      onChange={(e) => setSelectedClienteFilter(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#0F766E]"
                    >
                      <option value="todos">Todos os Clientes</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (clientes.length === 0) {
                      showFeedback('Cadastre ao menos um cliente antes de criar lojas.', 'error')
                      return
                    }
                    setLojaModal({ open: true, data: null })
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Loja</span>
                </button>
              </div>

              {filteredLojas.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                  <Store className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1F2937]">Nenhuma loja cadastrada.</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Adicione uma loja associada a um cliente para estruturar as rotinas.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Loja</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Código</th>
                        <th className="p-3.5">Observações</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredLojas.map((loja) => (
                        <tr key={loja.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">{loja.nome}</td>
                          <td className="p-3.5 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-[#374151]">
                              <Building2 className="w-3 h-3 text-[#6B7280]" />
                              <span>{loja.expand?.cliente?.nome || 'Cliente não vinculado'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-[#0F766E]">
                            {loja.codigo || '-'}
                          </td>
                          <td className="p-3.5 text-[#6B7280] max-w-xs truncate">
                            {loja.observacoes || '-'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setLojaModal({ open: true, data: loja })}
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Editar loja"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => prepareDeleteLoja(loja)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir loja"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= ABA FUNÇÕES ======================= */}
          {activeTab === 'funcoes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-1">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar função..."
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  {/* Filtro por Loja */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Store className="w-3.5 h-3.5 text-[#6B7280]" />
                    <select
                      value={selectedLojaFilter}
                      onChange={(e) => setSelectedLojaFilter(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#0F766E]"
                    >
                      <option value="todas">Todas as Lojas</option>
                      {lojas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome} {l.expand?.cliente ? `(${l.expand.cliente.nome})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (lojas.length === 0) {
                      showFeedback('Cadastre ao menos uma loja antes de criar funções.', 'error')
                      return
                    }
                    setFuncaoModal({ open: true, data: null })
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Função</span>
                </button>
              </div>

              {filteredFuncoes.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                  <Briefcase className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1F2937]">Nenhuma função cadastrada.</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Exemplos: Gerente Geral, Encarregado, Cartazista, Prevenção, Analista.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Função</th>
                        <th className="p-3.5">Loja Vinculada</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredFuncoes.map((fn) => (
                        <tr key={fn.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">{fn.nome}</td>
                          <td className="p-3.5 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-[#374151]">
                              <Store className="w-3 h-3 text-[#6B7280]" />
                              <span>{fn.expand?.loja?.nome || 'Loja não vinculada'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setFuncaoModal({ open: true, data: fn })}
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Editar função"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => prepareDeleteFuncao(fn)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir função"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= ABA FUNCIONÁRIOS ======================= */}
          {activeTab === 'funcionarios' && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-1 flex-wrap">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar funcionário..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  {/* Filtro por Loja */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Store className="w-3.5 h-3.5 text-[#6B7280]" />
                    <select
                      value={selectedLojaFilter}
                      onChange={(e) => setSelectedLojaFilter(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#0F766E]"
                    >
                      <option value="todas">Todas as Lojas</option>
                      {lojas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Função */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Briefcase className="w-3.5 h-3.5 text-[#6B7280]" />
                    <select
                      value={selectedFuncaoFilter}
                      onChange={(e) => setSelectedFuncaoFilter(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#0F766E]"
                    >
                      <option value="todas">Todas as Funções</option>
                      {funcoes.map((fn) => (
                        <option key={fn.id} value={fn.id}>
                          {fn.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (lojas.length === 0 || funcoes.length === 0) {
                      showFeedback(
                        'Cadastre ao menos uma loja e uma função antes de adicionar funcionários.',
                        'error',
                      )
                      return
                    }
                    handleOpenFuncionarioModal(null)
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start lg:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Funcionário</span>
                </button>
              </div>

              {filteredFuncionarios.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                  <Users className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1F2937]">
                    Nenhum funcionário cadastrado.
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Cadastre os membros da equipe de cada loja e vincule aos logins de usuário.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Nome</th>
                        <th className="p-3.5">Função</th>
                        <th className="p-3.5">Loja</th>
                        <th className="p-3.5">Usuário Vinculado</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredFuncionarios.map((fc) => (
                        <tr key={fc.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">{fc.nome}</td>
                          <td className="p-3.5 text-[#374151]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium">
                              <Briefcase className="w-3 h-3 text-[#6B7280]" />
                              <span>{fc.expand?.funcao?.nome || '-'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0F766E]/10 text-[11px] font-medium text-[#0F766E]">
                              <Store className="w-3 h-3" />
                              <span>{fc.expand?.loja?.nome || '-'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            {fc.expand?.usuario ? (
                              <span className="text-xs font-mono text-[#374151]">
                                {fc.expand.usuario.email}
                              </span>
                            ) : (
                              <span className="text-xs text-[#9CA3AF] italic">Sem login</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {fc.ativo !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#047857]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#6B7280]">
                                Inativo
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenFuncionarioModal(fc)}
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Editar funcionário"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => prepareDeleteFuncionario(fc)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir funcionário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= ABA USUÁRIOS & PERFIS ======================= */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar usuários por nome ou e-mail..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                  />
                </div>
                <span className="text-xs text-[#6B7280]">
                  Gerencie os perfis de acesso (Admin, Líder ou Funcionário) de cada conta.
                </span>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Nome / E-mail</th>
                      <th className="p-3.5">Perfil de Acesso</th>
                      <th className="p-3.5">Lojas Vinculadas (via Funcionário)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredUsuarios.map((u) => {
                      const userPerfil: PerfilUsuario =
                        u.perfil || (u.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

                      // Lojas às quais este usuário está vinculado via funcionarios
                      const userFuncs = funcionarios.filter((fc) => fc.usuario === u.id)
                      const lojasVinculadas = userFuncs
                        .map((f) => f.expand?.loja?.nome)
                        .filter(Boolean)

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-[#1F2937]">
                              {u.name || 'Sem nome'}
                            </div>
                            <div className="text-xs text-[#6B7280] font-mono">{u.email}</div>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={userPerfil}
                              onChange={(e) =>
                                handleUpdatePerfil(u.id, e.target.value as PerfilUsuario)
                              }
                              className="px-3 py-1.5 rounded-md border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] bg-white outline-none focus:border-[#0F766E]"
                            >
                              <option value="admin">Admin (Acesso total)</option>
                              <option value="lider">Líder (Gerencia rotinas da loja)</option>
                              <option value="funcionario">
                                Funcionário (Apenas visualiza e conclui)
                              </option>
                            </select>
                          </td>
                          <td className="p-3.5 text-xs text-[#4B5563]">
                            {userPerfil === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-[#047857] font-semibold text-[11px]">
                                Todas as lojas (Superusuário)
                              </span>
                            ) : lojasVinculadas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {lojasVinculadas.map((lNome, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-gray-100 text-[#374151] text-[11px]"
                                  >
                                    {lNome}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#9CA3AF] italic">
                                Sem loja vinculada na aba Funcionários
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== MODAL CLIENTE ==================== */}
      {clienteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setClienteModal({ open: false, data: null })}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#1F2937]">
                {clienteModal.data ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={() => setClienteModal({ open: false, data: null })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCliente} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Nome do Cliente / Rede <span className="text-red-500">*</span>
                </label>
                <input
                  name="nome"
                  defaultValue={clienteModal.data?.nome || ''}
                  required
                  placeholder="Ex: Supermercados Estrela"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Contato / Telefone / E-mail
                </label>
                <input
                  name="contato"
                  defaultValue={clienteModal.data?.contato || ''}
                  placeholder="Ex: (11) 98765-4321 / contato@cliente.com"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  rows={3}
                  defaultValue={clienteModal.data?.observacoes || ''}
                  placeholder="Informações adicionais da consultoria..."
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setClienteModal({ open: false, data: null })}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#1F2937]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL LOJA ==================== */}
      {lojaModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setLojaModal({ open: false, data: null })}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#1F2937]">
                {lojaModal.data ? 'Editar Loja' : 'Nova Loja'}
              </h2>
              <button
                onClick={() => setLojaModal({ open: false, data: null })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoja} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Cliente / Rede <span className="text-red-500">*</span>
                </label>
                <select
                  name="cliente"
                  defaultValue={lojaModal.data?.cliente || (clientes[0]?.id ?? '')}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Nome da Loja / Unidade <span className="text-red-500">*</span>
                </label>
                <input
                  name="nome"
                  defaultValue={lojaModal.data?.nome || ''}
                  required
                  placeholder="Ex: Loja 01 - Centro"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Código da Loja
                </label>
                <input
                  name="codigo"
                  defaultValue={lojaModal.data?.codigo || ''}
                  placeholder="Ex: LJ-01"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  defaultValue={lojaModal.data?.observacoes || ''}
                  placeholder="Endereço, formato de loja, etc..."
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setLojaModal({ open: false, data: null })}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#1F2937]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors"
                >
                  Salvar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL FUNÇÃO ==================== */}
      {funcaoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setFuncaoModal({ open: false, data: null })}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#1F2937]">
                {funcaoModal.data ? 'Editar Função' : 'Nova Função'}
              </h2>
              <button
                onClick={() => setFuncaoModal({ open: false, data: null })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFuncao} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Loja Vinculada <span className="text-red-500">*</span>
                </label>
                <select
                  name="loja"
                  defaultValue={funcaoModal.data?.loja || (lojas[0]?.id ?? '')}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} {l.expand?.cliente ? `• ${l.expand.cliente.nome}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Nome da Função / Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  name="nome"
                  defaultValue={funcaoModal.data?.nome || ''}
                  required
                  placeholder="Ex: Gerente Geral, Cartazista, Analista"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setFuncaoModal({ open: false, data: null })}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#1F2937]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors"
                >
                  Salvar Função
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL FUNCIONÁRIO ==================== */}
      {funcionarioModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setFuncionarioModal({ open: false, data: null })}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#1F2937]">
                {funcionarioModal.data ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <button
                onClick={() => setFuncionarioModal({ open: false, data: null })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFuncionario} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  name="nome"
                  defaultValue={funcionarioModal.data?.nome || ''}
                  required
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Loja de Atuação <span className="text-red-500">*</span>
                </label>
                <select
                  name="loja"
                  value={formLojaId}
                  onChange={(e) => setFormLojaId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} {l.expand?.cliente ? `• ${l.expand.cliente.nome}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Função <span className="text-red-500">*</span>
                </label>
                <select
                  name="funcao"
                  defaultValue={funcionarioModal.data?.funcao || ''}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="">Selecione a função...</option>
                  {funcoes
                    .filter((f) => !formLojaId || f.loja === formLojaId)
                    .map((fn) => (
                      <option key={fn.id} value={fn.id}>
                        {fn.nome}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Vincular a Usuário (Login no sistema)
                </label>
                <select
                  name="usuario"
                  defaultValue={funcionarioModal.data?.usuario || ''}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="">Nenhum (apenas registro operacional)</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
                <select
                  name="ativo"
                  defaultValue={funcionarioModal.data?.ativo !== false ? 'true' : 'false'}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="true">Ativo na loja</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setFuncionarioModal({ open: false, data: null })}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#1F2937]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors"
                >
                  Salvar Funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DIÁLOGO DE EXCLUSÃO ==================== */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          />
          <div className="relative w-full max-w-sm bg-white rounded-lg p-5 z-10 border border-[#E5E7EB] shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-[#B91C1C]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-[#1F2937]">{deleteDialog.title}</h3>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">{deleteDialog.dependenciesMsg}</p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
                className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:bg-gray-100 rounded-md"
              >
                {deleteDialog.isBlocked ? 'Entendido' : 'Cancelar'}
              </button>

              {!deleteDialog.isBlocked && (
                <button
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#B91C1C] hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Confirmar Exclusão
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
