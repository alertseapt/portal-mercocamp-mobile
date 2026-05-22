/**
 * API Configuration for Standalone HTML Files
 * This file provides API configuration without requiring ES6 modules
 * Used by login.html and other standalone files
 */

;(function () {
  'use strict'

  function getApiBaseUrl() {
    // App nativo (Capacitor): backend default = HOMOLOGAÇÃO. O toggle em
    // </DEV> > Sistema grava 'producao' em localStorage.native_backend_env
    // para alternar. Checado antes de window.API_URL para funcionar mesmo
    // que o config.js esteja desatualizado/substituído pós-deploy.
    if (typeof window !== 'undefined') {
      var p = window.location.protocol
      var h = window.location.hostname
      var port = window.location.port
      var isNative =
        (window.Capacitor &&
          typeof window.Capacitor.isNativePlatform === 'function' &&
          window.Capacitor.isNativePlatform()) ||
        p === 'capacitor:' ||
        (p === 'https:' &&
          (h === 'localhost' || h === '127.0.0.1') &&
          !port)
      if (isNative) {
        var env = 'homolog'
        try {
          var v =
            window.localStorage &&
            window.localStorage.getItem('native_backend_env')
          if (v === 'producao') env = 'producao'
        } catch (_) {}
        return env === 'producao'
          ? 'https://portal.mercocamptech.com.br/api'
          : 'https://recebhomolog.mercocamptech.com.br/api'
      }
    }

    // Se window.API_URL estiver definido pelo config.js, usar
    if (typeof window !== 'undefined' && window.API_URL) {
      return window.API_URL
    }

    // Para desenvolvimento local (porta 8000)
    if (typeof window !== 'undefined') {
      const isLocalDev =
        window.location.hostname === 'localhost' &&
        window.location.port === '8000'
      if (isLocalDev) {
        // Usar backend de homologação (porta 4001) para desenvolvimento
        return 'http://localhost:4001/api'
      }
    }

    // Fallback para proxy reverso em produção
    return '/api'
  }

  const API_BASE_URL = getApiBaseUrl()

  // Configuração da API
  const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    ENDPOINTS: {
      AUTH: API_BASE_URL + '/auth',
      USERS: API_BASE_URL + '/users',
      SCHEDULES: API_BASE_URL + '/schedules',
      SETTINGS: API_BASE_URL + '/user-settings',
    },
  }

  // Disponibilizar globalmente
  window.API_CONFIG = API_CONFIG
  window.API_BASE_URL = API_BASE_URL
  window.BASE_URL = API_BASE_URL // Para compatibilidade

  console.log('🔧 [API-STANDALONE] API Base URL:', API_BASE_URL)
  console.log('🔧 [API-STANDALONE] Configuração carregada:', API_CONFIG)
})()
