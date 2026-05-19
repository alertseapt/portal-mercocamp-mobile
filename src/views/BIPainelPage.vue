<template>
  <div
    ref="painelRootRef"
    class="bi-painel"
    :class="{ 'bi-painel--doc-fs': isPainelFullscreen }"
  >
    <header v-if="!isPainelFullscreen" class="bi-painel__header">
      <div class="bi-painel__header-text">
        <h2 class="bi-painel__title">Painel</h2>
        <p class="bi-painel__subtitle">
          Em tela cheia: Pedidos em aberto, SLA, Diretoria, Análise de
          Agendamentos (visão geral), Movimentação de clientes e comparativo
          entre todos os armazéns alternam a cada minuto; use
          <strong>Pausar</strong> para fixar a tela ao explicar,
          <strong>Anterior</strong> ou <strong>Próxima</strong> para mudar de
          tela manualmente. Os dados renovam a cada 5 minutos em segundo plano.
        </p>
      </div>
      <button
        v-if="biUserLevel === 0"
        type="button"
        class="bi-painel__btn-fs"
        title="Tela cheia (Pedidos, SLA, Diretoria, Agendamentos e Movimentação)"
        @click="togglePainelFullscreen"
      >
        <i class="fas fa-expand" />
      </button>
    </header>

    <div v-else class="bi-painel__fs-strip">
      <span class="bi-painel__fs-face">
        <i :class="painelFaceIconClass" />
        {{ painelFaceLabel }}
      </span>
      <span
        v-if="painelRotationPaused"
        class="bi-painel__fs-paused"
        :title="
          'Rotação pausada — tempo restante desta tela: ' +
          painelFaceCountdownFormatted
        "
      >
        <i class="fas fa-pause" />
        Pausado
        <span class="bi-painel__fs-paused-time"
          >({{ painelFaceCountdownFormatted }})</span
        >
      </span>
      <span
        v-else-if="painelFaceCountdown >= 0"
        class="bi-painel__fs-count"
        :title="'Próximo visual em ' + painelFaceCountdownFormatted"
      >
        <i class="fas fa-exchange-alt" />
        Próximo em {{ painelFaceCountdownFormatted }}
      </span>
      <span class="bi-painel__fs-spacer" aria-hidden="true" />
      <div class="bi-painel__fs-controls">
        <button
          type="button"
          class="bi-painel__btn-ctl"
          :title="
            painelRotationPaused
              ? 'Retomar troca automática das telas'
              : 'Pausar nesta tela (não troca até retomar)'
          "
          :aria-pressed="painelRotationPaused"
          :aria-label="
            painelRotationPaused
              ? 'Retomar rotação do painel'
              : 'Pausar rotação do painel'
          "
          @click="togglePainelRotationPause"
        >
          <i
            :class="painelRotationPaused ? 'fas fa-play' : 'fas fa-pause'"
            aria-hidden="true"
          />
          {{ painelRotationPaused ? 'Retomar' : 'Pausar' }}
        </button>
        <button
          type="button"
          class="bi-painel__btn-ctl"
          title="Voltar para a tela anterior (reinicia o tempo desta face)"
          aria-label="Tela anterior do painel"
          @click="previousPainelFace"
        >
          <i class="fas fa-step-backward" aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          class="bi-painel__btn-ctl"
          title="Ir já para a próxima tela (reinicia o tempo desta face)"
          aria-label="Próxima tela do painel"
          @click="advancePainelFace"
        >
          <i class="fas fa-step-forward" aria-hidden="true" />
          Próxima
        </button>
      </div>
      <button
        type="button"
        class="bi-painel__btn-fs bi-painel__btn-fs--exit"
        title="Sair da tela cheia"
        @click="exitPainelFullscreen"
      >
        <i class="fas fa-compress" />
      </button>
    </div>

    <div
      class="bi-painel__body"
      :class="
        isPainelFullscreen ? 'bi-painel__body--fs' : 'bi-painel__body--stack'
      "
    >
      <section
        v-show="
          !isPainelFullscreen ||
          painelFace === 'pedidos' ||
          painelFace === 'sla'
        "
        class="bi-painel__slot bi-painel__slot--sla"
        aria-label="BI SLA"
      >
        <BIPage
          ref="slaRef"
          bi-sub-tab="sla"
          :embed-tv-layout="
            isPainelFullscreen &&
            (painelFace === 'pedidos' || painelFace === 'sla')
          "
          :painel-fs-active="isPainelFullscreen"
          :painel-embed-controls-sla-flip="isPainelFullscreen"
          :painel-embed-sla-flipped="painelFace === 'sla'"
          @notification="forwardNotification"
        />
      </section>
      <section
        v-show="!isPainelFullscreen || painelFace === 'diretoria'"
        class="bi-painel__slot bi-painel__slot--diretoria"
        aria-label="BI Diretoria"
      >
        <BIDiretoriaPage
          ref="diretoriaRef"
          :embed-tv-layout="isPainelFullscreen && painelFace === 'diretoria'"
          @notification="forwardNotification"
        />
      </section>
      <section
        v-show="!isPainelFullscreen || painelFace === 'agendamentos'"
        class="bi-painel__slot bi-painel__slot--agendamentos"
        aria-label="BI Análise de Agendamentos"
      >
        <BIAgendamentosPage
          ref="biAgNormalRef"
          painel-embed-variant="normal"
          :embed-tv-layout="isPainelFullscreen && painelFace === 'agendamentos'"
          @notification="forwardNotification"
        />
      </section>
      <section
        v-show="!isPainelFullscreen || painelFace === 'mov-clientes'"
        class="bi-painel__slot bi-painel__slot--mov-clientes"
        aria-label="BI Movimentação de clientes"
      >
        <BIMovimentacaoClientesPage
          ref="movClientesRef"
          :painel-stack-mode="!isPainelFullscreen"
          :painel-fs-active="isPainelFullscreen"
          :embed-tv-layout="isPainelFullscreen && painelFace === 'mov-clientes'"
          @notification="forwardNotification"
        />
      </section>
      <section
        v-show="!isPainelFullscreen || painelFace === 'ag-compare'"
        class="bi-painel__slot bi-painel__slot--agendamentos-compare"
        aria-label="BI Agendamentos comparativo por CD"
      >
        <BIAgendamentosPage
          ref="biAgCompareRef"
          painel-embed-variant="compare-all"
          :embed-tv-layout="isPainelFullscreen && painelFace === 'ag-compare'"
          @notification="forwardNotification"
        />
      </section>
    </div>
  </div>
</template>

<script>
import BIPage from './BIPage.vue'
import BIDiretoriaPage from './BIDiretoriaPage.vue'
import BIAgendamentosPage from './BIAgendamentosPage.vue'
import BIMovimentacaoClientesPage from './BIMovimentacaoClientesPage.vue'
import { scheduleMovimentacaoWarmPrefetch } from '@/services/biMovimentacaoWarmCache.js'

/** Tempo em cada face do painel (rotação em tela cheia). */
const PAINEL_FACE_ROTATION_SEC = 60
const PAINEL_FACE_ORDER = [
  'pedidos',
  'sla',
  'diretoria',
  'agendamentos',
  'mov-clientes',
  'ag-compare',
]

export default {
  name: 'BIPainelPage',
  emits: ['notification', 'page-ready'],
  components: {
    BIPage,
    BIDiretoriaPage,
    BIAgendamentosPage,
    BIMovimentacaoClientesPage,
  },
  data() {
    return {
      isPainelFullscreen: false,
      painelFace: 'pedidos',
      painelFaceCountdown: -1,
      painelFaceTickTimer: null,
      /** Quando true, a face atual não avança pelo cronômetro (útil para explicar). */
      painelRotationPaused: false,
    }
  },
  computed: {
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
    painelFaceCountdownFormatted() {
      const s = Math.max(0, Math.floor(this.painelFaceCountdown))
      const m = Math.floor(s / 60)
      const seg = s % 60
      return `${m}:${String(seg).padStart(2, '0')}`
    },
    painelFaceLabel() {
      if (this.painelFace === 'pedidos') return 'Pedidos em aberto'
      if (this.painelFace === 'sla') return 'SLA'
      if (this.painelFace === 'diretoria') return 'Diretoria'
      if (this.painelFace === 'agendamentos') return 'Agendamentos'
      if (this.painelFace === 'ag-compare') {
        return 'Agendamentos — Comparativo CDs'
      }
      if (this.painelFace === 'mov-clientes') return 'Movimentação de clientes'
      return 'Painel'
    },
    painelFaceIconClass() {
      if (this.painelFace === 'pedidos') return 'fas fa-list-alt'
      if (this.painelFace === 'sla') return 'fas fa-clock'
      if (this.painelFace === 'diretoria') return 'fas fa-chart-pie'
      if (this.painelFace === 'agendamentos') return 'fas fa-calendar-check'
      if (this.painelFace === 'ag-compare') return 'fas fa-warehouse'
      if (this.painelFace === 'mov-clientes') return 'fas fa-right-left'
      return 'fas fa-tv'
    },
  },
  mounted() {
    this._painelFsHandler = () => this.onPainelFullscreenChange()
    document.addEventListener('fullscreenchange', this._painelFsHandler)
    scheduleMovimentacaoWarmPrefetch()
    this.$nextTick(() => this.$emit('page-ready'))
  },
  activated() {
    this.$nextTick(() => this.$emit('page-ready'))
  },
  deactivated() {
    this.teardownPainelFullscreen()
    const root = this.painelFullscreenEl()
    const fs = document.fullscreenElement
    if (this.isOurFsElement(fs, root)) {
      document.exitFullscreen().catch(() => {})
    }
  },
  beforeUnmount() {
    this.teardownPainelFullscreen()
    if (this._painelFsHandler) {
      document.removeEventListener('fullscreenchange', this._painelFsHandler)
    }
    const root = this.painelFullscreenEl()
    const fs = document.fullscreenElement
    if (this.isOurFsElement(fs, root)) {
      document.exitFullscreen().catch(() => {})
    }
  },
  methods: {
    forwardNotification(a, b) {
      this.$emit('notification', a, b)
    },
    painelFullscreenEl() {
      const r = this.$refs.painelRootRef
      if (r instanceof Element) return r
      return this.$el instanceof Element ? this.$el : null
    },
    isOurFsElement(fs, root) {
      return !!(fs && root && (fs === root || root.contains(fs)))
    },
    async togglePainelFullscreen() {
      const el = this.painelFullscreenEl()
      if (!el) return
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (e) {
        console.warn('[BI Painel] Fullscreen:', e?.message || e)
        this.isPainelFullscreen = false
        this.teardownPainelFullscreen()
      }
    },
    async exitPainelFullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen()
      } catch {
        /* ignore */
      }
    },
    onPainelFullscreenChange() {
      const fs = document.fullscreenElement
      const root = this.painelFullscreenEl()
      const nowFs = this.isOurFsElement(fs, root)
      this.isPainelFullscreen = nowFs
      if (nowFs) this.startPainelRotationMode()
      else this.teardownPainelFullscreen()
    },
    startPainelRotationMode() {
      this.teardownPainelTimersOnly()
      this.painelRotationPaused = false
      this.painelFace = PAINEL_FACE_ORDER[0]
      this.painelFaceCountdown = PAINEL_FACE_ROTATION_SEC
      this.painelFaceTickTimer = setInterval(() => {
        if (!this.isPainelFullscreen) {
          this.teardownPainelFullscreen()
          return
        }
        if (this.painelRotationPaused) return
        if (this.painelFaceCountdown > 0) this.painelFaceCountdown--
        if (this.painelFaceCountdown <= 0) {
          const i = PAINEL_FACE_ORDER.indexOf(this.painelFace)
          const next =
            PAINEL_FACE_ORDER[(i >= 0 ? i + 1 : 0) % PAINEL_FACE_ORDER.length]
          this.painelFace = next
          this.painelFaceCountdown = PAINEL_FACE_ROTATION_SEC
        }
      }, 1000)
    },
    togglePainelRotationPause() {
      if (!this.isPainelFullscreen || this.painelFaceCountdown < 0) return
      this.painelRotationPaused = !this.painelRotationPaused
    },
    advancePainelFace() {
      if (!this.isPainelFullscreen || this.painelFaceCountdown < 0) return
      const i = PAINEL_FACE_ORDER.indexOf(this.painelFace)
      const next =
        PAINEL_FACE_ORDER[(i >= 0 ? i + 1 : 0) % PAINEL_FACE_ORDER.length]
      this.painelFace = next
      this.painelFaceCountdown = PAINEL_FACE_ROTATION_SEC
    },
    previousPainelFace() {
      if (!this.isPainelFullscreen || this.painelFaceCountdown < 0) return
      const i = PAINEL_FACE_ORDER.indexOf(this.painelFace)
      const len = PAINEL_FACE_ORDER.length
      const prev = PAINEL_FACE_ORDER[(i >= 0 ? i - 1 + len : len - 1) % len]
      this.painelFace = prev
      this.painelFaceCountdown = PAINEL_FACE_ROTATION_SEC
    },
    teardownPainelTimersOnly() {
      if (this.painelFaceTickTimer) {
        clearInterval(this.painelFaceTickTimer)
        this.painelFaceTickTimer = null
      }
      this.painelFaceCountdown = -1
    },
    teardownPainelFullscreen() {
      this.teardownPainelTimersOnly()
      this.painelRotationPaused = false
      this.painelFace = PAINEL_FACE_ORDER[0]
    },
  },
}
</script>

<style scoped>
.bi-painel {
  --bp-accent: #00ffaa;
  --bp-bg: #202326;
  --bp-panel: #272a2f;
  --bp-border: #56595e;
  --bp-text: #ffffff;
  width: 100%;
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
  font-family:
    'Samsung Sharp Sans',
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
  color: var(--bp-text);
  display: flex;
  flex-direction: column;
  background: var(--bp-bg);
  border-radius: 16px;
  padding: 16px 20px 24px;
}

/* Fora da tela cheia: altura pelo conteúdo (com scroll na página) */
.bi-painel:not(.bi-painel--doc-fs) {
  height: auto;
  align-self: flex-start;
}

.bi-painel--doc-fs {
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  max-height: 100dvh;
  align-self: stretch;
  border-radius: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.bi-painel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bp-border);
}

.bi-painel__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.bi-painel__subtitle {
  margin: 6px 0 0;
  font-size: 0.88rem;
  color: #8b8e94;
  max-width: 36rem;
  line-height: 1.45;
}

.bi-painel__btn-fs {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  border: 1px solid var(--bp-border);
  background: var(--bp-panel);
  color: #8b8e94;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.bi-painel__btn-fs:hover {
  border-color: var(--bp-accent);
  color: var(--bp-accent);
}

.bi-painel__fs-strip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: var(--bp-panel);
  border-bottom: 1px solid var(--bp-border);
}

.bi-painel__fs-face {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--bp-accent);
}

.bi-painel__fs-count {
  font-size: 0.88rem;
  color: #c5c8cc;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-variant-numeric: tabular-nums;
}

.bi-painel__fs-paused {
  font-size: 0.88rem;
  color: #ffb020;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-variant-numeric: tabular-nums;
}

.bi-painel__fs-paused-time {
  color: #c5c8cc;
  font-weight: 500;
}

.bi-painel__fs-spacer {
  flex: 1 1 auto;
  min-width: 4px;
}

.bi-painel__fs-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bi-painel__btn-ctl {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--bp-border);
  background: var(--bp-bg);
  color: #c5c8cc;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.bi-painel__btn-ctl:hover {
  border-color: var(--bp-accent);
  color: var(--bp-accent);
}

.bi-painel__btn-fs--exit {
  flex-shrink: 0;
}

.bi-painel__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Empilhado: corpo com altura dos filhos (evita repartir um único viewport entre todos os BIs) */
.bi-painel__body--stack {
  flex: 0 0 auto;
  gap: 1.5rem;
  min-height: unset;
}

.bi-painel__body--fs {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.bi-painel__slot--sla {
  min-height: 0;
}

.bi-painel__body--stack .bi-painel__slot--sla {
  flex: 0 0 auto;
}

.bi-painel__body--stack .bi-painel__slot--diretoria {
  flex: 0 0 auto;
  min-height: min(640px, 55vh);
}

.bi-painel__body--stack .bi-painel__slot--agendamentos,
.bi-painel__body--stack .bi-painel__slot--agendamentos-compare,
.bi-painel__body--stack .bi-painel__slot--mov-clientes {
  flex: 0 0 auto;
  min-height: min(520px, 50vh);
}

.bi-painel__body--fs .bi-painel__slot {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  min-height: 0;
}

/* O fullscreen do documento está no painel; o BI filho precisa ocupar 100% da área útil. */
.bi-painel__body--fs .bi-painel__slot :deep(.bi-page) {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
}

.bi-painel__body--fs .bi-painel__slot :deep(.bi-diretoria) {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
}

/* Esconde tela cheia nos filhos: o Painel controla o fullscreen do documento. */
.bi-painel :deep(.bi-expand-btn) {
  display: none !important;
}

.bi-painel :deep(.bi-diretoria__btn-fs) {
  display: none !important;
}
</style>
