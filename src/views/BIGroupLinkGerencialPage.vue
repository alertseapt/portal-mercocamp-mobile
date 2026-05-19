<template>
  <div
    ref="glRootRef"
    class="bi-gligl"
    :class="{ 'bi-gligl--fullscreen': glTvLayout }"
  >
    <header class="bi-gligl__header">
      <div class="bi-gligl__brand">
        <img
          class="bi-gligl__logo"
          src="@/assets/images/group-link-gerencial-logo.svg"
          alt="Group Link One"
          width="48"
          height="48"
        />
        <div class="bi-gligl__titles">
          <h1 class="bi-gligl__h1">Gerencial Group Link</h1>
          <p class="bi-gligl__sub">Armazenagem · indicadores operacionais</p>
        </div>
      </div>
      <div class="bi-gligl__filters bi-gligl__filters--bi-toolbar">
        <div
          ref="glCalendarioRef"
          class="bi-calendario-wrap bi-gligl__cal-wrap"
        >
          <button
            type="button"
            class="btn-abrir-calendario-bi"
            :title="mostrarCalendario ? 'Fechar' : 'Selecionar período'"
            @click.stop="toggleMostrarCalendarioGl"
          >
            <i class="fa fa-calendar-alt" />
            {{ labelIntervaloGl }}
          </button>
          <div
            v-if="mostrarCalendario"
            class="calendario-dropdown-bi calendario-dropdown-bi-armazens"
            @click.stop
          >
            <div
              class="calendario-layout-bi calendario-layout-bi--armazens-unico"
            >
              <div class="cal-armazens-unico">
                <p class="cal-presets-bi-kicker">Filtre Por:</p>
                <div class="cal-armazens-presets-stack">
                  <button
                    v-for="p in presetsCalendarioGlVisiveis"
                    :key="p.id"
                    type="button"
                    class="preset-btn-bi"
                    :class="{
                      active:
                        p.id === 'customizar'
                          ? armazensCalendarioModoCustomizarGl
                          : presetAtivoGl === p.id,
                    }"
                    @click="aplicarPresetGl(p.id)"
                  >
                    {{ p.label }}
                  </button>
                </div>
                <div
                  v-if="!armazensCalendarioModoCustomizarGl"
                  class="cal-armazens-resumo-bi"
                >
                  <p class="cal-armazens-resumo-periodo">
                    <span class="cal-armazens-resumo-kicker">Período atual</span>
                    <span class="cal-armazens-resumo-valor">{{
                      labelArmazensPeriodoGl
                    }}</span>
                  </p>
                </div>
                <div v-else class="cal-armazens-inline-custom">
                  <div class="calendario-armazens-meses-bi">
                    <div class="cal-arm-mes-row">
                      <span class="cal-arm-label">De</span>
                      <div class="cal-arm-mes-selects">
                        <select
                          v-model.number="armazensCalMesIniGl"
                          class="select-mes-ano-arm-bi"
                          aria-label="Mês inicial"
                        >
                          <option
                            v-for="opt in opcoesMesSelectGl"
                            :key="'mi-' + opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </option>
                        </select>
                        <select
                          v-model.number="armazensCalAnoIniGl"
                          class="select-mes-ano-arm-bi select-ano-arm-bi"
                          aria-label="Ano inicial"
                        >
                          <option
                            v-for="a in anosSelectGl"
                            :key="'yi-' + a"
                            :value="a"
                          >
                            {{ a }}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div class="cal-arm-mes-row">
                      <span class="cal-arm-label">Até</span>
                      <div class="cal-arm-mes-selects">
                        <select
                          v-model.number="armazensCalMesFimGl"
                          class="select-mes-ano-arm-bi"
                          aria-label="Mês final"
                        >
                          <option
                            v-for="opt in opcoesMesSelectGl"
                            :key="'mf-' + opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </option>
                        </select>
                        <select
                          v-model.number="armazensCalAnoFimGl"
                          class="select-mes-ano-arm-bi select-ano-arm-bi"
                          aria-label="Ano final"
                        >
                          <option
                            v-for="a in anosSelectGl"
                            :key="'yf-' + a"
                            :value="a"
                          >
                            {{ a }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="cal-armazens-sec-btns">
                    <button
                      type="button"
                      class="btn-cal-bi"
                      @click="limparIntervaloGl"
                    >
                      Limpar
                    </button>
                  </div>
                  <div class="cal-armazens-aplicar-wrap">
                    <button
                      type="button"
                      class="btn-cal-bi btn-aplicar-bi btn-aplicar-bi--armazens-full"
                      @click="aplicarIntervaloGl"
                    >
                      Aplicar intervalo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="bi-gligl__btn-refresh"
          :disabled="loading"
          title="Atualizar"
          @click="reload"
        >
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" />
        </button>
        <button
          type="button"
          class="bi-gligl__btn-refresh"
          :title="glTvLayout ? 'Sair da tela cheia' : 'Tela cheia (painel / TV)'"
          @click="toggleFullscreen"
        >
          <i :class="glTvLayout ? 'fas fa-compress' : 'fas fa-expand'" />
        </button>
      </div>
    </header>

    <p v-if="errorMsg" class="bi-gligl__error">{{ errorMsg }}</p>
    <p v-else-if="configHint" class="bi-gligl__hint">{{ configHint }}</p>

    <section class="bi-gligl__kpis" aria-label="Indicadores">
      <article v-for="k in kpiItems" :key="k.key" class="bi-gligl__kpi">
        <h2 class="bi-gligl__kpi-label">{{ k.label }}</h2>
        <p class="bi-gligl__kpi-value" :style="glKpiValueFontStyle">{{ k.display }}</p>
        <p v-if="k.subdisplay" class="bi-gligl__kpi-sub">{{ k.subdisplay }}</p>
      </article>
    </section>

    <div class="bi-gligl__chart-rows">
      <section class="bi-gligl__row">
        <div class="bi-gligl__card">
          <h3 class="bi-gligl__card-title">Total de pedidos faturados</h3>
          <div class="bi-gligl__chart-wrap">
            <canvas ref="chartPedidosRef" />
          </div>
        </div>
        <div class="bi-gligl__card">
          <h3 class="bi-gligl__card-title">Total de produtos faturados</h3>
          <div class="bi-gligl__chart-wrap">
            <canvas ref="chartProdutosRef" />
          </div>
        </div>
        <div class="bi-gligl__card">
          <h3 class="bi-gligl__card-title">Dias em estoque</h3>
          <div class="bi-gligl__chart-wrap">
            <canvas ref="chartDiasRef" />
          </div>
        </div>
      </section>

      <section class="bi-gligl__row">
        <div class="bi-gligl__card">
          <h3 class="bi-gligl__card-title bi-gligl__card-title--center">
            SLA realizado (expedição)
          </h3>
          <div class="bi-gligl__sla-body">
            <div class="bi-gligl__sla-chart-grow">
              <div class="bi-gligl__sla-chart">
                <canvas ref="chartSlaRef" />
                <div class="bi-gligl__sla-center" :style="glSlaCenterFontStyle">
                  {{ slaExpedicaoCenterDisplay }}
                </div>
              </div>
            </div>
            <div class="bi-gligl__sla-legend">
              <div
                v-for="(item, idx) in slaStatusExpedicaoLegendGl"
                :key="idx"
                class="bi-gligl__sla-legend-row"
              >
                <span
                  class="bi-gligl__sla-legend-swatch"
                  :style="{ backgroundColor: item.color }"
                  aria-hidden="true"
                />
                <span class="bi-gligl__sla-legend-text">
                  <span class="bi-gligl__sla-legend-label">{{ item.label }}</span>
                  <span class="bi-gligl__sla-legend-meta">
                    <span class="bi-gligl__sla-legend-count">{{ item.fmtCount }}</span>
                    <span class="bi-gligl__sla-legend-paren"> ({{ item.pctInt }}%)</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="bi-gligl__card">
          <h3 class="bi-gligl__card-title bi-gligl__card-title--center">
            Quantidade de dispositivos em estoque
          </h3>
          <p v-if="estoqueWqfDtRefGl" class="bi-gligl__card-ref">{{ estoqueWqfDtRefGl }}</p>
          <div class="bi-gligl__chart-wrap bi-gligl__chart-wrap--hbar">
            <canvas ref="chartSkuRef" />
          </div>
        </div>
        <div class="bi-gligl__card">
          <h3 class="bi-gligl__card-title">Giro estoque</h3>
          <div class="bi-gligl__chart-wrap">
            <canvas ref="chartGiroRef" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { Chart, ArcElement, Tooltip, Legend, registerables } from 'chart.js'
import apiService from '../services/api.js'

Chart.register(ArcElement, Tooltip, Legend, ...registerables)

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

const MESES_NOME_PT_BR = [
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

const PRESETS_CALENDARIO_ARMAZENS_GL = [
  { id: 'este_ano', label: 'Este ano' },
  { id: 'ano_anterior', label: 'Ano anterior' },
  { id: 'este_mes', label: 'Este mês' },
  { id: 'mes_passado', label: 'Mês passado' },
  { id: 'customizar', label: 'Customizar' },
]

const ANO_MIN_REF_GROUPLINK_BI = 2025

/** Payload agrega várias queries pesadas (wqf/wgu em paralelo); 60s do apiService estoura com período anual. */
const BI_GROUPLINK_GERENCIAL_FETCH_MS = 180000

/** Paleta oficial Group Link One: #0066FF, #BFD8FF, #FFFFFF */
const COL_PRIMARY = '#0066FF'
const COL_LIGHT = '#BFD8FF'
/**
 * Donut / legenda SLA realizado — mesmas cores que `COLORS` em BIPage.vue (expedição:
 * Antecipado = verde puro, D+0/D+1/D+2 e OUT conforme o dashboard principal).
 */
const COL_SLA_REALIZADO = {
  antecipado: '#00FF00',
  d0: '#76FA65',
  d1: '#5BE8C4',
  d2: '#FFD93D',
  out: '#FF0000',
  pendente: '#FF0000',
}
const SLA_REALIZADO_KEYS = ['antecipado', 'd0', 'd1', 'd2', 'out', 'pendente']
const SLA_REALIZADO_LABELS = ['Antecipado', 'D+0', 'D+1', 'D+2', 'OUT', 'Pendente']
/** Faixas de «dias em estoque» (wua: id + serie + dt_mov) — fallback se o payload não trouxer o array. */
const DIAS_ESTOQUE_FAIXAS_FALLBACK = [
  { label: '0-30 dias', quantidade: 0 },
  { label: '31-60 dias', quantidade: 0 },
  { label: '61-90 dias', quantidade: 0 },
  { label: '91-180 dias', quantidade: 0 },
  { label: '181-360 dias', quantidade: 0 },
  { label: 'Mais de 360 dias', quantidade: 0 },
]

const SLA_REALIZADO_TOOLTIP_TITLES = [
  'Antecipado (expedição antes do limite)',
  'D+0 (no dia do limite)',
  'D+1 (1 dia após o limite)',
  'D+2 (2 dias após o limite)',
  'OUT (3+ dias após o limite)',
  'Pendente (sem expedição ou sem limite válido)',
]

function fmtMoney(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return Math.round(n).toLocaleString('pt-BR')
}

function truncLabelGl(s, maxLen = 40) {
  const t = String(s || '').trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(1, maxLen - 1))}…`
}

/** Valores à direita das barras horizontais (estilo PBI). `gapFromBar` afasta o texto do fim da barra. */
function hBarEndLabelsPlugin(formatValue, fontPx = 11, gapFromBar = 12) {
  const fz = Math.max(8, Math.round(Number(fontPx) || 11))
  const gap = Math.max(6, Number(gapFromBar) || 12)
  return {
    id: 'biGliglHbarEndLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart
      const meta = chart.getDatasetMeta(0)
      if (!meta?.data?.length) return
      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.font = `600 ${fz}px system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.fillStyle = COL_PRIMARY
      const ds = chart.data.datasets[0]
      const xClip = chartArea.right - 2
      for (let i = 0; i < meta.data.length; i++) {
        const bar = meta.data[i]
        if (!bar || bar.skip) continue
        const raw = ds.data[i]
        const text = formatValue(raw)
        if (text === '—' || text === '') continue
        const { x, y } = bar.getProps(['x', 'y'], true)
        const str = String(text)
        const tw = ctx.measureText(str).width
        let tx = x + gap
        /* Não empurra o texto para a esquerda sobre a barra (cortava o “1” de 16.927). */
        if (tx + tw > xClip) tx = Math.max(x + gap, xClip - tw)
        ctx.fillText(str, tx, y)
      }
      ctx.restore()
    },
  }
}

/** Valores acima das colunas nos gráficos de barras verticais do BI Group Link. */
function barTotalsAboveColumnsPlugin(chartKey, formatValue, fontPx = 10) {
  const fz = Math.max(8, Math.round(Number(fontPx) || 10))
  return {
    id: `biGliglBarTotals_${chartKey}`,
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      const meta = chart.getDatasetMeta(0)
      if (!meta?.data?.length) return
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.font = `600 ${fz}px system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.fillStyle = COL_PRIMARY
      const ds = chart.data.datasets[0]
      for (let i = 0; i < meta.data.length; i++) {
        const bar = meta.data[i]
        if (!bar || bar.skip) continue
        const raw = ds.data[i]
        const text = formatValue(raw)
        if (text === '—' || text === '') continue
        const { x, y } = bar.getProps(['x', 'y'], true)
        ctx.fillText(String(text), x, y - 4)
      }
      ctx.restore()
    },
  }
}

function fmtDuracao(sec) {
  if (sec == null || Number.isNaN(sec)) return '—'
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return `${h}h ${m}min ${r}s`
}

function parseIsoDataParaMesAnoGl(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-\d{2}/)
  if (!m) return null
  const ano = parseInt(m[1], 10)
  const mes = parseInt(m[2], 10)
  if (mes < 1 || mes > 12) return null
  return { ano, mes }
}

function isoDateLocalGl(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function normalizarPeriodoMesesInteirosGl(isoIni, isoFim) {
  const parse = (iso) => {
    const x = String(iso || '')
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!x) return null
    return { y: parseInt(x[1], 10), m: parseInt(x[2], 10) - 1 }
  }
  let a = parse(isoIni)
  let b = parse(isoFim)
  if (!a && !b) return null
  if (!a) a = { ...b }
  if (!b) b = { ...a }
  let y1 = a.y
  let m1 = a.m
  let y2 = b.y
  let m2 = b.m
  const t1 = y1 * 12 + m1
  const t2 = y2 * 12 + m2
  if (t1 > t2) {
    const ty = y1
    const tm = m1
    y1 = y2
    m1 = m2
    y2 = ty
    m2 = tm
  }
  y1 = Math.max(ANO_MIN_REF_GROUPLINK_BI, y1)
  y2 = Math.max(ANO_MIN_REF_GROUPLINK_BI, y2)
  const yAtual = new Date().getFullYear()
  y1 = Math.min(y1, yAtual)
  y2 = Math.min(y2, yAtual)
  {
    const ta = y1 * 12 + m1
    const tb = y2 * 12 + m2
    if (ta > tb) {
      const ty = y1
      const tm = m1
      y1 = y2
      m1 = m2
      y2 = ty
      m2 = tm
    }
  }
  const dIni = new Date(y1, m1, 1)
  const dFim = new Date(y2, m2 + 1, 0)
  return {
    ini: isoDateLocalGl(dIni),
    fim: isoDateLocalGl(dFim),
  }
}

function mesKeyGl(r) {
  return `${Number(r.ano)}-${Number(r.mes)}`
}

/** Limite inclusive ano-mês “hoje” (local) — meses futuros não entram nos eixos dos gráficos. */
function mesAnoAtualLimiteGl() {
  const h = new Date()
  return { ano: h.getFullYear(), mes: h.getMonth() + 1 }
}

function filtrarMesesNaoFuturosGl(sortedKeys) {
  const { ano: yL, mes: mL } = mesAnoAtualLimiteGl()
  const tLim = yL * 12 + mL
  return sortedKeys.filter((k) => {
    const [y, m] = k.split('-').map(Number)
    if (!Number.isFinite(y) || !Number.isFinite(m)) return false
    return y * 12 + m <= tLim
  })
}

/** Todas as chaves ano-mês entre os limites do calendário (inclusive). */
function fillMonthKeysBetween(isoIni, isoFim) {
  const keys = new Set()
  const pi = parseIsoDataParaMesAnoGl(isoIni)
  const pf = parseIsoDataParaMesAnoGl(isoFim)
  if (!pi || !pf) return keys
  let y = pi.ano
  let m = pi.mes
  const endT = pf.ano * 12 + pf.mes
  for (;;) {
    const t = y * 12 + m
    if (t > endT) break
    keys.add(`${y}-${m}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return keys
}

function mergeMonthlySeriesGl(ped, prod, isoIni, isoFim) {
  const keys = new Set()
  if (isoIni && isoFim) {
    for (const k of fillMonthKeysBetween(isoIni, isoFim)) keys.add(k)
  }
  for (const r of ped || []) if (r.ano && r.mes) keys.add(mesKeyGl(r))
  for (const r of prod || []) if (r.ano && r.mes) keys.add(mesKeyGl(r))
  let sorted = Array.from(keys).sort((a, b) => {
    const [ya, ma] = a.split('-').map(Number)
    const [yb, mb] = b.split('-').map(Number)
    return ya * 12 + ma - (yb * 12 + mb)
  })
  sorted = filtrarMesesNaoFuturosGl(sorted)
  if (sorted.length === 0) {
    return {
      labels: ['—'],
      pedidos: [0],
      produtos: [0],
    }
  }
  const pMap = new Map((ped || []).map((r) => [mesKeyGl(r), Number(r.valor) || 0]))
  const prMap = new Map((prod || []).map((r) => [mesKeyGl(r), Number(r.valor) || 0]))
  const labels = sorted.map((k) => {
    const [y, m] = k.split('-').map(Number)
    const short = MESES_CURTOS[m - 1] || String(m)
    return `${short}/${String(y).slice(-2)}`
  })
  return {
    labels,
    pedidos: sorted.map((k) => pMap.get(k) ?? 0),
    produtos: sorted.map((k) => prMap.get(k) ?? 0),
  }
}

export default {
  name: 'BIGroupLinkGerencialPage',
  props: {
    /** Igual BI Diretoria: painel/TV força layout ampliado sem depender só do detector abaixo. */
    embedTvLayout: { type: Boolean, default: false },
  },
  data() {
    const h = new Date()
    const y = Math.max(ANO_MIN_REF_GROUPLINK_BI, h.getFullYear())
    const dataInicio = `${y}-01-01`
    const dataFim = isoDateLocalGl(new Date(y, 12, 0))
    return {
      dataInicio,
      dataFim,
      presetAtivoGl: 'este_ano',
      mostrarCalendario: false,
      armazensCalMesIniGl: 1,
      armazensCalAnoIniGl: y,
      armazensCalMesFimGl: 12,
      armazensCalAnoFimGl: y,
      closeCalendarioAoClicarForaGl: null,
      loading: false,
      errorMsg: '',
      configHint: '',
      payload: null,
      charts: {
        pedidos: null,
        produtos: null,
        dias: null,
        sla: null,
        sku: null,
        giro: null,
      },
      isFullscreen: false,
      _glFsHandler: null,
      glLayoutW: 0,
      glLayoutH: 0,
      _glLayoutRo: null,
    }
  },
  computed: {
    armazensCalendarioModoCustomizarGl() {
      return this.presetAtivoGl === 'customizar'
    },
    presetsCalendarioGlVisiveis() {
      const yy = new Date().getFullYear()
      return PRESETS_CALENDARIO_ARMAZENS_GL.filter(
        (p) => p.id !== 'ano_anterior' || yy - 1 >= ANO_MIN_REF_GROUPLINK_BI
      )
    },
    labelArmazensPeriodoGl() {
      const pi = parseIsoDataParaMesAnoGl(this.dataInicio)
      const pf = parseIsoDataParaMesAnoGl(this.dataFim)
      if (!pi || !pf) return 'Período'
      const n = (i) => MESES_NOME_PT_BR[i - 1] || ''
      if (pi.ano === pf.ano && pi.mes === pf.mes) {
        return `${n(pi.mes)} de ${pi.ano}`
      }
      if (pi.ano === pf.ano) {
        return `${n(pi.mes)} – ${n(pf.mes)} de ${pi.ano}`
      }
      return `${n(pi.mes)} de ${pi.ano} – ${n(pf.mes)} de ${pf.ano}`
    },
    labelIntervaloGl() {
      if (this.dataInicio && this.dataFim) return this.labelArmazensPeriodoGl
      return 'Período'
    },
    opcoesMesSelectGl() {
      return MESES_NOME_PT_BR.map((nome, i) => ({
        value: i + 1,
        label: nome.charAt(0).toUpperCase() + nome.slice(1),
      }))
    },
    anosSelectGl() {
      const anoMin = ANO_MIN_REF_GROUPLINK_BI
      const yy = new Date().getFullYear()
      const anoMax = Math.max(yy, anoMin)
      const out = []
      for (let a = anoMin; a <= anoMax; a++) out.push(a)
      return out
    },
    kpiItems() {
      const k = this.payload?.kpis || {}
      const pick = (n) => (n == null ? '—' : fmtInt(n))
      const pickPct = (n) =>
        n == null || Number.isNaN(n) ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
      return [
        {
          key: 'nf_d',
          label: 'Total NF Recebidas\nDentro do prazo',
          display: pick(k.nf_dentro_prazo),
        },
        {
          key: 'nf_f',
          label: 'Total NF Recebidas\nFora do prazo',
          display: pick(k.nf_fora_prazo),
        },
        {
          key: 'p_d',
          label: 'Total pedidos faturados\nDentro do prazo',
          display: pick(
            k.pedidos_faturados_dentro_medida_pbi_linhas ?? k.pedidos_faturados_dentro_prazo
          ),
        },
        {
          key: 'p_f',
          label: 'Total pedidos faturados\nFora do prazo',
          display: pick(k.pedidos_faturados_fora_prazo),
        },
        { key: 'fat', label: 'Faturamento', display: fmtMoney(k.faturamento) },
        {
          key: 'est',
          label: 'Total itens\nem estoque',
          display: pick(k.total_itens_estoque),
        },
        {
          key: 'pal',
          label: 'Posições paletes\nocupadas',
          display: k.posicoes_paletes_ocupadas == null ? '—' : fmtInt(k.posicoes_paletes_ocupadas),
        },
        {
          key: 'texp',
          label: 'Tempo médio\nexpedição',
          display: fmtDuracao(k.tempo_medio_expedicao_seg),
        },
        {
          key: 'pick',
          label: 'Precisão média\npicking',
          display: pickPct(k.precisao_picking_pct),
        },
      ]
    },
    /** Total no centro do donut — linhas wgu no período (base do KPI + mesma classificação). */
    slaExpedicaoCenterDisplay() {
      const t = this.payload?.sla_realizado_expedicao_total
      if (t == null || Number.isNaN(Number(t))) return '—'
      return fmtInt(Number(t))
    },
    /** Legenda só com fatias &gt; 0 (Antecipado … Pendente). */
    slaStatusExpedicaoLegendGl() {
      const s = this.payload?.sla_realizado_expedicao
      if (!s || typeof s !== 'object') return []
      const total = Number(this.payload?.sla_realizado_expedicao_total)
      if (!Number.isFinite(total) || total <= 0) return []
      const out = []
      for (let i = 0; i < SLA_REALIZADO_KEYS.length; i++) {
        const key = SLA_REALIZADO_KEYS[i]
        const count = Number(s[key]) || 0
        if (count <= 0) continue
        out.push({
          label: SLA_REALIZADO_LABELS[i],
          color: COL_SLA_REALIZADO[key] || '#3d4f6f',
          fmtCount: fmtInt(count),
          pctInt: Math.round((count / total) * 100),
        })
      }
      return out
    },
    /** Tela cheia “estilo TV”: próprio elemento, ancestral em `requestFullscreen`, ou prop embed. */
    glTvLayout() {
      return this.isFullscreen || this.embedTvLayout
    },
    /**
     * KPI em TV: escala pela largura de ~1 card (grade de 9), não pela viewport inteira —
     * evita fonte gigante que quebra "R$ …", duração e % em dezenas de linhas.
     */
    glKpiValueFontStyle() {
      if (!this.glTvLayout) return undefined
      const w = this.glLayoutW || (typeof window !== 'undefined' ? window.innerWidth : 1200)
      const padGaps = 72
      const cardW = Math.max(80, (w - padGaps) / 9)
      /* Meio-termo TV: maior que 17px, ainda cabe faturamento / tempo em uma linha (nowrap). */
      const px = Math.round(Math.min(22, Math.max(13, cardW * 0.108)))
      return {
        fontSize: `${px}px`,
        lineHeight: '1.15',
        letterSpacing: '-0.022em',
        whiteSpace: 'nowrap',
      }
    },
    /** Data de referência do snapshot wqf (último dt_mov no período filtrado). */
    estoqueWqfDtRefGl() {
      const s = this.payload?.estoque_wqf_dt_ref
      if (!s || typeof s !== 'string') return ''
      const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (!m) return `Saldo na referência: ${s}`
      return `Saldo na data ${m[3]}/${m[2]}/${m[1]} · wqf`
    },
    /** Miolo do donut: proporcional à coluna (~1/3 da largura), não à viewport inteira. */
    glSlaCenterFontStyle() {
      if (!this.glTvLayout) return undefined
      const w = this.glLayoutW || (typeof window !== 'undefined' ? window.innerWidth : 1200)
      const h = this.glLayoutH || (typeof window !== 'undefined' ? window.innerHeight : 800)
      const colW = Math.max(160, w / 3 - 36)
      const donutSide = Math.min(colW * 0.95, h * 0.26, 280)
      const px = Math.round(Math.min(42, Math.max(20, donutSide * 0.17)))
      return { fontSize: `${px}px`, lineHeight: 1.08 }
    },
  },
  mounted() {
    this.normalizarPeriodoGl()
    this.syncGlCalSelectsFromDatas()
    this.closeCalendarioAoClicarForaGl = (e) => {
      if (
        this.mostrarCalendario &&
        this.$refs.glCalendarioRef &&
        !this.$refs.glCalendarioRef.contains(e.target)
      ) {
        this.mostrarCalendario = false
      }
    }
    document.addEventListener('click', this.closeCalendarioAoClicarForaGl)
    this._glFsHandler = () => this.onFullscreenChange()
    document.addEventListener('fullscreenchange', this._glFsHandler)
    this.onFullscreenChange()
    this.$nextTick(() => this._glInitLayoutObserver())
    this.reload()
  },
  beforeUnmount() {
    if (this._glLayoutRo) {
      this._glLayoutRo.disconnect()
      this._glLayoutRo = null
    }
    if (this._glFsHandler) {
      document.removeEventListener('fullscreenchange', this._glFsHandler)
      this._glFsHandler = null
    }
    if (this.closeCalendarioAoClicarForaGl) {
      document.removeEventListener('click', this.closeCalendarioAoClicarForaGl)
    }
    const root = this.biFullscreenRootEl()
    const fs = document.fullscreenElement
    if (fs && root && fs === root) {
      document.exitFullscreen().catch(() => {})
    }
    Object.values(this.charts).forEach((c) => {
      if (c) c.destroy()
    })
  },
  methods: {
    _glInitLayoutObserver() {
      if (this._glLayoutRo) {
        this._glLayoutRo.disconnect()
        this._glLayoutRo = null
      }
      const el = this.biFullscreenRootEl()
      if (!el || typeof ResizeObserver === 'undefined') {
        if (typeof window !== 'undefined') {
          this.glLayoutW = window.innerWidth
          this.glLayoutH = window.innerHeight
        }
        return
      }
      const ro = new ResizeObserver(() => {
        this.glLayoutW = el.clientWidth
        this.glLayoutH = el.clientHeight
      })
      ro.observe(el)
      this._glLayoutRo = ro
      this.glLayoutW = el.clientWidth
      this.glLayoutH = el.clientHeight
    },
    biFullscreenRootEl() {
      const r = this.$refs.glRootRef
      if (r instanceof Element) return r
      return this.$el instanceof Element ? this.$el : null
    },
    resizeAllCharts() {
      this.$nextTick(() => {
        Object.values(this.charts).forEach((c) => {
          if (c && typeof c.resize === 'function') c.resize()
        })
      })
    },
    async toggleFullscreen() {
      const el = this.biFullscreenRootEl()
      if (!el) return
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (e) {
        console.warn('[BI Group Link] Fullscreen:', e?.message || e)
      }
    },
    onFullscreenChange() {
      const fs = document.fullscreenElement
      const root = this.biFullscreenRootEl()
      /*
       * Antes: fs === root || root.contains(fs) — quando o próprio `.bi-gligl` está em
       * fullscreen, fs é a raiz e root.contains(fs) é falso → classe nunca ligava.
       * Mesma ideia do embed no painel: fs.contains(root) cobre ancestral OU o próprio nó.
       */
      this.isFullscreen = !!(fs && root && typeof fs.contains === 'function' && fs.contains(root))
      this.$nextTick(() => {
        this._glInitLayoutObserver()
        if (this.payload) this.renderCharts()
        else this.resizeAllCharts()
      })
    },
    /** Tipografia e limites de barra conforme tela cheia (classe + API). */
    _chartUi() {
      if (this.glTvLayout) {
        return {
          tickBar: 12,
          tickLine: 11,
          maxBarThickness: 36,
          barPercentage: 0.5,
          layoutTopPad: 26,
          donutCutout: '74%',
          barTotalFont: 14,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      }
      return {
        tickBar: 9,
        tickLine: 8,
        maxBarThickness: 56,
        barPercentage: 0.82,
        layoutTopPad: 18,
        donutCutout: '78%',
        barTotalFont: 10,
        pointRadius: 2,
        pointHoverRadius: 4,
      }
    },
    _barCategoryPercentage(nLabels) {
      const n = Number(nLabels) || 0
      if (n <= 1) return this.glTvLayout ? 0.38 : 0.48
      if (n <= 3) return this.glTvLayout ? 0.52 : 0.62
      return this.glTvLayout ? 0.78 : 0.82
    },
    getHojeGl() {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    },
    normalizarPeriodoGl() {
      const n = normalizarPeriodoMesesInteirosGl(this.dataInicio, this.dataFim)
      if (n && n.ini && n.fim) {
        this.dataInicio = n.ini
        this.dataFim = n.fim
      }
    },
    syncGlCalSelectsFromDatas() {
      const yMax = new Date().getFullYear()
      const clampAno = (a) =>
        Math.min(Math.max(ANO_MIN_REF_GROUPLINK_BI, a), yMax)
      const pi = parseIsoDataParaMesAnoGl(this.dataInicio)
      const pf = parseIsoDataParaMesAnoGl(this.dataFim)
      if (pi) {
        this.armazensCalMesIniGl = pi.mes
        this.armazensCalAnoIniGl = clampAno(pi.ano)
      }
      if (pf) {
        this.armazensCalMesFimGl = pf.mes
        this.armazensCalAnoFimGl = clampAno(pf.ano)
      }
    },
    toggleMostrarCalendarioGl() {
      this.mostrarCalendario = !this.mostrarCalendario
      if (this.mostrarCalendario) {
        this.$nextTick(() => this.syncGlCalSelectsFromDatas())
      }
    },
    aplicarPresetGl(id) {
      if (id === 'customizar') {
        this.presetAtivoGl = 'customizar'
        this.syncGlCalSelectsFromDatas()
        return
      }
      if (
        id === 'ano_anterior' &&
        this.getHojeGl().getFullYear() - 1 < ANO_MIN_REF_GROUPLINK_BI
      ) {
        return
      }
      this.presetAtivoGl = id
      const hoje = this.getHojeGl()
      let ini = ''
      let fim = ''
      switch (id) {
        case 'este_ano': {
          const yUso = Math.max(ANO_MIN_REF_GROUPLINK_BI, hoje.getFullYear())
          ini = `${yUso}-01-01`
          fim = isoDateLocalGl(new Date(yUso, 12, 0))
          break
        }
        case 'ano_anterior': {
          const y = hoje.getFullYear() - 1
          ini = `${y}-01-01`
          fim = isoDateLocalGl(new Date(y, 12, 0))
          break
        }
        case 'este_mes':
          ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
          fim = isoDateLocalGl(hoje)
          break
        case 'mes_passado': {
          const prim = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
          const ult = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
          ini = isoDateLocalGl(prim)
          fim = isoDateLocalGl(ult)
          break
        }
        default:
          return
      }
      const n = normalizarPeriodoMesesInteirosGl(ini, fim)
      if (n && n.ini && n.fim) {
        ini = n.ini
        fim = n.fim
      }
      this.dataInicio = ini
      this.dataFim = fim
      this.syncGlCalSelectsFromDatas()
      this.mostrarCalendario = false
      this.reload()
    },
    aplicarIntervaloGl() {
      let m1 = Number(this.armazensCalMesIniGl)
      let y1 = Number(this.armazensCalAnoIniGl)
      let m2 = Number(this.armazensCalMesFimGl)
      let y2 = Number(this.armazensCalAnoFimGl)
      if (
        !Number.isFinite(m1) ||
        !Number.isFinite(y1) ||
        !Number.isFinite(m2) ||
        !Number.isFinite(y2) ||
        m1 < 1 ||
        m1 > 12 ||
        m2 < 1 ||
        m2 > 12
      ) {
        this.syncGlCalSelectsFromDatas()
      } else {
        const t1 = y1 * 12 + m1 - 1
        const t2 = y2 * 12 + m2 - 1
        if (t1 > t2) {
          const tm = m1
          const ty = y1
          m1 = m2
          y1 = y2
          m2 = tm
          y2 = ty
          this.armazensCalMesIniGl = m1
          this.armazensCalAnoIniGl = y1
          this.armazensCalMesFimGl = m2
          this.armazensCalAnoFimGl = y2
        }
        this.dataInicio = isoDateLocalGl(new Date(y1, m1 - 1, 1))
        this.dataFim = isoDateLocalGl(new Date(y2, m2, 0))
      }
      this.presetAtivoGl = 'customizar'
      this.mostrarCalendario = false
      this.reload()
    },
    limparIntervaloGl() {
      const hoje = this.getHojeGl()
      const y = Math.max(ANO_MIN_REF_GROUPLINK_BI, hoje.getFullYear())
      this.dataInicio = `${y}-01-01`
      this.dataFim = isoDateLocalGl(new Date(y, 12, 0))
      this.presetAtivoGl = 'este_ano'
      this.syncGlCalSelectsFromDatas()
      this.mostrarCalendario = false
      this.reload()
    },
    async reload() {
      this.loading = true
      this.errorMsg = ''
      this.configHint = ''
      try {
        const params = {
          data_inicio: this.dataInicio,
          data_fim: this.dataFim,
        }
        const data = await apiService.get('/bi/grouplink-gerencial', params, {
          timeout: BI_GROUPLINK_GERENCIAL_FETCH_MS,
        })
        if (!data.success) {
          this.errorMsg = data.error || 'Não foi possível carregar o BI.'
          this.payload = null
        } else {
          this.payload = data
        }
        await this.$nextTick()
        this.renderCharts()
      } catch (e) {
        const msg = e?.message || 'Erro ao carregar.'
        if (/acesso restrito|Acesso negado/i.test(msg)) {
          this.errorMsg = 'Acesso negado a este painel.'
        } else {
          this.errorMsg = msg
        }
        this.payload = null
      } finally {
        this.loading = false
        this.$emit('page-ready')
      }
    },
    renderCharts() {
           const merged = mergeMonthlySeriesGl(
        this.payload?.pedidos_por_mes,
        this.payload?.produtos_por_mes,
        this.dataInicio,
        this.dataFim
      )
      const { labels, pedidos, produtos } = merged

      this._barOrLine('pedidos', this.$refs.chartPedidosRef, labels, pedidos, 'Pedidos')
      this._barOrLine('produtos', this.$refs.chartProdutosRef, labels, produtos, 'Quantidade')

      let faixas = Array.isArray(this.payload?.dias_em_estoque_faixas)
        ? this.payload.dias_em_estoque_faixas
        : []
      if (faixas.length === 0) faixas = DIAS_ESTOQUE_FAIXAS_FALLBACK
      const diasLabels = faixas.map((f) => f.label || '—')
      const diasVals = faixas.map((f) => Number(f.quantidade) || 0)
      this._barOrLine('dias', this.$refs.chartDiasRef, diasLabels, diasVals, 'Seriais', {
        hideYAxis: true,
        tickMaxRotation: 0,
        suggestedMax: Math.max(1, ...diasVals, 0) * 1.15,
        formatTop: (v) => (v == null || Number.isNaN(Number(v)) ? '—' : fmtInt(Number(v))),
      })

      const sSta = this.payload?.sla_realizado_expedicao || {}
      const slaExpData = SLA_REALIZADO_KEYS.map((k) => Number(sSta[k]) || 0)
      const slaExpColors = SLA_REALIZADO_KEYS.map((k) => COL_SLA_REALIZADO[k])
      this._donutSlaExpedicao(
        'sla',
        this.$refs.chartSlaRef,
        [...SLA_REALIZADO_LABELS],
        slaExpData,
        slaExpColors
      )

      /* Sem saldo zero. API vem ORDER BY quantidade DESC; neste layout o 1º item fica no topo do eixo Y. */
      const skus = [...(this.payload?.estoque_por_sku || [])].filter(
        (x) => Number(x.quantidade) > 0
      )
      this._hbar(
        'sku',
        this.$refs.chartSkuRef,
        skus.map((x) => truncLabelGl(x.codigo, 44)),
        skus.map((x) => x.quantidade)
      )

      const giroMensal = Array.isArray(this.payload?.giro_estoque_mensal)
        ? this.payload.giro_estoque_mensal
        : []
      this._lineGiroMensal('giro', this.$refs.chartGiroRef, giroMensal)
    },
    _destroy(name) {
      const ch = this.charts[name]
      if (ch) {
        const canvas = ch.canvas
        const tip = canvas?.parentNode?.querySelector?.('.bi-gligl__sla-tooltip-html')
        if (tip) tip.remove()
        ch.destroy()
        this.charts[name] = null
      }
    },
    _barOrLine(key, canvas, labels, data, yLabel, extra = {}) {
      if (!canvas) return
      this._destroy(key)
      const formatTop = typeof extra.formatTop === 'function' ? extra.formatTop : (v) => fmtInt(v)
      const ui = this._chartUi()
      const catPct = this._barCategoryPercentage(labels?.length)
      this.charts[key] = new Chart(canvas, {
        type: 'bar',
        plugins: [barTotalsAboveColumnsPlugin(key, formatTop, ui.barTotalFont)],
        data: {
          labels,
          datasets: [
            {
              label: yLabel,
              data,
              backgroundColor: COL_PRIMARY,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          datasets: {
            bar: {
              maxBarThickness: ui.maxBarThickness,
              categoryPercentage: catPct,
              barPercentage: ui.barPercentage ?? 0.82,
            },
          },
          layout: { padding: { top: ui.layoutTopPad } },
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: ui.tickBar },
                maxRotation: extra.tickMaxRotation != null ? extra.tickMaxRotation : 45,
              },
            },
            y: {
              display: extra.hideYAxis ? false : true,
              beginAtZero: true,
              suggestedMax: extra.suggestedMax,
              ticks: { font: { size: ui.tickBar } },
              grid: { display: extra.hideYAxis ? false : undefined },
            },
          },
        },
      })
    },
    _donut(key, canvas, labels, data, colors) {
      if (!canvas) return
      this._destroy(key)
      const sum = data.reduce((a, b) => a + b, 0)
      this.charts[key] = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderWidth: 0,
              borderRadius: 6,
              spacing: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const v = ctx.raw || 0
                  const pct = sum ? ((v / sum) * 100).toFixed(2) : '0'
                  return `${ctx.label}: ${v} (${pct}%)`
                },
              },
            },
          },
        },
      })
    },
    /** Donut SLA: tooltip em HTML acima do canvas/miolo (evita ficar atrás da máscara branca). */
    _donutSlaExpedicao(key, canvas, labels, data, colors) {
      if (!canvas) return
      this._destroy(key)
      const parent = canvas.parentNode
      const tooltipEl = document.createElement('div')
      tooltipEl.className = 'bi-gligl__sla-tooltip-html'
      tooltipEl.setAttribute('role', 'tooltip')
      if (parent) parent.appendChild(tooltipEl)

      const escapeSlaTooltipHtml = (s) =>
        String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')

      const slaTooltipSwatchBg = (hex) =>
        /^#[0-9A-Fa-f]{3,8}$/.test(String(hex || '').trim()) ? String(hex).trim() : '#888888'

      const applySlaExternalTooltip = (context) => {
        const { chart, tooltip: tip } = context
        if (!tooltipEl.parentNode) parent?.appendChild(tooltipEl)
        if (!tip || tip.opacity === 0) {
          tooltipEl.style.opacity = '0'
          tooltipEl.style.visibility = 'hidden'
          return
        }
        const dp = tip.dataPoints?.[0]
        const active = chart?.getActiveElements?.() || []
        const ae = active[0]
        let idx =
          typeof dp?.dataIndex === 'number'
            ? dp.dataIndex
            : typeof ae?.index === 'number'
              ? ae.index
              : null

        let html = ''
        if (idx != null && idx >= 0 && idx < data.length) {
          const fullTitle = SLA_REALIZADO_TOOLTIP_TITLES[idx] ?? String(labels[idx] || '')
          const bg = slaTooltipSwatchBg(colors[idx])
          const raw = dp?.raw != null ? dp.raw : data[idx]
          const valStr = fmtInt(Number(raw))
          html = `<div class="bi-gligl__sla-tooltip-html__title">${escapeSlaTooltipHtml(fullTitle)}</div>`
          html += `<div class="bi-gligl__sla-tooltip-html__row">`
          html += `<span class="bi-gligl__sla-tooltip-html__swatch" style="background-color:${bg}"></span>`
          html += `<span class="bi-gligl__sla-tooltip-html__value">${escapeSlaTooltipHtml(valStr)}</span>`
          html += `</div>`
        } else {
          const titles = Array.isArray(tip.title) ? tip.title.filter(Boolean) : []
          const bodies = []
          if (tip.body?.length) {
            tip.body.forEach((b) => (b.lines || []).forEach((l) => bodies.push(l)))
          }
          titles.forEach((t) => {
            html += `<div class="bi-gligl__sla-tooltip-html__title">${escapeSlaTooltipHtml(t)}</div>`
          })
          bodies.forEach((l) => {
            html += `<div class="bi-gligl__sla-tooltip-html__row">`
            html += `<span class="bi-gligl__sla-tooltip-html__value bi-gligl__sla-tooltip-html__value--solo">${escapeSlaTooltipHtml(l)}</span>`
            html += `</div>`
          })
        }
        tooltipEl.innerHTML = html || `<div class="bi-gligl__sla-tooltip-html__value">—</div>`
        const x = tip.caretX ?? 0
        const y = tip.caretY ?? 0
        tooltipEl.style.left = `${x}px`
        tooltipEl.style.top = `${y}px`
        tooltipEl.style.transform = 'translate(-50%, calc(-100% - 10px))'
        tooltipEl.style.opacity = '1'
        tooltipEl.style.visibility = 'visible'
      }

      const ui = this._chartUi()
      this.charts[key] = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderWidth: 0,
              borderRadius: 6,
              spacing: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: ui.donutCutout,
          backgroundColor: '#ffffff',
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false,
              external: applySlaExternalTooltip,
              callbacks: {
                title(items) {
                  const it = items?.[0]
                  const i = it?.dataIndex
                  if (typeof i === 'number' && SLA_REALIZADO_TOOLTIP_TITLES[i]) {
                    return [SLA_REALIZADO_TOOLTIP_TITLES[i]]
                  }
                  return it?.label != null && it.label !== '' ? [String(it.label)] : []
                },
                label(ctx) {
                  return fmtInt(Number(ctx.raw) || 0)
                },
              },
            },
          },
        },
      })
    },
    _hbar(key, canvas, labels, data) {
      if (!canvas) return
      this._destroy(key)
      if (!labels.length) {
        labels = ['—']
        data = [0]
      }
      const ui = this._chartUi()
      const catPct = this._barCategoryPercentage(labels.length)
      const fmtEnd = (v) =>
        v == null || Number.isNaN(Number(v))
          ? '—'
          : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
      const rawMax = Math.max(0, ...data.map((n) => Number(n) || 0))
      const xSuggestedMax =
        rawMax <= 0 ? undefined : Math.ceil(rawMax * 1.2 + Math.max(800, rawMax * 0.05))
      const padR = Math.max(52, Math.round((ui.barTotalFont || 12) * 4.2))
      this.charts[key] = new Chart(canvas, {
        type: 'bar',
        plugins: [hBarEndLabelsPlugin(fmtEnd, ui.barTotalFont, Math.round(ui.barTotalFont * 0.85 + 6))],
        data: {
          labels,
          datasets: [{ label: 'Qtd', data, backgroundColor: COL_PRIMARY, borderRadius: 4 }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { right: padR, left: 2, top: 2, bottom: 2 },
          },
          datasets: {
            bar: {
              maxBarThickness: ui.maxBarThickness,
              categoryPercentage: catPct,
              barPercentage: ui.barPercentage ?? 0.82,
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const n = Number(ctx.raw)
                  return Number.isFinite(n)
                    ? ` ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                    : ''
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              suggestedMax: xSuggestedMax,
              grid: { display: false },
              ticks: { font: { size: ui.tickBar } },
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: ui.tickBar }, autoSkip: false },
            },
          },
        },
      })
    },
    _line(key, canvas, labels, data) {
      if (!canvas) return
      this._destroy(key)
      if (!labels.length) {
        labels = ['—']
        data = [0]
      }
      const ui = this._chartUi()
      this.charts[key] = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Giro',
              data,
              borderColor: COL_PRIMARY,
              backgroundColor: 'rgba(0, 102, 255, 0.12)',
              fill: true,
              tension: 0.25,
              pointRadius: ui.pointRadius,
              pointHoverRadius: ui.pointHoverRadius,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: {
                font: { size: ui.tickLine },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: { beginAtZero: true, ticks: { font: { size: ui.tickBar } } },
          },
        },
      })
    },
    /** Giro mensal (saídas wvu / estoque médio wqf), alinhado ao PBI — `giro` null sem linha no ponto. */
    _lineGiroMensal(key, canvas, rows) {
      if (!canvas) return
      this._destroy(key)
      const list = Array.isArray(rows) ? rows : []
      let labels = list.map((r) => {
        const m = Number(r.mes)
        const y = Number(r.ano)
        const short = MESES_CURTOS[m - 1] || String(m)
        return `${short}/${String(y).slice(-2)}`
      })
      let data = list.map((r) => {
        const g = r.giro
        if (g == null || !Number.isFinite(Number(g))) return null
        return Number(g)
      })
      if (!labels.length) {
        labels = ['—']
        data = [null]
      }
      const ui = this._chartUi()
      const fmtGiro = (g) =>
        g != null && Number.isFinite(Number(g))
          ? Number(g).toLocaleString('pt-BR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4,
            })
          : '—'
      this.charts[key] = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Giro',
              data,
              borderColor: COL_PRIMARY,
              backgroundColor: 'rgba(0, 102, 255, 0.12)',
              fill: true,
              tension: 0.25,
              pointRadius: ui.pointRadius,
              pointHoverRadius: ui.pointHoverRadius,
              spanGaps: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label(ctx) {
                  const row = list[ctx.dataIndex]
                  if (!row) return ''
                  return `Giro: ${fmtGiro(row.giro)}`
                },
                afterLabel(ctx) {
                  const row = list[ctx.dataIndex]
                  if (!row) return []
                  const out = []
                  const saidas = Number(row.saidas)
                  if (Number.isFinite(saidas)) {
                    out.push(
                      `Saídas (checkout): ${saidas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                    )
                  }
                  const em = row.estoque_medio
                  if (em != null && Number.isFinite(Number(em))) {
                    out.push(
                      `Estoque médio: ${Number(em).toLocaleString('pt-BR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}`
                    )
                  }
                  return out
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                font: { size: ui.tickLine },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: ui.tickBar },
                callback(v) {
                  if (v == null || !Number.isFinite(Number(v))) return ''
                  return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 4 })
                },
              },
            },
          },
        },
      })
    },
  },
}
</script>

<style scoped>
/* Cores padrão cliente: #0066FF · #BFD8FF · #FFFFFF */
.bi-gligl {
  --gl-primary: #0066ff;
  --gl-primary-dark: #0052cc;
  --gl-light: #bfd8ff;
  --gl-white: #ffffff;
  --gl-text: #0a1628;
  --gl-text-muted: #3d4f6f;
  --gl-bg: #f5f9ff;
  --gl-card: #ffffff;
  --gl-border: #bfd8ff;
  /* Meio-termo: legível sem voltar ao excesso de rolagem (~220px era alto; 140px ficou curto) */
  --gl-chart-h: 188px;
  --gl-chart-h-hbar: 200px;
  /* Teto alto: o lado real vem de min(100cqmin, …) no wrapper flex; isto só limita excesso. */
  --gl-sla-donut: min(520px, 88vmin);
  /* Número central do donut SLA e totais dos KPI — px fixo (html usa --font-scale 0.8; rem herdado não afeta estes px). */
  --gl-num-center: 34px;
  padding: 0.7rem 0.85rem 1rem;
  background: var(--gl-bg);
  color: var(--gl-text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  width: 100%;
  box-sizing: border-box;
}

/*
 * Tela cheia: inclui `.bi-gligl--fullscreen` porque em `<style scoped>` o seletor
 * `:fullscreen` nem sempre aplica variáveis herdadas como esperado; a classe
 * espelha o estado (fullscreenchange) e garante KPIs/donut maiores.
 */
.bi-gligl:fullscreen,
.bi-gligl:-webkit-full-screen,
.bi-gligl:-moz-full-screen,
.bi-gligl.bi-gligl--fullscreen {
  min-height: 100%;
  width: 100%;
  overflow: auto;
  padding: 1rem 1.15rem 1.25rem;
  --gl-chart-h: 300px;
  --gl-chart-h-hbar: 312px;
  /* TV: teto generoso para o cqmin do grow preencher a altura do card. */
  --gl-sla-donut: min(720px, 96vmin);
}

.bi-gligl:fullscreen .bi-gligl__h1,
.bi-gligl:-webkit-full-screen .bi-gligl__h1,
.bi-gligl:-moz-full-screen .bi-gligl__h1,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__h1 {
  font-size: 1.45rem;
}

.bi-gligl:fullscreen .bi-gligl__sub,
.bi-gligl:-webkit-full-screen .bi-gligl__sub,
.bi-gligl:-moz-full-screen .bi-gligl__sub,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__sub {
  font-size: 0.92rem;
}

.bi-gligl:fullscreen .bi-gligl__kpi-label,
.bi-gligl:-webkit-full-screen .bi-gligl__kpi-label,
.bi-gligl:-moz-full-screen .bi-gligl__kpi-label,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__kpi-label {
  /* Um pouco menor que o valor para hierarquia; libera largura para o número em destaque. */
  font-size: 0.7rem;
  line-height: 1.22;
}

.bi-gligl:fullscreen .bi-gligl__kpi,
.bi-gligl:-webkit-full-screen .bi-gligl__kpi,
.bi-gligl:-moz-full-screen .bi-gligl__kpi,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__kpi {
  min-height: 7.5rem;
  justify-content: flex-start;
}

.bi-gligl:fullscreen .bi-gligl__kpi-value,
.bi-gligl:-webkit-full-screen .bi-gligl__kpi-value,
.bi-gligl:-moz-full-screen .bi-gligl__kpi-value,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__kpi-value {
  line-height: 1.06;
  margin-top: auto;
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: normal;
  word-break: normal;
}

.bi-gligl:fullscreen .bi-gligl__card-title,
.bi-gligl:-webkit-full-screen .bi-gligl__card-title,
.bi-gligl:-moz-full-screen .bi-gligl__card-title,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__card-title {
  font-size: 0.88rem;
}

.bi-gligl:fullscreen .bi-gligl__sla-center,
.bi-gligl:-webkit-full-screen .bi-gligl__sla-center,
.bi-gligl:-moz-full-screen .bi-gligl__sla-center,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__sla-center {
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 48%;
  height: 48%;
  max-width: none;
  max-height: none;
}

.bi-gligl__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  margin-bottom: 0.65rem;
  flex-shrink: 0;
}

.bi-gligl__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.bi-gligl__logo {
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 102, 255, 0.18);
}

.bi-gligl__h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gl-primary);
}

.bi-gligl__sub {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--gl-text-muted);
}

.bi-gligl__filters--bi-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

/* Calendário — mesmo formato Análise Armazéns, cores da marca Group Link */
.bi-gligl__cal-wrap.bi-calendario-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
  padding-bottom: 0;
}

.btn-abrir-calendario-bi {
  height: 40px;
  min-height: 40px;
  padding: 0 1rem;
  box-sizing: border-box;
  background: var(--gl-primary);
  border: 1px solid var(--gl-primary);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--gl-white);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-abrir-calendario-bi:hover {
  background: var(--gl-primary-dark);
  border-color: var(--gl-primary-dark);
  color: var(--gl-white);
}

.calendario-dropdown-bi {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--gl-white);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 102, 255, 0.15);
  border: 1px solid var(--gl-border);
  z-index: 1000;
  min-width: 520px;
}

.calendario-dropdown-bi-armazens {
  min-width: 280px;
  max-width: 380px;
}

.calendario-layout-bi--armazens-unico {
  flex-direction: column;
  padding: 0.85rem 1rem 1rem;
  gap: 0;
}

.cal-armazens-unico {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}

.cal-armazens-presets-stack {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cal-presets-bi-kicker {
  margin: 0 0 0.45rem;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--gl-text-muted);
  line-height: 1.3;
}

.preset-btn-bi {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.9rem;
  color: var(--gl-text);
  cursor: pointer;
  transition: background 0.2s;
}

.preset-btn-bi:hover {
  background: var(--gl-light);
}

.preset-btn-bi.active {
  background: var(--gl-primary);
  color: var(--gl-white);
  font-weight: 500;
}

.cal-armazens-resumo-bi {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.15rem 0 0.1rem;
}

.cal-armazens-resumo-periodo {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cal-armazens-resumo-kicker {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--gl-primary);
  opacity: 0.85;
}

.cal-armazens-resumo-valor {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gl-text);
  line-height: 1.35;
}

.cal-armazens-inline-custom {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.6rem;
  margin-top: 0.15rem;
  border-top: 1px solid var(--gl-border);
}

.cal-armazens-sec-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.cal-armazens-aplicar-wrap {
  margin-top: 0.35rem;
}

.btn-aplicar-bi--armazens-full {
  display: inline-flex !important;
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}

.calendario-armazens-meses-bi {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.cal-arm-mes-row {
  display: grid;
  grid-template-columns: 2.35rem minmax(0, 1fr);
  align-items: center;
  gap: 0.35rem 0.6rem;
}

.cal-arm-mes-selects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
  align-items: stretch;
}

.cal-arm-mes-selects .select-mes-ano-arm-bi {
  flex: 1 1 9.5rem;
  min-width: 0;
}

.cal-arm-mes-selects .select-ano-arm-bi {
  flex: 0 0 5.25rem;
  min-width: 5.25rem;
}

.cal-arm-label {
  min-width: 2.25rem;
  font-size: 0.85rem;
  color: var(--gl-text-muted);
}

.select-mes-ano-arm-bi {
  flex: 1;
  min-width: 8.5rem;
  padding: 0.45rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--gl-border);
  background: var(--gl-white);
  color: var(--gl-text);
  font-size: 0.9rem;
  cursor: pointer;
}

.select-mes-ano-arm-bi:focus {
  outline: none;
  border-color: var(--gl-primary);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
}

.btn-cal-bi {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--gl-primary);
  border-radius: 6px;
  background: var(--gl-white);
  font-size: 0.85rem;
  color: var(--gl-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cal-bi:hover {
  background: var(--gl-light);
  border-color: var(--gl-primary-dark);
  color: var(--gl-primary-dark);
}

.btn-cal-bi.btn-aplicar-bi {
  background: var(--gl-primary);
  border-color: var(--gl-primary);
  color: var(--gl-white);
}

.btn-cal-bi.btn-aplicar-bi:hover {
  background: var(--gl-primary-dark);
  border-color: var(--gl-primary-dark);
  color: var(--gl-white);
}

.bi-gligl__btn-refresh {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  border: 1px solid var(--gl-border);
  background: var(--gl-white);
  color: var(--gl-primary);
  cursor: pointer;
  align-self: center;
}

.bi-gligl__btn-refresh:hover:not(:disabled) {
  background: var(--gl-light);
  border-color: var(--gl-primary);
}

.bi-gligl__error {
  color: #c0392b;
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
  flex-shrink: 0;
}

.bi-gligl__hint {
  color: var(--gl-text-muted);
  font-size: 0.85rem;
  margin: 0 0 0.55rem;
  padding: 0.55rem 0.75rem;
  background: var(--gl-light);
  border-radius: 8px;
  border: 1px solid var(--gl-primary);
  opacity: 0.95;
  flex-shrink: 0;
}

.bi-gligl__kpis {
  display: grid;
  width: 100%;
  box-sizing: border-box;
  /* Uma linha de 9 cards; largura mínima maior para títulos longos em PT — scroll horizontal se precisar */
  grid-template-columns: repeat(9, minmax(148px, 1fr));
  gap: 0.45rem 0.5rem;
  margin-bottom: 0.55rem;
  flex-shrink: 0;
  align-items: stretch;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  padding-bottom: 4px;
}

/* KPIs: <article> + <h2> + <p> (sem canvas). Valor com margin-top:auto gruda na base igual em todos os cards. */
.bi-gligl__kpi {
  container-type: inline-size;
  background: var(--gl-card);
  border-radius: 10px;
  padding: 0.5rem 0.5rem 0.55rem;
  border: 1px solid var(--gl-border);
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.06);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-width: 0;
  min-height: 9rem;
  box-sizing: border-box;
}

.bi-gligl__kpi-label {
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--gl-text-muted);
  white-space: pre-line;
  overflow-wrap: break-word;
  word-break: normal;
  text-align: left;
}

.bi-gligl__kpi-value {
  flex: 0 0 auto;
  align-self: stretch;
  width: 100%;
  margin: 0;
  margin-top: auto;
  padding: 0;
  padding-top: 0.35rem;
  font-size: var(--gl-num-center);
  font-weight: 800;
  color: var(--gl-primary);
  line-height: 1.08;
  overflow-wrap: break-word;
  word-break: normal;
  text-align: left;
  box-sizing: border-box;
}

.bi-gligl__kpi-sub {
  flex: 0 0 auto;
  margin: 0.15rem 0 0;
  padding: 0;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--gl-text-muted);
  line-height: 1.2;
  text-align: left;
}

.bi-gligl__chart-rows {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.bi-gligl__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
  margin-bottom: 0.65rem;
}

.bi-gligl__chart-rows > .bi-gligl__row {
  flex: 1 1 0;
  min-height: 0;
  margin-bottom: 0;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .bi-gligl__row {
    grid-template-columns: 1fr;
  }

  .bi-gligl__chart-rows > .bi-gligl__row {
    flex: 1 1 auto;
  }
}

.bi-gligl__card {
  background: var(--gl-card);
  border-radius: 12px;
  border: 1px solid var(--gl-border);
  padding: 0.6rem 0.7rem;
  box-shadow: 0 2px 12px rgba(0, 102, 255, 0.07);
}

.bi-gligl__chart-rows .bi-gligl__card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.bi-gligl__chart-rows .bi-gligl__card:has(.bi-gligl__sla-body) {
  overflow: visible;
}

.bi-gligl.bi-gligl--fullscreen .bi-gligl__chart-rows .bi-gligl__card:has(.bi-gligl__sla-body),
.bi-gligl:fullscreen .bi-gligl__chart-rows .bi-gligl__card:has(.bi-gligl__sla-body),
.bi-gligl:-webkit-full-screen .bi-gligl__chart-rows .bi-gligl__card:has(.bi-gligl__sla-body),
.bi-gligl:-moz-full-screen .bi-gligl__chart-rows .bi-gligl__card:has(.bi-gligl__sla-body) {
  /* Só corta estouro horizontal; overflow-y:hidden no body sumia o canvas do donut (altura flex). */
  overflow-x: hidden;
  overflow-y: visible;
}

.bi-gligl__card-title {
  margin: 0 0 0.4rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gl-primary);
  line-height: 1.25;
  flex-shrink: 0;
}

.bi-gligl__card-title--center {
  text-align: center;
  width: 100%;
}

.bi-gligl__card-ref {
  margin: -0.2rem 0 0.45rem;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--gl-muted, #5a6478);
  text-align: center;
  line-height: 1.3;
}

.bi-gligl__chart-wrap {
  position: relative;
  min-height: var(--gl-chart-h);
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
}

.bi-gligl__chart-wrap--donut {
  min-height: calc(var(--gl-chart-h) + 10px);
}

.bi-gligl__chart-wrap--hbar {
  min-height: var(--gl-chart-h-hbar);
  max-height: none;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Donut SLA — cresce com a altura útil da linha */
.bi-gligl__sla-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  min-height: 0;
}

.bi-gligl__chart-rows .bi-gligl__sla-body {
  flex: 1 1 0;
  min-height: 0;
  justify-content: flex-start;
  overflow: visible;
  gap: 0.35rem;
  align-items: stretch;
}

.bi-gligl.bi-gligl--fullscreen .bi-gligl__chart-rows .bi-gligl__sla-body,
.bi-gligl:fullscreen .bi-gligl__chart-rows .bi-gligl__sla-body,
.bi-gligl:-webkit-full-screen .bi-gligl__chart-rows .bi-gligl__sla-body,
.bi-gligl:-moz-full-screen .bi-gligl__chart-rows .bi-gligl__sla-body {
  overflow: visible;
  max-height: none;
}

/* Área flexível entre título e legenda: o donut usa o maior quadrado que cabe (cqmin). */
.bi-gligl__sla-chart-grow {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  width: 100%;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bi-gligl__sla-chart {
  position: relative;
  width: 168px;
  height: 168px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
  background: var(--gl-white);
  border-radius: 50%;
}

/*
 * Donut dentro do grow: lado = min(largura útil, altura útil, teto).
 * Navegadores sem cqmin: fallback por % da largura do wrapper.
 */
.bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart {
  width: min(100%, var(--gl-sla-donut), 85vmin);
  height: auto;
  aspect-ratio: 1;
  max-width: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  margin: 0;
}

@supports (width: 1cqmin) {
  .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart {
    width: min(100cqmin, var(--gl-sla-donut), 92vmin);
    max-height: none;
  }
}

.bi-gligl.bi-gligl--fullscreen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart,
.bi-gligl:fullscreen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart,
.bi-gligl:-webkit-full-screen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart,
.bi-gligl:-moz-full-screen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart {
  width: min(100%, var(--gl-sla-donut), 88vmin);
}

@supports (width: 1cqmin) {
  .bi-gligl.bi-gligl--fullscreen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart,
  .bi-gligl:fullscreen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart,
  .bi-gligl:-webkit-full-screen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart,
  .bi-gligl:-moz-full-screen .bi-gligl__chart-rows .bi-gligl__sla-chart-grow .bi-gligl__sla-chart {
    width: min(100cqmin, var(--gl-sla-donut), 96vmin);
  }
}

.bi-gligl__sla-chart canvas {
  position: relative;
  z-index: 0;
  max-width: 100%;
  max-height: 100%;
}

.bi-gligl__sla-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  font-weight: 800;
  font-size: var(--gl-num-center);
  color: var(--gl-text);
  pointer-events: none;
  z-index: 2;
  line-height: 1;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 44%;
  height: 44%;
  max-width: 6.75rem;
  max-height: 6.75rem;
  box-sizing: border-box;
}

/* Uma única linha horizontal com todos os itens (rolagem suave se faltar largura). */
.bi-gligl__sla-legend {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.45rem 0.75rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.25rem 0.1rem 0.35rem;
  flex: 0 0 auto;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.bi-gligl__sla-legend-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  flex: 0 0 auto;
  min-width: 0;
}

.bi-gligl__sla-legend-swatch {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(10, 22, 40, 0.12);
}

/* Uma linha: "Antecipado9 (12%)" — sem quebra entre rótulo e números */
.bi-gligl__sla-legend-text {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  line-height: 1.2;
  text-align: left;
}

.bi-gligl__sla-legend-label {
  flex: 0 0 auto;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--gl-text);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.bi-gligl__sla-legend-meta {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--gl-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.bi-gligl__sla-legend-count {
  font-weight: 700;
}

.bi-gligl__sla-legend-paren {
  font-weight: 600;
  opacity: 0.92;
}

.bi-gligl:fullscreen .bi-gligl__sla-legend,
.bi-gligl:-webkit-full-screen .bi-gligl__sla-legend,
.bi-gligl:-moz-full-screen .bi-gligl__sla-legend,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__sla-legend {
  gap: 0.5rem 0.95rem;
  padding: 0.45rem 0.15rem 0.5rem;
  justify-content: center;
}

.bi-gligl:fullscreen .bi-gligl__sla-legend-swatch,
.bi-gligl:-webkit-full-screen .bi-gligl__sla-legend-swatch,
.bi-gligl:-moz-full-screen .bi-gligl__sla-legend-swatch,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__sla-legend-swatch {
  width: clamp(11px, 0.95vw, 15px);
  height: clamp(11px, 0.95vw, 15px);
}

.bi-gligl:fullscreen .bi-gligl__sla-legend-label,
.bi-gligl:-webkit-full-screen .bi-gligl__sla-legend-label,
.bi-gligl:-moz-full-screen .bi-gligl__sla-legend-label,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__sla-legend-label {
  font-size: clamp(13px, 1.05vw, 16px);
}

.bi-gligl:fullscreen .bi-gligl__sla-legend-meta,
.bi-gligl:-webkit-full-screen .bi-gligl__sla-legend-meta,
.bi-gligl:-moz-full-screen .bi-gligl__sla-legend-meta,
.bi-gligl.bi-gligl--fullscreen .bi-gligl__sla-legend-meta {
  font-size: clamp(12px, 0.98vw, 15px);
}
</style>

<!--
  Tooltip external — padrão do donut SLA no BIPage: fundo #272A2F, título branco,
  linha de valor com quadrado da cor da fatia e borda branca (como o tooltip nativo do Chart).
-->
<style>
/* KPI / miolo do donut em tela cheia: font-size via :style (glKpiValueFontStyle / glSlaCenterFontStyle)
 * para não competir com !important e para seguir o ResizeObserver do painel. */

/* Fora do scoped: neutralizar herança de color do .bi-gligl (texto escuro do tema claro). */
.bi-gligl .bi-gligl__sla-tooltip-html {
  position: absolute;
  z-index: 40;
  pointer-events: none;
  min-width: 120px;
  max-width: 300px;
  padding: 12px;
  border-radius: 6px;
  background: #272a2f;
  color: #e2e4e8;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s ease;
  text-align: left;
}

.bi-gligl .bi-gligl__sla-tooltip-html__title {
  color: #ffffff;
  font-weight: 600;
  margin: 0 0 8px;
}

.bi-gligl .bi-gligl__sla-tooltip-html__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.bi-gligl .bi-gligl__sla-tooltip-html__swatch {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border: 1px solid #ffffff;
  border-radius: 1px;
  box-sizing: border-box;
}

/* Cinza mais claro que #8B8E94 para contraste legível no #272A2F */
.bi-gligl .bi-gligl__sla-tooltip-html__value {
  color: #d1d5db;
  font-weight: 400;
  margin: 0;
}

.bi-gligl .bi-gligl__sla-tooltip-html__value--solo {
  padding-left: 0;
}
</style>
