<template>
  <div class="conferencia-lote-page">
    <div class="page-header">
      <h1 class="page-title">
        <i class="fas fa-clipboard-check"></i>
        Conferência em lote
      </h1>
      <p class="page-subtitle">
        Verificação de agendamentos e integrações CorpEM por chave de acesso (44
        dígitos)
      </p>
    </div>

    <div class="conferencia-card">
      <div class="filters-row">
        <div class="form-group estoque-group">
          <label>Estoque</label>
          <button
            type="button"
            class="btn btn-outline-primary estoque-btn"
            :class="{ 'btn-primary': selectedEstoque }"
            @click="openEstoqueModal"
          >
            <i class="fas fa-warehouse"></i>
            <span class="estoque-btn-text">{{
              selectedEstoque ? selectedEstoque.name : 'Selecionar estoque'
            }}</span>
          </button>
        </div>
        <div class="form-group nfe-group">
          <label for="nfe-key-input"
            >Chave de acesso da NF-e (44 dígitos)</label
          >
          <input
            id="nfe-key-input"
            :value="nfeKeyInput"
            type="text"
            class="form-control"
            placeholder="Chave de 44 dígitos (aceita NFe... colado do XML)"
            maxlength="50"
            @input="onNfeKeyInput"
            @keydown.enter.prevent="consultar"
          />
        </div>
        <div class="form-group btn-group">
          <label>&nbsp;</label>
          <button
            type="button"
            class="btn btn-primary btn-consultar"
            :disabled="!canConsultar || loadingConsulta"
            @click="consultar"
          >
            <i v-if="loadingConsulta" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-search"></i>
            {{ loadingConsulta ? 'Consultando...' : 'Consultar' }}
          </button>
          <input
            ref="importFileInput"
            type="file"
            accept=".txt"
            class="import-file-input-hidden"
            @change="onImportFileSelected"
          />
          <button
            type="button"
            class="btn btn-outline-secondary btn-importar"
            :disabled="!canImportar || loadingImport"
            @click="triggerImportFile"
          >
            <i v-if="loadingImport" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-file-import"></i>
            {{
              loadingImport
                ? importProgress
                  ? `Importando... ${importProgress}`
                  : 'Importando...'
                : 'Importar'
            }}
          </button>
        </div>
      </div>

      <div v-if="results.length > 0" class="export-row">
        <button
          type="button"
          class="btn btn-outline-success btn-export"
          @click="exportToExcel"
        >
          <i class="fas fa-file-excel"></i>
          Exportar para Excel
        </button>
        <button
          type="button"
          class="btn btn-primary btn-em-conferencia"
          :disabled="!hasSelectedWithSchedule || loadingEmConferencia"
          @click="openEmConferenciaModal"
        >
          <i v-if="loadingEmConferencia" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-clipboard-check"></i>
          Em conferência
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-inserir-carga"
          :disabled="results.length === 0 || loadingInserirCarga"
          @click="openInserirCargaModal"
        >
          <i v-if="loadingInserirCarga" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-truck-loading"></i>
          Inserir em uma carga
        </button>
      </div>

      <div class="table-section">
        <table class="result-table">
          <thead>
            <tr>
              <th class="col-check">
                <input
                  type="checkbox"
                  :checked="allChecked"
                  :indeterminate.prop="someChecked && !allChecked"
                  aria-label="Selecionar todos"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="col-numero">Número da NF-e</th>
              <th class="col-agendamento">Agendamento</th>
              <th class="col-status">Status</th>
              <th class="col-corpem">Corpem</th>
              <th class="col-acao">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in results"
              :key="row.id"
              class="result-row"
              :class="getRowStatusClass(row)"
            >
              <td class="col-check">
                <input
                  type="checkbox"
                  :checked="row.checked"
                  @change="row.checked = $event.target.checked"
                />
              </td>
              <td class="col-numero">{{ row.nfeDisplay }}</td>
              <td class="col-agendamento">
                <span
                  v-if="row.scheduleLabel === 'Não encontrado!'"
                  class="badge badge-not-found"
                  >{{ row.scheduleLabel }}</span
                >
                <span v-else>{{ row.scheduleLabel }}</span>
              </td>
              <td class="col-status">
                <span
                  v-if="row.chosenSchedule && row.chosenSchedule.status"
                  :class="[
                    'status-badge',
                    getStatusBadge(row.chosenSchedule.status).class,
                  ]"
                  >{{ getStatusBadge(row.chosenSchedule.status).label }}</span
                >
                <span v-else class="text-muted">—</span>
              </td>
              <td class="col-corpem">
                <span
                  v-if="row.corpemLabel === 'Não encontrado!'"
                  class="badge badge-not-found"
                  >{{ row.corpemLabel }}</span
                >
                <span v-else>{{ row.corpemLabel }}</span>
              </td>
              <td class="col-acao">
                <button
                  type="button"
                  class="btn btn-sm btn-remove"
                  title="Remover"
                  @click="removeRow(row)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </td>
            </tr>
            <tr v-if="results.length === 0" class="empty-row">
              <td colspan="6" class="text-muted">
                Nenhuma consulta realizada. Selecione o estoque, informe a chave
                de acesso (44 dígitos) e clique em Consultar.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Seleção de estoque -->
    <div
      v-if="showEstoqueModal"
      class="modal-overlay"
      @click="closeEstoqueModal"
    >
      <div class="modal-content estoque-modal" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-warehouse"></i> Selecionar estoque</h3>
          <button
            type="button"
            class="modal-close-btn"
            @click="closeEstoqueModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingEstoques" class="loading-container">
            <i class="fas fa-spinner fa-spin"></i> Carregando estoques...
          </div>
          <div v-else>
            <input
              v-model="estoqueSearchQuery"
              type="text"
              class="form-control search-input"
              placeholder="Pesquisar por nome, CNPJ ou número Corpem..."
              @input="filterEstoques"
            />
            <div class="estoque-lista">
              <div
                v-for="e in filteredEstoques"
                :key="e.cnpj"
                class="estoque-item"
                @click="selectEstoque(e)"
              >
                <span class="estoque-nome">{{ e.name }}</span>
                <span class="estoque-cnpj">CNPJ: {{ formatCNPJ(e.cnpj) }}</span>
              </div>
              <div v-if="filteredEstoques.length === 0" class="text-muted">
                Nenhum estoque encontrado.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Múltiplos agendamentos - escolher qual exibir -->
    <div
      v-if="showSchedulePickModal"
      class="modal-overlay"
      @click="closeSchedulePickModal"
    >
      <div class="modal-content pick-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-calendar-check"></i> Múltiplos agendamentos
            encontrados
          </h3>
          <button
            type="button"
            class="modal-close-btn"
            @click="closeSchedulePickModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="mb-2">
            Selecione o agendamento correto para exibir na lista:
          </p>
          <div class="pick-list">
            <button
              v-for="s in schedulePickList"
              :key="s.id"
              type="button"
              class="btn btn-outline-primary pick-item"
              @click="chooseSchedule(s)"
            >
              ID {{ s.id }} – Data: {{ formatDateDDMMYY(s.date) }} – Status:
              {{ s.status }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Múltiplas integrações (futuro: se API retornar array) -->
    <div
      v-if="showIntegrationPickModal"
      class="modal-overlay"
      @click="closeIntegrationPickModal"
    >
      <div class="modal-content pick-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-database"></i> Múltiplas integrações encontradas
          </h3>
          <button
            type="button"
            class="modal-close-btn"
            @click="closeIntegrationPickModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="mb-2">Selecione a integração correta:</p>
          <div class="pick-list">
            <button
              v-for="(int, idx) in integrationPickList"
              :key="idx"
              type="button"
              class="btn btn-outline-primary pick-item"
              @click="chooseIntegration(int)"
            >
              {{ int.storage || 'Storage ' + (idx + 1) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Em conferência - lista e resultado das integrações sequenciais -->
    <div
      v-if="showEmConferenciaModal"
      class="modal-overlay"
      @click="!emConferenciaRunning && closeEmConferenciaModal()"
    >
      <div class="modal-content em-conferencia-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-clipboard-check"></i> Em conferência – Integração
            CorpEM
          </h3>
          <button
            type="button"
            class="modal-close-btn"
            :disabled="emConferenciaRunning"
            @click="closeEmConferenciaModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="mb-2">
            Os agendamentos abaixo serão marcados como &quot;Em
            conferência&quot; e integrados ao CorpEM (quando o cliente tiver
            integração ativa), um por vez.
          </p>
          <ul class="em-conferencia-list">
            <li
              v-for="item in emConferenciaList"
              :key="item.scheduleId"
              class="em-conferencia-item"
              :class="item.status"
            >
              <span class="em-conferencia-numero"
                >{{ item.nfeDisplay }} (ID {{ item.scheduleId }})</span
              >
              <span class="em-conferencia-result">
                <template v-if="item.status === 'pending'">
                  <i class="fas fa-clock"></i> Aguardando
                </template>
                <template v-else-if="item.status === 'running'">
                  <i class="fas fa-spinner fa-spin"></i> Integrando...
                </template>
                <template v-else-if="item.status === 'success'">
                  <i class="fas fa-check-circle"></i> Integrado
                </template>
                <template v-else-if="item.status === 'ignored'">
                  <i class="fas fa-minus-circle"></i>
                  {{ item.errorMessage || 'Ignorado (inexistente)' }}
                </template>
                <template v-else-if="item.status === 'error'">
                  <i class="fas fa-exclamation-circle"></i>
                  {{ item.errorMessage || 'Erro' }}
                </template>
              </span>
            </li>
          </ul>
          <div v-if="emConferenciaRunning" class="em-conferencia-progress">
            <i class="fas fa-spinner fa-spin"></i> Processando sequencialmente
            para não sobrecarregar a API CorpEM...
          </div>
          <div
            v-else-if="emConferenciaList.length > 0"
            class="em-conferencia-done"
          >
            <p>
              <template
                v-if="
                  emConferenciaSuccessCount === emConferenciaList.length &&
                  emConferenciaIgnoredCount === 0
                "
                >Todos concluídos com sucesso.</template
              >
              <template
                v-else-if="
                  emConferenciaSuccessCount === emConferenciaList.length &&
                  emConferenciaIgnoredCount > 0
                "
                >Todos os existentes concluídos.
                {{ emConferenciaIgnoredCount }} ignorado(s)
                (inexistentes).</template
              >
              <template v-else-if="emConferenciaErrorCount > 0"
                >{{ emConferenciaSuccessCount }} sucesso;
                {{
                  emConferenciaIgnoredCount > 0
                    ? emConferenciaIgnoredCount + ' ignorado(s); '
                    : ''
                }}{{ emConferenciaErrorCount }} erro(s).</template
              >
              <template v-else
                >Concluído.
                {{
                  emConferenciaIgnoredCount > 0
                    ? emConferenciaIgnoredCount + ' ignorado(s) (inexistentes).'
                    : ''
                }}</template
              >
            </p>
            <button
              type="button"
              class="btn btn-primary"
              @click="closeEmConferenciaModal"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Inserir em uma carga (98% do display) -->
    <div
      v-if="showInserirCargaModal"
      class="modal-overlay inserir-carga-overlay"
      @click="!inserirCargaRunning && closeInserirCargaModal()"
    >
      <div class="modal-content inserir-carga-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-truck-loading"></i> Inserir em uma carga
          </h3>
          <button
            type="button"
            class="modal-close-btn"
            :disabled="inserirCargaRunning"
            @click="closeInserirCargaModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body inserir-carga-body">
          <!-- Estado: carregando cargas -->
          <div v-if="loadingRecentLoads" class="loading-container">
            <i class="fas fa-spinner fa-spin"></i> Carregando cargas recentes...
          </div>

          <!-- Estado: processando inserção -->
          <div v-else-if="inserirCargaRunning" class="inserir-carga-processing">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p class="mt-1">Inserindo agendamentos na carga <strong>{{ inserirCargaSelectedLoad }}</strong>...</p>
          </div>

          <!-- Estado: resultado da inserção -->
          <div v-else-if="inserirCargaResult" class="inserir-carga-result">
            <div class="inserir-carga-result-header">
              <i class="fas fa-check-circle" style="color: #48bb78; font-size: 2rem;"></i>
              <h4>Inserção concluída</h4>
              <p>Carga: <strong>{{ inserirCargaResult.load_id }}</strong></p>
            </div>
            <div class="inserir-carga-result-stats">
              <div class="stat-item stat-created">
                <span class="stat-number">{{ inserirCargaResult.created_count }}</span>
                <span class="stat-label">Criados</span>
              </div>
              <div class="stat-item stat-existing">
                <span class="stat-number">{{ inserirCargaResult.existing_count }}</span>
                <span class="stat-label">Existentes</span>
              </div>
              <div v-if="inserirCargaResult.error_count > 0" class="stat-item stat-error">
                <span class="stat-number">{{ inserirCargaResult.error_count }}</span>
                <span class="stat-label">Erros</span>
              </div>
            </div>
            <ul v-if="inserirCargaResult.results && inserirCargaResult.results.length > 0" class="inserir-carga-result-list">
              <li
                v-for="(r, idx) in inserirCargaResult.results"
                :key="idx"
                class="inserir-result-item"
                :class="r.status"
              >
                <span class="inserir-result-key">{{ r.nfe_key ? r.nfe_key.substring(25, 34).replace(/^0+/, '') || r.nfe_key.slice(0, 20) : '—' }}</span>
                <span class="inserir-result-msg">
                  <i v-if="r.status === 'created'" class="fas fa-plus-circle"></i>
                  <i v-else-if="r.status === 'existing'" class="fas fa-check-circle"></i>
                  <i v-else class="fas fa-exclamation-circle"></i>
                  {{ r.message }}
                </span>
              </li>
            </ul>
            <div class="inserir-carga-result-actions">
              <button type="button" class="btn btn-primary" @click="closeInserirCargaModal">
                Fechar
              </button>
            </div>
          </div>

          <!-- Estado: lista de cargas recentes -->
          <div v-else>
            <p class="mb-2">
              Selecione uma carga para inserir os <strong>{{ results.length }}</strong> agendamento(s) listados:
            </p>
            <div v-if="recentLoads.length === 0" class="text-muted" style="text-align: center; padding: 2rem;">
              Nenhuma carga encontrada.
            </div>
            <div class="cargas-grid">
              <div
                v-for="carga in recentLoads"
                :key="carga.load_id"
                class="carga-card"
                @click="onSelectCarga(carga)"
              >
                <div class="carga-card-header">
                  <span class="carga-id">{{ carga.load_id }}</span>
                  <span class="carga-status-badge" :class="'carga-status-' + (carga.status || '').toLowerCase()">
                    {{ carga.status }}
                  </span>
                </div>
                <div class="carga-card-body">
                  <div class="carga-info-row">
                    <i class="fas fa-calendar-alt"></i>
                    <span>{{ formatDateTimeBR(carga.created_at) }}</span>
                  </div>
                  <div class="carga-info-row">
                    <i class="fas fa-warehouse"></i>
                    <span>{{ formatCargaStorage(carga) }}</span>
                  </div>
                  <div class="carga-info-row">
                    <i class="fas fa-truck"></i>
                    <span>{{ carga.transport_company_name || '—' }}</span>
                  </div>
                  <div v-if="carga.obs" class="carga-info-row carga-obs-row">
                    <i class="fas fa-comment-alt"></i>
                    <span class="carga-obs-text">{{ carga.obs }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ExcelJS from 'exceljs'
import { BASE_URL } from '@/config/api.js'

export default {
  name: 'ConferenciaLotePage',
  data() {
    return {
      selectedEstoque: null,
      nfeKeyInput: '',
      results: [],
      nextId: 1,
      loadingConsulta: false,
      loadingEstoques: false,
      availableEstoques: [],
      filteredEstoques: [],
      estoqueSearchQuery: '',
      showEstoqueModal: false,
      showSchedulePickModal: false,
      showIntegrationPickModal: false,
      schedulePickRowId: null,
      schedulePickList: [],
      integrationPickRowId: null,
      integrationPickList: [],
      showEmConferenciaModal: false,
      emConferenciaList: [],
      emConferenciaRunning: false,
      loadingEmConferencia: false,
      loadingImport: false,
      importProgress: '',
      showInserirCargaModal: false,
      loadingInserirCarga: false,
      loadingRecentLoads: false,
      recentLoads: [],
      inserirCargaRunning: false,
      inserirCargaSelectedLoad: null,
      inserirCargaResult: null,
    }
  },
  computed: {
    canConsultar() {
      const client = this.selectedEstoque && this.getClientCnpjDigits()
      const key = this.normalizeNfeInput(this.nfeKeyInput)
      return !!client && key.length === 44
    },
    /** Pode importar quando há estoque selecionado e não está consultando/importando. */
    canImportar() {
      return (
        !!(this.selectedEstoque && this.getClientCnpjDigits()) &&
        !this.loadingConsulta &&
        !this.loadingImport
      )
    },
    allChecked() {
      if (this.results.length === 0) return false
      return this.results.every(r => r.checked)
    },
    someChecked() {
      return this.results.some(r => r.checked)
    },
    /** Linhas selecionadas que possuem agendamento encontrado (podem ser integradas). */
    selectedWithSchedule() {
      return this.results.filter(
        r =>
          r.checked && r.chosenSchedule && r.scheduleLabel !== 'Não encontrado!'
      )
    },
    hasSelectedWithSchedule() {
      return this.selectedWithSchedule.length > 0
    },
    emConferenciaSuccessCount() {
      return this.emConferenciaList.filter(i => i.status === 'success').length
    },
    emConferenciaErrorCount() {
      return this.emConferenciaList.filter(i => i.status === 'error').length
    },
    emConferenciaIgnoredCount() {
      return this.emConferenciaList.filter(i => i.status === 'ignored').length
    },
  },
  mounted() {
    // Carregar estoques ao abrir (para o modal)
    this.loadEstoques()
  },
  methods: {
    getClientCnpjDigits() {
      if (!this.selectedEstoque || !this.selectedEstoque.cnpj) return ''
      return String(this.selectedEstoque.cnpj).replace(/\D/g, '')
    },
    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      const d = String(cnpj).replace(/\D/g, '')
      if (d.length !== 14) return cnpj
      return d.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },
    /** Formata data ISO ou YYYY-MM-DD para dd/mm/aa */
    formatDateDDMMYY(value) {
      if (!value) return ''
      const str = String(value).trim()
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) {
        const [, y, m, d] = match
        const yy = y.slice(-2)
        return `${d}/${m}/${yy}`
      }
      const date = new Date(str)
      if (Number.isNaN(date.getTime())) return value
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const yy = String(date.getFullYear()).slice(-2)
      return `${dd}/${mm}/${yy}`
    },
    async loadEstoques() {
      this.loadingEstoques = true
      try {
        let all = []
        if (window.globalClientsCache && window.globalClientsCache.clients) {
          all = window.globalClientsCache.clients
        } else if (window.apiClient) {
          const response = await window.apiClient.request('/clients', {
            method: 'GET',
          })
          if (response && response.data && Array.isArray(response.data))
            all = response.data
          else if (Array.isArray(response)) all = response
          else if (
            response &&
            response.clients &&
            Array.isArray(response.clients)
          )
            all = response.clients
          if (all.length > 0 && typeof window !== 'undefined') {
            window.globalClientsCache = { clients: all, loadedAt: Date.now() }
          }
        } else {
          const token = localStorage.getItem('token')
          const base = BASE_URL.replace(/\/$/, '')
          const url = base.endsWith('/api')
            ? `${base}/clients`
            : `${base}/api/clients`
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          if (!res.ok) {
            console.warn(
              '[ConferenciaLote] Falha ao carregar clientes:',
              res.status,
              res.statusText
            )
            throw new Error(`Erro ${res.status} ao carregar clientes`)
          }
          const data = await res.json().catch(() => ({}))
          if (data.data && Array.isArray(data.data)) all = data.data
          else if (Array.isArray(data)) all = data
          else if (data.clients && Array.isArray(data.clients))
            all = data.clients
        }
        all = (all || []).filter(e => e.cnpj)
        const user = this.getCurrentUser()
        if (user && Number(user.level_access) !== 0 && user.cli_access) {
          let cli = user.cli_access
          if (typeof cli === 'string')
            try {
              cli = JSON.parse(cli)
            } catch (_) {
              cli = {}
            }
          if (cli && typeof cli === 'object' && Object.keys(cli).length > 0) {
            const allowed = Object.keys(cli).map(c => c.replace(/\D/g, ''))
            all = all.filter(e =>
              allowed.includes(String(e.cnpj).replace(/\D/g, ''))
            )
          }
        }
        this.availableEstoques = all.map(e => ({
          cnpj: e.cnpj,
          name: e.name || e.supplier || '',
          corpem_code: e.corpem_code || e.numero || '',
        }))
        this.filteredEstoques = [...this.availableEstoques]
      } catch (err) {
        console.error('Erro ao carregar estoques:', err)
        this.availableEstoques = []
        this.filteredEstoques = []
      } finally {
        this.loadingEstoques = false
      }
    },
    getCurrentUser() {
      try {
        const raw = localStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
      } catch (_) {
        return null
      }
    },
    openEstoqueModal() {
      this.showEstoqueModal = true
      this.estoqueSearchQuery = ''
      this.filteredEstoques = [...this.availableEstoques]
    },
    closeEstoqueModal() {
      this.showEstoqueModal = false
    },
    filterEstoques() {
      const q = (this.estoqueSearchQuery || '').toLowerCase().trim()
      if (!q) {
        this.filteredEstoques = [...this.availableEstoques]
        return
      }
      this.filteredEstoques = this.availableEstoques.filter(e => {
        const name = (e.name || '').toLowerCase()
        const cnpj = (e.cnpj || '').replace(/\D/g, '')
        const corpem = (e.corpem_code || '').toString()
        return name.includes(q) || cnpj.includes(q) || corpem.includes(q)
      })
    },
    selectEstoque(e) {
      this.selectedEstoque = { cnpj: e.cnpj, name: e.name }
      this.closeEstoqueModal()
    },
    /** Extrai o número da NF-e das posições 26-34 da chave de 44 dígitos (padrão NFe). */
    extractNfeNumberFromKey(nfeKey) {
      if (!nfeKey || nfeKey.length < 34) return nfeKey
      const nfeNumber = nfeKey.substring(25, 34)
      return parseInt(nfeNumber, 10).toString()
    },
    /** Normaliza o valor do input: remove prefixo "NFe", espaços e mantém só dígitos (evita corte ao colar chave do XML). */
    normalizeNfeInput(value) {
      const s = (value || '').replace(/\s/g, '').trim()
      const semNfe = s.replace(/^NFe/i, '')
      return semNfe.replace(/\D/g, '')
    },
    /** Aplica normalização no input em tempo real (só dígitos no campo). */
    onNfeKeyInput(e) {
      this.nfeKeyInput = this.normalizeNfeInput(e.target.value)
    },
    /**
     * Chama a API check-nfe-status e monta o objeto de linha para a tabela.
     * A API busca apenas por nfe_key (chave de 44 dígitos) para identificar um único agendamento.
     * @param {string} client - CNPJ do estoque (apenas dígitos)
     * @param {string} nfeKey - Chave de acesso (44 dígitos)
     * @param {object} opts - { rowId, chooseFirstIfMultiple } - se true, em múltiplos agendamentos usa o primeiro sem abrir modal
     * @returns {{ row: object, openSchedulePickModal: boolean }}
     */
    async fetchNfeStatusRow(client, nfeKey, opts = {}) {
      const { rowId, chooseFirstIfMultiple = false } = opts
      const base =
        typeof window !== 'undefined' && window.apiClient
          ? window.apiClient.baseURL
          : BASE_URL
      const token = localStorage.getItem('token')
      const res = await fetch(`${base}/schedules/check-nfe-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ client, nfe_key: nfeKey }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data.error || res.statusText || 'Erro ao consultar')

      const schedules = data.schedules || []
      const integration = data.integration || {}

      let scheduleLabel = 'Não encontrado!'
      let corpemLabel = 'Não encontrado!'
      let chosenSchedule = null
      let chosenIntegration = null
      let openSchedulePickModal = false

      if (schedules.length === 0) {
        // sem agendamento
      } else if (schedules.length === 1) {
        chosenSchedule = schedules[0]
        scheduleLabel = this.formatDateDDMMYY(chosenSchedule.date) || '—'
      } else {
        chosenSchedule = schedules[0]
        scheduleLabel = this.formatDateDDMMYY(chosenSchedule.date) || '—'
        if (!chooseFirstIfMultiple) {
          openSchedulePickModal = true
        }
      }

      if (integration.found && integration.storage) {
        corpemLabel = integration.storage
        chosenIntegration = integration
      }

      const nfeDisplay =
        schedules[0] && schedules[0].number
          ? schedules[0].number
          : nfeKey.length === 44
            ? this.extractNfeNumberFromKey(nfeKey)
            : nfeKey
      const scheduleFound = schedules.length > 0
      const integrationFound = !!(integration.found && integration.storage)
      const hasCorpemPayload = !!(
        chosenSchedule && chosenSchedule.has_corpem_integration_payload
      )
      const needsCorpemAttention =
        scheduleFound && !integrationFound && !hasCorpemPayload

      const row = {
        id: rowId,
        checked: false,
        nfeKey,
        nfeDisplay,
        scheduleLabel,
        corpemLabel,
        schedules,
        integration,
        chosenSchedule,
        chosenIntegration,
        needsCorpemAttention,
      }
      return { row, openSchedulePickModal }
    },
    async consultar() {
      if (!this.canConsultar || this.loadingConsulta) return
      const client = this.getClientCnpjDigits()
      const nfeKey = this.normalizeNfeInput(this.nfeKeyInput)
      if (!nfeKey) {
        this.$emit(
          'notification',
          'Informe a chave de acesso da NF-e (44 dígitos).',
          'warning'
        )
        return
      }
      if (nfeKey.length !== 44) {
        this.$emit(
          'notification',
          'Informe a chave de acesso completa (44 dígitos) para identificar o agendamento corretamente.',
          'warning'
        )
        return
      }
      this.loadingConsulta = true
      const rowId = this.nextId++
      try {
        const { row, openSchedulePickModal } = await this.fetchNfeStatusRow(
          client,
          nfeKey,
          { rowId, chooseFirstIfMultiple: false }
        )
        this.results.unshift(row)
        if (openSchedulePickModal) {
          this.schedulePickRowId = rowId
          this.schedulePickList = row.schedules
          this.showSchedulePickModal = true
        }
        this.nfeKeyInput = ''
      } catch (err) {
        console.error('Erro ao consultar check-nfe-status:', err)
        const msg =
          err.body && typeof err.body === 'object' && err.body.error
            ? err.body.error
            : err.message || 'Erro ao consultar. Tente novamente.'
        this.$emit('notification', msg, 'error')
      } finally {
        this.loadingConsulta = false
      }
    },
    triggerImportFile() {
      if (!this.canImportar || this.loadingImport) return
      const el = this.$refs.importFileInput
      if (el) {
        el.value = ''
        el.click()
      }
    },
    /** Extrai chaves de 44 dígitos de um texto (uma por linha ou sequência de 44 dígitos). */
    parseTxtChaves(text) {
      const lines = (text || '').split(/\r?\n/)
      const chaves = []
      const re44 = /\d{44}/g
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const match = trimmed.match(re44)
        if (match) {
          match.forEach(m => chaves.push(m))
        } else if (/^\d+$/.test(trimmed) && trimmed.length === 44) {
          chaves.push(trimmed)
        }
      }
      return [...new Set(chaves)]
    },
    async onImportFileSelected(event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (!file) return
      const client = this.getClientCnpjDigits()
      if (!client) {
        this.$emit(
          'notification',
          'Selecione o estoque antes de importar.',
          'warning'
        )
        return
      }
      this.loadingImport = true
      this.importProgress = ''
      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result || '')
          reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
          reader.readAsText(file, 'UTF-8')
        })
        const chaves = this.parseTxtChaves(text)
        if (chaves.length === 0) {
          this.$emit(
            'notification',
            'Nenhuma chave de 44 dígitos encontrada no arquivo.',
            'warning'
          )
          return
        }
        const added = []
        for (let i = 0; i < chaves.length; i++) {
          this.importProgress = `${i + 1}/${chaves.length}`
          const rowId = this.nextId++
          try {
            const { row } = await this.fetchNfeStatusRow(client, chaves[i], {
              rowId,
              chooseFirstIfMultiple: true,
            })
            this.results.unshift(row)
            added.push(row.nfeDisplay)
          } catch (err) {
            console.warn('Importar chave falhou:', chaves[i], err.message)
            this.$emit(
              'notification',
              `Chave ${chaves[i].slice(0, 20)}...: ${err.message}`,
              'warning'
            )
          }
        }
        this.$emit(
          'notification',
          `Importação concluída: ${added.length} de ${chaves.length} chave(s) listadas. Use "Em conferência" para alterar status e integrar.`,
          'success'
        )
      } catch (err) {
        console.error('Erro ao importar arquivo:', err)
        this.$emit(
          'notification',
          err.message || 'Erro ao importar arquivo.',
          'error'
        )
      } finally {
        this.loadingImport = false
        this.importProgress = ''
      }
    },
    chooseSchedule(s) {
      const row = this.results.find(r => r.id === this.schedulePickRowId)
      if (row) {
        row.chosenSchedule = s
        row.scheduleLabel = this.formatDateDDMMYY(s.date) || '—'
      }
      this.closeSchedulePickModal()
    },
    closeSchedulePickModal() {
      this.showSchedulePickModal = false
      this.schedulePickRowId = null
      this.schedulePickList = []
    },
    chooseIntegration(int) {
      const row = this.results.find(r => r.id === this.integrationPickRowId)
      if (row) {
        row.chosenIntegration = int
        row.corpemLabel = int.storage || '—'
      }
      this.closeIntegrationPickModal()
    },
    closeIntegrationPickModal() {
      this.showIntegrationPickModal = false
      this.integrationPickRowId = null
      this.integrationPickList = []
    },
    toggleSelectAll() {
      const next = !this.allChecked
      this.results.forEach(r => {
        r.checked = next
      })
    },
    openEmConferenciaModal() {
      // Filtrar apenas itens com agendamento válido (id existente) para evitar requisições a IDs inexistentes
      const validItems = this.selectedWithSchedule.filter(
        r =>
          r.chosenSchedule &&
          r.chosenSchedule.id != null &&
          r.chosenSchedule.id !== ''
      )
      const skippedCount = this.selectedWithSchedule.length - validItems.length
      if (skippedCount > 0) {
        this.$emit(
          'notification',
          `${skippedCount} item(ns) sem agendamento válido foram ignorados.`,
          'info'
        )
      }
      const items = validItems.map(r => ({
        scheduleId: r.chosenSchedule.id,
        nfeDisplay: r.nfeDisplay,
        status: 'pending',
        errorMessage: null,
      }))
      if (items.length === 0) {
        this.$emit(
          'notification',
          'Nenhum agendamento válido selecionado para processar.',
          'warning'
        )
        return
      }
      this.emConferenciaList = items
      this.showEmConferenciaModal = true
      this.emConferenciaRunning = true
      this.loadingEmConferencia = true
      this.runEmConferenciaSequential()
    },
    async runEmConferenciaSequential() {
      const base =
        typeof window !== 'undefined' && window.apiClient
          ? window.apiClient.baseURL
          : BASE_URL
      const token = localStorage.getItem('token')
      const user = this.getCurrentUser()
      const userLabel = user && user.user ? user.user : 'system'
      for (let i = 0; i < this.emConferenciaList.length; i++) {
        const item = this.emConferenciaList[i]
        this.emConferenciaList[i] = { ...item, status: 'running' }
        try {
          const res = await fetch(
            `${base}/schedules/${item.scheduleId}/status`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                status: 'Conferência',
                historic_entry: {
                  user: userLabel,
                  action: 'Status alterado para Conferência',
                  comment: 'Conferência em lote',
                },
              }),
            }
          )
          const data = await res.json().catch(() => ({}))
          if (res.ok) {
            this.emConferenciaList[i] = { ...item, status: 'success' }
          } else if (res.status === 404) {
            // Agendamento inexistente (ex.: excluído) - ignorar sem travar o sistema
            this.emConferenciaList[i] = {
              ...item,
              status: 'ignored',
              errorMessage: 'Agendamento não encontrado (ignorado)',
            }
          } else {
            this.emConferenciaList[i] = {
              ...item,
              status: 'error',
              errorMessage: data.error || res.statusText || 'Erro',
            }
          }
        } catch (err) {
          this.emConferenciaList[i] = {
            ...item,
            status: 'error',
            errorMessage: err.message || 'Erro de rede',
          }
        }
      }
      this.emConferenciaRunning = false
      this.loadingEmConferencia = false
      const successCount = this.emConferenciaSuccessCount
      const errorCount = this.emConferenciaErrorCount
      const ignoredCount = this.emConferenciaIgnoredCount
      let msg = `Conferência em lote: ${successCount} sucesso`
      if (ignoredCount > 0)
        msg += `, ${ignoredCount} ignorado(s) (inexistentes)`
      if (errorCount > 0) msg += `, ${errorCount} erro(s)`
      this.$emit('notification', msg, errorCount > 0 ? 'warning' : 'success')
    },
    closeEmConferenciaModal() {
      if (this.emConferenciaRunning) return
      this.showEmConferenciaModal = false
      this.emConferenciaList = []
    },
    /** Formata datetime ISO para dd/mm/yyyy HH:mm */
    formatDateTimeBR(value) {
      if (!value) return ''
      const d = new Date(value)
      if (isNaN(d.getTime())) return value
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`
    },
    /** Texto do armazém da carga: prioriza a sigla (storage.corpem) com fallback para o id. */
    formatCargaStorage(carga) {
      const s = carga?.storage || {}
      const sigla = s.corpem ? String(s.corpem).trim() : (s.id ? String(s.id).trim() : '')
      const nome = s.name ? String(s.name).trim() : ''
      if (sigla && nome) return `${sigla} — ${nome}`
      return sigla || nome || '—'
    },
    async openInserirCargaModal() {
      if (this.results.length === 0) {
        this.$emit('notification', 'Nenhuma chave de acesso na lista.', 'warning')
        return
      }
      if (!this.selectedEstoque) {
        this.$emit('notification', 'Selecione o estoque antes de inserir em uma carga.', 'warning')
        return
      }
      this.showInserirCargaModal = true
      this.inserirCargaResult = null
      this.inserirCargaSelectedLoad = null
      this.loadingRecentLoads = true
      try {
        const base =
          typeof window !== 'undefined' && window.apiClient
            ? window.apiClient.baseURL
            : BASE_URL
        const token = localStorage.getItem('token')
        const res = await fetch(`${base}/loads/recent`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          this.recentLoads = data.data || []
        } else {
          this.recentLoads = []
          this.$emit('notification', data.error || 'Erro ao carregar cargas.', 'error')
        }
      } catch (err) {
        console.error('Erro ao buscar cargas recentes:', err)
        this.recentLoads = []
        this.$emit('notification', 'Erro ao carregar cargas recentes.', 'error')
      } finally {
        this.loadingRecentLoads = false
      }
    },
    closeInserirCargaModal() {
      if (this.inserirCargaRunning) return
      this.showInserirCargaModal = false
      this.recentLoads = []
      this.inserirCargaResult = null
      this.inserirCargaSelectedLoad = null
    },
    async onSelectCarga(carga) {
      try {
        const { useSystemDialogStore } = await import('@/stores/systemDialog.js')
        const dialogStore = useSystemDialogStore()
        const message =
          `Deseja inserir os ${this.results.length} agendamento(s) na carga ${carga.load_id}?\n\n` +
          `Armazém: ${carga.storage && carga.storage.name ? carga.storage.name : '—'}\n` +
          `Status: ${carga.status}\n` +
          `Agendamentos existentes: ${carga.schedules_count}\n\n` +
          `Chaves sem agendamento serão criadas com status "Não agendado" (sem importação XML).`
        const confirmed = await dialogStore.showConfirm(
          message,
          'Inserir em carga',
          { primaryLabel: 'Sim, inserir' }
        )
        if (confirmed) {
          await this.executeInserirCarga(carga.load_id)
        }
      } catch (e) {
        console.warn('Modal de confirmação indisponível, usando confirmação nativa:', e?.message || e)
        const confirmed = window.confirm(
          `Deseja inserir os ${this.results.length} agendamento(s) na carga ${carga.load_id}?\n\n` +
          `Chaves sem agendamento serão criadas com status "Não agendado" (sem importação XML).`
        )
        if (confirmed) {
          await this.executeInserirCarga(carga.load_id)
        }
      }
    },
    async executeInserirCarga(loadId) {
      this.inserirCargaRunning = true
      this.loadingInserirCarga = true
      this.inserirCargaSelectedLoad = loadId
      try {
        const base =
          typeof window !== 'undefined' && window.apiClient
            ? window.apiClient.baseURL
            : BASE_URL
        const token = localStorage.getItem('token')
        const clientCnpj = this.getClientCnpjDigits()

        // Montar array de nfe_keys com schedule_id quando disponível
        const nfeKeys = this.results.map(r => ({
          nfe_key: r.nfeKey,
          schedule_id: r.chosenSchedule && r.chosenSchedule.id ? r.chosenSchedule.id : null,
        }))

        const res = await fetch(`${base}/loads/${loadId}/insert-schedules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nfe_keys: nfeKeys,
            client_cnpj: clientCnpj,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          this.inserirCargaResult = data.data
          this.$emit(
            'notification',
            `${data.data.inserted_count} agendamento(s) inserido(s) na carga ${loadId}.`,
            'success'
          )
        } else {
          this.$emit(
            'notification',
            data.error || 'Erro ao inserir agendamentos na carga.',
            'error'
          )
          this.inserirCargaResult = null
        }
      } catch (err) {
        console.error('Erro ao inserir na carga:', err)
        this.$emit('notification', err.message || 'Erro de rede.', 'error')
        this.inserirCargaResult = null
      } finally {
        this.inserirCargaRunning = false
        this.loadingInserirCarga = false
      }
    },
    removeRow(row) {
      this.results = this.results.filter(r => r.id !== row.id)
    },
    async exportToExcel() {
      if (this.results.length === 0) return
      try {
        const numCols = 5
        const tableHeaders = [
          'Número da NF-e',
          'Chave de acesso (44 dígitos)',
          'Agendamento',
          'Status',
          'WMS',
        ]
        const statusColors = {
          Solicitado: { bg: 'FFFFF3CD', text: 'FF856404' },
          Cancelar: { bg: 'FFFFF3CD', text: 'FF856404' },
          Agendado: { bg: 'FFCCE5FF', text: 'FF004085' },
          Conferência: { bg: 'FFD4EDDA', text: 'FF155724' },
          'Em conferência': { bg: 'FFD4EDDA', text: 'FF155724' },
          Recebido: { bg: 'FFD4EDDA', text: 'FF155724' },
          'Em estoque': { bg: 'FFD4EDDA', text: 'FF155724' },
          Estoque: { bg: 'FFD4EDDA', text: 'FF155724' },
          Tratativa: { bg: 'FFF8D7DA', text: 'FF721C24' },
          'Em tratativa': { bg: 'FFF8D7DA', text: 'FF721C24' },
          Recusar: { bg: 'FFF8D7DA', text: 'FF721C24' },
          Recusado: { bg: 'FFD6D6D6', text: 'FF1B1E21' },
          Cancelado: { bg: 'FFE2E3E5', text: 'FF383D41' },
          Contestado: { bg: 'FF8B1538', text: 'FFFFFFFF' },
          Marcação: { bg: 'FFF3E5F5', text: 'FF7B1FA2' },
          'Não agendado': { bg: 'FFE0F7FA', text: 'FF006064' },
        }
        const defaultStatusColor = { bg: 'FFE2E3E5', text: 'FF383D41' }
        const estoqueNome = this.selectedEstoque
          ? this.selectedEstoque.name || ''
          : ''
        const estoqueCnpj = this.selectedEstoque
          ? this.formatCNPJ(this.selectedEstoque.cnpj)
          : ''
        const estoqueTexto =
          estoqueNome || estoqueCnpj
            ? `Estoque: ${estoqueNome || '—'}  |  CNPJ: ${estoqueCnpj || '—'}`
            : 'Estoque: —'

        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Portal Mercocamp'
        const worksheet = workbook.addWorksheet('Conferência NF-e', {
          properties: { defaultRowHeight: 18 },
        })

        const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
        const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }
        const lightBlueFill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' },
        }

        // Linha 1: Título
        worksheet.mergeCells(1, 1, 1, numCols)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'CONFERÊNCIA EM LOTE'
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

        // Linha 2: Subtítulo
        worksheet.mergeCells(2, 1, 2, numCols)
        const subtitleCell = worksheet.getCell('A2')
        subtitleCell.value = 'Portal de Agendamento - Grupo Mercocamp'
        subtitleCell.font = {
          bold: true,
          size: 11,
          color: { argb: 'FFFFFFFF' },
        }
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

        // Linha 3: vazia
        worksheet.getRow(3).height = 10

        // Linha 4: Estoque (informação fixa acima da tabela)
        worksheet.mergeCells(4, 1, 4, numCols)
        const estoqueCell = worksheet.getCell('A4')
        estoqueCell.value = estoqueTexto
        estoqueCell.font = { bold: true, size: 10 }
        estoqueCell.fill = lightBlueFill
        estoqueCell.alignment = { horizontal: 'left', vertical: 'middle' }
        estoqueCell.border = {
          left: thinBorder,
          top: thinBorder,
          right: thinBorder,
          bottom: thinBorder,
        }
        worksheet.getRow(4).height = 22

        // Linha 5: vazia
        worksheet.getRow(5).height = 10

        // Linha 6: Cabeçalhos da tabela
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
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = {
            top: mediumBorder,
            bottom: mediumBorder,
            left: thinBorder,
            right: thinBorder,
          }
        })
        headerRow.height = 22

        // Dados da tabela (a partir da linha 7)
        let currentRow = 7
        this.results.forEach((row, rowIndex) => {
          const excelRow = worksheet.getRow(currentRow)
          const isFirstRow = rowIndex === 0
          const isLastRow = rowIndex === this.results.length - 1
          const statusLabel =
            row.chosenSchedule && row.chosenSchedule.status
              ? this.getStatusBadge(row.chosenSchedule.status).label
              : '—'
          const rowData = [
            row.nfeDisplay || '',
            row.nfeKey && row.nfeKey.length === 44 ? row.nfeKey : '',
            row.scheduleLabel || '',
            statusLabel,
            row.corpemLabel || '',
          ]
          const statusRaw =
            row.chosenSchedule && row.chosenSchedule.status
              ? row.chosenSchedule.status
              : null
          const scheduleNotFound = row.scheduleLabel === 'Não encontrado!'
          const corpemNotFound = row.corpemLabel === 'Não encontrado!'
          const isOldSystemRow = scheduleNotFound || corpemNotFound
          const redFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCDD2' },
          }
          rowData.forEach((value, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1)
            cell.value = value
            const isStatusCol = colIndex === 3
            const statusColor =
              isStatusCol && statusRaw
                ? statusColors[statusRaw] || defaultStatusColor
                : null
            if (isStatusCol) {
              const sc = statusColor || defaultStatusColor
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: sc.bg },
              }
              cell.font = {
                size: 10,
                color: { argb: sc.text },
                bold: !!statusRaw,
              }
            } else {
              const useRed = isOldSystemRow
              cell.font = {
                size: 10,
                color: useRed ? { argb: 'FFB71C1C' } : undefined,
              }
              cell.fill = useRed ? redFill : undefined
            }
            cell.alignment = {
              horizontal: colIndex === 0 ? 'left' : 'center',
              vertical: 'middle',
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
          excelRow.height = 18
          currentRow++
        })

        // Rodapé
        currentRow++
        const now = new Date()
        const dataHoraCriacao = now.toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const footerCell1 = worksheet.getCell(currentRow, 1)
        footerCell1.value = `Arquivo gerado no dia ${dataHoraCriacao} pelo Portal de Agendamento do Grupo Mercocamp`
        footerCell1.font = {
          italic: true,
          size: 9,
          color: { argb: 'FF757575' },
        }
        footerCell1.alignment = { horizontal: 'center', vertical: 'middle' }
        footerCell1.border = {
          top: thinBorder,
          left: thinBorder,
          right: thinBorder,
        }
        worksheet.getRow(currentRow).height = 18
        currentRow++

        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const footerCell2 = worksheet.getCell(currentRow, 1)
        footerCell2.value = {
          text: 'https://recebimento.mercocamptech.com.br/',
          hyperlink: 'https://recebimento.mercocamptech.com.br/',
        }
        footerCell2.font = {
          italic: true,
          size: 9,
          color: { argb: 'FF1976D2' },
          underline: true,
        }
        footerCell2.alignment = { horizontal: 'center', vertical: 'middle' }
        footerCell2.border = {
          left: thinBorder,
          right: thinBorder,
          bottom: thinBorder,
        }
        worksheet.getRow(currentRow).height = 18

        worksheet.getColumn(1).width = 18
        worksheet.getColumn(2).width = 48
        worksheet.getColumn(3).width = 22
        worksheet.getColumn(4).width = 22
        worksheet.getColumn(5).width = 22

        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
        const fileName = `Conferencia_NFe_portal_mercocamp_${dateStr}.xlsx`
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)
        this.$emit(
          'notification',
          `Exportação concluída: ${fileName}`,
          'success'
        )
      } catch (err) {
        console.error('Erro ao exportar para Excel:', err)
        this.$emit(
          'notification',
          'Erro ao exportar para Excel. Tente novamente.',
          'error'
        )
      }
    },
    /** Classe da linha: amarelo = só agendamento; laranja = só integração; vermelho = nenhum; vermelho piscante = agendamento sem WJT e sem payload CorpEM */
    getRowStatusClass(row) {
      const scheduleFound = row.scheduleLabel !== 'Não encontrado!'
      const integrationFound = row.corpemLabel !== 'Não encontrado!'
      if (row.needsCorpemAttention) return 'row-status-missing-corpem'
      if (!scheduleFound && !integrationFound) return 'row-status-none'
      if (scheduleFound && !integrationFound)
        return 'row-status-agendamento-only'
      if (!scheduleFound && integrationFound)
        return 'row-status-integration-only'
      return ''
    },
    /** Badge de status do agendamento (mesmo mapeamento do portal de agendamento). */
    getStatusBadge(status) {
      const statusConfig = {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        Conferência: { class: 'success', label: 'Em conferência' },
        Recebido: { class: 'success', label: 'Em conferência' },
        Tratativa: { class: 'danger', label: 'Em tratativa' },
        'Em estoque': { class: 'success', label: 'Em estoque' },
        Estoque: { class: 'success', label: 'Em estoque' },
        Recusar: { class: 'danger', label: 'Recusar' },
        Cancelar: { class: 'warning', label: 'Cancelar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
        Marcação: { class: 'booking', label: 'Marcação' },
        'Não agendado': { class: 'not-scheduled', label: 'Não agendado' },
      }
      return (
        statusConfig[status] || { class: 'secondary', label: status || '—' }
      )
    },
  },
}
</script>

<style scoped>
.conferencia-lote-page {
  padding: 1.5rem;
  max-width: 100%;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-title i {
  color: #4299e1;
}

.page-subtitle {
  color: #718096;
  margin: 0;
  font-size: 0.95rem;
}

.conferencia-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}

.filters-row .form-group {
  margin-bottom: 0;
}

.filters-row label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 500;
  color: #4a5568;
}

.estoque-group .estoque-btn {
  min-width: 220px;
  max-width: 320px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.estoque-group .estoque-btn-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.nfe-group {
  flex: 1;
  min-width: 200px;
}

.btn-group .btn-consultar,
.btn-group .btn-importar {
  min-width: 120px;
}

.btn-group .btn-importar {
  margin-left: 0.25rem;
}

/* Input de arquivo totalmente oculto – apenas o botão "Importar" abre o seletor */
.import-file-input-hidden {
  position: absolute !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}

.export-row {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.export-row .btn-export,
.export-row .btn-em-conferencia {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.export-row .btn-em-conferencia:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.table-section {
  overflow-x: auto;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
}

.result-table th,
.result-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.result-table th {
  background: #f7fafc;
  font-weight: 600;
  color: #4a5568;
}

.col-check {
  width: 40px;
  text-align: center;
}
.col-numero {
  min-width: 140px;
}
.col-agendamento {
  min-width: 160px;
}
.col-status {
  min-width: 160px;
}
.result-table th.col-status {
  text-align: center;
}
.result-table td.col-status {
  padding: 0.5rem 0.75rem;
  vertical-align: middle;
  text-align: center;
}
.result-table td.col-status .status-badge {
  display: block;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}
.col-corpem {
  min-width: 160px;
}
.col-acao {
  width: 70px;
  text-align: center;
}

/* Cor de fundo da linha conforme resultado */
.result-row.row-status-agendamento-only {
  background-color: #fefcbf;
}
.result-row.row-status-integration-only {
  background-color: #feebc8;
}
.result-row.row-status-none {
  background-color: #fff;
}

/* Agendamento encontrado mas sem integração WJT e sem payload CorpEM (Pronta Integração) – fundo vermelho piscante */
.result-row.row-status-missing-corpem {
  background-color: #fed7d7;
  animation: pulse-bg-red 2s ease-in-out infinite;
}

@keyframes pulse-bg-red {
  0%,
  100% {
    background-color: #fed7d7;
  }
  50% {
    background-color: #feb2b2;
  }
}

/* Badges de status do agendamento (mesmas cores do portal) */
.result-table .status-badge {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.3;
  min-height: 1.75rem;
  box-sizing: border-box;
}
.result-table .status-badge.primary {
  background: #cce5ff;
  color: #004085;
}
.result-table .status-badge.success {
  background: #d4edda;
  color: #155724;
}
.result-table .status-badge.warning {
  background: #fff3cd;
  color: #856404;
}
.result-table .status-badge.danger {
  background: #f8d7da;
  color: #721c24;
}
.result-table .status-badge.secondary {
  background: #e2e3e5;
  color: #383d41;
}
.result-table .status-badge.dark {
  background: #d6d6d6;
  color: #1b1e21;
}
.result-table .status-badge.contestado {
  background: #8b1538;
  color: #fff;
}
.result-table .status-badge.booking {
  background: #f3e5f5;
  color: #7b1fa2;
}
.result-table .status-badge.not-scheduled {
  background: #e0f7fa;
  color: #006064;
}

.badge-not-found {
  background: #fc8181;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.btn-remove {
  color: #e53e3e;
  background: transparent;
  border: none;
  padding: 0.35rem;
}

.btn-remove:hover {
  color: #c53030;
  background: #fed7d7;
  border-radius: 6px;
}

.empty-row td {
  padding: 2rem;
  text-align: center;
}

/* Modal estoque */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: #718096;
  cursor: pointer;
  border-radius: 8px;
}

.modal-close-btn:hover {
  background: #edf2f7;
  color: #2d3748;
}

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.search-input {
  margin-bottom: 0.75rem;
}

.estoque-lista {
  max-height: 320px;
  overflow-y: auto;
}

.estoque-item {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.estoque-item:hover {
  background: #edf2f7;
}

.estoque-nome {
  display: block;
  font-weight: 500;
  color: #2d3748;
}

.estoque-cnpj {
  display: block;
  font-size: 0.85rem;
  color: #718096;
}

.loading-container {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.pick-modal .pick-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pick-modal .pick-item {
  text-align: left;
  justify-content: flex-start;
}

.em-conferencia-modal {
  max-width: 520px;
}

.em-conferencia-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  max-height: 280px;
  overflow-y: auto;
}

.em-conferencia-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

.em-conferencia-item.pending {
  background: #f7fafc;
  color: #718096;
}

.em-conferencia-item.running {
  background: #ebf8ff;
  border-color: #4299e1;
  color: #2b6cb0;
}

.em-conferencia-item.success {
  background: #f0fff4;
  border-color: #48bb78;
  color: #276749;
}

.em-conferencia-item.ignored {
  background: #fafafa;
  border-color: #cbd5e0;
  color: #718096;
}

.em-conferencia-item.error {
  background: #fff5f5;
  border-color: #fc8181;
  color: #c53030;
}

.em-conferencia-numero {
  font-weight: 500;
}

.em-conferencia-result {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.em-conferencia-progress,
.em-conferencia-done {
  padding: 0.75rem 0;
  text-align: center;
  color: #4a5568;
  font-size: 0.9rem;
}

.em-conferencia-done .btn {
  margin-top: 0.5rem;
}

.modal-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mt-1 {
  margin-top: 0.5rem;
}

/* Botão Inserir em uma carga */
.btn-inserir-carga {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-inserir-carga:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Modal Inserir em uma carga – 98% do display */
.inserir-carga-overlay {
  padding: 1vh 1vw;
}

.inserir-carga-modal {
  max-width: 98vw !important;
  width: 98vw;
  max-height: 98vh;
  height: 98vh;
}

.inserir-carga-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

/* Grid de cargas */
.cargas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 0.5rem 0;
}

.carga-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.carga-card:hover {
  border-color: #4299e1;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
  transform: translateY(-2px);
}

.carga-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #edf2f7;
}

.carga-id {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2d3748;
}

.carga-status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.carga-status-aguardando {
  background: #fff3cd;
  color: #856404;
}

.carga-status-docar {
  background: #cce5ff;
  color: #004085;
}

.carga-status-enviado {
  background: #d4edda;
  color: #155724;
}

.carga-status-recusado {
  background: #f8d7da;
  color: #721c24;
}

.carga-status-cancelada {
  background: #e2e3e5;
  color: #383d41;
}

.carga-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.carga-info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #4a5568;
}

.carga-info-row i {
  color: #a0aec0;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.carga-plate-sep {
  color: #cbd5e0;
  font-size: 0.75rem;
}

.carga-obs-row {
  align-items: flex-start;
  margin-top: 0.15rem;
}

.carga-obs-text {
  font-size: 0.8rem;
  color: #718096;
  line-height: 1.3;
}

/* Processando inserção */
.inserir-carga-processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #4a5568;
  text-align: center;
}

/* Resultado da inserção */
.inserir-carga-result {
  padding: 1rem;
}

.inserir-carga-result-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.inserir-carga-result-header h4 {
  margin: 0.5rem 0 0.25rem;
  color: #2d3748;
}

.inserir-carga-result-header p {
  color: #718096;
  margin: 0;
}

.inserir-carga-result-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
}

.stat-item .stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-item .stat-label {
  display: block;
  font-size: 0.85rem;
  color: #718096;
}

.stat-created {
  background: #f0fff4;
  color: #276749;
}

.stat-existing {
  background: #ebf8ff;
  color: #2b6cb0;
}

.stat-error {
  background: #fff5f5;
  color: #c53030;
}

.inserir-carga-result-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  max-height: 50vh;
  overflow-y: auto;
}

.inserir-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
}

.inserir-result-item.created {
  background: #f0fff4;
  border-color: #48bb78;
  color: #276749;
}

.inserir-result-item.existing {
  background: #ebf8ff;
  border-color: #4299e1;
  color: #2b6cb0;
}

.inserir-result-item.error {
  background: #fff5f5;
  border-color: #fc8181;
  color: #c53030;
}

.inserir-result-key {
  font-weight: 600;
}

.inserir-result-msg {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.inserir-carga-result-actions {
  text-align: center;
  padding-top: 0.5rem;
}
</style>
