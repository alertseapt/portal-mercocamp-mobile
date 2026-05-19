<template>
  <div class="statistics-section">
    <div class="statistics-container">
      <h2 class="statistics-title">
        <i class="fas fa-chart-bar"></i>
        Estatísticas
      </h2>
      <p class="statistics-subtitle">Quantidade de NF's recebidas em estoque</p>

      <div v-if="loading" class="loading-container">
        <div class="loader-spinner"></div>
        <p>Carregando estatísticas...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
      </div>

      <div v-else class="chart-container">
        <canvas ref="chartCanvas" id="statistics-chart"></canvas>
        <div
          v-if="
            chart &&
            chartData &&
            chartData.datasets &&
            chartData.datasets[0] &&
            chartData.datasets[0].data.every(v => v === 0)
          "
          class="empty-chart-message"
        >
          <i class="fas fa-chart-bar"></i>
          <p>{{ emptyChartMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'StatisticsChart',
  data() {
    return {
      loading: true,
      error: null,
      chart: null,
      isCreatingChart: false, // Flag para evitar criação simultânea
      createChartAttempts: 0,
      maxCreateChartAttempts: 20, // Máximo de 2 segundos (20 * 100ms)
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
      chartData: {
        labels: [], // Será preenchido com as datas (15 dias desktop, 10 dias mobile)
        datasets: [
          {
            label: 'NFs em Estoque',
            data: [], // Será preenchido com os dados
            backgroundColor: 'rgba(0, 123, 255, 0.6)',
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            minBarLength: 2,
          },
        ],
      },
    }
  },
  computed: {
    chartDays() {
      return this.windowWidth <= 768 ? 10 : 15 // mobile: 10 dias, desktop: 15 dias
    },
    emptyChartMessage() {
      return `Nenhuma NF recebida em estoque nos últimos ${this.chartDays} dias`
    },
  },
  mounted() {
    console.log('📊 StatisticsChart montado')
    this.initializeLabels()
    this.loadStatistics()
    window.addEventListener('resize', this.handleResize)
  },
  watch: {
    // Observar mudanças nos dados do gráfico e atualizar o gráfico
    'chartData.datasets.0.data': {
      handler(newData) {
        console.log('📊 Dados do gráfico alterados:', newData)
        if (this.chart && newData && Array.isArray(newData)) {
          console.log('📊 Atualizando gráfico com novos dados')
          this.chart.data.datasets[0].data = newData
          this.chart.update('none') // 'none' para atualização sem animação
        }
      },
      deep: true,
    },
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this._createChartTimeout) {
      clearTimeout(this._createChartTimeout)
      this._createChartTimeout = null
    }
    if (this.chart) {
      console.log('📊 Destruindo gráfico no beforeUnmount')
      this.chart.destroy()
      this.chart = null
    }
    this.isCreatingChart = false
    this.createChartAttempts = 0
  },
  methods: {
    handleResize() {
      const prevDays = this.chartDays
      this.windowWidth = window.innerWidth
      if (prevDays !== this.chartDays) {
        this.initializeLabels()
        this.loadStatistics()
        if (this.chart) {
          this.chart.destroy()
          this.chart = null
          this.$nextTick(() => this.createChart())
        }
      }
    },
    initializeLabels() {
      const labels = []
      const now = new Date()
      const days = this.chartDays
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(now.getDate() - i)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        labels.push(`${day}/${month}`)
      }
      this.chartData.labels = labels
      this.chartData.datasets[0].data = new Array(days).fill(0)
      console.log('📊 Labels inicializados:', labels.length, 'dias')
    },
    async loadStatistics() {
      console.log('📊 Iniciando loadStatistics')
      this.loading = true
      this.error = null

      try {
        const apiClient = window.apiClient
        if (!apiClient) {
          throw new Error('apiClient não está disponível')
        }

        console.log('📊 Fazendo requisição para /schedules/weekly-statistics')
        const response = await apiClient.request(
          '/schedules/weekly-statistics',
          {
            method: 'GET',
          }
        )

        console.log('📊 Resposta completa:', response)
        console.log(
          '📊 Tipo de response.data:',
          typeof response.data,
          Array.isArray(response.data)
        )

        if (response && response.data) {
          console.log('📊 Dados recebidos:', response.data)
          // Backend retorna { data: [{ date, count }, ...] }
          const dailyData = Array.isArray(response.data)
            ? response.data
            : response.data?.data || []
          if (!Array.isArray(dailyData)) {
            console.warn('⚠️ Formato de dados inesperado:', response.data)
          }

          // Criar mapa de datas (15 dias desktop, 10 dias mobile)
          const now = new Date()
          const days = this.chartDays
          const dateMap = {}
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(now.getDate() - i)
            date.setHours(0, 0, 0, 0)
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
            dateMap[dateStr] = 0
          }

          if (Array.isArray(dailyData)) {
            dailyData.forEach((item, index) => {
              console.log(`📊 Processando item ${index}:`, item)
              if (item && item.date && dateMap.hasOwnProperty(item.date)) {
                const count = parseInt(item.count) || 0
                dateMap[item.date] = count
                console.log(`📊 Atribuído ${count} para data ${item.date}`)
              } else {
                console.warn(
                  `⚠️ Item inválido ou data fora do período ignorado:`,
                  item
                )
              }
            })
          }

          // Converter mapa para array na ordem das labels
          const dataArray = []
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(now.getDate() - i)
            date.setHours(0, 0, 0, 0)
            const dateStr = date.toISOString().split('T')[0]
            dataArray.push(dateMap[dateStr] || 0)
          }

          console.log('📊 Array de dados final:', dataArray)
          console.log(
            '📊 Total de NFs:',
            dataArray.reduce((sum, val) => sum + val, 0)
          )

          // Atualizar dados do gráfico
          this.chartData.datasets[0].data = dataArray

          // Se o gráfico já existe, atualizar com os novos dados
          if (this.chart) {
            console.log('📊 Gráfico já existe, atualizando dados...')
            this.chart.data.labels = this.chartData.labels
            this.chart.data.datasets[0].data = dataArray
            this.chart.update()
          }
        } else {
          console.warn('⚠️ Resposta inválida:', response)
          throw new Error('Resposta inválida do servidor')
        }
      } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error)
        this.error =
          error.response?.data?.error ||
          error.message ||
          'Erro ao carregar estatísticas'
      } finally {
        this.loading = false
        console.log('📊 loadStatistics finalizado, loading:', this.loading)

        // Se o gráfico ainda não foi criado, criar agora
        if (!this.chart) {
          // Aguardar que o DOM seja atualizado após loading = false
          // O canvas só aparece quando loading é false
          await this.$nextTick()
          await this.$nextTick() // Duplo nextTick para garantir renderização completa
          console.log('📊 Chamando createChart após loading = false')

          // Aguardar um pouco mais para garantir que o canvas está no DOM
          // Usar requestAnimationFrame para garantir que o DOM foi renderizado
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!this.isCreatingChart && !this.chart) {
                this.createChart()
              }
            })
          })
        }
      }
    },
    isMobile() {
      return window.innerWidth <= 768
    },
    createChart() {
      // Evitar criação simultânea
      if (this.isCreatingChart) {
        console.log(
          '📊 createChart já em execução, ignorando chamada duplicada'
        )
        return
      }

      // Se ainda está carregando, não tentar criar o gráfico
      if (this.loading) {
        console.log('📊 Ainda carregando dados, aguardando...')
        return
      }

      // Não criar gráfico quando há erro (canvas está em v-else e não é renderizado)
      if (this.error) {
        this.isCreatingChart = false
        return
      }

      console.log(
        '📊 createChart chamado (tentativa',
        this.createChartAttempts + 1,
        ')'
      )

      // Se já existe um gráfico válido e funcionando, não criar novamente
      if (
        this.chart &&
        this.chart.canvas &&
        document.body.contains(this.chart.canvas)
      ) {
        console.log(
          '📊 Gráfico já existe e está no DOM, ignorando criação duplicada'
        )
        return
      }

      // Marcar que estamos criando o gráfico
      this.isCreatingChart = true

      // Incrementar contador de tentativas
      this.createChartAttempts++

      // Verificar limite de tentativas ANTES de continuar
      if (this.createChartAttempts > this.maxCreateChartAttempts) {
        console.error(
          '❌ Limite de tentativas excedido! Parando criação do gráfico.'
        )
        this.isCreatingChart = false
        this.error =
          'Não foi possível renderizar o gráfico após várias tentativas. Por favor, recarregue a página.'
        return
      }

      // Destruir gráfico anterior se existir
      if (this.chart) {
        console.log('📊 Destruindo gráfico anterior')
        try {
          this.chart.destroy()
        } catch (destroyError) {
          console.warn('⚠️ Erro ao destruir gráfico anterior:', destroyError)
        }
        this.chart = null
        // Não resetar isCreatingChart aqui, pois vamos criar um novo gráfico
      }

      const canvasElement = this.$refs.chartCanvas
      console.log('📊 Canvas element:', canvasElement)

      if (!canvasElement) {
        this.isCreatingChart = false // Liberar flag antes de retry
        if (this.createChartAttempts >= this.maxCreateChartAttempts) {
          console.error(
            '❌ Canvas não encontrado após',
            this.maxCreateChartAttempts,
            'tentativas!'
          )
          this.error =
            'Não foi possível renderizar o gráfico. Por favor, recarregue a página.'
          return
        }
        console.warn(
          '⚠️ Canvas não encontrado! Tentando novamente em 200ms... (tentativa',
          this.createChartAttempts,
          '/',
          this.maxCreateChartAttempts,
          ')'
        )
        // Limpar timeout anterior se existir
        if (this._createChartTimeout) {
          clearTimeout(this._createChartTimeout)
        }
        this._createChartTimeout = setTimeout(() => {
          this._createChartTimeout = null
          if (!this.isCreatingChart) {
            this.createChart()
          }
        }, 200)
        return
      }

      // Verificar se o canvas está realmente no DOM e visível
      // Usar uma verificação mais flexível: se o canvas está no DOM, tentar criar o gráfico mesmo que não esteja totalmente visível
      const isInDOM = document.body.contains(canvasElement)
      const hasDimensions =
        canvasElement.offsetWidth > 0 || canvasElement.offsetHeight > 0
      const isVisible = canvasElement.offsetParent !== null

      if (!isInDOM) {
        console.warn('⚠️ Canvas não está no DOM!')
        this.isCreatingChart = false
        if (this.createChartAttempts >= this.maxCreateChartAttempts) {
          console.error(
            '❌ Canvas não encontrado no DOM após',
            this.maxCreateChartAttempts,
            'tentativas!'
          )
          this.error =
            'Não foi possível renderizar o gráfico. Por favor, recarregue a página.'
          return
        }
        // Não incrementar novamente, já foi incrementado no início
        // Limpar timeout anterior se existir
        if (this._createChartTimeout) {
          clearTimeout(this._createChartTimeout)
        }
        this._createChartTimeout = setTimeout(() => {
          this._createChartTimeout = null
          if (!this.isCreatingChart) {
            this.createChart()
          }
        }, 200)
        return
      }

      // Resetar contador ao encontrar o canvas no DOM
      this.createChartAttempts = 0

      // Se o canvas está no DOM mas não tem dimensões, pode ser que ainda não tenha sido renderizado
      // Tentar criar o gráfico mesmo assim, pois o Chart.js pode calcular as dimensões automaticamente
      if (!hasDimensions && !isVisible) {
        console.warn(
          '⚠️ Canvas no DOM mas sem dimensões visíveis. Tentando criar gráfico mesmo assim...'
        )
        // Não bloquear a criação, apenas avisar
      }

      const ctx = canvasElement.getContext('2d')
      if (!ctx) {
        console.error('❌ Não foi possível obter o contexto 2D do canvas!')
        this.error =
          'Erro ao inicializar o gráfico. Por favor, recarregue a página.'
        return
      }

      // Verificar se o contexto do canvas está válido
      try {
        ctx.save()
        ctx.restore()
      } catch (ctxError) {
        console.error('❌ Contexto do canvas inválido:', ctxError)
        this.isCreatingChart = false // Liberar flag antes de retry
        if (this.createChartAttempts < this.maxCreateChartAttempts) {
          // Não incrementar novamente, já foi incrementado no início
          // Limpar timeout anterior se existir
          if (this._createChartTimeout) {
            clearTimeout(this._createChartTimeout)
          }
          this._createChartTimeout = setTimeout(() => {
            this._createChartTimeout = null
            if (!this.isCreatingChart) {
              this.createChart()
            }
          }, 200)
          return
        }
        this.error =
          'Erro ao inicializar o gráfico. Por favor, recarregue a página.'
        return
      }

      console.log(
        '📊 Criando gráfico com dados:',
        this.chartData.datasets[0].data
      )
      console.log('📊 Chart disponível?', typeof Chart !== 'undefined')

      try {
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: this.chartData,
          options: {
            responsive: true,
            maintainAspectRatio: !this.isMobile(), // mobile: preenche altura fixa do container
            aspectRatio: this.isMobile() ? 1.85 : 3.7, // +30% altura adicional (mobile 2.40→1.85, desktop 4.81→3.70)
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                  size: 14,
                  weight: 'bold',
                },
                bodyFont: {
                  size: 13,
                },
                callbacks: {
                  label: function (context) {
                    return `${context.parsed.y} NF${context.parsed.y !== 1 ? 's' : ''}`
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
                max: undefined,
                ticks: {
                  stepSize: 1,
                  precision: 0,
                  font: {
                    size: this.isMobile() ? 10 : 12,
                  },
                  callback: function (value) {
                    return value
                  },
                },
                title: {
                  display: true,
                  text: 'Quant.',
                  font: {
                    size: this.isMobile() ? 12 : 14,
                    weight: 'bold',
                  },
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  display: true,
                },
              },
              x: {
                ticks: {
                  font: {
                    size: this.isMobile() ? 10 : 10,
                  },
                  maxRotation: this.isMobile() ? 45 : 45,
                  minRotation: this.isMobile() ? 45 : 45,
                },
                title: {
                  display: false,
                },
                grid: {
                  display: false,
                },
              },
            },
          },
        })

        console.log('✅ Gráfico criado com sucesso!', this.chart)
        this.isCreatingChart = false // Liberar flag após criação bem-sucedida
      } catch (chartError) {
        console.error('❌ Erro ao criar gráfico:', chartError)
        this.error = 'Erro ao renderizar gráfico: ' + chartError.message
        this.isCreatingChart = false // Liberar flag em caso de erro
      }
    },
  },
}
</script>

<style scoped>
.statistics-section {
  width: 100%;
  padding: 0 24px;
  margin-bottom: 32px;
}

.statistics-container {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.statistics-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.statistics-title i {
  color: #007bff;
}

.statistics-subtitle {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 12px;
  text-align: center;
}

.loading-container,
.error-container {
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

.error-container {
  color: #dc3545;
}

.error-container i {
  font-size: 3rem;
  margin-bottom: 16px;
  display: block;
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 254px; /* +30% do anterior (195px) para desktop */
  display: block;
  padding: 8px 0;
}

.chart-container canvas {
  display: block !important;
  max-width: 100% !important;
  height: auto !important;
}

.empty-chart-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #6c757d;
  z-index: 1;
  pointer-events: none;
}

.empty-chart-message i {
  font-size: 3rem;
  color: #adb5bd;
  margin-bottom: 12px;
  display: block;
}

.empty-chart-message p {
  margin: 0;
  font-size: 1rem;
}

/* Desktop: sem padding horizontal para alinhar com o banner (98% do wrapper) */
@media (min-width: 1024px) {
  .statistics-section {
    padding: 0 0 32px 0;
  }
}

/* Responsividade - em mobile ocupa 100% da área útil e gráfico com dobro da altura */
@media (max-width: 768px) {
  .statistics-section {
    padding: 0 1% !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  .statistics-container {
    padding: 12px 2% !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  .statistics-title {
    font-size: 1.5rem;
    margin-bottom: 2px !important;
  }

  .statistics-subtitle {
    margin-bottom: 8px !important;
  }

  .chart-container {
    min-height: 406px !important; /* +30% do anterior (312px) */
    height: 406px !important;
    padding: 4px 0 !important;
  }
}
</style>
