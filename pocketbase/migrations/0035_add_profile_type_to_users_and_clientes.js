migrate(
  (app) => {
    // 1. Adicionar campo profile_type na coleção users se não existir
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('profile_type')) {
      usersCol.fields.add(
        new SelectField({
          name: 'profile_type',
          required: false,
          values: ['rede', 'gerente'],
          maxSelect: 1,
        }),
      )
      app.save(usersCol)
    }

    // 2. Adicionar campo profile_type na coleção clientes se não existir
    const clientesCol = app.findCollectionByNameOrId('clientes')
    if (!clientesCol.fields.getByName('profile_type')) {
      clientesCol.fields.add(
        new SelectField({
          name: 'profile_type',
          required: false,
          values: ['rede', 'gerente'],
          maxSelect: 1,
        }),
      )
      app.save(clientesCol)
    }

    // 3. Atualizar usuários e clientes existentes de forma compatível
    // Usuários sem profile_type assumem 'rede' se forem admin/adm_rede ou se o cliente for PJ, senão 'gerente'
    try {
      app
        .db()
        .newQuery(`
        UPDATE users
        SET profile_type = CASE
          WHEN perfil IN ('admin', 'adm_rede') THEN 'rede'
          ELSE 'rede'
        END
        WHERE profile_type IS NULL OR profile_type = ''
      `)
        .execute()

      app
        .db()
        .newQuery(`
        UPDATE clientes
        SET profile_type = CASE
          WHEN tipo_pessoa = 'PF' THEN 'gerente'
          ELSE 'rede'
        END
        WHERE profile_type IS NULL OR profile_type = ''
      `)
        .execute()
    } catch (e) {
      console.log('Aviso ao atualizar profile_type nos registros legados:', e)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('profile_type')) {
        usersCol.fields.removeByName('profile_type')
        app.save(usersCol)
      }
    } catch (_) {}

    try {
      const clientesCol = app.findCollectionByNameOrId('clientes')
      if (clientesCol.fields.getByName('profile_type')) {
        clientesCol.fields.removeByName('profile_type')
        app.save(clientesCol)
      }
    } catch (_) {}
  },
)
