migrate(
  (app) => {
    const planosCol = app.findCollectionByNameOrId('planos_acao')

    if (!planosCol.fields.getByName('area_demandante')) {
      planosCol.fields.add(
        new TextField({
          name: 'area_demandante',
          required: false,
        }),
      )
      app.save(planosCol)
    }

    // Adicionar índice para consulta rápida por área demandante
    try {
      planosCol.addIndex('idx_planos_area_demandante', false, 'area_demandante', '')
      app.save(planosCol)
    } catch (e) {
      console.log('[Migration 0027] Index notice:', e)
    }
  },
  (app) => {
    try {
      const planosCol = app.findCollectionByNameOrId('planos_acao')
      if (planosCol.fields.getByName('area_demandante')) {
        planosCol.fields.removeByName('area_demandante')
        app.save(planosCol)
      }
      try {
        planosCol.removeIndex('idx_planos_area_demandante')
        app.save(planosCol)
      } catch (_) {}
    } catch (_) {}
  },
)
