migrate(
  (app) => {
    const clientesCol = app.findCollectionByNameOrId('clientes')
    if (!clientesCol.fields.getByName('envio_semanal')) {
      clientesCol.fields.add(
        new BoolField({
          name: 'envio_semanal',
          required: false,
        }),
      )
      app.save(clientesCol)
    }
  },
  (app) => {
    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      const field = clientesCol.fields.getByName('envio_semanal')
      if (field) {
        clientesCol.fields.removeByName('envio_semanal')
        app.save(clientesCol)
      }
    } catch (_) {}
  },
)
