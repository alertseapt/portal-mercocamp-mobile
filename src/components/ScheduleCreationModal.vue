<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content large schedule-creation-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i
            :class="
              isEffectivatingBooking ? 'fas fa-arrow-up' : 'fas fa-plus-circle'
            "
          ></i>
          {{
            isEffectivatingBooking
              ? 'Efetivar Agendamento Prévio'
              : 'Criar Novo Agendamento'
          }}
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div :class="['step', stepClasses[1]]">
          <div class="step-number">1</div>
          <div class="step-label">Upload XML</div>
        </div>
        <div :class="['step', stepClasses[2]]">
          <div class="step-number">2</div>
          <div class="step-label">Informações</div>
        </div>
        <div :class="['step', stepClasses[3]]">
          <div class="step-number">3</div>
          <div class="step-label">Produtos</div>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="errors.length > 0" class="error-container">
        <div
          v-for="(error, index) in errors"
          :key="index"
          class="error-message"
        >
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
          <button @click="removeError(index)" class="btn-close-error">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Processando...</p>
        <div v-if="uploadProgress > 0" class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Loading Prefill -->
      <div v-if="loadingPrefill" class="loading-container prefill-loading">
        <div class="prefill-spinner">
          <i class="fas fa-sync-alt fa-spin"></i>
        </div>
        <h3 class="prefill-title">Verificando Produtos</h3>
        <p class="prefill-message">
          Consultando produtos já cadastrados e aplicando pré-preenchimento...
        </p>
        <div class="prefill-progress">
          <div class="prefill-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <small class="prefill-help">
          <i class="fas fa-info-circle"></i>
          Produtos já cadastrados serão pré-preenchidos e bloqueados para
          alteração
        </small>
      </div>

      <!-- Step 1: Upload XML -->
      <div
        v-if="currentStep === 1 && !loading && !loadingPrefill"
        class="modal-body"
      >
        <div class="upload-section">
          <div
            class="upload-area"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
          >
            <i class="fas fa-upload"></i>
            <h4>Arraste o arquivo XML da NFe aqui</h4>
            <p>ou clique para selecionar</p>
            <input
              type="file"
              accept=".xml"
              @change="handleFileSelect"
              id="xml-file-input"
              style="display: none"
            />
            <label for="xml-file-input" class="btn btn-primary">
              <i class="fas fa-folder-open"></i>
              Selecionar Arquivo
            </label>
          </div>

          <div v-if="selectedFile" class="file-info">
            <i class="fas fa-file-code"></i>
            <span>{{ selectedFile.name }}</span>
            <span class="file-size"
              >({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span
            >
          </div>
        </div>
      </div>

      <!-- Step 2: NFe Information -->
      <div
        v-if="currentStep === 2 && !loading && !loadingPrefill"
        class="modal-body"
      >
        <div class="nfe-info">
          <h4>Informações da NFe</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>Número da NFe:</label>
              <span>{{ nfeData.number }}</span>
            </div>
            <div class="info-item">
              <label>Fornecedor:</label>
              <span>{{ nfeData.supplier_name }}</span>
            </div>
            <div class="info-item">
              <label>Destinatário:</label>
              <span>{{ nfeData.client_name }}</span>
            </div>
            <div class="info-item">
              <label>CNPJ Fornecedor:</label>
              <span>{{ formatCNPJ(nfeData.supplier_cnpj) }}</span>
            </div>
            <div class="info-item">
              <label>CNPJ Destinatário:</label>
              <span>{{ formatCNPJ(nfeData.client_cnpj) }}</span>
            </div>
            <div class="info-item">
              <label>Volumes:</label>
              <span>{{ nfeData.case_count }}</span>
            </div>
            <div class="info-item">
              <label>Qtd. Total Produtos:</label>
              <span>{{ totalQuantity }}</span>
            </div>
            <div class="info-item">
              <label>Valor Total:</label>
              <span>{{ formatCurrency(totalValue) }}</span>
            </div>
          </div>

          <!-- Container destacado para seleção de estoque e data -->
          <div class="estoque-data-container">
            <!-- Estoque Selection -->
            <div class="client-selection">
              <h5>Estoque Selecionado</h5>
              <div v-if="selectedClient" class="selected-client-info">
                <div class="info-item">
                  <label>Nome:</label>
                  <span>{{ selectedClient.name }}</span>
                </div>
                <div class="info-item">
                  <label>CNPJ:</label>
                  <span>{{ formatCNPJ(selectedClient.cnpj) }}</span>
                </div>
                <div v-if="selectedClient.numero" class="info-item">
                  <label>Número:</label>
                  <span>{{ selectedClient.numero }}</span>
                </div>
                <button
                  v-if="!storageLocked"
                  type="button"
                  class="btn btn-outline-primary btn-sm mt-2 btn-alterar-estoque"
                  @click="openClientSelectionModal"
                >
                  <i class="fas fa-edit"></i> Alterar Estoque
                </button>
                <small
                  v-else
                  class="text-muted d-block mt-2 storage-locked-hint"
                >
                  <i class="fas fa-lock"></i>
                  Estoque travado pelo CNPJ do destinatário do XML
                </small>
              </div>
              <div v-else>
                <button
                  type="button"
                  class="btn btn-primary btn-alterar-estoque"
                  @click="openClientSelectionModal"
                >
                  <i class="fas fa-warehouse"></i> Selecionar Estoque
                </button>
                <small class="text-muted d-block mt-2"
                  >Clique para escolher o estoque de destino</small
                >
              </div>
            </div>

            <!-- Delivery Date Selection -->
            <div class="delivery-date-selection">
              <h5>Data de Entrega Desejada</h5>
              <div class="date-input-container">
                <label for="scheduledDate"
                  >Selecione a data para entrega física:</label
                >
                <input
                  type="date"
                  id="scheduledDate"
                  v-model="scheduledDate"
                  class="form-control"
                  :min="minScheduleDate"
                  required
                />
                <small class="help-text"
                  >Esta será a data para agendamento da entrega física das
                  mercadorias</small
                >
                <div class="prevision-checkbox-container">
                  <label class="prevision-checkbox-label">
                    <input
                      type="checkbox"
                      v-model="isPrevision"
                      class="prevision-checkbox"
                    />
                    <span class="prevision-label-text">Previsão</span>
                  </label>
                </div>
                <div
                  v-if="showCrossdockCheckbox"
                  class="prevision-checkbox-container"
                >
                  <label class="prevision-checkbox-label">
                    <input
                      type="checkbox"
                      v-model="isCrossdock"
                      :disabled="isCrossdockDisabled"
                      class="prevision-checkbox"
                    />
                    <span class="prevision-label-text">Crossdock</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Mensagem para cliente integration=0 -->
          <div
            v-if="!clientRequiresProducts && selectedClient"
            class="alert alert-info mt-3"
          >
            <h6>
              <i class="fas fa-info-circle"></i> Agendamento Simplificado
              (Integration = 0)
            </h6>
            <p class="mb-2">
              Este cliente está configurado para
              <strong>agendamento simplificado</strong>. A seleção da data é
              feita aqui mesmo, sem necessidade de configurar produtos.
            </p>
            <div class="mb-2">
              <strong>Como funciona:</strong>
              <ul class="mb-0 mt-1">
                <li>
                  <i class="fas fa-check text-success"></i> Usa códigos e
                  descrições originais da NFe
                </li>
                <li>
                  <i class="fas fa-check text-success"></i> Não precisa
                  configurar produtos manualmente
                </li>
                <li>
                  <i class="fas fa-check text-success"></i> Finaliza o
                  agendamento direto desta tela
                </li>
                <li>
                  <i class="fas fa-info-circle text-info"></i> Não há integração
                  com sistema CORPEM
                </li>
              </ul>
            </div>
            <p class="mb-0">
              <small class="text-muted">
                <i class="fas fa-arrow-right"></i> Selecione a data e finalize o
                agendamento com o botão "Criar Agendamento"
              </small>
            </p>
          </div>
        </div>
      </div>

      <!-- Modal de seleção de estoque/cliente -->
      <div
        v-if="showClientSelectionModal"
        class="modal-overlay"
        @click.self="closeClientSelectionModal"
      >
        <div class="modal-content small">
          <div class="modal-header">
            <h4>Selecione o Estoque</h4>
            <button class="btn-close" @click="closeClientSelectionModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <!-- Loading state for clients -->
            <div v-if="loadingClients" class="loading-clients-container">
              <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <p class="loading-text">Carregando opções de estoque...</p>
              <small class="loading-subtext"
                >Processando permissões e estoques disponíveis</small
              >
            </div>

            <!-- Clients list -->
            <div v-else class="estoque-lista-vertical">
              <div
                v-for="client in clients"
                :key="client.cnpj"
                class="estoque-lista-item"
              >
                <div class="estoque-lista-info">
                  <i class="fas fa-warehouse"></i>
                  <span class="estoque-nome">{{ client.name }}</span>
                  <span class="estoque-cnpj"
                    >CNPJ: {{ formatCNPJ(client.cnpj) }}</span
                  >
                  <span v-if="client.numero" class="estoque-numero"
                    >Nº: {{ client.numero }}</span
                  >
                </div>
                <button
                  class="btn btn-primary btn-sm btn-selecionar-estoque"
                  @click.stop="selectClient(client)"
                >
                  Selecionar
                </button>
              </div>
              <div
                v-if="clients.length === 0"
                class="text-muted estoque-lista-vazia"
              >
                <i class="fas fa-info-circle"></i>
                Nenhum estoque disponível para seu usuário.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Products -->
      <div
        v-if="currentStep === 3 && !loading && !loadingPrefill"
        class="modal-body products-modal-body"
      >
        <div class="products-section">
          <div class="products-header">
            <h4>Produtos da NFe</h4>
          </div>
          <div class="products-controls">
            <div class="checkbox-controls">
              <label class="master-checkbox">
                <input
                  type="checkbox"
                  v-model="selectAllProducts"
                  @change="toggleAllProducts"
                />
                Marcar todos
              </label>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary invert-btn"
                @click="invertProductSelection"
              >
                <i class="fas fa-random"></i>
                Inverter seleção
              </button>
              <span class="products-hint">
                <i class="fas fa-info-circle"></i>
                Produtos marcados usarão código e descrição do fornecedor
                automaticamente
              </span>
            </div>
          </div>
          <div class="products-table-container">
            <table class="products-table">
              <thead>
                <tr>
                  <th width="50">
                    <i
                      class="fas fa-check-square"
                      title="Usar dados do fornecedor"
                    ></i>
                  </th>
                  <th>Cód. Forn.</th>
                  <th>
                    Cód. Venda
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th>Descrição Fornecedor</th>
                  <th>
                    Descrição Venda
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th>Quant.</th>
                  <th>
                    Fator
                    <i
                      class="fas fa-question-circle"
                      title="Fator de conversão"
                    ></i>
                  </th>
                  <th>Valor Un.</th>
                  <th>Valor Total</th>
                  <th>
                    Código EAN
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in products"
                  :key="product.id"
                  :class="{
                    'product-locked': product.isLocked,
                    'product-use-supplier': product.useSupplierData,
                  }"
                >
                  <td class="checkbox-cell">
                    <label class="product-checkbox">
                      <input
                        type="checkbox"
                        v-model="product.useSupplierData"
                        @change="toggleProductSupplierData(product)"
                        :disabled="product.isLocked"
                      />
                      <span class="checkmark-small"></span>
                    </label>
                  </td>
                  <td :title="product.supplier_code">
                    <strong>{{ product.supplier_code }}</strong>
                    <i
                      v-if="product.isLocked"
                      class="fas fa-lock product-lock-icon"
                      title="Produto já cadastrado - campos bloqueados"
                    ></i>
                  </td>
                  <td>
                    <input
                      v-model="product.client_code"
                      :disabled="product.isLocked || product.useSupplierData"
                      @change="updateProduct(product)"
                      @paste="handlePaste($event, product, 'client_code')"
                      class="form-control form-control-sm"
                      :data-row="products.indexOf(product)"
                      :data-col="2"
                      :placeholder="
                        product.useSupplierData ? product.supplier_code : ''
                      "
                    />
                  </td>
                  <td
                    :title="product.supplier_description"
                    class="description-cell"
                  >
                    {{ product.supplier_description }}
                  </td>
                  <td>
                    <input
                      v-model="product.client_description"
                      :disabled="product.isLocked || product.useSupplierData"
                      @change="updateProduct(product)"
                      @paste="
                        handlePaste($event, product, 'client_description')
                      "
                      class="form-control form-control-sm"
                      :data-row="products.indexOf(product)"
                      :data-col="4"
                      :placeholder="
                        product.useSupplierData
                          ? product.supplier_description
                          : ''
                      "
                    />
                  </td>
                  <td>{{ product.quantity }} {{ product.unit }}</td>
                  <td>
                    <input
                      v-model="product.factor"
                      type="number"
                      step="0.01"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>{{ formatCurrency(product.unit_value) }}</td>
                  <td>{{ formatCurrency(product.total_value) }}</td>
                  <td>
                    <input
                      v-model="product.ean_code"
                      @change="updateProduct(product)"
                      @paste="handlePaste($event, product, 'ean_code')"
                      class="form-control form-control-sm"
                      placeholder="Código EAN"
                      :data-row="products.indexOf(product)"
                      :data-col="9"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          v-if="currentStep > 1"
          @click="previousStep"
          :disabled="loadingPrefill"
          class="btn btn-secondary"
        >
          <i class="fas fa-arrow-left"></i>
          Anterior
        </button>

        <!-- Botão Próximo/Continuar -->
        <button
          v-if="currentStep < 3"
          @click="nextStep"
          :disabled="
            (currentStep === 1 && !canProceedToStep2) ||
            (currentStep === 2 && !canProceedToStep3) ||
            loadingPrefill
          "
          :class="
            currentStep === 2 && !clientRequiresProducts
              ? 'btn btn-success'
              : 'btn btn-primary'
          "
        >
          <template v-if="loadingPrefill">
            <i class="fas fa-spinner fa-spin"></i>
            Verificando...
          </template>
          <template v-else>
            <span v-if="currentStep === 2 && !clientRequiresProducts">
              Continuar Agendamento
              <i class="fas fa-check"></i>
            </span>
            <span v-else>
              Próximo
              <i class="fas fa-arrow-right"></i>
            </span>
          </template>
        </button>

        <button
          v-if="currentStep === 3"
          @click="createSchedule"
          :disabled="!canCreateSchedule || loading"
          class="btn btn-success"
        >
          <i class="fas fa-check"></i>
          {{
            isEffectivatingBooking
              ? 'Efetivar Agndamento Prévio'
              : 'Solicitar Agendamento'
          }}
        </button>
      </div>

      <!-- Product Edit Modal -->
      <product-edit-modal
        v-if="showProductEditModal"
        :product="selectedProduct"
        :show-modal="showProductEditModal"
        @close="closeProductEditModal"
        @updated="updateProduct"
      >
      </product-edit-modal>
    </div>
  </div>
</template>

<script>
import ProductEditModal from './ProductEditModal.vue'

export default {
  name: 'ScheduleCreationModal',

  components: {
    ProductEditModal,
  },

  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    bookingToEffectivate: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      currentStep: 1,
      selectedFile: null,
      nfeData: {},
      products: [],
      loading: false,
      errors: [],
      uploadProgress: 0,
      showProductEditModal: false,
      selectedProduct: null,
      clients: [],
      selectedClient: null,
      storageLocked: false, // Trava de seleção pelo CNPJ do destinatário do XML (xml_cnpj_lock)
      showClientSelectionModal: false,
      loadingClients: false,
      scheduledDate: '',
      isPrevision: false, // Indica se a data é uma previsão
      isCrossdock: false, // Indica se é crossdocking
      loadingPrefill: false, // Novo estado para loading de pré-preenchimento
      selectAllProducts: false, // Controla o checkbox master
    }
  },

  computed: {
    isEffectivatingBooking() {
      return !!this.bookingToEffectivate
    },

    canProceedToStep2() {
      return (
        this.selectedFile &&
        this.nfeData &&
        Object.keys(this.nfeData).length > 0
      )
    },

    canProceedToStep3() {
      // Validações básicas sempre obrigatórias
      if (!this.nfeData || !this.selectedClient || !this.scheduledDate) {
        return false
      }

      // Se cliente tem integration = 0, NÃO precisa de produtos (usa códigos do fornecedor)
      if (
        this.selectedClient &&
        (this.selectedClient.integration === 0 ||
          this.selectedClient.integration === '0')
      ) {
        console.log(
          `🔍 [INTEGRATION LOG] canProceedToStep3() - ALLOWED (integration=0):`,
          {
            client: this.selectedClient.name,
            integration: this.selectedClient.integration,
            reason: 'Client with integration=0 can proceed without products',
          }
        )
        return true // Só precisa de NFe, cliente e data
      }

      // Se cliente tem integration = 1 (ou padrão), exige produtos
      const canProceed = this.products.length > 0
      console.log(
        `🔍 [INTEGRATION LOG] canProceedToStep3() - REQUIRES PRODUCTS:`,
        {
          client: this.selectedClient.name,
          integration: this.selectedClient.integration,
          productsCount: this.products.length,
          canProceed: canProceed,
          reason: 'Client with integration=1 requires products',
        }
      )
      return canProceed
    },

    canCreateSchedule() {
      // Validações básicas sempre obrigatórias
      if (!this.selectedClient || !this.scheduledDate) {
        return false
      }

      // Se cliente tem integration = 0, NÃO precisa de produtos (usa códigos do fornecedor)
      if (
        this.selectedClient &&
        (this.selectedClient.integration === 0 ||
          this.selectedClient.integration === '0')
      ) {
        console.log(
          `🔍 [INTEGRATION LOG] canCreateSchedule() - ALLOWED (integration=0):`,
          {
            client: this.selectedClient.name,
            integration: this.selectedClient.integration,
            currentStep: this.currentStep,
            reason:
              'Client with integration=0 does not require product information',
          }
        )
        return true // Só precisa de cliente e data
      }

      // Se cliente tem integration = 1 (ou padrão), exige produtos com validação
      if (!(this.products.length > 0)) {
        return false
      }

      // Verificar se todos os produtos não bloqueados têm os campos obrigatórios preenchidos
      const unlockedProducts = this.products.filter(p => !p.isLocked)

      for (const product of unlockedProducts) {
        // Se o produto usa dados do fornecedor, não precisa validar os campos editáveis
        if (product.useSupplierData) {
          continue
        }

        // Se não usa dados do fornecedor, os campos client_code e client_description são obrigatórios
        if (!product.client_code || !product.client_code.trim()) {
          return false
        }
        if (!product.client_description || !product.client_description.trim()) {
          return false
        }
      }

      return true
    },

    stepClasses() {
      return {
        1: { active: this.currentStep === 1, completed: this.currentStep > 1 },
        2: { active: this.currentStep === 2, completed: this.currentStep > 2 },
        3: { active: this.currentStep === 3, completed: false },
      }
    },

    totalValue() {
      return this.products.reduce(
        (total, product) => total + (product.total_value || 0),
        0
      )
    },

    totalQuantity() {
      return this.products.reduce(
        (total, product) => total + (product.quantity || 0),
        0
      )
    },

    clientRequiresProducts() {
      // Debug completo do selectedClient
      console.log(
        `🔍 [INTEGRATION LOG] clientRequiresProducts() - FULL DEBUG:`,
        {
          hasSelectedClient: !!this.selectedClient,
          selectedClient: this.selectedClient,
          integrationValue: this.selectedClient?.integration,
          integrationTypeOf: typeof this.selectedClient?.integration,
        }
      )

      // Se cliente tem integration = 0, NÃO exige produtos (usa dados do fornecedor)
      const requires = !(
        this.selectedClient &&
        (this.selectedClient.integration === 0 ||
          this.selectedClient.integration === '0')
      )
      console.log(`🔍 [INTEGRATION LOG] clientRequiresProducts():`, {
        selectedClient: this.selectedClient
          ? {
              name: this.selectedClient.name,
              cnpj: this.selectedClient.cnpj,
              integration: this.selectedClient.integration,
            }
          : null,
        requires: requires,
        reason: !this.selectedClient
          ? 'No client selected'
          : this.selectedClient.integration === 0 ||
              this.selectedClient.integration === '0'
            ? 'Client has integration=0'
            : 'Client has integration=1 or undefined',
      })
      return requires
    },

    canFinishFromStep2() {
      // Permite finalizar direto da etapa 2 se cliente não exige produtos
      const canFinish =
        !this.clientRequiresProducts &&
        this.nfeData &&
        this.selectedClient &&
        this.scheduledDate
      console.log(`🔍 [INTEGRATION LOG] canFinishFromStep2():`, {
        canFinish: canFinish,
        clientRequiresProducts: this.clientRequiresProducts,
        hasNfeData: !!this.nfeData,
        hasSelectedClient: !!this.selectedClient,
        hasScheduledDate: !!this.scheduledDate,
        currentStep: this.currentStep,
      })
      return canFinish
    },

    isClientAutoSelected() {
      const currentUser = this.getCurrentUser()
      return (
        currentUser &&
        currentUser.cli_access &&
        this.nfeData.client_cnpj &&
        currentUser.cli_access[this.nfeData.client_cnpj]
      )
    },

    hasCreatePermission() {
      const currentUser = this.getCurrentUser()
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0 // Usuários nível 1 PODEM criar
      )
    },

    createButtonText() {
      return 'Efetivar Agendamento'
    },

    minScheduleDate() {
      // Data mínima baseada no level_access do usuário:
      // - level_access = 1 (Client): amanhã + regras de final de semana e horário
      // - level_access != 1 (Dev, Admin, Manager, Lobby): hoje ou datas futuras
      const currentUser = this.getCurrentUser
        ? this.getCurrentUser()
        : window.apiClient
          ? window.apiClient.getCurrentUser()
          : null
      const userLevel = currentUser?.level_access

      if (userLevel !== 1) {
        return new Date().toISOString().split('T')[0]
      }

      // Nível 1: aplicar regras completas
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=Dom, 6=Sáb
      const hour = now.getHours()

      const minDate = new Date(now)
      minDate.setHours(0, 0, 0, 0)
      minDate.setDate(minDate.getDate() + 1) // base: amanhã

      // Após 17h: não pode agendar para o dia seguinte → +1 dia
      if (hour >= 17) {
        minDate.setDate(minDate.getDate() + 1)
      }

      // Final de semana (sáb/dom): segunda-feira bloqueada → avançar se necessário
      if ((dayOfWeek === 0 || dayOfWeek === 6) && minDate.getDay() === 1) {
        minDate.setDate(minDate.getDate() + 1)
      }

      return minDate.toISOString().split('T')[0]
    },

    // Controla a visibilidade da checkbox de crossdocking
    showCrossdockCheckbox() {
      if (!this.selectedClient) return false

      // Verificar valor de crossdocking
      const crossdockingValue = this.selectedClient?.crossdocking

      // Mostrar apenas se crossdocking = 1 ou 2
      return (
        crossdockingValue === '1' ||
        crossdockingValue === '2' ||
        crossdockingValue === 1 ||
        crossdockingValue === 2
      )
    },

    // Controla se a checkbox está desabilitada
    isCrossdockDisabled() {
      if (!this.selectedClient) return false

      const crossdockingValue = this.selectedClient?.crossdocking

      // crossdocking = 2: Checkbox bloqueada (sempre marcada)
      return crossdockingValue === '2' || crossdockingValue === 2
    },
  },

  watch: {
    bookingToEffectivate: {
      handler(newBooking) {
        if (newBooking) {
          this.prepopulateFromBooking(newBooking)
        }
      },
      immediate: true,
    },
  },

  methods: {
    async prepopulateFromBooking(booking) {
      if (!booking) return

      console.log('📋 Pré-populando dados da marcação:', booking)

      try {
        // Iniciar no passo 1 para permitir upload do XML
        this.currentStep = 1

        // Limpar dados para upload do XML
        this.nfeData = {}
        this.products = []
        this.selectedFile = null

        // Pré-popular apenas a data de entrega da marcação (se disponível)
        this.scheduledDate = booking.date || ''

        // Carregar clientes disponíveis em background
        this.loadAvailableClients()
          .then(() => {
            // Tentar encontrar o cliente da marcação quando os clientes estiverem carregados
            if (booking.client && this.clients.length > 0) {
              const normalizedBookingClient = booking.client.replace(
                /[^\d]/g,
                ''
              )
              const matchingClient = this.clients.find(client => {
                const normalizedClientCnpj = (client.cnpj || '').replace(
                  /[^\d]/g,
                  ''
                )
                return normalizedClientCnpj === normalizedBookingClient
              })

              if (matchingClient) {
                this.selectedClient = matchingClient
                console.log(
                  '✅ Cliente da marcação pré-selecionado:',
                  matchingClient.name
                )
              }
            }
          })
          .catch(error => {
            console.warn('Erro ao carregar clientes:', error)
          })

        console.log(
          '✅ Modal configurado para efetivação - aguardando upload do XML'
        )
      } catch (error) {
        console.error('❌ Erro ao pré-popular dados da marcação:', error)
        this.showError('Erro ao carregar dados da marcação')
      }
    },

    closeModal() {
      this.resetModal()
      this.$emit('close')
    },

    resetModal() {
      // Só resetar completamente se não for efetivação
      if (!this.isEffectivatingBooking) {
        this.currentStep = 1
        this.selectedFile = null
        this.nfeData = {}
        this.products = []
        this.selectedClient = null
        this.storageLocked = false
        this.scheduledDate = ''
        this.isPrevision = false
        this.isCrossdock = false
      }

      this.loading = false
      this.loadingPrefill = false
      this.errors = []
      this.uploadProgress = 0
    },

    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedFile = file
        await this.parseAndExtractXML()
      }
    },

    async handleDrop(event) {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file && file.name.endsWith('.xml')) {
        this.selectedFile = file
        await this.parseAndExtractXML()
      } else {
        this.showError('Por favor, selecione um arquivo XML válido')
      }
    },

    async parseAndExtractXML() {
      if (!this.selectedFile) return

      this.loading = true
      this.errors = []
      this.uploadProgress = 0

      try {
        const xmlText = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = e => reject(e)
          reader.readAsText(this.selectedFile)
        })

        const { nfeData, products } = this.parseNFeXML(xmlText)
        this.uploadProgress = 50

        // VERIFICAÇÃO DE DUPLICIDADE - PRIMEIRA ETAPA
        console.log(
          '🔍 Verificando duplicidade de chave NFe na primeira etapa...'
        )

        if (nfeData.nfe_key) {
          try {
            const apiClient = window.apiClient
            const duplicateCheckResponse = await apiClient.request(
              '/schedules/check-duplicate',
              {
                method: 'POST',
                data: { nfe_key: nfeData.nfe_key },
              }
            )

            if (!duplicateCheckResponse.success) {
              // NFe duplicada encontrada
              const errorMessage =
                duplicateCheckResponse.message || 'NFe já possui agendamento'
              console.log(
                '❌ NFe duplicada detectada na primeira etapa:',
                errorMessage
              )

              this.showError(errorMessage)
              this.nfeData = {}
              this.products = []
              this.selectedFile = null
              return
            }

            console.log('✅ NFe não duplicada - prosseguindo com processamento')
          } catch (duplicateError) {
            console.error('❌ Erro ao verificar duplicidade:', duplicateError)

            // Se for erro 409 (conflict), é uma duplicata
            if (duplicateError.response?.status === 409) {
              const errorMessage =
                duplicateError.response?.data?.message ||
                'Esta NFe já possui um agendamento ativo'
              this.showError(errorMessage)
              this.nfeData = {}
              this.products = []
              this.selectedFile = null
              return
            }

            // Outros erros são tratados como problemas de conexão
            console.warn(
              '⚠️ Erro de conexão na verificação de duplicidade, prosseguindo:',
              duplicateError.message
            )
          }
        }

        // Continuação do processamento normal
        this.nfeData = nfeData
        this.products = products
        this.uploadProgress = 100

        // Execute carregamento de clientes disponíveis com timeout para não travar a interface
        this.loadAvailableClientsWithTimeout()
          .then(() => {
            console.log('Carregamento de clientes concluído')
          })
          .catch(() => {
            console.log('Timeout no carregamento de clientes')
          })

        this.showSuccess('XML processado com sucesso!')
      } catch (error) {
        console.error('Erro ao processar XML:', error)

        if (
          error.message &&
          (error.message.includes('CNPJ do destinatário não encontrado') ||
            error.message.includes('não possui acesso ao cliente') ||
            error.message.includes('não autenticado'))
        ) {
          this.showError(error.message)
        } else {
          this.showError(
            'Erro ao processar arquivo XML: ' +
              (error.message || 'Erro desconhecido')
          )
        }

        this.nfeData = {}
        this.products = []
        this.selectedFile = null
      } finally {
        this.loading = false
      }
    },

    parseNFeXML(xmlText) {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      const ide = xmlDoc.querySelector('ide')
      const emit = xmlDoc.querySelector('emit')
      const dest = xmlDoc.querySelector('dest')
      const vol = xmlDoc.querySelector('vol')
      const infNFe = xmlDoc.querySelector('infNFe')

      const nfe_key = infNFe?.getAttribute('Id')?.replace(/^NFe/, '') || ''

      const nfeData = {
        number: ide?.querySelector('nNF')?.textContent || '',
        nfe_key: nfe_key,
        client_cnpj: dest?.querySelector('CNPJ')?.textContent || '',
        client_name: dest?.querySelector('xNome')?.textContent || '',
        supplier_cnpj: emit?.querySelector('CNPJ')?.textContent || '',
        supplier_name: emit?.querySelector('xNome')?.textContent || '',
        case_count: parseInt(vol?.querySelector('qVol')?.textContent || '0'),
        date: ide?.querySelector('dhEmi')?.textContent?.slice(0, 10) || '',
        qt_prod: 0,
        products: [],
      }

      const products = []
      const detList = xmlDoc.querySelectorAll('det')

      detList.forEach((det, index) => {
        const prod = det.querySelector('prod')
        if (prod) {
          const supplierCode = prod.querySelector('cProd')?.textContent || ''
          const supplierDescription =
            prod.querySelector('xProd')?.textContent || ''

          // Extrair informações de rastreabilidade (lote e validade) se existirem
          const rastro = prod.querySelector('rastro')
          let lote = null
          let validade = null

          if (rastro) {
            lote = rastro.querySelector('nLote')?.textContent || null
            validade = rastro.querySelector('dVal')?.textContent || null

            if (lote || validade) {
              console.log(`📦 [RASTREABILIDADE] Produto ${supplierCode}:`, {
                lote: lote,
                validade: validade,
              })
            }
          }

          products.push({
            id: `product_${index}_${Date.now()}`, // Unique ID for each product
            item: det.querySelector('nItem')?.textContent || '',
            code: supplierCode,
            supplier_code: supplierCode,
            client_code: '', // VAZIO inicialmente - será preenchido apenas pelo prefill ou como padrão no else
            ean_code: prod.querySelector('cEAN')?.textContent || '',
            description: supplierDescription,
            supplier_description: supplierDescription,
            client_description: '', // VAZIO inicialmente - será preenchido apenas pelo prefill ou como padrão no else
            ncm: prod.querySelector('NCM')?.textContent || '',
            quantity: parseFloat(
              prod.querySelector('qCom')?.textContent || '0'
            ),
            unit: prod.querySelector('uCom')?.textContent || '',
            unit_value: parseFloat(
              prod.querySelector('vUnCom')?.textContent || '0'
            ),
            total_value: parseFloat(
              prod.querySelector('vProd')?.textContent || '0'
            ),
            factor: 1, // Valor padrão para fator
            isLocked: false, // Inicialmente não bloqueado
            useSupplierData: false, // Inicialmente desmarcado - usuário deve preencher dados
            // Informações de rastreabilidade extraídas do XML
            lote: lote,
            validade: validade,
          })
        }
      })

      nfeData.products = products
      nfeData.qt_prod = products.length

      console.log(
        'JSON resultante do parse do XML NFe:',
        JSON.stringify(nfeData, null, 2)
      )

      return { nfeData, products }
    },

    async uploadAndParseXML() {
      this.showError(
        'O parseamento do XML agora é feito no navegador. Use a nova função de upload.'
      )
    },

    async checkExistingProducts() {
      if (!this.products.length || !this.selectedClient) return

      try {
        console.log('🔍 Buscando pré-preenchimento para produtos...')

        // Usar o apiClient global com cache
        const apiClient = window.apiClient

        // Preparar dados para a API de pré-preenchimento
        const productsToCheck = this.products.map(product => ({
          supp_code: product.supplier_code || product.code,
          supp_cnpj: this.nfeData.supplier_cnpj,
        }))

        // Chamar API de pré-preenchimento em lote
        const response = await apiClient.request('/products/batch-prefill', {
          method: 'POST',
          data: {
            products: productsToCheck,
            cliCnpj: this.selectedClient.cnpj.replace(/[^\d]/g, ''),
          },
        })

        if (!response.success) {
          console.error('Erro ao buscar pré-preenchimento:', response.message)
          return
        }

        console.log(
          `📊 Pré-preenchimento: ${response.summary.found} de ${response.summary.total} produtos encontrados`
        )

        // Aplicar pré-preenchimento nos produtos
        response.data.forEach((prefillResult, index) => {
          const product = this.products[index]

          console.log(`🔍 PRODUTO ${index + 1}: ${prefillResult.supp_code}`)
          console.log(`   has_data: ${prefillResult.has_data}`)
          console.log(`   prefill_data: ${!!prefillResult.prefill_data}`)
          console.log(`   client_code antes:`, product.client_code)
          console.log(
            `   client_description antes:`,
            product.client_description
          )

          if (prefillResult.has_data && prefillResult.prefill_data) {
            const prefillData = prefillResult.prefill_data

            console.log(`✅ Pré-preenchendo produto: ${prefillData.supp_code}`)

            // Pré-preencher campos editáveis
            product.client_code = prefillData.cli_code
            product.client_description = prefillData.cli_desc

            // Marcar como bloqueado se for produto específico do mesmo estoque
            product.isLocked = prefillData.is_locked

            if (prefillData.is_locked) {
              console.log(
                `🔒 Produto ${prefillData.supp_code} bloqueado para alteração`
              )
            }
          } else {
            console.log(`❌ Produto não encontrado - aplicando valores padrão`)

            // Produto não encontrado - definir valores padrão
            product.isLocked = false
            product.factor = 1

            // Produto não encontrado - definir valores padrão como vazio
            product.client_code = ''
            product.client_description = ''

            console.log(`   client_code depois:`, product.client_code)
            console.log(
              `   client_description depois:`,
              product.client_description
            )
          }
        })

        // Forçar atualização da interface
        this.forceReactiveUpdate()
        console.log('✅ Pré-preenchimento aplicado e interface atualizada')
      } catch (error) {
        console.error('❌ Erro ao aplicar pré-preenchimento:', error)

        // Em caso de erro, definir valores padrão para todos os produtos como vazio
        this.products.forEach(product => {
          product.isLocked = false
          product.factor = 1

          // SEMPRE definir valores padrão como vazio em caso de erro
          product.client_code = ''
          product.client_description = ''
        })

        // Forçar atualização da interface mesmo em caso de erro
        this.forceReactiveUpdate()
      }
    },

    async checkExistingProductsWithTimeout() {
      const timeout = new Promise(
        (_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000) // 30 segundos
      )

      try {
        await Promise.race([this.checkExistingProducts(), timeout])
      } catch (error) {
        console.warn(
          'Timeout ou erro ao verificar produtos existentes:',
          error.message
        )
        // Define valores padrão em caso de erro
        this.products.forEach(product => {
          if (product.exists === undefined) {
            product.exists = false
            product.factor = 1
          }
        })
      }
    },

    // Método específico para carregar clientes quando o modal é aberto
    async loadClientsForModal() {
      this.loadingClients = true
      try {
        await this.loadAvailableClients()
      } catch (error) {
        console.error('Erro ao carregar clientes para o modal:', error)
        this.showError('Erro ao carregar lista de estoques. Tente novamente.')
      } finally {
        this.loadingClients = false
      }
    },

    async loadAvailableClients() {
      try {
        // Sempre recarregar clientes da API para garantir dados atualizados
        console.log(
          '🔄 Recarregando clientes da API para garantir dados atualizados...'
        )

        // Fallback: carregar via API como antes
        const apiClient = window.apiClient

        const response = await apiClient.request('/clients', {
          method: 'GET',
        })

        let allClients = response.data || []
        console.log(
          `🔍 [CLIENTS] Total de clientes recebidos da API: ${allClients.length}`
        )

        // Filtrar apenas clientes com CNPJ válido
        allClients = allClients.filter(client => client.cnpj)
        console.log(
          `🔍 [CLIENTS] Clientes com CNPJ válido: ${allClients.length}`
        )

        // IMPORTANTE: O backend já filtrou os clientes baseado no cli_access do usuário
        // Não é necessário filtrar novamente no frontend (evita problemas com cache desatualizado)
        console.log(
          `✅ [CLIENTS] Backend já filtrou os clientes - usando lista completa recebida`
        )

        this.clients = allClients

        // Atualizar cache global com dados mais recentes
        window.globalClientsCache = {
          clients: allClients,
          loadedAt: Date.now(),
        }
        console.log('🔄 Cache global atualizado com dados mais recentes')

        // Auto-selecionar cliente do XML se disponível
        this.tryAutoSelectClient()
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      }
    },

    tryAutoSelectClient() {
      // Recalcula a trava do zero a cada auto-seleção (novo XML pode invalidar trava anterior)
      this.storageLocked = false

      if (this.clients.length === 0) {
        console.log(
          '🔍 [AUTO-SELECT] Nenhum cliente disponível para auto-seleção'
        )
        return
      }

      console.log(
        `🔍 [AUTO-SELECT] Tentando auto-selecionar cliente. Total disponível: ${this.clients.length}`
      )

      // Primeiro, tentar selecionar baseado no CNPJ do XML
      if (this.nfeData.client_cnpj) {
        const normalizedXmlCnpj = this.nfeData.client_cnpj.replace(/[^\d]/g, '')
        console.log(
          `🔍 [AUTO-SELECT] Tentando match por CNPJ do XML: ${normalizedXmlCnpj}`
        )

        const matchingClient = this.clients.find(client => {
          if (!client.cnpj) return false
          const normalizedClientCnpj = client.cnpj.replace(/[^\d]/g, '')
          return normalizedClientCnpj === normalizedXmlCnpj
        })

        if (matchingClient) {
          this.selectedClient = matchingClient
          // Trava de seleção quando o estoque tem xml_cnpj_lock = '1'
          this.storageLocked =
            matchingClient.xml_cnpj_lock === '1' ||
            matchingClient.xml_cnpj_lock === 1
          if (this.storageLocked) {
            console.log(
              '🔒 [AUTO-SELECT] Estoque travado pelo CNPJ do destinatário (xml_cnpj_lock=1):',
              matchingClient.name
            )
          } else {
            console.log(
              '✅ [AUTO-SELECT] Cliente selecionado automaticamente pelo XML:',
              matchingClient.name,
              'Integration:',
              matchingClient.integration
            )
          }
          // Aplicar lógica de crossdocking quando cliente é auto-selecionado
          const crossdockingValue = matchingClient.crossdocking
          if (crossdockingValue === '2' || crossdockingValue === 2) {
            this.isCrossdock = true
          } else if (crossdockingValue !== '1' && crossdockingValue !== 1) {
            this.isCrossdock = false
          }
          return
        } else {
          console.log(
            '⚠️ [AUTO-SELECT] Cliente não encontrado na lista para CNPJ do XML:',
            this.nfeData.client_cnpj
          )
        }
      }

      // Se não conseguiu selecionar pelo XML e há apenas UM cliente disponível, selecionar automaticamente
      // (o backend já filtrou pelos clientes permitidos no cli_access)
      if (this.clients.length === 1) {
        this.selectedClient = this.clients[0]
        console.log(
          '✅ [AUTO-SELECT] Estoque selecionado automaticamente (único cliente disponível):',
          this.clients[0].name
        )
        // Aplicar lógica de crossdocking quando cliente é auto-selecionado
        const crossdockingValue = this.clients[0].crossdocking
        if (crossdockingValue === '2' || crossdockingValue === 2) {
          this.isCrossdock = true
        } else if (crossdockingValue !== '1' && crossdockingValue !== 1) {
          this.isCrossdock = false
        }
        return
      }

      console.log(
        'ℹ️ [AUTO-SELECT] Múltiplos clientes disponíveis - aguardando seleção manual do usuário'
      )
    },

    async loadAvailableClientsWithTimeout() {
      const timeout = new Promise(
        (_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000) // 20 segundos
      )

      try {
        await Promise.race([this.loadAvailableClients(), timeout])
      } catch (error) {
        console.warn('Timeout ou erro ao carregar clientes:', error.message)
        // Em caso de erro, mantém lista vazia e permite seleção manual posteriormente
        if (!this.clients || this.clients.length === 0) {
          console.log(
            'Lista de clientes não carregada - usuário poderá selecionar manualmente'
          )
        }
      }
    },

    async nextStep() {
      if (this.currentStep === 1 && this.canProceedToStep2) {
        this.currentStep = 2
      } else if (this.currentStep === 2 && this.canProceedToStep3) {
        // Verificar se cliente precisa configurar produtos
        if (this.clientRequiresProducts) {
          // Cliente integration=1 - precisa configurar produtos
          console.log(
            `🔍 [INTEGRATION LOG] nextStep() - Cliente requer produtos, indo para Step 3:`,
            {
              client: this.selectedClient.name,
              integration: this.selectedClient.integration,
            }
          )

          // Mostrar loading de pré-preenchimento
          this.loadingPrefill = true

          try {
            // Verificar produtos existentes antes de ir para o step 3
            if (this.products.length > 0 && this.selectedClient) {
              await this.checkExistingProducts()
            }

            // Avançar para o step 3
            this.currentStep = 3
          } catch (error) {
            console.error('Erro ao verificar produtos:', error)
            this.showError('Erro ao verificar produtos. Tente novamente.')
          } finally {
            // Esconder loading
            this.loadingPrefill = false
          }
        } else {
          // Cliente integration=0 - finalizar agendamento direto
          console.log(
            `🔍 [INTEGRATION LOG] nextStep() - Cliente NÃO requer produtos, finalizando direto:`,
            {
              client: this.selectedClient.name,
              integration: this.selectedClient.integration,
            }
          )

          await this.createSchedule()
        }
      }
    },

    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },

    updateProduct(product) {
      const index = this.products.findIndex(p => p.id === product.id)
      if (index !== -1) {
        // Update specific fields to maintain reactivity in Vue 3
        this.products[index] = { ...this.products[index], ...product }
      }
    },

    // Força a atualização da interface após mudanças nos produtos
    forceReactiveUpdate() {
      // Força o Vue a re-renderizar a lista de produtos
      this.products = [...this.products]
    },

    editProduct(product) {
      this.selectedProduct = product
      this.showProductEditModal = true
    },

    closeProductEditModal() {
      this.showProductEditModal = false
      this.selectedProduct = null
    },

    // Métodos para controle de checkbox dos produtos
    toggleProductSupplierData(product) {
      if (product.useSupplierData) {
        // Quando marcado, limpar os campos editáveis e usar dados do fornecedor
        product.client_code = ''
        product.client_description = ''
      } else {
        // Quando desmarcado, os campos ficam vazios para o usuário preencher
        // Não fazer nada, deixar os campos como estão
      }
      this.updateProduct(product)
      this.updateSelectAllState()
    },

    toggleAllProducts() {
      const newState = this.selectAllProducts
      this.products.forEach(product => {
        if (!product.isLocked) {
          // Não alterar produtos já bloqueados
          product.useSupplierData = newState
          if (newState) {
            // Limpar campos quando marcar para usar dados do fornecedor
            product.client_code = ''
            product.client_description = ''
          }
        }
      })
      this.forceReactiveUpdate()
    },

    invertProductSelection() {
      this.products.forEach(product => {
        if (!product.isLocked) {
          // Não alterar produtos já bloqueados
          product.useSupplierData = !product.useSupplierData
          if (product.useSupplierData) {
            // Limpar campos quando marcar para usar dados do fornecedor
            product.client_code = ''
            product.client_description = ''
          }
        }
      })
      this.updateSelectAllState()
      this.forceReactiveUpdate()
    },

    updateSelectAllState() {
      const unlockedProducts = this.products.filter(p => !p.isLocked)
      const selectedCount = unlockedProducts.filter(
        p => p.useSupplierData
      ).length

      if (selectedCount === 0) {
        this.selectAllProducts = false
      } else if (selectedCount === unlockedProducts.length) {
        this.selectAllProducts = true
      } else {
        // Estado intermediário - pode manter como false ou implementar estado indeterminado
        this.selectAllProducts = false
      }
    },

    async openClientSelectionModal() {
      // Trava de seleção pelo CNPJ do destinatário do XML — não abre o modal
      if (this.storageLocked) return

      this.showClientSelectionModal = true

      // Se não há clientes carregados ou lista está vazia, carregar agora
      if (!this.clients || this.clients.length === 0) {
        await this.loadClientsForModal()
      }
    },

    closeClientSelectionModal() {
      this.showClientSelectionModal = false
    },

    async selectClient(client) {
      this.selectedClient = client
      this.closeClientSelectionModal()

      // Aplicar lógica de crossdocking baseada no valor da coluna crossdocking do cliente
      const crossdockingValue = client.crossdocking
      if (crossdockingValue === '2' || crossdockingValue === 2) {
        // crossdocking = 2: Checkbox marcada e bloqueada
        this.isCrossdock = true
      } else if (crossdockingValue !== '1' && crossdockingValue !== 1) {
        // crossdocking diferente de 1 e 2: Resetar checkbox
        this.isCrossdock = false
      }
      // crossdocking = 1: Checkbox editável (mantém valor atual ou false)
    },

    async createSchedule() {
      console.log(`🔍 [INTEGRATION LOG] createSchedule() - STARTING:`, {
        currentStep: this.currentStep,
        canCreateSchedule: this.canCreateSchedule,
        client: this.selectedClient
          ? {
              name: this.selectedClient.name,
              cnpj: this.selectedClient.cnpj,
              integration: this.selectedClient.integration,
            }
          : null,
        clientRequiresProducts: this.clientRequiresProducts,
        productsCount: this.products.length,
        hasScheduledDate: !!this.scheduledDate,
        trigger:
          this.currentStep === 2 ? 'FROM_STEP_2_DIRECT' : 'FROM_STEP_3_NORMAL',
      })

      if (!this.canCreateSchedule) {
        console.log(
          `🔍 [INTEGRATION LOG] createSchedule() - BLOCKED: canCreateSchedule returned false`
        )
        return
      }

      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        this.showError('Usuário não autenticado. Faça login novamente.')
        return
      }

      if (
        currentUser.level_access === undefined ||
        currentUser.level_access < 0
      ) {
        this.showError('Usuário não autenticado. Faça login novamente.')
        return
      }

      this.loading = true
      this.errors = []

      const token = localStorage.getItem('token')
      if (!token) {
        this.showError(
          'Token de autenticação não encontrado. Faça login novamente.'
        )
        this.loading = false
        return
      }

      // VALIDAÇÃO: Verificar se a data do agendamento é válida (deve ser no mínimo amanhã)
      // Exceções:
      // - Previsões podem ter qualquer data
      // - Usuários com level_access !== 1 podem agendar para qualquer data
      const userLevel = currentUser?.level_access
      const requiresFutureDateValidation = userLevel === 1 // Apenas level 1 precisa validação

      if (
        this.scheduledDate &&
        !this.prevision &&
        requiresFutureDateValidation
      ) {
        // Parse manual da data para evitar problemas de timezone
        const [year, month, day] = this.scheduledDate.split('-').map(Number)
        const scheduleDate = new Date(year, month - 1, day) // month é 0-indexed

        // Calcular data mínima com todas as regras
        const now = new Date()
        const dayOfWeek = now.getDay() // 0=Dom, 6=Sáb
        const hour = now.getHours()

        const minDate = new Date(now)
        minDate.setHours(0, 0, 0, 0)
        minDate.setDate(minDate.getDate() + 1) // base: amanhã

        if (hour >= 17) {
          minDate.setDate(minDate.getDate() + 1) // após 17h bloqueia o dia seguinte
        }
        if ((dayOfWeek === 0 || dayOfWeek === 6) && minDate.getDay() === 1) {
          minDate.setDate(minDate.getDate() + 1) // final de semana bloqueia segunda
        }

        console.log('📅 Validação de data (level_access = 1):')
        console.log(
          '   Data do agendamento:',
          this.scheduledDate,
          '→',
          scheduleDate
        )
        console.log(
          '   Data mínima permitida:',
          minDate.toISOString().split('T')[0]
        )
        console.log('   Bloqueado:', scheduleDate < minDate)

        if (scheduleDate < minDate) {
          this.loading = false
          let motivo =
            'Os agendamentos devem ser feitos com antecedência mínima de 24 horas.'
          if (hour >= 17) {
            motivo = 'Após as 17h não é possível agendar para o próximo dia.'
          } else if (
            (dayOfWeek === 0 || dayOfWeek === 6) &&
            scheduleDate.getDay() === 1
          ) {
            motivo =
              'Não é possível agendar para segunda-feira durante o final de semana.'
          }
          this.showError(
            '⚠️ Data inválida!\n\n' +
              motivo +
              '\n\nPor favor, corrija a data e tente novamente.'
          )
          return
        }
      } else if (
        this.scheduledDate &&
        !this.prevision &&
        !requiresFutureDateValidation
      ) {
        console.log(
          `📅 Validação de data: Bypass para level_access !== 1 (level = ${userLevel})`
        )
      }

      if (!this.nfeData.nfe_key) {
        this.showError('Chave da NFe é obrigatória.')
        this.loading = false
        return
      }

      if (!this.selectedClient || !this.selectedClient.cnpj) {
        this.showError(
          'Estoque é obrigatório. Selecione um estoque para o agendamento.'
        )
        this.loading = false
        return
      }

      if (!this.nfeData.date) {
        this.showError('Data da NFe é obrigatória.')
        this.loading = false
        return
      }

      const clientCnpj = this.selectedClient.cnpj.replace(/[^\d]/g, '')
      if (clientCnpj.length !== 14) {
        this.showError(
          'CNPJ do estoque selecionado deve ter exatamente 14 dígitos.'
        )
        this.loading = false
        return
      }

      let supplier =
        this.nfeData.supplier_name || this.nfeData.supplier_cnpj || ''
      if (!supplier) {
        this.showError('Dados do fornecedor são obrigatórios.')
        this.loading = false
        return
      }

      if (supplier.length > 50) {
        supplier = supplier.substring(0, 50)
      }

      const nfeNumber = String(this.nfeData.number || '').trim()
      if (!nfeNumber || !/^\d{1,10}$/.test(nfeNumber)) {
        this.showError(
          'Número da NFe deve conter apenas dígitos e ter no máximo 10 caracteres.'
        )
        this.loading = false
        return
      }

      const formattedDate = this.scheduledDate

      if (!formattedDate) {
        this.showError(
          'Por favor, selecione a data desejada para entrega física.'
        )
        this.loading = false
        return
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        this.showError('Data de entrega deve estar no formato YYYY-MM-DD.')
        this.loading = false
        return
      }

      console.log('Data de agendamento para envio:', formattedDate)

      const scheduleData = {
        number: nfeNumber,
        nfe_key: this.nfeData.nfe_key,
        client: clientCnpj,
        case_count: parseInt(this.nfeData.case_count) || 0,
        date: formattedDate,
        prevision: this.isPrevision ? '1' : null, // Marca se é previsão
        crossdock: this.isCrossdock ? 1 : 0, // Marca se é crossdock (1 ou 0)
        status: 'Solicitado',
        supplier: supplier,
        qt_prod:
          parseInt(this.nfeData.qt_prod) ||
          (this.clientRequiresProducts
            ? this.products.length
            : (this.nfeData.products || []).length),
        info: this.buildInfoObject(),
        is_booking: 0, // Agendamento normal/efetivado (0 = normal)
      }

      // Adicionar histórico se for efetivação de marcação
      if (this.isEffectivatingBooking) {
        scheduleData.historic = this.buildHistoricObject()
      }

      console.log(
        `Enviando dados do ${this.isEffectivatingBooking ? 'efetivação' : 'agendamento'}:`,
        scheduleData
      )
      console.log(
        '🔍 is_booking no frontend:',
        scheduleData.is_booking,
        typeof scheduleData.is_booking
      )
      console.log('Token presente:', !!token)

      // DEBUG RASTREABILIDADE: Verificar produtos antes do envio
      if (
        scheduleData.info &&
        scheduleData.info.products &&
        scheduleData.info.products.length > 0
      ) {
        console.log(`📦 [RASTREABILIDADE] DADOS SENDO ENVIADOS AO BACKEND:`)
        console.log(
          `   Total de produtos: ${scheduleData.info.products.length}`
        )
        const firstProduct = scheduleData.info.products[0]
        console.log(`   Primeiro produto:`, {
          code: firstProduct.supplier_code || firstProduct.code,
          lote: firstProduct.lote || 'NÃO PRESENTE',
          validade: firstProduct.validade || 'NÃO PRESENTE',
          allKeys: Object.keys(firstProduct),
        })
        console.log(`   Produto completo:`, firstProduct)
      } else {
        console.log(
          `⚠️ [RASTREABILIDADE] scheduleData.info.products está vazio ou ausente`
        )
      }

      try {
        // Usar o apiClient global com cache
        const apiClient = window.apiClient

        let response
        if (this.isEffectivatingBooking) {
          // Efetivação: substituir o agendamento existente usando o mesmo ID
          response = await apiClient.request(
            `/schedules/${this.bookingToEffectivate.id}`,
            {
              method: 'PUT',
              data: scheduleData,
            }
          )
          console.log('Marcação efetivada com sucesso:', response)
          this.showSuccess('Marcação efetivada com sucesso!')
        } else {
          // Criação normal
          response = await apiClient.request('/schedules', {
            method: 'POST',
            data: scheduleData,
          })
          console.log('Agendamento criado com sucesso:', response)
          this.showSuccess('Agendamento criado com sucesso!')
        }

        this.$emit('created', response)

        setTimeout(() => {
          this.closeModal()
        }, 1500)
      } catch (error) {
        console.error('Erro ao criar agendamento:', error)
        console.error('Resposta da API:', error.response?.data)

        if (error.response?.status === 403) {
          this.showError(
            'Acesso negado. Usuário não possui permissão para criar agendamentos.'
          )
        } else if (error.response?.status === 401) {
          console.log('=== SCHEDULE CREATION MODAL: ERRO 401 ===')
          console.log('REMOVENDO REDIRECIONAMENTO AUTOMÁTICO')

          this.showError(
            'Sessão expirada. Tente fazer login novamente se necessário.'
          )

          // NÃO remover token nem redirecionar automaticamente
          // Apenas mostrar o erro e deixar o usuário decidir
        } else if (error.response?.status === 400) {
          const errorData = error.response?.data
          let errorMessage =
            errorData?.error || 'Dados inválidos enviados para a API.'

          if (errorData?.details && Array.isArray(errorData.details)) {
            const details = errorData.details
              .map(detail => {
                if (typeof detail === 'string') return detail
                if (detail.message) return detail.message
                if (detail.path)
                  return `Campo ${detail.path}: ${detail.message || 'inválido'}`
                return JSON.stringify(detail)
              })
              .join(', ')
            errorMessage += `. Detalhes: ${details}`
          }

          this.showError('Erro de validação: ' + errorMessage)
          console.error('Dados enviados que causaram erro:', scheduleData)
          console.error('Resposta completa da API:', errorData)
          console.error(
            'Detalhes do erro (expandido):',
            JSON.stringify(errorData.details, null, 2)
          )
        } else {
          this.showError(
            'Erro ao criar agendamento: ' +
              (error.message || 'Erro desconhecido')
          )
        }
      } finally {
        this.loading = false
      }
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },

    async validateClientAccess(clientCNPJ) {
      const currentUser = this.getCurrentUser()

      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      if (currentUser.level_access === 0) {
        return true
      }

      if (currentUser.cli_access && currentUser.cli_access[clientCNPJ]) {
        return true
      }

      throw new Error(
        `Usuário ${currentUser.user} não possui acesso ao cliente com CNPJ ${clientCNPJ}`
      )
    },

    showError(message) {
      this.errors.push(message)
    },

    showSuccess(message) {
      console.log('Sucesso:', message)
    },

    removeError(index) {
      this.errors.splice(index, 1)
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    handleModalClick(event) {
      event.stopPropagation()
    },

    handlePaste(event, currentProduct, fieldName) {
      event.preventDefault()

      const clipboardData = event.clipboardData || window.clipboardData
      const pastedText = clipboardData.getData('text')

      if (!pastedText) return

      // Separar por quebras de linha (linhas)
      const lines = pastedText.split(/\r?\n/).filter(line => line.trim() !== '')

      if (lines.length === 1) {
        // Uma única linha - separar por tabs (colunas)
        const columns = lines[0].split('\t').filter(col => col.trim() !== '')
        this.handleSingleRowPaste(currentProduct, fieldName, columns)
      } else {
        // Múltiplas linhas
        this.handleMultipleRowsPaste(currentProduct, fieldName, lines)
      }
    },

    handleSingleRowPaste(currentProduct, startField, columns) {
      const currentRowIndex = this.products.indexOf(currentProduct)
      if (currentRowIndex === -1) return

      // Mapear campos editáveis com suas posições na tabela
      const editableFields = [
        'client_code', // col 1
        'client_description', // col 3
        'ean_code', // col 8
      ]

      const startFieldIndex = editableFields.indexOf(startField)
      if (startFieldIndex === -1) return

      // Aplicar dados nas colunas seguintes
      for (
        let i = 0;
        i < columns.length && startFieldIndex + i < editableFields.length;
        i++
      ) {
        const fieldName = editableFields[startFieldIndex + i]
        const product = this.products[currentRowIndex]

        if (product && !product.isLocked) {
          product[fieldName] = columns[i].trim()
          this.updateProduct(product)
        }
      }

      // Navegar para o próximo input
      this.focusNextInput(currentRowIndex, startField, columns.length)
    },

    handleMultipleRowsPaste(currentProduct, fieldName, lines) {
      const currentRowIndex = this.products.indexOf(currentProduct)
      if (currentRowIndex === -1) return

      // Aplicar dados nas linhas seguintes
      for (
        let i = 0;
        i < lines.length && currentRowIndex + i < this.products.length;
        i++
      ) {
        const product = this.products[currentRowIndex + i]
        const lineData = lines[i].trim()

        if (product && !product.isLocked && lineData) {
          // Se a linha contém tabs, dividir em colunas
          const columns = lineData.split('\t').filter(col => col.trim() !== '')

          if (columns.length > 1) {
            // Múltiplas colunas - aplicar em sequência
            this.handleSingleRowPaste(product, fieldName, columns)
          } else {
            // Uma única coluna - aplicar apenas no campo atual
            product[fieldName] = lineData
            this.updateProduct(product)
          }
        }
      }

      // Navegar para o próximo input após a última linha processada
      const lastProcessedRow = Math.min(
        currentRowIndex + lines.length - 1,
        this.products.length - 1
      )
      this.focusNextInput(lastProcessedRow, fieldName, 1)
    },

    focusNextInput(currentRow, currentField, columnsProcessed = 1) {
      const editableFields = ['client_code', 'client_description', 'ean_code']
      const currentFieldIndex = editableFields.indexOf(currentField)

      if (currentFieldIndex === -1) return

      let nextRow = currentRow
      let nextFieldIndex = currentFieldIndex + columnsProcessed

      // Se ultrapassou as colunas da linha atual, vai para a próxima linha
      if (nextFieldIndex >= editableFields.length) {
        nextRow = currentRow + 1
        nextFieldIndex = 0 // Primeira coluna da próxima linha
      }

      // Verificar se existe a próxima linha
      if (nextRow >= this.products.length) {
        return // Não há mais linhas
      }

      const nextField = editableFields[nextFieldIndex]

      // Usar setTimeout para garantir que o DOM foi atualizado
      this.$nextTick(() => {
        const selector = `input[data-row="${nextRow}"][data-col="${this.getColumnNumber(nextField)}"]`
        const nextInput = document.querySelector(selector)

        if (nextInput && !nextInput.disabled) {
          nextInput.focus()
          nextInput.select()
        }
      })
    },

    getColumnNumber(fieldName) {
      const columnMap = {
        client_code: 1,
        client_description: 3,
        ean_code: 8,
      }
      return columnMap[fieldName] || 0
    },

    buildInfoObject() {
      const currentUser = this.getCurrentUser()

      if (this.isEffectivatingBooking) {
        // Para efetivação: construir info como agendamento normal, substituindo dados da marcação
        return {
          // Informações básicas da NFe (do XML)
          nfe_number: this.nfeData.number,
          nfe_key: this.nfeData.nfe_key,
          client_cnpj: this.nfeData.client_cnpj,
          client_name: this.nfeData.client_name,
          supplier_cnpj: this.nfeData.supplier_cnpj,
          supplier_name: this.nfeData.supplier_name,
          case_count: this.nfeData.case_count,
          date: this.nfeData.date,
          qt_prod: this.nfeData.qt_prod,

          // Produtos editados pelo usuário (aplicando lógica de dados do fornecedor)
          products: this.processProductsForSubmission(),

          // Metadados de criação (manter do agendamento efetivado)
          created_by:
            this.bookingToEffectivate?.created_by ||
            currentUser?.user ||
            'Sistema',
          created_at:
            this.bookingToEffectivate?.created_at || new Date().toISOString(),

          // Metadados de efetivação
          effectivated_by: currentUser?.user || 'Sistema',
          effectivated_at: new Date().toISOString(),
          original_booking_id: this.bookingToEffectivate?.id,

          // Tipo: não é mais booking após efetivação
          type: 'nfe_schedule',
        }
      } else {
        // Para criação normal: usar estrutura padrão
        return {
          ...this.nfeData,
          products: this.processProductsForSubmission(),
          created_by: currentUser?.user || 'Sistema',
          created_at: new Date().toISOString(),
          type: 'nfe_schedule',
        }
      }
    },

    processProductsForSubmission() {
      // Se cliente não exige produtos (integration=0), usar produtos originais da NFe
      if (!this.clientRequiresProducts) {
        const originalProducts = this.nfeData.products || []
        console.log(
          `🔍 [INTEGRATION LOG] processProductsForSubmission() - USING ORIGINAL NFe PRODUCTS:`,
          {
            client: this.selectedClient?.name,
            integration: this.selectedClient?.integration,
            originalProductsCount: originalProducts.length,
            configuredProductsCount: this.products.length,
            reason: 'Client with integration=0 uses supplier codes directly',
            originalProducts:
              originalProducts.length <= 3
                ? originalProducts
                : [
                    ...originalProducts.slice(0, 3),
                    `...and ${originalProducts.length - 3} more`,
                  ],
          }
        )

        // DEBUG RASTREABILIDADE: Verificar se lote e validade estão presentes
        if (originalProducts.length > 0) {
          console.log(
            `📦 [RASTREABILIDADE FRONTEND] Primeiro produto original:`,
            {
              code:
                originalProducts[0].supplier_code || originalProducts[0].code,
              lote: originalProducts[0].lote || 'NÃO PRESENTE',
              validade: originalProducts[0].validade || 'NÃO PRESENTE',
              fullProduct: originalProducts[0],
            }
          )
        }

        return originalProducts
      }

      // Cliente exige produtos (integration=1) - usar produtos configurados pelo usuário
      const processedProducts = this.products.map(product => {
        const processedProduct = { ...product }

        // Se o produto está marcado para usar dados do fornecedor
        if (product.useSupplierData) {
          processedProduct.client_code = product.supplier_code
          processedProduct.client_description = product.supplier_description
        }

        // Remover propriedades de controle que não devem ir para a API
        delete processedProduct.useSupplierData

        return processedProduct
      })

      // DEBUG RASTREABILIDADE: Verificar se lote e validade estão presentes
      if (processedProducts.length > 0) {
        console.log(
          `📦 [RASTREABILIDADE FRONTEND] Primeiro produto processado:`,
          {
            code:
              processedProducts[0].supplier_code || processedProducts[0].code,
            lote: processedProducts[0].lote || 'NÃO PRESENTE',
            validade: processedProducts[0].validade || 'NÃO PRESENTE',
            fullProduct: processedProducts[0],
          }
        )
      }

      return processedProducts
    },

    buildHistoricObject() {
      const currentUser = this.getCurrentUser()
      const now = new Date().toISOString()

      // Preservar histórico existente da marcação
      let existingHistoric = {}
      if (this.bookingToEffectivate?.historic) {
        try {
          existingHistoric =
            typeof this.bookingToEffectivate.historic === 'string'
              ? JSON.parse(this.bookingToEffectivate.historic)
              : this.bookingToEffectivate.historic
        } catch (error) {
          console.warn('Erro ao parsear histórico existente:', error)
          existingHistoric = {}
        }
      }

      // Adicionar nova entrada de efetivação ao histórico existente
      return {
        ...existingHistoric,
        [`effectivated_${Date.now()}`]: {
          timestamp: now,
          user: currentUser?.user || 'Sistema',
          action: 'Marcação efetivada para agendamento completo',
          comment: `Marcação convertida em agendamento completo com NFe ${this.nfeData.number}. XML processado com ${this.products.length} produtos.`,
          details: {
            original_booking_id: this.bookingToEffectivate?.id,
            nfe_key: this.nfeData.nfe_key,
            nfe_number: this.nfeData.number,
            supplier: this.nfeData.supplier_name,
            products_count: this.products.length,
            status_changed_from:
              this.bookingToEffectivate?.status || 'Solicitado',
            status_changed_to: 'Solicitado',
            xml_processed: true,
            effectivated_at: now,
          },
        },
      }
    },
  },
}
</script>

<style scoped>
.estoque-lista-vertical {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 8px;
}
.estoque-lista-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  transition: background 0.15s;
}
.estoque-lista-item:last-child {
  border-bottom: none;
}
.estoque-lista-item:hover {
  background: #f1f5fa;
}
.estoque-lista-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.estoque-nome {
  font-weight: 600;
  color: #1e3a8a;
  font-size: 1.05rem;
}
.estoque-cnpj {
  font-family: 'Fira Mono', monospace;
  color: #2563eb;
  font-size: 0.97rem;
}
.estoque-numero {
  color: #666;
  font-size: 0.95rem;
}
.btn-selecionar-estoque {
  margin-left: 16px;
  padding: 4px 16px;
  font-size: 0.97rem;
  border-radius: 6px;
}
.estoque-lista-vazia {
  padding: 18px 0;
  text-align: center;
  color: #888;
}
.estoque-data-container {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0 0 0;
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: stretch;
  justify-content: space-between;
}

.client-selection,
.delivery-date-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 200px;
  position: relative;
  padding: 1rem 0;
}

/* Títulos centralizados */
.client-selection h5,
.delivery-date-selection h5 {
  margin: 0 0 1.5rem 0;
  padding: 0;
  border: none !important;
  background: transparent !important;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

/* Estilos de container removidos - usando estrutura HTML existente */

.delivery-date-selection {
  padding-left: 2rem;
}

/* Remover todas as bordas e linhas das seções de estoque e data */
.client-selection,
.client-selection *,
.client-selection *::before,
.client-selection *::after,
.delivery-date-selection,
.delivery-date-selection *,
.delivery-date-selection *::before,
.delivery-date-selection *::after {
  border-top: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

.client-selection::before,
.client-selection::after {
  content: none !important;
  display: none !important;
}

/* Remover definições antigas dos títulos conflitantes */
.selected-client-info {
  background: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  justify-content: center;
  flex: 1;
}

/* Estilo moderno para o botão alterar estoque */
.selected-client-info .btn-alterar-estoque {
  margin-top: 0.8rem !important;
  margin-bottom: 0 !important;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 20px;
  background: #f3f4f6 !important;
  border: 1px solid #d1d5db !important;
  color: #6b7280 !important;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
}

.selected-client-info .btn-alterar-estoque:hover {
  background: #e5e7eb !important;
  border-color: #9ca3af !important;
  color: #374151 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-client-info .btn-alterar-estoque:active {
  transform: translateY(0);
}

.selected-client-info .btn-alterar-estoque i {
  font-size: 0.75rem;
  margin-right: 4px;
}
/* Estilos removidos - agora definidos na seção principal do .info-item para o grid de NFe */
.date-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  text-align: center;
  justify-content: center;
  flex: 1;
  padding: 0;
}

/* Padronizar tamanhos de texto da seção de data */
.date-input-container label {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.date-input-container .help-text {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.date-input-container input[type='date'] {
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  background: white;
  width: 100%;
  max-width: 200px;
}

.date-input-container input[type='date']:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Prevision Checkbox Styles */
.date-input-container .prevision-checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.date-input-container .prevision-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  margin: 0;
}

.date-input-container .prevision-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #2563eb;
  transition: all 0.3s ease;
}

.date-input-container .prevision-label-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.date-input-container .prevision-checkbox:checked + .prevision-label-text {
  opacity: 1;
  font-weight: 600;
  color: #2563eb;
}

.date-input-container .prevision-checkbox-label:hover {
  background: rgba(37, 99, 235, 0.05);
  border-radius: 4px;
  padding: 0.25rem;
  margin: -0.25rem;
}

.date-input-container .prevision-checkbox-label:hover .prevision-label-text {
  opacity: 0.85;
}

.date-input-container .prevision-checkbox:checked {
  transform: scale(1.15);
}

/* Container quando não há cliente selecionado */
.client-selection > div:not(.selected-client-info) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.5rem;
}

/* Botão selecionar estoque quando não há cliente */
.client-selection .btn-primary {
  margin: 0;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  border-radius: 6px;
}

.client-selection .text-muted {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}
.mt-3 {
  margin-top: 18px;
}
.btn-alterar-estoque {
  height: 38px;
  min-width: 90px;
  max-width: 140px;
  padding: 0 14px;
  font-size: 0.97rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.date-input-container input[type='date'] {
  max-width: 180px;
  min-width: 120px;
  height: 36px;
  font-size: 1rem;
  padding: 2px 8px;
}

/* Header da seção de produtos */
.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.products-header h4 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.products-hint {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-style: italic;
}

.products-hint i {
  color: #3b82f6;
  font-size: 0.7rem;
}

/* Estilo específico para o modal-body do passo 3 */
.products-modal-body {
  max-width: 100%;
  overflow: visible;
  padding: 1.5rem;
}

/* Em telas pequenas, empilhar o header */
@media (max-width: 768px) {
  .products-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .products-hint {
    font-size: 0.75rem;
  }

  /* Ajustar padding em telas pequenas */
  .products-modal-body {
    padding: 1rem;
  }
}

/* Estilos para otimizar a tabela de produtos */
.products-table-container {
  width: 100%;
  overflow-x: auto; /* Permitir scroll horizontal */
  overflow-y: auto; /* Permitir scroll vertical se necessário */
  margin-top: 1rem;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  /* Melhorar a aparência do scroll */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  background: white;
}

/* Personalizar scrollbar para navegadores WebKit (Chrome, Safari, Edge) */
.products-table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.products-table-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 4px;
}

.products-table-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.products-table-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.products-table {
  width: 100%;
  min-width: 1000px; /* Largura mínima para evitar compressão excessiva */
  border-collapse: collapse;
  font-size: 0.85rem;
  table-layout: fixed;
  /* Forçar estrutura consistente da tabela */
  border-spacing: 0;
  /* Reset completo para evitar interferência de CSS externo */
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Reset específico para células da tabela */
.products-table * {
  box-sizing: border-box;
}

.products-table th,
.products-table td {
  border: 1px solid #ddd;
  padding: 8px 6px;
  text-align: left;
  vertical-align: top;
}

.products-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  font-size: 0.8rem;
}

/* Definir larguras específicas para cada coluna */
/* Larguras das colunas são definidas abaixo com a nova estrutura que inclui checkbox */

/* Estilo para células de descrição expansível */
.description-cell {
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 200px;
  line-height: 1.3;
}

/* Inputs menores para economizar espaço */
.products-table .form-control-sm {
  font-size: 0.8rem;
  padding: 2px 4px;
  height: auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 3px;
}

/* Ajustar colunas de valores monetários */
.products-table td:nth-child(7),
.products-table td:nth-child(8) {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

/* Loading state for clients modal */
.loading-clients-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 150px;
}

.loading-spinner {
  margin-bottom: 16px;
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--primary, #3b82f6);
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.loading-subtext {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  font-style: italic;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Improved empty state styling */
.estoque-lista-vazia {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
}

.estoque-lista-vazia i {
  color: #9ca3af;
  font-size: 1rem;
}

/* Layout dos cards de informações da NFe - 2 linhas com 4 cards cada */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  min-height: 80px;
  text-align: center;
}

.info-item label {
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.info-item span {
  color: #1e293b;
  font-weight: 500;
  font-size: 0.95rem;
  word-break: break-word;
}

/* Responsivo para telas menores */
@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }

  .info-item label {
    text-transform: none;
  }
}

/* Estilos específicos para info-item dentro da seção de cliente selecionado */
.selected-client-info .info-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 0;
  min-height: auto;
}

.selected-client-info .info-item label {
  font-weight: 500;
  color: #2563eb;
  margin-right: 4px;
  font-size: 0.95rem;
  text-transform: none;
  letter-spacing: normal;
}

.selected-client-info .info-item span {
  color: #1f2937;
  font-weight: 500;
  font-size: 0.95rem;
}

/* Responsividade para estoque-data-container */
@media (max-width: 768px) {
  .estoque-data-container {
    flex-direction: column;
    gap: 1.5rem;
  }

  .delivery-date-selection {
    padding-left: 0;
    padding-top: 1.5rem;
  }

  .client-selection,
  .delivery-date-selection {
    min-height: auto;
  }
}

/* Estilos para campos bloqueados/pré-preenchidos */
.products-table .form-control-sm:disabled,
.products-table .form-control-sm.locked-field {
  background-color: #e8f5e8 !important; /* Verde bem claro */
  border: 2px solid #c3e6c3 !important; /* Verde claro */
  color: #2d5a2d !important; /* Verde escuro */
  cursor: not-allowed !important;
}

.products-table .form-control-sm:disabled:focus,
.products-table .form-control-sm.locked-field:focus {
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25) !important; /* Verde com transparência */
}

/* Indicador visual para linha de produto bloqueado */
.products-table tr.product-locked {
  background-color: #f0fff0 !important; /* Verde claro */
  border-left: 4px solid #28a745 !important; /* Verde escuro */
}

/* Ícone de bloqueio para produtos pré-preenchidos */
.product-lock-icon {
  color: #28a745; /* Verde para combinar com o tema */
  font-size: 14px;
  margin-left: 4px;
  title: 'Produto já cadastrado - campos bloqueados';
}

/* Estilo para produtos que usam dados do fornecedor */
.products-table tr.product-use-supplier {
  background-color: #e6f3ff !important; /* Azul claro */
  border-left: 4px solid #007bff !important; /* Azul */
}

/* Inputs dos produtos que usam dados do fornecedor ficam com a mesma cor de fundo */
.products-table tr.product-use-supplier input.form-control-sm {
  background-color: #e6f3ff !important; /* Mesmo azul claro da linha */
  border-color: #b8daff !important; /* Borda azul mais suave */
  color: #495057 !important; /* Texto padrão */
}

.products-table tr.product-use-supplier input.form-control-sm:focus {
  background-color: #e6f3ff !important; /* Mantém o azul mesmo em foco */
  border-color: #007bff !important; /* Borda azul mais forte no foco */
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
}

/* Controles de checkbox dos produtos */
.products-controls {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  position: relative;
}

.checkbox-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkbox-controls .products-hint {
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

.master-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.master-checkbox input[type='checkbox'] {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.invert-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 4px;
  border: 1px solid #6c757d;
  background-color: transparent;
  color: #6c757d;
  transition: all 0.2s ease;
}

.invert-btn:hover {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}

/* Checkbox individual dos produtos */
.checkbox-cell {
  text-align: center;
  vertical-align: middle;
}

.product-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-checkbox input[type='checkbox'] {
  display: none;
}

.checkmark-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid #007bff;
  border-radius: 3px;
  background-color: #fff;
  transition: all 0.2s ease;
}

.product-checkbox input[type='checkbox']:checked + .checkmark-small {
  background-color: #007bff;
  border-color: #007bff;
}

.product-checkbox input[type='checkbox']:checked + .checkmark-small::after {
  content: '✓';
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.product-checkbox input[type='checkbox']:disabled + .checkmark-small {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Atualizar larguras das colunas para acomodar o checkbox */
.products-table th:nth-child(1),
.products-table td:nth-child(1) {
  width: 5%;
  min-width: 50px;
} /* Checkbox */

.products-table th:nth-child(2),
.products-table td:nth-child(2) {
  width: 12%;
  min-width: 80px;
} /* Cód. Forn. */

.products-table th:nth-child(3),
.products-table td:nth-child(3) {
  width: 12%;
  min-width: 80px;
} /* Cód. Venda */

.products-table th:nth-child(4),
.products-table td:nth-child(4) {
  width: 24%;
  min-width: 150px;
} /* Descrição Fornecedor */

.products-table th:nth-child(5),
.products-table td:nth-child(5) {
  width: 19%;
  min-width: 120px;
} /* Descrição Venda */

.products-table th:nth-child(6),
.products-table td:nth-child(6) {
  width: 8%;
  min-width: 60px;
} /* Quant. */

.products-table th:nth-child(7),
.products-table td:nth-child(7) {
  width: 7%;
  min-width: 50px;
} /* Fator */

.products-table th:nth-child(8),
.products-table td:nth-child(8) {
  width: 7%;
  min-width: 70px;
} /* Valor Un. */

.products-table th:nth-child(9),
.products-table td:nth-child(9) {
  width: 7%;
  min-width: 70px;
} /* Valor Total */

.products-table th:nth-child(10),
.products-table td:nth-child(10) {
  width: 9%;
  min-width: 80px;
} /* Código EAN */

/* Tela de carregamento do pré-preenchimento */
.prefill-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  min-height: 300px;
  background: linear-gradient(135deg, #f8fdff 0%, #f0fff4 100%);
  border-radius: 12px;
  margin: 20px;
}

.prefill-spinner {
  margin-bottom: 24px;
}

.prefill-spinner i {
  font-size: 3rem;
  color: #28a745;
  animation: prefill-spin 2s linear infinite;
}

.prefill-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #155724;
  margin: 0 0 12px 0;
}

.prefill-message {
  font-size: 1rem;
  color: #6c757d;
  margin: 0 0 24px 0;
  max-width: 400px;
  line-height: 1.5;
}

.prefill-progress {
  margin-bottom: 20px;
}

.prefill-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.prefill-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #28a745;
  animation: prefill-bounce 1.4s ease-in-out infinite both;
}

.prefill-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.prefill-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.prefill-dots span:nth-child(3) {
  animation-delay: 0s;
}

.prefill-help {
  font-size: 0.9rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 6px;
}

.prefill-help i {
  color: #17a2b8;
}

/* Animações */
@keyframes prefill-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes prefill-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
