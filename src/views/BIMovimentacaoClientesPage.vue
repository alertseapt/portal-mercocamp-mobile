<template>
  <div
    id="bi-movimentacao-page-root"
    ref="pageRoot"
    class="bi-page bi-movimentacao-clientes-page"
    :class="[
      biTheme === 'light' ? 'bi-theme-light' : 'bi-theme-dark',
      {
        'bi-mov-fs-mode': biMovTvLayout,
        'bi-mov--embed-tv': embedTvLayout,
        'bi-mov--painel-stack': painelStackMode,
      },
    ]"
  >
    <div v-if="loading" class="bi-loading-overlay">
      <div class="bi-loading-canvas">
        <i
          class="fas fa-spinner fa-spin bi-loading-icon"
          aria-hidden="true"
        ></i>
        <p class="bi-loading-message">Consultando dbmercocamp (wjt / wgu)…</p>
      </div>
    </div>

    <transition name="bi-mov-toast-fade">
      <div v-if="trimestreCarregando" class="bi-mov-toast-overlay">
        <div class="bi-mov-toast-loading">
          <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
          <span>Consultando trimestre…</span>
        </div>
      </div>
    </transition>

    <header class="bi-ag-header">
      <div class="bi-ag-header-titles">
        <h1 class="bi-ag-title">
          <i class="fas fa-right-left" aria-hidden="true"></i>
          Movimentação de clientes
        </h1>
        <p class="bi-ag-subtitle">
          Período: <strong>{{ periodoDescricao }}</strong> — lista:
          <strong>{{ tituloListaCurto }}</strong>
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
            biMovTvLayout ? 'Sair da tela cheia' : 'Tela cheia (painel / TV)'
          "
          @click="toggleFullscreen"
        >
          <i
            :class="biMovTvLayout ? 'fas fa-compress' : 'fas fa-expand'"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          class="bi-ag-btn-refresh"
          :disabled="loading || !podeConsultar"
          title="Atualizar"
          @click="fetchData({ force: true })"
        >
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" />
        </button>
      </div>
    </header>

    <div class="bi-ag-toolbar bi-ag-toolbar-grid">
      <label class="bi-ag-filter-label">
        <span>Período de análise</span>
        <select
          :value="periodoPreset"
          class="bi-ag-select"
          :disabled="loading"
          @change="onPeriodoPresetSelect($event)"
        >
          <option v-for="p in periodoOpcoes" :key="p.id" :value="p.id">
            {{ p.label }}
          </option>
        </select>
      </label>

      <template v-if="periodoPreset === 'trimestre'">
        <label class="bi-ag-filter-label">
          <span>Ano</span>
          <select
            :value="trimestreAno"
            class="bi-ag-select"
            :disabled="loading"
            @change="onTrimestreAnoSelect($event)"
          >
            <option v-for="y in anosTrimestreOpcoes" :key="'y-' + y" :value="y">
              {{ y }}
            </option>
          </select>
        </label>
        <label class="bi-ag-filter-label">
          <span>Trimestre</span>
          <select
            :value="trimestreNum"
            class="bi-ag-select"
            :disabled="loading"
            @change="onTrimestreNumSelect($event)"
          >
            <option
              v-for="t in trimestreOpcoes"
              :key="'t-' + t.val"
              :value="t.val"
            >
              {{ t.label }}
            </option>
          </select>
        </label>
      </template>

      <template v-if="periodoPreset === 'custom'">
        <label class="bi-ag-filter-label">
          <span>Início</span>
          <input
            v-model="dataInicioIso"
            type="date"
            class="bi-mov-input-date"
            :disabled="loading"
            @change="fetchData"
          />
        </label>
        <label class="bi-ag-filter-label">
          <span>Fim</span>
          <input
            v-model="dataFimIso"
            type="date"
            class="bi-mov-input-date"
            :disabled="loading"
            @change="fetchData"
          />
        </label>
      </template>

      <div
        class="bi-ag-filter-label bi-ag-toggle-block"
        role="group"
        :aria-label="'Saídas wgu: incluir todos os status'"
      >
        <span>Saídas (wgu)</span>
        <div class="bi-ag-toggle-row">
          <span id="bi-mov-wgu-status-label" class="bi-ag-toggle-row-text">
            Todos os status
          </span>
          <button
            type="button"
            class="bi-ag-toggle"
            :class="{ 'bi-ag-toggle--on': statusAll }"
            role="switch"
            :aria-checked="statusAll"
            aria-labelledby="bi-mov-wgu-status-label"
            :title="
              statusAll
                ? 'Desativar: voltar só pedidos ATIVO'
                : 'Ativar: incluir qualquer status na wgu'
            "
            :disabled="loading"
            @click="toggleStatusAll"
          >
            <span class="bi-ag-toggle-knob" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="bi-ag-error">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      {{ error }}
    </div>

    <section
      v-if="resumo && !error"
      class="bi-ag-kpi-grid bi-mov-kpi-grid"
      aria-label="Indicadores por recorte"
    >
      <button
        v-for="seg in segmentosCards"
        :key="seg.id"
        type="button"
        class="bi-ag-kpi-card bi-mov-kpi-card-btn"
        :class="classesKpi(seg.id)"
        :title="'Filtrar lista: ' + seg.rotulo"
        @click="selecionarSegmento(seg.id)"
      >
        <div class="bi-ag-kpi-head">
          <span class="bi-ag-kpi-titulo">{{ seg.label }}</span>
        </div>
        <div class="bi-ag-kpi-valor">{{ fmtInt(resumo[seg.key]) }}</div>
      </button>
    </section>

    <section class="bi-ag-chart-card bi-mov-list-card">
      <div class="bi-mov-list-header">
        <h2 class="bi-ag-chart-title">
          {{ tituloLista }} ({{ fmtInt(clientesFiltrados.length) }})
        </h2>
        <button
          v-if="clientesFiltrados.length"
          type="button"
          class="bi-mov-btn-export-excel"
          title="Exportar lista para Excel"
          :disabled="loading"
          @click="exportarExcel"
        >
          <i class="fas fa-file-excel" aria-hidden="true"></i>
          Exportar Excel
        </button>
      </div>
      <div
        v-if="clientesFiltrados.length"
        ref="movTableScrollRef"
        class="bi-mov-table-scroll"
      >
        <table class="bi-mov-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CNPJ</th>
              <th>Razão social (Corpem)</th>
              <th>Razão social (HUB)</th>
              <th>Nome reduzido</th>
              <th>Estabelecimento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in clientesFiltrados" :key="row.no_seq">
              <td>{{ row.no_seq }}</td>
              <td class="bi-mov-cnpj">
                {{ formatCnpjExibicao(row.cnpj_cpf) }}
              </td>
              <td>{{ row.nome_cliente }}</td>
              <td>{{ row.razao_social_cobranca || '—' }}</td>
              <td>{{ row.nome_reduzido }}</td>
              <td>{{ row.estabelecimento }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-else-if="resumo && !loading && !error && contagemSegmentoAtivo === 0"
        class="bi-ag-chart-empty"
      >
        Nenhum cliente neste recorte ({{ tituloLista.toLowerCase() }}).
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import ExcelJS from 'exceljs'
import {
  movimentacaoWarmCacheGetOrWait,
  movimentacaoWarmCacheSet,
  movimentacaoWarmCacheClear,
  scheduleMovimentacaoWarmPrefetch,
} from '@/services/biMovimentacaoWarmCache.js'

/** Alinhado ao SLA (`BIPage`): refresh em painel / tela cheia sem bloquear a UI. */
const MOV_PANEL_DATA_REFRESH_SEC = 5 * 60

/** Mesma ideia do back: evita !!\"0\" === true e strings vindas do MySQL/json. */
function normMovFlag(v) {
  if (v === true || v === 1) return true
  if (v === false || v === 0 || v == null) return false
  if (typeof v === 'string') return /^1$|^true$/i.test(v.trim())
  const n = Number(v)
  return !Number.isNaN(n) && n === 1
}

/** Chave cnpj_cpf pode variar no JSON (proxy/driver). */
function pickCnpjClienteRow(r) {
  if (!r || typeof r !== 'object') return ''
  const key = Object.keys(r).find(k => /^cnpj_cpf$/i.test(k))
  if (key == null) return ''
  const v = r[key]
  return v != null && String(v).trim() !== '' ? String(v).trim() : ''
}

/** CNPJ (14 dígitos) com máscara; CPF (11) ou outro formato devolve limpo ou original. */
function formatCnpjExibicao(raw) {
  const s = String(raw == null ? '' : raw).trim()
  if (!s) return '—'
  const d = s.replace(/\D/g, '')
  if (d.length === 14) {
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  if (d.length === 11) {
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }
  return s
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function isoFirstDayOfMonth() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${m}-01`
}

function addDays(iso, delta) {
  const t = new Date(`${iso}T12:00:00`)
  t.setDate(t.getDate() + delta)
  return t.toISOString().slice(0, 10)
}

function trimestreAtualDefaults() {
  const now = new Date()
  const y = now.getFullYear()
  const mes = now.getMonth() + 1
  const q = Math.min(4, Math.max(1, Math.ceil(mes / 3)))
  return { ano: y, num: q }
}

export default {
  name: 'BIMovimentacaoClientesPage',
  emits: ['notification', 'page-ready'],

  props: {
    /** Quando o painel BI alterna faces em tela cheia (documento em fullscreen). */
    embedTvLayout: { type: Boolean, default: false },
    /**
     * Painel fora de tela cheia: blocos empilhados — evita altura fixa 100vh que
     * esconde o trecho abaixo do comparativo de agendamentos.
     */
    painelStackMode: { type: Boolean, default: false },
    /** Documento em fullscreen no `BIPainelPage` — mantém refresh em 2º plano nas outras faces. */
    painelFsActive: { type: Boolean, default: false },
  },

  data() {
    const tDef = trimestreAtualDefaults()
    return {
      loading: false,
      trimestreCarregando: false,
      error: null,
      resumo: null,
      parametros: null,
      /** Linhas do escopo com tem_wjt/tem_wgu — um único carregamento por período; cards filtram aqui. */
      clientesBase: [],
      /** Cache do modo trimestre: ano + statusAll + linhas com flags q1–q4 (evita nova consulta ao mudar só o T). */
      trimestrePacote: null,
      /**
       * Pacotes por ano+status mantidos ao sair da visão trimestre — evita nova ida ao banco ao voltar
       * de "Mês atual" etc. com o mesmo ano/status (chave: `${ano}|0|1`).
       */
      trimestrePacoteByKey: {},
      dataInicioIso: isoFirstDayOfMonth(),
      dataFimIso: isoToday(),
      statusAll: false,
      lastUpdated: null,
      listaAtiva: 'sem_movimentacao',
      periodoPreset: 'mes',
      trimestreAno: tDef.ano,
      trimestreNum: tDef.num,
      trimestreOpcoes: [
        { val: 1, label: '1º trimestre (jan–mar)' },
        { val: 2, label: '2º trimestre (abr–jun)' },
        { val: 3, label: '3º trimestre (jul–set)' },
        { val: 4, label: '4º trimestre (out–dez)' },
      ],
      periodoOpcoes: [
        { id: 'mes', label: 'Mês atual' },
        { id: 'hoje', label: 'Hoje' },
        { id: '7', label: 'Últimos 7 dias' },
        { id: '30', label: 'Últimos 30 dias' },
        { id: 'trimestre', label: 'Por trimestre' },
        { id: 'custom', label: 'Personalizado' },
      ],
      isFullscreen: false,
      biTheme: (() => {
        try {
          return localStorage.getItem('bi-theme') || 'dark'
        } catch {
          return 'dark'
        }
      })(),
      /** Evita GET duplicado com os mesmos parâmetros (ex.: voltar à aba / rotação do painel). */
      _movLastFetchSignature: '',
      _movBgLoadInFlight: false,
      dataUpdateCountdown: 0,
      _intervalMovData: null,
    }
  },

  computed: {
    /** Painel em TV ou fullscreen local — escala KPIs e tabela. */
    biMovTvLayout() {
      return this.isFullscreen || this.embedTvLayout
    },
    /** Igual ao SLA: atualizar dados com painel em FS mesmo fora desta face. */
    movDataRefreshShouldRun() {
      return this.isFullscreen || this.embedTvLayout || this.painelFsActive
    },
    podeConsultar() {
      return (
        /^\d{4}-\d{2}-\d{2}$/.test(this.dataInicioIso) &&
        /^\d{4}-\d{2}-\d{2}$/.test(this.dataFimIso) &&
        this.dataInicioIso <= this.dataFimIso
      )
    },
    lastUpdatedDisplay() {
      if (!this.lastUpdated) return null
      try {
        return new Date(this.lastUpdated).toLocaleString('pt-BR')
      } catch {
        return null
      }
    },
    periodoDescricao() {
      return `${this.formatBr(this.dataInicioIso)} — ${this.formatBr(
        this.dataFimIso
      )}`
    },
    segmentosCards() {
      return [
        {
          id: 'escopo',
          key: 'total_escopo',
          label: 'Ativos na wcl',
          rotulo:
            'Cadastrados na wcl com situação Ativo — universo completo, sem filtro de CNPJ do portal',
        },
        {
          id: 'sem_movimentacao',
          key: 'sem_movimentacao',
          label: 'Sem movimentação',
          rotulo: 'Sem entrada (wjt) nem saída (wgu) no período',
        },
        {
          id: 'com_movimentacao',
          key: 'com_movimentacao',
          label: 'Com movimentação',
          rotulo: 'Com entrada ou saída no período',
        },
        {
          id: 'apenas_entrada',
          key: 'apenas_entrada',
          label: 'Só entrada (wjt)',
          rotulo: 'Entrada no período, sem saída no período',
        },
        {
          id: 'apenas_saida',
          key: 'apenas_saida',
          label: 'Só saída (wgu)',
          rotulo: 'Saída no período, sem entrada no período',
        },
        {
          id: 'entrada_e_saida',
          key: 'entrada_e_saida',
          label: 'Entrada e saída',
          rotulo: 'Entrada e saída no período',
        },
      ]
    },
    tituloLista() {
      const s = this.segmentosCards.find(x => x.id === this.listaAtiva)
      return s ? s.rotulo : 'Clientes'
    },
    tituloListaCurto() {
      const s = this.segmentosCards.find(x => x.id === this.listaAtiva)
      return s ? s.label : '—'
    },
    contagemSegmentoAtivo() {
      if (!this.resumo) return 0
      const s = this.segmentosCards.find(x => x.id === this.listaAtiva)
      return s ? Number(this.resumo[s.key]) || 0 : 0
    },
    /** Anos para o filtro de trimestre (futuro + retaguarda). */
    anosTrimestreOpcoes() {
      const y = new Date().getFullYear()
      const anos = []
      for (let a = y + 1; a >= y - 15; a -= 1) anos.push(a)
      return anos
    },
    nomeArquivoFiltro() {
      const mapa = {
        escopo: 'Todos_Ativos',
        sem_movimentacao: 'Sem_Movimentação',
        com_movimentacao: 'Com_Movimentação',
        apenas_entrada: 'Só_Entrada',
        apenas_saida: 'Só_Saída',
        entrada_e_saida: 'Entrada_e_Saída',
      }
      return mapa[this.listaAtiva] || this.listaAtiva
    },
    nomeArquivoPeriodo() {
      const meses = [
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
      const [aI, mI, dI] = this.dataInicioIso.split('-').map(Number)
      const [aF, mF, dF] = this.dataFimIso.split('-').map(Number)
      if (!aI || !mI || !aF || !mF) return this.dataInicioIso
      const mesIni = meses[mI - 1]
      const mesFim = meses[mF - 1]
      if (aI === aF && mI === mF) return `${mesIni}_${aI}`
      if (aI === aF) return `${mesIni}_a_${mesFim}_${aI}`
      return `${mesIni}_${aI}_a_${mesFim}_${aF}`
    },
    clientesFiltrados() {
      return this.filtrarMovimentacaoBase(this.clientesBase, this.listaAtiva)
    },
  },

  watch: {
    biMovTvLayout() {
      this.$nextTick(() => this.syncMovRefreshAndScroll())
    },
    painelFsActive() {
      this.$nextTick(() => this.syncMovRefreshAndScroll())
    },
    listaAtiva() {
      if (this.biMovTvLayout)
        this.$nextTick(() => this.resetMovTableScrollTop())
    },
    loading(cur, prev) {
      if (prev && !cur && this.biMovTvLayout) {
        this.$nextTick(() => this.resetMovTableScrollTop())
      }
    },
  },

  mounted() {
    this._fsHandler = () => this.onFullscreenChange()
    document.addEventListener('fullscreenchange', this._fsHandler)
    this.aplicarDatasDoPreset(false)
    this.fetchData()
    scheduleMovimentacaoWarmPrefetch()
    this.$nextTick(() => {
      this.syncMovRefreshAndScroll()
      this.$emit('page-ready')
    })
  },

  activated() {
    if (this.periodoPreset === 'trimestre') {
      const p = this.resolveTrimestrePacoteParaUi()
      if (p) {
        this.aplicarTrimestreLocal()
        this._movLastFetchSignature = this.movQuerySignature()
        this.$nextTick(() => {
          this.syncMovRefreshAndScroll()
          this.$emit('page-ready')
        })
        return
      }
    }
    if (this.podeConsultar) this.fetchData()
    this.$nextTick(() => {
      this.syncMovRefreshAndScroll()
      this.$emit('page-ready')
    })
  },

  beforeUnmount() {
    this.stopMovTableAutoScroll()
    this.movStopDataRefreshTick()
    if (this._fsHandler) {
      document.removeEventListener('fullscreenchange', this._fsHandler)
    }
  },

  methods: {
    classesKpi(segId) {
      return {
        'bi-ag-kpi-card--destaque': this.listaAtiva === segId,
        'bi-mov-kpi-card--warn':
          segId === 'sem_movimentacao' && this.listaAtiva === segId,
      }
    },

    biFullscreenRootEl() {
      const r = this.$refs.pageRoot
      return r instanceof Element
        ? r
        : this.$el instanceof Element
          ? this.$el
          : null
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
        } else {
          await document.exitFullscreen()
        }
      } catch (e) {
        console.warn('[BI-movimentacao] Fullscreen:', e?.message || e)
      }
    },

    onFullscreenChange() {
      const fs = document.fullscreenElement
      const root = this.biFullscreenRootEl()
      this.isFullscreen = this.isOurFullscreenElement(fs, root)
    },

    /** Igual ao SLA (`BIPage.ensureSlaScrollInterval`): rolagem contínua só em tela cheia / painel TV. */
    movTableScrollEl() {
      const w = this.$refs.movTableScrollRef
      return w && (w.$el || w)
    },

    resetMovTableScrollTop() {
      const el = this.movTableScrollEl()
      if (el && typeof el.scrollTop !== 'undefined') el.scrollTop = 0
    },

    stopMovTableAutoScroll() {
      if (this._intervalMovTableScroll) {
        clearInterval(this._intervalMovTableScroll)
        this._intervalMovTableScroll = null
      }
    },

    ensureMovTableAutoScroll() {
      if (this._intervalMovTableScroll) return
      const scrollStep = 1
      const scrollIntervalMs = 50
      this._intervalMovTableScroll = setInterval(() => {
        if (!this.biMovTvLayout) return
        const el = this.movTableScrollEl()
        if (!el || typeof el.scrollTop === 'undefined') return
        if (el.scrollHeight <= el.clientHeight) return
        el.scrollTop += scrollStep
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        if (atBottom) el.scrollTop = 0
      }, scrollIntervalMs)
    },

    syncMovTableAutoScroll() {
      if (this.biMovTvLayout) {
        this.resetMovTableScrollTop()
        this.ensureMovTableAutoScroll()
      } else {
        this.stopMovTableAutoScroll()
        this.resetMovTableScrollTop()
      }
    },

    movQuerySignature() {
      if (this.periodoPreset === 'trimestre') {
        return `trim|${this.trimestreAno}|${this.trimestreNum}|${this.statusAll ? 1 : 0}`
      }
      return `rng|${this.dataInicioIso}|${this.dataFimIso}|${this.statusAll ? 1 : 0}`
    },

    trimestreCacheKey(ano, statusAll) {
      const a = Number(ano)
      const bit = statusAll === true || statusAll === 1 ? 1 : 0
      return Number.isNaN(a) ? `nan|${bit}` : `${a}|${bit}`
    },

    stashTrimestrePacoteIfAny() {
      const p = this.trimestrePacote
      if (
        !p ||
        !Array.isArray(p.rawRows) ||
        !p.resumo_trimestres ||
        Number.isNaN(Number(p.ano))
      ) {
        return
      }
      const k = this.trimestreCacheKey(p.ano, !!p.statusAll)
      this.trimestrePacoteByKey[k] = p
      this.enforceTrimestreCacheLimit(8)
    },

    enforceTrimestreCacheLimit(max) {
      const keys = Object.keys(this.trimestrePacoteByKey)
      const excess = keys.length - max
      for (let i = 0; i < excess; i++) {
        delete this.trimestrePacoteByKey[keys[i]]
      }
    },

    /** Reutiliza pacote em memória ou no mapa lateral — atualiza `trimestrePacote` quando veio do mapa. */
    resolveTrimestrePacoteParaUi() {
      if (this.periodoPreset !== 'trimestre') return null
      const pCur = this.trimestrePacote
      if (
        pCur &&
        (Number(pCur.ano) !== Number(this.trimestreAno) ||
          !!pCur.statusAll !== !!this.statusAll)
      ) {
        this.trimestrePacote = null
      }
      let p = this.trimestrePacote
      if (
        p &&
        Number(p.ano) === Number(this.trimestreAno) &&
        !!p.statusAll === !!this.statusAll
      ) {
        return p
      }
      const k = this.trimestreCacheKey(this.trimestreAno, !!this.statusAll)
      p = this.trimestrePacoteByKey[k]
      if (p) {
        this.trimestrePacote = p
        return p
      }
      this.trimestrePacote = null
      return null
    },

    /** Há dados em memória para o painel / dedupe (inclui consulta com 0 clientes na lista). */
    movHasCachedPayload() {
      if (this.trimestrePacote != null) return true
      if (this.lastUpdated != null) return true
      return Array.isArray(this.clientesBase) && this.clientesBase.length > 0
    },

    movEnsureDataRefreshTick() {
      if (this._intervalMovData) return
      this._intervalMovData = setInterval(() => {
        if (!this.movDataRefreshShouldRun) return
        if (this.dataUpdateCountdown > 0) this.dataUpdateCountdown--
        if (
          this.dataUpdateCountdown <= 0 &&
          !this.loading &&
          !this._movBgLoadInFlight &&
          this.podeConsultar
        ) {
          this.fetchData({ silent: true })
        }
      }, 1000)
    },

    movStopDataRefreshTick() {
      if (this._intervalMovData) {
        clearInterval(this._intervalMovData)
        this._intervalMovData = null
      }
      this.dataUpdateCountdown = 0
    },

    syncMovRefreshAndScroll() {
      if (this.movDataRefreshShouldRun) {
        this.movEnsureDataRefreshTick()
        if (
          this.dataUpdateCountdown <= 0 &&
          this._movLastFetchSignature &&
          this.movHasCachedPayload()
        ) {
          this.dataUpdateCountdown = MOV_PANEL_DATA_REFRESH_SEC
        }
      } else {
        this.movStopDataRefreshTick()
      }
      this.syncMovTableAutoScroll()
    },

    toggleBiTheme() {
      this.biTheme = this.biTheme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('bi-theme', this.biTheme)
      } catch {
        /* ignore */
      }
    },

    aplicarIntervaloTrimestre(ano, trimNum) {
      const y = Number(ano) || new Date().getFullYear()
      const q = Math.min(4, Math.max(1, Number(trimNum) || 1))
      const map = {
        1: [`${y}-01-01`, `${y}-03-31`],
        2: [`${y}-04-01`, `${y}-06-30`],
        3: [`${y}-07-01`, `${y}-09-30`],
        4: [`${y}-10-01`, `${y}-12-31`],
      }
      const pair = map[q]
      this.dataInicioIso = pair[0]
      this.dataFimIso = pair[1]
    },

    aplicarDatasDoPreset(fetch) {
      if (this.periodoPreset !== 'trimestre') {
        this.stashTrimestrePacoteIfAny()
        this.trimestrePacote = null
      }
      const hoje = isoToday()
      switch (this.periodoPreset) {
        case 'mes':
          this.dataInicioIso = isoFirstDayOfMonth()
          this.dataFimIso = hoje
          break
        case 'hoje':
          this.dataInicioIso = hoje
          this.dataFimIso = hoje
          break
        case '7':
          this.dataFimIso = hoje
          this.dataInicioIso = addDays(hoje, -6)
          break
        case '30':
          this.dataFimIso = hoje
          this.dataInicioIso = addDays(hoje, -29)
          break
        case 'trimestre':
          this.aplicarIntervaloTrimestre(this.trimestreAno, this.trimestreNum)
          break
        case 'custom':
        default:
          break
      }
      if (fetch && this.podeConsultar) this.fetchData()
    },

    applyTrimestreUiFromPacote() {
      if (this.periodoPreset !== 'trimestre') return
      this.aplicarIntervaloTrimestre(this.trimestreAno, this.trimestreNum)
      const p = this.resolveTrimestrePacoteParaUi()
      if (p) {
        this.aplicarTrimestreLocal()
        this._movLastFetchSignature = this.movQuerySignature()
        return
      }
      if (this.podeConsultar) this.fetchTrimestreComToast()
    },

    async fetchTrimestreComToast() {
      this.trimestreCarregando = true
      try {
        await this.fetchData({ toast: true })
      } finally {
        this.trimestreCarregando = false
      }
    },

    onTrimestreAnoSelect(ev) {
      const y = Number(ev?.target?.value)
      if (!Number.isNaN(y)) this.trimestreAno = y
      this.applyTrimestreUiFromPacote()
    },

    onTrimestreNumSelect(ev) {
      const n = Number(ev?.target?.value)
      if (!Number.isNaN(n)) this.trimestreNum = n
      this.applyTrimestreUiFromPacote()
    },

    aplicarTrimestreLocal() {
      const p = this.trimestrePacote
      if (!p || !Array.isArray(p.rawRows) || !p.resumo_trimestres) return
      if (
        Number(p.ano) !== Number(this.trimestreAno) ||
        !!p.statusAll !== !!this.statusAll
      ) {
        return
      }
      const qn = Math.min(4, Math.max(1, Number(this.trimestreNum) || 1))
      const q = String(qn)
      const rt = p.resumo_trimestres
      const slice = rt[q] ?? rt[qn] ?? null
      // Cópia rasa para garantir reatividade ao trocar T1–T4 (novo objeto por trimestre).
      this.resumo = slice && typeof slice === 'object' ? { ...slice } : null
      this.aplicarIntervaloTrimestre(this.trimestreAno, this.trimestreNum)
      this.clientesBase = p.rawRows.map(r => ({
        no_seq: r.no_seq,
        cnpj_cpf: pickCnpjClienteRow(r),
        nome_cliente: String(r.nome_cliente || '').trim(),
        razao_social_cobranca: String(r.razao_social_cobranca || '').trim(),
        nome_reduzido: String(r.nome_reduzido || '').trim(),
        estabelecimento: String(r.estabelecimento || '').trim(),
        tem_wjt: normMovFlag(
          r[`tem_wjt_q${q}`] !== undefined
            ? r[`tem_wjt_q${q}`]
            : r[`TEM_WJT_Q${q}`]
        ),
        tem_wgu: normMovFlag(
          r[`tem_wgu_q${q}`] !== undefined
            ? r[`tem_wgu_q${q}`]
            : r[`TEM_WGU_Q${q}`]
        ),
      }))
      this.lastUpdated = Date.now()
    },

    /**
     * Ao escolher "Por trimestre", fixa ano e nº do trimestre no **calendário atual**
     * (alinha à pré-busca `trimestres_ano` do ano corrente). Ano passado só consulta
     * o banco se o usuário alterar manualmente o ano depois.
     */
    onPeriodoPresetSelect(ev) {
      const v = ev?.target?.value
      if (v == null || v === '') return
      this.periodoPreset = String(v)
      if (this.periodoPreset === 'trimestre') {
        const tDef = trimestreAtualDefaults()
        this.trimestreAno = tDef.ano
        this.trimestreNum = tDef.num
        this.aplicarIntervaloTrimestre(this.trimestreAno, this.trimestreNum)
        const p = this.resolveTrimestrePacoteParaUi()
        if (p) {
          this.aplicarTrimestreLocal()
          this._movLastFetchSignature = this.movQuerySignature()
        } else if (this.podeConsultar) {
          this.fetchTrimestreComToast()
        }
        return
      }
      this.aplicarDatasDoPreset(true)
    },

    toggleStatusAll() {
      this.statusAll = !this.statusAll
      this.trimestrePacote = null
      this.trimestrePacoteByKey = {}
      movimentacaoWarmCacheClear()
      this.fetchData()
    },

    fmtInt(n) {
      return Math.round(Number(n) || 0).toLocaleString('pt-BR')
    },

    formatBr(iso) {
      if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
      const [y, m, d] = iso.split('-')
      return `${d}/${m}/${y}`
    },

    formatCnpjExibicao,

    async exportarExcel() {
      const rows = this.clientesFiltrados
      if (!rows.length) return

      const estabNomes = {
        ML: 'MATRIZ',
        CM: 'CIVIT',
        CV: 'CIVIT',
        CR: 'CARIACICA 1',
        C1: 'CARIACICA 1',
        C2: 'CARIACICA 2',
        VN: 'VIANA',
        C3: 'CARIACICA 3',
      }
      const nomeOrdem = [
        'MATRIZ',
        'CIVIT',
        'CARIACICA 1',
        'CARIACICA 2',
        'VIANA',
        'CARIACICA 3',
      ]
      const grouped = {}
      for (const r of rows) {
        const sigla = (r.estabelecimento || '').trim().toUpperCase()
        const nome = estabNomes[sigla] || sigla || 'Sem estabelecimento'
        if (!grouped[nome]) grouped[nome] = []
        grouped[nome].push(r)
      }
      const estabKeys = Object.keys(grouped).sort((a, b) => {
        const ia = nomeOrdem.indexOf(a)
        const ib = nomeOrdem.indexOf(b)
        const pa = ia >= 0 ? ia : nomeOrdem.length
        const pb = ib >= 0 ? ib : nomeOrdem.length
        return pa !== pb ? pa - pb : a.localeCompare(b, 'pt-BR')
      })

      const wb = new ExcelJS.Workbook()
      wb.creator = 'Portal Mercocamp'
      wb.created = new Date()

      const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E2228' },
      }
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      const headerAlign = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      }
      const estabFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF375A8C' },
      }
      const estabFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      const zebraFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F6FA' },
      }
      const borderThin = { style: 'thin', color: { argb: 'FFD2D7E1' } }
      const cellBorder = {
        top: borderThin,
        bottom: borderThin,
        left: borderThin,
        right: borderThin,
      }

      for (const estabName of estabKeys) {
        const sheetName = estabName
          .substring(0, 31)
          .replace(/[\\/*?[\]:]/g, '_')
        const ws = wb.addWorksheet(sheetName)

        ws.columns = [
          { header: 'CNPJ', key: 'cnpj', width: 22 },
          { header: 'Razão Social ( Corpem )', key: 'razao_wcl', width: 45 },
          { header: 'Razão Social ( HUB )', key: 'razao_cob', width: 45 },
          { header: 'ID', key: 'id', width: 8 },
        ]

        const titleRow = ws.insertRow(1, [
          `${estabName}  —  ${grouped[estabName].length} clientes`,
        ])
        ws.mergeCells(1, 1, 1, 4)
        titleRow.getCell(1).fill = estabFill
        titleRow.getCell(1).font = estabFont
        titleRow.getCell(1).alignment = {
          vertical: 'middle',
          horizontal: 'left',
        }
        titleRow.height = 26

        const subRow = ws.insertRow(2, [
          `Período: ${this.periodoDescricao}  |  Lista: ${this.tituloListaCurto}  |  Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        ])
        ws.mergeCells(2, 1, 2, 4)
        subRow.getCell(1).font = {
          italic: true,
          size: 9,
          color: { argb: 'FF555555' },
        }
        subRow.height = 18

        const hdrRow = ws.getRow(3)
        hdrRow.eachCell(cell => {
          cell.fill = headerFill
          cell.font = headerFont
          cell.alignment = headerAlign
          cell.border = cellBorder
        })
        hdrRow.height = 22

        const estabRows = grouped[estabName]
        for (let i = 0; i < estabRows.length; i++) {
          const r = estabRows[i]
          const dataRow = ws.addRow({
            cnpj: formatCnpjExibicao(r.cnpj_cpf),
            razao_wcl: r.nome_cliente || '',
            razao_cob: r.razao_social_cobranca || '',
            id: r.no_seq,
          })
          dataRow.eachCell(cell => {
            cell.alignment = { vertical: 'top', wrapText: true }
            cell.border = cellBorder
            if (i % 2 === 0) cell.fill = zebraFill
          })
        }

        ws.autoFilter = {
          from: { row: 3, column: 1 },
          to: { row: 3 + estabRows.length, column: 4 },
        }
        ws.views = [{ state: 'frozen', ySplit: 3 }]
      }

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Clientes_${this.nomeArquivoFiltro}_${this.nomeArquivoPeriodo}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    selecionarSegmento(id) {
      if (this.listaAtiva === id || this.loading || !this.podeConsultar) return
      this.listaAtiva = id
    },

    filtrarMovimentacaoBase(base, listaId) {
      const flag = normMovFlag
      const pred = {
        escopo: () => true,
        sem_movimentacao: r => !flag(r.tem_wjt) && !flag(r.tem_wgu),
        com_movimentacao: r => flag(r.tem_wjt) || flag(r.tem_wgu),
        apenas_entrada: r => flag(r.tem_wjt) && !flag(r.tem_wgu),
        apenas_saida: r => !flag(r.tem_wjt) && flag(r.tem_wgu),
        entrada_e_saida: r => flag(r.tem_wjt) && flag(r.tem_wgu),
      }
      const fn = pred[listaId] || pred.sem_movimentacao
      const estabOrdem = ['ML', 'CM', 'CV', 'CR', 'C1', 'C2', 'VN', 'C3']
      return base
        .filter(fn)
        .map(({ tem_wjt: _tj, tem_wgu: _tw, ...rest }) => rest)
        .sort((a, b) => {
          const ia = estabOrdem.indexOf((a.estabelecimento || '').toUpperCase())
          const ib = estabOrdem.indexOf((b.estabelecimento || '').toUpperCase())
          const pa = ia >= 0 ? ia : estabOrdem.length
          const pb = ib >= 0 ? ib : estabOrdem.length
          return pa !== pb
            ? pa - pb
            : (a.nome_cliente || '').localeCompare(
                b.nome_cliente || '',
                'pt-BR'
              )
        })
    },

    /**
     * Aplica corpo JSON da API ao estado (intervalo ou trimestres_ano).
     * Também grava no cache global para outras telas / trocas de filtro.
     */
    hydrateFromMovimentacaoResponse(data, signature) {
      if (!data || !data.success) return false
      if (data.trimestres_ano != null && data.resumo_trimestres) {
        const anoApi = Number(data.trimestres_ano)
        if (anoApi !== Number(this.trimestreAno)) {
          return false
        }
      }
      this.error = null
      this.parametros = data.parametros || null

      if (data.trimestres_ano != null && data.resumo_trimestres) {
        const anoApi = Number(data.trimestres_ano)
        this.trimestrePacote = {
          ano: anoApi,
          statusAll: !!this.statusAll,
          rawRows: Array.isArray(data.movimentacao_base)
            ? data.movimentacao_base
            : [],
          resumo_trimestres: data.resumo_trimestres,
        }
        const ck = this.trimestreCacheKey(
          this.trimestrePacote.ano,
          this.trimestrePacote.statusAll
        )
        this.trimestrePacoteByKey[ck] = this.trimestrePacote
        this.enforceTrimestreCacheLimit(8)
        this.aplicarTrimestreLocal()
      } else {
        this.trimestrePacote = null
        this.resumo = data.resumo || null
        if (
          Array.isArray(data.movimentacao_base) &&
          data.movimentacao_base.length > 0
        ) {
          this.clientesBase = data.movimentacao_base.map(r => ({
            no_seq: r.no_seq,
            cnpj_cpf: pickCnpjClienteRow(r),
            nome_cliente: String(r.nome_cliente || '').trim(),
            razao_social_cobranca: String(r.razao_social_cobranca || '').trim(),
            nome_reduzido: String(r.nome_reduzido || '').trim(),
            estabelecimento: String(r.estabelecimento || '').trim(),
            tem_wjt: normMovFlag(
              r.tem_wjt !== undefined ? r.tem_wjt : r.TEM_WJT
            ),
            tem_wgu: normMovFlag(
              r.tem_wgu !== undefined ? r.tem_wgu : r.TEM_WGU
            ),
          }))
        } else if (
          Array.isArray(data.clientes) &&
          data.clientes.length > 0 &&
          String(this.listaAtiva) === 'sem_movimentacao'
        ) {
          this.clientesBase = data.clientes.map(r => ({
            no_seq: r.no_seq,
            cnpj_cpf: pickCnpjClienteRow(r),
            nome_cliente: String(r.nome_cliente || '').trim(),
            razao_social_cobranca: String(r.razao_social_cobranca || '').trim(),
            nome_reduzido: String(r.nome_reduzido || '').trim(),
            estabelecimento: String(r.estabelecimento || '').trim(),
            tem_wjt: false,
            tem_wgu: false,
          }))
        } else {
          this.clientesBase = []
        }
        this.lastUpdated = Date.now()
      }

      this._movLastFetchSignature = signature
      movimentacaoWarmCacheSet(signature, data)
      if (this.movDataRefreshShouldRun) {
        this.dataUpdateCountdown = MOV_PANEL_DATA_REFRESH_SEC
      }
      return true
    },

    async fetchData(opts) {
      const options = typeof opts === 'object' && opts !== null ? opts : {}
      const silent = options.silent === true
      const force = options.force === true
      const toast = options.toast === true

      if (!this.podeConsultar) {
        if (!silent) {
          this.error =
            'Defina um período válido (início ≤ fim) em formato YYYY-MM-DD.'
        }
        return
      }

      const signature = this.movQuerySignature()

      if (silent && this._movBgLoadInFlight) return

      if (
        this.periodoPreset === 'trimestre' &&
        this.trimestrePacote &&
        (Number(this.trimestrePacote.ano) !== Number(this.trimestreAno) ||
          !!this.trimestrePacote.statusAll !== !!this.statusAll)
      ) {
        this.trimestrePacote = null
      }

      if (!force && !silent) {
        if (signature === this._movLastFetchSignature) {
          if (this.periodoPreset !== 'trimestre') {
            return
          }
          const pOk = this.resolveTrimestrePacoteParaUi()
          if (pOk) {
            this.aplicarTrimestreLocal()
            return
          }
        }
        if (this.periodoPreset === 'trimestre') {
          const p = this.resolveTrimestrePacoteParaUi()
          if (p) {
            this.aplicarTrimestreLocal()
            this._movLastFetchSignature = signature
            return
          }
        }
      }

      if (!force && !silent) {
        const warm = await movimentacaoWarmCacheGetOrWait(signature)
        if (warm && this.hydrateFromMovimentacaoResponse(warm, signature)) {
          return
        }
      }

      if (silent) this._movBgLoadInFlight = true
      else if (!toast) this.loading = true
      if (!silent) this.error = null
      try {
        const token =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem('token')
            : null
        const q = new URLSearchParams()
        if (this.periodoPreset === 'trimestre') {
          q.set('trimestres_ano', String(this.trimestreAno))
        } else {
          q.set('data_inicio', this.dataInicioIso)
          q.set('data_fim', this.dataFimIso)
        }
        if (this.statusAll) q.set('status', 'all')
        const qs = q.toString()
        const { data } = await axios.get(`/bi/movimentacao-clientes?${qs}`, {
          timeout: 180000,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Cache-Control': 'no-cache',
          },
        })
        if (!data.success) {
          throw new Error(data.error || 'Falha na consulta')
        }
        if (!this.hydrateFromMovimentacaoResponse(data, signature)) {
          throw new Error(
            'Resposta incompatível com o filtro atual — tente novamente.'
          )
        }
      } catch (e) {
        const d = e.response && e.response.data
        const status = e.response && e.response.status
        let msg =
          (d && (d.error || d.message)) || e.message || 'Erro ao carregar'
        if (status === 401) {
          msg =
            (d && (d.error || d.message)) ||
            'Não autorizado — faça login novamente ou verifique o token.'
        }
        if (!silent) {
          this.error = msg
          this.resumo = null
          this.clientesBase = []
          this.trimestrePacote = null
          this._movLastFetchSignature = ''
          this.$emit('notification', msg, 'error')
        } else {
          console.warn(
            '[BI-movimentacao] atualização em segundo plano falhou:',
            msg
          )
          if (this.movDataRefreshShouldRun) {
            this.dataUpdateCountdown = Math.min(180, MOV_PANEL_DATA_REFRESH_SEC)
          }
        }
      } finally {
        if (silent) this._movBgLoadInFlight = false
        else if (!toast) this.loading = false
      }
    },
  },
}
</script>

<style scoped>
/* Shell espelhado em BIAgendamentosPage (Análise de Agendamentos) */
.bi-page.bi-movimentacao-clientes-page {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: calc(100vh - 88px);
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  background: #202326;
  color: #ffffff;
  padding: 1.5rem;
  box-sizing: border-box;
}

/* Painel (modo empilhado): altura conforme conteúdo para aparecer entre os outros BIs */
.bi-page.bi-movimentacao-clientes-page.bi-mov--painel-stack {
  min-height: min(560px, 70vh);
  height: auto;
  max-height: none;
}

.bi-page.bi-movimentacao-clientes-page:fullscreen,
.bi-page.bi-movimentacao-clientes-page:-webkit-full-screen {
  min-height: 100vh;
  height: 100vh;
  max-height: 100vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.bi-page.bi-movimentacao-clientes-page:fullscreen .bi-ag-chart-card,
.bi-page.bi-movimentacao-clientes-page:-webkit-full-screen .bi-ag-chart-card {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.bi-page.bi-movimentacao-clientes-page:fullscreen .bi-mov-table-scroll,
.bi-page.bi-movimentacao-clientes-page:-webkit-full-screen
  .bi-mov-table-scroll {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}

/* Painel: fullscreen no ancestral — layout flexível como em :fullscreen */
.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv {
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

.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv .bi-ag-header,
.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv .bi-ag-toolbar {
  flex-shrink: 0;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv .bi-ag-error {
  flex-shrink: 0;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv .bi-mov-kpi-grid {
  flex-shrink: 0;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv .bi-ag-chart-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov--embed-tv .bi-mov-table-scroll {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}

/* Tela cheia: descrições e números dos KPIs maiores */
.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-mov-kpi-grid {
  gap: 1.25rem 1.5rem;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-ag-kpi-card {
  padding: 1.2rem 1.35rem;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-ag-kpi-head {
  margin-bottom: 0.75rem;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-ag-kpi-titulo {
  font-size: clamp(0.88rem, 1.5vw, 1.28rem);
  line-height: 1.3;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-ag-kpi-valor {
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  line-height: 1.1;
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-ag-chart-title {
  font-size: clamp(1.25rem, 2.2vw, 1.65rem);
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-mov-table {
  font-size: clamp(1.05rem, 1.35vw, 1.2rem);
}

.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-mov-table th {
  font-size: clamp(0.95rem, 1.15vw, 1.08rem);
}

/* Mesmo padrão do wrapper SLA: rolagem programática no painel / fullscreen */
.bi-page.bi-movimentacao-clientes-page.bi-mov-fs-mode .bi-mov-table-scroll {
  overflow-y: auto;
  overflow-x: auto;
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

.bi-mov-toast-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: all;
}

.bi-mov-toast-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(18, 18, 30, 0.95);
  color: #fff;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 1.1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.bi-mov-toast-loading i {
  font-size: 1.3rem;
  color: #00b478;
}

.bi-mov-toast-fade-enter-active,
.bi-mov-toast-fade-leave-active {
  transition: opacity 0.3s ease;
}

.bi-mov-toast-fade-enter-from,
.bi-mov-toast-fade-leave-to {
  opacity: 0;
}

.bi-ag-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.bi-ag-toolbar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 1.1rem 1.35rem;
  align-items: end;
}

.bi-ag-filter-label {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  font-size: 0.96rem;
  color: #dde1e9;
  font-weight: 500;
}

.bi-ag-toggle-block {
  justify-self: start;
  max-width: 100%;
}

.bi-ag-toggle-row {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.08rem;
}

.bi-ag-toggle-row-text {
  font-size: 1.06rem;
  font-weight: 500;
  color: #e8ebf0;
  line-height: 1.3;
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

.bi-mov-input-date {
  background: #2d3136;
  border: 1px solid #56595e;
  color: #fff;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 1.02rem;
  min-height: 2.75rem;
  box-sizing: border-box;
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
  flex-shrink: 0;
}

.bi-ag-kpi-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.bi-mov-kpi-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 168px), 1fr));
}

@media (min-width: 1100px) {
  .bi-mov-kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.bi-ag-kpi-card {
  background: linear-gradient(145deg, #2a2d32 0%, #24272b 100%);
  border: 1px solid #3d4148;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

button.bi-mov-kpi-card-btn {
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: block;
}

button.bi-mov-kpi-card-btn:hover:not(:disabled) {
  border-color: rgba(0, 255, 170, 0.35);
}

button.bi-mov-kpi-card-btn:focus-visible {
  outline: 2px solid #00ffaa;
  outline-offset: 2px;
}

.bi-ag-kpi-card--destaque {
  border-color: rgba(0, 255, 170, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 255, 170, 0.12);
}

.bi-mov-kpi-card--warn.bi-ag-kpi-card--destaque {
  border-color: rgba(251, 146, 60, 0.65);
  box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.2);
}

.bi-ag-kpi-head {
  margin-bottom: 0.6rem;
}

.bi-ag-kpi-titulo {
  font-size: 0.82rem;
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

.bi-mov-kpi-card--warn.bi-ag-kpi-card--destaque .bi-ag-kpi-valor {
  color: #fdba74;
}

.bi-ag-chart-card {
  background: #272a2f;
  border: 1px solid #3d4148;
  border-radius: 12px;
  padding: 1.15rem 1.25rem 1.35rem;
  overflow: visible;
}

/* Lista ocupa o espaço vertical restante da página */
.bi-mov-list-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bi-mov-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  margin-bottom: 0.75rem;
}

.bi-mov-list-header .bi-ag-chart-title {
  margin: 0;
}

.bi-mov-btn-export-excel {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #2d3136;
  border: 1px solid #56595e;
  color: #e0e0e0;
  padding: 0.42rem 0.85rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.bi-mov-btn-export-excel:hover:not(:disabled) {
  background: #3a3f46;
  border-color: rgba(0, 255, 170, 0.4);
  color: #fff;
}

.bi-mov-btn-export-excel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bi-mov-btn-export-excel i {
  color: #22c55e;
  font-size: 0.95rem;
}

.bi-ag-chart-title {
  margin: 0 0 0.75rem;
  font-size: 1.2rem;
  font-weight: 600;
  flex-shrink: 0;
  line-height: 1.35;
}

.bi-ag-chart-empty {
  color: #8b919a;
  font-size: 1.05rem;
  padding: 2rem;
  text-align: center;
  line-height: 1.45;
}

.bi-mov-table-scroll {
  flex: 1 1 auto;
  min-height: 200px;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid #3d4148;
}

.bi-mov-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.08rem;
  line-height: 1.45;
}

.bi-mov-table th,
.bi-mov-table td {
  padding: 0.62rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #3d4148;
}

.bi-mov-table th {
  position: sticky;
  top: 0;
  background: #1f2226;
  z-index: 1;
  color: #c8cdd5;
  font-weight: 600;
  font-size: 0.98rem;
  letter-spacing: 0.02em;
}

.bi-mov-table td.bi-mov-cnpj {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.bi-mov-table tr:hover td {
  background: rgba(0, 255, 170, 0.06);
}

@media (max-width: 768px) {
  .bi-page.bi-movimentacao-clientes-page {
    height: auto;
    min-height: calc(100vh - 88px);
  }
}

/* Tema claro */
.bi-page.bi-movimentacao-clientes-page.bi-theme-light {
  background: #f0f7ff;
  color: #1a1a1a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light:fullscreen,
.bi-page.bi-movimentacao-clientes-page.bi-theme-light:-webkit-full-screen {
  background: #f0f7ff;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-loading-overlay {
  background: rgba(240, 247, 255, 0.92);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-loading-canvas {
  background: #ffffff;
  border-color: rgba(0, 119, 255, 0.3);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-loading-icon {
  color: var(--primary, #0077ff);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-loading-message {
  color: #1a1a2e;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-toast-overlay {
  background: rgba(255, 255, 255, 0.4);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-toast-loading {
  background: rgba(255, 255, 255, 0.97);
  color: #1a1a2e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-toast-loading i {
  color: #0077ff;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-title i {
  color: var(--primary, #0077ff);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-subtitle {
  color: #5a6c7d;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-updated {
  color: #5a6c7d;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-btn-refresh {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #5a6c7d;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light
  .bi-ag-btn-refresh:hover:not(:disabled) {
  background: #e6f2ff;
  color: var(--primary, #0077ff);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-select,
.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-input-date {
  background: #f8fbff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-toggle-row-text {
  color: #1a1a1a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-toggle {
  background: #dde8f5;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-toggle--on {
  background: rgba(0, 119, 255, 0.35);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-kpi-card {
  background: linear-gradient(145deg, #ffffff 0%, #f5f9ff 100%);
  border-color: #c5d9f0;
  box-shadow: 0 2px 12px rgba(0, 119, 255, 0.06);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light
  .bi-ag-kpi-card--destaque {
  border-color: rgba(0, 119, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 119, 255, 0.12);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-kpi-titulo {
  color: #3d4f63;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-kpi-valor {
  color: #1a1a1a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light
  .bi-ag-kpi-card--destaque
  .bi-ag-kpi-valor {
  color: var(--primary, #0077ff);
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light
  .bi-mov-kpi-card--warn.bi-ag-kpi-card--destaque
  .bi-ag-kpi-valor {
  color: #c2410c;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-chart-card {
  background: #ffffff;
  border-color: #c5d9f0;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-chart-title {
  color: #1a1a1a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-btn-export-excel {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #3d4f63;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light
  .bi-mov-btn-export-excel:hover:not(:disabled) {
  background: #e6f2ff;
  border-color: rgba(0, 119, 255, 0.45);
  color: #1a1a1a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-chart-empty {
  color: #6a7a8a;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-ag-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(220, 38, 38, 0.35);
  color: #b91c1c;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-table-scroll {
  border-color: #c5d9f0;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-table th {
  background: #e8f0fa;
  color: #1a2533;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light .bi-mov-table td {
  border-bottom-color: #e2e8f0;
}

.bi-page.bi-movimentacao-clientes-page.bi-theme-light
  .bi-mov-table
  tr:hover
  td {
  background: rgba(0, 119, 255, 0.06);
}
</style>
