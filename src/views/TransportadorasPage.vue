<template>
  <div class="transportadoras-page">
    <div class="page-header">
      <h1>
        <i class="fas fa-shipping-fast"></i>
        Transportadoras
      </h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i>
        Nova Transportadora
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      Carregando transportadoras...
    </div>

    <!-- Lista de Transportadoras -->
    <div v-else class="companies-list">
      <div class="companies-count">
        <span class="count-badge">{{ companies.length }}</span>
        <span class="count-label">{{
          companies.length === 1 ? 'transportadora' : 'transportadoras'
        }}</span>
      </div>

      <div v-if="companies.length === 0" class="empty-state">
        <i class="fas fa-truck"></i>
        <p>Nenhuma transportadora cadastrada</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Cadastrar primeira transportadora
        </button>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cadastrado por</th>
              <th>Data de Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in companies" :key="company.id">
              <td>
                <div class="company-name">
                  <i class="fas fa-building"></i>
                  {{ company.name }}
                </div>
              </td>
              <td>{{ company.created_by_name || 'N/A' }}</td>
              <td>{{ formatDateTime(company.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn-icon btn-info"
                    @click="viewCompany(company)"
                    title="Ver detalhes"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="btn-icon btn-warning"
                    @click="editCompany(company)"
                    title="Editar"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    v-if="canDelete"
                    class="btn-icon btn-danger"
                    @click="confirmDelete(company)"
                    title="Excluir"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Criação/Edição -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i class="fas" :class="isEditing ? 'fa-edit' : 'fa-plus'"></i>
            {{ isEditing ? 'Editar Transportadora' : 'Nova Transportadora' }}
          </h2>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Nome da Transportadora (apenas nome, sem CNPJ) -->
          <div class="form-group">
            <label>Nome da Transportadora *</label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Digite o nome da transportadora"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">
            Cancelar
          </button>
          <button
            class="btn btn-primary"
            @click="saveCompany"
            :disabled="saving || !formData.name?.trim()"
          >
            <i
              class="fas"
              :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"
            ></i>
            {{ saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização -->
    <div
      v-if="showViewModal"
      class="modal-overlay"
      @click.self="closeViewModal"
    >
      <div class="modal-content modal-view">
        <div class="modal-header">
          <h2>
            <i class="fas fa-building"></i>
            Detalhes da Transportadora
          </h2>
          <button class="btn-close" @click="closeViewModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body" v-if="viewingCompany">
          <div class="details-grid">
            <div class="detail-item">
              <label>Nome</label>
              <p>{{ viewingCompany.name }}</p>
            </div>
            <div class="detail-item">
              <label>Cadastrado por</label>
              <p>{{ viewingCompany.created_by_name || 'N/A' }}</p>
            </div>
            <div class="detail-item">
              <label>Data de Cadastro</label>
              <p>{{ formatDateTime(viewingCompany.created_at) }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">
            Fechar
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
  name: 'TransportadorasPage',
  data() {
    return {
      loading: false,
      companies: [],
      showModal: false,
      showViewModal: false,
      isEditing: false,
      saving: false,
      formData: {
        id: null,
        name: '',
      },
      viewingCompany: null,
    }
  },
  computed: {
    canDelete() {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        return user && user.level_access === 0
      } catch (e) {
        return false
      }
    },
  },
  mounted() {
    this.loadCompanies()
  },
  activated() {
    // Recarregar dados sempre que a página for ativada/visualizada
    this.loadCompanies()
  },
  methods: {
    async loadCompanies() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/transport-companies', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.companies = response.data
      } catch (error) {
        console.error('Erro ao carregar transportadoras:', error)
        this.$emit(
          'show-notification',
          'Erro ao carregar transportadoras',
          'error'
        )
      } finally {
        this.loading = false
      }
    },

    openCreateModal() {
      this.isEditing = false
      this.formData = {
        id: null,
        name: '',
      }
      this.showModal = true
    },

    editCompany(company) {
      this.isEditing = true
      this.formData = {
        id: company.id,
        name: company.name,
      }
      this.showModal = true
    },

    async saveCompany() {
      if (!this.formData.name?.trim()) {
        this.$emit('show-notification', 'Nome é obrigatório', 'error')
        return
      }

      this.saving = true

      try {
        const token = localStorage.getItem('token')
        if (this.isEditing) {
          await axios.put(
            `/transport-companies/${this.formData.id}`,
            { name: this.formData.name.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          this.$emit(
            'show-notification',
            'Transportadora atualizada com sucesso',
            'success'
          )
        } else {
          await axios.post(
            '/transport-companies',
            { name: this.formData.name.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          this.$emit(
            'show-notification',
            'Transportadora cadastrada com sucesso',
            'success'
          )
        }

        this.closeModal()
        this.loadCompanies()
      } catch (error) {
        console.error('Erro ao salvar transportadora:', error)
        const message =
          error.response?.data?.error || 'Erro ao salvar transportadora'
        this.$emit('show-notification', message, 'error')
      } finally {
        this.saving = false
      }
    },

    viewCompany(company) {
      this.viewingCompany = company
      this.showViewModal = true
    },

    async confirmDelete(company) {
      if (
        confirm(
          `Tem certeza que deseja excluir a transportadora "${company.name}"?`
        )
      ) {
        try {
          const token = localStorage.getItem('token')
          await axios.delete(`/transport-companies/${company.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          this.$emit(
            'show-notification',
            'Transportadora excluída com sucesso',
            'success'
          )
          this.loadCompanies()
        } catch (error) {
          console.error('Erro ao excluir transportadora:', error)
          const message =
            error.response?.data?.error || 'Erro ao excluir transportadora'
          this.$emit('show-notification', message, 'error')
        }
      }
    },

    closeModal() {
      this.showModal = false
      this.isEditing = false
      this.formData = {
        id: null,
        name: '',
      }
    },

    closeViewModal() {
      this.showViewModal = false
      this.viewingCompany = null
    },

    formatDateTime(datetime) {
      if (!datetime) return 'N/A'
      const date = new Date(datetime)
      return date.toLocaleString('pt-BR')
    },
  },
}
</script>

<style scoped>
.transportadoras-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1e3a8a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h1 i {
  color: #3b82f6;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.2rem;
  color: #64748b;
}

.loading-container i {
  font-size: 2rem;
  color: #3b82f6;
  margin-bottom: 15px;
  display: block;
}

.companies-count {
  margin-bottom: 20px;
  padding: 15px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
}

.count-label {
  color: #475569;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.empty-state i {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.2rem;
  color: #64748b;
  margin-bottom: 20px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table thead {
  background: #f1f5f9;
}

.data-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.company-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #1e293b;
}

.company-name i {
  color: #3b82f6;
}

.cnpj {
  font-family: 'Courier New', monospace;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f1f5f9;
  color: #475569;
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-icon.btn-info {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-icon.btn-warning {
  background: #fef3c7;
  color: #b45309;
}

.btn-icon.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.btn-success {
  background: #10b981;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content.modal-view {
  max-width: 800px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #475569;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.input-with-button {
  display: flex;
  gap: 10px;
}

.input-with-button input {
  flex: 1;
}

.form-group small {
  display: block;
  margin-top: 8px;
  font-size: 0.875rem;
}

.text-success {
  color: #10b981;
}

.text-error {
  color: #dc2626;
}

.api-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.api-info h4 {
  color: #0369a1;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item strong {
  color: #475569;
  font-size: 0.875rem;
}

.info-item span {
  color: #1e293b;
  font-weight: 500;
}

.status-active {
  color: #10b981;
}

.status-inactive {
  color: #dc2626;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.detail-item label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 5px;
}

.detail-item p {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
}

.api-details h3 {
  color: #1e293b;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.api-full-info {
  background: #1e293b;
  border-radius: 8px;
  padding: 15px;
  overflow-x: auto;
}

.api-full-info pre {
  color: #e2e8f0;
  font-size: 0.875rem;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-api-data {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.no-api-data i {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}
</style>
