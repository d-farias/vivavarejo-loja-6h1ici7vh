/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Enriquecer coleção fornecedores
    const fornecedoresCol = app.findCollectionByNameOrId('fornecedores')

    if (!fornecedoresCol.fields.getByName('comprador_nome')) {
      fornecedoresCol.fields.add(
        new TextField({
          name: 'comprador_nome',
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('comprador_telefone')) {
      fornecedoresCol.fields.add(
        new TextField({
          name: 'comprador_telefone',
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('comprador_email')) {
      fornecedoresCol.fields.add(
        new TextField({
          name: 'comprador_email',
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('comprador_categoria')) {
      fornecedoresCol.fields.add(
        new TextField({
          name: 'comprador_categoria',
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('layout_descricao')) {
      fornecedoresCol.fields.add(
        new TextField({
          name: 'layout_descricao',
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('layout_foto')) {
      fornecedoresCol.fields.add(
        new FileField({
          name: 'layout_foto',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('frequencia_semanal')) {
      fornecedoresCol.fields.add(
        new TextField({
          name: 'frequencia_semanal',
          required: false,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('politica_quebras')) {
      fornecedoresCol.fields.add(
        new SelectField({
          name: 'politica_quebras',
          required: false,
          values: ['troca_total', 'troca_parcial', 'sem_troca_avaria_loja'],
          maxSelect: 1,
        }),
      )
    }

    if (!fornecedoresCol.fields.getByName('is_exemplo')) {
      fornecedoresCol.fields.add(
        new BoolField({
          name: 'is_exemplo',
          required: false,
        }),
      )
    }

    app.save(fornecedoresCol)

    // 2. Enriquecer coleção visitas_promotor
    const visitasCol = app.findCollectionByNameOrId('visitas_promotor')

    if (!visitasCol.fields.getByName('foto_trabalho')) {
      visitasCol.fields.add(
        new FileField({
          name: 'foto_trabalho',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('checklist_abastecimento_100')) {
      visitasCol.fields.add(
        new BoolField({
          name: 'checklist_abastecimento_100',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('checklist_validades_ok')) {
      visitasCol.fields.add(
        new BoolField({
          name: 'checklist_validades_ok',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('checklist_layout_conforme')) {
      visitasCol.fields.add(
        new BoolField({
          name: 'checklist_layout_conforme',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('quantidade_sortimento')) {
      visitasCol.fields.add(
        new NumberField({
          name: 'quantidade_sortimento',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('perc_vendas')) {
      visitasCol.fields.add(
        new NumberField({
          name: 'perc_vendas',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('qtd_rupturas')) {
      visitasCol.fields.add(
        new NumberField({
          name: 'qtd_rupturas',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('itens_sem_vendas')) {
      visitasCol.fields.add(
        new NumberField({
          name: 'itens_sem_vendas',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('responsavel_execucao')) {
      visitasCol.fields.add(
        new TextField({
          name: 'responsavel_execucao',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('validador_fiscalizacao')) {
      visitasCol.fields.add(
        new TextField({
          name: 'validador_fiscalizacao',
          required: false,
        }),
      )
    }

    if (!visitasCol.fields.getByName('status_fiscalizacao')) {
      visitasCol.fields.add(
        new SelectField({
          name: 'status_fiscalizacao',
          required: false,
          values: ['pendente', 'aprovada', 'devolvida'],
          maxSelect: 1,
        }),
      )
    }

    if (!visitasCol.fields.getByName('is_exemplo')) {
      visitasCol.fields.add(
        new BoolField({
          name: 'is_exemplo',
          required: false,
        }),
      )
    }

    app.save(visitasCol)

    // 3. Seed de exemplo do Fornecedor Modelo (Mercearia / Matinais)
    try {
      const existingExemplo = app.findRecordsByFilter(
        'fornecedores',
        "nome ~ 'Mondelez' || nome ~ 'Modelo'",
        '-created',
        1,
        0,
      )
      if (existingExemplo.length === 0) {
        const fornEx = new Record(fornecedoresCol)
        fornEx.set('nome', 'Mondelez Brasil (Fornecedor Modelo)')
        fornEx.set('contato', 'rodrigo.mondelez@varejo.com.br')
        fornEx.set('telefone', '(11) 98123-4567')
        fornEx.set(
          'observacoes',
          'Fornecedor de exemplo para demonstração de rotinas de promotores, layout de gôndola e aviso direto ao comprador.',
        )
        fornEx.set('ativo', true)
        fornEx.set('comprador_nome', 'Renata Vasconcelos')
        fornEx.set('comprador_categoria', 'Mercearia Doce / Matinais')
        fornEx.set('comprador_telefone', '(11) 98765-1234')
        fornEx.set('comprador_email', 'renata.compras@vivavarejo.com.br')
        fornEx.set(
          'layout_descricao',
          'Gôndola Central corredor 4: 3 módulos de 1,20m. Bis e Lacta na altura dos olhos (3ª e 4ª prateleiras); Club Social na 2ª prateleira; Oreo e Tang nas pontas com faixas de gôndola.',
        )
        fornEx.set('frequencia_semanal', '3x por semana (Seg / Qua / Sex)')
        fornEx.set('politica_quebras', 'troca_total')
        fornEx.set('is_exemplo', true)
        app.save(fornEx)

        // Criar promotor de exemplo vinculado
        const promotoresCol = app.findCollectionByNameOrId('promotores')
        const promEx = new Record(promotoresCol)
        promEx.set('nome', 'Lucas Ferreira (Promotor Modelo)')
        promEx.set('email', 'lucas.promotor@mondelez.com')
        promEx.set('telefone', '(11) 99876-5432')
        promEx.set('fornecedor', fornEx.id)
        promEx.set('ativo', true)
        app.save(promEx)

        // Criar rotinas padrão de promotor de exemplo
        const rotinasPromotorCol = app.findCollectionByNameOrId('rotinas_promotor')
        const r1 = new Record(rotinasPromotorCol)
        r1.set('titulo', 'Abastecimento 100% e Puxar Frente (FIFO)')
        r1.set(
          'descricao',
          'Garantir 100% de abastecimento com saldo de loja, puxando os lotes mais antigos para a frente e registrando foto comprobatória.',
        )
        r1.set('fornecedor', fornEx.id)
        r1.set('frequencia', 'Toda visita')
        r1.set('ativa', true)
        app.save(r1)

        const r2 = new Record(rotinasPromotorCol)
        r2.set('titulo', 'Auditoria de Validades e Troca de Avarias')
        r2.set(
          'descricao',
          'Auditar lotes próximos ao vencimento (< 30 dias) e segregar quebras para processo de troca total.',
        )
        r2.set('fornecedor', fornEx.id)
        r2.set('frequencia', 'Toda visita')
        r2.set('ativa', true)
        app.save(r2)

        const r3 = new Record(rotinasPromotorCol)
        r3.set('titulo', 'Implantação conforme Planograma / Layout de Gôndola')
        r3.set(
          'descricao',
          'Conferir espaço em gôndola contratado (3 módulos) e precificação correta de todos os SKUs.',
        )
        r3.set('fornecedor', fornEx.id)
        r3.set('frequencia', 'Semanal')
        r3.set('ativa', true)
        app.save(r3)

        // Criar visita de exemplo se houver loja
        const lojas = app.findRecordsByFilter('lojas', '', 'nome', 1, 0)
        if (lojas.length > 0) {
          const hoje = new Date().toISOString().split('T')[0]
          const visEx = new Record(visitasCol)
          visEx.set('promotor', promEx.id)
          visEx.set('loja', lojas[0].id)
          visEx.set('data_visita', `${hoje} 00:00:00.000Z`)
          visEx.set('hora_prevista', '10:00')
          visEx.set('status', 'agendada')
          visEx.set(
            'observacoes',
            'Visita modelo: reposição de chocolates e biscoitos, auditoria de espaço em gôndola e controle de validades.',
          )
          visEx.set('checklist_abastecimento_100', true)
          visEx.set('checklist_validades_ok', true)
          visEx.set('checklist_layout_conforme', true)
          visEx.set('quantidade_sortimento', 38)
          visEx.set('perc_vendas', 94.5)
          visEx.set('qtd_rupturas', 2)
          visEx.set('itens_sem_vendas', 1)
          visEx.set('responsavel_execucao', 'Encarregado / GO')
          visEx.set('validador_fiscalizacao', 'Gerente de Loja')
          visEx.set('status_fiscalizacao', 'pendente')
          visEx.set('is_exemplo', true)
          app.save(visEx)
        }
      }
    } catch (e) {
      console.log('Seed fornecedor modelo skip:', e)
    }
  },
  (app) => {
    // Reverter campos caso necessário
    try {
      const fornecedoresCol = app.findCollectionByNameOrId('fornecedores')
      if (fornecedoresCol.fields.getByName('comprador_nome')) {
        fornecedoresCol.fields.removeByName('comprador_nome')
      }
      if (fornecedoresCol.fields.getByName('comprador_telefone')) {
        fornecedoresCol.fields.removeByName('comprador_telefone')
      }
      if (fornecedoresCol.fields.getByName('comprador_email')) {
        fornecedoresCol.fields.removeByName('comprador_email')
      }
      if (fornecedoresCol.fields.getByName('comprador_categoria')) {
        fornecedoresCol.fields.removeByName('comprador_categoria')
      }
      if (fornecedoresCol.fields.getByName('layout_descricao')) {
        fornecedoresCol.fields.removeByName('layout_descricao')
      }
      if (fornecedoresCol.fields.getByName('layout_foto')) {
        fornecedoresCol.fields.removeByName('layout_foto')
      }
      if (fornecedoresCol.fields.getByName('frequencia_semanal')) {
        fornecedoresCol.fields.removeByName('frequencia_semanal')
      }
      if (fornecedoresCol.fields.getByName('politica_quebras')) {
        fornecedoresCol.fields.removeByName('politica_quebras')
      }
      if (fornecedoresCol.fields.getByName('is_exemplo')) {
        fornecedoresCol.fields.removeByName('is_exemplo')
      }
      app.save(fornecedoresCol)
    } catch (_) {}

    try {
      const visitasCol = app.findCollectionByNameOrId('visitas_promotor')
      if (visitasCol.fields.getByName('foto_trabalho')) {
        visitasCol.fields.removeByName('foto_trabalho')
      }
      if (visitasCol.fields.getByName('checklist_abastecimento_100')) {
        visitasCol.fields.removeByName('checklist_abastecimento_100')
      }
      if (visitasCol.fields.getByName('checklist_validades_ok')) {
        visitasCol.fields.removeByName('checklist_validades_ok')
      }
      if (visitasCol.fields.getByName('checklist_layout_conforme')) {
        visitasCol.fields.removeByName('checklist_layout_conforme')
      }
      if (visitasCol.fields.getByName('quantidade_sortimento')) {
        visitasCol.fields.removeByName('quantidade_sortimento')
      }
      if (visitasCol.fields.getByName('perc_vendas')) {
        visitasCol.fields.removeByName('perc_vendas')
      }
      if (visitasCol.fields.getByName('qtd_rupturas')) {
        visitasCol.fields.removeByName('qtd_rupturas')
      }
      if (visitasCol.fields.getByName('itens_sem_vendas')) {
        visitasCol.fields.removeByName('itens_sem_vendas')
      }
      if (visitasCol.fields.getByName('responsavel_execucao')) {
        visitasCol.fields.removeByName('responsavel_execucao')
      }
      if (visitasCol.fields.getByName('validador_fiscalizacao')) {
        visitasCol.fields.removeByName('validador_fiscalizacao')
      }
      if (visitasCol.fields.getByName('status_fiscalizacao')) {
        visitasCol.fields.removeByName('status_fiscalizacao')
      }
      if (visitasCol.fields.getByName('is_exemplo')) {
        visitasCol.fields.removeByName('is_exemplo')
      }
      app.save(visitasCol)
    } catch (_) {}
  },
)
