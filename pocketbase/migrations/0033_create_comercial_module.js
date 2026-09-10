migrate(
  (app) => {
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. comercial_produtos
    // Dados de sortimento, rupturas, estoque virtual, negativos, sem vendas 30/60/90+, curva A/B/C/C+, giro/cobertura
    if (!app.hasTable('comercial_produtos')) {
      const produtosCol = new Collection({
        name: 'comercial_produtos',
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
            name: 'competencia', // YYYY-MM ou YYYY-MM-DD
            type: 'text',
            required: true,
          },
          {
            name: 'codigo',
            type: 'text',
            required: true,
          },
          {
            name: 'descricao',
            type: 'text',
            required: true,
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
            name: 'fornecedor',
            type: 'text',
            required: false,
          },
          {
            name: 'curva', // 'A', 'B', 'C', 'C+'
            type: 'select',
            required: false,
            values: ['A', 'B', 'C', 'C+'],
            maxSelect: 1,
          },
          {
            name: 'estoque_fisico',
            type: 'number',
            required: false,
          },
          {
            name: 'estoque_virtual',
            type: 'number',
            required: false,
          },
          {
            name: 'em_ruptura',
            type: 'bool',
            required: false,
          },
          {
            name: 'tipo_ruptura', // 'fisica', 'virtual', 'gondola', 'nenhuma'
            type: 'select',
            required: false,
            values: ['fisica', 'virtual', 'gondola', 'nenhuma'],
            maxSelect: 1,
          },
          {
            name: 'dias_sem_venda',
            type: 'number',
            required: false,
          },
          {
            name: 'faixa_sem_venda', // 'nenhuma', '30_dias', '60_dias', 'acima_90_dias'
            type: 'select',
            required: false,
            values: ['nenhuma', '30_dias', '60_dias', 'acima_90_dias'],
            maxSelect: 1,
          },
          {
            name: 'preco_venda',
            type: 'number',
            required: false,
          },
          {
            name: 'custo_medio',
            type: 'number',
            required: false,
          },
          {
            name: 'margem_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'giro_dias', // cobertura / giro de estoque
            type: 'number',
            required: false,
          },
          {
            name: 'venda_qtd_periodo',
            type: 'number',
            required: false,
          },
          {
            name: 'venda_valor_periodo',
            type: 'number',
            required: false,
          },
          {
            name: 'participacao_valor_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'participacao_qtd_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'ativo_sortimento',
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
          'CREATE INDEX idx_cprod_loja ON comercial_produtos (loja)',
          'CREATE INDEX idx_cprod_comp ON comercial_produtos (competencia)',
          'CREATE INDEX idx_cprod_codigo ON comercial_produtos (codigo)',
          'CREATE INDEX idx_cprod_curva ON comercial_produtos (curva)',
          'CREATE INDEX idx_cprod_ruptura ON comercial_produtos (em_ruptura)',
          'CREATE INDEX idx_cprod_faixa_sv ON comercial_produtos (faixa_sem_venda)',
          'CREATE INDEX idx_cprod_cat ON comercial_produtos (categoria)',
        ],
      })
      app.save(produtosCol)
    }

    // 2. comercial_categorias
    // % Vendas, quebras, margem, metas vs realizado por categoria e departamento
    if (!app.hasTable('comercial_categorias')) {
      const catCol = new Collection({
        name: 'comercial_categorias',
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
            name: 'competencia',
            type: 'text',
            required: true,
          },
          {
            name: 'departamento',
            type: 'text',
            required: true,
          },
          {
            name: 'categoria',
            type: 'text',
            required: true,
          },
          {
            name: 'venda_valor',
            type: 'number',
            required: false,
          },
          {
            name: 'venda_qtd',
            type: 'number',
            required: false,
          },
          {
            name: 'meta_venda_valor',
            type: 'number',
            required: false,
          },
          {
            name: 'atingimento_meta_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'participacao_vendas_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'margem_lucro_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'quebra_valor',
            type: 'number',
            required: false,
          },
          {
            name: 'quebra_perc_sobre_venda',
            type: 'number',
            required: false,
          },
          {
            name: 'total_skus_sortimento',
            type: 'number',
            required: false,
          },
          {
            name: 'total_skus_ruptura',
            type: 'number',
            required: false,
          },
          {
            name: 'taxa_ruptura_perc',
            type: 'number',
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
          'CREATE INDEX idx_ccat_loja ON comercial_categorias (loja)',
          'CREATE INDEX idx_ccat_comp ON comercial_categorias (competencia)',
          'CREATE INDEX idx_ccat_dept ON comercial_categorias (departamento)',
          'CREATE INDEX idx_ccat_cat ON comercial_categorias (categoria)',
        ],
      })
      app.save(catCol)
    }

    // 3. comercial_acoes
    // Ações comerciais, pricing, rebaixas planejadas / executadas
    if (!app.hasTable('comercial_acoes')) {
      const acoesCol = new Collection({
        name: 'comercial_acoes',
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
            name: 'tipo', // 'acao_comercial', 'pricing', 'rebaixa', 'tabloide', 'ponta_gondola'
            type: 'select',
            required: true,
            values: ['acao_comercial', 'pricing', 'rebaixa', 'tabloide', 'ponta_gondola'],
            maxSelect: 1,
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
            name: 'motivo_rebaixa', // 'validade_proxima', 'descontinuado', 'excesso_estoque', 'concorrencia', 'campanha'
            type: 'select',
            required: false,
            values: [
              'validade_proxima',
              'descontinuado',
              'excesso_estoque',
              'concorrencia',
              'campanha',
            ],
            maxSelect: 1,
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
            name: 'status', // 'planejada', 'em_vigor', 'concluida', 'cancelada'
            type: 'select',
            required: true,
            values: ['planejada', 'em_vigor', 'concluida', 'cancelada'],
            maxSelect: 1,
          },
          {
            name: 'mecanica_promocional',
            type: 'text',
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
            name: 'observacoes',
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
          'CREATE INDEX idx_cacoes_loja ON comercial_acoes (loja)',
          'CREATE INDEX idx_cacoes_tipo ON comercial_acoes (tipo)',
          'CREATE INDEX idx_cacoes_status ON comercial_acoes (status)',
          'CREATE INDEX idx_cacoes_inicio ON comercial_acoes (data_inicio)',
        ],
      })
      app.save(acoesCol)
    }

    // 4. comercial_implantacao
    // Cronograma de implantação, layout de loja, reformas, revisão de planograma
    if (!app.hasTable('comercial_implantacao')) {
      const impCol = new Collection({
        name: 'comercial_implantacao',
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
            name: 'tipo', // 'layout_gondola', 'reforma_setor', 'implantacao_mix', 'virada_sazonal', 'ajuste_planograma'
            type: 'select',
            required: true,
            values: [
              'layout_gondola',
              'reforma_setor',
              'implantacao_mix',
              'virada_sazonal',
              'ajuste_planograma',
            ],
            maxSelect: 1,
          },
          {
            name: 'departamento_setor',
            type: 'text',
            required: true,
          },
          {
            name: 'data_prevista',
            type: 'date',
            required: true,
          },
          {
            name: 'data_conclusao',
            type: 'date',
            required: false,
          },
          {
            name: 'status', // 'planejado', 'em_andamento', 'concluido', 'atrasado', 'cancelado'
            type: 'select',
            required: true,
            values: ['planejado', 'em_andamento', 'concluido', 'atrasado', 'cancelado'],
            maxSelect: 1,
          },
          {
            name: 'responsavel_execucao',
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
            name: 'progresso_perc',
            type: 'number',
            required: false,
          },
          {
            name: 'fornecedor_parceiro',
            type: 'text',
            required: false,
          },
          {
            name: 'descricao_escopo',
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
          'CREATE INDEX idx_cimp_loja ON comercial_implantacao (loja)',
          'CREATE INDEX idx_cimp_status ON comercial_implantacao (status)',
          'CREATE INDEX idx_cimp_data ON comercial_implantacao (data_prevista)',
          'CREATE INDEX idx_cimp_tipo ON comercial_implantacao (tipo)',
        ],
      })
      app.save(impCol)
    }
  },
  (app) => {
    try {
      const imp = app.findCollectionByNameOrId('comercial_implantacao')
      app.delete(imp)
    } catch (_) {}

    try {
      const acoes = app.findCollectionByNameOrId('comercial_acoes')
      app.delete(acoes)
    } catch (_) {}

    try {
      const cat = app.findCollectionByNameOrId('comercial_categorias')
      app.delete(cat)
    } catch (_) {}

    try {
      const prod = app.findCollectionByNameOrId('comercial_produtos')
      app.delete(prod)
    } catch (_) {}
  },
)
