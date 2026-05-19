<template>
  <div v-if="show" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content product-details-modal" ref="modal" tabindex="-1">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-box"></i>
          Detalhes do Produto
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-navigation">
        <button
          @click="activeTab = 'info'"
          :class="{ active: activeTab === 'info' }"
          class="tab-button"
        >
          <i class="fas fa-info-circle"></i>
          Informações
        </button>
        <button
          @click="activeTab = 'history'"
          :class="{ active: activeTab === 'history' }"
          class="tab-button"
        >
          <i class="fas fa-history"></i>
          Histórico
        </button>
        <button
          @click="activeTab = 'edit'"
          :class="{ active: activeTab === 'edit' }"
          class="tab-button"
        >
          <i class="fas fa-edit"></i>
          Editar
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- Tab: Informações -->
        <div v-show="activeTab === 'info'" class="tab-content">
          <div class="product-info-grid">
            <!-- Seção de Códigos -->
            <div class="info-section">
              <h4>
                <i class="fas fa-barcode"></i>
                Códigos
              </h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Código Mercadoria Interno:</label>
                  <span class="value code">{{
                    displayProduct.cli_code || 'Não informado'
                  }}</span>
                </div>
                <div class="info-item">
                  <label>Código do Fornecedor:</label>
                  <span class="value code">{{
                    displayProduct.supp_code || 'Não informado'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Seção de Descrições -->
            <div class="info-section">
              <h4>
                <i class="fas fa-align-left"></i>
                Descrições
              </h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Descrição Interna (Venda):</label>
                  <span class="value">{{
                    displayProduct.cli_desc || 'Não informado'
                  }}</span>
                </div>
                <div class="info-item">
                  <label>Descrição do Fornecedor:</label>
                  <span class="value">{{
                    displayProduct.supp_desc || 'Não informado'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Seção de Relacionamentos -->
            <div class="info-section">
              <h4>
                <i class="fas fa-building"></i>
                Relacionamentos
              </h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>CNPJ Cliente:</label>
                  <span class="value cnpj">{{
                    formatCnpj(displayProduct.cli_cnpj)
                  }}</span>
                </div>
                <div class="info-item">
                  <label>CNPJ Fornecedor:</label>
                  <span class="value cnpj">{{
                    formatCnpj(displayProduct.supp_cnpj)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Seção de Metadados -->
            <div class="info-section">
              <h4>
                <i class="fas fa-info-circle"></i>
                Informações do Sistema
              </h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Usuário Responsável:</label>
                  <span class="value">{{
                    displayProduct.user || 'Não informado'
                  }}</span>
                </div>
                <div class="info-item">
                  <label>Data de Cadastro:</label>
                  <span class="value">{{
                    formatDateTime(displayProduct.date)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Histórico -->
        <div v-show="activeTab === 'history'" class="tab-content">
          <div v-if="hasHistory" class="history-section">
            <div class="history-container">
              <div
                v-for="(entry, key) in historyEntries"
                :key="key"
                class="history-entry"
              >
                <div class="history-header">
                  <span class="history-action">{{ entry.action }}</span>
                  <span class="history-date">{{
                    formatDateTime(entry.timestamp)
                  }}</span>
                </div>
                <div class="history-details">
                  <div v-if="entry.user" class="history-user">
                    <i class="fas fa-user"></i>
                    {{ entry.user }}
                  </div>
                  <div v-if="entry.comment" class="history-comment">
                    {{ entry.comment }}
                  </div>
                  <div
                    v-if="
                      entry.changes && Object.keys(entry.changes).length > 0
                    "
                    class="history-changes"
                  >
                    <h5>Alterações:</h5>
                    <div
                      v-for="(change, field) in entry.changes"
                      :key="field"
                      class="change-item"
                    >
                      <span class="field-name">{{ field }}:</span>
                      <span class="change-from">{{ change.from }}</span>
                      <i class="fas fa-arrow-right"></i>
                      <span class="change-to">{{ change.to }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-history">
            <i class="fas fa-clock"></i>
            <p>Nenhum histórico de alterações disponível</p>
          </div>
        </div>

        <!-- Tab: Edição -->
        <div v-show="activeTab === 'edit'" class="tab-content">
          <div class="edit-section">
            <form @submit.prevent="saveProduct" class="edit-form">
              <div class="form-group">
                <label for="edit-cli-code">
                  <i class="fas fa-barcode"></i>
                  Código Interno (cli_code)
                </label>
                <input
                  id="edit-cli-code"
                  v-model="editForm.cli_code"
                  type="text"
                  class="form-control"
                  placeholder="Digite o código interno"
                  required
                />
              </div>

              <div class="form-group">
                <label for="edit-cli-desc">
                  <i class="fas fa-align-left"></i>
                  Descrição Interna (cli_desc)
                </label>
                <textarea
                  id="edit-cli-desc"
                  v-model="editForm.cli_desc"
                  class="form-control"
                  rows="4"
                  placeholder="Digite a descrição interna"
                  required
                ></textarea>
              </div>

              <div class="form-actions">
                <button
                  type="button"
                  @click="resetEditForm"
                  class="btn btn-secondary"
                  :disabled="saving"
                >
                  <i class="fas fa-undo"></i>
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="saving"
                >
                  <i class="fas fa-save" :class="{ 'fa-spin': saving }"></i>
                  {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="confirmDelete" class="btn btn-danger">
          <i class="fas fa-trash"></i>
          Excluir Produto
        </button>
        <button @click="closeModal" class="btn btn-secondary">
          <i class="fas fa-times"></i>
          Fechar
        </button>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div v-if="showDeleteConfirm" class="confirm-overlay" @click="cancelDelete">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Confirmar Exclusão</h4>
        </div>
        <div class="confirm-body">
          <p>Tem certeza que deseja excluir este produto?</p>
          <div class="product-summary">
            <div>
              <strong>Código Interno:</strong> {{ displayProduct.cli_code }}
            </div>
            <div>
              <strong>Código Fornecedor:</strong> {{ displayProduct.supp_code }}
            </div>
            <div>
              <strong>Cliente:</strong>
              {{ formatCnpj(displayProduct.cli_cnpj) }}
            </div>
          </div>
          <p class="warning-text">
            <i class="fas fa-info-circle"></i>
            Esta ação não pode ser desfeita!
          </p>
        </div>
        <div class="confirm-footer">
          <button @click="cancelDelete" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button
            @click="deleteProduct"
            class="btn btn-danger"
            :disabled="deleting"
          >
            <i class="fas fa-trash" :class="{ 'fa-spin': deleting }"></i>
            {{ deleting ? 'Excluindo...' : 'Confirmar Exclusão' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductDetailsModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    product: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      showDeleteConfirm: false,
      deleting: false,
      activeTab: 'info',
      editForm: {
        cli_code: '',
        cli_desc: '',
      },
      saving: false,
      localProduct: null, // Cópia local do produto para atualizações reativas
    }
  },
  computed: {
    // Usar localProduct se disponível, senão usar product prop
    displayProduct() {
      return this.localProduct || this.product
    },
    hasHistory() {
      const hist = this.displayProduct.hist
      return hist && typeof hist === 'object' && Object.keys(hist).length > 0
    },
    historyEntries() {
      if (!this.hasHistory) return []

      // Converter o histórico em array ordenado por data
      return Object.entries(this.displayProduct.hist)
        .map(([key, entry]) => ({
          key,
          ...entry,
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    },
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.activeTab = 'info'
        this.resetEditForm()
        this.$nextTick(() => {
          if (this.$refs.modal) {
            this.$refs.modal.focus()
          }
        })
      }
    },
    product: {
      handler(newProduct) {
        if (newProduct) {
          // Criar cópia profunda do produto para atualizações locais
          this.localProduct = JSON.parse(JSON.stringify(newProduct))
          this.resetEditForm()
        }
      },
      immediate: true,
      deep: true, // Observar mudanças profundas no objeto
    },
  },
  mounted() {
    // Listener para ESC
    document.addEventListener('keydown', this.handleEscKey)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscKey)
  },
  methods: {
    handleModalClick(event) {
      // Fechar apenas se clicou no overlay (fora do modal)
      if (event.target === event.currentTarget) {
        this.closeModal()
      }
    },

    handleEscKey(event) {
      if (event.key === 'Escape' && this.show) {
        this.closeModal()
      }
    },

    closeModal() {
      this.$emit('close')
    },

    formatCnpj(cnpj) {
      if (!cnpj) return 'Não informado'
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    formatDateTime(date) {
      if (!date) return 'Não informado'
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },

    confirmDelete() {
      this.showDeleteConfirm = true
    },

    cancelDelete() {
      this.showDeleteConfirm = false
    },

    async deleteProduct() {
      if (this.deleting) return

      this.deleting = true

      try {
        // Verificar se apiClient está disponível
        if (!window.apiClient) {
          throw new Error('ApiClient não está disponível')
        }

        const apiClient = window.apiClient
        const product = this.displayProduct || this.product

        // Fazer requisição DELETE para o backend
        // O identificador único do produto é a combinação de cli_code e cli_cnpj
        await apiClient.request('/products', {
          method: 'DELETE',
          data: {
            cli_code: product.cli_code,
            cli_cnpj: product.cli_cnpj,
          },
        })

        // Fechar modal de confirmação
        this.showDeleteConfirm = false

        // Emitir evento de exclusão bem-sucedida
        this.$emit('deleted')

        // Fechar modal principal
        this.closeModal()

        // Mostrar mensagem de sucesso
        alert('Produto excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
        alert(
          'Erro ao excluir produto: ' +
            (error.response?.data?.error || error.message)
        )
      } finally {
        this.deleting = false
      }
    },

    resetEditForm() {
      const product = this.displayProduct || this.product
      if (product) {
        this.editForm = {
          cli_code: product.cli_code || '',
          cli_desc: product.cli_desc || '',
        }
      } else {
        this.editForm = {
          cli_code: '',
          cli_desc: '',
        }
      }
    },

    async saveProduct() {
      if (this.saving) return

      const product = this.displayProduct || this.product

      // Verificar se houve alterações
      if (
        this.editForm.cli_code === product.cli_code &&
        this.editForm.cli_desc === product.cli_desc
      ) {
        alert('Nenhuma alteração foi feita.')
        return
      }

      this.saving = true

      try {
        // Verificar se apiClient está disponível
        if (!window.apiClient) {
          throw new Error('ApiClient não está disponível')
        }

        const apiClient = window.apiClient

        // Obter usuário atual
        const userData = localStorage.getItem('user')
        const currentUser = userData ? JSON.parse(userData) : null

        // Fazer requisição PUT para o backend
        const response = await apiClient.request('/products', {
          method: 'PUT',
          data: {
            cli_code: product.cli_code, // Código original para identificação
            cli_cnpj: product.cli_cnpj,
            cli_desc: this.editForm.cli_desc,
            new_cli_code: this.editForm.cli_code, // Novo código se foi alterado
            supp_code: product.supp_code, // Para identificação alternativa se necessário
            supp_cnpj: product.supp_cnpj,
          },
        })

        // Atualizar o produto localmente com os novos valores
        let updatedProduct = {
          ...product,
          cli_code: this.editForm.cli_code,
          cli_desc: this.editForm.cli_desc,
        }

        // Se a resposta contém dados atualizados do produto (incluindo histórico), usar eles
        if (response && response.product) {
          // Mesclar os dados atualizados, preservando o histórico atualizado
          updatedProduct = {
            ...updatedProduct,
            ...response.product,
            // Garantir que o histórico seja preservado se vier na resposta
            hist: response.product.hist || updatedProduct.hist,
          }
        }

        // Incluir o código original para facilitar a busca na lista
        updatedProduct._originalCliCode = product.cli_code

        // Atualizar a cópia local do produto para refletir as mudanças imediatamente no modal
        // Isso atualiza o histórico e outras informações sem precisar recarregar
        this.localProduct = JSON.parse(JSON.stringify(updatedProduct))

        // Atualizar o produto local para refletir as mudanças no modal
        // Isso atualiza o prop product através do evento
        this.$emit('update:product', updatedProduct)

        // Emitir evento de atualização bem-sucedida com os dados atualizados
        this.$emit('updated', updatedProduct)

        // Mostrar mensagem de sucesso
        alert('Produto atualizado com sucesso!')

        // Voltar para a aba de informações
        this.activeTab = 'info'
      } catch (error) {
        console.error('Erro ao salvar produto:', error)
        alert(
          'Erro ao salvar produto: ' +
            (error.response?.data?.error || error.message)
        )
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.modal-body {
  padding: 25px;
  overflow-y: auto;
  flex: 1;
}

.product-info-grid {
  display: grid;
  gap: 25px;
}

.info-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
}

.info-section.full-width {
  grid-column: 1 / -1;
}

.info-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.info-item .value {
  color: #333;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-height: 20px;
  display: flex;
  align-items: center;
}

.value.code {
  /* Mesma formatação do texto de descrição com fonte maior */
  font-size: 1.05em;
}

.value.cnpj {
  font-family: 'Courier New', monospace;
  color: #28a745;
}

.history-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.history-entry {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.history-entry:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border-color: #17a2b8;
}

.history-entry:last-child {
  margin-bottom: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}

.history-action {
  font-weight: 600;
  color: #17a2b8;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-date {
  font-size: 0.85rem;
  color: #6c757d;
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.history-user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
}

.history-user i {
  color: #17a2b8;
}

.history-comment {
  color: #6c757d;
  font-style: italic;
  padding: 8px 12px;
  background: #f8f9fa;
  border-left: 3px solid #17a2b8;
  border-radius: 4px;
  font-size: 0.9rem;
}

.history-changes {
  margin-top: 8px;
}

.history-changes h5 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: #495057;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-changes h5::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #17a2b8;
  border-radius: 2px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #dee2e6;
}

.change-item:last-child {
  margin-bottom: 0;
}

.field-name {
  font-weight: 600;
  color: #495057;
  min-width: 120px;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.change-from {
  background: #f8d7da;
  color: #721c24;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.change-to {
  background: #d4edda;
  color: #155724;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.empty-history {
  text-align: center;
  padding: 30px;
  color: #666;
}

.empty-history i {
  font-size: 2rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

/* Modal de Confirmação */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 25px;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  border-radius: 8px 8px 0 0;
}

.confirm-header i {
  font-size: 1.5rem;
  color: #856404;
}

.confirm-header h4 {
  margin: 0;
  color: #856404;
  font-size: 1.2rem;
}

.confirm-body {
  padding: 25px;
}

.confirm-body > p {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #333;
}

.product-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
  margin-bottom: 15px;
}

.product-summary div {
  margin-bottom: 8px;
  color: #555;
  font-size: 0.9rem;
}

.product-summary div:last-child {
  margin-bottom: 0;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #856404;
  background: #fff3cd;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin: 0;
}

.warning-text i {
  font-size: 1.1rem;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  border-radius: 0 0 8px 8px;
}

/* Tabs Navigation */
.tabs-navigation {
  display: flex;
  border-bottom: 2px solid #dee2e6;
  background: #f8f9fa;
  padding: 0 25px;
  gap: 0;
}

.tab-button {
  padding: 15px 25px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  color: #495057;
  background: rgba(0, 0, 0, 0.05);
}

.tab-button.active {
  color: #17a2b8;
  border-bottom-color: #17a2b8;
  background: white;
}

.tab-button i {
  font-size: 1rem;
}

.tab-content {
  padding: 25px;
  min-height: 300px;
}

/* Edit Section */
.edit-section {
  max-width: 600px;
  margin: 0 auto;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group label i {
  color: #17a2b8;
  font-size: 1rem;
}

.form-control {
  padding: 12px 15px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #17a2b8;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25);
}

.form-control textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.btn-primary {
  background: #17a2b8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #138496;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.history-section {
  padding: 0;
}

.history-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.empty-history {
  text-align: center;
  padding: 60px 30px;
  color: #666;
}

.empty-history i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
  color: #adb5bd;
}

.empty-history p {
  font-size: 1.1rem;
  margin: 0;
}

/* Responsividade */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-width: none;
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .change-item {
    flex-wrap: wrap;
    gap: 4px;
  }

  .tabs-navigation {
    padding: 0 10px;
    overflow-x: auto;
  }

  .tab-button {
    padding: 12px 15px;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .tab-content {
    padding: 15px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
