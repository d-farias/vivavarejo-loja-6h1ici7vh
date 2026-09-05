migrate(
  (app) => {
    // Atualizar campo ativo para true (1) para todos os registros
    app.db().newQuery('UPDATE users SET ativo = 1').execute()
  },
  (app) => {},
)
