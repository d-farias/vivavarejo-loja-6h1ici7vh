migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const clientesCol = app.findCollectionByNameOrId('clientes')

    // 1. Coleção fornecedores
    let fornecedoresCol
    try {
      fornecedoresCol = app.findCollectionByNameOrId('fornecedores')
    } catch (_) {
      fornecedoresCol = new Collection({
        name: 'fornecedores',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'contato', type: 'text', required: false }, // email ou nome de contato
          { name: 'telefone', type: 'text', required: false },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'ativo', type: 'bool', required: false },
          {
            name: 'cliente',
            type: 'relation',
            required: false,
            collectionId: clientesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_fornecedores_nome ON fornecedores (nome)',
          'CREATE INDEX idx_fornecedores_cliente ON fornecedores (cliente)',
          'CREATE INDEX idx_fornecedores_ativo ON fornecedores (ativo)',
        ],
      })
      app.save(fornecedoresCol)
    }

    // 2. Coleção promotores
    let promotoresCol
    try {
      promotoresCol = app.findCollectionByNameOrId('promotores')
    } catch (_) {
      promotoresCol = new Collection({
        name: 'promotores',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'email', type: 'text', required: false },
          { name: 'telefone', type: 'text', required: false },
          {
            name: 'fornecedor',
            type: 'relation',
            required: true,
            collectionId: fornecedoresCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_promotores_nome ON promotores (nome)',
          'CREATE INDEX idx_promotores_fornecedor ON promotores (fornecedor)',
          'CREATE INDEX idx_promotores_usuario ON promotores (usuario)',
          'CREATE INDEX idx_promotores_ativo ON promotores (ativo)',
        ],
      })
      app.save(promotoresCol)
    }

    // 3. Coleção rotinas_promotor (rotinas padrão de promotor em loja)
    let rotinasPromotorCol
    try {
      rotinasPromotorCol = app.findCollectionByNameOrId('rotinas_promotor')
    } catch (_) {
      rotinasPromotorCol = new Collection({
        name: 'rotinas_promotor',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: false },
          {
            name: 'fornecedor',
            type: 'relation',
            required: false,
            collectionId: fornecedoresCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'loja',
            type: 'relation',
            required: false,
            collectionId: lojasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'frequencia', type: 'text', required: false },
          { name: 'ativa', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_rot_prom_fornecedor ON rotinas_promotor (fornecedor)',
          'CREATE INDEX idx_rot_prom_loja ON rotinas_promotor (loja)',
          'CREATE INDEX idx_rot_prom_ativa ON rotinas_promotor (ativa)',
        ],
      })
      app.save(rotinasPromotorCol)
    }

    // 4. Coleção visitas_promotor
    let visitasCol
    try {
      visitasCol = app.findCollectionByNameOrId('visitas_promotor')
    } catch (_) {
      visitasCol = new Collection({
        name: 'visitas_promotor',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'promotor',
            type: 'relation',
            required: true,
            collectionId: promotoresCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'loja',
            type: 'relation',
            required: true,
            collectionId: lojasCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'data_visita', type: 'date', required: true },
          { name: 'hora_prevista', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['agendada', 'realizada', 'atrasada', 'cancelada'],
            maxSelect: 1,
          },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'conclusao_check', type: 'text', required: false }, // o que foi realizado/concluído
          { name: 'rotinas_executadas', type: 'text', required: false }, // lista ou resumo das rotinas executadas
          { name: 'realizada_em', type: 'text', required: false },
          {
            name: 'registrado_por',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_visitas_promotor ON visitas_promotor (promotor)',
          'CREATE INDEX idx_visitas_loja ON visitas_promotor (loja)',
          'CREATE INDEX idx_visitas_data ON visitas_promotor (data_visita)',
          'CREATE INDEX idx_visitas_status ON visitas_promotor (status)',
        ],
      })
      app.save(visitasCol)
    }

    // 5. Seed inicial representativo (se não houver fornecedores)
    try {
      const existingForn = app.findRecordsByFilter('fornecedores', '', 'nome', 1, 0)
      if (existingForn.length === 0) {
        // Criar 2 fornecedores de exemplo
        const f1 = new Record(fornecedoresCol)
        f1.set('nome', 'Nestlé Brasil')
        f1.set('contato', 'contato.varejo@nestle.com.br')
        f1.set('telefone', '(11) 98765-4321')
        f1.set('observacoes', 'Atendimento semanal mercearia e matinais')
        f1.set('ativo', true)
        app.save(f1)

        const f2 = new Record(fornecedoresCol)
        f2.set('nome', 'Ambev Bebidas')
        f2.set('contato', 'pedidos.promotores@ambev.com.br')
        f2.set('telefone', '(11) 97654-3210')
        f2.set('observacoes', 'Reposição refrigerada e pontas de gôndola')
        f2.set('ativo', true)
        app.save(f2)

        // Criar promotores
        const p1 = new Record(promotoresCol)
        p1.set('nome', 'Carlos Eduardo Silva')
        p1.set('email', 'carlos.promotor@nestle.com')
        p1.set('telefone', '(11) 99123-1122')
        p1.set('fornecedor', f1.id)
        p1.set('ativo', true)
        app.save(p1)

        const p2 = new Record(promotoresCol)
        p2.set('nome', 'Mariana Oliveira Santos')
        p2.set('email', 'mariana.promotora@ambev.com')
        p2.set('telefone', '(11) 99345-3344')
        p2.set('fornecedor', f2.id)
        p2.set('ativo', true)
        app.save(p2)

        // Criar rotinas padrão de promotor
        const r1 = new Record(rotinasPromotorCol)
        r1.set('titulo', 'Abastecimento de gôndola e pontos extras')
        r1.set(
          'descricao',
          'Verificar rupturas, repor produtos do depósito e puxar frente com FIFO',
        )
        r1.set('fornecedor', f1.id)
        r1.set('frequencia', 'Em cada visita')
        r1.set('ativa', true)
        app.save(r1)

        const r2 = new Record(rotinasPromotorCol)
        r2.set('titulo', 'Checagem de validade e precificação')
        r2.set('descricao', 'Auditar etiquetas de preço e itens a menos de 30 dias do vencimento')
        r2.set('fornecedor', f1.id)
        r2.set('frequencia', 'Em cada visita')
        r2.set('ativa', true)
        app.save(r2)

        const r3 = new Record(rotinasPromotorCol)
        r3.set('titulo', 'Montagem de ponta de gôndola / ilha promocional')
        r3.set('descricao', 'Garantir visual merchandising, cartaz de oferta e alinhamento')
        r3.set('fornecedor', f2.id)
        r3.set('frequencia', 'Semanal')
        r3.set('ativa', true)
        app.save(r3)

        // Se houver loja existente, criar visita agendada para hoje
        try {
          const lojas = app.findRecordsByFilter('lojas', '', 'nome', 1, 0)
          if (lojas.length > 0) {
            const hoje = new Date().toISOString().split('T')[0]
            const v1 = new Record(visitasCol)
            v1.set('promotor', p1.id)
            v1.set('loja', lojas[0].id)
            v1.set('data_visita', `${hoje} 00:00:00.000Z`)
            v1.set('hora_prevista', '09:00')
            v1.set('status', 'agendada')
            v1.set('observacoes', 'Visita de reposição e auditoria de tabloide de ofertas')
            app.save(v1)

            const v2 = new Record(visitasCol)
            v2.set('promotor', p2.id)
            v2.set('loja', lojas[0].id)
            v2.set('data_visita', `${hoje} 00:00:00.000Z`)
            v2.set('hora_prevista', '14:30')
            v2.set('status', 'agendada')
            v2.set('observacoes', 'Abastecimento dos refrigeradores para o final de semana')
            app.save(v2)
          }
        } catch (_) {}
      }
    } catch (e) {
      console.log('Seed fornecedores/promotores skip:', e)
    }
  },
  (app) => {
    try {
      const visitasCol = app.findCollectionByNameOrId('visitas_promotor')
      app.delete(visitasCol)
    } catch (_) {}
    try {
      const rotinasPromotorCol = app.findCollectionByNameOrId('rotinas_promotor')
      app.delete(rotinasPromotorCol)
    } catch (_) {}
    try {
      const promotoresCol = app.findCollectionByNameOrId('promotores')
      app.delete(promotoresCol)
    } catch (_) {}
    try {
      const fornecedoresCol = app.findCollectionByNameOrId('fornecedores')
      app.delete(fornecedoresCol)
    } catch (_) {}
  },
)
