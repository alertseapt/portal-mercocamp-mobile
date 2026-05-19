<template>
  <div class="agendamentos-page">
    <!-- Cabeçalho -->
    <div class="page-header-row">
      <div class="page-header">
        <h1>
          <i class="fas fa-calendar-check"></i>
          Agendamentos
        </h1>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="btn btn-excel"
          @click="exportExcel"
          :disabled="loading || exporting || agendamentos.length === 0"
          title="Exportar para Excel"
        >
          <i
            :class="exporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'"
          ></i>
          Exportar
        </button>
        <button
          type="button"
          class="btn btn-refresh-icon"
          @click="fetchAgendamentos"
          :disabled="loading"
          title="Atualizar lista"
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
        <label class="filter-label">Estoque</label>
        <button
          type="button"
          class="btn-estoque-select"
          :class="{ 'has-value': filterEstoque }"
          @click="openEstoqueModal"
          :disabled="loading"
        >
          <span class="btn-estoque-text">{{
            filterEstoqueName || 'Todos'
          }}</span>
          <i class="fas fa-chevron-down btn-estoque-icon"></i>
        </button>
      </div>

      <div class="filter-group">
        <label class="filter-label">CD</label>
        <select v-model="filterCD" class="filter-select" :disabled="loading">
          <option value="">Todos</option>
          <option v-for="cd in cds" :key="cd" :value="cd">{{ cd }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Data de</label>
        <input
          type="date"
          v-model="filterDataDe"
          class="filter-input"
          :disabled="loading"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Data até</label>
        <input
          type="date"
          v-model="filterDataAte"
          class="filter-input"
          :disabled="loading"
        />
      </div>

      <div class="filter-actions">
        <button
          type="button"
          class="btn btn-buscar"
          @click="fetchAgendamentos"
          :disabled="loading"
        >
          <i class="fas fa-search"></i>
          Buscar
        </button>
        <button
          type="button"
          class="btn btn-limpar"
          @click="clearFilters"
          :disabled="loading"
        >
          <i class="fas fa-times"></i>
          Limpar
        </button>
      </div>
    </div>

    <!-- Erro -->
    <div v-if="error" class="error-banner">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>

    <!-- Tabela -->
    <div class="table-wrapper">
      <table class="agendamentos-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="sortable-th"
              :class="{ 'sort-active': sortBy === col.key }"
              :style="col.width ? { width: col.width } : {}"
              @click="toggleSort(col.key)"
            >
              {{ col.label }}
              <i
                v-if="sortBy === col.key"
                class="fas sort-icon"
                :class="sortDir === 'ASC' ? 'fa-sort-up' : 'fa-sort-down'"
              ></i>
              <i v-else class="fas fa-sort sort-icon sort-inactive"></i>
            </th>
            <th class="th-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + 1" class="td-loading">
              <i class="fas fa-spinner fa-spin"></i> Carregando...
            </td>
          </tr>
          <tr v-else-if="!loading && agendamentos.length === 0">
            <td :colspan="columns.length + 1" class="td-empty">
              Nenhum agendamento encontrado.
            </td>
          </tr>
          <tr v-else v-for="row in agendamentos" :key="row.id" class="data-row">
            <td>{{ row.nf_number || '—' }}</td>
            <td class="td-client">{{ row.client_name || '—' }}</td>
            <td class="td-transportadora">{{ row.transportadora || '—' }}</td>
            <td class="td-cd">
              <span v-if="row.cd" class="cd-badge">{{ row.cd }}</span>
              <span v-else>—</span>
            </td>
            <td class="td-num">{{ row.vol ?? '—' }}</td>
            <td class="td-esp">{{ row.esp_vol || '—' }}</td>
            <td class="td-date">{{ row.date || '—' }}</td>
            <td class="td-action">
              <button
                type="button"
                class="btn-info-icon"
                title="Visualizar DANFE"
                @click="openDanfeModal(row)"
              >
                <i class="fas fa-file-pdf"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rodapé de contagem -->
    <div v-if="!loading && agendamentos.length > 0" class="table-footer">
      {{ agendamentos.length }} agendamento{{
        agendamentos.length !== 1 ? 's' : ''
      }}
    </div>

    <!-- Modal de seleção de estoque -->
    <teleport to="body">
      <div
        v-if="estoqueModalOpen"
        class="modal-overlay"
        @click.self="closeEstoqueModal"
      >
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title"
              ><i class="fas fa-warehouse"></i> Selecionar Estoque</span
            >
            <button
              type="button"
              class="modal-close"
              @click="closeEstoqueModal"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-search">
            <i class="fas fa-search modal-search-icon"></i>
            <input
              v-model="estoqueSearch"
              type="text"
              placeholder="Pesquisar estoque..."
              class="modal-search-input"
              ref="estoqueSearchInput"
            />
          </div>
          <div class="modal-body">
            <div v-if="estoqueModalLoading" class="modal-loading">
              <i class="fas fa-spinner fa-spin"></i> Carregando...
            </div>
            <ul v-else class="estoque-list">
              <li
                class="estoque-item"
                :class="{ selected: filterEstoque === '' }"
                @click="selectEstoque('', '')"
              >
                <span class="estoque-name">Todos</span>
              </li>
              <li
                v-for="e in filteredEstoques"
                :key="e.cnpj"
                class="estoque-item"
                :class="{ selected: filterEstoque === e.cnpj }"
                @click="selectEstoque(e.cnpj, e.name)"
              >
                <span class="estoque-name">{{ e.name }}</span>
                <span class="estoque-badge">{{ e.total }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Modal DANFE -->
    <teleport to="body">
      <div
        v-if="danfeModalOpen"
        class="danfe-overlay"
        @click.self="closeDanfeModal"
      >
        <div class="danfe-box">
          <div class="danfe-header">
            <span class="danfe-title">
              <i class="fas fa-file-pdf"></i>
              DANFE — NF {{ danfeRow?.nf_number || '…' }}
            </span>
            <button type="button" class="danfe-close" @click="closeDanfeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="danfe-body">
            <div v-if="danfeLoading" class="danfe-loading">
              <i class="fas fa-spinner fa-spin"></i> Gerando DANFE…
            </div>
            <div v-else-if="danfeError" class="danfe-error">
              <i class="fas fa-exclamation-triangle"></i> {{ danfeError }}
            </div>
            <iframe
              v-else-if="danfeBlobUrl"
              :src="danfeBlobUrl"
              class="danfe-iframe"
            ></iframe>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import apiService from '../services/api.js'
import ExcelJS from 'exceljs'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default {
  name: 'CargaDescargaAgendamentosPage',

  props: {
    user: { type: Object, default: null },
  },

  emits: ['notification'],

  data() {
    return {
      loading: false,
      error: null,
      agendamentos: [],

      // Filtros
      filterEstoque: '',
      filterCD: '',
      filterDataDe: todayISO(),
      filterDataAte: todayISO(),

      // Ordenação
      sortBy: 'date',
      sortDir: 'ASC',

      // Dados auxiliares para filtros
      cds: [],

      exporting: false,

      // Modal DANFE
      danfeModalOpen: false,
      danfeRow: null,
      danfeLoading: false,
      danfeError: null,
      danfeBlobUrl: null,

      // Modal de estoque
      estoqueModalOpen: false,
      estoqueModalLoading: false,
      estoques: [],
      estoqueSearch: '',
      filterEstoqueName: '',

      columns: [
        { key: 'nf_number', label: 'Nº da NF', width: '4%' },
        { key: 'client_name', label: 'Cliente', width: '20%' },
        { key: 'cd', label: 'CD', width: '3%' },
        { key: 'vol', label: 'Vol', width: '4%' },
        { key: 'esp_vol', label: 'Esp Vol', width: '4%' },
        { key: 'date', label: 'Data', width: '3%' },
      ],
    }
  },

  computed: {
    filteredEstoques() {
      const q = this.estoqueSearch.trim().toLowerCase()
      if (!q) return this.estoques
      return this.estoques.filter(e => e.name.toLowerCase().includes(q))
    },
  },

  mounted() {
    this.loadCDs()
    this.fetchAgendamentos()
  },

  methods: {
    async openDanfeModal(row) {
      this.danfeModalOpen = true
      this.danfeRow = row
      this.danfeLoading = true
      this.danfeError = null
      if (this.danfeBlobUrl) {
        URL.revokeObjectURL(this.danfeBlobUrl)
        this.danfeBlobUrl = null
      }
      try {
        const blob = await apiService.getBlob(`/agendamentos/${row.id}/danfe`)
        this.danfeBlobUrl = URL.createObjectURL(blob)
      } catch (e) {
        this.danfeError = `Erro ao carregar DANFE: ${e.message}`
      } finally {
        this.danfeLoading = false
      }
    },

    closeDanfeModal() {
      this.danfeModalOpen = false
      this.danfeRow = null
      this.danfeError = null
      if (this.danfeBlobUrl) {
        URL.revokeObjectURL(this.danfeBlobUrl)
        this.danfeBlobUrl = null
      }
    },

    async openEstoqueModal() {
      this.estoqueModalOpen = true
      this.estoqueModalLoading = true
      this.estoqueSearch = ''
      this.$nextTick(() => this.$refs.estoqueSearchInput?.focus())
      try {
        const data = await apiService.get('/agendamentos/estoques')
        this.estoques = Array.isArray(data) ? data : []
      } catch (e) {
        console.error('[agendamentos] loadEstoques error:', e.message)
      } finally {
        this.estoqueModalLoading = false
      }
    },

    closeEstoqueModal() {
      this.estoqueModalOpen = false
    },

    selectEstoque(cnpj, name) {
      this.filterEstoque = cnpj
      this.filterEstoqueName = name
      this.closeEstoqueModal()
      this.fetchAgendamentos()
    },

    async loadCDs() {
      try {
        const data = await apiService.get('/agendamentos/cds')
        this.cds = Array.isArray(data) ? data : []
      } catch (e) {
        console.error('[agendamentos] loadCDs error:', e.message)
      }
    },

    async fetchAgendamentos() {
      this.loading = true
      this.error = null

      const params = {}
      if (this.filterEstoque) params.estoque = this.filterEstoque
      if (this.filterCD) params.cd = this.filterCD
      if (this.filterDataDe)
        params.data_de = this.formatDateBR(this.filterDataDe)
      if (this.filterDataAte)
        params.data_ate = this.formatDateBR(this.filterDataAte)
      params.sort_by = this.sortBy
      params.sort_dir = this.sortDir

      try {
        const data = await apiService.get('/agendamentos', params)
        this.agendamentos = Array.isArray(data) ? data : []
      } catch (e) {
        const msg = e.message || 'Erro desconhecido'
        this.error = `Erro ao carregar agendamentos: ${msg}`
        this.agendamentos = []
        this.$emit('notification', { message: this.error, type: 'error' })
      } finally {
        this.loading = false
      }
    },

    toggleSort(col) {
      if (this.sortBy === col) {
        this.sortDir = this.sortDir === 'ASC' ? 'DESC' : 'ASC'
      } else {
        this.sortBy = col
        this.sortDir = 'ASC'
      }
      this.fetchAgendamentos()
    },

    clearFilters() {
      this.filterEstoque = ''
      this.filterEstoqueName = ''
      this.filterCD = ''
      this.filterDataDe = todayISO()
      this.filterDataAte = todayISO()
      this.sortBy = 'date'
      this.sortDir = 'ASC'
      this.fetchAgendamentos()
    },

    /** Converte YYYY-MM-DD (input type=date) para DD/MM/YYYY (API). */
    formatDateBR(iso) {
      if (!iso) return ''
      const [y, m, d] = iso.split('-')
      return `${d}/${m}/${y}`
    },

    async exportExcel() {
      if (!this.agendamentos.length) return
      this.exporting = true
      try {
        const now = new Date()
        const dataHoraCriacao = now.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        const userName = this.user?.user || this.user?.name || 'Usuário'

        const filtrosAplicados = [
          `Estoque: ${this.filterEstoqueName || 'Todos'}`,
          `CD: ${this.filterCD || 'Todos'}`,
          `Data de: ${this.filterDataDe ? this.formatDateBR(this.filterDataDe) : 'Início'}`,
          `Data até: ${this.filterDataAte ? this.formatDateBR(this.filterDataAte) : 'Sempre'}`,
        ]

        const tableHeaders = [
          'Nº da NF',
          'Cliente',
          'Transportadora',
          'CD',
          'Vol',
          'Esp Vol',
          'Data',
        ]
        const numCols = tableHeaders.length

        const dataRows = this.agendamentos.map(row => [
          row.nf_number || '',
          row.client_name || '',
          row.transportadora || '',
          row.cd || '',
          row.vol ?? '',
          row.esp_vol || '',
          row.date || '',
        ])

        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Portal Mercocamp'
        workbook.created = now

        const worksheet = workbook.addWorksheet(
          'Agendamentos - Carga e Descarga',
          {
            properties: { defaultRowHeight: 18 },
          }
        )

        const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
        const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }
        const lightBlueFill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' },
        }

        // ── Linha 1: Título ──
        worksheet.mergeCells(1, 1, 1, numCols)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'AGENDAMENTOS — CARGA E DESCARGA'
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

        // ── Linha 2: Subtítulo ──
        worksheet.mergeCells(2, 1, 2, numCols)
        const subtitleCell = worksheet.getCell('A2')
        subtitleCell.value = 'Portal de Agendamento — Grupo Mercocamp'
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

        // ── Linha 3: Vazia ──
        worksheet.getRow(3).height = 10

        // ── Linha 4: Filtros (célula mesclada) ──
        worksheet.mergeCells(4, 1, 4, numCols)
        const row4Cell = worksheet.getCell('A4')
        row4Cell.value = `Filtros: ${filtrosAplicados.join(' | ')}`
        row4Cell.font = { size: 10 }
        row4Cell.fill = lightBlueFill
        row4Cell.border = {
          top: thinBorder,
          bottom: thinBorder,
          left: thinBorder,
          right: thinBorder,
        }
        row4Cell.alignment = { horizontal: 'center', vertical: 'middle' }

        // ── Linha 5: Vazia ──
        worksheet.getRow(5).height = 10

        // ── Linha 6: Tabela com cabeçalhos e filtros nativos ──
        worksheet.addTable({
          name: 'AgendamentosCargaDescarga',
          ref: 'A6',
          headerRow: true,
          style: { theme: null, showRowStripes: false },
          columns: tableHeaders.map(h => ({ name: h, filterButton: true })),
          rows: dataRows,
        })

        // Formatação do cabeçalho (sobrepõe estilo padrão da tabela)
        const headerRow = worksheet.getRow(6)
        tableHeaders.forEach((_header, index) => {
          const cell = headerRow.getCell(index + 1)
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

        // ── Formatação das linhas de dados ──
        const leftAlignCols = [1, 2] // Cliente, Transportadora
        let currentRow = 7
        dataRows.forEach((rowData, rowIndex) => {
          const row = worksheet.getRow(currentRow)
          const isFirstRow = rowIndex === 0
          const isLastRow = rowIndex === dataRows.length - 1
          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1)
            cell.font = { size: 10 }
            cell.alignment = {
              horizontal: leftAlignCols.includes(colIndex) ? 'left' : 'center',
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
          row.height = 18
          currentRow++
        })

        // ── Rodapé ──
        currentRow++
        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const footerCell1 = worksheet.getCell(currentRow, 1)
        footerCell1.value = `Arquivo gerado pelo usuário ${userName} no dia ${dataHoraCriacao} pelo Portal de Agendamento do Grupo Mercocamp`
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

        // ── Largura das colunas ──
        const minWidths = [12, 35, 30, 8, 6, 10, 14]
        tableHeaders.forEach((header, index) => {
          let maxLen = header.length
          dataRows.forEach(r => {
            const v = String(r[index] || '')
            if (v.length > maxLen) maxLen = v.length
          })
          worksheet.getColumn(index + 1).width = Math.min(
            Math.max(maxLen + 3, minWidths[index] || 12),
            50
          )
        })

        // ── Download ──
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
        const fileName = `CargaDescarga_Agendamentos_${dateStr}.xlsx`
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)

        this.$emit('notification', {
          message: `${this.agendamentos.length} agendamento(s) exportados para ${fileName}`,
          type: 'success',
        })
      } catch (error) {
        console.error('❌ Erro ao exportar para Excel:', error)
        this.$emit('notification', {
          message: 'Erro ao exportar para Excel. Tente novamente.',
          type: 'error',
        })
      } finally {
        this.exporting = false
      }
    },
  },
}
</script>

<style scoped>
.agendamentos-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

/* ── Cabeçalho ── */
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
  gap: 8px;
  align-items: center;
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

.filter-select,
.filter-input {
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

.filter-select:focus,
.filter-input:focus {
  border-color: var(--primary);
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding-bottom: 0;
}

/* ── Botões ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    opacity 0.15s,
    background 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-buscar {
  background: var(--primary);
  color: var(--white);
}

.btn-buscar:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-limpar {
  background: var(--gray-100);
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
}

.btn-limpar:hover:not(:disabled) {
  background: var(--gray-200);
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

.btn-excel {
  background: #1d6f42;
  color: #ffffff;
  border: 1px solid #155e38;
}

.btn-excel:hover:not(:disabled) {
  background: #155e38;
}

.btn-excel:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Erro ── */
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

/* ── Tabela ── */
.table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  background: var(--white);
}

.agendamentos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
  table-layout: auto;
}

.agendamentos-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--gray-50);
}

.sortable-th {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: var(--gray-600);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--gray-200);
  border-right: 1px solid var(--gray-200);
  transition: background 0.1s;
}

.sortable-th:hover {
  background: var(--gray-100);
}

.sortable-th.sort-active {
  color: var(--primary);
}

.sort-icon {
  margin-left: 4px;
  font-size: 0.7rem;
}

.sort-inactive {
  color: var(--gray-300);
}

.th-action {
  padding: 10px 14px;
  border-bottom: 1px solid var(--gray-200);
  width: 3%;
}

.sortable-th:last-of-type,
.data-row td:last-child {
  border-right: none;
}

.agendamentos-table tbody tr {
  border-bottom: 1px solid var(--gray-100);
  transition: background 0.1s;
}

.agendamentos-table tbody tr:hover {
  background: var(--gray-50);
}

.data-row td {
  padding: 9px 14px;
  color: var(--gray-700);
  vertical-align: middle;
  border-right: 1px solid var(--gray-200);
}

.td-client {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-transportadora {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-cd {
  white-space: nowrap;
}

.cd-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.78rem;
  font-weight: 600;
}

.td-num {
  white-space: nowrap;
}

.td-esp {
  max-width: 10ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-date {
  white-space: nowrap;
}

.td-action {
  text-align: center;
}

.btn-info-icon {
  background: none;
  border: 1px solid var(--gray-300);
  border-radius: 5px;
  padding: 4px 7px;
  cursor: pointer;
  color: var(--gray-500);
  font-size: 0.9rem;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.btn-info-icon:hover {
  color: var(--primary);
  border-color: var(--primary);
}

.td-loading,
.td-empty {
  padding: 40px;
  text-align: center;
  color: var(--gray-400);
  font-size: 0.9rem;
}

/* ── Rodapé ── */
.table-footer {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: var(--gray-400);
  text-align: right;
  padding: 0 4px;
}

/* ── Botão de seleção de estoque ── */
.btn-estoque-select {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 34px;
  min-width: 160px;
  padding: 0 10px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  background: var(--white);
  font-size: 0.83rem;
  color: var(--gray-700);
  cursor: pointer;
  transition: border-color 0.15s;
}

.btn-estoque-select:hover:not(:disabled) {
  border-color: var(--primary);
}

.btn-estoque-select.has-value {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-estoque-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-estoque-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-estoque-icon {
  font-size: 0.7rem;
  color: var(--gray-400);
  flex-shrink: 0;
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
  width: 462px;
  max-width: 95vw;
  height: 98vh;
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

.modal-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--gray-200);
  flex-shrink: 0;
}

.modal-search-icon {
  color: var(--gray-400);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.modal-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.85rem;
  color: var(--gray-700);
  background: transparent;
}

.modal-search-input::placeholder {
  color: var(--gray-400);
}

.modal-body {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

.modal-loading {
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
  cursor: pointer;
  transition: background 0.1s;
  gap: 12px;
}

.estoque-item:hover {
  background: var(--gray-50);
}

.estoque-item.selected {
  background: var(--primary-light);
}

.estoque-item.selected .estoque-name {
  color: var(--primary-dark);
  font-weight: 600;
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

/* ── Modal DANFE ── */
.danfe-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.danfe-box {
  width: 98vw;
  height: 98vh;
  background: var(--white);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.danfe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50);
  flex-shrink: 0;
}

.danfe-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gray-800);
  display: flex;
  align-items: center;
  gap: 8px;
}

.danfe-title i {
  color: #e53e3e;
}

.danfe-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gray-400);
  font-size: 1.1rem;
  padding: 4px;
  transition: color 0.15s;
}

.danfe-close:hover {
  color: var(--gray-700);
}

.danfe-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
}

.danfe-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.danfe-loading,
.danfe-error {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--gray-500);
}

.danfe-error {
  color: #c53030;
}
</style>
