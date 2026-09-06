migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const execucoesCol = app.findCollectionByNameOrId('execucoes_rotinas')

    // 1. Atualizar collection `clientes` com `tipo_pessoa` (select PF/PJ) e `segmento` (text)
    let clientesChanged = false
    if (!clientesCol.fields.getByName('tipo_pessoa')) {
      clientesCol.fields.add(
        new SelectField({
          name: 'tipo_pessoa',
          required: false,
          values: ['PF', 'PJ'],
          maxSelect: 1,
        }),
      )
      clientesChanged = true
    }

    if (!clientesCol.fields.getByName('segmento')) {
      clientesCol.fields.add(
        new TextField({
          name: 'segmento',
          required: false,
        }),
      )
      clientesChanged = true
    }

    if (clientesChanged) {
      app.save(clientesCol)
    }

    // 2. Atualizar collection `execucoes_rotinas` com campo `foto` (file)
    if (!execucoesCol.fields.getByName('foto')) {
      execucoesCol.fields.add(
        new FileField({
          name: 'foto',
          required: false,
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      )
      app.save(execucoesCol)
    }

    // 3. Criar nova collection `planos_acao`
    // descricao (texto, obrigatório)
    // loja (relação lojas, obrigatório)
    // rotina (relação rotinas, opcional - origem)
    // criado_por (relação users, opcional/automático)
    // responsavel (texto livre, ex: nome do funcionário ou função)
    // prazo (date)
    // status (select: aberta | em_andamento | concluida)
    // prioridade (select: baixa | media | alta)
    // observacoes (texto opcional)
    // Regras de acesso: autenticados leem e criam/editam
    let planosCol
    try {
      planosCol = app.findCollectionByNameOrId('planos_acao')
    } catch (_) {
      planosCol = new Collection({
        name: 'planos_acao',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'descricao', type: 'text', required: true },
          {
            name: 'loja',
            type: 'relation',
            required: true,
            collectionId: lojasCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'rotina',
            type: 'relation',
            required: false,
            collectionId: rotinasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'criado_por',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'responsavel', type: 'text', required: false },
          { name: 'prazo', type: 'date', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['aberta', 'em_andamento', 'concluida'],
            maxSelect: 1,
          },
          {
            name: 'prioridade',
            type: 'select',
            required: true,
            values: ['baixa', 'media', 'alta'],
            maxSelect: 1,
          },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_planos_loja ON planos_acao (loja)',
          'CREATE INDEX idx_planos_rotina ON planos_acao (rotina)',
          'CREATE INDEX idx_planos_status ON planos_acao (status)',
          'CREATE INDEX idx_planos_prazo ON planos_acao (prazo)',
          'CREATE INDEX idx_planos_created ON planos_acao (created)',
        ],
      })
      app.save(planosCol)
    }
  },
  (app) => {
    try {
      const planosCol = app.findCollectionByNameOrId('planos_acao')
      app.delete(planosCol)
    } catch (_) {}

    try {
      const execucoesCol = app.findCollectionByNameOrId('execucoes_rotinas')
      if (execucoesCol.fields.getByName('foto')) {
        execucoesCol.fields.removeByName('foto')
        app.save(execucoesCol)
      }
    } catch (_) {}

    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      let clientesChanged = false
      if (clientesCol.fields.getByName('tipo_pessoa')) {
        clientesCol.fields.removeByName('tipo_pessoa')
        clientesChanged = true
      }
      if (clientesCol.fields.getByName('segmento')) {
        clientesCol.fields.removeByName('segmento')
        clientesChanged = true
      }
      if (clientesChanged) {
        app.save(clientesCol)
      }
    } catch (_) {}
  },
)
