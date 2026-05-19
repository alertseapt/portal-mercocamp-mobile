<template>
  <div class="info-gerais-page">
    <div class="page-header-row">
      <div class="page-header">
        <h1>
          <i class="fas fa-chart-bar"></i>
          Informações Gerais
        </h1>
      </div>
      <div class="header-actions">
        <span v-if="lastUpdated" class="last-updated">
          Atualizado: {{ lastUpdated }}
        </span>
        <button
          type="button"
          class="btn-refresh-icon"
          @click="fetchData"
          :disabled="loading"
          title="Atualizar"
        >
          <i
            :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          ></i>
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-row">
      <div class="filter-group">
        <label class="filter-label">CD</label>
        <select
          v-model="filterCD"
          class="filter-select"
          :disabled="loading"
          @change="fetchData"
        >
          <option value="">Todos</option>
          <option v-for="cd in cds" :key="cd" :value="cd">{{ cd }}</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>

    <div class="chart-card">
      <div class="chart-title">Agendamentos por dia — próximos 15 dias</div>
      <div v-if="loading" class="chart-loading">
        <i class="fas fa-spinner fa-spin"></i> Carregando...
      </div>
      <div v-else class="chart-wrapper">
        <canvas ref="chartCanvas" style="cursor: pointer"></canvas>
      </div>
    </div>

    <!-- Modal de detalhe por dia -->
    <teleport to="body">
      <div
        v-if="detalheModal.open"
        class="modal-overlay"
        @click.self="detalheModal.open = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title">
              <i class="fas fa-calendar-day"></i>
              {{ detalheModal.titulo }}
            </span>
            <button
              type="button"
              class="modal-close"
              @click="detalheModal.open = false"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="detalheModal.loading" class="modal-loading">
              <i class="fas fa-spinner fa-spin"></i> Carregando...
            </div>
            <div
              v-else-if="detalheModal.estoques.length === 0"
              class="modal-empty"
            >
              Nenhum agendamento para este dia.
            </div>
            <ul v-else class="estoque-list">
              <li
                v-for="e in detalheModal.estoques"
                :key="e.name"
                class="estoque-item"
              >
                <span class="estoque-name">{{ e.name }}</span>
                <div v-if="detalheRowTemStatus(e)" class="estoque-counts">
                  <span
                    v-if="Number(e.agendado) > 0"
                    class="estoque-pill estoque-pill--ag"
                    title="Agendado"
                  >
                    {{ detalheFormatInt(e.agendado) }}
                  </span>
                  <span
                    v-if="Number(e.solicitado) > 0"
                    class="estoque-pill estoque-pill--sol"
                    title="Solicitado"
                  >
                    {{ detalheFormatInt(e.solicitado) }}
                  </span>
                  <span
                    v-if="
                      Number(e.agendado) === 0 &&
                      Number(e.solicitado) === 0 &&
                      Number(e.total) > 0
                    "
                    class="estoque-badge"
                  >
                    {{ detalheFormatInt(e.total) }}
                  </span>
                </div>
                <span v-else class="estoque-badge">{{ e.total }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import apiService from '../services/api.js'

Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

export default {
  name: 'CargaDescargaInformacoesGeraisPage',

  props: {
    user: { type: Object, default: null },
  },

  emits: ['notification'],

  data() {
    return {
      loading: false,
      error: null,
      lastUpdated: null,
      chartInstance: null,
      chartDays: [], // mantém os dados dos dias para o click handler
      filterCD: '',
      cds: [],
      detalheModal: {
        open: false,
        loading: false,
        titulo: '',
        estoques: [],
      },
    }
  },

  mounted() {
    this.loadCDs()
    this.fetchData()
  },

  beforeUnmount() {
    this.destroyChart()
  },

  methods: {
    async loadCDs() {
      try {
        const data = await apiService.get('/agendamentos/cds')
        this.cds = Array.isArray(data) ? data : []
      } catch (e) {
        console.error('[informacoes-gerais] loadCDs error:', e.message)
      }
    },

    async fetchData() {
      this.loading = true
      this.error = null
      this.destroyChart()

      const params = {}
      if (this.filterCD) params.cd = this.filterCD

      try {
        const res = await apiService.get('/graphic-load', params)
        const days = res.data || []

        if (res.lastUpdated) {
          const d = new Date(res.lastUpdated)
          this.lastUpdated = d.toLocaleString('pt-BR')
        }

        this.chartDays = days
        this.loading = false
        await this.$nextTick()
        this.renderChart(days)
      } catch (e) {
        this.error = `Erro ao carregar dados: ${e.message || 'Erro desconhecido'}`
        this.$emit('notification', { message: this.error, type: 'error' })
        this.loading = false
      }
    },

    renderChart(days) {
      const ctx = this.$refs.chartCanvas
      if (!ctx) return

      const labels = days.map(d => this.formatLabel(d.dia))
      const totals = days.map(d => d.total)

      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const backgroundColors = days.map(d =>
        d.dia === todayStr
          ? 'rgba(37, 99, 235, 0.85)'
          : 'rgba(37, 99, 235, 0.35)'
      )
      const borderColors = days.map(d =>
        d.dia === todayStr ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.6)'
      )

      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Agendamentos',
              data: totals,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: items => {
                  const idx = items[0].dataIndex
                  return this.formatTooltipTitle(days[idx].dia)
                },
                label: item =>
                  ` ${item.raw} agendamento${item.raw !== 1 ? 's' : ''}`,
              },
            },
          },
          onClick: (event, elements) => {
            if (!elements.length) return
            const idx = elements[0].index
            const dia = this.chartDays[idx]?.dia
            if (dia) this.openDetalhe(dia)
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 12 },
                color: '#6b7280',
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0,
                font: { size: 12 },
                color: '#6b7280',
              },
              grid: {
                color: 'rgba(0,0,0,0.06)',
              },
            },
          },
        },
      })
    },

    detalheRowTemStatus(e) {
      return (
        e && typeof e.agendado === 'number' && typeof e.solicitado === 'number'
      )
    },

    detalheFormatInt(n) {
      return Math.round(Number(n) || 0).toLocaleString('pt-BR')
    },

    async openDetalhe(dia) {
      const [yyyy, mm, dd] = dia.split('-')
      this.detalheModal.titulo = `${dd}/${mm}/${yyyy}${this.filterCD ? ' — ' + this.filterCD : ''}`
      this.detalheModal.estoques = []
      this.detalheModal.loading = true
      this.detalheModal.open = true

      try {
        const params = { dia }
        if (this.filterCD) params.cd = this.filterCD
        const res = await apiService.get('/graphic-load/detalhe', params)
        this.detalheModal.estoques = res.estoques || []
      } catch (e) {
        console.error('[informacoes-gerais] openDetalhe error:', e.message)
        this.detalheModal.estoques = []
      } finally {
        this.detalheModal.loading = false
      }
    },

    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy()
        this.chartInstance = null
      }
    },

    /** YYYY-MM-DD → "DD/MM" (hoje mostra "Hoje") */
    formatLabel(isoDate) {
      const [yyyy, mm, dd] = isoDate.split('-')
      const today = new Date()
      if (
        parseInt(dd) === today.getDate() &&
        parseInt(mm) === today.getMonth() + 1 &&
        parseInt(yyyy) === today.getFullYear()
      ) {
        return 'Hoje'
      }
      return `${dd}/${mm}`
    },

    /** YYYY-MM-DD → "DD/MM/YYYY" para o tooltip */
    formatTooltipTitle(isoDate) {
      const [yyyy, mm, dd] = isoDate.split('-')
      return `${dd}/${mm}/${yyyy}`
    },
  },
}
</script>

<style scoped>
.info-gerais-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.page-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.page-header h1 {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-header h1 i {
  color: var(--primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.last-updated {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.btn-refresh-icon {
  background: var(--gray-100);
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-refresh-icon:hover:not(:disabled) {
  background: var(--gray-200);
}

.btn-refresh-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Filtros ── */
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  padding: 14px 16px;
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-select {
  height: 34px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  padding: 0 10px;
  font-size: 0.83rem;
  color: var(--gray-700);
  background: var(--white);
  min-width: 160px;
  outline: none;
  transition: border-color 0.15s;
}

.filter-select:focus {
  border-color: var(--primary);
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.chart-card {
  flex: 1;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.chart-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gray-600);
  flex-shrink: 0;
}

.chart-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  font-size: 0.9rem;
  gap: 8px;
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: var(--white);
  border-radius: 12px;
  width: 420px;
  max-width: 92vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--gray-200);
  flex-shrink: 0;
}

.modal-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gray-800);
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title i {
  color: var(--primary);
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gray-400);
  font-size: 1rem;
  padding: 4px;
  transition: color 0.15s;
}

.modal-close:hover {
  color: var(--gray-700);
}

.modal-body {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

.modal-loading,
.modal-empty {
  padding: 32px;
  text-align: center;
  color: var(--gray-400);
  font-size: 0.88rem;
}

.estoque-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.estoque-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  gap: 12px;
  border-bottom: 1px solid var(--gray-100);
}

.estoque-item:last-child {
  border-bottom: none;
}

.estoque-name {
  font-size: 0.85rem;
  color: var(--gray-700);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.estoque-badge {
  flex-shrink: 0;
  background: var(--primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 2px 8px;
  min-width: 24px;
  text-align: center;
}

.estoque-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
}

.estoque-pill {
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 2px 8px;
  min-width: 24px;
  text-align: center;
}

.estoque-pill--ag {
  background: rgba(16, 185, 129, 0.2);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.45);
}

.estoque-pill--sol {
  background: rgba(245, 158, 11, 0.22);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.45);
}
</style>
