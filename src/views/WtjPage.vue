<template>
  <div class="wtj-page">
    <div class="page-header">
      <h1><i class="fas fa-file-csv"></i> WJT – Sincronização por CSV</h1>
      <p class="page-description">
        Importe o CSV com colunas No. N.F., Vl. Total (R$) e Sit. D.P. Defina o
        estoque e o mapeamento de situações para status. O valor total é sempre
        validado antes de alterar qualquer agendamento.
      </p>
    </div>

    <div class="wtj-config">
      <div class="config-section">
        <label class="section-label">Estoque (CNPJ)</label>
        <div class="estoque-row">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showEstoqueModal = true"
          >
            <i class="fas fa-warehouse"></i> Selecionar Estoque
          </button>
          <span v-if="selectedEstoque" class="estoque-selected">
            {{ selectedEstoque.name }} — {{ formatCnpj(selectedEstoque.cnpj) }}
          </span>
          <span v-else class="estoque-placeholder"
            >Nenhum estoque selecionado</span
          >
          <button
            v-if="selectedEstoque"
            type="button"
            class="btn btn-link"
            @click="selectedEstoque = null"
          >
            Limpar
          </button>
        </div>
        <p v-if="!selectedEstoque" class="estoque-hint">
          Sem estoque selecionado: serão considerados <strong>todos</strong> os
          agendamentos com status ativo. O CSV deve conter a coluna
          <strong>Cli.</strong> com o código CorpEM do estoque; o sistema
          compara esse valor ao <strong>corpem_code</strong> do cliente do
          agendamento.
        </p>
      </div>

      <div class="config-section">
        <label class="section-label">Arquivo CSV</label>
        <div class="csv-row">
          <input
            ref="csvInput"
            type="file"
            accept=".csv"
            class="csv-input"
            @change="onCsvSelect"
          />
          <span v-if="csvFile" class="csv-name">{{ csvFile.name }}</span>
          <span v-else class="csv-placeholder">Nenhum arquivo selecionado</span>
          <button
            type="button"
            class="btn btn-outline"
            @click="triggerCsvInput"
          >
            <i class="fas fa-upload"></i> Importar CSV
          </button>
        </div>
      </div>

      <div class="config-section mappings">
        <label class="section-label">Mapeamento Sit. D.P. → Status</label>
        <p class="mapping-hint">
          Quando o valor da coluna Sit. D.P. for igual ao título, o agendamento
          terá o status alterado para a opção escolhida (ou será ignorado).
        </p>
        <div class="mapping-row">
          <span class="mapping-title">Em digitação</span>
          <select v-model="mappingEmDigitacao" class="mapping-select">
            <option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="mapping-row">
          <span class="mapping-title">A paletizar</span>
          <select v-model="mappingAPaletizar" class="mapping-select">
            <option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="mapping-row">
          <span class="mapping-title">Fechado</span>
          <select v-model="mappingFechado" class="mapping-select">
            <option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="actions-row">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!canExecute || running"
          @click="execute"
        >
          <i class="fas fa-play" :class="{ 'fa-spin': running }"></i>
          {{ running ? 'Processando...' : 'Executar' }}
        </button>
      </div>
    </div>

    <div v-if="running" class="progress-section">
      <p class="progress-label">Verificando agendamentos...</p>
      <div class="progress-bar-wrap">
        <div
          class="progress-bar-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <p class="progress-percent">{{ progressPercent }}%</p>
    </div>

    <div v-if="result" class="result-section">
      <h3>Resultado</h3>
      <p>
        <strong>Processados:</strong> {{ result.totalProcessed }} —
        <strong>Status alterados:</strong> {{ result.alteredCount }}
      </p>
      <button
        v-if="result.excelBase64"
        type="button"
        class="btn btn-download"
        @click="downloadExcel"
      >
        <i class="fas fa-file-excel"></i> Baixar Excel (agendamentos alterados)
      </button>
      <details v-if="result.logs && result.logs.length" class="logs-details">
        <summary>Log por NF ({{ result.logs.length }} itens)</summary>
        <ul class="logs-list">
          <li v-for="(log, idx) in result.logs" :key="idx">
            NF {{ log.nf }}: {{ log.result }}
          </li>
        </ul>
      </details>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Modal Selecionar Estoque -->
    <div
      v-if="showEstoqueModal"
      class="modal-overlay"
      @click.self="showEstoqueModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>Selecionar Estoque</h3>
          <button
            type="button"
            class="modal-close"
            @click="showEstoqueModal = false"
            aria-label="Fechar"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p v-if="clientsLoading" class="loading-inline">
            Carregando clientes...
          </p>
          <p v-else-if="clientsError" class="error-inline">
            {{ clientsError }}
          </p>
          <ul v-else class="clients-list">
            <li
              v-for="c in clientsList"
              :key="c.cnpj"
              class="client-item"
              @click="selectEstoque(c)"
            >
              <span class="client-name">{{ c.name }}</span>
              <span class="client-cnpj">{{ formatCnpj(c.cnpj) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WtjPage',
  data() {
    return {
      showEstoqueModal: false,
      selectedEstoque: null,
      csvFile: null,
      mappingEmDigitacao: 'IGNORAR',
      mappingAPaletizar: 'IGNORAR',
      mappingFechado: 'Em estoque',
      statusOptions: [
        { value: 'IGNORAR', label: 'Ignorar' },
        { value: 'Solicitado', label: 'Solicitado' },
        { value: 'Contestado', label: 'Contestado' },
        { value: 'Agendado', label: 'Agendado' },
        { value: 'Conferência', label: 'Em conferência' },
        { value: 'Tratativa', label: 'Tratativa' },
        { value: 'Em estoque', label: 'Em estoque' },
        { value: 'Em Estoque', label: 'Em Estoque' },
        { value: 'Cancelar', label: 'Cancelar' },
        { value: 'Cancelado', label: 'Cancelado' },
        { value: 'Recusado', label: 'Recusado' },
        { value: 'Marcação', label: 'Marcação' },
      ],
      clientsList: [],
      clientsLoading: false,
      clientsError: null,
      running: false,
      progressPercent: 0,
      result: null,
      error: null,
    }
  },
  computed: {
    canExecute() {
      return !!this.csvFile
    },
  },
  methods: {
    formatCnpj(cnpj) {
      if (!cnpj) return ''
      const n = String(cnpj).replace(/\D/g, '')
      if (n.length !== 14) return cnpj
      return n.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },
    triggerCsvInput() {
      this.$refs.csvInput?.click()
    },
    onCsvSelect(e) {
      const f = e.target?.files?.[0]
      this.csvFile = f || null
      this.error = null
      this.result = null
    },
    async loadClients() {
      this.clientsLoading = true
      this.clientsError = null
      try {
        const api = window.apiClient
        if (!api) throw new Error('API não disponível')
        const token = localStorage.getItem('token')
        const res = await api.request('/clients', {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        this.clientsList = Array.isArray(res)
          ? res
          : res?.data || res?.clients || []
      } catch (err) {
        this.clientsError =
          err?.response?.data?.error ||
          err?.message ||
          'Erro ao carregar clientes'
      } finally {
        this.clientsLoading = false
      }
    },
    selectEstoque(client) {
      this.selectedEstoque = {
        cnpj: String(client.cnpj || client.CNPJ || '').replace(/\D/g, ''),
        name: (client.name || client.nome || '').trim() || 'Sem nome',
      }
      this.showEstoqueModal = false
    },
    async execute() {
      if (!this.canExecute || this.running) return
      this.running = true
      this.progressPercent = 0
      this.error = null
      this.result = null
      try {
        const api = window.apiClient
        if (!api) throw new Error('API não disponível')
        const token = localStorage.getItem('token')
        const form = new FormData()
        form.append('csv', this.csvFile)
        form.append(
          'clientCnpj',
          this.selectedEstoque ? this.selectedEstoque.cnpj : ''
        )
        form.append('mappingEmDigitacao', this.mappingEmDigitacao)
        form.append('mappingAPaletizar', this.mappingAPaletizar)
        form.append('mappingFechado', this.mappingFechado)
        const baseURL =
          (api && (api.defaults?.baseURL || api.baseURL)) ||
          window.API_URL ||
          '/api'
        const url =
          String(baseURL).replace(/\/$/, '') + '/wjt/sync-from-csv?stream=1'
        const res = await fetch(url, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Erro ${res.status}`)
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)
              if (data.type === 'progress')
                this.progressPercent = data.percent != null ? data.percent : 0
              if (data.type === 'done') this.result = data
            } catch (_) {}
          }
        }
        if (buf.trim()) {
          try {
            const data = JSON.parse(buf)
            if (data.type === 'done') this.result = data
          } catch (_) {}
        }
      } catch (err) {
        this.error =
          err?.response?.data?.error ||
          err?.message ||
          err?.toString() ||
          'Erro ao executar'
      } finally {
        this.running = false
      }
    },
    downloadExcel() {
      if (!this.result?.excelBase64) return
      const bin = atob(this.result.excelBase64)
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      const blob = new Blob([arr], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `WJT-Status-alterados-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
    },
  },
  watch: {
    showEstoqueModal(visible) {
      if (visible) this.loadClients()
    },
  },
}
</script>

<style scoped>
.wtj-page {
  padding: 1.5rem;
  width: 98%;
  max-width: 98%;
  margin: 0 auto;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.35rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-header h1 i {
  color: #3b82f6;
}

.page-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.wtj-config {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.config-section {
  margin-bottom: 1.25rem;
}

.config-section:last-of-type {
  margin-bottom: 0;
}

.section-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.estoque-row,
.csv-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-outline {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline:hover {
  background: #eff6ff;
}

.btn-link {
  background: none;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}

.btn-link:hover {
  color: #374151;
  text-decoration: underline;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.estoque-selected,
.csv-name {
  color: #059669;
  font-size: 0.9rem;
}

.estoque-placeholder,
.csv-placeholder {
  color: #9ca3af;
  font-size: 0.9rem;
}

.estoque-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.csv-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.mappings .mapping-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.mapping-title {
  min-width: 120px;
  font-weight: 500;
  color: #374151;
}

.mapping-select {
  flex: 1;
  max-width: 280px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
}

.actions-row {
  margin-top: 1.25rem;
}

.progress-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.progress-label {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #374151;
}

.progress-bar-wrap {
  height: 10px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 6px;
  transition: width 0.2s ease;
}

.progress-percent {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #3b82f6;
}

.result-section {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.result-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.result-section p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.btn-download {
  margin-top: 0.75rem;
  background: #059669;
  color: #fff;
}

.btn-download:hover {
  background: #047857;
}

.logs-details {
  margin-top: 0.75rem;
  font-size: 0.85rem;
}

.logs-list {
  max-height: 200px;
  overflow-y: auto;
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
}

.logs-list li {
  margin-bottom: 0.25rem;
}

.error-msg {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #6b7280;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.loading-inline,
.error-inline {
  margin: 0;
  font-size: 0.9rem;
}

.error-inline {
  color: #dc2626;
}

.clients-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.client-item {
  padding: 0.6rem 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.client-item:hover {
  background: #f9fafb;
}

.client-name {
  font-weight: 500;
  color: #1f2937;
}

.client-cnpj {
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
