/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Atualizar collection `users` adicionando o perfil 'regional'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const perfilField = usersCol.fields.getByName('perfil')
    if (perfilField && perfilField.type === 'select') {
      const currentValues = perfilField.values || []
      if (!currentValues.includes('regional')) {
        perfilField.values = [...currentValues, 'regional']
        app.save(usersCol)
      }
    }

    // 2. Atualizar collection `execucoes_rotinas` com status de validação, comentário e validador
    const execsCol = app.findCollectionByNameOrId('execucoes_rotinas')

    if (!execsCol.fields.getByName('status_validacao')) {
      execsCol.fields.add(
        new SelectField({
          name: 'status_validacao',
          required: false,
          values: ['aguardando_validacao', 'aprovada', 'devolvida'],
          maxSelect: 1,
        }),
      )
    }

    if (!execsCol.fields.getByName('comentario_validacao')) {
      execsCol.fields.add(
        new TextField({
          name: 'comentario_validacao',
          required: false,
        }),
      )
    }

    if (!execsCol.fields.getByName('validado_por')) {
      execsCol.fields.add(
        new RelationField({
          name: 'validado_por',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    if (!execsCol.fields.getByName('validado_em')) {
      execsCol.fields.add(
        new TextField({
          name: 'validado_em',
          required: false,
        }),
      )
    }

    // Ajustar regras da collection execucoes_rotinas
    execsCol.listRule = "@request.auth.id != ''"
    execsCol.viewRule = "@request.auth.id != ''"
    execsCol.createRule = "@request.auth.id != ''"
    execsCol.updateRule = "@request.auth.id != ''"
    execsCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'regional' || @request.auth.id = usuario)"

    execsCol.addIndex('idx_execs_status_validacao', false, 'status_validacao', '')
    app.save(execsCol)

    // Atualizar execuções existentes para ficarem com 'aprovada' como legado
    app
      .db()
      .newQuery(
        "UPDATE execucoes_rotinas SET status_validacao = 'aprovada' WHERE status_validacao IS NULL OR status_validacao = ''",
      )
      .execute()
  },
  (app) => {
    const execsCol = app.findCollectionByNameOrId('execucoes_rotinas')
    if (execsCol.fields.getByName('status_validacao'))
      execsCol.fields.removeByName('status_validacao')
    if (execsCol.fields.getByName('comentario_validacao'))
      execsCol.fields.removeByName('comentario_validacao')
    if (execsCol.fields.getByName('validado_por')) execsCol.fields.removeByName('validado_por')
    if (execsCol.fields.getByName('validado_em')) execsCol.fields.removeByName('validado_em')
    app.save(execsCol)
  },
)
