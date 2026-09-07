migrate(
  (app) => {
    // 1. Atualizar a collection users:
    // - Atualizar selectField `perfil` para aceitar: ['admin', 'adm_rede', 'lider', 'funcionario']
    // - Adicionar relationField `cliente` apontando para a collection `clientes`
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const clientesCol = app.findCollectionByNameOrId('clientes')

    const perfilField = usersCol.fields.getByName('perfil')
    if (perfilField) {
      perfilField.values = ['admin', 'adm_rede', 'lider', 'funcionario']
    }

    if (!usersCol.fields.getByName('cliente')) {
      usersCol.fields.add(
        new RelationField({
          name: 'cliente',
          required: false,
          collectionId: clientesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // Regras de users:
    // list/view: autenticados
    // create: livre (onboarding) ou autenticado
    // update: o próprio usuário ou admin geral ou adm_rede
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    usersCol.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    usersCol.deleteRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.perfil = 'admin')"

    app.save(usersCol)

    // 2. Adicionar campo segmento em modelos_rotinas se não existir
    const modelosCol = app.findCollectionByNameOrId('modelos_rotinas')
    if (!modelosCol.fields.getByName('segmento')) {
      modelosCol.fields.add(
        new TextField({
          name: 'segmento',
          required: false,
        }),
      )
    }

    // Regras de modelos_rotinas:
    // list/view: autenticados
    // create/update/delete: admin ou adm_rede
    modelosCol.listRule = "@request.auth.id != ''"
    modelosCol.viewRule = "@request.auth.id != ''"
    modelosCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    modelosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    modelosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    app.save(modelosCol)

    // 3. Atualizar regras de coleções para que adm_rede e admin possam operar
    // Lojas: admin ou adm_rede
    const lojasCol = app.findCollectionByNameOrId('lojas')
    lojasCol.listRule = "@request.auth.id != ''"
    lojasCol.viewRule = "@request.auth.id != ''"
    lojasCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    lojasCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    lojasCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    app.save(lojasCol)

    // Funções
    const funcoesCol = app.findCollectionByNameOrId('funcoes')
    funcoesCol.listRule = "@request.auth.id != ''"
    funcoesCol.viewRule = "@request.auth.id != ''"
    funcoesCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    funcoesCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    funcoesCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    app.save(funcoesCol)

    // Funcionários
    const funcionariosCol = app.findCollectionByNameOrId('funcionarios')
    funcionariosCol.listRule = "@request.auth.id != ''"
    funcionariosCol.viewRule = "@request.auth.id != ''"
    funcionariosCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    funcionariosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    funcionariosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede')"
    app.save(funcionariosCol)

    // Rotinas
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    rotinasCol.createRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede' || @request.auth.perfil = 'lider' || @request.auth.perfil = '')"
    rotinasCol.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede' || @request.auth.perfil = 'lider' || @request.auth.perfil = '')"
    rotinasCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || @request.auth.perfil = 'adm_rede' || @request.auth.perfil = 'lider' || @request.auth.perfil = '')"
    app.save(rotinasCol)

    // Clientes:
    // admin pode editar/deletar qualquer um. adm_rede pode editar o seu próprio cliente vinculado.
    const clientesCollection = app.findCollectionByNameOrId('clientes')
    clientesCollection.updateRule =
      "@request.auth.id != '' && (@request.auth.perfil = 'admin' || (@request.auth.perfil = 'adm_rede' && @request.auth.cliente = id))"
    app.save(clientesCollection)

    // 4. Seed de Modelos Prontos por Segmento para demonstração e navegação do cliente
    const segmentosModelos = [
      {
        nome: 'Modelo Essencial - Moda & Vestuário',
        segmento: 'Moda e Vestuário',
        descricao:
          'Rotinas operacionais de abertura, padronização de VM (Visual Merchandising), provadores, fechamento e conferência de caixa para lojas de roupas e calçados.',
        itens: [
          {
            nome: 'Abertura de Loja e Checagem de Iluminação/Climatização',
            frequencia: 'Diária',
            horario_limite: '09:45',
            responsavel: 'Gerente / Líder de Loja',
            area: 'Salão de Vendas',
            ferramenta: 'Checklist VivaVarejo',
            validacao: 'Gerente de Loja',
            observacoes: 'Checar lâmpadas queimadas, som ambiente e ar condicionado.',
          },
          {
            nome: 'Organização e Dobras de Mesas de Destaque (Visual Merchandising)',
            frequencia: 'Diária',
            horario_limite: '11:00',
            responsavel: 'Consultor de Moda / Vendedor',
            area: 'Salão de Vendas',
            ferramenta: 'Gabarito de Dobras',
            validacao: 'Líder de Salão',
            observacoes: 'Alinhamento por grade de cor e tamanho (P ao GG).',
          },
          {
            nome: 'Higienização e Liberação de Provadores',
            frequencia: 'Diária',
            horario_limite: '14:00',
            responsavel: 'Assistente de Loja',
            area: 'Provadores',
            ferramenta: 'Checklist Físico/Digital',
            validacao: 'Gerente de Loja',
            observacoes: 'Recolher peças esquecidas e retornar ao salão imediatamente.',
          },
          {
            nome: 'Auditoria de Alarme e Etiquetas Antifurto',
            frequencia: 'Semanal',
            horario_limite: '16:00',
            responsavel: 'Prevenção de Perdas',
            area: 'Estoque / Salão',
            ferramenta: 'Auditoria VivaVarejo',
            validacao: 'Gerente de Loja',
            observacoes: 'Amostragem em 50 peças de alto valor agregado.',
          },
          {
            nome: 'Fechamento de Caixa e Sangria Diária',
            frequencia: 'Diária',
            horario_limite: '21:30',
            responsavel: 'Operador de Caixa',
            area: 'Frente de Caixa',
            ferramenta: 'Sistema PDV',
            validacao: 'Gerente / Subgerente',
            observacoes: 'Conferência cega e guarda no cofre inteligente.',
          },
        ],
      },
      {
        nome: 'Modelo Operacional - Supermercado / Food',
        segmento: 'Supermercado/Food',
        descricao:
          'Padrões de recebimento refrigerado, validade (PVPS), abastecimento de hortifrúti, padaria e auditoria de ruptura em gôndolas.',
        itens: [
          {
            nome: 'Controle de Temperatura de Balcões e Câmaras Frias',
            frequencia: 'Diária',
            horario_limite: '07:30',
            responsavel: 'Encarregado de Perecíveis',
            area: 'Açougue / Frios',
            ferramenta: 'Termômetro Digital',
            validacao: 'Gerente de Operações',
            observacoes: 'Registrar temperatura no painel (tolerância máxima 4°C).',
          },
          {
            nome: 'Abastecimento Matinal de Hortifrúti (FLV)',
            frequencia: 'Diária',
            horario_limite: '08:00',
            responsavel: 'Repositor FLV',
            area: 'Hortifrúti',
            ferramenta: 'Pranchas de Reposição',
            validacao: 'Encarregado de Setor',
            observacoes: 'Retirar itens murchos ou amassados antes da abertura.',
          },
          {
            nome: 'Auditoria de Ruptura de Linha A (Top 200 Itens)',
            frequencia: 'Diária',
            horario_limite: '11:00',
            responsavel: 'Líder de Mercearia',
            area: 'Mercearia',
            ferramenta: 'Coletor de Dados',
            validacao: 'Gerente de Loja',
            observacoes: 'Verificar estoque virtual vs físico nas faltas de gôndola.',
          },
          {
            nome: 'Controle de Validades Próximas (Giro PVPS)',
            frequencia: 'Semanal',
            horario_limite: '15:00',
            responsavel: 'Prevenção e Reposição',
            area: 'Loja Completa',
            ferramenta: 'Etiquetador Promocional',
            validacao: 'Auditoria Interna',
            observacoes: 'Aplicar desconto especial nos itens com vencimento em até 5 dias.',
          },
        ],
      },
      {
        nome: 'Modelo Boas Práticas - Farmácia & Drogaria',
        segmento: 'Farmácia',
        descricao:
          'Rotinas de controle de temperatura de medicamentos, conferência de controlados SNGPC, organização de perfumaria/dermocosméticos e caixa.',
        itens: [
          {
            nome: 'Leitura de Termo-higrômetro de Medicamentos e Geladeira',
            frequencia: 'Diária',
            horario_limite: '08:30',
            responsavel: 'Farmacêutico Responsável',
            area: 'Dispensação / Geladeira',
            ferramenta: 'Planilha Anvisa / Sistema',
            validacao: 'Farmacêutico RT',
            observacoes: 'Geladeira entre 2°C e 8°C; ambiente até 25°C.',
          },
          {
            nome: 'Conferência de Armário de Controlados (Portaria 344)',
            frequencia: 'Diária',
            horario_limite: '10:00',
            responsavel: 'Farmacêutico',
            area: 'Controlados',
            ferramenta: 'SNGPC / Livro',
            validacao: 'Gerente / RT',
            observacoes: 'Bater receitas retidas do dia anterior com saldo físico.',
          },
          {
            nome: 'Alinhamento e Precificação de Dermocosméticos',
            frequencia: 'Diária',
            horario_limite: '12:00',
            responsavel: 'Consultor de Beleza / Balconista',
            area: 'Perfumaria',
            ferramenta: 'Pistola de Preço',
            validacao: 'Subgerente',
            observacoes: 'Limpar frascos de teste e checar 100% dos preços visíveis.',
          },
        ],
      },
      {
        nome: 'Modelo Comercial - Eletrônicos & Telefonia',
        segmento: 'Eletrônicos',
        descricao:
          'Rotinas de segurança de bancadas de degustação, baterias dos aparelhos em exposição, conferência de número de série e metas da equipe.',
        itens: [
          {
            nome: 'Teste de Alarmes e Cabos Retráteis dos Smartphones e TVs',
            frequencia: 'Diária',
            horario_limite: '09:30',
            responsavel: 'Líder Técnico / Vendedor',
            area: 'Bancadas de Demonstração',
            ferramenta: 'Chave de Teste Alarme',
            validacao: 'Gerente de Loja',
            observacoes: 'Garantir que nenhum aparelho fique solto ou sem carga.',
          },
          {
            nome: 'Reunião Matinal de Foco em Margem e Serviços (Garantia/Seguro)',
            frequencia: 'Diária',
            horario_limite: '09:50',
            responsavel: 'Gerente de Loja',
            area: 'Salão de Vendas',
            ferramenta: 'Quadro de Metas VivaVarejo',
            validacao: 'Gerente Regional',
            observacoes: 'Alinhar meta diária de faturamento e mix de garantia estendida.',
          },
          {
            nome: 'Inventário Cego de Aparelhos em Cofre (Smartphones)',
            frequencia: 'Semanal',
            horario_limite: '18:00',
            responsavel: 'Estoquista / Subgerente',
            area: 'Cofre',
            ferramenta: 'Leitor Serial / IMEI',
            validacao: 'Gerente de Loja',
            observacoes: 'Conferir 100% dos IMEIs com a relação de estoque.',
          },
        ],
      },
      {
        nome: 'Modelo Operacional - Construção & Lar',
        segmento: 'Construção/Casa',
        descricao:
          'Padrões para materiais de construção, conferência de pisos/lotes, expedição e conferência de caminhões de entrega.',
        itens: [
          {
            nome: 'Conferência de Cargas de Saída (Caminhões de Entrega)',
            frequencia: 'Diária',
            horario_limite: '08:00',
            responsavel: 'Conferente de Expedição',
            area: 'Expedição / Pátio',
            ferramenta: 'Romaneio de Entrega',
            validacao: 'Encarregado de Logística',
            observacoes: 'Conferir nota fiscal e amarrar carga com segurança.',
          },
          {
            nome: 'Auditoria de Lote e Tonalidade de Revestimentos / Pisos',
            frequencia: 'Semanal',
            horario_limite: '14:00',
            responsavel: 'Vendedor Especialista',
            area: 'Showroom de Pisos',
            ferramenta: 'Ficha de Lote',
            validacao: 'Gerente de Loja',
            observacoes: 'Nunca vender caixas de lotes ou tonalidades diferentes no mesmo pedido.',
          },
        ],
      },
      {
        nome: 'Modelo Consultoria - Pet Shop & Clínica',
        segmento: 'Pet',
        descricao:
          'Rotinas de higienização de banho e tosa, validade de rações fracionadas, balança e atendimento especializado.',
        itens: [
          {
            nome: 'Checklist de Assepsia e Esterilização de Lâminas (Banho & Tosa)',
            frequencia: 'Diária',
            horario_limite: '08:15',
            responsavel: 'Tosador / Líder Estética',
            area: 'Banho e Tosa',
            ferramenta: 'Autoclave / Álcool 70%',
            validacao: 'Médico Veterinário RT',
            observacoes: 'Esterilizar toalhas e lâminas entre atendimentos.',
          },
          {
            nome: 'Rotação e Pesagem de Rações a Granel',
            frequencia: 'Diária',
            horario_limite: '10:30',
            responsavel: 'Balconista Pet',
            area: 'Salão de Vendas',
            ferramenta: 'Balança Aferida',
            validacao: 'Gerente de Loja',
            observacoes: 'Fechar tambores hermeticamente para evitar pragas.',
          },
        ],
      },
    ]

    const itensCol = app.findCollectionByNameOrId('modelos_rotinas_itens')

    for (const mod of segmentosModelos) {
      let modRec = null
      try {
        const found = app.findRecordsByFilter(
          'modelos_rotinas',
          `nome = "${mod.nome}"`,
          '-created',
          1,
          0,
        )
        if (found && found.length > 0) {
          modRec = found[0]
        }
      } catch (_) {}

      if (!modRec) {
        modRec = new Record(modelosCol)
        modRec.set('nome', mod.nome)
        modRec.set('descricao', mod.descricao)
        modRec.set('segmento', mod.segmento)
        app.save(modRec)

        for (const item of mod.itens) {
          const itemRec = new Record(itensCol)
          itemRec.set('modelo', modRec.id)
          itemRec.set('nome', item.nome)
          itemRec.set('frequencia', item.frequencia)
          itemRec.set('horario_limite', item.horario_limite)
          itemRec.set('responsavel', item.responsavel)
          itemRec.set('area', item.area)
          itemRec.set('ferramenta', item.ferramenta)
          itemRec.set('validacao', item.validacao)
          itemRec.set('observacoes', item.observacoes)
          app.save(itemRec)
        }
      }
    }
  },
  (app) => {
    // Reverter regras e campo se necessário
  },
)
