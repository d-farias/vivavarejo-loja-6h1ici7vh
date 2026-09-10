/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/vivavarejo/gerar-modelo-ia',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { message: 'Não autorizado. Faça login para continuar.' })
    }

    const body = e.requestInfo().body || {}
    const descricao = (body.descricao || '').trim()
    const clienteId = (body.cliente || '').trim() || null
    const nomeSugerido = (body.nome || '').trim()

    if (!descricao) {
      return e.json(400, { message: 'A descrição da operação da loja é obrigatória.' })
    }

    // Chamada à IA nativa Skip Cloud usando $ai.chat
    const systemPrompt = `Você é um consultor especialista em excelência operacional de varejo brasileiro (VivaVarejo).
Sua missão é receber a descrição de uma operação comercial ou de loja de varejo e estruturar um modelo completo e padronizado de rotinas diárias e periódicas de excelência.

Para cada rotina identificada ou recomendada, forneça:
- nome: Título claro da rotina (ex: "Checklist de Abertura e Frente de Loja", "Auditoria de Ruptura e Validade", "Conferência de Fechamento de Caixa", "Alinhamento Matinal com Equipe (Briefing)")
- responsavel: Cargo/Função sugerida (ex: "Gerente Geral", "Encarregado de Loja", "Operador de Caixa", "Cartazista", "Prevenção de Perdas")
- frequencia: Deve ser EXATAMENTE um destes valores permitidos: "Diária", "Semanal", "Conforme vendas", "Rotinas", "A cada recebimento"
- horario_limite: Horário sugerido no formato HH:MM (ex: "08:00", "10:30", "14:00", "19:00", "21:30") ou descrição curta de momento
- ferramenta: Ferramenta operacional recomendada (ex: "Checklist Físico/App", "Coletor de Dados", "ERP/Frente de Caixa", "Planilha de Auditoria")
- validacao: Quem valida ou método de validação (ex: "Gerente de Loja", "Regional", "Foto do Ponto de Venda", "Relatório de Caixa")
- area: Área ou departamento da loja (ex: "Frente de Caixa", "Salão de Vendas", "Estoque/Recebimento", "Prevenção de Perdas", "Gestão/Administrativo")
- observacoes: Instruções práticas para execução e padrão de qualidade esperado.

Você DEVE responder ESTRITAMENTE em formato JSON puro, sem markdown, sem blocos de código com crases, apenas o objeto JSON:
{
  "nome_modelo": "Nome sugerido para o modelo (ex: Modelo Operacional - Supermercado Compacto)",
  "descricao_modelo": "Breve resumo da estrutura operacional desenhada",
  "rotinas": [
    {
      "nome": "string",
      "responsavel": "string",
      "frequencia": "Diária",
      "horario_limite": "08:30",
      "ferramenta": "string",
      "validacao": "string",
      "area": "string",
      "observacoes": "string"
    }
  ]
}`

    let aiResult
    try {
      aiResult = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Descrição da operação fornecida pelo usuário:\n${descricao}${nomeSugerido ? `\n\nNome preferido: ${nomeSugerido}` : ''}`,
          },
        ],
      })
    } catch (err) {
      console.log('Erro ao chamar $ai.chat:', err)
      return e.json(500, {
        message: 'Falha ao processar solicitação de IA. Tente novamente em instantes.',
        details: err ? String(err.message || err) : 'Erro desconhecido',
      })
    }

    const rawContent = (aiResult?.choices?.[0]?.message?.content || '').trim()
    if (!rawContent) {
      return e.json(500, { message: 'A IA não retornou conteúdo. Tente detalhar mais a operação.' })
    }

    // Limpar possíveis blocos ```json ... ``` caso o modelo os tenha retornado
    let cleanedJson = rawContent
    if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    }

    let parsedData
    try {
      parsedData = JSON.parse(cleanedJson)
    } catch (err) {
      console.log('Erro de parse JSON da resposta da IA:', cleanedJson)
      return e.json(500, {
        message: 'A IA gerou uma resposta em formato inválido. Tente novamente.',
        raw: rawContent,
      })
    }

    const finalNomeModelo = nomeSugerido || parsedData.nome_modelo || 'Modelo Gerado por IA'
    const finalDescricao =
      parsedData.descricao_modelo || `Gerado com base em: ${descricao.slice(0, 100)}...`
    const rotinasList = Array.isArray(parsedData.rotinas) ? parsedData.rotinas : []

    if (rotinasList.length === 0) {
      return e.json(400, {
        message: 'A IA não identificou rotinas operacionais para a descrição fornecida.',
      })
    }

    // Gravar diretamente na collection modelos_rotinas
    const modelosCol = $app.findCollectionByNameOrId('modelos_rotinas')
    const modeloRecord = new Record(modelosCol)
    modeloRecord.set('nome', finalNomeModelo)
    modeloRecord.set('descricao', finalDescricao)
    modeloRecord.set('criado_por', authRecord.id)
    if (clienteId) {
      modeloRecord.set('cliente', clienteId)
    }

    try {
      $app.save(modeloRecord)
    } catch (err) {
      console.log('Erro ao salvar modelo_rotinas:', err)
      return e.json(500, { message: 'Erro ao salvar o modelo de rotinas no banco de dados.' })
    }

    // Gravar os itens na collection modelos_rotinas_itens
    const itensCol = $app.findCollectionByNameOrId('modelos_rotinas_itens')
    const validFrequencias = [
      'Diária',
      'Semanal',
      'Conforme vendas',
      'Rotinas',
      'A cada recebimento',
    ]

    let createdCount = 0
    for (let i = 0; i < rotinasList.length; i++) {
      const item = rotinasList[i]
      if (!item.nome) continue

      let freq = (item.frequencia || 'Diária').trim()
      if (!validFrequencias.includes(freq)) {
        freq = 'Diária'
      }

      const itemRecord = new Record(itensCol)
      itemRecord.set('modelo', modeloRecord.id)
      itemRecord.set('nome', item.nome)
      itemRecord.set('responsavel', item.responsavel || 'Equipe da Loja')
      itemRecord.set('funcao_nome', item.responsavel || '')
      itemRecord.set('frequencia', freq)
      itemRecord.set('horario_limite', item.horario_limite || '10:00')
      itemRecord.set('ferramenta', item.ferramenta || 'Checklist / App')
      itemRecord.set('validacao', item.validacao || 'Gerência / Regional')
      itemRecord.set('area', item.area || 'Geral')
      itemRecord.set('observacoes', item.observacoes || '')

      try {
        $app.save(itemRecord)
        createdCount++
      } catch (itemErr) {
        console.log('Erro ao salvar item do modelo:', itemErr)
      }
    }

    return e.json(201, {
      success: true,
      modelo: {
        id: modeloRecord.id,
        nome: finalNomeModelo,
        descricao: finalDescricao,
        totalItens: createdCount,
      },
      message: `Modelo "${finalNomeModelo}" criado com sucesso com ${createdCount} rotina(s)!`,
    })
  },
  $apis.requireAuth(),
)
