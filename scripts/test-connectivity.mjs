/**
 * Teste de conectividade do app mobile contra o backend de produção.
 *
 * Roda ANTES de gerar uma tag/APK para validar, sem precisar de dispositivo:
 *   1. A URL de produção responde (GET /api/health)
 *   2. O endpoint de login responde com JSON estruturado
 *   3. O CORS aceita a origem do WebView nativo (Origin: https://localhost)
 *      — reproduz o cenário on-device de um cliente HTTP comum.
 *
 * Uso:  node scripts/test-connectivity.mjs
 *       npm run test:connectivity
 *
 * Sai com código !=0 se algum check falhar (útil em CI / pré-tag).
 */

const BASE = process.env.MOBILE_API_BASE || 'https://portal.mercocamptech.com.br/api'
const NATIVE_ORIGIN = 'https://localhost' // Android androidScheme:https
const TIMEOUT_MS = 15000

let failures = 0
const ok = (m) => console.log(`✅ ${m}`)
const bad = (m) => { console.error(`❌ ${m}`); failures++ }

async function req(method, path, { origin, body } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (origin) headers.Origin = origin
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
    const text = await res.text()
    return { status: res.status, headers: res.headers, text }
  } finally {
    clearTimeout(t)
  }
}

console.log(`🔎 Testando conectividade mobile → ${BASE}\n`)

// 1. Health
try {
  const r = await req('GET', '/health')
  if (r.status === 200 && r.text.includes('"status"')) ok(`/health respondeu 200`)
  else bad(`/health status=${r.status} body=${r.text.slice(0, 120)}`)
} catch (e) { bad(`/health inacessível: ${e.message}`) }

// 2. Login endpoint existe e valida (sem credenciais → 400 esperado)
try {
  const r = await req('POST', '/auth/login', { body: {} })
  if (r.status === 400 || r.status === 401) ok(`/auth/login respondeu ${r.status} (endpoint ativo)`)
  else bad(`/auth/login status inesperado=${r.status} body=${r.text.slice(0, 120)}`)
} catch (e) { bad(`/auth/login inacessível: ${e.message}`) }

// 3. CORS preflight com origem do WebView nativo
try {
  const r = await req('OPTIONS', '/auth/login', { origin: NATIVE_ORIGIN })
  const acao = r.headers.get('access-control-allow-origin')
  if (acao && (acao === NATIVE_ORIGIN || acao === '*')) {
    ok(`CORS preflight aceita Origin ${NATIVE_ORIGIN} (allow-origin=${acao})`)
  } else {
    bad(`CORS preflight NÃO libera ${NATIVE_ORIGIN} (allow-origin=${acao || 'ausente'}) — ` +
        `requisição do WebView seria bloqueada se não passar pelo CapacitorHttp`)
  }
} catch (e) { bad(`CORS preflight falhou: ${e.message}`) }

// 4. POST real com Origin nativo (simula o WebView sem CapacitorHttp)
try {
  const r = await req('POST', '/auth/login', { origin: NATIVE_ORIGIN, body: { user: '__x__', password: '__x__' } })
  const acao = r.headers.get('access-control-allow-origin')
  if (acao && (acao === NATIVE_ORIGIN || acao === '*')) {
    ok(`POST com Origin ${NATIVE_ORIGIN} retornou allow-origin=${acao} (status ${r.status})`)
  } else {
    bad(`POST com Origin ${NATIVE_ORIGIN} sem allow-origin (status ${r.status}) — CORS bloquearia no WebView`)
  }
} catch (e) { bad(`POST nativo falhou: ${e.message}`) }

console.log(`\n${failures === 0 ? '✅ Todos os checks passaram' : `❌ ${failures} check(s) falharam`}`)
process.exit(failures === 0 ? 0 : 1)
