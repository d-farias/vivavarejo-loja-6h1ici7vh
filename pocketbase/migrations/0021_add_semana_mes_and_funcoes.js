migrate(
  (app) => {
    // 1. Tornar loja opcional na collection funcoes (para suportar funcoes padrao da rede/globais)
    const funcoesCol = app.findCollectionByNameOrId('funcoes')
    const lojaField = funcoesCol.fields.getByName('loja')
    if (lojaField) {
      lojaField.required = false
      app.save(funcoesCol)
    }

    // 2. Adicionar campos semana_mes e observacoes na collection tarefas_validade
    const tarefasValidade = app.findCollectionByNameOrId('tarefas_validade')

    if (!tarefasValidade.fields.getByName('semana_mes')) {
      // 1, 2, 3, 4 ou null/0 para todas as semanas
      tarefasValidade.fields.add(
        new NumberField({
          name: 'semana_mes',
          required: false,
          min: 0,
          max: 5,
          onlyInt: true,
        }),
      )
    }

    if (!tarefasValidade.fields.getByName('observacoes')) {
      tarefasValidade.fields.add(
        new TextField({
          name: 'observacoes',
          required: false,
        }),
      )
    }

    tarefasValidade.addIndex('idx_tv_semana_mes', false, 'semana_mes', '')
    app.save(tarefasValidade)

    // 3. Garantir que as funções operacionais essenciais para auditoria de validade
    // GO (Gerente Operacional), LP (Líder Prevenção) e Gerente existam no sistema
    const funcoesPadrao = [
      'Líder Prevenção (LP)',
      'Gerente Operacional (GO)',
      'Gerente',
      'Prevenção de Perdas (LP)',
      'Encarregado de Setor',
    ]

    for (let i = 0; i < funcoesPadrao.length; i++) {
      const nomeFuncao = funcoesPadrao[i]
      try {
        app.findFirstRecordByData('funcoes', 'nome', nomeFuncao)
      } catch (_) {
        const rec = new Record(funcoesCol)
        rec.set('nome', nomeFuncao)
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      const tarefasValidade = app.findCollectionByNameOrId('tarefas_validade')
      tarefasValidade.removeIndex('idx_tv_semana_mes')
      tarefasValidade.fields.removeByName('semana_mes')
      tarefasValidade.fields.removeByName('observacoes')
      app.save(tarefasValidade)
    } catch (_) {}
  },
)
