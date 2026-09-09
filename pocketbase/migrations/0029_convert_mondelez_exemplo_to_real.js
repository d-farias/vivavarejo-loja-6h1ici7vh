migrate(
  (app) => {
    // Converte os registros modelo de exemplo (Mondelez Brasil, promotor e visita) em registros reais definitivos
    try {
      app
        .db()
        .newQuery('UPDATE fornecedores SET is_exemplo = false WHERE is_exemplo = true')
        .execute()
    } catch (e) {
      console.log('Erro ao atualizar fornecedores is_exemplo:', e)
    }

    try {
      app
        .db()
        .newQuery('UPDATE visitas_promotor SET is_exemplo = false WHERE is_exemplo = true')
        .execute()
    } catch (e) {
      console.log('Erro ao atualizar visitas_promotor is_exemplo:', e)
    }

    // Limpa o sufixo '(Fornecedor Modelo)' e '(Promotor Modelo)' caso existam para visual real e sóbrio
    try {
      app
        .db()
        .newQuery(
          "UPDATE fornecedores SET nome = REPLACE(nome, ' (Fornecedor Modelo)', '') WHERE nome LIKE '%(Fornecedor Modelo)%'",
        )
        .execute()
    } catch (e) {
      console.log('Erro ao limpar nome do fornecedor:', e)
    }

    try {
      app
        .db()
        .newQuery(
          "UPDATE promotores SET nome = REPLACE(nome, ' (Promotor Modelo)', '') WHERE nome LIKE '%(Promotor Modelo)%'",
        )
        .execute()
    } catch (e) {
      console.log('Erro ao limpar nome do promotor:', e)
    }
  },
  (app) => {
    // Revert opcional
  },
)
