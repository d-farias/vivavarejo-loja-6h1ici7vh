migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const funcoesCol = app.findCollectionByNameOrId('funcoes')
    const rotinasCol = app.findCollectionByNameOrId('rotinas')

    // =========================================================================
    // 1. ATUALIZAR USUÁRIO EXISTENTE: demo@vivavarejo.com.br (CNPJ / ADM de Rede)
    // =========================================================================
    let demoUser
    try {
      demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'demo@vivavarejo.com.br')
    } catch (_) {
      demoUser = null
    }

    // Localizar ou atualizar cliente demo
    let demoCliente
    try {
      demoCliente = app.findFirstRecordByData('clientes', 'nome', 'Rede VivaVarejo Demonstração')
    } catch (_) {
      demoCliente = null
    }

    if (demoCliente) {
      demoCliente.set('tipo_pessoa', 'PJ')
      demoCliente.set('profile_type', 'rede')
      demoCliente.set('segmento', 'Supermercado/Food')
      demoCliente.set('cnpj', '12.345.678/0001-90')
      demoCliente.set('cargo', 'Diretor / ADM de Rede')
      app.save(demoCliente)
    }

    if (demoUser) {
      demoUser.set('perfil', 'adm_rede')
      demoUser.set('profile_type', 'rede')
      demoUser.set('segmento', 'Supermercado/Food')
      demoUser.set('cargo', 'Administrador de Rede')
      demoUser.set('ativo', true)
      demoUser.setVerified(true)
      demoUser.setPassword('vivavarejo123')
      if (demoCliente) {
        demoUser.set('cliente', demoCliente.id)
      }
      app.save(demoUser)
    }

    // Garantir rotinas da Loja Demonstração ativas com segmento 'Supermercado/Food'
    try {
      let demoLoja = null
      try {
        demoLoja = app.findFirstRecordByData('lojas', 'nome', 'Loja Demonstração')
      } catch (_) {}

      if (demoLoja) {
        app
          .db()
          .newQuery(`
          UPDATE rotinas
          SET ativo = 1, segmento = 'Supermercado/Food'
          WHERE loja = {:lojaId}
        `)
          .bind({ lojaId: demoLoja.id })
          .execute()
      }
    } catch (e) {
      console.log('Aviso ao sincronizar rotinas da Loja Demo:', e)
    }

    // =========================================================================
    // 2. CRIAR/ATUALIZAR USUÁRIO NOVO: teste@vivavarejo.com.br (CPF / Gerente)
    // =========================================================================
    const pfEmail = 'teste@vivavarejo.com.br'
    const pfPass = 'Viva@2024'
    const pfNome = 'Teste PF'
    const pfCargo = 'Gerente de Loja'
    const pfSegmento = 'Pet Shop & Clínica'

    // 2.1 Criar Cliente PF da operação do gerente
    let pfCliente
    try {
      pfCliente = app.findFirstRecordByData('clientes', 'contato', pfEmail)
    } catch (_) {
      pfCliente = new Record(clientesCol)
      pfCliente.set('nome', 'Pet Shop & Clínica VivaPet')
      pfCliente.set('contato', pfEmail)
      pfCliente.set('tipo_pessoa', 'PF')
      pfCliente.set('profile_type', 'gerente')
      pfCliente.set('cargo', pfCargo)
      pfCliente.set('segmento', pfSegmento)
      pfCliente.set('info_negocio', 'Operação Pet Shop e Clínica Veterinária com Banho & Tosa')
      pfCliente.set('gargalos', 'Rotinas de higienização, controle de pesagem e validade de rações')
      pfCliente.set('inventario_situacao', 'rotativo')
      pfCliente.set(
        'observacoes',
        'Cadastro PF demonstrativo para testes do modelo Gerente com ramo Pet Shop & Clínica',
      )
      app.save(pfCliente)
    }

    // 2.2 Criar Loja para a operação Pet
    let pfLoja
    try {
      pfLoja = app.findFirstRecordByData('lojas', 'cliente', pfCliente.id)
    } catch (_) {
      pfLoja = new Record(lojasCol)
      pfLoja.set('nome', 'VivaPet - Unidade Centro')
      pfLoja.set('cliente', pfCliente.id)
      pfLoja.set('codigo', 'PET-01')
      pfLoja.set('observacoes', 'Loja física com salão de vendas e centro de estética animal')
      pfLoja.set('email_regional', 'gerencia.pet@vivavarejo.com.br')
      pfLoja.set('alertas_ativos', true)
      app.save(pfLoja)
    }

    // 2.3 Criar ou atualizar Usuário PF
    let pfUser
    try {
      pfUser = app.findAuthRecordByEmail('_pb_users_auth_', pfEmail)
      pfUser.set('name', pfNome)
      pfUser.set('perfil', 'lider')
      pfUser.set('profile_type', 'gerente')
      pfUser.set('segmento', pfSegmento)
      pfUser.set('cargo', pfCargo)
      pfUser.set('telefone', '(48) 99876-5432')
      pfUser.set('cliente', pfCliente.id)
      pfUser.set('ativo', true)
      pfUser.set('primeiro_acesso_notificado', true)
      pfUser.setVerified(true)
      pfUser.setPassword(pfPass)
      app.save(pfUser)
    } catch (_) {
      pfUser = new Record(usersCol)
      pfUser.setEmail(pfEmail)
      pfUser.setPassword(pfPass)
      pfUser.setVerified(true)
      pfUser.set('name', pfNome)
      pfUser.set('perfil', 'lider')
      pfUser.set('profile_type', 'gerente')
      pfUser.set('segmento', pfSegmento)
      pfUser.set('cargo', pfCargo)
      pfUser.set('telefone', '(48) 99876-5432')
      pfUser.set('cliente', pfCliente.id)
      pfUser.set('ativo', true)
      pfUser.set('primeiro_acesso_notificado', true)
      app.save(pfUser)
    }

    // 2.4 Criar Função de Gerente e vínculo de funcionário
    let pfFuncao
    try {
      pfFuncao = app.findFirstRecordByData('funcoes', 'loja', pfLoja.id)
    } catch (_) {
      pfFuncao = new Record(funcoesCol)
      pfFuncao.set('nome', pfCargo)
      pfFuncao.set('loja', pfLoja.id)
      pfFuncao.set('telefone', '(48) 99876-5432')
      app.save(pfFuncao)
    }

    // 2.5 Carregar/Instanciar o Modelo de Rotinas de Pet Shop & Clínica na Loja Pet
    // Busca os itens do modelo Pet no catálogo
    let modeloPetItens = []
    try {
      const modelosPet = app.findRecordsByFilter(
        'modelos_rotinas',
        `segmento = 'Pet' || nome ~ 'Pet'`,
        '-created',
        1,
        0,
      )
      if (modelosPet.length > 0) {
        modeloPetItens = app.findRecordsByFilter(
          'modelos_rotinas_itens',
          `modelo = '${modelosPet[0].id}'`,
          'horario_limite,nome',
          50,
          0,
        )
      }
    } catch (e) {
      console.log('Aviso ao buscar itens do modelo Pet:', e)
    }

    // Se houver itens no modelo cadastrado, instancia-os; se não, usa lista padrão completa de Pet
    const rotinasPetPadrao = [
      {
        nome: 'Checklist de Assepsia e Esterilização de Lâminas (Banho & Tosa)',
        frequencia: 'Diária',
        horario_limite: '08:15',
        responsavel: 'Tosador / Líder Estética',
        area: 'Banho e Tosa',
        ferramenta: 'Autoclave / Álcool 70%',
        validacao: 'Médico Veterinário RT',
        observacoes: 'Esterilizar toalhas e lâminas entre atendimentos.',
        prioridade_dia: 1,
      },
      {
        nome: 'Conferência de Temperatura da Geladeira de Vacinas e Medicamentos',
        frequencia: 'Diária',
        horario_limite: '08:30',
        responsavel: 'Auxiliar Veterinário',
        area: 'Clínica / Farmácia',
        ferramenta: 'Termômetro Digital com Alarme',
        validacao: 'Médico Veterinário RT',
        observacoes: 'Temperatura obrigatória entre 2°C e 8°C. Registrar máxima e mínima.',
        prioridade_dia: 2,
      },
      {
        nome: 'Rotação e Pesagem de Rações a Granel',
        frequencia: 'Diária',
        horario_limite: '10:30',
        responsavel: 'Balconista Pet',
        area: 'Salão de Vendas',
        ferramenta: 'Balança Aferida',
        validacao: 'Gerente de Loja',
        observacoes: 'Fechar tambores hermeticamente para evitar pragas. PVPS no reabastecimento.',
        prioridade_dia: 3,
      },
      {
        nome: 'Auditoria de Validades de Medicamentos e Antiparasitários',
        frequencia: 'Semanal',
        horario_limite: '14:00',
        responsavel: 'Farmácia Veterinária',
        area: 'Balcão de Medicamentos',
        ferramenta: 'Coletor / Aplicativo VivaVarejo',
        validacao: 'Médico Veterinário RT',
        observacoes: 'Identificar itens com vencimento nos próximos 30 dias para ação comercial.',
        prioridade_dia: 4,
      },
      {
        nome: 'Desinfecção Noturna das Baias e Mesas de Atendimento',
        frequencia: 'Diária',
        horario_limite: '19:00',
        responsavel: 'Equipe de Limpeza / Estética',
        area: 'Banho e Tosa / Consultório',
        ferramenta: 'Quaternário de Amônio / Lavadora',
        validacao: 'Gerente de Loja',
        observacoes: 'Higienização completa dos ralos, baias de espera e secadores.',
        prioridade_dia: 5,
      },
    ]

    // Combina itens do modelo oficial com a lista completa para uma experiência rica e realista
    const itensParaInstanciar = []
    const nomesAdicionados = new Set()

    for (let i = 0; i < modeloPetItens.length; i++) {
      const it = modeloPetItens[i]
      itensParaInstanciar.push({
        nome: it.getString('nome'),
        frequencia: it.getString('frequencia') || 'Diária',
        horario_limite: it.getString('horario_limite') || '09:00',
        responsavel: it.getString('responsavel') || 'Equipe Pet',
        area: it.getString('area') || 'Operação Pet',
        ferramenta: it.getString('ferramenta') || 'Checklist VivaVarejo',
        validacao: it.getString('validacao') || 'Gerente de Loja',
        observacoes: it.getString('observacoes') || '',
        prioridade_dia: i + 1,
      })
      nomesAdicionados.add(it.getString('nome').toLowerCase())
    }

    for (let j = 0; j < rotinasPetPadrao.length; j++) {
      const it = rotinasPetPadrao[j]
      if (!nomesAdicionados.has(it.nome.toLowerCase())) {
        itensParaInstanciar.push(it)
        nomesAdicionados.add(it.nome.toLowerCase())
      }
    }

    // Instancia as rotinas na loja do usuário Pet
    for (let k = 0; k < itensParaInstanciar.length; k++) {
      const item = itensParaInstanciar[k]
      try {
        const existe = app.findRecordsByFilter(
          'rotinas',
          `nome = '${item.nome.replace(/'/g, "''")}' && loja = '${pfLoja.id}'`,
          '-created',
          1,
          0,
        )

        if (existe.length > 0) {
          const r = existe[0]
          r.set('ativo', true)
          r.set('segmento', pfSegmento)
          r.set('status', 'Ativa')
          app.save(r)
        } else {
          const novaRotina = new Record(rotinasCol)
          novaRotina.set('nome', item.nome)
          novaRotina.set('loja', pfLoja.id)
          novaRotina.set('funcao', pfFuncao ? pfFuncao.id : undefined)
          novaRotina.set('responsavel', item.responsavel)
          novaRotina.set('area', item.area)
          novaRotina.set('frequencia', item.frequencia)
          novaRotina.set('horario_limite', item.horario_limite)
          novaRotina.set('ferramenta', item.ferramenta)
          novaRotina.set('validacao', item.validacao)
          novaRotina.set('observacoes', item.observacoes)
          novaRotina.set('prioridade_dia', k + 1)
          novaRotina.set('status', 'Ativa')
          novaRotina.set('segmento', pfSegmento)
          novaRotina.set('ativo', true)
          app.save(novaRotina)
        }
      } catch (err) {
        console.log('Aviso ao instanciar rotina pet:', item.nome, err)
      }
    }
  },
  (app) => {
    // Reverter: remover rotinas e cliente da conta teste PF se necessário
    try {
      const pfUser = app.findAuthRecordByEmail('_pb_users_auth_', 'teste@vivavarejo.com.br')
      app.delete(pfUser)
    } catch (_) {}

    try {
      const pfCliente = app.findFirstRecordByData('clientes', 'contato', 'teste@vivavarejo.com.br')
      app.delete(pfCliente)
    } catch (_) {}
  },
)
