migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('match_demandas')

    // 1. Adicionar campo estoque_sistema (estoque virtual / sistema no ERP)
    if (!col.fields.getByName('estoque_sistema')) {
      col.fields.add(
        new NumberField({
          name: 'estoque_sistema',
          required: false,
        }),
      )
    }

    // 2. Atualizar opções do campo situacao para incluir divergencia_sistema_fisico e sem_giro
    const situacaoField = col.fields.getByName('situacao')
    if (situacaoField) {
      situacaoField.values = [
        'ruptura',
        'risco_ruptura',
        'pedido_aberto',
        'excesso_estoque',
        'oportunidade',
        'divergencia_sistema_fisico',
        'sem_giro',
      ]
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('match_demandas')
      if (col.fields.getByName('estoque_sistema')) {
        col.fields.removeByName('estoque_sistema')
      }
      const situacaoField = col.fields.getByName('situacao')
      if (situacaoField) {
        situacaoField.values = [
          'ruptura',
          'risco_ruptura',
          'pedido_aberto',
          'excesso_estoque',
          'oportunidade',
        ]
      }
      app.save(col)
    } catch (_) {}
  },
)
