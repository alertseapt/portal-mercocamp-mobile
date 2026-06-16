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

      <!-- Ações: Ressalva | Imagens (com contagem) -->
      <div
        v-if="!loading && !error && currentSchedule"
        class="rcb-actions"
      >
        <button
          type="button"
          class="rcb-action-btn rcb-action-btn--ressalva"
          :disabled="busy"
          @click="openRessalva"
        >
          <i class="fas fa-exclamation-triangle"></i>
          <span>Ressalva</span>
          <span class="rcb-action-count">{{ ressalvaCount }}</span>
        </button>
        <button
          type="button"
          class="rcb-action-btn rcb-action-btn--imagens"
          :disabled="busy"
          @click="openImagens"
        >
          <i class="fas fa-images"></i>
          <span>Imagens</span>
          <span class="rcb-action-count">
            <i v-if="imageCount === null" class="fas fa-spinner fa-spin"></i>
            <template v-else>{{ imageCount }}</template>
          </span>
        </button>
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
          <i v-if="savingDecision === 'Recusado'" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-times-circle"></i>
          Recusado
        </button>
        <button
          type="button"
          class="rcb-btn rcb-btn--receive"
          :disabled="busy"
          @click="onReceived"
        >
          <i v-if="savingDecision === 'Recebido'" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check-circle"></i>
          Recebido
        </button>
      </div>
    </div>

    <!-- Sub-modal: Ressalvas (seleção/edição) -->
    <div v-if="showRessalva" class="rcb-sub-overlay">
      <div class="rcb-sub-card">
        <div class="rcb-sub-header">
          <h3>Ressalvas</h3>
        </div>

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
            <i class="fas fa-arrow-left"></i>
            Voltar
          </button>
          <button
            type="button"
            class="rcb-btn rcb-btn--confirm"
            :disabled="savingRessalva"
            @click="confirmRessalva"
          >
            <i v-if="savingRessalva" class="fas fa-spinner fa-spin"></i>
            Confirmar
          </button>
        </div>
      </div>
    </div>

    <!-- Sub-modal: Imagens -->
    <div v-if="showImagens" class="rcb-sub-overlay">
      <div class="rcb-sub-card">
        <div class="rcb-sub-header">
          <h3>Imagens</h3>
        </div>

        <div class="rcb-sub-body">
          <p class="rcb-photo-hint">
            Toque em "Foto" para capturar uma nova imagem. Toque em uma imagem
            para visualizar ou apagar.
          </p>

          <div v-if="loadingExisting" class="rcb-photo-loading">
            <i class="fas fa-spinner fa-spin"></i> Carregando imagens...
          </div>

          <div
            v-else-if="existingPhotos.length === 0 && currentQueueItems.length === 0"
            class="rcb-photo-empty"
          >
            <i class="fas fa-image"></i>
            <span>Nenhuma imagem nesta NF.</span>
          </div>

          <div v-else class="rcb-photo-grid">
            <button
              v-for="p in existingPhotos"
              :key="'ex-' + p.id"
              type="button"
              class="rcb-photo-thumb"
              @click="
                openViewer({
                  id: p.id,
                  dataUrl: p.dataUrl,
                  name: p.name,
                  uploadedBy: p.uploadedBy,
                  uploadedAt: p.uploadedAt,
                })
              "
            >
              <img :src="p.dataUrl" :alt="p.name" />
              <span class="rcb-photo-badge"><i class="fas fa-cloud"></i></span>
            </button>

            <!-- Fotos desta NF em envio (fila em segundo plano) ou com erro -->
            <button
              v-for="q in currentQueueItems"
              :key="q.id"
              type="button"
              class="rcb-photo-thumb"
              :class="{ 'is-uploading': q.status !== 'erro', 'is-error': q.status === 'erro' }"
              :title="q.status === 'erro' ? (q.error || 'Falha no envio — toque para tentar novamente') : 'Enviando...'"
              @click="onQueueThumbClick(q)"
            >
              <img :src="q.dataUrl" :alt="q.fileName" />
              <span
                v-if="q.status === 'erro'"
                class="rcb-photo-badge rcb-photo-badge--error"
              >
                <i class="fas fa-redo"></i>
              </span>
              <span v-else class="rcb-photo-badge rcb-photo-badge--uploading">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
            </button>
          </div>

          <div v-if="pendingUploadCount > 0" class="rcb-photo-uploading-note">
            <i class="fas fa-spinner fa-spin"></i>
            Enviando {{ pendingUploadCount }} imagem(ns) em segundo plano…
          </div>

          <input
            ref="photoInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="rcb-hidden-input"
            @change="onPhotoCaptured"
          />
        </div>
        <div class="rcb-sub-footer">
          <button
            type="button"
            class="rcb-btn rcb-btn--cancel"
            @click="closeImagens"
          >
            <i class="fas fa-arrow-left"></i>
            Voltar
          </button>
          <button
            type="button"
            class="rcb-btn rcb-btn--confirm"
            @click="triggerPhotoCapture"
          >
            <i class="fas fa-camera"></i>
            Foto
          </button>
        </div>
      </div>
    </div>

    <!-- Visualizador de imagem em tela cheia (com opção de apagar) -->
    <div v-if="viewer" class="rcb-viewer-overlay">
      <img :src="viewer.dataUrl" :alt="viewer.name" class="rcb-viewer-img" />
      <div v-if="viewer.uploadedBy || viewer.uploadedAt" class="rcb-viewer-meta">
        <span v-if="viewer.uploadedBy"><i class="fas fa-user"></i> {{ viewer.uploadedBy }}</span>
        <span v-if="viewer.uploadedAt"><i class="fas fa-clock"></i> {{ formatUploadedAt(viewer.uploadedAt) }}</span>
      </div>
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

    <!-- Aviso informativo: a partir daqui as notas têm status "Não agendado" -->
    <div v-if="showNaoAgendadoNotice" class="rcb-sub-overlay">
      <div class="rcb-sub-card rcb-notice-card">
        <div class="rcb-sub-header">
          <h3>Atenção</h3>
        </div>
        <div class="rcb-sub-body">
          <div class="rcb-notice">
            <i class="fas fa-info-circle"></i>
            <p>
              As próximas notas têm o status
              <strong>"Não agendado"</strong>.
            </p>
          </div>
        </div>
        <div class="rcb-sub-footer rcb-sub-footer--single">
          <button
            type="button"
            class="rcb-btn rcb-btn--confirm"
            @click="dismissNaoAgendadoNotice"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api.js'
import { useSystemDialogStore } from '../stores/systemDialog.js'

// Compressão no cliente antes do upload (acelera o envio e alivia o backend).
const IMAGE_MAX_WIDTH = 1600
const IMAGE_QUALITY = 0.8

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

      // Sub-modal de ressalvas
      showRessalva: false,
      ressalvas: [],
      ressalvasLoading: false,
      ressalvasError: null,
      selectedSiglas: [],
      savingRessalva: false,

      // Sub-modal de imagens
      showImagens: false,
      existingPhotos: [], // já enviadas (Drive): { id, name, dataUrl, uploadedBy, uploadedAt }
      loadingExisting: false,
      // Fila de envio em segundo plano (não bloqueia a UI). Cada item:
      // { id, scheduleId, fileName, base64, dataUrl, status: 'pending'|'enviando'|'erro', error }
      uploadQueue: [],
      processingQueue: false,
      viewer: null, // imagem em visualização: { id, dataUrl, name, uploadedBy, uploadedAt }
      deletingPhoto: false,

      // Decisão da conferência em gravação: 'Recebido' | 'Recusado' | null
      savingDecision: null,

      // Aviso (informativo) na transição para as notas "Não agendado"
      showNaoAgendadoNotice: false,
      naoAgendadoStartIndex: -1, // índice da 1ª nota "Não agendado" (-1 se não houver)
      naoAgendadoNoticeShown: false, // garante que o aviso apareça uma única vez
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
    /** Quantidade de ressalvas atribuídas à NF atual (siglas separadas por vírgula). */
    ressalvaCount() {
      const ex = this.currentSchedule?.exceptions
      if (!ex) return 0
      return String(ex)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean).length
    },
    /** Quantidade de imagens da NF atual; null = ainda carregando a contagem. */
    imageCount() {
      const c = this.currentSchedule?.image_count
      return c === undefined ? null : c
    },
    /** Bloqueia ações do modal principal enquanto há sub-modal/gravação aberta. */
    busy() {
      return (
        this.showRessalva ||
        this.showImagens ||
        this.savingRessalva ||
        this.deletingPhoto ||
        !!this.savingDecision ||
        this.showNaoAgendadoNotice
      )
    },
    /** Itens da fila de envio pertencentes à NF atualmente exibida. */
    currentQueueItems() {
      const id = this.currentSchedule?.id
      if (id == null) return []
      return this.uploadQueue.filter(q => String(q.scheduleId) === String(id))
    },
    /** Quantidade de imagens ainda sendo enviadas (qualquer NF da carga). */
    pendingUploadCount() {
      return this.uploadQueue.filter(
        q => q.status === 'pending' || q.status === 'enviando'
      ).length
    },
  },
  watch: {
    currentIndex() {
      this.ensureImageCount()
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

    /** true quando o status da nota é "Não agendado" (ignora acento/caixa). */
    isNaoAgendado(s) {
      const norm = String(s?.status || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase()
      return norm === 'nao agendado'
    },

    /**
     * Ordena as notas igual à planilha de Conferência (exportConferenciaExcel):
     * dois grupos — agendados e "Não agendado" — e, dentro de cada grupo, por
     * número da NF em ordem DECRESCENTE. O resultado é a sequência linear que o
     * usuário percorre nota a nota.
     */
    orderSchedules(list) {
      const norm = str =>
        String(str || '')
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .trim()
          .toLowerCase()
      const isNaoAgendado = s => norm(s.status) === 'nao agendado'
      const sortDesc = arr =>
        arr.slice().sort((a, b) => {
          const na = parseInt(String(a.number ?? '').replace(/\D/g, ''), 10)
          const nb = parseInt(String(b.number ?? '').replace(/\D/g, ''), 10)
          if (!isNaN(na) && !isNaN(nb)) return nb - na
          return String(b.number ?? '').localeCompare(String(a.number ?? ''))
        })
      const agendados = list.filter(s => !isNaoAgendado(s))
      const naoAgendados = list.filter(isNaoAgendado)
      return [...sortDesc(agendados), ...sortDesc(naoAgendados)]
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
        this.schedules = this.orderSchedules(Array.isArray(list) ? list : [])
        this.currentIndex = 0
        // Após a ordenação, as notas "Não agendado" ficam no fim; guardamos o
        // índice da primeira delas para avisar na transição.
        this.naoAgendadoStartIndex = this.schedules.findIndex(s =>
          this.isNaoAgendado(s)
        )
        this.naoAgendadoNoticeShown = false
        this.ensureImageCount()
      } catch (err) {
        this.error =
          err?.message || 'Não foi possível carregar as notas da carga.'
      } finally {
        this.loading = false
      }
    },

    async close() {
      if (this.busy) return
      // Avisa se ainda há fotos sendo enviadas em segundo plano.
      if (this.pendingUploadCount > 0) {
        const ok = await useSystemDialogStore().showConfirm(
          `Há ${this.pendingUploadCount} imagem(ns) sendo enviada(s). Se fechar agora, o acompanhamento desses envios será interrompido. Deseja fechar mesmo assim?`,
          'Envios em andamento'
        )
        if (!ok) return
      }
      this.$emit('close')
    },

    goBack() {
      if (!this.canGoBack || this.busy) return
      this.currentIndex -= 1
    },

    /** "Recebido": registra a decisão no histórico e avança. */
    onReceived() {
      this.registerDecision('Recebido')
    },

    /**
     * "Recusado": registra a decisão no histórico e avança. As ressalvas e
     * imagens são registradas separadamente pelos botões "Ressalva"/"Imagens".
     */
    onRefused() {
      this.registerDecision('Recusado')
    },

    /**
     * Grava no histórico do agendamento a decisão escolhida pelo usuário
     * ("Recebido"/"Recusado") e só então avança para a próxima nota. Em caso de
     * falha, mantém a nota atual para permitir nova tentativa (não perde o registro).
     */
    async registerDecision(decision) {
      if (this.busy) return
      const schedule = this.currentSchedule
      if (!schedule) {
        this.advance()
        return
      }
      this.savingDecision = decision
      try {
        const resp = await apiService.post(
          `/schedules/${encodeURIComponent(schedule.id)}/conference`,
          { decision }
        )
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        // Reflete a eventual reversão de status ("Em conferência" → "Solicitado").
        if (data && data.status) schedule.status = data.status
        this.advance()
      } catch (err) {
        alert(err?.message || 'Erro ao registrar a decisão. Tente novamente.')
      } finally {
        this.savingDecision = null
      }
    },

    // ---------------------------------------------------------------------
    // Contagem de imagens (modo leve, sem baixar o conteúdo)
    // ---------------------------------------------------------------------
    /** Busca a contagem de imagens da NF atual (apenas se ainda desconhecida). */
    async ensureImageCount() {
      const s = this.currentSchedule
      if (!s || s.image_count !== undefined) return
      s.image_count = null // estado "carregando" para o badge
      try {
        const resp = await apiService.get(
          `/schedules/${encodeURIComponent(s.id)}/images?light=1`
        )
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        s.image_count =
          typeof data?.count === 'number'
            ? data.count
            : ((data && data.images) || []).length
      } catch (_) {
        s.image_count = 0
      }
    },

    // ---------------------------------------------------------------------
    // Ressalvas
    // ---------------------------------------------------------------------
    /** Abre o modal de ressalvas, pré-marcando as já atribuídas à NF. */
    openRessalva() {
      if (this.busy) return
      this.selectedSiglas = this.currentSchedule?.exceptions
        ? String(this.currentSchedule.exceptions)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : []
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

    /** "Voltar" do modal de ressalvas: cancela as alterações. */
    cancelRessalva() {
      if (this.savingRessalva) return
      this.showRessalva = false
      this.selectedSiglas = []
    },

    /**
     * "Confirmar": substitui todas as ressalvas da NF pelas selecionadas
     * (lista vazia = remove todas) e atualiza a contagem do botão.
     */
    async confirmRessalva() {
      if (this.savingRessalva) return
      const schedule = this.currentSchedule
      if (!schedule) return
      this.savingRessalva = true
      try {
        const resp = await apiService.patch(
          `/schedules/${encodeURIComponent(schedule.id)}/exceptions`,
          { siglas: this.selectedSiglas }
        )
        const data = typeof resp === 'string' ? JSON.parse(resp) : resp
        // Reflete localmente para o badge e a info da nota.
        schedule.exceptions =
          data && data.exceptions != null
            ? data.exceptions
            : this.selectedSiglas.join(',')
        this.showRessalva = false
        this.selectedSiglas = []
      } catch (err) {
        alert(err?.message || 'Erro ao salvar ressalvas. Tente novamente.')
      } finally {
        this.savingRessalva = false
      }
    },

    // ---------------------------------------------------------------------
    // Imagens
    // ---------------------------------------------------------------------
    /** Abre o modal de imagens e carrega as miniaturas já existentes. */
    openImagens() {
      if (this.busy) return
      this.showImagens = true
      this.fetchExistingImages()
    },

    /** "Voltar" do modal de imagens: fecha (envios em voo seguem em segundo plano). */
    closeImagens() {
      if (this.deletingPhoto) return
      this.showImagens = false
      this.existingPhotos = []
      this.viewer = null
      // Não recarrega a contagem aqui: ela é mantida localmente pelos envios
      // (onUploadSuccess) e exclusões (deleteViewed), evitando divergir dos
      // uploads ainda em andamento.
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
        // Mantém o badge sincronizado com o que está aberto no modal.
        schedule.image_count = this.existingPhotos.length
      } catch (_) {
        this.existingPhotos = []
      } finally {
        this.loadingExisting = false
      }
    },

    triggerPhotoCapture() {
      this.$refs.photoInput && this.$refs.photoInput.click()
    },

    /**
     * Captura uma foto e a coloca na fila de envio em segundo plano. NÃO bloqueia
     * a interface: o usuário pode tirar outra foto ou avançar de NF enquanto o
     * upload acontece. A foto é comprimida no cliente antes de entrar na fila.
     */
    async onPhotoCaptured(event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = '' // permite recapturar o mesmo arquivo
      if (!file) return
      const schedule = this.currentSchedule
      if (!schedule) return
      const scheduleId = schedule.id // fixa a NF da foto (mesmo se o usuário avançar)

      const dataUrl = await this.compressImageToDataUrl(file)
      const base64 = String(dataUrl).split(',')[1] || ''
      if (!base64) {
        useSystemDialogStore().showAlert(
          'Não foi possível preparar a imagem. Tente novamente.',
          'Erro'
        )
        return
      }

      const safeEmail = String(this.currentUserEmail()).replace(/[^\w.@-]/g, '_')
      const fileName = `${safeEmail}_${this.fileStamp()}.jpg`
      this.uploadQueue.push({
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        scheduleId,
        fileName,
        base64,
        dataUrl, // miniatura otimista (já comprimida)
        status: 'pending',
        error: null,
      })
      this.processUploadQueue() // dispara em background (sem await)
    },

    /**
     * Comprime a imagem via canvas (redimensiona para IMAGE_MAX_WIDTH e
     * recodifica em JPEG IMAGE_QUALITY) e devolve o data URL resultante.
     * Em caso de falha (ou arquivo não-imagem), devolve o data URL original.
     */
    compressImageToDataUrl(file) {
      return new Promise(resolve => {
        const readOriginal = () => {
          const r = new FileReader()
          r.onload = () => resolve(String(r.result || ''))
          r.onerror = () => resolve('')
          r.readAsDataURL(file)
        }
        if (!file || !file.type || !file.type.startsWith('image/')) {
          readOriginal()
          return
        }
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)
        img.onload = () => {
          let { width, height } = img
          if (width > IMAGE_MAX_WIDTH) {
            height = Math.round((height * IMAGE_MAX_WIDTH) / width)
            width = IMAGE_MAX_WIDTH
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          URL.revokeObjectURL(objectUrl)
          try {
            resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY))
          } catch (_) {
            readOriginal()
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          readOriginal()
        }
        img.src = objectUrl
      })
    },

    /**
     * Processa a fila de envio sequencialmente em segundo plano. É reentrante:
     * itens adicionados durante o loop também são enviados. Cada item carrega o
     * seu próprio scheduleId, então acerta a NF correta mesmo após avançar.
     */
    async processUploadQueue() {
      if (this.processingQueue) return
      this.processingQueue = true
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const item = this.uploadQueue.find(q => q.status === 'pending')
          if (!item) break
          item.status = 'enviando'
          try {
            const resp = await apiService.post(
              `/schedules/${encodeURIComponent(item.scheduleId)}/images`,
              { fileName: item.fileName, base64: item.base64 }
            )
            const data = typeof resp === 'string' ? JSON.parse(resp) : resp
            this.onUploadSuccess(item, data)
          } catch (err) {
            item.status = 'erro'
            item.error = err?.message || 'Falha no envio'
          }
        }
      } finally {
        this.processingQueue = false
      }
    },

    /** Conclui um item enviado: remove da fila, atualiza contagem e miniatura. */
    onUploadSuccess(item, data) {
      const i = this.uploadQueue.findIndex(q => q.id === item.id)
      if (i !== -1) this.uploadQueue.splice(i, 1)

      const sched = this.schedules.find(
        s => String(s.id) === String(item.scheduleId)
      )
      if (sched) {
        const cur = typeof sched.image_count === 'number' ? sched.image_count : 0
        sched.image_count = cur + 1
      }

      // Se a NF dessa foto está aberta no sub-modal, mostra a miniatura como
      // "enviada" (nuvem) sem precisar rebaixar tudo do Drive.
      const f = data && data.file
      if (
        this.showImagens &&
        this.currentSchedule &&
        String(this.currentSchedule.id) === String(item.scheduleId)
      ) {
        this.existingPhotos.push({
          id: (f && f.id) || item.id,
          name: (f && f.name) || item.fileName,
          dataUrl: item.dataUrl,
          uploadedBy: (f && f.uploadedBy) || this.currentUserEmail(),
          uploadedAt: (f && f.uploadedAt) || new Date().toISOString(),
        })
      }
    },

    /** Toque numa miniatura da fila: reenvia quando está em erro. */
    onQueueThumbClick(q) {
      if (q && q.status === 'erro') this.retryQueueItem(q)
    },

    /** Recoloca um item com erro na fila para nova tentativa. */
    retryQueueItem(q) {
      if (!q || q.status !== 'erro') return
      q.status = 'pending'
      q.error = null
      this.processUploadQueue()
    },

    openViewer(item) {
      this.viewer = item
    },

    closeViewer() {
      if (this.deletingPhoto) return
      this.viewer = null
    },

    /** Apaga a imagem em visualização (Drive) e atualiza a contagem. */
    async deleteViewed() {
      if (!this.viewer || this.deletingPhoto) return
      const schedule = this.currentSchedule
      this.deletingPhoto = true
      try {
        await apiService.delete(
          `/schedules/${encodeURIComponent(schedule.id)}/images/${encodeURIComponent(this.viewer.id)}`
        )
        this.existingPhotos = this.existingPhotos.filter(
          p => p.id !== this.viewer.id
        )
        if (schedule) schedule.image_count = this.existingPhotos.length
        this.viewer = null
      } catch (err) {
        alert(err?.message || 'Erro ao apagar imagem. Tente novamente.')
      } finally {
        this.deletingPhoto = false
      }
    },

    // ---------------------------------------------------------------------
    // Utilitários
    // ---------------------------------------------------------------------
    /**
     * E-mail do usuário logado (mesma prioridade do restante do app:
     * config.emailSettings.primaryEmail > email > user > username > name).
     */
    currentUserEmail() {
      try {
        const raw = localStorage.getItem('user')
        if (!raw) return 'desconhecido'
        const u = JSON.parse(raw)
        let email = ''
        if (u && u.config) {
          try {
            const c = typeof u.config === 'string' ? JSON.parse(u.config) : u.config
            if (c && c.emailSettings && c.emailSettings.primaryEmail) {
              email = c.emailSettings.primaryEmail
            }
          } catch (_) { /* config inválida — usa fallback abaixo */ }
        }
        if (!email) {
          email =
            (u && (u.email || u.user || u.username || u.name)) || 'desconhecido'
        }
        return String(email)
      } catch (_) {
        return 'desconhecido'
      }
    },

    /** Carimbo de data/hora para o nome do arquivo: aaaa-mm-dd_hh-mm-ss. */
    fileStamp() {
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
    },

    /** Formata o timestamp ISO de upload para exibição no visualizador. */
    formatUploadedAt(iso) {
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return iso
        return d.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (_) {
        return iso
      }
    },

    /** Avança para a próxima nota; ao terminar a última, encerra. */
    advance() {
      if (this.currentIndex < this.total - 1) {
        const nextIndex = this.currentIndex + 1
        this.currentIndex = nextIndex
        // Ao terminar as notas com status diferente de "Não agendado" e cruzar
        // para a primeira "Não agendado", exibe um aviso informativo (uma vez).
        if (
          !this.naoAgendadoNoticeShown &&
          this.naoAgendadoStartIndex > 0 &&
          nextIndex === this.naoAgendadoStartIndex
        ) {
          this.naoAgendadoNoticeShown = true
          this.showNaoAgendadoNotice = true
        }
      } else {
        this.$emit('close')
      }
    },

    /** Fecha o aviso informativo de notas "Não agendado". */
    dismissNaoAgendadoNotice() {
      this.showNaoAgendadoNotice = false
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

/* Linha de ações: Ressalva | Imagens (acima do rodapé) */
.rcb-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  padding: 10px 12px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.rcb-action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 700;
  padding: 12px 10px;
}
.rcb-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rcb-action-btn--ressalva {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}
.rcb-action-btn--ressalva:not(:disabled):hover {
  background: #fde68a;
}
.rcb-action-btn--imagens {
  background: #e0f2fe;
  border-color: #7dd3fc;
  color: #075985;
}
.rcb-action-btn--imagens:not(:disabled):hover {
  background: #bae6fd;
}
.rcb-action-count {
  min-width: 26px;
  height: 24px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  color: inherit;
  font-size: 0.95rem;
  font-weight: 800;
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

/* Sub-modal (Ressalvas / Imagens) */
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
/* Card do aviso informativo (notas "Não agendado") */
.rcb-notice-card {
  max-width: 460px;
}
.rcb-notice {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 2px;
}
.rcb-notice i {
  font-size: 2rem;
  color: #2563eb;
  flex-shrink: 0;
}
.rcb-notice p {
  margin: 0;
  font-size: 1.05rem;
  color: #1e293b;
  line-height: 1.4;
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

/* Imagens */
.rcb-photo-hint {
  margin: 0 0 14px;
  color: #475569;
  font-size: 0.95rem;
}
.rcb-photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  padding: 24px 0;
}
.rcb-photo-empty i {
  font-size: 2.2rem;
}
.rcb-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  margin-bottom: 4px;
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
.rcb-photo-badge--uploading {
  background: rgba(37, 99, 235, 0.92);
}
.rcb-photo-badge--error {
  background: rgba(220, 38, 38, 0.95);
}
/* Miniaturas ainda em envio: levemente esmaecidas. */
.rcb-photo-thumb.is-uploading img {
  opacity: 0.6;
}
.rcb-photo-thumb.is-error {
  border-color: #fca5a5;
}
.rcb-photo-thumb.is-error img {
  opacity: 0.55;
}
.rcb-photo-uploading-note {
  margin-top: 8px;
  color: #2563eb;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 6px;
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
  max-height: calc(100% - 120px);
  object-fit: contain;
  border-radius: 8px;
}
.rcb-viewer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 12px;
  color: #e2e8f0;
  font-size: 0.85rem;
}
.rcb-viewer-meta i {
  margin-right: 4px;
  opacity: 0.8;
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
</style>
