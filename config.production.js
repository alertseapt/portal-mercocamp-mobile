// ===================================================
// CONFIGURAÇÃO PARA PRODUÇÃO - recebimento.mercocamptech.com.br
// ===================================================
// Use este arquivo no servidor de produção

window.API_CONFIG = {
  // Detecção automática baseada no domínio
  getApiUrl: function () {
    const hostname = window.location.hostname
    const fullUrl = window.location.href

    console.log('🚀 [PRODUCTION CONFIG] Detectando ambiente...')
    console.log('🚀 [PRODUCTION CONFIG] Hostname:', hostname)

    // Ambiente de homologação
    if (
      hostname.includes('recebhomolog.mercocamptech.com.br') ||
      fullUrl.includes('recebhomolog')
    ) {
      console.log(
        '🚀 [PRODUCTION CONFIG] Ambiente: HOMOLOGAÇÃO - Proxy para porta 4001'
      )
      return '/api' // Proxy reverso já configurado para redirecionar para porta 4001
    }

    // Ambiente de produção (padrão)
    console.log(
      '🚀 [PRODUCTION CONFIG] Ambiente: PRODUÇÃO - Proxy para porta 4000'
    )
    return '/api' // Proxy reverso já configurado para redirecionar para porta 4000
  },

  // Configurações adicionais
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENVIRONMENT: 'production',
  ENABLE_DEBUG: false,
  VERSION: '1.0.0',
}

// Determinar URL final
window.API_URL = window.API_CONFIG.getApiUrl()
console.log('🚀 [PRODUCTION CONFIG] API URL final:', window.API_URL)
