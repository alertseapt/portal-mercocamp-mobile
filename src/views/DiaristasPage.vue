<template>
  <div class="diaristas-page">
    <div class="page-header">
      <h1 class="page-title">
        <i class="fas fa-user-cog"></i>
        Diaristas
      </h1>
      <p class="page-subtitle">Cadastro e gestão de diaristas</p>
    </div>

    <div class="diaristas-tabs">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'info' }"
        @click="activeTab = 'info'"
      >
        <i class="fas fa-info-circle"></i>
        Info
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'cadastro' }"
        @click="activeTab = 'cadastro'"
      >
        <i class="fas fa-user-plus"></i>
        Cadastro Diarista
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'registro' }"
        @click="activeTab = 'registro'"
      >
        <i class="fas fa-calendar-check"></i>
        Registro
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'historico' }"
        @click="switchToHistorico"
      >
        <i class="fas fa-history"></i>
        Histórico
      </button>
    </div>

    <div v-if="activeTab === 'info'" class="tab-content">
      <div class="info-card">
        <h2 class="form-title">
          <i class="fas fa-info-circle"></i>
          Diárias não pagas
        </h2>
        <div v-if="loadingUnpaidStats" class="info-stats-loading">
          <i class="fas fa-spinner fa-spin"></i> Carregando...
        </div>
        <div v-else-if="unpaidStatsError" class="info-stats-error">
          <p>
            Não foi possível carregar os dados. Verifique se o back-end expõe o
            endpoint de estatísticas (veja documentação abaixo).
          </p>
          <details class="info-stats-details">
            <summary>Atualização necessária no back-end</summary>
            <div class="info-stats-doc">
              <p>
                <strong>1. Coluna <code>payment</code></strong> na tabela
                <code>maintenance_daily_worked</code>: tipo DATE, nullable.
                Quando preenchida, indica a data do pagamento da diária; quando
                NULL, a diária ainda não foi paga.
              </p>
              <p>
                <strong>2. Endpoint:</strong>
                <code>GET /api/maintenance/daily-workers/unpaid-stats</code>
              </p>
              <p>
                <strong>Resposta (200):</strong>
                <code
                  >{ "unpaidCount": number, "unpaidTotal": "XXXXXXXX" }</code
                >
                — <code>unpaidCount</code> = quantidade de registros onde
                <code>payment IS NULL</code>; <code>unpaidTotal</code> = soma do
                campo <code>value</code> (string 8 dígitos: 6 reais + 2
                centavos).
              </p>
            </div>
          </details>
        </div>
        <div v-else class="info-stats-container info-stats-single">
          <span class="info-stat-value info-stat-count"
            >{{ unpaidStats.count }} Diárias</span
          >
          <span class="info-stat-value info-stat-total"
            >Valor total R$ {{ formatUnpaidTotalDisplay() }}</span
          >
        </div>
        <div
          v-if="!loadingUnpaidStats && !unpaidStatsError"
          class="info-detalhes-row"
        >
          <button
            type="button"
            class="btn btn-outline-primary btn-detalhes"
            :disabled="unpaidStats.count === 0"
            @click="openModalDetalhesUnpaid"
          >
            <i class="fas fa-list"></i>
            Detalhes
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'cadastro'" class="tab-content">
      <div class="cadastro-form-card">
        <h2 class="form-title">
          <i class="fas fa-user-plus"></i>
          Cadastrar Diarista
        </h2>
        <form @submit.prevent="submitCadastro" class="cadastro-form">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome</label>
              <input
                id="nome"
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="Nome completo"
                required
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="cpf">CPF</label>
              <input
                id="cpf"
                v-model="form.cpf"
                type="text"
                class="form-control"
                placeholder="000.000.000-00"
                maxlength="14"
                @input="formatCpfInput"
                required
              />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ saving ? 'Salvando...' : 'Cadastrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="activeTab === 'registro'" class="tab-content">
      <div class="registro-card">
        <h2 class="form-title">
          <i class="fas fa-calendar-check"></i>
          Registro de Diaristas
        </h2>

        <div class="registro-form">
          <div class="form-row dates-row">
            <div class="form-group">
              <label for="data-de">Data de</label>
              <input
                id="data-de"
                v-model="registroForm.dataDe"
                type="date"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="data-ate">Data até</label>
              <input
                id="data-ate"
                v-model="registroForm.dataAte"
                type="date"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-row valor-row">
            <div class="form-group valor-wrapper">
              <label for="valor-diarista">Valor (R$) a ser pago por dia</label>
              <input
                id="valor-diarista"
                ref="valorInput"
                type="text"
                class="form-control valor-input-financeiro"
                placeholder="0,00"
                inputmode="numeric"
                autocomplete="off"
                :value="formatValorDisplay()"
                @keydown="onValorKeydown"
                @paste.prevent="onValorPaste"
              />
            </div>
          </div>

          <div class="form-row add-diaristas-row">
            <div class="form-group">
              <label>Diaristas no registro</label>
              <button
                type="button"
                class="btn btn-primary btn-open-modal-diaristas"
                @click="openModalSelecaoDiaristas"
              >
                <i class="fas fa-user-plus"></i>
                Adicionar diaristas
              </button>
            </div>
          </div>

          <div class="form-row lista-row">
            <div class="form-group lista-group">
              <label>Diaristas selecionados</label>
              <div class="lista-diaristas">
                <div
                  v-for="(item, index) in listaSelecionados"
                  :key="item.id + '-' + index"
                  class="lista-item"
                >
                  <span class="lista-item-name">{{ item.name }}</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-remove"
                    title="Remover"
                    @click="removeFromLista(index)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-if="listaSelecionados.length === 0" class="lista-empty">
                  Nenhum diarista adicionado. Clique em "Adicionar diaristas"
                  para selecionar.
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions registro-actions">
            <button
              type="button"
              class="btn btn-outline-secondary btn-obs"
              title="Definir observação para os registros"
              @click="openModalObs"
            >
              <i class="fas fa-sticky-note"></i>
              OBS
            </button>
            <button
              type="button"
              class="btn btn-primary btn-confirm"
              :disabled="
                savingRegistro ||
                listaSelecionados.length === 0 ||
                !registroForm.dataDe ||
                !registroForm.dataAte
              "
              @click="confirmarRegistro"
            >
              <i v-if="savingRegistro" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-check-circle"></i>
              {{ savingRegistro ? 'Salvando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'historico'" class="tab-content">
      <div class="historico-card">
        <h2 class="form-title">
          <i class="fas fa-history"></i>
          Histórico de diárias (ano atual)
        </h2>
        <div v-if="loadingHistorico" class="historico-loading">
          <i class="fas fa-spinner fa-spin"></i> Carregando...
        </div>
        <div v-else-if="historicoError" class="historico-error">
          Não foi possível carregar o histórico.
        </div>
        <div
          v-else-if="Object.keys(historicoGroupedByDate).length === 0"
          class="historico-empty"
        >
          Nenhuma diária no ano atual.
        </div>
        <div v-else class="historico-list">
          <section
            v-for="(items, date) in historicoGroupedByDate"
            :key="'h-' + date"
            class="historico-day-block"
          >
            <h4 class="historico-day-title">{{ formatDateDetalhes(date) }}</h4>
            <ul class="historico-day-items">
              <li
                v-for="(item, idx) in items"
                :key="historicoItemKey(item, date, idx)"
                class="historico-day-item"
                :class="{ 'historico-row-unpaid': isHistoricoItemUnpaid(item) }"
              >
                <label class="historico-day-item-row">
                  <input
                    type="checkbox"
                    class="historico-day-item-checkbox"
                    :checked="isHistoricoItemSelected(item)"
                    :disabled="isHistoricoItemDisabled(item)"
                    @change="onToggleHistoricoItem(item)"
                  />
                  <span class="historico-day-item-name">{{
                    item.worker_name
                  }}</span>
                  <span class="historico-day-item-value"
                    >R$ {{ formatValueDetalhes(item.value) }}</span
                  >
                </label>
                <p v-if="item.obs" class="historico-day-item-obs">
                  {{ item.obs }}
                </p>
              </li>
            </ul>
          </section>
        </div>
        <div
          v-if="
            !loadingHistorico &&
            !historicoError &&
            Object.keys(historicoGroupedByDate).length > 0
          "
          class="historico-actions"
        >
          <button
            type="button"
            class="btn btn-primary btn-imprimir-historico"
            :disabled="historicoSelectedIds.length === 0"
            @click="imprimirHistorico"
          >
            <i class="fas fa-print"></i>
            Imprimir
          </button>
        </div>
      </div>
    </div>

    <!-- Modal OBS – observação para os registros de diárias -->
    <Teleport to="body">
      <div
        v-if="showModalObs"
        class="modal-obs-overlay"
        @click.self="closeModalObs"
      >
        <div class="modal-obs-box">
          <div class="modal-obs-header">
            <h3 class="modal-obs-title">
              <i class="fas fa-sticky-note"></i>
              Observação para o registro
            </h3>
            <button
              type="button"
              class="modal-obs-close"
              title="Fechar"
              @click="closeModalObs"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-obs-body">
            <label for="modal-obs-input" class="modal-obs-label"
              >Observação (máx. 200 caracteres)</label
            >
            <textarea
              id="modal-obs-input"
              ref="modalObsInput"
              v-model="registroForm.obs"
              class="modal-obs-textarea form-control"
              placeholder="Ex.: Serviço extra, local, etc."
              maxlength="200"
              rows="4"
              autocomplete="off"
              @focus="onModalObsInputFocus"
            />
            <span class="modal-obs-char-count"
              >{{ (registroForm.obs || '').length }}/200</span
            >
          </div>
          <div class="modal-obs-footer">
            <button
              type="button"
              class="btn btn-primary"
              @click="closeModalObs"
            >
              <i class="fas fa-check"></i>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de seleção de diaristas (98% da página, acima do botão da sidebar) -->
    <Teleport to="body">
      <div
        v-if="showModalSelecaoDiaristas"
        class="modal-selecao-diaristas-overlay"
        @click.self="closeModalSelecaoDiaristas"
      >
        <div class="modal-selecao-diaristas-box">
          <div class="modal-selecao-diaristas-header">
            <h3 class="modal-selecao-diaristas-title">
              <i class="fas fa-users"></i>
              Selecionar diaristas
            </h3>
            <button
              type="button"
              class="modal-selecao-diaristas-close"
              title="Fechar"
              @click="closeModalSelecaoDiaristas"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-selecao-diaristas-search">
            <input
              v-model="modalSearchQuery"
              type="text"
              class="form-control"
              placeholder="Buscar por nome..."
              autocomplete="off"
            />
          </div>
          <div class="modal-selecao-diaristas-list">
            <div
              v-if="loadingModalWorkers"
              class="modal-selecao-diaristas-loading"
            >
              <i class="fas fa-spinner fa-spin"></i> Carregando...
            </div>
            <div
              v-else-if="filteredWorkersForModal.length === 0"
              class="modal-selecao-diaristas-empty"
            >
              Nenhum diarista encontrado.
            </div>
            <label
              v-for="worker in filteredWorkersForModal"
              :key="worker.id"
              class="modal-selecao-diaristas-item"
            >
              <input
                v-model="modalCheckedIds"
                type="checkbox"
                :value="worker.id"
                class="modal-selecao-diaristas-checkbox"
              />
              <span class="modal-selecao-diaristas-item-name">{{
                worker.name
              }}</span>
              <span
                v-if="worker.cpf"
                class="modal-selecao-diaristas-item-cpf"
                >{{ formatCpfDisplay(worker.cpf) }}</span
              >
            </label>
          </div>
          <div class="modal-selecao-diaristas-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="closeModalSelecaoDiaristas"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="modalCheckedIds.length === 0"
              @click="confirmarSelecaoModalDiaristas"
            >
              <i class="fas fa-check"></i>
              Adicionar selecionados
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Detalhes – diárias não pagas por dia (98% da área visível) -->
    <Teleport to="body">
      <div
        v-if="showModalDetalhesUnpaid"
        class="modal-detalhes-unpaid-overlay"
        @click.self="closeModalDetalhesUnpaid"
      >
        <div class="modal-detalhes-unpaid-box">
          <div class="modal-detalhes-unpaid-header">
            <h3 class="modal-detalhes-unpaid-title">
              <i class="fas fa-list-alt"></i>
              Detalhes
            </h3>
            <button
              type="button"
              class="modal-detalhes-unpaid-close"
              title="Fechar"
              @click="closeModalDetalhesUnpaid"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-detalhes-unpaid-body">
            <div
              v-if="loadingUnpaidDetails"
              class="modal-detalhes-unpaid-loading"
            >
              <i class="fas fa-spinner fa-spin"></i> Carregando...
            </div>
            <div
              v-else-if="unpaidDetailsError"
              class="modal-detalhes-unpaid-error"
            >
              Não foi possível carregar os detalhes.
            </div>
            <div
              v-else-if="Object.keys(groupedUnpaidByDate).length === 0"
              class="modal-detalhes-unpaid-empty"
            >
              Nenhuma diária não paga.
            </div>
            <div v-else class="modal-detalhes-unpaid-list">
              <section
                v-for="(items, date) in groupedUnpaidByDate"
                :key="date"
                class="detalhes-day-block"
              >
                <h4 class="detalhes-day-title">
                  {{ formatDateDetalhes(date) }}
                </h4>
                <ul class="detalhes-day-items">
                  <li
                    v-for="(item, idx) in items"
                    :key="unpaidItemKey(item, date, idx)"
                    class="detalhes-day-item"
                  >
                    <label class="detalhes-day-item-row">
                      <input
                        type="checkbox"
                        class="detalhes-day-item-checkbox"
                        :checked="isUnpaidRecordSelected(item)"
                        :disabled="isUnpaidRecordDisabled(item)"
                        @change="onToggleUnpaidItem(item)"
                      />
                      <span class="detalhes-day-item-name">{{
                        item.worker_name
                      }}</span>
                      <span class="detalhes-day-item-value"
                        >R$ {{ formatValueDetalhes(item.value) }}</span
                      >
                    </label>
                    <p v-if="item.obs" class="detalhes-day-item-obs">
                      {{ item.obs }}
                    </p>
                  </li>
                </ul>
              </section>
            </div>
          </div>
          <div class="modal-detalhes-unpaid-footer">
            <button
              type="button"
              class="btn btn-primary btn-pagar-detalhes"
              :disabled="selectedUnpaidRecordIds.length === 0 || payingUnpaid"
              @click="pagarUnpaidSelected"
            >
              <i v-if="payingUnpaid" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-check-circle"></i>
              {{ payingUnpaid ? 'Processando...' : 'Pagar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { jsPDF } from 'jspdf'
import { BASE_URL } from '../config/api.js'
import { valorPorExtenso } from '../utils/valorPorExtenso.js'

export default {
  name: 'DiaristasPage',

  emits: ['notification'],

  data() {
    return {
      activeTab: 'info',
      form: {
        name: '',
        cpf: '',
      },
      saving: false,

      // Aba Registro (datas iniciais = data atual local)
      registroForm: (() => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const today = `${y}-${m}-${day}`
        return { dataDe: today, dataAte: today, obs: '' }
      })(),
      dailyWorkersCache: [], // Lista de diaristas (modal e carga inicial)
      listaSelecionados: [], // Diaristas selecionados para o registro
      valorReais: '', // Até 8 dígitos: 6 reais + 2 centavos (preenchimento direita→esquerda)
      savingRegistro: false,
      // Modal de seleção de diaristas
      showModalSelecaoDiaristas: false,
      // Modal OBS (observação para registro de diárias)
      showModalObs: false,
      modalSearchQuery: '',
      modalCheckedIds: [], // IDs marcados no modal (array para v-model dos checkboxes)
      loadingModalWorkers: false,
      // Aba Info: diárias não pagas (payment IS NULL)
      unpaidStats: { count: 0, total: '00000000' },
      loadingUnpaidStats: false,
      unpaidStatsError: false,
      unpaidStatsIntervalId: null, // intervalo de atualização automática na aba Info
      showModalDetalhesUnpaid: false,
      unpaidDetailsList: [],
      loadingUnpaidDetails: false,
      unpaidDetailsError: false,
      /** Diarista (worker_id) cujo as diárias estão selecionadas; null = nenhuma seleção. */
      selectedWorkerId: null,
      /** IDs dos registros (maintenance_daily_worked.id) selecionados – apenas do mesmo diarista. */
      selectedUnpaidRecordIds: [],
      payingUnpaid: false,
      // Aba Histórico: diárias do ano atual (unpaid-details filtrado), só leitura + Imprimir PDF
      historicoList: [],
      historicoSelectedWorkerId: null,
      historicoSelectedIds: [],
      loadingHistorico: false,
      historicoError: false,
    }
  },

  computed: {
    groupedUnpaidByDate() {
      const list = this.unpaidDetailsList || []
      const byDate = {}
      for (const item of list) {
        const raw = item.date != null ? String(item.date) : ''
        const d = raw.slice(0, 10)
        if (!d) continue
        if (!byDate[d]) byDate[d] = []
        byDate[d].push(item)
      }
      const sorted = {}
      Object.keys(byDate)
        .sort((a, b) => b.localeCompare(a))
        .forEach(date => {
          sorted[date] = byDate[date]
        })
      return sorted
    },
    valorReaisPadded() {
      const s = String(this.valorReais).replace(/\D/g, '').slice(-8)
      return s.padStart(8, '0')
    },
    filteredWorkersForModal() {
      const q = this.modalSearchQuery.trim().toLowerCase()
      if (!q) return this.dailyWorkersCache
      return this.dailyWorkersCache.filter(w =>
        (w.name || '').toLowerCase().includes(q)
      )
    },
    /** Itens de diárias não pagas atualmente selecionados (para recibo). */
    selectedUnpaidItems() {
      const list = this.unpaidDetailsList || []
      const ids = this.selectedUnpaidRecordIds || []
      if (ids.length === 0) return []
      return list.filter(item => {
        const id = this.unpaidItemId(item)
        return id != null && ids.includes(id)
      })
    },
    /** Ano atual para filtro da aba Histórico. */
    currentYear() {
      return String(new Date().getFullYear())
    },
    /** Agrupado por data (worked-details já retorna só o ano atual). */
    historicoGroupedByDate() {
      const list = this.historicoList || []
      const byDate = {}
      for (const item of list) {
        const raw = item.date != null ? String(item.date) : ''
        const d = raw.slice(0, 10)
        if (!d) continue
        if (!byDate[d]) byDate[d] = []
        byDate[d].push(item)
      }
      const sorted = {}
      Object.keys(byDate)
        .sort((a, b) => b.localeCompare(a))
        .forEach(date => {
          sorted[date] = byDate[date]
        })
      return sorted
    },
    /** Itens selecionados na aba Histórico (para recibo). */
    historicoSelectedItems() {
      const list = this.historicoList || []
      const ids = this.historicoSelectedIds || []
      if (ids.length === 0) return []
      return list.filter(item => {
        const id = this.unpaidItemId(item)
        return id != null && ids.includes(id)
      })
    },
  },

  watch: {
    activeTab(newTab) {
      if (newTab === 'registro') {
        this.loadDailyWorkers()
      }
      if (newTab === 'info') {
        this.loadUnpaidStats()
        this.startUnpaidStatsInterval()
      } else {
        this.stopUnpaidStatsInterval()
      }
      if (newTab !== 'historico') {
        this.historicoSelectedWorkerId = null
        this.historicoSelectedIds = []
      }
    },
  },

  mounted() {
    if (this.activeTab === 'info') {
      this.loadUnpaidStats()
      this.startUnpaidStatsInterval()
    }
    this._onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && this.activeTab === 'info') {
        this.loadUnpaidStats()
      }
    }
    document.addEventListener('visibilitychange', this._onVisibilityChange)
  },

  beforeUnmount() {
    this.stopUnpaidStatsInterval()
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
    }
  },

  methods: {
    async loadDailyWorkers() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${BASE_URL}/maintenance/daily-workers`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok && Array.isArray(data)) {
          this.dailyWorkersCache = data
        } else if (response.ok && data.dailyWorkers) {
          this.dailyWorkersCache = data.dailyWorkers
        } else {
          this.dailyWorkersCache = []
        }
      } catch (err) {
        console.error('Erro ao carregar diaristas:', err)
        this.dailyWorkersCache = []
      }
    },

    async openModalSelecaoDiaristas() {
      this.showModalSelecaoDiaristas = true
      this.modalSearchQuery = ''
      this.modalCheckedIds = this.listaSelecionados.map(s => s.id)
      this.loadingModalWorkers = true
      await this.loadDailyWorkers()
      this.loadingModalWorkers = false
    },

    closeModalSelecaoDiaristas() {
      this.showModalSelecaoDiaristas = false
      this.modalSearchQuery = ''
      this.modalCheckedIds = []
    },

    openModalObs() {
      this.showModalObs = true
      this.$nextTick(() => {
        this.$refs.modalObsInput?.focus()
      })
    },

    closeModalObs() {
      this.showModalObs = false
    },

    onModalObsInputFocus() {
      // Mantém o input visível acima do teclado (mobile/tablet)
      const el = this.$refs.modalObsInput
      if (!el) return
      setTimeout(() => {
        el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }, 300)
    },

    confirmarSelecaoModalDiaristas() {
      const idsToAdd = this.modalCheckedIds
      const existingIds = new Set(this.listaSelecionados.map(s => s.id))
      for (const id of idsToAdd) {
        if (existingIds.has(id)) continue
        const worker = this.dailyWorkersCache.find(w => w.id === id)
        if (worker) {
          this.listaSelecionados.push({
            id: worker.id,
            name: worker.name,
            cpf: worker.cpf,
          })
          existingIds.add(id)
        }
      }
      this.closeModalSelecaoDiaristas()
    },

    removeFromLista(index) {
      this.listaSelecionados.splice(index, 1)
    },

    async loadUnpaidStats() {
      this.loadingUnpaidStats = true
      this.unpaidStatsError = false
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${BASE_URL}/maintenance/daily-workers/unpaid-stats`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const data = await response.json().catch(() => ({}))
        if (response.ok && data != null) {
          const count = Number(data.unpaidCount) || 0
          const total = String(data.unpaidTotal || '00000000')
            .replace(/\D/g, '')
            .slice(-8)
            .padStart(8, '0')
          this.unpaidStats = { count, total }
        } else {
          this.unpaidStatsError = true
          this.unpaidStats = { count: 0, total: '00000000' }
        }
      } catch (err) {
        console.error(
          'Erro ao carregar estatísticas de diárias não pagas:',
          err
        )
        this.unpaidStatsError = true
        this.unpaidStats = { count: 0, total: '00000000' }
      } finally {
        this.loadingUnpaidStats = false
      }
    },

    startUnpaidStatsInterval() {
      this.stopUnpaidStatsInterval()
      this.unpaidStatsIntervalId = setInterval(() => {
        if (this.activeTab === 'info') {
          this.loadUnpaidStats()
        }
      }, 60000) // a cada 60 segundos
    },

    stopUnpaidStatsInterval() {
      if (this.unpaidStatsIntervalId != null) {
        clearInterval(this.unpaidStatsIntervalId)
        this.unpaidStatsIntervalId = null
      }
    },

    async loadUnpaidDetailsOnly() {
      this.unpaidDetailsError = false
      this.loadingUnpaidDetails = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${BASE_URL}/maintenance/daily-workers/unpaid-details`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const data = await response.json().catch(() => ({}))
        if (response.ok && Array.isArray(data)) {
          this.unpaidDetailsList = data
        } else if (response.ok && data.items) {
          this.unpaidDetailsList = data.items
        } else {
          this.unpaidDetailsList = []
          if (!response.ok) this.unpaidDetailsError = true
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes de diárias não pagas:', err)
        this.unpaidDetailsList = []
        this.unpaidDetailsError = true
      } finally {
        this.loadingUnpaidDetails = false
      }
    },

    async openModalDetalhesUnpaid() {
      this.showModalDetalhesUnpaid = true
      this.selectedWorkerId = null
      this.selectedUnpaidRecordIds = []
      await this.loadUnpaidDetailsOnly()
    },

    closeModalDetalhesUnpaid() {
      this.showModalDetalhesUnpaid = false
      this.unpaidDetailsList = []
      this.unpaidDetailsError = false
      this.selectedWorkerId = null
      this.selectedUnpaidRecordIds = []
    },

    async switchToHistorico() {
      this.activeTab = 'historico'
      this.historicoSelectedWorkerId = null
      this.historicoSelectedIds = []
      await this.loadHistoricoOnly()
    },

    async loadHistoricoOnly() {
      this.historicoError = false
      this.loadingHistorico = true
      try {
        const token = localStorage.getItem('token')
        const year = new Date().getFullYear()
        const response = await fetch(
          `${BASE_URL}/maintenance/daily-workers/worked-details?year=${year}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const data = await response.json().catch(() => ({}))
        if (response.ok && Array.isArray(data)) {
          this.historicoList = data
        } else if (response.ok && data.items) {
          this.historicoList = data.items
        } else {
          this.historicoList = []
          if (!response.ok) this.historicoError = true
        }
      } catch (err) {
        console.error('Erro ao carregar histórico:', err)
        this.historicoList = []
        this.historicoError = true
      } finally {
        this.loadingHistorico = false
      }
    },

    historicoItemKey(item, date, idx) {
      return this.unpaidItemKey(item, date, idx)
    },
    isHistoricoItemSelected(item) {
      const id = this.unpaidItemId(item)
      return id != null && this.historicoSelectedIds.includes(id)
    },
    isHistoricoItemDisabled(item) {
      const workerId = this.unpaidItemWorkerId(item)
      if (this.historicoSelectedWorkerId == null) return false
      return workerId !== this.historicoSelectedWorkerId
    },
    /** Diária não paga: payment é null ou ausente. */
    isHistoricoItemUnpaid(item) {
      return item != null && (item.payment == null || item.payment === '')
    },
    onToggleHistoricoItem(item) {
      const id = this.unpaidItemId(item)
      const workerId = this.unpaidItemWorkerId(item)
      if (id == null || workerId == null) return
      if (this.historicoSelectedIds.includes(id)) {
        this.historicoSelectedIds = this.historicoSelectedIds.filter(
          x => x !== id
        )
        if (this.historicoSelectedIds.length === 0)
          this.historicoSelectedWorkerId = null
      } else {
        if (
          this.historicoSelectedWorkerId != null &&
          this.historicoSelectedWorkerId !== workerId
        ) {
          this.emitNotification(
            'Selecione apenas diárias do mesmo diarista.',
            'warning'
          )
          return
        }
        this.historicoSelectedWorkerId = workerId
        this.historicoSelectedIds = [...this.historicoSelectedIds, id]
      }
    },

    imprimirHistorico() {
      const items = this.historicoSelectedItems
      if (items.length === 0) return
      this.generateReciboPdfFromItems(items)
    },

    /** ID numérico do registro (maintenance_daily_worked.id) para comparação consistente. */
    unpaidItemId(item) {
      if (item == null || item.id == null) return null
      const n = Number(item.id)
      return Number.isFinite(n) ? n : null
    },
    /** worker_id numérico (backend envia em unpaid-details). */
    unpaidItemWorkerId(item) {
      if (item == null || item.worker_id == null) return null
      const n = Number(item.worker_id)
      return Number.isFinite(n) ? n : null
    },
    unpaidItemKey(item, date, idx) {
      const id = this.unpaidItemId(item)
      if (id != null) return `id-${id}`
      return `${date}-${item.worker_id ?? ''}-${idx}`
    },
    isUnpaidRecordSelected(item) {
      const id = this.unpaidItemId(item)
      return id != null && this.selectedUnpaidRecordIds.includes(id)
    },
    /** Desabilita se já há seleção de outro diarista (worker_id). */
    isUnpaidRecordDisabled(item) {
      const workerId = this.unpaidItemWorkerId(item)
      if (this.selectedWorkerId == null) return false
      return workerId !== this.selectedWorkerId
    },
    onToggleUnpaidItem(item) {
      const id = this.unpaidItemId(item)
      const workerId = this.unpaidItemWorkerId(item)
      if (id == null || workerId == null) return
      if (this.selectedUnpaidRecordIds.includes(id)) {
        this.selectedUnpaidRecordIds = this.selectedUnpaidRecordIds.filter(
          x => x !== id
        )
        if (this.selectedUnpaidRecordIds.length === 0)
          this.selectedWorkerId = null
      } else {
        if (
          this.selectedWorkerId != null &&
          this.selectedWorkerId !== workerId
        ) {
          this.emitNotification(
            'Selecione apenas diárias do mesmo diarista.',
            'warning'
          )
          return
        }
        this.selectedWorkerId = workerId
        this.selectedUnpaidRecordIds = [...this.selectedUnpaidRecordIds, id]
      }
    },

    /** Dados do recibo a partir de uma lista de itens (modal Detalhes ou aba Histórico). */
    getReceiptDataFromItems(items) {
      if (!items || items.length === 0) return null
      let totalCentavos = 0
      for (const item of items) {
        const s = String(item.value || '00000000')
          .replace(/\D/g, '')
          .padStart(8, '0')
          .slice(-8)
        const reais = parseInt(s.slice(0, 6), 10)
        const cent = parseInt(s.slice(6, 8), 10)
        totalCentavos += reais * 100 + cent
      }
      const reaisTotal = Math.floor(totalCentavos / 100)
      const centavosTotal = totalCentavos % 100
      const totalValue8 =
        String(reaisTotal).padStart(6, '0').slice(-6) +
        String(centavosTotal).padStart(2, '0')
      const totalFormatted = this.formatValueDetalhes(totalValue8)
      const dates = [
        ...new Set(
          items.map(i => (i.date != null ? String(i.date).slice(0, 10) : ''))
        ),
      ]
        .filter(Boolean)
        .sort()
      const datesFormatted = dates.map(d => this.formatDateDetalhes(d))
      const first = items[0]
      const workerName = first.worker_name || 'Prestador'
      const workerCpfMasked = first.worker_cpf
        ? this.formatCpfDisplay(first.worker_cpf)
        : 'Não informado'
      const now = new Date()
      const meses = [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ]
      return {
        totalValue8,
        totalFormatted,
        valorExtenso: valorPorExtenso(totalValue8),
        workerName,
        workerCpfMasked,
        datesFormatted,
        dia: String(now.getDate()),
        mes: meses[now.getMonth()],
        ano: String(now.getFullYear()),
      }
    },

    getReceiptData() {
      return this.getReceiptDataFromItems(this.selectedUnpaidItems)
    },

    /** Gera e baixa o PDF do recibo a partir de uma lista de itens (usado pela aba Histórico ou modal). */
    generateReciboPdfFromItems(items) {
      const data = this.getReceiptDataFromItems(items)
      if (!data) return
      this._generateReciboPdfDoc(data)
    },

    /** Gera e baixa o PDF do recibo de pagamento (modal Detalhes – usa seleção atual). */
    generateReciboPdf() {
      this.generateReciboPdfFromItems(this.selectedUnpaidItems)
    },

    _generateReciboPdfDoc(data) {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const maxWidth = pageWidth - margin * 2
      const centerX = pageWidth / 2
      let y = 20
      const lineHeight = 6
      const fontSize = 11
      const justifyOpts = { align: 'justify', maxWidth }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('RECIBO DE PAGAMENTO', centerX, y, { align: 'center' })
      y += lineHeight * 2

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontSize)
      const valorExtenso = data.valorExtenso || 'valor em reais'
      const p1 = `A empresa MERCOCAMP COMÉRCIO INTERNACIONAL S/A, inscrita no CNPJ sob o nº 05.521.163/0004-86, declara ter pago nesta data a importância de R$ ${data.totalFormatted} (${valorExtenso}) ao(à) Sr(a). ${data.workerName}, portador(a) do CPF nº ${data.workerCpfMasked}.`
      const lines1 = doc.splitTextToSize(p1, maxWidth)
      doc.text(p1, margin, y, justifyOpts)
      y += lines1.length * lineHeight + lineHeight

      const datasStr = data.datesFormatted.join(', ')
      const p2 = `O referido pagamento é relativo à diária realizada no(s) dia(s) ${datasStr}, de forma eventual e autônoma, sem qualquer subordinação ou vínculo empregatício entre as partes.`
      const lines2 = doc.splitTextToSize(p2, maxWidth)
      doc.text(p2, margin, y, justifyOpts)
      y += lines2.length * lineHeight + lineHeight

      const p3 =
        'Por ser verdade, o prestador firma o presente recibo dando plena quitação pelo valor recebido.'
      const lines3 = doc.splitTextToSize(p3, maxWidth)
      doc.text(p3, margin, y, justifyOpts)
      y += lines3.length * lineHeight + lineHeight * 2

      y += lineHeight * 2
      const lineLen = 90
      doc.setDrawColor(0, 0, 0)
      doc.line(centerX - lineLen / 2, y, centerX + lineLen / 2, y)
      y += lineHeight * 1.5
      doc.setFontSize(9)
      doc.text('Representante da empresa', centerX, y, { align: 'center' })
      y += lineHeight * 3.5
      doc.line(centerX - lineLen / 2, y, centerX + lineLen / 2, y)
      y += lineHeight * 1.5
      doc.text('Prestador do serviço', centerX, y, { align: 'center' })
      y += lineHeight * 2

      doc.setFontSize(fontSize)
      const p4 = `Serra - ES, ${data.dia} de ${data.mes} de ${data.ano}.`
      doc.text(p4, centerX, y, { align: 'center' })

      const safeName = (data.workerName || 'Recibo')
        .replace(/[^\w\s-]/g, '')
        .slice(0, 30)
      const dateStr = `${data.dia.padStart(2, '0')}-${data.mes.slice(0, 3)}-${data.ano}`
      doc.save(`Recibo_Pagamento_${safeName}_${dateStr}.pdf`)
    },

    async pagarUnpaidSelected() {
      if (this.selectedUnpaidRecordIds.length === 0) return
      this.generateReciboPdf()
      this.payingUnpaid = true
      try {
        const token = localStorage.getItem('token')
        let successCount = 0
        let lastError = null
        for (const recordId of this.selectedUnpaidRecordIds) {
          const response = await fetch(
            `${BASE_URL}/maintenance/daily-workers/worked/${recordId}/pay`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          const data = await response.json().catch(() => ({}))
          if (response.ok) {
            successCount += 1
          } else {
            lastError =
              data.error || data.message || 'Erro ao marcar como paga.'
          }
        }
        if (successCount > 0) {
          this.emitNotification(
            successCount === 1
              ? 'Diária marcada como paga.'
              : `${successCount} diárias marcadas como pagas.`,
            'success'
          )
          this.selectedWorkerId = null
          this.selectedUnpaidRecordIds = []
          await this.loadUnpaidStats()
          await this.loadUnpaidDetailsOnly()
        }
        if (lastError) {
          this.emitNotification(lastError, 'error')
        }
      } catch (err) {
        console.error('Erro ao pagar diária:', err)
        this.emitNotification('Erro de conexão. Tente novamente.', 'error')
      } finally {
        this.payingUnpaid = false
      }
    },

    formatDateDetalhes(dateStr) {
      if (!dateStr || dateStr.length < 10) return dateStr
      const [y, m, d] = dateStr.slice(0, 10).split('-')
      return `${d}/${m}/${y}`
    },

    formatValueDetalhes(valueStr) {
      const s = String(valueStr || '00000000')
        .replace(/\D/g, '')
        .padStart(8, '0')
      if (s === '00000000') return '0,00'
      const reais = s.slice(0, 6).replace(/^0+/, '') || '0'
      const centavos = s.slice(6, 8)
      const reaisFormat = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return `${reaisFormat},${centavos}`
    },

    /** Formata valor 8 dígitos (6 reais + 2 centavos) para exibição em reais. */
    formatUnpaidTotalDisplay() {
      const padded = this.unpaidStats?.total || '00000000'
      const s = String(padded).replace(/\D/g, '').padStart(8, '0')
      if (s === '00000000') return '0,00'
      const reais = s.slice(0, 6).replace(/^0+/, '') || '0'
      const centavos = s.slice(6, 8)
      const reaisFormat = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return `${reaisFormat},${centavos}`
    },

    formatCpfDisplay(cpf) {
      if (!cpf) return ''
      const s = String(cpf).replace(/\D/g, '')
      if (s.length !== 11) return cpf
      return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    },

    /** Formata 8 dígitos como valor em reais (ex.: 12345678 → "123.456,78") */
    formatValorDisplay() {
      const padded = this.valorReaisPadded
      if (!padded || padded === '00000000') return '0,00'
      const reais = padded.slice(0, 6).replace(/^0+/, '') || '0'
      const centavos = padded.slice(6, 8)
      const reaisFormat = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return `${reaisFormat},${centavos}`
    },

    /** Input estilo financeiro: dígitos entram da direita para a esquerda (centavos primeiro) */
    onValorKeydown(e) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        const next = (this.valorReais + e.key).replace(/\D/g, '').slice(-8)
        this.valorReais = next
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        this.valorReais = this.valorReais.slice(0, -1)
      }
    },

    onValorPaste(e) {
      const text = (e.clipboardData?.getData('text') || '')
        .replace(/\D/g, '')
        .slice(-8)
      this.valorReais = text
    },

    /** Retorna array de datas entre dataDe e dataAte (inclusive). Uma data se iguais. */
    getDatesInRange(dataDe, dataAte) {
      if (!dataDe || !dataAte) return []
      if (dataDe === dataAte) return [dataDe]
      const start = new Date(dataDe + 'T12:00:00')
      const end = new Date(dataAte + 'T12:00:00')
      if (start.getTime() > end.getTime()) return []
      const dates = []
      const cur = new Date(start)
      while (cur.getTime() <= end.getTime()) {
        const y = cur.getFullYear()
        const m = String(cur.getMonth() + 1).padStart(2, '0')
        const d = String(cur.getDate()).padStart(2, '0')
        dates.push(`${y}-${m}-${d}`)
        cur.setDate(cur.getDate() + 1)
      }
      return dates
    },

    async confirmarRegistro() {
      const { dataDe, dataAte } = this.registroForm
      const diaristaIds = this.listaSelecionados.map(s => s.id)
      const value = this.valorReaisPadded

      if (!dataDe || !dataAte) {
        this.emitNotification('Informe as datas.', 'error')
        return
      }
      if (diaristaIds.length === 0) {
        this.emitNotification('Adicione ao menos um diarista.', 'error')
        return
      }

      const dates = this.getDatesInRange(dataDe, dataAte)
      if (dates.length === 0) {
        this.emitNotification(
          'Data até deve ser igual ou posterior a Data de.',
          'error'
        )
        return
      }

      this.savingRegistro = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${BASE_URL}/maintenance/daily-workers/registro`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dataDe,
              dataAte,
              diaristaIds,
              value,
              ...(this.registroForm.obs?.trim()
                ? { obs: this.registroForm.obs.trim().slice(0, 200) }
                : {}),
            }),
          }
        )
        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          const total = diaristaIds.length * dates.length
          this.emitNotification(
            `${total} registro(s) de diarista(s) salvos com sucesso.`,
            'success'
          )
          this.listaSelecionados = []
          this.loadUnpaidStats()
        } else {
          this.emitNotification(
            data.error || data.message || 'Erro ao salvar registro(s).',
            'error'
          )
        }
      } catch (err) {
        console.error('Erro ao confirmar registro:', err)
        this.emitNotification('Erro de conexão. Tente novamente.', 'error')
      } finally {
        this.savingRegistro = false
      }
    },

    formatCpfInput(event) {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length > 11) {
        value = value.slice(0, 11)
      }
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      this.form.cpf = value
    },

    async submitCadastro() {
      const name = this.form.name?.trim()
      const cpf = this.form.cpf?.replace(/\D/g, '')

      if (!name) {
        this.emitNotification('Informe o nome.', 'error')
        return
      }

      if (cpf?.length !== 11) {
        this.emitNotification('Informe um CPF válido (11 dígitos).', 'error')
        return
      }

      this.saving = true

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${BASE_URL}/maintenance/daily-workers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, cpf }),
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          this.emitNotification('Diarista cadastrado com sucesso.', 'success')
          this.form.name = ''
          this.form.cpf = ''
        } else {
          this.emitNotification(
            data.error || data.message || 'Erro ao cadastrar diarista.',
            'error'
          )
        }
      } catch (error) {
        console.error('Erro ao cadastrar diarista:', error)
        this.emitNotification('Erro de conexão. Tente novamente.', 'error')
      } finally {
        this.saving = false
      }
    },

    emitNotification(message, type) {
      this.$emit('notification', message, type)
    },
  },
}
</script>

<style scoped>
.diaristas-page {
  padding: 1.5rem;
  width: 95%;
  max-width: 95%;
  margin-left: auto;
  margin-right: auto;
  min-height: 98vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.diaristas-page > .tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
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

.diaristas-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.diaristas-tabs::-webkit-scrollbar {
  height: 4px;
}

.diaristas-tabs::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.tab-button {
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  color: #718096;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab-button:hover {
  color: #4299e1;
}

.tab-button.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
}

/* Aba Info */
.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.info-stats-loading {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.info-stats-error {
  padding: 1rem 0;
  color: #718096;
}

.info-stats-error p {
  margin: 0 0 1rem 0;
}

.info-stats-details {
  margin-top: 0.75rem;
  font-size: 0.9rem;
}

.info-stats-details summary {
  cursor: pointer;
  color: #4299e1;
  font-weight: 500;
}

.info-stats-doc {
  margin-top: 0.5rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.info-stats-doc p {
  margin: 0 0 0.5rem 0;
}

.info-stats-doc p:last-child {
  margin-bottom: 0;
}

.info-stats-doc code {
  background: #edf2f7;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85em;
}

.info-stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.info-stats-container.info-stats-single {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem 1.5rem;
  padding: 1.25rem;
  background: #f7fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.info-stat-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
  background: #f7fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 200px;
}

.info-stat-label {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 500;
}

.info-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
}

.info-stat-total {
  color: #2b6cb0;
}

.info-detalhes-row {
  margin-top: 1rem;
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.info-detalhes-row .btn-detalhes {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal Detalhes – diárias não pagas (98% da área visível) */
.modal-detalhes-unpaid-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1%;
  box-sizing: border-box;
}

.modal-detalhes-unpaid-box {
  width: 98%;
  height: 98%;
  max-width: 98vw;
  max-height: 98vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-detalhes-unpaid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-detalhes-unpaid-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-detalhes-unpaid-title i {
  color: #4299e1;
}

.modal-detalhes-unpaid-close {
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: #718096;
  cursor: pointer;
  border-radius: 8px;
}

.modal-detalhes-unpaid-close:hover {
  background: #edf2f7;
  color: #2d3748;
}

.modal-detalhes-unpaid-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.modal-detalhes-unpaid-footer {
  display: flex;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-detalhes-unpaid-footer .btn-pagar-detalhes {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-detalhes-unpaid-loading,
.modal-detalhes-unpaid-error,
.modal-detalhes-unpaid-empty {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.modal-detalhes-unpaid-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detalhes-day-block {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.detalhes-day-title {
  margin: 0;
  padding: 0.75rem 1rem;
  background: #f7fafc;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 1px solid #e2e8f0;
}

.detalhes-day-items {
  margin: 0;
  padding: 0;
  list-style: none;
}

.detalhes-day-item {
  border-bottom: 1px solid #f0f0f0;
}

.detalhes-day-item:last-child {
  border-bottom: none;
}

.detalhes-day-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  margin: 0;
  cursor: pointer;
}

.detalhes-day-item-row:hover {
  background: #fafafa;
}

.detalhes-day-item-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  cursor: pointer;
}

.detalhes-day-item-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.detalhes-day-item-name {
  flex: 1;
  font-weight: 500;
  color: #2d3748;
}

.detalhes-day-item-value {
  color: #2b6cb0;
  font-weight: 600;
}

.detalhes-day-item-obs {
  margin: 0 0 0 2rem;
  padding: 0.2rem 0 0.4rem;
  font-size: 0.85rem;
  color: #718096;
  line-height: 1.3;
}

/* Aba Histórico */
.historico-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.historico-card .form-title {
  flex-shrink: 0;
}

.historico-loading,
.historico-error,
.historico-empty {
  padding: 2rem;
  text-align: center;
  color: #718096;
  flex-shrink: 0;
}

.historico-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.historico-day-block {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #fafafa;
}

.historico-day-title {
  margin: 0;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  background: #edf2f7;
  border-bottom: 1px solid #e2e8f0;
}

.historico-day-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.historico-day-item {
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
}

.historico-day-item:last-child {
  border-bottom: none;
}

.historico-row-unpaid {
  background: rgba(245, 101, 101, 0.12);
}

.historico-day-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  margin: 0;
}

.historico-day-item-row:hover {
  background: rgba(0, 0, 0, 0.03);
}

.historico-day-item-checkbox {
  margin: 0;
  flex-shrink: 0;
}

.historico-day-item-checkbox:disabled {
  cursor: not-allowed;
}

.historico-day-item-name {
  flex: 1;
  font-weight: 500;
  color: #2d3748;
}

.historico-day-item-value {
  color: #2b6cb0;
  font-weight: 600;
}

.historico-day-item-obs {
  margin: 0 0 0 2rem;
  padding: 0.2rem 0 0.4rem;
  font-size: 0.85rem;
  color: #718096;
  line-height: 1.3;
}

.historico-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.historico-actions .btn-imprimir-historico {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cadastro-form-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-title i {
  color: #4299e1;
}

.cadastro-form .form-row {
  margin-bottom: 1rem;
}

.cadastro-form .form-group label {
  display: block;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.375rem;
  font-size: 0.9rem;
}

.cadastro-form .form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 1rem;
}

.cadastro-form .form-control:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.form-actions {
  margin-top: 1.5rem;
}

.form-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Registro tab */
.registro-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.registro-form {
  box-sizing: border-box;
}

.registro-form .form-row {
  margin-bottom: 1.25rem;
  box-sizing: border-box;
}

.dates-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: stretch;
}

.dates-row .form-group {
  flex: 1 1 200px;
  min-width: 0; /* permite que o flex item encolha e evita overflow no iOS */
  max-width: 100%;
}

/* Inputs de data: contidos no container (evita sobreposição no iPhone / Safari) */
.dates-row .form-group input[type='date'] {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  /* Alinhamento e padding consistentes: evita “flutuação” do texto no iOS */
  text-align: left;
  padding-left: 12px;
  padding-right: 12px;
  font-size: 16px; /* >= 16px evita zoom automático no foco no iOS */
  direction: ltr;
}

/*
 * iOS/Safari: o valor exibido fica em um elemento interno (shadow DOM) com
 * text-align: center por padrão. Sem isso, a data aparece desalinhada à direita.
 */
.dates-row .form-group input[type='date']::-webkit-date-and-time-value {
  text-align: left;
  padding: 0;
  margin: 0;
}

/* Em telas estreitas (ex.: iPhone), empilhar os dois campos verticalmente */
@media (max-width: 480px) {
  .dates-row {
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .dates-row .form-group {
    flex: 0 0 auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .dates-row .form-group input[type='date'] {
    width: 100%;
    max-width: 100%;
    text-align: left;
    padding-left: 12px;
    padding-right: 12px;
    font-size: 16px;
  }

  .dates-row .form-group input[type='date']::-webkit-date-and-time-value {
    text-align: left;
  }
}

.add-diaristas-row .btn-open-modal-diaristas {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal de seleção de diaristas: 98% da página, acima do botão da sidebar (z-index 1060) */
.modal-selecao-diaristas-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1%;
  box-sizing: border-box;
}

.modal-selecao-diaristas-box {
  width: 98%;
  height: 98%;
  max-width: 98vw;
  max-height: 98vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-selecao-diaristas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-selecao-diaristas-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-selecao-diaristas-title i {
  color: #4299e1;
}

.modal-selecao-diaristas-close {
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: #718096;
  cursor: pointer;
  border-radius: 8px;
}

.modal-selecao-diaristas-close:hover {
  background: #edf2f7;
  color: #2d3748;
}

.modal-selecao-diaristas-search {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-selecao-diaristas-search .form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 1rem;
}

.modal-selecao-diaristas-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1.25rem 1rem;
}

.modal-selecao-diaristas-loading,
.modal-selecao-diaristas-empty {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.modal-selecao-diaristas-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-selecao-diaristas-item:hover {
  background: #f7fafc;
}

.modal-selecao-diaristas-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  cursor: pointer;
}

.modal-selecao-diaristas-item-name {
  font-weight: 500;
  color: #2d3748;
}

.modal-selecao-diaristas-item-cpf {
  margin-left: auto;
  font-size: 0.9rem;
  color: #718096;
}

.modal-selecao-diaristas-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.lista-diaristas {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  min-height: 120px;
  max-height: 280px;
  overflow-y: auto;
  background: #f8fafc;
}

.lista-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.lista-item:last-child {
  border-bottom: none;
}

.lista-item-name {
  font-weight: 500;
  color: #2d3748;
}

.btn-remove {
  padding: 0.25rem 0.5rem;
  color: #e53e3e;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.8;
}

.btn-remove:hover {
  opacity: 1;
}

.lista-empty {
  padding: 1.5rem;
  text-align: center;
  color: #718096;
  font-size: 0.95rem;
}

.valor-row .form-group {
  max-width: 280px;
}

.valor-input-financeiro {
  text-align: right;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.registro-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.btn-obs {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal OBS */
.modal-obs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 1rem;
  box-sizing: border-box;
}

.modal-obs-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-obs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-obs-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-obs-close {
  background: none;
  border: none;
  padding: 0.35rem;
  cursor: pointer;
  color: #718096;
  border-radius: 6px;
  line-height: 1;
}

.modal-obs-close:hover {
  background: #edf2f7;
  color: #2d3748;
}

.modal-obs-body {
  padding: 1.25rem;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-obs-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2d3748;
}

.modal-obs-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-obs-char-count {
  font-size: 0.8rem;
  color: #718096;
}

.modal-obs-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .diaristas-page {
    padding: 1rem;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .diaristas-tabs {
    flex-wrap: nowrap;
  }
}
</style>
