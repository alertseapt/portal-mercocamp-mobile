// ===================================================
// SERVIÇO DE API - COMUNICAÇÃO COM O BACKEND
// ===================================================

import { BASE_URL } from '../config/api.js'

/**
 * URL efetiva do backend.
 * O config.js público (antes do bundle) costuma definir `/api` no FALLBACK de rede local;
 * no Vite (porta 8000) isso aponta para o próprio dev server e devolve index.html.
 * Usar BASE_URL do detector em src/config/api.js (rede local → http://host:4001/api).
 */
function getEffectiveBaseURL() {
  if (typeof window === 'undefined') return BASE_URL
  const w = window.API_URL
  if (w && /^https?:\/\//i.test(String(w))) {
    return String(w).replace(/\/$/, '')
  }
  return String(BASE_URL).replace(/\/$/, '')
}

// Classe principal do serviço de API
class ApiService {
  constructor() {
    this.baseURL = getEffectiveBaseURL()
    this.token = localStorage.getItem('token')
  }

  // Atualizar URL da API (útil para testes)
  updateApiUrl(newUrl) {
    this.baseURL = newUrl
  }

  // Configurar token de autenticação
  setAuthToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  // Limpar completamente a autenticação
  clearAuth() {
    console.log('🧹 Limpando dados de autenticação...')

    // Limpar token
    this.setAuthToken(null)

    // Limpar outros dados relacionados ao usuário (se existirem)
    localStorage.removeItem('user')
    localStorage.removeItem('userPermissions')
    localStorage.removeItem('userLevel')

    // Limpar dados de sessão se existirem
    sessionStorage.clear()

    console.log('✅ Dados de autenticação limpos')
  }

  // Verificar se o usuário está autenticado
  isAuthenticated() {
    return !!this.token && !!localStorage.getItem('token')
  }

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const base =
      this.baseURL && /^https?:\/\//i.test(this.baseURL)
        ? String(this.baseURL).replace(/\/$/, '')
        : getEffectiveBaseURL()
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${base}${path}`

    // Atualizar token antes de fazer requisição
    this.token = localStorage.getItem('token')

    // Configurar headers padrão
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Adicionar token se existir
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    // Configurar timeout (padrão 60s; options.timeout=false para desativar, ex: Evolution grupos)
    const semTimeout = options.timeout === false || options.timeout === null
    const timeoutMs = semTimeout ? 0 : (options.timeout ?? 60000)
    const controller = new AbortController()
    const timeoutId = semTimeout
      ? null
      : setTimeout(() => controller.abort(), timeoutMs)

    const { timeout: _timeout, ...fetchOptions } = options
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: semTimeout ? undefined : controller.signal,
      })

      if (timeoutId) clearTimeout(timeoutId)

      // Verificar se a resposta foi bem sucedida
      if (!response.ok) {
        // Tentar extrair mensagem de erro do corpo da resposta
        let errorMessage = `Erro ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // Ignorar erro ao parsear JSON
        }

        // Tratar erro 401 (Não autorizado)
        if (response.status === 401) {
          console.warn('🔐 Token inválido ou expirado detectado')

          // Limpar completamente os dados de autenticação
          this.clearAuth()

          // Redirecionar para login apenas se não estivermos já na página de login
          if (
            !window.location.pathname.includes('/login.html') &&
            !window.location.pathname.includes('/login')
          ) {
            console.log('🔄 Redirecionando para página de login...')

            // Adicionar delay mínimo para garantir que os dados foram limpos
            setTimeout(() => {
              window.location.href = '/login.html'
            }, 100)

            return // Evitar que o erro seja propagado após redirecionamento
          }

          throw new Error('Token inválido ou expirado')
        }

        throw new Error(errorMessage)
      }

      // Retornar resposta parseada
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return await response.text()
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou (timeout)')
      }

      throw error
    }
  }

  // Métodos HTTP convenientes
  /** @param {Record<string,string|number|boolean>} [params] query string */
  /** @param {{ timeout?: number|false|null } & Omit<RequestInit,'method'|'body'>} [options] timeout em ms (padrão 60s); `false` desliga */
  async get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET', ...options })
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  /** Faz GET autenticado e retorna o resultado como Blob (para PDFs, imagens, etc.). */
  async getBlob(endpoint) {
    const url = `${this.baseURL}${endpoint}`
    this.token = localStorage.getItem('token')
    const headers = {}
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        let msg = `Erro ${response.status}: ${response.statusText}`
        try {
          const e = await response.json()
          msg = e.error || e.message || msg
        } catch (_) {}
        if (response.status === 401) {
          this.clearAuth()
          window.location.href = '/login.html'
        }
        throw new Error(msg)
      }

      return response.blob()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError')
        throw new Error('Requisição expirou (timeout)')
      throw error
    }
  }

  /**
   * GET autenticado com query string; corpo como texto (ex.: HTML do demonstrativo de fatura).
   * Não envia Content-Type: application/json.
   */
  async getTextWithQuery(endpoint, params = {}) {
    const base = getEffectiveBaseURL().replace(/\/$/, '')
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const qs = new URLSearchParams(params).toString()
    const url = qs ? `${base}${path}?${qs}` : `${base}${path}`
    this.token = localStorage.getItem('token')
    const headers = {}
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        let msg = `Erro ${response.status}: ${response.statusText}`
        try {
          const t = await response.text()
          try {
            const j = JSON.parse(t)
            msg = j.error || j.message || msg
          } catch {
            if (t) msg = t.slice(0, 400)
          }
        } catch (_) {}
        if (response.status === 401) {
          this.clearAuth()
          if (
            !window.location.pathname.includes('/login.html') &&
            !window.location.pathname.includes('/login')
          ) {
            window.location.href = '/login.html'
          }
        }
        throw new Error(msg)
      }
      return await response.text()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou (timeout)')
      }
      throw error
    }
  }

  /**
   * GET autenticado com query string; retorna Blob e cabeçalhos úteis para download.
   */
  async getBlobWithQuery(endpoint, params = {}) {
    const base = getEffectiveBaseURL().replace(/\/$/, '')
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const qs = new URLSearchParams(params).toString()
    const url = qs ? `${base}${path}?${qs}` : `${base}${path}`
    this.token = localStorage.getItem('token')
    const headers = {}
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        let msg = `Erro ${response.status}: ${response.statusText}`
        try {
          const t = await response.text()
          try {
            const j = JSON.parse(t)
            msg = j.error || j.message || msg
          } catch {
            if (t) msg = t.slice(0, 400)
          }
        } catch (_) {}
        if (response.status === 401) {
          this.clearAuth()
          if (
            !window.location.pathname.includes('/login.html') &&
            !window.location.pathname.includes('/login')
          ) {
            window.location.href = '/login.html'
          }
        }
        throw new Error(msg)
      }

      const blob = await response.blob()
      return {
        blob,
        contentType: response.headers.get('content-type') || '',
        contentDisposition: response.headers.get('content-disposition') || '',
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou (timeout)')
      }
      throw error
    }
  }

  // Métodos específicos da aplicação

  // Autenticação
  async login(user, password) {
    const response = await this.post('/auth/login', { user, password })
    if (response.token) {
      this.setAuthToken(response.token)
    }
    return response
  }

  async logout() {
    console.log('👋 Fazendo logout...')

    try {
      // Tentar notificar o backend sobre o logout
      await this.post('/auth/logout')
    } catch (error) {
      console.warn('⚠️ Erro ao notificar backend sobre logout:', error.message)
      // Continuar com logout local mesmo se o backend falhar
    } finally {
      // Sempre limpar dados locais
      this.clearAuth()

      console.log('🔄 Redirecionando para login...')
      window.location.href = '/login.html'
    }
  }

  async verifyToken() {
    return this.get('/auth/verify')
  }

  // Usuários
  async getUsers() {
    return this.get('/users')
  }

  async getUser(id) {
    return this.get(`/users/${id}`)
  }

  async createUser(userData) {
    return this.post('/users', userData)
  }

  async updateUser(id, userData) {
    return this.put(`/users/${id}`, userData)
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`)
  }

  // Agendamentos
  async getSchedules(params) {
    return this.get('/schedules', params)
  }

  async getSchedule(id) {
    return this.get(`/schedules/${id}`)
  }

  async createSchedule(scheduleData) {
    return this.post('/schedules', scheduleData)
  }

  async updateSchedule(id, scheduleData) {
    return this.put(`/schedules/${id}`, scheduleData)
  }

  async deleteSchedule(id) {
    return this.delete(`/schedules/${id}`)
  }

  // Produtos
  async getProducts(params) {
    return this.get('/products', params)
  }

  async getProduct(id) {
    return this.get(`/products/${id}`)
  }

  async createProduct(productData) {
    return this.post('/products', productData)
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData)
  }

  // Clientes
  async getClients(params) {
    return this.get('/clients', params)
  }

  async getClient(cnpj) {
    return this.get(`/clients/${cnpj}`)
  }

  // Health Check
  async healthCheck() {
    return this.get('/health')
  }

  // Teste de conectividade
  async testConnectivity() {
    return this.get('/test-connectivity')
  }

  // Versionamento
  async getVersion() {
    return this.get('/version')
  }

  async checkVersion(clientVersion, clientBuildHash) {
    return this.post('/version/check', { clientVersion, clientBuildHash })
  }
}

// Criar instância singleton
const apiService = new ApiService()

// Exportar instância e classe
export default apiService
export { ApiService }

// Também disponibilizar globalmente para debug
if (typeof window !== 'undefined') {
  window.apiService = apiService
}

// ========== Rejeições (adicionado) ==========
export const rejeicaoService = {
  async getRejeicoes(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/rejeicoes?${queryString}` : '/rejeicoes'
    const data = await apiService.request(url, {
      method: 'GET',
      timeout: 120000,
    })
    return { data: Array.isArray(data) ? data : data?.data || [] }
  },
  async getBiMotivos(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString
      ? `/rejeicoes/bi-motivos?${queryString}`
      : '/rejeicoes/bi-motivos'
    const res = await apiService.request(url, { method: 'GET', timeout: 90000 })
    return { motivos: res?.motivos || [] }
  },
  async getBiUrgentes(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString
      ? `/rejeicoes/bi-urgentes?${queryString}`
      : '/rejeicoes/bi-urgentes'
    const res = await apiService.request(url, { method: 'GET', timeout: 90000 })
    return { urgentes: res?.urgentes || [] }
  },
  async getItensPedidoRejeitado(
    pedido,
    id_cliente,
    comComparacao = false,
    comTentativas = false
  ) {
    const params = { pedido, id_cliente }
    if (comComparacao) params.comparacao = '1'
    if (comTentativas) params.tentativas = '1'
    return apiService.get('/rejeicoes/itens', params)
  },
  async removerRejeicao(pedido, id_cliente, motivo = {}) {
    return apiService.post('/rejeicoes/remover', {
      pedido,
      id_cliente,
      motivo_tipo: motivo.motivo_tipo,
      motivo_ignorar_outros: motivo.motivo_ignorar_outros,
      dp_pedido_manual: motivo.dp_pedido_manual,
    })
  },
  async ignorarRejeicoes(pedidos, ignorar = true, motivo = {}) {
    return apiService.post('/rejeicoes/ignorar', {
      pedidos,
      ignorar,
      motivo_tipo: motivo.motivo_tipo,
      motivo_ignorar_outros: motivo.motivo_ignorar_outros,
      dp_pedido_manual: motivo.dp_pedido_manual,
    })
  },
  async enviarWhatsappRejeicoes(pedidos) {
    return apiService.post('/rejeicoes/enviar-whatsapp', { pedidos })
  },
  async enviarWhatsappRejeicoesStream(pedidos, onProgress) {
    const resultado = await apiService.post('/rejeicoes/enviar-whatsapp', {
      pedidos,
    })
    const enviadas = resultado?.enviados ?? 0
    const total = resultado?.total ?? pedidos?.length ?? 0
    const erros = resultado?.erros ?? []
    if (typeof onProgress === 'function') {
      onProgress({ enviadas, total, erros })
    }
    return { enviadas, total, erros }
  },
  async getGruposEvolution(instanceName, participante) {
    const params = {}
    if (instanceName) params.instance = instanceName
    if (participante) params.participante = participante
    const res = await apiService.request(
      '/rejeicoes/evolution/grupos' +
        (Object.keys(params).length
          ? '?' + new URLSearchParams(params).toString()
          : ''),
      { method: 'GET', timeout: false }
    )
    return { data: res, grupos: res?.grupos }
  },
  async getInstanciasEvolution() {
    const res = await apiService.get('/rejeicoes/evolution/instancias')
    return {
      data: res,
      instancias: res?.instancias || [],
      default: res?.default,
    }
  },
  async setDefaultInstanciaEvolution(instanceName) {
    const res = await apiService.put(
      '/rejeicoes/evolution/instancias/default',
      { instance_name: instanceName }
    )
    return { data: res }
  },
  async addInstanciaEvolution(instanceName) {
    const res = await apiService.post('/rejeicoes/evolution/instancias', {
      instance_name: instanceName,
    })
    return { data: res }
  },
  async removeInstanciaEvolution(instanceName) {
    const res = await apiService.delete(
      `/rejeicoes/evolution/instancias/${encodeURIComponent(instanceName)}`
    )
    return { data: res }
  },
  async getClientesRejeicao() {
    const res = await apiService.get('/rejeicoes/clientes')
    return { data: res }
  },
  async getClientesGrupos() {
    const res = await apiService.get('/rejeicoes/clientes-grupos')
    return { data: res }
  },
  async salvarClienteGrupo(data) {
    return apiService.put('/rejeicoes/clientes-grupos', data)
  },
  async salvarClientesGruposBatch(mapeamentos) {
    return apiService.put('/rejeicoes/clientes-grupos/batch', { mapeamentos })
  },
  async mapearCorrespondencia(
    grupos,
    instanceName,
    receberMensagensAuto = true
  ) {
    if (!Array.isArray(grupos) || grupos.length === 0) {
      throw new Error('Carregue os grupos primeiro antes de mapear.')
    }
    const body = { grupos, receber_mensagens_auto: receberMensagensAuto }
    if (instanceName) body.instance = instanceName
    return apiService.post(
      '/rejeicoes/clientes-grupos/mapear-correspondencia',
      body
    )
  },
}

export const numerosAdminService = {
  async listar() {
    const res = await apiService.get('/rejeicoes/numeros-admin')
    return { numeros: res?.numeros || [] }
  },
  async adicionar(numero, nome) {
    return apiService.post('/rejeicoes/numeros-admin', { numero, nome })
  },
  async remover(id) {
    return apiService.delete(`/rejeicoes/numeros-admin/${id}`)
  },
}

export const adminGruposCacheService = {
  async obter(adminNumero, instanceName) {
    const params = { admin: adminNumero }
    if (instanceName) params.instance = instanceName
    const res = await apiService.get('/rejeicoes/admin-grupos-cache', params)
    return { grupos: res?.grupos || [], fetched_at: res?.fetched_at }
  },
  async salvar(adminNumero, instanceName, grupos) {
    return apiService.put('/rejeicoes/admin-grupos-cache', {
      admin: adminNumero,
      instance: instanceName,
      grupos: Array.isArray(grupos) ? grupos : [],
    })
  },
}

export const configuracaoRejeicaoService = {
  async getConfiguracao() {
    const data = await apiService.get('/configuracao-rejeicao')
    return { data }
  },
  async atualizarConfiguracao(data) {
    return apiService.put('/configuracao-rejeicao', data)
  },
  async verificarStatus(data) {
    return apiService.post(
      '/configuracao-rejeicao/verificar-status',
      data || {}
    )
  },
  /** Envio de teste pode demorar (Evolution API envia de fato ao WhatsApp). Timeout maior para evitar "Requisição expirou". */
  async enviarTeste(data) {
    return apiService.request('/configuracao-rejeicao/enviar-teste', {
      method: 'POST',
      body: JSON.stringify(data || {}),
      timeout: 90000,
    })
  },
  /** Diagnóstico de envio WhatsApp: API usada, config, tabelas (para validar por que mensagens não saem). */
  async getDiagnosticoEnvio() {
    return apiService.get('/configuracao-rejeicao/diagnostico-envio')
  },
}

export const configPedidosService = {
  async getConfig() {
    const res = await apiService.get('/bi/pedidos-config')
    return { config: res?.config ?? res }
  },
  async atualizarConfig(data) {
    return apiService.put('/bi/pedidos-config', data)
  },
  async enviarTeste(tipos) {
    return apiService.request('/bi/enviar-teste', {
      method: 'POST',
      body: JSON.stringify({ tipos }),
      timeout: 85000,
    })
  },
}
