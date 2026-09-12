migrate(
  (app) => {
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')

    if (!app.hasTable('adm_rh_demandas')) {
      const collection = new Collection({
        name: 'adm_rh_demandas',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'rede',
            type: 'relation',
            required: false,
            collectionId: clientesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'loja',
            type: 'relation',
            required: false,
            collectionId: lojasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'sub_area',
            type: 'select',
            required: true,
            values: ['rh', 'dp', 'adm', 'financeiro', 'fiscal'],
            maxSelect: 1,
          },
          {
            name: 'titulo',
            type: 'text',
            required: true,
          },
          {
            name: 'descricao',
            type: 'text',
            required: false,
          },
          {
            name: 'prioridade',
            type: 'select',
            required: true,
            values: ['baixa', 'media', 'alta', 'urgente'],
            maxSelect: 1,
          },
          {
            name: 'prazo',
            type: 'date',
            required: false,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'recebida', 'em_tratamento', 'resolvida', 'cancelada'],
            maxSelect: 1,
          },
          {
            name: 'responsavel',
            type: 'text',
            required: false,
          },
          {
            name: 'solicitante_nome',
            type: 'text',
            required: false,
          },
          {
            name: 'solicitante_usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'foto',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          {
            name: 'resposta_area',
            type: 'text',
            required: false,
          },
          {
            name: 'respondido_por',
            type: 'text',
            required: false,
          },
          {
            name: 'respondido_em',
            type: 'text',
            required: false,
          },
          {
            name: 'foto_resposta',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          {
            name: 'categoria_caso_uso',
            type: 'text',
            required: false,
          },
          {
            name: 'is_exemplo',
            type: 'bool',
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
          'CREATE INDEX idx_admrh_rede ON adm_rh_demandas (rede)',
          'CREATE INDEX idx_admrh_loja ON adm_rh_demandas (loja)',
          'CREATE INDEX idx_admrh_sub_area ON adm_rh_demandas (sub_area)',
          'CREATE INDEX idx_admrh_status ON adm_rh_demandas (status)',
          'CREATE INDEX idx_admrh_prioridade ON adm_rh_demandas (prioridade)',
          'CREATE INDEX idx_admrh_prazo ON adm_rh_demandas (prazo)',
          'CREATE INDEX idx_admrh_created ON adm_rh_demandas (created)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('adm_rh_demandas')
      app.delete(collection)
    } catch (_) {}
  },
)
