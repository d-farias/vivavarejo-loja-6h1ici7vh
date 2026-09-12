migrate(
  (app) => {
    // 1. Adicionar campo 'segmento' e 'ativo' na collection rotinas se não existirem
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    let rotinasChanged = false

    if (!rotinasCol.fields.getByName('segmento')) {
      rotinasCol.fields.add(
        new TextField({
          name: 'segmento',
          required: false,
        }),
      )
      rotinasChanged = true
    }

    if (!rotinasCol.fields.getByName('ativo')) {
      rotinasCol.fields.add(
        new BoolField({
          name: 'ativo',
          required: false,
        }),
      )
      rotinasChanged = true
    }

    if (rotinasChanged) {
      app.save(rotinasCol)
    }

    // 2. Adicionar campo 'segmento' na collection users se não existir (para vínculo direto do usuário leigo)
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('segmento')) {
      usersCol.fields.add(
        new TextField({
          name: 'segmento',
          required: false,
        }),
      )
      app.save(usersCol)
    }

    // 3. Atualizar rotinas existentes com base no cliente da loja ou segmento padrão de Supermercado
    try {
      app
        .db()
        .newQuery(`
        UPDATE rotinas
        SET segmento = 'Supermercado/Food'
        WHERE segmento IS NULL OR segmento = ''
      `)
        .execute()

      app
        .db()
        .newQuery(`
        UPDATE rotinas
        SET ativo = 1
        WHERE ativo IS NULL
      `)
        .execute()
    } catch (e) {
      console.log('Aviso ao atualizar segmento/ativo em rotinas:', e)
    }
  },
  (app) => {
    try {
      const rotinasCol = app.findCollectionByNameOrId('rotinas')
      if (rotinasCol.fields.getByName('segmento')) {
        rotinasCol.fields.removeByName('segmento')
      }
      if (rotinasCol.fields.getByName('ativo')) {
        rotinasCol.fields.removeByName('ativo')
      }
      app.save(rotinasCol)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('segmento')) {
        usersCol.fields.removeByName('segmento')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
