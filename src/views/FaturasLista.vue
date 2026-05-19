<template>
  <div class="portal-wrapper">
    <div class="portal-content">
      <div class="page-header">
        <div class="header-title-section">
          <h2>Faturas</h2>
          <div class="agendamentos-count">
            <span class="count-badge">{{ filteredFaturas.length }}</span>
            <span class="count-label">{{
              filteredFaturas.length === 1 ? 'fatura' : 'faturas'
            }}</span>
          </div>
          <p class="page-description">
            Consulte vencimentos, status de pagamento e histórico financeiro.
          </p>
        </div>
        <div class="header-actions">
          <button
            class="btn btn-outline-primary btn-refresh-icon"
            type="button"
            aria-label="Atualizar pagina"
            title="Atualizar lista"
            @click="handleRefresh"
          >
            <i
              class="fas fa-arrows-rotate refresh-icon"
              :class="{ 'is-spinning': isRefreshing }"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

        <div class="summary-cards">
        <div class="summary-card summary-card--empresa">
          <label
            v-if="!isLoading && faturas.length && empresaChoices.length > 1"
            class="summary-label"
            for="faturas-empresa-select"
          >Empresa</label>
          <span v-else class="summary-label">Empresa</span>
          <template v-if="isLoading || !faturas.length">
            <span class="summary-value">—</span>
          </template>
          <template v-else-if="empresaChoices.length <= 1">
            <span class="summary-value summary-empresa-nome">{{
              empresaChoices[0] ? empresaChoices[0].label : '—'
            }}</span>
          </template>
          <template v-else>
            <select
              id="faturas-empresa-select"
              v-model="empresaSelecionada"
              class="form-control summary-empresa-select"
              aria-describedby="faturas-empresa-hint"
            >
              <option value="">
                Todas ({{ empresaChoices.length }} empresas · {{ faturas.length }}
                {{ faturas.length === 1 ? 'fatura' : 'faturas' }})
              </option>
              <option
                v-for="e in empresaChoices"
                :key="'emp-' + empresaOptionKey(e.key)"
                :value="e.key"
              >
                {{ truncateEmpresaLabel(e.label) }} ({{ e.count }}
                {{ e.count === 1 ? 'fatura' : 'faturas' }})
              </option>
            </select>
            <p id="faturas-empresa-hint" class="summary-empresa-hint">
            </p>
          </template>
        </div>
        <div class="summary-card">
          <span class="summary-label">Em aberto</span>
          <span class="summary-value">{{ formatCurrency(totalEmAberto) }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Total pago</span>
          <span class="summary-value text-success">{{ formatCurrency(totalPago) }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Vencidas</span>
          <span class="summary-value text-danger">{{ formatCurrency(totalVencido) }}</span>
        </div>
      </div>

      <div
        v-if="showComparativoEmpresas"
        class="comparativo-empresas"
      >
        <div class="comparativo-header">
          <h3 class="comparativo-title">Comparativo entre empresas</h3>
        </div>
        <div class="comparativo-body">
          <div class="comparativo-table-wrap">
            <table class="comparativo-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th class="col-num">Em aberto</th>
                  <th class="col-num">Vencidas</th>
                  <th class="col-num">Pago</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in comparativoMetricas"
                  :key="'cmp-' + empresaOptionKey(row.label)"
                >
                  <td class="td-empresa">{{ truncateEmpresaLabel(row.label, 40) }}</td>
                  <td class="col-num td-money">{{ formatCurrency(row.emAberto) }}</td>
                  <td class="col-num td-money text-danger">{{ formatCurrency(row.vencido) }}</td>
                  <td class="col-num td-money text-success">{{ formatCurrency(row.pago) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="filters-container">
        <div class="search-row">
          <div class="search-input-group">
            <input
              v-model.trim="searchTerm"
              type="text"
              class="search-input"
              placeholder="Buscar por razão social, Corpem, competência ou valor"
            />
            <button class="search-button" type="button">Buscar</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label for="status-filter-faturas">Status:</label>
            <select id="status-filter-faturas" v-model="statusFilter" class="form-control">
              <option value="">Todos os status</option>
              <option value="Em aberto">Em aberto</option>
              <option value="Pago">Pago</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="competencia-filter-faturas">Competência:</label>
            <input
              id="competencia-filter-faturas"
              v-model.trim="competenciaFilter"
              type="text"
              class="form-control"
              placeholder="MM/AAAA"
            />
          </div>
          <div class="filter-group filter-actions-buttons">
            <label>&nbsp;</label>
            <button
              type="button"
              class="btn btn-outline-danger filter-action-btn"
              :disabled="!hasActiveFilters"
              @click="clearFilters"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>Histórico de Faturas</h3>
        </div>

        <div class="table-wrapper">
          <div v-if="isLoading" class="empty-state">Carregando faturas...</div>
          <div v-else-if="loadError" class="empty-state">{{ loadError }}</div>
          <table v-else class="faturas-table">
            <thead>
              <tr>
                <th>Corpem</th>
                <th>Razão social</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(fatura, idx) in filteredFaturas"
                :key="fatura.id != null ? 'fatura-' + fatura.id : 'fatura-idx-' + idx"
              >
                <td class="td-corpem">{{ fatura.codigo_corpem }}</td>
                <td class="td-razao">{{ fatura.razao_social }}</td>
                <td>{{ fatura.competencia }}</td>
                <td>{{ fatura.vencimento }}</td>
                <td class="td-money">{{ formatCurrency(fatura.valor) }}</td>
                <td>
                  <span class="faturas-status-badge" :class="statusClass(fatura.status)">
                    {{ fatura.status }}
                  </span>
                </td>
                <td class="col-actions actions-cell">
                  <button
                    class="act-btn act-ver"
                    type="button"
                    :disabled="docActionDisabled(fatura)"
                    @click="openDemonstrativo(fatura)"
                  >
                    <i class="fas fa-eye act-btn-icon" aria-hidden="true" />
                    Ver
                  </button>
                  <button
                    class="act-btn act-boleto"
                    type="button"
                    :disabled="docActionDisabled(fatura)"
                    @click="downloadBoleto(fatura)"
                  >
                    <i class="fas fa-download act-btn-icon" aria-hidden="true" />
                    Boleto
                  </button>
                  <button
                    class="act-btn act-nf"
                    type="button"
                    :disabled="docActionDisabled(fatura)"
                    @click="downloadNf(fatura)"
                  >
                    <i class="fas fa-download act-btn-icon" aria-hidden="true" />
                    NF
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredFaturas.length">
                <td colspan="7" class="empty-state">
                  Nenhuma fatura encontrada para os filtros selecionados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span class="table-footer-info">
            Mostrando {{ filteredFaturas.length }} de {{ faturasBase.length }} faturas
            <template v-if="empresaSelecionada && faturasBase.length !== faturas.length">
              ({{ faturas.length }} no total)
            </template>
          </span>
          <div class="pagination">
            <button class="btn btn-secondary btn-sm" disabled>Anterior</button>
            <button class="btn btn-primary btn-sm">1</button>
            <button class="btn btn-secondary btn-sm" disabled>Próxima</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import apiService from '@/services/api.js'

export default {
  name: 'FaturasPortal',
  props: {
    user: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      isRefreshing: false,
      isLoading: false,
      loadError: '',
      searchTerm: '',
      statusFilter: '',
      competenciaFilter: '',
      empresaSelecionada: '',
      faturas: [],
      /** `servico` | `aluguel` — alinhado à API externa do Hub */
      faturaTipo: 'servico',
    }
  },
  computed: {
    parsedCliAccess() {
      const u = this.user
      if (!u) return {}
      let cli = u.cli_access
      if (typeof cli === 'string' && cli.trim()) {
        try {
          cli = JSON.parse(cli)
        } catch {
          cli = {}
        }
      }
      if (!cli || typeof cli !== 'object') return {}
      return cli
    },
    /** Quantidade de CNPJs (14 dígitos) em cli_access — empresas vinculadas ao cadastro. */
    cnpjCadastroCount() {
      let n = 0
      for (const k of Object.keys(this.parsedCliAccess)) {
        const d = String(k).replace(/\D/g, '')
        if (d.length === 14) n++
      }
      return n
    },
    /**
     * Comparativo só para quem tem mais de uma empresa no cadastro (cli_access).
     * Nível 0 sem vínculos por CNPJ mantém o comparativo quando há mais de uma razão nas faturas carregadas (visão global).
     */
    showComparativoEmpresas() {
      if (this.isLoading || this.loadError || !this.faturas.length) return false
      // Com "Todas" vazio; com uma empresa escolhida, comparativo multiempresa some.
      if (this.empresaSelecionada) return false
      if (this.cnpjCadastroCount > 1) return true
      const level = Number(this.user?.level_access)
      if (level === 0 && this.cnpjCadastroCount <= 1) {
        return this.empresaChoices.length > 1
      }
      return false
    },
    /** Agrupa por razão social para o seletor (uma linha por empresa). */
    empresaChoices() {
      const list = this.faturas || []
      const map = new Map()
      for (const f of list) {
        const key = (f.razao_social || '—').trim() || '—'
        map.set(key, (map.get(key) || 0) + 1)
      }
      return Array.from(map.entries())
        .map(([key, count]) => ({ key, label: key, count }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    },
    /** Faturas da empresa escolhida (ou todas se vazio). */
    faturasBase() {
      const list = this.faturas || []
      if (!this.empresaSelecionada) return list
      return list.filter(
        f => (f.razao_social || '—').trim() === this.empresaSelecionada
      )
    },
    filteredFaturas() {
      const term = this.searchTerm.toLowerCase()
      const competencia = this.competenciaFilter.toLowerCase()

      return this.faturasBase.filter(fatura => {
        const matchesStatus = this.statusFilter
          ? fatura.status === this.statusFilter
          : true
        const matchesCompetencia = competencia
          ? fatura.competencia.toLowerCase().includes(competencia)
          : true
        const matchesTerm = term
          ? [
              fatura.codigo_corpem,
              fatura.razao_social,
              fatura.competencia,
              this.formatCurrency(fatura.valor),
              fatura.status,
            ]
              .join(' ')
              .toLowerCase()
              .includes(term)
          : true

        return matchesStatus && matchesCompetencia && matchesTerm
      })
    },
    /** Em aberto = ainda não pagas: inclui competências em dia e vencidas. */
    totalEmAberto() {
      return this.faturasBase
        .filter(
          fatura =>
            fatura.status === 'Em aberto' || fatura.status === 'Vencido'
        )
        .reduce((acc, fatura) => acc + fatura.valor, 0)
    },
    totalPago() {
      return this.faturasBase
        .filter(fatura => fatura.status === 'Pago')
        .reduce((acc, fatura) => acc + fatura.valor, 0)
    },
    totalVencido() {
      return this.faturasBase
        .filter(fatura => fatura.status === 'Vencido')
        .reduce((acc, fatura) => acc + fatura.valor, 0)
    },
    hasActiveFilters() {
      return Boolean(
        this.searchTerm ||
          this.statusFilter ||
          this.competenciaFilter ||
          this.empresaSelecionada
      )
    },
    /** Totais por razão social (lista completa) para a tabela comparativa. */
    comparativoMetricas() {
      const list = this.faturas || []
      const map = new Map()
      for (const f of list) {
        const key = (f.razao_social || '—').trim() || '—'
        if (!map.has(key)) {
          map.set(key, { label: key, emAberto: 0, pago: 0, vencido: 0 })
        }
        const r = map.get(key)
        const v = Number(f.valor) || 0
        if (f.status === 'Pago') r.pago += v
        if (f.status === 'Vencido') {
          r.vencido += v
          r.emAberto += v
        }
        if (f.status === 'Em aberto') r.emAberto += v
      }
      return Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR')
      )
    },
  },
  watch: {
    faturas: {
      handler(newList) {
        const keys = new Set(
          (newList || []).map(f => (f.razao_social || '—').trim() || '—')
        )
        if (this.empresaSelecionada && !keys.has(this.empresaSelecionada)) {
          this.empresaSelecionada = ''
        }
      },
      deep: true,
    },
  },
  methods: {
    docActionDisabled(fatura) {
      if (!fatura?.id) return true
      const c = String(fatura.codigo_corpem || '').trim()
      return !c || c === '—'
    },
    faturaDocQuery(fatura) {
      return {
        tipo: this.faturaTipo,
        codigo_corpem: String(fatura.codigo_corpem || '').trim(),
      }
    },
    parseFilenameFromContentDisposition(cd, fallback) {
      if (!cd) return fallback
      const star = /filename\*=UTF-8''([^;\s]+)/i.exec(cd)
      if (star) {
        try {
          return decodeURIComponent(star[1].replace(/["']/g, ''))
        } catch {
          return fallback
        }
      }
      const plain = /filename="([^"]+)"/i.exec(cd)
      if (plain) return plain[1].trim()
      return fallback
    },
    triggerBlobDownload(blob, filename) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    async openDemonstrativo(fatura) {
      if (this.docActionDisabled(fatura)) return
      try {
        const html = await apiService.getTextWithQuery(
          `/faturas/${fatura.id}/demonstrativo`,
          this.faturaDocQuery(fatura)
        )
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        window.setTimeout(() => URL.revokeObjectURL(url), 120000)
      } catch (e) {
        console.error('[FaturasLista] demonstrativo:', e)
        window.alert(e?.message || 'Não foi possível abrir o demonstrativo.')
      }
    },
    async downloadBoleto(fatura) {
      if (this.docActionDisabled(fatura)) return
      try {
        const { blob, contentDisposition } = await apiService.getBlobWithQuery(
          `/faturas/${fatura.id}/boleto`,
          this.faturaDocQuery(fatura)
        )
        const name = this.parseFilenameFromContentDisposition(
          contentDisposition,
          `boleto-${fatura.id}.pdf`
        )
        this.triggerBlobDownload(blob, name)
      } catch (e) {
        console.error('[FaturasLista] boleto:', e)
        window.alert(e?.message || 'Não foi possível baixar o boleto.')
      }
    },
    async downloadNf(fatura) {
      if (this.docActionDisabled(fatura)) return
      try {
        const { blob, contentDisposition } = await apiService.getBlobWithQuery(
          `/faturas/${fatura.id}/nf`,
          this.faturaDocQuery(fatura)
        )
        const name = this.parseFilenameFromContentDisposition(
          contentDisposition,
          `nf-${fatura.id}.pdf`
        )
        this.triggerBlobDownload(blob, name)
      } catch (e) {
        console.error('[FaturasLista] NF:', e)
        window.alert(e?.message || 'Não foi possível baixar a nota fiscal.')
      }
    },
    empresaOptionKey(key) {
      return String(key).replace(/\s+/g, '_').slice(0, 80)
    },
    truncateEmpresaLabel(label, max = 48) {
      const s = String(label || '')
      if (s.length <= max) return s
      return `${s.slice(0, max - 1)}…`
    },
    async loadFaturas() {
      if (this.isLoading) return

      this.isLoading = true
      this.loadError = ''
      try {
        const response = await apiService.get('/faturas', { limit: 1000 })
        const list = Array.isArray(response?.data) ? response.data : []
        this.faturas = list.map(item => ({
          id: item.id,
          codigo_corpem: item.codigo_corpem || '—',
          razao_social: item.razao_social || '—',
          competencia: item.competencia || '',
          vencimento: item.vencimento || '',
          valor: Number(item.valor || 0),
          status: item.status || 'Em aberto',
        }))
      } catch (error) {
        console.error('[FaturasLista] erro ao carregar faturas:', error)
        this.loadError = error?.message || 'Erro ao carregar faturas'
        this.faturas = []
      } finally {
        this.isLoading = false
      }
    },
    async handleRefresh() {
      if (this.isRefreshing || this.isLoading) return
      this.isRefreshing = true
      await this.loadFaturas()
      window.setTimeout(() => {
        this.isRefreshing = false
      }, 700)
    },
    clearFilters() {
      this.searchTerm = ''
      this.statusFilter = ''
      this.competenciaFilter = ''
      this.empresaSelecionada = ''
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value || 0)
    },
    statusClass(status) {
      if (status === 'Pago') return 'status-pago'
      if (status === 'Vencido') return 'status-cancelado'
      return 'status-pagamento-pendente'
    },
  },
  mounted() {
    this.loadFaturas()
  },
}
</script>
  
<style scoped>
.portal-wrapper {
  --primary: #0077ff;
  --primary-dark: #0a54a3;
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --success: #10b981;
  --danger: #ef4444;

  font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--white);
  min-height: 100%;
  border-radius: 12px;

}

.portal-content {
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 0px solid #e0e0e0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title-section h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gray-900);
}

.agendamentos-count {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.55rem;
  border-radius: 999px;
  background: #e0efff;
  color: #0056b3;
  font-size: 0.9rem;
  font-weight: 700;
}

.count-label {
  color: var(--gray-600);
  font-size: 0.88rem;
}

.page-description {
  margin: 4px 0 0;
  color: var(--gray-500);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: minmax(220px, 1.35fr) repeat(3, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 1rem;
}

.summary-card {
  background: var(--white);
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 0.9rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.summary-card--empresa {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-empresa-select {
  margin-top: 2px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-900);
}

.summary-empresa-nome {
  line-height: 1.3;
  font-size: 1.05rem;
}

.summary-empresa-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--gray-600);
}

.summary-empresa-hint strong {
  color: var(--gray-800);
  font-weight: 700;
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-500);
}

.summary-value {
  margin-top: 4px;
  display: block;
  font-size: 9rem;
  font-weight: 700;
  color: var(--gray-900);
}

.text-success {
  color: #047857;
}

.text-danger {
  color: #b91c1c;
}

.comparativo-empresas {
  background: var(--white);
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem 1.1rem 1.1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.comparativo-header {
  margin-bottom: 0.75rem;
}

.comparativo-title {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gray-900);
}

.comparativo-subtitle {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--gray-600);
}

.comparativo-body {
  display: block;
}

.comparativo-table-wrap {
  overflow-x: auto;
}

.comparativo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.comparativo-table th,
.comparativo-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--gray-200);
}

.comparativo-table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gray-600);
  font-weight: 700;
}

.comparativo-table .col-num {
  text-align: right;
  white-space: nowrap;
}

.comparativo-table .td-empresa {
  font-weight: 600;
  color: var(--gray-800);
  max-width: 200px;
}

.filters-container {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.search-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.search-input-group {
  display: flex;
  align-items: center;
  width: 100%;
}

.search-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-size: 0.95rem;
  background: white;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary);
}

.search-button {
  padding: 0.6rem 1.1rem;
  background: #6c757d;
  color: white;
  border: 2px solid #6c757d;
  border-radius: 0 6px 6px 0;
  font-weight: 500;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 160px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.25rem;
}

.form-control {
  height: 40px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
}

.filter-actions-buttons {
  margin-left: auto;
}

.filter-action-btn {
  height: 40px;
}

.table-container {
  background: var(--white);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.table-header {
  margin-bottom: 0.8rem;
}

.table-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}

.table-wrapper {
  overflow-x: auto;
}

.faturas-table {
  width: 100%;
  border-collapse: collapse;
}

.faturas-table th {
  padding: 12px 14px;
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-500);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.45px;
  text-align: left;
}

.faturas-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--gray-100);
  color: var(--gray-800);
  background-color: var(--white);
  font-size: 14px;
}

.faturas-table tbody tr:hover td {
  background-color: var(--gray-50);
}

.td-bold {
  font-weight: 600;
  color: var(--gray-900);
}

.td-corpem {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--gray-900);
}

.td-razao {
  font-size: 14px;
  line-height: 1.35;
  color: var(--gray-800);
  max-width: 280px;
}

.summary-empresas {
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
}

.td-money {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Coluna Ações: cabeçalho e botões alinhados à esquerda da célula (início do grupo) */
.faturas-table th.col-actions {
  text-align: left;
  vertical-align: middle;
}

.faturas-table td.actions-cell {
  vertical-align: middle;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.faturas-status-badge {
  padding: 5px 12px !important;
  border-radius: 5px;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  min-height: 30px;
  white-space: nowrap;
}

.status-pagamento-pendente {
  background-color: #fef3c7;
  color: #92400e;
  border-color: rgba(245, 158, 11, 0.3);
}

.status-pago {
  background-color: #d1fae5;
  color: #065f46;
  border-color: rgba(16, 185, 129, 0.3);
}

.status-cancelado {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: rgba(239, 68, 68, 0.3);
}

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.act-btn-icon {
  font-size: 13px;
  line-height: 1;
  opacity: 0.95;
}

.act-btn:hover {
  transform: translateY(-1px);
}

.act-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.act-ver {
  background: var(--success);
  color: var(--white);
}

.act-boleto {
  background: var(--primary);
  color: var(--white);
}

.act-nf {
  background: var(--gray-600);
  color: var(--white);
}

.empty-state {
  text-align: center;
  color: var(--gray-500);
  padding: 1.2rem;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--gray-200);
}

.table-footer-info {
  font-size: 13px;
  color: var(--gray-500);
}

.pagination {
  display: flex;
  gap: 6px;
}

.btn {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--white);
}

.btn-secondary {
  background-color: var(--gray-200);
  color: var(--gray-700);
}

.btn-outline-danger {
  background: #fff;
  color: #b91c1c;
  border-color: #fecaca;
}

.btn-outline-primary {
  background: #fff;
  color: var(--primary);
  border-color: #bfdbfe;
}

.btn-refresh-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  display: block;
  font-size: 1.05rem;
  transform-origin: center center;
  transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.btn-refresh-icon:hover .refresh-icon {
  transform: rotate(180deg);
}

.refresh-icon.is-spinning {
  animation: refresh-spin 0.8s linear infinite;
}

@keyframes refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .portal-content {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
  }

  .search-row {
    margin-bottom: 0.8rem;
    padding-bottom: 0.8rem;
  }

  .search-input-group {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .search-input {
    border-right: 2px solid #e0e0e0;
    border-radius: 6px;
  }

  .search-button {
    border-radius: 6px;
    width: 100%;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .filter-actions-buttons {
    margin-left: 0;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }

  .table-footer {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    text-align: center;
  }

  .pagination {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .actions-cell {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
  