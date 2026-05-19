<template>
  <div class="pessoas-container">
    <div class="page-header">
      <div class="header-content">
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fa fa-plus"></i>
          Novo Apresentador
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Carregando apresentadores...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <i class="fa fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadPresenters">
          Tentar Novamente
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="presenters.length === 0" class="empty-container">
        <i class="fa fa-user-slash"></i>
        <h3>Nenhum apresentador cadastrado</h3>
        <p>Clique no botão acima para cadastrar o primeiro apresentador</p>
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Registros no Histórico</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="presenter in presenters" :key="presenter.id">
              <td>{{ presenter.name }}</td>
              <td>{{ formatPhone(presenter.phone) }}</td>
              <td>{{ getHistoricCount(presenter.historic) }}</td>
              <td class="actions">
                <button
                  class="btn-action btn-view"
                  @click="viewHistoric(presenter)"
                  title="Ver Histórico"
                >
                  <i class="fa fa-history"></i>
                </button>
                <button
                  class="btn-action btn-edit"
                  @click="openEditModal(presenter)"
                  title="Editar"
                >
                  <i class="fa fa-edit"></i>
                </button>
                <button
                  class="btn-action btn-delete"
                  @click="confirmDelete(presenter)"
                  title="Excluir"
                >
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i class="fa fa-user"></i>
            {{ editingPresenter ? 'Editar Apresentador' : 'Novo Apresentador' }}
          </h2>
          <button class="close-btn" @click="closeModal">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="savePresenter">
            <div class="form-group">
              <label for="name">Nome *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="Nome completo do apresentador"
                required
              />
            </div>

            <div class="form-group">
              <label for="phone">Telefone *</label>
              <input
                id="phone"
                v-model="formData.phone"
                type="text"
                placeholder="(00) 00000-0000"
                maxlength="15"
                required
                @input="formatPhoneInput"
              />
              <small class="form-hint">
                Formato: (DDD) 00000-0000 ou (DDD) 0000-0000
              </small>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeModal"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="submitting"
              >
                <span v-if="submitting">
                  <i class="fa fa-spinner fa-spin"></i>
                  Salvando...
                </span>
                <span v-else>
                  <i class="fa fa-save"></i>
                  Salvar
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Historic Modal -->
    <div
      v-if="showHistoricModal"
      class="modal-overlay"
      @click.self="closeHistoricModal"
    >
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>
            <i class="fa fa-history"></i>
            Histórico - {{ selectedPresenter?.name }}
          </h2>
          <button class="close-btn" @click="closeHistoricModal">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Loading Historic -->
          <div v-if="loadingHistoric" class="loading-container">
            <div class="spinner"></div>
            <p>Carregando histórico...</p>
          </div>

          <!-- Error Historic -->
          <div v-else-if="historicError" class="error-container">
            <i class="fa fa-exclamation-circle"></i>
            <p>{{ historicError }}</p>
            <button
              class="btn btn-primary"
              @click="loadHistoric(selectedPresenter.id)"
            >
              Tentar Novamente
            </button>
          </div>

          <!-- Empty Historic -->
          <div v-else-if="historicData.length === 0" class="empty-container">
            <i class="fa fa-inbox"></i>
            <h3>Sem registros no histórico</h3>
            <p>Este apresentador ainda não tem registros de entregas</p>
          </div>

          <!-- Historic Table -->
          <div v-else class="table-container">
            <div class="historic-summary">
              <p>
                <strong>Total de registros:</strong> {{ historicData.length }}
              </p>
            </div>
            <table class="historic-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Transportadora</th>
                  <th>Carga</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in historicData" :key="index">
                  <td>{{ formatDateTime(record.datetime) }}</td>
                  <td>
                    <strong>{{ record.transport_company.name }}</strong>
                  </td>
                  <td>
                    <span class="load-id">{{ record.load.id }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeHistoricModal"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="closeDeleteConfirm"
    >
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h2>
            <i class="fa fa-exclamation-triangle"></i>
            Confirmar Exclusão
          </h2>
          <button class="close-btn" @click="closeDeleteConfirm">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>
            Tem certeza que deseja excluir o apresentador
            <strong>{{ presenterToDelete?.name }}</strong
            >?
          </p>
          <p class="warning-text">
            <i class="fa fa-exclamation-circle"></i>
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeDeleteConfirm"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="deletePresenter"
            :disabled="submitting"
          >
            <span v-if="submitting">
              <i class="fa fa-spinner fa-spin"></i>
              Excluindo...
            </span>
            <span v-else>
              <i class="fa fa-trash"></i>
              Excluir
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api.js'

export default {
  name: 'PessoasPage',
  data() {
    return {
      presenters: [],
      loading: false,
      error: null,
      showModal: false,
      showHistoricModal: false,
      showDeleteConfirm: false,
      editingPresenter: null,
      selectedPresenter: null,
      presenterToDelete: null,
      submitting: false,
      loadingHistoric: false,
      historicError: null,
      historicData: [],
      formData: {
        name: '',
        phone: '',
      },
    }
  },
  mounted() {
    this.loadPresenters()
  },
  activated() {
    // Recarregar dados sempre que a página for ativada/visualizada
    this.loadPresenters()
  },
  methods: {
    async loadPresenters() {
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/transport-presenters', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.presenters = response.data
      } catch (error) {
        console.error('Erro ao carregar apresentadores:', error)
        this.error =
          error.response?.data?.error || 'Erro ao carregar apresentadores'
      } finally {
        this.loading = false
      }
    },

    async loadHistoric(presenterId) {
      this.loadingHistoric = true
      this.historicError = null
      this.historicData = []
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          `/transport-presenters/${presenterId}/historic`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        this.historicData = response.data.historic || []
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
        this.historicError =
          error.response?.data?.error || 'Erro ao carregar histórico'
      } finally {
        this.loadingHistoric = false
      }
    },

    formatPhone(phone) {
      if (!phone) return ''
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
      return phone
    },

    formatPhoneInput(event) {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length > 11) {
        value = value.substring(0, 11)
      }
      if (value.length >= 11) {
        this.formData.phone = value.replace(
          /(\d{2})(\d{5})(\d{4})/,
          '($1) $2-$3'
        )
      } else if (value.length >= 10) {
        this.formData.phone = value.replace(
          /(\d{2})(\d{4})(\d{4})/,
          '($1) $2-$3'
        )
      } else if (value.length >= 6) {
        this.formData.phone = value.replace(/(\d{2})(\d{4})/, '($1) $2')
      } else if (value.length >= 2) {
        this.formData.phone = value.replace(/(\d{2})/, '($1) ')
      } else {
        this.formData.phone = value
      }
    },

    formatDateTime(datetime) {
      if (!datetime) return ''
      const date = new Date(datetime)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    },

    getHistoricCount(historic) {
      if (!historic || typeof historic !== 'object') return 0
      return Object.keys(historic).length
    },

    getStatusClass(status) {
      if (!status) return 'status-unknown'
      const statusLower = status.toLowerCase()
      if (statusLower === 'enviado') return 'status-sent'
      if (statusLower === 'docar') return 'status-dock'
      return 'status-pending'
    },

    openCreateModal() {
      this.editingPresenter = null
      this.formData = {
        name: '',
        phone: '',
      }
      this.showModal = true
    },

    openEditModal(presenter) {
      this.editingPresenter = presenter
      this.formData = {
        name: presenter.name,
        phone: this.formatPhone(presenter.phone),
      }
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.editingPresenter = null
      this.formData = {
        name: '',
        phone: '',
      }
    },

    viewHistoric(presenter) {
      this.selectedPresenter = presenter
      this.showHistoricModal = true
      this.loadHistoric(presenter.id)
    },

    closeHistoricModal() {
      this.showHistoricModal = false
      this.selectedPresenter = null
      this.historicData = []
      this.historicError = null
    },

    confirmDelete(presenter) {
      this.presenterToDelete = presenter
      this.showDeleteConfirm = true
    },

    closeDeleteConfirm() {
      this.showDeleteConfirm = false
      this.presenterToDelete = null
    },

    async savePresenter() {
      this.submitting = true
      try {
        const token = localStorage.getItem('token')
        const data = {
          name: this.formData.name.trim(),
          phone: this.formData.phone.replace(/\D/g, ''),
        }

        if (this.editingPresenter) {
          // Update
          await axios.put(
            `/transport-presenters/${this.editingPresenter.id}`,
            data,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          this.$emit('notification', {
            message: 'Apresentador atualizado com sucesso!',
            type: 'success',
          })
        } else {
          // Create
          await axios.post('/transport-presenters', data, {
            headers: { Authorization: `Bearer ${token}` },
          })
          this.$emit('notification', {
            message: 'Apresentador cadastrado com sucesso!',
            type: 'success',
          })
        }

        this.closeModal()
        await this.loadPresenters()
      } catch (error) {
        console.error('Erro ao salvar apresentador:', error)
        const errorMessage =
          error.response?.data?.error || 'Erro ao salvar apresentador'
        this.$emit('notification', {
          message: errorMessage,
          type: 'error',
        })
      } finally {
        this.submitting = false
      }
    },

    async deletePresenter() {
      this.submitting = true
      try {
        const token = localStorage.getItem('token')
        await axios.delete(
          `/transport-presenters/${this.presenterToDelete.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        this.$emit('notification', {
          message: 'Apresentador excluído com sucesso!',
          type: 'success',
        })
        this.closeDeleteConfirm()
        await this.loadPresenters()
      } catch (error) {
        console.error('Erro ao excluir apresentador:', error)
        const errorMessage =
          error.response?.data?.error || 'Erro ao excluir apresentador'
        this.$emit('notification', {
          message: errorMessage,
          type: 'error',
        })
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
.pessoas-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.page-header {
  background: transparent;
  padding: 20px 30px;
}

.header-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title i {
  color: #4a90e2;
}

.content-wrapper {
  flex: 1;
  overflow: auto;
  padding: 30px;
}

/* Loading, Error, Empty States */
.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container i,
.empty-container i {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-container i {
  color: #e74c3c;
}

.empty-container i {
  color: #95a5a6;
}

.error-container h3,
.empty-container h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.error-container p,
.empty-container p {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

/* Table */
.table-responsive {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1400px;
  margin: 0 auto;
}

.data-table,
.historic-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead,
.historic-table thead {
  background: #f1f5f9;
}

.data-table th,
.historic-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td,
.historic-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
}

.data-table tbody tr:hover,
.historic-table tbody tr:hover {
  background: #f8fafc;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f1f5f9;
  color: #475569;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-action i {
  pointer-events: none;
}

.btn-view {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-edit {
  background: #fef3c7;
  color: #b45309;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #4a90e2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
}

.modal-large {
  max-width: 900px;
}

.modal-small {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 10px 10px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8f9fa;
  border-radius: 0 0 10px 10px;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4a90e2;
}

.form-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.warning-text {
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  font-size: 14px;
}

/* Historic */
.historic-summary {
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.historic-summary p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-info strong {
  color: #333;
  font-size: 14px;
}

.company-info small {
  color: #666;
  font-size: 12px;
}

.load-id {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #333;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-sent {
  background: #d4edda;
  color: #155724;
}

.status-dock {
  background: #fff3cd;
  color: #856404;
}

.status-pending {
  background: #cce5ff;
  color: #004085;
}

.status-unknown {
  background: #e2e3e5;
  color: #383d41;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    padding: 15px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .page-title {
    font-size: 22px;
  }

  .content-wrapper {
    padding: 15px;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .data-table,
  .historic-table {
    font-size: 13px;
  }

  .data-table th,
  .data-table td,
  .historic-table th,
  .historic-table td {
    padding: 10px;
  }

  .modal-content {
    max-width: 100%;
    margin: 10px;
  }
}
</style>
