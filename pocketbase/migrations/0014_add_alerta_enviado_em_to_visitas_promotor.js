/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('visitas_promotor')
    if (!col.fields.getByName('alerta_enviado_em')) {
      col.fields.add(
        new TextField({
          name: 'alerta_enviado_em',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('visitas_promotor')
      if (col.fields.getByName('alerta_enviado_em')) {
        col.fields.removeByName('alerta_enviado_em')
        app.save(col)
      }
    } catch (_) {}
  },
)
