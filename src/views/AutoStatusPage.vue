<template>
  <div class="auto-status-page">
    <div class="page-header">
      <h1>
        <i class="fas fa-sync-alt"></i> Auto Status – Modos de verificação WJT
      </h1>
      <p class="page-description">
        Administração dos modos de verificação de status pela tabela WJT (nf,
        id_cliente, dt_inclusao). Definição do modo padrão por estoque e status
        do serviço de alteração automática.
      </p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loader-spinner"></div>
      <p>Carregando...</p>
    </div>

    <template v-else>
      <!-- Modo padrão -->
      <section class="section modes-section">
        <h2><i class="fas fa-cog"></i> Modo padrão de alteração automática</h2>
        <p class="section-hint">
          A verificação é feita a cada
          <strong>{{ defaultModeInterval }} minutos</strong> em agendamentos que
          não possuam status <strong>Cancelado</strong>,
          <strong>Tratativa</strong> ou <strong>Em estoque</strong>. Cada
          estoque pode usar um modo diferente ou ter a verificação desativada
          (abaixo).
        </p>
        <div v-for="mode in modes" :key="mode.id" class="mode-card">
          <h3>{{ mode.name }}</h3>
          <p class="mode-desc">{{ mode.description }}</p>
          <div v-if="mode.rules && mode.rules.length" class="rules-list">
            <div v-for="(rule, idx) in mode.rules" :key="idx" class="rule-item">
              <span class="rule-field">{{ rule.label }}</span>
              <span class="rule-detail">{{ rule.detail }}</span>
            </div>
          </div>
          <p
            v-if="
              mode.intervalMinutes != null ||
              (mode.excludedStatuses && mode.excludedStatuses.length)
            "
            class="mode-meta"
          >
            <template v-if="mode.intervalMinutes != null"
              >Intervalo: {{ mode.intervalMinutes }} min</template
            >
            <template
              v-if="
                mode.intervalMinutes != null &&
                mode.excludedStatuses &&
                mode.excludedStatuses.length
              "
            >
              ·
            </template>
            <template
              v-if="mode.excludedStatuses && mode.excludedStatuses.length"
              >Status excluídos:
              {{ mode.excludedStatuses.join(', ') }}</template
            >
          </p>
        </div>
      </section>

      <!-- Estoques e modo atribuído (modal) -->
      <section class="section storages-section">
        <button
          type="button"
          class="btn-storages-modal"
          @click="showStoragesModal = true"
        >
          <i class="fas fa-warehouse"></i> Estoques e modo de verificação
        </button>
        <div
          v-if="showStoragesModal"
          class="modal-overlay"
          @click.self="showStoragesModal = false"
        >
          <div class="modal-storages">
            <div class="modal-header">
              <h3>
                <i class="fas fa-warehouse"></i> Estoques e modo de verificação
              </h3>
              <button
                type="button"
                class="modal-close"
                aria-label="Fechar"
                @click="showStoragesModal = false"
              >
                &times;
              </button>
            </div>
            <p class="section-hint">
              Altere o modo por estoque ou desative a verificação automática. A
              alteração é salva ao trocar a opção.
            </p>
            <div class="storages-search-wrap">
              <input
                v-model="storagesSearch"
                type="text"
                class="storages-search-input"
                placeholder="Buscar por nome do estoque"
              />
            </div>
            <div class="table-wrap modal-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Estoque (nome)</th>
                    <th>CNPJ</th>
                    <th>Código CorpEM</th>
                    <th>Storage</th>
                    <th>Modo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in filteredStorages" :key="s.cnpj">
                    <td>{{ s.name || '—' }}</td>
                    <td>{{ formatCnpj(s.cnpj) }}</td>
                    <td>{{ s.corpem_code || '—' }}</td>
                    <td>{{ s.storage || '—' }}</td>
                    <td>
                      <select
                        :value="s.modeId"
                        :disabled="savingCnpj === s.cnpj"
                        class="mode-select"
                        @change="onModeChange(s, $event)"
                      >
                        <option
                          v-for="opt in modeOptions"
                          :key="opt.id"
                          :value="opt.id"
                        >
                          {{ opt.name }}
                        </option>
                      </select>
                      <span v-if="savingCnpj === s.cnpj" class="saving-label"
                        ><i class="fas fa-spinner fa-spin"></i>
                        Salvando...</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="filteredStorages.length === 0" class="empty-msg">
              {{
                storagesSearch
                  ? 'Nenhum estoque encontrado com esse nome.'
                  : 'Nenhum estoque com storage/corpem_code encontrado.'
              }}
            </p>
            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                @click="showStoragesModal = false"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Status do serviço -->
      <section class="section service-section">
        <h2><i class="fas fa-server"></i> Status do serviço de verificação</h2>
        <div class="service-controls">
          <button
            type="button"
            class="btn-control btn-play"
            :disabled="service.isRunning"
            title="Iniciar serviço"
            @click="onPlay"
          >
            <i class="fas fa-play"></i> Play
          </button>
          <button
            type="button"
            class="btn-control btn-pause"
            :disabled="!service.isRunning"
            title="Pausar serviço"
            @click="onPause"
          >
            <i class="fas fa-pause"></i> Pause
          </button>
          <button
            type="button"
            class="btn-control btn-advance"
            :disabled="advanceLoading"
            title="Executar uma verificação agora"
            @click="onAdvance"
          >
            <i class="fas fa-forward"></i> Avançar
          </button>
        </div>
        <div class="service-status-bar">
          <span v-if="service.isRunning" class="status-badge running">
            <span class="status-badge-text">Em execução</span>
          </span>
          <span v-else class="status-badge stopped">
            <span class="status-badge-text">Parado</span>
          </span>
          <span class="env-badge">{{ service.environment || '—' }}</span>
          <span class="interval-badge"
            >Intervalo: {{ service.checkIntervalSeconds || 0 }}s</span
          >
        </div>
        <p v-if="service.lastCheckTime" class="service-meta">
          Última verificação: {{ formatDateTime(service.lastCheckTime) }}
          <template v-if="service.isRunning && service.nextCheckIn">
            · Próxima: {{ formatDateTime(service.nextCheckIn) }}</template
          >
          <template v-else-if="!service.isRunning">
            · Ao retomar, próxima em 5 min</template
          >
        </p>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Verificações totais</span>
            <span class="stat-value">{{
              service.stats?.totalChecks ?? 0
            }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Processados</span>
            <span class="stat-value">{{
              service.stats?.schedulesProcessed ?? 0
            }}</span>
          </div>
          <div class="stat-item success">
            <span class="stat-label">Status atualizados</span>
            <span class="stat-value">{{
              service.stats?.statusUpdated ?? 0
            }}</span>
          </div>
          <div class="stat-item warning">
            <span class="stat-label">Aguardando</span>
            <span class="stat-value">{{
              service.stats?.verificationsFailed ?? 0
            }}</span>
          </div>
          <div class="stat-item error" v-if="(service.stats?.errors ?? 0) > 0">
            <span class="stat-label">Erros</span>
            <span class="stat-value">{{ service.stats?.errors }}</span>
          </div>
        </div>
        <p class="service-hint">
          O serviço de verificação é iniciado automaticamente com o backend (a
          cada 5 min). Controle de ambiente e estatísticas é exibido nesta
          página.
        </p>
        <div
          v-if="service.lastRunUpdated && service.lastRunUpdated.length > 0"
          class="last-run-updated-box"
        >
          <h4>
            Agendamentos alterados na última rodada ({{
              service.lastRunUpdated.length
            }})
          </h4>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Número da nota</th>
                  <th>Chave de acesso</th>
                  <th>Estoque</th>
                  <th>Alterado de</th>
                  <th>Alterado para</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in service.lastRunUpdated" :key="idx">
                  <td>{{ item.number || '—' }}</td>
                  <td class="nfe-key-cell">{{ item.nfe_key || '—' }}</td>
                  <td>
                    {{ getStorageName(item.client) || item.client || '—' }}
                  </td>
                  <td>{{ item.previous_status || '—' }}</td>
                  <td>{{ item.new_status || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p
          v-else-if="
            service.lastRunUpdated &&
            service.lastRunUpdated.length === 0 &&
            (service.stats?.totalChecks ?? 0) > 0
          "
          class="empty-msg"
        >
          Nenhum agendamento alterado na última rodada.
        </p>
        <div
          v-if="service.notFoundInWJT && service.notFoundInWJT.length > 0"
          class="not-found-box"
        >
          <h4>
            Agendamentos não encontrados na WJT ({{
              service.notFoundInWJT.length
            }})
          </h4>
          <ul class="not-found-list">
            <li
              v-for="(item, idx) in service.notFoundInWJT.slice(0, 20)"
              :key="idx"
            >
              #{{ item.id }} NF {{ item.number }} —
              {{ item.clientName || item.client }} (CorpEM:
              {{ item.corpemCode }})
            </li>
          </ul>
          <p v-if="service.notFoundInWJT.length > 20" class="not-found-more">
            + {{ service.notFoundInWJT.length - 20 }} outros
          </p>
        </div>
      </section>
    </template>

    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
</template>

<script>
import { BASE_URL } from '../config/api.js'

export default {
  name: 'AutoStatusPage',
  data() {
    return {
      loading: true,
      error: null,
      modes: [],
      storages: [],
      savingCnpj: null,
      showStoragesModal: false,
      storagesSearch: '',
      advanceLoading: false,
      service: {
        isRunning: false,
        environment: null,
        checkIntervalSeconds: null,
        lastCheckTime: null,
        nextCheckIn: null,
        stats: {},
        notFoundInWJT: [],
        lastRunUpdated: [],
      },
    }
  },
  computed: {
    defaultModeInterval() {
      const m = this.modes.find(x => x.id === 'wjt_triangulation')
      return m ? m.intervalMinutes : 5
    },
    modeOptions() {
      return (this.modes || []).map(m => ({ id: m.id, name: m.name }))
    },
    filteredStorages() {
      const q = (this.storagesSearch || '').trim().toLowerCase()
      if (!q) return this.storages || []
      return (this.storages || []).filter(s =>
        (s.name || '').toLowerCase().includes(q)
      )
    },
  },
  mounted() {
    this.loadAll()
  },
  methods: {
    getApi() {
      return window.apiClient || this.$http || null
    },
    async loadAll() {
      this.loading = true
      this.error = null
      try {
        await Promise.all([
          this.loadModes(),
          this.loadStorages(),
          this.loadService(),
        ])
      } catch (e) {
        this.error =
          e?.response?.data?.error || e?.message || 'Erro ao carregar dados.'
      } finally {
        this.loading = false
      }
    },
    async loadModes() {
      const api = this.getApi()
      const base =
        (api && (api.defaults?.baseURL || api.baseURL)) || BASE_URL || '/api'
      const url = `${String(base).replace(/\/$/, '')}/auto-status/modes`
      const token = localStorage.getItem('token')
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      this.modes = data.modes || []
    },
    async loadStorages() {
      const api = this.getApi()
      const base =
        (api && (api.defaults?.baseURL || api.baseURL)) || BASE_URL || '/api'
      const url = `${String(base).replace(/\/$/, '')}/auto-status/storages`
      const token = localStorage.getItem('token')
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      this.storages = data.storages || []
    },
    async loadService() {
      const api = this.getApi()
      const base =
        (api && (api.defaults?.baseURL || api.baseURL)) || BASE_URL || '/api'
      const url = `${String(base).replace(/\/$/, '')}/auto-status/service`
      const token = localStorage.getItem('token')
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      this.service = {
        isRunning: data.isRunning,
        environment: data.environment,
        checkIntervalSeconds: data.checkIntervalSeconds,
        lastCheckTime: data.lastCheckTime,
        nextCheckIn: data.nextCheckIn,
        stats: data.stats || {},
        notFoundInWJT: data.notFoundInWJT || [],
        lastRunUpdated: data.lastRunUpdated || [],
      }
    },
    getModeName(modeId) {
      const m = this.modes.find(x => x.id === modeId)
      return m ? m.name : modeId || '—'
    },
    async onModeChange(storage, event) {
      const modeId = event.target?.value
      if (modeId == null || modeId === storage.modeId) return
      const cnpj = String(storage.cnpj || '').replace(/\D/g, '')
      if (cnpj.length !== 14) return
      this.savingCnpj = storage.cnpj
      const base =
        (this.getApi() &&
          (this.getApi().defaults?.baseURL || this.getApi().baseURL)) ||
        BASE_URL ||
        '/api'
      const url = `${String(base).replace(/\/$/, '')}/auto-status/storages/${cnpj}`
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ modeId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || res.statusText)
        }
        const idx = this.storages.findIndex(s => s.cnpj === storage.cnpj)
        if (idx !== -1) this.storages[idx] = { ...this.storages[idx], modeId }
      } catch (e) {
        this.error = e?.message || 'Erro ao salvar modo.'
        this.$nextTick(() => {
          const el = this.$el?.querySelector?.('.error-msg')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      } finally {
        this.savingCnpj = null
      }
    },
    formatCnpj(cnpj) {
      if (!cnpj) return ''
      const n = String(cnpj).replace(/\D/g, '')
      if (n.length !== 14) return cnpj
      return n.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
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
    getStorageName(cnpj) {
      if (!cnpj) return null
      const c = String(cnpj).replace(/\D/g, '')
      const s = (this.storages || []).find(
        x => String(x.cnpj || '').replace(/\D/g, '') === c
      )
      return s ? s.name : null
    },
    getBaseUrl() {
      const api = this.getApi()
      return (
        (api && (api.defaults?.baseURL || api.baseURL)) || BASE_URL || '/api'
      )
    },
    async onPlay() {
      if (this.service.isRunning) return
      const base = String(this.getBaseUrl()).replace(/\/$/, '')
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(`${base}/system/warehouse-verify/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || err.error || res.statusText)
        }
        await this.loadService()
      } catch (e) {
        this.error = e?.message || 'Erro ao iniciar serviço.'
      }
    },
    async onPause() {
      if (!this.service.isRunning) return
      const base = String(this.getBaseUrl()).replace(/\/$/, '')
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(`${base}/system/warehouse-verify/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || err.error || res.statusText)
        }
        await this.loadService()
      } catch (e) {
        this.error = e?.message || 'Erro ao pausar serviço.'
      }
    },
    async onAdvance() {
      this.advanceLoading = true
      const base = String(this.getBaseUrl()).replace(/\/$/, '')
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(`${base}/system/warehouse-verify/run-once`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || err.error || res.statusText)
        }
        const data = await res.json()
        this.service.lastCheckTime = data.lastCheckTime
        this.service.nextCheckIn = data.nextCheckIn
        this.service.lastRunUpdated = data.lastRunUpdated || []
        await this.loadService()
      } catch (e) {
        this.error = e?.message || 'Erro ao executar verificação.'
      } finally {
        this.advanceLoading = false
      }
    },
  },
}
</script>

<style scoped>
.auto-status-page {
  padding: 1rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
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

.section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section h2 {
  font-size: 1.15rem;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-hint,
.mode-desc,
.mode-meta,
.service-meta,
.service-hint {
  font-size: 0.9rem;
  color: #555;
  margin: 0 0 0.75rem 0;
}

.mode-card {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.mode-card h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

.rules-list {
  margin: 0.75rem 0;
}

.rule-item {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.rule-field {
  font-weight: 600;
  margin-right: 0.5rem;
}

.rule-detail {
  color: #555;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.mode-select {
  min-width: 220px;
  padding: 0.35rem 0.5rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
}

.mode-select:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.saving-label {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.badge-mode {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 0.85rem;
}

.empty-msg {
  color: #888;
  font-style: italic;
  margin: 0.5rem 0;
}

.btn-storages-modal {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-storages-modal:hover {
  background: #1565c0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-storages {
  background: #fff;
  border-radius: 8px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eee;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
}
.modal-close:hover {
  color: #333;
}
.modal-storages .section-hint {
  padding: 0 1.25rem;
  margin-bottom: 0.75rem;
}
.storages-search-wrap {
  padding: 0 1.25rem 0.75rem;
}
.storages-search-input {
  width: 100%;
  max-width: 320px;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-table-wrap {
  flex: 1;
  overflow: auto;
  padding: 0 1.25rem;
}
.modal-storages .empty-msg {
  padding: 0 1.25rem 1rem;
}
.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #eee;
}
.btn-secondary {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #eee;
}

.service-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.btn-control {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}
.btn-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-play {
  color: #2e7d32;
  border-color: #2e7d32;
}
.btn-play:not(:disabled):hover {
  background: #e8f5e9;
}
.btn-pause {
  color: #c62828;
  border-color: #c62828;
}
.btn-pause:not(:disabled):hover {
  background: #ffebee;
}
.btn-advance {
  color: #1565c0;
  border-color: #1565c0;
}
.btn-advance:not(:disabled):hover {
  background: #e3f2fd;
}

.last-run-updated-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  font-size: 0.9rem;
}
.last-run-updated-box h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
}
.last-run-updated-box .table-wrap {
  border: 1px solid #a5d6a7;
  border-radius: 4px;
  overflow: hidden;
}
.last-run-updated-box .data-table th,
.last-run-updated-box .data-table td {
  border: 1px solid #a5d6a7;
}
.last-run-updated-box .data-table th {
  background: #c8e6c9;
}
.last-run-updated-box .data-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.6);
}
.last-run-updated-box .data-table tbody tr:nth-child(odd) {
  background: #e8f5e9;
}
.nfe-key-cell {
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
}

.service-status-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.2rem;
  border-radius: 6px;
  min-height: 2.75rem;
  min-width: 10rem;
  max-width: 100%;
  line-height: 1.25;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
}
.status-badge-text {
  font-size: 12px !important;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.02em;
}
.status-badge.running .status-badge-text {
  color: #0d3d0d !important;
}
.status-badge.stopped .status-badge-text {
  color: #8b0000 !important;
}

.status-badge.running {
  background: #c8e6c9;
  color: #0d3d0d;
  border: 1px solid #a5d6a7;
}

.status-badge.stopped {
  background: #ffcdd2;
  color: #8b0000;
  border: 1px solid #ef9a9a;
}

.env-badge,
.interval-badge {
  font-size: 1.05rem;
  font-weight: 500;
  color: #444;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}

.stat-item {
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.85rem;
}

.stat-item .stat-label {
  display: block;
  color: #666;
}

.stat-item .stat-value {
  font-weight: 700;
  font-size: 1.1rem;
}

.stat-item.success .stat-value {
  color: #2e7d32;
}
.stat-item.warning .stat-value {
  color: #f57c00;
}
.stat-item.error .stat-value {
  color: #c62828;
}

.not-found-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff8e1;
  border: 1px solid #ffecb3;
  border-radius: 6px;
  font-size: 0.9rem;
}

.not-found-box h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
}

.not-found-list {
  margin: 0;
  padding-left: 1.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.not-found-more {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-style: italic;
}

.error-msg {
  color: #c62828;
  padding: 1rem;
  background: #ffebee;
  border-radius: 6px;
  margin-top: 1rem;
}
</style>
