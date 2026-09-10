migrate(
  (app) => {
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Enriquecer comercial_implantacao com campos de categoria, evidência fotográfica, autor e horário
    const impCol = app.findCollectionByNameOrId('comercial_implantacao')

    if (!impCol.fields.getByName('categoria')) {
      impCol.fields.add(
        new TextField({
          name: 'categoria',
          required: false,
        }),
      )
    }

    if (!impCol.fields.getByName('etapa')) {
      impCol.fields.add(
        new TextField({
          name: 'etapa',
          required: false,
        }),
      )
    }

    if (!impCol.fields.getByName('foto_evidencia')) {
      impCol.fields.add(
        new FileField({
          name: 'foto_evidencia',
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    if (!impCol.fields.getByName('foto_executado_por')) {
      impCol.fields.add(
        new TextField({
          name: 'foto_executado_por',
          required: false,
        }),
      )
    }

    if (!impCol.fields.getByName('foto_executado_em')) {
      impCol.fields.add(
        new TextField({
          name: 'foto_executado_em',
          required: false,
        }),
      )
    }

    if (!impCol.fields.getByName('observacao_execucao')) {
      impCol.fields.add(
        new TextField({
          name: 'observacao_execucao',
          required: false,
        }),
      )
    }

    if (!impCol.fields.getByName('concluido_sem_evidencia')) {
      impCol.fields.add(
        new BoolField({
          name: 'concluido_sem_evidencia',
          required: false,
        }),
      )
    }

    app.save(impCol)

    // 2. Criar coleção comercial_negociacoes
    if (!app.hasTable('comercial_negociacoes')) {
      const negociacoesCol = new Collection({
        name: 'comercial_negociacoes',
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
            name: 'titulo',
            type: 'text',
            required: true,
          },
          {
            name: 'comprador_nome',
            type: 'text',
            required: false,
          },
          {
            name: 'fornecedor',
            type: 'text',
            required: false,
          },
          {
            name: 'departamento',
            type: 'text',
            required: false,
          },
          {
            name: 'categoria',
            type: 'text',
            required: false,
          },
          {
            name: 'sazonalidade', // Ex: Páscoa, Dia das Mães, Black Friday, Festa Junina, Inverno, etc.
            type: 'text',
            required: false,
          },
          {
            name: 'tipo_acordo', // 'preco_rebaixa', 'espaco_extra', 'tabloide_encarte', 'bonificacao', 'ponta_gondola', 'ilha_destaque', 'compre_ganhe'
            type: 'select',
            required: false,
            values: [
              'preco_rebaixa',
              'espaco_extra',
              'tabloide_encarte',
              'bonificacao',
              'ponta_gondola',
              'ilha_destaque',
              'compre_ganhe',
              'outro',
            ],
            maxSelect: 1,
          },
          {
            name: 'descricao_acordo',
            type: 'text',
            required: false,
          },
          {
            name: 'produto_codigo',
            type: 'text',
            required: false,
          },
          {
            name: 'produto_descricao',
            type: 'text',
            required: false,
          },
          {
            name: 'preco_de',
            type: 'number',
            required: false,
          },
          {
            name: 'preco_por',
            type: 'number',
            required: false,
          },
          {
            name: 'desconto_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'bonificacao_detalhe',
            type: 'text',
            required: false,
          },
          {
            name: 'espaco_gondola_acordado',
            type: 'text',
            required: false,
          },
          {
            name: 'data_inicio',
            type: 'date',
            required: true,
          },
          {
            name: 'data_fim',
            type: 'date',
            required: false,
          },
          {
            name: 'status', // 'planejada', 'aguardando_execucao', 'em_vigor', 'concluida', 'vencida', 'cancelada'
            type: 'select',
            required: true,
            values: [
              'planejada',
              'aguardando_execucao',
              'em_vigor',
              'concluida',
              'vencida',
              'cancelada',
            ],
            maxSelect: 1,
          },
          {
            name: 'responsavel_loja',
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
            name: 'observacoes',
            type: 'text',
            required: false,
          },
          {
            name: 'competencia',
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
          'CREATE INDEX idx_cneg_loja ON comercial_negociacoes (loja)',
          'CREATE INDEX idx_cneg_status ON comercial_negociacoes (status)',
          'CREATE INDEX idx_cneg_data_inicio ON comercial_negociacoes (data_inicio)',
          'CREATE INDEX idx_cneg_sazonalidade ON comercial_negociacoes (sazonalidade)',
          'CREATE INDEX idx_cneg_fornecedor ON comercial_negociacoes (fornecedor)',
        ],
      })
      app.save(negociacoesCol)
    }

    // 3. Criar coleção comercial_negociacao_marcos (agendas & evidências fotográficas de cada etapa da negociação)
    if (!app.hasTable('comercial_negociacao_marcos')) {
      const negociacoesCol = app.findCollectionByNameOrId('comercial_negociacoes')
      const marcosCol = new Collection({
        name: 'comercial_negociacao_marcos',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'negociacao',
            type: 'relation',
            required: true,
            collectionId: negociacoesCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'titulo', // ex: "Entrada do material / display", "Montagem de ponta de gôndola", "Início do preço promocional", "Auditoria de ruptura", "Desmontagem / Retirada"
            type: 'text',
            required: true,
          },
          {
            name: 'tipo_marco', // 'entrada_material', 'montagem_espaco', 'inicio_preco', 'auditoria_meio', 'retirada_material', 'outro'
            type: 'select',
            required: false,
            values: [
              'entrada_material',
              'montagem_espaco',
              'inicio_preco',
              'auditoria_meio',
              'retirada_material',
              'outro',
            ],
            maxSelect: 1,
          },
          {
            name: 'data_limite',
            type: 'date',
            required: true,
          },
          {
            name: 'status', // 'pendente', 'concluido', 'atrasado', 'cancelado'
            type: 'select',
            required: true,
            values: ['pendente', 'concluido', 'atrasado', 'cancelado'],
            maxSelect: 1,
          },
          {
            name: 'responsavel',
            type: 'text',
            required: false,
          },
          {
            name: 'foto_evidencia',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            required: false,
          },
          {
            name: 'executado_por',
            type: 'text',
            required: false,
          },
          {
            name: 'executado_em',
            type: 'text',
            required: false,
          },
          {
            name: 'observacao',
            type: 'text',
            required: false,
          },
          {
            name: 'concluido_sem_evidencia',
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
          'CREATE INDEX idx_cneg_marco_neg ON comercial_negociacao_marcos (negociacao)',
          'CREATE INDEX idx_cneg_marco_status ON comercial_negociacao_marcos (status)',
          'CREATE INDEX idx_cneg_marco_data ON comercial_negociacao_marcos (data_limite)',
        ],
      })
      app.save(marcosCol)
    }
  },
  (app) => {
    try {
      const marcos = app.findCollectionByNameOrId('comercial_negociacao_marcos')
      app.delete(marcos)
    } catch (_) {}

    try {
      const neg = app.findCollectionByNameOrId('comercial_negociacoes')
      app.delete(neg)
    } catch (_) {}
  },
)
