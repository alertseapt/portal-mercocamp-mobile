// ===================================================
// CONFIGURAÇÃO DA API - Detecção Automática de Ambiente
// ===================================================

/** Porta do backend em desenvolvimento (rede local ou localhost). */
const DEV_BACKEND_PORT = '4001'

/** Verifica se o hostname é IP de rede local (acesso por outros dispositivos na mesma rede). */
function isPrivateNetwork(host) {
  if (!host || host === 'localhost' || host === '127.0.0.1') return false
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (/^10\.(\d{1,3}\.){2}\d{1,3}$/.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.(\d{1,3}\.)?\d{1,3}$/.test(host)) return true
  if (/^192\.168\.(\d{1,3}\.)?\d{1,3}$/.test(host)) return true
  return false
}

/** Alinhado a getApiUrl (evita "Backend HOMOLOGAÇÃO" com ENVIRONMENT: production). */
function getEnvironmentLabel() {
  const hostname = window.location.hostname
  const port = window.location.port
  const fullUrl = window.location.href
  if (isPrivateNetwork(hostname)) return 'development'
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return port === '8000' ? 'development (homolog backend)' : 'development'
  }
  if (hostname.includes('recebhomolog') || fullUrl.includes('recebhomolog'))
    return 'staging'
  if (hostname.includes('recebimento') || fullUrl.includes('recebimento'))
    return 'production'
  return 'production'
}

/**
 * App mobile (Capacitor): o WebView serve os assets de um host local
 * (capacitor://localhost / https://localhost), então a detecção por
 * window.location apontaria para o backend errado. Nesta build nativa o
 * backend é SEMPRE produção (não há proxy IIS nem localhost no dispositivo).
 */
const NATIVE_API_BASE = 'https://portal.mercocamptech.com.br/api'

function isNativeApp() {
  try {
    return !!(
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    )
  } catch (_) {
    return false
  }
}

function getApiUrl() {
  if (isNativeApp()) {
    console.log(
      '🔧 [API CONFIG] App nativo (Capacitor) detectado → Backend PRODUÇÃO:',
      NATIVE_API_BASE
    )
    return NATIVE_API_BASE
  }

  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = window.location.port
  const fullUrl = window.location.href

  console.log('🔧 [API CONFIG] Detectando ambiente automaticamente...')
  console.log('🔧 [API CONFIG] Protocol:', protocol)
  console.log('🔧 [API CONFIG] Hostname:', hostname)
  console.log('🔧 [API CONFIG] Port:', port)
  console.log('🔧 [API CONFIG] Full URL:', fullUrl)

  // Acesso pela rede local (outros dispositivos): mesmo host, backend na porta 4001
  if (isPrivateNetwork(hostname)) {
    const apiBase = `http://${hostname}:${DEV_BACKEND_PORT}/api`
    console.log('🔧 [API CONFIG] Ambiente: Rede local → Backend no mesmo IP')
    console.log('🔧 [API CONFIG] Backend:', apiBase)
    return apiBase
  }

  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port === '8000') {
      // Rodando no servidor de desenvolvimento (frontend na porta 8000)
      // Usar backend de HOMOLOGAÇÃO (porta 4001) para testes locais
      console.log(
        '🔧 [API CONFIG] Ambiente: Desenvolvimento local (porta 8000) → Backend HOMOLOGAÇÃO'
      )
      console.log(
        '🔧 [API CONFIG] Backend: http://localhost:4001/api (Homologação)'
      )
      return 'http://localhost:4001/api'
    }
    // Rodando no IIS com proxy reverso
    console.log('🔧 [API CONFIG] Ambiente: IIS local com proxy reverso')
    return '/api'
  }

  // Detecção automática baseada no domínio
  if (
    hostname.includes('recebhomolog.mercocamptech.com.br') ||
    fullUrl.includes('recebhomolog')
  ) {
    // Ambiente de homologação - backend na porta 4001
    console.log('🔧 [API CONFIG] Ambiente: HOMOLOGAÇÃO - Backend porta 4001')
    return '/api' // Proxy reverso configurado para redirecionar para porta 4001
  }

  if (
    hostname.includes('recebimento.mercocamptech.com.br') ||
    fullUrl.includes('recebimento')
  ) {
    // Ambiente de produção - backend na porta 4000
    console.log('🔧 [API CONFIG] Ambiente: PRODUÇÃO - Backend porta 4000')
    return '/api' // Proxy reverso configurado para redirecionar para porta 4000
  }

  // Fallback para produção
  console.log('🔧 [API CONFIG] Ambiente: FALLBACK (produção)')
  return '/api'
}

// Exportar BASE_URL para uso no main.js
export const BASE_URL = getApiUrl()

/**
 * URL base do serviço Java de exportação (PortalMercocampExports no Railway).
 * Configurável em config.js via window.EXPORTS_SERVICE_URL.
 * Em desenvolvimento local, cai em http://localhost:8080.
 */
function getExportsUrl() {
  if (typeof window !== 'undefined' && window.EXPORTS_SERVICE_URL) {
    return window.EXPORTS_SERVICE_URL
  }
  // App nativo: não há localhost:8080; sem URL configurada o recurso de
  // exportação fica desabilitado (retorna '').
  if (isNativeApp()) {
    return ''
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080'
  }
  if (isPrivateNetwork(hostname)) {
    return `http://${hostname}:8080`
  }
  // Produção: configurar window.EXPORTS_SERVICE_URL em config.js
  return ''
}

export const EXPORTS_BASE_URL = getExportsUrl()

// Exportar API_CONFIG para compatibilidade com componentes que usam
export const API_CONFIG = {
  getApiUrl: getApiUrl,
  API_URL: BASE_URL,
  TIMEOUT: 60000, // 60s para bancos remotos/lentos
  RETRY_ATTEMPTS: 3,
  ENABLE_DEBUG: true,
  ENABLE_MOCK: false,
  ENVIRONMENT: getEnvironmentLabel(),
  VERSION: '1.0.0',
}

// Também disponibilizar no window para compatibilidade
if (typeof window !== 'undefined') {
  window.API_URL = BASE_URL
  window.API_CONFIG = API_CONFIG
}

console.log('========================================')
console.log('🔧 Configuração da API carregada:')
console.log('🔧 BASE_URL:', BASE_URL)
console.log('========================================')
