migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('visitas')
    let changed = false

    if (!col.fields.getByName('user_nome')) {
      col.fields.add(
        new TextField({
          name: 'user_nome',
          type: 'text',
          required: false,
        }),
      )
      changed = true
    }

    if (!col.fields.getByName('user_perfil')) {
      col.fields.add(
        new TextField({
          name: 'user_perfil',
          type: 'text',
          required: false,
        }),
      )
      changed = true
    }

    if (changed) {
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('visitas')
      let changed = false
      if (col.fields.getByName('user_nome')) {
        col.fields.removeByName('user_nome')
        changed = true
      }
      if (col.fields.getByName('user_perfil')) {
        col.fields.removeByName('user_perfil')
        changed = true
      }
      if (changed) {
        app.save(col)
      }
    } catch (_) {}
  },
)
