migrate(
  (app) => {
    // 1. Adicionar campo 'cargo' na coleção users se não existir
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('cargo')) {
      usersCol.fields.add(
        new TextField({
          name: 'cargo',
          required: false,
        }),
      )
      app.save(usersCol)
    }

    // 2. Adicionar campo 'cnpj' e 'cargo' na coleção clientes se não existirem
    const clientesCol = app.findCollectionByNameOrId('clientes')
    let clientesChanged = false
    if (!clientesCol.fields.getByName('cnpj')) {
      clientesCol.fields.add(
        new TextField({
          name: 'cnpj',
          required: false,
        }),
      )
      clientesChanged = true
    }
    if (!clientesCol.fields.getByName('cargo')) {
      clientesCol.fields.add(
        new TextField({
          name: 'cargo',
          required: false,
        }),
      )
      clientesChanged = true
    }
    if (clientesChanged) {
      app.save(clientesCol)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('cargo')) {
        usersCol.fields.removeByName('cargo')
        app.save(usersCol)
      }
    } catch (_) {}

    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      let changed = false
      if (clientesCol.fields.getByName('cnpj')) {
        clientesCol.fields.removeByName('cnpj')
        changed = true
      }
      if (clientesCol.fields.getByName('cargo')) {
        clientesCol.fields.removeByName('cargo')
        changed = true
      }
      if (changed) {
        app.save(clientesCol)
      }
    } catch (_) {}
  },
)
