<template>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content photos-modal">
      <div class="modal-header">
        <h3>
          <i class="fas fa-camera"></i>
          Evidências
        </h3>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="loader-spinner"></div>
          <p>Carregando evidências...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
        </div>

        <div v-else>
          <!-- Galeria de evidências (imagens e vídeos) -->
          <div v-if="images.length > 0" class="photos-grid">
            <div
              v-for="(item, index) in images"
              :key="index"
              class="photo-item"
            >
              <div class="photo-preview" @click="viewImage(item)">
                <template v-if="item.isVideo">
                  <video
                    :src="item.dataUrl"
                    :title="item.name"
                    class="photo-media video-media"
                    playsinline
                    muted
                    preload="metadata"
                  ></video>
                </template>
                <template v-else>
                  <img
                    :src="item.dataUrl"
                    :alt="item.name"
                    class="photo-media"
                    loading="lazy"
                  />
                </template>
              </div>
              <p class="photo-name">{{ formatUploadDate(item.uploadedAt) }}</p>
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="fas fa-images"></i>
            <h4>Nenhuma evidência encontrada</h4>
            <p>Adicione imagens ou vídeos usando as opções abaixo</p>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/*,video/*"
            capture="environment"
            multiple
            @change="handleFileSelect"
            style="display: none"
          />
        </div>
      </div>

      <!-- Fila de uploads em andamento -->
      <div v-if="uploadQueue.length > 0" class="upload-queue">
        <div
          v-for="(item, idx) in uploadQueue"
          :key="idx"
          class="upload-queue-item"
          :class="{
            'upload-done': item.status === 'done',
            'upload-error': item.status === 'error',
          }"
        >
          <div class="upload-queue-info">
            <i :class="uploadQueueIcon(item.status)"></i>
            <span class="upload-queue-name">{{ item.fileName }}</span>
          </div>
          <div v-if="item.status === 'uploading'" class="upload-progress-bar">
            <div
              class="upload-progress-fill"
              :style="{ width: item.progress + '%' }"
            ></div>
          </div>
          <span v-if="item.status === 'error'" class="upload-queue-error"
            >Falha</span
          >
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-buttons">
          <button
            @click="openFileInput"
            class="btn-upload"
            :disabled="isUploading"
          >
            <i
              :class="isUploading ? 'fas fa-spinner fa-spin' : 'fas fa-camera'"
            ></i>
            {{ isUploading ? 'Enviando...' : 'Enviar Imagem' }}
          </button>
          <button @click="closeModal" class="btn-close-footer">
            <i class="fas fa-times"></i>
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de visualização de evidência (imagem ou vídeo) -->
    <div
      v-if="viewingImage"
      class="image-viewer-overlay"
      @click="closeImageViewer"
    >
      <div class="image-viewer-content" @click.stop>
        <button
          v-if="!deletingImage && canDeleteImages"
          @click="deleteImageFromViewer"
          class="image-viewer-delete"
          title="Excluir evidência"
        >
          <i class="fas fa-trash"></i>
        </button>
        <button @click="closeImageViewer" class="image-viewer-close">
          <i class="fas fa-times"></i>
        </button>
        <!-- Estado de carregamento durante exclusão -->
        <div v-if="deletingImage" class="image-viewer-deleting">
          <div class="loader-spinner delete-spinner"></div>
          <p>Excluindo evidência...</p>
        </div>
        <template v-else>
          <template v-if="viewingImage.isVideo">
            <video
              :src="viewingImage.dataUrl"
              :title="viewingImage.name"
              class="image-viewer-video"
              controls
              autoplay
            ></video>
          </template>
          <template v-else>
            <img
              :src="viewingImage.dataUrl"
              :alt="viewingImage.name"
              class="image-viewer-img"
            />
          </template>
          <div class="image-viewer-info">
            <p class="image-viewer-name">{{ viewingImage.name }}</p>
            <div class="image-viewer-metadata">
              <p class="metadata-item">
                <i class="fas fa-calendar-alt"></i>
                <span>{{ formatUploadDate(viewingImage.uploadedAt) }}</span>
              </p>
              <p class="metadata-item">
                <i class="fas fa-user"></i>
                <span>{{ viewingImage.uploadedBy }}</span>
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const IMAGE_MAX_WIDTH = 1920
const IMAGE_QUALITY = 0.8

export default {
  name: 'LotPhotosModal',
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    lotCode: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      error: null,
      images: [],
      deletingImage: null,
      viewingImage: null,
      uploadQueue: [],
      isUploading: false,
    }
  },
  computed: {
    canDeleteImages() {
      const userData = localStorage.getItem('user')
      if (!userData) return false
      try {
        const user = JSON.parse(userData)
        return user.level_access !== 1
      } catch {
        return false
      }
    },
  },
  watch: {
    showModal(newVal) {
      if (newVal && this.lotCode) {
        this.loadImages()
      }
    },
    lotCode() {
      if (this.showModal && this.lotCode) {
        this.loadImages()
      }
    },
  },
  methods: {
    getUserLevel() {
      const userData = localStorage.getItem('user')
      if (!userData) return null
      try {
        return JSON.parse(userData).level_access
      } catch {
        return null
      }
    },

    async loadImages() {
      if (!this.lotCode) return

      this.loading = true
      this.error = null

      try {
        const token = localStorage.getItem('token')
        const baseURL = axios.defaults.baseURL || ''

        const response = await axios.get(
          `/expeditions/lot/${this.lotCode}/images/list`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        )

        if (response.data.success && Array.isArray(response.data.items)) {
          this.images = response.data.items
            .filter(item => item && item.id)
            .map(item => {
              const mimeType =
                item.mimeType || this.getMimeTypeFromName(item.fileName)
              const isVideo = mimeType.startsWith('video/')
              const downloadUrl = `${baseURL}/expeditions/lot/${this.lotCode}/images/${encodeURIComponent(item.id)}/download?token=${encodeURIComponent(token)}`
              return {
                id: item.id,
                name: item.fileName || item.id,
                mimeType,
                isVideo,
                uploadedAt: item.uploadedAt || new Date().toISOString(),
                uploadedBy: item.uploadedBy || 'Sistema',
                dataUrl: downloadUrl,
                source: item.source || 'drive',
              }
            })
          this.images.sort(
            (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
          )
        } else {
          this.images = []
        }
      } catch (error) {
        console.error('Erro ao carregar imagens:', error)
        const status = error.response?.status
        const is5xx = status >= 500 && status < 600
        const isTimeout =
          error.code === 'ECONNABORTED' || error.message?.includes('timeout')
        const isNetwork =
          error.code === 'ERR_NETWORK' || error.code === 'ECONNRESET'
        if (is5xx || isTimeout || isNetwork) {
          this.error =
            'Servidor temporariamente indisponível. Tente novamente em alguns instantes.'
        } else {
          this.error =
            error.response?.data?.error ||
            error.response?.data?.message ||
            'Erro ao carregar imagens'
        }
      } finally {
        this.loading = false
        if (this.lotCode) {
          this.$emit('loaded', {
            lotCode: this.lotCode,
            count: this.images.length,
          })
        }
      }
    },

    openFileInput() {
      this.$refs.fileInput?.click()
    },

    /**
     * Comprime imagem via canvas. Vídeos passam direto sem compressão.
     * Retorna { blob, previewUrl } — blob é o binário comprimido, previewUrl para exibição local.
     */
    compressImage(file) {
      return new Promise(resolve => {
        if (!file.type.startsWith('image/')) {
          resolve({ blob: file, previewUrl: URL.createObjectURL(file) })
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
          canvas.toBlob(
            blob => {
              URL.revokeObjectURL(objectUrl)
              const previewUrl = URL.createObjectURL(blob)
              resolve({ blob, previewUrl })
            },
            'image/jpeg',
            IMAGE_QUALITY
          )
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          resolve({ blob: file, previewUrl: URL.createObjectURL(file) })
        }
        img.src = objectUrl
      })
    },

    async handleFileSelect(event) {
      const files = event.target.files
      if (!files || files.length === 0) return

      for (const file of files) {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
          alert(
            `O arquivo ${file.name} não é uma imagem nem um vídeo suportado`
          )
          continue
        }

        const queueItem = {
          fileName: file.name,
          file,
          status: 'pending',
          progress: 0,
        }
        this.uploadQueue.push(queueItem)
      }

      event.target.value = ''
      this.processQueue()
    },

    async processQueue() {
      if (this.isUploading) return
      this.isUploading = true

      while (this.uploadQueue.some(q => q.status === 'pending')) {
        const item = this.uploadQueue.find(q => q.status === 'pending')
        if (!item) break
        item.status = 'uploading'

        try {
          await this.uploadFile(item)
          item.status = 'done'
        } catch {
          item.status = 'error'
        }
      }

      this.isUploading = false

      setTimeout(() => {
        this.uploadQueue = this.uploadQueue.filter(q => q.status === 'error')
      }, 2000)
    },

    async uploadFile(queueItem) {
      if (!this.lotCode) return

      const { blob, previewUrl } = await this.compressImage(queueItem.file)

      const ext = queueItem.fileName.split('.').pop().toLowerCase()
      const finalName =
        queueItem.file.type.startsWith('image/') &&
        ext !== 'jpg' &&
        ext !== 'jpeg'
          ? queueItem.fileName.replace(/\.[^.]+$/, '.jpg')
          : queueItem.fileName

      const formData = new FormData()
      formData.append('file', blob, finalName)

      const token = localStorage.getItem('token')
      const response = await axios.post(
        `/expeditions/lot/${this.lotCode}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            if (progressEvent.total) {
              queueItem.progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              )
            }
          },
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao salvar evidência')
      }

      const userData = localStorage.getItem('user')
      let uploadedBy = 'Você'
      try {
        uploadedBy = JSON.parse(userData)?.user || 'Você'
      } catch {
        /* keep default */
      }

      const mimeType = this.getMimeTypeFromName(finalName)
      this.images.unshift({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: finalName,
        mimeType,
        isVideo: mimeType.startsWith('video/'),
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        dataUrl: previewUrl,
        isLocal: true,
      })
      this.$emit('loaded', { lotCode: this.lotCode, count: this.images.length })
      this.$emit('refresh')
    },

    uploadQueueIcon(status) {
      const map = {
        pending: 'fas fa-clock text-gray',
        uploading: 'fas fa-spinner fa-spin text-blue',
        done: 'fas fa-check-circle text-green',
        error: 'fas fa-exclamation-circle text-red',
      }
      return map[status] || 'fas fa-file'
    },

    async deleteImage(imageId) {
      // Verificar nível de acesso do usuário
      const userLevel = this.getUserLevel()
      if (userLevel === 1) {
        alert('Você não tem permissão para excluir evidências.')
        return
      }

      // Validar se imageId foi fornecido
      if (!imageId) {
        console.error('❌ Erro: imageId não foi fornecido para exclusão')
        alert('Erro: Identificador da evidência não encontrado')
        return
      }

      if (!confirm(`Deseja realmente excluir esta evidência?`)) {
        return
      }

      this.deletingImage = imageId
      this.error = null

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Token de autenticação não encontrado')
        }

        if (!this.lotCode) {
          throw new Error('Código do lote não encontrado')
        }

        const response = await axios.delete(
          `/expeditions/lot/${this.lotCode}/images/${encodeURIComponent(
            imageId
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (response.data.success) {
          // Recarregar imagens
          await this.loadImages()
          this.$emit('refresh')
        } else {
          throw new Error(response.data.message || 'Erro ao excluir imagem')
        }
      } catch (error) {
        console.error('❌ Erro ao excluir imagem:', error)
        alert(
          error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Erro ao excluir imagem'
        )
      } finally {
        this.deletingImage = null
      }
    },

    viewImage(item) {
      // Abrir evidência (imagem ou vídeo) em modal interno
      this.viewingImage = item
    },

    closeImageViewer() {
      this.viewingImage = null
    },

    async deleteImageFromViewer() {
      // Verificar nível de acesso do usuário
      const userLevel = this.getUserLevel()
      if (userLevel === 1) {
        alert('Você não tem permissão para excluir evidências.')
        return
      }

      if (!this.viewingImage) return

      const imageId = this.viewingImage.id || this.viewingImage.name
      if (!imageId) {
        alert('Erro: Identificador da evidência não encontrado')
        return
      }

      if (!confirm(`Deseja realmente excluir esta evidência?`)) {
        return
      }

      this.deletingImage = imageId
      this.error = null

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Token de autenticação não encontrado')
        }

        if (!this.lotCode) {
          throw new Error('Código do lote não encontrado')
        }

        const response = await axios.delete(
          `/expeditions/lot/${this.lotCode}/images/${encodeURIComponent(
            imageId
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (response.data.success) {
          // Fechar o visualizador após exclusão bem-sucedida
          this.closeImageViewer()
          // Recarregar imagens
          await this.loadImages()
          this.$emit('refresh')
        } else {
          throw new Error(response.data.message || 'Erro ao excluir imagem')
        }
      } catch (error) {
        console.error('❌ Erro ao excluir imagem:', error)
        alert(
          error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Erro ao excluir imagem'
        )
      } finally {
        this.deletingImage = null
      }
    },

    closeModal() {
      this.$emit('close')
    },
    /**
     * Formata a data e hora de upload
     */
    formatUploadDate(dateString) {
      if (!dateString) return 'Data não disponível'

      try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        return `${day}/${month}/${year} ${hours}:${minutes}`
      } catch (e) {
        return 'Data inválida'
      }
    },
    /**
     * Detecta o MIME type a partir da extensão do arquivo
     */
    getMimeTypeFromName(fileName) {
      if (!fileName || typeof fileName !== 'string') {
        return 'application/octet-stream'
      }

      const ext = fileName.split('.').pop().toLowerCase()

      const imageTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      }

      const videoTypes = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg',
        ogv: 'video/ogg',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        m4v: 'video/x-m4v',
      }

      if (imageTypes[ext]) return imageTypes[ext]
      if (videoTypes[ext]) return videoTypes[ext]

      // Fallback genérico
      return 'application/octet-stream'
    },
  },
}
</script>

<style scoped>
/* Fila de uploads */
.upload-queue {
  padding: 8px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  max-height: 140px;
  overflow-y: auto;
}

.upload-queue-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  background: white;
  margin-bottom: 4px;
  border: 1px solid #e5e7eb;
  transition: background 0.3s;
}

.upload-queue-item.upload-done {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.upload-queue-item.upload-error {
  background: #fef2f2;
  border-color: #fecaca;
}

.upload-queue-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
}

.upload-queue-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.upload-queue-error {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
}

.upload-progress-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.text-gray {
  color: #9ca3af;
}
.text-blue {
  color: #3b82f6;
}
.text-green {
  color: #10b981;
}
.text-red {
  color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 10vh 20px;
  box-sizing: border-box;
}

.photos-modal {
  max-width: 900px;
  height: 80vh;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 0 auto;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header .btn-close,
.modal-header button.btn-close:not(.btn-close-footer),
button.btn-close[data-v-afe62606]:not(.btn-close-footer) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  position: absolute !important;
  left: -9999px !important;
  pointer-events: none !important;
}

.modal-header h3 {
  margin: 0 auto;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.photo-item {
  position: relative;
}

.photo-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.photo-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.photo-preview img,
.photo-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-name {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  word-break: break-word;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  width: 100%;
  box-sizing: border-box;
}

.footer-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  margin: 0;
  padding: 0;
}

.btn-upload,
.btn-close-footer {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-upload {
  background: #10b981;
  color: white;
}

.btn-upload:hover {
  background: #059669;
  transform: translateY(-2px);
}

.btn-close-footer {
  background: #6b7280;
  color: white;
}

.btn-close-footer:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.loader-spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.delete-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.delete-spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
  margin: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Modal de visualização de imagem */
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 60px 20px 20px 20px;
  box-sizing: border-box;
}

.image-viewer-content {
  position: relative;
  width: 100%;
  max-width: 90vw;
  height: 100%;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.image-viewer-close,
.image-viewer-delete {
  position: absolute;
  top: -50px;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition:
    background 0.2s,
    transform 0.2s;
  z-index: 10001;
  flex-shrink: 0;
}

.image-viewer-close {
  right: 0;
  background: rgba(255, 255, 255, 0.2);
}

.image-viewer-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.image-viewer-delete {
  left: 0;
  background: rgba(239, 68, 68, 0.8);
}

.image-viewer-delete:hover {
  background: rgba(239, 68, 68, 1);
  transform: scale(1.1);
}

.image-viewer-deleting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  max-height: calc(100vh - 200px);
  color: white;
  gap: 16px;
  width: 100%;
}

.image-viewer-deleting p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.image-viewer-img {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.image-viewer-info {
  margin-top: 16px;
  color: white;
  text-align: center;
  width: 100%;
}

.image-viewer-name {
  font-size: 14px;
  margin-bottom: 12px;
  word-break: break-word;
  opacity: 0.9;
}

.image-viewer-metadata {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.metadata-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.metadata-item i {
  font-size: 12px;
  opacity: 0.7;
}

.image-viewer-video {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background: black;
}

/* Media queries para responsividade em mobile */
@media (max-width: 768px) {
  .image-viewer-overlay {
    padding: 60px 10px 10px 10px !important;
  }

  .image-viewer-content {
    max-width: 100% !important;
    max-height: calc(100vh - 80px) !important;
  }

  .image-viewer-close,
  .image-viewer-delete {
    width: 36px !important;
    height: 36px !important;
    font-size: 18px !important;
    top: -50px !important;
  }

  .image-viewer-close {
    right: 0 !important;
  }

  .image-viewer-delete {
    left: 0 !important;
  }

  .image-viewer-img,
  .image-viewer-video {
    max-height: calc(100vh - 180px) !important;
  }

  .image-viewer-info {
    margin-top: 12px !important;
    font-size: 12px !important;
  }

  .image-viewer-name {
    font-size: 12px !important;
  }

  .metadata-item {
    font-size: 11px !important;
  }

  .image-viewer-deleting {
    max-height: calc(100vh - 180px) !important;
    min-height: 150px !important;
  }

  .photos-modal {
    max-width: 95vw !important;
    height: 80vh !important;
    max-height: 80vh !important;
  }

  .modal-overlay {
    padding: 10vh 10px !important;
  }

  .modal-header {
    padding: 16px 18px !important;
    justify-content: center !important;
  }

  .modal-header h3 {
    font-size: 16px !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
    white-space: nowrap !important;
    line-height: 1.3 !important;
    margin: 0 auto !important;
    justify-content: center !important;
  }

  .modal-header h3 i {
    font-size: 18px !important;
  }

  .modal-body {
    padding: 16px 18px !important;
    flex: 1 !important;
    min-height: 0 !important;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
    gap: 12px !important;
  }

  .photo-name {
    font-size: 11px !important;
  }

  .add-photos-section h4 {
    font-size: 14px !important;
  }

  .btn-upload,
  .btn-close-footer {
    padding: 10px 16px !important;
    font-size: 13px !important;
  }

  .empty-state h4 {
    font-size: 16px !important;
  }

  .empty-state p {
    font-size: 13px !important;
  }
}

@media (max-width: 480px) {
  .image-viewer-overlay {
    padding: 60px 5px 5px 5px !important;
  }

  .image-viewer-content {
    max-height: calc(100vh - 70px) !important;
  }

  .image-viewer-close,
  .image-viewer-delete {
    width: 32px !important;
    height: 32px !important;
    font-size: 16px !important;
    top: -50px !important;
  }

  .image-viewer-close {
    right: 0 !important;
  }

  .image-viewer-delete {
    left: 0 !important;
  }

  .image-viewer-img,
  .image-viewer-video {
    max-height: calc(100vh - 170px) !important;
  }

  .image-viewer-info {
    margin-top: 8px !important;
  }

  .image-viewer-name {
    font-size: 11px !important;
  }

  .metadata-item {
    font-size: 10px !important;
  }

  .image-viewer-deleting {
    max-height: calc(100vh - 170px) !important;
    min-height: 120px !important;
  }

  .image-viewer-deleting p {
    font-size: 14px !important;
  }

  .modal-header {
    justify-content: center !important;
  }

  .modal-header h3 {
    font-size: 14px !important;
    flex-wrap: nowrap !important;
    white-space: nowrap !important;
    margin: 0 auto !important;
    justify-content: center !important;
  }

  .modal-body {
    padding: 12px 14px !important;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
    gap: 10px !important;
  }

  .photo-name {
    font-size: 10px !important;
  }

  .add-photos-buttons {
    flex-direction: column !important;
  }

  .btn-upload,
  .btn-close-footer {
    width: 100% !important;
    justify-content: center !important;
    font-size: 12px !important;
    padding: 8px 14px !important;
  }
}

/* Media query para telas com altura reduzida */
@media (max-height: 600px) {
  .image-viewer-overlay {
    padding: 60px 10px 10px 10px !important;
  }

  .image-viewer-content {
    max-height: calc(100vh - 80px) !important;
  }

  .image-viewer-close,
  .image-viewer-delete {
    top: -50px !important;
  }

  .image-viewer-img,
  .image-viewer-video {
    max-height: calc(100vh - 180px) !important;
  }

  .image-viewer-info {
    margin-top: 8px !important;
  }

  .image-viewer-name {
    font-size: 11px !important;
    margin-bottom: 6px !important;
  }

  .image-viewer-metadata {
    margin-top: 6px !important;
    padding-top: 6px !important;
    gap: 4px !important;
  }

  .metadata-item {
    font-size: 10px !important;
  }

  .image-viewer-deleting {
    max-height: calc(100vh - 180px) !important;
    min-height: 100px !important;
  }

  .image-viewer-deleting p {
    font-size: 13px !important;
  }
}

/* Media query para telas muito pequenas em altura */
@media (max-height: 500px) {
  .image-viewer-overlay {
    padding: 60px 5px 5px 5px !important;
  }

  .image-viewer-content {
    max-height: calc(100vh - 70px) !important;
  }

  .image-viewer-close,
  .image-viewer-delete {
    top: -50px !important;
  }

  .image-viewer-img,
  .image-viewer-video {
    max-height: calc(100vh - 160px) !important;
  }

  .image-viewer-info {
    margin-top: 4px !important;
  }

  .image-viewer-name {
    font-size: 10px !important;
    margin-bottom: 4px !important;
  }

  .image-viewer-metadata {
    margin-top: 4px !important;
    padding-top: 4px !important;
    gap: 2px !important;
  }

  .metadata-item {
    font-size: 9px !important;
  }

  .image-viewer-deleting {
    max-height: calc(100vh - 160px) !important;
    min-height: 80px !important;
  }

  .image-viewer-deleting p {
    font-size: 12px !important;
  }
}
</style>
