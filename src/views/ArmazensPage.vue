<template>
  <div class="armazens-page">
    <div class="page-header">
      <h1>
        <i class="fas fa-warehouse"></i>
        Armazéns
      </h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i>
        Criar registro
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      Carregando armazéns...
    </div>

    <!-- Lista de Armazéns -->
    <div v-else class="storage-list">
      <div v-if="storages.length === 0" class="empty-state">
        <i class="fas fa-warehouse"></i>
        <p>Nenhum armazém cadastrado</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Criar primeiro armazém
        </button>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Corpem</th>
              <th>Nome</th>
              <th>Endereço</th>
              <th>Gerente</th>
              <th>Cidade</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in storages"
              :key="s.id"
              class="clickable-row"
              @click="openDetailModal(s)"
            >
              <td>
                <code>{{ s.corpem || '-' }}</code>
              </td>
              <td>{{ s.name || '-' }}</td>
              <td>
                {{ s.address_line_1
                }}{{ s.address_line_2 ? ', ' + s.address_line_2 : '' }}
              </td>
              <td>{{ getManagerName(s.manager) || '-' }}</td>
              <td>{{ s.city }}</td>
              <td>{{ s.state }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Detalhes do Armazém -->
    <Teleport to="body">
      <div
        v-if="showDetailModal"
        class="modal-overlay modal-overlay-armazens"
        @click.self="closeDetailModal"
      >
        <div class="modal-container modal-armazens modal-detail">
          <div class="modal-header">
            <h2>
              <i class="fas fa-warehouse"></i>
              Detalhes do armazém
            </h2>
            <button class="btn-close" @click="closeDetailModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div v-if="selectedStorage" class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <label>ID</label>
                <p>
                  <code>{{ selectedStorage.id }}</code>
                </p>
              </div>
              <div class="detail-item">
                <label>Corpem</label>
                <p>{{ selectedStorage.corpem || '-' }}</p>
              </div>
              <div class="detail-item full-width">
                <label>Nome</label>
                <p>{{ selectedStorage.name || '-' }}</p>
              </div>
              <div class="detail-item full-width">
                <label>Endereço</label>
                <p>{{ selectedStorage.address_line_1 || '-' }}</p>
              </div>
              <div class="detail-item full-width">
                <label>Complemento</label>
                <p>{{ selectedStorage.address_line_2 || '-' }}</p>
              </div>
              <div class="detail-item">
                <label>Bairro</label>
                <p>{{ selectedStorage.district || '-' }}</p>
              </div>
              <div class="detail-item">
                <label>Cidade</label>
                <p>{{ selectedStorage.city || '-' }}</p>
              </div>
              <div class="detail-item">
                <label>Estado</label>
                <p>{{ selectedStorage.state || '-' }}</p>
              </div>
              <div class="detail-item">
                <label>CEP</label>
                <p>{{ selectedStorage.postal_code || '-' }}</p>
              </div>
              <div class="detail-item">
                <label>País</label>
                <p>{{ selectedStorage.country || '-' }}</p>
              </div>
              <div class="detail-item full-width manager-edit">
                <label
                  ><i class="fas fa-user-tie"></i> Gerente responsável</label
                >
                <div class="manager-select-row">
                  <select
                    v-model="selectedStorageManager"
                    class="form-input manager-select"
                  >
                    <option value="">Nenhum gerente atribuído</option>
                    <option
                      v-for="m in managers"
                      :key="m.id"
                      :value="String(m.id)"
                    >
                      {{ m.name || m.user || `ID ${m.id}` }}
                    </option>
                  </select>
                  <button
                    class="btn btn-primary btn-save-manager"
                    :disabled="savingManager"
                    @click.stop="saveManager"
                  >
                    <i
                      class="fas"
                      :class="savingManager ? 'fa-spinner fa-spin' : 'fa-save'"
                    ></i>
                    {{ savingManager ? 'Salvando...' : 'Salvar gerente' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDetailModal">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Criação (98% da altura do display) -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="modal-overlay modal-overlay-armazens"
        @click.self="closeModal"
      >
        <div class="modal-container modal-armazens">
          <div class="modal-header">
            <h2>
              <i class="fas fa-plus"></i>
              Criar armazém
            </h2>
            <button class="btn-close" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <form autocomplete="off" class="form-grid" @submit.prevent>
              <div class="form-group">
                <label>Corpem</label>
                <input
                  v-model="formData.corpem"
                  type="text"
                  maxlength="2"
                  placeholder="Sigla (2 caracteres)"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.corpem || '').length }}/2</span
                >
              </div>
              <div class="form-group">
                <label>Nome *</label>
                <input
                  v-model="formData.name"
                  type="text"
                  maxlength="40"
                  placeholder="Nome do armazém"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.name || '').length }}/40</span
                >
              </div>
              <div class="form-group">
                <label>Endereço *</label>
                <input
                  v-model="formData.address_line_1"
                  type="text"
                  maxlength="100"
                  placeholder="Logradouro, número"
                  class="form-input"
                  autocomplete="nope"
                  :readonly="addressFieldReadonly"
                  @focus="addressFieldReadonly = false"
                />
                <span class="char-count"
                  >{{ (formData.address_line_1 || '').length }}/100</span
                >
              </div>
              <div class="form-group">
                <label>Complemento</label>
                <input
                  v-model="formData.address_line_2"
                  type="text"
                  maxlength="100"
                  placeholder="Bloco, andar, sala"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.address_line_2 || '').length }}/100</span
                >
              </div>
              <div class="form-group">
                <label>Bairro</label>
                <input
                  v-model="formData.district"
                  type="text"
                  maxlength="30"
                  placeholder="Bairro"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.district || '').length }}/30</span
                >
              </div>
              <div class="form-group">
                <label>Cidade *</label>
                <input
                  v-model="formData.city"
                  type="text"
                  maxlength="50"
                  placeholder="Cidade"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.city || '').length }}/50</span
                >
              </div>
              <div class="form-group">
                <label>Estado *</label>
                <input
                  v-model="formData.state"
                  type="text"
                  maxlength="50"
                  placeholder="Estado (UF)"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.state || '').length }}/50</span
                >
              </div>
              <div class="form-group">
                <label>País *</label>
                <input
                  v-model="formData.country"
                  type="text"
                  maxlength="50"
                  placeholder="País"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.country || '').length }}/50</span
                >
              </div>
              <div class="form-group">
                <label>CEP *</label>
                <input
                  v-model="formData.postal_code"
                  type="text"
                  maxlength="20"
                  placeholder="CEP"
                  class="form-input"
                  autocomplete="nope"
                />
                <span class="char-count"
                  >{{ (formData.postal_code || '').length }}/20</span
                >
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button
              class="btn btn-primary"
              @click="saveStorage"
              :disabled="saving || !isFormValid"
            >
              <i
                class="fas"
                :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"
              ></i>
              {{ saving ? 'Salvando...' : 'Criar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ArmazensPage',
  data() {
    return {
      loading: false,
      storages: [],
      managers: [],
      showModal: false,
      showDetailModal: false,
      selectedStorage: null,
      selectedStorageManager: '',
      saving: false,
      savingManager: false,
      addressFieldReadonly: true, // Evita autocomplete do Chrome em campos de endereço
      formData: {
        corpem: '',
        name: '',
        address_line_1: '',
        address_line_2: '',
        district: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
      },
    }
  },
  computed: {
    isFormValid() {
      const d = this.formData
      return !!(
        d.name?.trim() &&
        d.address_line_1?.trim() &&
        d.city?.trim() &&
        d.state?.trim() &&
        d.country?.trim() &&
        d.postal_code?.trim()
      )
    },
  },
  mounted() {
    this.loadStorages()
    this.loadManagers()
  },
  activated() {
    this.loadStorages()
    this.loadManagers()
  },
  methods: {
    async loadStorages() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('storage', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.storages = response.data || []
      } catch (error) {
        console.error('Erro ao carregar armazéns:', error)
        this.$emit(
          'notification',
          error.response?.data?.error || 'Erro ao carregar armazéns',
          'error'
        )
      } finally {
        this.loading = false
      }
    },

    async loadManagers() {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('storage/managers', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.managers = response.data || []
      } catch (error) {
        console.error('Erro ao carregar gerentes:', error)
        if (error.response?.status !== 403) {
          this.$emit(
            'notification',
            error.response?.data?.error || 'Erro ao carregar gerentes',
            'error'
          )
        }
      }
    },

    getManagerName(managerId) {
      if (!managerId) return null
      const id = String(managerId).trim()
      if (!id) return null
      const m = this.managers.find(x => String(x.id) === id)
      return m ? m.name || m.user : null
    },

    openCreateModal() {
      this.addressFieldReadonly = true
      this.formData = {
        corpem: '',
        name: '',
        address_line_1: '',
        address_line_2: '',
        district: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
      }
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
    },

    openDetailModal(storage) {
      this.selectedStorage = storage
      this.selectedStorageManager = storage.manager
        ? String(storage.manager).trim()
        : ''
      this.showDetailModal = true
    },

    closeDetailModal() {
      this.showDetailModal = false
      this.selectedStorage = null
      this.selectedStorageManager = ''
    },

    async saveManager() {
      if (!this.selectedStorage || this.savingManager) return
      this.savingManager = true
      try {
        const token = localStorage.getItem('token')
        await axios.patch(
          `storage/${this.selectedStorage.id}/manager`,
          { manager: this.selectedStorageManager || null },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.$emit('notification', 'Gerente atualizado com sucesso', 'success')
        this.selectedStorage.manager = this.selectedStorageManager || null
        await this.loadStorages()
      } catch (error) {
        console.error('Erro ao salvar gerente:', error)
        this.$emit(
          'notification',
          error.response?.data?.error ||
            error.response?.data?.details ||
            'Erro ao salvar gerente',
          'error'
        )
      } finally {
        this.savingManager = false
      }
    },

    async saveStorage() {
      if (!this.isFormValid || this.saving) return

      this.saving = true
      try {
        const token = localStorage.getItem('token')
        await axios.post(
          'storage',
          {
            corpem: (this.formData.corpem || '').trim().substring(0, 2) || null,
            name: this.formData.name.trim(),
            address_line_1: this.formData.address_line_1.trim(),
            address_line_2: this.formData.address_line_2?.trim() || '',
            district: this.formData.district?.trim() || '',
            city: this.formData.city.trim(),
            state: this.formData.state.trim(),
            country: this.formData.country.trim(),
            postal_code: this.formData.postal_code.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        this.$emit('notification', 'Armazém cadastrado com sucesso', 'success')
        this.closeModal()
        await this.loadStorages()
      } catch (error) {
        console.error('Erro ao criar armazém:', error)
        this.$emit(
          'notification',
          error.response?.data?.error ||
            error.response?.data?.details ||
            'Erro ao criar armazém',
          'error'
        )
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.armazens-page {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}

.empty-state i {
  font-size: 3rem;
  color: var(--gray-400);
  margin-bottom: 1rem;
}

.empty-state p {
  margin-bottom: 1rem;
  color: var(--gray-600);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--gray-200);
}

.data-table th {
  background: var(--gray-100);
  font-weight: 600;
  color: var(--gray-700);
}

.data-table td code {
  background: var(--gray-100);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: var(--gray-50);
}

/* Modal de detalhes - tamanho compacto */
.modal-container.modal-detail {
  max-height: 90vh;
  height: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 500;
  color: var(--gray-600);
  font-size: 0.875rem;
}

.detail-item p {
  margin: 0;
  color: var(--gray-800);
}

.manager-select-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.manager-select {
  flex: 1;
  min-width: 0;
}

.btn-save-manager {
  flex-shrink: 0;
}

/* Modal - 98% da altura do display */
.modal-overlay-armazens {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1vh;
}

.modal-container.modal-armazens {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 600px;
  height: 98vh !important;
  max-height: 98vh !important;
}

.modal-armazens .modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-armazens .modal-header h2 {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--gray-500);
  padding: 0.25rem;
}

.btn-close:hover {
  color: var(--gray-700);
}

.modal-armazens .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: var(--gray-700);
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.25rem;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 119, 255, 0.2);
}

.char-count {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.modal-armazens .modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background: var(--gray-300);
}

/* Gerente - select e botão no modal de detalhes */
.manager-edit .manager-select-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.manager-edit .manager-select {
  flex: 1;
  min-width: 200px;
}

.manager-edit .btn-save-manager {
  flex-shrink: 0;
}
</style>
