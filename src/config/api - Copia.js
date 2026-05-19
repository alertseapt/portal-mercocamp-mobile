// ========================================
// CONFIGURAÇÃO CENTRALIZADA DA API
// ========================================
//
// PARA ALTERAR O ENDPOINT DA API:
// Use o arquivo config.js na raiz do projeto

// Detectar ambiente de desenvolvimento e configurar API adequadamente
function getApiBaseUrl() {
  console.log('🔧 [API.JS] Configurando URL da API...')

  // Se window.API_URL estiver definido pelo config.js, usar
  if (typeof window !== 'undefined' && window.API_URL) {
    console.log('🔧 [API.JS] Usando URL do config.js:', window.API_URL)
    return window.API_URL
  }

  // Para desenvolvimento local (Vite dev server na porta 8000)
  if (typeof window !== 'undefined') {
    const isLocalDev =
      window.location.hostname === 'localhost' &&
      window.location.port === '8000'
    console.log('🔧 [API.JS] Verificando ambiente local:', {
      hostname: window.location.hostname,
      port: window.location.port,
      isLocalDev: isLocalDev,
    })

    if (isLocalDev) {
      // Usar backend de homologação (porta 4001) para desenvolvimento como especificado no config.js
      console.log(
        '🔧 [API.JS] Ambiente local detectado - usando http://localhost:4001/api'
      )
      return 'http://localhost:4001/api'
    }
  }

  // Fallback para proxy reverso em produção
  console.log('🔧 [API.JS] Usando fallback para produção: /api')
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

console.log('🎯 [API.JS] URL Final configurada:', API_BASE_URL)

// ========================================

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  // Endpoints específicos podem ser adicionados aqui se necessário
  ENDPOINTS: {
    AUTH: `${API_BASE_URL}/auth`,
    USERS: `${API_BASE_URL}/users`,
    SCHEDULES: `${API_BASE_URL}/schedules`,
    SETTINGS: `${API_BASE_URL}/user-settings`,
  },
}

// Para compatibilidade com código existente
export const BASE_URL = API_BASE_URL

// Disponibilizar globalmente para arquivos que não usam módulos ES6
if (typeof window !== 'undefined') {
  window.API_CENTRALIZED_CONFIG = API_CONFIG
}

export default API_CONFIG
