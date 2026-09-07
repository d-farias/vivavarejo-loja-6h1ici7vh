migrate(
  (app) => {
    // 1. Atualizar o usuário principal dfarias53@gmail.com
    // Nome: 'ADM Geral' (era 'Líder de Loja')
    // Telefone: '(48) 99181-7542'
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'dfarias53@gmail.com')
      user.set('name', 'ADM Geral')
      user.set('telefone', '(48) 99181-7542')
      user.set('perfil', 'admin')
      app.save(user)
    } catch (e) {
      console.log(
        'Aviso: usuario dfarias53@gmail.com nao encontrado para update direto em migracao:',
        e,
      )
    }

    // 2. Adicionar campos de contatos de suporte e atendimento na coleção `clientes`:
    // - `email_suporte` (text): e-mail de suporte para os clientes/rede
    // - `whatsapp_suporte` (text): WhatsApp de atendimento/suporte da rede
    // - `nome_atendimento` (text): nome do especialista/atendente da rede (opcional, fallback pro padrão)
    const clientesCol = app.findCollectionByNameOrId('clientes')
    let saveClientes = false

    if (!clientesCol.fields.getByName('email_suporte')) {
      clientesCol.fields.add(
        new TextField({
          name: 'email_suporte',
          required: false,
        }),
      )
      saveClientes = true
    }

    if (!clientesCol.fields.getByName('whatsapp_suporte')) {
      clientesCol.fields.add(
        new TextField({
          name: 'whatsapp_suporte',
          required: false,
        }),
      )
      saveClientes = true
    }

    if (!clientesCol.fields.getByName('nome_atendimento')) {
      clientesCol.fields.add(
        new TextField({
          name: 'nome_atendimento',
          required: false,
        }),
      )
      saveClientes = true
    }

    if (saveClientes) {
      app.save(clientesCol)
    }

    // 3. Criar coleção `configuracoes_sistema` para o padrão global da plataforma (editável pelo ADM Geral)
    // Permite que o ADM Geral personalize o telefone/email padrão global exibido na capa pública
    // e para usuários sem rede configurada, sem depender de valores fixos no código.
    let configCol
    try {
      configCol = app.findCollectionByNameOrId('configuracoes_sistema')
    } catch (_) {
      configCol = new Collection({
        name: 'configuracoes_sistema',
        type: 'base',
        listRule: '', // Público pode ler para carregar na capa pública / Falar com especialista
        viewRule: '',
        createRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.perfil = 'admin'",
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'email_suporte', type: 'text', required: false },
          { name: 'whatsapp_suporte', type: 'text', required: false },
          { name: 'nome_atendimento', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_config_chave ON configuracoes_sistema (chave)'],
      })
      app.save(configCol)
    }

    // Seed inicial da configuração padrão global com os dados conhecidos do negócio
    try {
      try {
        app.findFirstRecordByData('configuracoes_sistema', 'chave', 'global')
      } catch (_) {
        const globalRec = new Record(configCol)
        globalRec.set('chave', 'global')
        globalRec.set('email_suporte', 'dfarias53@gmail.com')
        globalRec.set('whatsapp_suporte', '(48) 99181-7542')
        globalRec.set('nome_atendimento', 'Dalvani Farias')
        app.save(globalRec)
      }
    } catch (err) {
      console.log('Aviso ao semear configuracoes_sistema:', err)
    }
  },
  (app) => {
    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      clientesCol.fields.removeByName('email_suporte')
      clientesCol.fields.removeByName('whatsapp_suporte')
      clientesCol.fields.removeByName('nome_atendimento')
      app.save(clientesCol)
    } catch (_) {}

    try {
      const configCol = app.findCollectionByNameOrId('configuracoes_sistema')
      app.delete(configCol)
    } catch (_) {}
  },
)
