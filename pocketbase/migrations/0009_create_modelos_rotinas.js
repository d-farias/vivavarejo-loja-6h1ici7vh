migrate(
  (app) => {
    // 1. Obter coleções existentes necessárias
    const clientesCol = app.findCollectionByNameOrId('clientes')

    // 2. Collection `modelos_rotinas`
    // Representa o modelo/template de rotinas de uma rede ou consultoria
    let modelosCol
    try {
      modelosCol = app.findCollectionByNameOrId('modelos_rotinas')
    } catch (_) {
      modelosCol = new Collection({
        name: 'modelos_rotinas',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          {
            name: 'cliente',
            type: 'relation',
            required: false,
            collectionId: clientesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'descricao', type: 'text' },
          {
            name: 'criado_por',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_modelos_rotinas_nome ON modelos_rotinas (nome)',
          'CREATE INDEX idx_modelos_rotinas_cliente ON modelos_rotinas (cliente)',
        ],
      })
      app.save(modelosCol)
    }

    // 3. Collection `modelos_rotinas_itens`
    // Cada item de rotina dentro do modelo
    let itensCol
    try {
      itensCol = app.findCollectionByNameOrId('modelos_rotinas_itens')
    } catch (_) {
      itensCol = new Collection({
        name: 'modelos_rotinas_itens',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'modelo',
            type: 'relation',
            required: true,
            collectionId: modelosCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'nome', type: 'text', required: true },
          { name: 'responsavel', type: 'text', required: false },
          { name: 'funcao_nome', type: 'text', required: false },
          {
            name: 'frequencia',
            type: 'select',
            required: true,
            values: ['Diária', 'Semanal', 'Conforme vendas', 'Rotinas', 'A cada recebimento'],
            maxSelect: 1,
          },
          { name: 'horario_limite', type: 'text' },
          { name: 'ferramenta', type: 'text' },
          { name: 'validacao', type: 'text' },
          { name: 'area', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_modelos_itens_modelo ON modelos_rotinas_itens (modelo)',
          'CREATE INDEX idx_modelos_itens_frequencia ON modelos_rotinas_itens (frequencia)',
        ],
      })
      app.save(itensCol)
    }

    // 4. Garantir que collection `clientes` possa ser criada por qualquer usuário autenticado (ou líderes no onboarding)
    // Na migração 0003 estava "@request.auth.perfil = 'admin'". Para permitir onboarding /signup onde o novo líder cria sua empresa/rede:
    try {
      const colClientes = app.findCollectionByNameOrId('clientes')
      colClientes.createRule = "@request.auth.id != ''"
      app.save(colClientes)
    } catch (_) {}
  },
  (app) => {
    try {
      const itens = app.findCollectionByNameOrId('modelos_rotinas_itens')
      app.delete(itens)
    } catch (_) {}

    try {
      const modelos = app.findCollectionByNameOrId('modelos_rotinas')
      app.delete(modelos)
    } catch (_) {}
  },
)
