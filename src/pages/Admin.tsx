import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import { clientesService } from '@/services/clientes'
import { lojasService } from '@/services/lojas'
import { normalizarNomeCanonico, formatarCargoOuResponsavel } from '@/lib/cargos'
import { funcoesService } from '@/services/funcoes'
import { funcionariosService, usersService } from '@/services/funcionarios'
import { modelosRotinasService } from '@/services/modelosRotinas'
import { formatPhoneBR } from '@/lib/phone-utils'
import type {
  Cliente,
  Loja,
  Funcao,
  Funcionario,
  User,
  PerfilUsuario,
  ModeloComContagem,
  ModeloRotina,
} from '@/types'
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
  BarChart3,
  KeyRound,
  UserPlus,
  Power,
  Copy,
  Info,
  Layers,
  ArrowRight,
  Eye,
  CheckSquare,
  Sparkles,
} from 'lucide-react'
import { PainelGerencial } from '../components/PainelGerencial'
import { ModeloFormModal } from '../components/ModeloFormModal'
import { ModeloDetalhesModal } from '../components/ModeloDetalhesModal'
import { AplicarModeloModal } from '../components/AplicarModeloModal'
import { SalvarLojaComoModeloModal } from '../components/SalvarLojaComoModeloModal'
import { GerarModeloIaModal } from '../components/GerarModeloIaModal'
import { PlanosAcaoCard } from '../components/PlanosAcaoCard'
import { PlanoAcaoModal } from '../components/PlanoAcaoModal'
import { planosAcaoService } from '../services/planosAcao'
import type { PlanoAcao, StatusPlanoAcao } from '../types'

import { PromotoresFornecedoresManager } from '../components/PromotoresFornecedoresManager'
import { fornecedoresService } from '../services/fornecedores'
import { promotoresService } from '../services/promotores'
import { visitasPromotorService, rotinasPromotorService } from '../services/visitasPromotor'
import type { Fornecedor, Promotor, VisitaPromotor, RotinaPromotor } from '../types'
import { Handshake, FileSpreadsheet } from 'lucide-react'
import { RelatorioLojaLoja } from '../components/RelatorioLojaLoja'
import { MaterialVendaAba } from '../components/MaterialVendaAba'
import { rotinasService, execucoesService } from '../services/rotinas'
import type { Rotina, ExecucaoRotina } from '../types'
import { Presentation, Headphones } from 'lucide-react'
import { ContatosAtendimentoModal } from '../components/ContatosAtendimentoModal'
import { AuditoriaAba } from '../components/AuditoriaAba'
import { ProtecaoDadosSecao } from '../components/ProtecaoDadosSecao'
import { ShieldCheck, History } from 'lucide-react'

type TabType =
  | 'painel'
  | 'relatorios'
  | 'material_venda'
  | 'planos'
  | 'modelos'
  | 'clientes'
  | 'lojas'
  | 'funcoes'
  | 'funcionarios'
  | 'promotores'
  | 'usuarios'
  | 'auditoria'
  | 'protecao_dados'

export default function Admin() {
  const { user } = useAuth()
  const perfil = user?.perfil || (user?.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

  const [activeTab, setActiveTab] = useState<TabType>('painel')

  // Estados de dados
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [modelos, setModelos] = useState<ModeloComContagem[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [promotores, setPromotores] = useState<Promotor[]>([])
  const [visitas, setVisitas] = useState<VisitaPromotor[]>([])
  const [rotinasPromotor, setRotinasPromotor] = useState<RotinaPromotor[]>([])
  const [rotinasLista, setRotinasLista] = useState<Rotina[]>([])
  const [execucoesLista, setExecucoesLista] = useState<ExecucaoRotina[]>([])

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
  const [selectedPerfilFilter, setSelectedPerfilFilter] = useState<string>('todos')
  const [selectedUsuarioLojaFilter, setSelectedUsuarioLojaFilter] = useState<string>('todas')

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

  // Modal de Criação / Edição de Usuário
  const [userTelefoneVal, setUserTelefoneVal] = useState<string>('')
  const [userModal, setUserModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    user: User | null
  }>({ open: false, mode: 'create', user: null })

  const handleOpenUserModal = (mode: 'create' | 'edit', u: User | null) => {
    setUserTelefoneVal(formatPhoneBR(u?.telefone || ''))
    setUserModal({ open: true, mode, user: u })
  }

  // Modal de Reset de Senha pelo Admin
  const [resetModal, setResetModal] = useState<{
    open: boolean
    user: User | null
    generatedPassword: string | null
    copied: boolean
    emailSent: boolean
    loading: boolean
    errorMessage: string | null
  }>({
    open: false,
    user: null,
    generatedPassword: null,
    copied: false,
    emailSent: false,
    loading: false,
    errorMessage: null,
  })

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

  // Modais de Modelos de Rotinas
  const [modeloModal, setModeloModal] = useState<{ open: boolean; data: ModeloRotina | null }>({
    open: false,
    data: null,
  })
  const [modeloDetalhesModal, setModeloDetalhesModal] = useState<{
    open: boolean
    data: ModeloRotina | null
  }>({
    open: false,
    data: null,
  })
  const [aplicarModeloModal, setAplicarModeloModal] = useState<{
    open: boolean
    initialModeloId?: string
    initialLojaId?: string
  }>({
    open: false,
  })
  const [salvarLojaComoModeloModal, setSalvarLojaComoModeloModal] = useState<{
    open: boolean
    initialLojaId?: string
  }>({
    open: false,
  })
  const [gerarModeloIaModal, setGerarModeloIaModal] = useState<boolean>(false)

  // Modal de Plano de Ação
  const [planoAcaoModal, setPlanoAcaoModal] = useState<{
    open: boolean
    data: PlanoAcao | null
  }>({
    open: false,
    data: null,
  })

  // Modal de Contatos de Atendimento (Suporte e Especialista)
  const [contatosAtendimentoModalOpen, setContatosAtendimentoModalOpen] = useState(false)

  // Carregamento unificado com escopo para ADM Geral vs ADM de Rede
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [c, l, fn, fc, u, mod, pl, forn, prom, vis, rotProm, rList, eList] = await Promise.all([
        clientesService.getAll(),
        lojasService.getAll(),
        funcoesService.getAll(),
        funcionariosService.getAll(),
        usersService.getAll(),
        modelosRotinasService.getAllComContagem(),
        planosAcaoService.getAll().catch(() => [] as PlanoAcao[]),
        fornecedoresService.getAll().catch(() => [] as Fornecedor[]),
        promotoresService.getAll().catch(() => [] as Promotor[]),
        visitasPromotorService.getAll().catch(() => [] as VisitaPromotor[]),
        rotinasPromotorService.getAll().catch(() => [] as RotinaPromotor[]),
        rotinasService.getAll().catch(() => [] as Rotina[]),
        rotinasService
          .getAll()
          .then(async () => {
            const d60 = new Date()
            d60.setDate(d60.getDate() - 60)
            const d60Str = `${d60.getFullYear()}-${String(d60.getMonth() + 1).padStart(2, '0')}-${String(d60.getDate()).padStart(2, '0')}`
            const today = new Date()
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            return await execucoesService.getExecutionsBetween(d60Str, todayStr)
          })
          .catch(() => [] as ExecucaoRotina[]),
      ])

      const isAdmRedeUser = user?.perfil === 'adm_rede'
      const redeId = user?.cliente

      if (isAdmRedeUser && redeId) {
        // Escopo restrito do ADM de Rede: apenas sua rede e suas lojas
        const clientesFiltrados = c.filter((cli) => cli.id === redeId)
        const lojasDaRede = l.filter((loja) => loja.cliente === redeId)
        const lojaIdsSet = new Set(lojasDaRede.map((loja) => loja.id))

        const funcoesFiltradas = fn.filter((f) => lojaIdsSet.has(f.loja))
        const funcionariosFiltrados = fc.filter((func) => lojaIdsSet.has(func.loja))
        const usuarioIdsSet = new Set(
          funcionariosFiltrados.map((func) => func.usuario).filter(Boolean),
        )
        // Adicionar o próprio ADM de rede
        usuarioIdsSet.add(user.id)
        const usuariosFiltrados = u.filter(
          (usr) => usuarioIdsSet.has(usr.id) || usr.cliente === redeId,
        )

        const planosFiltrados = pl.filter((p) => p.loja && lojaIdsSet.has(p.loja))
        const modelosFiltrados = mod.filter((m) => !m.cliente || m.cliente === redeId)
        const fornFiltrados = forn.filter((item) => !item.cliente || item.cliente === redeId)
        const promFiltrados = prom.filter((item) => !item.cliente || item.cliente === redeId)
        const promIdsSet = new Set(promFiltrados.map((p) => p.id))
        const visFiltradas = vis.filter((v) => lojaIdsSet.has(v.loja))
        const rotPromFiltradas = rotProm.filter(
          (rp) => promIdsSet.has(rp.promotor) || lojaIdsSet.has(rp.loja),
        )
        const rotinasFiltradas = rList.filter((r) => !r.loja || lojaIdsSet.has(r.loja))
        const rotinasFiltradasIds = new Set(rotinasFiltradas.map((r) => r.id))
        const execsFiltradas = eList.filter((e) => rotinasFiltradasIds.has(e.rotina))

        setClientes(clientesFiltrados)
        setLojas(lojasDaRede)
        setFuncoes(funcoesFiltradas)
        setFuncionarios(funcionariosFiltrados)
        setUsuarios(usuariosFiltrados)
        setModelos(modelosFiltrados)
        setPlanosAcao(planosFiltrados)
        setFornecedores(fornFiltrados)
        setPromotores(promFiltrados)
        setVisitas(visFiltradas)
        setRotinasPromotor(rotPromFiltradas)
        setRotinasLista(rotinasFiltradas)
        setExecucoesLista(execsFiltradas)
      } else {
        // ADM Geral: vê tudo
        setClientes(c)
        setLojas(l)
        setFuncoes(fn)
        setFuncionarios(fc)
        setUsuarios(u)
        setModelos(mod)
        setPlanosAcao(pl)
        setFornecedores(forn)
        setPromotores(prom)
        setVisitas(vis)
        setRotinasPromotor(rotProm)
        setRotinasLista(rList)
        setExecucoesLista(eList)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err)
      setFeedbackMsg({ type: 'error', text: 'Erro ao carregar dados do painel ADM.' })
    } finally {
      setLoading(false)
    }
  }, [user?.perfil, user?.cliente, user?.id])

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
    const tipo_pessoa = (formData.get('tipo_pessoa') as 'PF' | 'PJ') || 'PJ'
    const segmento = (formData.get('segmento') as string)?.trim() || ''
    const info_negocio = (formData.get('info_negocio') as string)?.trim() || ''
    const gargalos = (formData.get('gargalos') as string)?.trim() || ''
    const inventario_situacao = (formData.get('inventario_situacao') as string)?.trim() || ''
    const observacoes = (formData.get('observacoes') as string)?.trim()
    const email_suporte = (formData.get('email_suporte') as string)?.trim().toLowerCase() || ''
    const whatsapp_suporte = (formData.get('whatsapp_suporte') as string)?.trim() || ''
    const nome_atendimento = (formData.get('nome_atendimento') as string)?.trim() || ''

    if (!nome) return

    try {
      if (clienteModal.data) {
        await clientesService.update(clienteModal.data.id, {
          nome,
          contato,
          tipo_pessoa,
          segmento,
          info_negocio,
          gargalos,
          inventario_situacao,
          observacoes,
          email_suporte,
          whatsapp_suporte,
          nome_atendimento,
        })
        showFeedback('Cliente atualizado com sucesso!')
      } else {
        await clientesService.create({
          nome,
          contato,
          tipo_pessoa,
          segmento,
          info_negocio,
          gargalos,
          inventario_situacao,
          observacoes,
          email_suporte,
          whatsapp_suporte,
          nome_atendimento,
        })
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
    const email_regional = (formData.get('email_regional') as string)?.trim() || ''
    const alertas_ativos = formData.get('alertas_ativos') === 'true'

    if (!nome || !cliente) return

    try {
      if (lojaModal.data) {
        await lojasService.update(lojaModal.data.id, {
          nome,
          cliente,
          codigo,
          observacoes,
          email_regional,
          alertas_ativos,
        })
        showFeedback('Loja atualizada com sucesso!')
      } else {
        await lojasService.create({
          nome,
          cliente,
          codigo,
          observacoes,
          email_regional,
          alertas_ativos,
        })
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
  const [funcaoTelefoneVal, setFuncaoTelefoneVal] = useState('')
  const [funcaoChefeImediatoVal, setFuncaoChefeImediatoVal] = useState('')
  const [funcaoFormLojaId, setFuncaoFormLojaId] = useState('')

  const handleOpenFuncaoModal = (fn: Funcao | null) => {
    const defaultLoja = fn?.loja || (lojas.length > 0 ? lojas[0].id : '')
    setFuncaoFormLojaId(defaultLoja)
    setFuncaoTelefoneVal(formatPhoneBR(fn?.telefone || ''))
    setFuncaoChefeImediatoVal(fn?.chefe_imediato_funcao || '')
    setFuncaoModal({ open: true, data: fn })
  }

  const handleSaveFuncao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const loja = (formData.get('loja') as string) || funcaoFormLojaId
    const telefone = (formData.get('telefone') as string)?.trim() || ''
    const chefe_imediato_funcao = (formData.get('chefe_imediato_funcao') as string) || ''

    if (!nome || !loja) return

    try {
      if (funcaoModal.data) {
        await funcoesService.update(funcaoModal.data.id, {
          nome,
          loja,
          telefone: telefone || undefined,
          chefe_imediato_funcao: chefe_imediato_funcao || undefined,
        })
        showFeedback('Função atualizada com sucesso!')
      } else {
        await funcoesService.create({
          nome,
          loja,
          telefone: telefone || undefined,
          chefe_imediato_funcao: chefe_imediato_funcao || undefined,
        })
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
  const [funcTelefoneVal, setFuncTelefoneVal] = useState<string>('')

  const handleOpenFuncionarioModal = (func: Funcionario | null) => {
    const defaultLoja = func?.loja || (lojas.length > 0 ? lojas[0].id : '')
    setFormLojaId(defaultLoja)
    setFuncTelefoneVal(formatPhoneBR(func?.telefone || ''))
    setFuncionarioModal({ open: true, data: func })
  }

  const handleSaveFuncionario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const loja = formData.get('loja') as string
    const funcao = formData.get('funcao') as string
    const telefone = (formData.get('telefone') as string)?.trim() || ''
    const usuario = (formData.get('usuario') as string) || ''
    const ativo = formData.get('ativo') === 'true'

    if (!nome || !loja || !funcao) return

    try {
      if (funcionarioModal.data) {
        await funcionariosService.update(funcionarioModal.data.id, {
          nome,
          loja,
          funcao,
          telefone: telefone || undefined,
          usuario: usuario || undefined,
          ativo,
        })
        showFeedback('Funcionário atualizado!')
      } else {
        await funcionariosService.create({
          nome,
          loja,
          funcao,
          telefone: telefone || undefined,
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

  // Exclusão de modelo de rotina
  const handleDeleteModelo = async (modelo: ModeloComContagem) => {
    if (
      !confirm(
        `Confirma a exclusão do modelo "${modelo.nome}"? Todas as ${modelo.totalItens || 0} rotinas vinculadas a este modelo serão removidas (as rotinas já aplicadas em lojas serão mantidas intactas).`,
      )
    ) {
      return
    }
    try {
      await modelosRotinasService.delete(modelo.id)
      showFeedback('Modelo excluído com sucesso!')
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao excluir modelo', 'error')
    }
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

  const handleToggleUsuarioAtivo = async (u: User) => {
    try {
      const atual = u.ativo !== false
      const updated = await usersService.toggleAtivo(u.id, atual)
      setUsuarios((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, ativo: updated.ativo } : item)),
      )
      showFeedback(
        updated.ativo !== false
          ? `Usuário ${u.name || u.email} ativado com sucesso!`
          : `Usuário ${u.name || u.email} desativado.`,
      )
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao alterar status do usuário', 'error')
    }
  }

  const handleSaveUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const name = (formData.get('name') as string)?.trim()
    const emailVal = (formData.get('email') as string)?.trim().toLowerCase()
    const perfilVal = (formData.get('perfil') as PerfilUsuario) || 'funcionario'
    const telefoneVal = (formData.get('telefone') as string)?.trim() || ''
    const funcionarioId = (formData.get('funcionarioId') as string) || ''
    const passwordVal = (formData.get('password') as string) || ''
    const ativoVal = formData.get('ativo') === 'true'

    if (!emailVal || !name) {
      showFeedback('Preencha os campos obrigatórios (Nome e E-mail).', 'error')
      return
    }

    try {
      if (userModal.mode === 'create') {
        if (!passwordVal || passwordVal.length < 8) {
          showFeedback('A senha deve ter no mínimo 8 caracteres.', 'error')
          return
        }

        const clienteVal = (formData.get('cliente') as string) || ''
        const newUser = await usersService.create({
          name,
          email: emailVal,
          password: passwordVal,
          passwordConfirm: passwordVal,
          perfil: perfilVal,
          cliente: clienteVal || undefined,
          telefone: telefoneVal || undefined,
          ativo: ativoVal,
        })

        // Se selecionou um funcionário, vincular o usuario a ele
        if (funcionarioId) {
          await funcionariosService.update(funcionarioId, { usuario: newUser.id })
        }

        showFeedback(`Usuário ${name} cadastrado com sucesso!`)
      } else if (userModal.user) {
        const clienteVal = (formData.get('cliente') as string) || ''
        await usersService.update(userModal.user.id, {
          name,
          perfil: perfilVal,
          cliente: clienteVal || undefined,
          telefone: telefoneVal || undefined,
          ativo: ativoVal,
        })

        // Gerenciar vínculo de funcionário
        // 1. Remover vínculo anterior se mudou
        const funcAnterior = funcionarios.find((fc) => fc.usuario === userModal.user?.id)
        if (funcAnterior && funcAnterior.id !== funcionarioId) {
          await funcionariosService.update(funcAnterior.id, { usuario: '' })
        }
        // 2. Adicionar novo vínculo
        if (funcionarioId && (!funcAnterior || funcAnterior.id !== funcionarioId)) {
          await funcionariosService.update(funcionarioId, { usuario: userModal.user.id })
        }

        showFeedback(`Usuário ${name} atualizado com sucesso!`)
      }

      setUserModal({ open: false, mode: 'create', user: null })
      loadAll()
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao salvar usuário.', 'error')
    }
  }

  const handleGenerateTemporaryPassword = async (targetUser: User) => {
    // Gerar senha aleatória segura de 10 caracteres: Letra maiúscula, minúscula, número e símbolo
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let randomPart = ''
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const tempPassword = `Viva@${randomPart}`

    setResetModal({
      open: true,
      user: targetUser,
      generatedPassword: null,
      copied: false,
      emailSent: false,
      loading: true,
      errorMessage: null,
    })

    try {
      await usersService.resetPassword(targetUser.id, tempPassword)
      setResetModal((prev) => ({
        ...prev,
        generatedPassword: tempPassword,
        loading: false,
      }))
    } catch (err: any) {
      setResetModal((prev) => ({
        ...prev,
        loading: false,
        errorMessage: err?.message || 'Não foi possível redefinir a senha do usuário.',
      }))
    }
  }

  const handleSendResetEmail = async (targetUser: User) => {
    setResetModal((prev) => ({ ...prev, loading: true, errorMessage: null }))
    try {
      await usersService.requestPasswordReset(targetUser.email)
      setResetModal((prev) => ({ ...prev, loading: false, emailSent: true }))
      showFeedback(`E-mail de redefinição enviado para ${targetUser.email}`)
    } catch (err: any) {
      setResetModal((prev) => ({
        ...prev,
        loading: false,
        errorMessage:
          'O servidor não possui serviço de envio de e-mail ativo no momento. Use a opção "Gerar Senha Temporária" acima para copiar e repassar diretamente ao usuário.',
      }))
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

  const filteredModelos = useMemo(() => {
    return modelos.filter((m) => {
      const matchSearch =
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.expand?.cliente?.nome &&
          m.expand.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchCliente =
        selectedClienteFilter === 'todos' || !m.cliente || m.cliente === selectedClienteFilter
      return matchSearch && matchCliente
    })
  }, [modelos, searchTerm, selectedClienteFilter])

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
      const userPerfil: PerfilUsuario =
        u.perfil || (u.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

      if (selectedPerfilFilter !== 'todos' && userPerfil !== selectedPerfilFilter) {
        return false
      }

      const userFuncs = funcionarios.filter((fc) => fc.usuario === u.id)
      if (selectedUsuarioLojaFilter !== 'todas') {
        if (userPerfil === 'admin') {
          // admin tem acesso a todas
        } else {
          const hasLoja = userFuncs.some((f) => f.loja === selectedUsuarioLojaFilter)
          if (!hasLoja) return false
        }
      }

      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      const matchText =
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        userFuncs.some(
          (f) =>
            (f.expand?.funcao?.nome && f.expand.funcao.nome.toLowerCase().includes(q)) ||
            (f.expand?.loja?.nome && f.expand.loja.nome.toLowerCase().includes(q)),
        )
      return matchText
    })
  }, [usuarios, funcionarios, selectedPerfilFilter, selectedUsuarioLojaFilter, searchTerm])

  const isAdmRede = perfil === 'adm_rede'
  const isAdminGeral = perfil === 'admin'

  // Redireciona se não for admin geral nem adm de rede
  if (!isAdminGeral && !isAdmRede) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0F766E]" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
                {isAdmRede ? 'Painel de Gestão da Minha Rede' : 'Painel Administrativo & Gerencial'}
              </h1>
              <p className="text-xs text-[#6B7280]">
                {isAdmRede
                  ? `Configuração de lojas, equipes e acompanhamento de rotinas da rede ${
                      clientes[0]?.nome ? `(${clientes[0].nome})` : ''
                    }`
                  : 'Visão consolidada de indicadores, propostas de melhoria e gestão global de redes'}
              </p>
            </div>
          </div>

          {/* Destaque discreto: Da informação à execução */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-teal-50/70 border border-teal-200/60 rounded-lg text-xs text-[#1F2937] max-w-lg">
            <span className="font-bold text-[#0F766E] shrink-0">Da informação à execução:</span>
            <span className="text-[#4B5563] text-[11px] leading-tight">
              O VivaVarejo conecta dados de ERP e BI à ponta — transformando indicadores em rotinas
              com dono, prazo e checagem real.
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setContatosAtendimentoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-800 rounded-md shadow-xs transition-colors hover:bg-emerald-50/50"
              title="Configurar canais de atendimento e especialista da rede ou padrão global"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isAdminGeral ? 'Contatos de Atendimento' : 'Contatos de Atendimento da Rede'}
              </span>
            </button>

            <button
              onClick={loadAll}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded-md shadow-xs transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0F766E]' : ''}`}
              />
              <span>Atualizar dados</span>
            </button>
          </div>
        </div>

        {/* Feedback Toast Banner */}
        {feedbackMsg && (
          <div
            className={`p-3.5 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between ${
              feedbackMsg.type === 'success'
                ? 'bg-teal-50 border-teal-200 text-[#0F766E]'
                : 'bg-red-50 border-red-200 text-[#B91C1C]'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F766E]" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-2 overflow-x-auto print:hidden">
        {/* Nova primeira aba: Painel Gerencial */}
        <button
          onClick={() => {
            setActiveTab('painel')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'painel'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isAdmRede ? 'Visão da Minha Rede' : 'Painel Gerencial'}</span>
        </button>

        {/* Nova aba: Relatórios Loja a Loja */}
        <button
          onClick={() => {
            setActiveTab('relatorios')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'relatorios'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Relatórios Loja a Loja</span>
        </button>

        {/* Nova aba: Proposta Comercial & Material de Venda */}
        <button
          onClick={() => {
            setActiveTab('material_venda')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'material_venda'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Presentation className="w-4 h-4" />
          <span>Proposta Comercial</span>
        </button>

        {/* Nova aba: Modelos de Rotinas */}
        <button
          onClick={() => {
            setActiveTab('planos')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'planos'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Planos de Ação ({planosAcao.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('modelos')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'modelos'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Modelos ({modelos.length})</span>
        </button>

        {/* Clientes: Apenas ADM Geral pode ver lista de todas as redes/clientes; ADM de Rede vê como "Dados da Rede" */}
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
          <span>{isAdmRede ? 'Dados da Rede' : `Clientes (${clientes.length})`}</span>
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
            setActiveTab('promotores')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'promotores'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Promotores & Fornecedores ({promotores.length + fornecedores.length})</span>
        </button>

        {/* Usuários & Perfis: apenas ADM Geral tem a prerrogativa de criar/desativar ADMs e gerenciar perfis globais */}
        {isAdminGeral && (
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
        )}

        {/* Trilha de Auditoria: Visível para Admin Geral e Adm de Rede */}
        {(isAdminGeral || isAdmRede) && (
          <button
            onClick={() => {
              setActiveTab('auditoria')
              setSearchTerm('')
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'auditoria'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Auditoria</span>
          </button>
        )}

        {/* Proteção de Dados: Acessível na área Admin */}
        <button
          onClick={() => {
            setActiveTab('protecao_dados')
            setSearchTerm('')
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'protecao_dados'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
          <span>Proteção de Dados</span>
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
          {/* ======================= ABA PAINEL GERENCIAL ======================= */}
          {activeTab === 'painel' && (
            <div className="space-y-6">
              <PainelGerencial
                clientes={clientes}
                lojas={lojas}
                isAdmin={perfil === 'admin'}
                onClienteUpdated={loadAll}
                onLojaUpdated={loadAll}
                onOpenAplicarModelo={(lojaId) =>
                  setAplicarModeloModal({ open: true, initialLojaId: lojaId })
                }
              />

              {/* Bloco de Planos de Ação direto no Painel Gerencial */}
              <PlanosAcaoCard
                planos={planosAcao}
                lojas={lojas}
                allowFilterLoja={true}
                title="Planos de Ação da Rede (5W2H)"
                subtitle="Gerenciamento consolidado de ações corretivas e de melhoria em todas as lojas"
                onNewPlano={() => setPlanoAcaoModal({ open: true, data: null })}
                onEditPlano={(plano) => setPlanoAcaoModal({ open: true, data: plano })}
                onDeletePlano={async (plano) => {
                  if (confirm(`Deseja excluir a ação: "${plano.descricao}"?`)) {
                    await planosAcaoService.delete(plano.id)
                    showFeedback('Plano de ação excluído!')
                    loadAll()
                  }
                }}
                onToggleStatus={async (plano, nextStatus) => {
                  await planosAcaoService.update(plano.id, { status: nextStatus })
                  showFeedback(
                    nextStatus === 'concluida' ? 'Ação concluída com sucesso!' : 'Ação reaberta!',
                  )
                  loadAll()
                }}
              />
            </div>
          )}

          {/* ======================= ABA RELATÓRIOS LOJA A LOJA ======================= */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6">
              <RelatorioLojaLoja
                clientes={clientes}
                lojas={lojas}
                rotinas={rotinasLista}
                execucoes={execucoesLista}
                planosAcao={planosAcao}
                visitas={visitas}
                isAdmRede={isAdmRede}
              />
            </div>
          )}

          {/* ======================= ABA MATERIAL DE VENDA ======================= */}
          {activeTab === 'material_venda' && <MaterialVendaAba />}

          {/* ======================= ABA PLANOS DE AÇÃO ======================= */}
          {activeTab === 'planos' && (
            <div className="space-y-4">
              <PlanosAcaoCard
                planos={planosAcao}
                lojas={lojas}
                allowFilterLoja={true}
                title="Planos de Ação Operacionais (5W2H)"
                subtitle="Ações corretivas, preventivas e planos de melhoria contínua das lojas"
                onNewPlano={() => setPlanoAcaoModal({ open: true, data: null })}
                onEditPlano={(plano) => setPlanoAcaoModal({ open: true, data: plano })}
                onDeletePlano={async (plano) => {
                  if (confirm(`Deseja excluir a ação: "${plano.descricao}"?`)) {
                    await planosAcaoService.delete(plano.id)
                    showFeedback('Plano de ação excluído!')
                    loadAll()
                  }
                }}
                onToggleStatus={async (plano, nextStatus) => {
                  await planosAcaoService.update(plano.id, { status: nextStatus })
                  showFeedback(
                    nextStatus === 'concluida' ? 'Ação concluída com sucesso!' : 'Ação reaberta!',
                  )
                  loadAll()
                }}
              />
            </div>
          )}

          {/* ======================= ABA MODELOS DE ROTINAS ======================= */}
          {activeTab === 'modelos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar modelos de rotinas..."
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
                      <option value="todos">Todos os Modelos (Gerais e Redes)</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Rede: {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  <button
                    onClick={() => setGerarModeloIaModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                    title="Descreva a operação da loja e deixe a IA gerar o modelo com as rotinas"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar modelo com IA</span>
                  </button>

                  {lojas.length > 0 && (
                    <button
                      onClick={() => setSalvarLojaComoModeloModal({ open: true })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] text-xs font-semibold rounded-md shadow-xs transition-colors"
                      title="Salvar todas as rotinas de uma loja como novo modelo reutilizável"
                    >
                      <Store className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Salvar loja como modelo</span>
                    </button>
                  )}

                  {modelos.length > 0 && lojas.length > 0 && (
                    <button
                      onClick={() => setAplicarModeloModal({ open: true })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] text-xs font-semibold rounded-md shadow-xs transition-colors"
                      title="Replicar modelo de rotinas em uma loja de destino"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Aplicar modelo em loja</span>
                    </button>
                  )}

                  <button
                    onClick={() => setModeloModal({ open: true, data: null })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#0F766E] text-[#0F766E] hover:bg-teal-50 text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo modelo</span>
                  </button>
                </div>
              </div>

              {filteredModelos.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                  <Layers className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1F2937]">
                    Nenhum modelo de rotinas cadastrado.
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
                    Crie modelos reutilizáveis para padronizar as rotinas de consultoria entre as
                    lojas da rede sem recadastrar tudo manualmente.
                  </p>
                  <div className="mt-4 flex justify-center flex-wrap gap-2">
                    <button
                      onClick={() => setGerarModeloIaModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar modelo com IA</span>
                    </button>
                    {lojas.length > 0 && (
                      <button
                        onClick={() => setSalvarLojaComoModeloModal({ open: true })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] text-xs font-semibold rounded-md shadow-xs"
                      >
                        <Store className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span>Salvar Loja como Modelo</span>
                      </button>
                    )}
                    <button
                      onClick={() => setModeloModal({ open: true, data: null })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#0F766E] text-[#0F766E] hover:bg-teal-50 text-xs font-semibold rounded-md shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Modelo Manual</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Modelo</th>
                        <th className="p-3.5">Rede / Cliente</th>
                        <th className="p-3.5 text-center">Rotinas Mapeadas</th>
                        <th className="p-3.5">Descrição</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredModelos.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-[#0F766E] shrink-0" />
                              <span>{m.nome}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            {m.expand?.cliente ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-[#374151]">
                                <Building2 className="w-3 h-3 text-[#6B7280]" />
                                <span>{m.expand.cliente.nome}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                Padrão Geral
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-[#0F766E]">
                              {m.totalItens || 0} rotinas
                            </span>
                          </td>
                          <td className="p-3.5 text-[#6B7280] max-w-xs truncate">
                            {m.descricao || '-'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setModeloDetalhesModal({ open: true, data: m })}
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Ver rotinas deste modelo"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {lojas.length > 0 && (
                                <button
                                  onClick={() =>
                                    setAplicarModeloModal({
                                      open: true,
                                      initialModeloId: m.id,
                                    })
                                  }
                                  className="p-1.5 text-[#0F766E] hover:text-[#115E59] rounded hover:bg-teal-50"
                                  title="Aplicar este modelo em uma loja"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setModeloModal({ open: true, data: m })}
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Editar dados do modelo"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteModelo(m)}
                                className="p-1.5 text-[#4B5563] hover:text-[#B91C1C] rounded hover:bg-red-50"
                                title="Excluir modelo"
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
                        <th className="p-3.5">Enquadramento</th>
                        <th className="p-3.5">Contato</th>
                        <th className="p-3.5">Observações</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredClientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <span>{cliente.nome}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  cliente.tipo_pessoa === 'PF'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-teal-100 text-[#0F766E]'
                                }`}
                              >
                                {cliente.tipo_pessoa || 'PJ'}
                              </span>
                              {cliente.segmento && (
                                <span className="text-[11px] font-medium bg-[#F7F7F5] border border-[#E5E7EB] text-[#374151] px-1.5 py-0.5 rounded">
                                  {cliente.segmento}
                                </span>
                              )}
                            </div>
                          </td>
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
                        <th className="p-3.5">E-mail Regional</th>
                        <th className="p-3.5">Alertas</th>
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
                          <td className="p-3.5 text-xs text-[#4B5563]">
                            {loja.email_regional ? (
                              <span className="font-mono text-[11px] text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                {loja.email_regional}
                              </span>
                            ) : (
                              <span className="text-[#9CA3AF] italic text-[11px]">
                                Não cadastrado
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {loja.alertas_ativos !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-[#0F766E]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                                Ativos
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#6B7280]">
                                Desligados
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-[#6B7280] max-w-xs truncate">
                            {loja.observacoes || '-'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setSalvarLojaComoModeloModal({
                                    open: true,
                                    initialLojaId: loja.id,
                                  })
                                }
                                className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                title="Salvar rotinas desta loja como Modelo"
                              >
                                <Layers className="w-4 h-4" />
                              </button>
                              {modelos.length > 0 && (
                                <button
                                  onClick={() =>
                                    setAplicarModeloModal({
                                      open: true,
                                      initialLojaId: loja.id,
                                    })
                                  }
                                  className="p-1.5 text-[#0F766E] hover:text-[#115E59] rounded hover:bg-teal-50"
                                  title="Aplicar um Modelo nesta loja"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
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
                    handleOpenFuncaoModal(null)
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
                        <th className="p-3.5">Chefe Imediato</th>
                        <th className="p-3.5">Telefone / WhatsApp</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredFuncoes.map((fn) => (
                        <tr key={fn.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <span>{normalizarNomeCanonico(fn.nome)}</span>
                              {normalizarNomeCanonico(fn.nome) !== fn.nome && (
                                <span className="text-[10px] text-gray-400 font-normal">
                                  ({fn.nome})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-[#374151]">
                              <Store className="w-3 h-3 text-[#6B7280]" />
                              <span>{fn.expand?.loja?.nome || 'Loja não vinculada'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            {fn.expand?.chefe_imediato_funcao ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-[11px] font-medium text-teal-700 border border-teal-200">
                                <span>
                                  {normalizarNomeCanonico(fn.expand.chefe_imediato_funcao.nome)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Não definido</span>
                            )}
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            {fn.telefone ? (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-700">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {formatPhoneBR(fn.telefone)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenFuncaoModal(fn)}
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
                          {normalizarNomeCanonico(fn.nome)}
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
                        <th className="p-3.5">Telefone / WhatsApp</th>
                        <th className="p-3.5">Acesso ao Sistema</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredFuncionarios.map((fc) => (
                        <tr key={fc.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-[#1F2937]">
                            <div className="flex items-center gap-2">
                              <span>{fc.nome}</span>
                              {fc.usuario && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-[#0F766E] border border-teal-200"
                                  title="Funcionário possui login de usuário vinculado"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Tem acesso</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-[#374151]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium">
                              <Briefcase className="w-3 h-3 text-[#6B7280]" />
                              <span>
                                {fc.expand?.funcao?.nome
                                  ? normalizarNomeCanonico(fc.expand.funcao.nome)
                                  : 'Função não atribuída'}
                              </span>
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            <span className="text-xs">
                              {fc.expand?.loja?.nome || 'Loja não vinculada'}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            {fc.telefone ? (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-700">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {formatPhoneBR(fc.telefone)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-[#374151]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium">
                              <Briefcase className="w-3 h-3 text-[#6B7280]" />
                              <span>{fc.expand?.funcao?.nome || 'Função não atribuída'}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            <span className="text-xs">
                              {fc.expand?.loja?.nome || 'Loja não vinculada'}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#4B5563]">
                            {fc.expand?.usuario ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-mono text-[#1F2937]">
                                  {fc.expand.usuario.email}
                                </span>
                                <span className="text-[10px] text-[#0F766E] font-semibold uppercase">
                                  Perfil: {fc.expand.usuario.perfil || 'lider'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#9CA3AF] italic">Sem login</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {fc.ativo !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-[#0F766E]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
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

          {/* ======================= ABA PROMOTORES & FORNECEDORES ======================= */}
          {activeTab === 'promotores' && (
            <PromotoresFornecedoresManager
              visitas={visitas}
              promotores={promotores}
              fornecedores={fornecedores}
              lojas={lojas}
              rotinasPromotor={rotinasPromotor}
              usuarios={usuarios}
              clientes={clientes}
              onRefresh={loadAll}
              onSaveVisita={async (payload, id) => {
                if (id) {
                  await visitasPromotorService.update(id, payload)
                  showFeedback('Visita atualizada!')
                } else {
                  await visitasPromotorService.create(payload)
                  showFeedback('Visita agendada com sucesso!')
                }
                loadAll()
              }}
              onConcluirVisita={async (visitaId, params) => {
                await visitasPromotorService.registrarConclusao(visitaId, {
                  ...params,
                  registrado_por: user?.id,
                })
                showFeedback('Visita concluída com sucesso!')
                loadAll()
              }}
              onCancelarVisita={async (visitaId, motivo) => {
                await visitasPromotorService.cancelarVisita(visitaId, motivo)
                showFeedback('Visita cancelada.')
                loadAll()
              }}
              onDeleteVisita={async (visitaId) => {
                await visitasPromotorService.delete(visitaId)
                showFeedback('Visita excluída.')
                loadAll()
              }}
              onSavePromotor={async (payload, id) => {
                if (id) {
                  await promotoresService.update(id, payload)
                  showFeedback('Promotor atualizado!')
                } else {
                  await promotoresService.create(payload)
                  showFeedback('Promotor cadastrado!')
                }
                loadAll()
              }}
              onDeletePromotor={async (prom) => {
                const dep = await promotoresService.countDependencies(prom.id)
                if (dep.visitasCount > 0) {
                  alert(
                    `Não é possível excluir: existem ${dep.visitasCount} visita(s) vinculadas a este promotor.`,
                  )
                  return
                }
                if (confirm(`Deseja excluir o promotor "${prom.nome}"?`)) {
                  await promotoresService.delete(prom.id)
                  showFeedback('Promotor excluído.')
                  loadAll()
                }
              }}
              onSaveFornecedor={async (payload, id) => {
                if (id) {
                  await fornecedoresService.update(id, payload)
                  showFeedback('Fornecedor atualizado!')
                } else {
                  await fornecedoresService.create(payload)
                  showFeedback('Fornecedor cadastrado com sucesso!')
                }
                loadAll()
              }}
              onDeleteFornecedor={async (forn) => {
                const dep = await fornecedoresService.countDependencies(forn.id)
                if (dep.promotoresCount > 0 || dep.rotinasCount > 0) {
                  alert(
                    `Não é possível excluir: existem ${dep.promotoresCount} promotor(es) e ${dep.rotinasCount} rotina(s) vinculadas a este fornecedor.`,
                  )
                  return
                }
                if (confirm(`Deseja excluir o fornecedor "${forn.nome}"?`)) {
                  await fornecedoresService.delete(forn.id)
                  showFeedback('Fornecedor excluído.')
                  loadAll()
                }
              }}
              onSaveRotinaPromotor={async (payload, id) => {
                if (id) {
                  await rotinasPromotorService.update(id, payload)
                  showFeedback('Rotina de promotor atualizada!')
                } else {
                  await rotinasPromotorService.create(payload)
                  showFeedback('Rotina de promotor cadastrada!')
                }
                loadAll()
              }}
              onDeleteRotinaPromotor={async (rot) => {
                if (confirm(`Deseja excluir a rotina "${rot.titulo}"?`)) {
                  await rotinasPromotorService.delete(rot.id)
                  showFeedback('Rotina excluída.')
                  loadAll()
                }
              }}
            />
          )}

          {/* ======================= ABA USUÁRIOS & PERFIS ======================= */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4">
              {/* Barra de Ações e Filtros */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-1 flex-wrap">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, e-mail ou cargo..."
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

                  {/* Filtro por Perfil */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Shield className="w-3.5 h-3.5 text-[#6B7280]" />
                    <select
                      value={selectedPerfilFilter}
                      onChange={(e) => setSelectedPerfilFilter(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-[#1F2937] outline-none focus:border-[#0F766E]"
                    >
                      <option value="todos">Todos os Perfis</option>
                      <option value="admin">ADM Geral</option>
                      <option value="adm_rede">ADM de Rede</option>
                      <option value="lider">Líder</option>
                      <option value="funcionario">Funcionário</option>
                    </select>{' '}
                  </div>

                  {/* Filtro por Loja */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Store className="w-3.5 h-3.5 text-[#6B7280]" />
                    <select
                      value={selectedUsuarioLojaFilter}
                      onChange={(e) => setSelectedUsuarioLojaFilter(e.target.value)}
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
                </div>

                <button
                  onClick={() => handleOpenUserModal('create', null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start lg:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Novo Usuário</span>
                </button>
              </div>

              {/* Tabela de Usuários */}
              {filteredUsuarios.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                  <UserCheck className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1F2937]">Nenhum usuário encontrado.</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Tente ajustar os filtros de busca ou crie um novo usuário no botão acima.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E7EB] text-[#4B5563] text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Usuário</th>
                        <th className="p-3.5">Telefone / WhatsApp</th>
                        <th className="p-3.5">Perfil de Acesso</th>
                        <th className="p-3.5">Cargo / Função e Loja</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredUsuarios.map((u) => {
                        const userPerfil: PerfilUsuario =
                          u.perfil || (u.email === 'dfarias53@gmail.com' ? 'admin' : 'lider')

                        const userFuncs = funcionarios.filter((fc) => fc.usuario === u.id)
                        const isAtivo = u.ativo !== false

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                            {/* Nome / Email */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
                                  {(u.name || u.email).slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-[#1F2937]">
                                    {u.name || 'Sem nome'}
                                    {u.email === 'dfarias53@gmail.com' && (
                                      <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-normal">
                                        Admin Principal
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-[#6B7280] font-mono">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Telefone */}
                            <td className="p-3.5 text-[#4B5563]">
                              {u.telefone ? (
                                <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-700">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  {formatPhoneBR(u.telefone)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </td>

                            {/* Badge do Perfil com Cores */}
                            <td className="p-3.5">
                              {userPerfil === 'admin' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-[#0F766E] border border-teal-200">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>ADM Geral</span>
                                </span>
                              )}
                              {userPerfil === 'adm_rede' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                  <span>ADM de Rede</span>
                                </span>
                              )}
                              {userPerfil === 'lider' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                  <Users className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Líder</span>
                                </span>
                              )}
                              {userPerfil === 'funcionario' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Funcionário</span>
                                </span>
                              )}
                            </td>

                            {/* Cargo / Loja / Rede Vinculados */}
                            <td className="p-3.5 text-xs text-[#4B5563]">
                              {userPerfil === 'admin' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] font-medium text-[11px] border border-teal-100">
                                  Superusuário (Todas as Redes e Lojas)
                                </span>
                              ) : userPerfil === 'adm_rede' ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200">
                                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                    <span>
                                      Rede:{' '}
                                      {clientes.find((c) => c.id === u.cliente)?.nome ||
                                        u.expand?.cliente?.nome ||
                                        'Rede não vinculada'}
                                    </span>
                                  </span>
                                </div>
                              ) : userFuncs.length > 0 ? (
                                <div className="space-y-1">
                                  {userFuncs.map((f) => (
                                    <div key={f.id} className="flex flex-wrap items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[#1F2937] font-semibold text-[11px]">
                                        <Briefcase className="w-3 h-3 text-[#6B7280]" />
                                        <span>
                                          {f.expand?.funcao?.nome
                                            ? normalizarNomeCanonico(f.expand.funcao.nome)
                                            : 'Função não definida'}
                                        </span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] text-[11px]">
                                        <Store className="w-3 h-3 text-[#0F766E]" />
                                        <span>{f.expand?.loja?.nome || 'Loja não definida'}</span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#9CA3AF] italic text-xs">
                                  Nenhum funcionário vinculado
                                </span>
                              )}
                            </td>
                            {/* Status Ativo / Inativo */}
                            <td className="p-3.5">
                              {isAtivo ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Desativado
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="p-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                {/* Botão Redefinir Senha */}
                                <button
                                  onClick={() => handleGenerateTemporaryPassword(u)}
                                  className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                  title="Redefinir senha de acesso"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>

                                {/* Botão Editar Usuário */}
                                <button
                                  onClick={() => handleOpenUserModal('edit', u)}
                                  className="p-1.5 text-[#4B5563] hover:text-[#0F766E] rounded hover:bg-gray-100"
                                  title="Editar perfil e vínculo"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {/* Botão Ativar / Desativar Usuário */}
                                {u.email !== 'dfarias53@gmail.com' && (
                                  <button
                                    onClick={() => handleToggleUsuarioAtivo(u)}
                                    className={`p-1.5 rounded hover:bg-gray-100 ${
                                      isAtivo
                                        ? 'text-gray-400 hover:text-red-600'
                                        : 'text-red-500 hover:text-emerald-600'
                                    }`}
                                    title={
                                      isAtivo ? 'Desativar acesso do usuário' : 'Reativar usuário'
                                    }
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= ABA AUDITORIA ======================= */}
          {activeTab === 'auditoria' && (isAdminGeral || isAdmRede) && (
            <AuditoriaAba
              lojas={lojas}
              usuarios={usuarios}
              clienteId={isAdmRede ? user?.cliente : undefined}
            />
          )}

          {/* ======================= ABA PROTEÇÃO DE DADOS ======================= */}
          {activeTab === 'protecao_dados' && <ProtecaoDadosSecao />}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Tipo de Pessoa
                  </label>
                  <select
                    name="tipo_pessoa"
                    defaultValue={clienteModal.data?.tipo_pessoa || 'PJ'}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                  >
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                    <option value="PF">Pessoa Física (PF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Segmento de Varejo
                  </label>
                  <select
                    name="segmento"
                    defaultValue={clienteModal.data?.segmento || 'Moda e Vestuário'}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                  >
                    <option value="Moda e Vestuário">Moda e Vestuário</option>
                    <option value="Supermercado/Food">Supermercado/Food</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Construção/Casa">Construção/Casa</option>
                    <option value="Cosméticos">Cosméticos</option>
                    <option value="Pet">Pet</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Contato Geral / Responsável
                </label>
                <input
                  name="contato"
                  defaultValue={clienteModal.data?.contato || ''}
                  placeholder="Ex: (11) 98765-4321 / contato@cliente.com"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              {/* Seção de Contatos de Atendimento / Especialista para os Usuários da Rede */}
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-lg space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <Headphones className="w-4 h-4 text-[#0F766E]" />
                  <span>Contatos de Suporte e Atendimento da Rede</span>
                </div>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  Canais exibidos para os usuários desta rede no botão &ldquo;Falar com
                  especialista&rdquo;. Se não preenchidos, será usado o padrão global da
                  consultoria.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                      WhatsApp de Atendimento
                    </label>
                    <input
                      name="whatsapp_suporte"
                      defaultValue={clienteModal.data?.whatsapp_suporte || ''}
                      placeholder="(00) 00000-0000"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                      E-mail de Suporte
                    </label>
                    <input
                      type="email"
                      name="email_suporte"
                      defaultValue={clienteModal.data?.email_suporte || ''}
                      placeholder="suporte@rede.com"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs outline-none focus:border-[#0F766E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                    Nome do Responsável pelo Atendimento
                  </label>
                  <input
                    name="nome_atendimento"
                    defaultValue={clienteModal.data?.nome_atendimento || ''}
                    placeholder="Ex: Suporte Operacional / Dalvani Farias"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Informações do Negócio (unidades, equipe, cidade)
                </label>
                <input
                  name="info_negocio"
                  defaultValue={clienteModal.data?.info_negocio || ''}
                  placeholder="Ex: 2 lojas, 15 colaboradores, Curitiba - PR"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Gargalos e Problemas Operacionais
                </label>
                <textarea
                  name="gargalos"
                  rows={2}
                  defaultValue={clienteModal.data?.gargalos || ''}
                  placeholder="Ex: perdas recorrentes, equipe desorganizada, falta de padrão..."
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Situação do Controle de Inventário
                </label>
                <select
                  name="inventario_situacao"
                  defaultValue={clienteModal.data?.inventario_situacao || ''}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="">Não informado</option>
                  <option value="rotativo">Inventário rotativo frequente</option>
                  <option value="anual">Apenas anual / esporádico</option>
                  <option value="sem_controle">Sem controle formal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
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
                  E-mail do Regional da Loja
                </label>
                <input
                  type="email"
                  name="email_regional"
                  defaultValue={lojaModal.data?.email_regional || ''}
                  placeholder="Ex: regional@vivavarejo.com.br"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Recebe alertas automáticos imediatos caso rotinas não sejam realizadas no horário.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Alertas de Rotinas Atrasadas
                </label>
                <select
                  name="alertas_ativos"
                  defaultValue={lojaModal.data?.alertas_ativos !== false ? 'true' : 'false'}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="true">Ativos (envio automático a cada 5 min)</option>
                  <option value="false">Desativados para esta loja</option>
                </select>
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
                  value={funcaoFormLojaId}
                  onChange={(e) => setFuncaoFormLojaId(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Telefone / WhatsApp da Função
                </label>
                <input
                  name="telefone"
                  value={funcaoTelefoneVal}
                  onChange={(e) => setFuncaoTelefoneVal(formatPhoneBR(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Número de contato da função ou setor para envio de avisos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Chefe Imediato por Função
                </label>
                <select
                  name="chefe_imediato_funcao"
                  value={funcaoChefeImediatoVal}
                  onChange={(e) => setFuncaoChefeImediatoVal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="">Nenhum chefe imediato direto</option>
                  {funcoes
                    .filter(
                      (f) =>
                        f.id !== funcaoModal.data?.id &&
                        (!funcaoFormLojaId || f.loja === funcaoFormLojaId),
                    )
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {normalizarNomeCanonico(f.nome)}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Função superior direta para escalonamento automático de alertas e avisos WhatsApp.
                </p>
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
                        {normalizarNomeCanonico(fn.nome)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Telefone / WhatsApp (Celular)
                </label>
                <input
                  name="telefone"
                  value={funcTelefoneVal}
                  onChange={(e) => setFuncTelefoneVal(formatPhoneBR(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
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

      {/* ==================== MODAL USUÁRIO (Criação / Edição) ==================== */}
      {userModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setUserModal({ open: false, mode: 'create', user: null })}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0F766E]" />
                <h2 className="text-base font-bold text-[#1F2937]">
                  {userModal.mode === 'create' ? 'Novo Usuário do Sistema' : 'Editar Usuário'}
                </h2>
              </div>
              <button
                onClick={() => setUserModal({ open: false, mode: 'create', user: null })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUsuario} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={userModal.user?.name || ''}
                  required
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  E-mail de Acesso <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={userModal.user?.email || ''}
                  required
                  disabled={userModal.mode === 'edit'}
                  placeholder="usuario@email.com"
                  className={`w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E] ${
                    userModal.mode === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  name="telefone"
                  value={userTelefoneVal}
                  onChange={(e) => setUserTelefoneVal(formatPhoneBR(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                />
              </div>

              {userModal.mode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Senha Provisória <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                  />
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    O usuário poderá alterar sua senha após o primeiro acesso.
                  </p>
                </div>
              )}

              {/* Vínculo com Funcionário existente para herdar Cargo/Função e Loja */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Vincular a Funcionário (Cargo & Loja)
                </label>
                <select
                  name="funcionarioId"
                  defaultValue={
                    userModal.user
                      ? funcionarios.find((f) => f.usuario === userModal.user?.id)?.id || ''
                      : ''
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="">Nenhum vínculo direto</option>
                  {funcionarios.map((f) => {
                    const ocupadoPorOutro = f.usuario && f.usuario !== userModal.user?.id
                    return (
                      <option key={f.id} value={f.id} disabled={Boolean(ocupadoPorOutro)}>
                        {f.nome} — {f.expand?.funcao?.nome || 'Sem função'} (
                        {f.expand?.loja?.nome || 'Sem loja'})
                        {ocupadoPorOutro ? ' (Já vinculado a outro login)' : ''}
                      </option>
                    )
                  })}
                </select>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Ao vincular, o usuário herdará automaticamente o cargo e a loja desta pessoa.
                </p>
              </div>

              {/* Perfil de Acesso */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Perfil de Acesso <span className="text-red-500">*</span>
                </label>
                <select
                  name="perfil"
                  defaultValue={userModal.user?.perfil || 'funcionario'}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="funcionario">
                    Funcionário (Acesso operacional: visualiza e conclui rotinas)
                  </option>
                  <option value="lider">
                    Líder (Gerencial de loja: gerencia rotinas, prazos e equipe da loja)
                  </option>
                  <option value="adm_rede">
                    ADM de Rede (Gerencia exclusivamente a sua própria rede, lojas e demandas)
                  </option>
                  <option value="admin">
                    ADM Geral / Consultor Dono (Superusuário global: cria ADMs de rede e visão
                    global)
                  </option>
                </select>
              </div>

              {/* Vínculo de Rede (Obrigatório para adm_rede e opcional para outros) */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Rede / Cliente Vinculado (Obrigatório para ADM de Rede)
                </label>
                <select
                  name="cliente"
                  defaultValue={userModal.user?.cliente || ''}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="">Nenhuma rede vinculada</option>
                  {clientes.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.nome} {cli.segmento ? `(${cli.segmento})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Para o perfil <strong>ADM de Rede</strong>, este vínculo define quais lojas e
                  dados ele terá permissão para administrar.
                </p>
              </div>

              {/* Status Ativo */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Status da Conta
                </label>
                <select
                  name="ativo"
                  defaultValue={userModal.user?.ativo !== false ? 'true' : 'false'}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0F766E]"
                >
                  <option value="true">Ativo (Pode efetuar login)</option>
                  <option value="false">Desativado (Acesso bloqueado)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setUserModal({ open: false, mode: 'create', user: null })}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#1F2937]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors"
                >
                  {userModal.mode === 'create' ? 'Cadastrar Usuário' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL REDEFINIR SENHA (ADMIN) ==================== */}
      {resetModal.open && resetModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setResetModal({ ...resetModal, open: false })}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#0F766E]" />
                <h2 className="text-base font-bold text-[#1F2937]">Redefinir Senha de Usuário</h2>
              </div>
              <button
                onClick={() => setResetModal({ ...resetModal, open: false })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#4B5563] space-y-1">
              <p>
                Usuário selecionado:{' '}
                <strong className="text-[#1F2937]">{resetModal.user.name || 'Sem nome'}</strong>
              </p>
              <p className="font-mono text-gray-600">{resetModal.user.email}</p>
            </div>

            {resetModal.errorMessage && (
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{resetModal.errorMessage}</span>
              </div>
            )}

            {/* Nova Senha Temporária Gerada */}
            {resetModal.generatedPassword && (
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
                    Nova Senha Temporária
                  </span>
                  <span className="text-[11px] text-[#6B7280]">Copie e envie ao usuário</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-teal-200 rounded px-3 py-2 font-mono text-base font-bold text-[#1F2937] tracking-wider select-all">
                    {resetModal.generatedPassword}
                  </div>
                  <button
                    onClick={() => {
                      if (resetModal.generatedPassword) {
                        navigator.clipboard.writeText(resetModal.generatedPassword)
                        setResetModal((prev) => ({ ...prev, copied: true }))
                        setTimeout(() => {
                          setResetModal((prev) => ({ ...prev, copied: false }))
                        }, 2500)
                      }
                    }}
                    className="px-3 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    {resetModal.copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-[#4B5563] pt-1 leading-relaxed">
                  Esta senha já está ativa para a conta. O usuário poderá utilizá-la para entrar
                  imediatamente e, se desejar, alterá-la pelo menu do perfil.
                </p>
              </div>
            )}

            {/* Opções alternativas */}
            <div className="pt-2 border-t border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Ou acione link de redefinição por e-mail:</span>
                <button
                  type="button"
                  disabled={resetModal.loading}
                  onClick={() => resetModal.user && handleSendResetEmail(resetModal.user)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-[#E5E7EB] hover:border-[#0F766E] text-[#1F2937] rounded transition-colors disabled:opacity-50"
                >
                  {resetModal.loading ? 'Enviando...' : 'Enviar Link por E-mail'}
                </button>
              </div>
              {resetModal.emailSent && (
                <p className="text-[11px] text-emerald-600 font-medium">
                  Link de redefinição acionado para o e-mail do usuário!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setResetModal({ ...resetModal, open: false })}
                className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-md shadow-xs transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== MODAIS DE MODELOS DE ROTINAS ==================== */}
      <ModeloFormModal
        isOpen={modeloModal.open}
        onClose={() => setModeloModal({ open: false, data: null })}
        onSuccess={(msg) => {
          showFeedback(msg)
          loadAll()
        }}
        modelo={modeloModal.data}
        clientes={clientes}
      />

      <ModeloDetalhesModal
        isOpen={modeloDetalhesModal.open}
        onClose={() => setModeloDetalhesModal({ open: false, data: null })}
        modelo={modeloDetalhesModal.data}
      />

      <AplicarModeloModal
        isOpen={aplicarModeloModal.open}
        onClose={() => setAplicarModeloModal({ open: false })}
        onSuccess={(msg) => {
          showFeedback(msg)
          loadAll()
        }}
        modelos={modelos}
        clientes={clientes}
        lojas={lojas}
        initialModeloId={aplicarModeloModal.initialModeloId}
        initialLojaId={aplicarModeloModal.initialLojaId}
      />

      <SalvarLojaComoModeloModal
        isOpen={salvarLojaComoModeloModal.open}
        onClose={() => setSalvarLojaComoModeloModal({ open: false })}
        onSuccess={(msg) => {
          showFeedback(msg)
          loadAll()
        }}
        lojas={lojas}
        clientes={clientes}
        initialLojaId={salvarLojaComoModeloModal.initialLojaId}
      />

      <GerarModeloIaModal
        isOpen={gerarModeloIaModal}
        onClose={() => setGerarModeloIaModal(false)}
        onSuccess={(msg) => {
          showFeedback(msg)
          loadAll()
        }}
        clientes={clientes}
      />

      {/* ==================== MODAL DE PLANO DE AÇÃO ==================== */}
      <PlanoAcaoModal
        isOpen={planoAcaoModal.open}
        onClose={() => setPlanoAcaoModal({ open: false, data: null })}
        plano={planoAcaoModal.data}
        lojas={lojas}
        onSave={async (data) => {
          if (planoAcaoModal.data) {
            await planosAcaoService.update(planoAcaoModal.data.id, data)
            showFeedback('Plano de ação atualizado com sucesso!')
          } else {
            await planosAcaoService.create({
              ...data,
              criado_por: user?.id,
            })
            showFeedback('Plano de ação criado com sucesso!')
          }
          loadAll()
        }}
      />

      {/* ==================== MODAL DE CONTATOS DE ATENDIMENTO ==================== */}
      <ContatosAtendimentoModal
        open={contatosAtendimentoModalOpen}
        onClose={() => setContatosAtendimentoModalOpen(false)}
        isAdminGeral={isAdminGeral}
        isAdmRede={isAdmRede}
        clientes={clientes}
        redeUsuarioId={user?.cliente}
        onSaved={() => {
          loadAll()
          showFeedback('Contatos de atendimento atualizados!')
        }}
      />

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
