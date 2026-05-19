<template>
  <div
    v-if="showModal"
    class="modal-overlay booking-modal-overlay"
    @click="handleModalClick"
  >
    <div class="modal-content medium schedule-booking-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-calendar-plus"></i>
          Criar Agendamento de Marcação
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Errors -->
      <div v-if="errors.length > 0" class="error-container">
        <div
          v-for="(error, index) in errors"
          :key="index"
          class="error-message"
        >
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
          <button @click="removeError(index)" class="btn-close-error">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Criando agendamento de marcação...</p>
      </div>

      <!-- Form Content -->
      <div v-if="!loading" class="modal-body booking-modal-body">
        <div class="booking-form">
          <div class="form-section">
            <h4>Informações do Agendamento de Marcação</h4>
            <p class="form-description">
              <i class="fas fa-info-circle"></i>
              Este agendamento servirá como marcação. Os detalhes da NFe e
              produtos serão adicionados posteriormente.
            </p>

            <!-- Seleção de Estoque -->
            <div class="form-group">
              <label class="form-label required">
                <i class="fas fa-warehouse"></i>
                Estoque de Destino
              </label>

              <!-- Caso usuário tenha apenas um cliente -->
              <div
                v-if="availableClients.length === 1"
                class="selected-client-display"
              >
                <div class="client-info">
                  <strong>{{ selectedClient.name }}</strong>
                  <span class="client-cnpj"
                    >CNPJ: {{ formatCNPJ(selectedClient.cnpj) }}</span
                  >
                </div>
              </div>

              <!-- Caso usuário tenha múltiplos clientes -->
              <div v-else class="client-selection-container">
                <div v-if="selectedClient" class="selected-client-info">
                  <div class="client-details">
                    <span class="client-name">{{ selectedClient.name }}</span>
                    <span class="client-cnpj">{{
                      formatCNPJ(selectedClient.cnpj)
                    }}</span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    @click="showClientSelection = true"
                  >
                    <i class="fas fa-edit"></i> Alterar
                  </button>
                </div>
                <div v-else>
                  <button
                    type="button"
                    class="btn btn-primary"
                    @click="showClientSelection = true"
                  >
                    <i class="fas fa-warehouse"></i> Selecionar Estoque
                  </button>
                </div>
              </div>
            </div>

            <!-- Campos Opcionais -->
            <div class="optional-fields">
              <h5>Informações Opcionais</h5>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">
                    <i class="fas fa-file-invoice"></i>
                    Número da NF-e
                  </label>
                  <input
                    v-model="bookingData.nfe_number"
                    type="text"
                    class="form-control"
                    placeholder="Ex: 123456"
                    maxlength="10"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <i class="fas fa-calendar-alt"></i>
                    Data de Entrega
                  </label>
                  <input
                    v-model="bookingData.delivery_date"
                    type="date"
                    class="form-control"
                    :min="minBookingDate"
                  />
                  <div class="prevision-checkbox-container">
                    <label class="prevision-checkbox-label">
                      <input
                        type="checkbox"
                        v-model="bookingData.is_prevision"
                        class="prevision-checkbox"
                      />
                      <span class="prevision-label-text">Previsão</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="fas fa-boxes"></i>
                  Volumetria
                </label>
                <input
                  v-model="bookingData.case_count"
                  type="number"
                  class="form-control"
                  placeholder="Quantidade de volumes/caixas"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="fas fa-sticky-note"></i>
                  Observações
                </label>
                <textarea
                  v-model="bookingData.observations"
                  class="form-control form-textarea"
                  placeholder="Adicione observações sobre este agendamento prévio (opcional)"
                  rows="4"
                  maxlength="500"
                ></textarea>
                <small class="form-text-muted">
                  {{
                    bookingData.observations
                      ? bookingData.observations.length
                      : 0
                  }}/500 caracteres
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de seleção de cliente -->
      <div
        v-if="showClientSelection"
        class="modal-overlay"
        @click="closeClientSelectionModal"
      >
        <div class="modal-content estoque-selection-modal" @click.stop>
          <div class="modal-header">
            <h3>
              <i class="fas fa-warehouse"></i>
              Selecionar Estoque
            </h3>
            <button class="modal-close-btn" @click="closeClientSelectionModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Search input -->
            <div v-if="!loadingClients" class="search-container">
              <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input
                  type="text"
                  v-model="clientSearchQuery"
                  placeholder="Pesquisar por nome, CNPJ ou número Corpem..."
                  class="search-input"
                  @input="filterClients"
                  autocomplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  name="booking-client-search"
                />
                <button
                  v-if="clientSearchQuery"
                  @click="clearSearch"
                  class="clear-search-btn"
                  title="Limpar pesquisa"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="search-results-info" v-if="clientSearchQuery">
                <span
                  >{{ filteredClients.length }} de
                  {{ availableClients.length }} estoques encontrados</span
                >
              </div>
            </div>

            <!-- Loading state for clients -->
            <div v-if="loadingClients" class="loading-clients-container">
              <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <p class="loading-text">Carregando opções de estoque...</p>
              <small class="loading-subtext"
                >Processando permissões e estoques disponíveis</small
              >
            </div>

            <!-- Clients list -->
            <div v-else class="estoque-lista-vertical">
              <div
                v-for="client in filteredClients"
                :key="client.cnpj"
                class="estoque-lista-item clickable-item"
                @click="selectClient(client)"
              >
                <div class="estoque-lista-info">
                  <span class="estoque-nome">{{ client.name }}</span>
                  <span class="estoque-cnpj"
                    >CNPJ: {{ formatCNPJ(client.cnpj) }}</span
                  >
                  <span v-if="client.corpem_code" class="estoque-numero"
                    >Corpem: {{ client.corpem_code }}</span
                  >
                </div>
                <div class="estoque-lista-arrow">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </div>
              <div
                v-if="availableClients.length === 0"
                class="text-muted estoque-lista-vazia"
              >
                <i class="fas fa-info-circle"></i>
                Nenhum estoque disponível para seu usuário.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">
          <i class="fas fa-times"></i>
          Cancelar
        </button>

        <button
          @click="createBookingSchedule"
          :disabled="!canCreate || loading"
          class="btn btn-success"
        >
          <i class="fas fa-check"></i>
          Solicitar Agendamento Prévio
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleBookingModal',

  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      loading: false,
      errors: [],
      availableClients: [],
      selectedClient: null,
      showClientSelection: false,
      loadingClients: false,
      clientSearchQuery: '',
      filteredClients: [],
      bookingData: {
        nfe_number: '',
        delivery_date: '',
        is_prevision: false,
        case_count: null,
        observations: '',
      },
    }
  },

  computed: {
    canCreate() {
      return this.selectedClient && this.hasValidPermissions
    },

    hasValidPermissions() {
      const currentUser = this.getCurrentUser()
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0
      )
    },

    minBookingDate() {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=Dom, 6=Sáb
      const hour = now.getHours()

      const minDate = new Date(now)
      minDate.setHours(0, 0, 0, 0)
      minDate.setDate(minDate.getDate() + 1) // base: amanhã

      if (hour >= 17) {
        minDate.setDate(minDate.getDate() + 1) // após 17h bloqueia o dia seguinte
      }
      if ((dayOfWeek === 0 || dayOfWeek === 6) && minDate.getDay() === 1) {
        minDate.setDate(minDate.getDate() + 1) // final de semana bloqueia segunda
      }

      return minDate.toISOString().split('T')[0]
    },
  },

  async created() {
    if (this.showModal) {
      await this.loadAvailableClients()
    }
  },

  watch: {
    showModal: {
      async handler(newVal) {
        if (newVal) this.$lockBodyScrollForModal?.()
        else this.$unlockBodyScrollForModal?.()
        if (newVal) {
          await this.loadAvailableClients()
        }
      },
      immediate: true,
    },
  },

  beforeUnmount() {
    this.$unlockBodyScrollForModal?.()
  },

  methods: {
    closeModal() {
      this.resetModal()
      this.$emit('close')
    },

    resetModal() {
      this.loading = false
      this.errors = []
      this.selectedClient = null
      this.showClientSelection = false
      this.bookingData = {
        nfe_number: '',
        delivery_date: '',
        is_prevision: false,
        case_count: null,
        observations: '',
      }
    },

    async loadAvailableClients() {
      try {
        // Sempre recarregar clientes da API para garantir dados atualizados
        console.log(
          '🔄 ScheduleBookingModal: Recarregando clientes da API para garantir dados atualizados...'
        )

        // Fallback: carregar via API como antes
        const apiClient = window.apiClient
        const response = await apiClient.request('/clients', {
          method: 'GET',
        })

        let allClients = response.data || []
        allClients = allClients.filter(client => client.cnpj)

        const currentUser = this.getCurrentUser()

        // Filtrar clientes apenas se o usuário não é nível 0 E tem cli_access configurado
        if (currentUser && currentUser.level_access !== 0) {
          if (currentUser.cli_access) {
            // Tratar cli_access se estiver como string
            let cliAccess = currentUser.cli_access
            if (typeof cliAccess === 'string' && cliAccess) {
              try {
                cliAccess = JSON.parse(cliAccess)
              } catch (e) {
                cliAccess = null
              }
            }

            // Se tem cli_access válido com chaves, filtrar pelos clientes permitidos
            if (
              cliAccess &&
              typeof cliAccess === 'object' &&
              Object.keys(cliAccess).length > 0
            ) {
              const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
                cnpj.replace(/[^\d]/g, '')
              )
              allClients = allClients.filter(client => {
                const clientCnpj = (client.cnpj || '').replace(/[^\d]/g, '')
                return allowedCNPJs.includes(clientCnpj)
              })
            }
            // Se cli_access está vazio ou inválido, não filtrar (acesso total)
          }
          // Se não tem cli_access, não filtrar (acesso total)
        }

        this.availableClients = allClients
        this.filteredClients = [...allClients] // Inicializar lista filtrada

        // Atualizar cache global com dados mais recentes
        window.globalClientsCache = {
          clients: allClients,
          loadedAt: Date.now(),
        }
        console.log(
          '🔄 ScheduleBookingModal: Cache global atualizado com dados mais recentes'
        )

        // Auto-selecionar cliente se apropriado
        this.tryAutoSelectClient()
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        this.showError('Erro ao carregar lista de estoques.')
      }
    },

    tryAutoSelectClient() {
      if (this.availableClients.length === 0) return

      // Se há apenas um cliente disponível, selecionar automaticamente
      if (this.availableClients.length === 1) {
        this.selectedClient = this.availableClients[0]
        console.log(
          'Estoque selecionado automaticamente (usuário tem acesso a apenas um):',
          this.availableClients[0].name
        )
        return
      }

      // Verificar se usuário tem exatamente um cli_access configurado
      const currentUser = this.getCurrentUser()
      if (currentUser && currentUser.cli_access) {
        let cliAccess = currentUser.cli_access
        if (typeof cliAccess === 'string' && cliAccess) {
          try {
            cliAccess = JSON.parse(cliAccess)
          } catch (e) {
            cliAccess = null
          }
        }

        if (cliAccess && typeof cliAccess === 'object') {
          const accessKeys = Object.keys(cliAccess)
          if (accessKeys.length === 1) {
            // Usuário tem acesso a apenas um cliente, buscar e selecionar
            const clientCnpj = accessKeys[0].replace(/[^\d]/g, '')
            const matchingClient = this.availableClients.find(client => {
              if (!client.cnpj) return false
              const normalizedClientCnpj = client.cnpj.replace(/[^\d]/g, '')
              return normalizedClientCnpj === clientCnpj
            })

            if (matchingClient) {
              this.selectedClient = matchingClient
              console.log(
                'Estoque selecionado automaticamente (único cli_access do usuário):',
                matchingClient.name
              )
            }
          }
        }
      }
    },

    selectClient(client) {
      this.selectedClient = client
      this.closeClientSelectionModal()
    },

    closeClientSelectionModal() {
      this.showClientSelection = false
      // Limpar pesquisa ao fechar modal
      this.clearSearch()
    },

    // Funções de pesquisa de clientes
    filterClients() {
      if (!this.clientSearchQuery.trim()) {
        this.filteredClients = [...this.availableClients]
        return
      }

      const searchTerm = this.clientSearchQuery.toLowerCase().trim()

      this.filteredClients = this.availableClients.filter(client => {
        // Pesquisa por nome
        const nameMatch =
          client.name && client.name.toLowerCase().includes(searchTerm)

        // Pesquisa por CNPJ (com ou sem formatação)
        const cnpjMatch =
          client.cnpj &&
          (client.cnpj.includes(searchTerm) ||
            this.formatCNPJ(client.cnpj).includes(searchTerm))

        // Pesquisa por número Corpem
        const corpemMatch =
          client.corpem_code &&
          client.corpem_code.toString().includes(searchTerm)

        return nameMatch || cnpjMatch || corpemMatch
      })

      console.log(
        `🔍 Pesquisa por "${searchTerm}": ${this.filteredClients.length} resultado(s) encontrado(s)`
      )
    },

    clearSearch() {
      this.clientSearchQuery = ''
      this.filteredClients = [...this.availableClients]
    },

    async createBookingSchedule() {
      if (!this.canCreate) return

      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        this.showError('Usuário não autenticado. Faça login novamente.')
        return
      }

      if (!this.hasValidPermissions) {
        this.showError(
          'Usuário não possui permissão para criar agendamentos de marcação.'
        )
        return
      }

      this.loading = true
      this.errors = []

      try {
        // Validação e normalização do CNPJ
        if (!this.selectedClient || !this.selectedClient.cnpj) {
          this.showError(
            'Cliente não selecionado. Por favor, selecione um cliente.'
          )
          this.loading = false
          return
        }

        const clientCnpj = this.selectedClient.cnpj.replace(/[^\d]/g, '')
        if (!clientCnpj || clientCnpj.length < 8) {
          this.showError(
            'CNPJ do cliente inválido. Por favor, selecione um cliente válido.'
          )
          this.loading = false
          return
        }

        // Validação e normalização do número da NFe (se fornecido)
        let normalizedNumber = null
        if (this.bookingData.nfe_number && this.bookingData.nfe_number.trim()) {
          const nfeNumber = this.bookingData.nfe_number.trim()
          // Remover caracteres não alfanuméricos exceto letras no início
          const cleanedNumber = nfeNumber.replace(/[^A-Za-z0-9]/g, '')

          // Verificar se corresponde ao padrão esperado: [A-Z]?\d{1,10} ou 0
          if (cleanedNumber === '0') {
            normalizedNumber = '0'
          } else if (/^[A-Z]?\d{1,10}$/.test(cleanedNumber)) {
            normalizedNumber = cleanedNumber
          } else {
            // Se não corresponde ao padrão, tentar extrair apenas números
            const numbersOnly = cleanedNumber.replace(/[^0-9]/g, '')
            if (numbersOnly && numbersOnly.length <= 10) {
              normalizedNumber = numbersOnly
            } else {
              console.warn(
                '⚠️ [BOOKING MODAL] Número de NFe fora do padrão, será enviado como null:',
                nfeNumber
              )
              normalizedNumber = null // Enviar como null se não conseguir normalizar
            }
          }
        }

        // Validação e normalização da data (se fornecida)
        let normalizedDate = null
        if (
          this.bookingData.delivery_date &&
          this.bookingData.delivery_date.trim()
        ) {
          const dateStr = this.bookingData.delivery_date.trim()
          // Verificar se está no formato YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            normalizedDate = dateStr
          } else {
            // Tentar converter outros formatos comuns
            try {
              const dateObj = new Date(dateStr)
              if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear()
                const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                const day = String(dateObj.getDate()).padStart(2, '0')
                normalizedDate = `${year}-${month}-${day}`
              } else {
                console.warn(
                  '⚠️ [BOOKING MODAL] Data inválida, será enviada como null:',
                  dateStr
                )
                normalizedDate = null
              }
            } catch (e) {
              console.warn(
                '⚠️ [BOOKING MODAL] Erro ao converter data, será enviada como null:',
                dateStr,
                e
              )
              normalizedDate = null
            }
          }
        }

        // Validação de data mínima (regras: +24h, após 17h bloqueia próximo dia, fim de semana bloqueia segunda)
        if (normalizedDate && !this.bookingData.is_prevision) {
          const [yr, mo, dy] = normalizedDate.split('-').map(Number)
          const scheduleDate = new Date(yr, mo - 1, dy)

          const now = new Date()
          const dayOfWeek = now.getDay()
          const hour = now.getHours()

          const minDate = new Date(now)
          minDate.setHours(0, 0, 0, 0)
          minDate.setDate(minDate.getDate() + 1)

          if (hour >= 17) {
            minDate.setDate(minDate.getDate() + 1)
          }
          if ((dayOfWeek === 0 || dayOfWeek === 6) && minDate.getDay() === 1) {
            minDate.setDate(minDate.getDate() + 1)
          }

          if (scheduleDate < minDate) {
            let motivo =
              'Os agendamentos devem ser feitos com antecedência mínima de 24 horas.'
            if (hour >= 17) {
              motivo = 'Após as 17h não é possível agendar para o próximo dia.'
            } else if (
              (dayOfWeek === 0 || dayOfWeek === 6) &&
              scheduleDate.getDay() === 1
            ) {
              motivo =
                'Não é possível agendar para segunda-feira durante o final de semana.'
            }
            this.errorMessage =
              '⚠️ Data inválida!\n\n' +
              motivo +
              '\n\nPor favor, corrija a data e tente novamente.'
            this.loading = false
            return
          }
        }

        // Validação do case_count
        const caseCount = this.bookingData.case_count
          ? parseInt(this.bookingData.case_count, 10)
          : 0
        if (isNaN(caseCount) || caseCount < 0) {
          console.warn(
            '⚠️ [BOOKING MODAL] case_count inválido, usando 0:',
            this.bookingData.case_count
          )
        }

        const scheduleData = {
          // Dados obrigatórios
          client: clientCnpj,
          status: 'Solicitado', // Nova lógica: agendamentos de marcação começam com 'Solicitado'
          created_by: currentUser.user,
          is_booking: 1, // Agendamento prévio/marcação (1 = booking)

          // Dados opcionais (normalizados)
          number: normalizedNumber,
          date: normalizedDate,
          prevision: this.bookingData.is_prevision ? '1' : null, // Marca se é previsão
          case_count: isNaN(caseCount) || caseCount < 0 ? 0 : caseCount,

          // Identificadores para agendamento de marcação
          nfe_key: null, // NULL indica que é agendamento de marcação
          supplier: 'Agendamento de Marcação',
          qt_prod: 0,
          info: {
            type: 'booking',
            created_by: currentUser.user,
            created_at: new Date().toISOString(),
            client_name: this.selectedClient.name,
            observacoes: this.bookingData.observations || '', // Observações do agendamento prévio
          },
        }

        // DEBUG: Verificar tipo de is_booking antes de enviar
        console.log(
          '🔍 [BOOKING MODAL] is_booking antes de enviar:',
          scheduleData.is_booking,
          'tipo:',
          typeof scheduleData.is_booking
        )
        console.log(
          '🔍 [BOOKING MODAL] scheduleData completo:',
          JSON.stringify(scheduleData, null, 2)
        )

        const apiClient = window.apiClient
        const response = await apiClient.request('/schedules', {
          method: 'POST',
          data: scheduleData,
        })

        console.log('Agendamento de marcação criado:', response)
        this.showSuccess('Agendamento de marcação criado com sucesso!')
        this.$emit('created', response)

        setTimeout(() => {
          this.closeModal()
        }, 1500)
      } catch (error) {
        console.error('Erro ao criar agendamento de marcação:', error)
        console.error('Detalhes do erro:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        })

        if (error.response?.status === 403) {
          this.showError(
            'Acesso negado. Usuário não possui permissão para criar agendamentos de marcação.'
          )
        } else if (error.response?.status === 401) {
          console.log('=== SCHEDULE BOOKING MODAL: ERRO 401 ===')
          console.log('REMOVENDO REDIRECIONAMENTO AUTOMÁTICO')

          this.showError(
            'Sessão expirada. Tente fazer login novamente se necessário.'
          )

          // NÃO remover token nem redirecionar automaticamente
          // Apenas mostrar o erro e deixar o usuário decidir
        } else if (error.response?.status === 400) {
          // Tratamento específico para erro 400
          const errorData = error.response?.data
          let errorMessage = 'Erro ao criar agendamento prévio. '

          if (errorData?.details && Array.isArray(errorData.details)) {
            // Se houver detalhes de validação, mostrar cada um
            const validationErrors = errorData.details
              .map(detail => {
                const field = detail.field || 'campo desconhecido'
                const message = detail.message || 'valor inválido'
                return `${field}: ${message}`
              })
              .join('\n')
            errorMessage += '\n\nDetalhes:\n' + validationErrors
          } else if (errorData?.error) {
            errorMessage += errorData.error
            if (errorData?.details) {
              errorMessage += '\n\n' + errorData.details
            }
          } else {
            errorMessage += 'Verifique os dados informados e tente novamente.'
          }

          this.showError(errorMessage)
        } else {
          this.showError(
            'Erro ao criar agendamento de marcação: ' +
              (error.message || 'Erro desconhecido')
          )
        }
      } finally {
        this.loading = false
      }
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },

    showError(message) {
      this.errors.push(message)
    },

    showSuccess(message) {
      console.log('Sucesso:', message)
    },

    removeError(index) {
      this.errors.splice(index, 1)
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    handleModalClick(event) {
      event.stopPropagation()
    },
  },
}
</script>

<style scoped>
/* Overlay específico para modal de marcação - sem padding vertical */
.booking-modal-overlay {
  padding: 0 !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Modal de marcação - 95% da altura visível */
.schedule-booking-modal {
  max-width: 600px;
  width: 90%;
  height: 95vh !important;
  max-height: 95vh !important;
  min-height: 95vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  margin: 0 auto !important;
}

/* Body do modal com scroll */
.booking-modal-body {
  flex: 1 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.booking-form {
  flex: 1;
  min-height: 0;
}

/* Garantir que header, errors e footer não encolham */
.schedule-booking-modal .modal-header,
.schedule-booking-modal .error-container,
.schedule-booking-modal .loading-container,
.schedule-booking-modal .modal-footer {
  flex-shrink: 0 !important;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-description {
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
  padding: 12px 16px;
  margin-bottom: 1.5rem;
  border-radius: 4px;
  color: #1565c0;
  font-size: 0.9rem;
}

.form-description i {
  margin-right: 8px;
  color: #1976d2;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-label i {
  margin-right: 8px;
  color: #6b7280;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.5;
}

.form-text-muted {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: right;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.optional-fields {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.optional-fields h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #475569;
  font-size: 1rem;
}

/* Client Selection Styles */
.selected-client-display {
  background: #f0f9ff;
  border: 2px solid #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
}

.client-info {
  text-align: center;
}

.client-info strong {
  display: block;
  font-size: 1.1rem;
  color: #0c4a6e;
  margin-bottom: 0.25rem;
}

.client-cnpj {
  color: #0369a1;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.client-selection-container {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-client-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
  width: 100%;
}

.client-details {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 0.25rem;
}

.client-option-cnpj {
  color: #0369a1;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

/* Client Selection Modal */
.clients-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.client-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.15s;
}

.client-option:hover {
  background: #f8fafc;
}

.client-option:last-child {
  border-bottom: none;
}

.client-option-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.client-option-info i {
  color: #3b82f6;
  font-size: 1.2rem;
}

.client-option-details {
  display: flex;
  flex-direction: column;
}

.client-option-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.client-option-cnpj {
  color: #6b7280;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

/* Loading and Error States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-container i {
  font-size: 2rem;
  color: #3b82f6;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

.error-container {
  margin-bottom: 1rem;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.error-message i {
  margin-right: 0.5rem;
}

.btn-close-error {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.25rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Estilos para pesquisa de clientes */
.search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-input::placeholder {
  color: #adb5bd;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: #495057;
  background-color: #f1f3f4;
}

.search-results-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

.search-results-info span {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
}

/* Estilos para modal de seleção de estoque ocupar 95% da altura */
.estoque-selection-modal {
  max-height: 95vh !important;
  height: 95vh !important;
  max-width: 800px !important;
  width: 90% !important;
  margin: 2.5vh auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.estoque-selection-modal .modal-body {
  flex: 1 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.estoque-lista-vertical {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 1rem !important;
}

/* Ajustar altura do container de pesquisa */
.search-container {
  flex-shrink: 0 !important;
}

/* Estilos para items clicáveis de estoque */
.clickable-item {
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-radius: 8px !important;
  margin-bottom: 8px !important;
  padding: 16px !important;
  border: 2px solid #e9ecef !important;
  background-color: white !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.clickable-item:hover {
  background-color: #f8f9fa !important;
  border-color: #007bff !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
  transform: translateY(-1px) !important;
}

.clickable-item:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 3px rgba(0, 123, 255, 0.2) !important;
}

.estoque-lista-info {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

.estoque-lista-arrow {
  color: #6c757d !important;
  font-size: 16px !important;
  transition: all 0.2s ease !important;
}

.clickable-item:hover .estoque-lista-arrow {
  color: #007bff !important;
  transform: translateX(4px) !important;
}

/* Melhorar espaçamento dos textos */
.estoque-nome {
  font-weight: 600 !important;
  color: #495057 !important;
  font-size: 16px !important;
  margin-bottom: 4px !important;
}

.estoque-cnpj,
.estoque-numero {
  font-size: 14px !important;
  color: #6c757d !important;
}

.loading-clients-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.loading-spinner i {
  font-size: 2rem;
  color: #007bff;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  color: #6c757d;
}

.estoque-lista-vazia {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.estoque-lista-vazia i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Prevision Checkbox Styles */
.prevision-checkbox-container {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
}

.prevision-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.3s ease;
  margin: 0;
}

.prevision-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
  transition: all 0.3s ease;
}

.prevision-label-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.prevision-checkbox:checked + .prevision-label-text {
  opacity: 1;
  font-weight: 600;
  color: #3b82f6;
}

.prevision-checkbox-label:hover .prevision-label-text {
  opacity: 0.8;
}

.prevision-checkbox:checked {
  transform: scale(1.1);
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .schedule-booking-modal {
    width: 95%;
    margin: 1rem auto;
  }
}
</style>
