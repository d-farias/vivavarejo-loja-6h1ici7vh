migrate(
  (app) => {
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção "inventarios"
    // loja, data, setor/categoria, tipo: rotativo|geral, status: planejado|em_andamento|concluido|cancelado
    if (!app.hasTable('inventarios')) {
      const inventarios = new Collection({
        name: 'inventarios',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'loja',
            type: 'relation',
            required: false,
            collectionId: lojasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'data',
            type: 'date',
            required: true,
          },
          {
            name: 'setor_categoria',
            type: 'text',
            required: true,
          },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['rotativo', 'geral'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: false,
            values: ['planejado', 'em_andamento', 'concluido', 'cancelado'],
            maxSelect: 1,
          },
          {
            name: 'itens_contados',
            type: 'number',
            required: false,
          },
          {
            name: 'divergencias_encontradas',
            type: 'number',
            required: false,
          },
          {
            name: 'acuracidade_percentual',
            type: 'number',
            required: false,
          },
          {
            name: 'responsavel_nome',
            type: 'text',
            required: false,
          },
          {
            name: 'responsavel_usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'observacao',
            type: 'text',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_inv_loja ON inventarios (loja)',
          'CREATE INDEX idx_inv_data ON inventarios (data)',
          'CREATE INDEX idx_inv_setor ON inventarios (setor_categoria)',
          'CREATE INDEX idx_inv_tipo ON inventarios (tipo)',
          'CREATE INDEX idx_inv_status ON inventarios (status)',
        ],
      })
      app.save(inventarios)
    }

    // 2. Coleção "perdas"
    // loja, data, setor/categoria, motivo: vencimento|avaria|roubo|erro de pedido|outro, quantidade, valor estimado, observação, foto opcional, registrado_por
    if (!app.hasTable('perdas')) {
      const perdas = new Collection({
        name: 'perdas',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'loja',
            type: 'relation',
            required: false,
            collectionId: lojasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'data',
            type: 'date',
            required: true,
          },
          {
            name: 'setor_categoria',
            type: 'text',
            required: true,
          },
          {
            name: 'motivo',
            type: 'select',
            required: true,
            values: ['vencimento', 'avaria', 'roubo', 'erro de pedido', 'outro'],
            maxSelect: 1,
          },
          {
            name: 'item_descricao',
            type: 'text',
            required: false,
          },
          {
            name: 'quantidade',
            type: 'number',
            required: true,
          },
          {
            name: 'valor_estimado',
            type: 'number',
            required: true,
          },
          {
            name: 'observacao',
            type: 'text',
            required: false,
          },
          {
            name: 'foto',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
          },
          {
            name: 'registrado_por',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_perdas_loja ON perdas (loja)',
          'CREATE INDEX idx_perdas_data ON perdas (data)',
          'CREATE INDEX idx_perdas_setor ON perdas (setor_categoria)',
          'CREATE INDEX idx_perdas_motivo ON perdas (motivo)',
          'CREATE INDEX idx_perdas_registrado_por ON perdas (registrado_por)',
        ],
      })
      app.save(perdas)
    }
  },
  (app) => {
    try {
      const perdas = app.findCollectionByNameOrId('perdas')
      app.delete(perdas)
    } catch (_) {}

    try {
      const inventarios = app.findCollectionByNameOrId('inventarios')
      app.delete(inventarios)
    } catch (_) {}
  },
)
