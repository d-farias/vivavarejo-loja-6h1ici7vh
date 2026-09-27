migrate(
  (app) => {
    // Atualizar email_suporte da configuração global de atendimento
    try {
      const globalRec = app.findFirstRecordByData('configuracoes_sistema', 'chave', 'global')
      globalRec.set('email_suporte', 'contato@vivavarejo.com')
      app.save(globalRec)
    } catch (_) {
      // Se não existir, tenta criar ou localizar a coleção
      try {
        const configCol = app.findCollectionByNameOrId('configuracoes_sistema')
        const newRec = new Record(configCol)
        newRec.set('chave', 'global')
        newRec.set('email_suporte', 'contato@vivavarejo.com')
        newRec.set('whatsapp_suporte', '(48) 99181-7542')
        newRec.set('nome_atendimento', 'Dalvani Farias')
        app.save(newRec)
      } catch (err) {
        console.log('Aviso ao atualizar configuracoes_sistema em 0043:', err)
      }
    }

    // Garantir que nenhum cliente/rede tenha acidentalmente dfarias53@gmail.com como email_suporte
    try {
      app
        .db()
        .newQuery(
          "UPDATE clientes SET email_suporte = 'contato@vivavarejo.com' WHERE email_suporte = 'dfarias53@gmail.com'",
        )
        .execute()
    } catch (err) {
      console.log('Aviso ao sanitizar email_suporte em clientes:', err)
    }
  },
  (app) => {
    try {
      const globalRec = app.findFirstRecordByData('configuracoes_sistema', 'chave', 'global')
      globalRec.set('email_suporte', 'dfarias53@gmail.com')
      app.save(globalRec)
    } catch (_) {}
  },
)
