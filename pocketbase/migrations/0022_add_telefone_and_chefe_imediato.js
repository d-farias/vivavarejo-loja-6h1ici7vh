migrate(
  (app) => {
    // 1. Campo `telefone` em `funcionarios`
    const funcionariosCol = app.findCollectionByNameOrId('funcionarios')
    if (!funcionariosCol.fields.getByName('telefone')) {
      funcionariosCol.fields.add(
        new TextField({
          name: 'telefone',
          required: false,
        }),
      )
      app.save(funcionariosCol)
    }

    // 2. Campo `telefone` e `chefe_imediato_funcao` em `funcoes`
    // Permite mapear para cada função quem é a função do chefe imediato (ex: LP -> GO, GO -> Gerente)
    const funcoesCol = app.findCollectionByNameOrId('funcoes')
    let saveFuncoes = false
    if (!funcoesCol.fields.getByName('telefone')) {
      funcoesCol.fields.add(
        new TextField({
          name: 'telefone',
          required: false,
        }),
      )
      saveFuncoes = true
    }
    if (!funcoesCol.fields.getByName('chefe_imediato_funcao')) {
      funcoesCol.fields.add(
        new RelationField({
          name: 'chefe_imediato_funcao',
          collectionId: funcoesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
      saveFuncoes = true
    }
    if (saveFuncoes) {
      app.save(funcoesCol)
    }

    // 3. Campo `telefone` na tabela `users` (caso notificações usem usuário diretamente)
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('telefone')) {
      usersCol.fields.add(
        new TextField({
          name: 'telefone',
          required: false,
        }),
      )
      app.save(usersCol)
    }

    // 4. Campos de telefone do responsável e do chefe imediato em `rotinas`
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    let saveRotinas = false
    if (!rotinasCol.fields.getByName('telefone_responsavel')) {
      rotinasCol.fields.add(
        new TextField({
          name: 'telefone_responsavel',
          required: false,
        }),
      )
      saveRotinas = true
    }
    if (!rotinasCol.fields.getByName('telefone_chefe')) {
      rotinasCol.fields.add(
        new TextField({
          name: 'telefone_chefe',
          required: false,
        }),
      )
      saveRotinas = true
    }
    if (saveRotinas) {
      app.save(rotinasCol)
    }

    // 5. Campos de telefone do responsável e do chefe imediato em `tarefas_validade`
    const tvCol = app.findCollectionByNameOrId('tarefas_validade')
    let saveTv = false
    if (!tvCol.fields.getByName('telefone_responsavel')) {
      tvCol.fields.add(
        new TextField({
          name: 'telefone_responsavel',
          required: false,
        }),
      )
      saveTv = true
    }
    if (!tvCol.fields.getByName('telefone_chefe')) {
      tvCol.fields.add(
        new TextField({
          name: 'telefone_chefe',
          required: false,
        }),
      )
      saveTv = true
    }
    if (saveTv) {
      app.save(tvCol)
    }
  },
  (app) => {
    try {
      const funcionariosCol = app.findCollectionByNameOrId('funcionarios')
      funcionariosCol.fields.removeByName('telefone')
      app.save(funcionariosCol)
    } catch (_) {}

    try {
      const funcoesCol = app.findCollectionByNameOrId('funcoes')
      funcoesCol.fields.removeByName('telefone')
      funcoesCol.fields.removeByName('chefe_imediato_funcao')
      app.save(funcoesCol)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('users')
      usersCol.fields.removeByName('telefone')
      app.save(usersCol)
    } catch (_) {}

    try {
      const rotinasCol = app.findCollectionByNameOrId('rotinas')
      rotinasCol.fields.removeByName('telefone_responsavel')
      rotinasCol.fields.removeByName('telefone_chefe')
      app.save(rotinasCol)
    } catch (_) {}

    try {
      const tvCol = app.findCollectionByNameOrId('tarefas_validade')
      tvCol.fields.removeByName('telefone_responsavel')
      tvCol.fields.removeByName('telefone_chefe')
      app.save(tvCol)
    } catch (_) {}
  },
)
