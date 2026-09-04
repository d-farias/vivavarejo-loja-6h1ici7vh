migrate(
  (app) => {
    // 1. Seed admin auth user
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'dfarias53@gmail.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const admin = new Record(users)
      admin.setEmail('dfarias53@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Líder de Loja')
      app.save(admin)
    }

    // 2. Seed realistic generic store operational routines (not copied from spreadsheet)
    const rotinasCol = app.findCollectionByNameOrId('rotinas')

    const genericRoutines = [
      {
        nome: 'Abertura de Loja e Verificação de Caixas',
        responsavel: 'Gerência',
        area: 'Gerência',
        frequencia: 'Diária',
        horario_limite: '07:45h',
        ferramenta: 'Checklist operacional e POS',
        validacao: 'Gerente Geral',
        status: 'Ativa',
        observacoes:
          'Conferir sangrias, fundo de troco e funcionamento dos terminais antes de liberar as portas.',
      },
      {
        nome: 'Auditoria Matinal de Preços e Encartes',
        responsavel: 'Cartazista',
        area: 'Cartazista',
        frequencia: 'Diária',
        horario_limite: '08:00h',
        ferramenta: 'Impressora de gôndola e coletor',
        validacao: 'Gerente de Operações',
        status: 'Ativa',
        observacoes:
          'Validar se todos os cartazes de ofertas ativas coincidem com os valores vigentes no PDV.',
      },
      {
        nome: 'Ronda de Prevenção e Portas de Emergência',
        responsavel: 'Prevenção',
        area: 'Prevenção',
        frequencia: 'Diária',
        horario_limite: '08:30h',
        ferramenta: 'Rádio comunicador e prancheta',
        validacao: 'Coord. Prevenção de Perdas',
        status: 'Ativa',
        observacoes:
          'Checagem de alarmes, saídas desobstruídas e posicionamento das antenas antifurto.',
      },
      {
        nome: 'Conferência de Cargas de Perecíveis',
        responsavel: 'Conferente',
        area: 'Conferente',
        frequencia: 'A cada recebimento',
        horario_limite: '10:30h',
        ferramenta: 'Termômetro digital e coletor de dados',
        validacao: 'Encarregado de Recebimento',
        status: 'Ativa',
        observacoes:
          'Registrar temperatura de caminhão refrigerado e peso das caixas antes do descarregamento.',
      },
      {
        nome: 'Inspeção de Validades e Curva de Vencimento',
        responsavel: 'Encarregado',
        area: 'Encarregado',
        frequencia: 'Diária',
        horario_limite: '11:00h',
        ferramenta: 'Aplicativo de gestão de validade',
        validacao: 'Gerente de Loja',
        status: 'Ativa',
        observacoes:
          'Aplicar desconto progressivo de itens a vencer em até 5 dias conforme política comercial.',
      },
      {
        nome: 'Mapeamento de Rupturas de Gôndola',
        responsavel: 'Analista',
        area: 'Analista',
        frequencia: 'Diária',
        horario_limite: '13:30h',
        ferramenta: 'Coletor RF e relatório de estoque virtual',
        validacao: 'Gerente de Operações',
        status: 'Ativa',
        observacoes:
          'Identificar itens zerados na área de vendas que possuem saldo no depósito e gerar ordem de reposição.',
      },
      {
        nome: 'Contagem Cíclica de Itens Sensíveis (PAR)',
        responsavel: 'Analista',
        area: 'Analista',
        frequencia: 'Semanal',
        horario_limite: '15:00h',
        ferramenta: 'Sistema ERP e coletor',
        validacao: 'Auditoria / Gerência',
        status: 'Ativa',
        observacoes:
          'Contagem semanal dos produtos de alto risco (eletrônicos, bebidas premium, perfumaria).',
      },
      {
        nome: 'Fechamento de Caixa e Sangrias Vespertinas',
        responsavel: 'APP',
        area: 'APP',
        frequencia: 'Conforme vendas',
        horario_limite: '18:00h',
        ferramenta: 'Cofre inteligente e sistema de tesouraria',
        validacao: 'Encarregado Financeiro',
        status: 'Ativa',
        observacoes:
          'Garantir que nenhum caixa exceda o limite de valor físico estabelecido pela seguradora.',
      },
    ]

    for (let i = 0; i < genericRoutines.length; i++) {
      const item = genericRoutines[i]
      try {
        app.findFirstRecordByData('rotinas', 'nome', item.nome)
      } catch (_) {
        const record = new Record(rotinasCol)
        record.set('nome', item.nome)
        record.set('responsavel', item.responsavel)
        record.set('area', item.area)
        record.set('frequencia', item.frequencia)
        record.set('horario_limite', item.horario_limite)
        record.set('ferramenta', item.ferramenta)
        record.set('validacao', item.validacao)
        record.set('status', item.status)
        record.set('observacoes', item.observacoes)
        app.save(record)
      }
    }
  },
  (app) => {
    // down migration
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'dfarias53@gmail.com')
      app.delete(admin)
    } catch (_) {}
  },
)
