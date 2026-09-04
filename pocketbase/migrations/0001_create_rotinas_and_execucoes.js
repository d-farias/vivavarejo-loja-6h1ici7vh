migrate(
  (app) => {
    // 1. Collection "rotinas"
    const rotinas = new Collection({
      name: 'rotinas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'responsavel', type: 'text', required: true },
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
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Ativa', 'Pendente', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'area', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_rotinas_frequencia ON rotinas (frequencia)',
        'CREATE INDEX idx_rotinas_area ON rotinas (area)',
        'CREATE INDEX idx_rotinas_created ON rotinas (created)',
      ],
    })
    app.save(rotinas)

    // 2. Collection "execucoes_rotinas"
    const execucoes = new Collection({
      name: 'execucoes_rotinas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.body.usuario = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario = @request.auth.id",
      fields: [
        {
          name: 'rotina',
          type: 'relation',
          required: true,
          collectionId: rotinas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data_execucao', type: 'date', required: true },
        { name: 'concluida', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_execucoes_rotina ON execucoes_rotinas (rotina)',
        'CREATE INDEX idx_execucoes_usuario ON execucoes_rotinas (usuario)',
        'CREATE INDEX idx_execucoes_data ON execucoes_rotinas (data_execucao)',
      ],
    })
    app.save(execucoes)
  },
  (app) => {
    try {
      const execucoes = app.findCollectionByNameOrId('execucoes_rotinas')
      app.delete(execucoes)
    } catch (_) {}

    try {
      const rotinas = app.findCollectionByNameOrId('rotinas')
      app.delete(rotinas)
    } catch (_) {}
  },
)
