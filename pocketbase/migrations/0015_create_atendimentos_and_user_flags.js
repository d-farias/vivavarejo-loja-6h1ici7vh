migrate(
  (app) => {
    // 1. Atualizar a collection users com campos de controle para anti-spam:
    // - primeiro_acesso_notificado (bool): flag se o primeiro acesso/login já foi notificado
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('primeiro_acesso_notificado')) {
      usersCol.fields.add(
        new BoolField({
          name: 'primeiro_acesso_notificado',
          required: false,
        }),
      )
      app.save(usersCol)
    }

    // 2. Criar a collection "atendimentos" para o Atendimento Pós-Acesso Inteligente
    if (!app.hasTable('atendimentos')) {
      const atendimentos = new Collection({
        name: 'atendimentos',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.perfil = 'admin')",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'cliente_nome', type: 'text', required: false },
          { name: 'email', type: 'text', required: false },
          {
            name: 'encontrou_solucao',
            type: 'select',
            required: false,
            values: ['sim', 'ficou_duvida', 'ainda_nao'],
            maxSelect: 1,
          },
          { name: 'no_que_podemos_ajudar', type: 'text', required: false },
          {
            name: 'prazo_contato',
            type: 'select',
            required: false,
            values: ['hoje', 'esta_semana', 'so_explorar'],
            maxSelect: 1,
          },
          { name: 'maiores_dores', type: 'text', required: false },
          { name: 'notificado_email', type: 'bool', required: false },
          { name: 'dispensado', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_atendimentos_usuario ON atendimentos (usuario)',
          'CREATE INDEX idx_atendimentos_created ON atendimentos (created)',
        ],
      })
      app.save(atendimentos)
    }
  },
  (app) => {
    try {
      const atendimentos = app.findCollectionByNameOrId('atendimentos')
      app.delete(atendimentos)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('primeiro_acesso_notificado')) {
        usersCol.fields.removeByName('primeiro_acesso_notificado')
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
