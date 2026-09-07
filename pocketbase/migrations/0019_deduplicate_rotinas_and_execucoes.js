migrate(
  (app) => {
    // 1. Identificar rotinas duplicadas no banco
    // Critério de identidade de uma rotina:
    // Mesmo (loja || ''), mesmo TRIM(LOWER(nome)), mesmo TRIM(LOWER(horario_limite)), mesmo TRIM(LOWER(responsavel))
    const allRotinas = app.findRecordsByFilter('rotinas', '', 'created', 5000, 0)

    const map = {}
    const duplicateIdsToDelete = []
    const canonicalMap = {} // duplicateId -> canonicalId

    for (let i = 0; i < allRotinas.length; i++) {
      const r = allRotinas[i]
      const lojaId = r.getString('loja') || ''
      const nome = (r.getString('nome') || '').trim().toLowerCase()
      const horario = (r.getString('horario_limite') || '').trim().toLowerCase()
      const resp = (r.getString('responsavel') || '').trim().toLowerCase()
      const area = (r.getString('area') || '').trim().toLowerCase()

      const key = `${lojaId}:::${nome}:::${horario}:::${resp}:::${area}`

      if (!map[key]) {
        // Primeira ocorrência mantida (canônica)
        map[key] = r.id
      } else {
        // Duplicada encontrada
        const canonicalId = map[key]
        duplicateIdsToDelete.push(r.id)
        canonicalMap[r.id] = canonicalId
      }
    }

    // 2. Se houver execuções, planos de ação ou outras tabelas apontando para a rotina duplicada,
    // remapear para a rotina canônica para não perder histórico
    for (let j = 0; j < duplicateIdsToDelete.length; j++) {
      const dupId = duplicateIdsToDelete[j]
      const canonicalId = canonicalMap[dupId]

      // Atualizar execucoes_rotinas
      try {
        app
          .db()
          .newQuery('UPDATE execucoes_rotinas SET rotina = {:canonical} WHERE rotina = {:dup}')
          .bind({ canonical: canonicalId, dup: dupId })
          .execute()
      } catch (err) {
        console.log('Erro ao remapear execucoes_rotinas:', err)
      }

      // Atualizar planos_acao
      try {
        app
          .db()
          .newQuery('UPDATE planos_acao SET rotina = {:canonical} WHERE rotina = {:dup}')
          .bind({ canonical: canonicalId, dup: dupId })
          .execute()
      } catch (err) {
        console.log('Erro ao remapear planos_acao:', err)
      }

      // Agora deletar a rotina duplicada
      try {
        const record = app.findRecordById('rotinas', dupId)
        app.delete(record)
      } catch (err) {
        console.log('Erro ao deletar rotina duplicada:', dupId, err)
      }
    }

    // 3. Limpar execuções duplicadas para a mesma rotina no mesmo dia pelo mesmo usuário
    // Mantendo a mais recente ou concluída
    try {
      app
        .db()
        .newQuery(`
        DELETE FROM execucoes_rotinas
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                     PARTITION BY rotina, usuario, SUBSTR(data_execucao, 1, 10)
                     ORDER BY concluida DESC, updated DESC, created DESC
                   ) as rn
            FROM execucoes_rotinas
          ) WHERE rn = 1
        )
      `)
        .execute()
    } catch (e) {
      // Fallback simples caso ROW_NUMBER não seja suportado em versões muito antigas do sqlite
      console.log('Tentando limpeza alternativa de execucoes duplicadas:', e)
      const allExecs = app.findRecordsByFilter('execucoes_rotinas', '', '-updated', 5000, 0)
      const execMap = {}
      for (let k = 0; k < allExecs.length; k++) {
        const ex = allExecs[k]
        const rId = ex.getString('rotina')
        const uId = ex.getString('usuario')
        const dStr = (ex.getString('data_execucao') || '').substring(0, 10)
        const eKey = `${rId}:::${uId}:::${dStr}`
        if (!execMap[eKey]) {
          execMap[eKey] = ex.id
        } else {
          try {
            app.delete(ex)
          } catch (_) {}
        }
      }
    }
  },
  (app) => {
    // down migration
  },
)
