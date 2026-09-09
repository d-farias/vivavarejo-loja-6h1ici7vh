/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Enriquecer coleção rotinas_promotor com foto_trabalho
    const rotinasPromotorCol = app.findCollectionByNameOrId('rotinas_promotor')

    if (!rotinasPromotorCol.fields.getByName('foto_trabalho')) {
      rotinasPromotorCol.fields.add(
        new FileField({
          name: 'foto_trabalho',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    app.save(rotinasPromotorCol)

    // 2. Enriquecer coleção visitas_promotor com fotos dedicadas por critério se necessário
    const visitasCol = app.findCollectionByNameOrId('visitas_promotor')

    if (!visitasCol.fields.getByName('foto_gondola')) {
      visitasCol.fields.add(
        new FileField({
          name: 'foto_gondola',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('foto_abastecimento')) {
      visitasCol.fields.add(
        new FileField({
          name: 'foto_abastecimento',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('foto_validades')) {
      visitasCol.fields.add(
        new FileField({
          name: 'foto_validades',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    app.save(visitasCol)
  },
  (app) => {
    try {
      const rotinasPromotorCol = app.findCollectionByNameOrId('rotinas_promotor')
      if (rotinasPromotorCol.fields.getByName('foto_trabalho')) {
        rotinasPromotorCol.fields.removeByName('foto_trabalho')
      }
      app.save(rotinasPromotorCol)
    } catch (_) {}

    try {
      const visitasCol = app.findCollectionByNameOrId('visitas_promotor')
      if (visitasCol.fields.getByName('foto_gondola')) {
        visitasCol.fields.removeByName('foto_gondola')
      }
      if (visitasCol.fields.getByName('foto_abastecimento')) {
        visitasCol.fields.removeByName('foto_abastecimento')
      }
      if (visitasCol.fields.getByName('foto_validades')) {
        visitasCol.fields.removeByName('foto_validades')
      }
      app.save(visitasCol)
    } catch (_) {}
  },
)
