<template>
  <div
    id="bi-agendamentos-page-root"
    ref="pageRoot"
    class="bi-page bi-agendamentos-page"
    :class="[
      biTheme === 'light' ? 'bi-theme-light' : 'bi-theme-dark',
      { 'bi-ag-tv-scale': biAgTvLayout, 'bi-ag--embed-tv': embedTvLayout },
    ]"
  >
    <div v-if="loading" class="bi-loading-overlay">
      <div class="bi-loading-canvas">
        <i class="fas fa-spinner fa-spin bi-loading-icon"></i>
        <p class="bi-loading-message">
          Carregando agendamentos (check-in / schedule_list)…
        </p>
      </div>
    </div>

    <header class="bi-ag-header">
      <div class="bi-ag-header-titles">
        <h1 class="bi-ag-title">
          <i class="fas fa-calendar-check" aria-hidden="true"></i>
          Análise de Agendamentos
        </h1>
        <p class="bi-ag-subtitle">
          Status Solicitado ou Agendado — período:
          <strong>{{ periodoDescricao }}</strong> — métrica:
          <strong>{{ visaoMetricaLabel }}</strong>
          <template v-if="visaoMetrica === 'volumes'">
            (soma de <code>case_count</code> nos agendamentos) </template
          >.
          <span v-if="!compareMode && !filterCD" class="bi-ag-footnote">
            Visão geral sem CD: totais do cache (até ~5 min), recortados ao
            período.
          </span>
        </p>
      </div>
      <div class="bi-ag-header-actions">
        <span v-if="lastUpdatedDisplay" class="bi-ag-updated">
          <i class="fas fa-sync-alt" aria-hidden="true"></i>
          Atualizado em {{ lastUpdatedDisplay }}
        </span>
        <button
          type="button"
          class="bi-ag-btn-refresh bi-ag-btn-theme"
          :title="
            biTheme === 'dark' ? 'Tema claro (azul/branco)' : 'Tema escuro'
          "
          @click="toggleBiTheme"
        >
          <i
            :class="biTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="!embedTvLayout"
          type="button"
          class="bi-ag-btn-refresh bi-ag-btn-fs"
          :title="
            biAgTvLayout ? 'Sair da tela cheia' : 'Tela cheia (painel / TV)'
          "
          @click="toggleFullscreen"
        >
          <i
            :class="biAgTvLayout ? 'fas fa-compress' : 'fas fa-expand'"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          class="bi-ag-btn-refresh"
          :disabled="loading"
          title="Atualizar"
          @click="fetchData"
        >
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" />
        </button>
      </div>
    </header>

    <div class="bi-ag-toolbar bi-ag-toolbar-grid">
      <label class="bi-ag-filter-label">
        <span>Período de análise</span>
        <select
          v-model.number="periodoDias"
          class="bi-ag-select"
          :disabled="loading"
          @change="fetchData"
        >
          <option v-for="p in periodoOpcoes" :key="p.val" :value="p.val">
            {{ p.label }}
          </option>
        </select>
      </label>

      <label class="bi-ag-filter-label">
        <span>Visão</span>
        <select
          v-model="visaoMetrica"
          class="bi-ag-select"
          :disabled="loading"
          @change="fetchData"
        >
          <option value="notas">Por notas</option>
          <option value="volumes">Por volumes a receber</option>
        </select>
      </label>

      <label
        v-if="
          biAgShowMultiCdControls &&
          !isPainelForcedNormal &&
          !isPainelForcedCompareAll
        "
        class="bi-ag-filter-label bi-ag-toggle-wrap"
      >
        <span class="bi-ag-toggle-label">Comparar armazéns (CD)</span>
        <button
          type="button"
          class="bi-ag-toggle"
          :class="{ 'bi-ag-toggle--on': compareMode }"
          role="switch"
          :aria-checked="compareMode"
          :disabled="loading"
          @click="toggleCompareMode"
        >
          <span class="bi-ag-toggle-knob" />
        </button>
      </label>

      <template
        v-if="
          !compareMode &&
          biAgShowMultiCdControls &&
          !isPainelForcedNormal &&
          !isPainelForcedCompareAll
        "
      >
        <label class="bi-ag-filter-label">
          <span>CD (centro de distribuição)</span>
          <select
            v-model="filterCD"
            class="bi-ag-select"
            :disabled="loading"
            @change="fetchData"
          >
            <option value="">Todos</option>
            <option v-for="cd in cds" :key="cd" :value="cd">{{ cd }}</option>
          </select>
        </label>
      </template>

      <div
        v-else-if="
          compareMode && biAgShowMultiCdControls && !isPainelForcedCompareAll
        "
        class="bi-ag-compare-panel"
      >
        <div class="bi-ag-compare-panel-head">
          <span class="bi-ag-compare-panel-title">CDs na comparação</span>
          <span class="bi-ag-compare-count"
            >{{ compareCdsSelected.length }} selecionado(s)</span
          >
        </div>
        <div class="bi-ag-compare-chips">
          <span
            v-for="(cd, idx) in compareCdsSelected"
            :key="'chip-' + cd + '-' + idx"
            class="bi-ag-chip"
          >
            {{ cd }}
            <button
              type="button"
              class="bi-ag-chip-remove"
              :disabled="loading"
              :title="'Remover ' + cd"
              :aria-label="'Remover ' + cd"
              @click="removeCompareCd(idx)"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </span>
          <span
            v-if="compareCdsSelected.length === 0"
            class="bi-ag-compare-chips-empty"
          >
            Nenhum armazém incluído ainda.
          </span>
        </div>
        <label class="bi-ag-filter-label bi-ag-filter-add-cd">
          <span>Incluir armazém</span>
          <select
            v-model="compareCdToAdd"
            class="bi-ag-select"
            :disabled="loading || compareCdsDisponiveis.length === 0"
            @change="onAddCompareCd"
          >
            <option value="">Escolher CD…</option>
            <option
              v-for="cd in compareCdsDisponiveis"
              :key="'add-' + cd"
              :value="cd"
            >
              {{ cd }}
            </option>
          </select>
        </label>
        <p class="bi-ag-compare-hint">
          Inclua <strong>dois ou mais</strong> armazéns (quantos quiser), na
          ordem das etiquetas. A lista vem do cadastro
          (<code>clients.storage</code>).
        </p>
        <div v-if="cdsLoadError" class="bi-ag-warn">
          <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
          Não foi possível carregar a lista de armazéns: {{ cdsLoadError }}.
          Verifique a conexão ou tente
          <button type="button" class="bi-ag-link-btn" @click="recarregarCds">
            atualizar a lista</button
          >.
        </div>
        <div v-else-if="cdsLoaded && cds.length === 0" class="bi-ag-warn">
          <i class="fas fa-info-circle" aria-hidden="true"></i>
          Nenhuma sigla encontrada em <code>clients.storage</code>. Cadastre o
          campo <strong>storage</strong> nos clientes do check-in para o filtro
          aparecer aqui.
        </div>
        <div
          v-else-if="cds.length > 0 && compareCdsSelectedUniqueCount < 2"
          class="bi-ag-info"
        >
          <i class="fas fa-hand-point-up" aria-hidden="true"></i>
          Selecione <strong>no mínimo dois</strong> armazéns em
          <strong>Incluir armazém</strong> — o comparativo só é montado após
          essa escolha (é normal o gráfico ficar vazio até lá).
        </div>
      </div>
    </div>

    <div
      v-if="isPainelForcedCompareAll && cdsLoaded"
      class="bi-ag-forced-compare-notes"
    >
      <p
        v-if="cds.length >= 2 && !cdsLoadError"
        class="bi-ag-painel-compare-banner"
      >
        <i class="fas fa-warehouse" aria-hidden="true"></i>
        Painel: comparando <strong>todos</strong> os armazéns ({{ cds.length }})
        — {{ cds.join(', ') }}
      </p>
      <div v-if="cdsLoadError" class="bi-ag-warn">
        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
        Não foi possível carregar a lista de armazéns: {{ cdsLoadError }}.
        Verifique a conexão ou tente
        <button type="button" class="bi-ag-link-btn" @click="recarregarCds">
          atualizar a lista</button
        >.
      </div>
      <div v-else-if="cds.length === 0" class="bi-ag-warn">
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        Nenhuma sigla em <code>clients.storage</code> — o comparativo do painel
        não tem CDs.
      </div>
      <div v-else-if="cds.length === 1" class="bi-ag-warn">
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        Só há um armazém cadastrado; o comparativo precisa de pelo menos
        <strong>dois</strong> CDs.
      </div>
    </div>

    <div v-if="error" class="bi-ag-error">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      {{ error }}
    </div>

    <!-- KPI: visão única -->
    <section
      v-if="!compareMode"
      class="bi-ag-kpi-grid"
      aria-label="Indicadores da janela"
    >
      <article
        v-for="card in kpiCardsSingle"
        :key="card.id"
        class="bi-ag-kpi-card"
        :class="{ 'bi-ag-kpi-card--destaque': card.destaque }"
      >
        <div class="bi-ag-kpi-head">
          <span class="bi-ag-kpi-titulo">{{ card.titulo }}</span>
        </div>
        <div class="bi-ag-kpi-valor">{{ card.valor }}</div>
      </article>
    </section>

    <!-- KPI: comparação lado a lado -->
    <section v-else class="bi-ag-kpi-compare" aria-label="Indicadores por CD">
      <div
        v-for="block in kpiCompareBlocks"
        :key="block.cd"
        class="bi-ag-kpi-compare-col"
      >
        <h3 class="bi-ag-kpi-compare-heading">
          <i class="fas fa-warehouse" aria-hidden="true"></i>
          {{ block.cd }}
        </h3>
        <div class="bi-ag-kpi-grid bi-ag-kpi-grid--compact">
          <article
            v-for="card in block.cards"
            :key="block.cd + '-' + card.id"
            class="bi-ag-kpi-card"
            :class="{ 'bi-ag-kpi-card--destaque': card.destaque }"
          >
            <div class="bi-ag-kpi-head">
              <span class="bi-ag-kpi-titulo">{{ card.titulo }}</span>
            </div>
            <div class="bi-ag-kpi-valor">{{ card.valor }}</div>
          </article>
        </div>
      </div>
    </section>

    <section class="bi-ag-chart-card">
      <div v-if="biAgShowInlineCompareLegend" class="bi-ag-chart-title-row">
        <h2 class="bi-ag-chart-title bi-ag-chart-title--inline">
          {{ chartTitulo }}
        </h2>
        <div class="bi-ag-inline-legend" aria-label="Legenda por armazém">
          <span
            v-for="cd in biAgInlineLegendCds"
            :key="'il-' + cd"
            class="bi-ag-inline-legend-group"
          >
            <span class="bi-ag-inline-legend-cd-name">{{ cd }}</span>
            <span class="bi-ag-inline-legend-swatches">
              <span
                class="bi-ag-il-swatch bi-ag-il-swatch--ag"
                aria-hidden="true"
                title="Agendado"
              />
              <span class="bi-ag-il-hint">Agendado</span>
              <span
                class="bi-ag-il-swatch bi-ag-il-swatch--sol"
                aria-hidden="true"
                title="Solicitado"
              />
              <span class="bi-ag-il-hint">Solicitado</span>
            </span>
          </span>
        </div>
      </div>
      <h2 v-else class="bi-ag-chart-title">{{ chartTitulo }}</h2>
      <div
        v-if="!loading && temDadosGrafico"
        class="bi-ag-chart-wrap"
        :class="{ 'bi-ag-chart-wrap--compare-tv': biAgShowInlineCompareLegend }"
      >
        <canvas ref="chartCanvas" style="cursor: pointer"></canvas>
      </div>
      <div v-else-if="!loading" class="bi-ag-chart-empty">
        <template v-if="compareMode && compareCdsSelectedUniqueCount < 2">
          Inclua pelo menos <strong>dois CDs</strong> na comparação para montar
          o gráfico.
        </template>
        <template v-else>Sem dados para exibir.</template>
      </div>
    </section>

    <teleport :to="detalheModalTeleportTarget">
      <div
        v-if="detalheModal.open"
        class="bi-ag-modal-overlay"
        @click.self="detalheModal.open = false"
      >
        <div class="bi-ag-modal-box" role="dialog" aria-modal="true">
          <div class="bi-ag-modal-head">
            <span class="bi-ag-modal-title">
              <i class="fas fa-calendar-day" aria-hidden="true"></i>
              {{ detalheModal.titulo }}
            </span>
            <button
              type="button"
              class="bi-ag-modal-close"
              @click="detalheModal.open = false"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div class="bi-ag-modal-body">
            <div v-if="detalheModal.loading" class="bi-ag-modal-loading">
              <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              Carregando…
            </div>
            <div
              v-else-if="detalheModal.estoques.length === 0"
              class="bi-ag-modal-empty"
            >
              Nenhum agendamento neste dia.
            </div>
            <template v-else>
              <p class="bi-ag-modal-detalhe-hint">
                Por cliente — mesmo recorte do gráfico: verde =
                <strong>Agendado</strong>, âmbar =
                <strong>Solicitado</strong>
                <span v-if="visaoMetrica === 'volumes'"> (volumes)</span>.
              </p>
              <ul class="bi-ag-estoque-list">
                <li
                  v-for="(e, idx) in detalheModal.estoques"
                  :key="(e.name || '') + '-' + idx"
                  class="bi-ag-estoque-item"
                >
                  <span class="bi-ag-estoque-name">{{ e.name }}</span>
                  <div
                    v-if="detalheRowTemStatus(e)"
                    class="bi-ag-estoque-counts"
                  >
                    <span
                      v-if="Number(e.agendado) > 0"
                      class="bi-ag-pill bi-ag-pill--ag"
                      :title="'Agendado — ' + visaoMetricaLabel"
                    >
                      {{ formatDetalheValorMetrica(e.agendado) }}
                    </span>
                    <span
                      v-if="Number(e.solicitado) > 0"
                      class="bi-ag-pill bi-ag-pill--sol"
                      :title="'Solicitado — ' + visaoMetricaLabel"
                    >
                      {{ formatDetalheValorMetrica(e.solicitado) }}
                    </span>
                    <span
                      v-if="
                        Number(e.agendado) === 0 &&
                        Number(e.solicitado) === 0 &&
                        Number(e.total) > 0
                      "
                      class="bi-ag-estoque-badge"
                    >
                      {{ formatDetalheValorMetrica(e.total) }}
                    </span>
                  </div>
                  <span v-else class="bi-ag-estoque-badge">{{
                    formatDetalheNumero(e.total)
                  }}</span>
                </li>
              </ul>
            </template>
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

function formatBarLabelValue(v, isVol) {
  const n = Number(v) || 0
  if (isVol && Math.abs(n - Math.round(n)) > 1e-6) {
    return n.toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    })
  }
  return Math.round(n).toLocaleString('pt-BR')
}

/** Valor formatado acima de cada coluna; modo empilhado = total uma vez no topo. */
const biAgBarValueLabelsPlugin = {
  id: 'biAgBarValueLabels',
  afterDatasetsDraw(chart) {
    const cfg = chart.options.plugins?.biAgBarValueLabels
    if (!cfg || cfg.display === false) return
    /** Só BI Agendamentos envia `mode`; evita ativar com `{}` vindo do merge do Chart.js em outras telas. */
    if (!('mode' in cfg)) return

    const { ctx, data } = chart
    const color = cfg.color ?? '#e5e7eb'
    const skipZero = cfg.skipZero !== false
    const offset = typeof cfg.offset === 'number' ? cfg.offset : 5
    const isVol = !!cfg.isVolumes
    const fontSize = typeof cfg.fontSize === 'number' ? cfg.fontSize : 11
    const fontWeight = cfg.fontWeight ?? 600

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = `${fontWeight} ${fontSize}px Poppins, system-ui, -apple-system, "Segoe UI", sans-serif`

    if (cfg.mode === 'stacked' && data.datasets.length > 0) {
      const labelCount = data.labels.length
      const stacks = [
        ...new Set(data.datasets.map(ds => String(ds.stack ?? 'default'))),
      ]
      for (const stack of stacks) {
        const diList = data.datasets
          .map((ds, i) => (String(ds.stack ?? 'default') === stack ? i : -1))
          .filter(i => i >= 0)
        if (!diList.length) continue
        const topDi = diList[diList.length - 1]
        const topMeta = chart.getDatasetMeta(topDi)
        if (!topMeta || !topMeta.data) continue
        for (let i = 0; i < labelCount; i++) {
          let sum = 0
          for (const di of diList) {
            sum += Number(data.datasets[di].data[i]) || 0
          }
          if (skipZero && sum === 0) continue
          const element = topMeta.data[i]
          if (!element) continue
          const text = formatBarLabelValue(sum, isVol)
          const { x, y } = element.getProps(['x', 'y'], true)
          ctx.fillStyle = color
          ctx.fillText(text, x, y - offset)
        }
      }
      ctx.restore()
      return
    }

    data.datasets.forEach((dataset, di) => {
      const meta = chart.getDatasetMeta(di)
      if (!meta || meta.hidden || !meta.data) return

      meta.data.forEach((element, i) => {
        const raw = dataset.data[i]
        const v = Number(raw)
        if (Number.isNaN(v)) return
        if (skipZero && v === 0) return

        const text = formatBarLabelValue(v, isVol)
        const { x, y } = element.getProps(['x', 'y'], true)
        ctx.fillStyle = color
        ctx.fillText(text, x, y - offset)
      })
    })

    ctx.restore()
  },
}

/** Rótulos do CD abaixo de cada pilha, acima da data (modo comparar armazéns). */
const biAgCompareCdLabelsPlugin = {
  id: 'biAgCompareCdLabels',
  afterDatasetsDraw(chart) {
    const cfg = chart.options.plugins?.biAgCompareCdLabels
    const cds = cfg?.cdsOrder
    if (!Array.isArray(cds) || !cds.length) return

    const { ctx, chartArea } = chart
    if (!chartArea) return

    const fs = typeof cfg.fontSize === 'number' ? cfg.fontSize : 10
    const fw = cfg.fontWeight ?? 600
    const color = cfg.color ?? '#9ca3af'
    const offsetY = typeof cfg.offsetY === 'number' ? cfg.offsetY : 5

    ctx.save()
    ctx.font = `${fw} ${fs}px Poppins, system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const nDays = chart.data.labels?.length ?? 0
    const nCd = cds.length

    for (let dayIdx = 0; dayIdx < nDays; dayIdx++) {
      for (let cdIdx = 0; cdIdx < nCd; cdIdx++) {
        const dsIdx = cdIdx * 2
        const meta = chart.getDatasetMeta(dsIdx)
        if (!meta || meta.hidden || !meta.data?.[dayIdx]) continue
        const el = meta.data[dayIdx]
        const { x } = el.getProps(['x'], true)
        if (x == null || Number.isNaN(Number(x))) continue
        ctx.fillText(String(cds[cdIdx]), x, chartArea.bottom + offsetY)
      }
    }
    ctx.restore()
  },
}

Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  biAgBarValueLabelsPlugin,
  biAgCompareCdLabelsPlugin
)

/** @typedef {{ dia: string, total: number, agendado: number, solicitado: number }} DiaTotal */

function normalizeGraphicLoadDay(raw) {
  if (!raw || !raw.dia) return null
  const total = Number(raw.total) || 0
  let ag = Number(raw.agendado)
  let so = Number(raw.solicitado)
  if (!Number.isFinite(ag) || !Number.isFinite(so)) {
    ag = total
    so = 0
  }
  if (ag === 0 && so === 0 && total > 0) {
    ag = total
    so = 0
  }
  const sum = ag + so
  if (total > 0 && sum > 0 && sum !== total) {
    ag = Math.round((total * ag) / sum)
    so = Math.max(0, total - ag)
  }
  return { dia: String(raw.dia), total, agendado: ag, solicitado: so }
}

/** Corpo JSON de GET /graphic-load: { data: DiaApi[] } */
function graphicLoadRowsFromApi(res) {
  if (!res || !Array.isArray(res.data)) return []
  return res.data
}

/**
 * @param {'notas'|'volumes'} por
 */
function kpiCardsFromDays(days, nDias, por) {
  const isVol = por === 'volumes'
  const n = Math.max(1, days.length || nDias || 1)
  const totalJanela = days.reduce((s, d) => s + (Number(d.total) || 0), 0)
  const media = totalJanela / n
  let best = days[0]
  if (days.length) {
    for (const d of days) {
      if (Number(d.total) > Number((best || d).total)) best = d
    }
  }
  const picoTotal = best ? Number(best.total) || 0 : 0
  let picoLabel = '—'
  if (best && best.dia) {
    const [y, m, day] = best.dia.split('-')
    picoLabel = `${day}/${m}/${y}`
  }
  const valorTotal = formatIntStatic(totalJanela)
  const valorPico =
    picoTotal > 0 ? `${formatIntStatic(picoTotal)} — ${picoLabel}` : '0'
  return {
    totalJanela,
    media,
    picoTotal,
    picoLabel,
    cards: [
      {
        id: 'total',
        titulo: isVol ? 'Total de volumes' : 'Total de notas',
        valor: valorTotal,
        destaque: true,
      },
      {
        id: 'media',
        titulo: isVol ? 'Média de volumes' : 'Média de notas',
        valor: formatDecimalStatic(media),
        destaque: false,
      },
      {
        id: 'pico',
        titulo: isVol ? 'Pico de volumes em um dia' : 'Pico de notas em um dia',
        valor: valorPico,
        destaque: false,
      },
    ],
  }
}

function formatIntStatic(x) {
  return Math.round(Number(x) || 0).toLocaleString('pt-BR')
}

function formatDecimalStatic(x) {
  return (Number(x) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export default {
  name: 'BIAgendamentosPage',

  emits: ['notification', 'page-ready'],

  props: {
    /** Quando o painel BI alterna faces em tela cheia (vídeo). */
    embedTvLayout: { type: Boolean, default: false },
    /**
     * Instância dedicada ao BI Painel: força visão geral ou comparativo com todos os CDs.
     * `null` = página autônoma (menu BI → Análise de Agendamentos).
     */
    painelEmbedVariant: {
      type: String,
      default: null,
      validator: v => v == null || v === 'normal' || v === 'compare-all',
    },
  },

  data() {
    return {
      loading: false,
      error: null,
      lastUpdated: null,
      chartInstance: null,
      /** @type {DiaTotal[]} série única (modo normal) */
      chartDays: [],
      /** @type {null | { series: { cd: string, data: DiaTotal[] }[] }} */
      compareSeries: null,
      periodoDias: 15,
      periodoOpcoes: [
        { val: 1, label: 'Somente hoje' },
        { val: 7, label: 'Próximos 7 dias' },
        { val: 15, label: 'Próximos 15 dias' },
        { val: 30, label: 'Próximos 30 dias' },
      ],
      compareMode: false,
      filterCD: '',
      /** Ordem dos CDs no modo comparativo (usuário monta a lista). */
      compareCdsSelected: [],
      compareCdToAdd: '',
      /** notas = COUNT(*); volumes = SUM(case_count) */
      visaoMetrica: 'notas',
      cds: [],
      cdsLoaded: false,
      cdsLoadError: null,
      detalheModal: {
        open: false,
        loading: false,
        titulo: '',
        estoques: [],
      },
      /** Document fullscreen ativo para esta página (ESC também atualiza o estado). */
      isFullscreen: false,
      /** Alinhado ao BI principal (`BIPage.vue`) — mesma chave em localStorage. */
      biTheme: (() => {
        try {
          return localStorage.getItem('bi-theme') || 'light'
        } catch {
          return 'light'
        }
      })(),
    }
  },

  watch: {
    biTheme() {
      this.$nextTick(() => this.rebuildChartForTheme())
    },
    /**
     * No painel, `embedTvLayout` costuma ficar false enquanto outra face está
     * ativa; o gráfico seria criado com fontes “desktop” e só `resize()` não
     * aplica as opções grandes — precisa recriar o Chart ao entrar em modo TV.
     */
    biAgTvLayout() {
      if (!this.embedTvLayout) this.teardownBiAgChartResizeObserver()
      this.$nextTick(() => {
        this.rebuildChartForTheme()
        if (this.embedTvLayout) {
          this.scheduleBiAgChartResize()
          this.setupBiAgChartResizeObserver()
        }
      })
    },
    cds: {
      handler() {
        if (this.isPainelForcedCompareAll) {
          this.compareMode = true
          const next = Array.isArray(this.cds) ? [...this.cds] : []
          const same =
            next.length === this.compareCdsSelected.length &&
            next.every((c, i) => c === this.compareCdsSelected[i])
          if (!same) this.compareCdsSelected = next
          return
        }
        if (!this.biAgShowMultiCdControls) {
          let changed = false
          if (this.compareMode) {
            this.compareMode = false
            this.compareCdsSelected = []
            this.compareCdToAdd = ''
            this.compareSeries = null
            changed = true
          }
          if (this.filterCD) {
            this.filterCD = ''
            changed = true
          }
          if (changed) this.fetchData()
        }
      },
    },
  },

  computed: {
    isPainelForcedNormal() {
      return this.painelEmbedVariant === 'normal'
    },
    isPainelForcedCompareAll() {
      return this.painelEmbedVariant === 'compare-all'
    },
    /** Mesma ideia do BI Diretoria: escala no painel em TV ou fullscreen local. */
    biAgTvLayout() {
      return this.isFullscreen || this.embedTvLayout
    },
    periodoDescricao() {
      const p = this.periodoOpcoes.find(o => o.val === this.periodoDias)
      return p ? p.label.toLowerCase() : `${this.periodoDias} dias`
    },

    visaoMetricaLabel() {
      return this.visaoMetrica === 'volumes' ? 'volumes' : 'notas'
    },

    /**
     * Em tela cheia, o modal deve ser filho do mesmo elemento que está em
     * fullscreen; se permanecer em `body`, some por trás da camada nativa.
     */
    detalheModalTeleportTarget() {
      return this.biAgTvLayout ? '#bi-agendamentos-page-root' : 'body'
    },

    chartTitulo() {
      if (this.compareMode) {
        return this.visaoMetrica === 'volumes'
          ? 'Comparativo de volumes por dia'
          : 'Comparativo de notas por dia'
      }
      return this.visaoMetrica === 'volumes'
        ? 'Volumes a receber por dia'
        : 'Notas agendadas por dia'
    },

    /** Legenda ao lado do título (modo TV) — libera altura para barras maiores no canvas. */
    biAgShowInlineCompareLegend() {
      const s = this.compareSeries && this.compareSeries.series
      return !!(
        this.compareMode &&
        this.biAgTvLayout &&
        Array.isArray(s) &&
        s.length >= 2
      )
    },

    biAgInlineLegendCds() {
      const s = this.compareSeries && this.compareSeries.series
      if (!this.compareMode || !this.biAgTvLayout || !Array.isArray(s))
        return []
      return s.map(x => x.cd)
    },

    lastUpdatedDisplay() {
      if (!this.lastUpdated) return null
      try {
        return new Date(this.lastUpdated).toLocaleString('pt-BR')
      } catch {
        return this.lastUpdated
      }
    },

    compareCdsUniqueList() {
      return [
        ...new Set(
          this.compareCdsSelected.map(c => String(c).trim()).filter(Boolean)
        ),
      ]
    },

    compareCdsSelectedUniqueCount() {
      return this.compareCdsUniqueList.length
    },

    /** CDs ainda não incluídos na comparação */
    compareCdsDisponiveis() {
      return this.cds.filter(c => !this.compareCdsSelected.includes(c))
    },

    /** Comparar / filtro por CD só faz sentido com 2+ armazéns liberados ao usuário. */
    biAgShowMultiCdControls() {
      return Array.isArray(this.cds) && this.cds.length >= 2
    },

    temDadosGrafico() {
      if (this.compareMode) {
        const u = this.compareCdsSelectedUniqueCount
        return !!(
          u >= 2 &&
          this.compareSeries &&
          Array.isArray(this.compareSeries.series) &&
          this.compareSeries.series.length >= 2 &&
          this.compareSeries.series[0].data &&
          this.compareSeries.series[0].data.length > 0
        )
      }
      return this.chartDays.length > 0
    },

    kpiCardsSingle() {
      return kpiCardsFromDays(
        this.chartDays,
        this.periodoDias,
        this.visaoMetrica
      ).cards
    },

    kpiCompareBlocks() {
      if (!this.compareSeries || !this.compareSeries.series) return []
      const n = this.periodoDias
      const por = this.visaoMetrica
      return this.compareSeries.series.map(s => ({
        cd: s.cd,
        cards: kpiCardsFromDays(s.data || [], n, por).cards,
      }))
    },
  },

  async mounted() {
    this._biAgFsHandler = () => this.onFullscreenChange()
    document.addEventListener('fullscreenchange', this._biAgFsHandler)
    await this.loadCDs()
    this.applyPainelEmbedVariantState()
    await this.fetchData()
    this.$nextTick(() => this.$emit('page-ready'))
  },

  activated() {
    this.$nextTick(() => this.$emit('page-ready'))
  },

  beforeUnmount() {
    this.teardownBiAgChartResizeObserver()
    if (this._biAgFsHandler) {
      document.removeEventListener('fullscreenchange', this._biAgFsHandler)
    }
    this.destroyChart()
  },

  methods: {
    applyPainelEmbedVariantState() {
      if (this.isPainelForcedNormal) {
        this.compareMode = false
        this.filterCD = ''
        this.compareCdsSelected = []
        this.compareCdToAdd = ''
        this.compareSeries = null
        return
      }
      if (this.isPainelForcedCompareAll) {
        this.compareMode = true
        this.filterCD = ''
        this.compareCdToAdd = ''
        this.compareCdsSelected = Array.isArray(this.cds) ? [...this.cds] : []
      }
    },
    async toggleCompareMode() {
      if (this.isPainelForcedNormal || this.isPainelForcedCompareAll) return
      if (!this.biAgShowMultiCdControls) return
      this.compareMode = !this.compareMode
      this.error = null
      if (this.compareMode) {
        this.filterCD = ''
        this.compareCdsSelected = []
        this.compareCdToAdd = ''
        if (!this.cds.length) await this.loadCDs()
      } else {
        this.compareCdsSelected = []
        this.compareCdToAdd = ''
        this.compareSeries = null
      }
      await this.fetchData()
    },

    async recarregarCds() {
      await this.loadCDs()
      if (this.compareMode) await this.fetchData()
    },

    onAddCompareCd() {
      if (this.isPainelForcedCompareAll) return
      const v = (this.compareCdToAdd || '').trim()
      this.compareCdToAdd = ''
      if (!v) return
      if (!this.compareCdsSelected.includes(v)) {
        this.compareCdsSelected.push(v)
        this.fetchData()
      }
    },

    removeCompareCd(idx) {
      if (this.isPainelForcedCompareAll) return
      this.compareCdsSelected.splice(idx, 1)
      this.fetchData()
    },

    async loadCDs() {
      this.cdsLoadError = null
      try {
        const data = await apiService.get('/agendamentos/cds')
        this.cds = Array.isArray(data) ? data : []
        if (!Array.isArray(data)) {
          console.warn(
            '[BI-agendamentos] /agendamentos/cds não retornou array',
            data
          )
        }
      } catch (e) {
        this.cds = []
        this.cdsLoadError = e.message || 'falha na requisição'
        console.warn('[BI-agendamentos] loadCDs:', e.message)
      } finally {
        this.cdsLoaded = true
      }
    },

    async fetchData() {
      this.loading = true
      this.error = null
      this.destroyChart()

      const dias = this.periodoDias

      try {
        if (this.isPainelForcedNormal) {
          this.compareMode = false
          this.compareCdsSelected = []
          this.compareSeries = null
          this.compareCdToAdd = ''
          this.filterCD = ''
        } else if (this.isPainelForcedCompareAll) {
          this.compareMode = true
          this.filterCD = ''
          if (Array.isArray(this.cds) && this.cds.length >= 2) {
            const next = [...this.cds]
            const same =
              next.length === this.compareCdsSelected.length &&
              next.every((c, i) => c === this.compareCdsSelected[i])
            if (!same) this.compareCdsSelected = next
          }
        }
        if (this.compareMode && !this.biAgShowMultiCdControls) {
          this.compareMode = false
          this.compareCdsSelected = []
          this.compareCdToAdd = ''
          this.compareSeries = null
        }
        if (this.compareMode) {
          const lista = [
            ...new Set(
              this.compareCdsSelected.map(c => String(c).trim()).filter(Boolean)
            ),
          ]
          if (lista.length < 2) {
            this.compareSeries = null
            this.chartDays = []
            this.lastUpdated = null
            this.loading = false
            return
          }

          const por = this.visaoMetrica
          const responses = await Promise.all(
            lista.map(cd => apiService.get('/graphic-load', { cd, dias, por }))
          )

          this.compareSeries = {
            series: lista.map((cd, i) => ({
              cd,
              data: graphicLoadRowsFromApi(responses[i])
                .map(normalizeGraphicLoadDay)
                .filter(Boolean),
            })),
          }
          this.chartDays = []
          let maxTs = ''
          for (const r of responses) {
            const t = r.lastUpdated || ''
            if (t > maxTs) maxTs = t
          }
          this.lastUpdated = maxTs || null

          this.loading = false
          await this.$nextTick()
          const first = this.compareSeries.series[0]
          if (first && first.data.length) {
            this.renderChartCompareMulti(this.compareSeries.series)
          }
        } else {
          this.compareSeries = null
          const params = { dias, por: this.visaoMetrica }
          if (this.filterCD) params.cd = this.filterCD

          const res = await apiService.get('/graphic-load', params)
          const days = graphicLoadRowsFromApi(res)
            .map(normalizeGraphicLoadDay)
            .filter(Boolean)
          this.lastUpdated = res.lastUpdated || null
          this.chartDays = days
          this.loading = false
          await this.$nextTick()
          if (days.length) this.renderChartSingle(days)
        }
      } catch (e) {
        const msg =
          e.message ||
          (e.response && e.response.data && e.response.data.error) ||
          'Erro desconhecido'
        this.error = `Não foi possível carregar os dados: ${msg}`
        this.$emit('notification', { message: this.error, type: 'error' })
        this.loading = false
      }
    },

    metricaTooltipLine(raw) {
      const n = Number(raw) || 0
      const s = n.toLocaleString('pt-BR')
      if (this.visaoMetrica === 'volumes')
        return ` ${s} volume${n !== 1 ? 's' : ''}`
      return ` ${s} nota${n !== 1 ? 's' : ''}`
    },

    chartThemeColors() {
      const light = this.biTheme === 'light'
      return {
        tick: light ? '#5a6c7d' : '#9ca3af',
        legend: light ? '#374151' : '#d1d5db',
        barLabel: light ? '#374151' : '#e8eaed',
      }
    },

    formatDetalheNumero(v) {
      const x = Math.round(Number(v) || 0)
      return x.toLocaleString('pt-BR')
    },

    detalheRowTemStatus(e) {
      return (
        e && typeof e.agendado === 'number' && typeof e.solicitado === 'number'
      )
    },

    formatDetalheValorMetrica(n) {
      const x = Number(n) || 0
      if (
        this.visaoMetrica === 'volumes' &&
        Math.abs(x - Math.round(x)) > 1e-6
      ) {
        return x.toLocaleString('pt-BR', {
          maximumFractionDigits: 1,
          minimumFractionDigits: 0,
        })
      }
      return Math.round(x).toLocaleString('pt-BR')
    },

    /** @param {DiaTotal[]} days */
    renderChartSingle(days) {
      const ctx = this.$refs.chartCanvas
      if (!ctx) return

      const vm = this
      const labels = days.map(d => this.formatLabel(d.dia))

      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const tc = this.chartThemeColors()
      const cdPrefix = vm.filterCD ? `${vm.filterCD} — ` : ''
      const agData = days.map(d => Number(d.agendado) || 0)
      const soData = days.map(d => Number(d.solicitado) || 0)

      const agBgToday = 'rgba(0, 255, 170, 0.82)'
      const agBgOther = 'rgba(0, 255, 170, 0.32)'
      const agBdToday = 'rgba(0, 255, 170, 1)'
      const agBdOther = 'rgba(0, 255, 170, 0.55)'

      const soBgToday = 'rgba(250, 204, 21, 0.92)'
      const soBgOther = 'rgba(245, 180, 32, 0.78)'
      const soBdToday = 'rgba(217, 119, 6, 1)'
      const soBdOther = 'rgba(217, 119, 6, 0.72)'

      const agBg = days.map(d => (d.dia === todayStr ? agBgToday : agBgOther))
      const agBd = days.map(d => (d.dia === todayStr ? agBdToday : agBdOther))
      const soBg = days.map(d => (d.dia === todayStr ? soBgToday : soBgOther))
      const soBd = days.map(d => (d.dia === todayStr ? soBdToday : soBdOther))

      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: `${cdPrefix}Agendado`,
              data: agData,
              backgroundColor: agBg,
              borderColor: agBd,
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false,
              stack: 'totais',
            },
            {
              label: `${cdPrefix}Solicitado`,
              data: soData,
              backgroundColor: soBg,
              borderColor: soBd,
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false,
              stack: 'totais',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: vm.biAgTvLayout ? 110 : 30,
              bottom: vm.biAgTvLayout ? 72 : 22,
              left: 4,
              right: 4,
            },
          },
          plugins: {
            legend: {
              display: true,
              labels: {
                color: tc.legend,
                boxWidth: vm.biAgTvLayout ? 16 : 12,
                padding: vm.biAgTvLayout ? 18 : 10,
                font: { size: vm.biAgTvLayout ? 22 : 12 },
              },
            },
            biAgBarValueLabels: {
              mode: 'stacked',
              color: tc.barLabel,
              skipZero: true,
              isVolumes: vm.visaoMetrica === 'volumes',
              fontSize: vm.biAgTvLayout ? 40 : 11,
              fontWeight: vm.biAgTvLayout ? 700 : 600,
              offset: vm.biAgTvLayout ? 11 : 5,
            },
            tooltip: {
              callbacks: {
                title: items => {
                  const idx = items[0].dataIndex
                  return vm.formatTooltipTitle(days[idx].dia)
                },
                label: item => {
                  const v = Number(item.raw) || 0
                  if (v === 0) return null
                  const piece = vm.metricaTooltipLine(item.raw).trim()
                  return ` ${item.dataset.label}: ${piece}`
                },
                footer: items => {
                  if (!items.length) return ''
                  const idx = items[0].dataIndex
                  const raw = Number(days[idx]?.total) || 0
                  return `Total do dia${vm.metricaTooltipLine(raw)}`
                },
              },
            },
          },
          onClick: (event, elements) => {
            if (!elements.length) return
            const idx = elements[0].index
            const dia = days[idx]?.dia
            if (dia) vm.openDetalhe(dia, vm.filterCD || null)
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                font: { size: vm.biAgTvLayout ? 35 : 12 },
                color: tc.tick,
                padding: vm.biAgTvLayout ? 10 : 6,
              },
            },
            y: {
              stacked: true,
              display: false,
              beginAtZero: true,
              grace: vm.biAgTvLayout ? '20%' : '12%',
            },
          },
        },
      })
      this.scheduleBiAgChartResize()
      this.setupBiAgChartResizeObserver()
    },

    /**
     * @param {{ cd: string, data: DiaTotal[] }[]} seriesList
     */
    renderChartCompareMulti(seriesList) {
      const ctx = this.$refs.chartCanvas
      if (!ctx || !seriesList.length || !seriesList[0].data.length) return

      const vm = this
      const baseDays = seriesList[0].data
      const labels = baseDays.map(d => this.formatLabel(d.dia))
      const diasRefs = baseDays.map(d => d.dia)

      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const tc = this.chartThemeColors()

      const agBgToday = 'rgba(0, 255, 170, 0.82)'
      const agBgOther = 'rgba(0, 255, 170, 0.32)'
      const agBdToday = 'rgba(0, 255, 170, 1)'
      const agBdOther = 'rgba(0, 255, 170, 0.55)'

      const soBgToday = 'rgba(250, 204, 21, 0.92)'
      const soBgOther = 'rgba(245, 180, 32, 0.78)'
      const soBdToday = 'rgba(217, 119, 6, 1)'
      const soBdOther = 'rgba(217, 119, 6, 0.72)'

      const cdsOrder = seriesList.map(s => s.cd)

      const datasets = []
      seriesList.forEach(s => {
        const stackId = `st-${s.cd}`
        const mapA = Object.fromEntries(
          (s.data || []).map(d => [d.dia, Number(d.agendado) || 0])
        )
        const mapS = Object.fromEntries(
          (s.data || []).map(d => [d.dia, Number(d.solicitado) || 0])
        )
        const agData = baseDays.map(d => mapA[d.dia] ?? 0)
        const soData = baseDays.map(d => mapS[d.dia] ?? 0)
        const agBg = baseDays.map(d =>
          d.dia === todayStr ? agBgToday : agBgOther
        )
        const agBd = baseDays.map(d =>
          d.dia === todayStr ? agBdToday : agBdOther
        )
        const soBg = baseDays.map(d =>
          d.dia === todayStr ? soBgToday : soBgOther
        )
        const soBd = baseDays.map(d =>
          d.dia === todayStr ? soBdToday : soBdOther
        )
        datasets.push(
          {
            label: `${s.cd} — Agendado`,
            data: agData,
            backgroundColor: agBg,
            borderColor: agBd,
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
            stack: stackId,
          },
          {
            label: `${s.cd} — Solicitado`,
            data: soData,
            backgroundColor: soBg,
            borderColor: soBd,
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
            stack: stackId,
          }
        )
      })

      const manyCds = seriesList.length > 4
      /** Espaço extra para CD + data (só modo não-TV; em TV o bottom é fixo para não duplicar reserva). */
      const padNonTvCdRow = manyCds ? 28 : 24
      const bottomPadTv = manyCds ? 52 : 44
      const dateBelowCdPad = vm.biAgTvLayout
        ? manyCds
          ? 12
          : 10
        : manyCds
          ? 18
          : 14
      const hideBuiltInLegend = vm.biAgTvLayout

      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: vm.biAgTvLayout
                ? seriesList.length > 4
                  ? 36
                  : 32
                : seriesList.length > 4
                  ? 34
                  : 30,
              bottom: vm.biAgTvLayout
                ? bottomPadTv
                : (seriesList.length > 4 ? 28 : 20) + padNonTvCdRow,
              left: 4,
              right: 4,
            },
          },
          plugins: {
            biAgCompareCdLabels: {
              cdsOrder,
              color: tc.tick,
              fontSize: vm.biAgTvLayout ? (manyCds ? 18 : 20) : manyCds ? 8 : 9,
              fontWeight: vm.biAgTvLayout ? 650 : 600,
              offsetY: vm.biAgTvLayout ? (manyCds ? 4 : 5) : manyCds ? 4 : 5,
            },
            legend: {
              display: !hideBuiltInLegend,
              labels: {
                color: tc.legend,
                boxWidth: vm.biAgTvLayout ? 16 : 12,
                padding: vm.biAgTvLayout ? 18 : 10,
                font: { size: vm.biAgTvLayout ? 20 : 12 },
              },
            },
            biAgBarValueLabels: {
              mode: 'stacked',
              color: tc.barLabel,
              skipZero: true,
              isVolumes: vm.visaoMetrica === 'volumes',
              fontSize: vm.biAgTvLayout ? 39 : 11,
              fontWeight: vm.biAgTvLayout ? 700 : 600,
              offset: vm.biAgTvLayout
                ? seriesList.length > 4
                  ? 9
                  : 11
                : seriesList.length > 4
                  ? 3
                  : 5,
            },
            tooltip: {
              callbacks: {
                title: items => {
                  const idx = items[0].dataIndex
                  return vm.formatTooltipTitle(diasRefs[idx])
                },
                label: item => {
                  const v = Number(item.raw) || 0
                  if (v === 0) return null
                  const piece = vm.metricaTooltipLine(item.raw).trim()
                  return ` ${item.dataset.label}: ${piece}`
                },
              },
            },
          },
          onClick: (event, elements) => {
            if (!elements.length) return
            const el = elements[0]
            const dayIdx = el.index
            const cdIdx = Math.floor(el.datasetIndex / 2)
            const dia = diasRefs[dayIdx]
            const cd = cdsOrder[cdIdx]
            if (dia && cd) vm.openDetalhe(dia, cd)
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                font: {
                  size: vm.biAgTvLayout
                    ? seriesList.length > 4
                      ? 33
                      : 35
                    : seriesList.length > 4
                      ? 10
                      : 11,
                },
                color: tc.tick,
                maxRotation: 45,
                padding: 6 + dateBelowCdPad,
              },
            },
            y: {
              stacked: true,
              display: false,
              beginAtZero: true,
              grace: vm.biAgTvLayout ? '10%' : '12%',
            },
          },
        },
      })
      this.scheduleBiAgChartResize()
      this.setupBiAgChartResizeObserver()
    },

    /** Após mudar embed/tamanho do painel, o Chart.js precisa recalcular o canvas. */
    scheduleBiAgChartResize() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (
              this.chartInstance &&
              typeof this.chartInstance.resize === 'function'
            ) {
              this.chartInstance.resize()
            }
          })
        })
      })
    },

    setupBiAgChartResizeObserver() {
      if (typeof ResizeObserver === 'undefined') return
      this.teardownBiAgChartResizeObserver()
      if (!this.embedTvLayout) return
      const root = this.$refs.pageRoot
      if (!(root instanceof Element)) return
      const wrap = root.querySelector('.bi-ag-chart-wrap')
      if (!wrap) return
      this._biAgChartRo = new ResizeObserver(() => {
        this.scheduleBiAgChartResize()
      })
      this._biAgChartRo.observe(wrap)
      this._biAgChartRoTarget = wrap
    },

    teardownBiAgChartResizeObserver() {
      if (this._biAgChartRo && this._biAgChartRoTarget) {
        try {
          this._biAgChartRo.unobserve(this._biAgChartRoTarget)
        } catch (_) {
          /* ignore */
        }
      }
      if (this._biAgChartRo) {
        try {
          this._biAgChartRo.disconnect()
        } catch (_) {
          /* ignore */
        }
      }
      this._biAgChartRo = null
      this._biAgChartRoTarget = null
    },

    /**
     * @param {string} dia
     * @param {string | null} cd - filtro storage no detalhe (opcional)
     */
    async openDetalhe(dia, cd = null) {
      const [yyyy, mm, dd] = dia.split('-')
      const cdPart = cd ? ` — ${cd}` : ''
      this.detalheModal.titulo = `${dd}/${mm}/${yyyy}${cdPart}`
      this.detalheModal.estoques = []
      this.detalheModal.loading = true
      this.detalheModal.open = true

      try {
        const params = { dia, por: this.visaoMetrica }
        if (cd) params.cd = cd
        const res = await apiService.get('/graphic-load/detalhe', params)
        this.detalheModal.estoques = res.estoques || []
      } catch (e) {
        console.warn('[BI-agendamentos] detalhe:', e.message)
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

    formatLabel(isoDate) {
      const [yyyy, mm, dd] = isoDate.split('-')
      const today = new Date()
      if (
        parseInt(dd, 10) === today.getDate() &&
        parseInt(mm, 10) === today.getMonth() + 1 &&
        parseInt(yyyy, 10) === today.getFullYear()
      ) {
        return 'Hoje'
      }
      return `${dd}/${mm}`
    },

    formatTooltipTitle(isoDate) {
      const [yyyy, mm, dd] = isoDate.split('-')
      return `${dd}/${mm}/${yyyy}`
    },

    biFullscreenRootEl() {
      const r = this.$refs.pageRoot
      if (r instanceof Element) return r
      return this.$el instanceof Element ? this.$el : null
    },

    isOurFullscreenElement(fs, root) {
      return !!(fs && root && (fs === root || root.contains(fs)))
    },

    async toggleFullscreen() {
      if (this.embedTvLayout) return
      const el = this.biFullscreenRootEl()
      if (!el) return
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (e) {
        console.warn('[BI-agendamentos] Fullscreen:', e?.message || e)
      }
    },

    onFullscreenChange() {
      const fs = document.fullscreenElement
      const root = this.biFullscreenRootEl()
      this.isFullscreen = this.isOurFullscreenElement(fs, root)
      this.$nextTick(() => {
        if (
          this.chartInstance &&
          typeof this.chartInstance.resize === 'function'
        ) {
          this.chartInstance.resize()
        }
      })
    },

    toggleBiTheme() {
      this.biTheme = this.biTheme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('bi-theme', this.biTheme)
      } catch (_) {}
    },

    rebuildChartForTheme() {
      if (this.loading) return
      if (!this.temDadosGrafico) return
      this.destroyChart()
      this.$nextTick(() => {
        if (this.compareMode) {
          const s = this.compareSeries && this.compareSeries.series
          if (s && s.length >= 2 && s[0] && s[0].data && s[0].data.length) {
            this.renderChartCompareMulti(s)
          }
        } else if (this.chartDays.length) {
          this.renderChartSingle(this.chartDays)
        }
      })
    },
  },
}
</script>

<style scoped>
/* Shell alinhado ao BI (BIPage.vue — tema escuro) */
.bi-page.bi-agendamentos-page {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: min(100%, calc(100vh - 88px));
  background: #202326;
  color: #ffffff;
  padding: 1.5rem;
  box-sizing: border-box;
}

.bi-ag-forced-compare-notes {
  margin-bottom: 1rem;
}

.bi-ag-painel-compare-banner {
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.9rem;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bi-ag-painel-compare-banner i {
  color: #00ffaa;
  flex-shrink: 0;
}

/* Painel: fullscreen no ancestral — mesmo fluxo que :fullscreen (scroll + coluna flexível). */
.bi-page.bi-agendamentos-page.bi-ag--embed-tv {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  box-sizing: border-box;
}

.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-header,
.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-toolbar,
.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-forced-compare-notes,
.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-error {
  flex-shrink: 0;
}

.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-kpi-grid,
.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-kpi-compare {
  flex-shrink: 0;
}

.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-chart-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* .bi-ag-chart-wrap em embed: mesmas medidas que em :fullscreen (ver bloco bi-ag-tv-scale). */

.bi-page.bi-agendamentos-page.bi-ag--embed-tv .bi-ag-chart-empty {
  flex: 1 1 auto;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modo tela cheia: layout quando o próprio `.bi-page` está em fullscreen */
.bi-page.bi-agendamentos-page:fullscreen {
  min-height: 100vh;
  height: 100vh;
  max-height: 100vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.bi-page.bi-agendamentos-page:-webkit-full-screen {
  min-height: 100vh;
  height: 100vh;
  max-height: 100vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.bi-page.bi-agendamentos-page:fullscreen .bi-ag-chart-card,
.bi-page.bi-agendamentos-page:-webkit-full-screen .bi-ag-chart-card {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.bi-page.bi-agendamentos-page:fullscreen .bi-ag-chart-wrap,
.bi-page.bi-agendamentos-page:-webkit-full-screen .bi-ag-chart-wrap {
  flex: 1 1 auto;
  min-height: 300px;
  height: auto;
  overflow: visible;
  padding-bottom: 0.75rem;
}

.bi-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(32, 35, 38, 0.92);
  border-radius: 12px;
}

.bi-loading-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 3rem;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 12px;
}

.bi-loading-icon {
  font-size: 2.5rem;
  color: #00ffaa;
}

.bi-loading-message {
  margin: 0;
  font-size: 1rem;
  color: #e0e0e0;
  text-align: center;
  max-width: 360px;
}

.bi-ag-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.bi-ag-title {
  margin: 0 0 0.4rem;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bi-ag-title i {
  color: #00ffaa;
}

.bi-ag-subtitle {
  margin: 0;
  font-size: 1.06rem;
  color: #d8dce4;
  max-width: 56rem;
  line-height: 1.52;
}

.bi-ag-footnote {
  display: block;
  margin-top: 0.4rem;
  color: #b8c2d0;
  font-size: 0.98rem;
  line-height: 1.45;
}

.bi-ag-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bi-ag-updated {
  font-size: 0.92rem;
  color: #b0b8c4;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.bi-ag-btn-refresh {
  background: #2d3136;
  border: 1px solid #56595e;
  color: #e0e0e0;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.bi-ag-btn-refresh:hover:not(:disabled) {
  background: #3a3f46;
}

.bi-ag-btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bi-ag-toolbar {
  margin-bottom: 1.25rem;
}

.bi-ag-toolbar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 1.1rem 1.35rem;
  align-items: end;
}

.bi-ag-compare-panel {
  grid-column: 1 / -1;
  background: rgba(39, 42, 47, 0.55);
  border: 1px solid #3d4148;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bi-ag-compare-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.bi-ag-compare-panel-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #e2e5eb;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.bi-ag-compare-count {
  font-size: 0.9rem;
  color: #b0b8c4;
}

.bi-ag-compare-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2rem;
  align-items: center;
}

.bi-ag-compare-chips-empty {
  font-size: 0.94rem;
  color: #9ca3af;
  font-style: italic;
}

.bi-ag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #2d3136;
  border: 1px solid #56595e;
  color: #e5e7eb;
  padding: 0.25rem 0.45rem 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.94rem;
  font-weight: 600;
}

.bi-ag-chip-remove {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.2rem 0.35rem;
  line-height: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.bi-ag-chip-remove:hover:not(:disabled) {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.15);
}

.bi-ag-filter-add-cd {
  max-width: 280px;
}

.bi-ag-compare-hint {
  margin: 0;
  font-size: 0.94rem;
  color: #b8c2d0;
  line-height: 1.45;
}

.bi-ag-filter-label {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  font-size: 0.96rem;
  color: #dde1e9;
  font-weight: 500;
}

.bi-ag-toggle-wrap {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.bi-ag-toggle-label {
  flex: 1;
  min-width: 180px;
}

.bi-ag-toggle {
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid #56595e;
  background: #1a1d21;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.bi-ag-toggle--on {
  background: rgba(0, 255, 170, 0.25);
  border-color: rgba(0, 255, 170, 0.55);
}

.bi-ag-toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8b919a;
  transition:
    transform 0.2s,
    background 0.2s;
}

.bi-ag-toggle--on .bi-ag-toggle-knob {
  transform: translateX(22px);
  background: #00ffaa;
}

.bi-ag-select {
  background: #2d3136;
  border: 1px solid #56595e;
  color: #fff;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 1.06rem;
  line-height: 1.35;
  min-height: 2.75rem;
}

.bi-ag-error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.bi-ag-warn {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: #fde68a;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.45;
}

.bi-ag-warn i {
  margin-right: 0.35rem;
  opacity: 0.9;
}

.bi-ag-info {
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.35);
  color: #bfdbfe;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.45;
}

.bi-ag-info i {
  margin-right: 0.35rem;
  opacity: 0.9;
}

.bi-ag-link-btn {
  background: none;
  border: none;
  color: #93c5fd;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font: inherit;
}

.bi-ag-link-btn:hover {
  color: #dbeafe;
}

.bi-ag-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.bi-ag-kpi-grid--compact {
  grid-template-columns: 1fr;
  gap: 0.65rem;
  margin-bottom: 0;
}

@media (max-width: 900px) {
  .bi-ag-kpi-grid:not(.bi-ag-kpi-grid--compact) {
    grid-template-columns: 1fr;
  }
}

/* auto-fit (não auto-fill): evita “colunas fantasmas” que encolhem os cards */
.bi-ag-kpi-compare {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  align-items: stretch;
}

.bi-ag-kpi-compare-col {
  background: rgba(39, 42, 47, 0.45);
  border: 1px solid #3d4148;
  border-radius: 12px;
  padding: 1.15rem 1.35rem 1.25rem;
  min-width: 0;
}

.bi-ag-kpi-compare-col .bi-ag-kpi-grid--compact {
  gap: 0.85rem;
}

.bi-ag-kpi-compare-col .bi-ag-kpi-card {
  padding: 1rem 1.15rem;
}

.bi-ag-kpi-compare-col .bi-ag-kpi-valor {
  font-size: clamp(1.45rem, 2.4vw, 1.95rem);
}

.bi-ag-kpi-compare-col .bi-ag-kpi-titulo {
  font-size: 0.92rem;
}

.bi-ag-kpi-compare-heading {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.bi-ag-kpi-compare-heading i {
  color: #00ffaa;
}

.bi-ag-kpi-card {
  background: linear-gradient(145deg, #2a2d32 0%, #24272b 100%);
  border: 1px solid #3d4148;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.bi-ag-kpi-grid--compact .bi-ag-kpi-card {
  padding: 0.75rem 0.9rem;
}

.bi-ag-kpi-grid--compact .bi-ag-kpi-valor {
  font-size: 1.35rem;
}

.bi-ag-kpi-card--destaque {
  border-color: rgba(0, 255, 170, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 255, 170, 0.12);
}

.bi-ag-kpi-head {
  margin-bottom: 0.6rem;
}

.bi-ag-kpi-titulo {
  font-size: 0.92rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #c8cdd5;
  line-height: 1.35;
}

.bi-ag-kpi-valor {
  font-size: 1.65rem;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.bi-ag-kpi-card--destaque .bi-ag-kpi-valor {
  color: #5fffc4;
}

.bi-ag-chart-card {
  background: #272a2f;
  border: 1px solid #3d4148;
  border-radius: 12px;
  padding: 1.15rem 1.25rem 1.35rem;
  overflow: visible;
}

.bi-ag-chart-title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.bi-ag-chart-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  margin-bottom: clamp(0.85rem, 2vh, 1.5rem);
}

.bi-ag-chart-title--inline {
  margin-bottom: 0;
}

.bi-ag-inline-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem 0.85rem;
  flex: 1 1 220px;
  min-width: 0;
}

.bi-ag-inline-legend-group {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem 0.35rem;
}

.bi-ag-inline-legend-cd-name {
  font-weight: 700;
  color: #5fffc4;
  margin-right: 0.15rem;
}

.bi-ag-inline-legend-swatches {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.bi-ag-il-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.bi-ag-il-swatch--ag {
  background: rgba(0, 255, 170, 0.45);
  border: 1px solid rgba(0, 255, 170, 0.95);
}

.bi-ag-il-swatch--sol {
  background: rgba(250, 204, 21, 0.82);
  border: 1px solid rgba(217, 119, 6, 0.95);
}

.bi-ag-il-hint {
  font-size: 0.78rem;
  color: #9ca3af;
}

.bi-ag-chart-wrap {
  height: min(420px, 48vh);
  min-height: 220px;
  position: relative;
  overflow: visible;
  padding-bottom: 0.35rem;
}

.bi-ag-chart-empty {
  color: #8b919a;
  font-size: 0.9rem;
  padding: 2rem;
  text-align: center;
}

/* Modal detalhe */
.bi-ag-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.bi-ag-modal-box {
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 12px;
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.bi-ag-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #3d4148;
}

.bi-ag-modal-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bi-ag-modal-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem;
}

.bi-ag-modal-close:hover {
  color: #fff;
}

.bi-ag-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.75rem 1rem 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.bi-ag-modal-loading,
.bi-ag-modal-empty {
  color: #9ca3af;
  text-align: center;
  padding: 1.5rem;
}

.bi-ag-modal-detalhe-hint {
  margin: 0 0 0.65rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: #9ca3af;
}

.bi-ag-estoque-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.bi-ag-estoque-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid #3d4148;
}

.bi-ag-estoque-item:last-child {
  border-bottom: none;
}

.bi-ag-estoque-name {
  font-size: 0.9rem;
  color: #e5e7eb;
}

.bi-ag-estoque-badge {
  background: rgba(0, 255, 170, 0.18);
  color: #5fffc4;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.bi-ag-estoque-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
  align-items: center;
}

.bi-ag-pill {
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1.2;
}

.bi-ag-pill--ag {
  background: rgba(0, 255, 170, 0.2);
  color: #5fffc4;
  border: 1px solid rgba(0, 255, 170, 0.45);
}

.bi-ag-pill--sol {
  background: rgba(250, 204, 21, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(217, 119, 6, 0.45);
}

/*
 * Tela cheia: filtros + descrições compactos; KPIs e gráfico com --bi-ag-tv-data-bump
 */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale {
  --bi-ag-tv-data-bump: 22px;
  padding: 0.85rem 1.25rem 1rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-loading-icon {
  font-size: 2.25rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-loading-message {
  font-size: 0.95rem;
  max-width: min(480px, 92vw);
}

/* Cabeçalho / filtros em tela cheia: legíveis (KPI + gráfico continuam maiores via outras regras) */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-header {
  gap: 0.55rem;
  margin-bottom: 0.65rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-title {
  font-size: clamp(1.35rem, 2vw, 1.65rem);
  margin-bottom: 0.28rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-subtitle {
  font-size: clamp(1.02rem, 1.35vw, 1.2rem);
  line-height: 1.48;
  max-width: 62rem;
  color: #e2e6ed;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-footnote {
  font-size: clamp(0.95rem, 1.15vw, 1.08rem);
  margin-top: 0.35rem;
  color: #c8ced8;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-updated {
  font-size: clamp(0.88rem, 1.1vw, 1.02rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-btn-refresh {
  padding: 0.45rem 0.7rem;
  font-size: 0.95rem;
  border-radius: 8px;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-toolbar {
  margin-bottom: 0.65rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-toolbar-grid {
  gap: 0.65rem 0.9rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  align-items: end;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-compare-panel {
  padding: 0.75rem 0.9rem;
  gap: 0.55rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-compare-panel-title {
  font-size: clamp(0.92rem, 1.15vw, 1.06rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-compare-count {
  font-size: clamp(0.88rem, 1.1vw, 1.02rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-compare-chips-empty {
  font-size: clamp(0.9rem, 1.1vw, 1.04rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chip {
  font-size: clamp(0.9rem, 1.1vw, 1.04rem);
  padding: 0.2rem 0.45rem 0.2rem 0.6rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chip-remove {
  font-size: 0.85rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-compare-hint {
  font-size: clamp(0.94rem, 1.15vw, 1.08rem);
  line-height: 1.45;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-filter-label {
  font-size: clamp(0.98rem, 1.2vw, 1.12rem);
  gap: 0.38rem;
  color: #e8ebf0;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-toggle {
  width: 52px;
  height: 28px;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-toggle-knob {
  width: 20px;
  height: 20px;
  top: 4px;
  left: 4px;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale
  .bi-ag-toggle--on
  .bi-ag-toggle-knob {
  transform: translateX(24px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-select {
  padding: 0.5rem 0.75rem;
  font-size: clamp(1.02rem, 1.25vw, 1.18rem);
  min-height: 3rem;
  line-height: 1.35;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-error {
  font-size: clamp(0.92rem, 1.15vw, 1.05rem);
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.65rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-warn,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-info {
  font-size: clamp(0.9rem, 1.1vw, 1.04rem);
  padding: 0.55rem 0.7rem;
}

/* KPIs: destaque */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-grid {
  gap: calc(0.85rem + 6px);
  margin-bottom: calc(1rem + 8px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-card {
  padding: calc(1rem + 14px) calc(1.2rem + 10px);
  border-radius: 14px;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-titulo {
  font-size: clamp(1.05rem, 1.75vw, 1.35rem);
  color: #e8eaed;
  letter-spacing: 0.03em;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-valor {
  font-size: calc(1.65rem + var(--bi-ag-tv-data-bump));
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-compare {
  gap: calc(1rem + 8px) calc(1.1rem + 8px);
  margin-bottom: calc(1rem + 8px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-compare-col {
  padding: calc(1rem + 14px) calc(1.25rem + 10px) calc(1.1rem + 10px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-kpi-compare-heading {
  font-size: calc(0.95rem + 8px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale
  .bi-ag-kpi-compare-col
  .bi-ag-kpi-valor {
  font-size: clamp(
    calc(1.45rem + var(--bi-ag-tv-data-bump)),
    3vw,
    calc(2.05rem + var(--bi-ag-tv-data-bump))
  );
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale
  .bi-ag-kpi-compare-col
  .bi-ag-kpi-titulo {
  font-size: clamp(1.02rem, 1.65vw, 1.28rem);
  color: #e8eaed;
}

/* Gráfico: destaque */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chart-card {
  padding: calc(1rem + 14px) calc(1.15rem + 10px) calc(1.1rem + 10px);
  flex: 1 1 auto;
  min-height: 0;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chart-title {
  font-size: calc(1.08rem + var(--bi-ag-tv-data-bump));
  margin-bottom: clamp(1.1rem, 2.4vh, 1.85rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chart-title-row {
  margin-bottom: clamp(1rem, 2.2vh, 1.65rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chart-title--inline {
  margin-bottom: 0;
  font-size: calc(1.08rem + var(--bi-ag-tv-data-bump));
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-inline-legend-group {
  font-size: clamp(0.88rem, 1.25vw, 1.05rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-il-swatch {
  width: 14px;
  height: 14px;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-il-hint {
  font-size: clamp(0.82rem, 1.1vw, 0.98rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-chart-empty {
  font-size: calc(0.85rem + 6px);
  padding: 1.5rem;
}

/*
 * Área do gráfico: flex-basis 0 para ocupar o restante da coluna (igual ao fullscreen nativo).
 * No painel, ResizeObserver chama chart.resize() quando o slot muda de tamanho.
 */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale:fullscreen .bi-ag-chart-wrap,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale:-webkit-full-screen
  .bi-ag-chart-wrap,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale.bi-ag--embed-tv .bi-ag-chart-wrap {
  flex: 1 1 0;
  min-height: clamp(300px, 42vh, 720px);
  position: relative;
  overflow: visible;
  padding-bottom: 1.25rem;
}

/* Comparativo + legenda inline: menos “ar” abaixo do canvas (datas colam na base do card). */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale:fullscreen
  .bi-ag-chart-wrap.bi-ag-chart-wrap--compare-tv,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale:-webkit-full-screen
  .bi-ag-chart-wrap.bi-ag-chart-wrap--compare-tv,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale.bi-ag--embed-tv
  .bi-ag-chart-wrap.bi-ag-chart-wrap--compare-tv {
  padding-bottom: 0.2rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale.bi-ag--embed-tv
  .bi-ag-chart-title {
  flex-shrink: 0;
}

/* Modal em painel/TV: mais largura e altura; em :fullscreen cobre a lista longa */
.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-box {
  max-width: min(560px, 94vw);
  max-height: min(85vh, 640px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale:fullscreen .bi-ag-modal-overlay,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale:-webkit-full-screen
  .bi-ag-modal-overlay {
  z-index: 5000;
  padding: clamp(0.5rem, 2vh, 1.25rem);
  align-items: flex-start;
  padding-top: clamp(0.75rem, 4vh, 2.5rem);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale:fullscreen .bi-ag-modal-box,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale:-webkit-full-screen
  .bi-ag-modal-box {
  max-width: min(720px, 96vw);
  max-height: min(88vh, 920px);
  width: 100%;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-head {
  padding: 0.65rem 0.85rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-title {
  font-size: calc(0.95rem + 6px);
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-close {
  font-size: 1rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-body {
  padding: 0.65rem 0.85rem 0.85rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-loading,
.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-modal-empty {
  font-size: 0.88rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-estoque-name {
  font-size: 0.88rem;
}

.bi-page.bi-agendamentos-page.bi-ag-tv-scale .bi-ag-estoque-badge {
  font-size: 0.82rem;
  padding: 0.12rem 0.45rem;
}

/* ========== Tema claro (alinhado ao BI principal) ========== */
.bi-page.bi-agendamentos-page.bi-theme-light {
  background: #f0f7ff;
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light:fullscreen,
.bi-page.bi-agendamentos-page.bi-theme-light:-webkit-full-screen {
  background: #f0f7ff;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-loading-overlay {
  background: rgba(240, 247, 255, 0.92);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-loading-canvas {
  background: #ffffff;
  border-color: rgba(0, 119, 255, 0.3);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-loading-icon {
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-loading-message {
  color: #1a1a2e;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-title i {
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-subtitle {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-footnote {
  color: #6a7a8a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-updated {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-btn-refresh {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light
  .bi-ag-btn-refresh:hover:not(:disabled) {
  background: #e6f2ff;
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-select {
  background: #f8fbff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-toggle {
  background: #dde8f5;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-toggle--on {
  background: rgba(0, 119, 255, 0.35);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-compare-panel {
  background: #ffffff;
  border-color: #c5d9f0;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-compare-panel-title {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-compare-count {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-chip {
  background: #e6f2ff;
  border-color: rgba(0, 119, 255, 0.35);
  color: #1a3860;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-chip-remove {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-compare-chips-empty {
  color: #6a7a8a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-compare-hint {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-compare-hint code {
  background: #e8eef5;
  color: #374151;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-compare-col {
  background: #ffffff;
  border-color: #c5d9f0;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-compare-heading {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-compare-heading i {
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-card {
  background: linear-gradient(145deg, #ffffff 0%, #f5f9ff 100%);
  border-color: #c5d9f0;
  box-shadow: 0 2px 12px rgba(0, 119, 255, 0.06);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-card--destaque {
  border-color: rgba(0, 119, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 119, 255, 0.12);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-titulo {
  color: #3d4f63;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-kpi-valor {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light
  .bi-ag-kpi-card--destaque
  .bi-ag-kpi-valor {
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light.bi-ag-tv-scale .bi-ag-kpi-titulo,
.bi-page.bi-agendamentos-page.bi-theme-light.bi-ag-tv-scale
  .bi-ag-kpi-compare-col
  .bi-ag-kpi-titulo {
  color: #1a2533;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-chart-card {
  background: #ffffff;
  border-color: #c5d9f0;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-chart-title {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-inline-legend-cd-name {
  color: #047857;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-il-hint {
  color: #5c6b7a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-chart-empty {
  color: #6a7a8a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(220, 38, 38, 0.35);
  color: #b91c1c;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-warn {
  background: rgba(251, 191, 36, 0.12);
  border-color: rgba(217, 119, 6, 0.4);
  color: #92400e;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-info {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(37, 99, 235, 0.35);
  color: #1e3a5f;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-link-btn {
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-link-btn:hover {
  color: #0056b3;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-overlay {
  background: rgba(15, 23, 42, 0.4);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-box {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 16px 48px rgba(0, 119, 255, 0.12);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-head {
  border-bottom-color: #c5d9f0;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-title {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-close {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-close:hover {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-loading,
.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-empty {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-estoque-item {
  border-bottom-color: #e5eaf0;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-estoque-name {
  color: #1a1a1a;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-estoque-badge {
  background: rgba(0, 119, 255, 0.12);
  color: var(--primary, #0077ff);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-modal-detalhe-hint {
  color: #5a6c7d;
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-pill--ag {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.45);
}

.bi-page.bi-agendamentos-page.bi-theme-light .bi-ag-pill--sol {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
  border-color: rgba(217, 119, 6, 0.45);
}
</style>
