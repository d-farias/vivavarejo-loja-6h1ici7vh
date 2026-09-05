migrate(
  (app) => {
    // 1. Atualizar collection `lojas` com `email_regional` (text) e `alertas_ativos` (bool)
    const lojasCol = app.findCollectionByNameOrId('lojas')
    let lojasChanged = false

    if (!lojasCol.fields.getByName('email_regional')) {
      lojasCol.fields.add(
        new TextField({
          name: 'email_regional',
          required: false,
        }),
      )
      lojasChanged = true
    }

    if (!lojasCol.fields.getByName('alertas_ativos')) {
      lojasCol.fields.add(
        new BoolField({
          name: 'alertas_ativos',
          required: false,
        }),
      )
      lojasChanged = true
    }

    if (lojasChanged) {
      app.save(lojasCol)
    }

    // 2. Atualizar collection `rotinas` com `alerta_enviado_em` (text formato YYYY-MM-DD para anti-duplicidade diária)
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    let rotinasChanged = false

    if (!rotinasCol.fields.getByName('alerta_enviado_em')) {
      rotinasCol.fields.add(
        new TextField({
          name: 'alerta_enviado_em',
          required: false,
        }),
      )
      rotinasChanged = true
    }

    if (rotinasChanged) {
      app.save(rotinasCol)
    }
  },
  (app) => {
    try {
      const lojasCol = app.findCollectionByNameOrId('lojas')
      let lojasChanged = false
      if (lojasCol.fields.getByName('email_regional')) {
        lojasCol.fields.removeByName('email_regional')
        lojasChanged = true
      }
      if (lojasCol.fields.getByName('alertas_ativos')) {
        lojasCol.fields.removeByName('alertas_ativos')
        lojasChanged = true
      }
      if (lojasChanged) {
        app.save(lojasCol)
      }
    } catch (_) {}

    try {
      const rotinasCol = app.findCollectionByNameOrId('rotinas')
      if (rotinasCol.fields.getByName('alerta_enviado_em')) {
        rotinasCol.fields.removeByName('alerta_enviado_em')
        app.save(rotinasCol)
      }
    } catch (_) {}
  },
)
