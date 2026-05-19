/**
 * Script de Diagnóstico para Debug em Produção
 * Adicione este script ao index.html temporariamente para fazer debug
 */

window.DIAGNOSTIC = {
  runAll: function () {
    console.log('=== DIAGNÓSTICO DO SISTEMA ===')

    // 1. Informações do ambiente
    console.log('1. AMBIENTE:')
    console.log('  - URL atual:', window.location.href)
    console.log('  - Hostname:', window.location.hostname)
    console.log('  - Port:', window.location.port)
    console.log('  - Protocol:', window.location.protocol)

    // 2. Configuração carregada
    console.log('2. CONFIGURAÇÃO:')
    console.log('  - window.API_CONFIG:', window.API_CONFIG)
    console.log('  - window.API_URL:', window.API_URL)
    console.log('  - window.BASE_URL:', window.BASE_URL)
    console.log('  - window.API_BASE_URL:', window.API_BASE_URL)

    // 3. Teste de conectividade
    console.log('3. TESTE DE CONECTIVIDADE:')
    this.testApiConnectivity()

    // 4. Informações do usuário
    console.log('4. USUÁRIO:')
    const user = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    console.log('  - Usuário logado:', user ? JSON.parse(user) : 'NENHUM')
    console.log('  - Token presente:', token ? 'SIM' : 'NÃO')
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]))
        console.log('  - Token expires:', new Date(tokenData.exp * 1000))
        console.log('  - Token válido:', Date.now() < tokenData.exp * 1000)
      } catch (e) {
        console.log('  - Erro ao decodificar token:', e.message)
      }
    }

    console.log('=== FIM DO DIAGNÓSTICO ===')
  },

  testApiConnectivity: async function () {
    const apiUrl = window.API_URL || window.BASE_URL || '/api'
    const endpoints = ['/health', '/users/me', '/users/admin/clients']

    console.log(`  Testando conectividade para: ${apiUrl}`)

    for (const endpoint of endpoints) {
      const url = `${apiUrl}${endpoint}`
      console.log(`  Testando: ${url}`)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`    Status: ${response.status} ${response.statusText}`)
        if (response.ok) {
          console.log(`    ✅ OK`)
        } else {
          const errorText = await response.text()
          console.log(`    ❌ Erro: ${errorText}`)
        }
      } catch (error) {
        console.log(`    ❌ Falha: ${error.message}`)
      }
    }
  },

  testAdminClientsEndpoint: async function () {
    console.log('=== TESTE ESPECÍFICO: /admin/clients ===')

    const apiUrl = window.API_URL || window.BASE_URL || '/api'
    const url = `${apiUrl}/users/admin/clients`
    const token = localStorage.getItem('token')

    console.log('URL completa:', url)
    console.log('Token:', token ? 'PRESENTE' : 'AUSENTE')

    if (!token) {
      console.log('❌ Não é possível testar sem token')
      return
    }

    try {
      console.log('🔄 Fazendo requisição...')
      const startTime = Date.now()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      console.log(`⏱️ Tempo de resposta: ${duration}ms`)
      console.log(`📡 Status: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(
          `✅ Sucesso! Clientes encontrados: ${data.clients?.length || 0}`
        )
        if (data.clients && data.clients.length > 0) {
          console.log('Primeiro cliente:', data.clients[0])
        }
      } else {
        const errorData = await response.text()
        console.log(`❌ Erro: ${errorData}`)
      }
    } catch (error) {
      console.log(`❌ Exceção: ${error.message}`)
      console.log('Tipo de erro:', error.constructor.name)
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout - requisição demorou mais de 30 segundos')
      }
    }

    console.log('=== FIM DO TESTE ===')
  },
}

// Auto-executar diagnóstico se estiver em modo debug
if (window.API_CONFIG && window.API_CONFIG.ENABLE_DEBUG) {
  setTimeout(() => {
    window.DIAGNOSTIC.runAll()
  }, 2000) // Aguardar 2 segundos para tudo carregar
}

console.log('🔧 [DIAGNOSTIC] Script de diagnóstico carregado')
console.log(
  '🔧 [DIAGNOSTIC] Execute: window.DIAGNOSTIC.runAll() para diagnóstico completo'
)
console.log(
  '🔧 [DIAGNOSTIC] Execute: window.DIAGNOSTIC.testAdminClientsEndpoint() para testar endpoint específico'
)
