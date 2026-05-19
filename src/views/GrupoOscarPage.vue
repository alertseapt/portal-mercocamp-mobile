<template>
  <div class="grupo-oscar-page">
    <div class="page-header-row">
      <div class="page-header">
        <h1>
          <i class="fas fa-building"></i>
          Grupo Oscar
        </h1>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="btn btn-processo"
          @click="showModalProcesso = true"
        >
          <i class="fas fa-info-circle"></i>
          Processo
        </button>
        <button
          type="button"
          class="btn btn-refresh-icon"
          @click="loadData(true)"
          :disabled="loading"
          title="Atualizar lista"
        >
          <i
            :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          ></i>
        </button>
      </div>
    </div>

    <!-- Barra de pesquisa -->
    <div class="search-row">
      <input
        v-model="searchInput"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Digite apenas números para buscar (Pedido, NF entrada ou NF saída)"
        class="search-input"
        :disabled="loading"
        @keyup.enter="handleSearch"
        @input="onSearchInput"
      />
      <button
        type="button"
        class="btn btn-buscar"
        @click="handleSearch"
        :disabled="loading"
      >
        <i class="fas fa-search"></i>
        Buscar
      </button>
      <button
        type="button"
        class="btn btn-limpar"
        @click="clearSearch"
        :disabled="loading || (!searchInput && !searchApplied)"
        title="Limpar busca e mostrar todos os agendamentos"
      >
        <i class="fas fa-eraser"></i>
        Limpar
      </button>
    </div>

    <!-- Filtros por processo + Exportar Excel -->
    <div class="filter-buttons-row">
      <div class="filter-buttons-group">
        <button
          type="button"
          class="filter-btn"
          :class="{ active: filtroProcesso === null }"
          @click="filtroProcesso = null"
        >
          Todos
        </button>
        <button
          v-for="p in processosLista"
          :key="p"
          type="button"
          class="filter-btn"
          :class="{ active: filtroProcesso === p }"
          @click="filtroProcesso = p"
        >
          {{ p }}
          <span
            v-if="p !== 'Finalizado'"
            class="filter-count-badge"
            :class="[
              'processo-' + slugProcesso(p),
              { 'count-loading': !countsByProcesso },
            ]"
            >{{ contagemExibida(p) }}</span
          >
        </button>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-success export-btn-header"
        @click="exportToExcel"
        :disabled="exportingExcel"
        title="Exportar para Excel (todos os agendamentos do estoque)"
      >
        <i v-if="exportingExcel" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-file-excel"></i>
        Exportar Excel
      </button>
    </div>

    <!-- Tabela -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr class="header-group-row">
            <th colspan="4" class="header-group header-entrada">Entrada</th>
            <th colspan="4" class="header-group header-saida">Saída</th>
          </tr>
          <tr>
            <th class="header-centered">Pedido</th>
            <th class="header-centered">N° NF entrada</th>
            <th class="header-centered">Status</th>
            <th
              class="header-centered sortable-th"
              @click="toggleSort('entrada')"
              title="Ordenar por Dt alteração (Entrada)"
            >
              Dt alteração
              <i
                :class="
                  sortColumn === 'entrada'
                    ? sortDirection === 'asc'
                      ? 'fas fa-sort-up'
                      : 'fas fa-sort-down'
                    : 'fas fa-sort'
                "
                class="sort-icon"
              ></i>
            </th>
            <th class="header-centered">N° NF saída</th>
            <th class="header-centered">Status</th>
            <th
              class="header-centered sortable-th"
              @click="toggleSort('saida')"
              title="Ordenar por Dt alteração (Saída)"
            >
              Dt alteração
              <i
                :class="
                  sortColumn === 'saida'
                    ? sortDirection === 'asc'
                      ? 'fas fa-sort-up'
                      : 'fas fa-sort-down'
                    : 'fas fa-sort'
                "
                class="sort-icon"
              ></i>
            </th>
            <th class="header-centered">Processo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && listagem.length === 0">
            <td colspan="8" class="loading-cell">
              <i class="fas fa-spinner fa-spin"></i>
              Carregando...
            </td>
          </tr>
          <tr v-else-if="!loading && listagemFiltrada.length === 0">
            <td colspan="8" class="empty-cell">Nenhum registro encontrado.</td>
          </tr>
          <tr v-for="row in listagemPagina" :key="row.id" class="data-row">
            <td>{{ row.pedido }}</td>
            <td
              class="col-numero clickable-cell"
              @click="openScheduleInfo(row)"
              title="Ver informações do agendamento"
            >
              {{ row.nf_entrada }}
            </td>
            <td
              class="col-status clickable-cell"
              @click="openScheduleInfo(row)"
              title="Ver informações do agendamento"
            >
              <span
                class="status-badge status-badge-full"
                :class="getStatusDisplayForEntrada(row.status_entrada).useClass"
                :style="getStatusDisplayForEntrada(row.status_entrada).style"
                >{{
                  getStatusDisplayForEntrada(row.status_entrada).label
                }}</span
              >
            </td>
            <td
              class="col-dt-alteracao clickable-cell"
              @click="openScheduleInfo(row)"
              title="Ver informações do agendamento"
            >
              <span v-if="row.dt_alteracao_entrada" class="dt-alteracao-cell">
                <span class="dt-date">{{
                  formatDtAlteracaoDate(row.dt_alteracao_entrada)
                }}</span>
                <span class="dt-time">{{
                  formatDtAlteracaoTime(row.dt_alteracao_entrada)
                }}</span>
              </span>
              <span v-else>-</span>
            </td>
            <td
              class="col-numero"
              :class="{ 'clickable-cell': hasOrder(row) }"
              @click="openOrderInfo(row)"
              :title="hasOrder(row) ? 'Ver informações do pedido de saída' : ''"
            >
              {{ row.nf_saida }}
            </td>
            <td
              class="col-status"
              :class="{ 'clickable-cell': hasOrder(row) }"
              @click="openOrderInfo(row)"
              :title="
                hasOrder(row)
                  ? getInfoTooltipSaida(row) ||
                    'Ver informações do pedido de saída'
                  : ''
              "
            >
              <span
                v-if="temStatusSaida(row)"
                class="status-badge status-badge-saida status-badge-full"
                :class="getStatusClassSaida(row.status_saida)"
              >
                {{ getStatusLabelSaida(row.status_saida) }}
                <i
                  v-if="hasInfoIconSaida(row)"
                  class="fas fa-info-circle rejection-icon"
                ></i>
              </span>
              <span v-else>{{ row.status_saida || '-' }}</span>
            </td>
            <td
              class="col-dt-alteracao"
              :class="{ 'clickable-cell': hasOrder(row) }"
              @click="openOrderInfo(row)"
              :title="hasOrder(row) ? 'Ver informações do pedido de saída' : ''"
            >
              <span v-if="row.dt_alteracao_saida" class="dt-alteracao-cell">
                <span class="dt-date">{{
                  formatDtAlteracaoDate(row.dt_alteracao_saida)
                }}</span>
                <span class="dt-time">{{
                  formatDtAlteracaoTime(row.dt_alteracao_saida)
                }}</span>
              </span>
              <span v-else>-</span>
            </td>
            <td class="col-processo">
              <span
                class="processo-badge processo-badge-full"
                :class="'processo-' + slugProcesso(row.processo)"
              >
                {{ row.processo }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <div
      v-if="!loading && (listagemFiltrada.length > 0 || totalFromApi > 0)"
      class="pagination-row"
    >
      <span class="pagination-info">
        Exibindo {{ paginacaoInfo.inicio }}-{{ paginacaoInfo.fim }} de
        {{ paginacaoInfo.total }}
        {{ paginacaoInfo.total === 1 ? 'registro' : 'registros' }} ({{
          useBackendPagination ? limitFromApi : ITENS_POR_PAGINA
        }}
        por página)
      </span>
      <div class="pagination-controls">
        <button
          type="button"
          class="btn-pagination"
          :disabled="paginaAtual <= 1"
          @click="goToPage(1)"
          title="Primeira página"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button
          type="button"
          class="btn-pagination"
          :disabled="paginaAtual <= 1"
          @click="goToPage(paginaAtual - 1)"
          title="Página anterior"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        <span class="pagination-page">
          Página {{ paginaAtual }} de {{ totalPaginas }}
        </span>
        <button
          type="button"
          class="btn-pagination"
          :disabled="paginaAtual >= totalPaginas"
          @click="goToPage(paginaAtual + 1)"
          title="Próxima página"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button
          type="button"
          class="btn-pagination"
          :disabled="paginaAtual >= totalPaginas"
          @click="goToPage(totalPaginas)"
          title="Última página"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal Processo -->
    <Teleport to="body">
      <div
        v-if="showModalProcesso"
        class="modal-overlay"
        @click.self="showModalProcesso = false"
      >
        <div class="modal-content modal-processo">
          <div class="modal-header">
            <h3>Fluxo do Processo</h3>
            <button
              type="button"
              class="modal-close"
              @click="showModalProcesso = false"
              aria-label="Fechar"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="processo-list">
              <div class="processo-item">
                <strong>Entrada</strong>
                <p>
                  Quando o agendamento possui status diferente de "Em estoque".
                </p>
              </div>
              <div class="processo-item">
                <strong>Integração saída</strong>
                <p>
                  Quando o agendamento está com status "Em estoque", ainda não
                  possui pedido de saída vinculado e o tempo decorrido desde a
                  mudança para "Em estoque" é menor que o tempo configurado para
                  integração.
                </p>
              </div>
              <div class="processo-item">
                <strong>Alerta MC</strong>
                <p>
                  Quando o agendamento está com status "Em estoque", não possui
                  pedido de saída vinculado, o tempo decorrido ultrapassou o
                  tempo configurado para integração e a NF-e ainda não foi
                  enviada ao WMS Oscar (sem registro com status 200 em
                  webhookoscar.wms_jsons).
                </p>
              </div>
              <div class="processo-item">
                <strong>Alerta OS</strong>
                <p>
                  Mesmo critério de Alerta MC, porém a NF-e já foi enviada ao
                  WMS Oscar com sucesso (registro com status_code 200 em
                  webhookoscar.wms_jsons), indicando que o alerta é no lado do
                  Oscar (OS).
                </p>
              </div>
              <div class="processo-item">
                <strong>Separação</strong>
                <p>
                  Quando o agendamento está com status "Em estoque" e o pedido
                  de saída associado (encontrado na tabela orders por NUMPEDCLI
                  e CNPJ do estoque) possui status diferente de "EMBARCADO".
                </p>
              </div>
              <div class="processo-item">
                <strong>Finalizado</strong>
                <p>
                  Quando o agendamento está com status "Finalizado" e o pedido
                  de saída associado possui status "EMBARCADO".
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <p class="modal-footer-info">
              Os agendamentos listados têm criação a partir de
              {{ dataInicioFormatada }}.
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Detalhes do Pedido de Saída -->
    <OrderDetailsModal
      :show-modal="showOrderDetailsModal"
      :order-data="selectedOrder"
      @close="closeOrderDetailsModal"
      @refresh-order="refreshOrderDetails"
    />
  </div>
</template>

<script>
import ExcelJS from 'exceljs'
import { BASE_URL } from '../config/api.js'
import {
  ensureStatusConfigCache,
  getStatusDisplayInfo,
} from '../utils/statusConfigCache.js'
import { buildListagemFromOrdersAndSchedules } from '../utils/grupoOscarUtils.js'
import { useNfeInfoModalStore } from '../stores/nfeInfoModal.js'
import OrderDetailsModal from '../components/OrderDetailsModal.vue'

/** Data mínima de criação dos agendamentos listados (DD/MM/YYYY) - deve coincidir com GRUPO_OSCAR_DATA_INICIO no backend */
const GRUPO_OSCAR_DATA_INICIO = '2024-01-01'

/** Itens por página na paginação */
const ITENS_POR_PAGINA = 200

export default {
  name: 'GrupoOscarPage',
  components: {
    OrderDetailsModal,
  },
  props: {
    user: { type: Object, default: null },
  },
  data() {
    return {
      ITENS_POR_PAGINA,
      loading: false,
      listagem: [],
      showOrderDetailsModal: false,
      selectedOrder: null,
      loadingOrderDetails: false,
      searchInput: '',
      searchApplied: '',
      filtroProcesso: null,
      paginaAtual: 1,
      totalFromApi: 0,
      pageFromApi: 1,
      limitFromApi: ITENS_POR_PAGINA,
      showModalProcesso: false,
      processosLista: [
        'Entrada',
        'Integração saída',
        'Alerta',
        'Separação',
        'Finalizado',
      ],
      exportingExcel: false,
      loadDataDebounceTimer: null,
      loadDataAbortController: null,
      sortColumn: null,
      sortDirection: 'asc',
      /** Contagens por processo (todos não finalizados) - carregadas em background, null até pronto */
      countsByProcesso: null,
      /** Cache dos dados não finalizados: ao voltar de Finalizado, restaura imediatamente sem refetch */
      listagemNonFinalizadoCache: null,
      listagemNonFinalizadoCacheAt: null,
    }
  },
  computed: {
    dataInicioFormatada() {
      const [y, m, d] = GRUPO_OSCAR_DATA_INICIO.split('-')
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
    },
    /** Usa paginação no backend apenas para Todos e Finalizado (sem busca e sem ordenação ativa) */
    useBackendPagination() {
      if (this.searchApplied) return false
      if (this.sortColumn) return false
      return (
        this.filtroProcesso === null || this.filtroProcesso === 'Finalizado'
      )
    },
    listagemFiltrada() {
      if (this.useBackendPagination) {
        return this.listagem
      }
      let items = this.listagem

      if (this.searchApplied) {
        const term = String(this.searchApplied).replace(/\D/g, '')
        items = items.filter(r => {
          const ped = String(r.pedido || '').replace(/\D/g, '')
          const nfE = String(r.nf_entrada || '').replace(/\D/g, '')
          const nfS = String(r.nf_saida || '').replace(/\D/g, '')
          return ped.includes(term) || nfE.includes(term) || nfS.includes(term)
        })
      } else if (this.filtroProcesso) {
        if (this.filtroProcesso === 'Alerta') {
          items = items.filter(r => r.processo === 'Alerta MC' || r.processo === 'Alerta OS')
        } else {
          items = items.filter(r => r.processo === this.filtroProcesso)
        }
      } else if (!this.sortColumn) {
        items = items.filter(r => r.processo !== 'Finalizado')
      }

      if (this.sortColumn) {
        const col =
          this.sortColumn === 'entrada'
            ? 'dt_alteracao_entrada'
            : 'dt_alteracao_saida'
        const dir = this.sortDirection === 'asc' ? 1 : -1
        items = [...items].sort((a, b) => {
          const aVal = a[col] ? new Date(a[col]).getTime() : null
          const bVal = b[col] ? new Date(b[col]).getTime() : null
          if (aVal === null && bVal === null) return 0
          if (aVal === null) return 1
          if (bVal === null) return -1
          return (aVal - bVal) * dir
        })
      }

      return items
    },
    listagemPagina() {
      if (this.useBackendPagination) {
        return this.listagemFiltrada
      }
      const inicio = (this.paginaAtual - 1) * ITENS_POR_PAGINA
      return this.listagemFiltrada.slice(inicio, inicio + ITENS_POR_PAGINA)
    },
    totalPaginas() {
      if (this.useBackendPagination) {
        return Math.ceil(this.totalFromApi / this.limitFromApi) || 1
      }
      return Math.ceil(this.listagemFiltrada.length / ITENS_POR_PAGINA) || 1
    },
    paginacaoInfo() {
      if (this.useBackendPagination) {
        const total = this.totalFromApi
        const inicio =
          total === 0
            ? 0
            : Math.min((this.paginaAtual - 1) * this.limitFromApi + 1, total)
        const fim =
          total === 0
            ? 0
            : Math.min(this.paginaAtual * this.limitFromApi, total)
        return { inicio, fim, total }
      }
      const total = this.listagemFiltrada.length
      const inicio =
        total === 0 ? 0 : (this.paginaAtual - 1) * ITENS_POR_PAGINA + 1
      const fim = Math.min(this.paginaAtual * ITENS_POR_PAGINA, total)
      return { inicio, fim, total }
    },
    contagemPorProcesso() {
      const contagem = {}
      for (const row of this.listagem) {
        const p = row.processo
        if (p) {
          contagem[p] = (contagem[p] || 0) + 1
        }
      }
      return contagem
    },
    /** Valor exibido no badge: usa countsByProcesso quando carregado (incl. 0), senão '...' */
    contagemExibida() {
      return p => {
        if (this.countsByProcesso && p in this.countsByProcesso) {
          return this.countsByProcesso[p]
        }
        return '...'
      }
    },
  },
  watch: {
    filtroProcesso(newVal, oldVal) {
      this.paginaAtual = 1
      if (this.loadDataDebounceTimer) clearTimeout(this.loadDataDebounceTimer)

      const isNonFinalizado = v =>
        ['Entrada', 'Integração saída', 'Alerta', 'Separação'].includes(v)
      const precisaRecarregar =
        newVal === 'Finalizado' ||
        oldVal === 'Finalizado' ||
        isNonFinalizado(newVal)

      if (precisaRecarregar) {
        // Ao voltar de Finalizado: restaura cache imediatamente (evita tabela vazia)
        if (
          oldVal === 'Finalizado' &&
          isNonFinalizado(newVal) &&
          this.listagemNonFinalizadoCache
        ) {
          const maxAge = 5 * 60 * 1000 // 5 min
          if (
            this.listagemNonFinalizadoCacheAt &&
            Date.now() - this.listagemNonFinalizadoCacheAt < maxAge
          ) {
            this.listagem = this.listagemNonFinalizadoCache
            this.totalFromApi = this.listagemNonFinalizadoCache.length
            this.pageFromApi = 1
            this.limitFromApi = ITENS_POR_PAGINA
            this.loading = false
          }
        }

        this.loadDataDebounceTimer = setTimeout(() => {
          this.loadDataDebounceTimer = null
          this.loadData()
        }, 600)
      }
    },
    searchApplied() {
      this.paginaAtual = 1
    },
    listagemFiltrada() {
      if (this.paginaAtual > this.totalPaginas && this.totalPaginas > 0) {
        this.paginaAtual = this.totalPaginas
      }
    },
  },
  async mounted() {
    await ensureStatusConfigCache()
    this.loadData()
    this.loadCountsForFilters()
  },
  methods: {
    /** Carrega contagens completas em background para os badges (não finalizados) */
    async loadCountsForFilters() {
      try {
        const params = new URLSearchParams()
        params.set('processo', 'Entrada')
        params.set('limit', '50000')
        const token = localStorage.getItem('token')
        const res = await fetch(
          `${BASE_URL}/schedules/grupo-oscar?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (!res.ok) return
        const json = await res.json().catch(() => ({}))
        const orders = json.orders || []
        const schedules = json.schedules || []
        const integrationMin = json.schedule_order_integration_minutes ?? 0
        const fullListagem = buildListagemFromOrdersAndSchedules(
          orders,
          schedules,
          integrationMin,
          json.wms_oscar_sent_keys || []
        )
        const contagem = {}
        this.processosLista.forEach(p => {
          contagem[p] = 0
        })
        for (const row of fullListagem) {
          const p = (row.processo === 'Alerta MC' || row.processo === 'Alerta OS') ? 'Alerta' : row.processo
          if (p) contagem[p] = (contagem[p] || 0) + 1
        }
        this.countsByProcesso = contagem
        this.listagemNonFinalizadoCache = fullListagem
        this.listagemNonFinalizadoCacheAt = Date.now()
      } catch (_) {
        // Mantém "..." nos badges até o usuário clicar em um filtro (que carrega dataset completo)
      }
    },
    async loadData(forceRefresh = false, pageOverride = null) {
      if (this.loadDataAbortController) this.loadDataAbortController.abort()
      this.loadDataAbortController = new AbortController()

      // Atalho de memória: busca ou ordenação sobre dados já carregados localmente.
      // Evita round-trip ao servidor quando o cache do frontend está fresco (< 5 min).
      const CACHE_TTL_MS = 5 * 60 * 1000
      const cacheIsFresh =
        this.listagemNonFinalizadoCache !== null &&
        this.listagemNonFinalizadoCacheAt !== null &&
        Date.now() - this.listagemNonFinalizadoCacheAt < CACHE_TTL_MS
      const needsFullDataset =
        (this.searchApplied && this.filtroProcesso !== 'Finalizado') ||
        (this.sortColumn && (this.filtroProcesso === null || !['Entrada', 'Integração saída', 'Alerta', 'Separação', 'Finalizado'].includes(this.filtroProcesso)))
      if (!forceRefresh && cacheIsFresh && needsFullDataset) {
        this.listagem = this.listagemNonFinalizadoCache
        this.totalFromApi = this.listagemNonFinalizadoCache.length
        this.loading = false
        return
      }

      this.loading = true
      try {
        const params = new URLSearchParams()
        if (this.filtroProcesso && !this.searchApplied) {
          params.set('processo', this.filtroProcesso)
        }
        if (this.searchApplied) {
          params.set('search', this.searchApplied)
        }
        if (forceRefresh) {
          params.set('refresh', '1')
        }
        const page = pageOverride != null ? pageOverride : this.paginaAtual
        const useBackend =
          this.filtroProcesso === null || this.filtroProcesso === 'Finalizado'
        const usePaginatedBackend =
          useBackend && !this.searchApplied && !this.sortColumn
        params.set('page', String(usePaginatedBackend ? page : 1))
        params.set(
          'limit',
          String(usePaginatedBackend ? ITENS_POR_PAGINA : 50000)
        )
        const qs = params.toString()
        const url = `${BASE_URL}/schedules/grupo-oscar${qs ? '?' + qs : ''}`

        const token = localStorage.getItem('token')
        const res = await fetch(url, {
          signal: this.loadDataAbortController.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        let json
        try {
          const text = await res.text()
          if (res.status === 502 || res.status === 504) {
            throw new Error(
              'A consulta demorou muito e expirou. Tente novamente.'
            )
          }
          json = text.trim() ? JSON.parse(text) : {}
        } catch (parseErr) {
          if (parseErr instanceof SyntaxError) {
            throw new Error('Resposta inválida do servidor. Tente novamente.')
          }
          throw parseErr
        }
        if (!res.ok) {
          const msg =
            res.status === 403
              ? 'Acesso negado.'
              : json?.message || json?.error || 'Erro ao carregar dados'
          throw new Error(msg)
        }
        const orders = json.orders || []
        const schedules = json.schedules || []
        const integrationMin = json.schedule_order_integration_minutes ?? 0
        this.listagem = buildListagemFromOrdersAndSchedules(
          orders,
          schedules,
          integrationMin,
          json.wms_oscar_sent_keys || []
        )
        this.totalFromApi = json.total ?? this.listagem.length
        this.pageFromApi = json.page ?? 1
        this.limitFromApi = json.limit ?? ITENS_POR_PAGINA
        // Quando carregamos dataset completo (filtro Entrada/etc), atualizar contagens + cache para voltar de Finalizado
        if (!useBackend) {
          const contagem = {}
          this.processosLista.forEach(p => {
            contagem[p] = 0
          })
          for (const row of this.listagem) {
            const p = (row.processo === 'Alerta MC' || row.processo === 'Alerta OS') ? 'Alerta' : row.processo
            if (p) contagem[p] = (contagem[p] || 0) + 1
          }
          this.countsByProcesso = contagem
          this.listagemNonFinalizadoCache = [...this.listagem]
          this.listagemNonFinalizadoCacheAt = Date.now()
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        this.$emit(
          'notification',
          err.message || 'Erro ao carregar dados do Grupo Oscar',
          'error'
        )
        this.listagem = []
      } finally {
        this.loading = false
      }
    },
    toggleSort(column) {
      const wasBackend = this.useBackendPagination
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortColumn = column
        this.sortDirection = 'asc'
      }
      this.paginaAtual = 1
      // Se estava em modo backend (dados parciais), recarrega tudo para ordenar globalmente
      if (wasBackend) {
        this.loadData()
      }
    },
    goToPage(page) {
      this.paginaAtual = Math.max(1, Math.min(page, this.totalPaginas))
      if (this.useBackendPagination) {
        this.loadData(false, this.paginaAtual)
      }
    },
    onSearchInput(e) {
      this.searchInput = (e.target?.value || '').replace(/[^0-9]/g, '')
    },
    handleSearch() {
      this.searchApplied = (this.searchInput || '').trim()
      this.paginaAtual = 1
      this.loadData()
    },
    clearSearch() {
      if (!this.searchInput && !this.searchApplied) return
      this.searchInput = ''
      this.searchApplied = ''
      this.paginaAtual = 1
      this.loadData()
    },
    formatDtAlteracaoDate(isoStr) {
      if (!isoStr) return ''
      try {
        const d = new Date(isoStr)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      } catch (_) {
        return ''
      }
    },
    formatDtAlteracaoTime(isoStr) {
      if (!isoStr) return ''
      try {
        const d = new Date(isoStr)
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        return `${h}:${m}`
      } catch (_) {
        return ''
      }
    },
    temNfSaida(row) {
      const nf = String(row?.nf_saida || '').trim()
      return nf !== '' && nf !== '-'
    },
    /** Indica se há um status de saída para exibir com badge (não depende de NF) */
    temStatusSaida(row) {
      const s = String(row?.status_saida || '').trim()
      return s !== '' && s !== '-'
    },
    getStatusDisplayForEntrada(status) {
      const fallback = () => ({ class: 'status-entrada', label: status || '-' })
      return getStatusDisplayInfo(status, fallback)
    },
    slugProcesso(p) {
      if (!p) return ''
      return String(p)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    },
    getStatusLabelSaida(status) {
      const labels = {
        criado: 'Criado',
        pendente: 'Pendente',
        integrado: 'Integrado',
        separando: 'Separando',
        separado: 'Separado',
        embarcado: 'Embarcado',
        rejeitado: 'Rejeitado',
        erro: 'Erro',
        erro_token: 'Erro - Token',
        erro_corpem: 'Erro - CorpEM',
        erro_envio: 'Erro - Envio',
        multiplo: 'MÚLTIPLO',
      }
      const key = String(status || '')
        .trim()
        .toLowerCase()
      return labels[key] || status || '-'
    },
    getStatusClassSaida(status) {
      const classes = {
        criado: 'status-criado',
        pendente: 'status-pendente',
        integrado: 'status-integrado',
        separando: 'status-separando',
        separado: 'status-separado',
        embarcado: 'status-embarcado',
        rejeitado: 'status-rejeitado',
        erro: 'status-erro',
        erro_token: 'status-erro',
        erro_corpem: 'status-erro',
        erro_envio: 'status-erro',
        multiplo: 'status-multiplo',
      }
      const key = String(status || '')
        .trim()
        .toLowerCase()
      return classes[key] || 'status-default'
    },
    /** Indica se o row tem pedido de saída associado (necessário para abrir o modal de pedido). */
    hasOrder(row) {
      return row?.order_id != null
    },
    /** Abre o NfeInfoModal (instância única) com os dados completos do agendamento. */
    async openScheduleInfo(row) {
      if (!row?.id) return
      const store = useNfeInfoModalStore()
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${BASE_URL}/schedules/${row.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        const json = await res.json().catch(() => ({}))
        const fullSchedule =
          json?.schedule ?? json?.data?.schedule ?? json
        store.openWithSchedule(
          fullSchedule && typeof fullSchedule === 'object'
            ? fullSchedule
            : { id: row.id }
        )
      } catch (err) {
        console.error('Erro ao carregar detalhes do agendamento:', err)
        store.openWithSchedule({ id: row.id })
      }
    },
    /** Abre o OrderDetailsModal carregando os dados do pedido de saída via /expeditions/:id. */
    async openOrderInfo(row) {
      if (!this.hasOrder(row)) return
      this.loadingOrderDetails = true
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(
          `${BASE_URL}/expeditions/${row.order_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && json?.pedido) {
          this.selectedOrder = json.pedido
          this.showOrderDetailsModal = true
        } else {
          this.$emit(
            'notification',
            json?.error || json?.message || 'Erro ao carregar detalhes do pedido',
            'error'
          )
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err)
        this.$emit('notification', 'Erro ao carregar detalhes do pedido', 'error')
      } finally {
        this.loadingOrderDetails = false
      }
    },
    closeOrderDetailsModal() {
      this.showOrderDetailsModal = false
      this.selectedOrder = null
    },
    async refreshOrderDetails({ orderId } = {}) {
      if (orderId == null || !this.selectedOrder) return
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${BASE_URL}/expeditions/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && json?.pedido) {
          this.selectedOrder = json.pedido
        }
      } catch (err) {
        console.error('Erro ao atualizar detalhes do pedido:', err)
      }
    },
    hasInfoIconSaida(row) {
      if (!row || !this.temNfSaida(row)) return false
      if (row.rejection_code_saida) return true
      const s = String(row.status_saida || '').toLowerCase()
      return ['erro', 'erro_token', 'erro_corpem', 'erro_envio'].includes(s)
    },
    getInfoTooltipSaida(row) {
      if (!row || !this.temNfSaida(row)) return ''
      if (row.rejection_code_saida) {
        return this.getRejectionTooltipSaida(row.rejection_code_saida)
      }
      const s = String(row.status_saida || '').toLowerCase()
      if (['erro', 'erro_token', 'erro_corpem', 'erro_envio'].includes(s)) {
        return 'Erro de integração com CorpEM'
      }
      return ''
    },
    getRejectionTooltipSaida(rejectionCode) {
      if (!rejectionCode) return ''
      const rejectionMessages = {
        1: 'Código 1: No. NF Inválido',
        2: 'Código 2: Dt. Emi. Inválida',
        3: 'Código 3: NF/Ped. Existente',
        4: 'Código 4: CNPJ Transp. não Informado',
        5: 'Código 5: No. Pedido não Informado',
        6: 'Código 6: Merc(s). Rejeitada(s)',
        7: 'Código 7: No. N.F. não Informado',
        8: 'Código 8: Série N.F. não Informada',
        9: 'Código 9: Dt. Emissão não Informada',
        A: 'Código A: Vl. N.F. não Informado',
        B: 'Código B: CNPJ/CPF Dest. não Informado',
        V: 'Código V: R. Social Dest. não Informado',
        D: 'Código D: Logradouro não Informado',
        E: 'Código E: Município não Informado',
        F: 'Código F: UF não Informada',
        G: 'Código G: Bairro não Informado',
        H: 'Código H: CEP não Informado',
        I: 'Código I: Vl. N.F. Inválido',
      }
      return (
        rejectionMessages[rejectionCode.toUpperCase()] ||
        `Código de rejeição: ${rejectionCode}`
      )
    },
    async exportToExcel() {
      this.exportingExcel = true
      try {
        this.$emit(
          'notification',
          'Exportando todos os agendamentos do estoque Grupo Oscar...',
          'info'
        )
        const token = localStorage.getItem('token')
        const res = await fetch(`${BASE_URL}/schedules/grupo-oscar/export`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        let json
        const contentType = res.headers.get('content-type') || ''
        try {
          const text = await res.text()
          if (res.status === 502 || res.status === 504) {
            throw new Error(
              'A exportação demorou muito e expirou. A lista foi otimizada; tente novamente.'
            )
          }
          if (!contentType.includes('application/json') || !text.trim()) {
            if (!res.ok) throw new Error(text || 'Erro ao exportar')
            json = {}
          } else {
            json = JSON.parse(text)
          }
        } catch (parseErr) {
          if (parseErr.message?.includes('expirou')) throw parseErr
          if (parseErr instanceof SyntaxError) {
            throw new Error(
              'A exportação demorou muito e expirou. Tente novamente.'
            )
          }
          throw new Error(
            parseErr.message || 'Erro ao processar resposta do servidor'
          )
        }
        if (!res.ok) {
          const msg =
            res.status === 403
              ? 'Acesso negado.'
              : json?.message || json?.error || 'Erro ao exportar'
          throw new Error(msg)
        }
        const rows = json.data || []
        if (!rows.length) {
          this.$emit(
            'notification',
            'Não há agendamentos para exportar',
            'warning'
          )
          return
        }

        // Mesmo estilo da página Solicitação de agendamentos - status entrada/saída e processo
        const statusColors = {
          Solicitado: { bg: 'FFFFF3CD', text: 'FF856404' },
          Cancelar: { bg: 'FFFFF3CD', text: 'FF856404' },
          Agendado: { bg: 'FFCCE5FF', text: 'FF004085' },
          Conferência: { bg: 'FFD4EDDA', text: 'FF155724' },
          'Em conferência': { bg: 'FFD4EDDA', text: 'FF155724' },
          'Em estoque': { bg: 'FFD4EDDA', text: 'FF155724' },
          Tratativa: { bg: 'FFF8D7DA', text: 'FF721C24' },
          Recusar: { bg: 'FFF8D7DA', text: 'FF721C24' },
          Recusado: { bg: 'FFD6D6D6', text: 'FF1B1E21' },
          Cancelado: { bg: 'FFE2E3E5', text: 'FF383D41' },
          Embarcado: { bg: 'FFE0E7FF', text: 'FF3730A3' },
          EMBARCADO: { bg: 'FFE0E7FF', text: 'FF3730A3' },
          Integrado: { bg: 'FFFEF3C7', text: 'FF78350F' },
          Separado: { bg: 'FFD1FAE5', text: 'FF064E3B' },
          Entrada: { bg: 'FFE3F2FD', text: 'FF1565C0' },
          'Integração saída': { bg: 'FFE0F7FA', text: 'FF00838F' },
          'Alerta MC': { bg: 'FFDC3545', text: 'FFFFFFFF' },
          'Alerta OS': { bg: 'FFFD7E14', text: 'FFFFFFFF' },
          Separação: { bg: 'FFF3E5F5', text: 'FF7B1FA2' },
          Finalizado: { bg: 'FFE8F5E9', text: 'FF2E7D32' },
        }

        const tableHeaders = [
          'Pedido',
          'OC',
          'Vol',
          'NF entrada',
          'Chave NF',
          'Fornecedor',
          'Status entrada',
          'Agendado para',
          'Dt chegada',
          'Hora chegada',
          'NF saída',
          'Status saída',
          'Dt alteração',
          'Hr alteração',
          'Processo',
        ]
        const statusEntradaColIndex = 7
        const statusSaidaColIndex = 12
        const processoColIndex = 15

        const parseToDate = isoStr => {
          if (!isoStr) return null
          const d = new Date(isoStr)
          if (isNaN(d.getTime())) return null
          // ExcelJS serializa Date usando UTC; ajusta pelo offset local para que
          // a hora exibida no Excel corresponda ao horário de Brasília (UTC-3)
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        }

        // índices 0-based das colunas de data e hora (para aplicar numFmt)
        const DATE_COL_INDICES = new Set([7, 8, 12])
        const TIME_COL_INDICES = new Set([9, 13])

        const dataRows = rows.map(r => ({
          data: [
            r.pedido ?? '-',
            r.oc ?? '-',
            r.volumes ?? '-',
            r.nf_entrada ?? '-',
            r.chave_acesso_nf ?? '-',
            r.fornecedor ?? '-', // Fornecedor (após Chave NF)
            r.status_entrada ?? '-',
            parseToDate(r.agendado_para), // Agendado para → Date object (só data)
            parseToDate(r.dt_chegada_entrada), // Dt chegada  → Date object
            parseToDate(r.dt_chegada_entrada), // Hora chegada → mesmo Date, numFmt diferente
            r.nf_saida ?? '-',
            this.getStatusLabelSaida(r.status_saida),
            parseToDate(r.dt_alteracao_saida), // Dt alteração → Date object
            parseToDate(r.dt_alteracao_saida), // Hr alteração → mesmo Date, numFmt diferente
            r.processo ?? '-',
          ],
          status_entrada: r.status_entrada,
          status_saida: r.status_saida,
          processo: r.processo,
        }))

        const now = new Date()
        const dataHoraCriacao = now.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        let userEmail = 'Usuário'
        if (this.user) {
          try {
            const config =
              typeof this.user.config === 'string'
                ? JSON.parse(this.user.config || '{}')
                : this.user.config || {}
            userEmail =
              config?.emailSettings?.primaryEmail ||
              this.user.user ||
              this.user.username ||
              this.user.name ||
              userEmail
          } catch (_) {
            userEmail =
              this.user.user ||
              this.user.username ||
              this.user.name ||
              userEmail
          }
        }
        const numCols = tableHeaders.length

        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Portal Mercocamp'
        workbook.created = now
        const worksheet = workbook.addWorksheet('Grupo Oscar', {
          properties: { defaultRowHeight: 18 },
        })

        const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
        const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }

        worksheet.mergeCells(1, 1, 1, numCols)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'GRUPO OSCAR - AGENDAMENTOS'
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

        worksheet.mergeCells(2, 1, 2, numCols)
        const subtitleCell = worksheet.getCell('A2')
        subtitleCell.value =
          'Portal de Agendamento - Grupo Mercocamp - Estoque 62941819000100'
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

        worksheet.getRow(3).height = 10

        const lightBlueFill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' },
        }
        worksheet.mergeCells(4, 1, 4, numCols)
        const row4Cell = worksheet.getCell(4, 1)
        row4Cell.value = `Filtros: Todos os agendamentos do estoque (base completa). Exportado em ${dataHoraCriacao}`
        row4Cell.font = { size: 10 }
        row4Cell.fill = lightBlueFill
        row4Cell.border = {
          top: thinBorder,
          bottom: thinBorder,
          left: thinBorder,
          right: thinBorder,
        }
        worksheet.getRow(4).height = 20

        worksheet.getRow(5).height = 10

        // Cria tabela Excel com filtros nativos
        worksheet.addTable({
          name: 'GrupoOscar',
          ref: 'A6',
          headerRow: true,
          style: { theme: null, showRowStripes: false },
          columns: tableHeaders.map(h => ({ name: h, filterButton: true })),
          rows: dataRows.map(r => r.data),
        })

        // Formatação do cabeçalho
        const headerRow = worksheet.getRow(6)
        tableHeaders.forEach((header, index) => {
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

        // Formatação das linhas de dados
        let currentRow = 7
        dataRows.forEach((rowObj, rowIndex) => {
          const row = worksheet.getRow(currentRow)
          const isFirstRow = rowIndex === 0
          const isLastRow = rowIndex === dataRows.length - 1
          rowObj.data.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1)
            if (value instanceof Date) {
              cell.value = value
              cell.numFmt = DATE_COL_INDICES.has(colIndex)
                ? 'dd/mm/yyyy'
                : 'hh:mm'
            } else {
              cell.value = value ?? '-'
            }
            cell.font = { size: 10 }
            cell.alignment = {
              horizontal: colIndex < 2 || colIndex === 5 ? 'left' : 'center',
              vertical: 'middle',
              wrapText: false,
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
            if (colIndex + 1 === statusEntradaColIndex) {
              const sc = statusColors[rowObj.status_entrada] || {
                bg: 'FFE2E3E5',
                text: 'FF383D41',
              }
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: sc.bg },
              }
              cell.font = { size: 10, color: { argb: sc.text }, bold: true }
            }
            if (colIndex + 1 === statusSaidaColIndex && rowObj.status_saida) {
              const key = String(rowObj.status_saida || '').trim()
              const sc = statusColors[key] ||
                statusColors[
                  key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
                ] || { bg: 'FFE2E3E5', text: 'FF383D41' }
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: sc.bg },
              }
              cell.font = { size: 10, color: { argb: sc.text } }
            }
            if (colIndex + 1 === processoColIndex) {
              const sc = statusColors[rowObj.processo] || {
                bg: 'FFE2E3E5',
                text: 'FF383D41',
              }
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: sc.bg },
              }
              cell.font = { size: 10, color: { argb: sc.text } }
            }
          })
          row.height = 18
          currentRow++
        })

        currentRow++
        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const footerCell1 = worksheet.getCell(currentRow, 1)
        footerCell1.value = `Arquivo gerado pelo usuário ${userEmail} no dia ${dataHoraCriacao} pelo Portal de Agendamento do Grupo Mercocamp`
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

        tableHeaders.forEach((header, index) => {
          let maxLength = header.length
          dataRows.forEach(rowObj => {
            const v = rowObj.data[index]
            const str =
              v instanceof Date
                ? DATE_COL_INDICES.has(index)
                  ? 'dd/mm/yyyy'
                  : 'hh:mm'
                : String(v ?? '')
            if (str.length > maxLength) maxLength = str.length
          })
          let colWidth = Math.min(maxLength + 2, 35)
          if (header === 'Chave NF') colWidth = Math.max(colWidth, 48)
          if (header === 'Vol') colWidth = Math.max(colWidth, 8)
          worksheet.getColumn(index + 1).width = colWidth
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
        const fileName = `Grupo_Oscar_agendamentos_${dateStr}.xlsx`
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)

        this.$emit(
          'notification',
          `Exportados ${rows.length} agendamentos para ${fileName}`,
          'success'
        )
      } catch (err) {
        console.error('❌ Erro ao exportar para Excel:', err)
        this.$emit(
          'notification',
          err.message || 'Erro ao exportar para Excel',
          'error'
        )
      } finally {
        this.exportingExcel = false
      }
    },
  },
}
</script>

<style scoped>
.grupo-oscar-page {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  box-sizing: border-box;
}

.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header {
  flex: 1;
  min-width: 200px;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.page-header h1 i {
  color: #007bff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-processo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-processo:hover {
  background: #0056b3;
}

.btn-refresh-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh-icon:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.btn-refresh-icon:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.search-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 0 1 400px;
  min-width: 220px;
  max-width: 400px;
  padding: 0.6rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
}

.btn-buscar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-buscar:hover:not(:disabled) {
  background: #218838;
}

.btn-limpar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #fff;
  color: #6c757d;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-limpar:hover:not(:disabled) {
  background: #f8f9fa;
  color: #495057;
  border-color: #adb5bd;
}

.btn-limpar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-buttons-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-buttons-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

/* Botão Exportar - mesmo estilo da página Solicitação de agendamentos (#28a745) */
.export-btn-header {
  background: white !important;
  color: #28a745 !important;
  border: 1px solid #28a745 !important;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.export-btn-header:hover:not(:disabled) {
  background: #28a745 !important;
  color: white !important;
  border-color: #28a745 !important;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.export-btn-header:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.filter-btn {
  padding: 0.45rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e9ecef;
}

.filter-btn.active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.filter-count-badge.count-loading {
  opacity: 0.75;
}

.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.15rem 0.4rem;
  margin-left: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.filter-btn.active .filter-count-badge {
  background: rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
}

.table-container {
  overflow-x: auto;
  border: 2px solid #adb5bd;
  border-radius: 8px;
  background: #fff;
}

.pagination-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.pagination-info {
  font-size: 0.9rem;
  color: #495057;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-pagination {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  color: #495057;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-pagination:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
  color: #333;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  padding: 0 0.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  table-layout: fixed;
}

.data-table th,
.data-table td {
  width: 12.5%;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #ced4da;
  border-right: 1px solid #ced4da;
  box-sizing: border-box;
}

.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #adb5bd;
}

.data-table tbody tr:last-child td {
  border-bottom: 1px solid #ced4da;
}

.header-centered {
  text-align: center !important;
  vertical-align: middle;
}

.sortable-th {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.clickable-cell {
  cursor: pointer;
  transition: background 0.12s;
}
.clickable-cell:hover {
  background: #f1f5f9;
}

.sortable-th:hover {
  background: #e9ecef;
}

.sort-icon {
  margin-left: 0.3rem;
  font-size: 0.8rem;
  color: #6c757d;
  vertical-align: middle;
}

.sortable-th:hover .sort-icon,
.sortable-th .fa-sort-up,
.sortable-th .fa-sort-down {
  color: #333;
}

.header-group-row th {
  background: transparent;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.6rem 1rem;
  border-bottom: 2px solid #adb5bd;
  text-align: center;
}

.header-entrada,
.header-saida {
  background: transparent !important;
}

/* Borda tracejada entre Entrada e Saída */
.header-group-row th:first-child,
.data-table thead tr:last-child th:nth-child(4),
.data-table tbody td:nth-child(4) {
  border-right: 2px dashed #6c757d !important;
}

.merged-header {
  text-align: center !important;
  vertical-align: middle;
}

.merged-title {
  display: block;
  font-weight: 600;
}

.merged-sub {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: #666;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.status-badge,
.processo-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Badges de status que ocupam toda a célula */
.status-badge-full {
  display: block;
  width: 100%;
  min-height: 2rem;
  box-sizing: border-box;
  text-align: center;
  line-height: 1.5;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
}

.status-entrada {
  background: #1565c0;
  color: #fff;
}

.status-entrada.status-badge-full {
  background: #1976d2;
  color: #fff;
}

/* Status de saída - mesmo padrão da página Lista de Pedidos (ExpeditionsPage) - maior especificidade para sobrepor estilos globais */
.data-table .status-badge-saida.status-criado {
  background: #e0f2fe !important;
  color: #0c4a6e !important;
  border-color: #0ea5e9 !important;
}

.data-table .status-badge-saida.status-pendente {
  background: #fef3c7 !important;
  color: #78350f !important;
  border-color: #fbbf24 !important;
}

.data-table .status-badge-saida.status-integrado {
  background: #fef3c7 !important;
  color: #78350f !important;
  border-color: #fbbf24 !important;
}

.data-table .status-badge-saida.status-separando {
  background: #dbeafe !important;
  color: #1e3a8a !important;
  border-color: #3b82f6 !important;
}

.data-table .status-badge-saida.status-separado {
  background: #d1fae5 !important;
  color: #064e3b !important;
  border-color: #10b981 !important;
}

.data-table .status-badge-saida.status-embarcado {
  background: #e0e7ff !important;
  color: #3730a3 !important;
  border-color: #6366f1 !important;
}

.data-table .status-badge-saida.status-rejeitado {
  background: #fef3c7 !important;
  color: #ea580c !important;
  border-color: #fb923c !important;
}

.data-table .status-badge-saida.status-erro {
  background: #fee2e2 !important;
  color: #7f1d1d !important;
  border-color: #ef4444 !important;
}

.data-table .status-badge-saida.status-multiplo,
.data-table .status-badge-saida.status-default {
  background: #e2e8f0 !important;
  color: #334155 !important;
  border-color: #94a3b8 !important;
}

.rejection-icon {
  font-size: 12px;
  opacity: 0.8;
  margin-left: 4px;
}

.status-badge-saida[title]:hover {
  cursor: help;
}

.col-numero {
  padding: 0.4rem 0.5rem !important;
}

.col-status {
  padding: 0.4rem 0.5rem !important;
}

.col-dt-alteracao {
  padding: 0.4rem 0.5rem !important;
  font-size: 0.8rem;
  text-align: center;
}

.dt-alteracao-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.dt-alteracao-cell .dt-date {
  white-space: nowrap;
}

.dt-alteracao-cell .dt-time {
  font-size: 0.75rem;
  color: #555;
}

.col-processo {
  padding: 0.4rem 0.5rem !important;
}

/* Badge de processo que ocupa toda a célula - mesmo tamanho de texto da NF entrada */
.processo-badge.processo-badge-full,
.processo-badge-full {
  display: block;
  width: 100%;
  min-height: 2rem;
  box-sizing: border-box;
  text-align: center;
  line-height: 1.5;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
}

.processo-entrada {
  background: #e3f2fd;
  color: #1565c0;
}
.processo-integracao-saida {
  background: #e0f7fa;
  color: #00838f;
}
.processo-alerta-mc {
  background: #dc3545;
  color: #fff;
  font-weight: 700;
}
.processo-alerta-os {
  background: #fd7e14;
  color: #fff;
  font-weight: 700;
}
.processo-separacao {
  background: #f3e5f5;
  color: #7b1fa2;
}
.processo-finalizado {
  background: #e8f5e9;
  color: #2e7d32;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6c757d;
  font-size: 1.2rem;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.processo-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.processo-item {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.processo-item strong {
  display: block;
  margin-bottom: 0.35rem;
  color: #333;
}

.processo-item p {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
}

.modal-footer-info {
  margin: 0;
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.5;
}
</style>
