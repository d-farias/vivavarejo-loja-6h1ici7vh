migrate(
  (app) => {
    const lojasCol = app.findCollectionByNameOrId('lojas')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const fornecedoresCol = app.findCollectionByNameOrId('fornecedores')

    // 1. match_configuracoes (parâmetros de cálculo por rede)
    if (!app.hasTable('match_configuracoes')) {
      const configCol = new Collection({
        name: 'match_configuracoes',
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
            name: 'sla_dias_padrao',
            type: 'number',
            required: false,
          },
          {
            name: 'estoque_critico_padrao',
            type: 'number',
            required: false,
          },
          {
            name: 'metodologia_potencial',
            type: 'text',
            required: false,
          },
          {
            name: 'dias_historico_venda',
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
        indexes: ['CREATE INDEX idx_match_cfg_rede ON match_configuracoes (rede)'],
      })
      app.save(configCol)
    }

    // 2. match_demandas (ocorrências de ruptura/abastecimento e fluxo em cascata)
    if (!app.hasTable('match_demandas')) {
      const demandasCol = new Collection({
        name: 'match_demandas',
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
            name: 'fornecedor',
            type: 'relation',
            required: false,
            collectionId: fornecedoresCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'fornecedor_nome',
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
            required: true,
          },
          {
            name: 'curva',
            type: 'select',
            required: true,
            values: ['A', 'B', 'C', 'C+'],
            maxSelect: 1,
          },
          {
            name: 'estoque_loja',
            type: 'number',
            required: false,
          },
          {
            name: 'estoque_cd',
            type: 'number',
            required: false,
          },
          {
            name: 'estoque_transito',
            type: 'bool',
            required: false,
          },
          {
            name: 'previsao_entrega_transito',
            type: 'text',
            required: false,
          },
          {
            name: 'venda_media_diaria',
            type: 'number',
            required: false,
          },
          {
            name: 'preco_venda',
            type: 'number',
            required: false,
          },
          {
            name: 'ultima_venda_em',
            type: 'text',
            required: false,
          },
          {
            name: 'lead_time_dias',
            type: 'number',
            required: false,
          },
          {
            name: 'potencial_venda_perdida',
            type: 'number',
            required: false,
          },
          {
            name: 'situacao',
            type: 'select',
            required: true,
            values: [
              'ruptura',
              'risco_ruptura',
              'pedido_aberto',
              'excesso_estoque',
              'oportunidade',
            ],
            maxSelect: 1,
          },
          {
            name: 'acao_sugerida',
            type: 'text',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: [
              'aberta',
              'em_analise',
              'cd_abastecimento',
              'fornecedor',
              'entrega_programada',
              'recebida',
              'disponivel_venda',
              'resolvida',
            ],
            maxSelect: 1,
          },
          {
            name: 'prioridade',
            type: 'select',
            required: true,
            values: ['alta', 'media', 'baixa'],
            maxSelect: 1,
          },
          {
            name: 'origem_resolucao',
            type: 'select',
            required: false,
            values: ['cd', 'fornecedor', 'transferencia', 'ajuste_local', 'nenhuma'],
            maxSelect: 1,
          },
          {
            name: 'valor_recuperado',
            type: 'number',
            required: false,
          },
          {
            name: 'resposta_padrao',
            type: 'select',
            required: false,
            values: [
              'tenho_estoque',
              'pedido_confirmado',
              'entrega_programada',
              'nao_tenho_estoque',
              'previsao_disponibilidade',
              'problema_atendimento',
              'observacao_justificativa',
            ],
            maxSelect: 1,
          },
          {
            name: 'observacao_resposta',
            type: 'text',
            required: false,
          },
          {
            name: 'historico_andamento',
            type: 'json',
            required: false,
          },
          {
            name: 'registrado_por_nome',
            type: 'text',
            required: false,
          },
          {
            name: 'registrado_por_usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'resolvido_em',
            type: 'text',
            required: false,
          },
          {
            name: 'tempo_resolucao_dias',
            type: 'number',
            required: false,
          },
          {
            name: 'dentro_sla',
            type: 'bool',
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
          'CREATE INDEX idx_match_dem_rede ON match_demandas (rede)',
          'CREATE INDEX idx_match_dem_loja ON match_demandas (loja)',
          'CREATE INDEX idx_match_dem_status ON match_demandas (status)',
          'CREATE INDEX idx_match_dem_situacao ON match_demandas (situacao)',
          'CREATE INDEX idx_match_dem_curva ON match_demandas (curva)',
          'CREATE INDEX idx_match_dem_prioridade ON match_demandas (prioridade)',
          'CREATE INDEX idx_match_dem_created ON match_demandas (created)',
        ],
      })
      app.save(demandasCol)
    }

    // 3. match_oportunidades (oportunidades comerciais entre lojas comparáveis)
    if (!app.hasTable('match_oportunidades')) {
      const oppCol = new Collection({
        name: 'match_oportunidades',
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
            name: 'produto_codigo',
            type: 'text',
            required: false,
          },
          {
            name: 'produto_descricao',
            type: 'text',
            required: true,
          },
          {
            name: 'categoria',
            type: 'text',
            required: false,
          },
          {
            name: 'fornecedor_nome',
            type: 'text',
            required: false,
          },
          {
            name: 'lojas_referencia',
            type: 'text',
            required: false,
          },
          {
            name: 'lojas_com_gap',
            type: 'text',
            required: false,
          },
          {
            name: 'venda_referencia_mensal',
            type: 'number',
            required: false,
          },
          {
            name: 'venda_atual_mensal',
            type: 'number',
            required: false,
          },
          {
            name: 'gap_estimado_reais',
            type: 'number',
            required: false,
          },
          {
            name: 'acao_sugerida',
            type: 'text',
            required: false,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['identificada', 'em_negociacao', 'acao_em_loja', 'convertida', 'descartada'],
            maxSelect: 1,
          },
          {
            name: 'valor_convertido_reais',
            type: 'number',
            required: false,
          },
          {
            name: 'observacao',
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
          'CREATE INDEX idx_match_opp_rede ON match_oportunidades (rede)',
          'CREATE INDEX idx_match_opp_status ON match_oportunidades (status)',
          'CREATE INDEX idx_match_opp_created ON match_oportunidades (created)',
        ],
      })
      app.save(oppCol)
    }

    // 4. Seeding de dados demonstrativos estritamente marcados como is_exemplo: true
    // vinculados à rede de demonstração (s47wm38a46tt4o7 / lhr0ldaj3u5mb95)
    try {
      const demoDemandaExistente = app.findFirstRecordByData(
        'match_demandas',
        'produto_descricao',
        'Café Tradicional Almofada 500g',
      )
      if (demoDemandaExistente) return
    } catch (_) {
      // Inserir registros demonstrativos para os usuários de teste poderem experimentar de imediato
      const matchDemCol = app.findCollectionByNameOrId('match_demandas')
      const demoClienteId = 's47wm38a46tt4o7'
      const demoLojaId = 'lhr0ldaj3u5mb95'

      // Demanda 1: Ruptura + CD com estoque -> Abastecer via CD (Curva A)
      const dem1 = new Record(matchDemCol)
      dem1.set('rede', demoClienteId)
      dem1.set('loja', demoLojaId)
      dem1.set('fornecedor_nome', 'Nestlé Brasil')
      dem1.set('produto_codigo', '78910001001')
      dem1.set('produto_descricao', 'Café Tradicional Almofada 500g')
      dem1.set('curva', 'A')
      dem1.set('estoque_loja', 0)
      dem1.set('estoque_cd', 420)
      dem1.set('estoque_transito', false)
      dem1.set('venda_media_diaria', 28)
      dem1.set('preco_venda', 18.9)
      dem1.set('lead_time_dias', 2)
      dem1.set('potencial_venda_perdida', 3175.2) // ~6 dias de venda
      dem1.set('situacao', 'ruptura')
      dem1.set('acao_sugerida', 'Abastecer via CD (estoque interno disponível)')
      dem1.set('status', 'cd_abastecimento')
      dem1.set('prioridade', 'alta')
      dem1.set('resposta_padrao', 'tenho_estoque')
      dem1.set(
        'observacao_resposta',
        'Separação autorizada no CD central para envio no lote da noite.',
      )
      dem1.set('registrado_por_nome', 'Gerente da Loja Demonstração')
      dem1.set('is_exemplo', true)
      dem1.set('historico_andamento', [
        {
          data: new Date().toISOString(),
          autor: 'Loja',
          status: 'aberta',
          mensagem: 'Ruptura física identificada na gôndola e no estoque local.',
        },
        {
          data: new Date().toISOString(),
          autor: 'Central Match',
          status: 'cd_abastecimento',
          mensagem: 'Regra aplicada: CD possui 420 un. Direcionado para abastecimento interno.',
        },
      ])
      app.save(dem1)

      // Demanda 2: Ruptura + CD sem estoque + sem trânsito -> Demanda para fornecedor
      const dem2 = new Record(matchDemCol)
      dem2.set('rede', demoClienteId)
      dem2.set('loja', demoLojaId)
      dem2.set('fornecedor_nome', 'Mondelez Brasil')
      dem2.set('produto_codigo', '78910002002')
      dem2.set('produto_descricao', 'Biscoito Recheado Chocolate 140g')
      dem2.set('curva', 'A')
      dem2.set('estoque_loja', 0)
      dem2.set('estoque_cd', 0)
      dem2.set('estoque_transito', false)
      dem2.set('venda_media_diaria', 35)
      dem2.set('preco_venda', 4.5)
      dem2.set('lead_time_dias', 5)
      dem2.set('potencial_venda_perdida', 1260.0)
      dem2.set('situacao', 'ruptura')
      dem2.set('acao_sugerida', 'Não existe cobertura interna. Gerar demanda para fornecedor')
      dem2.set('status', 'fornecedor')
      dem2.set('prioridade', 'alta')
      dem2.set('resposta_padrao', 'pedido_confirmado')
      dem2.set(
        'observacao_resposta',
        'Demanda repassada ao comprador e incluída no pedido de emergência da indústria.',
      )
      dem2.set('registrado_por_nome', 'Gerente da Loja Demonstração')
      dem2.set('is_exemplo', true)
      dem2.set('historico_andamento', [
        {
          data: new Date().toISOString(),
          autor: 'Loja',
          status: 'aberta',
          mensagem: 'Gôndola zerada. Verificação interna sem saldo no CD.',
        },
        {
          data: new Date().toISOString(),
          autor: 'Central Match',
          status: 'fornecedor',
          mensagem:
            'Sem cobertura no CD ou em trânsito. Demanda aberta para o fornecedor Mondelez.',
        },
      ])
      app.save(dem2)

      // Demanda 3: Risco de ruptura + pedido em trânsito -> Antecipar / Acompanhar SLA
      const dem3 = new Record(matchDemCol)
      dem3.set('rede', demoClienteId)
      dem3.set('loja', demoLojaId)
      dem3.set('fornecedor_nome', 'Ambev Bebidas')
      dem3.set('produto_codigo', '78910003003')
      dem3.set('produto_descricao', 'Cerveja Puro Malte Lata 350ml')
      dem3.set('curva', 'B')
      dem3.set('estoque_loja', 18)
      dem3.set('estoque_cd', 0)
      dem3.set('estoque_transito', true)
      dem3.set('previsao_entrega_transito', 'Amanhã 10:00')
      dem3.set('venda_media_diaria', 40)
      dem3.set('preco_venda', 5.2)
      dem3.set('lead_time_dias', 3)
      dem3.set('potencial_venda_perdida', 624.0)
      dem3.set('situacao', 'risco_ruptura')
      dem3.set('acao_sugerida', 'Existe atendimento em andamento. Acompanhar prazo e SLA')
      dem3.set('status', 'entrega_programada')
      dem3.set('prioridade', 'media')
      dem3.set('resposta_padrao', 'entrega_programada')
      dem3.set(
        'observacao_resposta',
        'Carga em rota de entrega com chegada prevista para amanhã cedo.',
      )
      dem3.set('registrado_por_nome', 'Gerente da Loja Demonstração')
      dem3.set('is_exemplo', true)
      app.save(dem3)

      // Inserir Oportunidade demonstrativa
      const matchOppCol = app.findCollectionByNameOrId('match_oportunidades')
      const opp1 = new Record(matchOppCol)
      opp1.set('rede', demoClienteId)
      opp1.set('produto_codigo', '78910004004')
      opp1.set('produto_descricao', 'Azeite de Oliva Extra Virgem 500ml')
      opp1.set('categoria', 'Mercearia Nobre')
      opp1.set('fornecedor_nome', 'Bunge Alimentos')
      opp1.set('lojas_referencia', 'Loja Matriz / Loja Jardins')
      opp1.set('lojas_com_gap', 'Loja Demonstração / Loja Sul')
      opp1.set('venda_referencia_mensal', 14200.0)
      opp1.set('venda_atual_mensal', 4100.0)
      opp1.set('gap_estimado_reais', 10100.0)
      opp1.set(
        'acao_sugerida',
        'Adequar mix na Loja Demonstração e negociar bonificação de ponta de gôndola com fornecedor',
      )
      opp1.set('status', 'identificada')
      opp1.set('is_exemplo', true)
      app.save(opp1)

      // Inserir Parâmetros padrão para a rede demo
      const matchCfgCol = app.findCollectionByNameOrId('match_configuracoes')
      const cfg = new Record(matchCfgCol)
      cfg.set('rede', demoClienteId)
      cfg.set('sla_dias_padrao', 3)
      cfg.set('estoque_critico_padrao', 15)
      cfg.set('metodologia_potencial', 'venda_media_x_dias')
      cfg.set('dias_historico_venda', 30)
      app.save(cfg)
    }
  },
  (app) => {
    try {
      const matchDemandas = app.findCollectionByNameOrId('match_demandas')
      app.delete(matchDemandas)
    } catch (_) {}
    try {
      const matchOportunidades = app.findCollectionByNameOrId('match_oportunidades')
      app.delete(matchOportunidades)
    } catch (_) {}
    try {
      const matchConfiguracoes = app.findCollectionByNameOrId('match_configuracoes')
      app.delete(matchConfiguracoes)
    } catch (_) {}
  },
)
