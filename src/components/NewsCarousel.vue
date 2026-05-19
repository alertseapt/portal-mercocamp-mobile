<template>
  <div class="news-carousel-container">
    <!-- Carrossel com imagens -->
    <div v-if="images.length > 0" class="carousel-wrapper">
      <!-- Imagem atual -->
      <div class="carousel-image-container">
        <img
          :src="currentImageSrc"
          :alt="`Notícia ${currentIndex + 1}`"
          class="carousel-image"
          @error="handleImageError"
        />
      </div>

      <!-- Controles abaixo da imagem -->
      <div v-if="images.length > 1" class="carousel-controls">
        <!-- Controles de navegação -->
        <div class="carousel-controls-row">
          <button
            class="carousel-nav carousel-prev"
            @click="previousImage"
            aria-label="Imagem anterior"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <!-- Indicadores de slide -->
          <div class="carousel-indicators">
            <button
              v-for="(image, index) in images"
              :key="image.id"
              class="indicator"
              :class="{ active: index === currentIndex }"
              @click="goToImage(index)"
              :aria-label="`Ir para imagem ${index + 1}`"
            ></button>
          </div>

          <button
            class="carousel-nav carousel-next"
            @click="nextImage"
            aria-label="Próxima imagem"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- Barra de progresso -->
        <div class="carousel-progress-container">
          <div
            class="carousel-progress-bar"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Placeholder quando não há imagens -->
    <div v-else class="carousel-placeholder">
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <i class="fas fa-newspaper"></i>
        </div>
        <h3 class="placeholder-title">Painel de Notícias</h3>
        <p class="placeholder-text">Nenhuma notícia disponível no momento</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewsCarousel',
  data() {
    return {
      images: [],
      currentIndex: 0,
      progressPercentage: 0,
      autoPlayInterval: null,
      progressInterval: null,
      autoPlayDelay: 5000, // Valor padrão, será atualizado dinamicamente por banner
      loading: false,
      error: null,
    }
  },
  computed: {
    currentImageSrc() {
      if (this.images.length === 0 || !this.images[this.currentIndex]) {
        console.log(
          '📰 [NewsCarousel] currentImageSrc: Sem imagens ou índice inválido',
          {
            imagesLength: this.images.length,
            currentIndex: this.currentIndex,
          }
        )
        return ''
      }
      const imageBase64 = this.images[this.currentIndex].imagebase64
      console.log('📰 [NewsCarousel] currentImageSrc:', {
        currentIndex: this.currentIndex,
        hasImagebase64: !!imageBase64,
        imagebase64Length: imageBase64?.length,
        startsWithData: imageBase64?.startsWith('data:'),
        preview: imageBase64?.substring(0, 100) + '...',
      })

      if (!imageBase64) {
        console.error('📰 [NewsCarousel] imagebase64 está vazio ou null')
        return ''
      }

      // Garantir que tem o prefixo data:image
      if (!imageBase64.startsWith('data:')) {
        // Tentar detectar o tipo de imagem pelo início do base64 decodificado
        let mimeType = 'image/jpeg' // padrão para JPEG

        try {
          // Decodificar os primeiros bytes para detectar o tipo
          const decoded = atob(
            imageBase64.substring(0, Math.min(20, imageBase64.length))
          )
          const bytes = new Uint8Array(decoded.length)
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i)
          }

          // Verificar assinaturas de arquivo
          // PNG: 89 50 4E 47 (PNG signature)
          // JPEG: FF D8 FF
          if (
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47
          ) {
            mimeType = 'image/png'
          } else if (
            bytes[0] === 0xff &&
            bytes[1] === 0xd8 &&
            bytes[2] === 0xff
          ) {
            mimeType = 'image/jpeg'
          }

          console.log('📰 [NewsCarousel] Tipo detectado pelos bytes:', mimeType)
        } catch (e) {
          console.warn(
            '📰 [NewsCarousel] Erro ao detectar tipo de imagem, usando JPEG como padrão:',
            e
          )
          mimeType = 'image/jpeg'
        }

        const fullSrc = `data:${mimeType};base64,${imageBase64}`
        console.log(
          '📰 [NewsCarousel] Adicionando prefixo data:image. Tipo:',
          mimeType,
          'Tamanho final:',
          fullSrc.length
        )
        return fullSrc
      }

      const result = imageBase64
      console.log(
        '📰 [NewsCarousel] Retornando imagem com prefixo já presente. Tamanho:',
        result.length
      )
      return result
    },
  },
  mounted() {
    this.loadImages()
  },
  beforeUnmount() {
    this.clearIntervals()
  },
  methods: {
    async loadImages() {
      this.loading = true
      this.error = null

      try {
        const apiClient = window.apiClient
        console.log('📰 [NewsCarousel] Fazendo requisição para /painel')
        const response = await apiClient.request('/painel', {
          method: 'GET',
        })

        console.log('📰 [NewsCarousel] Resposta recebida:', response)
        console.log('📰 [NewsCarousel] response.data:', response?.data)
        console.log('📰 [NewsCarousel] É array?', Array.isArray(response?.data))

        if (response && response.data && Array.isArray(response.data)) {
          console.log(
            '📰 [NewsCarousel] Total de banners recebidos:',
            response.data.length
          )
          this.images = response.data.filter(img => {
            const hasImage =
              img && img.imagebase64 && img.imagebase64.trim().length > 0
            if (!hasImage) {
              console.warn('📰 [NewsCarousel] Banner sem imagebase64 válido:', {
                hasImg: !!img,
                hasImagebase64: !!img?.imagebase64,
                imagebase64Length: img?.imagebase64?.length,
                imagebase64Type: typeof img?.imagebase64,
                imgKeys: img ? Object.keys(img) : [],
              })
            } else {
              console.log('📰 [NewsCarousel] Banner válido encontrado:', {
                id: img.id,
                imagebase64Length: img.imagebase64.length,
                imagebase64Preview: img.imagebase64.substring(0, 50) + '...',
              })
            }
            return hasImage
          })

          console.log(
            '📰 [NewsCarousel] Banners com imagem válida:',
            this.images.length
          )
          console.log(
            '📰 [NewsCarousel] Primeiro banner:',
            this.images[0]
              ? {
                  id: this.images[0].id,
                  hasImagebase64: !!this.images[0].imagebase64,
                  imagebase64Length: this.images[0].imagebase64?.length,
                  imagebase64Preview:
                    this.images[0].imagebase64?.substring(0, 50) + '...',
                }
              : 'Nenhum'
          )

          if (this.images.length > 0) {
            this.currentIndex = 0
            console.log(
              '📰 [NewsCarousel] Iniciando autoplay com',
              this.images.length,
              'imagens'
            )
            // Atualizar delay baseado no primeiro banner
            this.updateAutoPlayDelay()
            this.startAutoPlay()
          } else {
            console.warn('📰 [NewsCarousel] Nenhuma imagem válida encontrada')
          }
          // Se não houver imagens, o placeholder será exibido automaticamente
        } else {
          console.error('📰 [NewsCarousel] Resposta inválida:', response)
          this.images = []
        }
      } catch (error) {
        console.error(
          '📰 [NewsCarousel] Erro ao carregar imagens do painel:',
          error
        )
        this.error = 'Erro ao carregar notícias'
        // Em caso de erro, mostrar placeholder
        this.images = []
      } finally {
        this.loading = false
        console.log(
          '📰 [NewsCarousel] loadImages finalizado. Total de imagens:',
          this.images.length
        )
      }
    },
    startAutoPlay() {
      if (this.images.length <= 1) return

      this.clearIntervals()
      this.resetProgress()

      // Atualizar delay baseado no banner atual
      this.updateAutoPlayDelay()

      // Atualizar progresso a cada 50ms para animação suave
      this.progressInterval = setInterval(() => {
        this.progressPercentage += 100 / (this.autoPlayDelay / 50)
        if (this.progressPercentage >= 100) {
          this.progressPercentage = 100
        }
      }, 50)

      // Trocar imagem após o delay
      this.autoPlayInterval = setTimeout(() => {
        this.nextImage()
      }, this.autoPlayDelay)
    },
    updateAutoPlayDelay() {
      // Obter o tempo de exibição do banner atual (em segundos) e converter para milissegundos
      const currentBanner = this.images[this.currentIndex]
      if (currentBanner && currentBanner.displayTime) {
        this.autoPlayDelay = (currentBanner.displayTime || 5) * 1000
        console.log(
          '📰 [NewsCarousel] Tempo de exibição atualizado para',
          currentBanner.displayTime,
          'segundos'
        )
      } else {
        this.autoPlayDelay = 5000 // Padrão: 5 segundos
      }
    },
    nextImage() {
      if (this.images.length === 0) return

      // Mudar para a próxima imagem
      this.currentIndex = (this.currentIndex + 1) % this.images.length
      // Atualizar delay baseado no novo banner
      this.updateAutoPlayDelay()
      this.resetProgress()
      this.startAutoPlay()
    },
    previousImage() {
      if (this.images.length === 0) return
      // Mudar para a imagem anterior
      this.currentIndex =
        (this.currentIndex - 1 + this.images.length) % this.images.length
      // Atualizar delay baseado no novo banner
      this.updateAutoPlayDelay()
      this.resetProgress()
      this.startAutoPlay()
    },
    goToImage(index) {
      if (index >= 0 && index < this.images.length) {
        this.currentIndex = index
        this.resetProgress()
        this.startAutoPlay()
      }
    },
    resetProgress() {
      this.progressPercentage = 0
      this.clearIntervals()
    },
    clearIntervals() {
      if (this.autoPlayInterval) {
        clearTimeout(this.autoPlayInterval)
        this.autoPlayInterval = null
      }
      if (this.progressInterval) {
        clearInterval(this.progressInterval)
        this.progressInterval = null
      }
    },
    handleImageError(event) {
      console.error(
        '📰 [NewsCarousel] Erro ao carregar imagem do carrossel:',
        event
      )
      console.error(
        '📰 [NewsCarousel] URL da imagem que falhou:',
        event.target?.src?.substring(0, 100)
      )
      console.error('📰 [NewsCarousel] Imagem atual:', {
        currentIndex: this.currentIndex,
        totalImages: this.images.length,
        imageData: this.images[this.currentIndex]
          ? {
              id: this.images[this.currentIndex].id,
              hasImagebase64: !!this.images[this.currentIndex].imagebase64,
              imagebase64Length:
                this.images[this.currentIndex].imagebase64?.length,
            }
          : null,
      })

      // Tentar próxima imagem se houver erro
      if (this.images.length > 1) {
        console.log('📰 [NewsCarousel] Tentando próxima imagem em 1 segundo...')
        setTimeout(() => {
          this.nextImage()
        }, 1000)
      }
    },
  },
}
</script>

<style scoped>
.news-carousel-container {
  width: 100%;
  max-width: 100%;
  margin-bottom: 0;
  padding: 0;
  background: transparent;
  box-sizing: border-box;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.carousel-image-container {
  width: 100%;
  height: auto;
  display: block;
  background: #fff;
  overflow: hidden;
  line-height: 0;
}

.carousel-image {
  width: 100%;
  height: auto;
  display: block;
  vertical-align: top;
  object-fit: contain;
}

/* Controles abaixo da imagem */
.carousel-controls {
  width: 100%;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.carousel-controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.carousel-nav {
  background: #007bff;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.carousel-nav:hover {
  background: #0056b3;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.carousel-nav:active {
  transform: scale(0.95);
}

.carousel-indicators {
  display: flex;
  gap: 8px;
  align-items: center;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #007bff;
  background: rgba(0, 123, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.indicator:hover {
  background: rgba(0, 123, 255, 0.6);
  transform: scale(1.2);
}

.indicator.active {
  background: #007bff;
  transform: scale(1.3);
  border-color: #0056b3;
}

.carousel-progress-container {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.carousel-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.05s linear;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  border-radius: 3px;
}

/* Placeholder: mesmas regras do banner (largura e altura compacta) */
.carousel-placeholder {
  width: 100%;
  background: #fff;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 24px 1%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Desktop: placeholder com mesmo tamanho do banner (área da imagem 3:1 + altura dos controles ~90px) */
@media (min-width: 1025px) {
  .carousel-placeholder {
    min-height: calc(
      32.67vw + 90px
    ); /* 98% da viewport / 3 (proporção 3:1) + área de controles do banner */
    padding: 0 1%;
    box-sizing: border-box;
  }
}

.placeholder-content {
  text-align: center;
  color: #6c757d;
}

.placeholder-icon {
  font-size: 2.5rem;
  color: #adb5bd;
  margin-bottom: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.placeholder-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
}

.placeholder-text {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Responsividade - banner 98% da largura e altura da div = altura da imagem */
@media (max-width: 768px) {
  .news-carousel-container {
    width: 98% !important;
    max-width: 98% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding: 0 1% !important;
    box-sizing: border-box;
  }

  .carousel-wrapper {
    width: 100%;
  }

  .carousel-image-container {
    display: block;
    line-height: 0;
  }

  .carousel-image {
    width: 100%;
    height: auto;
    display: block;
  }

  .carousel-controls {
    padding: 12px 15px;
    gap: 10px;
  }

  .carousel-controls-row {
    gap: 15px;
  }

  .carousel-nav {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .indicator {
    width: 8px;
    height: 8px;
  }

  .carousel-progress-container {
    height: 4px;
  }

  /* Placeholder: mesma largura do banner (98%) e altura compacta */
  .carousel-placeholder {
    width: 100% !important;
    min-height: 120px !important;
    padding: 16px 1% !important;
    box-sizing: border-box;
  }

  .placeholder-icon {
    font-size: 1.75rem !important;
    margin-bottom: 8px !important;
  }

  .placeholder-title {
    font-size: 1rem !important;
    margin-bottom: 4px !important;
  }

  .placeholder-text {
    font-size: 0.8rem !important;
  }
}
</style>
