// Job agendado frequente: Verificação a cada 5 minutos de rotinas e visitas de promotores atrasadas e envio imediato de alerta por e-mail
// Executa a cada 5 minutos: '*/5 * * * *'
// NOTA IMPORTANTE JSVM: Em hooks do PocketBase, callbacks executam em VM isolada.
// Toda a lógica e funções auxiliares DEVEM estar inline dentro do callback do cronAdd.
// Utiliza $app para todas as operações de banco de dados.

cronAdd('alerta_rotinas_atrasadas', '*/5 * * * *', () => {
  console.log(
    '[AlertaRotinas] Iniciando varredura a cada 5 minutos de rotinas e visitas em atraso...',
  )

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
  const todayStr = `${brasilTime.getUTCFullYear()}-${String(brasilTime.getUTCMonth() + 1).padStart(2, '0')}-${String(brasilTime.getUTCDate()).padStart(2, '0')}`

  // Buscar todas as lojas cadastradas
  let lojas = []
  try {
    lojas = $app.findRecordsByFilter('lojas', '', 'nome', 1000, 0)
  } catch (err) {
    console.error('[AlertaRotinas] Erro ao carregar lojas:', err)
    return
  }

  // Buscar todos os clientes (para obter nome e contato)
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

  // Buscar execuções de hoje (concluídas e NÃO devolvidas)
  let execucoesHoje = []
  try {
    execucoesHoje = $app.findRecordsByFilter(
      'execucoes_rotinas',
      `data_execucao >= "${todayStr} 00:00:00" && concluida = true && status_validacao != "devolvida"`,
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
  }

  // Buscar todas as visitas de promotor (não canceladas e não realizadas)
  let visitas = []
  try {
    visitas = $app.findRecordsByFilter(
      'visitas_promotor',
      'status != "cancelada" && status != "realizada"',
      'data_visita,hora_prevista',
      3000,
      0,
    )
  } catch (err) {
    console.error('[AlertaRotinas] Erro ao carregar visitas_promotor:', err)
  }

  // Buscar promotores e fornecedores para montar o resumo da visita
  let promotoresMap = {}
  try {
    const promList = $app.findRecordsByFilter('promotores', '', 'nome', 1000, 0)
    for (let i = 0; i < promList.length; i++) {
      promotoresMap[promList[i].id] = promList[i]
    }
  } catch (_) {}

  let fornecedoresMap = {}
  try {
    const fornList = $app.findRecordsByFilter('fornecedores', '', 'nome', 1000, 0)
    for (let i = 0; i < fornList.length; i++) {
      fornecedoresMap[fornList[i].id] = fornList[i]
    }
  } catch (_) {}

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

    // Anti-duplicidade: verificar se já gerou alerta hoje (formato YYYY-MM-DD...)
    const alertaEnviadoEm = r.getString('alerta_enviado_em')
    if (alertaEnviadoEm && alertaEnviadoEm.startsWith(todayStr)) {
      continue
    }

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

  // Identificar visitas de promotores atrasadas que ainda NÃO tiveram alerta disparado hoje
  const visitasAtrasadasPorLoja = {} // lojaId -> Array de visitas atrasadas

  for (let i = 0; i < visitas.length; i++) {
    const v = visitas[i]

    // Anti-duplicidade: verificar se já gerou alerta hoje
    const alertaVisitaEm = v.getString('alerta_enviado_em')
    if (alertaVisitaEm && alertaVisitaEm.startsWith(todayStr)) {
      continue
    }

    const dataVisitaRaw = v.getString('data_visita')
    const dataVisitaStr = dataVisitaRaw ? dataVisitaRaw.substring(0, 10) : ''
    if (!dataVisitaStr) continue

    const horaPrevistaStr = (v.getString('hora_prevista') || '').trim()

    let isAtrasada = false
    let detalheHorario = ''

    if (dataVisitaStr < todayStr) {
      // Visita em dia anterior não realizada
      isAtrasada = true
      detalheHorario = `${dataVisitaStr.split('-').reverse().join('/')}${horaPrevistaStr ? ` às ${horaPrevistaStr}` : ''}`
    } else if (dataVisitaStr === todayStr) {
      // Visita para hoje: checar se hora_prevista expirou
      if (horaPrevistaStr) {
        const colonMatch = horaPrevistaStr.match(/^(\d{1,2}):(\d{2})/)
        if (colonMatch) {
          const h = parseInt(colonMatch[1], 10)
          const m = parseInt(colonMatch[2], 10)
          if (!isNaN(h) && !isNaN(m)) {
            const scheduledMinutes = h * 60 + m
            if (currentMinutes > scheduledMinutes) {
              isAtrasada = true
              detalheHorario = `Hoje às ${horaPrevistaStr}`
            }
          }
        }
      }
    }

    if (isAtrasada) {
      const lojaId = v.getString('loja') || '_sem_loja_'
      if (!visitasAtrasadasPorLoja[lojaId]) {
        visitasAtrasadasPorLoja[lojaId] = []
      }

      const promId = v.getString('promotor')
      const promObj = promId ? promotoresMap[promId] : null
      const promNome = promObj ? promObj.getString('nome') : 'Promotor'
      const fornId = promObj ? promObj.getString('fornecedor') : ''
      const fornObj = fornId ? fornecedoresMap[fornId] : null
      const fornNome = fornObj ? fornObj.getString('nome') : 'Fornecedor'

      visitasAtrasadasPorLoja[lojaId].push({
        record: v,
        promotorNome: promNome,
        fornecedorNome: fornNome,
        detalheHorario: detalheHorario,
        observacoes: v.getString('observacoes') || '—',
      })
    }
  }

  // Agrupar lojas que possuem ou rotinas atrasadas OU visitas de promotor atrasadas
  const todasLojasComAtraso = new Set([
    ...Object.keys(atrasadasPorLoja),
    ...Object.keys(visitasAtrasadasPorLoja),
  ])

  const lojaIdsComAtraso = Array.from(todasLojasComAtraso)
  if (lojaIdsComAtraso.length === 0) {
    console.log(
      '[AlertaRotinas] Nenhuma rotina ou visita de promotor pendente em atraso nesta verificação.',
    )
    return
  }

  console.log(
    `[AlertaRotinas] Encontradas pendências em atraso em ${lojaIdsComAtraso.length} grupo(s) de lojas.`,
  )

  let totalEmailsEnviados = 0

  for (let lIdx = 0; lIdx < lojaIdsComAtraso.length; lIdx++) {
    const lojaId = lojaIdsComAtraso[lIdx]
    const atrasadas = atrasadasPorLoja[lojaId] || []
    const visitasAtrasadas = visitasAtrasadasPorLoja[lojaId] || []
    const loja = lojasMap[lojaId]

    // Se for registro sem loja vinculada e houver apenas 1 loja, associa a ela
    let lojaEfetiva = loja
    if (!lojaEfetiva && lojaId === '_sem_loja_' && lojas.length === 1) {
      lojaEfetiva = lojas[0]
    }

    const lojaNome = lojaEfetiva ? lojaEfetiva.getString('nome') : 'Loja Geral'
    const lojaCodigo = lojaEfetiva ? lojaEfetiva.getString('codigo') : ''
    const clienteId = lojaEfetiva ? lojaEfetiva.getString('cliente') : ''
    const cliente = clienteId ? clientesMap[clienteId] : null
    const clienteNome = cliente ? cliente.getString('nome') : 'VivaVarejo'

    // Blindagem 1: Verificar se os alertas estão ativos para esta loja
    // Regra: se alertas_ativos for explicitamente false, pular a loja com log
    if (lojaEfetiva && lojaEfetiva.getBool('alertas_ativos') === false) {
      console.log(
        `[AlertaRotinas] Loja "${lojaNome}" (${lojaEfetiva.id}) está com alertas_ativos = false. Pulando.`,
      )
      continue
    }

    // Determinar destinatários:
    // 1. Regional da loja (email_regional no registro da loja)
    // 2. Gerente da loja (funcionário com cargo contendo 'gerente' ou usuário com perfil 'lider' vinculado a esta loja)
    // 3. Fallback: contato do cliente (se tiver email)
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

    // Blindagem 2: Se não houver NENHUM destinatário válido, pular a loja com log claro
    if (destinatariosDetalhes.length === 0) {
      console.log(
        `[AlertaRotinas] Loja "${lojaNome}" possui pendências em atraso (${atrasadas.length} rotinas, ${visitasAtrasadas.length} visitas), mas nenhum destinatário (gerente/regional/cliente) foi encontrado. Pulando com log.`,
      )
      continue
    }

    // Montar assunto e corpo do e-mail consolidado
    let subject = ''
    if (visitasAtrasadas.length > 0 && atrasadas.length === 0) {
      subject = `[VivaVarejo] Visita de promotor atrasada — ${lojaNome}`
    } else if (atrasadas.length === 1 && visitasAtrasadas.length === 0) {
      const rUnica = atrasadas[0]
      subject = `[VivaVarejo] Rotina não realizada — ${lojaNome} — ${rUnica.horarioLimite}`
    } else if (visitasAtrasadas.length > 0 && atrasadas.length > 0) {
      subject = `[VivaVarejo] Rotinas e Visitas não realizadas — ${lojaNome}`
    } else {
      subject = `[VivaVarejo] Rotinas não realizadas — ${lojaNome}`
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

    // Linhas da tabela de visitas de promotores atrasadas
    let visitasHtml = ''
    for (let vIdx = 0; vIdx < visitasAtrasadas.length; vIdx++) {
      const vItem = visitasAtrasadas[vIdx]
      visitasHtml += `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px 14px; font-weight: 700; color: #1F2937;">
            ${escapeHtml(vItem.promotorNome)}
          </td>
          <td style="padding: 12px 14px; color: #2563EB; font-weight: 600;">
            ${escapeHtml(vItem.fornecedorNome)}
          </td>
          <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #B91C1C;">
            ${escapeHtml(vItem.detalheHorario)}
          </td>
          <td style="padding: 12px 14px; color: #6B7280; font-size: 11px;">
            ${escapeHtml(vItem.observacoes)}
          </td>
          <td style="padding: 12px 14px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background-color: #FEE2E2; color: #B91C1C;">
              Não realizada
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
  <title>Alerta Operacional - VivaVarejo</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">

    <!-- Cabeçalho Institucional -->
    <div style="background: #FFFFFF; border-bottom: 2px solid #2563EB; padding: 24px 28px;">
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">VIVAVAREJO</div>
      <div style="font-size: 16px; font-weight: 700; color: #1F2937; margin-top: 6px;">
        Alerta Operacional: Pendência(s) não realizada(s) no horário
      </div>
      <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
        Unidade: <strong>${escapeHtml(lojaNome)}</strong> ${lojaCodigo ? `(${escapeHtml(lojaCodigo)})` : ''} • Rede: ${escapeHtml(clienteNome)} • Horário da verificação: ${currentHourFormatted} (horário de Brasília)
      </div>
    </div>

    <div style="padding: 24px 28px;">

      <!-- Banner de Alerta Sóbrio -->
      <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-left: 4px solid #B91C1C; border-radius: 6px; padding: 14px 16px; margin-bottom: 22px;">
        <div style="font-size: 13px; font-weight: 700; color: #991B1B;">
          Atenção Gerência & Regional da Loja
        </div>
        <div style="font-size: 12px; color: #7F1D1D; line-height: 1.5; margin-top: 4px;">
          O horário programado para o(s) item(ns) abaixo foi ultrapassado sem registro de realização no sistema. Por favor, alinhe com os responsáveis operacionais imediatamente.
        </div>
      </div>

      ${
        atrasadas.length > 0
          ? `
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
      `
          : ''
      }

      ${
        visitasAtrasadas.length > 0
          ? `
      <!-- Tabela de Visitas de Promotores Atrasadas -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Visita(s) de Promotores com Horário Expirado
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F7F7F5; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
              <th style="padding: 10px 14px; text-align: left; font-weight: 700;">Promotor</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700;">Fornecedor</th>
              <th style="padding: 10px 14px; text-align: center; font-weight: 700;">Previsão</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700;">Observações</th>
              <th style="padding: 10px 14px; text-align: center; font-weight: 700;">Situação</th>
            </tr>
          </thead>
          <tbody>
            ${visitasHtml}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <!-- Orientação Operacional -->
      <div style="background: #F7F7F5; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #4B5563; line-height: 1.5; margin-bottom: 20px;">
        <strong>Como regularizar:</strong> Assim que a equipe ou o promotor concluir a atividade física na loja, registre a conclusão no VivaVarejo. Este alerta não será repetido para o mesmo item no dia de hoje.
      </div>

      <!-- Rodapé Institucional -->
      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #6B7280; text-align: center; line-height: 1.5;">
        Este e-mail é um alerta automático gerado pelo sistema de gestão operacional <strong>VivaVarejo</strong>.<br>
        Destinatários notificados: ${destinatariosDetalhes.map((d) => escapeHtml(d.address)).join(', ')}.<br>
        Para ajustar as notificações ou e-mails de destino, acesse o <em>Painel Administrativo &gt; Painel Gerencial &gt; Alertas de rotinas atrasadas</em>.
      </div>

    </div>
  </div>
</body>
</html>
    `

    // Envio do e-mail via mailer PocketBase com proteção total contra falhas
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

      // Marcar anti-duplicidade em cada rotina alertada (após envio bem-sucedido)
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

      // Marcar anti-duplicidade em cada visita de promotor alertada
      for (let vIdx = 0; vIdx < visitasAtrasadas.length; vIdx++) {
        try {
          const rec = visitasAtrasadas[vIdx].record
          rec.set('alerta_enviado_em', `${todayStr} ${currentHourFormatted}`)
          $app.save(rec)
        } catch (saveErr) {
          console.error(
            `[AlertaRotinas] Erro ao marcar alerta_enviado_em na visita ${visitasAtrasadas[vIdx].record.id}:`,
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
