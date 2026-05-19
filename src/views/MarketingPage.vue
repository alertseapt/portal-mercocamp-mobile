<template>
  <div class="marketing-page">
    <div class="page-header">
      <h2>
        <i class="fas fa-bullhorn"></i>
        Painel de Marketing
      </h2>
      <p class="page-description">
        Gerencie as imagens exibidas no carrossel de notícias da página
        principal
      </p>
    </div>

    <!-- Formulário de criação -->
    <div class="marketing-form-container">
      <form @submit.prevent="submitForm" class="marketing-form">
        <!-- Upload de Imagem -->
        <div class="form-group">
          <label for="image-upload" class="form-label">
            <i class="fas fa-image"></i>
            Imagem do Banner
            <span class="required">*</span>
          </label>
          <div class="image-upload-container">
            <input
              id="image-upload"
              ref="imageInput"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              @change="handleImageUpload"
              class="image-input"
            />
            <div
              v-if="!imagePreview && !formData.imagebase64"
              class="upload-placeholder"
            >
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Clique para selecionar uma imagem</p>
              <span class="upload-hint"
                >Tamanho recomendado: 1920 x 600 pixels</span
              >
            </div>
            <div v-if="imagePreview" class="image-preview-container">
              <img :src="imagePreview" alt="Preview" class="image-preview" />
              <button
                type="button"
                @click="removeImage"
                class="remove-image-btn"
                title="Remover imagem"
              >
                <i class="fas fa-times"></i>
              </button>
              <div v-if="imageDimensions" class="image-info">
                <span :class="{ 'dimension-error': !isValidDimensions }">
                  {{ imageDimensions.width }} x {{ imageDimensions.height }} px
                </span>
                <span v-if="!isValidDimensions" class="error-text">
                  <i class="fas fa-exclamation-triangle"></i>
                  Tamanho deve ser 1600 x 400 pixels
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Inicial -->
        <div class="form-group">
          <label for="datein" class="form-label">
            <i class="fas fa-calendar-alt"></i>
            Data Inicial
            <span class="required">*</span>
          </label>
          <input
            id="datein"
            v-model="formData.datein"
            type="datetime-local"
            required
            class="form-input"
          />
        </div>

        <!-- Data Final -->
        <div class="form-group">
          <label for="dateout" class="form-label">
            <i class="fas fa-calendar-check"></i>
            Data Final
            <span class="required">*</span>
          </label>
          <input
            id="dateout"
            v-model="formData.dateout"
            type="datetime-local"
            required
            class="form-input"
          />
        </div>

        <!-- Tempo de Exibição -->
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-clock"></i>
            Tempo de Exibição (segundos)
          </label>
          <div class="display-time-stepper">
            <button
              type="button"
              class="stepper-btn"
              :disabled="formData.displayTime <= 2"
              @click="decrementDisplayTime"
              title="Diminuir"
            >
              <i class="fas fa-chevron-down"></i>
            </button>
            <input
              :value="formData.displayTime"
              type="text"
              readonly
              class="form-input display-time-input"
              tabindex="-1"
            />
            <button
              type="button"
              class="stepper-btn"
              :disabled="formData.displayTime >= 5"
              @click="incrementDisplayTime"
              title="Aumentar"
            >
              <i class="fas fa-chevron-up"></i>
            </button>
          </div>
          <p class="form-hint">
            Tempo que o banner ficará visível no carrossel antes de passar para
            o próximo. Varia de 2 a 5 segundos.
          </p>
        </div>

        <!-- Sigla do Armazém -->
        <div class="form-group">
          <label for="visible" class="form-label">
            <i class="fas fa-warehouse"></i>
            Sigla do Armazém (CD)
          </label>
          <input
            id="visible"
            v-model="formData.visible"
            type="text"
            placeholder="Ex: ML, C1, CV ou CR, ML, SP"
            @input="validateSigla"
            class="form-input"
            :class="{ 'input-error': siglaError }"
          />
          <p v-if="siglaError" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ siglaError }}
          </p>
          <p v-else class="form-hint">
            Digite as siglas dos armazéns separadas por vírgula (ex: ML, C1, CV
            ou CR, ML, SP). Deixe vazio para exibir em todos os armazéns.
          </p>
        </div>

        <!-- Botões de ação -->
        <div class="form-actions">
          <button
            type="submit"
            :disabled="!isFormValid || loading"
            class="btn btn-primary"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ loading ? 'Salvando...' : 'Salvar Banner' }}
          </button>
          <button
            type="button"
            @click="resetForm"
            :disabled="loading"
            class="btn btn-secondary"
          >
            <i class="fas fa-redo"></i>
            Limpar
          </button>
        </div>
      </form>
    </div>

    <!-- Lista de banners existentes -->
    <div class="banners-list-container">
      <h3>
        <i class="fas fa-list"></i>
        Banners Cadastrados
      </h3>
      <div v-if="loadingBanners" class="loading-container">
        <div class="loader-spinner"></div>
        <p>Carregando banners...</p>
      </div>
      <div v-else-if="banners.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>Nenhum banner cadastrado ainda</p>
      </div>
      <div v-else class="banners-list">
        <div
          v-for="banner in banners"
          :key="banner.id"
          class="banner-list-item"
        >
          <div class="banner-list-image">
            <img
              :src="getImageSrc(banner.imagebase64)"
              alt="Banner"
              @error="handleImageError"
            />
          </div>
          <div class="banner-list-info">
            <div class="banner-list-details">
              <div class="banner-dates">
                <span class="date-item">
                  <i class="fas fa-calendar-alt"></i>
                  Início: {{ formatDate(banner.datein) }}
                </span>
                <span class="date-item">
                  <i class="fas fa-calendar-check"></i>
                  Fim: {{ formatDate(banner.dateout) }}
                </span>
              </div>
              <div class="banner-visible">
                <i class="fas fa-warehouse"></i>
                {{ formatVisibleStorages(banner.visible) }}
              </div>
            </div>
            <div class="banner-list-actions">
              <button
                @click="openEditModal(banner)"
                class="btn-edit"
                title="Editar banner"
                :disabled="loading"
              >
                <i class="fas fa-edit"></i>
                Editar
              </button>
              <button
                @click="deleteBanner(banner.id)"
                class="btn-delete"
                title="Excluir banner"
                :disabled="loading"
              >
                <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-trash"></i>
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edição -->
    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-edit"></i>
            Editar Banner
          </h3>
          <button class="modal-close" @click="closeEditModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateBanner" class="marketing-form">
            <!-- Upload de Imagem -->
            <div class="form-group">
              <label for="edit-image-upload" class="form-label">
                <i class="fas fa-image"></i>
                Imagem do Banner
                <span class="required">*</span>
              </label>
              <div class="image-upload-container">
                <input
                  id="edit-image-upload"
                  ref="editImageInput"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  @change="handleEditImageUpload"
                  class="image-input"
                />
                <div
                  v-if="!editImagePreview && !editFormData.imagebase64"
                  class="upload-placeholder"
                >
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Clique para selecionar uma nova imagem</p>
                  <span class="upload-hint"
                    >Tamanho recomendado: 1920 x 600 pixels</span
                  >
                </div>
                <div
                  v-if="editImagePreview || editFormData.imagebase64"
                  class="image-preview-container"
                >
                  <img
                    :src="
                      editImagePreview || getImageSrc(editFormData.imagebase64)
                    "
                    alt="Preview"
                    class="image-preview"
                  />
                  <button
                    type="button"
                    @click="removeEditImage"
                    class="remove-image-btn"
                    title="Remover imagem"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                  <div v-if="editImageDimensions" class="image-info">
                    <span
                      :class="{ 'dimension-error': !isEditValidDimensions }"
                    >
                      {{ editImageDimensions.width }} x
                      {{ editImageDimensions.height }} px
                    </span>
                    <span v-if="!isEditValidDimensions" class="error-text">
                      <i class="fas fa-exclamation-triangle"></i>
                      Tamanho deve ser 1920 x 600 pixels
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Inicial -->
            <div class="form-group">
              <label for="edit-datein" class="form-label">
                <i class="fas fa-calendar-alt"></i>
                Data Inicial
                <span class="required">*</span>
              </label>
              <input
                id="edit-datein"
                v-model="editFormData.datein"
                type="datetime-local"
                required
                class="form-input"
              />
            </div>

            <!-- Data Final -->
            <div class="form-group">
              <label for="edit-dateout" class="form-label">
                <i class="fas fa-calendar-check"></i>
                Data Final
                <span class="required">*</span>
              </label>
              <input
                id="edit-dateout"
                v-model="editFormData.dateout"
                type="datetime-local"
                required
                class="form-input"
              />
            </div>

            <!-- Tempo de Exibição -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-clock"></i>
                Tempo de Exibição (segundos)
              </label>
              <div class="display-time-stepper">
                <button
                  type="button"
                  class="stepper-btn"
                  :disabled="editFormData.displayTime <= 2"
                  @click="decrementEditDisplayTime"
                  title="Diminuir"
                >
                  <i class="fas fa-chevron-down"></i>
                </button>
                <input
                  :value="editFormData.displayTime"
                  type="text"
                  readonly
                  class="form-input display-time-input"
                  tabindex="-1"
                />
                <button
                  type="button"
                  class="stepper-btn"
                  :disabled="editFormData.displayTime >= 5"
                  @click="incrementEditDisplayTime"
                  title="Aumentar"
                >
                  <i class="fas fa-chevron-up"></i>
                </button>
              </div>
              <p class="form-hint">
                Tempo que o banner ficará visível no carrossel antes de passar
                para o próximo. Varia de 2 a 5 segundos.
              </p>
            </div>

            <!-- Sigla do Armazém -->
            <div class="form-group">
              <label for="edit-visible" class="form-label">
                <i class="fas fa-warehouse"></i>
                Sigla do Armazém (CD)
              </label>
              <input
                id="edit-visible"
                v-model="editFormData.visible"
                type="text"
                placeholder="Ex: ML, C1, CV ou CR, ML, SP"
                @input="validateEditSigla"
                class="form-input"
                :class="{ 'input-error': editSiglaError }"
              />
              <p v-if="editSiglaError" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ editSiglaError }}
              </p>
              <p v-else class="form-hint">
                Digite as siglas dos armazéns separadas por vírgula (ex: ML, C1,
                CV ou CR, ML, SP). Deixe vazio para exibir em todos os armazéns.
              </p>
            </div>

            <!-- Botões de ação -->
            <div class="form-actions">
              <button
                type="submit"
                :disabled="!isEditFormValid || loading"
                class="btn btn-primary"
              >
                <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
              <button
                type="button"
                @click="closeEditModal"
                :disabled="loading"
                class="btn btn-secondary"
              >
                <i class="fas fa-times"></i>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MarketingPage',
  emits: ['notification'],
  data() {
    return {
      formData: {
        imagebase64: null,
        datein: '',
        dateout: '',
        visible: '',
        displayTime: 5, // Padrão: 5 segundos
      },
      imagePreview: null,
      imageDimensions: null,
      siglaError: null,
      loading: false,
      loadingBanners: false,
      banners: [],
      editingBanner: null,
      editFormData: {
        imagebase64: null,
        datein: '',
        dateout: '',
        visible: '',
        displayTime: 5, // Padrão: 5 segundos
      },
      editImagePreview: null,
      editImageDimensions: null,
      editSiglaError: null,
      showEditModal: false,
    }
  },
  computed: {
    isValidDimensions() {
      return (
        this.imageDimensions &&
        this.imageDimensions.width === 1920 &&
        this.imageDimensions.height === 600
      )
    },
    isFormValid() {
      // Se não tem imagem ainda, não precisa validar dimensões
      if (!this.formData.imagebase64) {
        return false
      }

      return (
        this.formData.datein &&
        this.formData.dateout &&
        this.isValidDimensions &&
        !this.siglaError
      )
    },
    isEditValidDimensions() {
      return (
        this.editImageDimensions &&
        this.editImageDimensions.width === 1920 &&
        this.editImageDimensions.height === 600
      )
    },
    isEditFormValid() {
      // Se não tem imagem ainda, não precisa validar dimensões
      if (!this.editFormData.imagebase64) {
        return false
      }

      // Se tem nova imagem, validar dimensões
      if (this.editImageDimensions && !this.isEditValidDimensions) {
        return false
      }

      return (
        this.editFormData.datein &&
        this.editFormData.dateout &&
        !this.editSiglaError
      )
    },
  },
  mounted() {
    console.log('MarketingPage mounted')
    try {
      this.loadBanners()
    } catch (error) {
      console.error('Erro no mounted do MarketingPage:', error)
      // Não bloquear renderização em caso de erro
    }
  },
  methods: {
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // Validar tipo de arquivo
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        this.addNotification(
          'Por favor, selecione uma imagem PNG ou JPG',
          'error'
        )
        return
      }

      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.addNotification('A imagem deve ter no máximo 10MB', 'error')
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const originalWidth = img.width
          const originalHeight = img.height
          const targetWidth = 1920
          const targetHeight = 600

          // Verificar se precisa redimensionar
          if (
            originalWidth !== targetWidth ||
            originalHeight !== targetHeight
          ) {
            // Redimensionar usando Canvas
            const canvas = document.createElement('canvas')
            canvas.width = targetWidth
            canvas.height = targetHeight
            const ctx = canvas.getContext('2d')

            // Preencher fundo branco (caso a imagem seja menor)
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, targetWidth, targetHeight)

            // Calcular proporção para manter aspecto ou esticar
            // Opção 1: Manter proporção e centralizar (pode deixar bordas brancas)
            // Opção 2: Esticar para preencher completamente (pode distorcer)
            // Vamos usar opção 2: esticar para preencher completamente
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

            // Converter canvas para base64
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
            this.imagePreview = resizedDataUrl
            this.formData.imagebase64 = resizedDataUrl.split(',')[1]

            this.imageDimensions = {
              width: targetWidth,
              height: targetHeight,
            }

            this.addNotification(
              `Imagem redimensionada de ${originalWidth} x ${originalHeight}px para ${targetWidth} x ${targetHeight}px`,
              'success'
            )
          } else {
            // Tamanho já está correto
            this.imageDimensions = {
              width: originalWidth,
              height: originalHeight,
            }
            this.imagePreview = e.target.result
            this.formData.imagebase64 = e.target.result.split(',')[1]
          }
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    },
    validateSigla(event) {
      let value = event.target.value.toUpperCase().trim()

      // Permitir múltiplas siglas separadas por vírgula
      // Formato esperado: "ML, C1, CV" ou "ML,C1,CV" ou "ML, C1,CV"
      // Manter apenas letras, números e vírgulas
      value = value.replace(/[^A-Z0-9,]/g, '')

      // Remover vírgulas duplicadas e vírgulas no início/fim
      value = value.replace(/,+/g, ',').replace(/^,|,$/g, '')

      // Normalizar: remover espaços e salvar como "ML,C1,CV" (sem espaços)
      const siglas = value
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      this.formData.visible = siglas.join(',')

      if (value.length > 0) {
        // Validar formato: cada sigla deve ter pelo menos 1 caractere
        if (siglas.length === 0) {
          this.siglaError = 'Digite pelo menos uma sigla'
        } else {
          // Verificar se todas as siglas são válidas (apenas letras e números)
          const invalidSiglas = siglas.filter(s => !/^[A-Z0-9]+$/.test(s))
          if (invalidSiglas.length > 0) {
            this.siglaError = 'Siglas devem conter apenas letras e números'
          } else {
            this.siglaError = null
          }
        }
      } else {
        this.siglaError = null
      }
    },
    removeImage() {
      this.imagePreview = null
      this.imageDimensions = null
      this.formData.imagebase64 = null
      if (this.$refs.imageInput) {
        this.$refs.imageInput.value = ''
      }
    },
    async submitForm() {
      if (!this.isFormValid) {
        this.addNotification(
          'Por favor, preencha todos os campos corretamente',
          'error'
        )
        return
      }

      this.loading = true
      try {
        const apiClient = window.apiClient
        const response = await apiClient.request('/painel', {
          method: 'POST',
          data: {
            imagebase64: this.formData.imagebase64,
            datein: this.formData.datein,
            dateout: this.formData.dateout,
            visible: this.formData.visible || '',
            displayTime: Math.min(
              5,
              Math.max(2, this.formData.displayTime || 5)
            ),
          },
        })

        if (response && response.success) {
          this.addNotification('Banner salvo com sucesso!', 'success')
          this.resetForm()
          this.loadBanners()
        } else {
          throw new Error(response?.error || 'Erro ao salvar banner')
        }
      } catch (error) {
        console.error('Erro ao salvar banner:', error)
        this.addNotification(
          error.response?.data?.error ||
            error.message ||
            'Erro ao salvar banner',
          'error'
        )
      } finally {
        this.loading = false
      }
    },
    async loadBanners() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (Number(user.level_access) === 4) {
            console.log(
              '📢 MarketingPage: Usuário nível 4 (Manutenção) - pulando carregamento de banners'
            )
            this.banners = []
            this.loadingBanners = false
            return
          }
        } catch (_) {}
      }
      this.loadingBanners = true
      try {
        const apiClient = window.apiClient
        if (!apiClient) {
          console.warn('apiClient não disponível')
          this.loadingBanners = false
          return
        }

        const response = await apiClient.request('/painel?all=true', {
          method: 'GET',
        })

        if (response && response.data) {
          this.banners = response.data || []
        } else {
          this.banners = []
        }
      } catch (error) {
        console.error('Erro ao carregar banners:', error)
        this.banners = [] // Garantir que sempre tenha um array
        // Não mostrar erro ao usuário se for apenas um problema de API
      } finally {
        this.loadingBanners = false
      }
    },
    async deleteBanner(bannerId) {
      if (!confirm('Tem certeza que deseja excluir este banner?')) {
        return
      }

      try {
        const apiClient = window.apiClient
        const response = await apiClient.request(`/painel/${bannerId}`, {
          method: 'DELETE',
        })

        if (response && response.success) {
          this.addNotification('Banner excluído com sucesso!', 'success')
          this.loadBanners()
        } else {
          throw new Error(response?.error || 'Erro ao excluir banner')
        }
      } catch (error) {
        console.error('Erro ao excluir banner:', error)
        this.addNotification(
          error.response?.data?.error ||
            error.message ||
            'Erro ao excluir banner',
          'error'
        )
      }
    },
    resetForm() {
      this.formData = {
        imagebase64: null,
        datein: '',
        dateout: '',
        visible: '',
        displayTime: 5, // Padrão: 5 segundos
      }
      this.imagePreview = null
      this.imageDimensions = null
      this.siglaError = null
      if (this.$refs.imageInput) {
        this.$refs.imageInput.value = ''
      }
    },
    getImageSrc(imagebase64) {
      if (!imagebase64) return ''
      if (imagebase64.startsWith('data:')) return imagebase64
      return `data:image/png;base64,${imagebase64}`
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    formatVisibleStorages(visible) {
      if (!visible || visible === '') {
        return 'Todos os armazéns'
      }
      // Formatar para exibição: "ML, C1, CV" ao invés de "ML,C1,CV"
      return visible
        .split(',')
        .map(s => s.trim())
        .join(', ')
    },
    handleImageError(event) {
      event.target.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1920" height="600"%3E%3Crect fill="%23ddd" width="1920" height="600"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImagem não disponível%3C/text%3E%3C/svg%3E'
    },
    addNotification(message, type = 'info') {
      // Emitir evento para o componente pai (App.vue)
      this.$emit('notification', message, type)
    },
    incrementDisplayTime() {
      if (this.formData.displayTime < 5) {
        this.formData.displayTime++
      }
    },
    decrementDisplayTime() {
      if (this.formData.displayTime > 2) {
        this.formData.displayTime--
      }
    },
    incrementEditDisplayTime() {
      if (this.editFormData.displayTime < 5) {
        this.editFormData.displayTime++
      }
    },
    decrementEditDisplayTime() {
      if (this.editFormData.displayTime > 2) {
        this.editFormData.displayTime--
      }
    },
    openEditModal(banner) {
      this.editingBanner = banner
      const rawDisplayTime = banner.displayTime || 5
      const clampedDisplayTime = Math.min(
        5,
        Math.max(2, Number(rawDisplayTime) || 5)
      )
      this.editFormData = {
        displayTime: clampedDisplayTime,
        imagebase64: banner.imagebase64,
        datein: this.formatDateForInput(banner.datein),
        dateout: this.formatDateForInput(banner.dateout),
        visible: banner.visible || '',
      }
      this.editImagePreview = null
      this.editImageDimensions = null
      this.editSiglaError = null
      this.showEditModal = true
    },
    closeEditModal() {
      this.showEditModal = false
      this.editingBanner = null
      this.editFormData = {
        imagebase64: null,
        datein: '',
        dateout: '',
        visible: '',
        displayTime: 5, // Padrão: 5 segundos
      }
      this.editImagePreview = null
      this.editImageDimensions = null
      this.editSiglaError = null
    },
    formatDateForInput(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      // Formato: YYYY-MM-DDTHH:mm
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    },
    handleEditImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // Validar tipo de arquivo
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        this.addNotification(
          'Por favor, selecione uma imagem PNG ou JPG',
          'error'
        )
        return
      }

      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.addNotification('A imagem deve ter no máximo 10MB', 'error')
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const originalWidth = img.width
          const originalHeight = img.height
          const targetWidth = 1920
          const targetHeight = 600

          // Verificar se precisa redimensionar
          if (
            originalWidth !== targetWidth ||
            originalHeight !== targetHeight
          ) {
            // Redimensionar usando Canvas
            const canvas = document.createElement('canvas')
            canvas.width = targetWidth
            canvas.height = targetHeight
            const ctx = canvas.getContext('2d')

            // Preencher fundo branco
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, targetWidth, targetHeight)

            // Esticar para preencher completamente
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

            // Converter canvas para base64
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
            this.editImagePreview = resizedDataUrl
            this.editFormData.imagebase64 = resizedDataUrl.split(',')[1]

            this.editImageDimensions = {
              width: targetWidth,
              height: targetHeight,
            }

            this.addNotification(
              `Imagem redimensionada de ${originalWidth} x ${originalHeight}px para ${targetWidth} x ${targetHeight}px`,
              'success'
            )
          } else {
            // Tamanho já está correto
            this.editImageDimensions = {
              width: originalWidth,
              height: originalHeight,
            }
            this.editImagePreview = e.target.result
            this.editFormData.imagebase64 = e.target.result.split(',')[1]
          }
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    },
    removeEditImage() {
      this.editImagePreview = null
      this.editImageDimensions = null
      // Manter a imagem original do banner
      if (this.editingBanner) {
        this.editFormData.imagebase64 = this.editingBanner.imagebase64
      } else {
        this.editFormData.imagebase64 = null
      }
      if (this.$refs.editImageInput) {
        this.$refs.editImageInput.value = ''
      }
    },
    validateEditSigla(event) {
      let value = event.target.value.toUpperCase().trim()

      // Permitir múltiplas siglas separadas por vírgula
      // Formato esperado: "ML, C1, CV" ou "ML,C1,CV" ou "ML, C1,CV"
      // Manter apenas letras, números e vírgulas
      value = value.replace(/[^A-Z0-9,]/g, '')

      // Remover vírgulas duplicadas e vírgulas no início/fim
      value = value.replace(/,+/g, ',').replace(/^,|,$/g, '')

      // Normalizar: remover espaços e salvar como "ML,C1,CV" (sem espaços)
      const siglas = value
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      this.editFormData.visible = siglas.join(',')

      if (value.length > 0) {
        // Validar formato: cada sigla deve ter pelo menos 1 caractere
        if (siglas.length === 0) {
          this.editSiglaError = 'Digite pelo menos uma sigla'
        } else {
          // Verificar se todas as siglas são válidas (apenas letras e números)
          const invalidSiglas = siglas.filter(s => !/^[A-Z0-9]+$/.test(s))
          if (invalidSiglas.length > 0) {
            this.editSiglaError = 'Siglas devem conter apenas letras e números'
          } else {
            this.editSiglaError = null
          }
        }
      } else {
        this.editSiglaError = null
      }
    },
    async updateBanner() {
      if (!this.isEditFormValid) {
        this.addNotification(
          'Por favor, preencha todos os campos corretamente',
          'error'
        )
        return
      }

      if (!this.editingBanner) {
        this.addNotification('Erro: Banner não encontrado para edição', 'error')
        return
      }

      this.loading = true
      try {
        const apiClient = window.apiClient
        const response = await apiClient.request(
          `/painel/${this.editingBanner.id}`,
          {
            method: 'PUT',
            data: {
              imagebase64: this.editFormData.imagebase64,
              datein: this.editFormData.datein,
              dateout: this.editFormData.dateout,
              visible: this.editFormData.visible || '',
              displayTime: Math.min(
                5,
                Math.max(2, this.editFormData.displayTime || 5)
              ),
            },
          }
        )

        if (response && response.success) {
          this.addNotification('Banner atualizado com sucesso!', 'success')
          this.closeEditModal()
          this.loadBanners()
        } else {
          throw new Error(response?.error || 'Erro ao atualizar banner')
        }
      } catch (error) {
        console.error('Erro ao atualizar banner:', error)
        this.addNotification(
          error.response?.data?.error ||
            error.message ||
            'Erro ao atualizar banner',
          'error'
        )
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.marketing-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h2 i {
  color: #007bff;
}

.page-description {
  color: #6c757d;
  font-size: 0.95rem;
  margin: 0;
}

.marketing-form-container {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.marketing-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.form-label i {
  color: #007bff;
}

.required {
  color: #dc3545;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input.input-error {
  border-color: #dc3545;
}

/* Stepper para Tempo de Exibição */
.display-time-stepper {
  display: flex;
  align-items: stretch;
  max-width: 160px;
}

.display-time-stepper .stepper-btn {
  width: 44px;
  min-width: 44px;
  padding: 12px;
  border: 2px solid #dee2e6;
  background: #f8f9fa;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-time-stepper .stepper-btn:first-child {
  border-right: none;
  border-radius: 6px 0 0 6px;
}

.display-time-stepper .stepper-btn:last-child {
  border-left: none;
  border-radius: 0 6px 6px 0;
}

.display-time-stepper .stepper-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #007bff;
  border-color: #007bff;
}

.display-time-stepper .stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.display-time-stepper .display-time-input {
  width: 60px;
  min-width: 60px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  border-radius: 0;
  -moz-appearance: textfield;
}

.display-time-stepper .display-time-input::-webkit-outer-spin-button,
.display-time-stepper .display-time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.error-message {
  font-size: 0.85rem;
  color: #dc3545;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Image Upload */
.image-upload-container {
  position: relative;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-upload-container:hover {
  border-color: #007bff;
  background: #f0f7ff;
}

.image-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.upload-placeholder i {
  font-size: 3rem;
  color: #adb5bd;
  margin-bottom: 16px;
}

.upload-placeholder p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.upload-hint {
  font-size: 0.85rem;
  color: #868e96;
}

.image-preview-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.image-preview {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.remove-image-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.image-info {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.image-info span {
  font-size: 0.9rem;
  font-weight: 500;
}

.dimension-error {
  color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

/* Banners List */
.banners-list-container {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.banners-list-container h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.banners-list-container h3 i {
  color: #007bff;
}

.loading-container,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.loader-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state i {
  font-size: 3rem;
  color: #adb5bd;
  margin-bottom: 16px;
}

/* Lista de banners */
.banners-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.banner-list-item {
  display: flex;
  gap: 24px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s ease;
}

.banner-list-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.banner-list-image {
  flex: 0 0 400px;
  width: 400px;
  height: 200px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-list-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.banner-list-info {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.banner-list-details {
  flex: 1;
}

.banner-dates {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.date-item {
  font-size: 0.9rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-item i {
  color: #007bff;
}

.banner-visible {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #495057;
  font-weight: 500;
  margin-bottom: 16px;
}

.banner-visible i {
  color: #28a745;
}

.banner-list-actions {
  display: flex;
  gap: 12px;
}

.btn-edit {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-edit:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-edit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-delete:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal de Edição */
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
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h3 i {
  color: #007bff;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 24px;
}

/* Responsividade */
@media (max-width: 768px) {
  .marketing-page {
    padding: 16px;
  }

  .marketing-form-container,
  .banners-list-container {
    padding: 20px;
  }

  .banner-list-item {
    flex-direction: column;
  }

  .banner-list-image {
    flex: 0 0 auto;
    width: 100%;
    height: 200px;
  }

  .banner-list-actions {
    flex-direction: column;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
    justify-content: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    max-width: 100%;
    max-height: 95vh;
  }
}
</style>
