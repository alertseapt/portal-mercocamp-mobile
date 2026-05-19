// ===================================================
// VERSION SERVICE - Sistema de Verificação de Versão
// ===================================================

import axios from 'axios'

class VersionService {
  constructor() {
    this.currentVersion = null
    this.checkInterval = null
    this.isChecking = false
  }

  /**
   * Inicia a verificação periódica de versão
   * @param {number} intervalMinutes - Intervalo em minutos entre verificações
   */
  startVersionCheck(intervalMinutes = 5) {
    console.log(
      `🔄 Iniciando verificação de versão a cada ${intervalMinutes} minutos`
    )

    // Fazer primeira verificação imediatamente
    this.checkVersion()

    // Configurar verificação periódica
    const intervalMs = intervalMinutes * 60 * 1000
    this.checkInterval = setInterval(() => {
      this.checkVersion()
    }, intervalMs)
  }

  /**
   * Para a verificação periódica de versão
   */
  stopVersionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('⏹️ Verificação de versão parada')
    }
  }

  /**
   * Verifica se há uma nova versão disponível
   */
  async checkVersion() {
    if (this.isChecking) {
      console.log('⏳ Verificação de versão já em andamento, pulando...')
      return
    }

    this.isChecking = true

    try {
      // Obter versão atual do build-info.json (com cache busting)
      // IMPORTANTE: Buscar da raiz do frontend, não da API do backend
      const timestamp = Date.now()
      const buildInfoUrl = `${window.location.origin}/build-info.json?t=${timestamp}`
      const response = await axios.get(buildInfoUrl, {
        timeout: 5000,
        // Não usar baseURL do axios (que aponta para a API)
        baseURL: undefined,
      })

      const serverVersion = response.data.version
      const buildTime = response.data.buildTime

      console.log('📦 Versão no servidor:', serverVersion)
      console.log('🕐 Build time:', buildTime)

      // Se é a primeira verificação, apenas armazenar a versão
      if (!this.currentVersion) {
        this.currentVersion = serverVersion
        console.log('✅ Versão inicial carregada:', this.currentVersion)
        return
      }

      // Verificar se há uma nova versão
      if (serverVersion !== this.currentVersion) {
        console.log('🆕 Nova versão detectada!')
        console.log('   Versão atual:', this.currentVersion)
        console.log('   Nova versão:', serverVersion)

        // Notificar o usuário (modal do sistema, não `window.confirm`)
        await this.notifyNewVersion(serverVersion)

        // Atualizar versão atual
        this.currentVersion = serverVersion
      } else {
        console.log('✅ Aplicação está atualizada')
      }
    } catch (error) {
      // Em desenvolvimento, o arquivo build-info.json pode não existir (404)
      // Isso é esperado e não é um erro real
      if (error.response && error.response.status === 404) {
        // Silenciar erro 404 em desenvolvimento
        if (!this.currentVersion) {
          console.log(
            'ℹ️ build-info.json não encontrado (modo desenvolvimento)'
          )
        }
      } else {
        // Outros erros são logados
        console.warn('⚠️ Erro ao verificar versão:', error.message)
      }
    } finally {
      this.isChecking = false
    }
  }

  /**
   * Notifica o usuário sobre uma nova versão (modal centralizado do Portal).
   */
  async notifyNewVersion(newVersion) {
    try {
      const { useSystemDialogStore } = await import('@/stores/systemDialog.js')
      const dialogStore = useSystemDialogStore()
      const message =
        `Uma nova versão (${newVersion}) está disponível.\n\n` +
        'Deseja recarregar a página para atualizar?'
      const confirmed = await dialogStore.showConfirm(
        message,
        'Atualização disponível',
        { primaryLabel: 'Recarregar' }
      )
      if (confirmed) {
        console.log('🔄 Recarregando página para aplicar nova versão...')
        window.location.reload()
      } else {
        console.log('ℹ️ Usuário optou por não atualizar agora')
      }
    } catch (e) {
      console.warn(
        '⚠️ Modal de versão indisponível, usando confirmação nativa:',
        e?.message || e
      )
      const message = `Uma nova versão (${newVersion}) está disponível.\n\nDeseja recarregar a página para atualizar?`
      if (window.confirm(message)) {
        window.location.reload()
      }
    }
  }

  /**
   * Força uma verificação manual
   */
  async forceCheck() {
    console.log('🔍 Verificação manual de versão solicitada')
    await this.checkVersion()
  }
}

// Exportar instância singleton
const versionService = new VersionService()
export default versionService
