migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Adicionar campo booleano 'ativo' se não existir
    if (!users.fields.getByName('ativo')) {
      users.fields.add(
        new BoolField({
          name: 'ativo',
          required: false,
        }),
      )
    }

    // Atualizar regras: permitir admin deletar se necessário, e update para admin
    // users já possui: update: @request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin')
    // vamos permitir delete para admin também:
    users.deleteRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin')"

    app.save(users)

    // Inicializar todos os usuários existentes com ativo = true
    app.db().newQuery('UPDATE users SET ativo = 1 WHERE ativo IS NULL').execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = users.fields.getByName('ativo')
    if (field) {
      users.fields.removeByName('ativo')
    }
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
