/**
 * Testa a resolução de BASE_URL do src/config/api.js sob diferentes ambientes
 * SEM precisar de dispositivo — simula window.location/Capacitor/localStorage e
 * importa o módulo real, garantindo que o APK aponte para o backend correto.
 *
 * Uso: node scripts/test-api-resolution.mjs   (ou: npm run test:api)
 *
 * Regra atual:
 *   - Nativo (Capacitor) sem preferência → HOMOLOGAÇÃO (default do app de testes).
 *   - Nativo com localStorage.native_backend_env='producao' → PRODUÇÃO.
 *   - Nativo com localStorage.native_backend_env='homolog' → HOMOLOGAÇÃO.
 *   - Web localhost:8000 → backend homologação local (porta 4001).
 */

let failures = 0
const check = (label, actual, expected) => {
  const pass = actual === expected
  console.log(`${pass ? '✅' : '❌'} ${label}\n   esperado: ${expected}\n   obtido:   ${actual}`)
  if (!pass) failures++
}

function stubLocalStorage(value) {
  if (value == null) {
    delete globalThis.localStorage
    return
  }
  globalThis.localStorage = {
    getItem: k => (k === 'native_backend_env' ? value : null),
    setItem: () => {},
    removeItem: () => {},
  }
}

// Define um window mínimo antes do import — o módulo executa `BASE_URL =
// getApiUrl()` no load e acessa window.location. Os casos do teste sobrescrevem
// esse window depois via globalThis.window.
globalThis.window = {
  location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
}
// Import único — getApiUrl é chamado por caso, lendo window/localStorage
// atuais. Evita problemas com cache de ESM no Node (?t= é intermitente).
const apiMod = await import('../src/config/api.js')

function resolveBaseUrl(win, { backendEnv = null } = {}) {
  globalThis.window = win
  stubLocalStorage(backendEnv)
  return apiMod.getApiUrl()
}

const PROD = 'https://portal.mercocamptech.com.br/api'
const HOMOLOG = 'https://recebhomolog.mercocamptech.com.br/api'

// 1. Android nativo (androidScheme:https) → https://localhost SEM porta, sem window.Capacitor
//    Sem preferência salva → DEFAULT homolog.
check(
  'Android nativo, sem preferência → HOMOLOGAÇÃO (default)',
  await resolveBaseUrl({
    location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
  }),
  HOMOLOG
)

// 2. iOS nativo → capacitor://localhost
check(
  'iOS nativo, sem preferência → HOMOLOGAÇÃO (default)',
  await resolveBaseUrl({
    location: { protocol: 'capacitor:', hostname: 'localhost', port: '', href: 'capacitor://localhost/' },
  }),
  HOMOLOG
)

// 3. Android com window.Capacitor presente — sem preferência
check(
  'Android nativo com Capacitor.isNativePlatform()=true, sem preferência → HOMOLOGAÇÃO',
  await resolveBaseUrl({
    location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
    Capacitor: { isNativePlatform: () => true },
  }),
  HOMOLOG
)

// 4. Nativo com toggle ligado em PRODUÇÃO
check(
  'Android nativo + toggle "producao" → PRODUÇÃO',
  await resolveBaseUrl(
    {
      location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
      Capacitor: { isNativePlatform: () => true },
    },
    { backendEnv: 'producao' }
  ),
  PROD
)

// 5. Nativo com toggle explícito em HOMOLOG (= default, mas garante simetria)
check(
  'Android nativo + toggle "homolog" → HOMOLOGAÇÃO',
  await resolveBaseUrl(
    {
      location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
      Capacitor: { isNativePlatform: () => true },
    },
    { backendEnv: 'homolog' }
  ),
  HOMOLOG
)

// 6. Nativo com valor inválido no localStorage → cai no default homolog
check(
  'Android nativo + toggle "lixo" → HOMOLOGAÇÃO (fallback seguro)',
  await resolveBaseUrl(
    {
      location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
    },
    { backendEnv: 'qualquer-coisa' }
  ),
  HOMOLOG
)

// 7. Dev local (npm run dev :8000) — NÃO deve ser tratado como nativo
check(
  'Dev local (localhost:8000) → backend homologação (não-nativo, hostname-based)',
  await resolveBaseUrl({
    location: { protocol: 'http:', hostname: 'localhost', port: '8000', href: 'http://localhost:8000/' },
  }),
  'http://localhost:4001/api'
)

console.log(`\n${failures === 0 ? '✅ Resolução de BASE_URL correta' : `❌ ${failures} caso(s) errado(s)`}`)
process.exit(failures === 0 ? 0 : 1)
