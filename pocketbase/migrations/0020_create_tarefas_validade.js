migrate(
  (app) => {
    // 1. Criar a collection tarefas_validade
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const funcoesCol = app.findCollectionByNameOrId('funcoes')

    const tarefasValidade = new Collection({
      name: 'tarefas_validade',
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
          name: 'setor_categoria',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        // Data pontual (ex: "2025-05-10") OU vazio se for recorrente
        {
          name: 'data_especifica',
          type: 'date',
          required: false,
        },
        // Recorrência (ex: "diaria", "toda segunda", "toda terça", "toda quarta", "toda quinta", "toda sexta", "todo sabado", "todo domingo", "pontual")
        {
          name: 'recorrencia',
          type: 'text',
          required: false,
        },
        // Janela de horário (ex: "14:00" e "15:00")
        {
          name: 'horario_inicio',
          type: 'text',
          required: true,
        },
        {
          name: 'horario_fim',
          type: 'text',
          required: false,
        },
        // Status da tarefa no ciclo: pendente | em_andamento | aguardando_validacao | aprovada | devolvida
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['pendente', 'em_andamento', 'aguardando_validacao', 'aprovada', 'devolvida'],
          maxSelect: 1,
        },
        // Quem executa (nome livre ou texto do cargo/executor)
        {
          name: 'executor_nome',
          type: 'text',
          required: false,
        },
        // Executor usuário (se vinculado)
        {
          name: 'executor_usuario',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // Configuração de quem valida: função validadora (ex: Líder Prevenção) OU usuário validador específico
        {
          name: 'validador_funcao_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'validador_funcao',
          type: 'relation',
          required: false,
          collectionId: funcoesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'validador_usuario',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // Registro de COMO foi realizada (observação + foto de prova obrigatória/opcional)
        {
          name: 'observacao_execucao',
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
          name: 'concluida_em',
          type: 'text',
          required: false,
        },
        {
          name: 'concluida_por',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // Validação (Líder Prevenção ou Validador configurado)
        {
          name: 'comentario_validacao',
          type: 'text',
          required: false,
        },
        {
          name: 'validado_por',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'validado_em',
          type: 'text',
          required: false,
        },
        // Timestamps de controle de alertas do robô (Anti-spam: 1 aviso por tarefa por dia)
        // Alerta prévio (1h antes do horário de início)
        {
          name: 'alerta_previo_enviado_em',
          type: 'text',
          required: false,
        },
        // Alerta de não abertura (ao passar a janela / horario_inicio + 1min sem abertura)
        {
          name: 'alerta_atraso_enviado_em',
          type: 'text',
          required: false,
        },
        // Autodates obrigatórios em base collection
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
        'CREATE INDEX idx_tv_loja ON tarefas_validade (loja)',
        'CREATE INDEX idx_tv_status ON tarefas_validade (status)',
        'CREATE INDEX idx_tv_setor ON tarefas_validade (setor_categoria)',
        'CREATE INDEX idx_tv_data ON tarefas_validade (data_especifica)',
        'CREATE INDEX idx_tv_horario_inicio ON tarefas_validade (horario_inicio)',
      ],
    })

    app.save(tarefasValidade)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('tarefas_validade')
      app.delete(col)
    } catch (_) {}
  },
)
