migrate(
  (app) => {
    // 1. Criar collection consent_records
    // Armazena consentimentos: usuário, email, data/hora, versões aceitas e autorização comercial
    try {
      app.findCollectionByNameOrId('consent_records')
    } catch (_) {
      const consentCollection = new Collection({
        name: 'consent_records',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: '', // Público para permitir registro durante o cadastro do teste
        updateRule: null, // Imutável para conformidade jurídica
        deleteRule: null,
        fields: [
          {
            name: 'user',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'email', type: 'email', required: true },
          { name: 'nome', type: 'text' },
          { name: 'empresa', type: 'text' },
          { name: 'termos_aceitos', type: 'bool' },
          { name: 'termos_versao', type: 'text' },
          { name: 'privacidade_aceita', type: 'bool' },
          { name: 'privacidade_versao', type: 'text' },
          { name: 'receber_novidades', type: 'bool' },
          { name: 'ip_origem', type: 'text' },
          { name: 'user_agent', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_consent_email ON consent_records (email)',
          'CREATE INDEX idx_consent_created ON consent_records (created DESC)',
        ],
      })
      app.save(consentCollection)
    }

    // 2. Criar collection funnel_events
    // Eventos do funil B2B: visitou_previa, criou_conta, primeiro_acesso, criou_primeira_demanda, direcionou_primeira_acao, convidou_usuarios, acoes_concluidas, ultimo_acesso, solicitou_demonstracao
    try {
      app.findCollectionByNameOrId('funnel_events')
    } catch (_) {
      const funnelCollection = new Collection({
        name: 'funnel_events',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: '', // Público para permitir eventos de visitantes e da prévia
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        fields: [
          { name: 'evento', type: 'text', required: true },
          { name: 'sessao_id', type: 'text' },
          { name: 'user_email', type: 'text' },
          { name: 'user_nome', type: 'text' },
          { name: 'user_id', type: 'text' },
          { name: 'perfil', type: 'text' },
          { name: 'segmento', type: 'text' },
          { name: 'origem', type: 'text' },
          { name: 'detalhes', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_funnel_evento ON funnel_events (evento)',
          'CREATE INDEX idx_funnel_created ON funnel_events (created DESC)',
          'CREATE INDEX idx_funnel_sessao ON funnel_events (sessao_id)',
          'CREATE INDEX idx_funnel_email ON funnel_events (user_email)',
        ],
      })
      app.save(funnelCollection)
    }

    // 3. Adicionar campos trial nos users se não existirem
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('is_trial')) {
      users.fields.add(new BoolField({ name: 'is_trial' }))
    }
    if (!users.fields.getByName('trial_expires_at')) {
      users.fields.add(new TextField({ name: 'trial_expires_at' }))
    }
    if (!users.fields.getByName('trial_started_at')) {
      users.fields.add(new TextField({ name: 'trial_started_at' }))
    }
    app.save(users)

    // 4. Adicionar campo is_trial no clientes se não existir
    const clientes = app.findCollectionByNameOrId('clientes')
    if (!clientes.fields.getByName('is_trial')) {
      clientes.fields.add(new BoolField({ name: 'is_trial' }))
    }
    if (!clientes.fields.getByName('trial_expires_at')) {
      clientes.fields.add(new TextField({ name: 'trial_expires_at' }))
    }
    app.save(clientes)
  },
  (app) => {
    try {
      const consent = app.findCollectionByNameOrId('consent_records')
      app.delete(consent)
    } catch (_) {}

    try {
      const funnel = app.findCollectionByNameOrId('funnel_events')
      app.delete(funnel)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      if (users.fields.getByName('is_trial')) users.fields.removeByName('is_trial')
      if (users.fields.getByName('trial_expires_at')) users.fields.removeByName('trial_expires_at')
      if (users.fields.getByName('trial_started_at')) users.fields.removeByName('trial_started_at')
      app.save(users)
    } catch (_) {}

    try {
      const clientes = app.findCollectionByNameOrId('clientes')
      if (clientes.fields.getByName('is_trial')) clientes.fields.removeByName('is_trial')
      if (clientes.fields.getByName('trial_expires_at'))
        clientes.fields.removeByName('trial_expires_at')
      app.save(clientes)
    } catch (_) {}
  },
)
