// Job agendado frequente: Verificação a cada 5 minutos de rotinas atrasadas e envio imediato de alerta por e-mail
// Executa a cada 5 minutos: '*/5 * * * *'
// NOTA IMPORTANTE JSVM: Em hooks do PocketBase, callbacks executam em VM isolada.
// Toda a lógica e funções auxiliares DEVEM estar inline dentro do callback do cronAdd.
// Utiliza $app para todas as operações de banco de dados.

cronAdd('alerta_rotinas_atrasadas', '*/5 * * * *', () => {
  console.log('[AlertaRotinas] Iniciando varredura a cada 5 minutos de rotinas em atraso...')

  // 1. Extração segura de e-mail de strings livres
  const extractEmail = (str) => {
    if (!str) return null
    const match = String(str).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    return match ? match[0].trim().toLowerCase() : null
  }

  // 2. Escape simples de HTML
  const escapeHtml = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // 3. Parser robusto de horário limite (compatível com src/lib/time-utils.ts)
  const parseHorarioLimite = (timeVal) => {
    if (timeVal === undefined || timeVal === null) {
      return { normalized: '', minutes: null, isIntegral: false }
    }

    if (typeof timeVal === 'number') {
      if (isNaN(timeVal)) {
        return { normalized: '', minutes: null, isIntegral: false }
      }
      if (timeVal >= 1 && timeVal <= 24 && Math.floor(timeVal) === timeVal) {
        const h = timeVal === 24 ? 0 : timeVal
        const hh = String(h).padStart(2, '0')
        return { normalized: `${hh}:00`, minutes: h * 60, isIntegral: false }
      }
      const totalMinutes = Math.round((timeVal % 1) * 24 * 60)
      const hours = Math.floor(totalMinutes / 60) % 24
      const minutes = totalMinutes % 60
      const hh = String(hours).padStart(2, '0')
      const mm = String(minutes).padStart(2, '0')
      return { normalized: `${hh}:${mm}`, minutes: hours * 60 + minutes, isIntegral: false }
    }

    const str = String(timeVal).trim()
    if (!str) {
      return { normalized: '', minutes: null, isIntegral: false }
    }

    const lower = str.toLowerCase()

    if (
      lower.includes('integral') ||
      lower === 'dia todo' ||
      lower === 'livre' ||
      lower === 'sem limite'
    ) {
      return { normalized: 'Integral', minutes: null, isIntegral: true }
    }

    if (
      lower.includes('1899') ||
      lower.includes('gmt') ||
      lower.includes('utc') ||
      /^[a-z]{3} [a-z]{3} \d{1,2}/.test(lower)
    ) {
      const parsedDate = new Date(str)
      if (!isNaN(parsedDate.getTime())) {
        const hours =
          lower.includes('gmt+0000') || lower.includes('utc')
            ? parsedDate.getUTCHours()
            : parsedDate.getHours()
        const minutes =
          lower.includes('gmt+0000') || lower.includes('utc')
            ? parsedDate.getUTCMinutes()
            : parsedDate.getMinutes()
        const hh = String(hours).padStart(2, '0')
        const mm = String(minutes).padStart(2, '0')
        return { normalized: `${hh}:${mm}`, minutes: hours * 60 + minutes, isIntegral: false }
      }
    }

    const colonMatch = lower.match(/^(\d{1,2}):(\d{2})/i)
    if (colonMatch) {
      const hours = parseInt(colonMatch[1], 10)
      const minutes = parseInt(colonMatch[2], 10)
      if (
        !isNaN(hours) &&
        hours >= 0 &&
        hours < 24 &&
        !isNaN(minutes) &&
        minutes >= 0 &&
        minutes < 60
      ) {
        const hh = String(hours).padStart(2, '0')
        const mm = String(minutes).padStart(2, '0')
        return { normalized: `${hh}:${mm}`, minutes: hours * 60 + minutes, isIntegral: false }
      }
    }

    const hMatch = lower.match(/^(\d{1,2})\s*h(?:s)?(?:\s*(\d{2}))?/i)
    if (hMatch) {
      const hours = parseInt(hMatch[1], 10)
      const minutes = hMatch[2] ? parseInt(hMatch[2], 10) : 0
      if (
        !isNaN(hours) &&
        hours >= 0 &&
        hours < 24 &&
        !isNaN(minutes) &&
        minutes >= 0 &&
        minutes < 60
      ) {
        const hh = String(hours).padStart(2, '0')
        const mm = String(minutes).padStart(2, '0')
        return { normalized: `${hh}:${mm}`, minutes: hours * 60 + minutes, isIntegral: false }
      }
    }

    const genericMatch = lower.match(/(\d{1,2})(?::(\d{2})|\s*h(?:s)?)/i)
    if (genericMatch) {
      const hours = parseInt(genericMatch[1], 10)
      const minutes = genericMatch[2] ? parseInt(genericMatch[2], 10) : 0
      if (
        !isNaN(hours) &&
        hours >= 0 &&
        hours < 24 &&
        !isNaN(minutes) &&
        minutes >= 0 &&
        minutes < 60
      ) {
        const hh = String(hours).padStart(2, '0')
        const mm = String(minutes).padStart(2, '0')
        return { normalized: `${hh}:${mm}`, minutes: hours * 60 + minutes, isIntegral: false }
      }
    }

    const justHour = lower.match(/^(\d{1,2})$/)
    if (justHour) {
      const hours = parseInt(justHour[1], 10)
      if (!isNaN(hours) && hours >= 0 && hours < 24) {
        const hh = String(hours).padStart(2, '0')
        return { normalized: `${hh}:00`, minutes: hours * 60, isIntegral: false }
      }
    }

    return { normalized: str, minutes: null, isIntegral: false }
  }

  // Data atual no fuso horário do Brasil (America/Sao_Paulo: UTC-3)
  const now = new Date()
  const brasilOffsetMs = -3 * 60 * 60 * 1000
  const brasilTime = new Date(now.getTime() + brasilOffsetMs)
  const currentMinutes = brasilTime.getUTCHours() * 60 + brasilTime.getUTCMinutes()
  const currentHourFormatted = `${String(brasilTime.getUTCHours()).padStart(2, '0')}:${String(brasilTime.getUTCMinutes()).padStart(2, '0')}`
  const todayStr = `${brasilTime.getUTCFullYear()}-${String(brasilTime.getUTCOffset ? brasilTime.getUTCMonth() + 1 : brasilTime.getUTCMonth() + 1).padStart(2, '0')}-${String(brasilTime.getUTCDate()).padStart(2, '0')}`

  // Buscar todas as lojas cadastradas
  let lojas = []
  try {
    lojas = $app.findRecordsByFilter('lojas', '', 'nome', 1000, 0)
  } catch (err) {
    console.error('[AlertaRotinas] Erro ao carregar lojas:', err)
    return
  }

  // Buscar todos os clientes (para obter nome e contato de fallback se necessário)
  let clientesMap = {}
  try {
    const clientesList = $app.findRecordsByFilter('clientes', '', 'nome', 500, 0)
    for (let i = 0; i < clientesList.length; i++) {
      clientesMap[clientesList[i].id] = clientesList[i]
    }
  } catch (_) {}

  // Buscar todas as funções (para identificar Gerentes e Encarregados)
  let funcoesMap = {}
  try {
    const funcoesList = $app.findRecordsByFilter('funcoes', '', 'nome', 1000, 0)
    for (let i = 0; i < funcoesList.length; i++) {
      funcoesMap[funcoesList[i].id] = funcoesList[i]
    }
  } catch (_) {}

  // Buscar todos os usuários (para obter emails de gerentes vinculados)
  let usersMap = {}
  try {
    const usersList = $app.findRecordsByFilter('users', '', '', 1000, 0)
    for (let i = 0; i < usersList.length; i++) {
      usersMap[usersList[i].id] = usersList[i]
    }
  } catch (_) {}

  // Buscar funcionários ativos
  let funcionarios = []
  try {
    funcionarios = $app.findRecordsByFilter('funcionarios', 'ativo != false', '', 2000, 0)
  } catch (_) {}

  // Buscar execuções de hoje (concluídas)
  let execucoesHoje = []
  try {
    execucoesHoje = $app.findRecordsByFilter(
      'execucoes_rotinas',
      `data_execucao >= "${todayStr} 00:00:00" && concluida = true`,
      '-created',
      5000,
      0,
    )
  } catch (_) {}

  const concluidasHojeSet = new Set()
  for (let i = 0; i < execucoesHoje.length; i++) {
    const rId = execucoesHoje[i].getString('rotina')
    if (rId) concluidasHojeSet.add(rId)
  }

  // Buscar todas as rotinas ativas
  let rotinas = []
  try {
    rotinas = $app.findRecordsByFilter('rotinas', 'status != "Concluída"', 'nome', 3000, 0)
  } catch (err) {
    console.error('[AlertaRotinas] Erro ao carregar rotinas:', err)
    return
  }

  if (!rotinas || rotinas.length === 0) {
    console.log('[AlertaRotinas] Nenhuma rotina cadastrada. Encerrando.')
    return
  }

  // Criar mapa de lojas por ID
  const lojasMap = {}
  for (let i = 0; i < lojas.length; i++) {
    lojasMap[lojas[i].id] = lojas[i]
  }

  // Identificar rotinas atrasadas hoje que ainda NÃO tiveram alerta disparado hoje
  const atrasadasPorLoja = {} // lojaId -> Array de rotinas atrasadas

  for (let i = 0; i < rotinas.length; i++) {
    const r = rotinas[i]
    const rId = r.id

    // Se já foi concluída hoje, ignora
    if (concluidasHojeSet.has(rId)) {
      continue
    }

    // Anti-duplicidade: verificar se já gerou alerta hoje
    const alertaEnviadoEm = r.getString('alerta_enviado_em')
    if (alertaEnviadoEm && alertaEnviadoEm.startsWith(todayStr)) {
      continue
    }

    // Verificar se a rotina deve ser executada hoje de acordo com a frequência
    const freq = (r.getString('frequencia') || 'Diária').trim()
    // 'Diária' roda todo dia; 'Rotinas' e 'Conforme vendas' também são monitoradas diariamente
    // Se for Semanal e não for o dia, ou casos específicos, por padrão monitoramos Diária, Semanal, etc.

    // Parser do horário limite
    const horarioStr = r.getString('horario_limite')
    const parsed = parseHorarioLimite(horarioStr)

    // Se é integral ou não tem horário parseável, não gera alerta de horário limite
    if (parsed.isIntegral || parsed.minutes === null) {
      continue
    }

    // Verifica se o horário limite já passou
    if (currentMinutes > parsed.minutes) {
      // Rotina em atraso!
      const lojaId = r.getString('loja') || '_sem_loja_'
      if (!atrasadasPorLoja[lojaId]) {
        atrasadasPorLoja[lojaId] = []
      }
      atrasadasPorLoja[lojaId].push({
        record: r,
        nome: r.getString('nome'),
        responsavel: r.getString('responsavel') || 'Não informado',
        area: r.getString('area') || 'Geral',
        horarioLimite: parsed.normalized,
        ferramenta: r.getString('ferramenta') || '—',
        validacao: r.getString('validacao') || '—',
      })
    }
  }

  const lojaIdsComAtraso = Object.keys(atrasadasPorLoja)
  if (lojaIdsComAtraso.length === 0) {
    console.log('[AlertaRotinas] Nenhuma rotina pendente em atraso nesta verificação.')
    return
  }

  console.log(
    `[AlertaRotinas] Encontradas rotinas atrasadas em ${lojaIdsComAtraso.length} grupo(s) de lojas.`,
  )

  let totalEmailsEnviados = 0

  for (let lIdx = 0; lIdx < lojaIdsComAtraso.length; lIdx++) {
    const lojaId = lojaIdsComAtraso[lIdx]
    const atrasadas = atrasadasPorLoja[lojaId]
    const loja = lojasMap[lojaId]

    // Se for rotina sem loja vinculada e houver apenas 1 loja, associa a ela
    let lojaEfetiva = loja
    if (!lojaEfetiva && lojaId === '_sem_loja_' && lojas.length === 1) {
      lojaEfetiva = lojas[0]
    }

    const lojaNome = lojaEfetiva ? lojaEfetiva.getString('nome') : 'Loja Geral'
    const lojaCodigo = lojaEfetiva ? lojaEfetiva.getString('codigo') : ''
    const clienteId = lojaEfetiva ? lojaEfetiva.getString('cliente') : ''
    const cliente = clienteId ? clientesMap[clienteId] : null
    const clienteNome = cliente ? cliente.getString('nome') : 'VivaVarejo'

    // Verificar se os alertas estão ativos para esta loja
    // Regra: se alertas_ativos for false, pular a loja com log
    if (lojaEfetiva && lojaEfetiva.getBool('alertas_ativos') === false) {
      console.log(
        `[AlertaRotinas] Loja "${lojaNome}" (${lojaEfetiva.id}) está com alertas_ativos = false. Pulando.`,
      )
      continue
    }

    // Determinar destinatários:
    // 1. Regional da loja (email_regional no registro da loja)
    // 2. Gerente da loja (funcionário com cargo contendo 'gerente' ou usuário com perfil 'lider' vinculado a esta loja)
    // 3. Fallback: contato do cliente (se tiver email) ou admin
    const emailsDestinatarios = new Set()
    const destinatariosDetalhes = []

    // 1. Regional
    if (lojaEfetiva) {
      const emailReg = extractEmail(lojaEfetiva.getString('email_regional'))
      if (emailReg) {
        emailsDestinatarios.add(emailReg)
        destinatariosDetalhes.push({ address: emailReg, name: `Regional - ${lojaNome}` })
      }
    }

    // 2. Gerente da loja (buscar nos funcionários desta loja)
    if (lojaEfetiva) {
      const funcsDaLoja = funcionarios.filter((fc) => fc.getString('loja') === lojaEfetiva.id)
      for (let f = 0; f < funcsDaLoja.length; f++) {
        const fc = funcsDaLoja[f]
        const funcaoId = fc.getString('funcao')
        const funcaoObj = funcoesMap[funcaoId]
        const funcaoNome = funcaoObj ? (funcaoObj.getString('nome') || '').toLowerCase() : ''
        const fcNome = fc.getString('nome')

        // Se a função indica Gerência / Gerente / Líder de Loja
        const isGerente =
          funcaoNome.includes('gerente') ||
          funcaoNome.includes('lider') ||
          funcaoNome.includes('líder') ||
          funcaoNome.includes('encarregado geral')

        if (isGerente) {
          const userId = fc.getString('usuario')
          if (userId && usersMap[userId]) {
            const userObj = usersMap[userId]
            const uEmail = extractEmail(userObj.getString('email'))
            if (uEmail && !emailsDestinatarios.has(uEmail)) {
              emailsDestinatarios.add(uEmail)
              destinatariosDetalhes.push({ address: uEmail, name: fcNome || `Gerente ${lojaNome}` })
            }
          }
        }
      }

      // Se ainda não achou gerente por cargo, procurar qualquer funcionário com login na loja
      if (destinatariosDetalhes.length === 0) {
        for (let f = 0; f < funcsDaLoja.length; f++) {
          const userId = funcsDaLoja[f].getString('usuario')
          if (userId && usersMap[userId]) {
            const userObj = usersMap[userId]
            const uEmail = extractEmail(userObj.getString('email'))
            if (uEmail && !emailsDestinatarios.has(uEmail)) {
              emailsDestinatarios.add(uEmail)
              destinatariosDetalhes.push({
                address: uEmail,
                name: funcsDaLoja[f].getString('nome'),
              })
            }
          }
        }
      }
    }

    // 3. Fallback: se nenhum regional ou gerente for encontrado, tentar contato do cliente
    if (destinatariosDetalhes.length === 0 && cliente) {
      const emailCli = extractEmail(cliente.getString('contato'))
      if (emailCli && !emailsDestinatarios.has(emailCli)) {
        emailsDestinatarios.add(emailCli)
        destinatariosDetalhes.push({ address: emailCli, name: clienteNome })
      }
    }

    // Se ainda assim não houver NENHUM destinatário válido, pular a loja com log claro
    if (destinatariosDetalhes.length === 0) {
      console.log(
        `[AlertaRotinas] Loja "${lojaNome}" possui ${atrasadas.length} rotina(s) atrasada(s), mas nenhum destinatário (gerente/regional/cliente) foi encontrado. Pulando com log.`,
      )
      continue
    }

    // Montar assunto e corpo do e-mail consolidado
    // Assunto claro: "[VivaVarejo] Rotina não realizada — Loja X — 10:00" ou consolidado se houver várias
    let subject = ''
    if (atrasadas.length === 1) {
      const rUnica = atrasadas[0]
      subject = `[VivaVarejo] Rotina não realizada — ${lojaNome} — ${rUnica.horarioLimite}`
    } else {
      subject = `[VivaVarejo] ${atrasadas.length} rotinas não realizadas no horário — ${lojaNome} — ${currentHourFormatted}`
    }

    // Linhas da tabela de rotinas atrasadas
    let rotinasHtml = ''
    for (let rIdx = 0; rIdx < atrasadas.length; rIdx++) {
      const item = atrasadas[rIdx]
      rotinasHtml += `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px 14px; font-weight: 700; color: #1F2937;">
            ${escapeHtml(item.nome)}
            <div style="font-size: 11px; font-weight: normal; color: #6B7280; margin-top: 2px;">
              Validação: ${escapeHtml(item.validacao)}
            </div>
          </td>
          <td style="padding: 12px 14px; color: #4B5563;">${escapeHtml(item.area)}</td>
          <td style="padding: 12px 14px; color: #4B5563;">${escapeHtml(item.responsavel)}</td>
          <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #B91C1C;">
            ${escapeHtml(item.horarioLimite)}
          </td>
          <td style="padding: 12px 14px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background-color: #FEE2E2; color: #B91C1C;">
              Atrasada
            </span>
          </td>
        </tr>
      `
    }

    // Template HTML sóbrio na paleta institucional (fundo #F7F7F5, texto #1F2937, azul #2563EB, bordas #E5E7EB, sem gradientes)
    const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Alerta Operacional - Rotina não realizada</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">

    <!-- Cabeçalho Institucional -->
    <div style="background: #FFFFFF; border-bottom: 2px solid #2563EB; padding: 24px 28px;">
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">VIVAVAREJO</div>
      <div style="font-size: 16px; font-weight: 700; color: #1F2937; margin-top: 6px;">
        Alerta Imediato: Rotina(s) não realizada(s) no horário
      </div>
      <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
        Unidade: <strong>${escapeHtml(lojaNome)}</strong> ${lojaCodigo ? `(${escapeHtml(lojaCodigo)})` : ''} • Rede: ${escapeHtml(clienteNome)} • Horário da verificação: ${currentHourFormatted} (horário de Brasília)
      </div>
    </div>

    <div style="padding: 24px 28px;">

      <!-- Banner de Alerta -->
      <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-left: 4px solid #B91C1C; border-radius: 6px; padding: 14px 16px; margin-bottom: 22px;">
        <div style="font-size: 13px; font-weight: 700; color: #991B1B;">
          Atenção Gerência & Regional da Loja
        </div>
        <div style="font-size: 12px; color: #7F1D1D; line-height: 1.5; margin-top: 4px;">
          O horário limite programado para a(s) tarefa(s) abaixo foi ultrapassado sem registro de conclusão no sistema. Por favor, alinhe com os responsáveis operacionais imediatamente.
        </div>
      </div>

      <!-- Tabela de Rotinas Atrasadas -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Rotina(s) com Horário Limite Expirado
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F7F7F5; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
              <th style="padding: 10px 14px; text-align: left; font-weight: 700;">Rotina</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700;">Área</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700;">Responsável</th>
              <th style="padding: 10px 14px; text-align: center; font-weight: 700;">Horário Limite</th>
              <th style="padding: 10px 14px; text-align: center; font-weight: 700;">Situação</th>
            </tr>
          </thead>
          <tbody>
            ${rotinasHtml}
          </tbody>
        </table>
      </div>

      <!-- Orientação Operacional -->
      <div style="background: #F7F7F5; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #4B5563; line-height: 1.5; margin-bottom: 20px;">
        <strong>Como regularizar:</strong> Assim que a equipe concluir a execução física da rotina, marque a tarefa como concluída no VivaVarejo. Este alerta não será repetido para esta rotina no dia de hoje.
      </div>

      <!-- Rodapé Institucional -->
      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #6B7280; text-align: center; line-height: 1.5;">
        Este e-mail é um alerta automático gerado pelo sistema de auditoria <strong>VivaVarejo</strong>.<br>
        Destinatários: ${destinatariosDetalhes.map((d) => escapeHtml(d.address)).join(', ')}.<br>
        Para ajustar as notificações ou e-mails de destino, acesse o <em>Painel Administrativo &gt; Painel Gerencial &gt; Alertas de Rotinas Atrasadas</em>.
      </div>

    </div>
  </div>
</body>
</html>
    `

    // Envio do e-mail via mailer PocketBase com proteção total
    try {
      const senderAddress = $app.settings().meta.senderAddress || 'no-reply@vivavarejo.com.br'
      const senderName = $app.settings().meta.senderName || 'VivaVarejo Alertas'

      const message = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: destinatariosDetalhes,
        subject: subject,
        html: htmlBody,
      })

      $app.newMailClient().send(message)
      totalEmailsEnviados++

      console.log(
        `[AlertaRotinas] Alerta enviado com sucesso para ${destinatariosDetalhes.length} destinatário(s) da loja "${lojaNome}".`,
      )

      // Marcar anti-duplicidade em cada rotina alertada
      for (let rIdx = 0; rIdx < atrasadas.length; rIdx++) {
        try {
          const rec = atrasadas[rIdx].record
          rec.set('alerta_enviado_em', `${todayStr} ${currentHourFormatted}`)
          $app.save(rec)
        } catch (saveErr) {
          console.error(
            `[AlertaRotinas] Erro ao marcar alerta_enviado_em na rotina ${atrasadas[rIdx].record.id}:`,
            saveErr,
          )
        }
      }
    } catch (sendErr) {
      console.error(
        `[AlertaRotinas] Falha ao enviar e-mail de alerta para a loja "${lojaNome}":`,
        sendErr,
      )
    }
  }

  console.log(
    `[AlertaRotinas] Varredura finalizada. Total de e-mails enviados: ${totalEmailsEnviados}.`,
  )
})
