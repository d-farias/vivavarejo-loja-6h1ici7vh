migrate(
  (app) => {
    // 1. Obter coleção visitas_promotor e adicionar check_in, check_out, tempo_permanencia_minutos se não existirem
    const col = app.findCollectionByNameOrId('visitas_promotor')

    if (!col.fields.getByName('check_in')) {
      col.fields.add(
        new TextField({
          name: 'check_in',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('check_out')) {
      col.fields.add(
        new TextField({
          name: 'check_out',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('tempo_permanencia_minutos')) {
      col.fields.add(
        new NumberField({
          name: 'tempo_permanencia_minutos',
          required: false,
        }),
      )
    }

    app.save(col)

    // 2. Ajustar dados de demonstração da Loja Demonstração para cenário saudável e profissional:
    // "92% de execução / 21 tarefas concluídas / 3 pontos de atenção / 2 ocorrências críticas"
    // Mantém a integridade do app e garante que apresentações comerciais mostrem excelência operacional.
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = yyyy + '-' + mm + '-' + dd

    try {
      const demoLoja = app.findFirstRecordByData('lojas', 'nome', 'Loja Demonstração')
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'demo@vivavarejo.com.br')
      const rotinasCol = app.findCollectionByNameOrId('rotinas')
      const execsCol = app.findCollectionByNameOrId('execucoes_rotinas')

      // Lista enriquecida de rotinas para compor 21+ tarefas concluídas e alto padrão de aderência (92%)
      const rotinasSaudaveis = [
        {
          nome: 'Abertura de Loja e Checagem de Fundo de Troco',
          responsavel: 'Frente de Caixa',
          area: 'Frente de Caixa',
          frequencia: 'Diária',
          horario_limite: '07:45h',
          ferramenta: 'Checklist POS e Cofre',
          validacao: 'Gerente Operacional (GO)',
          observacoes:
            'Conferir sangrias, fundo dos terminais e teste de bobina antes de abrir portas.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria Matinal de Preços e Cartazeamento',
          responsavel: 'Prevenção e Cartazista',
          area: 'Cartazista',
          frequencia: 'Diária',
          horario_limite: '08:30h',
          ferramenta: 'Coletor RF e Impressora',
          validacao: 'Líder Prevenção (LP)',
          observacoes:
            'Auditar cartazes de ponta de gôndola e confirmar se batem com o preço no PDV.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Checklist de Temperatura e Balcões Refrigerados',
          responsavel: 'Frios e Laticínios',
          area: 'Frios',
          frequencia: 'Diária',
          horario_limite: '08:45h',
          ferramenta: 'Termômetro Digital Infravermelho',
          validacao: 'Líder de Perecíveis',
          observacoes: 'Conferir balcões de ilha e congelados (-18°C) e laticínios (0°C a 4°C).',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Recebimento de Hortifrúti e Classificação de Qualidade',
          responsavel: 'Hortifrúti / FLV',
          area: 'FLV',
          frequencia: 'Diária',
          horario_limite: '09:00h',
          ferramenta: 'Balança e Termo de Inspeção',
          validacao: 'Encarregado de Loja',
          observacoes: 'Checar brix, ponto de maturação e descartes no recebimento da doca.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Conferência de Reposição de Padaria e Confeitaria',
          responsavel: 'Padaria',
          area: 'Padaria',
          frequencia: 'Diária',
          horario_limite: '09:15h',
          ferramenta: 'Planilha de Fornada e Balcão',
          validacao: 'Líder de Perecíveis',
          observacoes: 'Garantir pão francês quente a cada 40 min e exposição de confeitaria 100%.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria de Validades de Carnes Embaladas (Açougue)',
          responsavel: 'Açougue',
          area: 'Açougue',
          frequencia: 'Diária',
          horario_limite: '09:30h',
          ferramenta: 'Coletor de Dados',
          validacao: 'Líder Açougue / Prevenção',
          observacoes:
            'Conferir etiquetas de pesagem, cor e datas limites de carnes no autoatendimento.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria de Gôndola Matinal: Matinais e Biscoitos',
          responsavel: 'Mercearia Doce',
          area: 'Mercearia',
          frequencia: 'Diária',
          horario_limite: '10:00h',
          ferramenta: 'Aplicativo VivaVarejo',
          validacao: 'Encarregado de Mercearia',
          observacoes: 'Puxar frente dos produtos e aplicar facing correto.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Higienização de Carrinhos e Cestas de Compras',
          responsavel: 'Serviços Gerais / Portaria',
          area: 'Frente de Loja',
          frequencia: 'Diária',
          horario_limite: '10:15h',
          ferramenta: 'Pulverizador e Álcool 70%',
          validacao: 'Frente de Caixa',
          observacoes: 'Disponibilizar 100% dos carrinhos higienizados na entrada principal.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria de Iluminação e Limpeza de Sanitários de Clientes',
          responsavel: 'Serviços Gerais',
          area: 'Limpeza',
          frequencia: 'Diária',
          horario_limite: '10:30h',
          ferramenta: 'Checklist Porta-Sanitário',
          validacao: 'Gerente Operacional',
          observacoes: 'Checar reposição de sabonete líquido, papel toalha e cheiro agradável.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Checagem de Troca de Bobinas de Balanças e Etiquetas',
          responsavel: 'Perecíveis Geral',
          area: 'FLV / Açougue / Frios',
          frequencia: 'Diária',
          horario_limite: '10:45h',
          ferramenta: 'Balanças Toledo',
          validacao: 'Técnico de Suporte / GO',
          observacoes: 'Garantir estoque de segurança de bobinas térmicas ao lado de cada balança.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Abastecimento de Bebidas e Linha Refrigerada (Geladeiras)',
          responsavel: 'Bebidas e Cervejas',
          area: 'Bebidas',
          frequencia: 'Diária',
          horario_limite: '11:00h',
          ferramenta: 'Carro Plataforma',
          validacao: 'Encarregado de Mercearia',
          observacoes:
            'Garantir geladeiras de refrigerantes e cervejas geladas no horário de pico.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Verificação de Despejo e Sangria Programada de Caixa',
          responsavel: 'Tesouraria / Tesoureiro',
          area: 'Frente de Caixa',
          frequencia: 'Diária',
          horario_limite: '11:30h',
          ferramenta: 'Sistema PDV e Cofre Inteligente',
          validacao: 'Gerente Operacional',
          observacoes: 'Manter limites máximos de segurança em cada gaveta.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria de Limpeza do Depósito e Doca de Recebimento',
          responsavel: 'Logística / Doca',
          area: 'Depósito',
          frequencia: 'Diária',
          horario_limite: '12:00h',
          ferramenta: 'Transpaleteira e Vassoura mecânica',
          validacao: 'Líder de Prevenção',
          observacoes: 'Desobstruir corredores principais e organizar paletes vazios.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Conferência de Faturamento de Pedidos de E-commerce / Delivery',
          responsavel: 'E-commerce / Separação',
          area: 'Delivery',
          frequencia: 'Diária',
          horario_limite: '12:30h',
          ferramenta: 'Coletor Picker / WhatsApp Loja',
          validacao: 'Líder de Atendimento',
          observacoes: 'Despachar pedidos do primeiro turno sem atraso aos entregadores.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Higienização de Balcões de Fracionamento de Queijos e Embutidos',
          responsavel: 'Frios',
          area: 'Frios',
          frequencia: 'Diária',
          horario_limite: '13:00h',
          ferramenta: 'Álcool 70% e Toalhas Descartáveis',
          validacao: 'Nutricionista / GO',
          observacoes: 'Desmonte e desinfecção das lâminas das fatiadoras.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Inspeção de Etiquetas de Validade Secundária (Pós-Abertura)',
          responsavel: 'Padaria / Rotisseria',
          area: 'Produção',
          frequencia: 'Diária',
          horario_limite: '13:30h',
          ferramenta: 'Etiquetadora Manual de Validade',
          validacao: 'Líder Prevenção (LP)',
          observacoes:
            'Conferir datas de abertura em todos os molhos, queijos e embalagens abertas.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Puxada de Frente e Reposição Rápida de Mercearia Pesada (Arroz/Feijão)',
          responsavel: 'Reposição Mercearia',
          area: 'Mercearia',
          frequencia: 'Diária',
          horario_limite: '14:00h',
          ferramenta: 'Transpaleteira Hidráulica',
          validacao: 'Encarregado de Mercearia',
          observacoes: 'Manter gôndolas de grãos e óleos com nível máximo de abastecimento.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Ronda de Prevenção e Portas de Emergência',
          responsavel: 'Prevenção de Perdas',
          area: 'Prevenção',
          frequencia: 'Diária',
          horario_limite: '14:30h',
          ferramenta: 'Rádio comunicador e Checklist físico',
          validacao: 'Coord. Prevenção de Perdas',
          observacoes: 'Checar rotas de fuga, alarmes de saída e travamento do depósito.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria de Descarte e Quebras do Hortifrúti (Pesagem)',
          responsavel: 'Prevenção e FLV',
          area: 'FLV',
          frequencia: 'Diária',
          horario_limite: '15:00h',
          ferramenta: 'Balança de Quebra e Coletor',
          validacao: 'Líder Prevenção (LP)',
          observacoes: 'Pesar e lançar sobras e avarias no sistema antes do descarte ecológico.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Alinhamento com Promotores da Tarde e Verificação de Crachás',
          responsavel: 'Portaria / Recepção',
          area: 'Entrada Fornecedores',
          frequencia: 'Diária',
          horario_limite: '15:30h',
          ferramenta: 'Caderno de Acesso / Tablet',
          validacao: 'Gerente Operacional (GO)',
          observacoes: 'Exigir crachá da marca e EPI para acesso às áreas de reposição.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        {
          nome: 'Auditoria de Pontas de Gôndola e Espaço Promocional',
          responsavel: 'Mercearia / Marketing',
          area: 'Mercearia',
          frequencia: 'Diária',
          horario_limite: '16:00h',
          ferramenta: 'Celular VivaVarejo (Foto)',
          validacao: 'Gerente Operacional (GO)',
          observacoes: 'Confirmar abastecimento dos produtos da promoção do encarte semanal.',
          concluida: true,
          status_validacao: 'aprovada',
        },
        // Pontos de atenção e ocorrências controladas para realismo demonstrativo saudável:
        {
          nome: 'Mapeamento de Rupturas de Gôndola (Curva A)',
          responsavel: 'Reposição Noturna/Tarde',
          area: 'Mercearia',
          frequencia: 'Diária',
          horario_limite: '21:00h',
          ferramenta: 'Coletor de Dados / ERP',
          validacao: 'Encarregado de Loja',
          observacoes: 'Identificar itens sem estoque na gôndola com saldo em depósito.',
          concluida: false,
          status_validacao: 'aguardando_validacao',
        },
        {
          nome: 'Conferência de Fechamento de Doca e Lacre de Caminhões',
          responsavel: 'Logística / Recebimento',
          area: 'Doca',
          frequencia: 'Diária',
          horario_limite: '21:30h',
          ferramenta: 'Alicate e Lacre Numerado',
          validacao: 'Líder Prevenção (LP)',
          observacoes: 'Registrar números dos lacres e trancar portão externo.',
          concluida: false,
        },
      ]

      for (let i = 0; i < rotinasSaudaveis.length; i++) {
        const item = rotinasSaudaveis[i]
        let rRec
        const existing = app.findRecordsByFilter(
          'rotinas',
          "nome = '" + item.nome.replace(/'/g, "''") + "' && loja = '" + demoLoja.id + "'",
          '',
          1,
          0,
        )

        if (existing.length > 0) {
          rRec = existing[0]
          rRec.set('horario_limite', item.horario_limite)
          rRec.set('responsavel', item.responsavel)
          rRec.set('area', item.area)
          rRec.set('validacao', item.validacao)
          rRec.set('prioridade_dia', i + 1)
          app.save(rRec)
        } else {
          rRec = new Record(rotinasCol)
          rRec.set('nome', item.nome)
          rRec.set('loja', demoLoja.id)
          rRec.set('responsavel', item.responsavel)
          rRec.set('area', item.area)
          rRec.set('frequencia', item.frequencia)
          rRec.set('horario_limite', item.horario_limite)
          rRec.set('ferramenta', item.ferramenta)
          rRec.set('validacao', item.validacao)
          rRec.set('status', 'Ativa')
          rRec.set('observacoes', item.observacoes)
          rRec.set('prioridade_dia', i + 1)
          app.save(rRec)
        }

        // Criar ou atualizar execução para o dia corrente se concluída
        if (item.concluida) {
          const exCheck = app.findRecordsByFilter(
            'execucoes_rotinas',
            "rotina = '" + rRec.id + "' && data_execucao ~ '" + todayStr + "'",
            '',
            1,
            0,
          )
          if (exCheck.length === 0) {
            const ex = new Record(execsCol)
            ex.set('rotina', rRec.id)
            ex.set('usuario', demoUser.id)
            ex.set('data_execucao', todayStr + ' 12:00:00.000Z')
            ex.set('concluida', true)
            ex.set('status_validacao', item.status_validacao || 'aprovada')
            ex.set('validado_em', todayStr + ' 09:30:00')
            app.save(ex)
          }
        }
      }
    } catch (e) {
      console.log('Aviso ao sincronizar dados saudáveis de demonstração:', e)
    }
  },
  (app) => {
    // Reverter campos se necessário
    try {
      const col = app.findCollectionByNameOrId('visitas_promotor')
      if (col.fields.getByName('check_in')) col.fields.removeByName('check_in')
      if (col.fields.getByName('check_out')) col.fields.removeByName('check_out')
      if (col.fields.getByName('tempo_permanencia_minutos'))
        col.fields.removeByName('tempo_permanencia_minutos')
      app.save(col)
    } catch (_) {}
  },
)
