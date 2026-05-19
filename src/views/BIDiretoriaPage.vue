<template>
  <div
    ref="diretoriaRootRef"
    class="bi-diretoria"
    :class="{
      'bi-diretoria--fullscreen': diretoriaTvLayout,
      'bi-diretoria--embed-tv': embedTvLayout,
      'bi-diretoria--resumo-pending': dashboardResumoPending,
      'bi-diretoria--carteira': diretoriaPainelSubTab === 'carteira_diretores',
    }"
  >
    <div class="bi-diretoria__glow" aria-hidden="true" />

    <header class="bi-diretoria__header">
      <h1 class="sr-only">Indicadores de Logística</h1>
      <nav class="bi-diretoria__subtabs" aria-label="Visões do BI Diretoria">
        <button
          type="button"
          class="bi-diretoria__subtab-btn"
          :class="{ active: diretoriaPainelSubTab === 'diretoria' }"
          @click="setDiretoriaPainelSubTab('diretoria')"
        >
          Diretoria
        </button>
        <button
          type="button"
          class="bi-diretoria__subtab-btn"
          :class="{ active: diretoriaPainelSubTab === 'carteira_diretores' }"
          @click="setDiretoriaPainelSubTab('carteira_diretores')"
        >
          Carteira
        </button>
      </nav>
      <div class="bi-diretoria__header-toolbar">
        <!-- Período: mesmo padrão do BI SLA (`BIPage.vue` — presets + DD/MM/AAAA). -->
        <div
          ref="diretoriaCalendarioWrapRef"
          class="bi-diretoria__calendario-wrap"
        >
          <button
            type="button"
            class="bi-diretoria__btn-calendario"
            :title="
              mostrarCalendarioDiretoria ? 'Fechar' : 'Selecionar período'
            "
            @click.stop="toggleCalendarioDiretoria"
          >
            <i class="fa fa-calendar-alt" />
            {{ labelIntervaloDiretoria }}
          </button>
          <div
            v-if="mostrarCalendarioDiretoria"
            class="bi-diretoria__calendario-dropdown"
            @click.stop
          >
            <div class="bi-diretoria__calendario-layout">
              <div class="bi-diretoria__calendario-presets">
                <button
                  v-for="p in presetsCalendario"
                  :key="p.id"
                  type="button"
                  class="bi-diretoria__preset-btn"
                  :class="{ active: presetAtivo === p.id }"
                  @click="aplicarPresetDiretoria(p.id)"
                >
                  {{ p.label }}
                </button>
              </div>
              <div class="bi-diretoria__calendario-custom">
                <div class="bi-diretoria__calendario-btns">
                  <button
                    type="button"
                    class="bi-diretoria__btn-cal"
                    @click="irParaHojeDiretoria"
                  >
                    Ir para Hoje
                  </button>
                  <button
                    type="button"
                    class="bi-diretoria__btn-cal"
                    @click="limparIntervaloDiretoria"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    class="bi-diretoria__btn-cal bi-diretoria__btn-cal--aplicar"
                    @click="aplicarIntervaloDiretoria"
                  >
                    Aplicar
                  </button>
                </div>
                <div class="bi-diretoria__calendario-inputs">
                  <div class="bi-diretoria__input-data-wrap">
                    <i class="fa fa-calendar" />
                    <input
                      type="text"
                      :value="dataInicioDisplay"
                      placeholder="DD/MM/AAAA"
                      maxlength="10"
                      @input="onDataInicioInputDiretoria"
                    />
                  </div>
                  <div class="bi-diretoria__input-data-wrap">
                    <i class="fa fa-calendar" />
                    <input
                      type="text"
                      :value="dataFimDisplay"
                      placeholder="DD/MM/AAAA"
                      maxlength="10"
                      @input="onDataFimInputDiretoria"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span
          v-if="diretoriaLinhaTempoDadosFormatada"
          class="bi-diretoria__dt-modificacao"
          :title="diretoriaLinhaTempoDadosTitle"
        >
          <i class="fas fa-sync-alt" />
          Atualizado em {{ diretoriaLinhaTempoDadosFormatada }}
        </span>
        <span
          v-if="diretoriaTvLayout && diretoriaDataUpdateCountdown >= 0"
          class="bi-diretoria__fs-countdown"
          :title="
            'Próxima atualização dos dados em ' +
            diretoriaDataUpdateCountdownFormatted
          "
        >
          <i class="fas fa-sync-alt" />
          Próxima atualização em {{ diretoriaDataUpdateCountdownFormatted }}
        </span>
        <!-- Carteira: sem filtros de armazém/cliente (ligados ao mesmo recorte do PNG/WhatsApp da Diretoria). -->
        <div
          v-if="mostrarFiltrosPainelDiretoria"
          ref="diretoriaFiltrosWrapRef"
          class="bi-diretoria__filtros-wrap"
        >
          <button
            type="button"
            class="bi-diretoria__filter-btn"
            :class="{
              active: mostrarFiltros || temFiltrosDiretoriaAtivos,
              'bi-diretoria__filter-btn--busy': dashboardResumoPending,
            }"
            :title="
              dashboardResumoPending ? 'Atualizando indicadores…' : 'Filtros'
            "
            @click.stop="toggleFiltrosDiretoria"
          >
            <i
              :class="
                dashboardResumoPending
                  ? 'fas fa-spinner fa-spin'
                  : 'fas fa-filter'
              "
            />
            <span
              v-if="temFiltrosDiretoriaAtivos"
              class="bi-diretoria__filter-badge"
              >{{ countFiltrosDiretoriaAtivos }}</span
            >
          </button>
          <div
            v-if="mostrarFiltros"
            class="bi-diretoria__filtros-dropdown"
            role="dialog"
            aria-label="Filtros"
            @click.stop
          >
            <div class="bi-diretoria__filtros-header">
              <span>Filtros</span>
              <button
                type="button"
                class="bi-diretoria__btn-limpar-filtros"
                @click="limparFiltrosDiretoria"
              >
                Limpar
              </button>
            </div>
            <div class="bi-diretoria__filtros-grid">
              <div class="bi-diretoria__filtro-campo">
                <label><i class="fa fa-warehouse" /> ARMAZÉM</label>
                <select
                  v-model="filtrosDraft.armazem"
                  class="bi-diretoria__filtro-select"
                >
                  <option value="">Todos</option>
                  <option
                    v-for="nome in armazemOpcoes"
                    :key="nome"
                    :value="nome"
                  >
                    {{ nome }}
                  </option>
                </select>
              </div>
              <div
                class="bi-diretoria__filtro-campo bi-diretoria__filtro-cliente-autocomplete"
              >
                <label><i class="fa fa-search" /> CLIENTE</label>
                <div
                  v-if="filtrosDraft.filtroClientes.length > 0"
                  class="bi-diretoria__filtro-cliente-chips"
                >
                  <span
                    v-for="(item, i) in filtrosDraft.filtroClientes"
                    :key="
                      'dc-' +
                      i +
                      '-' +
                      (typeof item === 'object' && item
                        ? String(item.no_seq ?? item.nome ?? '')
                        : String(item))
                    "
                    class="bi-diretoria__filtro-cliente-chip"
                  >
                    {{
                      typeof item === 'object'
                        ? item.nome || item.nome_cliente || ''
                        : item
                    }}
                    <button
                      type="button"
                      class="bi-diretoria__filtro-cliente-chip-remove"
                      title="Remover"
                      @mousedown.prevent="removerClienteDiretoriaDraft(i)"
                    >
                      &times;
                    </button>
                  </span>
                </div>
                <div
                  class="bi-diretoria__filtro-cliente-wrap"
                  :class="{
                    open: mostrarClienteDropdownDiretoria,
                  }"
                >
                  <input
                    v-model.trim="filtrosDraft.filtroCliente"
                    type="text"
                    class="bi-diretoria__filtro-input"
                    placeholder="Digite nome ou ID para buscar"
                    autocomplete="off"
                    @focus="onClienteFocusDiretoria"
                    @input="onClienteInputDiretoria"
                    @blur="fecharClienteDropdownDiretoria"
                  />
                  <div
                    v-if="mostrarClienteDropdownDiretoria"
                    class="bi-diretoria__filtro-cliente-dropdown"
                    @click.stop
                  >
                    <div
                      v-if="clientesBuscaLoadingDiretoria"
                      class="bi-diretoria__filtro-cliente-empty"
                    >
                      <i class="fas fa-spinner fa-spin" /> Buscando…
                    </div>
                    <template v-else>
                      <div
                        v-for="c in clientesBuscaResultadosDiretoria"
                        :key="
                          'dcli-' +
                          (c.no_seq || '') +
                          '-' +
                          (c.nome_cliente || '')
                        "
                        class="bi-diretoria__filtro-cliente-opt"
                        :class="{
                          disabled: filtroClientesDraftHasNome(
                            c.nome_cliente || c.nome_reduzido || ''
                          ),
                        }"
                        @mousedown.prevent="adicionarClienteDiretoriaDraft(c)"
                      >
                        {{ c.nome_cliente || c.nome_reduzido || '' }}
                        <span class="bi-diretoria__filtro-cliente-id"
                          >({{ c.no_seq }})</span
                        >
                        <i
                          v-if="
                            filtroClientesDraftHasNome(
                              c.nome_cliente || c.nome_reduzido || ''
                            )
                          "
                          class="fas fa-check bi-diretoria__filtro-cliente-check"
                        />
                      </div>
                      <div
                        v-if="clientesBuscaResultadosDiretoria.length === 0"
                        class="bi-diretoria__filtro-cliente-empty"
                      >
                        {{
                          (filtrosDraft.filtroCliente || '').trim()
                            ? 'Nenhum cliente encontrado'
                            : 'Digite nome ou ID para buscar'
                        }}
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="bi-diretoria__filtros-aplicar"
              :disabled="dashboardResumoPending"
              @click="aplicarFiltrosDiretoria"
            >
              {{ dashboardResumoPending ? 'Aplicando…' : 'Aplicar' }}
            </button>
          </div>
        </div>
        <button
          v-if="!diretoriaTvLayout && mostrarExportPngDiretoria"
          type="button"
          class="bi-diretoria__btn-refresh"
          title="Baixar imagem PNG (mesmos dados e filtros; sem borda branca)"
          :disabled="
            dashboardLoading || dashboardResumoPending || relatorioImagemPending
          "
          @click="baixarRelatorioImagemPng"
        >
          <i
            :class="
              relatorioImagemPending
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-file-image'
            "
          />
        </button>
        <button
          v-if="!diretoriaTvLayout"
          type="button"
          class="bi-diretoria__btn-refresh"
          title="Atualizar dados"
          :disabled="dashboardLoading || dashboardResumoPending"
          @click="loadDiretoriaResumo"
        >
          <i
            :class="
              dashboardLoading || dashboardResumoPending
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-sync-alt'
            "
          />
        </button>
        <button
          v-if="biUserLevel === 0 && !embedTvLayout"
          type="button"
          class="bi-diretoria__btn-fs"
          :title="
            isFullscreen
              ? 'Sair da tela cheia'
              : 'Expandir (tela cheia para painel)'
          "
          @click="toggleFullscreen"
        >
          <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'" />
        </button>
      </div>
    </header>

    <section
      class="bi-diretoria__kpis"
      :class="{ 'bi-diretoria__kpis--carteira': diretoriaPainelSubTab === 'carteira_diretores' }"
      aria-label="Indicadores principais"
    >
      <article
        v-for="card in kpiCardsView"
        :key="card.id"
        class="bi-diretoria__card"
      >
        <div class="bi-diretoria__card-head">
          <div class="bi-diretoria__card-title-wrap">
            <h2 class="bi-diretoria__card-title">{{ card.title }}</h2>
            <div class="bi-diretoria__card-underline" />
            <p v-if="card.subtitle" class="bi-diretoria__card-subtitle">
              {{ card.subtitle }}
            </p>
          </div>
          <div class="bi-diretoria__card-head-right">
            <div class="bi-diretoria__card-icon-box" :title="card.title">
              <i :class="card.iconClass" />
            </div>
            <span
              v-if="card.badge"
              class="bi-diretoria__badge"
              :class="{
                'bi-diretoria__badge--mom': card.badge === 'MOM',
              }"
              >{{ card.badge }}</span
            >
          </div>
        </div>
        <div class="bi-diretoria__card-metric-block">
          <p
            class="bi-diretoria__card-value"
            :class="{
              'bi-diretoria__card-value--negative': card.momVariacaoNegativa,
            }"
            :title="card.valueDisplay"
          >
            {{ card.valueDisplay }}
          </p>
        </div>
        <div class="bi-diretoria__card-ref">
          <span class="bi-diretoria__card-ref-label">Período</span>
          <span
            class="bi-diretoria__card-ref-date"
            :class="{
              'bi-diretoria__card-ref-date--mom': card.id === 'mom',
            }"
            >{{ card.periodRef }}</span
          >
        </div>
      </article>
    </section>

    <section
      class="bi-diretoria__panels"
      :class="{ 'bi-diretoria__panels--carteira-solo': diretoriaPainelSubTab === 'carteira_diretores' }"
    >
      <div class="bi-diretoria__panel">
        <div class="bi-diretoria__panel-head">
          <div class="bi-diretoria__panel-icon-box">
            <i class="fas fa-user-cog" />
          </div>
          <div>
            <h3 class="bi-diretoria__panel-title">
              {{
                diretoriaPainelSubTab === 'carteira_diretores'
                  ? 'Ranking Clientes'
                  : 'Top 10 — Ranking Clientes'
              }}
            </h3>
            <div class="bi-diretoria__panel-underline" />
          </div>
        </div>
        <div class="bi-diretoria__table-wrap">
          <table
            class="bi-diretoria__table bi-diretoria__table--ranking-clientes"
          >
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Participação</th>
                <th>Pedidos</th>
                <th>Faturamento Dia</th>
                <th>Faturamento Mês</th>
                <th
                  v-if="mostrarCustoEstoqueRanking"
                  class="bi-diretoria__th-custo-estoque"
                  title="qt_servico em wf1 na data indicada (D−1 do fim do período do BI). id = cliente."
                >
                  <span class="bi-diretoria__th-custo-estoque-title">Custo estoque</span>
                  <span
                    v-if="custoEstoqueDataReferenciaLabel"
                    class="bi-diretoria__th-custo-estoque-ref"
                  >
                    Ref. {{ custoEstoqueDataReferenciaLabel }}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!dashboardLoading && rankingClientes.length === 0">
                <td
                  :colspan="rankingClientesTableColspan"
                  class="bi-diretoria__table-empty"
                >
                  Nenhum cliente no período.
                </td>
              </tr>
              <tr
                v-for="row in rankingClientes"
                :key="'c-' + (row.idCliente != null ? row.idCliente : row.rank)"
              >
                <td class="bi-diretoria__td-rank">
                  <span
                    class="bi-diretoria__rank"
                    :class="
                      row.rank <= 3
                        ? 'bi-diretoria__rank--top'
                        : 'bi-diretoria__rank--rest'
                    "
                    >{{ row.rank }}</span
                  >
                </td>
                <td
                  class="bi-diretoria__cell-name bi-diretoria__cell-name--cliente"
                >
                  <div class="bi-diretoria__cliente-cell-inner">
                    <span
                      v-if="row.idCliente != null && row.idCliente !== ''"
                      class="bi-diretoria__client-id"
                      >{{ row.idCliente }}</span
                    >
                    <span
                      v-if="row.idCliente != null && row.idCliente !== ''"
                      class="bi-diretoria__client-id-sep"
                      aria-hidden="true"
                      >·</span
                    >
                    <span class="bi-diretoria__client-nome-trunc">{{
                      formatEntityDisplayName(row.nome)
                    }}</span>
                  </div>
                </td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatPct(row.participacao) }}
                </td>
                <td>{{ formatInt(row.pedidos) }}</td>
                <td>{{ formatMoney(row.fatDia) }}</td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatMoney(row.fatMes) }}
                </td>
                <td
                  v-if="mostrarCustoEstoqueRanking"
                  class="bi-diretoria__cell-accent bi-diretoria__cell-custo-estoque"
                >
                  {{ formatCustoEstoqueDisplay(row.custoEstoque) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="diretoriaPainelSubTab !== 'carteira_diretores'" class="bi-diretoria__panel">
        <div class="bi-diretoria__panel-head">
          <div class="bi-diretoria__panel-icon-box">
            <i class="fas fa-warehouse" />
          </div>
          <div>
            <h3 class="bi-diretoria__panel-title">Ranking Armazéns</h3>
            <div class="bi-diretoria__panel-underline" />
          </div>
        </div>
        <div class="bi-diretoria__table-wrap">
          <table class="bi-diretoria__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Armazém</th>
                <th>Participação</th>
                <th>Pedidos</th>
                <th>Faturamento Dia</th>
                <th>Faturamento Mês</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!dashboardLoading && rankingArmazens.length === 0">
                <td colspan="6" class="bi-diretoria__table-empty">
                  Nenhum armazém no período.
                </td>
              </tr>
              <tr v-for="row in rankingArmazens" :key="'a-' + row.rank">
                <td>
                  <span
                    class="bi-diretoria__rank"
                    :class="
                      row.rank <= 3
                        ? 'bi-diretoria__rank--top'
                        : 'bi-diretoria__rank--rest'
                    "
                    >{{ row.rank }}</span
                  >
                </td>
                <td class="bi-diretoria__cell-name">{{ row.codigo }}</td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatPct(row.participacao) }}
                </td>
                <td>{{ formatInt(row.pedidos) }}</td>
                <td>{{ formatMoney(row.fatDia) }}</td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatMoney(row.fatMes) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bi-diretoria__tfoot-row">
                <td>
                  <span class="bi-diretoria__sigma"
                    ><span class="bi-diretoria__sigma-inner">Σ</span></span
                  >
                </td>
                <td class="bi-diretoria__cell-name bi-diretoria__tfoot-label">
                  TOTAL GERAL
                </td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatPct(totaisArmazem.participacao) }}
                </td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatInt(totaisArmazem.pedidos) }}
                </td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatMoney(totaisArmazem.fatDia) }}
                </td>
                <td class="bi-diretoria__cell-accent">
                  {{ formatMoney(totaisArmazem.fatMes) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import { formatEntityDisplayName } from '../utils/formatDisplayName.js'

/** Metadados dos KPIs; valores vêm do resumo (Diretoria ou Carteira — mesma base wdq por enquanto). */
const KPI_DEFS = [
  {
    id: 'fat-ant',
    title: 'Faturamento mês anterior',
    badge: 'ACUMULADO',
    iconClass: 'fas fa-file-invoice-dollar',
  },
  {
    id: 'ped-ant',
    title: 'Pedidos do mês anterior',
    badge: 'ACUMULADO',
    iconClass: 'fas fa-shopping-cart',
  },
  {
    id: 'fat-atual',
    title: 'Faturamento mês atual',
    badge: 'ACUMULADO',
    iconClass: 'fas fa-chart-line',
  },
  {
    id: 'ped-atual',
    title: 'Pedidos do mês atual',
    badge: 'ACUMULADO',
    iconClass: 'fas fa-boxes',
  },
  {
    id: 'ped-dia',
    title: 'Pedidos diário',
    badge: null,
    iconClass: 'fas fa-calendar-day',
  },
  {
    id: 'fat-dia',
    title: 'Faturamento diário',
    badge: null,
    iconClass: 'fas fa-coins',
  },
  {
    id: 'mom',
    title: 'Comparativo mensal',
    subtitle: 'Mês Atual x Mês Anterior',
    badge: 'MOM',
    iconClass: 'fas fa-percent',
  },
]

/** KPIs exclusivos da sub-aba Carteira (API `/carteira-diretores/resumo`). */
const KPI_DEFS_CARTEIRA = [
  {
    id: 'fat-geral',
    title: 'Faturamento mês atual',
    subtitle: 'Todos os clientes',
    badge: null,
    iconClass: 'fas fa-globe',
  },
  {
    id: 'ped-geral',
    title: 'Pedidos mês atual',
    subtitle: 'Todos os clientes',
    badge: null,
    iconClass: 'fas fa-users',
  },
  {
    id: 'fat-dia-cart',
    title: 'Faturamento diário',
    subtitle: null,
    badge: null,
    iconClass: 'fas fa-coins',
  },
  {
    id: 'ped-dia-cart',
    title: 'Pedidos diário',
    subtitle: null,
    badge: null,
    iconClass: 'fas fa-calendar-day',
  },
]

const KPI_CARTEIRA_MONEY_IDS = new Set(['fat-geral', 'fat-dia-cart'])

/** Modo tela cheia: intervalo entre atualizações automáticas do resumo (segundos). */
const DIRETORIA_FULLSCREEN_REFRESH_SEC = 5 * 60

export default {
  name: 'BIDiretoriaPage',
  emits: ['notification', 'page-ready'],
  props: {
    /** Layout de TV/painel quando o fullscreen é de um ancestral (ex.: `BIPainelPage`). */
    embedTvLayout: { type: Boolean, default: false },
  },
  data() {
    return {
      dashboardLoading: true,
      /** Recarregamento com snapshot já exibido (não zera KPIs; mostra feedback no toolbar). */
      dashboardResumoPending: false,
      relatorioImagemPending: false,
      /** Evita aplicar resposta antiga se o usuário disparar outro carregamento. */
      diretoriaResumoLoadSeq: 0,
      dashboardError: null,
      snapshot: null,
      filtroArmazem: '',
      /** Chips aplicados ({ nome, no_seq }) ou vazio + texto livre em `filtroTextoClienteAplicado`. */
      filtroClientesDiretoria: [],
      filtroTextoClienteAplicado: '',
      mostrarFiltros: false,
      mostrarClienteDropdownDiretoria: false,
      clientesBuscaResultadosDiretoria: [],
      clientesBuscaLoadingDiretoria: false,
      clientesBuscaTimerDiretoria: null,
      mostrarCalendarioDiretoria: false,
      diretoriaCalSnapshot: null,
      userHasSelectedDiretoriaPeriod: false,
      presetAtivo: 'este_mes',
      presetsCalendario: [
        { id: 'ontem', label: 'Ontem' },
        { id: 'hoje', label: 'Hoje' },
        { id: 'esta_semana', label: 'Esta Semana' },
        { id: 'semana_passada', label: 'Semana Passada' },
        { id: 'este_mes', label: 'Este Mês' },
        { id: 'mes_passado', label: 'Mês Passado' },
      ],
      dataInicio: (() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      })(),
      dataFim: (() => {
        const d = new Date()
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
      })(),
      dataInicioDisplay: '',
      dataFimDisplay: '',
      armazemOpcoes: [],
      filtrosDraft: {
        armazem: '',
        filtroCliente: '',
        filtroClientes: [],
      },
      armazemOpcoesLoading: false,
      rankingClientes: [],
      rankingArmazens: [],
      totaisArmazem: {
        participacao: 100,
        pedidos: 0,
        fatDia: 0,
        fatMes: 0,
      },
      /** Tela cheia (mesma regra do BI SLA: apenas nível 0). */
      isFullscreen: false,
      /** Contagem regressiva até próximo refresh automático (só tela cheia); -1 = inativo. */
      diretoriaDataUpdateCountdown: -1,
      diretoriaFsCountdownTimer: null,
      diretoriaFsRefreshTimer: null,
      /** `diretoria`: fluxo atual; `carteira_diretores`: mesmo painel com API dedicada (regras próprias no back). */
      diretoriaPainelSubTab: 'diretoria',
    }
  },
  computed: {
    /** Path do JSON/PNG/PDF do resumo conforme a sub-aba. */
    diretoriaResumoApiPath() {
      return this.diretoriaPainelSubTab === 'carteira_diretores'
        ? '/bi/carteira-diretores/resumo'
        : '/bi/diretoria/resumo'
    },
    biDiretoriaContextLabel() {
      return this.diretoriaPainelSubTab === 'carteira_diretores'
        ? 'BI Carteira'
        : 'BI Diretoria'
    },
    /** Coluna extra no ranking de clientes (wf1_armazenagem_custo). */
    mostrarCustoEstoqueRanking() {
      return this.diretoriaPainelSubTab === 'carteira_diretores'
    },
    /** Diretoria: PNG é o mesmo artefato do envio WhatsApp; Carteira não exporta PNG. */
    mostrarExportPngDiretoria() {
      return this.diretoriaPainelSubTab !== 'carteira_diretores'
    },
    /** Filtros armazém/cliente alinham ao recorte usado no PNG da Diretoria; ocultos na Carteira. */
    mostrarFiltrosPainelDiretoria() {
      return this.diretoriaPainelSubTab !== 'carteira_diretores'
    },
    rankingClientesTableColspan() {
      return this.mostrarCustoEstoqueRanking ? 7 : 6
    },
    /** Data (BR) do `dt_mov` wf1 usada na coluna Custo estoque (D−1 do fim do período). */
    custoEstoqueDataReferenciaLabel() {
      if (!this.mostrarCustoEstoqueRanking || !this.snapshot) return ''
      const raw = this.snapshot.custo_estoque_dt_ref
      if (!raw) return ''
      return this.formatarDataCalendarioDiretoria(String(raw).slice(0, 10))
    },
    diretoriaTvLayout() {
      return this.isFullscreen || this.embedTvLayout
    },
    /** Alinhado a `BIPage.vue` → botão de painel / tela cheia só para nível 0. */
    biUserLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        const level = user.level_access
        return level != null ? Number(level) : null
      } catch {
        return null
      }
    },
    /** Próxima atualização automática (M:SS), alinhado ao BI SLA. */
    diretoriaDataUpdateCountdownFormatted() {
      const s = Math.max(0, Math.floor(this.diretoriaDataUpdateCountdown))
      const m = Math.floor(s / 60)
      const seg = s % 60
      return `${m}:${String(seg).padStart(2, '0')}`
    },
    /** Último registro alterado na wdq (MAX dt_modificacao) no escopo do resumo. */
    diretoriaDtModificacaoFormatada() {
      const raw = this.snapshot && this.snapshot.dt_modificacao
      if (!raw) return ''
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    /** Linha visível no topo: wdq (dt_modificacao) ou, em fallback, horário da última consulta (gerado_em). */
    diretoriaLinhaTempoDadosFormatada() {
      const s = this.snapshot
      if (!s) return ''
      const raw = s.dt_modificacao || s.gerado_em
      if (!raw) return ''
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    diretoriaLinhaTempoDadosTitle() {
      if (!this.snapshot) return ''
      if (this.snapshot.dt_modificacao) {
        return (
          'Maior dt_modificacao na wdq (situação Emb. Conf.), com os filtros deste resumo. ' +
          'Se não houver registro no recorte de datas, usa o maior dt_modificacao entre todos os Emb. Conf. filtrados.'
        )
      }
      return 'Horário em que o servidor montou este resumo (dt_modificacao da wdq indisponível).'
    },
    labelIntervaloDiretoria() {
      if (!this.userHasSelectedDiretoriaPeriod) return 'Período padrão'
      if (this.dataInicio && this.dataFim) {
        return `${this.formatarDataCalendarioDiretoria(this.dataInicio)} — ${this.formatarDataCalendarioDiretoria(this.dataFim)}`
      }
      if (this.dataInicio) {
        return this.formatarDataCalendarioDiretoria(this.dataInicio)
      }
      return this.formatarDataCalendarioDiretoria(this.dataFim)
    },
    kpiCardsView() {
      /** Diretoria: sufixo " Carteira" nos KPIs 3–7 (legado visual só na aba antiga). */
      const comTituloCarteira = (d, kpiIndex) => {
        const suf =
          this.diretoriaPainelSubTab === 'carteira_diretores' && kpiIndex >= 2
            ? ' Carteira'
            : ''
        return {
          ...d,
          title: d.title + suf,
        }
      }
      const loading = this.dashboardLoading
      const err = this.dashboardError
      const s = this.snapshot
      const dash = isMoney => {
        if (loading) return 'Carregando…'
        if (err) return '—'
        return isMoney ? this.formatMoney(0) : this.formatInt(0)
      }
      const refEmpty = () => {
        if (loading) return '…'
        if (err) return '—'
        return '…'
      }

      if (this.diretoriaPainelSubTab === 'carteira_diretores') {
        if (!s) {
          return KPI_DEFS_CARTEIRA.map(d => ({
            ...d,
            valueDisplay: KPI_CARTEIRA_MONEY_IDS.has(d.id) ? dash(true) : dash(false),
            periodRef: refEmpty(),
          }))
        }
        const geral = s.mes_atual_geral || {}
        const dia = s.dia
        const br = (a, b) =>
          `${this.fmtDataBRShort(a)} a ${this.fmtDataBRShort(b)}`
        const diaLabel = hi => this.fmtDataBRShort(hi)
        return [
          {
            ...KPI_DEFS_CARTEIRA[0],
            valueDisplay: this.formatMoney(geral.faturamento),
            periodRef: br(geral.inicio, geral.fim),
          },
          {
            ...KPI_DEFS_CARTEIRA[1],
            valueDisplay: this.formatInt(geral.pedidos),
            periodRef: br(geral.inicio, geral.fim),
          },
          {
            ...KPI_DEFS_CARTEIRA[2],
            valueDisplay: this.formatMoney(dia.faturamento),
            periodRef: diaLabel(dia.inicio),
          },
          {
            ...KPI_DEFS_CARTEIRA[3],
            valueDisplay: this.formatInt(dia.pedidos),
            periodRef: diaLabel(dia.inicio),
          },
        ]
      }

      if (!s) {
        return KPI_DEFS.map((d, i) =>
          comTituloCarteira(
            {
              ...d,
              valueDisplay: dash(false),
              periodRef: refEmpty(),
            },
            i
          )
        )
      }

      const ant = s.mes_anterior
      const atu = s.mes_atual
      const dia = s.dia
      const br = (a, b) =>
        `${this.fmtDataBRShort(a)} a ${this.fmtDataBRShort(b)}`
      const diaLabel = hi => this.fmtDataBRShort(hi)

      const cards = [
        comTituloCarteira(
          {
            ...KPI_DEFS[0],
            valueDisplay: this.formatMoney(ant.faturamento),
            periodRef: br(ant.inicio, ant.fim),
          },
          0
        ),
        comTituloCarteira(
          {
            ...KPI_DEFS[1],
            valueDisplay: this.formatInt(ant.pedidos),
            periodRef: br(ant.inicio, ant.fim),
          },
          1
        ),
        comTituloCarteira(
          {
            ...KPI_DEFS[2],
            valueDisplay: this.formatMoney(atu.faturamento),
            periodRef: br(atu.inicio, atu.fim),
          },
          2
        ),
        comTituloCarteira(
          {
            ...KPI_DEFS[3],
            valueDisplay: this.formatInt(atu.pedidos),
            periodRef: br(atu.inicio, atu.fim),
          },
          3
        ),
        comTituloCarteira(
          {
            ...KPI_DEFS[4],
            valueDisplay: this.formatInt(dia.pedidos),
            periodRef: diaLabel(dia.inicio),
          },
          4
        ),
        comTituloCarteira(
          {
            ...KPI_DEFS[5],
            valueDisplay: this.formatMoney(dia.faturamento),
            periodRef: diaLabel(dia.inicio),
          },
          5
        ),
        comTituloCarteira(
          {
            ...KPI_DEFS[6],
            valueDisplay: this.formatMomPct(s.mom_variacao_pct),
            periodRef: `${br(ant.inicio, ant.fim)} · ${br(atu.inicio, atu.fim)}`,
            momVariacaoNegativa:
              s.mom_variacao_pct != null &&
              !Number.isNaN(Number(s.mom_variacao_pct)) &&
              Number(s.mom_variacao_pct) < 0,
          },
          6
        ),
      ]
      return cards
    },
    temFiltrosDiretoriaAtivos() {
      const p = this.userHasSelectedDiretoriaPeriod
      const a = this.filtroArmazem && String(this.filtroArmazem).trim()
      const cli =
        (this.filtroClientesDiretoria &&
          this.filtroClientesDiretoria.length > 0) ||
        (this.filtroTextoClienteAplicado &&
          String(this.filtroTextoClienteAplicado).trim())
      return !!(p || a || cli)
    },
    countFiltrosDiretoriaAtivos() {
      let c = 0
      if (this.userHasSelectedDiretoriaPeriod) c++
      if (this.filtroArmazem && String(this.filtroArmazem).trim()) c++
      if (
        this.filtroClientesDiretoria &&
        this.filtroClientesDiretoria.length > 0
      ) {
        c++
      } else if (
        this.filtroTextoClienteAplicado &&
        String(this.filtroTextoClienteAplicado).trim()
      ) {
        c++
      }
      return c
    },
  },
  watch: {
    embedTvLayout: {
      handler() {
        this.syncDiretoriaFullscreenPolling()
      },
      immediate: true,
    },
  },
  mounted() {
    this._fullscreenChangeHandler = () => this.onFullscreenChange()
    document.addEventListener('fullscreenchange', this._fullscreenChangeHandler)
    this._diretoriaFiltrosDocClick = e => {
      if (this.mostrarFiltros) {
        const wrap = this.$refs.diretoriaFiltrosWrapRef
        if (wrap && wrap instanceof Element && !wrap.contains(e.target)) {
          this.fecharFiltrosDiretoriaSemAplicar()
        }
      }
      if (this.mostrarCalendarioDiretoria) {
        const cal = this.$refs.diretoriaCalendarioWrapRef
        if (cal && cal instanceof Element && !cal.contains(e.target)) {
          this.fecharCalendarioDiretoriaSemAplicar()
        }
      }
    }
    document.addEventListener('click', this._diretoriaFiltrosDocClick)
    this.syncDataDisplayDiretoriaFromModel()
    this.loadDiretoriaResumo()
    this.$nextTick(() => {
      this.syncDiretoriaFullscreenPolling()
      this.$emit('page-ready')
    })
  },
  activated() {
    this.$nextTick(() => {
      this.syncDiretoriaFullscreenPolling()
      this.$emit('page-ready')
    })
  },
  deactivated() {
    this.stopDiretoriaFullscreenPolling()
    const root = this.biFullscreenRootEl()
    const fs = document.fullscreenElement
    if (this.isOurFullscreenElement(fs, root)) {
      document.exitFullscreen().catch(() => {})
    }
    this.isFullscreen = false
  },
  beforeUnmount() {
    this.stopDiretoriaFullscreenPolling()
    if (this.clientesBuscaTimerDiretoria) {
      clearTimeout(this.clientesBuscaTimerDiretoria)
      this.clientesBuscaTimerDiretoria = null
    }
    if (this._diretoriaFiltrosDocClick) {
      document.removeEventListener('click', this._diretoriaFiltrosDocClick)
    }
    if (this._fullscreenChangeHandler) {
      document.removeEventListener(
        'fullscreenchange',
        this._fullscreenChangeHandler
      )
    }
    const root = this.biFullscreenRootEl()
    const fs = document.fullscreenElement
    if (this.isOurFullscreenElement(fs, root)) {
      document.exitFullscreen().catch(() => {})
    }
  },
  methods: {
    setDiretoriaPainelSubTab(tab) {
      if (this.diretoriaPainelSubTab === tab) return
      this.diretoriaPainelSubTab = tab
      if (tab === 'carteira_diretores') {
        this.filtroArmazem = ''
        this.filtroClientesDiretoria = []
        this.filtroTextoClienteAplicado = ''
        this.filtrosDraft = {
          armazem: '',
          filtroCliente: '',
          filtroClientes: [],
        }
        this.mostrarFiltros = false
        this.mostrarClienteDropdownDiretoria = false
        this.clientesBuscaResultadosDiretoria = []
      }
      this.loadDiretoriaResumo()
    },
    biFullscreenRootEl() {
      const r = this.$refs.diretoriaRootRef
      if (r instanceof Element) return r
      return this.$el instanceof Element ? this.$el : null
    },
    isOurFullscreenElement(fs, root) {
      return !!(fs && root && (fs === root || root.contains(fs)))
    },
    async toggleFullscreen() {
      const el = this.biFullscreenRootEl()
      if (!el) return
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen()
          this.isFullscreen = true
        } else {
          await document.exitFullscreen()
          this.isFullscreen = false
        }
      } catch (e) {
        console.warn('[BI Diretoria] Fullscreen:', e?.message || e)
        this.isFullscreen = false
        this.stopDiretoriaFullscreenPolling()
      }
    },
    onFullscreenChange() {
      const fs = document.fullscreenElement
      const el = this.biFullscreenRootEl()
      this.isFullscreen = this.isOurFullscreenElement(fs, el)
      this.syncDiretoriaFullscreenPolling()
    },
    /** FS no próprio BI ou embed no `BIPainelPage` (FS do documento em ancestral). */
    syncDiretoriaFullscreenPolling() {
      if (this.diretoriaTvLayout) this.startDiretoriaFullscreenPolling()
      else this.stopDiretoriaFullscreenPolling()
    },
    stopDiretoriaFullscreenPolling() {
      if (this.diretoriaFsCountdownTimer != null) {
        clearInterval(this.diretoriaFsCountdownTimer)
        this.diretoriaFsCountdownTimer = null
      }
      if (this.diretoriaFsRefreshTimer != null) {
        clearInterval(this.diretoriaFsRefreshTimer)
        this.diretoriaFsRefreshTimer = null
      }
      this.diretoriaDataUpdateCountdown = -1
    },
    startDiretoriaFullscreenPolling() {
      this.stopDiretoriaFullscreenPolling()
      if (!this.diretoriaTvLayout) return
      this.diretoriaDataUpdateCountdown = DIRETORIA_FULLSCREEN_REFRESH_SEC
      this.diretoriaFsCountdownTimer = setInterval(() => {
        if (!this.diretoriaTvLayout) {
          this.stopDiretoriaFullscreenPolling()
          return
        }
        if (this.diretoriaDataUpdateCountdown > 0) {
          this.diretoriaDataUpdateCountdown--
        }
      }, 1000)
      this.diretoriaFsRefreshTimer = setInterval(() => {
        if (this.diretoriaTvLayout) this.loadDiretoriaResumo({ silent: true })
      }, DIRETORIA_FULLSCREEN_REFRESH_SEC * 1000)
      this.loadDiretoriaResumo()
    },
    /** DD/MM/AA — KPIs (uma linha nos cards). */
    fmtDataBRShort(iso) {
      if (!iso) return ''
      const [y, m, d] = String(iso).slice(0, 10).split('-')
      if (!d) return iso
      const yy = String(y).slice(-2)
      return `${d}/${m}/${yy}`
    },
    formatMomPct(v) {
      if (v == null || Number.isNaN(Number(v))) return '—'
      const n = Number(v)
      const s = n.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return (n >= 0 ? '+' : '') + s + '%'
    },
    async baixarRelatorioImagemPng() {
      if (this.diretoriaPainelSubTab === 'carteira_diretores') {
        return
      }
      const token = localStorage.getItem('token')
      this.relatorioImagemPending = true
      try {
        const params = {}
        if (
          this.userHasSelectedDiretoriaPeriod &&
          this.dataInicio &&
          this.dataFim
        ) {
          params.data_inicio = String(this.dataInicio).slice(0, 10)
          params.data_fim = String(this.dataFim).slice(0, 10)
        }
        if (this.filtroArmazem && String(this.filtroArmazem).trim()) {
          params.armazem = String(this.filtroArmazem).trim()
        }
        let clientesParam = this.filtroClientesValoresParaApiDiretoria()
        if (!clientesParam) {
          clientesParam = (this.filtroTextoClienteAplicado || '').trim()
        }
        if (clientesParam) params.clientes = clientesParam
        params.format = 'png'

        const res = await axios.get(this.diretoriaResumoApiPath, {
          params,
          responseType: 'blob',
          timeout: 120000,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const ct = (res.headers['content-type'] || '').split(';')[0].trim()
        if (ct === 'application/json') {
          const text = await res.data.text()
          let errMsg = 'Erro ao gerar imagem'
          try {
            const j = JSON.parse(text)
            if (j.error) errMsg = j.error
          } catch {
            /* ignore */
          }
          throw new Error(errMsg)
        }
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const dispo = res.headers['content-disposition'] || ''
        const m = /filename="([^"]+)"/.exec(dispo)
        a.download = m && m[1] ? m[1] : 'bi-diretoria.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (e) {
        let msg = e?.message || 'Erro ao baixar imagem'
        const data = e?.response?.data
        if (data instanceof Blob) {
          try {
            const text = await data.text()
            const j = JSON.parse(text)
            if (j.error) msg = j.error
          } catch {
            /* keep msg */
          }
        } else if (e?.response?.data?.error) {
          msg = e.response.data.error
        }
        this.$emit(
          'notification',
          `${this.biDiretoriaContextLabel} — ${msg}`,
          'error'
        )
      } finally {
        this.relatorioImagemPending = false
      }
    },
    async loadDiretoriaResumo(opts = {}) {
      const silent = opts.silent === true
      const loadId = ++this.diretoriaResumoLoadSeq
      const primeiraCarga = !this.snapshot
      if (!silent) {
        if (primeiraCarga) {
          this.dashboardLoading = true
        } else {
          this.dashboardResumoPending = true
        }
      }
      this.dashboardError = null
      try {
        const token = localStorage.getItem('token')
        const params = {}
        if (
          this.userHasSelectedDiretoriaPeriod &&
          this.dataInicio &&
          this.dataFim
        ) {
          params.data_inicio = String(this.dataInicio).slice(0, 10)
          params.data_fim = String(this.dataFim).slice(0, 10)
        }
        if (this.filtroArmazem && String(this.filtroArmazem).trim()) {
          params.armazem = String(this.filtroArmazem).trim()
        }
        let clientesParam = this.filtroClientesValoresParaApiDiretoria()
        if (!clientesParam) {
          clientesParam = (this.filtroTextoClienteAplicado || '').trim()
        }
        if (clientesParam) params.clientes = clientesParam

        const { data } = await axios.get(this.diretoriaResumoApiPath, {
          params,
          timeout: 90000,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!data?.success) {
          throw new Error(data?.error || 'Resposta inválida')
        }
        if (loadId !== this.diretoriaResumoLoadSeq) {
          return
        }
        this.snapshot = data
        if (this.diretoriaTvLayout) {
          this.diretoriaDataUpdateCountdown = DIRETORIA_FULLSCREEN_REFRESH_SEC
        }
        this.rankingClientes = (data.ranking_clientes || []).map(r => ({
          rank: r.rank,
          idCliente: r.id_cliente,
          nome: r.nome,
          participacao: r.participacao,
          pedidos: r.pedidos,
          fatDia: r.fat_dia,
          fatMes: r.fat_mes,
          custoEstoque:
            r.custo_estoque != null && r.custo_estoque !== ''
              ? Number(r.custo_estoque)
              : null,
        }))
        this.rankingArmazens = (data.ranking_armazens || []).map(r => ({
          rank: r.rank,
          codigo: r.codigo,
          participacao: r.participacao,
          pedidos: r.pedidos,
          fatDia: r.fat_dia,
          fatMes: r.fat_mes,
        }))
        const ta = data.totais_armazens || {}
        this.totaisArmazem = {
          participacao: ta.participacao ?? 100,
          pedidos: ta.pedidos ?? 0,
          fatDia: ta.fat_dia ?? 0,
          fatMes: ta.fat_mes ?? 0,
        }
      } catch (e) {
        if (loadId !== this.diretoriaResumoLoadSeq) {
          return
        }
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          `Erro ao carregar ${this.biDiretoriaContextLabel.replace(/^BI\s+/i, '')}`
        this.dashboardError = msg
        this.snapshot = null
        this.rankingClientes = []
        this.rankingArmazens = []
        this.$emit(
          'notification',
          `${this.biDiretoriaContextLabel} — ${msg}`,
          'error'
        )
      } finally {
        if (loadId === this.diretoriaResumoLoadSeq) {
          this.dashboardLoading = false
          this.dashboardResumoPending = false
        }
      }
    },
    formatEntityDisplayName,
    formatMoney(n) {
      if (n == null) return '—'
      // NBSP: evita quebra entre "R$" e o valor nos KPIs (ex.: centenas de milhões).
      return (
        'R$\u00A0' +
        Number(n).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      )
    },
    formatInt(n) {
      if (n == null) return '—'
      return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    },
    formatPct(n) {
      if (n == null) return '—'
      return (
        Number(n).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + '%'
      )
    },
    /** Valor do dia D−1 (wf1) em qt_servico / wf1_armazenagem_custo (exibido como moeda). */
    formatCustoEstoqueDisplay(v) {
      if (v == null || Number.isNaN(Number(v))) return '—'
      return this.formatMoney(v)
    },
    filtroClientesValoresParaApiDiretoria() {
      const list = this.filtroClientesDiretoria || []
      return list
        .map(c => {
          if (typeof c === 'object' && c != null && c.no_seq != null) {
            return String(c.no_seq)
          }
          const nome =
            typeof c === 'object' && c != null
              ? (c.nome || c.nome_cliente || '').trim()
              : String(c || '').trim()
          return nome
        })
        .filter(Boolean)
        .join(',')
    },
    syncFiltrosDraftFromApplied() {
      this.filtrosDraft = {
        armazem: this.filtroArmazem || '',
        filtroCliente:
          (this.filtroClientesDiretoria || []).length === 0
            ? this.filtroTextoClienteAplicado || ''
            : '',
        filtroClientes: (this.filtroClientesDiretoria || []).map(c =>
          typeof c === 'object' && c != null
            ? { nome: c.nome, no_seq: c.no_seq }
            : c
        ),
      }
    },
    filtroClientesDraftHasNome(nome) {
      const n = (nome || '').trim()
      if (!n) return false
      return (this.filtrosDraft.filtroClientes || []).some(x => {
        const chip =
          typeof x === 'object' && x != null
            ? (x.nome || x.nome_cliente || '').trim()
            : String(x || '').trim()
        return chip === n
      })
    },
    removerClienteDiretoriaDraft(index) {
      this.filtrosDraft.filtroClientes = (
        this.filtrosDraft.filtroClientes || []
      ).filter((_, i) => i !== index)
    },
    onClienteFocusDiretoria() {
      this.mostrarClienteDropdownDiretoria = true
      this.buscarClientesDiretoria()
    },
    onClienteInputDiretoria() {
      this.mostrarClienteDropdownDiretoria = true
      if (this.clientesBuscaTimerDiretoria) {
        clearTimeout(this.clientesBuscaTimerDiretoria)
      }
      this.clientesBuscaTimerDiretoria = setTimeout(
        () => this.buscarClientesDiretoria(),
        300
      )
    },
    async buscarClientesDiretoria() {
      const busca = (this.filtrosDraft.filtroCliente || '').trim()
      if (!busca) {
        this.clientesBuscaResultadosDiretoria = []
        return
      }
      this.clientesBuscaLoadingDiretoria = true
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get('/bi/clientes', {
          params: { busca },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (data?.success) {
          this.clientesBuscaResultadosDiretoria = data.clientes || []
        } else {
          this.clientesBuscaResultadosDiretoria = []
        }
      } catch (e) {
        console.warn('[BI Diretoria] busca clientes:', e?.message || e)
        this.clientesBuscaResultadosDiretoria = []
      } finally {
        this.clientesBuscaLoadingDiretoria = false
      }
    },
    fecharClienteDropdownDiretoria() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.mostrarClienteDropdownDiretoria = false
        }, 150)
      })
    },
    adicionarClienteDiretoriaDraft(c) {
      const nome =
        c && (c.nome_cliente || c.nome_reduzido)
          ? String(c.nome_cliente || c.nome_reduzido).trim()
          : ''
      if (!nome) return
      const noSeq = c && c.no_seq != null ? c.no_seq : null
      const lista = this.filtrosDraft.filtroClientes || []
      const jaExiste = lista.some(
        x => (typeof x === 'object' ? x.nome : x) === nome
      )
      if (jaExiste) return
      this.filtrosDraft.filtroClientes = [...lista, { nome, no_seq: noSeq }]
      this.filtrosDraft.filtroCliente = ''
      this.mostrarClienteDropdownDiretoria = false
    },
    async toggleFiltrosDiretoria() {
      if (this.mostrarFiltros) {
        this.fecharFiltrosDiretoriaSemAplicar()
        return
      }
      this.syncFiltrosDraftFromApplied()
      if (this.armazemOpcoes.length === 0 && !this.armazemOpcoesLoading) {
        await this.loadArmazemOpcoes()
      }
      this.mostrarFiltros = true
    },
    fecharFiltrosDiretoriaSemAplicar() {
      this.syncFiltrosDraftFromApplied()
      this.mostrarFiltros = false
    },
    async loadArmazemOpcoes() {
      this.armazemOpcoesLoading = true
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get('/bi/armazens/opcoes', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        this.armazemOpcoes =
          data?.success && Array.isArray(data.opcoes) ? data.opcoes : []
      } catch {
        this.armazemOpcoes = []
        this.$emit(
          'notification',
          'Não foi possível carregar a lista de armazéns.',
          'warning'
        )
      } finally {
        this.armazemOpcoesLoading = false
      }
    },
    aplicarFiltrosDiretoria() {
      this.filtroArmazem = (this.filtrosDraft.armazem || '').trim()
      this.filtroClientesDiretoria = (
        this.filtrosDraft.filtroClientes || []
      ).map(x =>
        typeof x === 'object' && x != null
          ? { nome: x.nome, no_seq: x.no_seq }
          : x
      )
      const livre = (this.filtrosDraft.filtroCliente || '').trim()
      this.filtroTextoClienteAplicado =
        (this.filtroClientesDiretoria || []).length === 0 ? livre : ''
      this.mostrarFiltros = false
      this.mostrarClienteDropdownDiretoria = false
      this.loadDiretoriaResumo()
    },
    limparFiltrosDiretoria() {
      this.filtrosDraft = {
        armazem: '',
        filtroCliente: '',
        filtroClientes: [],
      }
      this.filtroArmazem = ''
      this.filtroClientesDiretoria = []
      this.filtroTextoClienteAplicado = ''
      this.clientesBuscaResultadosDiretoria = []
      this.mostrarClienteDropdownDiretoria = false
      this._resetDataInicioFimMesCorrenteDiretoria()
      this.presetAtivo = 'este_mes'
      this.userHasSelectedDiretoriaPeriod = false
      this.syncDataDisplayDiretoriaFromModel()
      this.mostrarCalendarioDiretoria = false
      this.diretoriaCalSnapshot = null
      this.loadDiretoriaResumo()
    },
    getHojeDiretoria() {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    },
    toISODiretoria(d) {
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    formatarDataCalendarioDiretoria(iso) {
      if (!iso) return ''
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
    },
    isoToDDMMYYYYDiretoria(v) {
      if (!v) return ''
      const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : v
    },
    parseDDMMYYYYDiretoria(str) {
      if (!str || typeof str !== 'string') return ''
      const limpo = str.replace(/\D/g, '')
      if (limpo.length !== 8) return ''
      const dia = parseInt(limpo.slice(0, 2), 10)
      const mes = parseInt(limpo.slice(2, 4), 10) - 1
      const ano = parseInt(limpo.slice(4, 8), 10)
      if (
        ano < 1900 ||
        ano > 2100 ||
        mes < 0 ||
        mes > 11 ||
        dia < 1 ||
        dia > 31
      ) {
        return ''
      }
      const d = new Date(ano, mes, dia)
      if (
        d.getDate() !== dia ||
        d.getMonth() !== mes ||
        d.getFullYear() !== ano
      ) {
        return ''
      }
      return this.toISODiretoria(d)
    },
    formatarParaInputCalendarioDiretoria(val) {
      if (!val) return ''
      const nums = String(val).replace(/\D/g, '')
      if (nums.length <= 2) return nums
      if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`
      return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`
    },
    syncDataDisplayDiretoriaFromModel() {
      this.dataInicioDisplay = this.isoToDDMMYYYYDiretoria(this.dataInicio)
      this.dataFimDisplay = this.isoToDDMMYYYYDiretoria(this.dataFim)
    },
    onDataInicioInputDiretoria(e) {
      const formatado = this.formatarParaInputCalendarioDiretoria(
        e.target.value
      )
      e.target.value = formatado
      this.dataInicioDisplay = formatado
      this.dataInicio = this.parseDDMMYYYYDiretoria(formatado)
    },
    onDataFimInputDiretoria(e) {
      const formatado = this.formatarParaInputCalendarioDiretoria(
        e.target.value
      )
      e.target.value = formatado
      this.dataFimDisplay = formatado
      this.dataFim = this.parseDDMMYYYYDiretoria(formatado)
    },
    _resetDataInicioFimMesCorrenteDiretoria() {
      const hoje = this.getHojeDiretoria()
      this.dataInicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
      const ult = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      this.dataFim = this.toISODiretoria(ult)
    },
    toggleCalendarioDiretoria() {
      if (this.mostrarCalendarioDiretoria) {
        this.fecharCalendarioDiretoriaSemAplicar()
      } else {
        this.diretoriaCalSnapshot = {
          dataInicio: this.dataInicio,
          dataFim: this.dataFim,
          userHasSelectedDiretoriaPeriod: this.userHasSelectedDiretoriaPeriod,
          presetAtivo: this.presetAtivo,
        }
        this.syncDataDisplayDiretoriaFromModel()
        this.mostrarCalendarioDiretoria = true
      }
    },
    fecharCalendarioDiretoriaSemAplicar() {
      if (this.diretoriaCalSnapshot) {
        this.dataInicio = this.diretoriaCalSnapshot.dataInicio
        this.dataFim = this.diretoriaCalSnapshot.dataFim
        this.userHasSelectedDiretoriaPeriod =
          this.diretoriaCalSnapshot.userHasSelectedDiretoriaPeriod
        this.presetAtivo = this.diretoriaCalSnapshot.presetAtivo
        this.diretoriaCalSnapshot = null
      }
      this.syncDataDisplayDiretoriaFromModel()
      this.mostrarCalendarioDiretoria = false
    },
    aplicarPresetDiretoria(id) {
      this.presetAtivo = id
      const hoje = this.getHojeDiretoria()
      let ini = ''
      let fim = ''
      switch (id) {
        case 'ontem': {
          const ontem = new Date(hoje)
          ontem.setDate(ontem.getDate() - 1)
          ini = fim = this.toISODiretoria(ontem)
          break
        }
        case 'hoje':
          ini = fim = this.toISODiretoria(hoje)
          break
        case 'esta_semana': {
          const dia = hoje.getDay()
          const seg = new Date(hoje)
          seg.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1))
          fim = this.toISODiretoria(hoje)
          ini = this.toISODiretoria(seg)
          break
        }
        case 'semana_passada': {
          const dia = hoje.getDay()
          const segAtual = new Date(hoje)
          segAtual.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1))
          const segPassada = new Date(segAtual)
          segPassada.setDate(segAtual.getDate() - 7)
          const domPassada = new Date(segPassada)
          domPassada.setDate(segPassada.getDate() + 6)
          ini = this.toISODiretoria(segPassada)
          fim = this.toISODiretoria(domPassada)
          break
        }
        case 'este_mes':
          ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
          fim = this.toISODiretoria(hoje)
          break
        case 'mes_passado': {
          const prim = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
          const ult = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
          ini = this.toISODiretoria(prim)
          fim = this.toISODiretoria(ult)
          break
        }
        default:
          return
      }
      this.dataInicio = ini
      this.dataFim = fim
      this.userHasSelectedDiretoriaPeriod = true
      this.syncDataDisplayDiretoriaFromModel()
      this.mostrarCalendarioDiretoria = false
      this.diretoriaCalSnapshot = null
      this.loadDiretoriaResumo()
    },
    aplicarIntervaloDiretoria() {
      if (!this.dataInicio || !this.dataFim) {
        this.$emit('notification', 'Informe data início e data fim.', 'warning')
        return
      }
      this.userHasSelectedDiretoriaPeriod = true
      this.syncDataDisplayDiretoriaFromModel()
      this.mostrarCalendarioDiretoria = false
      this.diretoriaCalSnapshot = null
      this.loadDiretoriaResumo()
    },
    limparIntervaloDiretoria() {
      this._resetDataInicioFimMesCorrenteDiretoria()
      this.presetAtivo = 'este_mes'
      this.userHasSelectedDiretoriaPeriod = false
      this.syncDataDisplayDiretoriaFromModel()
      this.mostrarCalendarioDiretoria = false
      this.diretoriaCalSnapshot = null
      this.loadDiretoriaResumo()
    },
    irParaHojeDiretoria() {
      const h = this.toISODiretoria(this.getHojeDiretoria())
      this.dataInicio = h
      this.dataFim = h
      this.syncDataDisplayDiretoriaFromModel()
    },
  },
}
</script>

<style scoped>
.bi-diretoria {
  --bd-bg: #202326;
  --bd-panel: #272a2f;
  --bd-accent: #00ffaa;
  --bd-negative: #ff6b6b;
  --bd-muted: #56595e;
  --bd-text: #ffffff;
  position: relative;
  min-height: calc(100vh - 120px);
  width: 100%;
  background: var(--bd-bg);
  border-radius: 16px;
  padding: 20px 24px 28px;
  box-sizing: border-box;
  overflow-x: auto;
  font-family:
    'Samsung Sharp Sans',
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
  color: var(--bd-text);
}

.bi-diretoria--resumo-pending .bi-diretoria__panels {
  opacity: 0.72;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.bi-diretoria--resumo-pending .bi-diretoria__kpis {
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

/* Mesmo conceito do `.bi-page.bi-fullscreen` no BI SLA (painel / TV). */
.bi-diretoria--fullscreen.bi-diretoria--embed-tv {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.bi-diretoria--fullscreen {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  border-radius: 0;
  box-sizing: border-box;
  padding: 1rem;
  /* Evita rolagem dupla: faixa de KPIs fixa, rankings ocupam o restante e rolam no miolo. */
  overflow: hidden;
}

.bi-diretoria--fullscreen .bi-diretoria__header {
  flex-shrink: 0;
}

/*
 * TV / tela cheia: KPIs ficam em faixa superior (não “comem” o viewport);
 * rankings usam o espaço restante, com rolagem nas tabelas. KPIs com z-index
 * maior evitam sobreposição de painéis (empilhamento com mesmo z-index: 1).
 */
.bi-diretoria--fullscreen .bi-diretoria__panels {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  margin-top: 1.375rem;
  min-height: 0;
  gap: 1.35rem;
  grid-template-rows: minmax(0, 1fr);
  align-content: stretch;
  align-items: stretch;
  overflow: hidden;
}

.bi-diretoria--fullscreen .bi-diretoria__filter-btn {
  width: 3rem;
  height: 3rem;
  font-size: 1.2rem;
}

.bi-diretoria--fullscreen .bi-diretoria__fs-countdown {
  font-size: clamp(0.9rem, 1.5vmin, 1.15rem);
  padding: 0.45rem 0.85rem;
  max-width: min(100%, 28rem);
}

.bi-diretoria--fullscreen .bi-diretoria__dt-modificacao {
  font-size: clamp(0.9rem, 1.45vmin, 1.1rem);
  padding: 0.45rem 0.85rem;
  max-width: min(100%, 32rem);
}

.bi-diretoria--fullscreen .bi-diretoria__filtros-dropdown {
  min-width: min(22rem, calc(100vw - 2rem));
}

.bi-diretoria--fullscreen .bi-diretoria__btn-fs {
  width: 3rem;
  height: 3rem;
  font-size: 1.25rem;
}

.bi-diretoria--fullscreen .bi-diretoria__kpis {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  min-height: 0;
  gap: 1.5rem;
  margin-top: 1.25rem;
  align-content: start;
  /* Uma faixa de cards; evita fileiras gigantes que empurram/encobrem os rankings. */
  grid-template-rows: auto;
}

.bi-diretoria--fullscreen .bi-diretoria__card {
  min-height: min(200px, 22vh);
  max-height: min(320px, 32vh);
  height: auto;
  justify-content: flex-start;
  align-items: stretch;
  gap: 0.5rem;
  padding: 1rem 1.4rem 1.35rem;
  border-radius: 18px;
  box-sizing: border-box;
}

.bi-diretoria--fullscreen .bi-diretoria__card-head {
  flex: 0 0 auto;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem 1.35rem;
  flex-wrap: nowrap;
  /* Mesma “reserva” em todos os cards: título + linha + subtítulo (quando existir). */
  min-height: clamp(8.25rem, 15vmin, 10.75rem);
  box-sizing: border-box;
}

.bi-diretoria--fullscreen .bi-diretoria__card-title-wrap {
  flex: 1 1 auto;
  min-width: 0;
  text-align: start;
}

.bi-diretoria--fullscreen .bi-diretoria__card-title {
  font-size: calc(1.45rem + 10px);
  max-width: none;
  line-height: 1.15;
}

.bi-diretoria--fullscreen .bi-diretoria__card-underline {
  width: 3.25rem;
  height: 0.32rem;
  margin: 0.5rem 0 0;
}

.bi-diretoria--fullscreen .bi-diretoria__card-subtitle {
  font-size: 1.08rem;
  margin-top: 0.65rem;
}

.bi-diretoria--fullscreen .bi-diretoria__card-head-right {
  flex-shrink: 0;
  gap: 0.65rem;
  min-width: 4rem;
}

.bi-diretoria--fullscreen .bi-diretoria__card-icon-box {
  width: 4.5rem;
  height: 4.5rem;
  font-size: 1.7rem;
  border-radius: 0.6rem;
}

.bi-diretoria--fullscreen .bi-diretoria__badge {
  font-size: 0.62rem;
  padding: 0.3rem 0.65rem;
  border-radius: 1.15rem;
  letter-spacing: 0.05em;
}

.bi-diretoria--fullscreen .bi-diretoria__badge--mom {
  font-size: 0.58rem;
  padding: 0.3rem 0.65rem;
}

.bi-diretoria--fullscreen .bi-diretoria__card-metric-block {
  flex: 1 1 auto;
  margin-top: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-top: 0.25rem;
  width: 100%;
}

/* Hero em tela cheia: levemente menor para moedas longas não encostarem na borda do card. */
.bi-diretoria--fullscreen .bi-diretoria__card-value {
  margin: 0;
  text-align: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding-inline: 6px;
  font-size: clamp(22px, 13cqw, 46px);
  letter-spacing: -0.038em;
  line-height: 1.08;
}

@supports not (font-size: 1cqw) {
  .bi-diretoria--fullscreen .bi-diretoria__card-value {
    font-size: clamp(22px, 4.65vmin, 46px);
  }
}

/* Textos secundários: mesma razão dos percentuais SLA 13px → 24px (×24/13). */
.bi-diretoria--fullscreen .bi-diretoria__card-ref {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  text-align: center;
  width: 100%;
  min-height: clamp(4.75rem, 9vmin, 6.5rem);
  gap: 0.45rem;
  padding-bottom: 0.15rem;
  box-sizing: border-box;
}

/* Mesma escala em todos os cards da linha (largura do card = mesmo cqw). */
.bi-diretoria--fullscreen .bi-diretoria__card-ref-label {
  font-size: clamp(16px, 1.85cqw, calc(0.9rem + 10px));
  letter-spacing: 0.06em;
}

.bi-diretoria--fullscreen .bi-diretoria__card-ref-date {
  font-size: clamp(17px, 2.05cqw, calc(1.1rem + 10px));
}

@supports not (font-size: 1cqw) {
  .bi-diretoria--fullscreen .bi-diretoria__card-ref-label {
    font-size: calc(0.9rem + 10px);
  }

  .bi-diretoria--fullscreen .bi-diretoria__card-ref-date {
    font-size: calc(1.1rem + 10px);
  }
}

.bi-diretoria--fullscreen .bi-diretoria__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  min-width: 0;
  max-height: 100%;
  padding: 1.5rem 1.35rem 1.35rem;
  border-radius: 16px;
}

.bi-diretoria--fullscreen .bi-diretoria__panel-head {
  flex-shrink: 0;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bi-diretoria--fullscreen .bi-diretoria__panel-icon-box {
  width: clamp(3.85rem, 5.25vmin, 5.1rem);
  height: clamp(3.85rem, 5.25vmin, 5.1rem);
  font-size: clamp(1.65rem, 2.7vmin, 2.15rem);
  border-radius: 0.58rem;
}

.bi-diretoria--fullscreen .bi-diretoria__table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
}

/* Títulos dos painéis — meio-termo legível vs. altura do bloco de ranking. */
.bi-diretoria--fullscreen .bi-diretoria__panel-title {
  font-size: clamp(2.1rem, 3.15vmin, 2.85rem);
}

.bi-diretoria--fullscreen .bi-diretoria__panel-underline {
  width: clamp(3.15rem, 4.35vmin, 4rem);
  height: clamp(0.34rem, 0.4vmin, 0.46rem);
  margin-top: 0.55rem;
}

/*
 * Rankings: corpo legível (entre o “grande” antigo e o demasiado pequeno);
 * layout fixo e sem rolagem horizontal.
 */
.bi-diretoria--fullscreen .bi-diretoria__table {
  table-layout: fixed;
  width: 100%;
  max-width: 100%;
  font-size: clamp(1.22rem, 2.05vmin, 1.88rem);
  line-height: 1.38;
}

.bi-diretoria--fullscreen .bi-diretoria__table th,
.bi-diretoria--fullscreen .bi-diretoria__table td {
  padding: clamp(0.58rem, 1.25vmin, 1.05rem) clamp(0.45rem, 0.9vmin, 0.72rem);
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  vertical-align: middle;
}

/* Números e percentuais: uma linha (evita “24,1” + “1%” em linhas separadas). */
.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(n + 3),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(n + 3) {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Cabeçalho em duas linhas (título + ref. data) — não força nowrap. */
.bi-diretoria--fullscreen .bi-diretoria__table th.bi-diretoria__th-custo-estoque {
  white-space: normal;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th,
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td {
  padding: clamp(1rem, 2vmin, 1.85rem) clamp(0.95rem, 1.85vmin, 1.65rem);
  line-height: 1.58;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes tbody td {
  padding-top: clamp(1.05rem, 2.1vmin, 1.95rem);
  padding-bottom: clamp(1.05rem, 2.1vmin, 1.95rem);
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(n + 3),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(n + 3) {
  padding-left: clamp(0.9rem, 1.65vmin, 1.35rem);
}

/* Colunas de valores (dia / mês / custo): mais calha horizontal — números grandes no TV. */
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(n + 5),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(n + 5) {
  padding-left: clamp(1.05rem, 2vmin, 1.75rem);
  padding-right: clamp(0.85rem, 1.55vmin, 1.35rem);
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes .bi-diretoria__rank {
  width: clamp(2.35rem, 3.85vmin, 3rem);
  height: clamp(2.35rem, 3.85vmin, 3rem);
  font-size: clamp(0.95rem, 1.55vmin, 1.2rem);
}

.bi-diretoria--fullscreen.bi-diretoria--carteira .bi-diretoria__table {
  font-size: clamp(1.48rem, 2.52vmin, 2.28rem);
  line-height: 1.52;
}

.bi-diretoria--fullscreen.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes th,
.bi-diretoria--fullscreen.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes td {
  line-height: 1.62;
  padding-top: clamp(1.05rem, 2.15vmin, 1.95rem);
  padding-bottom: clamp(1.05rem, 2.15vmin, 1.95rem);
}

.bi-diretoria--fullscreen.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes .bi-diretoria__rank {
  width: clamp(2.72rem, 4.35vmin, 3.55rem);
  height: clamp(2.72rem, 4.35vmin, 3.55rem);
  font-size: clamp(1.12rem, 1.78vmin, 1.48rem);
}

.bi-diretoria--fullscreen.bi-diretoria--carteira
  .bi-diretoria__table--ranking-clientes
  .bi-diretoria__th-custo-estoque-ref {
  font-size: clamp(1.18rem, 2.55vmin, 2rem);
  margin-top: clamp(0.6rem, 1.2vmin, 0.95rem);
}

.bi-diretoria--fullscreen.bi-diretoria--carteira .bi-diretoria__card-head {
  min-height: clamp(6.5rem, 12vmin, 9rem);
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes .bi-diretoria__th-custo-estoque-ref {
  margin-top: clamp(0.55rem, 1.1vmin, 0.9rem);
  font-size: clamp(1.05rem, 2.25vmin, 1.72rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

.bi-diretoria--fullscreen .bi-diretoria__table th {
  white-space: normal;
  line-height: 1.25;
}

.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(1),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(1) {
  width: 4.5rem;
  text-align: center;
}

.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(2),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(2) {
  width: 32%;
  text-align: left;
}

.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(3),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(3) {
  width: 11%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(4),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(4) {
  width: 10%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(5),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(5) {
  width: 18%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table th:nth-child(6),
.bi-diretoria--fullscreen .bi-diretoria__table td:nth-child(6) {
  width: 19%;
  text-align: right;
}

/*
 * Ranking clientes pode ter 7 colunas (custo estoque). As larguras genéricas acima
 * não reservam a 7ª — tudo fica “grudado”. Sobrescreve só esta tabela.
 */
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(1),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(1) {
  width: 5.5rem;
  text-align: center;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(2),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(2) {
  width: 30%;
  min-width: 8.5rem;
  text-align: left;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(3),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(3) {
  width: 9%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(4),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(4) {
  width: 8%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(5),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(5) {
  width: 14%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(6),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(6) {
  width: 15%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes th:nth-child(7),
.bi-diretoria--fullscreen .bi-diretoria__table--ranking-clientes td:nth-child(7) {
  width: 14%;
  text-align: right;
}

.bi-diretoria--fullscreen .bi-diretoria__table-empty {
  font-size: clamp(1.65rem, 2.45vmin, 2.1rem);
  padding: 1.5rem 1.15rem !important;
}

.bi-diretoria--fullscreen .bi-diretoria__cell-name {
  max-width: none;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
}

.bi-diretoria--fullscreen .bi-diretoria__cell-name--cliente {
  max-width: none;
}

.bi-diretoria--fullscreen .bi-diretoria__cliente-cell-inner {
  flex-wrap: wrap;
  white-space: normal;
}

.bi-diretoria--fullscreen .bi-diretoria__client-nome-trunc {
  overflow: visible;
  text-overflow: unset;
}

.bi-diretoria--fullscreen .bi-diretoria__cell-accent {
  white-space: nowrap;
}

.bi-diretoria--fullscreen .bi-diretoria__rank {
  width: clamp(2.65rem, 3.75vmin, 3.25rem);
  height: clamp(2.65rem, 3.75vmin, 3.25rem);
  font-size: clamp(1.18rem, 1.85vmin, 1.42rem);
}

.bi-diretoria--fullscreen .bi-diretoria__sigma {
  width: clamp(2.85rem, 4vmin, 3.45rem);
  height: clamp(2.85rem, 4vmin, 3.45rem);
}

.bi-diretoria--fullscreen .bi-diretoria__sigma-inner {
  font-size: clamp(1.4rem, 2.3vmin, 1.72rem);
}

@media (max-width: 1200px) {
  .bi-diretoria--fullscreen .bi-diretoria__panels {
    grid-template-rows: minmax(0, 1fr);
    flex: 1 1 0;
    margin-top: 1.375rem;
    min-height: 0;
  }

  .bi-diretoria--fullscreen .bi-diretoria__kpis {
    flex: 0 0 auto;
    min-height: 0;
    grid-template-rows: auto;
  }

  .bi-diretoria--fullscreen .bi-diretoria__card {
    min-height: min(200px, 20vh);
    max-height: min(300px, 30vh);
    height: auto;
  }
}

.bi-diretoria__glow {
  position: absolute;
  left: 50%;
  top: -280px;
  transform: translateX(-50%);
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: rgba(0, 255, 170, 0.64);
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

/* Header acima de KPIs/painéis para o dropdown de filtros não ficar por baixo (mesmo z-index = ordem do DOM). */
.bi-diretoria__header {
  position: relative;
  z-index: 20;
}

.bi-diretoria__subtabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.bi-diretoria__subtab-btn {
  padding: 0.45rem 1rem;
  border: 1px solid #56595e;
  border-radius: 8px;
  background: var(--bd-panel);
  font-size: 0.88rem;
  font-weight: 500;
  color: #e2e4e8;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.bi-diretoria__subtab-btn:hover {
  border-color: var(--bd-accent);
  color: var(--bd-accent);
}

.bi-diretoria__subtab-btn.active {
  background: rgba(0, 255, 170, 0.18);
  border-color: var(--bd-accent);
  color: var(--bd-accent);
}

.bi-diretoria__kpis,
.bi-diretoria__panels {
  position: relative;
  z-index: 1;
}

.bi-diretoria__header-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px 12px;
  row-gap: 10px;
}

.bi-diretoria__fs-countdown {
  font-size: 0.875rem;
  color: var(--bd-accent);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  background: rgba(0, 255, 170, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 170, 0.3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  max-width: min(100%, 20rem);
}

/* Mesmo padrão do BI SLA: `.update-info` em `BIPage.vue` (ícone sync + “Atualizado em …”). */
.bi-diretoria__dt-modificacao {
  font-size: 0.875rem;
  color: #8b8e94;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  max-width: min(100%, 34rem);
}

/* Botão atualizar — mesmo papel do `.btn-refresh` do BI SLA. */
.bi-diretoria__btn-refresh {
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  background: var(--bd-panel);
  border: 1px solid #56595e;
  color: var(--bd-accent);
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.bi-diretoria__btn-refresh:hover:not(:disabled) {
  background: var(--bd-accent);
  color: var(--bd-bg);
  border-color: var(--bd-accent);
}

.bi-diretoria__btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Período (calendário): espelha `BIPage.vue` (.btn-abrir-calendario-bi, .calendario-dropdown-bi). */
.bi-diretoria__calendario-wrap {
  position: relative;
}

.bi-diretoria__btn-calendario {
  height: 40px;
  min-height: 40px;
  padding: 0 1rem;
  box-sizing: border-box;
  background: var(--bd-panel);
  border: 1px solid #56595e;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #e2e4e8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  max-width: min(420px, 72vw);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-diretoria__btn-calendario:hover {
  background: #32363b;
  border-color: var(--bd-accent);
  color: var(--bd-accent);
}

.bi-diretoria__calendario-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: #272a2f;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 1px solid #56595e;
  z-index: 1000;
  min-width: min(520px, calc(100vw - 2rem));
}

.bi-diretoria__calendario-layout {
  display: flex;
  padding: 1rem;
  gap: 1.5rem;
}

.bi-diretoria__calendario-presets {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 180px;
  padding-right: 1rem;
  border-right: 1px solid #56595e;
}

.bi-diretoria__preset-btn {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.9rem;
  color: #e2e4e8;
  cursor: pointer;
  transition: background 0.2s;
}

.bi-diretoria__preset-btn:hover {
  background: #32363b;
}

.bi-diretoria__preset-btn.active {
  background: var(--bd-accent);
  color: var(--bd-bg);
  font-weight: 500;
}

.bi-diretoria__calendario-custom {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bi-diretoria__calendario-btns {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bi-diretoria__btn-cal {
  padding: 0.4rem 0.75rem;
  border: 1px solid #56595e;
  border-radius: 6px;
  background: var(--bd-bg);
  font-size: 0.85rem;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}

.bi-diretoria__btn-cal:hover {
  border-color: var(--bd-accent);
  color: var(--bd-accent);
}

.bi-diretoria__btn-cal--aplicar {
  background: var(--bd-accent);
  border-color: var(--bd-accent);
  color: var(--bd-bg);
}

.bi-diretoria__btn-cal--aplicar:hover {
  background: #00e695;
  border-color: #00e695;
}

.bi-diretoria__calendario-inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.bi-diretoria__input-data-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #56595e;
  border-radius: 8px;
  background: var(--bd-bg);
}

.bi-diretoria__input-data-wrap:focus-within {
  border-color: var(--bd-accent);
  box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.15);
}

.bi-diretoria__input-data-wrap i {
  color: #8b8e94;
  font-size: 0.9rem;
}

.bi-diretoria__input-data-wrap input {
  background: transparent;
  border: none;
  color: #e2e4e8;
  font-size: 0.9rem;
  outline: none;
  min-width: 100px;
}

.bi-diretoria__input-data-wrap input::placeholder {
  color: #56595e;
}

/* Filtros: espelha `BIPage.vue` (.filter-btn, .filtros-dropdown-bi, .filtro-campo-bi). */
.bi-diretoria__filtros-wrap {
  position: relative;
}

.bi-diretoria__filter-btn {
  position: relative;
  background: var(--bd-panel);
  border: 1px solid #56595e;
  color: #8b8e94;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.bi-diretoria__filter-btn:hover {
  background: #32363b;
  color: var(--bd-accent);
}

.bi-diretoria__filter-btn.active {
  border-color: var(--bd-accent);
  color: var(--bd-accent);
}

.bi-diretoria__filter-btn--busy {
  cursor: wait;
  border-color: rgba(0, 255, 170, 0.55) !important;
  color: var(--bd-accent) !important;
}

.bi-diretoria__filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--bd-accent);
  color: var(--bd-bg);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bi-diretoria__filtros-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: #272a2f;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 1px solid #56595e;
  z-index: 1000;
  min-width: 320px;
  padding: 1rem;
  box-sizing: border-box;
  overflow: visible;
}

.bi-diretoria__filtros-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #56595e;
}

.bi-diretoria__filtros-header span {
  font-weight: 600;
  color: #e2e4e8;
}

.bi-diretoria__btn-limpar-filtros {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  background: transparent;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.bi-diretoria__btn-limpar-filtros:hover {
  border-color: var(--bd-accent);
  color: var(--bd-accent);
}

.bi-diretoria__filtros-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.bi-diretoria__filtro-campo label {
  display: block;
  font-size: 0.75rem;
  color: #8b8e94;
  margin-bottom: 0.25rem;
}

.bi-diretoria__filtro-campo label i {
  margin-right: 0.35rem;
  opacity: 0.9;
}

.bi-diretoria__filtro-input {
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: var(--bd-bg);
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.bi-diretoria__filtro-input::placeholder {
  color: #6b6e73;
}

.bi-diretoria__filtro-input:focus {
  outline: none;
  border-color: var(--bd-accent);
}

.bi-diretoria__filtro-cliente-autocomplete {
  position: relative;
}

.bi-diretoria__filtro-cliente-wrap {
  position: relative;
}

.bi-diretoria__filtro-cliente-wrap .bi-diretoria__filtro-input {
  width: 100%;
}

.bi-diretoria__filtro-cliente-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 220px;
  overflow-y: auto;
  background: var(--bd-bg);
  border: 1px solid #56595e;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1200;
}

.bi-diretoria__filtro-cliente-opt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: #e2e4e8;
  cursor: pointer;
  transition: background 0.15s;
}

.bi-diretoria__filtro-cliente-opt:hover {
  background: rgba(0, 255, 170, 0.15);
}

.bi-diretoria__filtro-cliente-empty {
  padding: 0.75rem;
  font-size: 0.85rem;
  color: #8b8e94;
  text-align: center;
}

.bi-diretoria__filtro-cliente-id {
  font-size: 0.8em;
  color: #8b8e94;
  margin-left: 0.2rem;
}

.bi-diretoria__filtro-cliente-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.4rem;
}

.bi-diretoria__filtro-cliente-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.8rem;
  background: rgba(0, 255, 170, 0.2);
  border: 1px solid rgba(0, 255, 170, 0.4);
  border-radius: 4px;
  color: #e2e4e8;
}

.bi-diretoria__filtro-cliente-chip-remove {
  padding: 0 0.2rem;
  background: none;
  border: none;
  color: #8b8e94;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}

.bi-diretoria__filtro-cliente-chip-remove:hover {
  color: var(--bd-accent);
}

.bi-diretoria__filtro-cliente-opt.disabled {
  opacity: 0.6;
  cursor: default;
}

.bi-diretoria__filtro-cliente-opt.disabled:hover {
  background: transparent;
}

.bi-diretoria__filtro-cliente-check {
  margin-left: auto;
  color: var(--bd-accent);
}

.bi-diretoria__filtro-select {
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: var(--bd-bg);
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
  cursor: pointer;
  box-sizing: border-box;
}

.bi-diretoria__filtro-select:focus {
  outline: none;
  border-color: var(--bd-accent);
}

.bi-diretoria__filtros-aplicar {
  width: 100%;
  margin-top: 1rem;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  background: var(--bd-accent);
  color: var(--bd-bg);
  cursor: pointer;
  transition: filter 0.15s;
}

.bi-diretoria__filtros-aplicar:hover {
  filter: brightness(1.06);
}

.bi-diretoria__filtros-aplicar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  filter: none;
}

/* Botão tela cheia: mesmo padrão visual do `theme-toggle-btn` do BI SLA. */
.bi-diretoria__btn-fs {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--bd-muted);
  background: var(--bd-panel);
  color: var(--bd-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.bi-diretoria__btn-fs:hover {
  background: #32363b;
  color: var(--bd-accent);
  border-color: var(--bd-accent);
}

.bi-diretoria__kpis {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

/* Carteira: 4 KPIs — uma coluna por card para preencher a largura. */
.bi-diretoria__kpis--carteira {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.bi-diretoria__kpis--carteira .bi-diretoria__card {
  min-height: 240px;
  padding: 16px 14px 20px;
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-head {
  min-height: 5.5rem;
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-title {
  font-size: clamp(1.05rem, 0.92rem + 0.9vw, 1.7rem);
  max-width: none;
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-subtitle {
  font-size: 13px;
  margin-top: 10px;
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-value {
  font-size: clamp(16px, 8.5cqw, 30px);
}

@supports not (font-size: 1cqw) {
  .bi-diretoria__kpis--carteira .bi-diretoria__card-value {
    font-size: clamp(16px, 3.4vmin, 30px);
  }
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-ref {
  min-height: 5.35rem;
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-ref-label {
  font-size: clamp(14px, 4cqw, 18px);
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-ref-date {
  font-size: clamp(15px, 4.5cqw, 24px);
}

@supports not (font-size: 1cqw) {
  .bi-diretoria__kpis--carteira .bi-diretoria__card-ref-label {
    font-size: clamp(14px, 1.9vw, 18px);
  }

  .bi-diretoria__kpis--carteira .bi-diretoria__card-ref-date {
    font-size: clamp(15px, 2.1vw, 24px);
  }
}

.bi-diretoria__kpis--carteira .bi-diretoria__card-icon-box {
  width: 52px;
  height: 52px;
  font-size: 20px;
}

@media (max-width: 1600px) {
  .bi-diretoria__kpis {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .bi-diretoria__kpis--carteira {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .bi-diretoria__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bi-diretoria__kpis--carteira {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .bi-diretoria__kpis--carteira {
    grid-template-columns: 1fr;
  }
}

.bi-diretoria__card {
  container-type: inline-size;
  background: var(--bd-panel);
  border-radius: 18px;
  padding: 14px 12px 18px;
  min-height: 228px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
}

.bi-diretoria__card-head {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  /* Alinha o “hero” entre os 7 cards: mesma faixa para título+subtítulo (MoM). */
  min-height: 7.75rem;
  box-sizing: border-box;
}

.bi-diretoria__card-title {
  margin: 0;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 11em;
}

/* Título pode quebrar na coluna esquerda; ícone permanece na lateral (igual “Faturamento mês anterior”). */
.bi-diretoria__card-title-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.bi-diretoria__card-underline {
  width: 42px;
  height: 4px;
  background: var(--bd-accent);
  border-radius: 18px;
  margin-top: 10px;
}

.bi-diretoria__card-subtitle {
  margin: 8px 0 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--bd-muted);
}

.bi-diretoria__card-head-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 48px;
}

.bi-diretoria__card-icon-box {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--bd-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bd-accent);
  font-size: 18px;
}

/* Texto menor; padding/raio preservam o “tamanho” visual da pill, não só o texto. */
.bi-diretoria__badge {
  display: inline-block;
  background: var(--bd-accent);
  color: var(--bd-bg);
  font-size: 5.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 9px;
  border-radius: 18px;
  line-height: 1.25;
  text-align: center;
  white-space: nowrap;
}

.bi-diretoria__badge--mom {
  font-size: 5px;
  letter-spacing: 0.08em;
  /* Mesmo padding da pill base — não encolhe o retângulo verde por variant. */
  padding: 3px 9px;
}

.bi-diretoria__card-metric-block {
  flex: 1 1 auto;
  margin-top: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: 4px;
  min-width: 0;
  min-height: 0;
  width: 100%;
  text-align: center;
}

/* Valor principal: cabe linha única em 7 colunas; nowrap + fonte contida (R$ colado ao número via NBSP no formatMoney). */
.bi-diretoria__card-value {
  margin: 0;
  width: 100%;
  text-align: center;
  font-size: clamp(13px, 6cqw, 20px);
  font-weight: 800;
  color: var(--bd-accent);
  letter-spacing: -0.035em;
  line-height: 1.1;
  white-space: nowrap;
  word-break: normal;
  overflow-wrap: normal;
  font-variant-numeric: tabular-nums;
}

.bi-diretoria__card-value--negative {
  color: var(--bd-negative);
}

@supports not (font-size: 1cqw) {
  .bi-diretoria__card-value {
    font-size: clamp(13px, 3.2vmin, 20px);
  }
}

.bi-diretoria__card-ref {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  text-align: center;
  gap: 4px;
  min-width: 0;
  width: 100%;
  min-height: 5rem;
  padding-bottom: 2px;
  box-sizing: border-box;
}

.bi-diretoria__card-ref-label {
  font-size: clamp(15px, 3.6cqw, 19px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--bd-muted);
}

.bi-diretoria__card-ref-date {
  font-size: clamp(16px, 4cqw, 21px);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: -0.02em;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@supports not (font-size: 1cqw) {
  .bi-diretoria__card-ref-label {
    font-size: 19px;
  }

  .bi-diretoria__card-ref-date {
    font-size: 21px;
  }
}

/* Comparativo: mesmo tamanho de fonte dos demais; linha única + scroll se não couber. */
.bi-diretoria__card-ref-date--mom {
  align-self: stretch;
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  text-overflow: clip;
}

.bi-diretoria__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 22px;
  align-items: stretch;
}

.bi-diretoria__panels--carteira-solo {
  grid-template-columns: 1fr;
}

@media (max-width: 1200px) {
  .bi-diretoria__panels {
    grid-template-columns: 1fr;
  }
}

.bi-diretoria__panel {
  background: var(--bd-panel);
  border-radius: 16px;
  padding: 20px 18px 16px;
  min-height: 380px;
  box-sizing: border-box;
}

.bi-diretoria__panel-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.bi-diretoria__panel-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--bd-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bd-accent);
  font-size: 20px;
}

.bi-diretoria__panel-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.bi-diretoria__panel-underline {
  width: 42px;
  height: 4px;
  background: var(--bd-accent);
  border-radius: 18px;
  margin-top: 8px;
}

.bi-diretoria__table-wrap {
  overflow-x: auto;
  border-radius: 8px;
}

.bi-diretoria__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.bi-diretoria__table th {
  text-align: left;
  font-weight: 700;
  color: var(--bd-muted);
  padding: 10px 8px;
  border-bottom: 1px solid rgba(86, 89, 94, 0.35);
  white-space: nowrap;
}

.bi-diretoria__th-custo-estoque {
  white-space: normal;
  vertical-align: bottom;
  line-height: 1.25;
}

.bi-diretoria__th-custo-estoque-title {
  display: block;
}

.bi-diretoria__th-custo-estoque-ref {
  display: block;
  margin-top: 6px;
  font-size: clamp(13px, 0.82rem + 0.35vw, 16px);
  font-weight: 700;
  color: var(--bd-accent);
  letter-spacing: 0.04em;
  line-height: 1.35;
}

.bi-diretoria__table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(86, 89, 94, 0.2);
  color: var(--bd-text);
  vertical-align: middle;
}

/* Ranking clientes: mais ar entre linhas e colunas (valores monetários longos). */
.bi-diretoria__table--ranking-clientes th,
.bi-diretoria__table--ranking-clientes td {
  padding: 14px 14px;
  line-height: 1.5;
}

.bi-diretoria__table--ranking-clientes th {
  padding-top: 12px;
  padding-bottom: 16px;
  vertical-align: bottom;
}

.bi-diretoria__table--ranking-clientes td {
  padding-top: 15px;
  padding-bottom: 15px;
  vertical-align: middle;
}

.bi-diretoria__table--ranking-clientes th:nth-child(n + 3),
.bi-diretoria__table--ranking-clientes td:nth-child(n + 3) {
  padding-left: 16px;
}

.bi-diretoria__table--ranking-clientes thead th:first-child {
  text-align: center;
}

.bi-diretoria__table--ranking-clientes .bi-diretoria__rank {
  width: 32px;
  height: 32px;
  font-size: 13px;
}

/* Carteira: painel e tabela de ranking mais legíveis. */
.bi-diretoria--carteira .bi-diretoria__panel-title {
  font-size: clamp(1.22rem, 1.08rem + 0.65vw, 1.65rem);
}

.bi-diretoria--carteira .bi-diretoria__panel-icon-box {
  width: 54px;
  height: 54px;
  font-size: 22px;
}

.bi-diretoria--carteira .bi-diretoria__table {
  font-size: clamp(17px, 1rem + 0.55vw, 21px);
  line-height: 1.58;
}

.bi-diretoria--carteira .bi-diretoria__table th,
.bi-diretoria--carteira .bi-diretoria__table td {
  padding: 16px 14px;
}

.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes th,
.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes td {
  padding: 20px 18px;
  line-height: 1.62;
}

.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes th {
  font-size: clamp(16px, 0.94rem + 0.5vw, 19px);
  padding-bottom: 18px;
}

.bi-diretoria--carteira .bi-diretoria__table--ranking-clientes .bi-diretoria__rank {
  width: 46px;
  height: 46px;
  font-size: 18px;
}

.bi-diretoria--carteira .bi-diretoria__th-custo-estoque {
  line-height: 1.35;
}

.bi-diretoria--carteira .bi-diretoria__th-custo-estoque-ref {
  margin-top: 8px;
  font-size: clamp(14px, 0.88rem + 0.5vw, 18px);
  line-height: 1.4;
}

.bi-diretoria--carteira .bi-diretoria__cell-name--cliente {
  max-width: min(480px, 54vw);
}

.bi-diretoria--carteira .bi-diretoria__cliente-cell-inner {
  gap: 0.5rem;
}

.bi-diretoria--carteira .bi-diretoria__client-id {
  font-size: 0.96em;
}

.bi-diretoria__table-empty {
  text-align: center;
  padding: 28px 16px !important;
  color: var(--bd-muted);
  font-size: 13px;
}

.bi-diretoria--carteira .bi-diretoria__table-empty {
  font-size: clamp(16px, 0.95rem + 0.4vw, 20px);
}

.bi-diretoria__table tbody tr:hover td {
  background: rgba(0, 255, 170, 0.04);
}

.bi-diretoria__cell-name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bi-diretoria__td-rank {
  text-align: center;
  vertical-align: middle;
  width: 1%;
}

/* Flex dentro de `td` quebra borda/alinhamento de linha; wrapper interno resolve. */
.bi-diretoria__cell-name--cliente {
  max-width: min(360px, 38vw);
  vertical-align: middle;
}

.bi-diretoria__cliente-cell-inner {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  white-space: nowrap;
}

.bi-diretoria__client-id {
  flex: 0 0 auto;
  color: var(--bd-muted);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.bi-diretoria__client-id-sep {
  flex: 0 0 auto;
  color: var(--bd-muted);
  font-weight: 600;
  user-select: none;
}

.bi-diretoria__client-nome-trunc {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-diretoria__cell-accent {
  color: var(--bd-accent);
  font-weight: 600;
  white-space: nowrap;
}

.bi-diretoria__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.bi-diretoria__rank--top {
  background: var(--bd-accent);
  color: var(--bd-bg);
}

.bi-diretoria__rank--rest {
  background: var(--bd-bg);
  color: var(--bd-muted);
}

.bi-diretoria__tfoot-row td {
  border-bottom: none;
  padding-top: 14px;
  font-weight: 700;
}

.bi-diretoria__tfoot-label {
  color: var(--bd-text) !important;
  font-weight: 700 !important;
}

.bi-diretoria__sigma {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bd-accent);
  border-radius: 6px;
}

.bi-diretoria__sigma-inner {
  color: var(--bd-bg);
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}
</style>
