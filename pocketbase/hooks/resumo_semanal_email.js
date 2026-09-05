// Job agendado semanal: Envio automático de resumo semanal por e-mail para clientes
// Executa toda segunda-feira às 06:30 (horário de Brasília, 09:30 UTC: '30 9 * * 1')
// NOTA IMPORTANTE JSVM: Em hooks do PocketBase, callbacks executam em VM isolada.
// Toda a lógica e funções auxiliares DEVEM estar inline dentro do callback do cronAdd.

cronAdd('resumo_semanal_clientes', '30 9 * * 1', () => {
  console.log('[ResumoSemanal] Iniciando job semanal de envio de relatórios aos clientes...')

  // Extração segura de e-mail de strings livres (ex: "contato@cliente.com" ou "Fulano (email@cliente.com)")
  const extractEmail = (str) => {
    if (!str) return null
    const match = String(str).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    return match ? match[0].trim().toLowerCase() : null
  }

  // Escape simples de HTML
  const escapeHtml = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Buscar todos os clientes
  let clientes = []
  try {
    clientes = $app.findRecordsByFilter('clientes', '', 'nome', 500, 0)
  } catch (err) {
    console.error('[ResumoSemanal] Erro ao buscar clientes:', err)
    return
  }

  if (!clientes || clientes.length === 0) {
    console.log('[ResumoSemanal] Nenhum cliente cadastrado. Finalizando job.')
    return
  }

  // Intervalo dos últimos 7 dias (formato YYYY-MM-DD)
  const now = new Date()
  const d7 = new Date(now.getTime())
  d7.setDate(d7.getDate() - 6)
  const dateMinStr = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`

  // Carregar todas as lojas e rotinas para agregação em memória
  let allLojas = []
  try {
    allLojas = $app.findRecordsByFilter('lojas', '', '', 1000, 0)
  } catch (_) {}

  let allRotinas = []
  try {
    allRotinas = $app.findRecordsByFilter('rotinas', '', '', 2000, 0)
  } catch (_) {}

  // Carregar execuções dos últimos 7 dias
  let allExecucoes = []
  try {
    allExecucoes = $app.findRecordsByFilter(
      'execucoes_rotinas',
      `data_execucao >= "${dateMinStr} 00:00:00" && concluida = true`,
      '-created',
      5000,
      0,
    )
  } catch (_) {}

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  let totalEmailsEnviados = 0

  for (let i = 0; i < clientes.length; i++) {
    const cliente = clientes[i]
    const clienteId = cliente.id
    const clienteNome = cliente.getString('nome')
    const clienteContato = cliente.getString('contato')
    const envioAtivo = cliente.getBool('envio_semanal')

    // Se o cliente desativou explicitamente o envio, pular
    if (envioAtivo === false) {
      console.log(
        `[ResumoSemanal] Cliente "${clienteNome}" (${clienteId}) está com envio desativado. Pulando.`,
      )
      continue
    }

    const emailDestino = extractEmail(clienteContato)
    if (!emailDestino) {
      console.log(
        `[ResumoSemanal] Cliente "${clienteNome}" (${clienteId}) não possui e-mail válido no contato ("${clienteContato}"). Pulando.`,
      )
      continue
    }

    // Lojas deste cliente
    const lojasCliente = allLojas.filter((l) => l.getString('cliente') === clienteId)
    const lojasClienteIds = new Set(lojasCliente.map((l) => l.id))

    // Rotinas vinculadas às lojas deste cliente
    // Se não há lojas cadastradas ou rotinas vinculadas, verificar se há rotinas sem loja (compatibilidade global se único cliente)
    let rotinasCliente = allRotinas.filter((r) => {
      const lojaId = r.getString('loja')
      if (lojaId) return lojasClienteIds.has(lojaId)
      // Se a rotina não tem loja definida, associar apenas se o cliente tiver ao menos uma loja ou for o único
      return clientes.length === 1
    })

    // Proteção contra execução sem dados: se o cliente não tiver rotinas, pular
    if (rotinasCliente.length === 0) {
      console.log(
        `[ResumoSemanal] Cliente "${clienteNome}" (${clienteId}) não possui rotinas mapeadas. Pulando.`,
      )
      continue
    }

    const rotinasClienteIds = new Set(rotinasCliente.map((r) => r.id))
    const totalRotinas = rotinasCliente.length

    // Execuções filtradas deste cliente
    const execucoesCliente = allExecucoes.filter((e) => {
      const rotinaId = e.getString('rotina')
      return rotinasClienteIds.has(rotinaId)
    })

    // 1. % de execução por dia da semana (últimos 7 dias)
    const execPorDia = []
    let somaTaxaSemana = 0
    for (let dIdx = 6; dIdx >= 0; dIdx--) {
      const diaObj = new Date(now.getTime())
      diaObj.setDate(diaObj.getDate() - dIdx)
      const diaStr = `${diaObj.getFullYear()}-${String(diaObj.getMonth() + 1).padStart(2, '0')}-${String(diaObj.getDate()).padStart(2, '0')}`
      const dayLabel = `${weekDayNames[diaObj.getDay()]} ${String(diaObj.getDate()).padStart(2, '0')}/${String(diaObj.getMonth() + 1).padStart(2, '0')}`

      const dayExecs = execucoesCliente.filter((e) => {
        const d = e.getString('data_execucao')
        return d && d.startsWith(diaStr)
      })

      const uniqueRots = new Set(dayExecs.map((e) => e.getString('rotina'))).size
      const taxaDia = totalRotinas > 0 ? Math.round((uniqueRots / totalRotinas) * 100) : 0
      somaTaxaSemana += taxaDia
      execPorDia.push({
        label: dayLabel,
        concluidas: uniqueRots,
        esperadas: totalRotinas,
        taxa: Math.min(100, taxaDia),
      })
    }

    const taxaMediaSemana = Math.round(somaTaxaSemana / 7)
    const totalEsperadoSemana = totalRotinas * 7
    const totalExecutadoSemana = execucoesCliente.length

    // 2. % de execução por área
    const rotinasPorArea = {}
    rotinasCliente.forEach((r) => {
      const area = (r.getString('area') || 'Geral').trim()
      if (!rotinasPorArea[area]) rotinasPorArea[area] = []
      rotinasPorArea[area].push(r)
    })

    const areasPerformance = []
    Object.keys(rotinasPorArea).forEach((area) => {
      const rots = rotinasPorArea[area]
      const areaRotIds = new Set(rots.map((r) => r.id))
      const esperado = rots.length * 7
      const execs = execucoesCliente.filter((e) => areaRotIds.has(e.getString('rotina'))).length
      const taxa = esperado > 0 ? Math.min(100, Math.round((execs / esperado) * 100)) : 0
      areasPerformance.push({
        area,
        totalRotinas: rots.length,
        executadas: execs,
        esperadas: esperado,
        taxa,
      })
    })
    areasPerformance.sort((a, b) => a.taxa - b.taxa)

    // 3. % de execução por líder / responsável
    const rotinasPorLider = {}
    rotinasCliente.forEach((r) => {
      const resp = (r.getString('responsavel') || 'Não atribuído').trim()
      if (!rotinasPorLider[resp]) rotinasPorLider[resp] = []
      rotinasPorLider[resp].push(r)
    })

    const lideresPerformance = []
    Object.keys(rotinasPorLider).forEach((resp) => {
      const rots = rotinasPorLider[resp]
      const respRotIds = new Set(rots.map((r) => r.id))
      const esperado = rots.length * 7
      const execs = execucoesCliente.filter((e) => respRotIds.has(e.getString('rotina'))).length
      const taxa = esperado > 0 ? Math.min(100, Math.round((execs / esperado) * 100)) : 0
      lideresPerformance.push({
        responsavel: resp,
        totalRotinas: rots.length,
        executadas: execs,
        esperadas: esperado,
        taxa,
      })
    })
    lideresPerformance.sort((a, b) => b.taxa - a.taxa)

    // 4. Ranking de Lojas (melhor e pior loja)
    const lojasPerformance = []
    lojasCliente.forEach((loja) => {
      const rotsLoja = rotinasCliente.filter((r) => r.getString('loja') === loja.id)
      if (rotsLoja.length === 0) return
      const rotsLojaIds = new Set(rotsLoja.map((r) => r.id))
      const esperado = rotsLoja.length * 7
      const execs = execucoesCliente.filter((e) => rotsLojaIds.has(e.getString('rotina'))).length
      const taxa = esperado > 0 ? Math.min(100, Math.round((execs / esperado) * 100)) : 0
      lojasPerformance.push({
        id: loja.id,
        nome: loja.getString('nome'),
        codigo: loja.getString('codigo'),
        rotinasCount: rotsLoja.length,
        taxa,
      })
    })
    lojasPerformance.sort((a, b) => b.taxa - a.taxa)

    let melhorLoja = null
    let piorLoja = null
    if (lojasPerformance.length > 1) {
      melhorLoja = lojasPerformance[0]
      piorLoja = lojasPerformance[lojasPerformance.length - 1]
    } else if (lojasPerformance.length === 1) {
      melhorLoja = lojasPerformance[0]
    }

    // 5. Rotinas com menor taxa na semana (rotinas mais atrasadas / menos executadas)
    const rotinaStats = rotinasCliente.map((r) => {
      const rExecs = execucoesCliente.filter((e) => e.getString('rotina') === r.id).length
      const taxa = Math.min(100, Math.round((rExecs / 7) * 100))
      return {
        id: r.id,
        nome: r.getString('nome'),
        responsavel: r.getString('responsavel') || 'Geral',
        area: r.getString('area') || 'Geral',
        horario_limite: r.getString('horario_limite') || '—',
        execs: rExecs,
        taxa,
      }
    })
    rotinaStats.sort((a, b) => a.taxa - b.taxa)
    const rotinasMaisAtrasadas = rotinaStats.filter((r) => r.taxa < 70).slice(0, 5)

    // 6. 2-3 Propostas de Melhoria geradas a partir dos dados (lógica do Painel Gerencial)
    const propostas = []

    // Proposta A: Área com menor taxa
    const areasCriticas = areasPerformance.filter((a) => a.taxa < 70)
    if (areasCriticas.length > 0) {
      const piorArea = areasCriticas[0]
      propostas.push({
        categoria: 'Gestão Setorial',
        titulo: `Revisar rotinas e alinhamento na área "${piorArea.area}"`,
        sugestao: `Agendar alinhamento semanal com a equipe de ${piorArea.area} e verificar se ferramentas operacionais estão disponíveis.`,
        evidencia: `Adesão semanal de apenas ${piorArea.taxa}% (${piorArea.executadas}/${piorArea.esperadas} execuções).`,
        impacto: 'Alto',
      })
    }

    // Proposta B: Líder com sobrecarga ou baixa taxa
    if (lideresPerformance.length > 0) {
      const liderCritico = lideresPerformance.find((l) => l.taxa < 70 && l.totalRotinas >= 3)
      if (liderCritico) {
        propostas.push({
          categoria: 'Distribuição de Carga',
          titulo: `Redistribuir responsabilidades de "${liderCritico.responsavel}"`,
          sugestao: `Descentralizar rotinas secundárias para assistentes ou operadores para manter as rotinas críticas no prazo.`,
          evidencia: `Concentra ${liderCritico.totalRotinas} rotinas diárias com taxa semanal de ${liderCritico.taxa}%.`,
          impacto: 'Médio',
        })
      }
    }

    // Proposta C: Benchmarking de Lojas (se houver discrepância)
    if (
      melhorLoja &&
      piorLoja &&
      melhorLoja.id !== piorLoja.id &&
      melhorLoja.taxa - piorLoja.taxa >= 15
    ) {
      propostas.push({
        categoria: 'Benchmarking Interno',
        titulo: `Replicar práticas da unidade ${melhorLoja.nome}`,
        sugestao: `Realizar alinhamento entre gerentes para replicar a rotina de validação da loja líder na unidade de menor adesão.`,
        evidencia: `Diferença de ${melhorLoja.taxa - piorLoja.taxa} p.p. entre ${melhorLoja.nome} (${melhorLoja.taxa}%) e ${piorLoja.nome} (${piorLoja.taxa}%).`,
        impacto: 'Alto',
      })
    }

    // Proposta D: Rotinas de abertura/manhã
    if (propostas.length < 2 && rotinasMaisAtrasadas.length > 0) {
      const rotEx = rotinasMaisAtrasadas[0]
      propostas.push({
        categoria: 'Rotinas Críticas',
        titulo: `Acompanhamento pontual de "${rotEx.nome}"`,
        sugestao: `Revisar horário limite (${rotEx.horario_limite}) e reforçar a conferência com o responsável (${rotEx.responsavel}).`,
        evidencia: `Taxa semanal de apenas ${rotEx.taxa}% (${rotEx.execs}/7 dias executados).`,
        impacto: 'Médio',
      })
    }

    // Proposta padrão se tudo estiver perfeito
    if (propostas.length === 0) {
      propostas.push({
        categoria: 'Manutenção de Padrão',
        titulo: 'Sustentabilidade operacional e auditoria por amostragem',
        sugestao:
          'Manter a cadência de validações operacionais e realizar checagens por amostragem durante a semana.',
        evidencia: `Operação estável com taxa média semanal de ${taxaMediaSemana}%.`,
        impacto: 'Médio',
      })
    }

    // 7. Montar HTML sóbrio (paleta off-white #F7F7F5, texto #1F2937, azul #2563EB, cinza #E5E7EB, sem gradientes)
    let diasHtml = ''
    execPorDia.forEach((d) => {
      diasHtml += `
        <td style="padding: 10px 6px; text-align: center; border: 1px solid #E5E7EB; background: #FFFFFF;">
          <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">${escapeHtml(d.label)}</div>
          <div style="font-size: 14px; font-weight: bold; color: ${d.taxa < 70 ? '#B91C1C' : '#2563EB'};">${d.taxa}%</div>
          <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">${d.concluidas}/${d.esperadas}</div>
        </td>
      `
    })

    let areasHtml = ''
    areasPerformance.forEach((a) => {
      areasHtml += `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 12px; font-weight: 600; color: #1F2937;">${escapeHtml(a.area)}</td>
          <td style="padding: 8px 12px; text-align: center; color: #4B5563;">${a.totalRotinas}</td>
          <td style="padding: 8px 12px; text-align: center; color: #4B5563;">${a.executadas}/${a.esperadas}</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: ${a.taxa < 70 ? '#B91C1C' : '#2563EB'};">${a.taxa}%</td>
        </tr>
      `
    })

    let lideresHtml = ''
    lideresPerformance.slice(0, 6).forEach((l) => {
      lideresHtml += `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 12px; font-weight: 600; color: #1F2937;">${escapeHtml(l.responsavel)}</td>
          <td style="padding: 8px 12px; text-align: center; color: #4B5563;">${l.totalRotinas}</td>
          <td style="padding: 8px 12px; text-align: center; color: #4B5563;">${l.executadas}/${l.esperadas}</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: ${l.taxa < 70 ? '#B91C1C' : '#2563EB'};">${l.taxa}%</td>
        </tr>
      `
    })

    let lojasHtml = ''
    if (lojasPerformance.length > 0) {
      lojasPerformance.forEach((lj, idx) => {
        lojasHtml += `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px 12px; font-weight: 600; color: #1F2937;">${idx + 1}. ${escapeHtml(lj.nome)} ${lj.codigo ? `(${escapeHtml(lj.codigo)})` : ''}</td>
            <td style="padding: 8px 12px; text-align: center; color: #4B5563;">${lj.rotinasCount}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: ${lj.taxa < 70 ? '#B91C1C' : '#2563EB'};">${lj.taxa}%</td>
          </tr>
        `
      })
    }

    let atrasadasHtml = ''
    if (rotinasMaisAtrasadas.length > 0) {
      rotinasMaisAtrasadas.forEach((r) => {
        atrasadasHtml += `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px 12px; font-weight: 600; color: #1F2937;">${escapeHtml(r.nome)}</td>
            <td style="padding: 8px 12px; color: #4B5563;">${escapeHtml(r.responsavel)}</td>
            <td style="padding: 8px 12px; color: #4B5563;">${escapeHtml(r.area)}</td>
            <td style="padding: 8px 12px; text-align: center; color: #4B5563;">${escapeHtml(r.horario_limite)}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #B91C1C;">${r.taxa}% (${r.execs}/7)</td>
          </tr>
        `
      })
    }

    let propostasHtml = ''
    propostas.forEach((p) => {
      propostasHtml += `
        <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-left: 4px solid #2563EB; border-radius: 4px; padding: 12px 14px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4B5563; background: #F3F4F6; padding: 2px 6px; border-radius: 3px;">${escapeHtml(p.categoria)}</span>
            <span style="font-size: 11px; font-weight: 700; color: #2563EB;">Impacto ${escapeHtml(p.impacto)}</span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #1F2937; margin: 4px 0;">${escapeHtml(p.titulo)}</div>
          <div style="font-size: 12px; color: #374151; line-height: 1.5; margin-bottom: 6px;">${escapeHtml(p.sugestao)}</div>
          <div style="font-size: 11px; color: #6B7280;"><strong>Evidência dos dados:</strong> ${escapeHtml(p.evidencia)}</div>
        </div>
      `
    })

    const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Resumo Operacional Semanal - ${escapeHtml(clienteNome)}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">

    <!-- Cabeçalho Institucional -->
    <div style="background: #FFFFFF; border-bottom: 2px solid #2563EB; padding: 24px 28px;">
      <div style="font-size: 20px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">VIVAVAREJO</div>
      <div style="font-size: 15px; font-weight: 700; color: #1F2937; margin-top: 4px;">Resumo Operacional Semanal — ${escapeHtml(clienteNome)}</div>
      <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
        Período: últimos 7 dias (fechamento em ${now.toLocaleDateString('pt-BR')}) • Envio automático agendado
      </div>
    </div>

    <div style="padding: 24px 28px;">

      <!-- Quadro de KPIs Consolidados -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="width: 33.3%; padding: 14px; background: #F7F7F5; border: 1px solid #E5E7EB; border-radius: 6px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">Rotinas Mapeadas</div>
            <div style="font-size: 24px; font-weight: 800; color: #1F2937; margin-top: 4px;">${totalRotinas}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">nas lojas da rede</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="width: 33.3%; padding: 14px; background: #F7F7F5; border: 1px solid #E5E7EB; border-radius: 6px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">Taxa Média Semanal</div>
            <div style="font-size: 24px; font-weight: 800; color: ${taxaMediaSemana < 70 ? '#B91C1C' : '#2563EB'}; margin-top: 4px;">${taxaMediaSemana}%</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">meta padrão: 85%</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="width: 33.3%; padding: 14px; background: #F7F7F5; border: 1px solid #E5E7EB; border-radius: 6px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">Execuções Totais</div>
            <div style="font-size: 24px; font-weight: 800; color: #1F2937; margin-top: 4px;">${totalExecutadoSemana}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">de ${totalEsperadoSemana} esperadas</div>
          </td>
        </tr>
      </table>

      <!-- 1. Execução por Dia da Semana -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          1. Execução Diária dos Últimos 7 Dias
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${diasHtml}
          </tr>
        </table>
      </div>

      <!-- 2. Execução por Área Operacional -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          2. Desempenho por Área Operacional
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F7F7F5; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Área</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700;">Rotinas</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700;">Execuções / Esperadas</th>
              <th style="padding: 8px 12px; text-align: right; font-weight: 700;">% Semanal</th>
            </tr>
          </thead>
          <tbody>
            ${areasHtml}
          </tbody>
        </table>
      </div>

      <!-- 3. Execução por Líder / Responsável -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          3. Desempenho por Líder / Responsável
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F7F7F5; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Líder / Responsável</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700;">Rotinas</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700;">Execuções / Esperadas</th>
              <th style="padding: 8px 12px; text-align: right; font-weight: 700;">% Semanal</th>
            </tr>
          </thead>
          <tbody>
            ${lideresHtml}
          </tbody>
        </table>
      </div>

      <!-- 4. Ranking de Lojas (se houver mais de uma ou loja cadastrada) -->
      ${
        lojasHtml
          ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          4. Ranking de Lojas da Rede
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F7F7F5; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Unidade</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700;">Rotinas</th>
              <th style="padding: 8px 12px; text-align: right; font-weight: 700;">% Semanal</th>
            </tr>
          </thead>
          <tbody>
            ${lojasHtml}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <!-- 5. Rotinas Mais Atrasadas / Críticas -->
      ${
        atrasadasHtml
          ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #B91C1C; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          5. Rotinas com Menor Adesão na Semana (Abaixo de 70%)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #E5E7EB;">
          <thead>
            <tr style="background: #F7F7F5; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Rotina</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Responsável</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Área</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700;">Horário</th>
              <th style="padding: 8px 12px; text-align: right; font-weight: 700;">% Adesão</th>
            </tr>
          </thead>
          <tbody>
            ${atrasadasHtml}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <!-- 6. Propostas de Melhoria Baseadas nos Dados -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          6. Propostas de Melhoria Operacional
        </div>
        ${propostasHtml}
      </div>

      <!-- Rodapé Institucional -->
      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #6B7280; text-align: center; line-height: 1.5;">
        Este e-mail foi gerado automaticamente pelo sistema <strong>VivaVarejo</strong>.<br>
        Para ajustar a frequência ou desativar este relatório, acesse o <em>Painel Gerencial &gt; Configurações</em> ou contate seu consultor.
      </div>

    </div>
  </div>
</body>
</html>
    `

    // Envio do e-mail via mailer PocketBase com proteção total
    try {
      const senderAddress = $app.settings().meta.senderAddress || 'no-reply@vivavarejo.com.br'
      const senderName = $app.settings().meta.senderName || 'VivaVarejo Operações'

      const message = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: emailDestino, name: clienteNome }],
        subject: `VivaVarejo: Resumo Semanal de Execução — ${clienteNome}`,
        html: htmlBody,
      })

      $app.newMailClient().send(message)
      totalEmailsEnviados++
      console.log(
        `[ResumoSemanal] Relatório enviado com sucesso para "${clienteNome}" <${emailDestino}>.`,
      )
    } catch (sendErr) {
      console.error(
        `[ResumoSemanal] Falha ao enviar e-mail para "${clienteNome}" <${emailDestino}>:`,
        sendErr,
      )
    }
  }

  console.log(
    `[ResumoSemanal] Job finalizado. Total de e-mails processados: ${totalEmailsEnviados}.`,
  )
})
