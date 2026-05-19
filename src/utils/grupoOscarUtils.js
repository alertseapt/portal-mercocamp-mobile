/**
 * Utilitários para montagem da lista Grupo Oscar no frontend.
 * O backend envia orders e schedules; o frontend associa e calcula processo.
 */

/** Extrai timestamp ISO da última alteração de status no histórico do agendamento */
export function getLastStatusChangeFromScheduleHistoric(historic) {
  if (!historic) return null
  try {
    const h =
      typeof historic === 'string' ? JSON.parse(historic || '{}') : historic
    if (!h || typeof h !== 'object' || Array.isArray(h)) return null
    const entries = Object.values(h).filter(e => e && e.timestamp)
    if (entries.length === 0) return null
    const sorted = entries.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )
    return sorted[0].timestamp
  } catch (e) {
    return null
  }
}

/** Extrai timestamp ISO da última alteração de status no histórico do pedido */
export function getLastStatusChangeFromOrderHistoric(historic) {
  if (!historic) return null
  try {
    const arr =
      typeof historic === 'string' ? JSON.parse(historic || '[]') : historic
    if (!Array.isArray(arr) || arr.length === 0) return null
    const withTs = arr.filter(e => e && e.timestamp)
    if (withTs.length === 0) return null
    const sorted = withTs.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )
    return sorted[0].timestamp
  } catch (e) {
    return null
  }
}

/** Extrai timestamp (ms) da alteração para "Em estoque" no histórico do agendamento */
export function getEmEstoqueTimestamp(historic) {
  if (!historic) return null
  try {
    const h =
      typeof historic === 'string' ? JSON.parse(historic || '{}') : historic
    if (!h || typeof h !== 'object') return null
    const entries = Object.entries(h)
      .map(([key, value]) => ({ ...value, key }))
      .filter(e => {
        const s = e.new_status || e.to || ''
        if (
          s === 'Em estoque' ||
          s === 'Estoque' ||
          String(s).toLowerCase() === 'em estoque' ||
          String(s).toLowerCase() === 'estoque'
        ) {
          return true
        }
        // Alterações via ScheduleEditModal gravam changes sem new_status:
        // ex: 'Status: "Agendado" → "Em estoque"'
        if (Array.isArray(e.changes)) {
          return e.changes.some(c => /→\s*"?em estoque"?/i.test(String(c)))
        }
        return false
      })
      .map(e => (e.timestamp ? new Date(e.timestamp).getTime() : 0))
      .filter(t => t > 0)
    return entries.length > 0 ? Math.max(...entries) : null
  } catch (e) {
    return null
  }
}

/**
 * Monta orderByPedido (Map) e orderByScheduleId (Map) a partir do array de orders.
 */
export function buildOrderMaps(orders) {
  const orderByPedido = new Map()
  if (!orders || !Array.isArray(orders)) return { orderByPedido }
  for (const r of orders) {
    const ped = (r.NUMPEDCLI != null ? String(r.NUMPEDCLI).trim() : '') || ''
    if (ped && !orderByPedido.has(ped)) {
      orderByPedido.set(ped, r)
    }
  }
  return { orderByPedido }
}

/**
 * Extrai pedido do schedule (NUMPEDCLI ou corpem_nf_integrations).
 */
export function getPedidoFromSchedule(s) {
  let pedido =
    s.NUMPEDCLI != null && String(s.NUMPEDCLI).trim() !== ''
      ? String(s.NUMPEDCLI).trim()
      : null
  if (!pedido) {
    const rawNf = s.corpem_nf_integrations ?? s.corpem_nf_integration
    if (rawNf) {
      try {
        const parsed = typeof rawNf === 'string' ? JSON.parse(rawNf) : rawNf
        const docEnt = parsed?.CORPEM_ERP_DOC_ENT ?? parsed
        pedido = docEnt?.NUMEPEDCLI ?? docEnt?.NUMPEDCLI ?? null
      } catch (_) {}
    }
  }
  return pedido
}

/**
 * Calcula o processo (Entrada, Integração saída, Alerta MC/OS, Separação, Finalizado).
 * @param {boolean} wmsOscarSent - true se a NF-e possui registro com status_code 200 em webhookoscar.wms_jsons
 */
export function calcProcesso(schedule, order, integrationMinutes = 0, wmsOscarSent = false) {
  const statusEntrada = (schedule.status || '').toLowerCase().trim()
  const isStatusFinalizado = statusEntrada === 'finalizado'
  const isEmEstoque = statusEntrada.includes('estoque')
  const statusSaida = (order?.status || '').toUpperCase().trim()
  const temPedidoSaida = order != null
  const isPedidoEmbarcado = statusSaida === 'EMBARCADO'

  if (isStatusFinalizado && isPedidoEmbarcado) return 'Finalizado'
  if (isEmEstoque) {
    if (!temPedidoSaida) {
      let emEstoqueTs = getEmEstoqueTimestamp(schedule.historic)
      if (!emEstoqueTs) {
        const lastChange = getLastStatusChangeFromScheduleHistoric(
          schedule.historic
        )
        emEstoqueTs = lastChange ? new Date(lastChange).getTime() : null
      }
      const elapsedMinutes = emEstoqueTs
        ? (Date.now() - emEstoqueTs) / 60000
        : null
      if (integrationMinutes <= 0) return 'Integração saída'
      if (elapsedMinutes !== null)
        return elapsedMinutes <= integrationMinutes
          ? 'Integração saída'
          : wmsOscarSent ? 'Alerta OS' : 'Alerta MC'
      return 'Integração saída'
    }
    return 'Separação'
  }
  return 'Entrada'
}

/**
 * Monta a lista de linhas (data) a partir de orders e schedules.
 * @param {string[]} wmsOscarSentKeys - NF-e keys com registro status_code 200 em webhookoscar.wms_jsons
 */
export function buildListagemFromOrdersAndSchedules(
  orders,
  schedules,
  integrationMinutes = 0,
  wmsOscarSentKeys = []
) {
  const wmsSet = new Set((wmsOscarSentKeys || []).map(k => String(k).replace(/\s/g, '')))
  const { orderByPedido } = buildOrderMaps(orders || [])
  const rows = []
  for (const s of schedules || []) {
    const pedido = getPedidoFromSchedule(s)
    const ord = pedido ? orderByPedido.get(String(pedido).trim()) : null

    const nfEntrada = s.number ?? '-'
    const statusEntrada = s.status ?? '-'
    const dtAlteracaoEntrada = getLastStatusChangeFromScheduleHistoric(
      s.historic
    )

    let nfSaida = null
    let statusSaida = null
    let rejectionCodeSaida = null
    let dtAlteracaoSaida = null
    if (ord) {
      const numNf =
        ord.NUMNF != null && String(ord.NUMNF).trim() !== ''
          ? String(ord.NUMNF).trim()
          : null
      nfSaida = numNf != null ? numNf : '-'
      statusSaida =
        ord.status != null && String(ord.status).trim() !== ''
          ? String(ord.status).trim()
          : '-'
      rejectionCodeSaida = ord.rejection_code || null
      dtAlteracaoSaida = getLastStatusChangeFromOrderHistoric(ord.historic)
    }

    const nfeKeyNorm = s.nfe_key ? String(s.nfe_key).replace(/\s/g, '') : ''
    const wmsOscarSent = nfeKeyNorm !== '' && wmsSet.has(nfeKeyNorm)
    const processoVal = calcProcesso(s, ord, integrationMinutes, wmsOscarSent)

    rows.push({
      id: s.id,
      order_id: ord && ord.id != null ? ord.id : null,
      pedido: pedido ?? '-',
      nf_entrada: nfEntrada,
      status_entrada: statusEntrada,
      dt_alteracao_entrada: dtAlteracaoEntrada,
      nf_saida: nfSaida ?? '-',
      status_saida: statusSaida ?? '-',
      dt_alteracao_saida: dtAlteracaoSaida,
      rejection_code_saida: rejectionCodeSaida || null,
      processo: processoVal,
    })
  }
  return rows
}
