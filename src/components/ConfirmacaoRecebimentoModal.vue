<template>
  <div class="rcb-overlay">
    <div class="rcb-modal">
      <!-- Barra superior: voltar | contagem | fechar -->
      <div class="rcb-topbar">
        <button
          type="button"
          class="rcb-back"
          :disabled="!canGoBack || busy"
          title="Voltar para a nota anterior"
          @click="goBack"
        >
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="rcb-counter">
          <template v-if="total > 0">{{ currentIndex + 1 }}/{{ total }}</template>
          <template v-else>—</template>
        </div>
        <button
          type="button"
          class="rcb-close"
          title="Fechar"
          :disabled="busy"
          @click="close"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Corpo -->
      <div class="rcb-body">
        <div v-if="loading" class="rcb-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando notas da carga...</span>
        </div>

        <div v-else-if="error" class="rcb-state rcb-state--error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ error }}</span>
          <button type="button" class="rcb-retry" @click="fetchSchedules">
            Tentar novamente
          </button>
        </div>

        <div v-else-if="total === 0" class="rcb-state">
          <i class="fas fa-inbox"></i>
          <span>Nenhuma nota encontrada nesta carga.</span>
        </div>

        <div v-else-if="currentSchedule" class="rcb-info">
          <div class="rcb-info-row">
            <span class="rcb-info-label">Carga</span>
            <span class="rcb-info-value">{{ loadId }}</span>
          </div>
          <div class="rcb-info-row">
            <span class="rcb-info-label">NF</span>
            <span class="rcb-info-value">{{ currentSchedule.number || '—' }}</span>
          </div>
          <div class="rcb-info-row">
            <span class="rcb-info-label">Volumes</span>
            <span class="rcb-info-value">{{ currentSchedule.case_count ?? 0 }}</span>
          </div>
          <div class="rcb-info-row">
            <span class="rcb-info-label">OC</span>
            <span class="rcb-info-value">{{ ocDisplay(currentSchedule) }}</span>
          </div>
          <div v-if="currentSchedule.exceptions" class="rcb-info-row rcb-info-row--exceptions">
            <span class="rcb-info-label">Ressalvas</span>
            <span class="rcb-info-value">{{ currentSchedule.exceptions }}</span>
          </div>
        </div>
      </div>

      <!-- Rodapé: Recusado | Recebido (50/50) -->
      <div
        v-if="!loading && !error && currentSchedule"
        class="rcb-footer"
      >
        <button
          type="button"
          class="rcb-btn rcb-btn--refuse"
          :disabled="busy"
          @click="onRefused"
        >
          <i class="fas fa-times-circle"></i>
          Recusado
        </button>
        <button
          type="button"
          class="rcb-btn rcb-btn--receive"
          :disabled="busy"
          @click="onReceived"
        >
          <i class="fas fa-check-circle"></i>
          Recebido
        </button>
      </div>
    </div>

    <!-- Sub-modal: Ressalva (seleção + foto) -->
    <div v-if="showRessalva" class="rcb-sub-overlay">
      <div class="rcb-sub-card">
        <div class="rcb-sub-header">
          <h3>Ressalva</h3>
        </div>

        <!-- Etapa 1: seleção de ressalvas -->
        <template v-if="ressalvaStep === 'select'">
          <div class="rcb-sub-body">
            <div v-if="ressalvasLoading" class="rcb-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Carregando ressalvas...</span>
            </div>
            <div v-else-if="ressalvasError" class="rcb-state rcb-state--error">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ ressalvasError }}</span>
              <button type="button" class="rcb-retry" @click="fetchRessalvas">
                Tentar novamente
              </button>
            </div>
            <div v-else-if="ressalvas.length === 0" class="rcb-state">
              <i class="fas fa-inbox"></i>
              <span>Nenhuma ressalva cadastrada.</span>
            </div>
            <ul v-else class="rcb-ressalva-list">
              <li v-for="r in ressalvas" :key="r.id">
                <button
                  type="button"
                  class="rcb-ressalva-item"
                  :class="{ 'is-selected': isSelected(r.sigla) }"
                  @click="toggleSigla(r.sigla)"
                >
                  <span class="rcb-ressalva-check">
                    <i class="fas" :class="isSelected(r.sigla) ? 'fa-check-square' : 'fa-square'"></i>
                  </span>
                  <span class="rcb-ressalva-sigla">{{ r.sigla }}</span>
                  <span class="rcb-ressalva-desc">{{ r.description }}</span>
                </button>
              </li>
            </ul>
          </div>
          <div class="rcb-sub-footer">
            <button
              type="button"
              class="rcb-btn rcb-btn--cancel"
              :disabled="savingRessalva"
              @click="cancelRessalva"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rcb-btn rcb-btn--confirm"
              :disabled="selectedSiglas.length === 0 || savingRessalva"
              @click="confirmRessalva"
            >
              <i v-if="savingRessalva" class="fas fa-spinner fa-spin"></i>
              Confirmar
            </button>
          </div>
        </template>

        <!-- Etapa 2: fotos (opcional) -->
        <template v-else>
          <div class="rcb-sub-body">
            <p class="rcb-photo-hint">
              Tire uma ou mais fotos para complementar a ressalva, ou pule esta
              etapa. Toque em uma imagem para visualizar ou apagar.
            </p>

            <div v-if="loadingExisting" class="rcb-photo-loading">
              <i class="fas fa-spinner fa-spin"></i> Carregando imagens...
            </div>

            <div
              v-if="existingPhotos.length > 0 || photos.length > 0"
              class="rcb-photo-grid"
            >
              <!-- Imagens já enviadas (Drive) -->
              <button
                v-for="p in existingPhotos"
                :key="'ex-' + p.id"
                type="button"
                class="rcb-photo-thumb"
                @click="
                  openViewer({
                    type: 'existing',
                    id: p.id,
                    dataUrl: p.dataUrl,
                    name: p.name,
                  })
                "
              >
                <img :src="p.dataUrl" :alt="p.name" />
                <span class="rcb-photo-badge"><i class="fas fa-cloud"></i></span>
              </button>
              <!-- Fotos capturadas nesta sessão (ainda não enviadas) -->
              <button
                v-for="(p, i) in photos"
                :key="'new-' + i"
                type="button"
                class="rcb-photo-thumb"
                @click="
                  openViewer({
                    type: 'captured',
                    idx: i,
                    dataUrl: p.dataUrl,
                    name: p.name,
                  })
                "
              >
                <img :src="p.dataUrl" :alt="p.name" />
                <span class="rcb-photo-badge rcb-photo-badge--new">
                  <i class="fas fa-clock"></i>
                </span>
              </button>
            </div>

            <button
              type="button"
              class="rcb-photo-add"
              :disabled="uploadingPhotos"
              @click="triggerPhotoCapture"
            >
              <i class="fas fa-camera"></i>
              Tirar foto
            </button>
            <input
              ref="photoInput"
              type="file"
              accept="image/*"
              capture="environment"
              class="rcb-hidden-input"
              @change="onPhotoCaptured"
            />
          </div>
          <div class="rcb-sub-footer rcb-sub-footer--single">
            <button
              type="button"
              class="rcb-btn rcb-btn--confirm"
              :disabled="uploadingPhotos"
              @click="finishPhotos"
            >
              <i v-if="uploadingPhotos" class="fas fa-spinner fa-spin"></i>
              {{ photos.length > 0 ? `Enviar ${photos.length} foto(s)` : 'Pular etapa' }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Visualizador de imagem em tela cheia (com opção de apagar) -->
    <div v-if="viewer" class="rcb-viewer-overlay">
      <img :src="viewer.dataUrl" :alt="viewer.name" class="rcb-viewer-img" />
      <div class="rcb-viewer-actions">
        <button
          type="button"
          class="rcb-btn rcb-btn--cancel"
          :disabled="deletingPhoto"
          @click="closeViewer"
        >
          <i class="fas fa-arrow-left"></i>
          Voltar
        </button>
        <button
          type="button"
          class="rcb-btn rcb-btn--refuse"
          :disabled="deletingPhoto"
          @click="deleteViewed"
        >
          <i v-if="deletingPhoto" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-trash"></i>
          Apagar
        </button>
      </div>
    </div>

    <!-- Animação de carregamento/sucesso entre notas -->
    <div v-if="showSuccess" class="rcb-success-overlay">
      <div class="rcb-success-card">
        <div class="rcb-success-circle">
          <i class="fas" :class="successDone ? 'fa-check' : 'fa-spinner fa-spin'"></i>
        </div>
        <div class="rcb-success-label">{{ successLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api.js'

export default {
  name: 'ConfirmacaoRecebimentoModal',
  props: {
    loadId: {
      type: [String, Number],
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      loading: true,
      error: null,
      schedules: [],
      currentIndex: 0,

      // Sub-modal de ressalva
      showRessalva: false,
      ressalvaStep: 'select', // 'select' | 'foto'
      ressalvas: [],
      ressalvasLoading: false,
      ressalvasError: null,
      selectedSiglas: [],
      savingRessalva: false,

      // Fotos
      photos: [], // capturadas nesta sessão: { name, dataUrl }
      uploadingPhotos: false,
      existingPhotos: [], // já enviadas (Drive): { id, name, dataUrl }
      loadingExisting: false,
      viewer: null, // imagem em visualização: { type:'existing'|'captured', id?, idx?, dataUrl, name }
      deletingPhoto: false,

      // Animação entre notas
      showSuccess: false,
      successDone: false,
      successLabel: '',
    }
  },
  computed: {
    total() {
      return this.schedules.length
    },
    currentSchedule() {
      return this.schedules[this.currentIndex] || null
    },
    canGoBack() {
      return this.currentIndex > 0
    },
    /** Bloqueia ações do modal principal enquanto há sub-modal/upload/animação. */
    busy() {
      return this.showRessalva || this.uploadingPhotos || this.savingRessalva || this.showSuccess
    },
  },
  mounted() {
    this.fetchSchedules()
  },
  methods: {
    /** Valor da OC para exibição; "—" quando vazia/inexistente. */
    ocDisplay(s) {
      const oc = s && s.oc != null ? String(s.oc).trim() : ''
      return oc && oc !== '-' ? oc : '—'
    },

    async fetchSchedules() {
      this.loading = true
      this.error = null
      try {
        const resp = await apiService.get(
          `/loads/${encodeURIComponent(this.loadId)}/schedules`
        )
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        const list = (data && data.schedules) || []
        this.schedules = Array.isArray(list) ? list : []
        this.currentIndex = 0
      } catch (err) {
        this.error =
          err?.message || 'Não foi possível carregar as notas da carga.'
      } finally {
        this.loading = false
      }
    },

    close() {
      if (this.busy) return
      this.$emit('close')
    },

    goBack() {
      if (!this.canGoBack || this.busy) return
      this.currentIndex -= 1
    },

    /** "Recebido": nada muda no agendamento — apenas avança. */
    onReceived() {
      if (this.busy) return
      this.advance()
    },

    /** "Recusado": abre o sub-modal de ressalva. */
    onRefused() {
      if (this.busy) return
      this.selectedSiglas = this.currentSchedule?.exceptions
        ? String(this.currentSchedule.exceptions)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : []
      this.photos = []
      this.ressalvaStep = 'select'
      this.showRessalva = true
      if (this.ressalvas.length === 0) this.fetchRessalvas()
    },

    async fetchRessalvas() {
      this.ressalvasLoading = true
      this.ressalvasError = null
      try {
        const resp = await apiService.get('/exceptions')
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        this.ressalvas = (data && data.data) || []
      } catch (err) {
        this.ressalvasError =
          err?.message || 'Não foi possível carregar as ressalvas.'
      } finally {
        this.ressalvasLoading = false
      }
    },

    isSelected(sigla) {
      return this.selectedSiglas.includes(sigla)
    },

    toggleSigla(sigla) {
      const i = this.selectedSiglas.indexOf(sigla)
      if (i === -1) this.selectedSiglas.push(sigla)
      else this.selectedSiglas.splice(i, 1)
    },

    cancelRessalva() {
      if (this.savingRessalva) return
      this.showRessalva = false
      this.selectedSiglas = []
      this.photos = []
      this.existingPhotos = []
      this.viewer = null
      this.ressalvaStep = 'select'
    },

    /** Grava as siglas em schedule_list.exceptions e segue para a etapa de fotos. */
    async confirmRessalva() {
      if (this.selectedSiglas.length === 0 || this.savingRessalva) return
      const schedule = this.currentSchedule
      if (!schedule) return
      this.savingRessalva = true
      try {
        const resp = await apiService.patch(
          `/schedules/${encodeURIComponent(schedule.id)}/exceptions`,
          { siglas: this.selectedSiglas }
        )
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        // Reflete localmente para a info da nota e revisões posteriores
        schedule.exceptions =
          (data && data.exceptions) || this.selectedSiglas.join(',')
        this.ressalvaStep = 'foto'
        this.fetchExistingImages()
      } catch (err) {
        alert(err?.message || 'Erro ao salvar ressalvas. Tente novamente.')
      } finally {
        this.savingRessalva = false
      }
    },

    /** Carrega as imagens já enviadas do agendamento (Drive) para miniaturas. */
    async fetchExistingImages() {
      const schedule = this.currentSchedule
      if (!schedule) return
      this.loadingExisting = true
      this.existingPhotos = []
      try {
        const resp = await apiService.get(
          `/schedules/${encodeURIComponent(schedule.id)}/images`
        )
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        this.existingPhotos = ((data && data.images) || []).filter(
          im => im && im.dataUrl
        )
      } catch (_) {
        this.existingPhotos = []
      } finally {
        this.loadingExisting = false
      }
    },

    openViewer(item) {
      this.viewer = item
    },

    closeViewer() {
      if (this.deletingPhoto) return
      this.viewer = null
    },

    /** Apaga a imagem em visualização (Drive, se já enviada; ou da lista local). */
    async deleteViewed() {
      if (!this.viewer || this.deletingPhoto) return
      if (this.viewer.type === 'captured') {
        this.photos.splice(this.viewer.idx, 1)
        this.viewer = null
        return
      }
      const schedule = this.currentSchedule
      this.deletingPhoto = true
      try {
        await apiService.delete(
          `/schedules/${encodeURIComponent(schedule.id)}/images/${encodeURIComponent(this.viewer.id)}`
        )
        this.existingPhotos = this.existingPhotos.filter(
          p => p.id !== this.viewer.id
        )
        this.viewer = null
      } catch (err) {
        alert(err?.message || 'Erro ao apagar imagem. Tente novamente.')
      } finally {
        this.deletingPhoto = false
      }
    },

    triggerPhotoCapture() {
      if (this.uploadingPhotos) return
      this.$refs.photoInput && this.$refs.photoInput.click()
    },

    onPhotoCaptured(event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = '' // permite recapturar o mesmo arquivo
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        this.photos.push({
          name: file.name || `foto-${Date.now()}.jpg`,
          dataUrl: String(reader.result || ''),
        })
      }
      reader.readAsDataURL(file)
    },

    removePhoto(idx) {
      if (this.uploadingPhotos) return
      this.photos.splice(idx, 1)
    },

    /** Envia as fotos (se houver) e avança para a próxima nota. */
    async finishPhotos() {
      if (this.uploadingPhotos) return
      const schedule = this.currentSchedule
      this.uploadingPhotos = true
      try {
        for (const p of this.photos) {
          const base64 = String(p.dataUrl).split(',')[1] || ''
          if (!base64) continue
          await apiService.post(
            `/schedules/${encodeURIComponent(schedule.id)}/images`,
            { fileName: p.name, base64 }
          )
        }
        this.showRessalva = false
        this.uploadingPhotos = false
        this.selectedSiglas = []
        this.photos = []
        this.existingPhotos = []
        this.viewer = null
        this.ressalvaStep = 'select'
        this.runSuccessThenAdvance('Ressalva registrada')
      } catch (err) {
        this.uploadingPhotos = false
        alert(err?.message || 'Erro ao enviar imagens. Tente novamente.')
      }
    },

    /** Mostra a animação de carregamento → confirmação e então avança. */
    runSuccessThenAdvance(label) {
      this.successLabel = label
      this.successDone = false
      this.showSuccess = true
      // breve "carregando" e em seguida confirmação
      setTimeout(() => {
        this.successDone = true
      }, 500)
      setTimeout(() => {
        this.showSuccess = false
        this.advance()
      }, 1100)
    },

    /** Avança para a próxima nota; ao terminar a última, encerra. */
    advance() {
      if (this.currentIndex < this.total - 1) {
        this.currentIndex += 1
      } else {
        this.$emit('close')
      }
    },
  },
}
</script>

<style scoped>
.rcb-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rcb-modal {
  width: 100%;
  max-width: 900px;
  /* Altura dinâmica: 100dvh acompanha o recolher/expandir da barra do
     navegador no mobile (evita o conteúdo ficar atrás da barra inferior).
     100vh é o fallback para navegadores sem suporte a dvh. */
  height: 100vh;
  height: 100dvh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

/* Barra superior */
.rcb-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  /* Respeita o notch / barra de status (safe area) no topo */
  padding-top: calc(12px + env(safe-area-inset-top));
  background: #1e293b;
  color: #fff;
  flex-shrink: 0;
}
.rcb-back,
.rcb-close {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}
.rcb-back:disabled,
.rcb-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.rcb-back:not(:disabled):hover,
.rcb-close:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.22);
}
.rcb-counter {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Corpo */
.rcb-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
}
.rcb-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
}
.rcb-info-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}
.rcb-info-label {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.rcb-info-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
  text-align: right;
  word-break: break-word;
}
.rcb-info-row--exceptions .rcb-info-value {
  font-size: 1.2rem;
  color: #b91c1c;
}

.rcb-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #475569;
  font-size: 1.05rem;
}
.rcb-state i {
  font-size: 2rem;
}
.rcb-state--error {
  color: #b91c1c;
}
.rcb-retry {
  margin-top: 6px;
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
}

/* Rodapé: dois botões dividindo o modal */
.rcb-footer {
  display: flex;
  flex-shrink: 0;
  border-top: 1px solid #e2e8f0;
}
/* Estende o fundo colorido dos botões até a borda inferior, mantendo o texto
   acima do home indicator / barra inferior do navegador (safe area). */
.rcb-footer .rcb-btn {
  padding-bottom: calc(22px + env(safe-area-inset-bottom));
}
.rcb-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: 700;
  padding: 22px 12px;
  color: #fff;
}
.rcb-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rcb-btn--refuse {
  background: #dc2626;
}
.rcb-btn--refuse:not(:disabled):hover {
  background: #b91c1c;
}
.rcb-btn--receive {
  background: #16a34a;
}
.rcb-btn--receive:not(:disabled):hover {
  background: #15803d;
}

/* Sub-modal Ressalva */
.rcb-sub-overlay {
  position: fixed;
  inset: 0;
  z-index: 3100;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.rcb-sub-card {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  max-height: 90dvh;
  background: #fff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rcb-sub-header {
  padding: 16px 20px;
  background: #1e293b;
  color: #fff;
}
.rcb-sub-header h3 {
  margin: 0;
  font-size: 1.2rem;
}
.rcb-sub-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}
.rcb-ressalva-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rcb-ressalva-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
}
.rcb-ressalva-item.is-selected {
  border-color: #2563eb;
  background: #eff6ff;
}
.rcb-ressalva-check {
  color: #2563eb;
  font-size: 1.1rem;
}
.rcb-ressalva-sigla {
  font-weight: 700;
  color: #0f172a;
  min-width: 32px;
}
.rcb-ressalva-desc {
  color: #475569;
  font-size: 0.92rem;
}
.rcb-sub-footer {
  display: flex;
  border-top: 1px solid #e2e8f0;
}
.rcb-sub-footer .rcb-btn {
  font-size: 1.05rem;
  padding: 16px 12px;
}
.rcb-sub-footer--single .rcb-btn {
  flex: 1;
}
.rcb-btn--cancel {
  background: #64748b;
}
.rcb-btn--cancel:not(:disabled):hover {
  background: #475569;
}
.rcb-btn--confirm {
  background: #2563eb;
}
.rcb-btn--confirm:not(:disabled):hover {
  background: #1d4ed8;
}

/* Fotos */
.rcb-photo-hint {
  margin: 0 0 14px;
  color: #475569;
  font-size: 0.95rem;
}
.rcb-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.rcb-photo-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  padding: 0;
  background: #f1f5f9;
  cursor: pointer;
  display: block;
}
.rcb-photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rcb-photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
}
.rcb-photo-add {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  border: 2px dashed #93c5fd;
  border-radius: 10px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
  cursor: pointer;
}
.rcb-photo-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rcb-hidden-input {
  display: none;
}
.rcb-photo-loading {
  color: #475569;
  font-size: 0.9rem;
  margin-bottom: 12px;
}
.rcb-photo-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.9);
  color: #fff;
  font-size: 0.6rem;
}
.rcb-photo-badge--new {
  background: rgba(202, 138, 4, 0.9);
}

/* Visualizador de imagem em tela cheia */
.rcb-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 3300;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top));
}
.rcb-viewer-img {
  max-width: 100%;
  max-height: calc(100% - 80px);
  object-fit: contain;
  border-radius: 8px;
}
.rcb-viewer-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
  max-width: 480px;
  padding-bottom: env(safe-area-inset-bottom);
}
.rcb-viewer-actions .rcb-btn {
  flex: 1;
  border-radius: 10px;
  font-size: 1.05rem;
  padding: 14px 12px;
}

/* Animação de sucesso */
.rcb-success-overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rcb-success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.rcb-success-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6rem;
}
.rcb-success-label {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
}
</style>
