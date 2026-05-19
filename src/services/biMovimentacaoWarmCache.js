/**
 * Cache + pré-busca para GET /bi/movimentacao-clientes.
 * Modo trimestres_ano: um GET cobre os 4 trimestres do ano — o cache usa chave canônica
 * trimY|ANO|BIT (status) para qualquer assinatura de UI trim|ANO|1..4|BIT.
 */
import axios from 'axios'

const MAX_ENTRIES = 48
const cache = new Map()
const inflight = new Map()

let prefetchDebounceTimer = null

/** Assinatura de UI no BIMovimentacaoClientesPage: trim|ano|numTrim|statusBit */
const RE_TRIM_UI = /^trim\|(\d+)\|(\d+)\|([01])$/

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function isoFirstDayOfMonth() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${m}-01`
}

function addDays(iso, delta) {
  const t = new Date(`${iso}T12:00:00`)
  t.setDate(t.getDate() + delta)
  return t.toISOString().slice(0, 10)
}

function trimestreAtualDefaults() {
  const now = new Date()
  const y = now.getFullYear()
  const mes = now.getMonth() + 1
  const num = Math.min(4, Math.max(1, Math.ceil(mes / 3)))
  return { ano: y, num }
}

function parseTrimUiSignature(signature) {
  const m = RE_TRIM_UI.exec(signature)
  if (!m) return null
  return { ano: m[1], q: m[2], bit: m[3] }
}

/** Uma entrada por ano + modo wgu (o payload já traz Q1–Q4). */
function trimCanonicalKey(ano, statusBit) {
  return `trimY|${ano}|${statusBit}`
}

function resolveStorageKey(signature) {
  const t = parseTrimUiSignature(signature)
  if (t && t.ano && t.bit != null) return trimCanonicalKey(t.ano, t.bit)
  return signature
}

function pruneCache() {
  while (cache.size > MAX_ENTRIES) {
    const k = cache.keys().next().value
    cache.delete(k)
  }
}

export function movimentacaoWarmCacheClear() {
  cache.clear()
  inflight.clear()
}

export function movimentacaoWarmCacheSet(signature, data) {
  if (!data || !data.success) return
  const key = resolveStorageKey(signature)
  cache.set(key, data)
  pruneCache()
}

/**
 * @param {string} signature
 * @returns {Promise<object|null>} corpo JSON com success true ou null
 */
export async function movimentacaoWarmCacheGetOrWait(signature) {
  const key = resolveStorageKey(signature)
  const hit = cache.get(key)
  if (hit && hit.success) return hit
  const p = inflight.get(key)
  if (!p) return null
  try {
    const data = await p
    return data && data.success ? data : null
  } catch {
    return null
  }
}

export function movimentacaoWarmFetch(signature, queryString, token) {
  const key = resolveStorageKey(signature)

  const cached = cache.get(key)
  if (cached && cached.success) return Promise.resolve(cached)

  if (inflight.has(key)) return inflight.get(key)

  const req = axios
    .get(`/bi/movimentacao-clientes?${queryString}`, {
      timeout: 180000,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Cache-Control': 'no-cache',
      },
    })
    .then(res => {
      const data = res.data
      if (data && data.success) movimentacaoWarmCacheSet(signature, data)
      return data
    })
    .catch(e => {
      console.warn('[biMovimentacaoWarmCache]', key, e?.message || e)
      throw e
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, req)
  return req
}

function runWarmPrefetchChain() {
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return

  const hoje = isoToday()
  const mesIni = isoFirstDayOfMonth()
  const { ano, num } = trimestreAtualDefaults()

  /** Trimestre do ano corrente primeiro (maior chance de uso ao trocar o preset). */
  const tasks = [
    {
      sig: `trim|${ano}|${num}|0`,
      qs: `trimestres_ano=${encodeURIComponent(String(ano))}`,
    },
    {
      sig: `trim|${ano}|${num}|1`,
      qs: `trimestres_ano=${encodeURIComponent(String(ano))}&status=all`,
    },
    {
      sig: `rng|${mesIni}|${hoje}|0`,
      qs: `data_inicio=${encodeURIComponent(mesIni)}&data_fim=${encodeURIComponent(hoje)}`,
    },
    {
      sig: `rng|${mesIni}|${hoje}|1`,
      qs: `data_inicio=${encodeURIComponent(mesIni)}&data_fim=${encodeURIComponent(hoje)}&status=all`,
    },
    {
      sig: `rng|${hoje}|${hoje}|0`,
      qs: `data_inicio=${encodeURIComponent(hoje)}&data_fim=${encodeURIComponent(hoje)}`,
    },
    {
      sig: `rng|${addDays(hoje, -6)}|${hoje}|0`,
      qs: `data_inicio=${encodeURIComponent(addDays(hoje, -6))}&data_fim=${encodeURIComponent(hoje)}`,
    },
    {
      sig: `rng|${addDays(hoje, -29)}|${hoje}|0`,
      qs: `data_inicio=${encodeURIComponent(addDays(hoje, -29))}&data_fim=${encodeURIComponent(hoje)}`,
    },
  ]

  let i = 0
  const step = () => {
    if (i >= tasks.length) return
    const { sig, qs } = tasks[i++]
    const storeKey = resolveStorageKey(sig)
    if (cache.has(storeKey)) {
      setTimeout(step, 80)
      return
    }
    movimentacaoWarmFetch(sig, qs, token)
      .catch(() => {})
      .finally(() => {
        setTimeout(step, 120)
      })
  }
  step()
}

/** Debounce para não enfileirar várias cadeias ao trocar menu rapidamente. */
export function scheduleMovimentacaoWarmPrefetch() {
  clearTimeout(prefetchDebounceTimer)
  prefetchDebounceTimer = setTimeout(() => {
    prefetchDebounceTimer = null
    runWarmPrefetchChain()
  }, 250)
}
