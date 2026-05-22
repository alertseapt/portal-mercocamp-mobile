<template>
  <div class="corpem-logs-page">
    <!-- Filtros -->
    <div class="filters-container">
      <!-- Filtro por Tipo de Integração (Badges) -->
      <div class="filter-group full-width">
        <label>Tipo de Integração:</label>
        <div class="type-filter-badges">
          <button
            @click="filterByType('')"
            :class="[
              'filter-badge',
              'all',
              { active: filters.integrationType === '' },
            ]"
          >
            <i class="fas fa-list"></i>
            <span>Todos</span>
          </button>
          <button
            @click="filterByType('products')"
            :class="[
              'filter-badge',
              'products',
              { active: filters.integrationType === 'products' },
            ]"
          >
            <i class="fas fa-boxes"></i>
            <span>Produtos</span>
          </button>
          <button
            @click="filterByType('nf_entry')"
            :class="[
              'filter-badge',
              'nf_entry',
              { active: filters.integrationType === 'nf_entry' },
            ]"
          >
            <i class="fas fa-file-invoice"></i>
            <span>NF-e</span>
          </button>
        </div>
      </div>

      <div class="filter-group">
        <label for="nf-filter">Número da NF-e:</label>
        <input
          id="nf-filter"
          v-model="filters.nfNumber"
          type="text"
          placeholder="Ex: 12345"
          @input="debounceSearch"
        />
      </div>

      <div class="filter-actions">
        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          Limpar Filtros
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader-spinner"></div>
      <p>Carregando logs de integração...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="loadLogs" class="retry-btn">
          <i class="fas fa-redo"></i>
          Tentar novamente
        </button>
      </div>
    </div>

    <!-- Tabela de logs -->
    <div v-else class="logs-table-container">
      <!-- Informações da paginação -->
      <div class="pagination-info" v-if="pagination.total > 0">
        <span>
          Mostrando {{ (pagination.page - 1) * pagination.limit + 1 }} até
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          de {{ pagination.total }} registros
        </span>
      </div>

      <!-- Tabela -->
      <div class="table-wrapper">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Número NF</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Resposta</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="no-data">
                <i class="fas fa-inbox"></i>
                Nenhum log encontrado
              </td>
            </tr>
            <tr v-else v-for="log in logs" :key="log.id" class="log-row">
              <td class="log-date">
                <div class="date-time-container">
                  <div class="date-line">
                    {{ formatDateOnly(log.created_at) }}
                  </div>
                  <div class="time-line">
                    {{ formatTimeOnly(log.created_at) }}
                  </div>
                </div>
              </td>
              <td class="log-nf">
                <span v-if="log.no_nf" class="nf-number">{{ log.no_nf }}</span>
                <span v-else class="no-data-cell">-</span>
              </td>
              <td class="log-client">
                <span v-if="log.client_name" class="client-name">{{
                  log.client_name
                }}</span>
                <span v-else-if="log.client" class="client-cnpj">{{
                  log.client
                }}</span>
                <span v-else class="no-data-cell">-</span>
              </td>
              <td class="log-type">
                <span
                  :class="['type-icon', log.integration_type]"
                  :title="getTypeLabel(log.integration_type)"
                >
                  <i :class="getTypeIcon(log.integration_type)"></i>
                </span>
              </td>
              <td class="log-response">
                <div class="response-container">
                  <span
                    v-if="getResponsePreview(log)"
                    :title="getResponsePreview(log)"
                    :class="[
                      'response-text',
                      { 'response-success': isSuccessResponse(log) },
                    ]"
                  >
                    {{ truncateResponse(log) }}
                  </span>
                  <span v-else class="no-data-cell">-</span>
                </div>
              </td>
              <td class="log-actions">
                <button
                  @click="showLogDetails(log)"
                  class="action-btn details-btn icon-only"
                  title="Ver detalhes completos"
                >
                  <i class="fas fa-info-circle"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div class="pagination-container" v-if="pagination.totalPages > 1">
        <button
          @click="changePage(1)"
          :disabled="pagination.page === 1"
          class="pagination-btn first-btn"
          title="Primeira página"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>

        <button
          @click="changePage(pagination.page - 1)"
          :disabled="!pagination.hasPrev"
          class="pagination-btn prev-btn"
        >
          <i class="fas fa-chevron-left"></i>
          Anterior
        </button>

        <div class="page-numbers">
          <button
            v-for="page in getVisiblePages()"
            :key="page"
            @click="changePage(page)"
            :class="['page-btn', { active: page === pagination.page }]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="changePage(pagination.page + 1)"
          :disabled="!pagination.hasNext"
          class="pagination-btn next-btn"
        >
          Próxima
          <i class="fas fa-chevron-right"></i>
        </button>

        <div class="page-info">
          Página {{ pagination.page }} de {{ pagination.totalPages }}
        </div>
      </div>
    </div>

    <!-- Modal de detalhes -->
    <div
      v-if="showDetailsModal"
      class="modal-overlay modal-overlay-fixed"
      @click="closeDetailsModal"
      :style="modalOverlayStyle"
    >
      <div
        class="modal-container modal-container-fixed"
        @click.stop
        :style="modalContainerStyle"
      >
        <div class="modal-header modal-header-fixed" :style="modalHeaderStyle">
          <h3>
            <i class="fas fa-info-circle"></i>
            Detalhes do Log #{{ selectedLog?.id }}
          </h3>
          <button @click="closeDetailsModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div
          class="modal-content modal-content-scrollable"
          :style="modalContentStyle"
        >
          <div v-if="selectedLog" class="log-details">
            <!-- Seção: Informações do Log -->
            <div class="detail-section">
              <h4 class="section-title">
                <i class="fas fa-clipboard-list"></i>
                Informações do Log
              </h4>
              <div class="detail-group">
                <label>ID do Log:</label>
                <span class="highlight">{{ selectedLog.id }}</span>
              </div>
              <div class="detail-group">
                <label>Data/Hora:</label>
                <span>{{ formatDate(selectedLog.created_at) }}</span>
              </div>
              <div class="detail-group">
                <label>Tipo de Integração:</label>
                <span>{{ getTypeLabel(selectedLog.integration_type) }}</span>
              </div>
              <div class="detail-group">
                <label>Status:</label>
                <span
                  :class="[
                    'status-detail',
                    selectedLog.success ? 'success' : 'error',
                  ]"
                >
                  <i
                    :class="
                      selectedLog.success
                        ? 'fas fa-check-circle'
                        : 'fas fa-times-circle'
                    "
                  ></i>
                  {{ selectedLog.success ? 'Sucesso' : 'Erro' }}
                </span>
              </div>
              <div class="detail-group">
                <label>Usuário Responsável:</label>
                <span class="highlight">{{
                  selectedLog.user_id || 'Sistema'
                }}</span>
              </div>
            </div>

            <!-- Seção: Informações do Agendamento -->
            <div class="detail-section" v-if="selectedLog.schedule_id">
              <h4 class="section-title">
                <i class="fas fa-calendar-alt"></i>
                Informações do Agendamento
              </h4>
              <div class="detail-group">
                <label>ID do Agendamento:</label>
                <span class="highlight">#{{ selectedLog.schedule_id }}</span>
              </div>
              <div class="detail-group" v-if="selectedLog.client">
                <label>Cliente:</label>
                <span>{{ selectedLog.client }}</span>
              </div>
              <div class="detail-group" v-if="selectedLog.supplier">
                <label>Fornecedor:</label>
                <span class="highlight">{{ selectedLog.supplier }}</span>
              </div>
              <div class="detail-group" v-if="selectedLog.schedule_date">
                <label>Data do Agendamento:</label>
                <span>{{ formatScheduleDate(selectedLog.schedule_date) }}</span>
              </div>
            </div>

            <!-- Seção: Informações da NFe -->
            <div
              class="detail-section"
              v-if="selectedLog.no_nf || selectedLog.nfe_key"
            >
              <h4 class="section-title">
                <i class="fas fa-file-invoice"></i>
                Informações da NFe
              </h4>
              <div class="detail-group" v-if="selectedLog.no_nf">
                <label>Número da NF:</label>
                <span class="highlight">{{ selectedLog.no_nf }}</span>
              </div>
              <div class="detail-group" v-if="selectedLog.nfe_key">
                <label>Chave da NFe:</label>
                <span class="nfe-key-full">{{ selectedLog.nfe_key }}</span>
              </div>
            </div>

            <!-- Seção: Informações do Upload TXT (apenas para txt_upload) -->
            <div
              class="detail-section"
              v-if="
                selectedLog.integration_type === 'txt_upload' &&
                getUploadDetails(selectedLog)
              "
            >
              <h4 class="section-title">
                <i class="fas fa-upload"></i>
                Informações do Upload TXT
              </h4>
              <div
                class="detail-group"
                v-if="getUploadDetails(selectedLog).filename"
              >
                <label>Nome do Arquivo:</label>
                <span class="highlight">{{
                  getUploadDetails(selectedLog).filename
                }}</span>
              </div>
              <div
                class="detail-group"
                v-if="getUploadDetails(selectedLog).upload_method"
              >
                <label>Método de Envio:</label>
                <span
                  :class="[
                    'upload-method',
                    getUploadDetails(selectedLog).upload_method.toLowerCase(),
                  ]"
                >
                  <i
                    :class="
                      getUploadDetails(selectedLog).upload_method === 'FTP'
                        ? 'fas fa-server'
                        : 'fas fa-save'
                    "
                  ></i>
                  {{ getUploadDetails(selectedLog).upload_method }}
                </span>
              </div>
              <div
                class="detail-group"
                v-if="getUploadDetails(selectedLog).schedule_count"
              >
                <label>Quantidade de Agendamentos:</label>
                <span
                  >{{
                    getUploadDetails(selectedLog).schedule_count
                  }}
                  agendamentos</span
                >
              </div>
              <div
                class="detail-group"
                v-if="getUploadDetails(selectedLog).host"
              >
                <label>Servidor de Destino:</label>
                <span>{{ getUploadDetails(selectedLog).host }}</span>
              </div>
            </div>
            <div class="detail-group full-width">
              <label>Resposta da Integração:</label>
              <div class="response-full">
                <pre>{{ formatResponse(selectedLog) }}</pre>
              </div>
            </div>
            <div
              class="detail-group full-width"
              v-if="selectedLog.message && !selectedLog.error_details"
            >
              <label>Mensagem Adicional:</label>
              <div class="message-full">
                {{ selectedLog.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { BASE_URL } from '@/config/api'

export default {
  name: 'CorpemLogsPage',
  data() {
    return {
      logs: [],
      loading: false,
      error: null,
      filters: {
        nfNumber: '',
        integrationType: '',
      },
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      searchTimeout: null,
      showDetailsModal: false,
      selectedLog: null,
    }
  },
  computed: {
    modalOverlayStyle() {
      return {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        zIndex: '1000',
      }
    },
    modalContainerStyle() {
      // Calcula altura do modal: 100vh - 20px (10px padding superior + 10px inferior)
      const viewportHeight = window.innerHeight
      const modalHeight = viewportHeight - 20
      return {
        height: `${modalHeight}px`,
        maxHeight: `${modalHeight}px`,
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    },
    modalHeaderStyle() {
      return {
        flexShrink: '0',
        flexGrow: '0',
        height: 'auto',
      }
    },
    modalContentStyle() {
      return {
        flex: '1',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '0',
        padding: '20px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }
    },
  },
  mounted() {
    // Verificar permissão antes de carregar
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.level_access !== 0) {
          this.error =
            'Acesso negado. Apenas desenvolvedores (nível 0) têm permissão para acessar esta página.'
          this.loading = false
          return
        }
      } catch (e) {
        console.error('Erro ao parsear dados do usuário:', e)
      }
    }

    this.loadLogs()
  },
  methods: {
    async loadLogs() {
      // Verificar permissão antes de fazer requisição
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (user.level_access !== 0) {
            this.error =
              'Acesso negado. Apenas desenvolvedores (nível 0) têm permissão.'
            this.loading = false
            return
          }
        } catch (e) {
          console.error('Erro ao parsear dados do usuário:', e)
        }
      }

      this.loading = true
      this.error = null

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Token de autorização não encontrado')
        }

        const params = new URLSearchParams({
          page: this.pagination.page,
          limit: this.pagination.limit,
        })

        if (this.filters.nfNumber) {
          params.append('nfNumber', this.filters.nfNumber)
        }

        if (this.filters.integrationType) {
          params.append('integrationType', this.filters.integrationType)
        }

        const url = `${BASE_URL}/corpem/integration-logs?${params}`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Erro na requisição:', errorText)
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()

        if (data.success) {
          this.logs = data.data
          this.pagination = data.pagination
        } else {
          throw new Error(data.error || 'Erro ao buscar logs')
        }
      } catch (error) {
        console.error('Erro ao carregar logs:', error)
        this.error = 'Erro ao carregar logs de integração. Tente novamente.'
        this.logs = []
      } finally {
        this.loading = false
      }
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.applyFilters()
      }, 500)
    },

    applyFilters() {
      this.pagination.page = 1
      this.loadLogs()
    },

    clearFilters() {
      this.filters = {
        nfNumber: '',
        integrationType: '',
      }
      this.applyFilters()
    },

    filterByType(type) {
      this.filters.integrationType = type
      this.applyFilters()
    },

    getResponsePreview(log) {
      // Prioridade: error_details (JSON) > message (texto)
      if (log.error_details) {
        try {
          const parsed = JSON.parse(log.error_details)
          return JSON.stringify(parsed)
        } catch {
          return log.error_details
        }
      }
      return log.message || ''
    },

    truncateResponse(log) {
      const preview = this.getResponsePreview(log)
      if (!preview) return '-'
      return preview.length > 80 ? preview.substring(0, 80) + '...' : preview
    },

    isSuccessResponse(log) {
      // Verifica se a resposta é um sucesso do CORPEM ({"CORPEM_WS_OK": "OK"})
      if (!log.error_details) return false

      try {
        const parsed = JSON.parse(log.error_details)
        return parsed.CORPEM_WS_OK === 'OK'
      } catch {
        return false
      }
    },

    changePage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.page = page
        this.loadLogs()
      }
    },

    getVisiblePages() {
      const current = this.pagination.page
      const total = this.pagination.totalPages
      const pages = []

      const start = Math.max(1, current - 2)
      const end = Math.min(total, current + 2)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      return pages
    },

    formatDate(dateString) {
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
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    },

    formatTimeOnly(dateString) {
      const date = new Date(dateString)
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    formatScheduleDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    },

    getTypeLabel(type) {
      const labels = {
        products: 'Produtos',
        nf_entry: 'NF-e',
        txt_upload: 'Upload TXT',
      }
      return labels[type] || type
    },

    getTypeIcon(type) {
      const icons = {
        products: 'fas fa-boxes',
        nf_entry: 'fas fa-file-invoice',
        txt_upload: 'fas fa-upload',
      }
      return icons[type] || 'fas fa-cog'
    },

    truncateMessage(message) {
      if (!message) return '-'
      return message.length > 50 ? message.substring(0, 50) + '...' : message
    },

    showLogDetails(log) {
      this.selectedLog = log
      this.showDetailsModal = true
    },

    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedLog = null
    },

    formatResponse(log) {
      // Prioridade: error_details (JSON) > message (texto)
      if (log.error_details) {
        try {
          const parsed = JSON.parse(log.error_details)
          return JSON.stringify(parsed, null, 2)
        } catch {
          return log.error_details
        }
      }
      return log.message || 'Nenhuma resposta registrada'
    },

    formatErrorDetails(errorDetails) {
      if (!errorDetails) return 'Nenhum detalhe disponível'

      try {
        const parsed = JSON.parse(errorDetails)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return errorDetails
      }
    },

    getUploadDetails(log) {
      if (log.integration_type !== 'txt_upload' || !log.error_details)
        return null

      try {
        // Os detalhes do upload são armazenados no campo error_details como JSON
        const details = JSON.parse(log.error_details)
        return {
          filename: details.filename || null,
          upload_method: details.upload_method || null,
          schedule_count: details.schedule_count || null,
          schedule_ids: details.schedule_ids || null,
          host: details.host || null,
          error_code: details.error_code || null,
          error: details.error || null,
        }
      } catch {
        return null
      }
    },
  },
}
</script>

<style scoped>
.corpem-logs-page {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c5282;
  font-size: 28px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-description {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.filters-container {
  display: flex;
  gap: 20px;
  align-items: end;
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.filter-group.full-width {
  width: 100%;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.type-filter-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.filter-badge i {
  font-size: 14px;
}

.filter-badge.all {
  border-color: #9ca3af;
  color: #6b7280;
}

.filter-badge.all.active {
  background: #6b7280;
  border-color: #6b7280;
  color: white;
}

.filter-badge.products {
  border-color: #93c5fd;
  color: #1d4ed8;
}

.filter-badge.products.active {
  background: #dbeafe;
  border-color: #1d4ed8;
}

.filter-badge.nf_entry {
  border-color: #c4b5fd;
  color: #7c3aed;
}

.filter-badge.nf_entry.active {
  background: #f3e8ff;
  border-color: #7c3aed;
}

.filter-badge.txt_upload {
  border-color: #86efac;
  color: #059669;
}

.filter-badge.txt_upload.active {
  background: #ecfdf5;
  border-color: #059669;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.clear-filters-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  height: fit-content;
}

.clear-filters-btn:hover {
  background: #dc2626;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.error-message {
  text-align: center;
  color: #dc2626;
  background: #fef2f2;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.retry-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.logs-table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.pagination-info {
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  color: #666;
}

.table-wrapper {
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 750px;
}

.logs-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  white-space: nowrap;
}

.logs-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  vertical-align: middle;
}

.log-row:hover {
  background: #f9fafb;
}

.log-id {
  font-weight: 600;
  color: #374151;
}

.log-date {
  font-family: 'Courier New', monospace;
  color: #6b7280;
  min-width: 80px;
  text-align: center;
}

.date-time-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.date-line {
  font-weight: 600;
  font-size: 13px;
  color: #374151;
}

.time-line {
  font-size: 12px;
  color: #6b7280;
}

.log-schedule {
  min-width: 120px;
}

.schedule-id {
  font-weight: 600;
  color: #1f2937;
  display: block;
}

.schedule-date {
  font-size: 11px;
  color: #6b7280;
}

.nf-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #059669;
}

.nfe-key {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #6b7280;
  cursor: help;
}

.type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  cursor: help;
}

.type-icon.products {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-icon.nf_entry {
  background: #f3e8ff;
  color: #7c3aed;
}

.type-icon.txt_upload {
  background: #ecfdf5;
  color: #059669;
}

.client-name {
  font-weight: 500;
  color: #1f2937;
}

.client-cnpj {
  font-family: 'Courier New', monospace;
  color: #6b7280;
  font-size: 12px;
}

.response-container {
  max-width: 500px;
  min-width: 250px;
}

.response-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #374151;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.response-text.response-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.status-badge.error {
  background: #fef2f2;
  color: #dc2626;
}

.message-container {
  max-width: 200px;
}

.message-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-data-cell {
  color: #9ca3af;
  font-style: italic;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 40px 20px;
}

.action-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.action-btn.icon-only {
  padding: 8px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  justify-content: center;
}

.action-btn.icon-only i {
  font-size: 14px;
}

.action-btn:hover {
  background: #2563eb;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.pagination-btn {
  background: white;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  background: white;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  min-width: 36px;
  text-align: center;
}

.page-btn:hover {
  background: #f3f4f6;
}

.page-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-info {
  font-size: 13px;
  color: #6b7280;
  margin-left: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2vh 20px;
}

/* Classes específicas para forçar altura correta do modal */
.modal-overlay-fixed {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px !important;
}

.modal-container {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  height: 90vh !important;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-container-fixed {
  background: white !important;
  border-radius: 8px !important;
  max-width: 800px !important;
  width: 100% !important;
  height: calc(100vh - 40px) !important;
  max-height: calc(100vh - 40px) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
}

.modal-header-fixed {
  padding: 20px 24px !important;
  border-bottom: 1px solid #e5e7eb !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  background: #f8fafc !important;
  flex-shrink: 0 !important;
  height: auto !important;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.close-btn:hover {
  color: #374151;
}

.modal-content {
  overflow-y: auto;
  flex: 1 1 0%;
  min-height: 0;
  background: #fafbfc;
}

.modal-content-scrollable {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
  background: #fafbfc !important;
  height: 100% !important;
}

.log-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
  height: auto;
}

.detail-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.section-title i {
  color: #3b82f6;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.detail-group:last-child {
  margin-bottom: 0;
}

.detail-group.full-width {
  margin-top: 16px;
}

.detail-group label {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.detail-group span,
.detail-group div {
  color: #1f2937;
  font-size: 14px;
}

.highlight {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.nfe-key-full {
  font-family: 'Courier New', monospace;
  word-break: break-all;
  font-size: 12px;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
}

.status-detail.success {
  background: #dcfce7;
  color: #166534;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-detail.error {
  background: #fef2f2;
  color: #dc2626;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.message-full {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.response-full pre {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
  color: #374151;
  max-height: 400px;
  overflow-y: auto;
}

.error-details pre {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
  color: #991b1b;
}

.upload-method {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.upload-method.ftp {
  background: #dcfce7;
  color: #166534;
}

.upload-method.local {
  background: #fef3c7;
  color: #92400e;
}

@media (orientation: portrait) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: auto;
  }

  .pagination-container {
    gap: 4px;
  }

  .page-info {
    margin-left: 0;
    margin-top: 8px;
    text-align: center;
    width: 100%;
  }

  .log-details {
    grid-template-columns: 1fr;
  }
}
</style>
