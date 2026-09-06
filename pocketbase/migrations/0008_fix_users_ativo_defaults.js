migrate(
  (app) => {
    // 1. Atualizar todos os usuários existentes que estejam com ativo = 0 ou ativo IS NULL
    // para ativo = 1 (true)
    app.db().newQuery('UPDATE users SET ativo = 1 WHERE ativo != 1 OR ativo IS NULL').execute()

    // 2. Garantir que os usuários sem perfil preenchido recebam o perfil padrão 'lider'
    // (exceto se for dfarias53@gmail.com que é admin)
    app
      .db()
      .newQuery(
        "UPDATE users SET perfil = 'lider' WHERE (perfil IS NULL OR perfil = '') AND email != 'dfarias53@gmail.com'",
      )
      .execute()
  },
  (app) => {
    // Rollback não destrutivo
  },
)
