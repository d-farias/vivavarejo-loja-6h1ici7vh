/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Criar a coleção auditoria_acoes
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const lojasCol = app.findCollectionByNameOrId('lojas')

    let auditoriaCol
    try {
      auditoriaCol = app.findCollectionByNameOrId('auditoria_acoes')
    } catch (_) {
      auditoriaCol = new Collection({
        name: 'auditoria_acoes',
        type: 'base',
        // Leitura só admin ou adm_rede da própria rede
        listRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))",
        viewRule:
          "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))",
        // Criação por qualquer usuário autenticado (ou admin)
        createRule: "@request.auth.id != ''",
        // Ninguém altera ou deleta registros de auditoria (imutável)
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'usuario_nome', type: 'text', required: false },
          { name: 'usuario_perfil', type: 'text', required: false },
          {
            name: 'cliente',
            type: 'relation',
            required: false,
            collectionId: clientesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'loja',
            type: 'relation',
            required: false,
            collectionId: lojasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'acao',
            type: 'select',
            required: true,
            values: [
              'criacao',
              'alteracao',
              'exclusao',
              'conclusao',
              'validacao',
              'login',
              'troca_senha',
            ],
            maxSelect: 1,
          },
          {
            name: 'modulo',
            type: 'select',
            required: true,
            values: [
              'rotinas',
              'execucoes',
              'validades',
              'perdas',
              'inventarios',
              'promotores',
              'visitas',
              'usuarios',
              'lojas',
              'configuracoes',
            ],
            maxSelect: 1,
          },
          { name: 'registro_id', type: 'text', required: false },
          { name: 'detalhes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_auditoria_cliente_created ON auditoria_acoes (cliente, created DESC)',
        ],
      })
      app.save(auditoriaCol)
    }

    // 2. Proteger campos de arquivo (protected: true)
    // execucoes_rotinas -> foto
    const execucoesCol = app.findCollectionByNameOrId('execucoes_rotinas')
    const fotoExecField = execucoesCol.fields.getByName('foto')
    if (fotoExecField) {
      fotoExecField.protected = true
    }

    // tarefas_validade -> foto
    const tarefasValidadeCol = app.findCollectionByNameOrId('tarefas_validade')
    const fotoValidadeField = tarefasValidadeCol.fields.getByName('foto')
    if (fotoValidadeField) {
      fotoValidadeField.protected = true
    }

    // perdas -> foto
    const perdasCol = app.findCollectionByNameOrId('perdas')
    const fotoPerdasField = perdasCol.fields.getByName('foto')
    if (fotoPerdasField) {
      fotoPerdasField.protected = true
    }

    // fornecedores -> layout_foto
    const fornecedoresCol = app.findCollectionByNameOrId('fornecedores')
    const layoutFotoField = fornecedoresCol.fields.getByName('layout_foto')
    if (layoutFotoField) {
      layoutFotoField.protected = true
    }

    // rotinas_promotor -> foto_trabalho
    const rotinasPromotorCol = app.findCollectionByNameOrId('rotinas_promotor')
    const fotoTrabalhoRotProm = rotinasPromotorCol.fields.getByName('foto_trabalho')
    if (fotoTrabalhoRotProm) {
      fotoTrabalhoRotProm.protected = true
    }

    // visitas_promotor -> foto_trabalho, foto_gondola, foto_abastecimento, foto_validades
    const visitasPromotorCol = app.findCollectionByNameOrId('visitas_promotor')
    const fotoTrabVisita = visitasPromotorCol.fields.getByName('foto_trabalho')
    if (fotoTrabVisita) fotoTrabVisita.protected = true
    const fotoGondolaVisita = visitasPromotorCol.fields.getByName('foto_gondola')
    if (fotoGondolaVisita) fotoGondolaVisita.protected = true
    const fotoAbastVisita = visitasPromotorCol.fields.getByName('foto_abastecimento')
    if (fotoAbastVisita) fotoAbastVisita.protected = true
    const fotoValVisita = visitasPromotorCol.fields.getByName('foto_validades')
    if (fotoValVisita) fotoValVisita.protected = true

    // 3. Atualizar regras de API com isolamento por rede/cliente e restrições de exclusão e criação
    // Regra users:
    // list/view: autenticado e admin ou da mesma rede
    // create: apenas admin geral ou adm_rede
    // update: o próprio usuário ou admin ou adm_rede da mesma rede
    // delete: admin geral ou adm_rede da mesma rede (não auto-exclusão por operadores)
    usersCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente || id = @request.auth.id)"
    usersCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente || id = @request.auth.id)"
    usersCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    usersCol.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))"
    usersCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))"
    app.save(usersCol)

    // Clientes:
    // list/view: admin ou o próprio cliente vinculado
    // create: admin geral
    // update: admin ou adm_rede do próprio cliente
    // delete: admin geral
    clientesCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || id = @request.auth.cliente)"
    clientesCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || id = @request.auth.cliente)"
    clientesCol.createRule = "@request.auth.id != '' && @request.auth.perfil = 'admin'"
    clientesCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && id = @request.auth.cliente))"
    clientesCol.deleteRule = "@request.auth.id != '' && @request.auth.perfil = 'admin'"
    app.save(clientesCol)

    // Lojas:
    // list/view: admin ou loja da mesma rede
    // create: admin ou adm_rede da própria rede
    // update: admin ou adm_rede da própria rede
    // delete: admin ou adm_rede da própria rede
    lojasCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente)"
    lojasCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente)"
    lojasCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))"
    lojasCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))"
    lojasCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))"
    app.save(lojasCol)

    // Funções (vinculadas à loja):
    const funcoesCol = app.findCollectionByNameOrId('funcoes')
    funcoesCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    funcoesCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    funcoesCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    funcoesCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    funcoesCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    app.save(funcoesCol)

    // Funcionários (vinculados à loja):
    const funcionariosCol = app.findCollectionByNameOrId('funcionarios')
    funcionariosCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    funcionariosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    funcionariosCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    funcionariosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    funcionariosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    app.save(funcionariosCol)

    // Rotinas (vinculadas à loja, ou rotina geral/global sem loja onde loja = null):
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    rotinasCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    rotinasCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    rotinasCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede' || @request.auth.perfil = 'lider')"
    rotinasCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (loja = null || loja.cliente = @request.auth.cliente)) || @request.auth.perfil = 'lider')"
    rotinasCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (loja = null || loja.cliente = @request.auth.cliente)))"
    // Adicionar índice em rotinas(loja, status)
    rotinasCol.addIndex('idx_rotinas_loja_status', false, 'loja, status', '')
    app.save(rotinasCol)

    // Execuções rotinas (vinculadas à rotina):
    execucoesCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || rotina.loja.cliente = @request.auth.cliente || rotina.loja = null)"
    execucoesCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || rotina.loja.cliente = @request.auth.cliente || rotina.loja = null)"
    execucoesCol.createRule = "@request.auth.id != ''"
    execucoesCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || rotina.loja.cliente = @request.auth.cliente || rotina.loja = null)"
    execucoesCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (rotina.loja = null || rotina.loja.cliente = @request.auth.cliente)))"
    // Adicionar índice em execucoes_rotinas(rotina, data_execucao, concluida)
    execucoesCol.addIndex(
      'idx_execucoes_rotina_data_concluida',
      false,
      'rotina, data_execucao, concluida',
      '',
    )
    app.save(execucoesCol)

    // Tarefas validade (vinculadas à loja):
    tarefasValidadeCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    tarefasValidadeCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    tarefasValidadeCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    tarefasValidadeCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    tarefasValidadeCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    // Adicionar índice em tarefas_validade(loja, status, data_especifica)
    tarefasValidadeCol.addIndex(
      'idx_tv_loja_status_data',
      false,
      'loja, status, data_especifica',
      '',
    )
    app.save(tarefasValidadeCol)

    // Perdas (vinculadas à loja):
    perdasCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    perdasCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    perdasCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    perdasCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    perdasCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    // Adicionar índice em perdas(loja, data)
    perdasCol.addIndex('idx_perdas_loja_data', false, 'loja, data', '')
    app.save(perdasCol)

    // Inventários (vinculados à loja):
    const inventariosCol = app.findCollectionByNameOrId('inventarios')
    inventariosCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    inventariosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    inventariosCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    inventariosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    inventariosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    app.save(inventariosCol)

    // Planos de ação (vinculados à loja):
    const planosCol = app.findCollectionByNameOrId('planos_acao')
    planosCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    planosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    planosCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    planosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    planosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (loja = null || loja.cliente = @request.auth.cliente)))"
    app.save(planosCol)

    // Fornecedores (vinculados ao cliente/rede, ou globais se cliente = null):
    fornecedoresCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente || cliente = null)"
    fornecedoresCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente || cliente = null)"
    fornecedoresCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && cliente = @request.auth.cliente))"
    fornecedoresCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (cliente = null || cliente = @request.auth.cliente)))"
    fornecedoresCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (cliente = null || cliente = @request.auth.cliente)))"
    app.save(fornecedoresCol)

    // Promotores (vinculados ao fornecedor):
    const promotoresCol = app.findCollectionByNameOrId('promotores')
    promotoresCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || fornecedor.cliente = @request.auth.cliente || fornecedor.cliente = null)"
    promotoresCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || fornecedor.cliente = @request.auth.cliente || fornecedor.cliente = null)"
    promotoresCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (fornecedor.cliente = @request.auth.cliente || fornecedor.cliente = null)))"
    promotoresCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (fornecedor.cliente = @request.auth.cliente || fornecedor.cliente = null)))"
    promotoresCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (fornecedor.cliente = @request.auth.cliente || fornecedor.cliente = null)))"
    app.save(promotoresCol)

    // Rotinas promotor (vinculadas à loja e ao fornecedor):
    rotinasPromotorCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    rotinasPromotorCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente || loja = null)"
    rotinasPromotorCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (loja = null || loja.cliente = @request.auth.cliente)))"
    rotinasPromotorCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (loja = null || loja.cliente = @request.auth.cliente)))"
    rotinasPromotorCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (loja = null || loja.cliente = @request.auth.cliente)))"
    app.save(rotinasPromotorCol)

    // Visitas promotor (vinculadas à loja):
    visitasPromotorCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    visitasPromotorCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    visitasPromotorCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    visitasPromotorCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || loja.cliente = @request.auth.cliente)"
    visitasPromotorCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && loja.cliente = @request.auth.cliente))"
    // Adicionar índice em visitas_promotor(loja, data_visita, status)
    visitasPromotorCol.addIndex(
      'idx_visitas_loja_data_status',
      false,
      'loja, data_visita, status',
      '',
    )
    app.save(visitasPromotorCol)

    // Atendimentos:
    const atendimentosCol = app.findCollectionByNameOrId('atendimentos')
    atendimentosCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || usuario = @request.auth.id)"
    atendimentosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || usuario = @request.auth.id)"
    atendimentosCol.createRule = "@request.auth.id != ''"
    atendimentosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || usuario = @request.auth.id)"
    atendimentosCol.deleteRule = "@request.auth.id != '' && @request.auth.perfil = 'admin'"
    app.save(atendimentosCol)

    // Modelos rotinas:
    const modelosCol = app.findCollectionByNameOrId('modelos_rotinas')
    modelosCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente || cliente = null)"
    modelosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || cliente = @request.auth.cliente || cliente = null)"
    modelosCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    modelosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (cliente = null || cliente = @request.auth.cliente)))"
    modelosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (cliente = null || cliente = @request.auth.cliente)))"
    app.save(modelosCol)

    // Modelos rotinas itens:
    const itensCol = app.findCollectionByNameOrId('modelos_rotinas_itens')
    itensCol.listRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || modelo.cliente = @request.auth.cliente || modelo.cliente = null)"
    itensCol.viewRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || modelo.cliente = @request.auth.cliente || modelo.cliente = null)"
    itensCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    itensCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (modelo.cliente = null || modelo.cliente = @request.auth.cliente)))"
    itensCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && (modelo.cliente = null || modelo.cliente = @request.auth.cliente)))"
    app.save(itensCol)
  },
  (app) => {
    // Reverter auditoria_acoes
    try {
      const auditoriaCol = app.findCollectionByNameOrId('auditoria_acoes')
      app.delete(auditoriaCol)
    } catch (_) {}
  },
)
