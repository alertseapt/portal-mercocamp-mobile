<template>
  <div class="reagendamento-massa-page">
    <div class="page-header">
      <h1 class="page-title">Reagendamento em massa</h1>
      <p class="page-description">
        Envie um arquivo TXT com as chaves de acesso (uma por linha) dos
        agendamentos que terão o status alterado para "Solicitado" e a data
        alterada para a data escolhida. Agendamentos com status "Em estoque" são
        ignorados. Espaços e letras são removidos automaticamente de cada chave.
      </p>
    </div>

    <div class="form-card">
      <div class="form-row">
        <label class="form-label" for="txt-file"
          >Arquivo TXT (chaves de acesso)</label
        >
        <input
          id="txt-file"
          ref="fileInput"
          type="file"
          accept=".txt,text/plain"
          class="form-control form-control-file"
          @change="onFileSelect"
        />
        <span v-if="fileName" class="file-name">{{ fileName }}</span>
      </div>

      <div class="form-row">
        <label class="form-label" for="new-date"
          >Nova data do agendamento</label
        >
        <input
          id="new-date"
          v-model="newDate"
          type="date"
          class="form-control"
          :min="minDate"
          required
        />
        <span class="form-hint">A data deve ser posterior à data atual.</span>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="loading || !newDate || !keys.length"
          @click="submit"
        >
          <span v-if="loading">Processando...</span>
          <span v-else>Reagendar</span>
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          @click="clear"
        >
          Limpar
        </button>
      </div>
    </div>

    <div
      v-if="result"
      class="result-card"
      :class="result.success ? 'result-success' : 'result-error'"
    >
      <h2 class="result-title">
        {{ result.success ? 'Reagendamento concluído' : 'Erro' }}
      </h2>
      <p class="result-message">{{ result.message }}</p>
      <dl v-if="result.updated !== undefined" class="result-details">
        <template v-if="result.environment">
          <dt>Ambiente</dt>
          <dd>{{ result.environment }} ({{ result.database || '' }})</dd>
        </template>
        <dt>Atualizados</dt>
        <dd>{{ result.updated }}</dd>
        <template v-if="result.skipped > 0">
          <dt>Ignorados (status protegido)</dt>
          <dd>{{ result.skipped }}</dd>
        </template>
        <template
          v-if="
            result.skipped_keys &&
            result.skipped_keys.length
          "
        >
          <dt class="dt-full-width">Chaves ignoradas (Em estoque / Finalizado)</dt>
          <dd class="dd-full-width">
            <ul class="not-found-list">
              <li v-for="(k, i) in result.skipped_keys" :key="i">
                {{ k }}
              </li>
            </ul>
          </dd>
        </template>
        <template v-if="result.not_found > 0">
          <dt>Chaves não encontradas</dt>
          <dd>{{ result.not_found }}</dd>
        </template>
        <template v-if="result.not_found_keys && result.not_found_keys.length">
          <dt class="dt-full-width">Lista de chaves não encontradas</dt>
          <dd class="dd-full-width">
            <ul class="not-found-list">
              <li v-for="(k, i) in result.not_found_keys" :key="i">{{ k }}</li>
            </ul>
          </dd>
        </template>
        <template v-if="result.no_access > 0">
          <dt>Sem permissão (outro cliente)</dt>
          <dd>{{ result.no_access }}</dd>
        </template>
        <template v-if="result.invalid_keys > 0">
          <dt>Chaves inválidas (não 44 dígitos)</dt>
          <dd>{{ result.invalid_keys }}</dd>
        </template>
      </dl>
      <div v-if="result.errors && result.errors.length" class="result-errors">
        <strong>Erros:</strong>
        <ul>
          <li v-for="(e, i) in result.errors" :key="i">{{ e }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { BASE_URL } from '../config/api.js'
import axios from 'axios'

export default {
  name: 'ReagendamentoMassaPage',
  data() {
    return {
      fileName: '',
      keys: [],
      newDate: '',
      loading: false,
      result: null,
    }
  },
  computed: {
    minDate() {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    },
  },
  methods: {
    onFileSelect(event) {
      const file = event.target.files?.[0]
      this.result = null
      if (!file) {
        this.fileName = ''
        this.keys = []
        return
      }
      this.fileName = file.name
      const reader = new FileReader()
      reader.onload = e => {
        const text = (e.target?.result || '').toString()
        const lines = text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(Boolean)
        this.keys = lines
      }
      reader.readAsText(file, 'UTF-8')
    },
    clear() {
      this.fileName = ''
      this.keys = []
      this.newDate = ''
      this.result = null
      const input = this.$refs.fileInput
      if (input) input.value = ''
    },
    async submit() {
      if (!this.newDate || !this.keys.length) {
        this.$emit(
          'notification',
          'Selecione o arquivo TXT e a nova data.',
          'error'
        )
        return
      }
      const today = new Date().toISOString().slice(0, 10)
      if (this.newDate <= today) {
        this.$emit(
          'notification',
          'A data do reagendamento deve ser posterior à data atual.',
          'error'
        )
        return
      }
      this.loading = true
      this.result = null
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.post(
          `${BASE_URL}/schedules/bulk-reschedule`,
          { keys: this.keys, date: this.newDate },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
          }
        )
        this.result = data
        this.$emit(
          'notification',
          data.message || 'Reagendamento em massa concluído.',
          'success'
        )
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.details ||
          err.message
        this.result = { success: false, message: msg }
        this.$emit('notification', msg, 'error')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.reagendamento-massa-page {
  padding: 1.5rem;
  max-width: 640px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--text-primary, #1a1a1a);
  text-align: center;
  width: 100%;
  display: block;
}

.page-description {
  font-size: 0.9rem;
  color: var(--text-secondary, #555);
  margin: 0;
  line-height: 1.4;
  text-align: left;
  width: 100%;
  display: block;
}

.form-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.form-row {
  margin-bottom: 1.25rem;
}

.form-row:last-of-type {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
  color: var(--text-primary, #1a1a1a);
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-control-file {
  padding: 0.35rem 0;
  cursor: pointer;
}

.file-name {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.form-hint {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-secondary, #666);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary, #2563eb);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #1d4ed8);
}

.btn-secondary {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #1a1a1a);
  border: 1px solid var(--border-color, #e5e7eb);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover, #e5e7eb);
}

.result-card {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid;
}

.result-success {
  background: #f0fdf4;
  border-color: #86efac;
}

.result-error {
  background: #fef2f2;
  border-color: #fecaca;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.result-message {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.result-details {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
  font-size: 0.9rem;
}

.result-details dt {
  font-weight: 500;
  color: var(--text-secondary, #555);
}

.result-details dd {
  margin: 0;
}

.result-details .dt-full-width {
  grid-column: 1 / -1;
  margin-top: 0.5rem;
}

.result-details .dd-full-width {
  grid-column: 1 / -1;
  margin: 0 0 0 0;
}

.not-found-list {
  margin: 0.25rem 0 0 0;
  padding-left: 1.25rem;
  max-height: 12rem;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.8rem;
  word-break: break-all;
}

.result-list,
.result-errors {
  margin-top: 0.75rem;
  font-size: 0.85rem;
}

.result-list ul,
.result-errors ul {
  margin: 0.25rem 0 0 1rem;
  padding: 0;
}
</style>
