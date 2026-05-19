import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import axios from 'axios'
import { BASE_URL } from './config/api.js'
import versionService from './services/versionService.js'

// Importar estilos
import './assets/css/main.css'
import './assets/css/vue-components.css'

// Configurar axios defaults usando configuração centralizada
axios.defaults.baseURL = BASE_URL

// Interceptor para corrigir URL duplicada /api/api/* (evita 404)
axios.interceptors.request.use(
  config => {
    const base = config.baseURL || ''
    const url = config.url || ''
    // Se baseURL termina com /api e url começa com /api, remover duplicata
    if (
      base &&
      url &&
      (base.endsWith('/api') || base.endsWith('/api/')) &&
      url.startsWith('/api')
    ) {
      config.url = url.replace(/^\/api\/?/, '/') || '/'
    }
    return config
  },
  error => {
    console.error('Erro na requisição axios:', error)
    return Promise.reject(error)
  }
)

// Interceptor para logar erros de resposta do axios
axios.interceptors.response.use(
  response => response,
  error => {
    const isAborted =
      error?.message === 'Request aborted' || error?.code === 'ERR_CANCELED'
    if (!isAborted) {
      console.error(
        `[axios] ${error?.response?.status ?? 'network'} ${error.config?.url}`,
        error?.response?.data ?? error.message
      )
    }
    return Promise.reject(error)
  }
)

// SISTEMA SIMPLES - APENAS VERIFICAÇÃO BÁSICA DE TOKEN

// Renderizar fallback de erro quando Vue falha ao montar (evita tela em branco)
function showMountErrorFallback(message, error) {
  console.error('[main.js] Fallback de erro:', message, error)
  const appEl = document.getElementById('app')
  if (!appEl) return
  appEl.innerHTML = `
    <div style="padding: 2rem; max-width: 500px; margin: 2rem auto; font-family: 'Poppins', sans-serif; text-align: center; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
      <h2 style="color: #333; margin: 0 0 1rem;">Erro ao carregar o sistema</h2>
      <p style="color: #666; margin: 0 0 1.5rem;">${message}</p>
      <button onclick="localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='/login.html';" 
        style="padding: 0.6rem 1.5rem; background: #0d6efd; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
        Fazer logout e tentar novamente
      </button>
    </div>
  `
}

// Aguardar um pouco para garantir que localStorage está atualizado após login
setTimeout(() => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')

  if (!token || !userData || userData === 'null' || userData === '{}') {
    const currentPath = window.location.pathname
    if (currentPath === '/login.html' || currentPath.includes('login.html'))
      return
    window.location.href = '/login.html'
  } else {
    let user
    try {
      user = JSON.parse(userData)
      // Normalizar level_access (pode vir como string "1" do backend)
      if (
        user &&
        typeof user.level_access !== 'number' &&
        user.level_access != null
      ) {
        user.level_access = Number(user.level_access)
      }
      // Garantir estrutura mínima para evitar erros em usuários específicos
      if (!user || typeof user !== 'object') {
        throw new Error('Dados do usuário inválidos')
      }
      if (!user.cli_access) {
        user.cli_access = {}
      } else if (typeof user.cli_access === 'string') {
        try {
          user.cli_access = JSON.parse(user.cli_access) || {}
        } catch (_) {
          user.cli_access = {}
        }
      }
    } catch (parseError) {
      console.error('Erro ao processar dados do usuário:', parseError)
      window.location.href = '/login.html'
      return
    }

    // Verificar página e montar app
    const currentPath = window.location.pathname

    if (Number(user.level_access) === 9) {
      if (currentPath.includes('schedule-verification.html')) {
        // Manter em verificação
      } else {
        // Pode acessar ambas
      }
    } else if (currentPath.includes('schedule-verification.html')) {
      console.log(
        'Usuário normal na página de verificação - redirecionando para dashboard'
      )
      window.location.href = '/'
      return
    }

    try {
      const app = createApp(App)
      app.use(createPinia())
      app.config.globalProperties.$http = axios
      // Diálogos do sistema - use $showConfirm(msg, title) e $showAlert(msg, title) em qualquer componente
      app.config.globalProperties.$showConfirm = async (
        msg,
        title = 'Confirmação'
      ) => {
        const { useSystemDialogStore } =
          await import('./stores/systemDialog.js')
        return useSystemDialogStore().showConfirm(msg, title)
      }
      app.config.globalProperties.$showAlert = async (msg, title = 'Aviso') => {
        const { useSystemDialogStore } =
          await import('./stores/systemDialog.js')
        return useSystemDialogStore().showAlert(msg, title)
      }
      app.config.errorHandler = (err, instance, info) => {
        console.error('[Vue Error]', info, err)
        try {
          if (instance?.setLoading) instance.setLoading(false)
        } catch (_) {}
      }
      app.mount('#app')
      versionService.startVersionCheck(5)
    } catch (mountError) {
      console.error('Erro ao montar aplicação Vue:', mountError)
      showMountErrorFallback(
        'Não foi possível carregar a interface. Isso pode ocorrer devido a dados de sessão incompatíveis ou problema no navegador.',
        mountError
      )
    }
  }
}, 400) // Reduzido para 400ms; evita race com sessões lentas
