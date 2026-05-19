/**
 * Testa a resolução de BASE_URL do src/config/api.js sob diferentes ambientes
 * SEM precisar de dispositivo — simula window.location/Capacitor e importa o
 * módulo real, garantindo que o APK aponte para produção.
 *
 * Uso: node scripts/test-api-resolution.mjs   (ou: npm run test:api)
 */

let failures = 0
const check = (label, actual, expected) => {
  const pass = actual === expected
  console.log(`${pass ? '✅' : '❌'} ${label}\n   esperado: ${expected}\n   obtido:   ${actual}`)
  if (!pass) failures++
}

async function resolveBaseUrl(win) {
  globalThis.window = win
  // cache-bust para reavaliar o módulo (BASE_URL é const no load)
  const mod = await import(`../src/config/api.js?t=${Date.now()}`)
  return mod.BASE_URL
}

const PROD = 'https://portal.mercocamptech.com.br/api'

// 1. Android nativo (androidScheme:https) → https://localhost SEM porta, sem window.Capacitor
check(
  'Android nativo (https://localhost, sem porta, sem Capacitor global)',
  await resolveBaseUrl({
    location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
  }),
  PROD
)

// 2. iOS nativo → capacitor://localhost
check(
  'iOS nativo (capacitor://localhost)',
  await resolveBaseUrl({
    location: { protocol: 'capacitor:', hostname: 'localhost', port: '', href: 'capacitor://localhost/' },
  }),
  PROD
)

// 3. Android com window.Capacitor presente
check(
  'Android nativo com window.Capacitor.isNativePlatform()=true',
  await resolveBaseUrl({
    location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
    Capacitor: { isNativePlatform: () => true },
  }),
  PROD
)

// 4. Dev local (npm run dev :8000) — NÃO deve ser tratado como nativo
check(
  'Dev local (localhost:8000) → backend homologação (não-nativo)',
  await resolveBaseUrl({
    location: { protocol: 'http:', hostname: 'localhost', port: '8000', href: 'http://localhost:8000/' },
  }),
  'http://localhost:4001/api'
)

console.log(`\n${failures === 0 ? '✅ Resolução de BASE_URL correta' : `❌ ${failures} caso(s) errado(s)`}`)
process.exit(failures === 0 ? 0 : 1)
