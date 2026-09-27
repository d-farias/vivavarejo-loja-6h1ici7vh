migrate(
  (app) => {
    // 1. Atualizar a configuração global em configuracoes_sistema para remover nome de pessoa
    try {
      const globalRec = app.findFirstRecordByData('configuracoes_sistema', 'chave', 'global')
      globalRec.set('nome_atendimento', '')
      globalRec.set('email_suporte', 'contato@vivavarejo.com')
      app.save(globalRec)
    } catch (_) {
      try {
        const configCol = app.findCollectionByNameOrId('configuracoes_sistema')
        const newRec = new Record(configCol)
        newRec.set('chave', 'global')
        newRec.set('email_suporte', 'contato@vivavarejo.com')
        newRec.set('whatsapp_suporte', '(48) 99181-7542')
        newRec.set('nome_atendimento', '')
        app.save(newRec)
      } catch (err) {
        console.log('Aviso ao atualizar configuracoes_sistema em 0044:', err)
      }
    }

    // 2. Limpar qualquer nome pessoal remanescente nas configurações de rede/clientes
    try {
      app
        .db()
        .newQuery(
          "UPDATE clientes SET nome_atendimento = '' WHERE nome_atendimento LIKE '%Dalvani%' OR nome_atendimento LIKE '%Farias%' OR nome_atendimento LIKE '%Dfarias%'",
        )
        .execute()
    } catch (err) {
      console.log('Aviso ao sanitizar nome_atendimento em clientes:', err)
    }
  },
  (app) => {
    // Reverter (opcional / no-op seguro)
  },
)
