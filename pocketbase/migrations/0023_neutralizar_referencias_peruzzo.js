migrate(
  (app) => {
    // 1. Higienizar e neutralizar qualquer menção a "Peruzzo" ou dados específicos de clientes em modelos_rotinas
    try {
      app
        .db()
        .newQuery(`
        UPDATE modelos_rotinas
        SET nome = REPLACE(nome, 'Peruzzo', 'Supermercado'),
            descricao = REPLACE(descricao, 'Peruzzo', 'Supermercado')
        WHERE nome LIKE '%Peruzzo%' OR descricao LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] modelos_rotinas check/update:', err)
    }

    // 2. Higienizar modelos_rotinas_itens
    try {
      app
        .db()
        .newQuery(`
        UPDATE modelos_rotinas_itens
        SET nome = REPLACE(nome, 'Peruzzo', 'Supermercado'),
            observacoes = REPLACE(observacoes, 'Peruzzo', 'Supermercado')
        WHERE nome LIKE '%Peruzzo%' OR observacoes LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] modelos_rotinas_itens check/update:', err)
    }

    // 3. Higienizar rotinas e rotinas_promotor
    try {
      app
        .db()
        .newQuery(`
        UPDATE rotinas
        SET nome = REPLACE(nome, 'Peruzzo', 'Supermercado'),
            observacoes = REPLACE(observacoes, 'Peruzzo', 'Supermercado')
        WHERE nome LIKE '%Peruzzo%' OR observacoes LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] rotinas check/update:', err)
    }

    try {
      app
        .db()
        .newQuery(`
        UPDATE rotinas_promotor
        SET titulo = REPLACE(titulo, 'Peruzzo', 'Supermercado'),
            descricao = REPLACE(descricao, 'Peruzzo', 'Supermercado')
        WHERE titulo LIKE '%Peruzzo%' OR descricao LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] rotinas_promotor check/update:', err)
    }

    // 4. Higienizar clientes e lojas caso algum contenha "Peruzzo"
    try {
      app
        .db()
        .newQuery(`
        UPDATE clientes
        SET nome = REPLACE(nome, 'Peruzzo', 'Supermercado Modelo'),
            observacoes = REPLACE(observacoes, 'Peruzzo', 'Supermercado')
        WHERE nome LIKE '%Peruzzo%' OR observacoes LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] clientes check/update:', err)
    }

    try {
      app
        .db()
        .newQuery(`
        UPDATE lojas
        SET nome = REPLACE(nome, 'Peruzzo', 'Loja Modelo'),
            observacoes = REPLACE(observacoes, 'Peruzzo', 'Supermercado')
        WHERE nome LIKE '%Peruzzo%' OR observacoes LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] lojas check/update:', err)
    }

    // 5. Higienizar tarefas_validade
    try {
      app
        .db()
        .newQuery(`
        UPDATE tarefas_validade
        SET descricao = REPLACE(descricao, 'Peruzzo', 'Supermercado'),
            setor_categoria = REPLACE(setor_categoria, 'Peruzzo', 'Supermercado'),
            observacoes = REPLACE(observacoes, 'Peruzzo', 'Supermercado')
        WHERE descricao LIKE '%Peruzzo%' OR setor_categoria LIKE '%Peruzzo%' OR observacoes LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] tarefas_validade check/update:', err)
    }

    // 6. Higienizar planos_acao e atendimentos se aplicável
    try {
      app
        .db()
        .newQuery(`
        UPDATE planos_acao
        SET descricao = REPLACE(descricao, 'Peruzzo', 'Supermercado'),
            observacoes = REPLACE(observacoes, 'Peruzzo', 'Supermercado')
        WHERE descricao LIKE '%Peruzzo%' OR observacoes LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] planos_acao check/update:', err)
    }

    try {
      app
        .db()
        .newQuery(`
        UPDATE atendimentos
        SET cliente_nome = REPLACE(cliente_nome, 'Peruzzo', 'Cliente'),
            no_que_podemos_ajudar = REPLACE(no_que_podemos_ajudar, 'Peruzzo', 'Supermercado'),
            maiores_dores = REPLACE(maiores_dores, 'Peruzzo', 'Supermercado')
        WHERE cliente_nome LIKE '%Peruzzo%' OR no_que_podemos_ajudar LIKE '%Peruzzo%' OR maiores_dores LIKE '%Peruzzo%'
      `)
        .execute()
    } catch (err) {
      console.log('[Migration 0023] atendimentos check/update:', err)
    }
  },
  (app) => {
    // Reversão não é necessária para normalização de nomes
  },
)
