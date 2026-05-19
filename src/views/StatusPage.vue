<template>
  <div class="status-page">
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1><i class="fas fa-tags"></i> Status</h1>
          <p class="page-description">
            Configuração dos textos e cores das badges de status de
            agendamentos. Status nativos do sistema não podem ser alterados.
          </p>
        </div>
        <button type="button" class="btn btn-create" @click="openCreateModal">
          <i class="fas fa-plus"></i> Criar novo status
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loader-spinner"></div>
      <p>Carregando...</p>
    </div>

    <div v-else class="table-wrap">
      <table class="data-table status-table">
        <thead>
          <tr>
            <th>Visualização</th>
            <th>Texto</th>
            <th>Cor de fundo</th>
            <th>Cor do texto</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id !== null ? `id-${item.id}` : `native-${item.name}`"
            :class="{
              'row-native': item.isNative,
              'row-editing': editingId === getItemKey(item),
            }"
          >
            <!-- Visualização: badge preview -->
            <td class="cell-preview">
              <span class="status-badge-preview" :style="badgeStyle(item)">
                {{
                  editingId === getItemKey(item)
                    ? editCopy.name || item.name
                    : item.name
                }}
              </span>
            </td>
            <!-- Texto: exibição ou input -->
            <td class="cell-text">
              <template v-if="editingId === getItemKey(item)">
                <input
                  v-model="editCopy.name"
                  type="text"
                  maxlength="30"
                  class="input-text"
                  placeholder="Texto da badge"
                />
              </template>
              <span v-else>{{ item.name }}</span>
            </td>
            <!-- Cor de fundo -->
            <td class="cell-color">
              <template v-if="editingId === getItemKey(item)">
                <div class="color-input-wrap">
                  <input
                    v-model="editCopy.badge_color"
                    type="color"
                    class="input-color"
                  />
                  <span class="color-hex">{{ editCopy.badge_color }}</span>
                </div>
              </template>
              <template v-else>
                <div
                  class="color-display"
                  :style="{ backgroundColor: item.badge_color }"
                ></div>
                <span class="color-hex">{{ item.badge_color }}</span>
              </template>
            </td>
            <!-- Cor do texto -->
            <td class="cell-color">
              <template v-if="editingId === getItemKey(item)">
                <div class="color-input-wrap">
                  <input
                    v-model="editCopy.text_color"
                    type="color"
                    class="input-color"
                  />
                  <span class="color-hex">{{ editCopy.text_color }}</span>
                </div>
              </template>
              <template v-else>
                <div
                  class="color-display"
                  :style="{ backgroundColor: item.text_color }"
                ></div>
                <span class="color-hex">{{ item.text_color }}</span>
              </template>
            </td>
            <!-- Ações -->
            <td class="cell-actions">
              <template v-if="editingId === getItemKey(item)">
                <button
                  type="button"
                  class="btn btn-icon btn-confirm"
                  title="Confirmar edição"
                  @click="saveEdit(item)"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-icon btn-cancel"
                  title="Cancelar edição"
                  @click="cancelEdit"
                >
                  <i class="fas fa-times"></i>
                </button>
              </template>
              <template v-else>
                <button
                  v-if="item.id !== null"
                  type="button"
                  class="btn btn-icon btn-history"
                  title="Histórico"
                  @click="openHistory(item)"
                >
                  <i class="fas fa-history"></i>
                </button>
                <button
                  v-if="!item.isNative"
                  type="button"
                  class="btn btn-icon btn-edit"
                  title="Editar"
                  @click="startEdit(item)"
                >
                  <i class="fas fa-edit"></i>
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Modal Criar novo status -->
    <div
      v-if="createModal.show"
      class="modal-overlay"
      @click.self="closeCreateModal"
    >
      <div class="modal-box modal-create">
        <div class="modal-header">
          <h3>Criar novo status</h3>
          <button
            type="button"
            class="btn-close"
            @click="closeCreateModal"
            aria-label="Fechar"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="create-name"
              >Texto da badge <span class="required">*</span></label
            >
            <input
              id="create-name"
              v-model="createModal.name"
              type="text"
              maxlength="30"
              class="input-text"
              placeholder="Ex: Aguardando"
            />
            <span class="form-hint"
              >Máximo 30 caracteres. Não use nomes de status nativos.</span
            >
          </div>
          <div class="form-group">
            <label>Visualização</label>
            <div class="create-preview-wrap">
              <span class="status-badge-preview" :style="createModalBadgeStyle">
                {{ createModal.name || 'Texto' }}
              </span>
            </div>
          </div>
          <div class="form-group">
            <label for="create-badge-color">Cor de fundo</label>
            <div class="color-input-wrap">
              <input
                id="create-badge-color"
                v-model="createModal.badge_color"
                type="color"
                class="input-color"
              />
              <span class="color-hex">{{ createModal.badge_color }}</span>
            </div>
          </div>
          <div class="form-group">
            <label for="create-text-color">Cor do texto</label>
            <div class="color-input-wrap">
              <input
                id="create-text-color"
                v-model="createModal.text_color"
                type="color"
                class="input-color"
              />
              <span class="color-hex">{{ createModal.text_color }}</span>
            </div>
          </div>
          <div v-if="createModal.error" class="create-error">
            {{ createModal.error }}
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeCreateModal"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="createModal.saving || !createModal.name.trim()"
              @click="submitCreate"
            >
              <i v-if="createModal.saving" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-check"></i>
              {{ createModal.saving ? 'Salvando...' : 'Criar status' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Histórico -->
    <div
      v-if="historyModal.show"
      class="modal-overlay"
      @click.self="historyModal.show = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>Histórico — {{ historyModal.name }}</h3>
          <button
            type="button"
            class="btn-close"
            @click="historyModal.show = false"
            aria-label="Fechar"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div
            v-if="!historyModal.historic || historyModal.historic.length === 0"
            class="empty-historic"
          >
            Nenhum registro no histórico.
          </div>
          <ul v-else class="historic-list">
            <li
              v-for="(entry, idx) in historyModal.historic"
              :key="idx"
              class="historic-item"
            >
              <span class="historic-meta"
                >{{ formatDateTime(entry.at) }} — {{ entry.user }}</span
              >
              <template v-if="entry.previous && entry.new">
                <span class="historic-diff">
                  {{ entry.previous.name }} → {{ entry.new.name }} |
                  {{ entry.previous.badge_color }} →
                  {{ entry.new.badge_color }} |
                  {{ entry.previous.text_color }} → {{ entry.new.text_color }}
                </span>
              </template>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { BASE_URL } from '../config/api.js'
import { invalidateStatusConfigCache } from '../utils/statusConfigCache.js'

export default {
  name: 'StatusPage',
  data() {
    return {
      loading: true,
      error: null,
      list: [],
      editingId: null,
      editCopy: null,
      historyModal: {
        show: false,
        name: '',
        historic: [],
      },
      createModal: {
        show: false,
        name: '',
        badge_color: '#6c757d',
        text_color: '#ffffff',
        error: null,
        saving: false,
      },
    }
  },
  computed: {
    createModalBadgeStyle() {
      const bg = this.createModal.badge_color || '#6c757d'
      const text = this.createModal.text_color || '#ffffff'
      const borderColor = this.darkenHex(bg, 0.25)
      return {
        backgroundColor: bg,
        color: text,
        border: `2px solid ${borderColor}`,
      }
    },
  },
  mounted() {
    this.loadList()
  },
  methods: {
    getApi() {
      return window.apiClient || this.$http || null
    },
    getItemKey(item) {
      return item.id !== null ? `id-${item.id}` : `native-${item.name}`
    },
    badgeStyle(item) {
      const name =
        this.editingId === this.getItemKey(item)
          ? this.editCopy?.name || item.name
          : item.name
      const bg =
        this.editingId === this.getItemKey(item)
          ? this.editCopy?.badge_color || item.badge_color
          : item.badge_color
      const text =
        this.editingId === this.getItemKey(item)
          ? this.editCopy?.text_color || item.text_color
          : item.text_color
      const borderColor = this.darkenHex(bg, 0.25)
      return {
        backgroundColor: bg,
        color: text,
        border: `2px solid ${borderColor}`,
      }
    },
    darkenHex(hex, amount = 0.2) {
      if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex
      const num = parseInt(hex.slice(1), 16)
      const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount))
      const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount))
      const b = Math.max(0, (num & 0xff) * (1 - amount))
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
    },
    async loadList() {
      this.loading = true
      this.error = null
      const base =
        (this.getApi() &&
          (this.getApi().defaults?.baseURL || this.getApi().baseURL)) ||
        BASE_URL ||
        '/api'
      const url = `${String(base).replace(/\/$/, '')}/status-config`
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(res.statusText)
        const data = await res.json()
        this.list = data.list || []
      } catch (e) {
        this.error = e?.message || 'Erro ao carregar status.'
      } finally {
        this.loading = false
      }
    },
    startEdit(item) {
      if (item.isNative) return
      this.editingId = this.getItemKey(item)
      this.editCopy = {
        name: String(item.name || ''),
        badge_color: String(item.badge_color || '#6c757d'),
        text_color: String(item.text_color || '#ffffff'),
      }
    },
    cancelEdit() {
      this.editingId = null
      this.editCopy = null
    },
    async saveEdit(item) {
      if (!item.id || !this.editCopy) return
      const base =
        (this.getApi() &&
          (this.getApi().defaults?.baseURL || this.getApi().baseURL)) ||
        BASE_URL ||
        '/api'
      const url = `${String(base).replace(/\/$/, '')}/status-config/${item.id}`
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: this.editCopy.name.trim(),
            badge_color: this.editCopy.badge_color,
            text_color: this.editCopy.text_color,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || res.statusText)
        }
        const updated = await res.json()
        const idx = this.list.findIndex(
          i => this.getItemKey(i) === this.getItemKey(item)
        )
        if (idx !== -1) {
          this.list[idx] = {
            ...this.list[idx],
            name: updated.name,
            badge_color: updated.badge_color,
            text_color: updated.text_color,
            historic: updated.historic,
          }
        }
        this.cancelEdit()
        invalidateStatusConfigCache()
      } catch (e) {
        this.error = e?.message || 'Erro ao salvar.'
      }
    },
    async openHistory(item) {
      if (item.id == null) return
      const base =
        (this.getApi() &&
          (this.getApi().defaults?.baseURL || this.getApi().baseURL)) ||
        BASE_URL ||
        '/api'
      const url = `${String(base).replace(/\/$/, '')}/status-config/${item.id}/historic`
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(res.statusText)
        const data = await res.json()
        this.historyModal = {
          show: true,
          name: data.name || item.name,
          historic: data.historic || [],
        }
      } catch (e) {
        this.error = e?.message || 'Erro ao carregar histórico.'
      }
    },
    formatDateTime(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    openCreateModal() {
      this.createModal = {
        show: true,
        name: '',
        badge_color: '#6c757d',
        text_color: '#ffffff',
        error: null,
        saving: false,
      }
    },
    closeCreateModal() {
      this.createModal.show = false
      this.createModal.error = null
    },
    async submitCreate() {
      const name = this.createModal.name.trim()
      if (!name) {
        this.createModal.error = 'Informe o texto da badge.'
        return
      }
      if (name.length > 30) {
        this.createModal.error = 'O texto deve ter no máximo 30 caracteres.'
        return
      }
      this.createModal.error = null
      this.createModal.saving = true
      const base =
        (this.getApi() &&
          (this.getApi().defaults?.baseURL || this.getApi().baseURL)) ||
        BASE_URL ||
        '/api'
      const url = `${String(base).replace(/\/$/, '')}/status-config`
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name,
            badge_color: this.createModal.badge_color,
            text_color: this.createModal.text_color,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            data.error || res.statusText || 'Erro ao criar status.'
          )
        }
        this.closeCreateModal()
        await this.loadList()
        invalidateStatusConfigCache()
      } catch (e) {
        this.createModal.error = e?.message || 'Erro ao criar status.'
      } finally {
        this.createModal.saving = false
      }
    },
  },
}
</script>

<style scoped>
.status-page {
  padding: 1rem 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-header-row > div {
  flex: 1;
  min-width: 0;
}

.page-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-description {
  color: #555;
  margin: 0;
  font-size: 0.95rem;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #198754;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.btn-create:hover {
  background: #157347;
}

.btn-create i {
  font-size: 0.9em;
}

.loading-container {
  text-align: center;
  padding: 2rem;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-wrap {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 2px solid #ced4da;
}

.data-table th {
  font-weight: 600;
  color: #333;
  background: #f8f9fa;
  border-bottom: 2px solid #adb5bd;
}

.data-table tbody tr {
  background: #fff;
}

.data-table tbody tr.row-native {
  background: #e9ecef;
  color: #212529;
}

.data-table tbody tr.row-native td {
  border-bottom-color: #dee2e6;
}

.data-table tbody tr.row-editing {
  background: #f0f8ff;
}

.data-table tbody tr.row-editing td {
  border-bottom-color: #ced4da;
}

.cell-preview {
  vertical-align: middle;
}

.status-badge-preview {
  display: inline-block;
  padding: 0.35em 0.65em;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  min-width: 6em;
  text-align: center;
}

.cell-text .input-text {
  width: 100%;
  max-width: 140px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.cell-color {
  vertical-align: middle;
}

.color-input-wrap,
.color-display-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-color {
  width: 36px;
  height: 28px;
  padding: 0;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
}

.color-display {
  display: inline-block;
  width: 28px;
  height: 22px;
  border: 1px solid #ddd;
  border-radius: 4px;
  vertical-align: middle;
  margin-right: 0.5rem;
}

.color-hex {
  font-size: 0.85rem;
  color: #555;
  font-family: monospace;
}

.cell-actions {
  white-space: nowrap;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-history {
  background: #6c757d;
  color: #fff;
}

.btn-history:hover {
  background: #5a6268;
}

.btn-edit {
  background: #0d6efd;
  color: #fff;
}

.btn-edit:hover {
  background: #0b5ed7;
}

.btn-confirm {
  background: #198754;
  color: #fff;
}

.btn-confirm:hover {
  background: #157347;
}

.btn-cancel {
  background: #dc3545;
  color: #fff;
}

.btn-cancel:hover {
  background: #bb2d3b;
}

.error-msg {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.btn-close {
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
}

.btn-close:hover {
  background: #eee;
  color: #333;
}

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.empty-historic {
  color: #666;
  font-style: italic;
}

.historic-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.historic-item {
  padding: 0.6rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.historic-item:last-child {
  border-bottom: none;
}

.historic-meta {
  display: block;
  color: #555;
  margin-bottom: 0.25rem;
}

.historic-diff {
  display: block;
  color: #333;
  font-size: 0.85rem;
}

/* Modal Criar */
.modal-create .modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group .input-text {
  max-width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-hint {
  font-size: 0.8rem;
  color: #6c757d;
}

.create-preview-wrap {
  padding: 0.5rem 0;
}

.create-error {
  padding: 0.5rem 0.75rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.modal-actions .btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-actions .btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal-actions .btn-primary {
  background: #198754;
  color: #fff;
  border: none;
}

.modal-actions .btn-primary:hover:not(:disabled) {
  background: #157347;
}

.modal-actions .btn-secondary {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #ced4da;
}

.modal-actions .btn-secondary:hover {
  background: #d3d5d7;
}

.required {
  color: #dc3545;
}
</style>
