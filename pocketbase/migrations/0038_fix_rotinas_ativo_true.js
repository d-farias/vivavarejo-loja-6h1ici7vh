migrate(
  (app) => {
    // Garantir que as rotinas existentes fiquem com ativo = true
    // No SQLite/PocketBase booleans são armazenados como 1 ou 0 ou 't'/'f'
    try {
      app
        .db()
        .newQuery(`
          UPDATE rotinas
          SET ativo = 1
          WHERE ativo IS NULL OR ativo = 0 OR ativo = 'false' OR ativo = ''
        `)
        .execute()
    } catch (e) {
      console.log('Erro ao atualizar ativo em rotinas:', e)
    }

    try {
      app
        .db()
        .newQuery(`
          UPDATE rotinas
          SET segmento = 'Supermercado/Food'
          WHERE segmento IS NULL OR segmento = ''
        `)
        .execute()
    } catch (e) {
      console.log('Erro ao atualizar segmento padrão em rotinas:', e)
    }
  },
  (app) => {
    // rollback sem efeito destrutivo
  },
)
