migrate(
  (app) => {
    const clientesCol = app.findCollectionByNameOrId('clientes')
    let changed = false

    // 1. Campo info_negocio: Informações do negócio (ex: nº de lojas, colaboradores, cidade)
    if (!clientesCol.fields.getByName('info_negocio')) {
      clientesCol.fields.add(
        new TextField({
          name: 'info_negocio',
          required: false,
        }),
      )
      changed = true
    }

    // 2. Campo gargalos: Maiores gargalos ou problemas da operação
    if (!clientesCol.fields.getByName('gargalos')) {
      clientesCol.fields.add(
        new TextField({
          name: 'gargalos',
          required: false,
        }),
      )
      changed = true
    }

    // 3. Campo inventario_situacao: Situação / controle de inventário da empresa
    if (!clientesCol.fields.getByName('inventario_situacao')) {
      clientesCol.fields.add(
        new TextField({
          name: 'inventario_situacao',
          required: false,
        }),
      )
      changed = true
    }

    if (changed) {
      app.save(clientesCol)
    }
  },
  (app) => {
    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      let changed = false

      if (clientesCol.fields.getByName('info_negocio')) {
        clientesCol.fields.removeByName('info_negocio')
        changed = true
      }
      if (clientesCol.fields.getByName('gargalos')) {
        clientesCol.fields.removeByName('gargalos')
        changed = true
      }
      if (clientesCol.fields.getByName('inventario_situacao')) {
        clientesCol.fields.removeByName('inventario_situacao')
        changed = true
      }

      if (changed) {
        app.save(clientesCol)
      }
    } catch (_) {}
  },
)
