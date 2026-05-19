<template>
  <div class="system-page">
    <div class="page-header">
      <h2>
        <i class="fas fa-cogs"></i>
        Sistema - Serviços Automáticos
      </h2>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader-spinner"></div>
      <p>Carregando serviços...</p>
    </div>

    <!-- Services List -->
    <div v-else class="services-container">
      <!-- M1 Atacadista Óptico Special Rule -->
      <div class="service-card">
        <div
          class="service-header"
          @click="expandedM1Rule = !expandedM1Rule"
          style="cursor: pointer"
        >
          <div class="service-title-section">
            <div
              class="service-icon special-icon"
              style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              "
            >
              <i class="fas fa-adjust"></i>
            </div>
            <div class="service-info">
              <h3>Regra Especial - Dobragem de Quantidades</h3>
              <p class="service-description">
                Processo especial aplicado automaticamente nas integrações com
                CorpEM para estoques específicos. As quantidades dos produtos
                são automaticamente dobradas nas integrações, mantendo os
                valores totais iguais aos da NF-e.
              </p>
            </div>
          </div>
          <div class="service-status">
            <i
              class="fas expand-icon"
              :class="expandedM1Rule ? 'fa-chevron-up' : 'fa-chevron-down'"
            ></i>
          </div>
        </div>

        <transition name="slide">
          <div v-show="expandedM1Rule" class="service-body-wrapper">
            <div class="service-body">
              <!-- Client Information -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-building"></i>
                  Estoques que Aplicam a Regra
                </label>
                <div class="config-value" style="margin-bottom: 1rem">
                  <p style="margin-bottom: 0.5rem">
                    <strong>M1 Atacadista Óptico Ltda (Nº 472)</strong>
                  </p>
                  <p class="config-hint" style="margin-bottom: 1rem">
                    <i class="fas fa-id-card"></i>
                    CNPJ: 55.573.420/0001-59
                  </p>
                  <p style="margin-bottom: 0.5rem">
                    <strong>CXS ATACADISTA LTDA (Nº 636)</strong>
                  </p>
                  <p class="config-hint">
                    <i class="fas fa-id-card"></i>
                    CNPJ: 61.430.718/0001-02
                  </p>
                </div>
              </div>

              <!-- Rule Description -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-info-circle"></i>
                  Regra Aplicada
                </label>
                <div class="rule-details">
                  <div class="rule-item">
                    <i class="fas fa-arrow-up" style="color: #667eea"></i>
                    <span
                      ><strong>Quantidades (QTPROD):</strong> Dobradas
                      automaticamente (×2)</span
                    >
                  </div>
                  <div class="rule-item">
                    <i class="fas fa-equals" style="color: #764ba2"></i>
                    <span
                      ><strong>Valores Totais (VLTOTPROD/VLTOTALNF):</strong>
                      Mantidos iguais aos da NF-e</span
                    >
                  </div>
                </div>
              </div>

              <!-- Application Scope -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-cogs"></i>
                  Onde é Aplicada
                </label>
                <div class="application-scope">
                  <div class="scope-item">
                    <i class="fas fa-check-circle" style="color: #10b981"></i>
                    <span>Integração de NF-e de Entrada (DP de Entrada)</span>
                  </div>
                  <div class="scope-item">
                    <i class="fas fa-check-circle" style="color: #10b981"></i>
                    <span>Criação de Pedidos de Saída (DP de Saída)</span>
                  </div>
                  <div class="scope-item">
                    <i class="fas fa-check-circle" style="color: #10b981"></i>
                    <span>Integração de Pedidos de Saída</span>
                  </div>
                  <div class="scope-item">
                    <i class="fas fa-check-circle" style="color: #10b981"></i>
                    <span>Criação em Lote de Pedidos de Saída</span>
                  </div>
                </div>
              </div>

              <!-- Portal Display -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-eye"></i>
                  Exibição no Portal
                </label>
                <p class="config-value">
                  <i class="fas fa-info-circle" style="color: #3b82f6"></i>
                  As informações exibidas no portal permanecem como na NF-e
                  original (quantidades e valores não alterados)
                </p>
                <p class="config-hint">
                  <i
                    class="fas fa-exclamation-triangle"
                    style="color: #f59e0b"
                  ></i>
                  A regra especial é aplicada apenas nas integrações com CorpEM,
                  não afetando a visualização no portal
                </p>
              </div>

              <!-- Recent Changes -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-history"></i>
                  Alterações Recentes
                </label>
                <div class="changes-list">
                  <div class="change-item">
                    <i class="fas fa-plus-circle" style="color: #10b981"></i>
                    <div class="change-content">
                      <p class="change-date">Atualização recente</p>
                      <p class="change-description">
                        <strong>Novo estoque adicionado:</strong> CXS ATACADISTA
                        LTDA (Nº 636) - CNPJ: 61.430.718/0001-02
                      </p>
                      <p class="change-details">
                        Este estoque agora também aplica a regra especial de
                        dobragem de quantidades nas integrações com CorpEM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Example -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-calculator"></i>
                  Exemplo Prático
                </label>
                <div class="example-box">
                  <div class="example-item">
                    <strong>NF-e Original:</strong>
                    <ul>
                      <li>Produto A: Qtd: 10, Valor: R$ 100,00</li>
                      <li>Produto B: Qtd: 5, Valor: R$ 50,00</li>
                      <li><strong>Total NF-e: R$ 150,00</strong></li>
                    </ul>
                  </div>
                  <div class="example-item">
                    <strong>Enviado para CorpEM:</strong>
                    <ul>
                      <li>
                        Produto A: Qtd: 20 (dobrado), Valor: R$ 100,00 (mantido)
                      </li>
                      <li>
                        Produto B: Qtd: 10 (dobrado), Valor: R$ 50,00 (mantido)
                      </li>
                      <li><strong>Total: R$ 150,00 (mantido)</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Expedition Monitoring Service -->
      <div class="service-card">
        <div
          class="service-header"
          @click="expandedExpeditionMonitor = !expandedExpeditionMonitor"
          style="cursor: pointer"
        >
          <div class="service-title-section">
            <div class="service-icon expedition-icon">
              <i class="fas fa-truck"></i>
            </div>
            <div class="service-info">
              <h3>Monitoramento de Status de Expedições</h3>
              <p class="service-description">
                Monitora automaticamente o status de pedidos de expedição
                (crossdocking) consultando o sistema CorpEM (Tópico 12).
                Atualiza o status dos pedidos quando há mudanças no sistema
                CorpEM, garantindo sincronização entre os sistemas.
              </p>
            </div>
          </div>
          <div class="service-status">
            <span v-if="expeditionMonitor.isRunning" class="auto-update-badge">
              <i class="fas fa-sync-alt rotating"></i>
              Atualização automática
            </span>
            <i
              class="fas expand-icon"
              :class="
                expandedExpeditionMonitor ? 'fa-chevron-up' : 'fa-chevron-down'
              "
            ></i>
          </div>
        </div>

        <transition name="slide">
          <div v-show="expandedExpeditionMonitor" class="service-body-wrapper">
            <div class="service-body">
              <!-- Environment Configuration -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-database"></i>
                  Ambiente de Banco de Dados e CorpEM
                </label>
                <div class="config-options">
                  <div class="radio-option">
                    <input
                      type="radio"
                      id="expedition-env-homolog"
                      value="homolog"
                      v-model="expeditionMonitor.environment"
                      :disabled="expeditionMonitor.isRunning"
                    />
                    <label for="expedition-env-homolog">
                      <i class="fas fa-flask"></i>
                      Homologação (dbcheckout + CorpEM Homolog)
                    </label>
                  </div>
                  <div class="radio-option">
                    <input
                      type="radio"
                      id="expedition-env-production"
                      value="production"
                      v-model="expeditionMonitor.environment"
                      :disabled="expeditionMonitor.isRunning"
                    />
                    <label for="expedition-env-production">
                      <i class="fas fa-server"></i>
                      Produção (dbcheckout + CorpEM Produção)
                    </label>
                  </div>
                </div>
                <p class="config-hint" v-if="expeditionMonitor.isRunning">
                  <i class="fas fa-info-circle"></i>
                  Desative o serviço para alterar o ambiente
                </p>
                <p class="config-hint" v-if="expeditionMonitor.corpemUrl">
                  <i class="fas fa-link"></i>
                  Endpoint CorpEM: {{ expeditionMonitor.corpemUrl }}
                </p>
              </div>

              <!-- Service Interval -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-clock"></i>
                  Intervalo de Verificação
                </label>
                <p class="config-value">
                  {{ expeditionMonitor.interval }} segundos ({{
                    Math.floor(expeditionMonitor.interval / 60)
                  }}
                  minutos)
                </p>
              </div>

              <!-- Method Information -->
              <div class="config-section">
                <label class="config-label">
                  <i class="fas fa-info-circle"></i>
                  Método de Verificação
                </label>
                <p class="config-value method-info">
                  <i class="fas fa-exchange-alt"></i>
                  Consulta ativa ao CorpEM (Tópico 12)
                </p>
                <p class="config-hint">
                  <i class="fas fa-check-circle"></i>
                  Consulta o status de pedidos no sistema CorpEM a cada 2
                  minutos. Quando encontra mudanças de status, atualiza
                  automaticamente no banco de dados.
                </p>
              </div>

              <!-- Statistics -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="fas fa-check-double"></i>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Verificações Totais</span>
                    <span class="stat-value">{{
                      expeditionMonitor.stats.totalChecks
                    }}</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="fas fa-shipping-fast"></i>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Pedidos Processados</span>
                    <span class="stat-value">{{
                      expeditionMonitor.stats.expeditionsProcessed
                    }}</span>
                  </div>
                </div>
                <div class="stat-card success">
                  <div class="stat-icon">
                    <i class="fas fa-arrow-up"></i>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Status Atualizados</span>
                    <span class="stat-value">{{
                      expeditionMonitor.stats.statusUpdated
                    }}</span>
                  </div>
                </div>
                <div
                  class="stat-card error"
                  v-if="expeditionMonitor.stats.errors > 0"
                >
                  <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Erros</span>
                    <span class="stat-value">{{
                      expeditionMonitor.stats.errors
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Last Check Info -->
              <div
                class="config-section"
                v-if="expeditionMonitor.lastCheckTime"
              >
                <label class="config-label">
                  <i class="fas fa-history"></i>
                  Última Verificação
                </label>
                <p class="config-value">
                  {{ formatDate(expeditionMonitor.lastCheckTime) }}
                </p>
                <p class="config-hint" v-if="expeditionMonitor.nextCheckIn">
                  <i class="fas fa-clock"></i>
                  Próxima verificação:
                  {{ formatTime(expeditionMonitor.nextCheckIn) }}
                </p>
              </div>

              <!-- Not Found in CorpEM List -->
              <div
                class="config-section"
                v-if="
                  expeditionMonitor.notFoundInCorpem &&
                  expeditionMonitor.notFoundInCorpem.length > 0
                "
              >
                <div class="not-found-header">
                  <label class="config-label">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pedidos Não Encontrados no CorpEM
                    <span class="badge-count">{{
                      expeditionMonitor.notFoundInCorpem.length
                    }}</span>
                  </label>
                  <button
                    type="button"
                    class="btn-toggle-list"
                    @click.prevent="
                      showExpeditionNotFoundList = !showExpeditionNotFoundList
                    "
                  >
                    <i
                      :class="
                        showExpeditionNotFoundList
                          ? 'fas fa-chevron-up'
                          : 'fas fa-chevron-down'
                      "
                    ></i>
                    {{ showExpeditionNotFoundList ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                <div
                  v-if="showExpeditionNotFoundList"
                  class="not-found-table-container"
                >
                  <div
                    class="last-verification-info"
                    v-if="expeditionMonitor.lastCheckTime"
                  >
                    <i class="fas fa-clock"></i>
                    <span
                      >Última verificação:
                      {{
                        formatDateTime(expeditionMonitor.lastCheckTime)
                      }}</span
                    >
                  </div>
                  <table class="not-found-table">
                    <thead>
                      <tr>
                        <th title="Número do pedido">
                          <span class="th-content">
                            Pedido
                            <i
                              class="fas fa-info-circle th-tooltip-icon"
                              title="Número do pedido"
                            ></i>
                          </span>
                        </th>
                        <th title="CNPJ do armazém">
                          <span class="th-content">
                            CNPJ
                            <i
                              class="fas fa-info-circle th-tooltip-icon"
                              title="CNPJ do armazém"
                            ></i>
                          </span>
                        </th>
                        <th title="Data da última verificação">
                          <span class="th-content">
                            Última Verificação
                            <i
                              class="fas fa-info-circle th-tooltip-icon"
                              title="Data da última verificação"
                            ></i>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in expeditionMonitor.notFoundInCorpem"
                        :key="item.id"
                      >
                        <td class="td-nfe">{{ item.numero_pedido || '-' }}</td>
                        <td class="td-corpem">{{ item.cnpj || '-' }}</td>
                        <td class="td-criado">
                          {{
                            item.lastCheck
                              ? formatDateTime(item.lastCheck)
                              : '-'
                          }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Service Actions -->
            <div class="service-actions">
              <button
                type="button"
                v-if="!expeditionMonitor.isRunning"
                class="btn btn-success"
                @click.prevent="startExpeditionMonitor"
                :disabled="actionLoading"
              >
                <i class="fas fa-play"></i>
                Ativar Serviço
              </button>
              <button
                type="button"
                v-else
                class="btn btn-danger"
                @click.prevent="stopExpeditionMonitor"
                :disabled="actionLoading"
              >
                <i class="fas fa-stop"></i>
                Desativar Serviço
              </button>
              <button
                type="button"
                class="btn btn-outline"
                @click.prevent="refreshExpeditionStats"
                :disabled="actionLoading"
              >
                <i
                  :class="
                    actionLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'
                  "
                ></i>
                Atualizar
              </button>
              <button
                type="button"
                v-if="expeditionMonitor.isRunning"
                class="btn btn-outline"
                @click.prevent="resetExpeditionStats"
                :disabled="actionLoading"
              >
                <i class="fas fa-redo"></i>
                Resetar Estatísticas
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api'

export default {
  name: 'SystemPage',
  data() {
    return {
      loading: true,
      actionLoading: false,
      showExpeditionNotFoundList: false,
      pollingInterval: null,
      expandedM1Rule: false,
      expandedExpeditionMonitor: false,
      expeditionMonitor: {
        isRunning: false,
        environment: 'homolog', // homolog ou production
        interval: 120, // em segundos (2 minutos)
        lastCheckTime: null,
        nextCheckIn: null,
        stats: {
          totalChecks: 0,
          expeditionsProcessed: 0,
          statusUpdated: 0,
          errors: 0,
        },
        notFoundInCorpem: [],
        corpemUrl: '',
      },
    }
  },
  mounted() {
    // Verificar permissão antes de carregar (apenas levels 0 e 1)
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.level_access > 1) {
          // Usuário não tem permissão
          return
        }
      } catch (e) {
        console.error('Erro ao parsear dados do usuário:', e)
      }
    }

    this.loadExpeditionMonitorStatus()
    this.startPolling()
  },
  beforeUnmount() {
    this.stopPolling()
  },
  methods: {
    async loadExpeditionMonitorStatus(silent = false) {
      // Salvar posição do scroll antes de atualizar (se não for atualização silenciosa)
      const scrollPosition = !silent
        ? window.pageYOffset || document.documentElement.scrollTop
        : null

      if (!silent) {
        this.loading = true
      }
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/system/expedition-monitor', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
          this.expeditionMonitor.isRunning = response.data.isRunning
          this.expeditionMonitor.environment = response.data.environment
          // checkInterval vem em milissegundos do backend
          this.expeditionMonitor.interval = response.data.checkInterval
            ? response.data.checkInterval / 1000
            : 120
          this.expeditionMonitor.lastCheckTime = response.data.lastCheckTime
          this.expeditionMonitor.nextCheckIn = response.data.nextCheckIn
          this.expeditionMonitor.stats = response.data.stats
          this.expeditionMonitor.notFoundInCorpem =
            response.data.notFoundInCorpem || []
          this.expeditionMonitor.corpemUrl = response.data.corpemUrl || ''

          // Restaurar posição do scroll após atualização (se foi salva)
          if (scrollPosition !== null) {
            this.$nextTick(() => {
              window.scrollTo(0, scrollPosition)
            })
          }
        }
      } catch (error) {
        const status = error.response?.status
        const is502 = status === 502
        if (is502) {
          console.warn(
            '[SystemPage] Monitor de expedições: servidor indisponível (502 Bad Gateway).'
          )
        } else {
          console.error(
            'Erro ao carregar status do serviço de monitoramento de expedições:',
            error
          )
        }
        if (!silent) {
          this.$emit('show-notification', {
            type: 'error',
            message: is502
              ? 'Serviço temporariamente indisponível (502). Tente novamente em alguns minutos.'
              : 'Erro ao carregar status do serviço de monitoramento de expedições',
          })
        }

        if (scrollPosition !== null) {
          this.$nextTick(() => {
            window.scrollTo(0, scrollPosition)
          })
        }
      } finally {
        if (!silent) {
          this.loading = false
        }
      }
    },

    startPolling() {
      // Atualizar a cada 30 segundos (antes do ciclo de 120s do backend)
      this.pollingInterval = setInterval(() => {
        this.loadExpeditionMonitorStatus(true) // Silent update
      }, 30000) // 30 segundos
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    },

    async startExpeditionMonitor(event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Salvar posição atual do scroll
      const scrollPosition =
        window.pageYOffset || document.documentElement.scrollTop

      this.actionLoading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          '/system/expedition-monitor/start',
          { environment: this.expeditionMonitor.environment },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.success) {
          this.$emit('show-notification', {
            type: 'success',
            message:
              'Serviço de Monitoramento de Expedições ativado com sucesso',
          })
          await this.loadExpeditionMonitorStatus()

          // Restaurar posição do scroll após atualização
          this.$nextTick(() => {
            window.scrollTo(0, scrollPosition)
          })

          // Aguardar 35 segundos e atualizar novamente para pegar dados da primeira verificação
          setTimeout(() => {
            const currentScroll =
              window.pageYOffset || document.documentElement.scrollTop
            this.loadExpeditionMonitorStatus(true).then(() => {
              this.$nextTick(() => {
                window.scrollTo(0, currentScroll)
              })
            })
          }, 35000)
        }
      } catch (error) {
        console.error(
          'Erro ao ativar serviço de monitoramento de expedições:',
          error
        )
        this.$emit('show-notification', {
          type: 'error',
          message:
            error.response?.data?.message ||
            'Erro ao ativar serviço de monitoramento de expedições',
        })

        // Restaurar posição do scroll mesmo em caso de erro
        this.$nextTick(() => {
          window.scrollTo(0, scrollPosition)
        })
      } finally {
        this.actionLoading = false
      }
    },

    async stopExpeditionMonitor(event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Salvar posição atual do scroll
      const scrollPosition =
        window.pageYOffset || document.documentElement.scrollTop

      this.actionLoading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          '/system/expedition-monitor/stop',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.success) {
          this.$emit('show-notification', {
            type: 'success',
            message:
              'Serviço de Monitoramento de Expedições desativado com sucesso',
          })
          await this.loadExpeditionMonitorStatus()

          // Restaurar posição do scroll após atualização
          this.$nextTick(() => {
            window.scrollTo(0, scrollPosition)
          })
        }
      } catch (error) {
        console.error(
          'Erro ao desativar serviço de monitoramento de expedições:',
          error
        )
        this.$emit('show-notification', {
          type: 'error',
          message:
            error.response?.data?.message ||
            'Erro ao desativar serviço de monitoramento de expedições',
        })

        // Restaurar posição do scroll mesmo em caso de erro
        this.$nextTick(() => {
          window.scrollTo(0, scrollPosition)
        })
      } finally {
        this.actionLoading = false
      }
    },

    async refreshExpeditionStats(event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Salvar posição atual do scroll
      const scrollPosition =
        window.pageYOffset || document.documentElement.scrollTop

      await this.loadExpeditionMonitorStatus()

      // Restaurar posição do scroll após atualização
      this.$nextTick(() => {
        window.scrollTo(0, scrollPosition)
      })
    },

    async resetExpeditionStats(event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Salvar posição atual do scroll
      const scrollPosition =
        window.pageYOffset || document.documentElement.scrollTop

      this.actionLoading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          '/system/expedition-monitor/reset-stats',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.success) {
          this.$emit('show-notification', {
            type: 'success',
            message: 'Estatísticas resetadas com sucesso',
          })
          await this.loadExpeditionMonitorStatus()

          // Restaurar posição do scroll após atualização
          this.$nextTick(() => {
            window.scrollTo(0, scrollPosition)
          })
        }
      } catch (error) {
        console.error('Erro ao resetar estatísticas:', error)
        this.$emit('show-notification', {
          type: 'error',
          message:
            error.response?.data?.message || 'Erro ao resetar estatísticas',
        })

        // Restaurar posição do scroll mesmo em caso de erro
        this.$nextTick(() => {
          window.scrollTo(0, scrollPosition)
        })
      } finally {
        this.actionLoading = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR')
    },

    formatTime(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    formatDateTime(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
    formatDateOnly(dateString) {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '-'
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      } catch (error) {
        return '-'
      }
    },
  },
}
</script>

<style scoped>
.system-page {
  padding: 24px;
  scroll-behavior: auto;
}

.system-page button {
  scroll-margin: 0;
}

/* Prevenir scroll automático ao clicar em botões */
.system-page button:focus {
  outline: none;
}

.system-page button:active {
  outline: none;
}

/* Prevenir scroll quando elementos são atualizados */
.service-card {
  scroll-margin: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loader-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.services-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.service-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  padding-right: 60px; /* Espaço extra no lado direito para a seta */
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
  position: relative;
  gap: 16px; /* Espaço entre título e status */
}

.service-header:hover {
  background-color: #f8fafc;
}

.service-title-section {
  display: flex;
  gap: 16px;
  flex: 1;
  min-width: 0; /* Permitir que encolha se necessário */
  overflow: hidden; /* Evitar overflow */
}

.service-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.service-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.service-description {
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.service-status {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: fit-content; /* Garantir que o conteúdo seja visível */
  max-width: none; /* Remover qualquer limitação de largura */
}

.expand-icon {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 18px;
  color: #64748b;
  transition:
    transform 0.3s ease,
    color 0.2s;
  pointer-events: none; /* Permite clicar através da seta no header */
}

.service-header:hover .expand-icon {
  color: #3b82f6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap; /* Evitar quebra de linha */
  flex-shrink: 0; /* Não encolher */
  min-width: fit-content; /* Garantir que o conteúdo seja visível */
}

/* Sobrescrever qualquer classe auto-resize que possa estar sendo aplicada */
.status-badge.auto-resize-tiny,
.status-badge.auto-resize-small {
  font-size: 16px !important;
  padding: 12px 24px !important;
  min-width: fit-content !important;
  width: auto !important;
  max-width: none !important;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.auto-update-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
  white-space: nowrap; /* Evitar quebra de linha */
  flex-shrink: 0; /* Não encolher */
  min-width: fit-content; /* Garantir que o conteúdo seja visível */
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

.rotating {
  animation: rotate 2s linear infinite;
}

.service-body-wrapper {
  overflow: hidden;
}

.service-body {
  padding: 24px;
}

.config-section {
  margin-bottom: 24px;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  font-size: 14px;
}

.config-options {
  display: flex;
  gap: 16px;
}

.radio-option {
  flex: 1;
}

.radio-option input[type='radio'] {
  display: none;
}

.radio-option label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #475569;
}

.radio-option input[type='radio']:checked + label {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1e40af;
}

.radio-option input[type='radio']:disabled + label {
  cursor: not-allowed;
  opacity: 0.6;
}

.config-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-value {
  color: #475569;
  font-size: 14px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.config-value.method-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1e40af;
  background: #eff6ff;
  margin: 0;
}

.service-actions {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-outline {
  background: white;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline:hover:not(:disabled) {
  background: #eff6ff;
}

.placeholder-card {
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
}

.placeholder-card i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #cbd5e1;
}

.placeholder-card p {
  margin: 0;
  font-size: 14px;
}

/* Not Found in WJT List */
.not-found-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  transition: all 0.2s;
}

.not-found-header:hover {
  background: #fde68a;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.not-found-header .config-label {
  margin: 0;
  color: #92400e;
}

.last-update {
  font-size: 12px;
  color: #b45309;
  display: flex;
  align-items: center;
  gap: 6px;
}

.last-update i {
  font-size: 10px;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  margin-left: 8px;
  background: #f59e0b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  margin-left: 8px;
  background: #f59e0b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.btn-toggle-list {
  background: transparent;
  border: none;
  color: #92400e;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-toggle-list:hover {
  background: #fde68a;
}

.not-found-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.not-found-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-weight: 600;
  color: #92400e;
  font-size: 13px;
  min-width: 100px;
}

.field-value {
  color: #1e293b;
  font-size: 13px;
}

.not-found-meta {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #fcd34d;
}

.meta-text {
  font-size: 11px;
  color: #78716c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.not-found-list {
  margin-top: 12px;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.not-found-table-container {
  margin-top: 12px;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  overflow: hidden;
}

.last-verification-info {
  padding: 12px 16px;
  background: #fef3c7;
  border-bottom: 1px solid #fbbf24;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #92400e;
  font-weight: 500;
}

.last-verification-info i {
  font-size: 12px;
}

.not-found-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.not-found-table thead {
  background: #fef3c7;
  border-bottom: 2px solid #fbbf24;
}

.not-found-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.th-tooltip-icon {
  font-size: 11px;
  color: #b45309;
  cursor: help;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.th-tooltip-icon:hover {
  opacity: 1;
}

.not-found-table tbody tr {
  border-bottom: 1px solid #fde68a;
  transition: background 0.15s;
}

.not-found-table tbody tr:hover {
  background: #fffbeb;
}

.not-found-table tbody tr:last-child {
  border-bottom: none;
}

.not-found-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #1e293b;
}

.td-nfe {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1e40af;
}

.td-corpem {
  font-family: 'Courier New', monospace;
  color: #475569;
}

.td-nome {
  color: #1e293b;
  font-weight: 500;
}

.td-criado {
  color: #64748b;
  font-size: 12px;
}

.not-found-item {
  padding: 12px;
  margin-bottom: 12px;
  background: white;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.not-found-item:last-child {
  margin-bottom: 0;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
}

.info-badge i {
  font-size: 11px;
}

.id-badge {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.nf-badge {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #a5b4fc;
}

.client-badge {
  background: #f3e8ff;
  color: #6b21a8;
  border: 1px solid #d8b4fe;
}

.cnpj-badge {
  background: #fce7f3;
  color: #9f1239;
  border: 1px solid #fbcfe8;
}

.corpem-badge {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.date-badge {
  background: #fed7aa;
  color: #9a3412;
  border: 1px solid #fdba74;
}

/* M1 Special Rule Styles */
.rule-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-left: 3px solid #667eea;
  border-radius: 6px;
}

.rule-item i {
  font-size: 18px;
  flex-shrink: 0;
}

.application-scope {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.scope-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f0fdf4;
  border-radius: 6px;
}

.scope-item i {
  font-size: 16px;
  flex-shrink: 0;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.change-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.change-item i {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.change-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.change-date {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.change-description {
  font-size: 14px;
  color: #1e293b;
  margin: 0;
  line-height: 1.5;
}

.change-description strong {
  color: #059669;
  font-weight: 600;
}

.change-details {
  font-size: 13px;
  color: #475569;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}

.example-box {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.example-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.example-item strong {
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
  font-size: 14px;
}

.example-item ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  color: #475569;
  font-size: 13px;
}

.example-item ul li {
  margin-bottom: 4px;
}

.example-item ul li:last-child {
  margin-top: 8px;
  font-weight: 600;
  color: #1e293b;
}

.special-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Slide Transition */
.slide-enter-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.slide-leave-active {
  transition: all 0.3s ease-in;
  overflow: hidden;
}

.slide-enter-from {
  max-height: 0;
  opacity: 0;
  transform: translateY(-30px); /* Começa acima, desce para baixo na abertura */
}

.slide-enter-to {
  max-height: 5000px;
  opacity: 1;
  transform: translateY(0); /* Termina na posição normal */
}

.slide-leave-from {
  max-height: 5000px;
  opacity: 1;
  transform: translateY(0); /* Começa na posição normal */
}

.slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(
    -30px
  ); /* Sobe para cima ao fechar (movimento de baixo para cima) */
}

@media (max-width: 768px) {
  .system-page {
    padding: 16px;
  }

  .service-header {
    flex-direction: column;
    gap: 16px;
  }

  .service-status {
    align-items: flex-start;
    width: 100%;
  }

  .auto-update-badge {
    font-size: 11px;
  }

  .config-options {
    flex-direction: column;
  }

  .service-actions {
    flex-direction: column;
  }

  .info-badge {
    font-size: 11px;
    padding: 5px 10px;
  }

  .info-badge i {
    font-size: 10px;
  }

  .not-found-item {
    padding: 10px;
    gap: 6px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 14px;
  }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.stat-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.stat-card.success {
  background: #f0fdf4;
  border-color: #86efac;
}

.stat-card.success .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card.warning {
  background: #fffbeb;
  border-color: #fcd34d;
}

.stat-card.warning .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-card.error {
  background: #fef2f2;
  border-color: #fca5a5;
}

.stat-card.error .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

/* Expedition icon specific color */
.expedition-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
}
</style>
