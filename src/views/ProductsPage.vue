<template>
  <div class="products-page">
    <!-- Barra de Busca Centralizada -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-icon-wrapper" aria-hidden="true">
          <i class="fas fa-search search-icon"></i>
        </div>
        <input
          type="text"
          v-model="searchTerm"
          @input="handleSearch"
          placeholder="Buscar por código, descrição..."
          class="search-input"
          autocomplete="off"
          data-lpignore="true"
          data-form-type="other"
          name="product-search"
        />
        <button v-if="searchTerm" @click="clearSearch" class="clear-search">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <button
        @click="refreshProducts"
        class="btn btn-outline-primary search-button search-button-icon-only"
        :disabled="loading"
        title="Atualizar"
      >
        <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && products.length === 0" class="loading-container">
      <div class="loading-content">
        <div class="spinner-container">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>
        <p class="loading-text">Carregando produtos...</p>
        <p class="loading-subtext">Aguarde enquanto buscamos os dados</p>
      </div>
    </div>

    <!-- Lista de Produtos -->
    <div v-else-if="products.length > 0" class="products-container">
      <div class="products-table-container">
        <table class="products-table">
          <thead>
            <tr>
              <th>Cod. Venda</th>
              <th>Cod. Fornecedor</th>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in products"
              :key="`${product.cli_code}-${product.cli_cnpj}-${product.supp_code}`"
            >
              <td>
                <span class="product-code">{{ product.cli_code || '-' }}</span>
              </td>
              <td>
                <span class="supplier-code">{{
                  product.supp_code || '-'
                }}</span>
              </td>
              <td>
                <span class="description" :title="product.cli_desc">
                  {{ product.cli_desc || '-' }}
                </span>
              </td>
              <td>
                <span class="cnpj">{{ formatCnpj(product.cli_cnpj) }}</span>
              </td>
              <td>
                <span class="date" v-html="formatDate(product.date)"></span>
              </td>
              <td>
                <div class="product-actions-cell">
                  <button
                    @click="showProductDetails(product)"
                    class="btn btn-sm btn-info"
                    title="Ver detalhes"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div class="pagination-container">
        <div class="pagination-info">
          <span>
            {{ (pagination.page - 1) * pagination.limit + 1 }} -
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
            de {{ pagination.total }} produtos
          </span>
        </div>
        <div class="pagination-controls">
          <button
            @click="changePage(1)"
            :disabled="pagination.page <= 1 || loading"
            class="btn btn-outline-primary btn-sm"
            title="Primeira página"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>

          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1 || loading"
            class="btn btn-outline-primary btn-sm"
            title="Página anterior"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <span class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="{ active: page === pagination.page }"
              :disabled="loading"
              class="btn btn-sm"
            >
              {{ page }}
            </button>
          </span>

          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.pages || loading"
            class="btn btn-outline-primary btn-sm"
            title="Próxima página"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-boxes"></i>
      </div>
      <h3>Nenhum produto encontrado</h3>
      <p v-if="hasActiveFilters">
        Tente ajustar os filtros ou limpar a busca para ver mais produtos.
      </p>
      <p v-else>Não há produtos cadastrados no sistema ainda.</p>
    </div>

    <!-- Product Details Modal -->
    <ProductDetailsModal
      v-if="showModal"
      :show="showModal"
      :product="selectedProduct"
      @close="closeModal"
      @deleted="handleProductDeleted"
      @updated="handleProductUpdated"
      @update:product="updateSelectedProduct"
    />
  </div>
</template>

<script>
import ProductDetailsModal from '../components/ProductDetailsModal.vue'

export default {
  name: 'ProductsPage',
  components: {
    ProductDetailsModal,
  },
  data() {
    return {
      products: [],
      loading: false, // App.vue controlará o loading
      searchTerm: '',
      searchTimeout: null,
      showModal: false,
      selectedProduct: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    }
  },
  computed: {
    hasActiveFilters() {
      return this.searchTerm
    },
    visiblePages() {
      const current = this.pagination.page
      const total = this.pagination.pages
      const range = 2

      let start = Math.max(1, current - range)
      let end = Math.min(total, current + range)

      const pages = []
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      return pages
    },
  },
  mounted() {
    // O carregamento é feito pelo App.vue quando a página é ativada
    // Não carregar automaticamente no mounted para evitar chamadas duplicadas
  },
  methods: {
    async loadProducts() {
      if (this.loading) return

      console.log('🔄 Iniciando carregamento de produtos...')
      this.loading = true

      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.searchTerm || '',
        }

        console.log('🔍 Carregando produtos com parâmetros:', params)

        // Verificar se apiClient está disponível
        if (!window.apiClient) {
          throw new Error('ApiClient não está disponível')
        }

        // Usar o apiClient global com cache (igual ao SchedulesList)
        const apiClient = window.apiClient
        console.log('Token presente:', !!localStorage.getItem('token'))
        console.log('ApiClient disponível:', !!apiClient)

        const response = await apiClient.request('/products', {
          method: 'GET',
          params: params,
        })

        console.log('🔍 Resposta da API produtos:', response)

        // Verificar se response existe (seguindo padrão do SchedulesList)
        if (!response) {
          throw new Error('Resposta inválida da API')
        }

        this.products = response.products || []
        this.pagination = {
          ...this.pagination,
          ...response.pagination,
        }

        console.log(`✅ Produtos carregados: ${this.products.length} itens`)
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)

        if (error.response?.status === 401) {
          console.log('=== PRODUCTS PAGE: ERRO 401 ===')
          this.showError('Sessão expirada. Alguns dados podem não carregar.')
          return
        }

        // Sempre mostrar erro para que o usuário saiba o que aconteceu
        console.log('Erro ao carregar produtos:', error.message)
        this.showError(
          'Erro ao carregar produtos: ' +
            (error.response?.data?.error || error.message)
        )
      } finally {
        this.loading = false
      }
    },

    async refreshProducts() {
      this.pagination.page = 1
      await this.loadProducts()
    },

    handleSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1
        this.loadProducts()
      }, 500)
    },

    clearSearch() {
      this.searchTerm = ''
      this.pagination.page = 1
      this.loadProducts()
    },

    changePage(page) {
      if (
        page < 1 ||
        page > this.pagination.pages ||
        page === this.pagination.page
      ) {
        return
      }

      this.pagination.page = page
      this.loadProducts()
    },

    showProductDetails(product) {
      this.selectedProduct = product
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedProduct = null
    },

    handleProductDeleted() {
      // Recarregar a lista de produtos após a exclusão
      this.loadProducts()
    },

    handleProductUpdated(updatedProduct) {
      if (!updatedProduct) {
        // Se não recebeu dados atualizados, recarregar a lista completa
        this.loadProducts()
        return
      }

      // Atualizar o produto na lista localmente sem recarregar tudo
      // Buscar pelo código original se disponível, caso contrário usar o novo código
      const searchCode =
        updatedProduct._originalCliCode || updatedProduct.cli_code
      const productIndex = this.products.findIndex(
        p =>
          (p.cli_code === searchCode ||
            p.cli_code === updatedProduct.cli_code) &&
          p.cli_cnpj === updatedProduct.cli_cnpj &&
          p.supp_code === updatedProduct.supp_code
      )

      if (productIndex !== -1) {
        // Atualizar o produto na lista com os novos dados
        // No Vue 3, podemos atualizar diretamente sem $set
        this.products[productIndex] = {
          ...this.products[productIndex],
          ...updatedProduct,
        }
        console.log('✅ Produto atualizado na lista:', updatedProduct)
      } else {
        // Se o produto não está na lista atual (pode estar em outra página),
        // recarregar a lista para garantir que está sincronizado
        console.log('⚠️ Produto não encontrado na lista atual, recarregando...')
        this.loadProducts()
      }

      // Atualizar o produto selecionado no modal se ainda estiver aberto
      if (this.selectedProduct) {
        this.selectedProduct = {
          ...this.selectedProduct,
          ...updatedProduct,
        }
      }
    },

    updateSelectedProduct(updatedProduct) {
      // Atualizar o produto selecionado quando o modal emite update:product
      if (updatedProduct) {
        this.selectedProduct = {
          ...this.selectedProduct,
          ...updatedProduct,
        }
      }
    },

    formatCnpj(cnpj) {
      if (!cnpj) return '-'
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      const dateStr = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
      const timeStr = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `${dateStr}<br>${timeStr}`
    },

    isConnectionError(error) {
      // Verificar se é erro de conexão/rede que deve ser tratado silenciosamente no primeiro carregamento
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'ECONNRESET' ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('Network Error') ||
        error.message.includes('ApiClient não está disponível') ||
        !error.response // Sem resposta do servidor geralmente indica problema de conexão
      )
    },

    showError(message) {
      // TODO: Implementar sistema de notificação
      console.error(message)
      alert(message)
    },
  },
}
</script>

<style scoped>
/* Garantir que nada ultrapasse a viewport */
* {
  box-sizing: border-box;
  max-width: 100%;
}

.products-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}

.header-left h2 {
  margin: 0;
  color: #333;
  font-size: 1.75rem;
}

.header-left .subtitle {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-section {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-height: 0;
}

.search-container {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1;
  min-width: 0;
  max-width: 500px;
  box-sizing: border-box;
}

/* Ícone em bloco à esquerda: texto do input nunca sobrepõe a lupa */
.search-icon-wrapper {
  flex-shrink: 0;
  width: 40px;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-right: none;
  border-radius: 5px 0 0 5px;
  color: #666;
  box-sizing: border-box;
}

.search-container:focus-within .search-icon-wrapper {
  border-color: #007bff;
  background: #fff;
}

.search-icon {
  font-size: 0.875rem;
  color: #666;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  padding: 0 36px 0 10px;
  border: 1px solid #ddd;
  border-radius: 0 5px 5px 0;
  font-size: 0.875rem !important;
  line-height: 1.35;
  background: white;
  box-sizing: border-box;
}

/* Placeholder com mesmo tamanho do texto da tabela - !important para vencer estilos globais de input */
.search-input::placeholder {
  font-size: 0.875rem !important;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.search-container:focus-within .search-input {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.search-button {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Botão Atualizar: apenas ícone, quadrado (altura ~30% menor) - !important para vencer estilos globais .btn */
.search-button.search-button-icon-only {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  max-width: 28px !important;
  max-height: 28px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 5px !important;
}

.search-button.search-button-icon-only i {
  font-size: 0.875rem !important;
  margin: 0 !important;
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 60px 20px;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.spinner-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.spinner-circle {
  width: 12px;
  height: 12px;
  background-color: #007bff;
  border-radius: 50%;
  animation: loading-bounce 1.4s infinite ease-in-out;
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.16s;
}

.spinner-circle:nth-child(3) {
  animation-delay: 0s;
}

@keyframes loading-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.loading-subtext {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.products-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0 !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* Cola a tabela na barra de busca: remove espaço residual entre search e tabela */
.products-page .search-section + .products-container {
  margin-top: -8px !important;
}

.products-table-container {
  overflow-x: auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.products-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
  margin: 0;
}

.products-table th {
  background: #f8f9fa;
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  font-size: 0.875rem;
}

.products-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  font-size: 0.875rem;
}

.products-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Layout responsivo - padding mínimo para texto não colar na borda */
.products-table th,
.products-table td {
  padding: 10px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

/* Código Venda */
.products-table th:nth-child(1),
.products-table td:nth-child(1) {
  width: 16%;
}

/* Código Fornecedor */
.products-table th:nth-child(2),
.products-table td:nth-child(2) {
  width: 16%;
}

/* Descrição - prioridade de espaço */
.products-table th:nth-child(3),
.products-table td:nth-child(3) {
  width: 39%;
}

/* Cliente (CNPJ) - largura mínima para leitura */
.products-table th:nth-child(4),
.products-table td:nth-child(4) {
  width: 14%;
  min-width: 180px;
  text-align: center;
}

/* Data - largura mínima para leitura */
.products-table th:nth-child(5),
.products-table td:nth-child(5) {
  width: 10%;
  min-width: 120px;
  text-align: center;
}

/* Ações - botão de informações (tamanho maior) */
.products-table th:nth-child(6),
.products-table td:nth-child(6) {
  width: 5%;
  white-space: nowrap;
  text-align: center;
  min-width: 34px;
  max-width: 40px;
  padding: 2px;
  overflow: hidden;
  box-sizing: border-box;
  vertical-align: middle;
}

/* Wrapper para centralizar o botão na célula (garante 100% da largura da coluna) */
.products-table td:nth-child(6) .product-actions-cell {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1px;
}

/* Botão de detalhes: tamanho maior ( !important para vencer estilos globais .btn/.btn-sm ) */
.products-table td:nth-child(6) .btn.btn-sm.btn-info {
  min-width: 26px !important;
  width: 26px !important;
  max-width: 26px !important;
  min-height: 26px !important;
  height: 26px !important;
  max-height: 26px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  align-self: center !important;
  font-size: 11px !important;
  line-height: 1 !important;
  aspect-ratio: 1 !important;
  box-sizing: border-box !important;
  flex-shrink: 0 !important;
}

.products-table td:nth-child(6) .btn.btn-sm.btn-info i {
  font-size: 11px !important;
}

/* Paginação: texto acima dos botões, estilo compacto */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.pagination-info,
.pagination-container .pagination-info {
  min-width: 0;
  flex: 0 0 auto;
  color: #6c757d;
  font-size: 0.55rem !important;
  font-weight: 500;
  text-align: center;
  order: -1;
}

.pagination-info span,
.pagination-container .pagination-info span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.55rem !important;
}

@media (min-width: 769px) {
  .pagination-info span {
    white-space: normal;
  }
}

.pagination-controls {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 0 0 auto;
  min-width: 0;
  order: 0;
}

.page-numbers {
  display: flex;
  flex-wrap: nowrap;
  gap: 2px;
}

/* Botões paginação: tamanho compacto, !important para vencer .btn e .btn-sm globais */
.page-numbers .btn,
.pagination-controls .btn,
.page-numbers .btn.btn-sm,
.pagination-controls .btn.btn-sm {
  min-width: 24px !important;
  width: 24px !important;
  max-width: 24px !important;
  min-height: 24px !important;
  height: 24px !important;
  max-height: 24px !important;
  padding: 0 5px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid #dee2e6 !important;
  background: white !important;
  color: #495057 !important;
  border-radius: 4px !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  gap: 0 !important;
  box-sizing: border-box !important;
}

.page-numbers .btn:hover:not(:disabled),
.pagination-controls .btn:hover:not(:disabled) {
  background: #e9ecef !important;
  border-color: #adb5bd !important;
}

.page-numbers .btn.active {
  background: #007bff !important;
  color: white !important;
  border-color: #007bff !important;
  font-weight: 700 !important;
}

.page-numbers .btn.active:hover {
  background: #0056b3 !important;
  border-color: #0056b3 !important;
}

.pagination-controls .btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  background: #f8f9fa !important;
}

.pagination-controls .btn i {
  margin: 0 !important;
  font-size: 0.6875rem !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
}

.empty-state p {
  color: #888;
  max-width: 400px;
  margin: 0 auto;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-primary {
  background: white;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-outline-secondary {
  background: white;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Responsividade */
@media (max-width: 1200px) {
  .products-page {
    max-width: 100%;
    padding: 15px;
    margin: 0 auto;
  }

  /* Tabela mais compacta em telas médias */
  .products-table th,
  .products-table td {
    padding: 10px 8px;
    font-size: 0.8rem;
  }

  .products-table th:nth-child(1),
  .products-table td:nth-child(1) {
    width: 15%;
  }

  .products-table th:nth-child(2),
  .products-table td:nth-child(2) {
    width: 15%;
  }

  .products-table th:nth-child(3),
  .products-table td:nth-child(3) {
    width: 36%;
  }

  .products-table th:nth-child(4),
  .products-table td:nth-child(4) {
    width: 16%;
  }

  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    width: 12%;
  }

  .products-table th:nth-child(6),
  .products-table td:nth-child(6) {
    width: 6%;
    min-width: 60px;
  }

  /* Barra de pesquisa com mesmo tamanho da tabela (0.8rem) - !important para vencer estilos globais */
  .products-page .search-input,
  .products-page .search-input::placeholder {
    font-size: 0.8rem !important;
  }
}

@media (max-width: 768px) {
  .products-page {
    padding: 10px;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .search-section {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 10px;
    align-items: center;
  }

  .search-container {
    flex: 1;
    min-width: 0;
    max-width: none;
  }

  .search-button.search-button-icon-only {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
    max-width: 28px !important;
    max-height: 28px !important;
    padding: 0 !important;
  }

  /* Tabela com scroll lateral quando necessário */
  .products-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .products-table {
    width: 100%;
    min-width: 900px;
    table-layout: fixed;
  }

  .products-table th,
  .products-table td {
    padding: 10px 8px;
    font-size: 0.8rem;
  }

  /* Layout tablet - padding mínimo para não colar na borda */
  .products-table th,
  .products-table td {
    padding: 10px 6px;
    font-size: 0.8rem;
  }

  .products-table th:nth-child(1),
  .products-table td:nth-child(1) {
    width: 14%;
  }

  .products-table th:nth-child(2),
  .products-table td:nth-child(2) {
    width: 14%;
  }

  .products-table th:nth-child(3),
  .products-table td:nth-child(3) {
    width: 38%;
  }

  .products-table th:nth-child(4),
  .products-table td:nth-child(4) {
    width: 18%;
  }

  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    width: 11%;
  }

  .products-table th:nth-child(6),
  .products-table td:nth-child(6) {
    width: 5%;
    min-width: 32px;
    max-width: 36px;
    padding: 2px;
    text-align: center;
    overflow: hidden;
    box-sizing: border-box;
    vertical-align: middle;
  }

  .products-table td:nth-child(6) {
    min-width: 32px;
    max-width: 36px;
    padding: 2px;
  }

  .products-table td:nth-child(6) .product-actions-cell {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .products-table td:nth-child(6) .btn.btn-sm.btn-info {
    min-width: 22px !important;
    width: 22px !important;
    max-width: 22px !important;
    min-height: 22px !important;
    height: 22px !important;
    max-height: 22px !important;
    padding: 0 !important;
    align-self: center !important;
    font-size: 10px !important;
    line-height: 1 !important;
    aspect-ratio: 1 !important;
    box-sizing: border-box !important;
  }

  .products-table td:nth-child(6) .btn.btn-sm.btn-info i {
    font-size: 10px !important;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 11px;
  }

  /* Paginação: mesmo estilo Solicitação, botões 24px para caber em uma linha */
  .pagination-container {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    max-width: 100%;
  }

  .pagination-info,
  .pagination-container .pagination-info,
  .pagination-info span,
  .pagination-container .pagination-info span {
    font-size: 0.52rem !important;
  }

  .pagination-info span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pagination-controls {
    flex-wrap: nowrap;
    gap: 4px;
  }

  .page-numbers {
    gap: 3px;
  }

  .page-numbers .btn,
  .pagination-controls .btn,
  .page-numbers .btn.btn-sm,
  .pagination-controls .btn.btn-sm {
    min-width: 22px !important;
    width: 22px !important;
    max-width: 22px !important;
    min-height: 22px !important;
    height: 22px !important;
    max-height: 22px !important;
    padding: 0 4px !important;
    font-size: 0.6875rem !important;
  }

  .pagination-controls .btn i {
    font-size: 0.625rem !important;
  }
}

@media (max-width: 480px) {
  .products-page {
    padding: 10px;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  /* Mesmo tamanho da tabela (0.75rem) - igual à lista de produtos */
  .search-input,
  .search-input::placeholder {
    font-size: 0.75rem !important;
  }
  .search-input {
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    padding: 0 36px 0 10px !important;
  }
  .search-icon {
    font-size: 0.75rem !important;
  }

  .search-icon-wrapper {
    width: 38px;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
  }

  .products-table {
    width: 100%;
    font-size: 0.8rem;
  }

  .products-table th,
  .products-table td {
    padding: 10px 6px;
    font-size: 0.75rem;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* Layout mobile - padding mínimo para texto não colar na borda */
  .products-table th,
  .products-table td {
    padding: 10px 6px;
    font-size: 0.75rem;
  }

  .products-table th:nth-child(1),
  .products-table td:nth-child(1) {
    width: 16%;
  }

  .products-table th:nth-child(2),
  .products-table td:nth-child(2) {
    width: 16%;
  }

  .products-table th:nth-child(3),
  .products-table td:nth-child(3) {
    width: 40%;
  }

  .products-table th:nth-child(4),
  .products-table td:nth-child(4) {
    width: 16%;
  }

  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    width: 8%;
  }

  .products-table th:nth-child(6),
  .products-table td:nth-child(6) {
    width: 4%;
    min-width: 28px;
    max-width: 32px;
    padding: 2px;
    text-align: center;
    overflow: hidden;
    box-sizing: border-box;
    vertical-align: middle;
  }

  .products-table td:nth-child(6) {
    min-width: 28px;
    max-width: 32px;
    padding: 2px;
  }

  .products-table td:nth-child(6) .product-actions-cell {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .products-table td:nth-child(6) .btn.btn-sm.btn-info {
    min-width: 20px !important;
    width: 20px !important;
    max-width: 20px !important;
    min-height: 20px !important;
    height: 20px !important;
    max-height: 20px !important;
    padding: 0 !important;
    align-self: center !important;
    font-size: 9px !important;
    line-height: 1 !important;
    aspect-ratio: 1 !important;
    box-sizing: border-box !important;
  }

  .products-table td:nth-child(6) .btn.btn-sm.btn-info i {
    font-size: 9px !important;
  }

  .btn-sm {
    padding: 2px 4px;
    font-size: 9px;
    line-height: 1.2;
  }

  .btn-sm i {
    font-size: 8px;
  }

  /* Esconder texto do botão em telas muito pequenas */
  .btn-sm .btn-text {
    display: none;
  }

  .empty-state {
    padding: 40px 15px;
  }

  .empty-icon {
    font-size: 3rem;
  }
}

/* Para telas muito pequenas onde a sidebar ocupa muito espaço */
@media (max-width: 600px) {
  .products-page {
    width: calc(100vw - 260px);
    max-width: calc(100vw - 260px);
    min-width: 300px; /* Largura mínima para funcionalidade */
    padding: 5px;
  }

  .products-table th,
  .products-table td {
    padding: 6px 6px;
    font-size: 0.7rem;
  }
}
</style>
