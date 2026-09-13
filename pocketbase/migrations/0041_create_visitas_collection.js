migrate(
  (app) => {
    if (!app.hasTable('visitas')) {
      const collection = new Collection({
        name: 'visitas',
        type: 'base',
        // Criação pública permitida (visitantes sem conta registram acessos anônimos)
        createRule: '',
        // Listagem e visualização apenas para usuários autenticados com perfil admin geral
        listRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        viewRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          {
            name: 'pagina',
            type: 'text',
            required: true,
          },
          {
            name: 'origem',
            type: 'text',
            required: false,
          },
          {
            name: 'utm_source',
            type: 'text',
            required: false,
          },
          {
            name: 'utm_medium',
            type: 'text',
            required: false,
          },
          {
            name: 'utm_campaign',
            type: 'text',
            required: false,
          },
          {
            name: 'dispositivo',
            type: 'text',
            required: false,
          },
          {
            name: 'sessao_id',
            type: 'text',
            required: true,
          },
          {
            name: 'user_email',
            type: 'text',
            required: false,
          },
          {
            name: 'cadastrou',
            type: 'bool',
            required: false,
          },
          {
            name: 'is_admin',
            type: 'bool',
            required: false,
          },
          {
            name: 'referrer',
            type: 'text',
            required: false,
          },
          {
            name: 'user_agent',
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
          'CREATE INDEX idx_visitas_created ON visitas (created)',
          'CREATE INDEX idx_visitas_origem ON visitas (origem)',
          'CREATE INDEX idx_visitas_sessao_id ON visitas (sessao_id)',
          'CREATE INDEX idx_visitas_pagina ON visitas (pagina)',
          'CREATE INDEX idx_visitas_user_email ON visitas (user_email)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('visitas')
      app.delete(collection)
    } catch (_) {}
  },
)
