// Hook para aviso imediato de cadastro / primeiro acesso e novos atendimentos de consultoria
// Destinatário: dfarias53@gmail.com
// NOTA IMPORTANTE JSVM: Todos os callbacks executam em VM isolada.
// Todas as funções auxiliares e regras de negócio DEVEM ser inline dentro de cada callback.

// 1. Hook para quando um novo registro é criado na collection 'clientes'
// (no onboarding da landing/cadastro ou funil de interesse)
onRecordAfterCreateSuccess((e) => {
  const cliente = e.record
  if (!cliente) return

  const adminEmail = 'dfarias53@gmail.com'
  const escapeHtml = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  const clienteNome = cliente.getString('nome') || 'Empresa não informada'
  const clienteContato = cliente.getString('contato') || 'E-mail não informado'
  const tipoPessoa = cliente.getString('tipo_pessoa') || 'Não informado'
  const segmento = cliente.getString('segmento') || 'Não informado'
  const infoNegocio = cliente.getString('info_negocio') || 'Não informado'
  const gargalos = cliente.getString('gargalos') || 'Não informado'
  const inventario = cliente.getString('inventario_situacao') || 'Não informado'
  const obs = cliente.getString('observacoes') || ''

  // Buscar usuário associado pelo e-mail de contato para obter o nome pessoal
  let userName = ''
  try {
    const userRec = $app.findAuthRecordByEmail('_pb_users_auth_', clienteContato)
    if (userRec) {
      userName = userRec.getString('name')
    }
  } catch (_) {}

  const subject = `[VivaVarejo] Novo Cadastro Realizado — ${userName || clienteNome}`

  const inventarioLabel =
    {
      rotativo: 'Fazemos inventário rotativo frequente',
      anual: 'Só inventário anual / esporádico',
      sem_controle: 'Não temos controle formal de inventário',
    }[inventario] || inventario

  const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Novo Cadastro no VivaVarejo</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
    <div style="background: #FFFFFF; border-bottom: 2px solid #2563EB; padding: 24px 28px;">
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">VIVAVAREJO</div>
      <div style="font-size: 16px; font-weight: 700; color: #1F2937; margin-top: 6px;">
        Novo Cadastro de Cliente / Lead no Sistema
      </div>
      <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
        Notificação imediata para consultoria e acompanhamento de parceiro de resultados.
      </div>
    </div>

    <div style="padding: 24px 28px;">
      <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-left: 4px solid #2563EB; border-radius: 6px; padding: 14px 16px; margin-bottom: 22px;">
        <div style="font-size: 14px; font-weight: 700; color: #1E40AF;">
          ${escapeHtml(userName ? `${userName} (${clienteNome})` : clienteNome)}
        </div>
        <div style="font-size: 12px; color: #1E3A8A; margin-top: 4px;">
          E-mail: <strong>${escapeHtml(clienteContato)}</strong> • Perfil: <strong>${escapeHtml(tipoPessoa === 'PJ' ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (PF)')}</strong>
        </div>
      </div>

      <div style="margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4B5563; margin-bottom: 8px;">
          Dados do Diagnóstico do Negócio
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #E5E7EB;">
          <tbody>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; width: 35%; background: #F7F7F5; color: #374151;">Nome / Razão</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(clienteNome)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Segmento de Varejo</td>
              <td style="padding: 10px 14px; color: #1F2937; font-weight: 600;">${escapeHtml(segmento)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Dados da Operação</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(infoNegocio)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Controle de Inventário</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(inventarioLabel)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151; vertical-align: top;">Maiores Gargalos / Dores</td>
              <td style="padding: 10px 14px; color: #B91C1C; font-weight: 600; line-height: 1.5;">${escapeHtml(gargalos)}</td>
            </tr>
            ${
              obs
                ? `
            <tr>
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Observações</td>
              <td style="padding: 10px 14px; color: #6B7280;">${escapeHtml(obs)}</td>
            </tr>`
                : ''
            }
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 11px; color: #6B7280; text-align: center;">
        Alerta automático do sistema <strong>VivaVarejo</strong> enviado para <strong>${adminEmail}</strong>.
      </div>
    </div>
  </div>
</body>
</html>
  `

  try {
    const senderAddress = $app.settings().meta.senderAddress || 'no-reply@vivavarejo.com.br'
    const senderName = $app.settings().meta.senderName || 'VivaVarejo Notificações'

    const message = new MailerMessage({
      from: { address: senderAddress, name: senderName },
      to: [{ address: adminEmail, name: 'Dalvani Farias' }],
      subject: subject,
      html: htmlBody,
    })

    $app.newMailClient().send(message)
    console.log(`[AvisoCadastro] E-mail de novo cadastro enviado para ${adminEmail}`)
  } catch (err) {
    console.error('[AvisoCadastro] Erro ao enviar e-mail de novo cadastro:', err)
  }
}, 'clientes')

// 2. Hook para registrar resposta de Atendimento Pós-Acesso Inteligente
// Collection 'atendimentos'
onRecordAfterCreateSuccess((e) => {
  const at = e.record
  if (!at) return

  // Se o usuário apenas dispensou sem preencher nada, podemos registrar ou não enviar
  const dispensado = at.getBool('dispensado')
  const solucao = at.getString('encontrou_solucao')
  const ajudar = at.getString('no_que_podemos_ajudar')
  const prazo = at.getString('prazo_contato')
  const dores = at.getString('maiores_dores')
  const usuarioId = at.getString('usuario')
  const emailInformado = at.getString('email')

  if (dispensado && !solucao && !ajudar && !prazo && !dores) {
    console.log('[AtendimentoLead] Cartão de atendimento apenas dispensado pelo usuário.')
    return
  }

  const adminEmail = 'dfarias53@gmail.com'
  const escapeHtml = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Carregar dados do usuário
  let userRec = null
  let userName = ''
  let userEmail = emailInformado || ''
  if (usuarioId) {
    try {
      userRec = $app.findRecordById('users', usuarioId)
      if (userRec) {
        userName = userRec.getString('name')
        if (!userEmail) userEmail = userRec.getString('email')
      }
    } catch (_) {}
  }

  // Carregar cliente vinculado ao e-mail se houver
  let clienteNome = at.getString('cliente_nome') || ''
  let clienteGargalos = ''
  let clienteSegmento = ''
  let clienteInfo = ''
  let clienteInventario = ''
  if (userEmail) {
    try {
      const clis = $app.findRecordsByFilter(
        'clientes',
        `contato ~ "${userEmail}"`,
        '-created',
        1,
        0,
      )
      if (clis && clis.length > 0) {
        if (!clienteNome) clienteNome = clis[0].getString('nome')
        clienteGargalos = clis[0].getString('gargalos')
        clienteSegmento = clis[0].getString('segmento')
        clienteInfo = clis[0].getString('info_negocio')
        clienteInventario = clis[0].getString('inventario_situacao')
      }
    } catch (_) {}
  }

  const leadName = userName || clienteNome || userEmail || 'Novo Usuário'

  // Regra de destaque no assunto: Se a pessoa responder "ficou dúvida" ou pedir contato,
  // o e-mail deve destacar isso no assunto (ex.: "[VivaVarejo] Lead pediu contato — nome")
  const pediuContato = prazo === 'hoje' || prazo === 'esta_semana'
  const ficouDuvida = solucao === 'ficou_duvida' || solucao === 'ainda_nao'

  let subject = ''
  if (pediuContato) {
    const prazoLabel = prazo === 'hoje' ? 'HOJE' : 'esta semana'
    subject = `[VivaVarejo] Lead pediu contato (${prazoLabel}) — ${leadName}`
  } else if (ficouDuvida) {
    subject = `[VivaVarejo] Lead com dúvidas / pós-acesso — ${leadName}`
  } else {
    subject = `[VivaVarejo] Resposta de Atendimento Consultivo — ${leadName}`
  }

  const solucaoLabels = {
    sim: 'Sim, encontrou a solução',
    ficou_duvida: 'Ficou dúvida (precisa de ajuda)',
    ainda_nao: 'Ainda não encontrou',
  }

  const prazoLabels = {
    hoje: 'Gostaria de contato HOJE',
    esta_semana: 'Gostaria de contato esta semana',
    so_explorar: 'Só quero explorar por enquanto',
  }

  const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Atendimento Consultivo - VivaVarejo</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
    
    <div style="background: #FFFFFF; border-bottom: 2px solid #2563EB; padding: 24px 28px;">
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">VIVAVAREJO</div>
      <div style="font-size: 16px; font-weight: 700; color: #1F2937; margin-top: 6px;">
        Atendimento Pós-Acesso Inteligente (Parceiro de Resultados)
      </div>
      <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
        Respostas do novo usuário na primeira navegação após o cadastro.
      </div>
    </div>

    <div style="padding: 24px 28px;">
      <!-- Alerta visual de destaque se pediu contato -->
      ${
        pediuContato || ficouDuvida
          ? `
      <div style="background: ${pediuContato ? '#FEF2F2' : '#EFF6FF'}; border: 1px solid ${pediuContato ? '#FCA5A5' : '#BFDBFE'}; border-left: 4px solid ${pediuContato ? '#B91C1C' : '#2563EB'}; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: ${pediuContato ? '#991B1B' : '#1E40AF'};">
          ${pediuContato ? 'Atenção: Usuário solicitou contato da consultoria' : 'Atenção: Usuário sinalizou dúvidas'}
        </div>
        <div style="font-size: 12px; color: ${pediuContato ? '#7F1D1D' : '#1E3A8A'}; margin-top: 4px;">
          Prazo solicitado: <strong>${escapeHtml(prazoLabels[prazo] || prazo || 'Não especificado')}</strong> • Status: <strong>${escapeHtml(solucaoLabels[solucao] || solucao || '—')}</strong>
        </div>
      </div>
      `
          : ''
      }

      <div style="margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4B5563; margin-bottom: 8px;">
          Identificação do Lead
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #E5E7EB;">
          <tbody>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; width: 35%; background: #F7F7F5; color: #374151;">Nome do Usuário</td>
              <td style="padding: 10px 14px; color: #1F2937; font-weight: 600;">${escapeHtml(userName || 'Não informado')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">E-mail</td>
              <td style="padding: 10px 14px; color: #2563EB;"><a href="mailto:${escapeHtml(userEmail)}" style="color: #2563EB; text-decoration: none; font-weight: 600;">${escapeHtml(userEmail)}</a></td>
            </tr>
            ${
              clienteNome
                ? `
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Empresa / Rede</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(clienteNome)}</td>
            </tr>`
                : ''
            }
            ${
              clienteSegmento
                ? `
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Segmento</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(clienteSegmento)}</td>
            </tr>`
                : ''
            }
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4B5563; margin-bottom: 8px;">
          Respostas das Perguntas Consultivas
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #E5E7EB;">
          <tbody>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; width: 35%; background: #F7F7F5; color: #374151;">Encontrou a solução que procura?</td>
              <td style="padding: 10px 14px; color: #1F2937; font-weight: 600;">${escapeHtml(solucaoLabels[solucao] || solucao || '—')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">No que podemos ajudar?</td>
              <td style="padding: 10px 14px; color: #1F2937; line-height: 1.5;">${escapeHtml(ajudar || '—')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Prazo para contato</td>
              <td style="padding: 10px 14px; color: #1F2937; font-weight: 600;">${escapeHtml(prazoLabels[prazo] || prazo || '—')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151; vertical-align: top;">Maiores dores na operação / gestão</td>
              <td style="padding: 10px 14px; color: #B91C1C; font-weight: 600; line-height: 1.5;">${escapeHtml(dores || clienteGargalos || '—')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 11px; color: #6B7280; text-align: center;">
        E-mail de consultoria enviado imediatamente para <strong>${adminEmail}</strong> pelo sistema <strong>VivaVarejo</strong>.
      </div>
    </div>
  </div>
</body>
</html>
  `

  try {
    const senderAddress = $app.settings().meta.senderAddress || 'no-reply@vivavarejo.com.br'
    const senderName = $app.settings().meta.senderName || 'VivaVarejo Consultoria'

    const message = new MailerMessage({
      from: { address: senderAddress, name: senderName },
      to: [{ address: adminEmail, name: 'Dalvani Farias' }],
      subject: subject,
      html: htmlBody,
    })

    $app.newMailClient().send(message)
    console.log(
      `[AtendimentoLead] E-mail de atendimento consultivo enviado com sucesso para ${adminEmail}`,
    )

    // Marcar flag no próprio registro de atendimento
    try {
      at.set('notificado_email', true)
      $app.save(at)
    } catch (_) {}
  } catch (err) {
    console.error('[AtendimentoLead] Erro ao enviar e-mail de atendimento:', err)
  }
}, 'atendimentos')

// 3. Endpoint HTTP específico para notificar Primeiro Acesso/Navegação (Anti-spam com flag no usuário)
// Rota: POST /api/vivavarejo/primeiro-acesso
routerAdd(
  'POST',
  '/api/vivavarejo/primeiro-acesso',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { error: 'Usuário não autenticado' })
    }

    const userId = authRecord.id
    const userEmail = authRecord.getString('email')
    const userName = authRecord.getString('name')
    const jaNotificado = authRecord.getBool('primeiro_acesso_notificado')

    // Anti-spam: se já notificado no primeiro login/navegação, não disparar novamente
    if (jaNotificado) {
      return e.json(200, {
        status: 'already_notified',
        message: 'Primeiro acesso já notificado anteriormente.',
      })
    }

    // Não notificar o próprio admin do sistema
    if (userEmail === 'dfarias53@gmail.com') {
      try {
        authRecord.set('primeiro_acesso_notificado', true)
        $app.save(authRecord)
      } catch (_) {}
      return e.json(200, { status: 'skipped_admin' })
    }

    // Buscar dados complementares do cliente
    let clienteNome = ''
    let tipoPessoa = ''
    let segmento = ''
    let infoNegocio = ''
    let gargalos = ''
    let inventario = ''

    try {
      const clis = $app.findRecordsByFilter(
        'clientes',
        `contato ~ "${userEmail}"`,
        '-created',
        1,
        0,
      )
      if (clis && clis.length > 0) {
        clienteNome = clis[0].getString('nome')
        tipoPessoa = clis[0].getString('tipo_pessoa')
        segmento = clis[0].getString('segmento')
        infoNegocio = clis[0].getString('info_negocio')
        gargalos = clis[0].getString('gargalos')
        inventario = clis[0].getString('inventario_situacao')
      }
    } catch (_) {}

    const adminEmail = 'dfarias53@gmail.com'
    const escapeHtml = (text) => {
      if (!text) return ''
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    const inventarioLabel =
      {
        rotativo: 'Fazemos inventário rotativo frequente',
        anual: 'Só inventário anual / esporádico',
        sem_controle: 'Não temos controle formal de inventário',
      }[inventario] || inventario

    const subject = `[VivaVarejo] Primeiro Login e Navegação — ${userName || clienteNome || userEmail}`

    const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Primeiro Acesso - VivaVarejo</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
    <div style="background: #FFFFFF; border-bottom: 2px solid #2563EB; padding: 24px 28px;">
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">VIVAVAREJO</div>
      <div style="font-size: 16px; font-weight: 700; color: #1F2937; margin-top: 6px;">
        Primeiro Login e Navegação no Aplicativo
      </div>
      <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
        O usuário acabou de acessar e começou a explorar as rotinas operacionais.
      </div>
    </div>

    <div style="padding: 24px 28px;">
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #16A34A; border-radius: 6px; padding: 14px 16px; margin-bottom: 22px;">
        <div style="font-size: 14px; font-weight: 700; color: #166534;">
          ${escapeHtml(userName)} está navegando no VivaVarejo
        </div>
        <div style="font-size: 12px; color: #14532D; margin-top: 4px;">
          E-mail: <strong>${escapeHtml(userEmail)}</strong> • Empresa: <strong>${escapeHtml(clienteNome || 'Não informada')}</strong>
        </div>
      </div>

      <div style="margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4B5563; margin-bottom: 8px;">
          Ficha do Usuário e Operação
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #E5E7EB;">
          <tbody>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; width: 35%; background: #F7F7F5; color: #374151;">Perfil / Enquadramento</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(tipoPessoa === 'PF' ? 'Pessoa Física (PF)' : tipoPessoa === 'PJ' ? 'Pessoa Jurídica (CNPJ)' : 'Não informado')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Segmento de Varejo</td>
              <td style="padding: 10px 14px; color: #1F2937; font-weight: 600;">${escapeHtml(segmento || 'Não informado')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Dados da Operação</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(infoNegocio || 'Não informado')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151;">Controle de Inventário</td>
              <td style="padding: 10px 14px; color: #1F2937;">${escapeHtml(inventarioLabel || 'Não informado')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: 600; background: #F7F7F5; color: #374151; vertical-align: top;">Gargalos Informados</td>
              <td style="padding: 10px 14px; color: #B91C1C; font-weight: 600; line-height: 1.5;">${escapeHtml(gargalos || 'Nenhum gargalo preenchido')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 11px; color: #6B7280; text-align: center;">
        Aviso de primeiro acesso gerado automaticamente pelo <strong>VivaVarejo</strong> para <strong>${adminEmail}</strong>.
      </div>
    </div>
  </div>
</body>
</html>
    `

    try {
      const senderAddress = $app.settings().meta.senderAddress || 'no-reply@vivavarejo.com.br'
      const senderName = $app.settings().meta.senderName || 'VivaVarejo Alertas'

      const message = new MailerMessage({
        from: { address: senderAddress, name: senderName },
        to: [{ address: adminEmail, name: 'Dalvani Farias' }],
        subject: subject,
        html: htmlBody,
      })

      $app.newMailClient().send(message)
      console.log(
        `[PrimeiroAcesso] E-mail de primeiro login de ${userEmail} enviado para ${adminEmail}`,
      )

      // Salva flag no usuário para anti-spam garantido
      authRecord.set('primeiro_acesso_notificado', true)
      $app.save(authRecord)

      return e.json(200, { status: 'sent', message: 'Primeiro acesso notificado com sucesso.' })
    } catch (err) {
      console.error('[PrimeiroAcesso] Falha ao enviar e-mail de primeiro acesso:', err)
      return e.json(500, { error: 'Erro ao enviar notificação de primeiro acesso.' })
    }
  },
  $apis.requireAuth(),
)
