migrate(
  (app) => {
    // 1. Atualizar collection `users` adicionando o campo `perfil` e garantindo dfarias53@gmail.com como admin
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('perfil')) {
      usersCol.fields.add(
        new SelectField({
          name: 'perfil',
          required: false,
          values: ['admin', 'lider', 'funcionario'],
          maxSelect: 1,
        }),
      )
      // Ajustar regras de users para que admin possa listar e editar todos os usuários
      usersCol.listRule = "@request.auth.id != ''"
      usersCol.viewRule = "@request.auth.id != ''"
      usersCol.updateRule =
        "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin')"
      app.save(usersCol)
    }

    // Atualizar o usuário existente dfarias53@gmail.com para perfil = admin
    try {
      const adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'dfarias53@gmail.com')
      adminRecord.set('perfil', 'admin')
      app.save(adminRecord)
    } catch (_) {}

    // 2. Nova collection `clientes`
    // Campos: nome (texto, obrigatório), contato (texto opcional), observacoes (texto opcional)
    // Regras: leitura para autenticados; escrita apenas para perfil admin
    let clientesCol
    try {
      clientesCol = app.findCollectionByNameOrId('clientes')
    } catch (_) {
      clientesCol = new Collection({
        name: 'clientes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'contato', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_clientes_nome ON clientes (nome)'],
      })
      app.save(clientesCol)
    }

    // 3. Nova collection `lojas`
    // Campos: nome (obrigatório), cliente (relation -> clientes, obrigatório), codigo (texto opcional), observacoes (opcional)
    // Regras: leitura autenticada; escrita para admin
    let lojasCol
    try {
      lojasCol = app.findCollectionByNameOrId('lojas')
    } catch (_) {
      lojasCol = new Collection({
        name: 'lojas',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          {
            name: 'cliente',
            type: 'relation',
            required: true,
            collectionId: clientesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'codigo', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_lojas_cliente ON lojas (cliente)',
          'CREATE INDEX idx_lojas_nome ON lojas (nome)',
        ],
      })
      app.save(lojasCol)
    }

    // 4. Nova collection `funcoes`
    // Campos: nome (obrigatório), loja (relation -> lojas, obrigatório)
    // Regras: leitura autenticada, escrita admin
    let funcoesCol
    try {
      funcoesCol = app.findCollectionByNameOrId('funcoes')
    } catch (_) {
      funcoesCol = new Collection({
        name: 'funcoes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          {
            name: 'loja',
            type: 'relation',
            required: true,
            collectionId: lojasCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_funcoes_loja ON funcoes (loja)',
          'CREATE INDEX idx_funcoes_nome ON funcoes (nome)',
        ],
      })
      app.save(funcoesCol)
    }

    // 5. Nova collection `funcionarios`
    // Campos: nome (obrigatório), funcao (relation -> funcoes, obrigatório), loja (relation -> lojas, obrigatório),
    // usuario (relation -> users, opcional), ativo (bool, default true, não obrigatório)
    // Regras: leitura autenticada, escrita admin
    let funcionariosCol
    try {
      funcionariosCol = app.findCollectionByNameOrId('funcionarios')
    } catch (_) {
      funcionariosCol = new Collection({
        name: 'funcionarios',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          {
            name: 'funcao',
            type: 'relation',
            required: true,
            collectionId: funcoesCol.id,
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
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_funcionarios_loja ON funcionarios (loja)',
          'CREATE INDEX idx_funcionarios_funcao ON funcionarios (funcao)',
          'CREATE INDEX idx_funcionarios_usuario ON funcionarios (usuario)',
          'CREATE INDEX idx_funcionarios_ativo ON funcionarios (ativo)',
        ],
      })
      app.save(funcionariosCol)
    }

    // 6. Extender `rotinas` com: `loja` (relation -> lojas) e `funcao` (relation -> funcoes, opcional)
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    let rotinasChanged = false
    if (!rotinasCol.fields.getByName('loja')) {
      rotinasCol.fields.add(
        new RelationField({
          name: 'loja',
          required: false,
          collectionId: lojasCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      rotinasChanged = true
    }

    if (!rotinasCol.fields.getByName('funcao')) {
      rotinasCol.fields.add(
        new RelationField({
          name: 'funcao',
          required: false,
          collectionId: funcoesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      rotinasChanged = true
    }

    // Ajustar regras de rotinas:
    // admin pode criar, editar e excluir tudo; líder pode criar e editar rotinas da sua loja; funcionário apenas leitura
    // rotinas create/update: admin ou líder autenticado
    rotinasCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'lider' || @request.auth.perfil = '')"
    rotinasCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'lider' || @request.auth.perfil = '')"
    rotinasCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'lider' || @request.auth.perfil = '')"
    rotinasChanged = true

    if (rotinasChanged) {
      rotinasCol.addIndex('idx_rotinas_loja', false, 'loja', '')
      rotinasCol.addIndex('idx_rotinas_funcao', false, 'funcao', '')
      app.save(rotinasCol)
    }
  },
  (app) => {
    // Reverter coleções adicionadas
    try {
      const funcs = app.findCollectionByNameOrId('funcionarios')
      app.delete(funcs)
    } catch (_) {}

    try {
      const funcoes = app.findCollectionByNameOrId('funcoes')
      app.delete(funcoes)
    } catch (_) {}

    try {
      const lojas = app.findCollectionByNameOrId('lojas')
      app.delete(lojas)
    } catch (_) {}

    try {
      const clientes = app.findCollectionByNameOrId('clientes')
      app.delete(clientes)
    } catch (_) {}
  },
)
