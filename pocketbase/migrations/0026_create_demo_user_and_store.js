migrate(
  (app) => {
    // 1. Obter coleções necessárias
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const funcoesCol = app.findCollectionByNameOrId('funcoes')
    const funcionariosCol = app.findCollectionByNameOrId('funcionarios')
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    const execucoesCol = app.findCollectionByNameOrId('execucoes_rotinas')
    const tarefasValidadeCol = app.findCollectionByNameOrId('tarefas_validade')
    const planosAcaoCol = app.findCollectionByNameOrId('planos_acao')

    // 2. Criar ou localizar Cliente / Rede de Demonstração
    let demoCliente
    try {
      demoCliente = app.findFirstRecordByData('clientes', 'nome', 'Rede VivaVarejo Demonstração')
    } catch (_) {
      demoCliente = new Record(clientesCol)
      demoCliente.set('nome', 'Rede VivaVarejo Demonstração')
      demoCliente.set('contato', 'demo@vivavarejo.com.br')
      demoCliente.set('tipo_pessoa', 'PJ')
      demoCliente.set('segmento', 'Supermercados e Varejo Alimentar')
      demoCliente.set('info_negocio', 'Ambiente demonstrativo oficial para parceiros e líderes')
      demoCliente.set('gargalos', 'Validades, rupturas de gôndola e padronização operacional')
      demoCliente.set('inventario_situacao', 'rotativo')
      demoCliente.set('observacoes', 'Rede modelo criada para demonstração de parceiros')
      app.save(demoCliente)
    }

    // 3. Criar ou localizar Loja Demonstração
    let demoLoja
    try {
      demoLoja = app.findFirstRecordByData('lojas', 'nome', 'Loja Demonstração')
    } catch (_) {
      demoLoja = new Record(lojasCol)
      demoLoja.set('nome', 'Loja Demonstração')
      demoLoja.set('cliente', demoCliente.id)
      demoLoja.set('codigo', 'DEMO-01')
      demoLoja.set('observacoes', 'Loja padrão demonstrativa para testes operacionais')
      demoLoja.set('email_regional', 'regional.demo@vivavarejo.com.br')
      demoLoja.set('alertas_ativos', true)
      app.save(demoLoja)
    }

    // 4. Criar ou atualizar Usuário Demonstração
    // Credenciais solicitadas:
    // E-mail: demo@vivavarejo.com.br
    // Senha: vivavarejo123
    // Nome: "Usuário Demonstração"
    // Perfil: "lider" (sem poderes administrativos, não acessa Admin nem outras redes)
    let demoUser
    try {
      demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'demo@vivavarejo.com.br')
      demoUser.set('name', 'Usuário Demonstração')
      demoUser.set('perfil', 'lider')
      demoUser.set('ativo', true)
      demoUser.set('cliente', demoCliente.id)
      demoUser.setPassword('vivavarejo123')
      demoUser.setVerified(true)
      app.save(demoUser)
    } catch (_) {
      demoUser = new Record(usersCol)
      demoUser.setEmail('demo@vivavarejo.com.br')
      demoUser.setPassword('vivavarejo123')
      demoUser.setVerified(true)
      demoUser.set('name', 'Usuário Demonstração')
      demoUser.set('perfil', 'lider')
      demoUser.set('ativo', true)
      demoUser.set('primeiro_acesso_notificado', true) // Já marcado para não disparar modals de onboarding
      demoUser.set('cliente', demoCliente.id)
      demoUser.set('telefone', '(48) 99181-7542')
      app.save(demoUser)
    }

    // 5. Criar Função e Vínculo de Funcionário para o Usuário Demo na Loja Demonstração
    let funcaoLider
    try {
      funcaoLider = app.findFirstRecordByData('funcoes', 'nome', 'Líder Operacional Demo')
    } catch (_) {
      funcaoLider = new Record(funcoesCol)
      funcaoLider.set('nome', 'Líder Operacional Demo')
      funcaoLider.set('loja', demoLoja.id)
      funcaoLider.set('telefone', '(48) 99181-7542')
      app.save(funcaoLider)
    }

    try {
      app.findFirstRecordByData('funcionarios', 'usuario', demoUser.id)
    } catch (_) {
      const demoFunc = new Record(funcionariosCol)
      demoFunc.set('nome', 'Usuário Demonstração')
      demoFunc.set('funcao', funcaoLider.id)
      demoFunc.set('loja', demoLoja.id)
      demoFunc.set('usuario', demoUser.id)
      demoFunc.set('ativo', true)
      demoFunc.set('telefone', '(48) 99181-7542')
      app.save(demoFunc)
    }

    // 6. Dados de Demonstração Realistas da Loja:
    // Data de referência de hoje: YYYY-MM-DD
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = yyyy + '-' + mm + '-' + dd

    // 6.1 Rotinas do Dia na Loja Demonstração:
    // - 1 Concluída com status válido (aprovada pelo validador)
    // - 1 Aguardando validação do regional
    // - 1 Atrasada (horário matinal que já passou, status pendente)
    // - 1 No prazo (horário vespertino/noturno ainda pendente)

    const rotinasDemoData = [
      {
        nome: 'Abertura de Loja e Checagem de Fundo de Troco',
        responsavel: 'Frente de Caixa',
        area: 'Frente de Caixa',
        frequencia: 'Diária',
        horario_limite: '07:45h',
        ferramenta: 'Checklist POS e Cofre',
        validacao: 'Gerente Operacional (GO)',
        observacoes:
          'Conferir sangrias, fundo dos terminais e teste de bobina antes de abrir portas.',
        tipoCenario: 'concluida_aprovada',
      },
      {
        nome: 'Auditoria Matinal de Preços e Cartazeamento',
        responsavel: 'Prevenção e Cartazista',
        area: 'Cartazista',
        frequencia: 'Diária',
        horario_limite: '08:30h',
        ferramenta: 'Coletor RF e Impressora',
        validacao: 'Líder Prevenção (LP)',
        observacoes:
          'Auditar cartazes de ponta de gôndola e confirmar se batem com o preço no PDV.',
        tipoCenario: 'aguardando_validacao',
      },
      {
        nome: 'Ronda de Prevenção e Portas de Emergência',
        responsavel: 'Prevenção de Perdas',
        area: 'Prevenção',
        frequencia: 'Diária',
        horario_limite: '09:00h',
        ferramenta: 'Rádio comunicador e Checklist físico',
        validacao: 'Coord. Prevenção de Perdas',
        observacoes: 'Checar rotas de fuga, alarmes de saída e travamento do depósito.',
        tipoCenario: 'atrasada',
      },
      {
        nome: 'Mapeamento de Rupturas de Gôndola (Curva A)',
        responsavel: 'Reposição Noturna/Tarde',
        area: 'Mercearia',
        frequencia: 'Diária',
        horario_limite: '21:00h',
        ferramenta: 'Coletor de Dados / ERP',
        validacao: 'Encarregado de Loja',
        observacoes: 'Identificar itens sem estoque na gôndola com saldo em depósito.',
        tipoCenario: 'no_prazo',
      },
    ]

    const rotinasCriadasMap = {}

    for (let i = 0; i < rotinasDemoData.length; i++) {
      const item = rotinasDemoData[i]
      let rotinaRec
      // Assinatura por nome + loja para nunca duplicar
      const queryCheck = app.findRecordsByFilter(
        'rotinas',
        "nome = '" + item.nome.replace(/'/g, "''") + "' && loja = '" + demoLoja.id + "'",
        '',
        1,
        0,
      )

      if (queryCheck.length > 0) {
        rotinaRec = queryCheck[0]
      } else {
        rotinaRec = new Record(rotinasCol)
        rotinaRec.set('nome', item.nome)
        rotinaRec.set('loja', demoLoja.id)
        rotinaRec.set('responsavel', item.responsavel)
        rotinaRec.set('area', item.area)
        rotinaRec.set('frequencia', item.frequencia)
        rotinaRec.set('horario_limite', item.horario_limite)
        rotinaRec.set('ferramenta', item.ferramenta)
        rotinaRec.set('validacao', item.validacao)
        rotinaRec.set('status', 'Ativa')
        rotinaRec.set('observacoes', item.observacoes)
        rotinaRec.set('prioridade_dia', i + 1)
        app.save(rotinaRec)
      }
      rotinasCriadasMap[item.tipoCenario] = rotinaRec
    }

    // 6.2 Execuções das Rotinas para o dia corrente:
    // 1 Concluída aprovada
    const rotinaConcluida = rotinasCriadasMap['concluida_aprovada']
    if (rotinaConcluida) {
      const execsExist = app.findRecordsByFilter(
        'execucoes_rotinas',
        "rotina = '" + rotinaConcluida.id + "' && data_execucao ~ '" + todayStr + "'",
        '',
        1,
        0,
      )
      if (execsExist.length === 0) {
        const ex1 = new Record(execucoesCol)
        ex1.set('rotina', rotinaConcluida.id)
        ex1.set('usuario', demoUser.id)
        ex1.set('data_execucao', todayStr + ' 12:00:00.000Z')
        ex1.set('concluida', true)
        ex1.set('status_validacao', 'aprovada')
        ex1.set(
          'comentario_validacao',
          'Rotina executada em conformidade com o padrão operacional.',
        )
        ex1.set('validado_em', todayStr + ' 08:00:00')
        app.save(ex1)
      }
    }

    // 1 Aguardando validação
    const rotinaAguardando = rotinasCriadasMap['aguardando_validacao']
    if (rotinaAguardando) {
      const execsExist = app.findRecordsByFilter(
        'execucoes_rotinas',
        "rotina = '" + rotinaAguardando.id + "' && data_execucao ~ '" + todayStr + "'",
        '',
        1,
        0,
      )
      if (execsExist.length === 0) {
        const ex2 = new Record(execucoesCol)
        ex2.set('rotina', rotinaAguardando.id)
        ex2.set('usuario', demoUser.id)
        ex2.set('data_execucao', todayStr + ' 12:00:00.000Z')
        ex2.set('concluida', true)
        ex2.set('status_validacao', 'aguardando_validacao')
        app.save(ex2)
      }
    }

    // 6.3 Criar 1 Tarefa de Validade no Cronograma (Validade × Calendário)
    // Para a loja de demonstração com status aguardando validação pelo Líder Prevenção
    const checkValidade = app.findRecordsByFilter(
      'tarefas_validade',
      "loja = '" + demoLoja.id + "' && setor_categoria ~ 'Iogurtes e Laticínios'",
      '',
      1,
      0,
    )
    if (checkValidade.length === 0) {
      const tv = new Record(tarefasValidadeCol)
      tv.set('loja', demoLoja.id)
      tv.set('setor_categoria', 'Iogurtes e Laticínios Especiais (Refrigerados)')
      tv.set(
        'descricao',
        'Auditoria matinal de validade com identificação de produtos com vencimento em até 3 dias para rebaixa imediata.',
      )
      tv.set('recorrencia', 'diaria')
      tv.set('horario_inicio', '09:00')
      tv.set('horario_fim', '11:00')
      tv.set('status', 'aguardando_validacao')
      tv.set('executor_nome', 'Usuário Demonstração')
      tv.set('executor_usuario', demoUser.id)
      tv.set('validador_funcao_nome', 'Líder Prevenção')
      tv.set(
        'observacao_execucao',
        'Todos os 42 SKUs do mural refrigerado conferidos. 3 unidades aplicadas com etiqueta amarela de desconto.',
      )
      tv.set('concluida_em', todayStr + ' 10:45')
      tv.set('concluida_por', demoUser.id)
      tv.set('telefone_responsavel', '(48) 99181-7542')
      tv.set('telefone_chefe', '(48) 99181-7542')
      app.save(tv)
    }

    // 6.4 Criar 1 Plano de Ação 5W2H Aberto
    // Vinculado à rotina atrasada da loja
    const checkPlano = app.findRecordsByFilter(
      'planos_acao',
      "loja = '" + demoLoja.id + "' && descricao ~ 'Regularizar alarme da porta de emergência'",
      '',
      1,
      0,
    )
    if (checkPlano.length === 0) {
      // Prazo para daqui a 3 dias
      const prazoDate = new Date(now)
      prazoDate.setDate(prazoDate.getDate() + 3)
      const prazoStr =
        prazoDate.getFullYear() +
        '-' +
        String(prazoDate.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(prazoDate.getDate()).padStart(2, '0')

      const plano = new Record(planosAcaoCol)
      plano.set(
        'descricao',
        'Regularizar alarme da porta de emergência do setor de recebimento (5W2H)',
      )
      plano.set('loja', demoLoja.id)
      if (rotinasCriadasMap['atrasada']) {
        plano.set('rotina', rotinasCriadasMap['atrasada'].id)
      }
      plano.set('criado_por', demoUser.id)
      plano.set('responsavel', 'Equipe de Manutenção e Prevenção')
      plano.set('prazo', prazoStr)
      plano.set('status', 'aberta')
      plano.set('prioridade', 'alta')
      plano.set(
        'observacoes',
        'O QUE: Troca de sensor magnetico. POR QUE: Disparos falsos. ONDE: Saida doca 2. QUEM: Manutencao terceirizada. QUANDO: Ate sexta. COMO: Ordem de servico OS-4021. QUANTO: R$ 180,00.',
      )
      app.save(plano)
    }
  },
  (app) => {
    // Down migration: reverte os dados demonstrativos
    try {
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'demo@vivavarejo.com.br')
      app.delete(demoUser)
    } catch (_) {}

    try {
      const demoLoja = app.findFirstRecordByData('lojas', 'nome', 'Loja Demonstração')
      app.delete(demoLoja)
    } catch (_) {}

    try {
      const demoCliente = app.findFirstRecordByData(
        'clientes',
        'nome',
        'Rede VivaVarejo Demonstração',
      )
      app.delete(demoCliente)
    } catch (_) {}
  },
)
