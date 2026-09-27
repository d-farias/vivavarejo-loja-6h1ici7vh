migrate(
  (app) => {
    // 1. Campos de geolocalização na coleção visitas
    try {
      const visitasCol = app.findCollectionByNameOrId('visitas')
      let changedVisitas = false

      if (!visitasCol.fields.getByName('cidade')) {
        visitasCol.fields.add(
          new TextField({
            name: 'cidade',
            type: 'text',
            required: false,
          }),
        )
        changedVisitas = true
      }

      if (!visitasCol.fields.getByName('regiao')) {
        visitasCol.fields.add(
          new TextField({
            name: 'regiao',
            type: 'text',
            required: false,
          }),
        )
        changedVisitas = true
      }

      if (!visitasCol.fields.getByName('pais')) {
        visitasCol.fields.add(
          new TextField({
            name: 'pais',
            type: 'text',
            required: false,
          }),
        )
        changedVisitas = true
      }

      if (changedVisitas) {
        app.save(visitasCol)
      }
    } catch (err) {
      console.log('Erro ao atualizar campos de visitas na migracao 0046:', err)
    }

    // 2. Campos de White-label e Marca da Rede na coleção clientes
    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      let changedClientes = false

      if (!clientesCol.fields.getByName('nome_exibicao')) {
        clientesCol.fields.add(
          new TextField({
            name: 'nome_exibicao',
            type: 'text',
            required: false,
          }),
        )
        changedClientes = true
      }

      if (!clientesCol.fields.getByName('logo')) {
        clientesCol.fields.add(
          new FileField({
            name: 'logo',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880, // 5MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
            protected: false,
          }),
        )
        changedClientes = true
      }

      if (!clientesCol.fields.getByName('cor_primaria')) {
        clientesCol.fields.add(
          new TextField({
            name: 'cor_primaria',
            type: 'text',
            required: false,
          }),
        )
        changedClientes = true
      }

      if (!clientesCol.fields.getByName('cor_secundaria')) {
        clientesCol.fields.add(
          new TextField({
            name: 'cor_secundaria',
            type: 'text',
            required: false,
          }),
        )
        changedClientes = true
      }

      if (changedClientes) {
        app.save(clientesCol)
      }
    } catch (err) {
      console.log('Erro ao atualizar campos de clientes na migracao 0046:', err)
    }
  },
  (app) => {
    try {
      const visitasCol = app.findCollectionByNameOrId('visitas')
      let changedVisitas = false
      if (visitasCol.fields.getByName('cidade')) {
        visitasCol.fields.removeByName('cidade')
        changedVisitas = true
      }
      if (visitasCol.fields.getByName('regiao')) {
        visitasCol.fields.removeByName('regiao')
        changedVisitas = true
      }
      if (visitasCol.fields.getByName('pais')) {
        visitasCol.fields.removeByName('pais')
        changedVisitas = true
      }
      if (changedVisitas) {
        app.save(visitasCol)
      }
    } catch (_) {}

    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      let changedClientes = false
      if (clientesCol.fields.getByName('nome_exibicao')) {
        clientesCol.fields.removeByName('nome_exibicao')
        changedClientes = true
      }
      if (clientesCol.fields.getByName('logo')) {
        clientesCol.fields.removeByName('logo')
        changedClientes = true
      }
      if (clientesCol.fields.getByName('cor_primaria')) {
        clientesCol.fields.removeByName('cor_primaria')
        changedClientes = true
      }
      if (clientesCol.fields.getByName('cor_secundaria')) {
        clientesCol.fields.removeByName('cor_secundaria')
        changedClientes = true
      }
      if (changedClientes) {
        app.save(clientesCol)
      }
    } catch (_) {}
  },
)
