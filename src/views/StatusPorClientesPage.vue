<template>
  <div class="status-por-clientes-page">
    <div class="page-header">
      <div class="header-title-section">
        <h2>Status por Clientes</h2>
        <div class="clients-count">
          <span class="count-badge">{{ filteredClients.length }}</span>
          <span class="count-label">{{
            filteredClients.length === 1 ? 'cliente' : 'clientes'
          }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="loadData"
          :disabled="loading"
          title="Atualizar dados"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Atualizar
        </button>
      </div>
    </div>

    <div class="search-bar-container">
      <div class="search-input-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control search-input"
          placeholder="Buscar por código Corpem ou nome do estoque..."
        />
        <button
          v-if="searchQuery"
          class="btn-clear-search"
          @click="searchQuery = ''"
          title="Limpar busca"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only">Carregando...</span>
      </div>
      <span class="loading-text">Carregando dados...</span>
    </div>

    <div v-else-if="error" class="alert alert-danger mt-3">
      <i class="fas fa-exclamation-circle mr-2"></i>
      {{ error }}
      <button class="btn btn-sm btn-outline-danger ml-2" @click="loadData">
        Tentar novamente
      </button>
    </div>

    <div v-else class="table-container">
      <table class="table table-hover status-table">
        <thead>
          <tr>
            <th class="col-corpem sortable-th" @click="sortBy('corpem_code')">
              Corpem
              <span class="sort-icon">
                <i
                  v-if="sortField === 'corpem_code'"
                  :class="
                    sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-neutral"></i>
              </span>
            </th>
            <th class="col-nome sortable-th" @click="sortBy('name')">
              Nome
              <span class="sort-icon">
                <i
                  v-if="sortField === 'name'"
                  :class="
                    sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-neutral"></i>
              </span>
            </th>
            <th
              class="col-status col-solicitado sortable-th"
              title="Agendamentos com status Solicitado"
              @click="sortBy('count_solicitado')"
            >
              <span class="status-header-badge status-solicitado"
                >Solicitado</span
              >
              <span class="sort-icon">
                <i
                  v-if="sortField === 'count_solicitado'"
                  :class="
                    sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-neutral"></i>
              </span>
            </th>
            <th
              class="col-status col-agendado sortable-th"
              title="Agendamentos com status Agendado"
              @click="sortBy('count_agendado')"
            >
              <span class="status-header-badge status-agendado">Agendado</span>
              <span class="sort-icon">
                <i
                  v-if="sortField === 'count_agendado'"
                  :class="
                    sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-neutral"></i>
              </span>
            </th>
            <th
              class="col-status col-conferencia sortable-th"
              title="Agendamentos em Conferência"
              @click="sortBy('count_conferencia')"
            >
              <span class="status-header-badge status-conferencia"
                >Em conferência</span
              >
              <span class="sort-icon">
                <i
                  v-if="sortField === 'count_conferencia'"
                  :class="
                    sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-neutral"></i>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredClients.length === 0 && !loading">
            <td colspan="5" class="text-center text-muted empty-row">
              <i class="fas fa-inbox mr-2"></i>
              Nenhum cliente encontrado.
            </td>
          </tr>
          <tr
            v-for="client in filteredClients"
            :key="client.cnpj"
            class="client-row"
          >
            <td class="col-corpem corpem-code">
              {{ client.corpem_code || '—' }}
            </td>
            <td
              class="col-nome client-name-cell"
              @click="navigateTo(client, null)"
              :title="`Ver agendamentos de ${client.name}`"
            >
              {{ client.name }}
            </td>
            <td
              class="col-status"
              :class="
                client.count_solicitado > 0 ? 'count-clickable' : 'count-zero'
              "
              @click="
                client.count_solicitado > 0 && navigateTo(client, 'Solicitado')
              "
              :title="
                client.count_solicitado > 0
                  ? `Ver ${client.count_solicitado} agendamento(s) Solicitado(s) de ${client.name}`
                  : ''
              "
            >
              <span
                v-if="client.count_solicitado > 0"
                class="count-pill count-pill-solicitado"
                >{{ client.count_solicitado }}</span
              >
              <span v-else class="count-zero-dash">—</span>
            </td>
            <td
              class="col-status"
              :class="
                client.count_agendado > 0 ? 'count-clickable' : 'count-zero'
              "
              @click="
                client.count_agendado > 0 && navigateTo(client, 'Agendado')
              "
              :title="
                client.count_agendado > 0
                  ? `Ver ${client.count_agendado} agendamento(s) Agendado(s) de ${client.name}`
                  : ''
              "
            >
              <span
                v-if="client.count_agendado > 0"
                class="count-pill count-pill-agendado"
                >{{ client.count_agendado }}</span
              >
              <span v-else class="count-zero-dash">—</span>
            </td>
            <td
              class="col-status"
              :class="
                client.count_conferencia > 0 ? 'count-clickable' : 'count-zero'
              "
              @click="
                client.count_conferencia > 0 &&
                navigateTo(client, 'Conferência')
              "
              :title="
                client.count_conferencia > 0
                  ? `Ver ${client.count_conferencia} agendamento(s) em Conferência de ${client.name}`
                  : ''
              "
            >
              <span
                v-if="client.count_conferencia > 0"
                class="count-pill count-pill-conferencia"
                >{{ client.count_conferencia }}</span
              >
              <span v-else class="count-zero-dash">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatusPorClientesPage',

  emits: ['notification', 'navigate-to-agenda'],

  data() {
    return {
      clients: [],
      loading: false,
      error: null,
      searchQuery: '',
      sortField: 'name',
      sortDir: 'asc',
    }
  },

  computed: {
    filteredClients() {
      const q = this.searchQuery.trim().toLowerCase()
      let list = this.clients
      if (q) {
        list = list.filter(
          c =>
            (c.corpem_code &&
              String(c.corpem_code).toLowerCase().includes(q)) ||
            (c.name && c.name.toLowerCase().includes(q))
        )
      }

      const field = this.sortField
      const dir = this.sortDir === 'asc' ? 1 : -1
      return [...list].sort((a, b) => {
        const av =
          field === 'name' || field === 'corpem_code'
            ? String(a[field] || '').toLowerCase()
            : Number(a[field] || 0)
        const bv =
          field === 'name' || field === 'corpem_code'
            ? String(b[field] || '').toLowerCase()
            : Number(b[field] || 0)
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
        return 0
      })
    },
  },

  methods: {
    async loadData() {
      this.loading = true
      this.error = null
      try {
        const response = await window.apiClient.request(
          '/schedules/status-por-cliente',
          { method: 'GET' }
        )
        this.clients = response.data || []
      } catch (err) {
        this.error = 'Erro ao carregar dados. Tente novamente.'
        this.$emit(
          'notification',
          'Erro ao carregar status por clientes',
          'error'
        )
        console.error('[StatusPorClientesPage] Erro:', err)
      } finally {
        this.loading = false
      }
    },

    navigateTo(client, status) {
      this.$emit('navigate-to-agenda', { client, status })
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortDir = 'asc'
      }
    },
  },

  mounted() {
    this.loadData()
  },
}
</script>

<style scoped>
.status-por-clientes-page {
  width: 100%;
  padding: 0 4px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title-section h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #1e293b;
}

.clients-count {
  display: flex;
  align-items: center;
  gap: 6px;
}

.count-badge {
  background: #3b82f6;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.count-label {
  font-size: 0.85rem;
  color: #64748b;
}

.search-bar-container {
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  max-width: 480px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  font-size: 0.9rem;
}

.search-input {
  padding-left: 36px;
  padding-right: 36px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  font-size: 0.85rem;
}

.btn-clear-search:hover {
  color: #64748b;
}

.loading-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: #64748b;
}

.loading-text {
  font-size: 0.95rem;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
}

.status-table {
  margin: 0;
  width: 100%;
  font-size: 0.9rem;
  border-collapse: collapse;
}

.status-table thead th {
  background: #f1f5f9;
  border-bottom: 2px solid #94a3b8;
  border-right: 1px solid #cbd5e1;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  padding: 10px 14px;
}

.status-table thead th:last-child {
  border-right: none;
}

.status-table tbody td {
  padding: 10px 14px;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
}

.status-table tbody td:last-child {
  border-right: none;
}

.status-table tbody tr:last-child td {
  border-bottom: none;
}

.client-row:hover {
  background-color: #f8fafc;
}

/* Sortable header */
.sortable-th {
  cursor: pointer;
  user-select: none;
}

.sortable-th:hover {
  background: #e2e8f0;
}

.sort-icon {
  margin-left: 6px;
  font-size: 0.75rem;
  color: #64748b;
}

.sort-neutral {
  opacity: 0.35;
}

.col-corpem {
  width: 110px;
  min-width: 90px;
}

.col-nome {
  min-width: 200px;
}

.col-status {
  width: 140px;
  min-width: 110px;
  text-align: center;
}

.corpem-code {
  font-family: monospace;
  font-size: 0.85rem;
  color: #64748b;
}

.client-name-cell {
  color: #1e293b;
  font-weight: 500;
  cursor: pointer;
}

.client-name-cell:hover {
  background-color: #f1f5f9;
}

.count-clickable {
  cursor: pointer;
}

.count-clickable:hover {
  background-color: #eff6ff;
}

.count-zero {
  cursor: default;
}

.count-pill {
  display: inline-block;
  min-width: 32px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
}

.count-pill-solicitado {
  background: #fef3c7;
  color: #92400e;
}

.count-pill-agendado {
  background: #dbeafe;
  color: #1e40af;
}

.count-pill-conferencia {
  background: #d1fae5;
  color: #065f46;
}

.count-zero-dash {
  color: #cbd5e1;
  font-size: 0.9rem;
}

.status-header-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-solicitado {
  background: #fef3c7;
  color: #92400e;
}

.status-agendado {
  background: #dbeafe;
  color: #1e40af;
}

.status-conferencia {
  background: #d1fae5;
  color: #065f46;
}

.empty-row {
  padding: 40px 0;
  font-size: 0.95rem;
}
</style>
