migrate(
  (app) => {
    // 1. Limpar / expurgar registros do Gestor Geral Dfarias (e-mail, sessões conhecidas dele ou perfil admin)
    // Conforme análise de dados no banco:
    // - sessao_id 'ses_dljrksl5mu1gd82m' correspondeu aos testes e acessos do gestor geral Dfarias em iPhone 18_7.
    // - qualquer registro com user_email contendo dfarias, perfil admin, ou is_admin = true.
    try {
      app
        .db()
        .newQuery(
          `DELETE FROM visitas 
           WHERE user_email = 'dfarias53@gmail.com' 
              OR LOWER(user_email) LIKE '%dfarias%'
              OR user_perfil = 'admin'
              OR is_admin = 1
              OR sessao_id = 'ses_dljrksl5mu1gd82m'`,
        )
        .execute()
    } catch (err) {
      console.warn('0045_limpar_visitas_gestor_dfarias up warning:', err)
    }
  },
  (app) => {
    // Reversão de deleção de log de analytics não se aplica (dados expurgados por solicitação do usuário)
  },
)
