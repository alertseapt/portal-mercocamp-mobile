<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content medium schedule-rejection-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-ban"></i>
          Criar Agendamento de Recusa
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
        <p>Criando agendamento de recusa...</p>
      </div>

      <!-- Form Content -->
      <div v-if="!loading" class="modal-body">
        <div class="rejection-form">
          <div class="form-section">
            <h4>Informações do Agendamento de Recusa</h4>
            <p class="form-description rejection-description">
              <i class="fas fa-info-circle"></i>
              Este agendamento será criado com status "Recusar". Quando a carga
              chegar, ela será recusada e não recebida.
            </p>

            <!-- NFe Number or Access Key -->
            <div class="form-group">
              <label class="form-label required">
                <i class="fas fa-file-invoice"></i>
                Número da NF-e ou Chave de Acesso (44 dígitos)
              </label>
              <input
                v-model="rejectionData.nfe_identifier"
                type="text"
                class="form-control"
                placeholder="Digite aqui"
                @input="validateNfeIdentifier"
                maxlength="44"
              />
            </div>

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

            <!-- Optional Observations -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-sticky-note"></i>
                Observações (opcional)
              </label>
              <textarea
                v-model="rejectionData.observations"
                class="form-control form-textarea"
                placeholder="Adicione observações sobre o motivo da recusa (opcional)"
                rows="4"
                maxlength="500"
              ></textarea>
              <small class="form-text-muted">
                {{
                  rejectionData.observations
                    ? rejectionData.observations.length
                    : 0
                }}/500 caracteres
              </small>
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
                  name="rejection-client-search"
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
          @click="createRejectionSchedule"
          :disabled="!canCreate || loading"
          class="btn btn-danger btn-create-rejection"
        >
          <i class="fas fa-ban"></i>
          Criar Agendamento de Recusa
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleRejectionModal',

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
      rejectionData: {
        nfe_identifier: '',
        observations: '',
      },
    }
  },

  computed: {
    canCreate() {
      return (
        this.selectedClient &&
        this.rejectionData.nfe_identifier.trim() !== '' &&
        this.hasValidPermissions
      )
    },

    hasValidPermissions() {
      const currentUser = this.getCurrentUser()
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0
      )
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
      this.rejectionData = {
        nfe_identifier: '',
        observations: '',
      }
    },

    validateNfeIdentifier() {
      // Remove espaços e caracteres não numéricos
      this.rejectionData.nfe_identifier =
        this.rejectionData.nfe_identifier.replace(/\s/g, '')
    },

    async loadAvailableClients() {
      try {
        console.log('🔄 ScheduleRejectionModal: Carregando clientes da API...')

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
            let cliAccess = currentUser.cli_access
            if (typeof cliAccess === 'string' && cliAccess) {
              try {
                cliAccess = JSON.parse(cliAccess)
              } catch (e) {
                cliAccess = null
              }
            }

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
          }
        }

        this.availableClients = allClients
        this.filteredClients = [...allClients]

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
          'Estoque selecionado automaticamente:',
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
            const clientCnpj = accessKeys[0].replace(/[^\d]/g, '')
            const matchingClient = this.availableClients.find(client => {
              if (!client.cnpj) return false
              const normalizedClientCnpj = client.cnpj.replace(/[^\d]/g, '')
              return normalizedClientCnpj === clientCnpj
            })

            if (matchingClient) {
              this.selectedClient = matchingClient
              console.log(
                'Estoque selecionado automaticamente:',
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
      this.clearSearch()
    },

    filterClients() {
      if (!this.clientSearchQuery.trim()) {
        this.filteredClients = [...this.availableClients]
        return
      }

      const searchTerm = this.clientSearchQuery.toLowerCase().trim()

      this.filteredClients = this.availableClients.filter(client => {
        const nameMatch =
          client.name && client.name.toLowerCase().includes(searchTerm)

        const cnpjMatch =
          client.cnpj &&
          (client.cnpj.includes(searchTerm) ||
            this.formatCNPJ(client.cnpj).includes(searchTerm))

        const corpemMatch =
          client.corpem_code &&
          client.corpem_code.toString().includes(searchTerm)

        return nameMatch || cnpjMatch || corpemMatch
      })
    },

    clearSearch() {
      this.clientSearchQuery = ''
      this.filteredClients = [...this.availableClients]
    },

    async createRejectionSchedule() {
      if (!this.canCreate) return

      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        this.showError('Usuário não autenticado. Faça login novamente.')
        return
      }

      if (!this.hasValidPermissions) {
        this.showError(
          'Usuário não possui permissão para criar agendamentos de recusa.'
        )
        return
      }

      // Validar NFe identifier
      const nfeIdentifier = this.rejectionData.nfe_identifier.trim()
      if (!nfeIdentifier) {
        this.showError('Número da NF-e ou chave de acesso é obrigatório.')
        return
      }

      // Determinar se é chave de acesso (44 dígitos) ou número de NF-e
      const isAccessKey = /^\d{44}$/.test(nfeIdentifier)
      const isNfeNumber = /^\d{1,10}$/.test(nfeIdentifier)

      if (!isAccessKey && !isNfeNumber) {
        this.showError(
          'Formato inválido. Insira um número de NF-e válido ou uma chave de acesso de 44 dígitos.'
        )
        return
      }

      this.loading = true
      this.errors = []

      try {
        const clientCnpj = this.selectedClient.cnpj.replace(/[^\d]/g, '')

        const scheduleData = {
          // Dados obrigatórios
          client: clientCnpj,
          status: 'Recusar', // Status de recusa
          created_by: currentUser.user,
          is_booking: 0, // Agendamento normal (não é prévio)

          // NFe identifier
          number: isNfeNumber ? nfeIdentifier : null,
          nfe_key: isAccessKey ? nfeIdentifier : null,

          // Data - usar data de hoje por padrão
          date: new Date().toISOString().split('T')[0],

          // Dados adicionais
          supplier: 'Agendamento de Recusa',
          qt_prod: 0,
          case_count: 0,
          info: {
            type: 'rejection',
            created_by: currentUser.user,
            created_at: new Date().toISOString(),
            client_name: this.selectedClient.name,
            observacoes: this.rejectionData.observations || '',
            rejection_reason: 'Agendamento criado para recusa de carga',
          },
        }

        console.log(
          '🔍 [REJECTION MODAL] Criando agendamento de recusa:',
          JSON.stringify(scheduleData, null, 2)
        )

        const apiClient = window.apiClient
        const response = await apiClient.request('/schedules', {
          method: 'POST',
          data: scheduleData,
        })

        console.log('Agendamento de recusa criado:', response)
        this.showSuccess('Agendamento de recusa criado com sucesso!')
        this.$emit('created', response)

        setTimeout(() => {
          this.closeModal()
        }, 1500)
      } catch (error) {
        console.error('Erro ao criar agendamento de recusa:', error)

        if (error.response?.status === 403) {
          this.showError(
            'Acesso negado. Usuário não possui permissão para criar agendamentos de recusa.'
          )
        } else if (error.response?.status === 401) {
          this.showError(
            'Sessão expirada. Tente fazer login novamente se necessário.'
          )
        } else if (error.response?.data?.message) {
          this.showError(
            'Erro ao criar agendamento de recusa: ' +
              error.response.data.message
          )
        } else {
          this.showError(
            'Erro ao criar agendamento de recusa: ' +
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
.schedule-rejection-modal {
  max-width: 600px;
  width: 90%;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-description {
  background: #fee;
  border-left: 4px solid #d32f2f;
  padding: 12px 16px;
  margin-bottom: 1.5rem;
  border-radius: 4px;
  color: #b71c1c;
  font-size: 0.9rem;
}

.form-description i {
  margin-right: 8px;
  color: #d32f2f;
}

.rejection-description {
  background: #ffebee;
  border-left: 4px solid #d32f2f;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
}

/* Client Selection Styles */
.selected-client-display {
  background: #fee;
  border: 2px solid #dc2626;
  border-radius: 8px;
  padding: 1rem;
}

.client-info {
  text-align: center;
}

.client-info strong {
  display: block;
  font-size: 1.1rem;
  color: #7f1d1d;
  margin-bottom: 0.25rem;
}

.client-cnpj {
  color: #991b1b;
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
  background: #fee;
  border: 1px solid #dc2626;
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
  color: #7f1d1d;
  margin-bottom: 0.25rem;
}

/* Modal de seleção de estoque */
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

.search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  flex-shrink: 0 !important;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
  border-color: #dc2626 !important;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15) !important;
  transform: translateY(-1px) !important;
}

.clickable-item:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.2) !important;
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
  color: #dc2626 !important;
  transform: translateX(4px) !important;
}

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
  color: #dc2626;
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
  color: #dc2626;
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

/* Botão de Criar Agendamento de Recusa - Vermelho */
.btn-create-rejection {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  color: white !important;
}

.btn-create-rejection:hover:not(:disabled) {
  background-color: #b91c1c !important;
  border-color: #b91c1c !important;
}

.btn-create-rejection:active:not(:disabled) {
  background-color: #991b1b !important;
  border-color: #991b1b !important;
}

.btn-create-rejection:disabled {
  background-color: #fca5a5 !important;
  border-color: #fca5a5 !important;
  opacity: 0.65;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .schedule-rejection-modal {
    width: 95%;
    margin: 1rem auto;
  }
}
</style>
