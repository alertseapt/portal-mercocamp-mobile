<template>
  <div class="api-page">
    <div class="page-header">
      <h1><i class="fas fa-code"></i> API – Logs de requisições</h1>
      <p class="page-description">
        Consulta os registros de requisições e respostas da API externa de
        agendamentos (apenas erros).
      </p>
    </div>

    <!-- Filtros -->
    <div class="filters-container">
      <div class="filter-group">
        <label for="api-storage">CNPJ (storage)</label>
        <input
          id="api-storage"
          v-model="filters.storage"
          type="text"
          placeholder="14 dígitos (opcional)"
          maxlength="18"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <label for="api-date-from">Data de</label>
        <input
          id="api-date-from"
          v-model="filters.date_from"
          type="date"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <label for="api-date-to">Data até</label>
        <input
          id="api-date-to"
          v-model="filters.date_to"
          type="date"
          class="filter-input"
        />
      </div>
      <div class="filter-actions">
        <button
          type="button"
          class="btn-buscar"
          :disabled="loading"
          @click="buscar"
        >
          <i class="fas fa-search"></i> Buscar
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loader-spinner"></div>
      <p>Carregando...</p>
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button type="button" class="btn-retry" @click="buscar">
        <i class="fas fa-redo"></i> Tentar novamente
      </button>
    </div>

    <!-- Tabela -->
    <div v-else class="table-wrapper">
      <div
        v-if="resultCount >= 0"
        class="pagination-info pagination-info-with-export"
      >
        <span>{{ resultCount }} registro(s) encontrado(s)</span>
        <button
          type="button"
          class="btn-export"
          :disabled="data.length === 0"
          @click="exportToExcel"
          title="Exportar para Excel"
        >
          <i class="fas fa-file-excel"></i> Exportar
        </button>
      </div>
      <table class="api-logs-table">
        <thead>
          <tr>
            <th style="width: 40%">Requisição</th>
            <th style="width: 40%">Resposta</th>
            <th class="cell-date" style="width: 20%">Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.length === 0">
            <td colspan="3" class="no-data">
              <i class="fas fa-inbox"></i> Nenhum registro encontrado. Use os
              filtros e clique em Buscar.
            </td>
          </tr>
          <tr v-for="(row, idx) in data" :key="idx" class="api-row">
            <td
              class="cell-json cell-request"
              :title="getRequestPreview(row)"
              @click="openModal('request', row)"
            >
              <span class="cell-text">{{ getRequestPreview(row) }}</span>
            </td>
            <td
              class="cell-json cell-response"
              :title="getResponsePreview(row)"
              @click="openModal('response', row)"
            >
              <span class="cell-text">{{ getResponsePreview(row) }}</span>
            </td>
            <td class="cell-date">{{ formatDateTime(row.datetime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal JSON -->
    <div v-if="showJsonModal" class="modal-overlay" @click="closeModal">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button
            type="button"
            class="modal-close"
            @click="closeModal"
            aria-label="Fechar"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="json-view" v-html="formattedJsonHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ExcelJS from 'exceljs'

export default {
  name: 'ApiPage',
  data() {
    return {
      filters: {
        storage: '',
        date_from: '',
        date_to: '',
      },
      loading: false,
      error: null,
      data: [],
      resultCount: -1,
      showJsonModal: false,
      modalTitle: '',
      modalPayload: null,
      modalType: null, // 'request' | 'response'
    }
  },
  computed: {
    formattedJsonHtml() {
      if (!this.modalPayload) return ''
      return this.formatJsonToHtml(this.modalPayload)
    },
  },
  mounted() {
    this.fillStorageFromCliAccess()
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    this.filters.date_from = `${yyyy}-${mm}-${dd}`
    this.filters.date_to = `${yyyy}-${mm}-${dd}`
  },
  methods: {
    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        if (user.cli_access && typeof user.cli_access === 'string') {
          const trimmed = user.cli_access.trim()
          if (
            trimmed &&
            trimmed !== '{}' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined'
          ) {
            try {
              user.cli_access = JSON.parse(trimmed)
            } catch (e) {
              // ignora
            }
          }
        }
        return user
      } catch (e) {
        return null
      }
    },
    fillStorageFromCliAccess() {
      const user = this.getCurrentUser()
      if (!user || !user.cli_access || typeof user.cli_access !== 'object')
        return
      const keys = Object.keys(user.cli_access)
      if (keys.length !== 1) return
      const cnpj = keys[0]
      const digits = (cnpj || '').replace(/\D/g, '')
      if (digits.length === 14) this.filters.storage = digits
    },
    async buscar() {
      this.loading = true
      this.error = null
      const apiClient = window.apiClient
      if (!apiClient) {
        this.loading = false
        this.error = 'Cliente de API não disponível.'
        return
      }
      try {
        const body = {}
        const storage = (this.filters.storage || '').replace(/\D/g, '')
        if (storage.length === 14) body.storage = storage
        if (this.filters.date_from) body.date_from = this.filters.date_from
        if (this.filters.date_to) body.date_to = this.filters.date_to

        const res = await apiClient.request('/schedule-api-returns/search', {
          method: 'POST',
          data: body,
        })
        if (res && res.success && Array.isArray(res.data)) {
          this.data = res.data
          this.resultCount = res.count ?? res.data.length
        } else {
          this.data = []
          this.resultCount = 0
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Erro ao buscar registros.'
        this.error = msg
        this.data = []
        this.resultCount = -1
      } finally {
        this.loading = false
      }
    },
    getRequestPreview(row) {
      const rr = row.req_res
      if (!rr || typeof rr !== 'object') return '-'
      const req = rr.request
      if (!req) return '-'
      const str = typeof req === 'string' ? req : JSON.stringify(req)
      return str.length > 120 ? str.slice(0, 120) + '...' : str
    },
    getResponsePreview(row) {
      const rr = row.req_res
      if (!rr || typeof rr !== 'object') return '-'
      const res = rr.response
      if (!res) return '-'
      const str = typeof res === 'string' ? res : JSON.stringify(res)
      return str.length > 120 ? str.slice(0, 120) + '...' : str
    },
    formatDateTime(dt) {
      if (!dt) return '-'
      const d = new Date(dt)
      if (isNaN(d.getTime())) return String(dt)
      const pad = n => String(n).padStart(2, '0')
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
    getRequestFull(row) {
      const rr = row.req_res
      if (!rr || typeof rr !== 'object') return '-'
      const req = rr.request
      if (!req) return '-'
      return typeof req === 'string' ? req : JSON.stringify(req, null, 2)
    },
    getResponseFull(row) {
      const rr = row.req_res
      if (!rr || typeof rr !== 'object') return '-'
      const res = rr.response
      if (!res) return '-'
      return typeof res === 'string' ? res : JSON.stringify(res, null, 2)
    },
    async exportToExcel() {
      if (!this.data || this.data.length === 0) {
        alert(
          'Não há registros para exportar. Use os filtros e clique em Buscar.'
        )
        return
      }
      const numCols = 3
      const tableHeaders = ['Requisição', 'Resposta', 'Data']
      const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
      const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }
      const lightBlueFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' },
      }

      let userEmail = 'E-mail não identificado'
      const user = this.getCurrentUser()
      if (user) {
        userEmail = user.user || user.username || user.name || userEmail
        if (user.config) {
          try {
            const config =
              typeof user.config === 'string'
                ? JSON.parse(user.config)
                : user.config
            if (config?.emailSettings?.primaryEmail)
              userEmail = config.emailSettings.primaryEmail
          } catch (e) {}
        }
      }

      const now = new Date()
      const dataHoraCriacao = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      const formatDateForExport = dateStr => {
        if (!dateStr) return ''
        const d = new Date(dateStr + 'T12:00:00')
        if (isNaN(d.getTime())) return dateStr
        const pad = n => String(n).padStart(2, '0')
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
      }
      const filtrosAplicados = [
        `CNPJ (storage): ${this.filters.storage || 'Todos'}`,
        `Data de: ${this.filters.date_from ? formatDateForExport(this.filters.date_from) : 'Início'}`,
        `Data até: ${this.filters.date_to ? formatDateForExport(this.filters.date_to) : 'Sempre'}`,
      ]

      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Portal Mercocamp'
      workbook.created = now
      const worksheet = workbook.addWorksheet('Logs API', {
        properties: { defaultRowHeight: 18 },
      })

      // Título
      worksheet.mergeCells(1, 1, 1, numCols)
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'RELATÓRIO DE LOGS DA API (REQUISIÇÕES COM ERRO)'
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D47A1' },
      }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      titleCell.border = {
        top: mediumBorder,
        left: mediumBorder,
        right: mediumBorder,
      }
      worksheet.getRow(1).height = 28

      // Subtítulo
      worksheet.mergeCells(2, 1, 2, numCols)
      const subtitleCell = worksheet.getCell('A2')
      subtitleCell.value = 'Portal de Agendamento - API externa de agendamentos'
      subtitleCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
      subtitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      subtitleCell.border = {
        left: mediumBorder,
        right: mediumBorder,
        bottom: thinBorder,
      }
      worksheet.getRow(2).height = 22

      worksheet.getRow(3).height = 10

      // Filtros (uma linha mesclada com as 3 colunas)
      worksheet.mergeCells(4, 1, 4, numCols)
      const filtrosCell = worksheet.getCell('A4')
      filtrosCell.value = 'Filtros: ' + filtrosAplicados.join(' | ')
      filtrosCell.font = { bold: true, size: 10 }
      filtrosCell.fill = lightBlueFill
      filtrosCell.border = {
        left: thinBorder,
        top: thinBorder,
        right: thinBorder,
        bottom: thinBorder,
      }

      worksheet.getRow(5).height = 10

      // Cabeçalhos da tabela
      const headerRow = worksheet.getRow(6)
      tableHeaders.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' },
        }
        cell.alignment = {
          horizontal: index === 2 ? 'center' : 'left',
          vertical: 'middle',
        }
        cell.border = {
          top: mediumBorder,
          bottom: mediumBorder,
          left: thinBorder,
          right: thinBorder,
        }
      })
      headerRow.height = 22

      // Dados
      let currentRow = 7
      this.data.forEach((row, rowIndex) => {
        const excelRow = worksheet.getRow(currentRow)
        const isFirstRow = rowIndex === 0
        const isLastRow = rowIndex === this.data.length - 1
        const values = [
          this.getRequestFull(row),
          this.getResponseFull(row),
          this.formatDateTime(row.datetime),
        ]
        values.forEach((value, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1)
          cell.value = value
          cell.font = { size: 10 }
          cell.alignment = {
            horizontal: colIndex === 2 ? 'center' : 'left',
            vertical: 'middle',
            wrapText: true,
          }
          cell.border = {
            top: isFirstRow
              ? { style: 'hair', color: { argb: 'FFE0E0E0' } }
              : undefined,
            left:
              colIndex === 0
                ? thinBorder
                : { style: 'hair', color: { argb: 'FFE0E0E0' } },
            right:
              colIndex === numCols - 1
                ? thinBorder
                : { style: 'hair', color: { argb: 'FFE0E0E0' } },
            bottom: isLastRow
              ? mediumBorder
              : { style: 'hair', color: { argb: 'FFE0E0E0' } },
          }
        })
        excelRow.height = Math.min(
          120,
          Math.max(18, Math.ceil(String(values[0]).length / 100) * 12)
        )
        currentRow++
      })

      currentRow++
      worksheet.mergeCells(currentRow, 1, currentRow, numCols)
      const footerCell = worksheet.getCell(currentRow, 1)
      footerCell.value = `Arquivo gerado pelo usuário ${userEmail} no dia ${dataHoraCriacao} pelo Portal de Agendamento do Grupo Mercocamp`
      footerCell.font = { italic: true, size: 9, color: { argb: 'FF757575' } }
      footerCell.alignment = { horizontal: 'center', vertical: 'middle' }
      footerCell.border = {
        top: thinBorder,
        left: thinBorder,
        right: thinBorder,
        bottom: thinBorder,
      }

      worksheet.columns = [{ width: 50 }, { width: 50 }, { width: 18 }]

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-api-${now.toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    },
    openModal(type, row) {
      const rr = row.req_res
      if (!rr || typeof rr !== 'object') return
      if (type === 'request') {
        this.modalTitle = 'Requisição'
        this.modalPayload = rr.request
      } else {
        this.modalTitle = 'Resposta'
        this.modalPayload = rr.response
      }
      this.modalType = type
      this.showJsonModal = true
    },
    closeModal() {
      this.showJsonModal = false
      this.modalTitle = ''
      this.modalPayload = null
      this.modalType = null
    },
    /**
     * Gera HTML para exibir objeto JSON com chaves em vermelho e negrito,
     * valores na cor contrária ao fundo (texto escuro em fundo claro).
     */
    formatJsonToHtml(obj) {
      if (obj === null) return '<span class="json-null">null</span>'
      if (obj === undefined)
        return '<span class="json-undefined">undefined</span>'
      if (typeof obj !== 'object') {
        const esc = this.escapeHtml(String(obj))
        return '<span class="json-value">' + esc + '</span>'
      }
      if (Array.isArray(obj)) {
        const parts = obj.map((item, i) => {
          const val = this.formatJsonToHtml(item)
          return '<div class="json-array-item">' + val + '</div>'
        })
        return '<div class="json-array">[' + parts.join('') + ']</div>'
      }
      const entries = Object.entries(obj)
      const parts = entries.map(([k, v]) => {
        const keyEsc = this.escapeHtml(k)
        const valHtml = this.formatJsonToHtml(v)
        return (
          '<div class="json-pair"><span class="json-key">' +
          keyEsc +
          '</span>: ' +
          valHtml +
          '</div>'
        )
      })
      return '<div class="json-object">' + parts.join('') + '</div>'
    },
    escapeHtml(s) {
      const div = document.createElement('div')
      div.textContent = s
      return div.innerHTML
    },
  },
}
</script>

<style scoped>
.api-page {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  color: #2c5282;
  font-size: 24px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-description {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.filters-container {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  min-width: 160px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  align-items: center;
}

.btn-buscar {
  padding: 8px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-buscar:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-buscar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container p {
  margin-bottom: 12px;
  color: #b91c1c;
}

.btn-retry {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.pagination-info {
  padding: 10px 16px;
  background: #f9fafb;
  font-size: 13px;
  color: #6b7280;
}

.pagination-info-with-export {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-export {
  padding: 8px 16px;
  background: #1d6f42;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-export:hover:not(:disabled) {
  background: #165c34;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.api-logs-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.api-logs-table th {
  text-align: left;
  padding: 12px 14px;
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.api-logs-table th:last-child {
  border-right: none;
}

.api-logs-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  font-size: 13px;
  vertical-align: top;
}

.api-logs-table td:last-child {
  border-right: none;
}

.api-row:hover {
  background: #f9fafb;
}

.cell-json {
  cursor: pointer;
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-json:hover {
  background: #eff6ff;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-logs-table th.cell-date,
.cell-date {
  text-align: center;
  white-space: nowrap;
  color: #6b7280;
}

.no-data {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}

.no-data i {
  margin-right: 8px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
}

.modal-close:hover {
  color: #111827;
}

.modal-body {
  padding: 16px 18px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

/* JSON formatado: chaves em vermelho e negrito, valores cor contrária ao fundo */
.json-view {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #1f2937;
}

.json-key {
  color: #b91c1c;
  font-weight: 700;
  margin-right: 6px;
}

.json-value {
  color: #1f2937;
  font-weight: normal;
}

.json-null {
  color: #6b7280;
  font-style: italic;
}

.json-undefined {
  color: #9ca3af;
  font-style: italic;
}

.json-object,
.json-array {
  margin-left: 12px;
}

.json-pair {
  margin: 4px 0;
}

.json-array-item {
  margin: 2px 0;
  margin-left: 12px;
}
</style>
